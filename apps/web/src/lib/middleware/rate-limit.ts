import { Redis } from "@upstash/redis";

const RATE_LIMIT_WINDOW = 60;
const RATE_LIMIT_MAX = 10;

let redisClient: Redis | null = null;

function getRedis(): Redis {
  redisClient ??= new Redis({
    url: process.env.REDIS_URL ?? process.env.UPSTASH_REDIS_REST_URL ?? "",
    token: process.env.REDIS_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN ?? "",
  });
  return redisClient;
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
    return { allowed: true, remaining: 1, reset: 0 };
  }
}
