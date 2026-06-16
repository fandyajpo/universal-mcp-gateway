import { Inngest } from "inngest";

import type { PipelineStep } from "./events";
import { calculateProgress, upsertStepMetric, allStepsCompleted, buildStepMetric } from "./service";
import { DocumentModel } from "@repo/database";
import type { IStepMetric } from "@repo/database";
import { createLogger } from "@repo/logger";

const logger = createLogger("rag:pdf:progress-tracker");

const RATE_LIMIT_MS = 100;

interface DocState {
  currentStep?: string;
  stepsCompleted?: string[];
  stepMetrics?: IStepMetric[];
  processingStartedAt?: Date;
  status?: string;
  error?: string;
}

const lastUpdate = new Map<string, number>();

function shouldRateLimit(documentId: string): boolean {
  const now = Date.now();
  const last = lastUpdate.get(documentId) ?? 0;
  if (now - last < RATE_LIMIT_MS) return true;
  lastUpdate.set(documentId, now);
  return false;
}

interface ProgressEventPayload {
  documentId: string;
  workspaceId: string;
  userId: string;
  step: string;
  timestamp?: string;
  error?: string;
  retriesRemaining?: number;
  durationMs?: number;
}

export function createProgressTracker(inngest: Inngest): void {
  /* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment */
  const handler = async ({ event, step }: any): Promise<Record<string, unknown>> => {
    const data = (event as { name: string; data: ProgressEventPayload }).data;

    if (!data.documentId || !data.step) {
      logger.warn({ eventName: event.name }, "Skipping event — missing documentId or step");
      return { skipped: true };
    }

    if (shouldRateLimit(data.documentId)) {
      logger.debug({ documentId: data.documentId }, "Rate limited progress update");
      return { rateLimited: true };
    }

    const doc = await step.run("fetch-document", async () => {
      return DocumentModel.findById(data.documentId)
        .select("currentStep stepsCompleted stepMetrics processingStartedAt status error")
        .lean<DocState>()
        .exec();
    });

    if (!doc) {
      logger.warn({ documentId: data.documentId }, "Document not found for progress update");
      return { skipped: true };
    }

    const stepName = data.step as PipelineStep;
    const now = data.timestamp ? new Date(data.timestamp) : new Date();
    const eventName = event.name as string;
    const status = eventName.endsWith("/started") ? "started" as const
      : eventName.endsWith("/completed") ? "completed" as const
      : "failed" as const;

    const metric = buildStepMetric(stepName, status, now, status !== "started" ? now : undefined, 0, data.error);

    const stepMetrics = upsertStepMetric(doc.stepMetrics, metric);
    const stepsCompleted = [...new Set([
      ...(doc.stepsCompleted ?? []),
      ...(status === "completed" ? [stepName] : []),
    ])];
    const currentStep = status === "started" ? stepName : undefined;
    const progress = calculateProgress(stepsCompleted, currentStep);
    const isAllDone = allStepsCompleted(stepsCompleted);

    const update: Record<string, unknown> = {
      currentStep,
      stepsCompleted,
      stepMetrics,
      progress,
    };

    if (status === "started" && !doc.processingStartedAt) {
      update.processingStartedAt = now;
    }

    if (status === "completed" && isAllDone) {
      update.status = "ready";
      update.processingCompletedAt = now;
      update.currentStep = undefined;
      update.progress = 100;
    }

    if (status === "failed" && (data.retriesRemaining ?? 0) <= 0) {
      update.status = "failed";
      update.error = data.error;
    }

    await step.run("update-document", async () => {
      await DocumentModel.findByIdAndUpdate(data.documentId, { $set: update }).exec();
    });

    if (status === "completed" && isAllDone) {
      await step.run("send-completed-event", async () => {
        const totalDurationMs = stepMetrics
          .filter((m): m is IStepMetric & { durationMs: number } => m.durationMs !== undefined)
          .reduce((sum, m) => sum + m.durationMs, 0);

        await inngest.send({
          name: "pdf/processing-completed",
          data: {
            documentId: data.documentId,
            workspaceId: data.workspaceId,
            userId: data.userId,
            timestamp: new Date().toISOString(),
            totalDurationMs,
            stepMetrics,
          },
        });
      });
    }

    if (status === "failed" && (data.retriesRemaining ?? 0) <= 0) {
      await step.run("send-failed-event", async () => {
        await inngest.send({
          name: "pdf/processing-failed",
          data: {
            documentId: data.documentId,
            workspaceId: data.workspaceId,
            userId: data.userId,
            timestamp: new Date().toISOString(),
            failedStep: stepName,
            error: data.error ?? "Unknown error",
            stepMetrics,
          },
        });
      });
    }

    logger.info(
      { documentId: data.documentId, step: stepName, status, progress },
      "Progress updated",
    );

    return { updated: true, progress };
  };
  /* eslint-enable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment */

  inngest.createFunction(
    { id: "pdf-progress-tracker", triggers: [{ event: "pdf/*" as const }] },
    handler,
  );
}
