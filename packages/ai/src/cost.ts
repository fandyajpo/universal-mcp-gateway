import { calculateCost } from "./cost/pricing";
import type { AiCostRecordInput } from "./cost/types";
import { createLogger } from "@repo/logger";

const logger = createLogger("cost-tracker");

const FLUSH_INTERVAL_MS = 10_000;
const FLUSH_BATCH_SIZE = 100;

export interface CostStorage {
  insertMany(records: Record<string, unknown>[]): Promise<void>;
}

const buffer: AiCostRecordInput[] = [];
let flushTimer: ReturnType<typeof setInterval> | undefined;
let isShuttingDown = false;

function startFlushTimer(flushFn: () => Promise<void>): void {
  if (flushTimer) {
    return;
  }

  const timer = setInterval(() => {
    if (buffer.length > 0) {
      void flushFn().catch((err: unknown) => {
        logger.error({ err }, "Cost buffer flush failed");
      });
    }
  }, FLUSH_INTERVAL_MS);

  timer.unref();
  flushTimer = timer;
}

function makeFlushFn(storage: CostStorage): () => Promise<void> {
  return async () => {
    if (buffer.length === 0) {
      return;
    }

    const records = buffer.splice(0, buffer.length);

    try {
      await storage.insertMany(records as unknown as Record<string, unknown>[]);
      logger.debug({ count: records.length }, "Cost records flushed");
    } catch (error) {
      logger.error({ error, count: records.length }, "Failed to flush cost records");
      buffer.push(...records);
    }
  };
}

export interface CostTracker {
  record(input: AiCostRecordInput): void;

  flush(): Promise<void>;

  shutdown(): Promise<void>;
}

export function createCostTracker(storage: CostStorage): CostTracker {
  const flushFn = makeFlushFn(storage);
  startFlushTimer(flushFn);

  function record(input: AiCostRecordInput): void {
    if (isShuttingDown) {
      logger.warn("Cost tracker is shutting down, dropping record");
      return;
    }

    buffer.push(input);

    if (buffer.length >= FLUSH_BATCH_SIZE) {
      void flushFn().catch((err: unknown) => {
        logger.error({ err }, "Batch flush failed");
      });
    }
  }

  async function flush(): Promise<void> {
    await flushFn();
  }

  async function shutdown(): Promise<void> {
    isShuttingDown = true;

    if (flushTimer) {
      clearInterval(flushTimer);
      flushTimer = undefined;
    }

    await flushFn();
    logger.info("Cost tracker shut down");
  }

  return { record, flush, shutdown };
}

export function computeCost(
  promptTokens: number,
  completionTokens: number,
  model: string,
  cachedTokens?: number,
): number {
  return calculateCost(promptTokens, completionTokens, model, cachedTokens);
}

export function toCostRecord(
  input: Omit<AiCostRecordInput, "cost" | "currency">,
): AiCostRecordInput {
  const cost = computeCost(
    input.promptTokens,
    input.completionTokens,
    input.model,
    input.cachedTokens,
  );

  return { ...input, cost, currency: "USD" };
}
