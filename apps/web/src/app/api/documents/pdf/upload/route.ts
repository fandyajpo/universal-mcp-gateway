import { NextRequest, NextResponse } from "next/server";

import { Inngest } from "inngest";
import { createHash, randomUUID } from "node:crypto";

import { connect, DocumentModel } from "@repo/database";
import { createLogger } from "@repo/logger";
import { createR2Client, createStorageService } from "@repo/storage";

const logger = createLogger("api/documents/pdf/upload");

const MAX_FILE_SIZE = 50 * 1024 * 1024;

const PDF_MAGIC = new Uint8Array([0x25, 0x50, 0x44, 0x46]);

const ACCEPTED_MIME_TYPES = ["application/pdf"];
const ACCEPTED_EXTENSIONS = [".pdf"];

function isPdf(buffer: Uint8Array): boolean {
  if (buffer.length < 4) return false;
  return (
    buffer[0] === PDF_MAGIC[0] &&
    buffer[1] === PDF_MAGIC[1] &&
    buffer[2] === PDF_MAGIC[2] &&
    buffer[3] === PDF_MAGIC[3]
  );
}

function sanitizeFilename(filename: string): string {
  const sanitized = filename
    .split("")
    .filter((c) => c.charCodeAt(0) >= 32)
    .join("")
    .replace(/[/\\:?*"<>|]/g, "_")
    .replace(/\.\./g, "_")
    .trim();
  return sanitized.length > 0 ? sanitized : "untitled.pdf";
}

function hasSafeExtension(filename: string): boolean {
  const lower = filename.toLowerCase();
  return ACCEPTED_EXTENSIONS.some((ext) => lower.endsWith(ext));
}

export const runtime = "nodejs";

export async function POST(request: NextRequest): Promise<NextResponse> {
  const startTime = Date.now();

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

  const file = formData.get("file") as File | null;
  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json(
      { error: `File exceeds maximum size of ${MAX_FILE_SIZE} bytes` },
      { status: 413 },
    );
  }

  if (file.size === 0) {
    return NextResponse.json({ error: "File is empty" }, { status: 400 });
  }

  if (!ACCEPTED_MIME_TYPES.includes(file.type)) {
    return NextResponse.json(
      { error: `File type ${file.type} is not accepted. Only PDF files are allowed.` },
      { status: 400 },
    );
  }

  if (!hasSafeExtension(file.name)) {
    return NextResponse.json(
      { error: "File must have a .pdf extension" },
      { status: 400 },
    );
  }

  const safeFilename = sanitizeFilename(file.name);

  const password = (formData.get("password") as string | null) ?? undefined;

  let buffer: Uint8Array;
  try {
    buffer = new Uint8Array(await file.arrayBuffer());
  } catch {
    return NextResponse.json({ error: "Failed to read file" }, { status: 400 });
  }

  if (!isPdf(buffer)) {
    return NextResponse.json(
      { error: "File is not a valid PDF (expected %PDF magic bytes)" },
      { status: 400 },
    );
  }

  const fileHash = createHash("sha256").update(buffer).digest("hex");
  const documentId = randomUUID();
  const fileKey = `${workspaceId}/pdfs/${documentId}.pdf`;

  try {
    await connect();

    const existing = await DocumentModel.findOne({
      tenantId: workspaceId,
      fileHash,
      status: { $in: ["ready", "processing", "uploading"] },
    })
      .lean()
      .exec();

    if (existing) {
      const duration = Date.now() - startTime;
      logger.info(
        { documentId: existing._id.toString(), workspaceId, userId, fileSize: file.size, duration },
        "Duplicate PDF upload rejected — returning existing document",
      );
      return NextResponse.json({
        documentId: existing._id.toString(),
        status: "uploading",
      });
    }

    const client = createR2Client();
    const storageService = createStorageService(client);

    await storageService.upload(fileKey, buffer, "application/pdf", {
      workspaceId,
      userId,
      originalName: safeFilename,
    });

    const document = await DocumentModel.create({
      tenantId: workspaceId,
      title: safeFilename,
      source: "upload",
      contentType: "application/pdf",
      fileSize: file.size,
      fileKey,
      fileHash,
      status: "uploading",
      uploadedBy: userId,
    });

    const inngest = new Inngest({ id: "universal-mcp-gateway" });
    await inngest.send({
      name: "pdf/uploaded",
      data: {
        documentId: document._id.toString(),
        workspaceId,
        userId,
        fileKey,
        fileSize: file.size,
        fileName: file.name,
        ...(password ? { password } : {}),
      },
    });

    const duration = Date.now() - startTime;
    logger.info(
      { documentId: document._id.toString(), workspaceId, userId, fileSize: file.size, duration },
      "PDF uploaded and processing event emitted",
    );

    return NextResponse.json(
      { documentId: document._id.toString(), status: "uploading" },
      { status: 201 },
    );
  } catch (error) {
    try {
      const client = createR2Client();
      const storageService = createStorageService(client);
      await storageService.delete(fileKey);
    } catch (cleanupError) {
      logger.error({ cleanupError, fileKey }, "Failed to clean up R2 after upload failure");
    }

    logger.error({ error, workspaceId, userId }, "PDF upload failed");
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Upload failed" },
      { status: 500 },
    );
  }
}
