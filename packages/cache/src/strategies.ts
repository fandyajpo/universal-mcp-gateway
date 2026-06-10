import { Redis } from "@upstash/redis";

import type { CacheStrategy } from "./types";

export class TTLCache implements CacheStrategy {
  private redis: Redis;
  private defaultTtl: number;

  constructor(redis: Redis, defaultTtl = 300) {
    this.redis = redis;
    this.defaultTtl = defaultTtl;
  }

  async get<T>(key: string): Promise<T | undefined> {
    const value = await this.redis.get<T>(key);
    return value ?? undefined;
  }

  async set(key: string, value: unknown, ttl?: number): Promise<void> {
    await this.redis.set(key, value, { ex: ttl ?? this.defaultTtl });
  }

  async del(key: string): Promise<boolean> {
    const result = await this.redis.del(key);
    return result > 0;
  }

  async has(key: string): Promise<boolean> {
    const result = await this.redis.exists(key);
    return result === 1;
  }

  async clear(): Promise<void> {
    await this.redis.flushall();
  }
}

export class SlidingWindowCache implements CacheStrategy {
  private redis: Redis;
  private defaultTtl: number;

  constructor(redis: Redis, defaultTtl = 300) {
    this.redis = redis;
    this.defaultTtl = defaultTtl;
  }

  async get<T>(key: string): Promise<T | undefined> {
    const value = await this.redis.get<T>(key);
    if (value !== null) {
      await this.redis.expire(key, this.defaultTtl);
    }
    return value ?? undefined;
  }

  async set(key: string, value: unknown, ttl?: number): Promise<void> {
    const effectiveTtl = ttl ?? this.defaultTtl;
    await this.redis.set(key, value, { ex: effectiveTtl });
  }

  async del(key: string): Promise<boolean> {
    const result = await this.redis.del(key);
    return result > 0;
  }

  async has(key: string): Promise<boolean> {
    const result = await this.redis.exists(key);
    return result === 1;
  }

  async clear(): Promise<void> {
    await this.redis.flushall();
  }
}

export class LRUCache implements CacheStrategy {
  private redis: Redis;
  private defaultTtl: number;
  private maxSize: number;
  private accessSetKey = "lru:access";

  constructor(redis: Redis, defaultTtl = 300, maxSize = 1000) {
    this.redis = redis;
    this.defaultTtl = defaultTtl;
    this.maxSize = maxSize;
  }

  async get<T>(key: string): Promise<T | undefined> {
    const value = await this.redis.get<T>(key);
    if (value !== null) {
      const now = Date.now();
      await this.redis.zadd(this.accessSetKey, { score: now, member: key });
      await this.redis.expire(key, this.defaultTtl);
    }
    return value ?? undefined;
  }

  async set(key: string, value: unknown, ttl?: number): Promise<void> {
    const effectiveTtl = ttl ?? this.defaultTtl;
    const now = Date.now();

    await this.redis.set(key, value, { ex: effectiveTtl });
    await this.redis.zadd(this.accessSetKey, { score: now, member: key });

    const count = await this.redis.zcard(this.accessSetKey);
    if (count > this.maxSize) {
      const candidates = await this.redis.zrange(this.accessSetKey, 0, count - this.maxSize - 1);
      if (candidates.length > 0) {
        const keysToEvict = candidates as string[];
        for (const k of keysToEvict) {
          await this.redis.del(k);
        }
        await this.redis.zrem(this.accessSetKey, ...keysToEvict);
      }
    }
  }

  async del(key: string): Promise<boolean> {
    await this.redis.zrem(this.accessSetKey, key);
    const result = await this.redis.del(key);
    return result > 0;
  }

  async has(key: string): Promise<boolean> {
    const result = await this.redis.exists(key);
    return result === 1;
  }

  async clear(): Promise<void> {
    await this.redis.flushall();
  }
}
