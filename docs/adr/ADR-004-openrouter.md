# ADR-004: OpenRouter

## Status

Accepted

## Context

The platform needs to support multiple AI models across different providers (OpenAI, Anthropic, Google, Meta, Mistral) with fallback, cost tracking, and unified interfaces.

## Decision

Use OpenRouter as the AI provider gateway for all LLM and embedding API calls.

## Rationale

- **Multi-provider access** — single API provides access to 200+ models across 20+ providers
- **Automatic fallbacks** — configure model fallback chains that activate on failure or rate limits
- **Cost tracking** — per-request cost reporting enables accurate usage-based billing
- **Streaming support** — SSE streaming compatible with OpenAI's streaming format
- **Standardized API** — OpenAI-compatible API interface works with existing tooling and libraries
- **No vendor lock-in** — can switch to direct provider access at any time by swapping the base URL
- **Rate limit abstraction** — OpenRouter manages provider-specific rate limits and retries
- **Credits system** — prepaid credits avoid per-provider billing complexity during development

## Trade-offs

- Additional latency (proxy hop) compared to direct provider API calls
- Dependency on a third-party service for critical AI infrastructure
- Potential single point of failure — if OpenRouter is down, all AI features are affected
- Less control over provider-specific features (e.g., Anthropic's extended thinking)

## Rejected Alternatives

- **Direct provider APIs** — requires managing multiple API clients, authentication, rate limits, billing, and fallback logic independently. Significant engineering overhead
- **Azure OpenAI Service** — excellent enterprise features but limited to OpenAI models
- **AWS Bedrock** — good multi-provider support but complex pricing, AWS lock-in, and limited model selection
- **Self-hosted proxy (LiteLLM)** — open-source alternative but adds deployment, maintenance, and scaling overhead. Suitable for future on-premise enterprise deployments but too early for MVP
- **LangChain** — higher-level abstraction that adds unnecessary complexity and dependency weight for the gateway layer

## Consequences

- All AI model access goes through `@repo/ai` which wraps OpenRouter's API
- The `AIProvider` interface abstracts OpenRouter, enabling direct provider swaps later
- Cost tracking is built into the AI Gateway for billing integration
- Fallback chains are configured per-model in the gateway configuration
