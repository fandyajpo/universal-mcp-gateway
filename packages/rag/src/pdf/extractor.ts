import { extractWithPdfJs } from "./extractor/pdfjs";
import {
  calculateConfidenceScore,
  calculateTextLength,
  detectLanguage,
  extractAllText,
  isScannedDocument,
} from "./extractor/utils";
import { extractMetadata } from "./metadata";
import { extractTables } from "./tables";
import type { ExtractTablesResult, PdfTable } from "./tables/types";
import type { PdfExtractionMetadata, PdfExtractionResult } from "./types";
import { DocumentModel } from "@repo/database";
import { createLogger } from "@repo/logger";

const logger = createLogger("rag/pdf/extractor");

export interface ExtractTextOptions {
  documentId: string;
  workspaceId: string;
  fileKey: string;
  userId: string;
}

export async function extractText(
  buffer: Uint8Array,
  options: ExtractTextOptions,
): Promise<PdfExtractionResult> {
  const { documentId, workspaceId } = options;

  logger.info({ documentId, workspaceId, fileSize: buffer.length }, "Starting PDF text extraction");

  const { pages } = await extractWithPdfJs(buffer);

  if (pages.length === 0) {
    logger.warn({ documentId, workspaceId }, "No pages extracted from PDF");
    throw new Error("PDF contains no extractable pages");
  }

  const nativeCharCount = calculateTextLength(pages);
  const pageCount = pages.length;
  const scanned = isScannedDocument(pages, pageCount);

  const pdfMetadata = await extractMetadata(buffer);

  if (scanned) {
    logger.info({ documentId, workspaceId, pageCount }, "Native extraction insufficient — running OCR fallback");

    const { runOcr } = await import("./ocr");

    const result = await runOcr(buffer, {
      language: detectLanguage(extractAllText(pages)) ?? "eng",
    });

    const allText = extractAllText(result.pages);
    const tableResult = await extractTables(result.pages, { pdfBuffer: buffer, enableCamelot: false });
    await writeExtractionToDatabase(documentId, workspaceId, result, allText, pdfMetadata, tableResult);

    return result;
  }

  const charCount = nativeCharCount;
  const allText = extractAllText(pages);
  const language = detectLanguage(allText);
  const confidenceScore = calculateConfidenceScore(pages, charCount);

  const metadata: PdfExtractionMetadata = {
    charCount,
    pageCount,
    extractionMethod: "native",
    confidenceScore,
    language,
  };

  logger.info(
    { documentId, workspaceId, charCount, pageCount, scanned: false, method: "native" },
    "PDF text extraction completed",
  );

  const result: PdfExtractionResult = {
    pages,
    metadata,
  };

  const tableResult = await extractTables(pages, { pdfBuffer: buffer, enableCamelot: false });
  await writeExtractionToDatabase(documentId, workspaceId, result, allText, pdfMetadata, tableResult);

  return result;
}

async function writeExtractionToDatabase(
  documentId: string,
  workspaceId: string,
  result: PdfExtractionResult,
  allText: string,
  pdfMetadata: import("./metadata/types").PdfMetadataResult,
  tableResult?: ExtractTablesResult,
): Promise<void> {
  try {
    const update: Record<string, unknown> = {
      processedContent: {
        text: allText,
        pages: result.pages,
      },
      extractionMetadata: {
        charCount: result.metadata.charCount,
        pageCount: result.metadata.pageCount,
        extractionMethod: result.metadata.extractionMethod,
        confidenceScore: result.metadata.confidenceScore,
        language: result.metadata.language,
        extractedAt: new Date(),
      },
      pdfMetadata: {
        info: pdfMetadata.info,
        pdfVersion: pdfMetadata.pdfVersion,
        pageDimensions: pdfMetadata.pageDimensions,
        toc: pdfMetadata.toc,
        language: pdfMetadata.language,
      },
      pageCount: result.metadata.pageCount,
    };

    if (pdfMetadata.info.title) {
      update.title = pdfMetadata.info.title;
    }

    if (tableResult) {
      update.tables = serializeTables(tableResult.tables);
      update.lowConfidenceTables = serializeTables(tableResult.lowConfidenceTables);
    }

    await DocumentModel.updateOne(
      { _id: documentId, tenantId: workspaceId },
      { $set: update },
    );

    logger.info({ documentId, workspaceId }, "Extraction result written to database");
  } catch (error) {
    logger.error({ error, documentId, workspaceId }, "Failed to write extraction to database");
    throw error;
  }
}

function serializeTables(tables: PdfTable[]): Record<string, unknown>[] {
  return tables.map((t) => ({
    id: t.id,
    pageNumber: t.pageNumber,
    pageCount: t.pageCount,
    bbox: t.bbox,
    caption: t.caption,
    headers: t.headers,
    rows: t.rows.map((r) => ({
      cells: r.cells.map((c) => ({
        text: c.text,
        rowspan: c.rowspan,
        colspan: c.colspan,
        isHeader: c.isHeader,
        bold: c.bold,
        italic: c.italic,
        numeric: c.numeric,
        confidence: c.confidence,
      })),
    })),
    columnCount: t.columnCount,
    rowCount: t.rowCount,
    confidence: t.confidence,
    detectionMethod: t.detectionMethod,
    formats: t.formats,
  }));
}
