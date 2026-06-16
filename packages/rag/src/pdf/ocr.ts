import { getDocument } from "pdfjs-dist";

import { renderPageToPng } from "./ocr/renderer";
import { recognizeImage } from "./ocr/tesseract";
import type { OcrResult } from "./ocr/types";
import { ocrToExtractionResult } from "./ocr/utils";
import type { PdfExtractionResult } from "./types";
import { createLogger } from "@repo/logger";

const logger = createLogger("rag/pdf/ocr");

const MAX_CONCURRENT_PAGES = 2;

export interface RunOcrOptions {
  language?: string;
  dpi?: number;
}

export interface OcrPageRender {
  pageNumber: number;
  width: number;
  height: number;
}

export async function getPageSizes(pdfBuffer: Uint8Array): Promise<OcrPageRender[]> {
  const loadingTask = getDocument({ data: pdfBuffer });
  const pdf = await loadingTask.promise;
  const pageCount = pdf.numPages;
  const pages: OcrPageRender[] = [];

  try {
    for (let i = 1; i <= pageCount; i++) {
      const page = await pdf.getPage(i);
      const viewport = page.getViewport({ scale: 1 });
      pages.push({
        pageNumber: i,
        width: viewport.width,
        height: viewport.height,
      });
    }
  } finally {
    void loadingTask.destroy();
  }

  return pages;
}

export async function runOcr(
  pdfBuffer: Uint8Array,
  options: RunOcrOptions = {},
): Promise<PdfExtractionResult> {
  const language = options.language ?? "eng";
  const dpi = options.dpi ?? 300;

  logger.info({ language, dpi }, "Starting OCR processing");

  const pageSizes = await getPageSizes(pdfBuffer);
  const pageCount = pageSizes.length;

  logger.info({ pageCount }, "OCR processing pages");

  const ocrPages: OcrResult["pages"] = [];

  for (let i = 0; i < pageCount; i += MAX_CONCURRENT_PAGES) {
    const batch = pageSizes.slice(i, i + MAX_CONCURRENT_PAGES);
    const results = await Promise.all(
      batch.map(async (pageSize) => {
        logger.debug({ pageNumber: pageSize.pageNumber }, "Rendering page for OCR");
        const pngBuffer = await renderPageToPng(pdfBuffer, pageSize.pageNumber, dpi);

        logger.debug({ pageNumber: pageSize.pageNumber, imageSize: pngBuffer.length }, "Running OCR on page");
        return recognizeImage(pngBuffer, pageSize.pageNumber, pageSize.width, pageSize.height, language);
      }),
    );

    for (const result of results) {
      ocrPages.push(result);
    }
  }

  const allWords = ocrPages.flatMap((p) => p.blocks.flatMap((b) => b.lines.flatMap((l) => l.words)));
  const avgConfidence = allWords.length > 0
    ? allWords.reduce((sum, w) => sum + w.confidence, 0) / allWords.length
    : 0;

  const ocrResult: OcrResult = {
    pages: ocrPages,
    confidence: avgConfidence,
    language,
  };

  const extractionResult = ocrToExtractionResult(ocrResult);

  logger.info(
    {
      pageCount,
      charCount: extractionResult.metadata.charCount,
      confidence: Math.round(avgConfidence),
    },
    "OCR processing completed",
  );

  return extractionResult;
}
