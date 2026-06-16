import type { PdfExtractedBlock, PdfExtractedLine } from "../types";

const SCANNED_THRESHOLD = 10;

export function calculateTextLength(pages: { blocks: { lines: { text: string }[] }[] }[]): number {
  let count = 0;
  for (const page of pages) {
    for (const block of page.blocks) {
      for (const line of block.lines) {
        for (const char of line.text) {
          if (char !== " " && char !== "\n" && char !== "\t" && char !== "\r") {
            count++;
          }
        }
      }
    }
  }
  return count;
}

export function calculateTextDensity(pages: { blocks: { lines: { text: string }[] }[] }[], pageCount: number): number {
  const nonWhitespace = calculateTextLength(pages);
  return pageCount > 0 ? nonWhitespace / pageCount : 0;
}

export function isScannedDocument(pages: { blocks: { lines: { text: string }[] }[] }[], pageCount: number): boolean {
  return calculateTextDensity(pages, pageCount) < SCANNED_THRESHOLD;
}

export function detectLanguage(text: string): string | undefined {
  const sample = text.slice(0, 1000);

  const cjkRange = /[\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaff]/;
  const cyrillicRange = /[\u0400-\u04ff]/;
  const arabicRange = /[\u0600-\u06ff]/;
  const devanagariRange = /[\u0900-\u097f]/;
  const latinRange = /[a-zA-Z]/;

  let cjkCount = 0;
  let cyrillicCount = 0;
  let arabicCount = 0;
  let devanagariCount = 0;
  let latinCount = 0;

  for (const char of sample) {
    if (cjkRange.test(char)) cjkCount++;
    else if (cyrillicRange.test(char)) cyrillicCount++;
    else if (arabicRange.test(char)) arabicCount++;
    else if (devanagariRange.test(char)) devanagariCount++;
    else if (latinRange.test(char)) latinCount++;
  }

  const total = cjkCount + cyrillicCount + arabicCount + devanagariCount + latinCount;
  if (total === 0) return undefined;

  const max = Math.max(cjkCount, cyrillicCount, arabicCount, devanagariCount, latinCount);

  if (cjkCount === max && cjkCount > 0) return "zh- Hans";
  if (cyrillicCount === max && cyrillicCount > 0) return "ru";
  if (arabicCount === max && arabicCount > 0) return "ar";
  if (devanagariCount === max && devanagariCount > 0) return "hi";
  if (latinCount === max && latinCount > 0) return "en";

  return undefined;
}

export function sortBlocksInReadingOrder(blocks: PdfExtractedBlock[]): PdfExtractedBlock[] {
  const LINE_HEIGHT_TOLERANCE = 0.6;

  return [...blocks].sort((a, b) => {
    const aMidY = (a.bbox.y0 + a.bbox.y1) / 2;
    const bMidY = (b.bbox.y0 + b.bbox.y1) / 2;
    const aHeight = a.bbox.y1 - a.bbox.y0;
    const bHeight = b.bbox.y1 - b.bbox.y0;

    if (Math.abs(aMidY - bMidY) < Math.min(aHeight, bHeight) * LINE_HEIGHT_TOLERANCE) {
      return a.bbox.x0 - b.bbox.x0;
    }

    return aMidY - bMidY;
  });
}

export function extractAllText(pages: { blocks: PdfExtractedBlock[] }[]): string {
  const lines: string[] = [];
  for (const page of pages) {
    const sortedBlocks = sortBlocksInReadingOrder(page.blocks);
    for (const block of sortedBlocks) {
      const blockLines: string[] = [];
      for (const line of block.lines) {
        blockLines.push(line.text);
      }
      lines.push(blockLines.join(" "));
    }
  }
  return lines.join("\n");
}

export function calculateConfidenceScore(pages: { blocks: { lines: PdfExtractedLine[] }[] }[], totalChars: number): number {
  const totalLines = pages.reduce((sum, page) => {
    return sum + page.blocks.reduce((blockSum, block) => blockSum + block.lines.length, 0);
  }, 0);

  if (totalChars === 0 || totalLines === 0) return 0;

  const avgLineLength = totalChars / totalLines;
  const score = Math.min(100, (avgLineLength / 80) * 100);

  return Math.round(score * 100) / 100;
}
