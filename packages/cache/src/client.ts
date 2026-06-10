import { Redis } from "@upstash/redis";

import type { CacheConfig, HealthCheckResult } from "./types";
import { createLogger } from "@repo/logger";
import { getConfig } from "@repo/config";

const logger = createLogger("cache-client");

let client: Redis | undefined;

export function createCacheClient(config?: CacheConfig): Redis {
  if (client) return client;

  const appConfig = getConfig();

  client = new Redis({
    url: config?.url ?? appConfig.redis.url,
    token: config?.token ?? "",
    enableAutoPipelining: config?.enableAutoPipelining ?? false,
  });

  logger.info("Cache client created");

  return client;
}

export async function get(key: string): Promise<string | null> {
  const redis = createCacheClient();
  return redis.get(key);
}

export async function set(key: string, value: string | number | Record<string, unknown>, ttl?: number): Promise<void> {
  const redis = createCacheClient();
  if (ttl !== undefined) {
    await redis.set(key, value, { ex: ttl });
  } else {
    await redis.set(key, value);
  }
}

export async function del(key: string): Promise<boolean> {
  const redis = createCacheClient();
  const result = await redis.del(key);
  return result > 0;
}

export async function exists(key: string): Promise<boolean> {
  const redis = createCacheClient();
  const result = await redis.exists(key);
  return result === 1;
}

export async function healthCheck(): Promise<HealthCheckResult> {
  const start = Date.now();
  const redis = createCacheClient();
  try {
    await redis.ping();
    return { ok: true, latency: Date.now() - start };
  } catch {
    return { ok: false, latency: Date.now() - start };
  }
}

export async function flush(): Promise<void> {
  const redis = createCacheClient();
  await redis.flushall();
}
