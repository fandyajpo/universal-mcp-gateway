import { createLogger } from "@repo/logger";

const timingLogger = createLogger("database:query");

export async function withQueryTiming<T>(
  operation: string,
  fn: () => Promise<T>,
): Promise<T> {
  const start = performance.now();
  try {
    return await fn();
  } finally {
    const durationMs = performance.now() - start;
    if (durationMs > 200) {
      timingLogger.error({ operation, durationMs: Math.round(durationMs) }, "Slow query");
    } else if (durationMs > 50) {
      timingLogger.warn({ operation, durationMs: Math.round(durationMs) }, "Slow query");
    }
  }
}
