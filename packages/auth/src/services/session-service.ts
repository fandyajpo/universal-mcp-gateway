import type { AuthServer } from "../auth-server";
import { createSessionCache } from "./session-cache";
import { createLogger } from "@repo/logger";

const logger = createLogger("@repo/auth:session-service");

const SESSION_REFRESH_THRESHOLD = 24 * 60 * 60 * 1000;

export interface SessionInfo {
  id: string;
  token: string;
  userId: string;
  email: string;
  name: string;
  image?: string | null;
  workspaceId?: string;
  ipAddress?: string;
  userAgent?: string;
  expiresAt: Date;
  createdAt: Date;
  isValid: boolean;
}

export interface VerifySessionResult {
  valid: boolean;
  session?: SessionInfo;
  needsRefresh: boolean;
}

export interface SessionServiceMethods {
  verifySession(sessionToken: string): Promise<VerifySessionResult>;
  refreshSession(sessionToken: string): Promise<{ success: boolean; token?: string }>;
  getSessionInfo(sessionToken: string): Promise<SessionInfo | null>;
  listSessions(sessionToken: string): Promise<SessionInfo[]>;
  revokeSession(sessionToken: string, targetToken: string): Promise<boolean>;
  revokeAllSessions(sessionToken: string, excludeToken?: string): Promise<boolean>;
  enforceConcurrencyLimit(userId: string, maxSessions?: number): Promise<void>;
  invalidateOnPasswordChange(userId: string, currentToken: string): Promise<boolean>;
}

