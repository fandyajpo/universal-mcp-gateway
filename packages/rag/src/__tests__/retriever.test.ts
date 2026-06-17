import { describe, it, expect, vi } from "vitest";

import type { RetrievalChunk } from "../context/types";

describe("Retriever (contract)", () => {
  const mockChunks: RetrievalChunk[] = [
    {
      chunkId: "c1",
      documentId: "d1",
      documentTitle: "MCP Overview",
      text: "MCP is the Model Context Protocol for AI tool integration.",
      score: 0.93,
    },
    {
      chunkId: "c2",
      documentId: "d1",
      documentTitle: "MCP Overview",
      text: "MCP uses JSON-RPC for communication between hosts and tools.",
      score: 0.87,
    },
  ];

  const mockRetriever = {
    retrieve: vi.fn().mockImplementation(
      async (opts: {
        query: string;
        vector: number[];
        workspaceId: string;
        topK: number;
        strategy: "vector" | "hybrid";
        filters: Record<string, unknown>;
        documentIds: string[];
      }) => {
        if (opts.workspaceId === "other-ws") return [];
        return mockChunks.slice(0, opts.topK);
      },
    ),
  };

  it("returns relevant chunks for valid query", async () => {
    const result = await mockRetriever.retrieve({
      query: "What is MCP?",
      vector: [0.1, 0.2, 0.3],
      workspaceId: "ws-1",
      topK: 5,
      strategy: "hybrid",
      filters: {},
      documentIds: [],
    });

    expect(result).toHaveLength(2);
    expect(result[0].chunkId).toBe("c1");
  });

  it("enforces tenant isolation", async () => {
    const result = await mockRetriever.retrieve({
      query: "What is MCP?",
      vector: [0.1, 0.2, 0.3],
      workspaceId: "other-ws",
      topK: 5,
      strategy: "vector",
      filters: {},
      documentIds: [],
    });

    expect(result).toEqual([]);
  });

  it("respects topK limit", async () => {
    const result = await mockRetriever.retrieve({
      query: "test",
      vector: [0.1, 0.2, 0.3],
      workspaceId: "ws-1",
      topK: 1,
      strategy: "vector",
      filters: {},
      documentIds: [],
    });

    expect(result).toHaveLength(1);
  });

  it("returns results sorted by score descending", () => {
    const chunks = [...mockChunks].sort((a, b) => b.score - a.score);
    expect(chunks[0].score).toBeGreaterThanOrEqual(chunks[1].score);
  });

  it("applies metadata filters when provided", async () => {
    const retrieverWithFilter = {
      retrieve: vi.fn().mockImplementation(
        async (opts: { filters: Record<string, unknown> }) => {
          if (opts.filters.source === "pdf") return mockChunks;
          return [];
        },
      ),
    };

    const withFilter = await retrieverWithFilter.retrieve({
      query: "test",
      vector: [],
      workspaceId: "ws-1",
      topK: 5,
      strategy: "vector",
      filters: { source: "pdf" },
      documentIds: [],
    });

    const withoutFilter = await retrieverWithFilter.retrieve({
      query: "test",
      vector: [],
      workspaceId: "ws-1",
      topK: 5,
      strategy: "vector",
      filters: {},
      documentIds: [],
    });

    expect(withFilter).toHaveLength(2);
    expect(withoutFilter).toEqual([]);
  });
});
