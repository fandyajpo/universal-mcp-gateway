import type { PdfExtractedPage } from "../../types";
import type { Chunk, HeadingInfo } from "../types";
import { DEFAULT_CHUNK_OVERLAP, DEFAULT_CHUNK_SIZE } from "../types";
import {
  estimateTokenCount,
  extractHeadings,
  extractTextFromPage,
  buildSectionPath,
  getPageNumbersForRange,
} from "../utils";

export function chunkSemantic(
  pages: PdfExtractedPage[],
  bodyFontSize: number,
  documentId: string,
  workspaceId: string,
  options: { chunkSize?: number; chunkOverlap?: number } = {},
): Chunk[] {
  const chunkSize = options.chunkSize ?? DEFAULT_CHUNK_SIZE;
  const chunkOverlap = options.chunkOverlap ?? DEFAULT_CHUNK_OVERLAP;

  const headings = extractHeadings(pages, bodyFontSize);
  const sections = buildSemanticSections(pages, headings);

  const chunks: Chunk[] = [];
  let chunkIndex = 0;

  for (const section of sections) {
    const sectionTokens = estimateTokenCount(section.text);

    if (sectionTokens <= chunkSize) {
      chunks.push({
        id: crypto.randomUUID(),
        content: section.text,
        metadata: {
          documentId,
          workspaceId,
          pageNumbers: section.pageNumbers,
          sectionPath: section.sectionPath,
          chunkIndex: chunkIndex++,
          strategy: "semantic",
          tokenCount: sectionTokens,
          charCount: section.text.length,
          confidenceScore: section.headingFound ? 0.95 : 0.7,
        },
      });
      continue;
    }

    const subChunks = splitLargeSection(section.text, section.pageNumbers, chunkSize, chunkOverlap);

    for (const sub of subChunks) {
      chunks.push({
        id: crypto.randomUUID(),
        content: sub.text,
        metadata: {
          documentId,
          workspaceId,
          pageNumbers: sub.pageNumbers,
          sectionPath: section.sectionPath,
          chunkIndex: chunkIndex++,
          strategy: "semantic",
          tokenCount: estimateTokenCount(sub.text),
          charCount: sub.text.length,
          confidenceScore: section.headingFound ? 0.9 : 0.65,
        },
      });
    }
  }

  return chunks;
}

interface SemanticSection {
  text: string;
  pageNumbers: number[];
  sectionPath: string[];
  headingFound: boolean;
}

function buildSemanticSections(
  pages: PdfExtractedPage[],
  headings: HeadingInfo[],
): SemanticSection[] {
  if (headings.length === 0) {
    const allText = pages.map(extractTextFromPage).join("\n\n");
    const pageNumbers = getPageNumbersForRange(pages, 0, pages.length);
    return [
      {
        text: allText,
        pageNumbers,
        sectionPath: [],
        headingFound: false,
      },
    ];
  }

  const sections: SemanticSection[] = [];

  for (let hi = 0; hi < headings.length; hi++) {
    const currentHeading = headings[hi];
    if (currentHeading === undefined) continue;

    const currentPageIdx = pages.findIndex((p) => p.pageNumber === currentHeading.pageNumber);
    if (currentPageIdx < 0) continue;

    const nextHeading = hi + 1 < headings.length ? headings[hi + 1] : undefined;
    const nextPageIdx = nextHeading !== undefined
      ? pages.findIndex((p) => p.pageNumber === nextHeading.pageNumber)
      : pages.length;

    const sectionText = extractSectionContent(pages, currentPageIdx, nextPageIdx);
    if (!sectionText) continue;

    sections.push({
      text: sectionText,
      pageNumbers: getPageNumbersForRange(pages, currentPageIdx, nextPageIdx),
      sectionPath: buildSectionPath(headings, currentHeading.blockIndex),
      headingFound: true,
    });
  }

  return sections;
}

function extractSectionContent(
  pages: PdfExtractedPage[],
  startPageIndex: number,
  endPageIndex: number,
): string {
  const adjustedEnd = endPageIndex < 0 ? pages.length : endPageIndex;
  const relevantPages = pages.slice(startPageIndex, adjustedEnd);
  return relevantPages.map(extractTextFromPage).join("\n\n");
}

function splitLargeSection(
  text: string,
  pageNumbers: number[],
  chunkSize: number,
  chunkOverlap: number,
): { text: string; pageNumbers: number[] }[] {
  const paragraphs = text.split("\n\n").filter((p) => p.trim().length > 0);
  const subChunks: { text: string; pageNumbers: number[] }[] = [];

  let currentText = "";
  let currentTokens = 0;

  for (const paragraph of paragraphs) {
    const paraTokens = estimateTokenCount(paragraph);

    if (currentTokens + paraTokens > chunkSize && currentTokens > 0) {
      subChunks.push({
        text: currentText.trim(),
        pageNumbers,
      });

      const words = currentText.split(" ");
      const overlapCharCount = chunkOverlap * 4;
      let overlapChars = 0;
      const overlapWords: string[] = [];
      for (let i = words.length - 1; i >= 0; i--) {
        const word = words[i];
        if (word === undefined) continue;
        if (overlapChars + word.length + 1 > overlapCharCount) break;
        overlapWords.unshift(word);
        overlapChars += word.length + 1;
      }
      currentText = overlapWords.join(" ") + "\n\n" + paragraph + "\n\n";
      currentTokens = estimateTokenCount(currentText);
    } else {
      currentText += paragraph + "\n\n";
      currentTokens += paraTokens;
    }
  }

  if (currentText.trim()) {
    subChunks.push({
      text: currentText.trim(),
      pageNumbers,
    });
  }

  return subChunks;
}
