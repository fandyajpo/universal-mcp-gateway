export interface FallbackConfig {
  chat: string[];
  embedding: string[];
}

export interface FallbackResult {
  model: string;
  provider: string;
  fallbackDepth: number;
  totalAttempts: number;
  errors: Array<{ model: string; error: string }>;
}

export interface CircuitBreakerState {
  open: boolean;
  failureCount: number;
  lastFailureAt: number;
  openedAt: number;
  halfOpenAttempts: number;
}

export type CircuitState = "closed" | "open" | "half_open";

export const DEFAULT_FALLBACK_CONFIG: FallbackConfig = {
  chat: [
    "anthropic/claude-sonnet-4",
    "openai/gpt-4o",
    "google/gemini-2.0-flash",
    "anthropic/claude-haiku-3.5",
    "openai/gpt-4o-mini",
  ],
  embedding: [
    "openai/text-embedding-3-large",
  ],
};
