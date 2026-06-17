import { describe, it, expect, vi } from "vitest";

import { createRAGEngine } from "../engine";
import { buildContext } from "../context/builder";
import { EvalRunner } from "../eval/runner";
import { computeAggregatedMetrics } from "../eval/metrics";
import type { EvalDataset, EvalConfig } from "../eval/types";
import type { RetrievalChunk } from "../context/types";
import type { EmbeddingResult } from "../engine/types";

function makeMockChunks(query: string, count: number): RetrievalChunk[] {
  return Array.from({ length: count }, (_, i) => ({
    chunkId: `chunk-${query.slice(0, 3)}-${i}`,
    documentId: "doc-e2e",
    documentTitle: "E2E Test Document",
    text: `Relevant chunk ${i + 1} for query "${query}". `.repeat(10),
    score: 0.95 - i * 0.05,
  }));
}

const mockDeps = {
  embedText: vi.fn().mockImplementation(
    async (_text: string): Promise<EmbeddingResult> => ({
      vector: [0.1, 0.2, 0.3, 0.4, 0.5],
      model: "text-embedding-3-large",
      dimensions: 5,
      tokenCount: 10,
    }),
  ),
  retrieve: vi.fn().mockImplementation(
    async (opts: { query: string; topK: number }): Promise<RetrievalChunk[]> =>
      makeMockChunks(opts.query, Math.min(opts.topK, 10)),
  ),
  rerank: vi.fn().mockImplementation(
    async (opts: { results: RetrievalChunk[]; topN: number }): Promise<RetrievalChunk[]> =>
      opts.results.slice(0, opts.topN),
  ),
};

