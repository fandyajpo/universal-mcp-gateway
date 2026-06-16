import type { PdfExtractedBlock, PdfExtractedLine, PdfExtractedPage } from "../types";
import type { HeadingInfo } from "./types";
import { HEADING_FONT_RATIO_THRESHOLD, TOKEN_CHAR_RATIO } from "./types";

export function estimateTokenCount(text: string): number {
  if (text.length === 0) return 0;
  return Math.ceil(text.length / TOKEN_CHAR_RATIO);
}

export function estimateAverageBodyFontSize(pages: PdfExtractedPage[]): number {
  const sizes: number[] = [];
  for (const page of pages) {
    for (const block of page.blocks) {
      for (const line of block.lines) {
        sizes.push(line.font.size);
      }
    }
  }
  if (sizes.length === 0) return 12;
  return sizes.reduce((a, b) => a + b, 0) / sizes.length;
}

export function detectHeadingLevel(
  fontSize: number,
  bodyFontSize: number,
): number | null {
  const ratio = fontSize / bodyFontSize;
  if (ratio >= HEADING_FONT_RATIO_THRESHOLD * 1.5) return 1;
  if (ratio >= HEADING_FONT_RATIO_THRESHOLD) return 2;
  return null;
}

export function extractHeadings(
  pages: PdfExtractedPage[],
  bodyFontSize: number,
): HeadingInfo[] {
  const headings: HeadingInfo[] = [];

  for (const page of pages) {
    for (let bi = 0; bi < page.blocks.length; bi++) {
      const block = page.blocks[bi];
      if (block === undefined) continue;
      for (const line of block.lines) {
        const level = detectHeadingLevel(line.font.size, bodyFontSize);
        if (level !== null) {
          headings.push({
            text: line.text.trim(),
            level,
            pageNumber: page.pageNumber,
            blockIndex: bi,
          });
        }
      }
    }
  }

  return headings;
}

export function buildSectionPath(
  headings: HeadingInfo[],
  targetIndex: number,
): string[] {
  const path: string[] = [];
  let h2Count = 0;

  for (const heading of headings) {
    if (heading.level === 1) {
      h2Count = 0;
      path.length = 0;
      path.push(`${h2Count + 1}. ${heading.text}`);
    } else if (heading.level === 2) {
      h2Count++;
      path.length = 0;
      path.push(`${h2Count}. ${heading.text}`);
    }
    if (heading.blockIndex >= targetIndex) break;
  }

  return path;
}

export function extractTextFromPage(page: PdfExtractedPage): string {
  const lines: string[] = [];
  for (const block of page.blocks) {
    for (const line of block.lines) {
      lines.push(line.text);
    }
  }
  return lines.join("\n");
}

export function extractTextFromBlock(block: PdfExtractedBlock): string {
  return block.lines.map((l) => l.text).join("\n");
}

export function extractTextFromLine(line: PdfExtractedLine): string {
  return line.text;
}

export function countCharsInPages(pages: PdfExtractedPage[]): number {
  let count = 0;
  for (const page of pages) {
    for (const block of page.blocks) {
      for (const line of block.lines) {
        count += line.text.length;
      }
    }
  }
  return count;
}

export function getPageNumbersForRange(
  pages: PdfExtractedPage[],
  startIndex: number,
  endIndex: number,
): number[] {
  const numbers = new Set<number>();
  for (let i = startIndex; i < endIndex && i < pages.length; i++) {
    const page = pages[i];
    if (page !== undefined) {
      numbers.add(page.pageNumber);
    }
  }
  return Array.from(numbers).sort((a, b) => a - b);
}
