"use server";

import { createInvitationService, createRBACService, createWorkspaceService } from "@repo/auth";
import { connect, InvitationRepository, WorkspaceRepository, UserRepository, IInvitation } from "@repo/database";

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

export interface InvitationData {
  _id: string;
  id: string;
  inviteeEmail: string;
  role: string;
  status: string;
  message?: string;
  createdAt: string;
  expiresAt: string;
  token: string;
}

export interface GetInvitationsResult {
  success: boolean;
  invitations?: InvitationData[];
  error?: string;
  code?: string;
}

export async function getInvitationsAction(
  workspaceId: string,
): Promise<GetInvitationsResult> {
  try {
    const { headers } = await import("next/headers");
    const requesterId = (await headers()).get("x-user-id");
    if (!requesterId) {
      return { success: false, error: "Unauthorized", code: "unauthorized" };
    }

    await connect();

    const repo = new InvitationRepository();
    const result = await repo.findByWorkspace(workspaceId, { status: "pending" });

    return {
      success: true,
      invitations: result.invitations.map((inv) => ({
        _id: String((inv as IInvitation & Record<string, unknown>)._id),
        id: String((inv as IInvitation & Record<string, unknown>).id ?? (inv as IInvitation & Record<string, unknown>)._id),
        inviteeEmail: inv.inviteeEmail,
        role: inv.role,
        status: inv.status,
        message: inv.message,
        createdAt: inv.createdAt.toISOString(),
        expiresAt: inv.expiresAt.toISOString(),
        token: inv.token,
      })),
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to load invitations",
      code: "unknown",
    };
  }
}

export async function respondToInvitationAction(
  token: string,
  actionType: "accept" | "decline",
): Promise<InviteActionResult> {
  try {
    const { headers } = await import("next/headers");
    const requesterId = (await headers()).get("x-user-id");
    if (!requesterId) {
      return { success: false, error: "Unauthorized", code: "unauthorized" };
    }

    await connect();

    const invitationRepo = new InvitationRepository();
    const workspaceRepo = new WorkspaceRepository(requesterId);
    const userRepo = new UserRepository();
    const getUserRole = (): Promise<"owner" | "admin" | "member" | "viewer" | null> => Promise.resolve(null);
    const rbac = createRBACService(getUserRole);
    const service = createInvitationService(invitationRepo, workspaceRepo, userRepo, rbac);

    const result = actionType === "accept"
      ? await service.accept(token, requesterId)
      : await service.decline(token);

    if (!result.success) {
      return {
        success: false,
        error: result.error ?? `Failed to ${actionType} invitation`,
        code: result.code?.toLowerCase() ?? "unknown",
      };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : `Failed to ${actionType} invitation`,
      code: "unknown",
    };
  }
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
