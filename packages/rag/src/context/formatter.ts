import type { RetrievalChunk, ConversationMessage } from "./types";

export interface ChunkFormatOptions {
  includeCitations?: boolean;
  includeScores?: boolean;
}

export function formatChunk(
  chunk: RetrievalChunk,
  index: number,
  options: ChunkFormatOptions = {},
): string {
  const parts: string[] = [];

  if (options.includeCitations !== false) {
    parts.push(`[${index + 1}]`);
  }

  const source = `Source: "${chunk.documentTitle}"`;
  const section = chunk.sectionPath ? ` \u2014 Section: "${chunk.sectionPath}"` : "";
  const page = chunk.pageNumber ? ` \u2014 Page ${chunk.pageNumber}` : "";
  parts.push(`${source}${section}${page}`);

  if (options.includeScores) {
    const score = chunk.rerankScore ?? chunk.score;
    parts.push(`[Score: ${score.toFixed(4)}]`);
  }

  return `${parts.join(" ")}\n${chunk.text}`;
}

export function formatContextSection(
  chunks: RetrievalChunk[],
  options: ChunkFormatOptions = {},
): string {
  const formatted = chunks.map((chunk, i) => formatChunk(chunk, i, options));
  return `<context>\n${formatted.join("\n\n")}\n</context>`;
}

export function formatConversationSection(messages: ConversationMessage[]): string {
  const formatted = messages.map(
    (m) => `${m.role}: ${m.content}`,
  );
  return `<conversation_history>\n${formatted.join("\n")}\n</conversation_history>`;
}

export function formatInstructionsSection(instructions: string): string {
  return `<instructions>\n${instructions}\n</instructions>`;
}
