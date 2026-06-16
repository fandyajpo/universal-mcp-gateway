import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from "@tanstack/react-query";
import React from "react";

import { DocumentDetailContent } from "./document-detail-content";
import { connect, DocumentModel } from "@repo/database";
import { createLogger } from "@repo/logger";
import type { PdfDocument, PdfDocumentStatus } from "@repo/types";

const logger = createLogger("app/documents/[id]/page");

interface PageProps {
  params: Promise<{ id: string }>;
}

function toPdfDocument(doc: Record<string, unknown>): PdfDocument {
  return {
    id: String(doc._id),
    tenantId: String(doc.tenantId),
    title: String(doc.title),
    description: doc.description as string | undefined,
    source: String(doc.source),
    contentType: doc.contentType as string | undefined,
    fileSize: doc.fileSize as number | undefined,
    fileKey: doc.fileKey as string | undefined,
    pageCount: doc.pageCount as number | undefined,
    status: String(doc.status) as PdfDocumentStatus,
    currentStep: doc.currentStep as string | undefined,
    stepsCompleted: doc.stepsCompleted as string[] | undefined,
    progress: doc.progress as number | undefined,
    stepMetrics: doc.stepMetrics as PdfDocument["stepMetrics"],
    error: doc.error as string | undefined,
    pdfMetadata: doc.pdfMetadata as PdfDocument["pdfMetadata"],
    extractionMetadata: doc.extractionMetadata as PdfDocument["extractionMetadata"],
    tables: doc.tables as PdfDocument["tables"],
    uploadedBy: String(doc.uploadedBy),
    createdAt: doc.createdAt instanceof Date ? doc.createdAt.toISOString() : String(doc.createdAt),
    updatedAt: doc.updatedAt instanceof Date ? doc.updatedAt.toISOString() : String(doc.updatedAt),
  };
}

export default async function DocumentDetailPage({ params }: PageProps): Promise<React.ReactElement> {
  const { id } = await params;

  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 10_000,
        retry: 2,
      },
    },
  });

  try {
    await connect();
    const doc = await DocumentModel.findById(id).lean().exec();

    if (doc) {
      const pdfDoc = toPdfDocument(doc);
      queryClient.setQueryData(["document", id], pdfDoc);
    }

    const dehydratedState = dehydrate(queryClient);

    return (
      <div className="mx-auto max-w-3xl p-6">
        <HydrationBoundary state={dehydratedState}>
          <DocumentDetailContent documentId={id} workspaceId={doc ? doc.tenantId : ""} />
        </HydrationBoundary>
      </div>
    );
  } catch (error) {
    logger.error({ error, documentId: id }, "Failed to load document detail page");

    const dehydratedState = dehydrate(queryClient);

    return (
      <div className="mx-auto max-w-3xl p-6">
        <HydrationBoundary state={dehydratedState}>
          <DocumentDetailContent documentId={id} workspaceId="" />
        </HydrationBoundary>
      </div>
    );
  }
}
