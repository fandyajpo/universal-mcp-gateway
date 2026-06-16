import type { PdfBoundingBox, PdfExtractedBlock, PdfExtractedLine, PdfExtractionResult } from "../types";
import type { OcrBlock, OcrLine, OcrResult, OcrWord } from "./types";

const LOW_CONFIDENCE_THRESHOLD = 60;

export function wordBboxToPdfBbox(word: OcrWord): PdfBoundingBox {
  return {
    x0: word.bbox.x0,
    y0: word.bbox.y0,
    x1: word.bbox.x1,
    y1: word.bbox.y1,
  };
}

export function ocrLineToExtractedLine(line: OcrLine): PdfExtractedLine {
  return {
    bbox: {
      x0: line.bbox.x0,
      y0: line.bbox.y0,
      x1: line.bbox.x1,
      y1: line.bbox.y1,
    },
    text: line.text,
    font: { name: "OCR", size: 12 },
  };
}

export function ocrBlockToExtractedBlock(block: OcrBlock): PdfExtractedBlock {
  return {
    bbox: {
      x0: block.bbox.x0,
      y0: block.bbox.y0,
      x1: block.bbox.x1,
      y1: block.bbox.y1,
    },
    lines: block.lines.map(ocrLineToExtractedLine),
  };
}

export function ocrToExtractionResult(ocr: OcrResult): PdfExtractionResult {
  const pages = ocr.pages.map((page) => ({
    pageNumber: page.pageNumber,
    width: page.width,
    height: page.height,
    blocks: page.blocks.map(ocrBlockToExtractedBlock),
  }));

  let totalChars = 0;
  for (const page of pages) {
    for (const block of page.blocks) {
      for (const line of block.lines) {
        totalChars += line.text.length;
      }
    }
  }

  return {
    pages,
    metadata: {
      charCount: totalChars,
      pageCount: pages.length,
      extractionMethod: "ocr",
      confidenceScore: ocr.confidence,
      language: ocr.language,
    },
  };
}

export function getLowConfidenceWords(ocr: OcrResult): OcrWord[] {
  const lowConfidence: OcrWord[] = [];
  for (const page of ocr.pages) {
    for (const block of page.blocks) {
      for (const line of block.lines) {
        for (const word of line.words) {
          if (word.confidence < LOW_CONFIDENCE_THRESHOLD) {
            lowConfidence.push(word);
          }
        }
      }
    }
  }
  return lowConfidence;
}

export function calculateOverallConfidence(ocr: OcrResult): number {
  let totalWeight = 0;
  let weightedSum = 0;

  for (const page of ocr.pages) {
    for (const block of page.blocks) {
      for (const line of block.lines) {
        for (const word of line.words) {
          const weight = word.text.length;
          totalWeight += weight;
          weightedSum += word.confidence * weight;
        }
      }
    }
  }

  if (totalWeight === 0) return 0;
  return weightedSum / totalWeight;
}

export function extractFullText(ocr: OcrResult): string {
  const lines: string[] = [];
  for (const page of ocr.pages) {
    for (const block of page.blocks) {
      for (const line of block.lines) {
        lines.push(line.text);
      }
    }
  }
  return lines.join("\n");
}