export function createSessionService(auth: AuthServer): SessionServiceMethods {
  const sessionCache = createSessionCache();

  function authHeaders(sessionToken: string): Headers {
    const headers = new Headers();
    headers.set("Authorization", `Bearer ${sessionToken}`);
    return headers;
  }

  function isNearExpiry(expiresAt: Date): boolean {
    return expiresAt.getTime() - Date.now() < SESSION_REFRESH_THRESHOLD;
  }

  function toSessionInfo(
    sessionData: { session: { id: string; token: string; userId: string; expiresAt: Date; ipAddress?: string | null; userAgent?: string | null; createdAt: Date; updatedAt: Date }; user: { id: string; email: string; name: string; image?: string | null; emailVerified: boolean } },
  ): SessionInfo {
    return {
      id: sessionData.session.id,
      token: sessionData.session.token,
      userId: sessionData.session.userId,
      email: sessionData.user.email,
      name: sessionData.user.name,
      image: sessionData.user.image,
      workspaceId: (sessionData.session as Record<string, unknown>).workspaceId as string | undefined,
      ipAddress: sessionData.session.ipAddress ?? undefined,
      userAgent: sessionData.session.userAgent ?? undefined,
      expiresAt: sessionData.session.expiresAt,
      createdAt: sessionData.session.createdAt,
      isValid: sessionData.session.expiresAt > new Date(),
    };
  }

  async function verifySession(sessionToken: string): Promise<VerifySessionResult> {
    const cached = await sessionCache.get(sessionToken);

    let session: SessionInfo | null = null;

    if (cached) {
      const cachedExpiresAt = new Date(cached.expiresAt);
      if (cachedExpiresAt > new Date() && cached.isValid) {
        session = {
          id: cached.token,
          token: cached.token,
          userId: cached.userId,
          email: cached.email,
          name: cached.name,
          image: cached.image,
          workspaceId: cached.workspaceId,
          ipAddress: cached.ipAddress,
          userAgent: cached.userAgent,
          expiresAt: cachedExpiresAt,
          createdAt: new Date(cached.createdAt),
          isValid: true,
        };

        const needsRefresh = isNearExpiry(cachedExpiresAt);
        return { valid: true, session, needsRefresh };
      }
      await sessionCache.del(sessionToken);
    }

    try {
      const response = await auth.api.getSession({
        headers: authHeaders(sessionToken),
      });

      if (!response) {
        return { valid: false, needsRefresh: false };
      }

      session = toSessionInfo(response);
      const needsRefresh = isNearExpiry(session.expiresAt);

      await sessionCache.set(
        {
          token: session.token,
          userId: session.userId,
          email: session.email,
          name: session.name,
          image: session.image,
          workspaceId: session.workspaceId,
          ipAddress: session.ipAddress,
          userAgent: session.userAgent,
          expiresAt: session.expiresAt.getTime(),
          createdAt: session.createdAt.getTime(),
          isValid: true,
        },
        undefined,
        session.workspaceId,
      );

      return { valid: true, session, needsRefresh };
    } catch (error) {
      logger.error({ error }, "session verification failed");
      return { valid: false, needsRefresh: false };
    }
  }

  async function refreshSession(sessionToken: string): Promise<{ success: boolean; token?: string }> {
    try {
      const response = await auth.api.getSession({
        headers: authHeaders(sessionToken),
        query: { disableCookieCache: true },
      });

      if (!response) {
        return { success: false };
      }

      const info = toSessionInfo(response);

      await sessionCache.set(
        {
          token: info.token,
          userId: info.userId,
          email: info.email,
          name: info.name,
          image: info.image,
          workspaceId: info.workspaceId,
          ipAddress: info.ipAddress,
          userAgent: info.userAgent,
          expiresAt: info.expiresAt.getTime(),
          createdAt: info.createdAt.getTime(),
          isValid: true,
        },
        undefined,
        info.workspaceId,
      );

      logger.info({ userId: info.userId }, "session refreshed");
      return { success: true, token: info.token };
    } catch (error) {
      logger.error({ error }, "session refresh failed");
      return { success: false };
    }
  }

  async function getSessionInfo(sessionToken: string): Promise<SessionInfo | null> {
    const result = await verifySession(sessionToken);
    return result.session ?? null;
  }

  async function listSessions(sessionToken: string): Promise<SessionInfo[]> {
    try {
      const sessions = await auth.api.listSessions({
        headers: authHeaders(sessionToken),
      });

      return sessions.map((s: { id: string; token: string; userId: string; expiresAt: Date; ipAddress?: string | null; userAgent?: string | null; createdAt: Date; updatedAt: Date }) => ({
        id: s.id,
        token: s.token,
        userId: s.userId,
        email: "",
        name: "",
        expiresAt: s.expiresAt,
        createdAt: s.createdAt,
        isValid: s.expiresAt > new Date(),
        ipAddress: s.ipAddress ?? undefined,
        userAgent: s.userAgent ?? undefined,
      }));
    } catch (error) {
      logger.error({ error }, "failed to list sessions");
      return [];
    }
  }

  async function revokeSession(sessionToken: string, targetToken: string): Promise<boolean> {
    try {
      await auth.api.revokeSession({
        headers: authHeaders(sessionToken),
        body: { token: targetToken },
      });

      await sessionCache.del(targetToken);
      logger.info({ token: targetToken.slice(0, 8) }, "session revoked");
      return true;
    } catch (error) {
      logger.error({ error }, "failed to revoke session");
      return false;
    }
  }

  async function revokeAllSessions(sessionToken: string, excludeToken?: string): Promise<boolean> {
    try {
      if (excludeToken) {
        await auth.api.revokeOtherSessions({
          headers: authHeaders(excludeToken),
        });

        const sessions = await auth.api.listSessions({
          headers: authHeaders(sessionToken),
        });

        for (const s of sessions as { token: string }[]) {
          if (s.token !== excludeToken) {
            await sessionCache.del(s.token);
          }
        }
      } else {
        await auth.api.revokeSessions({
          headers: authHeaders(sessionToken),
        });

        await sessionCache.clearUserSessions(
          (await getSessionInfo(sessionToken))?.userId ?? "",
        );
      }

      logger.info("all sessions revoked");
      return true;
    } catch (error) {
      logger.error({ error }, "failed to revoke all sessions");
      return false;
    }
  }

  async function enforceConcurrencyLimit(userId: string, maxSessions = 10): Promise<void> {
    try {
      const tokens = await sessionCache.getUserSessionTokens(userId);
      if (tokens.length <= maxSessions) return;

      const sessions = await Promise.all(
        tokens.map(async (token) => {
          const cached = await sessionCache.get(token);
          return { token, expiresAt: cached?.expiresAt ?? Infinity };
        }),
      );

      sessions.sort((a, b) => a.expiresAt - b.expiresAt);

      const toEvict = sessions.slice(0, sessions.length - maxSessions);
      for (const session of toEvict) {
        try {
          await auth.api.revokeSession({
            headers: authHeaders(session.token),
            body: { token: session.token },
          });
          await sessionCache.del(session.token);
          await sessionCache.removeUserSession(userId, session.token);
          logger.info({ token: session.token.slice(0, 8) }, "evicted oldest session");
        } catch {
          logger.warn({ token: session.token.slice(0, 8) }, "failed to evict session");
        }
      }
    } catch (error) {
      logger.error({ error, userId }, "concurrency limit enforcement failed");
    }
  }

  async function invalidateOnPasswordChange(userId: string, currentToken: string): Promise<boolean> {
    try {
      await auth.api.revokeOtherSessions({
        headers: authHeaders(currentToken),
      });

      const tokens = await sessionCache.getUserSessionTokens(userId);
      for (const token of tokens) {
        if (token !== currentToken) {
          await sessionCache.del(token);
        }
      }
      await sessionCache.clearUserSessions(userId);
      await sessionCache.addUserSession(userId, currentToken);

      logger.info({ userId }, "invalidated sessions on password change");
      return true;
    } catch (error) {
      logger.error({ error, userId }, "failed to invalidate sessions on password change");
      return false;
    }
  }

  return {
    verifySession,
    refreshSession,
    getSessionInfo,
    listSessions,
    revokeSession,
    revokeAllSessions,
    enforceConcurrencyLimit,
    invalidateOnPasswordChange,
  };
}

export type SessionService = SessionServiceMethods;
