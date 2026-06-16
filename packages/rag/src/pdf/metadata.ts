import { getDocument } from "pdfjs-dist";

import type { PdfInfoMetadata, PdfMetadataResult, PdfPageDimension, PdfTocEntry } from "./metadata/types";
import { normalizePdfDate } from "./metadata/types";
import { extractXmpFields } from "./metadata/xmp";
import { createLogger } from "@repo/logger";

const logger = createLogger("rag/pdf/metadata");

export type { PdfMetadataResult, PdfInfoMetadata, PdfTocEntry, PdfPageDimension } from "./metadata/types";

interface SafeOutlineNode {
  title: string;
  dest: unknown;
  items: SafeOutlineNode[];
}

export async function extractMetadata(pdfBuffer: Uint8Array): Promise<PdfMetadataResult> {
  logger.info({ fileSize: pdfBuffer.length }, "Starting PDF metadata extraction");

  const loadingTask = getDocument({ data: pdfBuffer });
  const pdf = await loadingTask.promise;

  const pageCount = pdf.numPages;

  try {
    const meta = await pdf.getMetadata();
    const info = meta.info as Record<string, unknown>;
    const metadataObj = meta.metadata as { getRaw?: () => string } | undefined;
    const rawXmp = typeof metadataObj?.getRaw === "function" ? metadataObj.getRaw() : null;

    const xmpFields = extractXmpFields(rawXmp);
    const infoDict = extractInfoDict(info);

    const pdfVersion = typeof info.PDFFormatVersion === "string" ? info.PDFFormatVersion : null;

    const pageDimensions = await extractPageDimensions(pdf, pageCount);

    const outlineRaw = await pdf.getOutline();
    const safeOutline = toSafeOutline(outlineRaw);
    const toc = await mapOutlineToToc(safeOutline, pdf);

    const language = xmpFields?.language ?? infoDict.keywords ?? null;

    const result: PdfMetadataResult = {
      info: xmpFields
        ? {
            title: xmpFields.title ?? infoDict.title,
            author: xmpFields.author ?? infoDict.author,
            subject: xmpFields.subject ?? infoDict.subject,
            keywords: xmpFields.keywords ?? infoDict.keywords,
            creator: infoDict.creator,
            producer: infoDict.producer,
            creationDate: xmpFields.creationDate ?? infoDict.creationDate,
            modDate: xmpFields.modDate ?? infoDict.modDate,
          }
        : infoDict,
      pdfVersion,
      pageCount,
      pageDimensions,
      toc,
      language,
    };

    logger.info(
      { pageCount, title: result.info.title, pdfVersion },
      "PDF metadata extraction completed",
    );

    return result;
  } finally {
    void loadingTask.destroy();
  }
}

function extractInfoDict(raw: Record<string, unknown>): PdfInfoMetadata {
  return {
    title: stringOrNull(raw.Title),
    author: stringOrNull(raw.Author),
    subject: stringOrNull(raw.Subject),
    keywords: stringOrNull(raw.Keywords),
    creator: stringOrNull(raw.Creator),
    producer: stringOrNull(raw.Producer),
    creationDate: normalizePdfDate(stringOrNull(raw.CreationDate)),
    modDate: normalizePdfDate(stringOrNull(raw.ModDate)),
  };
}

function stringOrNull(val: unknown): string | null {
  if (typeof val === "string" && val.length > 0) return val;
  return null;
}

async function extractPageDimensions(
  pdf: { getPage: (n: number) => Promise<{ getViewport: (opts: { scale: number }) => { width: number; height: number } }> },
  pageCount: number,
): Promise<PdfPageDimension[]> {
  const dimensions: PdfPageDimension[] = [];

  for (let i = 1; i <= pageCount; i++) {
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale: 1 });
    dimensions.push({
      pageNumber: i,
      width: viewport.width,
      height: viewport.height,
    });
  }

  return dimensions;
}

function toSafeOutline(raw: Record<string, unknown>[] | null): SafeOutlineNode[] {
  if (!raw) return [];
  return raw.map(safeOutlineNode);
}

function safeOutlineNode(raw: Record<string, unknown>): SafeOutlineNode {
  const rawItems = raw.items;
  const children = Array.isArray(rawItems)
    ? rawItems.map((item) => safeOutlineNode(item as Record<string, unknown>))
    : [];

  return {
    title: typeof raw.title === "string" ? raw.title : "",
    dest: raw.dest,
    items: children,
  };
}

async function mapOutlineToToc(
  outline: SafeOutlineNode[],
  pdf: { getPageIndex: (ref: { num: number; gen: number }) => Promise<number>; getDestination: (name: string) => Promise<unknown> },
): Promise<PdfTocEntry[]> {
  if (outline.length === 0) return [];

  const entries: PdfTocEntry[] = [];
  for (const item of outline) {
    const entry = await mapOutlineItem(item, pdf);
    if (entry) entries.push(entry);
  }
  return entries;
}

async function mapOutlineItem(
  item: SafeOutlineNode,
  pdf: { getPageIndex: (ref: { num: number; gen: number }) => Promise<number>; getDestination: (name: string) => Promise<unknown> },
): Promise<PdfTocEntry | null> {
  if (!item.title) return null;

  const page = await resolveDestPage(item.dest, pdf);

  let children: PdfTocEntry[] | undefined;
  if (item.items.length > 0) {
    const childEntries: PdfTocEntry[] = [];
    for (const child of item.items) {
      const childEntry = await mapOutlineItem(child, pdf);
      if (childEntry) childEntries.push(childEntry);
    }
    if (childEntries.length > 0) children = childEntries;
  }

  return { title: item.title, page, children };
}

async function resolveDestPage(
  dest: unknown,
  pdf: { getPageIndex: (ref: { num: number; gen: number }) => Promise<number>; getDestination: (name: string) => Promise<unknown> },
): Promise<number> {
  if (isNonEmptyArray(dest)) {
    const first = dest[0];
    if (isPageRef(first)) {
      try {
        const pageIndex = await pdf.getPageIndex(first);
        return pageIndex + 1;
      } catch {
        return 0;
      }
    }
  }

  if (typeof dest === "string") {
    try {
      const destArr = await pdf.getDestination(dest);
      if (isNonEmptyArray(destArr)) {
        const first = destArr[0];
        if (isPageRef(first)) {
          const pageIndex = await pdf.getPageIndex(first);
          return pageIndex + 1;
        }
      }
    } catch {
      return 0;
    }
  }

  return 0;
}

function isNonEmptyArray(val: unknown): val is [unknown, ...unknown[]] {
  return Array.isArray(val) && val.length > 0;
}

function isPageRef(val: unknown): val is { num: number; gen: number } {
  return (
    typeof val === "object" &&
    val !== null &&
    "num" in val &&
    typeof (val as Record<string, unknown>).num === "number" &&
    "gen" in val &&
    typeof (val as Record<string, unknown>).gen === "number"
  );
}
