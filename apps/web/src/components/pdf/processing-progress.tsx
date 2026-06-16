"use client";

import type { PdfStepMetric } from "@repo/types";

interface ProcessingProgressProps {
  currentStep?: string;
  progress?: number;
  stepMetrics?: PdfStepMetric[];
  error?: string;
}

const STEP_LABELS: Record<string, string> = {
  upload: "Upload",
  extract: "Extracting text",
  ocr: "Running OCR",
  chunk: "Chunking content",
  embed: "Generating embeddings",
  index: "Indexing",
};

export function ProcessingProgress({ currentStep, progress, stepMetrics, error }: ProcessingProgressProps): React.ReactElement {
  const stepLabel = currentStep ? (STEP_LABELS[currentStep] ?? currentStep) : undefined;

  if (error) {
    return (
      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs">
          <span className="font-medium text-destructive">Failed</span>
          {progress !== undefined && <span className="text-muted-foreground">{progress}%</span>}
        </div>
        {stepMetrics && stepMetrics.length > 0 && (
          <div className="space-y-0.5">
            {stepMetrics.map((metric) => (
              <div key={metric.step} className="flex items-center gap-2 text-xs text-muted-foreground">
                <StepIcon status={metric.status} />
                <span>{STEP_LABELS[metric.step] ?? metric.step}</span>
                {metric.error && <span className="text-destructive">- {metric.error}</span>}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-1.5" role="progressbar" aria-valuenow={progress ?? 0} aria-valuemin={0} aria-valuemax={100} aria-label="Processing progress">
      {stepLabel && (
        <div className="flex items-center justify-between text-xs">
          <span className="font-medium text-muted-foreground">{stepLabel}...</span>
          <span className="text-muted-foreground">{progress ?? 0}%</span>
        </div>
      )}
      <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
        <div
          className="h-full rounded-full bg-blue-500 transition-all duration-500 ease-out"
          style={{ width: `${Math.min(progress ?? 0, 100)}%` }}
        />
      </div>
      {stepMetrics && stepMetrics.length > 0 && (
        <div className="flex flex-wrap gap-x-3 gap-y-0.5 pt-0.5">
          {stepMetrics.map((metric) => (
            <div key={metric.step} className="flex items-center gap-1 text-xs text-muted-foreground">
              <StepIcon status={metric.status} />
              <span>{STEP_LABELS[metric.step] ?? metric.step}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function StepIcon({ status }: { status: PdfStepMetric["status"] }): React.ReactElement {
  if (status === "completed") {
    return <span className="text-green-600" aria-label="Completed">&#10003;</span>;
  }
  if (status === "failed") {
    return <span className="text-destructive" aria-label="Failed">&#10007;</span>;
  }
  return <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-blue-500" aria-label="In progress" />;
}
