import { NextRequest, NextResponse } from "next/server";

import { connect, DocumentModel } from "@repo/database";
import { createLogger } from "@repo/logger";
import { getPublicUrl } from "@repo/storage";

const logger = createLogger("api/files/[fileId]/metadata");

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

    if (!document) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    const doc = document as unknown as {
      _id: string;
      fileKey?: string;
      title: string;
      fileSize?: number;
      contentType?: string;
      status: string;
      uploadedBy: string;
      createdAt: Date;
      updatedAt: Date;
      tags?: string[];
      description?: string;
    };

    return NextResponse.json({
      id: doc._id,
      key: doc.fileKey ?? "",
      filename: doc.title,
      size: doc.fileSize ?? 0,
      contentType: doc.contentType ?? "application/octet-stream",
      url: doc.fileKey ? getPublicUrl(doc.fileKey) : "",
      status: doc.status,
      uploadedBy: doc.uploadedBy,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
      tags: doc.tags ?? [],
      description: doc.description,
    });
  } catch (error) {
    logger.error({ error, fileId }, "Failed to fetch file metadata");
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch metadata" },
      { status: 500 },
    );
  }
}
