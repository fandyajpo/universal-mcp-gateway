# Phase 07: Embedding

> Implement the embedding pipeline to convert extracted text chunks into vector representations using OpenRouter's model gateway.

---

## Objective

Build a production-grade embedding service that takes text chunks (from Phase 06 PDF processing or direct input), generates vector embeddings via OpenRouter, handles rate limits and batching, caches results for efficiency, tracks costs per workspace, and validates embedding quality. The output feeds directly into Phase 08 (RAG Engine) for vector index population.

## Scope

| In Scope | Out of Scope |
|---|---|
| OpenRouter client integration for embedding models | Self-hosted embedding model deployment |
| Batch processing with configurable batch sizes | Real-time embedding for streaming content |
| Rate limit handling with exponential backoff and queue management | Embedding model fine-tuning |
| LRU embedding cache with configurable TTL via Upstash Redis | Cross-modal embeddings (image, audio) |
| Cost tracking per workspace per model per request | Budget enforcement (handled in Phase 09) |
| Embedding validation (dimensionality check, normalization, NaN detection) | Embedding visualization tools |
| Incremental embedding for document updates | Embedding compression or quantization |
| Concurrent embedding with controlled parallelism | Multi-modal embedding fusion |

## Dependencies

- **Phase 06: PDF Processing** — Text chunks output from PDF chunker
- **Phase 00: Foundation** — Utils package, Cache package (Redis), Logger, Types
- **OpenRouter API** — Embedding model access (text-embedding-3-large primary, voyage-code-2 fallback)

## Expected Outputs

| Artifact | Location |
|---|---|
| Embedding service | `packages/rag/src/embedding/service.ts` |
| Batch processing pipeline | `packages/rag/src/embedding/batcher.ts` |
| Rate limit handler | `packages/rag/src/embedding/rate-limiter.ts` |
| Embedding cache | `packages/rag/src/embedding/cache.ts` |
| Cost tracker | `packages/rag/src/embedding/cost.ts` |
| Embedding validator | `packages/rag/src/embedding/validator.ts` |
| Embedding types | `packages/rag/src/embedding/types.ts` |
| Verification tests | `packages/rag/src/embedding/__tests__/` |

## Architecture Constraints

- Embedding calls must be routed through OpenRouter (not direct to OpenAI) for unified billing
- Primary embedding model: `text-embedding-3-large` (3072 dimensions). Fallback: `voyage-code-2` (1536 dimensions)
- Batch size must be configurable (default 32) — never exceed API limits
- Embedding cache key is a SHA-256 hash of the text content + model name
- Rate limiter must handle 429 responses with Retry-After header respect
- Cost tracking records are written asynchronously to MongoDB — never block the embedding response
- Embedding validation checks: dimensionality matches expected, vector is unit-normalized, no NaN/Inf values
- Concurrent embedding limited to 5 in-flight requests per worker
- All embedding operations are tenant-scoped via injected workspace ID

## Completion Criteria

- [ ] Embedding service generates vectors correctly via OpenRouter
- [ ] Batch processing handles groups of up to 32 chunks efficiently
- [ ] Rate limit handler backs off and retries correctly on 429 responses
- [ ] Cache hit returns cached embedding within < 5 ms
- [ ] Cost tracking records are written to MongoDB with accurate token counts
- [ ] Validation catches and logs malformed embeddings
- [ ] Incremental embedding skips already-embedded unchanged chunks
- [ ] All tests pass with > 90% coverage on embedding pipeline
- [ ] `pnpm typecheck` and `pnpm lint` pass cleanly
