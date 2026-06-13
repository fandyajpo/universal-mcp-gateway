"use server";

export interface MemberActionResult {
  success: boolean;
  error?: string;
  code?: string;
}

export interface InviteActionResult {
  success: boolean;
  error?: string;
  code?: string;
}

export async function inviteMemberAction(
  workspaceId: string,
  email: string,
  role: string,
  message?: string,
): Promise<InviteActionResult> {
  try {
    const { headers } = await import("next/headers");
    const requesterId = (await headers()).get("x-user-id");
    if (!requesterId) {
      return { success: false, error: "Unauthorized", code: "unauthorized" };
    }

    const [
      { connect, WorkspaceRepository, UserRepository, InvitationRepository },
      { createInvitationService, createRBACService },
    ] = await Promise.all([import("@repo/database"), import("@repo/auth")]);

    await connect();

    const workspaceRepo = new WorkspaceRepository(requesterId);
    const userRepo = new UserRepository();
    const invitationRepo = new InvitationRepository();
    const getUserRole = async (uid: string, wid: string): Promise<"owner" | "admin" | "member" | "viewer" | null> => {
      const ws = await workspaceRepo.findById(wid);
      if (!ws) return null;
      if (ws.ownerId === uid) return "owner" as const;
      const member = ws.members?.find((m) => m.userId === uid && !m.deletedAt);
      return member?.role ?? null;
    };
    const rbac = createRBACService(getUserRole);
    const service = createInvitationService(invitationRepo, workspaceRepo, userRepo, rbac);

    const workspace = await workspaceRepo.findById(workspaceId);
    if (!workspace) {
      return { success: false, error: "Workspace not found", code: "not_found" };
    }

    const result = await service.create({
      workspaceId,
      workspaceName: workspace.name,
      inviterId: requesterId,
      inviteeEmail: email,
      role,
      message,
    });

    if (!result.success) {
      return {
        success: false,
        error: result.error ?? "Failed to send invitation",
        code: result.code?.toLowerCase() ?? "unknown",
      };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unexpected error occurred",
      code: "unknown",
    };
  }
}

export async function cancelInvitationAction(
  invitationId: string,
  _workspaceId: string,
): Promise<InviteActionResult> {
  try {
    const { headers } = await import("next/headers");
    const requesterId = (await headers()).get("x-user-id");
    if (!requesterId) {
      return { success: false, error: "Unauthorized", code: "unauthorized" };
    }

    const [
      { connect, WorkspaceRepository, UserRepository, InvitationRepository },
      { createInvitationService, createRBACService },
    ] = await Promise.all([import("@repo/database"), import("@repo/auth")]);

    await connect();

    const workspaceRepo = new WorkspaceRepository(requesterId);
    const userRepo = new UserRepository();
    const invitationRepo = new InvitationRepository();
    const getUserRole = async (uid: string, wid: string): Promise<"owner" | "admin" | "member" | "viewer" | null> => {
      const ws = await workspaceRepo.findById(wid);
      if (!ws) return null;
      if (ws.ownerId === uid) return "owner" as const;
      const member = ws.members?.find((m) => m.userId === uid && !m.deletedAt);
      return member?.role ?? null;
    };
    const rbac = createRBACService(getUserRole);
    const service = createInvitationService(invitationRepo, workspaceRepo, userRepo, rbac);

    const result = await service.cancel(invitationId, requesterId);
    if (!result.success) {
      return {
        success: false,
        error: result.error ?? "Failed to cancel invitation",
        code: result.code?.toLowerCase() ?? "unknown",
      };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unexpected error occurred",
      code: "unknown",
    };
  }
}

