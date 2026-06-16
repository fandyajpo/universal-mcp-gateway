"use server";

import { createWorkspaceService, createRBACService } from "@repo/auth";
import { connect, WorkspaceRepository, UserRepository } from "@repo/database";

export interface ArchiveWorkspaceActionResult {
  success: boolean;
  error?: string;
  code?: string;
}

export async function archiveWorkspaceAction(
  workspaceId: string,
): Promise<ArchiveWorkspaceActionResult> {
  try {
    const { headers } = await import("next/headers");
    const userId = (await headers()).get("x-user-id");
    if (!userId) {
      return { success: false, error: "Unauthorized", code: "unauthorized" };
    }

    await connect();

    const workspaceRepo = new WorkspaceRepository(userId);
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

    const result = await service.archive(workspaceId, userId);
    if (!result.success) {
      return {
        success: false,
        error: result.error ?? "Failed to archive workspace",
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

export async function restoreWorkspaceAction(
  workspaceId: string,
): Promise<ArchiveWorkspaceActionResult> {
  try {
    const { headers } = await import("next/headers");
    const userId = (await headers()).get("x-user-id");
    if (!userId) {
      return { success: false, error: "Unauthorized", code: "unauthorized" };
    }

    await connect();

    const workspaceRepo = new WorkspaceRepository(userId);
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

    const result = await service.restore(workspaceId, userId);
    if (!result.success) {
      return {
        success: false,
        error: result.error ?? "Failed to restore workspace",
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
