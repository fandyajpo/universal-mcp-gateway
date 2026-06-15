import { NextRequest, NextResponse } from "next/server";

import { createGetUserRole } from "@/lib/middleware/get-user-role";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string }> },
): Promise<NextResponse> {
  const userId = request.headers.get("x-user-id");
  if (!userId) {
    return NextResponse.json({ data: null, error: "Unauthorized" }, { status: 401 });
  }

  const { workspaceId } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ data: null, error: "Invalid JSON body" }, { status: 400 });
  }

  if (typeof body !== "object" || body === null || Object.keys(body).length === 0) {
    return NextResponse.json({ data: null, error: "Settings body is required" }, { status: 400 });
  }

  const settings = body as Record<string, unknown>;

  try {
    const [{ connect, WorkspaceRepository, UserRepository }, { createWorkspaceService, createRBACService }] =
      await Promise.all([import("@repo/database"), import("@repo/auth")]);

    await connect();

    const userRepo = new UserRepository();
    const workspaceRepo = new WorkspaceRepository(userId);
    const getUserRole = createGetUserRole(workspaceRepo);
    const rbac = createRBACService(getUserRole);
    const service = createWorkspaceService(workspaceRepo, userRepo, rbac);

    const result = await service.updateSettings(workspaceId, settings, userId);
    if (!result.success) {
      const code = result.code === "FORBIDDEN" ? 403 : result.code === "NOT_FOUND" ? 404 : 400;
      return NextResponse.json({ data: null, error: result.error }, { status: code });
    }

    return NextResponse.json({ data: result.data, error: null });
  } catch (error) {
    return NextResponse.json(
      { data: null, error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    );
  }
}
