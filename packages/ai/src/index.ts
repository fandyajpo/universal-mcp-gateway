// ── OpenRouter Client ───────────────────────────────

export { createOpenRouterClient } from "./providers/openrouter";
export type { OpenRouterClient } from "./providers/openrouter";
export type { OpenRouterConfig } from "./providers/openrouter/types";

export type {
  OpenRouterMessage,
  ChatCompletionRequest,
  ChatCompletionResponse,
  EmbeddingRequest,
  EmbeddingResponse,
  ModelInfo,
} from "./providers/openrouter/types";

export { OpenRouterError } from "./providers/openrouter/errors";

// ── Provider Abstraction ────────────────────────────

export { createProvider, createProviderFromConfig } from "./providers/factory";
export { createOpenRouterProvider } from "./providers/openrouter";
export { ProviderError, CapabilityError, ProviderConfigurationError, ProviderNotFoundError } from "./providers/errors";
export type { Provider } from "./providers/provider";

export type {
  ProviderType,
  ProviderConfig,
  ProviderCapability,
  ProviderMetadata,
  ChatMessage,
  ChatRequest,
  ChatChoice,
  ChatResponse,
  StreamChoice,
  StreamChunk,
  EmbedRequest,
  EmbeddingData,
  EmbedResponse,
  Model,
} from "./providers/types";

// ── Model Router ────────────────────────────────────

export { createRouter } from "./router";
export type { Router } from "./router";

export type {
  RouteRequest,
  RouteResult,
  ModelRegistryEntry,
  TaskType,
  HealthStatus,
  TierConfig,
  RouterConfig,
  TierName,
} from "./router/types";

// ── Fallback & Circuit Breaker ──────────────────────

export { createFallbackChain } from "./fallback";
export type {
  FallbackChain,
  FallbackChainOptions,
  FallbackChainResult,
  FallbackConfig,
  FallbackResult,
} from "./fallback";
export type {
  CircuitBreakerState,
  CircuitState,
} from "./fallback/types";

export {
  getCircuitState,
  recordFailure,
  recordSuccess,
  resetCircuit,
} from "./fallback/circuit-breaker";

// ── Cost Tracker ────────────────────────────────────

export { createCostTracker, computeCost, toCostRecord } from "./cost";
export type { CostStorage, CostTracker } from "./cost";
export type { AiCostRecordInput, AiCostRecord, PricingEntry, CostBreakdown, DailyCostPoint } from "./cost/types";
export { getPricing, calculateCost, estimateCost, getModelPricingList } from "./cost/pricing";
export { createCostAggregationService } from "./cost/aggregation";
export type { CostAggregationService } from "./cost/aggregation";

// ── Provider Integration ───────────────────────────

export { withCostTracking } from "./providers/provider";
export type { CostRecordInput } from "./providers/provider";

// ── Rate Limiter ────────────────────────────────────

export { createRateLimiter } from "./rate-limiter";
export type { RateLimiter } from "./rate-limiter";
export type { RateLimitResult, RateLimitConfig, RateLimitTier, RateLimitTierConfig, RateLimitCheckOptions } from "./rate-limiter/types";

// ── Prompt Template System ──────────────────────────

export { createPromptRegistry, compileTemplate, createPromptEngine, estimateTokens, BUILT_IN_TEMPLATES } from "./prompt";
export type { PromptRegistry, PromptEngine, CompiledTemplate, Template, TemplateVariable, RenderOptions, RenderResult } from "./prompt";

// ── Stream Manager ──────────────────────────────────

export { createStream, formatStreamEvent, formatEventStream } from "./stream";
export type {
  StreamEvent,
  StreamOptions,
  StreamHandle,
  TokenUsage,
  Citation,
} from "./stream/types";
