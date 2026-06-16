"use server";

import { Inngest } from "inngest";
import { Types } from "mongoose";

import { connect, DocumentModel, DocumentRepository } from "@repo/database";
import { createLogger } from "@repo/logger";
import type { PdfDocument, PdfDocumentStatus } from "@repo/types";

const logger = createLogger("actions/documents/pdf");

const PAGE_SIZE = 20;

function toPdfDocument(doc: unknown): PdfDocument {
  const d = doc as Record<string, unknown>;
  return {
    id: String(d._id),
    tenantId: String(d.tenantId),
    title: String(d.title),
    description: d.description as string | undefined,
    source: String(d.source),
    contentType: d.contentType as string | undefined,
    fileSize: d.fileSize as number | undefined,
    fileKey: d.fileKey as string | undefined,
    pageCount: d.pageCount as number | undefined,
    status: String(d.status) as PdfDocumentStatus,
    currentStep: d.currentStep as string | undefined,
    stepsCompleted: d.stepsCompleted as string[] | undefined,
    progress: d.progress as number | undefined,
    stepMetrics: d.stepMetrics as PdfDocument["stepMetrics"],
    error: d.error as string | undefined,
    pdfMetadata: d.pdfMetadata as PdfDocument["pdfMetadata"],
    extractionMetadata: d.extractionMetadata as PdfDocument["extractionMetadata"],
    tables: d.tables as PdfDocument["tables"],
    uploadedBy: String(d.uploadedBy),
    createdAt: d.createdAt instanceof Date ? d.createdAt.toISOString() : String(d.createdAt),
    updatedAt: d.updatedAt instanceof Date ? d.updatedAt.toISOString() : String(d.updatedAt),
  };
}

export interface ListDocumentsResult {
  success: boolean;
  documents?: PdfDocument[];
  nextCursor?: string;
  total?: number;
  error?: string;
}

export async function listDocumentsAction(
  workspaceId: string,
  options?: { status?: string; search?: string; cursor?: string; limit?: number },
): Promise<ListDocumentsResult> {
  try {
    const { headers } = await import("next/headers");
    const requesterId = (await headers()).get("x-user-id");
    if (!requesterId) {
      return { success: false, error: "Unauthorized" };
    }

    await connect();

    const limit = options?.limit ?? PAGE_SIZE;
    const repo = new DocumentRepository(workspaceId);

    const query: Record<string, unknown> = {};
    if (options?.status) query.status = options.status;
    if (options?.search) {
      query.$text = { $search: options.search };
    }
    if (options?.cursor) {
      query._id = { $lt: new Types.ObjectId(options.cursor) };
    }

    const [docs, total] = await Promise.all([
      repo.findMany(query, {
        limit: limit + 1,
        sort: { _id: -1 },
      }),
      repo.count(query),
    ]);

    const hasMore = docs.length > limit;
    const results = hasMore ? docs.slice(0, limit) : docs;
    const nextCursor = hasMore && results.length > 0
      ? String((results[results.length - 1] as unknown as Record<string, unknown>)._id)
      : undefined;

    return {
      success: true,
      documents: results.map((d) => toPdfDocument(d as unknown as Record<string, unknown>)),
      nextCursor,
      total,
    };
  } catch (error) {
    logger.error({ error, workspaceId }, "Failed to list documents");
    return { success: false, error: "Failed to list documents" };
  }
}

export interface GetDocumentResult {
  success: boolean;
  document?: PdfDocument;
  error?: string;
}

export async function getDocumentAction(documentId: string): Promise<GetDocumentResult> {
  try {
    const { headers } = await import("next/headers");
    const requesterId = (await headers()).get("x-user-id");
    if (!requesterId) {
      return { success: false, error: "Unauthorized" };
    }

    await connect();

    const doc = await DocumentModel.findById(documentId).lean().exec();
    if (!doc) {
      return { success: false, error: "Document not found" };
    }

    return {
      success: true,
      document: toPdfDocument(doc),
    };
  } catch (error) {
    logger.error({ error, documentId }, "Failed to get document");
    return { success: false, error: "Failed to get document" };
  }
}

export interface DeleteDocumentResult {
  success: boolean;
  error?: string;
}

export async function deleteDocumentAction(documentId: string): Promise<DeleteDocumentResult> {
  try {
    const { headers } = await import("next/headers");
    const requesterId = (await headers()).get("x-user-id");
    const workspaceId = (await headers()).get("x-workspace-id");
    if (!requesterId || !workspaceId) {
      return { success: false, error: "Unauthorized" };
    }

    await connect();

    const repo = new DocumentRepository(workspaceId);
    await repo.deleteById(documentId);

    logger.info({ documentId, workspaceId, userId: requesterId }, "Document deleted");
    return { success: true };
  } catch (error) {
    logger.error({ error, documentId }, "Failed to delete document");
    return { success: false, error: "Failed to delete document" };
  }
}

export interface RetryDocumentResult {
  success: boolean;
  error?: string;
}

export async function retryDocumentAction(documentId: string): Promise<RetryDocumentResult> {
  try {
    const { headers } = await import("next/headers");
    const requesterId = (await headers()).get("x-user-id");
    const workspaceId = (await headers()).get("x-workspace-id");
    if (!requesterId || !workspaceId) {
      return { success: false, error: "Unauthorized" };
    }

    await connect();

    const doc = await DocumentModel.findById(documentId).lean().exec();
    if (!doc) {
      return { success: false, error: "Document not found" };
    }

    if (doc.status !== "failed" && doc.status !== "error") {
      return { success: false, error: "Document is not in a failed state" };
    }

    await DocumentModel.findByIdAndUpdate(documentId, {
      $set: {
        status: "processing",
        error: undefined,
        progress: 0,
        currentStep: undefined,
        stepsCompleted: [],
        stepMetrics: [],
      },
    }).exec();

    const inngest = new Inngest({ id: "universal-mcp-gateway" });
    await inngest.send({
      name: "pdf/uploaded",
      data: {
        documentId,
        workspaceId,
        userId: requesterId,
        fileKey: String(doc.fileKey),
        fileSize: doc.fileSize ?? 0,
        fileName: doc.title,
      },
    });

    logger.info({ documentId, workspaceId, userId: requesterId }, "Document retry initiated");
    return { success: true };
  } catch (error) {
    logger.error({ error, documentId }, "Failed to retry document");
    return { success: false, error: "Failed to retry document" };
  }
}
