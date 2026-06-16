"use client";

import { useVirtualizer } from "@tanstack/react-virtual";
import { FileText, RefreshCw, Search, Trash2 } from "lucide-react";
import { useCallback, useRef, useState } from "react";

import { ReAuthGuard } from "@/components/auth/re-auth-guard";
import { ProcessingProgress } from "@/components/pdf/processing-progress";
import { StatusBadge } from "@/components/pdf/status-badge";
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Skeleton } from "@/components/ui";
import { useDocumentListKeyboard } from "@/hooks/use-document-list-keyboard";
import { useDeleteDocument, useDocuments, useRetryDocument } from "@/hooks/use-documents";

import type { PdfDocument } from "@repo/types";

const ROW_HEIGHT = 64;

interface DocumentListProps {
  workspaceId: string;
  onSelectDocument?: (id: string) => void;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function formatSize(bytes?: number): string {
  if (bytes === undefined || bytes === 0) return "-";
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function DocumentRow({
  doc,
  isFocused,
  onActivate,
  onDelete,
  onRetry,
}: {
  doc: PdfDocument;
  isFocused: boolean;
  onActivate: () => void;
  onDelete: () => void;
  onRetry: () => void;
}): React.ReactElement {
  const progressContent = ((): React.ReactNode => {
    if (doc.status === "processing" || doc.status === "uploading") {
      return (
        <ProcessingProgress
          currentStep={doc.currentStep}
          progress={doc.progress}
          stepMetrics={doc.stepMetrics}
        />
      );
    }
    if (doc.status === "failed" || doc.status === "error") {
      return (
        <ProcessingProgress
          error={doc.error}
          stepMetrics={doc.stepMetrics}
        />
      );
    }
    return (
      <span className="text-xs text-muted-foreground">100%</span>
    );
  })();

  return (
    <div
      className={`flex items-center border-b px-3 transition-colors hover:bg-accent/50 ${
        isFocused ? "bg-accent" : ""
      }`}
      style={{ height: ROW_HEIGHT }}
      role="row"
      tabIndex={-1}
      aria-selected={isFocused}
    >
      <div className="w-[30%] min-w-0 pr-2">
        <button
          type="button"
          onClick={onActivate}
          className="truncate text-sm font-medium hover:text-primary"
          title={doc.title}
        >
          {doc.title}
        </button>
        <p className="truncate text-xs text-muted-foreground">{formatSize(doc.fileSize)}</p>
      </div>
      <div className="w-[15%] pr-2">
        <StatusBadge status={doc.status} />
      </div>
      <div className="w-[20%] pr-2">{progressContent}</div>
      <div className="w-[10%] pr-2 text-sm text-muted-foreground">{doc.pageCount ?? "-"}</div>
      <div className="w-[15%] pr-2 text-xs text-muted-foreground">{formatDate(doc.createdAt)}</div>
      <div className="flex w-[10%] items-center gap-1">
        {(doc.status === "failed" || doc.status === "error") && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onRetry(); }}
            className="rounded p-1 text-muted-foreground hover:bg-accent"
            aria-label={`Retry ${doc.title}`}
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        )}
        <ReAuthGuard onVerified={onDelete} actionDescription="delete this document">
          <button
            type="button"
            className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-destructive"
            aria-label={`Delete ${doc.title}`}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </ReAuthGuard>
      </div>
    </div>
  );
}

