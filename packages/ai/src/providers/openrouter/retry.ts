import { isRetryableError, TimeoutError } from "./errors";
import { createLogger } from "@repo/logger";
import { sleep } from "@repo/utils";

const logger = createLogger("openrouter/retry");

export interface RetryConfig {
  maxRetries?: number;
  initialDelay?: number;
  maxDelay?: number;
  jitter?: boolean;
  timeout?: number;
}

const DEFAULT_RETRY_CONFIG: Required<RetryConfig> = {
  maxRetries: 3,
  initialDelay: 1000,
  maxDelay: 4000,
  jitter: true,
  timeout: 60000,
};

function calculateDelay(attempt: number, config: Required<RetryConfig>): number {
  const delay = Math.min(
    config.initialDelay * Math.pow(2, attempt),
    config.maxDelay,
  );
  if (config.jitter) {
    return Math.round(delay * (0.5 + Math.random() * 0.5));
  }
  return delay;
}

export async function withRetry<T>(
  fn: (signal: AbortSignal) => Promise<T>,
  config?: Partial<RetryConfig>,
): Promise<T> {
  const cfg: Required<RetryConfig> = { ...DEFAULT_RETRY_CONFIG, ...config };

  let lastError: Error | undefined;

  for (let attempt = 0; attempt <= cfg.maxRetries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => { controller.abort(); }, cfg.timeout);

    try {
      const result = await fn(controller.signal);
      clearTimeout(timer);
      return result;
    } catch (error) {
      clearTimeout(timer);

      if (error instanceof Error && error.name === "AbortError") {
        lastError = new TimeoutError(
          `Request timed out after ${cfg.timeout}ms`,
        );
      } else {
        lastError =
          error instanceof Error ? error : new Error(String(error));
      }

      if (isRetryableError(lastError) && attempt < cfg.maxRetries) {
        const delay = calculateDelay(attempt, cfg);
        logger.warn(
          {
            attempt: attempt + 1,
            maxRetries: cfg.maxRetries,
            delay,
            error: lastError.message,
          },
          "Retrying OpenRouter request",
        );
        await sleep(delay);
      } else {
        throw lastError;
      }
    }
  }

  throw lastError ?? new Error("Retry failed after exhausting all attempts");
}
