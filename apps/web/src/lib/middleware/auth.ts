import { Redis } from "@upstash/redis";

const SESSION_COOKIE = "umgw_session";

// Must match sessionCacheKey() in @repo/auth/src/services/session-cache.ts
function sessionCacheKey(token: string): string {
  return `tenant:default:session:${token}`;
}

interface CachedSession {
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

let redisClient: Redis | null = null;

function getRedis(): Redis {
  const { restUrl, token } = resolveRedisConfig();
  redisClient ??= new Redis({ url: restUrl, token });
  return redisClient;
}

function resolveRedisConfig(): { restUrl: string; token: string } {
  const upstashUrl = process.env.UPSTASH_REDIS_REST_URL ?? "";
  const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN ?? "";
  if (upstashUrl && upstashToken) {
    return { restUrl: upstashUrl, token: upstashToken };
  }

  const redisUrl = (process.env.REDIS_URL ?? "").trim();
  if (redisUrl.startsWith("redis://") || redisUrl.startsWith("rediss://")) {
    try {
      const parsed = new URL(redisUrl);
      return {
        restUrl: `https://${parsed.hostname}`,
        token: parsed.password || "",
      };
    } catch {
      return { restUrl: "", token: "" };
    }
  }

  if (redisUrl.startsWith("https://")) {
    return { restUrl: redisUrl, token: process.env.REDIS_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN ?? "" };
  }

  return { restUrl: "", token: "" };
}

export interface SessionValidationResult {
  authenticated: boolean;
  session: CachedSession | null;
}

export async function validateSession(request: Request): Promise<SessionValidationResult> {
  const cookieHeader = request.headers.get("cookie") ?? "";
  const cookies = parseCookies(cookieHeader);
  const token = cookies[SESSION_COOKIE];

  if (!token) {
    return { authenticated: false, session: null };
  }

  try {
    const redis = getRedis();
    const key = sessionCacheKey(token);
    const session = await redis.get<CachedSession>(key);

    if (!session) {
      return { authenticated: false, session: null };
    }

    if (!session.isValid) {
      return { authenticated: false, session: null };
    }

    if (session.expiresAt && Date.now() > session.expiresAt) {
      return { authenticated: false, session: null };
    }

    return { authenticated: true, session };
  } catch {
    return { authenticated: false, session: null };
  }
}

export function setSessionHeaders(response: { headers: Headers }, session: CachedSession): void {
  response.headers.set("x-user-id", session.userId);
  response.headers.set("x-workspace-id", session.workspaceId ?? "default");
  response.headers.set("x-session-token", session.token.slice(0, 16));
}

function parseCookies(cookieHeader: string): Record<string, string> {
  const cookies: Record<string, string> = {};
  if (!cookieHeader) return cookies;

  for (const part of cookieHeader.split(";")) {
    const eqIndex = part.indexOf("=");
    if (eqIndex === -1) continue;
    const name = part.slice(0, eqIndex).trim();
    const value = part.slice(eqIndex + 1).trim();
    if (name) cookies[name] = decodeURIComponent(value);
  }

  return cookies;
}
