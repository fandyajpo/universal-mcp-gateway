import type { PdfExtractedBlock, PdfExtractedPage } from "../../types";
import type { Chunk, HeadingInfo } from "../types";
import { DEFAULT_CHUNK_OVERLAP, DEFAULT_CHUNK_SIZE } from "../types";
import { estimateTokenCount, extractHeadings, extractTextFromBlock, buildSectionPath, getPageNumbersForRange } from "../utils";

export function chunkPdf(
  pages: PdfExtractedPage[],
  bodyFontSize: number,
  documentId: string,
  workspaceId: string,
  options: { chunkSize?: number; chunkOverlap?: number } = {},
): Chunk[] {
  const chunkSize = options.chunkSize ?? DEFAULT_CHUNK_SIZE;
  const chunkOverlap = options.chunkOverlap ?? DEFAULT_CHUNK_OVERLAP;

  const headings = extractHeadings(pages, bodyFontSize);
  const blocksWithMeta = extractBlocksWithMetadata(pages, headings);

  const chunks: Chunk[] = [];
  let chunkIndex = 0;

  let pendingHeading: HeadingInfo | null = null;

  for (const group of blocksWithMeta) {
    if (group.isHeading && group.headingInfo !== null) {
      if (pendingHeading !== null) {
        const orphanChunk = buildOrphanChunk(
          pendingHeading,
          documentId,
          workspaceId,
          chunkIndex++,
        );
        chunks.push(orphanChunk);
      }
      pendingHeading = group.headingInfo;
    }

    if (!group.isHeading && pendingHeading !== null) {
      const sectionContent = group.blocks.map(extractTextFromBlock).join("\n\n");
      const sectionTokens = estimateTokenCount(sectionContent);

      if (sectionTokens <= chunkSize) {
        chunks.push({
          id: crypto.randomUUID(),
          content: pendingHeading.text + "\n" + sectionContent,
          metadata: {
            documentId,
            workspaceId,
            pageNumbers: getPageNumbersForRange(pages, 0, pages.length),
            sectionPath: buildSectionPath(headings, pendingHeading.blockIndex),
            chunkIndex: chunkIndex++,
            strategy: "pdf",
            tokenCount: estimateTokenCount(pendingHeading.text + "\n" + sectionContent),
            charCount: (pendingHeading.text + "\n" + sectionContent).length,
            confidenceScore: 0.9,
          },
        });
      } else {
        const subChunks = splitLargeBlock(sectionContent, chunkSize, chunkOverlap);
        for (let si = 0; si < subChunks.length; si++) {
          const sub = subChunks[si];
          if (sub === undefined) continue;
          const text = (si === 0 ? pendingHeading.text + "\n" : "") + sub;
          chunks.push({
            id: crypto.randomUUID(),
            content: text,
            metadata: {
              documentId,
              workspaceId,
              pageNumbers: getPageNumbersForRange(pages, 0, pages.length),
              sectionPath: buildSectionPath(headings, pendingHeading.blockIndex),
              chunkIndex: chunkIndex++,
              strategy: "pdf",
              tokenCount: estimateTokenCount(text),
              charCount: text.length,
              confidenceScore: 0.85,
            },
          });
        }
      }

      pendingHeading = null;
    }
  }

  if (pendingHeading !== null) {
    chunks.push(buildOrphanChunk(pendingHeading, documentId, workspaceId, chunkIndex++));
  }

  return chunks;
}

interface BlockGroup {
  blocks: PdfExtractedBlock[];
  isHeading: boolean;
  headingInfo: HeadingInfo | null;
}

function extractBlocksWithMetadata(
  pages: PdfExtractedPage[],
  headings: HeadingInfo[],
): BlockGroup[] {
  const groups: BlockGroup[] = [];

  for (const page of pages) {
    for (let bi = 0; bi < page.blocks.length; bi++) {
      const block = page.blocks[bi];
      if (block === undefined) continue;

      const maybeHeading = headings.find(
        (h) => h.pageNumber === page.pageNumber && h.blockIndex === bi,
      );

      if (maybeHeading !== undefined) {
        groups.push({
          blocks: [block],
          isHeading: true,
          headingInfo: maybeHeading,
        });
      } else {
        const lastGroup = groups[groups.length - 1];
        if (lastGroup !== undefined && !lastGroup.isHeading) {
          lastGroup.blocks.push(block);
        } else {
          groups.push({
            blocks: [block],
            isHeading: false,
            headingInfo: null,
          });
        }
      }
    }
  }

  return groups;
}

function buildOrphanChunk(
  heading: HeadingInfo,
  documentId: string,
  workspaceId: string,
  chunkIndex: number,
): Chunk {
  return {
    id: crypto.randomUUID(),
    content: heading.text,
    metadata: {
      documentId,
      workspaceId,
      pageNumbers: [heading.pageNumber],
      sectionPath: [],
      chunkIndex,
      strategy: "pdf",
      tokenCount: estimateTokenCount(heading.text),
      charCount: heading.text.length,
      confidenceScore: 0.5,
    },
  };
}

function splitLargeBlock(
  text: string,
  chunkSize: number,
  chunkOverlap: number,
): string[] {
  const paragraphs = text.split("\n\n").filter((p) => p.trim().length > 0);
  const subChunks: string[] = [];

  let currentText = "";
  let currentTokens = 0;

  for (const paragraph of paragraphs) {
    const paraTokens = estimateTokenCount(paragraph);

    if (currentTokens + paraTokens > chunkSize && currentTokens > 0) {
      subChunks.push(currentText.trim());

      const overlap = extractOverlapForPdf(currentText, chunkOverlap);
      currentText = overlap + "\n\n" + paragraph + "\n\n";
      currentTokens = estimateTokenCount(currentText);
    } else {
      currentText += paragraph + "\n\n";
      currentTokens += paraTokens;
    }
  }

  if (currentText.trim()) {
    subChunks.push(currentText.trim());
  }

  return subChunks;
}

function extractOverlapForPdf(text: string, overlapTokens: number): string {
  const words = text.split(" ");
  const overlapCharCount = overlapTokens * 4;
  let charCount = 0;
  const overlapWords: string[] = [];

  for (let i = words.length - 1; i >= 0; i--) {
    const word = words[i];
    if (word === undefined) continue;
    if (charCount + word.length + 1 > overlapCharCount) break;
    overlapWords.unshift(word);
    charCount += word.length + 1;
  }

  return overlapWords.join(" ");
}
