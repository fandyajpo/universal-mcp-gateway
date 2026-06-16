export interface PdfExtractStartedEventPayload {
  documentId: string;
  workspaceId: string;
  userId: string;
  fileKey: string;
}

export interface PdfExtractStartedEvent {
  name: "pdf/extract/started";
  data: PdfExtractStartedEventPayload;
}

export interface PdfExtractCompletedEventPayload {
  documentId: string;
  workspaceId: string;
  charCount: number;
  pageCount: number;
  extractionMethod: "native" | "ocr";
  confidenceScore: number;
}

export interface PdfExtractCompletedEvent {
  name: "pdf/extract/completed";
  data: PdfExtractCompletedEventPayload;
}

export interface PdfExtractFailedEventPayload {
  documentId: string;
  workspaceId: string;
  error: string;
}

export interface PdfExtractFailedEvent {
  name: "pdf/extract/failed";
  data: PdfExtractFailedEventPayload;
}

export interface PdfChunkStartedEventPayload {
  documentId: string;
  workspaceId: string;
  strategy: string;
  pageCount: number;
}

export interface PdfChunkStartedEvent {
  name: "pdf/chunk/started";
  data: PdfChunkStartedEventPayload;
}

export interface PdfChunkCompletedEventPayload {
  documentId: string;
  workspaceId: string;
  chunkCount: number;
  totalTokenCount: number;
  strategy: string;
}

export interface PdfChunkCompletedEvent {
  name: "pdf/chunk/completed";
  data: PdfChunkCompletedEventPayload;
}

export interface PdfChunkFailedEventPayload {
  documentId: string;
  workspaceId: string;
  strategy: string;
  error: string;
}

export interface PdfChunkFailedEvent {
  name: "pdf/chunk/failed";
  data: PdfChunkFailedEventPayload;
}
