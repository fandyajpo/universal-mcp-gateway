"use server";

import { connect, WorkspaceModel, DocumentRepository } from "@repo/database";
import {
  getAllowedTypesForEntity,
  validateFileType,
  getTierLimits,
  validateFileSize,
  createR2Client,
  createStorageService,
  createUploadService,
} from "@repo/storage";
import type { UploadResult } from "@repo/storage";

export interface UploadActionResult {
  success: boolean;
  error?: string;
  code?: string;
  files?: UploadResult[];
}

const DETECTED_TYPE_TO_MIME: Record<string, string> = {
  pdf: "application/pdf",
  png: "image/png",
  jpeg: "image/jpeg",
  gif: "image/gif",
  webp: "image/webp",
  svg: "image/svg+xml",
  csv: "text/csv",
  json: "application/json",
  markdown: "text/markdown",
  plain: "text/plain",
  zip: "application/zip",
};

export async function uploadFilesAction(
  _prevState: UploadActionResult,
  formData: FormData,
): Promise<UploadActionResult> {
  const { headers } = await import("next/headers");
  const headersList = await headers();
  const userId = headersList.get("x-user-id");
  const workspaceId = headersList.get("x-workspace-id");

  if (!userId || !workspaceId) {
    return { success: false, error: "Unauthorized", code: "unauthorized" };
  }

  const entity = (formData.get("entity") as string) || "documents";
  const fileEntries = formData.getAll("file") as File[];

  if (fileEntries.length === 0) {
    return { success: false, error: "No files provided", code: "no_files" };
  }

  try {
    await connect();

    const workspace = await WorkspaceModel.findById(workspaceId).lean<{ plan?: string }>().exec();
    const plan = workspace?.plan ?? "free";
    const allowedTypes = getAllowedTypesForEntity(entity);
    const tierLimits = getTierLimits(plan);

    const uploadedFiles: {
      buffer: Uint8Array;
      filename: string;
      contentType: string;
      size: number;
    }[] = [];

    for (const file of fileEntries) {
      const buffer = new Uint8Array(await file.arrayBuffer());

      const typeResult = validateFileType(buffer, allowedTypes);
      if (!typeResult.valid) {
        return {
          success: false,
          error: `File "${file.name}" has invalid type: ${typeResult.detectedType}`,
          code: "invalid_type",
        };
      }

      const sizeResult = validateFileSize(file.size, plan);
      if (!sizeResult.valid) {
        return {
          success: false,
          error: `File "${file.name}" exceeds maximum size of ${sizeResult.maxSize} bytes`,
          code: "file_too_large",
        };
      }

      uploadedFiles.push({
        buffer,
        filename: file.name,
        contentType: DETECTED_TYPE_TO_MIME[typeResult.detectedType] ?? "application/octet-stream",
        size: file.size,
      });
    }

    const client = createR2Client();
    const storageService = createStorageService(client);
    const uploadService = createUploadService(
      storageService,
      (wid: string) => new DocumentRepository(wid),
      { maxFileSize: tierLimits.maxFileSize },
    );

    const results = await uploadService.uploadFiles(uploadedFiles, workspaceId, userId, { entity });

    return {
      success: true,
      files: results,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Upload failed",
      code: "upload_failed",
    };
  }
}
