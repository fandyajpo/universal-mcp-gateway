export interface PdfUploadedEventPayload {
  documentId: string;
  workspaceId: string;
  userId: string;
  fileKey: string;
  fileSize: number;
  fileName: string;
  password?: string;
}

export interface PdfUploadedEvent {
  name: "pdf/uploaded";
  data: PdfUploadedEventPayload;
}

// Extraction result types (Step 06.02)

export interface PdfBoundingBox {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

export interface PdfFontInfo {
  name: string;
  size: number;
}

export interface PdfExtractedLine {
  bbox: PdfBoundingBox;
  text: string;
  font: PdfFontInfo;
}

export interface PdfExtractedBlock {
  bbox: PdfBoundingBox;
  lines: PdfExtractedLine[];
}

export interface PdfExtractedPage {
  pageNumber: number;
  width: number;
  height: number;
  blocks: PdfExtractedBlock[];
}

export interface PdfExtractionMetadata {
  charCount: number;
  pageCount: number;
  extractionMethod: "native" | "ocr";
  confidenceScore: number;
  language?: string;
}

export interface PdfExtractionResult {
  pages: PdfExtractedPage[];
  metadata: PdfExtractionMetadata;
}

export type { ChunkStrategy } from "./chunker/types";

export type { Chunk, ChunkMetadata, HeadingInfo, ChunkerOptions, ChunkDocumentOptions } from "./chunker/types";

export type { PdfTable, PdfTableCell, PdfTableRow, PdfTableFormats, ExtractTablesOptions, ExtractTablesResult } from "./tables/types";
