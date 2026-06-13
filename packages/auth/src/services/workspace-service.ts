import type { RBACService } from "../rbac/service";
import type { IWorkspace, UserRepository, WorkspaceRepository } from "@repo/database";
import { createLogger } from "@repo/logger";
import { WorkspaceRole } from "@repo/types";
import { slugify } from "@repo/utils";

const logger = createLogger("@repo/auth:workspace-service");

export interface WorkspaceServiceResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
}

export interface WorkspaceServiceMethods {
  create(data: { name: string; slug?: string; description?: string }, userId: string): Promise<WorkspaceServiceResult<IWorkspace>>;
  getById(workspaceId: string, userId: string): Promise<WorkspaceServiceResult<IWorkspace>>;
  update(workspaceId: string, data: Record<string, unknown>, userId: string): Promise<WorkspaceServiceResult<IWorkspace>>;
  archive(workspaceId: string, userId: string): Promise<WorkspaceServiceResult<void>>;
  restore(workspaceId: string, userId: string): Promise<WorkspaceServiceResult<IWorkspace>>;
  listUserWorkspaces(userId: string): Promise<WorkspaceServiceResult<IWorkspace[]>>;
  addMember(workspaceId: string, email: string, role: string, inviterId: string): Promise<WorkspaceServiceResult<void>>;
  removeMember(workspaceId: string, targetUserId: string, requesterId: string): Promise<WorkspaceServiceResult<void>>;
  transferOwnership(workspaceId: string, newOwnerId: string, currentOwnerId: string): Promise<WorkspaceServiceResult<void>>;
  updateSettings(workspaceId: string, settings: Record<string, unknown>, userId: string): Promise<WorkspaceServiceResult<IWorkspace>>;
}

