import { STEP_WEIGHTS, PIPELINE_STEPS, type PipelineStep } from "./events";
import type { IStepMetric } from "@repo/database";

export function calculateProgress(stepsCompleted: string[], currentStep?: string): number {
  const completedWeight = stepsCompleted.reduce((sum, step) => {
    return sum + (STEP_WEIGHTS[step as PipelineStep] || 0);
  }, 0);

  if (currentStep && !stepsCompleted.includes(currentStep)) {
    const currentWeight = STEP_WEIGHTS[currentStep as PipelineStep] || 0;
    return Math.min(Math.round(completedWeight + currentWeight * 0.5), 99);
  }

  return clamp(completedWeight);
}

function clamp(value: number): number {
  return Math.min(Math.max(Math.round(value), 0), 100);
}

export function buildStepMetric(
  step: PipelineStep,
  status: IStepMetric["status"],
  startedAt: Date,
  completedAt?: Date,
  retries = 0,
  error?: string,
): IStepMetric {
  const metric: IStepMetric = { step, status, startedAt, retries };
  if (completedAt) {
    metric.completedAt = completedAt;
    metric.durationMs = completedAt.getTime() - startedAt.getTime();
  }
  if (error) metric.error = error;
  return metric;
}

export function upsertStepMetric(
  existing: IStepMetric[] | undefined,
  updated: IStepMetric,
): IStepMetric[] {
  const metrics = existing ?? [];
  const idx = metrics.findIndex((m) => m.step === updated.step);
  if (idx >= 0) {
    const prev = metrics[idx];
    if (!prev) return [...metrics, updated];
    const copy = [...metrics];
    copy[idx] = {
      ...prev,
      ...updated,
      retries: updated.status === "started" ? prev.retries + 1 : prev.retries,
    };
    return copy;
  }
  return [...metrics, updated];
}

export function allStepsCompleted(stepsCompleted: string[]): boolean {
  return PIPELINE_STEPS.every((step) => stepsCompleted.includes(step));
}
