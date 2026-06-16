import { NextRequest, NextResponse } from "next/server";

import { connect, WorkspaceModel, DocumentModel } from "@repo/database";
import { createLogger } from "@repo/logger";
import { getTierLimits } from "@repo/storage";

const logger = createLogger("api/files/storage");

export const runtime = "nodejs";

export async function GET(_request: NextRequest): Promise<NextResponse> {
  const { headers } = await import("next/headers");
  const headersList = await headers();
  const userId = headersList.get("x-user-id");
  const workspaceId = headersList.get("x-workspace-id");

  if (!userId || !workspaceId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await connect();

    const workspace = await WorkspaceModel.findById(workspaceId).lean<{ plan?: string }>().exec();
    const plan = workspace?.plan ?? "free";

    const usage = await DocumentModel.aggregate<{
      totalBytes: number;
      fileCount: number;
    }>([
      { $match: { tenantId: workspaceId, deletedAt: null } },
      { $group: { _id: null, totalBytes: { $sum: "$fileSize" }, fileCount: { $sum: 1 } } },
    ]).exec();

    const limits = getTierLimits(plan);

    const used = usage[0]?.totalBytes ?? 0;
    const fileCount = usage[0]?.fileCount ?? 0;
    const percentage = limits.totalStorage > 0 ? Math.round((used / limits.totalStorage) * 10000) / 100 : 0;

    return NextResponse.json({
      used,
      limit: limits.totalStorage,
      percentage,
      fileCount,
      maxFileSize: limits.maxFileSize,
      plan,
    });
  } catch (error) {
    logger.error({ error, workspaceId }, "Failed to fetch storage usage");
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch storage usage" },
      { status: 500 },
    );
  }
}
