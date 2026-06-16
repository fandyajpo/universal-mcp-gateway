export interface OcrWord {
  text: string;
  bbox: { x0: number; y0: number; x1: number; y1: number };
  confidence: number;
}

export interface OcrLine {
  bbox: { x0: number; y0: number; x1: number; y1: number };
  text: string;
  words: OcrWord[];
}

export interface OcrBlock {
  bbox: { x0: number; y0: number; x1: number; y1: number };
  lines: OcrLine[];
  confidence: number;
}

export interface OcrPage {
  pageNumber: number;
  width: number;
  height: number;
  blocks: OcrBlock[];
  confidence: number;
}

export interface OcrResult {
  pages: OcrPage[];
  confidence: number;
  language: string;
}

export interface OcrOptions {
  language?: string;
  dpi?: number;
  confidenceThreshold?: number;
}
