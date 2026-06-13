"use server";

import { updateWorkspaceSchema } from "@repo/validation";

export interface UpdateWorkspaceActionResult {
  success: boolean;
  error?: string;
  code?: string;
}

export interface UpdateSettingsActionResult {
  success: boolean;
  error?: string;
  code?: string;
}

export async function updateWorkspaceAction(
  _prevState: UpdateWorkspaceActionResult,
  formData: FormData,
): Promise<UpdateWorkspaceActionResult> {
  const raw: Record<string, string | undefined> = {};
  for (const field of ["name", "slug", "description", "workspaceId"]) {
    const value = formData.get(field);
    if (typeof value === "string" && value.length > 0) {
      raw[field] = value;
    }
  }

  const workspaceId = raw.workspaceId;
  if (!workspaceId) {
    return { success: false, error: "Workspace ID is required", code: "validation_error" };
  }

  const data: Record<string, unknown> = {};
  if (raw.name) data.name = raw.name;
  if (raw.slug) data.slug = raw.slug;
  if (raw.description) data.description = raw.description;

  if (Object.keys(data).length === 0) {
    return { success: false, error: "No fields to update", code: "validation_error" };
  }

  const parsed = updateWorkspaceSchema.safeParse(data);
  if (!parsed.success) {
    const firstError = parsed.error.errors[0];
    return {
      success: false,
      error: firstError?.message ?? "Invalid input",
      code: "validation_error",
    };
  }

  try {
    const { headers } = await import("next/headers");
    const userId = (await headers()).get("x-user-id");
    if (!userId) {
      return { success: false, error: "Unauthorized", code: "unauthorized" };
    }

    const [
      { connect, WorkspaceRepository, UserRepository },
      { createWorkspaceService, createRBACService },
    ] = await Promise.all([import("@repo/database"), import("@repo/auth")]);

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

    const result = await service.update(workspaceId, parsed.data, userId);
    if (!result.success) {
      return {
        success: false,
        error: result.error ?? "Failed to update workspace",
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

export async function updateSettingsAction(
  workspaceId: string,
  settings: Record<string, unknown>,
): Promise<UpdateSettingsActionResult> {
  try {
    const { headers } = await import("next/headers");
    const userId = (await headers()).get("x-user-id");
    if (!userId) {
      return { success: false, error: "Unauthorized", code: "unauthorized" };
    }

    const [
      { connect, WorkspaceRepository, UserRepository },
      { createWorkspaceService, createRBACService },
    ] = await Promise.all([import("@repo/database"), import("@repo/auth")]);

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

    const result = await service.updateSettings(workspaceId, settings, userId);
    if (!result.success) {
      return {
        success: false,
        error: result.error ?? "Failed to update settings",
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
