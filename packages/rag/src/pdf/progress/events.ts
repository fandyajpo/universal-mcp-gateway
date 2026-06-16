import type { IStepMetric } from "@repo/database";

export const PIPELINE_STEPS = ["uploaded", "extract", "ocr", "chunk", "embed", "index"] as const;
export type PipelineStep = (typeof PIPELINE_STEPS)[number];

export const STEP_WEIGHTS: Record<PipelineStep, number> = {
  uploaded: 5,
  extract: 25,
  ocr: 20,
  chunk: 15,
  embed: 25,
  index: 10,
};

export const STEP_ORDER: Record<PipelineStep, number> = {
  uploaded: 0,
  extract: 1,
  ocr: 2,
  chunk: 3,
  embed: 4,
  index: 5,
};

export interface PdfStepStartedEventPayload {
  documentId: string;
  workspaceId: string;
  userId: string;
  step: PipelineStep;
  timestamp: string;
}

export interface PdfStepStartedEvent {
  name: `pdf/${PipelineStep}/started`;
  data: PdfStepStartedEventPayload;
}

export interface PdfStepCompletedEventPayload {
  documentId: string;
  workspaceId: string;
  userId: string;
  step: PipelineStep;
  timestamp: string;
  durationMs: number;
  metadata?: Record<string, unknown>;
}

export interface PdfStepCompletedEvent {
  name: `pdf/${PipelineStep}/completed`;
  data: PdfStepCompletedEventPayload;
}

export interface PdfStepFailedEventPayload {
  documentId: string;
  workspaceId: string;
  userId: string;
  step: PipelineStep;
  timestamp: string;
  error: string;
  retriesRemaining: number;
  metadata?: Record<string, unknown>;
}

export interface PdfStepFailedEvent {
  name: `pdf/${PipelineStep}/failed`;
  data: PdfStepFailedEventPayload;
}

export interface PdfProcessingCompletedEventPayload {
  documentId: string;
  workspaceId: string;
  userId: string;
  timestamp: string;
  totalDurationMs: number;
  stepMetrics: IStepMetric[];
}

export interface PdfProcessingCompletedEvent {
  name: "pdf/processing-completed";
  data: PdfProcessingCompletedEventPayload;
}

export interface PdfProcessingFailedEventPayload {
  documentId: string;
  workspaceId: string;
  userId: string;
  timestamp: string;
  failedStep: PipelineStep;
  error: string;
  stepMetrics: IStepMetric[];
}

export interface PdfProcessingFailedEvent {
  name: "pdf/processing-failed";
  data: PdfProcessingFailedEventPayload;
}

export type PdfProgressEvent =
  | PdfStepStartedEvent
  | PdfStepCompletedEvent
  | PdfStepFailedEvent
  | PdfProcessingCompletedEvent
  | PdfProcessingFailedEvent;
