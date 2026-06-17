import type { RateLimitResult } from "./types";
import { createLogger } from "@repo/logger";

const logger = createLogger("rate-limiter/token-bucket");

const TOKEN_BUCKET_SCRIPT = `
local key = KEYS[1]
local capacity = tonumber(ARGV[1])
local refillRate = tonumber(ARGV[2])
local cost = tonumber(ARGV[3])
local now = tonumber(ARGV[4])
local bucket = redis.call("GET", key)
if not bucket then
  bucket = { tokens = capacity - cost, lastRefill = now }
  redis.call("SET", key, cjson.encode(bucket), "EX", 60)
  return { 1, capacity - cost, 60 }
end
bucket = cjson.decode(bucket)
local elapsed = math.max(0, now - bucket.lastRefill)
bucket.tokens = math.min(capacity, bucket.tokens + elapsed * refillRate)
if bucket.tokens >= cost then
  bucket.tokens = bucket.tokens - cost
  bucket.lastRefill = now
  redis.call("SET", key, cjson.encode(bucket), "EX", 60)
  return { 1, bucket.tokens, 60 }
else
  local retryAfter = math.ceil((cost - bucket.tokens) / refillRate)
  return { 0, bucket.tokens, retryAfter }
end
`;

export interface TokenBucketClient {
  consume(key: string, capacity: number, refillRate: number, cost: number): Promise<RateLimitResult>;
}

export function createTokenBucketClient(): TokenBucketClient {
  async function consume(
    key: string,
    capacity: number,
    refillRate: number,
    cost: number,
  ): Promise<RateLimitResult> {
    try {
      const { createCacheClient } = await import("@repo/cache");
      const redis = createCacheClient();
      const now = Math.floor(Date.now() / 1000);
      const result = await (redis as { eval: (script: string, keys: string[], args: number[]) => unknown }).eval(
        TOKEN_BUCKET_SCRIPT,
        [key],
        [capacity, refillRate, cost, now],
      );
      const [allowed, remaining, resetAt] = result as [number, number, number];
      return { allowed: allowed === 1, remaining, resetAt };
    } catch (error) {
      logger.error({ error, key }, "Token bucket script failed, failing open");
      return { allowed: true, remaining: 1, resetAt: Math.floor(Date.now() / 1000) + 60 };
    }
  }

  return { consume };
}
