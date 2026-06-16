import { getDocument } from "pdfjs-dist";

import type { PdfBoundingBox, PdfExtractedBlock, PdfExtractedLine, PdfExtractedPage, PdfFontInfo } from "../types";

const LINE_TOLERANCE_RATIO = 0.3;
const BLOCK_GAP_RATIO = 1.5;

interface RawTextItem {
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fontName: string;
  fontSize: number;
}

interface SafeTextItem {
  str: string;
  transform: number[];
  width: number;
  height: number;
  fontName: string;
}

interface SafeStyleEntry {
  fontFamily: string;
  ascent: number;
  descent: number;
}

function toSafeNumber(val: unknown, fallback: number): number {
  return typeof val === "number" ? val : fallback;
}

function toSafeString(val: unknown, fallback: string): string {
  return typeof val === "string" ? val : fallback;
}

function safeTransform(val: unknown): number[] {
  if (!Array.isArray(val)) return [0, 0, 0, 0, 0, 0];
  const result: number[] = [];
  for (const element of val) {
    result.push(toSafeNumber(element, 0));
  }
  return result;
}

function extractTextItems(items: unknown[]): SafeTextItem[] {
  const result: SafeTextItem[] = [];
  for (const item of items) {
    const obj = item as Record<string, unknown>;
    const str = toSafeString(obj.str, "");
    if (str.length === 0) continue;

    result.push({
      str,
      transform: safeTransform(obj.transform),
      width: toSafeNumber(obj.width, 0),
      height: toSafeNumber(obj.height, 0),
      fontName: toSafeString(obj.fontName, ""),
    });
  }
  return result;
}

function extractStyles(styles: Record<string, unknown>): Record<string, SafeStyleEntry> {
  const result: Record<string, SafeStyleEntry> = {};
  for (const key of Object.keys(styles)) {
    const style = styles[key] as Record<string, unknown>;
    result[key] = {
      fontFamily: toSafeString(style.fontFamily, key),
      ascent: toSafeNumber(style.ascent, 0),
      descent: toSafeNumber(style.descent, 0),
    };
  }
  return result;
}

function extractRawItems(textItems: SafeTextItem[], styles: Record<string, SafeStyleEntry>): RawTextItem[] {
  return textItems.map((item) => {
    const style = styles[item.fontName];
    const fontSize = Math.abs(item.transform[3] ?? 0) || Math.abs(item.height) || 12;
    const fontHeight = style
      ? Math.abs(style.ascent - style.descent) * fontSize
      : Math.abs(item.height) || fontSize;

    return {
      text: item.str,
      x: item.transform[4] ?? 0,
      y: item.transform[5] ?? 0,
      width: item.width,
      height: fontHeight,
      fontName: style ? style.fontFamily : item.fontName,
      fontSize,
    };
  });
}

function groupIntoLines(items: RawTextItem[]): RawTextItem[][] {
  if (items.length === 0) return [];

  const sorted = [...items].sort((a, b) => {
    const dy = a.y - b.y;
    if (Math.abs(dy) > 2) return dy;
    return a.x - b.x;
  });

  const lines: RawTextItem[][] = [];
  const firstItem = sorted[0];
  if (!firstItem) return [];

  let currentLine: RawTextItem[] = [firstItem];

  for (let i = 1; i < sorted.length; i++) {
    const prev = sorted[i - 1];
    const curr = sorted[i];
    if (!prev || !curr) continue;

    const lineHeight = Math.max(prev.height, curr.height, 1);
    const gap = Math.abs(curr.y - prev.y);

    if (gap > lineHeight * LINE_TOLERANCE_RATIO) {
      lines.push(currentLine);
      currentLine = [];
    }
    currentLine.push(curr);
  }
  lines.push(currentLine);

  return lines;
}

