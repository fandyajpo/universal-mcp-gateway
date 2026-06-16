import { NextRequest, NextResponse } from "next/server";

import { connect, DocumentModel, DocumentRepository } from "@repo/database";
import { createLogger } from "@repo/logger";
import { generateDownloadUrl, createR2Client, createStorageService } from "@repo/storage";

const logger = createLogger("api/files/[fileId]");

export const runtime = "nodejs";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ fileId: string }> },
): Promise<NextResponse> {
  const { headers } = await import("next/headers");
  const headersList = await headers();
  const userId = headersList.get("x-user-id");
  const workspaceId = headersList.get("x-workspace-id");

  if (!userId || !workspaceId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { fileId } = await params;

  try {
    await connect();

    const document = await DocumentModel.findOne({
      _id: fileId,
      tenantId: workspaceId,
      deletedAt: null,
    })
      .lean()
      .exec();

    if (!document?.fileKey) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    const signedUrl = await generateDownloadUrl(document.fileKey);

    return NextResponse.redirect(signedUrl, 302);
  } catch (error) {
    logger.error({ error, fileId }, "Failed to generate download URL");
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Download failed" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ fileId: string }> },
): Promise<NextResponse> {
  const { headers } = await import("next/headers");
  const headersList = await headers();
  const userId = headersList.get("x-user-id");
  const workspaceId = headersList.get("x-workspace-id");

  if (!userId || !workspaceId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { fileId } = await params;

  try {
    await connect();

    const document = await DocumentModel.findOne({
      _id: fileId,
      tenantId: workspaceId,
      deletedAt: null,
    })
      .lean()
      .exec();

    if (!document?.fileKey) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    const client = createR2Client();
    const storageService = createStorageService(client);
    const docRepo = new DocumentRepository(workspaceId);

    await storageService.delete(document.fileKey);
    await docRepo.deleteById(fileId);

    logger.info({ fileId, fileKey: document.fileKey }, "File deleted");

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    logger.error({ error, fileId }, "Failed to delete file");
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Delete failed" },
      { status: 500 },
    );
  }
}
