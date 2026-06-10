# Phase 08: RAG Engine

> Build the retrieval-augmented generation engine with hybrid search, re-ranking, context assembly, and evaluatio.

---

## Objective

Implement a complete RAG pipeline that combines vector similarity search with keyword-based full-text search, re-ranks results using a cross-encoder model, builds optimized context windows for LLM consumption, and provides evaluation tooling for retrieval quality. This phase is the core intelligence layer that powers the Chat (Phase 12) and all knowledge-grounded AI interactions.

## Scope

| In Scope | Out of Scope |
|---|---|
| MongoDB Atlas Vector Search index creation and management | Fine-tuning embedding or cross-encoder models |
| Vector store service (CRUD for embedding vectors) | Real-time index updates for streaming data |
| Retriever service (vector, keyword, hybrid) | Multi-modal retrieval (image, audio) |
| Hybrid search combining vector + keyword scores | Graph-based retrieval |
| Re-ranker using cross-encoder model | Personalization or user-specific ranking |
| Context window builder with token budget management | Query decomposition or multi-hop retrieval |
| RAG Engine composition and orchestration | Agentic RAG (handled in later phase) |
| RAG API routes for query and document ingestion | Streaming retrieval responses |
| Retrieval evaluation (hit rate, MRR, NDCG) | Online A/B testing framework |
| Metadata filtering and tenant-scoped access control | Index optimization automation |

## Dependencies

- **Phase 07: Embedding** — Embedding service for generating vectors
- **Phase 04: Database** — MongoDB Atlas connection, repository pattern, index strategy
- **Phase 05: Storage** — Document content retrieval from R2
- **Phase 09: AI Gateway** (soft dependency for generation — RAG can be verified without it)

## Expected Outputs

| Artifact | Location |
|---|---|
| Vector Search index definition | `packages/database/src/indexes/vector-search.ts` |
| Vector store service | `packages/rag/src/vector-store/service.ts` |
| Retriever service | `packages/rag/src/retriever/service.ts` |
| Hybrid search engine | `packages/rag/src/retriever/hybrid.ts` |
| Re-ranker service | `packages/rag/src/retriever/reranker.ts` |
| Context window builder | `packages/rag/src/context/builder.ts` |
| RAG Engine composition | `packages/rag/src/engine.ts` |
| RAG API routes | `packages/rag/src/api/routes.ts` |
| Retrieval evaluation framework | `packages/rag/src/eval/` |
| Verification tests | `packages/rag/src/__tests__/` |

## Architecture Constraints

- Vector Search index must use cosine similarity with 3072 dimensions (matching text-embedding-3-large)
- Hybrid search weight: 0.7 vector + 0.3 keyword (configurable per query)
- Re-ranker evaluates top K=20 candidates, returns top N=5
- Context window allocation: 70% retrieved content, 30% instructions + conversation history
- All retrieval is tenant-scoped — every query includes a mandatory `workspaceId` filter
- Document-level access control enforced in the retriever layer
- Caching layer for frequent queries keyed by embedding hash + query hash
- Vector store uses bulk write operations for efficiency during indexing
- The RAG Engine must support pluggable retrievers for future extensibility
- All API routes require authentication and workspace membership

## Completion Criteria

- [ ] Vector Search index created and queryable in MongoDB Atlas
- [ ] Vector store service supports insert, upsert, delete, and batch operations
- [ ] Retriever returns relevant chunks for both vector and keyword queries
- [ ] Hybrid search correctly combines vector and keyword scores
- [ ] Re-ranker improves top-5 relevance over raw retrieval
- [ ] Context window builder respects token budget and truncates appropriately
- [ ] RAG Engine orchestrates full pipeline end-to-end
- [ ] API routes respond within 500 ms p95 for retrieval queries
- [ ] Evaluation framework computes hit rate, MRR, NDCG correctly
- [ ] All tests pass with > 85% coverage on core RAG pipeline
- [ ] `pnpm typecheck` and `pnpm lint` pass cleanly
