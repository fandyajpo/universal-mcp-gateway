import { NextRequest, NextResponse } from "next/server";

import { createGetUserRole } from "../../../lib/middleware/get-user-role";
import { createWorkspaceSchema } from "@repo/validation";

export async function POST(request: NextRequest): Promise<NextResponse> {
  const userId = request.headers.get("x-user-id");
  if (!userId) {
    return NextResponse.json({ data: null, error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ data: null, error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = createWorkspaceSchema.safeParse(body);
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

    const result = await service.create(parsed.data, userId);
    if (!result.success) {
      const code = result.code === "CONFLICT" ? 409 : result.code === "VALIDATION_ERROR" ? 400 : 500;
      return NextResponse.json({ data: null, error: result.error }, { status: code });
    }

    return NextResponse.json({ data: result.data, error: null }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { data: null, error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const userId = request.headers.get("x-user-id");
  if (!userId) {
    return NextResponse.json({ data: null, error: "Unauthorized" }, { status: 401 });
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

    const result = await service.listUserWorkspaces(userId);
    if (!result.success) {
      return NextResponse.json({ data: null, error: result.error }, { status: 500 });
    }

    return NextResponse.json({ data: result.data, error: null });
  } catch (error) {
    return NextResponse.json(
      { data: null, error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    );
  }
}