function groupLinesIntoBlocks(lines: RawTextItem[][]): RawTextItem[][][] {
  if (lines.length === 0) return [];

  const lineHeights: number[] = [];
  for (const line of lines) {
    let maxH = 1;
    for (const item of line) {
      if (item.height > maxH) maxH = item.height;
    }
    lineHeights.push(maxH);
  }

  const sum = lineHeights.reduce((total, h) => total + h, 0);
  const avgLineHeight = sum / lineHeights.length;

  const firstLine = lines[0];
  if (!firstLine) return [];

  const blocks: RawTextItem[][][] = [];
  let currentBlock: RawTextItem[][] = [firstLine];

  for (let i = 1; i < lines.length; i++) {
    const prevLine = lines[i - 1];
    const currLine = lines[i];
    if (!prevLine || !currLine) continue;

    const prevLineItems = prevLine;
    const currLineItems = currLine;

    let prevBottom = 0;
    for (const item of prevLineItems) {
      const bottom = item.y + item.height;
      if (bottom > prevBottom) prevBottom = bottom;
    }

    let currTop = Infinity;
    for (const item of currLineItems) {
      if (item.y < currTop) currTop = item.y;
    }

    const gap = currTop - prevBottom;

    if (gap > avgLineHeight * BLOCK_GAP_RATIO) {
      blocks.push(currentBlock);
      currentBlock = [];
    }
    currentBlock.push(currLine);
  }
  blocks.push(currentBlock);

  return blocks;
}

function lineToExtractedLine(items: RawTextItem[]): PdfExtractedLine {
  const text = items.map((item) => item.text).join("");

  let x0 = Infinity;
  let y0 = Infinity;
  let x1 = -Infinity;
  let y1 = -Infinity;
  let longestName = "";
  let longestSize = 0;
  let maxLen = 0;

  for (const item of items) {
    if (item.x < x0) x0 = item.x;
    if (item.y < y0) y0 = item.y;
    const right = item.x + item.width;
    if (right > x1) x1 = right;
    const bottom = item.y + item.height;
    if (bottom > y1) y1 = bottom;

    if (item.text.length > maxLen) {
      maxLen = item.text.length;
      longestName = item.fontName;
      longestSize = item.fontSize;
    }
  }

  const bbox: PdfBoundingBox = { x0, y0, x1, y1 };
  const font: PdfFontInfo = {
    name: longestName,
    size: Math.round(longestSize * 100) / 100,
  };

  return { bbox, text, font };
}

function firstY(items: RawTextItem[]): number {
  let minY = Infinity;
  for (const item of items) {
    if (item.y < minY) minY = item.y;
  }
  return minY;
}

function blockToExtractedBlock(lines: RawTextItem[][]): PdfExtractedBlock {
  const sortedLines = lines.sort((a, b) => firstY(a) - firstY(b));
  const extractedLines = sortedLines.map(lineToExtractedLine);

  let x0 = Infinity;
  let y0 = Infinity;
  let x1 = -Infinity;
  let y1 = -Infinity;

  for (const line of extractedLines) {
    if (line.bbox.x0 < x0) x0 = line.bbox.x0;
    if (line.bbox.y0 < y0) y0 = line.bbox.y0;
    if (line.bbox.x1 > x1) x1 = line.bbox.x1;
    if (line.bbox.y1 > y1) y1 = line.bbox.y1;
  }

  const bbox: PdfBoundingBox = { x0, y0, x1, y1 };

  return { bbox, lines: extractedLines };
}

function groupTextContent(content: { items: unknown[]; styles: Record<string, unknown> }): PdfExtractedBlock[] {
  const textItems = extractTextItems(content.items);
  if (textItems.length === 0) return [];

  const safeStyles = extractStyles(content.styles);
  const rawItems = extractRawItems(textItems, safeStyles);
  const lines = groupIntoLines(rawItems);
  const blocks = groupLinesIntoBlocks(lines);

  return blocks.map(blockToExtractedBlock);
}

interface PdfContent {
  items: unknown[];
  styles: Record<string, unknown>;
}

interface PdfPageHandle {
  getViewport: (opts: { scale: number }) => { width: number; height: number };
  getTextContent: () => Promise<PdfContent>;
}

interface PdfDocumentHandle {
  numPages: number;
  getPage: (pageNumber: number) => Promise<PdfPageHandle>;
  destroy: () => void;
}

export async function extractWithPdfJs(buffer: Uint8Array): Promise<{ pages: PdfExtractedPage[] }> {
  const rawPdf = await getDocument({ data: buffer, useSystemFonts: true }).promise;
  const pdf = rawPdf as unknown as PdfDocumentHandle;
  const pageCount = pdf.numPages;
  const pages: PdfExtractedPage[] = [];

  try {
    for (let i = 1; i <= pageCount; i++) {
      const page = await pdf.getPage(i);
      const viewport = page.getViewport({ scale: 1 });
      const content = await page.getTextContent();

      const blocks = groupTextContent(content);

      pages.push({
        pageNumber: i,
        width: viewport.width,
        height: viewport.height,
        blocks,
      });
    }
  } finally {
    pdf.destroy();
  }

  return { pages };
}
