import { createPermissionCache } from "./cache";
import type { Permission } from "./permissions";
import { roleHasPermission, type WorkspaceRole } from "./roles";
import { createLogger } from "@repo/logger";

const logger = createLogger("@repo/auth:rbac:service");

export type GetUserRoleFn = (userId: string, workspaceId: string) => Promise<WorkspaceRole | null>;

export function createRBACService(getUserRole: GetUserRoleFn): RBACServiceMethods {
  const cache = createPermissionCache();

  async function checkPermission(
    userId: string,
    workspaceId: string,
    permission: Permission,
  ): Promise<boolean> {
    try {
      const cached = await cache.get(userId, workspaceId, permission);
      if (cached !== null) return cached;
    } catch {
      logger.warn({ userId, workspaceId, permission }, "cache read failed, falling through");
    }

    const role = await getUserRole(userId, workspaceId);
    if (!role) {
      await cache.set(false, userId, workspaceId, permission);
      return false;
    }

    await cache.cacheRole(role, userId, workspaceId);

    const result = roleHasPermission(role, permission);
    await cache.set(result, userId, workspaceId, permission);
    return result;
  }

  async function checkPermissions(
    userId: string,
    workspaceId: string,
    permissions: Permission[],
  ): Promise<Record<string, boolean>> {
    const results: Record<string, boolean> = {};
    const uncached: Permission[] = [];

    for (const permission of permissions) {
      try {
        const cached = await cache.get(userId, workspaceId, permission);
        if (cached !== null) {
          results[permission] = cached;
        } else {
          uncached.push(permission);
        }
      } catch {
        uncached.push(permission);
      }
    }

    if (uncached.length === 0) return results;

    const role = await getUserRole(userId, workspaceId);
    if (!role) {
      for (const permission of uncached) {
        results[permission] = false;
        await cache.set(false, userId, workspaceId, permission);
      }
      return results;
    }

    await cache.cacheRole(role, userId, workspaceId);

    for (const permission of uncached) {
      const result = roleHasPermission(role, permission);
      results[permission] = result;
      await cache.set(result, userId, workspaceId, permission);
    }

    return results;
  }

  async function getUserRoleCached(userId: string, workspaceId: string): Promise<WorkspaceRole | null> {
    try {
      const cached = await cache.getCachedRole(userId, workspaceId);
      if (cached && isWorkspaceRole(cached)) return cached;
    } catch {
      logger.warn({ userId, workspaceId }, "cached role read failed");
    }

    const role = await getUserRole(userId, workspaceId);
    if (role) {
      await cache.cacheRole(role, userId, workspaceId);
    }
    return role;
  }

  async function hasRole(userId: string, workspaceId: string, minimumRole: WorkspaceRole): Promise<boolean> {
    const role = await getUserRoleCached(userId, workspaceId);
    if (!role) return false;
    return roleAtLeast(role, minimumRole);
  }

  async function invalidateCache(userId: string, workspaceId: string): Promise<void> {
    await cache.invalidateAll(userId, workspaceId);
    logger.info({ userId, workspaceId }, "permission cache invalidated");
  }

  return {
    checkPermission,
    checkPermissions,
    getUserRole: getUserRoleCached,
    hasRole,
    invalidateCache,
  };
}

function roleAtLeast(role: WorkspaceRole, minimum: WorkspaceRole): boolean {
  const hierarchy: Record<WorkspaceRole, number> = {
    owner: 100,
    admin: 80,
    member: 50,
    viewer: 10,
  };
  return hierarchy[role] >= hierarchy[minimum];
}

function isWorkspaceRole(value: string): value is WorkspaceRole {
  return ["owner", "admin", "member", "viewer"].includes(value);
}

export interface RBACServiceMethods {
  checkPermission(userId: string, workspaceId: string, permission: Permission): Promise<boolean>;
  checkPermissions(userId: string, workspaceId: string, permissions: Permission[]): Promise<Record<string, boolean>>;
  getUserRole(userId: string, workspaceId: string): Promise<WorkspaceRole | null>;
  hasRole(userId: string, workspaceId: string, minimumRole: WorkspaceRole): Promise<boolean>;
  invalidateCache(userId: string, workspaceId: string): Promise<void>;
}

export type RBACService = RBACServiceMethods;
