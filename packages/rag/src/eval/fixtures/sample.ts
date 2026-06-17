import { createDataset } from "../dataset";
import type { EvalDataset } from "../types";

export function loadSampleDataset(): EvalDataset {
  return createDataset(
    "Sample Eval Dataset",
    [
      {
        id: "mcp-intro",
        query: "What is the Model Context Protocol and how does it work?",
        relevantChunkIds: [
          "chunk-mcp-intro-1",
          "chunk-mcp-intro-2",
          "chunk-mcp-arch-1",
        ],
      },
      {
        id: "vector-search-basics",
        query: "How does vector search work for semantic document retrieval?",
        relevantChunkIds: [
          "chunk-vector-embed-1",
          "chunk-vector-search-1",
          "chunk-vector-index-1",
        ],
      },
      {
        id: "hybrid-search-scoring",
        query: "How are vector and keyword search scores combined in hybrid search?",
        relevantChunkIds: [
          "chunk-hybrid-scoring-1",
          "chunk-hybrid-normalization-1",
          "chunk-hybrid-rrf-1",
        ],
      },
      {
        id: "re-ranker-cross-encoder",
        query: "What is a cross-encoder re-ranker and when should I use one?",
        relevantChunkIds: [
          "chunk-reranker-cross-1",
          "chunk-reranker-cohere-1",
          "chunk-reranker-latency-1",
        ],
      },
      {
        id: "chunking-strategies",
        query: "What chunking strategies work best for PDF documents?",
        relevantChunkIds: [
          "chunk-chunking-sliding-1",
          "chunk-chunking-semantic-1",
          "chunk-chunking-recursive-1",
        ],
      },
      {
        id: "context-window",
        query: "How does the context window builder allocate token budget across sections?",
        relevantChunkIds: [
          "chunk-context-budget-1",
          "chunk-context-format-1",
          "chunk-context-truncation-1",
        ],
      },
      {
        id: "atlas-vector-index",
        query: "How do I create a MongoDB Atlas vector search index for embeddings?",
        relevantChunkIds: [
          "chunk-atlas-index-config-1",
          "chunk-atlas-index-creation-1",
          "chunk-atlas-vector-pipeline-1",
        ],
      },
      {
        id: "rag-engine-pipeline",
        query: "What steps does the RAG engine pipeline execute in order?",
        relevantChunkIds: [
          "chunk-engine-pipeline-1",
          "chunk-engine-steps-1",
        ],
      },
      {
        id: "embedding-models",
        query: "What embedding models are supported and how do they differ?",
        relevantChunkIds: [
          "chunk-embedding-models-1",
          "chunk-embedding-dimensions-1",
        ],
      },
      {
        id: "tenant-isolation",
        query: "How does the system isolate data between different workspaces?",
        relevantChunkIds: [
          "chunk-tenant-workspace-1",
          "chunk-tenant-filtering-1",
        ],
      },
      {
        id: "pdf-processing",
        query: "How are PDF documents processed and chunked for ingestion?",
        relevantChunkIds: [
          "chunk-pdf-extraction-1",
          "chunk-pdf-ocr-1",
          "chunk-pdf-chunking-1",
        ],
      },
      {
        id: "retrieval-caching",
        query: "How does the retrieval cache work and what is its TTL?",
        relevantChunkIds: [
          "chunk-cache-retrieval-1",
          "chunk-cache-invalidation-1",
        ],
      },
      {
        id: "reranker-cache",
        query: "How is the re-ranker cache separate from the retrieval cache?",
        relevantChunkIds: [
          "chunk-cache-reranker-1",
          "chunk-cache-difference-1",
        ],
      },
      {
        id: "hybrid-normalization",
        query: "What normalization technique is used when merging vector and keyword scores?",
        relevantChunkIds: [
          "chunk-hybrid-normalization-1",
        ],
      },
      {
        id: "metadata-filtering",
        query: "Can I filter vector search results by document metadata like author or date?",
        relevantChunkIds: [
          "chunk-metadata-filter-1",
          "chunk-metadata-pre-filter-1",
        ],
      },
      {
        id: "api-routes-rag",
        query: "What API endpoints are available for the RAG system?",
        relevantChunkIds: [
          "chunk-api-query-1",
          "chunk-api-status-1",
          "chunk-api-reindex-1",
        ],
      },
      {
        id: "conversation-history",
        query: "How does the context builder use conversation history in its token allocation?",
        relevantChunkIds: [
          "chunk-context-history-1",
          "chunk-context-budget-1",
        ],
      },
      {
        id: "system-instructions",
        query: "How are system instructions guaranteed space in the context window?",
        relevantChunkIds: [
          "chunk-context-instructions-1",
        ],
      },
      {
        id: "error-handling-pipeline",
        query: "How does the pipeline handle errors in non-critical steps?",
        relevantChunkIds: [
          "chunk-engine-error-1",
          "chunk-engine-recovery-1",
        ],
      },
      {
        id: "query-normalization",
        query: "What middleware transforms user queries before they enter the pipeline?",
        relevantChunkIds: [
          "chunk-middleware-normalizer-1",
        ],
      },
    ],
    "Synthetic dataset for evaluating retrieval quality across RAG engine features",
  );
}
