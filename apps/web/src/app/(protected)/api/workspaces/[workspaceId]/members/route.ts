import { NextRequest, NextResponse } from "next/server";

import { createGetUserRole } from "@/lib/middleware/get-user-role";

import { sendInvitationSchema } from "@repo/validation";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string }> },
): Promise<NextResponse> {
  const userId = request.headers.get("x-user-id");
  if (!userId) {
    return NextResponse.json({ data: null, error: "Unauthorized" }, { status: 401 });
  }

  const { workspaceId } = await params;

  try {
    const [{ connect, WorkspaceRepository }, { createRBACService }] = await Promise.all([
      import("@repo/database"),
      import("@repo/auth"),
    ]);

    await connect();

    const workspaceRepo = new WorkspaceRepository(userId);
    const getUserRole = createGetUserRole(workspaceRepo);
    const rbac = createRBACService(getUserRole);

    const role = await rbac.getUserRole(userId, workspaceId);
    if (!role) {
      return NextResponse.json({ data: null, error: "You are not a member of this workspace" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const filters: { role?: string; skip?: number; limit?: number } = {};
    const roleFilter = searchParams.get("role");
    const skip = searchParams.get("skip");
    const limit = searchParams.get("limit");
    if (roleFilter) filters.role = roleFilter;
    if (skip) filters.skip = Number(skip);
    if (limit) filters.limit = Number(limit);

    const result = await workspaceRepo.getMembers(workspaceId, filters);

    return NextResponse.json({ data: result, error: null });
  } catch (error) {
    return NextResponse.json(
      { data: null, error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(
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

  const parsed = sendInvitationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { data: null, error: parsed.error.errors[0]?.message ?? "Validation failed" },
      { status: 400 },
    );
  }

  try {
    const [{ connect, WorkspaceRepository, UserRepository }, { createWorkspaceService, createRBACService }] =
      await Promise.all([import("@repo/database"), import("@repo/auth")]);

    await connect();

    const userRepo = new UserRepository();
    const workspaceRepo = new WorkspaceRepository(userId);
    const getUserRole = createGetUserRole(workspaceRepo);
    const rbac = createRBACService(getUserRole);
    const service = createWorkspaceService(workspaceRepo, userRepo, rbac);

    const result = await service.addMember(workspaceId, parsed.data.email, parsed.data.role, userId);
    if (!result.success) {
      const code = result.code === "FORBIDDEN" ? 403 : result.code === "NOT_FOUND" ? 404 : result.code === "CONFLICT" ? 409 : 400;
      return NextResponse.json({ data: null, error: result.error }, { status: code });
    }

    return NextResponse.json({ data: null, error: null }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { data: null, error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    );
  }
}
