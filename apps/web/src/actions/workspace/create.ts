"use server";

import { createWorkspaceSchema } from "@repo/validation";

export interface CreateWorkspaceActionResult {
  success: boolean;
  error?: string;
  code?: string;
  workspaceId?: string;
}

export interface CheckSlugResult {
  available: boolean;
}

export async function createWorkspaceAction(
  _prevState: CreateWorkspaceActionResult,
  formData: FormData,
): Promise<CreateWorkspaceActionResult> {
  const raw = {
    name: formData.get("name") as string,
    slug: formData.get("slug") as string,
    description: formData.get("description") as string,
  };

  const parsed = createWorkspaceSchema.safeParse({
    ...raw,
    description: raw.description || undefined,
  });
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
    const getUserRole = async (_uid: string, _wid: string): Promise<null> => {
      await Promise.resolve();
      return null;
    };
    const rbac = createRBACService(getUserRole);
    const service = createWorkspaceService(workspaceRepo, userRepo, rbac);

    const result = await service.create(parsed.data, userId);
    if (!result.success) {
      return {
        success: false,
        error: result.error ?? "Failed to create workspace",
        code: result.code?.toLowerCase() ?? "unknown",
      };
    }

    const workspaceData = result.data as { id?: string } | undefined;
    return { success: true, workspaceId: workspaceData?.id };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unexpected error occurred",
      code: "unknown",
    };
  }
}

export async function checkSlugAction(slug: string): Promise<CheckSlugResult> {
  if (!slug || slug.length < 2) {
    return { available: false };
  }

  try {
    const { connect, WorkspaceRepository } = await import("@repo/database");

    await connect();

    const repo = new WorkspaceRepository("system");
    const existing = await repo.findBySlug(slug);

    return { available: !existing };
  } catch {
    return { available: true };
  }
}
