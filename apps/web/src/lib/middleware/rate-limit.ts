import { Redis } from "@upstash/redis";

const RATE_LIMIT_WINDOW = 60;
const RATE_LIMIT_MAX = 10;

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
  if (redisUrl.startsWith("redis://")) {
    try {
      const parsed = new URL(redisUrl);
      return {
        restUrl: `https://${parsed.hostname}`,
        token: parsed.password ?? "",
      };
    } catch {
      return { restUrl: "", token: "" };
    }
  }

  if (redisUrl.startsWith("rediss://")) {
    try {
      const parsed = new URL(redisUrl);
      return {
        restUrl: `https://${parsed.hostname}`,
        token: parsed.password ?? "",
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

function rateLimitKey(ip: string, pathname: string): string {
  const route = pathname.replace(/^\/api\/auth\//, "auth:").replace(/^\//, "");
  return `rate-limit:${ip}:${route}`;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  reset: number;
}

export async function checkRateLimit(ip: string, pathname: string): Promise<RateLimitResult> {
  try {
    const redis = getRedis();
    const key = rateLimitKey(ip, pathname);
    const now = Math.floor(Date.now() / 1000);
    const windowStart = now - RATE_LIMIT_WINDOW;

    const count = await redis.zcount(key, windowStart, "+inf");

    if (count >= RATE_LIMIT_MAX) {
      const oldest = await redis.zrange(key, 0, 0, { withScores: true });
      const resetTime = oldest.length >= 2 ? Math.ceil(Number(oldest[1]) + RATE_LIMIT_WINDOW) : now + RATE_LIMIT_WINDOW;
      return { allowed: false, remaining: 0, reset: resetTime };
    }

    await redis.zadd(key, { score: now, member: `${now}:${crypto.randomUUID()}` });
    await redis.expire(key, RATE_LIMIT_WINDOW * 2);

    return { allowed: true, remaining: RATE_LIMIT_MAX - count - 1, reset: now + RATE_LIMIT_WINDOW };
  } catch {
    console.warn("rate limiter failed, allowing request through");
    return { allowed: true, remaining: 1, reset: 0 };
  }
}
