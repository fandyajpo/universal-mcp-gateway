import { createCacheClient } from "@repo/cache";
import { createLogger } from "@repo/logger";

const logger = createLogger("@repo/auth:session-cache");

const DEFAULT_SESSION_TTL = 7 * 24 * 60 * 60;

export interface CachedSession {
  token: string;
  userId: string;
  email: string;
  name: string;
  image?: string | null;
  workspaceId?: string;
  ipAddress?: string;
  userAgent?: string;
  expiresAt: number;
  createdAt: number;
  isValid: boolean;
}

export function sessionCacheKey(workspaceId: string | undefined, token: string): string {
  const tenant = workspaceId ?? "default";
  return `tenant:${tenant}:session:${token}`;
}

export function userSessionsKey(userId: string): string {
  return `user:${userId}:sessions`;
}

export interface SessionCacheMethods {
  get(token: string, workspaceId?: string): Promise<CachedSession | null>;
  set(session: CachedSession, ttl?: number, workspaceId?: string): Promise<void>;
  del(token: string, workspaceId?: string): Promise<void>;
  addUserSession(userId: string, token: string): Promise<void>;
  removeUserSession(userId: string, token: string): Promise<void>;
  getUserSessionTokens(userId: string): Promise<string[]>;
  clearUserSessions(userId: string): Promise<void>;
}

export function createSessionCache(): SessionCacheMethods {
  const cache = createCacheClient();

  async function get(token: string, workspaceId?: string): Promise<CachedSession | null> {
    const key = sessionCacheKey(workspaceId, token);
    try {
      const data = await cache.get<CachedSession>(key);
      if (data) {
        logger.debug({ token: token.slice(0, 8) }, "session cache hit");
        return data;
      }
      logger.debug({ token: token.slice(0, 8) }, "session cache miss");
      return null;
    } catch (error) {
      logger.error({ error, token: token.slice(0, 8) }, "session cache get failed");
      return null;
    }
  }

  async function set(
    session: CachedSession,
    ttl: number = DEFAULT_SESSION_TTL,
    workspaceId?: string,
  ): Promise<void> {
    const key = sessionCacheKey(workspaceId, session.token);
    try {
      await cache.set(key, session as unknown as Record<string, unknown>, { ex: ttl });
      logger.debug({ token: session.token.slice(0, 8) }, "session cached");
    } catch (error) {
      logger.error({ error, token: session.token.slice(0, 8) }, "session cache set failed");
    }
  }

  async function del(token: string, workspaceId?: string): Promise<void> {
    const key = sessionCacheKey(workspaceId, token);
    try {
      await cache.del(key);
      logger.debug({ token: token.slice(0, 8) }, "session cache entry deleted");
    } catch (error) {
      logger.error({ error, token: token.slice(0, 8) }, "session cache delete failed");
    }
  }

  async function addUserSession(userId: string, token: string): Promise<void> {
    const key = userSessionsKey(userId);
    try {
      await cache.sadd(key, token);
      await cache.expire(key, DEFAULT_SESSION_TTL);
      logger.debug({ userId, token: token.slice(0, 8) }, "added session to user index");
    } catch (error) {
      logger.error({ error, userId }, "failed to add session to user index");
    }
  }

  async function removeUserSession(userId: string, token: string): Promise<void> {
    const key = userSessionsKey(userId);
    try {
      await cache.srem(key, token);
      logger.debug({ userId, token: token.slice(0, 8) }, "removed session from user index");
    } catch (error) {
      logger.error({ error, userId }, "failed to remove session from user index");
    }
  }

  async function getUserSessionTokens(userId: string): Promise<string[]> {
    const key = userSessionsKey(userId);
    try {
      const tokens = await cache.smembers(key);
      return tokens;
    } catch (error) {
      logger.error({ error, userId }, "failed to get user session tokens");
      return [];
    }
  }

  async function clearUserSessions(userId: string): Promise<void> {
    const key = userSessionsKey(userId);
    try {
      await cache.del(key);
      logger.debug({ userId }, "cleared user session index");
    } catch (error) {
      logger.error({ error, userId }, "failed to clear user session index");
    }
  }

  return {
    get,
    set,
    del,
    addUserSession,
    removeUserSession,
    getUserSessionTokens,
    clearUserSessions,
  };
}

export type SessionCache = SessionCacheMethods;