export function createWorkspaceService(
  workspaceRepo: WorkspaceRepository,
  userRepo: UserRepository,
  rbacService: RBACService,
): WorkspaceServiceMethods {
  async function generateUniqueSlug(base: string): Promise<string> {
    const slug = slugify(base).substring(0, 63);
    const existing = await workspaceRepo.findBySlug(slug);
    if (!existing) return slug;

    for (let i = 1; i < 100; i++) {
      const candidate = `${slug}-${i}`.substring(0, 63);
      const existing = await workspaceRepo.findBySlug(candidate);
      if (!existing) return candidate;
    }

    const fallback = `${slug}-${Date.now()}`.substring(0, 63);
    return fallback;
  }

  async function create(
    data: { name: string; slug?: string; description?: string },
    userId: string,
  ): Promise<WorkspaceServiceResult<IWorkspace>> {
    try {
      if (!data.name || data.name.length < 2 || data.name.length > 100) {
        return { success: false, error: "Name must be between 2 and 100 characters", code: "VALIDATION_ERROR" };
      }

      const slug = data.slug ?? (await generateUniqueSlug(data.name));

      const slugExists = await workspaceRepo.findBySlug(slug);
      if (slugExists) {
        return { success: false, error: "A workspace with this slug already exists", code: "CONFLICT" };
      }

      const workspace = await workspaceRepo.create({
        name: data.name.trim(),
        slug,
        description: data.description?.trim(),
        ownerId: userId,
        isActive: true,
        plan: "free",
      });

      const workspaceId = (workspace as unknown as { _id: string })._id;

      await workspaceRepo.addMember(workspaceId, userId, WorkspaceRole.Owner);

      logger.info({ workspaceId: workspaceId, userId, slug }, "workspace created");
      return { success: true, data: workspace };
    } catch (error) {
      logger.error({ error, userId }, "workspace creation failed");
      return { success: false, error: "Failed to create workspace", code: "INTERNAL_ERROR" };
    }
  }

  async function getById(
    workspaceId: string,
    userId: string,
  ): Promise<WorkspaceServiceResult<IWorkspace>> {
    try {
      const workspace = await workspaceRepo.findById(workspaceId);
      if (!workspace) {
        return { success: false, error: "Workspace not found", code: "NOT_FOUND" };
      }

      const isOwner = workspace.ownerId === userId;
      const isMember = workspace.members?.some(
        (m) => m.userId === userId && !m.deletedAt,
      );

      if (!isOwner && !isMember) {
        return { success: false, error: "You are not a member of this workspace", code: "FORBIDDEN" };
      }

      return { success: true, data: workspace };
    } catch (error) {
      logger.error({ error, workspaceId }, "failed to get workspace");
      return { success: false, error: "Failed to get workspace", code: "INTERNAL_ERROR" };
    }
  }

  async function update(
    workspaceId: string,
    data: Record<string, unknown>,
    userId: string,
  ): Promise<WorkspaceServiceResult<IWorkspace>> {
    try {
      const isAdmin = await rbacService.hasRole(userId, workspaceId, "admin");
      if (!isAdmin) {
        return { success: false, error: "Only admins can update workspace settings", code: "FORBIDDEN" };
      }

      const allowedFields = ["name", "slug", "description", "avatar", "plan", "isActive"];
      const updateData: Record<string, unknown> = {};

      for (const [key, value] of Object.entries(data)) {
        if (allowedFields.includes(key)) {
          updateData[key] = value;
        }
      }

      if (Object.keys(updateData).length === 0) {
        return { success: false, error: "No valid fields to update", code: "VALIDATION_ERROR" };
      }

      if (updateData.slug) {
        const slugExists = await workspaceRepo.findBySlug(
          updateData.slug as string,
          workspaceId,
        );
        if (slugExists) {
          return { success: false, error: "A workspace with this slug already exists", code: "CONFLICT" };
        }
      }

      const workspace = await workspaceRepo.updateById(workspaceId, updateData);
      if (!workspace) {
        return { success: false, error: "Workspace not found", code: "NOT_FOUND" };
      }

      logger.info({ workspaceId, userId }, "workspace updated");
      return { success: true, data: workspace };
    } catch (error) {
      logger.error({ error, workspaceId }, "workspace update failed");
      return { success: false, error: "Failed to update workspace", code: "INTERNAL_ERROR" };
    }
  }

  async function archive(
    workspaceId: string,
    userId: string,
  ): Promise<WorkspaceServiceResult<void>> {
    try {
      const isAdmin = await rbacService.hasRole(userId, workspaceId, "admin");
      if (!isAdmin) {
        return { success: false, error: "Only admins can archive workspaces", code: "FORBIDDEN" };
      }

      const workspace = await workspaceRepo.archive(workspaceId);
      if (!workspace) {
        return { success: false, error: "Workspace not found", code: "NOT_FOUND" };
      }

      logger.info({ workspaceId, userId }, "workspace archived");
      return { success: true };
    } catch (error) {
      logger.error({ error, workspaceId }, "workspace archive failed");
      return { success: false, error: "Failed to archive workspace", code: "INTERNAL_ERROR" };
    }
  }

  async function restore(
    workspaceId: string,
    userId: string,
  ): Promise<WorkspaceServiceResult<IWorkspace>> {
    try {
      const isAdmin = await rbacService.hasRole(userId, workspaceId, "admin");
      if (!isAdmin) {
        return { success: false, error: "Only admins can restore workspaces", code: "FORBIDDEN" };
      }

      const workspace = await workspaceRepo.restore(workspaceId);
      if (!workspace) {
        return { success: false, error: "Workspace not found or not archived", code: "NOT_FOUND" };
      }

      logger.info({ workspaceId, userId }, "workspace restored");
      return { success: true, data: workspace };
    } catch (error) {
      logger.error({ error, workspaceId }, "workspace restore failed");
      return { success: false, error: "Failed to restore workspace", code: "INTERNAL_ERROR" };
    }
  }

  async function listUserWorkspaces(userId: string): Promise<WorkspaceServiceResult<IWorkspace[]>> {
    try {
      const workspaces = await workspaceRepo.findMany(
        { "members.userId": userId, "members.deletedAt": null },
        { sort: { updatedAt: -1 } },
      );

      return { success: true, data: workspaces };
    } catch (error) {
      logger.error({ error, userId }, "failed to list user workspaces");
      return { success: false, error: "Failed to list workspaces", code: "INTERNAL_ERROR" };
    }
  }

  async function addMember(
    workspaceId: string,
    email: string,
    role: string,
    inviterId: string,
  ): Promise<WorkspaceServiceResult<void>> {
    try {
      const validRoles: readonly string[] = Object.values(WorkspaceRole);
      if (!validRoles.includes(role)) {
        return { success: false, error: "Invalid role", code: "VALIDATION_ERROR" };
      }

      const isAdmin = await rbacService.hasRole(inviterId, workspaceId, "admin");
      if (!isAdmin) {
        return { success: false, error: "Only admins can add members", code: "FORBIDDEN" };
      }

      const user = await userRepo.findByEmail(email);
      if (!user) {
        return { success: false, error: "No user found with this email address", code: "NOT_FOUND" };
      }

      const targetUserId = (user as unknown as { _id: string })._id;

      const workspace = await workspaceRepo.findById(workspaceId);
      if (!workspace) {
        return { success: false, error: "Workspace not found", code: "NOT_FOUND" };
      }

      const existingMember = workspace.members?.some(
        (m) => m.userId === targetUserId && !m.deletedAt,
      );
      if (existingMember) {
        return { success: false, error: "User is already a member of this workspace", code: "CONFLICT" };
      }

      await workspaceRepo.addMember(
        workspaceId,
        targetUserId,
        role as (typeof WorkspaceRole)[keyof typeof WorkspaceRole],
      );

      logger.info({ workspaceId, userId: targetUserId, role, invitedBy: inviterId }, "member added to workspace");
      return { success: true };
    } catch (error) {
      logger.error({ error, workspaceId, email }, "failed to add member");
      return { success: false, error: "Failed to add member", code: "INTERNAL_ERROR" };
    }
  }

  async function removeMember(
    workspaceId: string,
    targetUserId: string,
    requesterId: string,
  ): Promise<WorkspaceServiceResult<void>> {
    try {
      const isAdmin = await rbacService.hasRole(requesterId, workspaceId, "admin");
      if (!isAdmin) {
        return { success: false, error: "Only admins can remove members", code: "FORBIDDEN" };
      }

      const workspace = await workspaceRepo.findById(workspaceId);
      if (!workspace) {
        return { success: false, error: "Workspace not found", code: "NOT_FOUND" };
      }

      const activeOwners = workspace.members?.filter(
        (m) => m.role === WorkspaceRole.Owner && !m.deletedAt,
      );

      const isTargetOwner = workspace.ownerId === targetUserId;
      const isLastOwner = isTargetOwner && (activeOwners?.length ?? 0) <= 1;

      if (isLastOwner) {
        return {
          success: false,
          error: "Cannot remove the last owner. Transfer ownership first.",
          code: "BAD_REQUEST",
        };
      }

      const removed = await workspaceRepo.removeMember(workspaceId, targetUserId);
      if (!removed) {
        return { success: false, error: "User is not a member of this workspace", code: "NOT_FOUND" };
      }

      logger.info({ workspaceId, targetUserId, removedBy: requesterId }, "member removed from workspace");
      return { success: true };
    } catch (error) {
      logger.error({ error, workspaceId, targetUserId }, "failed to remove member");
      return { success: false, error: "Failed to remove member", code: "INTERNAL_ERROR" };
    }
  }

  async function transferOwnership(
    workspaceId: string,
    newOwnerId: string,
    currentOwnerId: string,
  ): Promise<WorkspaceServiceResult<void>> {
    try {
      const workspace = await workspaceRepo.findById(workspaceId);
      if (!workspace) {
        return { success: false, error: "Workspace not found", code: "NOT_FOUND" };
      }

      if (workspace.ownerId !== currentOwnerId) {
        return {
          success: false,
          error: "Only the current owner can transfer ownership",
          code: "FORBIDDEN",
        };
      }

      if (currentOwnerId === newOwnerId) {
        return { success: false, error: "New owner must be a different user", code: "BAD_REQUEST" };
      }

      const transferred = await workspaceRepo.transferOwnership(workspaceId, newOwnerId);
      if (!transferred) {
        return { success: false, error: "Ownership transfer failed", code: "INTERNAL_ERROR" };
      }

      await workspaceRepo.updateMemberRole(workspaceId, currentOwnerId, WorkspaceRole.Admin);
      await workspaceRepo.updateMemberRole(workspaceId, newOwnerId, WorkspaceRole.Owner);

      logger.info({ workspaceId, fromUserId: currentOwnerId, toUserId: newOwnerId }, "ownership transferred");
      return { success: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Ownership transfer failed";
      logger.error({ error, workspaceId }, "ownership transfer failed");
      return { success: false, error: message, code: "INTERNAL_ERROR" };
    }
  }

  async function updateSettings(
    workspaceId: string,
    settings: Record<string, unknown>,
    userId: string,
  ): Promise<WorkspaceServiceResult<IWorkspace>> {
    try {
      const isAdmin = await rbacService.hasRole(userId, workspaceId, "admin");
      if (!isAdmin) {
        return { success: false, error: "Only admins can update workspace settings", code: "FORBIDDEN" };
      }

      const updated = await workspaceRepo.updateSettings(workspaceId, settings);
      if (!updated) {
        return { success: false, error: "Workspace not found", code: "NOT_FOUND" };
      }

      logger.info({ workspaceId, userId }, "workspace settings updated");
      return { success: true, data: updated };
    } catch (error) {
      logger.error({ error, workspaceId }, "workspace settings update failed");
      return { success: false, error: "Failed to update settings", code: "INTERNAL_ERROR" };
    }
  }

  return {
    create,
    getById,
    update,
    archive,
    restore,
    listUserWorkspaces,
    addMember,
    removeMember,
    transferOwnership,
    updateSettings,
  };
}

export type WorkspaceService = WorkspaceServiceMethods;
