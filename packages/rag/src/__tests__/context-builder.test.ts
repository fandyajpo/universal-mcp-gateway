import { describe, it, expect } from "vitest";

import { buildContext } from "../context/builder";
import type { RetrievalChunk, ContextResult } from "../context/types";
import { countTokens } from "../context/tokenizer";

function makeChunk(overrides?: Partial<RetrievalChunk>): RetrievalChunk {
  return {
    chunkId: "chunk-1",
    documentId: "doc-1",
    documentTitle: "Test Document",
    text: "The quick brown fox jumps over the lazy dog.",
    score: 0.95,
    ...overrides,
  };
}

function makeChunks(count: number, baseScore = 0.9): RetrievalChunk[] {
  return Array.from({ length: count }, (_, i) =>
    makeChunk({
      chunkId: `chunk-${i + 1}`,
      text: `Chunk ${i + 1} content. `.repeat(20),
      score: baseScore - i * 0.05,
    }),
  );
}

describe("buildContext", () => {
  it("returns context with all chunks when within budget", () => {
    const chunks = [makeChunk({ text: "Short text." })];
    const result = buildContext("test query", chunks, {
      modelMaxTokens: 128_000,
    });

    expect(result.context).toContain("Short text.");
    expect(result.chunksUsed).toBe(1);
    expect(result.truncated).toBe(false);
    expect(result.truncationDetails).toBeNull();
    expect(result.tokenCount).toBeGreaterThan(0);
  });

  it("allocates budget with default 70/15/15 split", () => {
    const chunks = makeChunks(3, 0.95);
    const result = buildContext("test", chunks, {
      modelMaxTokens: 1000,
    });

    const totalBudget = Math.floor(1000 * 0.7);
    const ctxTokens = countTokens(result.context);
    expect(ctxTokens).toBeLessThanOrEqual(totalBudget + 50);
  });

  it("formats chunks with citation markers", () => {
    const chunks = [
      makeChunk({ chunkId: "a", text: "First result." }),
      makeChunk({ chunkId: "b", text: "Second result." }),
    ];
    const result = buildContext("test", chunks, { modelMaxTokens: 128000 });

    expect(result.context).toMatch(/\[1\]/);
    expect(result.context).toMatch(/\[2\]/);
  });

  it("includes document title in citation", () => {
    const chunks = [
      makeChunk({ documentTitle: "Important Doc", text: "Content here." }),
    ];
    const result = buildContext("test", chunks, { modelMaxTokens: 128000 });

    expect(result.context).toContain("Important Doc");
  });

  it("truncates lowest-score chunks when over budget", () => {
    const chunks = makeChunks(10, 0.95);
    const result = buildContext("test", chunks, {
      modelMaxTokens: 200,
    });

    expect(result.chunksUsed).toBeLessThan(10);
    expect(result.truncated).toBe(true);
    expect(result.truncationDetails).not.toBeNull();
    expect(result.truncationDetails!.removedChunks).toBeGreaterThan(0);
  });

  it("always keeps system instructions within budget", () => {
    const chunks = makeChunks(5, 0.9);
    const instructions = "This is a very important system instruction that must always be included. ".repeat(50);
    const result = buildContext("test", chunks, {
      modelMaxTokens: 500,
      systemInstructions: instructions,
    });

    expect(result.context).toContain("important system instruction");
  });

  it("handles conversation history with sliding window", () => {
    const chunks = [makeChunk({ text: "Relevant chunk." })];
    const history = Array.from({ length: 10 }, (_, i) => ({
      role: "user" as const,
      content: `Message ${i + 1}. `.repeat(30),
    }));

    const result = buildContext("test", chunks, {
      modelMaxTokens: 500,
      conversationHistory: history,
    });

    expect(result.truncated).toBe(true);
    expect(result.truncationDetails!.removedHistory).toBeGreaterThan(0);
  });

  it("handles empty chunks array", () => {
    const result = buildContext("test", [], { modelMaxTokens: 1000 });

    expect(result.context).toBeTruthy();
    expect(result.chunksUsed).toBe(0);
    expect(result.truncated).toBe(false);
  });

  it("handles very low token budget gracefully", () => {
    const chunks = makeChunks(3, 0.9);
    const result = buildContext("test", chunks, {
      modelMaxTokens: 50,
    });

    expect(result.tokenCount).toBeLessThanOrEqual(60);
    expect(result.truncated).toBe(true);
  });

  it("respects maxChunks limit", () => {
    const chunks = makeChunks(10, 0.95);
    const result = buildContext("test", chunks, {
      modelMaxTokens: 128_000,
      maxChunks: 3,
    });

    expect(result.chunksUsed).toBe(3);
  });

  it("formats conversation section when history provided", () => {
    const chunks = [makeChunk({ text: "Content." })];
    const history = [{ role: "user" as const, content: "Hello" }];
    const result = buildContext("test", chunks, {
      modelMaxTokens: 1000,
      conversationHistory: history,
    });

    expect(result.context).toContain("Hello");
  });

  it("formats instructions section when instructions provided", () => {
    const chunks = [makeChunk({ text: "Content." })];
    const result = buildContext("test", chunks, {
      modelMaxTokens: 1000,
      systemInstructions: "Answer concisely.",
    });

    expect(result.context).toContain("Answer concisely.");
  });

  it("includes section separators", () => {
    const chunks = [makeChunk({ text: "Content." })];
    const result = buildContext("test", chunks, { modelMaxTokens: 128000 });

    expect(result.context).toContain("<context>");
  });

  it("returns ContextResult with all required fields", () => {
    const result = buildContext("test", [makeChunk()], { modelMaxTokens: 128000 });

    expect(result).toHaveProperty("context");
    expect(result).toHaveProperty("tokenCount");
    expect(result).toHaveProperty("chunksUsed");
    expect(result).toHaveProperty("truncated");
    expect(result).toHaveProperty("truncationDetails");
  });
});
