"use client";

import { ErrorBoundary } from "@/components/error-boundary/error-boundary";
import { DocumentList } from "@/components/pdf/document-list";
import { PdfUploadZone } from "@/components/pdf/pdf-upload-zone";
import { useUserWorkspaces } from "@/hooks/use-user-workspaces";

export default function DocumentsPage(): React.ReactElement {
  const { workspaces, isLoading: workspacesLoading } = useUserWorkspaces();
  const workspaceId = workspaces?.[0]?._id;

  if (workspacesLoading) {
    return (
      <div className="mx-auto max-w-5xl space-y-6 p-6">
        <h1 className="text-2xl font-bold">Documents</h1>
        <div className="h-32 animate-pulse rounded-lg bg-muted" />
        <div className="h-64 animate-pulse rounded-lg bg-muted" />
      </div>
    );
  }

  if (!workspaceId) {
    return (
      <div className="mx-auto max-w-5xl p-6">
        <h1 className="text-2xl font-bold">Documents</h1>
        <p className="mt-4 text-muted-foreground">No workspace selected. Please select or create a workspace.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      <h1 className="text-2xl font-bold">Documents</h1>
      <ErrorBoundary name="UploadZone">
        <PdfUploadZone />
      </ErrorBoundary>
      <ErrorBoundary name="DocumentList">
        <DocumentList workspaceId={workspaceId} />
      </ErrorBoundary>
    </div>
  );
}
