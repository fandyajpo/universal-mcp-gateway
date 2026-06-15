import { NextRequest, NextResponse } from "next/server";

import { createGetUserRole } from "../../../../../../lib/middleware/get-user-role";
import { workspaceRoleSchema } from "@repo/validation";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string; userId: string }> },
): Promise<NextResponse> {
  const requesterId = request.headers.get("x-user-id");
  if (!requesterId) {
    return NextResponse.json({ data: null, error: "Unauthorized" }, { status: 401 });
  }

  const { workspaceId, userId: targetUserId } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ data: null, error: "Invalid JSON body" }, { status: 400 });
  }

  const raw = body as Record<string, unknown>;
  const roleParsed = workspaceRoleSchema.safeParse(raw.role);
  if (!roleParsed.success) {
    return NextResponse.json(
      { data: null, error: roleParsed.error.errors[0]?.message ?? "Invalid role" },
      { status: 400 },
    );
  }

  try {
    const [{ connect, WorkspaceRepository }, { createRBACService }] = await Promise.all([
      import("@repo/database"),
      import("@repo/auth"),
    ]);

    await connect();

    const workspaceRepo = new WorkspaceRepository(requesterId);
    const getUserRole = createGetUserRole(workspaceRepo);
    const rbac = createRBACService(getUserRole);

    const isAdmin = await rbac.hasRole(requesterId, workspaceId, "admin");
    if (!isAdmin) {
      return NextResponse.json({ data: null, error: "Only admins can update member roles" }, { status: 403 });
    }

    const updated = await workspaceRepo.updateMemberRole(workspaceId, targetUserId, roleParsed.data);
    if (!updated) {
      return NextResponse.json({ data: null, error: "Member not found" }, { status: 404 });
    }

    await rbac.invalidateCache(targetUserId, workspaceId);

    return NextResponse.json({ data: null, error: null });
  } catch (error) {
    return NextResponse.json(
      { data: null, error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string; userId: string }> },
): Promise<NextResponse> {
  const requesterId = request.headers.get("x-user-id");
  if (!requesterId) {
    return NextResponse.json({ data: null, error: "Unauthorized" }, { status: 401 });
  }

  const { workspaceId, userId: targetUserId } = await params;

  try {
    const [{ connect, WorkspaceRepository, UserRepository }, { createWorkspaceService, createRBACService }] =
      await Promise.all([import("@repo/database"), import("@repo/auth")]);

    await connect();

    const userRepo = new UserRepository();
    const workspaceRepo = new WorkspaceRepository(requesterId);
    const getUserRole = createGetUserRole(workspaceRepo);
    const rbac = createRBACService(getUserRole);
    const service = createWorkspaceService(workspaceRepo, userRepo, rbac);

    const result = await service.removeMember(workspaceId, targetUserId, requesterId);
    if (!result.success) {
      const code = result.code === "FORBIDDEN" ? 403 : result.code === "BAD_REQUEST" ? 400 : 404;
      return NextResponse.json({ data: null, error: result.error }, { status: code });
    }

    return NextResponse.json({ data: null, error: null });
  } catch (error) {
    return NextResponse.json(
      { data: null, error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    );
  }
}
