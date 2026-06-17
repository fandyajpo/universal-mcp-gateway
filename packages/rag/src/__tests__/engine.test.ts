import { describe, it, expect, vi } from "vitest";

import { createRAGEngine } from "../engine";
import type { EmbeddingResult } from "../engine/types";
import type { RetrievalChunk } from "../context/types";

const sampleChunks: RetrievalChunk[] = [
  {
    chunkId: "c1",
    documentId: "d1",
    documentTitle: "Doc 1",
    text: "Relevant information about MCP protocol.",
    score: 0.95,
  },
  {
    chunkId: "c2",
    documentId: "d1",
    documentTitle: "Doc 1",
    text: "More details about vector search.",
    score: 0.88,
  },
];

const embedResult: EmbeddingResult = {
  vector: [0.1, 0.2, 0.3],
  model: "text-embedding-3-large",
  dimensions: 3,
  tokenCount: 5,
};

function makeDeps() {
  return {
    embedText: vi.fn().mockResolvedValue(embedResult),
    retrieve: vi.fn().mockResolvedValue(sampleChunks),
    rerank: vi.fn().mockResolvedValue(sampleChunks),
  };
}

describe("createRAGEngine", () => {
  it("returns engine with ragQuery function", () => {
    const engine = createRAGEngine(makeDeps());
    expect(engine).toHaveProperty("ragQuery");
    expect(typeof engine.ragQuery).toBe("function");
  });

  it("executes full pipeline and returns RAGResult", async () => {
    const deps = makeDeps();
    const engine = createRAGEngine(deps);

    const result = await engine.ragQuery("test query", {
      workspaceId: "ws-1",
    });

    expect(result.query).toBe("test query");
    expect(result.context).toBeTruthy();
    expect(result.chunks).toHaveLength(2);
    expect(result.tokenCount).toBeGreaterThan(0);
    expect(result.pipelineMetadata).toBeDefined();
    expect(result.pipelineMetadata.steps).toHaveLength(4);
  });

  it("includes allChunks in result", async () => {
    const deps = makeDeps();
    const engine = createRAGEngine(deps);

    const result = await engine.ragQuery("test", {
      workspaceId: "ws-1",
      topK: 20,
      topN: 5,
    });

    expect(result.allChunks).toHaveLength(2);
    expect(result.chunks).toHaveLength(2);
  });

  it("skips reranker step when rerank=false", async () => {
    const deps = makeDeps();
    const engine = createRAGEngine(deps);

    const result = await engine.ragQuery("test", {
      workspaceId: "ws-1",
      rerank: false,
    });

    expect(deps.rerank).not.toHaveBeenCalled();
    expect(result.pipelineMetadata.steps).toHaveLength(3);
  });

  it("includes pipeline metadata with step details", async () => {
    const deps = makeDeps();
    const engine = createRAGEngine(deps);

    const result = await engine.ragQuery("test", {
      workspaceId: "ws-1",
    });

    const meta = result.pipelineMetadata;
    expect(meta.steps.length).toBeGreaterThan(0);

    for (const step of meta.steps) {
      expect(step).toHaveProperty("name");
      expect(step).toHaveProperty("durationMs");
      expect(step).toHaveProperty("success");
    }

    expect(meta.totalDurationMs).toBeGreaterThanOrEqual(0);
  });

  it("propagates errors from required steps", async () => {
    const deps = makeDeps();
    deps.embedText = vi.fn().mockRejectedValue(new Error("Embedding failed"));

    const engine = createRAGEngine(deps);

    await expect(
      engine.ragQuery("test", { workspaceId: "ws-1" }),
    ).rejects.toThrow("Embedding failed");
  });

  it("degrades gracefully when non-critical reranker fails", async () => {
    const deps = makeDeps();
    deps.rerank = vi.fn().mockRejectedValue(new Error("Rerank API error"));

    const engine = createRAGEngine(deps);

    const result = await engine.ragQuery("test", {
      workspaceId: "ws-1",
      rerank: true,
    });

    expect(result.context).toBeTruthy();
    expect(result.chunks).toHaveLength(2);

    const rerankerStep = result.pipelineMetadata.steps.find(
      (s) => s.name === "reranker",
    );
    expect(rerankerStep?.success).toBe(false);
    expect(rerankerStep?.error).toBeDefined();
  });

  it("uses query normalizer middleware by default", async () => {
    const deps = makeDeps();
    const engine = createRAGEngine(deps);

    await engine.ragQuery("<p>clean this</p>", {
      workspaceId: "ws-1",
    });

    const queryArg = deps.embedText.mock.calls[0][0];
    expect(queryArg).not.toContain("<p>");
    expect(queryArg).toContain("clean this");
  });

  it("passes EngineOptions to retrieve", async () => {
    const deps = makeDeps();
    const engine = createRAGEngine(deps);

    await engine.ragQuery("test", {
      workspaceId: "ws-1",
      strategy: "hybrid",
      topK: 30,
      topN: 10,
      filters: { source: "pdf" },
      documentIds: ["doc-1"],
    });

    const retrieveOpts = deps.retrieve.mock.calls[0][0];
    expect(retrieveOpts.workspaceId).toBe("ws-1");
    expect(retrieveOpts.topK).toBe(30);
    expect(retrieveOpts.strategy).toBe("hybrid");
    expect(retrieveOpts.filters).toEqual({ source: "pdf" });
    expect(retrieveOpts.documentIds).toEqual(["doc-1"]);
  });

  it("sets strategyUsed in pipeline metadata", async () => {
    const deps = makeDeps();
    const engine = createRAGEngine(deps);

    const result = await engine.ragQuery("test", {
      workspaceId: "ws-1",
      strategy: "vector",
    });

    expect(result.pipelineMetadata.strategyUsed).toBe("vector");
  });

  it("sets modelUsed in pipeline metadata", async () => {
    const deps = makeDeps();
    const engine = createRAGEngine(deps);

    const result = await engine.ragQuery("test", {
      workspaceId: "ws-1",
    });

    expect(result.pipelineMetadata.modelUsed).toBe("text-embedding-3-large");
  });

  it("passes conversation history and instructions to context builder", async () => {
    const deps = makeDeps();
    const engine = createRAGEngine(deps);

    const result = await engine.ragQuery("test", {
      workspaceId: "ws-1",
      conversationHistory: [{ role: "user", content: "Hello" }],
      systemInstructions: "Be helpful.",
    });

    expect(result.context).toContain("Hello");
    expect(result.context).toContain("Be helpful.");
  });

  it("uses custom middleware when provided", async () => {
    const deps = makeDeps();
    const customMiddleware = vi.fn((q: string) => `PREFIX: ${q}`);
    const engine = createRAGEngine(deps, {
      middleware: [customMiddleware],
    });

    await engine.ragQuery("test", { workspaceId: "ws-1" });

    expect(customMiddleware).toHaveBeenCalledWith("test");
    expect(deps.embedText).toHaveBeenCalledWith("PREFIX: test");
  });
});
