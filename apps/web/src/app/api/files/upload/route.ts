import { NextRequest, NextResponse } from "next/server";

import { connect, WorkspaceModel, DocumentRepository } from "@repo/database";
import { createLogger } from "@repo/logger";
import {
  getAllowedTypesForEntity,
  validateFileType,
  getTierLimits,
  validateFileSize,
  createR2Client,
  createStorageService,
  createUploadService,
} from "@repo/storage";

const logger = createLogger("api/files/upload");

export const runtime = "nodejs";

export async function POST(request: NextRequest): Promise<NextResponse> {
  const { headers } = await import("next/headers");
  const headersList = await headers();
  const userId = headersList.get("x-user-id");
  const workspaceId = headersList.get("x-workspace-id");

  if (!userId || !workspaceId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const entity = (formData.get("entity") as string) || "documents";
  const fileEntries = formData.getAll("file") as File[];

  if (fileEntries.length === 0) {
    return NextResponse.json({ error: "No files provided" }, { status: 400 });
  }

  try {
    await connect();

    const workspace = await WorkspaceModel.findById(workspaceId).lean<{ plan?: string }>().exec();
    const plan = workspace?.plan ?? "free";
    const allowedTypes = getAllowedTypesForEntity(entity);
    const tierLimits = getTierLimits(plan);

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
        return NextResponse.json(
          { error: `File "${file.name}" has invalid type: ${typeResult.detectedType}` },
          { status: 400 },
        );
      }

      const sizeResult = validateFileSize(file.size, plan);
      if (!sizeResult.valid) {
        return NextResponse.json(
          { error: `File "${file.name}" exceeds maximum size of ${sizeResult.maxSize} bytes` },
          { status: 413 },
        );
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

    return NextResponse.json({ files: results });
  } catch (error) {
    logger.error({ error, workspaceId }, "Upload failed");
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Upload failed" },
      { status: 500 },
    );
  }
}
