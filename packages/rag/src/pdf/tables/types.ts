export interface PdfTableCell {
  text: string;
  rowspan: number;
  colspan: number;
  isHeader: boolean;
  bold: boolean;
  italic: boolean;
  numeric: boolean;
  confidence: number;
}

export interface PdfTableRow {
  cells: PdfTableCell[];
}

export interface PdfTable {
  id: string;
  pageNumber: number;
  pageCount: number;
  bbox: { x0: number; y0: number; x1: number; y1: number };
  caption: string | null;
  headers: string[];
  rows: PdfTableRow[];
  columnCount: number;
  rowCount: number;
  confidence: number;
  detectionMethod: "positional" | "camelot";
  formats: PdfTableFormats;
}

export interface PdfTableFormats {
  json: string;
  csv: string;
  markdown: string;
}

export interface ExtractTablesOptions {
  pdfBuffer: Uint8Array;
  enableCamelot: boolean;
}

export interface ExtractTablesResult {
  tables: PdfTable[];
  lowConfidenceTables: PdfTable[];
}

export const DETECTION_MIN_COLUMNS = 2;
export const DETECTION_MIN_ROWS = 2;
export const HIGH_CONFIDENCE_THRESHOLD = 0.7;
export const LOW_CONFIDENCE_THRESHOLD = 0.3;
export const ROW_GROUP_TOLERANCE = 0.5;
export const COLUMN_ALIGNMENT_TOLERANCE = 3;
export const CAMELOT_TIMEOUT_MS = 30_000;
