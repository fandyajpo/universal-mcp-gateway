export interface PdfStepMetric {
  step: string;
  status: "started" | "completed" | "failed";
  startedAt: string;
  completedAt?: string;
  durationMs?: number;
  retries: number;
  error?: string;
}

export interface PdfDocumentInfo {
  title?: string | null;
  author?: string | null;
  subject?: string | null;
  keywords?: string | null;
  creator?: string | null;
  producer?: string | null;
  creationDate?: string | null;
  modDate?: string | null;
}

export interface PdfDocumentMetadata {
  info: PdfDocumentInfo;
  pdfVersion?: string | null;
  pageDimensions?: Array<{ pageNumber: number; width: number; height: number }>;
  toc?: Array<{ title: string; page: number }>;
  language?: string | null;
}

export interface PdfExtractionMetadata {
  charCount: number;
  pageCount: number;
  extractionMethod: "native" | "ocr";
  confidenceScore: number;
  language?: string;
  extractedAt: string;
}

export interface PdfTableSummary {
  id: string;
  pageNumber: number;
  caption: string | null;
  headers: string[];
  rowCount: number;
  columnCount: number;
  confidence: number;
  detectionMethod: string;
}

export type PdfDocumentStatus = "uploading" | "processing" | "ready" | "error" | "failed";

export interface PdfDocument {
  id: string;
  tenantId: string;
  title: string;
  description?: string;
  source: string;
  contentType?: string;
  fileSize?: number;
  fileKey?: string;
  pageCount?: number;
  status: PdfDocumentStatus;
  currentStep?: string;
  stepsCompleted?: string[];
  progress?: number;
  stepMetrics?: PdfStepMetric[];
  error?: string;
  pdfMetadata?: PdfDocumentMetadata;
  extractionMetadata?: PdfExtractionMetadata;
  tables?: PdfTableSummary[];
  uploadedBy: string;
  createdAt: string;
  updatedAt: string;
}
