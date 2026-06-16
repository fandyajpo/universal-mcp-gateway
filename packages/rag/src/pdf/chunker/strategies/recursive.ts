import type { PdfExtractedPage } from "../../types";
import type { Chunk, ChunkStrategy as ChunkStrategyType, HeadingInfo } from "../types";
import { DEFAULT_CHUNK_OVERLAP, DEFAULT_CHUNK_SIZE } from "../types";
import { estimateTokenCount, extractHeadings, extractTextFromPage, buildSectionPath, getPageNumbersForRange } from "../utils";

const SEPARATORS: string[] = ["\n\n", "\n", ". ", " "];

export function chunkRecursive(
  pages: PdfExtractedPage[],
  bodyFontSize: number,
  documentId: string,
  workspaceId: string,
  options: { chunkSize?: number; chunkOverlap?: number } = {},
): Chunk[] {
  const chunkSize = options.chunkSize ?? DEFAULT_CHUNK_SIZE;
  const chunkOverlap = options.chunkOverlap ?? DEFAULT_CHUNK_OVERLAP;

  const fullText = pages.map(extractTextFromPage).join("\n\n");
  const headings = extractHeadings(pages, bodyFontSize);

  return splitRecursive(fullText, pages, headings, bodyFontSize, documentId, workspaceId, chunkSize, chunkOverlap, 0);
}

function splitRecursive(
  text: string,
  pages: PdfExtractedPage[],
  headings: HeadingInfo[],
  bodyFontSize: number,
  documentId: string,
  workspaceId: string,
  chunkSize: number,
  chunkOverlap: number,
  separatorIndex: number,
): Chunk[] {
  const chunks: Chunk[] = [];
  let chunkIndex = 0;

  const separator = SEPARATORS[separatorIndex];

  if (!separator) {
    const tokenCount = estimateTokenCount(text);
    if (tokenCount <= chunkSize) {
      chunks.push(createChunk(text, pages, headings, documentId, workspaceId, chunkIndex, "recursive"));
      return chunks;
    }
    const midpoint = Math.floor(text.length / 2);
    const spaceIdx = findSplitPoint(text, midpoint);
    const firstHalf = text.slice(0, spaceIdx);
    const secondHalf = text.slice(spaceIdx);

    if (firstHalf.trim()) {
      chunks.push(createChunk(firstHalf, pages, headings, documentId, workspaceId, chunkIndex, "recursive"));
      chunkIndex++;
    }
    if (secondHalf.trim()) {
      chunks.push(createChunk(secondHalf, pages, headings, documentId, workspaceId, chunkIndex, "recursive"));
    }
    return chunks;
  }

  const parts = text.split(separator).filter((p) => p.trim().length > 0);

  let currentText = "";
  let currentTokens = 0;

  for (const part of parts) {
    const partTokens = estimateTokenCount(part + separator);

    if (currentTokens + partTokens > chunkSize && currentTokens > 0) {
      if (currentText.trim()) {
        chunks.push(createChunk(currentText.trim(), pages, headings, documentId, workspaceId, chunkIndex, "recursive"));
        chunkIndex++;
      }

      const overlapText = extractOverlap(currentText, chunkOverlap);
      currentText = overlapText + part + separator;
      currentTokens = estimateTokenCount(currentText);
    } else {
      currentText += part + separator;
      currentTokens += partTokens;
    }
  }

  if (currentText.trim()) {
    chunks.push(createChunk(currentText.trim(), pages, headings, documentId, workspaceId, chunkIndex, "recursive"));
  }

  if (chunks.length === 0) {
    const tokenCount = estimateTokenCount(text);
    if (tokenCount > chunkSize) {
      return splitRecursive(text, pages, headings, bodyFontSize, documentId, workspaceId, chunkSize, chunkOverlap, separatorIndex + 1);
    }
    chunks.push(createChunk(text, pages, headings, documentId, workspaceId, chunkIndex, "recursive"));
  }

  return chunks;
}

function findSplitPoint(text: string, around: number): number {
  const searchSpace = 50;
  const start = Math.max(0, around - searchSpace);
  const end = Math.min(text.length, around + searchSpace);

  const spaceMatches: number[] = [];
  for (let i = start; i < end; i++) {
    if (text[i] === " " && i > 0) {
      spaceMatches.push(i);
    }
  }

  if (spaceMatches.length === 0) return around;
  return spaceMatches.reduce((best, current) =>
    Math.abs(current - around) < Math.abs(best - around) ? current : best,
  );
}

function extractOverlap(text: string, overlapTokens: number): string {
  const words = text.split(" ");
  const overlapCharCount = overlapTokens * 4;
  let charCount = 0;
  const overlapWords: string[] = [];

  for (let i = words.length - 1; i >= 0; i--) {
    if (charCount + (words[i]?.length ?? 0) + 1 > overlapCharCount) break;
    const word = words[i];
    if (word !== undefined) {
      overlapWords.unshift(word);
      charCount += word.length + 1;
    }
  }

  return overlapWords.join(" ");
}

function createChunk(
  content: string,
  pages: PdfExtractedPage[],
  headings: HeadingInfo[],
  documentId: string,
  workspaceId: string,
  chunkIndex: number,
  strategy: ChunkStrategyType,
): Chunk {
  const tokenCount = estimateTokenCount(content);
  const pageNumbers = getPageNumbersForRange(pages, 0, pages.length);

  return {
    id: crypto.randomUUID(),
    content,
    metadata: {
      documentId,
      workspaceId,
      pageNumbers,
      sectionPath: buildSectionPath(headings, 0),
      chunkIndex,
      strategy,
      tokenCount,
      charCount: content.length,
      confidenceScore: 1.0,
    },
  };
}
