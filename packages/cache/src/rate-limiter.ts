import { Redis } from "@upstash/redis";

import type { RateLimitResult } from "./types";

const SLIDING_WINDOW_SCRIPT = `
  local key = KEYS[1]
  local now = tonumber(ARGV[1])
  local window = tonumber(ARGV[2])
  local limit = tonumber(ARGV[3])
  local cutoff = now - window * 1000

  redis.call("ZREMRANGEBYSCORE", key, 0, cutoff)
  local count = redis.call("ZCARD", key)

  if count < limit then
    redis.call("ZADD", key, now, now .. ":" .. math.random())
    redis.call("EXPIRE", key, window)
    return {1, limit - count - 1, now + window * 1000}
  else
    local oldest = redis.call("ZRANGE", key, 0, 0, "WITHSCORES")
    local resetAt = (tonumber(oldest[2]) or now) + window * 1000
    return {0, 0, resetAt}
  end
`;

export class RateLimiter {
  private redis: Redis;

  constructor(redis: Redis) {
    this.redis = redis;
  }

  async check(key: string, limit: number, windowSeconds: number): Promise<RateLimitResult> {
    return this.increment(key, limit, windowSeconds);
  }

  async increment(key: string, limit: number, windowSeconds: number): Promise<RateLimitResult> {
    const now = Date.now();
    const result = await this.redis.eval(
      SLIDING_WINDOW_SCRIPT,
      [key],
      [now, windowSeconds, limit],
    );

    const [allowed, remaining, resetAt] = result as [number, number, number];
    return {
      allowed: allowed === 1,
      remaining,
      resetAt,
    };
  }

  async getRemaining(key: string, limit: number, windowSeconds: number): Promise<number> {
    const now = Date.now();
    const cutoff = now - windowSeconds * 1000;
    await this.redis.zremrangebyscore(key, 0, cutoff);
    const count = await this.redis.zcard(key);
    return Math.max(0, limit - count);
  }

  async reset(key: string): Promise<void> {
    await this.redis.del(key);
  }
}
