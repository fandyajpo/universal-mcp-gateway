import { createLogger } from "@repo/logger";

import { getCircuitState, recordFailure, recordSuccess } from "./fallback/circuit-breaker";
import { DEFAULT_FALLBACK_CONFIG } from "./fallback/types";
import type { FallbackConfig, FallbackResult } from "./fallback/types";
import { ProviderError } from "./providers/errors";
import type { Router } from "./router";
import { setHealth } from "./router/health";

export type { FallbackConfig, FallbackResult } from "./fallback/types";

const logger = createLogger("fallback");

export interface FallbackChainOptions {
  fallbackConfig?: Partial<FallbackConfig>;
  router: Router;
}

export interface FallbackChainResult<T> {
  result: T;
  fallbackResult: FallbackResult;
}

export interface FallbackChain {
  execute<T>(
    task: (model: string) => Promise<T>,
    taskType: "chat" | "embedding",
    workspaceId: string,
  ): Promise<FallbackChainResult<T>>;
}

function isRetryableError(error: unknown): boolean {
  return error instanceof ProviderError && error.retryable;
}

async function isModelAvailable(
  modelId: string,
  workspaceId: string,
): Promise<boolean> {
  const state = await getCircuitState(workspaceId, modelId);
  if (state === "open") {
    logger.warn({ modelId, workspaceId }, "Circuit breaker open, skipping model");
    return false;
  }
  return true;
}

function resolveFallbackConfig(
  config: Partial<FallbackConfig> | undefined,
): FallbackConfig {
  return {
    chat: config?.chat ?? DEFAULT_FALLBACK_CONFIG.chat,
    embedding: config?.embedding ?? DEFAULT_FALLBACK_CONFIG.embedding,
  };
}

function deriveProvider(modelId: string): string {
  const slashIndex = modelId.indexOf("/");
  return slashIndex === -1 ? "unknown" : modelId.slice(0, slashIndex);
}

export function createFallbackChain(options: FallbackChainOptions): FallbackChain {
  const { router: _router } = options;
  const fallbackConfig = resolveFallbackConfig(options.fallbackConfig);

  async function execute<T>(
    task: (model: string) => Promise<T>,
    taskType: "chat" | "embedding",
    workspaceId: string,
  ): Promise<FallbackChainResult<T>> {
    const fallbackModels = taskType === "chat" ? fallbackConfig.chat : fallbackConfig.embedding;
    const errors: Array<{ model: string; error: string }> = [];

    for (let depth = 0; depth < fallbackModels.length; depth++) {
      const modelId = fallbackModels[depth]!;
      const available = await isModelAvailable(modelId, workspaceId);

      if (!available) {
        errors.push({ model: modelId, error: "circuit_breaker_open" });
        continue;
      }

      try {
        const result = await task(modelId);

        await recordSuccess(workspaceId, modelId);
        setHealth(modelId, "healthy");

        return {
          result,
          fallbackResult: {
            model: modelId,
            provider: deriveProvider(modelId),
            fallbackDepth: depth,
            totalAttempts: depth + 1,
            errors,
          },
        };
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        errors.push({ model: modelId, error: err.message });

        if (isRetryableError(err)) {
          const circuitState = await recordFailure(workspaceId, modelId);
          if (circuitState === "open") {
            setHealth(modelId, "down");
          } else {
            setHealth(modelId, "degraded");
          }
        } else {
          setHealth(modelId, "down");
        }
      }
    }

    throw new AggregateError(
      errors.map((e) => new Error(`${e.model}: ${e.error}`)),
      `Fallback chain exhausted for ${taskType} after ${fallbackModels.length} attempts`,
    );
  }

  return { execute };
}
