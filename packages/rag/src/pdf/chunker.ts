import { chunkPdf } from "./chunker/strategies/pdf";
import { chunkRecursive } from "./chunker/strategies/recursive";
import { chunkSemantic } from "./chunker/strategies/semantic";
import type { Chunk, ChunkDocumentOptions, ChunkStrategy } from "./chunker/types";
import { DEFAULT_CHUNK_SIZE, MAX_CHUNK_SIZE, MAX_CHUNK_OVERLAP_RATIO, MIN_CHUNK_SIZE } from "./chunker/types";
import { estimateAverageBodyFontSize, countCharsInPages } from "./chunker/utils";
import type { PdfExtractedPage } from "./types";
import { createLogger } from "@repo/logger";

const logger = createLogger("rag/pdf/chunker");

export interface ChunkResult {
  chunks: Chunk[];
  totalTokenCount: number;
  totalCharCount: number;
  strategyUsed: ChunkStrategy;
}

export function chunkDocument(
  pages: PdfExtractedPage[],
  options: ChunkDocumentOptions,
): ChunkResult {
  const strategy = resolveStrategy(pages, options.strategy);
  const chunkSize = clampChunkSize(options.chunkSize ?? DEFAULT_CHUNK_SIZE);
  const overlapTokens = clampOverlap(chunkSize, 0);
  const bodyFontSize = estimateAverageBodyFontSize(pages);

  logger.info(
    {
      pageCount: pages.length,
      strategy,
      chunkSize,
      overlapTokens,
      documentId: options.documentId,
    },
    "Chunking document",
  );

  const strategyOptions = { chunkSize, chunkOverlap: overlapTokens };
  const { documentId, workspaceId } = options;

  let chunks: Chunk[];

  switch (strategy) {
    case "recursive": {
      chunks = chunkRecursive(pages, bodyFontSize, documentId, workspaceId, strategyOptions);
      break;
    }
    case "semantic": {
      chunks = chunkSemantic(pages, bodyFontSize, documentId, workspaceId, strategyOptions);
      break;
    }
    case "pdf": {
      chunks = chunkPdf(pages, bodyFontSize, documentId, workspaceId, strategyOptions);
      break;
    }
  }

  chunks.sort((a, b) => a.metadata.chunkIndex - b.metadata.chunkIndex);

  const totalCharCount = countCharsInPages(pages);
  const totalTokenCount = chunks.reduce((sum, c) => sum + c.metadata.tokenCount, 0);

  logger.info(
    {
      documentId: options.documentId,
      chunkCount: chunks.length,
      totalTokenCount,
      strategy,
    },
    "Document chunking completed",
  );

  return { chunks, totalTokenCount, totalCharCount, strategyUsed: strategy };
}

function resolveStrategy(
  pages: PdfExtractedPage[],
  override?: ChunkStrategy,
): ChunkStrategy {
  if (override) return override;

  const totalTextLen = pages.reduce((sum, p) => {
    let pageLen = 0;
    for (const block of p.blocks) {
      for (const line of block.lines) {
        pageLen += line.text.length;
      }
    }
    return sum + pageLen;
  }, 0);

  const hasLargeFontVariation = pages.some((page) => {
    if (page.blocks.length === 0) return false;
    const sizes = page.blocks.flatMap((b) => b.lines.map((l) => l.font.size));
    const max = Math.max(...sizes);
    const min = Math.min(...sizes);
    return max > min * 1.5;
  });

  if (totalTextLen > 5000 && hasLargeFontVariation) return "pdf";
  return "recursive";
}

function clampChunkSize(size: number): number {
  return Math.max(MIN_CHUNK_SIZE, Math.min(MAX_CHUNK_SIZE, size));
}

function clampOverlap(chunkSize: number, overlap: number): number {
  const maxOverlap = Math.floor(chunkSize * MAX_CHUNK_OVERLAP_RATIO);
  return Math.max(0, Math.min(maxOverlap, overlap));
}
