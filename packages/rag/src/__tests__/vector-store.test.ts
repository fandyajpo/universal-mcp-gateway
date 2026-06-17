import { describe, it, expect, vi } from "vitest";

import type { RetrievalChunk } from "../context/types";

describe("Vector Store operations (contract)", () => {
  const mockChunks: RetrievalChunk[] = [
    {
      chunkId: "chunk-1",
      documentId: "doc-1",
      documentTitle: "Test Doc",
      text: "Vector search enables semantic document retrieval.",
      score: 0.92,
    },
  ];

  const mockVectorStore = {
    upsertChunks: vi.fn().mockResolvedValue({ inserted: 2, updated: 0 }),
    deleteChunks: vi.fn().mockResolvedValue({ deleted: 1 }),
    deleteDocumentChunks: vi.fn().mockResolvedValue({ deleted: 5 }),
    getChunksByDocumentId: vi.fn().mockResolvedValue(mockChunks),
  };

  it("upsertChunks inserts and updates embeddings", async () => {
    const result = await mockVectorStore.upsertChunks(mockChunks);
    expect(result.inserted).toBe(2);
    expect(result.updated).toBe(0);
  });

  it("deleteChunks removes specific chunks by ID", async () => {
    const result = await mockVectorStore.deleteChunks(["chunk-1"]);
    expect(result.deleted).toBe(1);
  });

  it("deleteDocumentChunks removes all chunks for a document", async () => {
    const result = await mockVectorStore.deleteDocumentChunks("doc-1");
    expect(result.deleted).toBe(5);
  });

  it("getChunksByDocumentId returns all chunks for a document", async () => {
    const result = await mockVectorStore.getChunksByDocumentId("doc-1");
    expect(result).toHaveLength(1);
    expect(result[0].chunkId).toBe("chunk-1");
  });

  it("getChunksByDocumentId returns empty array for unknown document", async () => {
    const store = {
      ...mockVectorStore,
      getChunksByDocumentId: vi.fn().mockResolvedValue([]),
    };
    const result = await store.getChunksByDocumentId("unknown");
    expect(result).toEqual([]);
  });
});
