export interface ChunkMetadata {
  documentId: string;
  workspaceId: string;
  pageNumbers: number[];
  sectionPath: string[];
  chunkIndex: number;
  strategy: ChunkStrategy;
  tokenCount: number;
  charCount: number;
  confidenceScore: number;
}

export interface Chunk {
  id: string;
  content: string;
  metadata: ChunkMetadata;
}

export type ChunkStrategy = "recursive" | "semantic" | "pdf";

export interface ChunkerOptions {
  chunkSize?: number;
  chunkOverlap?: number;
  strategy?: ChunkStrategy;
}

export interface ChunkDocumentOptions {
  documentId: string;
  workspaceId: string;
  strategy?: ChunkStrategy;
  chunkSize?: number;
  chunkOverlap?: number;
}

export interface HeadingInfo {
  text: string;
  level: number;
  pageNumber: number;
  blockIndex: number;
}

export const DEFAULT_CHUNK_SIZE = 1024;
export const DEFAULT_CHUNK_OVERLAP = 128;
export const MIN_CHUNK_SIZE = 256;
export const MAX_CHUNK_SIZE = 4096;
export const MAX_CHUNK_OVERLAP_RATIO = 0.25;
export const TOKEN_CHAR_RATIO = 4;

export const HEADING_FONT_RATIO_THRESHOLD = 1.5;
