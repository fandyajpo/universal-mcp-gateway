"use client";

import { Badge } from "@/components/ui";

import type { PdfDocumentStatus } from "@repo/types";

const STATUS_CONFIG: Record<PdfDocumentStatus, { label: string; className: string }> = {
  uploading: { label: "Uploading", className: "bg-yellow-100 text-yellow-800 border-yellow-200" },
  processing: { label: "Processing", className: "bg-blue-100 text-blue-800 border-blue-200" },
  ready: { label: "Ready", className: "bg-green-100 text-green-800 border-green-200" },
  error: { label: "Error", className: "bg-red-100 text-red-800 border-red-200" },
  failed: { label: "Failed", className: "bg-red-100 text-red-800 border-red-200" },
};

interface StatusBadgeProps {
  status: PdfDocumentStatus;
}

export function StatusBadge({ status }: StatusBadgeProps): React.ReactElement {
  const config = STATUS_CONFIG[status];
  return (
    <Badge className={config.className} variant="outline" aria-label={`Status: ${config.label}`}>
      {status === "processing" ? (
        <span className="flex items-center gap-1">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-blue-500" aria-hidden="true" />
          {config.label}
        </span>
      ) : (
        config.label
      )}
    </Badge>
  );
}