export function DocumentList({ workspaceId, onSelectDocument }: DocumentListProps): React.ReactElement {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const parentRef = useRef<HTMLDivElement | null>(null);

  const { documents, total, isLoading, error, fetchNextPage, hasNextPage, isFetchingNextPage } = useDocuments(workspaceId, {
    search: search || undefined,
    status: statusFilter,
  });

  const deleteMutation = useDeleteDocument(workspaceId);
  const retryMutation = useRetryDocument(workspaceId);

  const handleSelect = useCallback(
    (index: number) => {
      const doc = documents[index];
      if (doc) onSelectDocument?.(doc.id);
    },
    [documents, onSelectDocument],
  );

  const handleActivate = useCallback(
    (index: number) => {
      const doc = documents[index];
      if (doc) onSelectDocument?.(doc.id);
    },
    [documents, onSelectDocument],
  );

  const { focusedIndex, containerRef, handleKeyDown } = useDocumentListKeyboard({
    itemCount: documents.length,
    onSelect: handleSelect,
    onActivate: handleActivate,
    enabled: documents.length > 0,
  });

  const virtualizer = useVirtualizer({
    count: documents.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 10,
  });

  const handleScroll = useCallback(() => {
    const virtualRows = virtualizer.getVirtualItems();
    const lastRow = virtualRows[virtualRows.length - 1];
    if (lastRow && lastRow.index >= documents.length - 3 && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [virtualizer, documents.length, hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive" role="alert" aria-live="assertive">
            {error instanceof Error ? error.message : "Failed to load documents"}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="text-lg font-semibold">Documents</CardTitle>
        <span className="text-sm text-muted-foreground" aria-live="polite" aria-atomic="true">
          {isLoading ? "..." : `${total} document${total !== 1 ? "s" : ""}`}
        </span>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <Input
              placeholder="Search documents..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); }}
              className="pl-9"
              aria-label="Search documents by name"
            />
          </div>
          <div className="flex gap-1">
            {(["all", "processing", "ready", "failed"] as const).map((s) => (
              <Button
                key={s}
                variant={statusFilter === s || (s === "all" && !statusFilter) ? "default" : "outline"}
                size="sm"
                onClick={() => { setStatusFilter(s === "all" ? undefined : s); }}
              >
                {s === "all" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
              </Button>
            ))}
          </div>
        </div>

        <div aria-live="polite" aria-atomic="true" className="sr-only">
          {documents.length > 0
            ? `Showing ${documents.length} of ${total} documents`
            : isLoading
              ? "Loading documents"
              : "No documents found"}
        </div>

        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" variant="rectangular" />
            ))}
          </div>
        ) : documents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <FileText className="mb-3 h-12 w-12 text-muted-foreground/50" aria-hidden="true" />
            <p className="text-sm font-medium text-muted-foreground">No documents found</p>
            <p className="text-xs text-muted-foreground/70">
              {search || statusFilter ? "Try adjusting your search or filters." : "Upload a PDF to get started."}
            </p>
          </div>
        ) : (
          <div
            ref={containerRef}
            role="table"
            aria-label="Document list"
            onKeyDown={handleKeyDown}
            className="focus:outline-none"
            tabIndex={0}
          >
            <div
              className="flex items-center border-b px-3 py-2 text-xs font-medium text-muted-foreground"
              role="row"
              aria-hidden="true"
            >
              <div className="w-[30%]">Name</div>
              <div className="w-[15%]">Status</div>
              <div className="w-[20%]">Progress</div>
              <div className="w-[10%]">Pages</div>
              <div className="w-[15%]">Date</div>
              <div className="w-[10%]" />
            </div>
            <div
              ref={parentRef}
              className="overflow-auto"
              style={{ maxHeight: 600 }}
              onScroll={handleScroll}
            >
              <div
                style={{
                  height: `${virtualizer.getTotalSize()}px`,
                  width: "100%",
                  position: "relative",
                }}
              >
                {virtualizer.getVirtualItems().map((virtualRow) => {
                  const doc = documents[virtualRow.index];
                  if (!doc) return null;
                  return (
                    <div
                      key={doc.id}
                      data-index={virtualRow.index}
                      ref={virtualizer.measureElement}
                      style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: "100%",
                        transform: `translateY(${virtualRow.start}px)`,
                      }}
                    >
                      <DocumentRow
                        doc={doc}
                        isFocused={focusedIndex.current === virtualRow.index}
                        onActivate={() => { onSelectDocument?.(doc.id); }}
                        onDelete={() => { deleteMutation.mutate(doc.id); }}
                        onRetry={() => { retryMutation.mutate(doc.id); }}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {isFetchingNextPage && (
          <div className="flex justify-center py-2" aria-live="polite">
            <span className="text-sm text-muted-foreground">Loading more...</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
