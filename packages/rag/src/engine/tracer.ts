import type { StepMetadata, PipelineMetadata } from "./types";
import { createLogger } from "@repo/logger";

const logger = createLogger("rag/engine/tracer");

export interface Tracer {
  startStep(name: string): void;
  completeStep(name: string, success: boolean, error?: string): void;
  getMetadata(): PipelineMetadata;
}

export function createTracer(strategyUsed: "vector" | "hybrid"): Tracer {
  const steps: StepMetadata[] = [];
  const startedAt = Date.now();
  let stepStartedAt = 0;

  return {
    startStep(_name: string): void {
      stepStartedAt = Date.now();
    },

    completeStep(name: string, success: boolean, error?: string): void {
      const durationMs = Date.now() - stepStartedAt;
      steps.push({ name, durationMs, success, error });

      logger.info(
        { step: name, durationMs, success, error },
        `Pipeline step ${success ? "completed" : "failed"}`,
      );
    },

    getMetadata(): PipelineMetadata {
      return {
        steps: [...steps],
        totalDurationMs: Date.now() - startedAt,
        strategyUsed,
        modelUsed: undefined,
      };
    },
  };
}
