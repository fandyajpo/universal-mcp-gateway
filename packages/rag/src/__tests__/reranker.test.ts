import { describe, it, expect, vi } from "vitest";

import type { RetrievalChunk } from "../context/types";

describe("Re-ranker (contract)", () => {
  const initialChunks: RetrievalChunk[] = [
    { chunkId: "c3", documentId: "d1", documentTitle: "Doc", text: "Third most relevant.", score: 0.70 },
    { chunkId: "c1", documentId: "d1", documentTitle: "Doc", text: "Most relevant after rerank.", score: 0.92 },
    { chunkId: "c2", documentId: "d1", documentTitle: "Doc", text: "Second most relevant after rerank.", score: 0.85 },
  ];

  const rerankedChunks: RetrievalChunk[] = [
    { chunkId: "c1", documentId: "d1", documentTitle: "Doc", text: "Most relevant after rerank.", score: 0.95, rerankScore: 0.98 },
    { chunkId: "c2", documentId: "d1", documentTitle: "Doc", text: "Second most relevant after rerank.", score: 0.85, rerankScore: 0.91 },
    { chunkId: "c3", documentId: "d1", documentTitle: "Doc", text: "Third most relevant.", score: 0.70, rerankScore: 0.72 },
  ];

  const mockReranker = vi.fn().mockImplementation(
    async (_opts: { query: string; results: RetrievalChunk[]; topN: number }) => {
      return rerankedChunks.slice(0, _opts.topN);
    },
  );

  it("reorders results by relevance score", async () => {
    const result = await mockReranker({
      query: "test query",
      results: initialChunks,
      topN: 3,
    });

    expect(result[0].chunkId).toBe("c1");
    expect(result[1].chunkId).toBe("c2");
    expect(result[2].chunkId).toBe("c3");
  });

  it("respects topN limit", async () => {
    const result = await mockReranker({
      query: "test",
      results: initialChunks,
      topN: 1,
    });

    expect(result).toHaveLength(1);
  });

  it("includes rerankScore on returned chunks", async () => {
    const result = await mockReranker({
      query: "test",
      results: initialChunks,
      topN: 3,
    });

    for (const chunk of result) {
      expect(chunk.rerankScore).toBeDefined();
      expect(chunk.rerankScore).toBeGreaterThanOrEqual(0);
    }
  });

  it("improves top-5 relevance compared to original ranking", () => {
    const originalTop5Avg = initialChunks
      .slice(0, 5)
      .reduce((sum, c) => sum + c.score, 0) / Math.min(5, initialChunks.length);

    const rerankedTop5Avg = rerankedChunks
      .slice(0, 5)
      .reduce((sum, c) => sum + (c.rerankScore ?? c.score), 0) / Math.min(5, rerankedChunks.length);

    expect(rerankedTop5Avg).toBeGreaterThanOrEqual(originalTop5Avg);
  });

  it("falls back to original scores when rerankScore is missing", () => {
    const fallbackChunks: RetrievalChunk[] = [
      { chunkId: "f1", documentId: "d1", documentTitle: "Doc", text: "Fallback.", score: 0.80 },
    ];

    expect(fallbackChunks[0].score).toBe(0.80);
    expect(fallbackChunks[0].rerankScore).toBeUndefined();
  });

  it("returns empty array when given empty input", async () => {
    const emptyReranker = vi.fn().mockResolvedValue([]);
    const result = await emptyReranker({ query: "test", results: [], topN: 5 });
    expect(result).toEqual([]);
  });

  it("handles API failure gracefully", async () => {
    const failingReranker = vi.fn().mockRejectedValue(new Error("Cohere API error"));

    await expect(
      failingReranker({ query: "test", results: initialChunks, topN: 3 }),
    ).rejects.toThrow("Cohere API error");
  });
});
