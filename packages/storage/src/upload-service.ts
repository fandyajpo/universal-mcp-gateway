import { randomUUID } from "node:crypto";

import { getPublicUrl } from "./client";
import type { StorageService } from "./storage-service";
import type { UploadOptions, UploadResult, UploadedFile } from "./types";
import type { IDocument } from "@repo/database";
import { DocumentRepository } from "@repo/database";
import { createLogger } from "@repo/logger";

const logger = createLogger("upload-service");

const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/webp",
  "image/svg+xml",
  "text/csv",
  "text/tab-separated-values",
  "application/json",
  "text/markdown",
  "text/plain",
]);

const DEFAULT_MAX_FILE_SIZE = 10 * 1024 * 1024;

function generateStorageKey(workspaceId: string, entity: string, filename: string): string {
  const date = new Date().toISOString().split("T")[0];
  const uuid = randomUUID();
  const sanitized = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
  return `${workspaceId}/${entity}/${date}/${uuid}-${sanitized}`;
}

function extractDocumentId(doc: IDocument): string {
  const d = doc as unknown as { id?: string; _id?: { toString(): string } };
  return d.id ?? d._id?.toString() ?? "";
}

export interface UploadService {
  uploadFile(
    buffer: Uint8Array,
    filename: string,
    contentType: string,
    workspaceId: string,
    userId: string,
    entity?: string,
  ): Promise<UploadResult>;
  uploadFiles(
    files: UploadedFile[],
    workspaceId: string,
    userId: string,
    options?: UploadOptions,
  ): Promise<UploadResult[]>;
  deleteFile(fileKey: string, workspaceId: string): Promise<void>;
  getFile(fileKey: string, workspaceId: string): Promise<UploadResult | null>;
}

export function createUploadService(
  storageService: StorageService,
  createDocumentRepo: (workspaceId: string) => DocumentRepository,
  options?: { maxFileSize?: number },
): UploadService {
  const maxFileSize = options?.maxFileSize ?? DEFAULT_MAX_FILE_SIZE;

  async function uploadFile(
    buffer: Uint8Array,
    filename: string,
    contentType: string,
    workspaceId: string,
    userId: string,
    entity = "documents",
  ): Promise<UploadResult> {
    if (!ALLOWED_MIME_TYPES.has(contentType)) {
      throw new Error(`File type "${contentType}" is not allowed`);
    }

    if (buffer.length > maxFileSize) {
      throw new Error(`File size exceeds maximum allowed size of ${maxFileSize} bytes`);
    }

    const key = generateStorageKey(workspaceId, entity, filename);

    try {
      await storageService.upload(key, buffer, contentType, {
        workspaceId,
        userId,
        originalName: filename,
      });
    } catch (error) {
      logger.error({ error, key }, "R2 upload failed");
      throw error;
    }

    try {
      const docRepo = createDocumentRepo(workspaceId);
      const document = await docRepo.create({
        title: filename,
        source: "upload",
        contentType,
        fileSize: buffer.length,
        fileKey: key,
        uploadedBy: userId,
        status: "ready",
      });

      const docId = extractDocumentId(document);
      const publicUrl = getPublicUrl();
      const url = publicUrl ? `${publicUrl}/${key}` : key;

      return {
        id: docId,
        key,
        filename,
        size: buffer.length,
        contentType,
        url,
      };
    } catch (error) {
      try {
        await storageService.delete(key);
      } catch (cleanupError) {
        logger.error({ cleanupError, key }, "Failed to clean up R2 after Document creation failure");
      }
      throw error;
    }
  }

  async function uploadFiles(
    files: UploadedFile[],
    workspaceId: string,
    userId: string,
    options?: UploadOptions,
  ): Promise<UploadResult[]> {
    const concurrency = options?.concurrency ?? 3;
    const entity = options?.entity ?? "documents";
    const results: UploadResult[] = [];

    for (let i = 0; i < files.length; i += concurrency) {
      const batch = files.slice(i, i + concurrency);
      const batchResults = await Promise.all(
        batch.map((file) =>
          uploadFile(file.buffer, file.filename, file.contentType, workspaceId, userId, entity),
        ),
      );
      results.push(...batchResults);
    }

    return results;
  }

  async function deleteFile(fileKey: string, workspaceId: string): Promise<void> {
    const docRepo = createDocumentRepo(workspaceId);
    const document = await docRepo.findOne({ fileKey });

    if (!document) {
      throw new Error(`Document with fileKey "${fileKey}" not found`);
    }

    const docId = extractDocumentId(document);
    await docRepo.deleteById(docId);

    await storageService.delete(fileKey);

    logger.info({ fileKey }, "File deleted and document marked as deleted");
  }

  async function getFile(fileKey: string, workspaceId: string): Promise<UploadResult | null> {
    const docRepo = createDocumentRepo(workspaceId);
    const document = await docRepo.findOne({ fileKey });

    if (!document) {
      return null;
    }

    const info = await storageService.getMetadata(fileKey);

    if (!info) {
      return null;
    }

    const docId = extractDocumentId(document);
    const publicUrl = getPublicUrl();
    const url = publicUrl ? `${publicUrl}/${fileKey}` : fileKey;

    return {
      id: docId,
      key: fileKey,
      filename: document.title,
      size: info.size,
      contentType: info.contentType,
      url,
    };
  }

  return {
    uploadFile,
    uploadFiles,
    deleteFile,
    getFile,
  };
}
