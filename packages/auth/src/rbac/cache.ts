import { createCacheClient } from "@repo/cache";
import { createLogger } from "@repo/logger";

const logger = createLogger("@repo/auth:rbac:cache");

const PERMISSION_CACHE_TTL = 300;

export function permissionCacheKey(userId: string, workspaceId: string, permission: string): string {
  return `tenant:${workspaceId}:perm:${userId}:${permission}`;
}

export function roleCacheKey(userId: string, workspaceId: string): string {
  return `tenant:${workspaceId}:role:${userId}`;
}

export function permissionInvalidationPattern(workspaceId: string, userId: string): string {
  return `tenant:${workspaceId}:perm:${userId}:*`;
}

export function createPermissionCache(): PermissionCacheMethods {
  const cache = createCacheClient();

  async function get(userId: string, workspaceId: string, permission: string): Promise<boolean | null> {
    try {
      const key = permissionCacheKey(userId, workspaceId, permission);
      const value = await cache.get<number>(key);
      if (value === null) return null;
      return value === 1;
    } catch (error) {
      logger.error({ error, userId, workspaceId, permission }, "failed to get cached permission");
      return null;
    }
  }

  async function set(result: boolean, userId: string, workspaceId: string, permission: string): Promise<void> {
    try {
      const key = permissionCacheKey(userId, workspaceId, permission);
      await cache.set(key, result ? 1 : 0, { ex: PERMISSION_CACHE_TTL });
    } catch (error) {
      logger.error({ error, userId, workspaceId, permission }, "failed to cache permission");
    }
  }

  async function getCachedRole(userId: string, workspaceId: string): Promise<string | null> {
    try {
      const key = roleCacheKey(userId, workspaceId);
      return await cache.get<string>(key);
    } catch (error) {
      logger.error({ error, userId, workspaceId }, "failed to get cached role");
      return null;
    }
  }

  async function cacheRole(role: string, userId: string, workspaceId: string): Promise<void> {
    try {
      const key = roleCacheKey(userId, workspaceId);
      await cache.set(key, role, { ex: PERMISSION_CACHE_TTL });
    } catch (error) {
      logger.error({ error, userId, workspaceId, role }, "failed to cache role");
    }
  }

  async function invalidateAll(userId: string, workspaceId: string): Promise<void> {
    try {
      const roleKey = roleCacheKey(userId, workspaceId);
      const permPattern = permissionInvalidationPattern(workspaceId, userId);
      await cache.del(roleKey);
      let cursor = "0";
      do {
        const result = await cache.scan(cursor, { match: permPattern, count: 100 });
        cursor = result[0];
        const keys = result[1];
        if (keys.length > 0) {
          await cache.del(...keys);
        }
      } while (cursor !== "0");
    } catch (error) {
      logger.error({ error, userId, workspaceId }, "failed to invalidate permission cache");
    }
  }

  return {
    get,
    set,
    getCachedRole,
    cacheRole,
    invalidateAll,
  };
}

export interface PermissionCacheMethods {
  get(userId: string, workspaceId: string, permission: string): Promise<boolean | null>;
  set(result: boolean, userId: string, workspaceId: string, permission: string): Promise<void>;
  getCachedRole(userId: string, workspaceId: string): Promise<string | null>;
  cacheRole(role: string, userId: string, workspaceId: string): Promise<void>;
  invalidateAll(userId: string, workspaceId: string): Promise<void>;
}

export type PermissionCache = PermissionCacheMethods;
