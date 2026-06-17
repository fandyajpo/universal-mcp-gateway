# Next Step

## Current Position

- **Phase:** 08 (RAG Engine)
- **Step:** 08.09 — Retrieval Evaluation — Complete. Evaluation framework with hit rate, MRR, NDCG, precision, recall; `EvalRunner` with dependency injection; 20-query sample dataset; formatted report output.
- **Progress:** Phases 0-6 complete. Phase 08 Steps 08.06-08.09 complete.

## Next Implementation

**Phase 07 — Embedding Pipeline**

Implement the embedding pipeline: OpenRouter client integration in `@repo/ai`, batch embedding processing, rate limiting, cost tracking, caching, and incremental embedding for document updates.

**Why Phase 07 before Phase 08.01-08.05:**
Steps 08.01 (Vector Search Index), 08.02 (Vector Store), 08.03 (Retriever), 08.04 (Hybrid Search), and 08.05 (Re-ranker) all depend on the embedding service (`embedText`) from Phase 07. The embedding pipeline must be implemented first so the RAG engine's vector search and retrieval layers have a functioning embedding source.

## Dependencies

| Dependency | Status | Notes |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Phase 0 | Done | Foundation complete |
| Phase 1 | Done | Bootstrap complete |
| Phase 2 | Done | Auth complete |
| Phase 3 | Done | Workspace complete |
| Phase 4 | Done | Database complete |
| Phase 5 | Done | Storage complete |
| Phase 6 | Done | PDF Processing complete |
| Phase 7 | Not started | Prerequisite for RAG vector/retrieval steps |
| Phase 8 Step 08.06 | Done | Context Window Builder |
| Phase 8 Step 08.07 | Done | RAG Engine Composition |
| Phase 8 Step 08.08 | Done | RAG API Routes |
| Phase 8 Step 08.09 | Done | Retrieval Evaluation |

## Quick Reference

```bash
pnpm dev --filter @repo/web     # Start web app
pnpm typecheck                   # TypeScript check
pnpm lint                        # ESLint check
pnpm build                       # Build all
pnpm verify                      # Run verification suite
```
