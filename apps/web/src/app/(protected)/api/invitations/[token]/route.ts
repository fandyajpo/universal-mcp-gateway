import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> },
): Promise<NextResponse> {
  const { token } = await params;

  try {
    const [{ connect, InvitationRepository, UserRepository, WorkspaceRepository }, { createInvitationService, createRBACService }] =
      await Promise.all([import("@repo/database"), import("@repo/auth")]);

    await connect();

    const invitationRepo = new InvitationRepository();
    const workspaceRepo = new WorkspaceRepository("");
    const userRepo = new UserRepository();
    const getUserRole = function (): Promise<"owner" | "admin" | "member" | "viewer" | null> {
      return Promise.resolve(null);
    };
    const rbac = createRBACService(getUserRole);
    const service = createInvitationService(invitationRepo, workspaceRepo, userRepo, rbac);

    const result = await service.getByToken(token);
    if (!result.success) {
      const code = result.code === "NOT_FOUND" ? 404 : 400;
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

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> },
): Promise<NextResponse> {
  const userId = request.headers.get("x-user-id");
  if (!userId) {
    return NextResponse.json({ data: null, error: "Unauthorized" }, { status: 401 });
  }

  const { token } = await params;

  let body: { action?: string };
  try {
    body = (await request.json()) as { action?: string };
  } catch {
    return NextResponse.json({ data: null, error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.action || !["accept", "decline"].includes(body.action)) {
    return NextResponse.json({ data: null, error: "Action must be 'accept' or 'decline'" }, { status: 400 });
  }

  try {
    const [
      { connect, InvitationRepository, UserRepository, WorkspaceRepository },
      { createInvitationService, createRBACService },
    ] = await Promise.all([import("@repo/database"), import("@repo/auth")]);

    await connect();

    const invitationRepo = new InvitationRepository();
    const workspaceRepo = new WorkspaceRepository(userId);
    const userRepo = new UserRepository();
    const getUserRole = function (): Promise<"owner" | "admin" | "member" | "viewer" | null> {
      return Promise.resolve(null);
    };
    const rbac = createRBACService(getUserRole);
    const service = createInvitationService(invitationRepo, workspaceRepo, userRepo, rbac);

    const result =
      body.action === "accept"
        ? await service.accept(token, userId)
        : await service.decline(token);

    if (!result.success) {
      const code = result.code === "NOT_FOUND" ? 404 : result.code === "FORBIDDEN" ? 403 : result.code === "CONFLICT" ? 409 : 400;
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