export async function resendInvitationAction(
  token: string,
  _workspaceId: string,
): Promise<InviteActionResult> {
  try {
    const { headers } = await import("next/headers");
    const requesterId = (await headers()).get("x-user-id");
    if (!requesterId) {
      return { success: false, error: "Unauthorized", code: "unauthorized" };
    }

    const [
      { connect, WorkspaceRepository, UserRepository, InvitationRepository },
      { createInvitationService, createRBACService },
    ] = await Promise.all([import("@repo/database"), import("@repo/auth")]);

    await connect();

    const workspaceRepo = new WorkspaceRepository(requesterId);
    const userRepo = new UserRepository();
    const invitationRepo = new InvitationRepository();
    const getUserRole = async (uid: string, wid: string): Promise<"owner" | "admin" | "member" | "viewer" | null> => {
      const ws = await workspaceRepo.findById(wid);
      if (!ws) return null;
      if (ws.ownerId === uid) return "owner" as const;
      const member = ws.members?.find((m) => m.userId === uid && !m.deletedAt);
      return member?.role ?? null;
    };
    const rbac = createRBACService(getUserRole);
    const service = createInvitationService(invitationRepo, workspaceRepo, userRepo, rbac);

    const result = await service.resend(token, requesterId);
    if (!result.success) {
      return {
        success: false,
        error: result.error ?? "Failed to resend invitation",
        code: result.code?.toLowerCase() ?? "unknown",
      };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unexpected error occurred",
      code: "unknown",
    };
  }
}

export async function changeMemberRoleAction(
  workspaceId: string,
  targetUserId: string,
  role: string,
): Promise<MemberActionResult> {
  try {
    const { headers } = await import("next/headers");
    const requesterId = (await headers()).get("x-user-id");
    if (!requesterId) {
      return { success: false, error: "Unauthorized", code: "unauthorized" };
    }

    const [
      { connect, WorkspaceRepository },
      { createRBACService },
    ] = await Promise.all([import("@repo/database"), import("@repo/auth")]);

    await connect();

    const workspaceRepo = new WorkspaceRepository(requesterId);
    const getUserRole = async (uid: string, wid: string): Promise<"owner" | "admin" | "member" | "viewer" | null> => {
      const ws = await workspaceRepo.findById(wid);
      if (!ws) return null;
      if (ws.ownerId === uid) return "owner" as const;
      const member = ws.members?.find((m) => m.userId === uid && !m.deletedAt);
      return member?.role ?? null;
    };
    const rbac = createRBACService(getUserRole);

    const isAdmin = await rbac.hasRole(requesterId, workspaceId, "admin");
    if (!isAdmin) {
      return { success: false, error: "Only admins can change member roles", code: "forbidden" };
    }

    const updated = await workspaceRepo.updateMemberRole(workspaceId, targetUserId, role as "owner" | "admin" | "member" | "viewer");
    if (!updated) {
      return { success: false, error: "Member not found", code: "not_found" };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unexpected error occurred",
      code: "unknown",
    };
  }
}

export async function removeMemberAction(
  workspaceId: string,
  targetUserId: string,
): Promise<MemberActionResult> {
  try {
    const { headers } = await import("next/headers");
    const requesterId = (await headers()).get("x-user-id");
    if (!requesterId) {
      return { success: false, error: "Unauthorized", code: "unauthorized" };
    }

    const [
      { connect, WorkspaceRepository, UserRepository },
      { createWorkspaceService, createRBACService },
    ] = await Promise.all([import("@repo/database"), import("@repo/auth")]);

    await connect();

    const workspaceRepo = new WorkspaceRepository(requesterId);
    const userRepo = new UserRepository();
    const getUserRole = async (uid: string, wid: string): Promise<"owner" | "admin" | "member" | "viewer" | null> => {
      const ws = await workspaceRepo.findById(wid);
      if (!ws) return null;
      if (ws.ownerId === uid) return "owner" as const;
      const member = ws.members?.find((m) => m.userId === uid && !m.deletedAt);
      return member?.role ?? null;
    };
    const rbac = createRBACService(getUserRole);
    const service = createWorkspaceService(workspaceRepo, userRepo, rbac);

    const result = await service.removeMember(workspaceId, targetUserId, requesterId);
    if (!result.success) {
      return {
        success: false,
        error: result.error ?? "Failed to remove member",
        code: result.code?.toLowerCase() ?? "unknown",
      };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unexpected error occurred",
      code: "unknown",
    };
  }
}