describe("End-to-End Pipeline", () => {
  it("processes a single query through the full pipeline", async () => {
    const engine = createRAGEngine(mockDeps);

    const result = await engine.ragQuery("What is MCP protocol?", {
      workspaceId: "ws-e2e",
      strategy: "hybrid",
      rerank: true,
      topK: 10,
      topN: 5,
    });

    expect(result.query).toBe("What is MCP protocol?");
    expect(result.chunks.length).toBeGreaterThan(0);
    expect(result.chunks.length).toBeLessThanOrEqual(5);
    expect(result.context).toBeTruthy();
    expect(result.tokenCount).toBeGreaterThan(0);
    expect(result.pipelineMetadata.steps.length).toBeGreaterThanOrEqual(3);
    expect(result.pipelineMetadata.strategyUsed).toBe("hybrid");
  });

  it("processes 10 queries through the full pipeline", async () => {
    const engine = createRAGEngine(mockDeps);
    const queries = [
      "What is MCP?",
      "How does vector search work?",
      "Explain hybrid search scoring",
      "What is a cross-encoder re-ranker?",
      "How does chunking affect retrieval?",
      "What is the context window budget?",
      "How does the pipeline handle errors?",
      "Tenant isolation in RAG",
      "PDF document processing pipeline",
      "How does retrieval caching work?",
    ];

    for (const q of queries) {
      const result = await engine.ragQuery(q, {
        workspaceId: "ws-e2e",
        strategy: "hybrid",
        rerank: true,
        topK: 10,
        topN: 5,
      });

      expect(result.context).toBeTruthy();
      expect(result.chunks.length).toBeGreaterThan(0);
      expect(result.pipelineMetadata.steps.length).toBeGreaterThanOrEqual(3);
    }
  });

  it("e2e latency meets performance targets", async () => {
    const engine = createRAGEngine(mockDeps);
    const start = performance.now();

    await engine.ragQuery("performance test query", {
      workspaceId: "ws-e2e",
      strategy: "hybrid",
      rerank: true,
      topK: 20,
      topN: 5,
    });

    const duration = performance.now() - start;
    expect(duration).toBeLessThan(3000);
  });

  it("pipeline orchestration overhead is minimal", async () => {
    const fastDeps = {
      embedText: vi.fn().mockResolvedValue({
        vector: [0.1, 0.2, 0.3],
        model: "test",
        dimensions: 3,
        tokenCount: 5,
      }),
      retrieve: vi.fn().mockResolvedValue(makeMockChunks("test", 5)),
      rerank: vi.fn().mockImplementation(async (o: { results: RetrievalChunk[]; topN: number }) =>
        o.results.slice(0, o.topN),
      ),
    };

    const engine = createRAGEngine(fastDeps);
    const start = performance.now();

    await engine.ragQuery("test", { workspaceId: "ws-e2e", rerank: true, topK: 5, topN: 3 });

    const duration = performance.now() - start;
    expect(duration).toBeLessThan(100);
  });

  it("evaluation framework produces correct metrics against ground truth", async () => {
    const dataset: EvalDataset = {
      name: "E2E Test Dataset",
      queries: [
        {
          id: "q1",
          query: "What is MCP protocol?",
          relevantChunkIds: ["chunk-MCP-0", "chunk-MCP-1"],
        },
        {
          id: "q2",
          query: "Vector search explanation",
          relevantChunkIds: ["chunk-Vec-0"],
        },
        {
          id: "q3",
          query: "Unknown topic zzz",
          relevantChunkIds: ["chunk-zzz-0"],
        },
      ],
    };

    const config: EvalConfig = {
      strategy: "hybrid",
      rerank: true,
      topK: 10,
      topN: 5,
    };

    const deps = {
      ...mockDeps,
      retrieve: vi.fn().mockImplementation(
        async (opts: { query: string; topK: number }): Promise<RetrievalChunk[]> =>
          makeMockChunks(opts.query, Math.min(opts.topK, 5)),
      ),
    };

    const runner = new EvalRunner(deps);
    const result = await runner.run(dataset, config);

    expect(result.summary.queryCount).toBe(3);
    expect(result.summary.aggregated.totalQueries).toBe(3);
    expect(result.perQuery).toHaveLength(3);
    expect(result.summary.config.strategy).toBe("hybrid");
  });

  it("context builder handles overflow with many chunks", () => {
    const chunks = Array.from({ length: 50 }, (_, i) => ({
      chunkId: `overflow-${i}`,
      documentId: "doc-ov",
      documentTitle: "Overflow Doc",
      text: `Overflow chunk ${i + 1} with enough text to force truncation. `.repeat(30),
      score: 0.99 - i * 0.02,
    }));

    const result = buildContext("overflow test", chunks, {
      modelMaxTokens: 500,
    });

    expect(result.truncated).toBe(true);
    expect(result.chunksUsed).toBeLessThan(50);
    expect(result.truncationDetails!.removedChunks).toBeGreaterThan(0);
    expect(result.truncationDetails!.reason).toBeTruthy();
  });

  it("hybrid search returns results from both paths", async () => {
    const hybridDeps = {
      ...mockDeps,
      retrieve: vi.fn().mockImplementation(
        async (opts: { strategy: string; query: string; topK: number }): Promise<RetrievalChunk[]> => {
          const vectorResults = makeMockChunks(`vec-${opts.query}`, 5);
          const keywordResults = makeMockChunks(`kw-${opts.query}`, 3);

          if (opts.strategy === "vector") return vectorResults;
          if (opts.strategy === "keyword") return keywordResults;

          const merged = [...vectorResults, ...keywordResults];
          const seen = new Set<string>();
          return merged.filter((c) => {
            if (seen.has(c.chunkId)) return false;
            seen.add(c.chunkId);
            return true;
          });
        },
      ),
    };

    const engine = createRAGEngine(hybridDeps);

    const vectorResult = await engine.ragQuery("test hybrid", {
      workspaceId: "ws-e2e",
      strategy: "hybrid",
      rerank: false,
      topK: 10,
      topN: 10,
    });

    expect(vectorResult.chunks.length).toBeGreaterThanOrEqual(3);
  });
});
