import Tesseract from "tesseract.js";

import type { OcrBlock, OcrLine, OcrPage, OcrWord } from "./types";
import { createLogger } from "@repo/logger";

const logger = createLogger("rag/pdf/ocr/tesseract");

export async function recognizeImage(
  imageBuffer: Buffer,
  pageNumber: number,
  pageWidth: number,
  pageHeight: number,
  language = "eng",
): Promise<OcrPage> {
  const { data } = await Tesseract.recognize(imageBuffer, language, {
    logger: (info: { status: string; progress: number }) => {
      if (info.status === "recognizing text") {
        logger.debug({ pageNumber, progress: info.progress }, "OCR recognition progress");
      }
    },
  });

  const blocks = mapBlocks(data as unknown as Record<string, unknown>, pageWidth, pageHeight);

  const allWords = collectWords(blocks);

  const avgConfidence = allWords.length > 0
    ? allWords.reduce((sum, w) => sum + w.confidence, 0) / allWords.length
    : 0;

  logger.info(
    { pageNumber, wordCount: allWords.length, confidence: Math.round(avgConfidence) },
    "OCR page recognition completed",
  );

  return {
    pageNumber,
    width: pageWidth,
    height: pageHeight,
    blocks,
    confidence: avgConfidence,
  };
}

function collectWords(blocks: OcrBlock[]): OcrWord[] {
  const result: OcrWord[] = [];
  for (const block of blocks) {
    for (const line of block.lines) {
      for (const word of line.words) {
        result.push(word);
      }
    }
  }
  return result;
}

function mapBlocks(
  tesseractData: Record<string, unknown>,
  pageWidth: number,
  pageHeight: number,
): OcrBlock[] {
  const rawBlocks = tesseractData.blocks;
  if (!Array.isArray(rawBlocks) || rawBlocks.length === 0) return [];

  const blocks: OcrBlock[] = [];

  for (const rawBlock of rawBlocks) {
    if (typeof rawBlock !== "object" || rawBlock === null) continue;

    const tBlock = rawBlock as Record<string, unknown>;
    const paragraphs = Array.isArray(tBlock.paragraphs) ? tBlock.paragraphs : [];

    const lines: OcrLine[] = [];

    for (const rawParagraph of paragraphs) {
      if (typeof rawParagraph !== "object" || rawParagraph === null) continue;

      const paragraph = rawParagraph as Record<string, unknown>;
      const paraLines = Array.isArray(paragraph.lines) ? paragraph.lines : [];

      for (const rawLine of paraLines) {
        if (typeof rawLine !== "object" || rawLine === null) continue;

        const tLine = rawLine as Record<string, unknown>;
        const rawWords = Array.isArray(tLine.words) ? tLine.words : [];

        const words: OcrWord[] = [];

        for (const rawWord of rawWords) {
          if (typeof rawWord !== "object" || rawWord === null) continue;

          const w = rawWord as Record<string, unknown>;
          words.push({
            text: typeof w.text === "string" ? w.text : "",
            bbox: safeBbox(w.bbox, pageWidth, pageHeight),
            confidence: typeof w.confidence === "number" ? w.confidence : 0,
          });
        }

        const lineText = words.map((w) => w.text).join(" ").trim();
        if (!lineText) continue;

        lines.push({
          bbox: safeBbox(tLine.bbox, pageWidth, pageHeight),
          text: lineText,
          words,
        });
      }
    }

    if (lines.length === 0) continue;

    blocks.push({
      bbox: safeBbox(tBlock.bbox, pageWidth, pageHeight),
      lines,
      confidence: typeof tBlock.confidence === "number" ? tBlock.confidence : 0,
    });
  }

  return blocks;
}

function safeBbox(
  val: unknown,
  pageWidth: number,
  pageHeight: number,
): { x0: number; y0: number; x1: number; y1: number } {
  if (!Array.isArray(val) || val.length < 4) {
    return { x0: 0, y0: 0, x1: pageWidth, y1: pageHeight };
  }
  return {
    x0: typeof val[0] === "number" ? val[0] : 0,
    y0: typeof val[1] === "number" ? val[1] : 0,
    x1: typeof val[2] === "number" ? val[2] : pageWidth,
    y1: typeof val[3] === "number" ? val[3] : pageHeight,
  };
}


