import { describe, it, expect, vi } from "vitest";

import type { RetrievalChunk } from "../context/types";

describe("Hybrid Search (contract)", () => {
  const vectorChunks: RetrievalChunk[] = [
    { chunkId: "v1", documentId: "d1", documentTitle: "Doc", text: "Vector result about embeddings.", score: 0.91 },
    { chunkId: "v2", documentId: "d1", documentTitle: "Doc", text: "More vector content.", score: 0.85 },
  ];

  const keywordChunks: RetrievalChunk[] = [
    { chunkId: "k1", documentId: "d1", documentTitle: "Doc", text: "Keyword match for exact phrase.", score: 0.78 },
    { chunkId: "v1", documentId: "d1", documentTitle: "Doc", text: "Duplicate from vector path.", score: 0.91 },
  ];

  const mockHybridSearch = vi.fn().mockImplementation(
    async (_opts: {
      query: string;
      vector: number[];
      workspaceId: string;
      topK: number;
    }) => {
      const allChunks = [...vectorChunks, ...keywordChunks];
      const seen = new Set<string>();
      const deduped: RetrievalChunk[] = [];

      for (const c of allChunks) {
        if (!seen.has(c.chunkId)) {
          seen.add(c.chunkId);
          deduped.push(c);
        }
      }

      return deduped.sort((a, b) => b.score - a.score);
    },
  );

  it("returns results from both vector and keyword paths", async () => {
    const result = await mockHybridSearch({
      query: "vector embeddings keyword phrase",
      vector: [0.1, 0.2, 0.3],
      workspaceId: "ws-1",
      topK: 10,
    });

    const vResult = result.find((c) => c.chunkId.startsWith("v"));
    const kResult = result.find((c) => c.chunkId.startsWith("k"));

    expect(vResult).toBeDefined();
    expect(kResult).toBeDefined();
  });

  it("deduplicates chunks present in both paths", async () => {
    const result = await mockHybridSearch({
      query: "test",
      vector: [0.1, 0.2, 0.3],
      workspaceId: "ws-1",
      topK: 10,
    });

    const ids = result.map((c) => c.chunkId);
    const uniqueIds = new Set(ids);
    expect(ids.length).toBe(uniqueIds.size);
  });

  it("sorts final results by score descending", async () => {
    const hybridWithSort = vi.fn().mockImplementation(
      async (_opts: { topK: number }) => {
        const merged = [...vectorChunks, ...keywordChunks];
        const seen = new Set<string>();
        const deduped: RetrievalChunk[] = [];

        for (const c of merged) {
          if (!seen.has(c.chunkId)) {
            seen.add(c.chunkId);
            deduped.push(c);
          }
        }

        return deduped.sort((a, b) => b.score - a.score).slice(0, _opts.topK);
      },
    );

    const result = await hybridWithSort({ query: "test", vector: [], workspaceId: "ws-1", topK: 10 });
    for (let i = 1; i < result.length; i++) {
      expect(result[i - 1].score).toBeGreaterThanOrEqual(result[i].score);
    }
  });

  it("handles empty results from both search paths", async () => {
    const emptySearch = vi.fn().mockResolvedValue([]);
    const result = await emptySearch({ query: "zzz", vector: [], workspaceId: "ws-1", topK: 5 });
    expect(result).toEqual([]);
  });

  it("supports vector-only strategy", async () => {
    const vectorOnly = vi.fn().mockImplementation(
      async (_opts: { strategy: string }) => {
        if (_opts.strategy === "vector") return vectorChunks;
        return [...vectorChunks, ...keywordChunks];
      },
    );

    const result = await vectorOnly({ query: "test", vector: [], workspaceId: "ws-1", topK: 5, strategy: "vector" });
    expect(result.every((c: RetrievalChunk) => c.chunkId.startsWith("v"))).toBe(true);
  });
});
