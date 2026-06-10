import { Redis } from "@upstash/redis";

import { createLogger } from "@repo/logger";

const logger = createLogger("cache-lock");

const RELEASE_SCRIPT = `
  if redis.call("GET", KEYS[1]) == ARGV[1] then
    return redis.call("DEL", KEYS[1])
  else
    return 0
  end
`;

export async function acquireLock(
  redis: Redis,
  key: string,
  ttlMs = 10000,
): Promise<string | null> {
  const token = crypto.randomUUID();
  const result = await redis.set(key, token, { nx: true, px: ttlMs });

  if (result) {
    return token;
  }

  return null;
}

export async function releaseLock(
  redis: Redis,
  key: string,
  token: string,
): Promise<boolean> {
  const result = await redis.eval(RELEASE_SCRIPT, [key], [token]);
  return result === 1;
}

export async function withLock<T>(
  redis: Redis,
  key: string,
  ttlMs: number,
  fn: () => Promise<T>,
): Promise<T> {
  const token = await acquireLock(redis, key, ttlMs);
  if (!token) {
    throw new Error(`Failed to acquire lock for key: ${key}`);
  }

  try {
    return await fn();
  } finally {
    await releaseLock(redis, key, token).catch((err: unknown) => {
      logger.error({ err, lockKey: key }, "Failed to release lock");
    });
  }
}
