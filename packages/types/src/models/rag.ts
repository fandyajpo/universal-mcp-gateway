import type { RetrievalStrategy, ChunkStrategy } from "../enums";
import type { DocumentChunk } from "./document";

export interface RAGResult {
  query: string;
  chunks: DocumentChunk[];
  scores?: number[];
  metadata?: Record<string, unknown>;
}

export interface RAGConfig {
  strategy: RetrievalStrategy;
  chunkStrategy: ChunkStrategy;
  topK: number;
  minScore?: number;
}
