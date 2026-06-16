import { NextResponse } from "next/server";

import { connect, WorkspaceModel } from "@repo/database";

export async function GET(request: Request): Promise<Response> {
  const userId = request.headers.get("x-user-id");
  if (!userId) {
    return NextResponse.json({ data: null, error: "Unauthorized" }, { status: 401 });
  }

  try {
    await connect();

    const workspaces = await WorkspaceModel.find({
      deletedAt: null,
      $or: [
        { ownerId: userId },
        { "members.userId": userId, "members.deletedAt": null },
      ],
    })
      .select("name slug avatar memberCount ownerId")
      .sort({ createdAt: -1 })
      .lean();

    const data = workspaces.map((w) => ({
      _id: w._id.toString(),
      name: w.name,
      slug: w.slug,
      avatar: w.avatar,
      memberCount: w.memberCount,
      ownerId: w.ownerId,
    }));

    return NextResponse.json({ data, error: null });
  } catch (error) {
    return NextResponse.json(
      { data: null, error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    );
  }
}
