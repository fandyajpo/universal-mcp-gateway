"use client";

import { ArrowLeft, FileText, RefreshCw, Trash2 } from "lucide-react";

import Link from "next/link";

import { ReAuthGuard } from "@/components/auth/re-auth-guard";
import { ErrorBoundary } from "@/components/error-boundary/error-boundary";
import { ProcessingProgress } from "@/components/pdf/processing-progress";
import { StatusBadge } from "@/components/pdf/status-badge";
import { Button, Card, CardContent, CardHeader, CardTitle, Skeleton } from "@/components/ui";
import { useDocument, useDeleteDocument, useRetryDocument } from "@/hooks/use-documents";

interface DocumentDetailContentProps {
  documentId: string;
  workspaceId: string;
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatSize(bytes?: number): string {
  if (bytes === undefined || bytes === 0) return "-";
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function InfoRow({ label, value }: { label: string; value: string }): React.ReactElement {
  return (
    <div className="flex justify-between border-b py-2 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

function DocumentDetailInner({ documentId, workspaceId }: DocumentDetailContentProps): React.ReactElement {
  const { data: doc, isLoading, error } = useDocument(documentId);
  const deleteMutation = useDeleteDocument(workspaceId);
  const retryMutation = useRetryDocument(workspaceId);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" variant="text" />
        <Skeleton className="h-64 w-full" variant="rectangular" />
      </div>
    );
  }

  if (error || !doc) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <FileText className="mb-3 h-12 w-12 text-muted-foreground/50" aria-hidden="true" />
        <p className="text-sm text-destructive" role="alert" aria-live="assertive">
          {error instanceof Error ? error.message : "Document not found"}
        </p>
        <Button variant="outline" className="mt-4" asChild>
          <Link href="/documents">Back to Documents</Link>
        </Button>
      </div>
    );
  }

  const hasProcessing = doc.status === "processing" || doc.status === "uploading";
  const canRetry = doc.status === "failed" || doc.status === "error";

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/documents">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="truncate text-xl font-semibold">{doc.title}</h1>
        </div>
        <StatusBadge status={doc.status} />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Document Info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <InfoRow label="File size" value={formatSize(doc.fileSize)} />
            <InfoRow label="Pages" value={String(doc.pageCount ?? "-")} />
            <InfoRow label="Source" value={doc.source} />
            <InfoRow label="Uploaded" value={formatDate(doc.createdAt)} />
            <InfoRow label="Updated" value={formatDate(doc.updatedAt)} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">PDF Metadata</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <InfoRow label="Title" value={doc.pdfMetadata?.info.title ?? "-"} />
            <InfoRow label="Author" value={doc.pdfMetadata?.info.author ?? "-"} />
            <InfoRow label="Subject" value={doc.pdfMetadata?.info.subject ?? "-"} />
            <InfoRow label="Creator" value={doc.pdfMetadata?.info.creator ?? "-"} />
            <InfoRow label="Producer" value={doc.pdfMetadata?.info.producer ?? "-"} />
            <InfoRow label="Created" value={formatDate(doc.pdfMetadata?.info.creationDate ?? undefined)} />
          </CardContent>
        </Card>
      </div>

      {(hasProcessing || doc.progress !== undefined) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Processing Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div aria-live="polite" aria-atomic="true">
              <ProcessingProgress
                currentStep={doc.currentStep}
                progress={doc.progress}
                stepMetrics={doc.stepMetrics}
                error={doc.error}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {doc.extractionMetadata && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Extraction Results</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <InfoRow label="Characters" value={String(doc.extractionMetadata.charCount)} />
            <InfoRow label="Pages extracted" value={String(doc.extractionMetadata.pageCount)} />
            <InfoRow label="Method" value={doc.extractionMetadata.extractionMethod} />
            <InfoRow label="Confidence" value={`${Math.round(doc.extractionMetadata.confidenceScore * 100)}%`} />
            <InfoRow label="Language" value={doc.extractionMetadata.language ?? "-"} />
            <InfoRow label="Extracted at" value={formatDate(doc.extractionMetadata.extractedAt)} />
          </CardContent>
        </Card>
      )}

      {doc.error && (
        <div className="rounded-md border border-destructive/50 bg-destructive/5 p-4" role="alert" aria-live="assertive">
          <p className="text-sm font-medium text-destructive">Error</p>
          <p className="mt-1 text-sm text-destructive/80">{doc.error}</p>
        </div>
      )}

      <div className="flex gap-2">
        {canRetry && (
          <Button
            variant="outline"
            disabled={retryMutation.isPending}
            onClick={() => { retryMutation.mutate(doc.id); }}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${retryMutation.isPending ? "animate-spin" : ""}`} />
            {retryMutation.isPending ? "Retrying..." : "Retry Processing"}
          </Button>
        )}
        <ReAuthGuard onVerified={() => { deleteMutation.mutate(doc.id); }} actionDescription="delete this document">
          <Button variant="destructive" className="ml-auto">
            <Trash2 className="mr-2 h-4 w-4" />
            Delete Document
          </Button>
        </ReAuthGuard>
      </div>
    </div>
  );
}

export function DocumentDetailContent(props: DocumentDetailContentProps): React.ReactElement {
  return (
    <ErrorBoundary name="DocumentDetail">
      <DocumentDetailInner {...props} />
    </ErrorBoundary>
  );
}
