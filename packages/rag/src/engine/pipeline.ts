import type { Tracer } from "./tracer";
import type { PipelineStep, PipelineContext } from "./types";
import { createLogger } from "@repo/logger";

const logger = createLogger("rag/engine/pipeline");

export async function executeSteps(
  steps: PipelineStep<unknown, unknown>[],
  initialInput: unknown,
  context: PipelineContext,
  tracer: Tracer,
): Promise<unknown> {
  let current = initialInput;

  for (const step of steps) {
    tracer.startStep(step.name);

    try {
      current = await step.execute(current, context);
      tracer.completeStep(step.name, true);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      tracer.completeStep(step.name, false, message);

      if (step.required) {
        logger.error({ step: step.name, error: message }, "Critical pipeline step failed");
        throw err;
      }

      logger.warn({ step: step.name, error: message }, "Non-critical pipeline step failed, continuing");
    }
  }

  return current;
}
