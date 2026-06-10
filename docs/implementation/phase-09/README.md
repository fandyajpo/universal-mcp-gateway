# Phase 09: AI Gateway

> Build the unified AI gateway that routes requests to appropriate models through OpenRouter with cost control, rate limiting, streaming, and reliability guarantees.

---

## Objective

Implement the central AI orchestration layer that decouples the application from specific model providers. The AI Gateway handles model selection, provider abstraction, streaming, fallback on failure, cost tracking, rate limiting, and prompt management. Every AI interaction in the platform — chat, embedding, tool calls — flows through this gateway.

## Scope

| In Scope | Out of Scope |
|---|---|
| OpenRouter client with retry, timeout, error handling | Direct provider API integration (bypassing OpenRouter) |
| Provider abstraction layer for multi-provider support | Provider health monitoring dashboard |
| Model router selecting cheapest capable model by task type | Auto-scaling model endpoints |
| Streaming via Server-Sent Events (SSE) with backpressure | WebSocket streaming transport |
| Fallback chain on provider/model failure | Semantic caching of LLM responses |
| Per-request and per-workspace cost tracking | Budget enforcement alerts (Phase 14) |
| Rate limiting with token bucket algorithm | Distributed rate limit sync across regions |
| Prompt template system with variable interpolation | Prompt versioning database |
| Request/response logging for audit and debugging | Prompt injection detection ML model |
| Content moderation pre-filter and post-filter | Real-time moderation dashboard |

## Dependencies

- **Phase 00: Foundation** — Utils package, Logger, Types, Cache (Redis for rate limiting)
- **OpenRouter API** — Primary AI provider gateway

## Expected Outputs

| Artifact | Location |
|---|---|
| OpenRouter client | `packages/ai/src/providers/openrouter.ts` |
| Provider abstraction layer | `packages/ai/src/providers/factory.ts`, `packages/ai/src/providers/types.ts` |
| Model router | `packages/ai/src/router.ts` |
| Stream manager | `packages/ai/src/stream.ts` |
| Fallback chain | `packages/ai/src/fallback.ts` |
| Cost tracker | `packages/ai/src/cost.ts` |
| Rate limiter | `packages/ai/src/rate-limiter.ts` |
| Prompt template system | `packages/ai/src/prompt.ts` |
| Gateway composition | `packages/ai/src/gateway.ts` |
| AI Gateway API routes | `packages/ai/src/api/routes.ts` |
| Verification tests | `packages/ai/src/__tests__/` |

## Architecture Constraints

- All LLM calls go through OpenRouter — never call provider APIs directly
- Model routing strategy: cheapest model capable of the task (defined by capability registry)
- Fallback chain order: primary → secondary → tertiary model with circuit breaker
- Streaming must support cancellation mid-stream
- Rate limiting works at three tiers: global (1000 r/s), per-tenant (100 r/s), per-user (20 r/s)
- Cost records are written asynchronously to MongoDB, never blocking the response
- Prompt templates support `{{variable}}` interpolation with validation for missing variables
- The gateway must be stateless — all state lives in Redis (rate limits) and MongoDB (cost logs)
- All API routes require valid authentication and tenant context
- Streaming responses must flush every 50 ms or every new token, whichever comes first

## Completion Criteria

- [ ] OpenRouter client sends requests and handles responses correctly
- [ ] Provider abstraction supports at least 3 different model families
- [ ] Model router selects appropriate model based on task, cost, and availability
- [ ] Streaming returns SSE-formatted token chunks with proper backpressure
- [ ] Fallback chain activates on 4xx/5xx errors and provider rate limits
- [ ] Cost tracking records accurate token counts and cost estimates
- [ ] Rate limiter correctly enforces all three tiers concurrently
- [ ] Prompt templates interpolate variables and validate required fields
- [ ] Gateway composition exposes a clean, unified API for consumers
- [ ] All tests pass with > 85% coverage on core gateway logic
- [ ] `pnpm typecheck` and `pnpm lint` pass cleanly
