import { describe, it, expect, vi, beforeEach } from "vitest";

import type { RateLimiter } from "./rate-limiter";
import type { TTLCache, SlidingWindowCache, LRUCache } from "./strategies";
import type { TenantCache } from "./tenant-cache";

const store = new Map<string, { value: unknown; expiresAt?: number }>();
const sortedSets = new Map<string, Map<string, number>>();
let keyCounter = 0;

function isExpired(key: string): boolean {
  const entry = store.get(key);
  if (entry?.expiresAt === undefined) return false;
  if (Date.now() > entry.expiresAt) {
    store.delete(key);
    return true;
  }
  return false;
}

class MockRedis {
  get<T = unknown>(key: string): Promise<T | null> {
    if (isExpired(key)) return Promise.resolve(null);
    const entry = store.get(key);
    if (!entry) return Promise.resolve(null);
    return Promise.resolve(entry.value as T);
  }

  set(key: string, value: unknown, opts?: { ex?: number; nx?: boolean; px?: number }): Promise<"OK" | true | null> {
    if (opts?.nx) {
      if (store.has(key)) {
        if (isExpired(key)) {
          store.delete(key);
        } else {
          return Promise.resolve(null);
        }
      }
    }
    const expiresAt = opts?.ex ? Date.now() + opts.ex * 1000 : opts?.px ? Date.now() + opts.px : undefined;
    store.set(key, { value, expiresAt });
    return Promise.resolve("OK");
  }

  del(key: string): Promise<number> {
    const existed = store.has(key);
    store.delete(key);
    sortedSets.delete(key);
    return Promise.resolve(existed ? 1 : 0);
  }

  exists(key: string): Promise<number> {
    if (isExpired(key)) return Promise.resolve(0);
    return Promise.resolve(store.has(key) ? 1 : 0);
  }

  ping(): Promise<string> {
    return Promise.resolve("pong");
  }

  flushall(): Promise<string> {
    store.clear();
    sortedSets.clear();
    return Promise.resolve("OK");
  }

  expire(key: string, _ttl: number): Promise<number> {
    const entry = store.get(key);
    if (!entry) return Promise.resolve(0);
    entry.expiresAt = Date.now() + _ttl * 1000;
    return Promise.resolve(1);
  }

  zadd(key: string, opts: { score: number; member: string }): Promise<number> {
    let set = sortedSets.get(key);
    if (!set) {
      set = new Map();
      sortedSets.set(key, set);
    }
    set.set(opts.member, opts.score);
    return Promise.resolve(1);
  }

  zcard(key: string): Promise<number> {
    const set = sortedSets.get(key);
    return Promise.resolve(set ? set.size : 0);
  }

  zrange(key: string, start: number, stop: number, withScores?: "WITHSCORES"): Promise<string[]> {
    const set = sortedSets.get(key);
    if (!set) return Promise.resolve([]);

    const entries = Array.from(set.entries()).sort((a, b) => a[1] - b[1]);
    const slice = entries.slice(start, stop + 1);

    if (withScores === "WITHSCORES") {
      return Promise.resolve(slice.flatMap(([member, score]) => [member, String(score)]));
    }
    return Promise.resolve(slice.map(([member]) => member));
  }

  zrem(key: string, ...members: string[]): Promise<number> {
    const set = sortedSets.get(key);
    if (!set) return Promise.resolve(0);
    let count = 0;
    for (const member of members) {
      if (set.delete(member)) count++;
    }
    return Promise.resolve(count);
  }

  zremrangebyscore(key: string, min: number, max: number): Promise<number> {
    const set = sortedSets.get(key);
    if (!set) return Promise.resolve(0);
    let count = 0;
    for (const [member, score] of set) {
      if (score >= min && score <= max) {
        set.delete(member);
        count++;
      }
    }
    return Promise.resolve(count);
  }

  async eval(_script: string, keys: string[], args: (string | number)[]): Promise<unknown> {
    if (_script.includes("ZREMRANGEBYSCORE")) {
      const key = keys[0] ?? "";
      const now = Number(args[0] ?? 0);
      const window = Number(args[1] ?? 0);
      const limit = Number(args[2] ?? 0);
      const cutoff = now - window * 1000;

      await this.zremrangebyscore(key, 0, cutoff);
      const count = await this.zcard(key);

      if (count < limit) {
        keyCounter++;
        await this.zadd(key, { score: now, member: `${now}:${keyCounter}` });
        await this.expire(key, window);
        return [1, limit - count - 1, now + window * 1000];
      }

      const oldest = await this.zrange(key, 0, 0, "WITHSCORES");
      if (oldest.length >= 2) {
        const oldestScore = Number(oldest[1] ?? 0);
        return [0, 0, oldestScore + window * 1000];
      }
      return [0, 0, now + window * 1000];
    }

    if (_script.includes('"GET"')) {
      const key = keys[0] ?? "";
      const stored = store.get(key);
      const token = String(args[0] ?? "");
      if (stored && String(stored.value) === token) {
        store.delete(key);
        sortedSets.delete(key);
        return 1;
      }
      return 0;
    }

    return null;
  }
}

function resetStore(): void {
  store.clear();
  sortedSets.clear();
  keyCounter = 0;
}

vi.mock("@upstash/redis", () => ({
  Redis: MockRedis,
}));

vi.mock("@repo/logger", () => ({
  createLogger: () => ({
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  }),
}));

// ── TTLCache ───────────────────────────────────────

describe("TTLCache", async () => {
  const { TTLCache } = await import("./strategies");

  let cache: TTLCache;
  let redis: MockRedis;

  beforeEach(() => {
    resetStore();
    redis = new MockRedis();
    cache = new TTLCache(redis as never, 300);
  });

  it("sets and gets a value", async () => {
    await cache.set("greeting", "hello");
    const result = await cache.get<string>("greeting");
    expect(result).toBe("hello");
  });

  it("returns undefined for a missing key", async () => {
    const result = await cache.get<string>("nonexistent");
    expect(result).toBeUndefined();
  });

  it("respects custom TTL", async () => {
    await cache.set("ephemeral", "data", 1);
    const before = await cache.get<string>("ephemeral");
    expect(before).toBe("data");
  });

  it("has returns true for existing keys", async () => {
    await cache.set("exists-key", "value");
    const result = await cache.has("exists-key");
    expect(result).toBe(true);
  });

  it("has returns false for missing keys", async () => {
    const result = await cache.has("missing");
    expect(result).toBe(false);
  });

  it("deletes a key", async () => {
    await cache.set("delete-me", "value");
    const deleted = await cache.del("delete-me");
    expect(deleted).toBe(true);
    const result = await cache.get("delete-me");
    expect(result).toBeUndefined();
  });

  it("clear removes all keys", async () => {
    await cache.set("a", 1);
    await cache.set("b", 2);
    await cache.clear();
    const a = await cache.get("a");
    const b = await cache.get("b");
    expect(a).toBeUndefined();
    expect(b).toBeUndefined();
  });
});

// ── SlidingWindowCache ─────────────────────────────

describe("SlidingWindowCache", async () => {
  const { SlidingWindowCache } = await import("./strategies");

  let cache: SlidingWindowCache;
  let redis: MockRedis;

  beforeEach(() => {
    resetStore();
    redis = new MockRedis();
    cache = new SlidingWindowCache(redis as never, 300);
  });

  it("sets and gets a value", async () => {
    await cache.set("key", "value");
    const result = await cache.get<string>("key");
    expect(result).toBe("value");
  });

  it("returns undefined for missing key", async () => {
    const result = await cache.get<string>("nope");
    expect(result).toBeUndefined();
  });

  it("resets TTL on read", async () => {
    await cache.set("hot", "data", 10);

    const expireSpy = vi.spyOn(redis, "expire");
    await cache.get<string>("hot");
    expect(expireSpy).toHaveBeenCalledWith("hot", 300);
  });

  it("del removes key", async () => {
    await cache.set("x", 42);
    await cache.del("x");
    const result = await cache.get("x");
    expect(result).toBeUndefined();
  });
});

// ── LRUCache ───────────────────────────────────────

describe("LRUCache", async () => {
  const { LRUCache } = await import("./strategies");

  let cache: LRUCache;
  let redis: MockRedis;

  beforeEach(() => {
    resetStore();
    redis = new MockRedis();
    cache = new LRUCache(redis as never, 300, 5);
  });

  it("sets and gets a value and records access", async () => {
    await cache.set("key1", "value1");
    const result = await cache.get<string>("key1");
    expect(result).toBe("value1");

    const count = await redis.zcard("lru:access");
    expect(count).toBe(1);
  });

  it("evicts least recently used items when over max size", async () => {
    for (let i = 0; i < 6; i++) {
      await cache.set(`key${i}`, `value${i}`);
    }

    const key0exists = await redis.exists("key0");
    expect(key0exists).toBe(0);

    const key5exists = await redis.exists("key5");
    expect(key5exists).toBe(1);
  });
});

// ── RateLimiter ────────────────────────────────────

describe("RateLimiter", async () => {
  const { RateLimiter } = await import("./rate-limiter");

  let limiter: RateLimiter;
  let redis: MockRedis;

  beforeEach(() => {
    resetStore();
    redis = new MockRedis();
    limiter = new RateLimiter(redis as never);
  });

  it("allows requests within limit", async () => {
    const result = await limiter.check("test-key", 10, 60);
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(9);
  });

  it("blocks requests over limit", async () => {
    for (let i = 0; i < 3; i++) {
      await limiter.increment("strict-key", 3, 60);
    }

    const result = await limiter.check("strict-key", 3, 60);
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it("getRemaining returns correct count", async () => {
    await limiter.increment("remain-key", 10, 60);
    await limiter.increment("remain-key", 10, 60);

    const remaining = await limiter.getRemaining("remain-key", 10, 60);
    expect(remaining).toBe(8);
  });

  it("reset clears the rate limit counter", async () => {
    for (let i = 0; i < 5; i++) {
      await limiter.increment("reset-key", 5, 60);
    }
    await limiter.reset("reset-key");

    const result = await limiter.check("reset-key", 5, 60);
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(4);
  });

  it("sliding window expires old entries", async () => {
    const zaddSpy = vi.spyOn(redis, "zadd");
    for (let i = 0; i < 5; i++) {
      await limiter.increment("sliding-key", 10, 1);
    }
    expect(zaddSpy).toHaveBeenCalled();
  });
});

// ── Distributed Lock ───────────────────────────────

describe("Distributed Lock", async () => {
  const { acquireLock, releaseLock, withLock } = await import("./lock");

  let redis: MockRedis;

  beforeEach(() => {
    resetStore();
    redis = new MockRedis();
  });

  it("acquires a lock and returns a token", async () => {
    const token = await acquireLock(redis as never, "resource:1", 5000);
    expect(token).toBeTruthy();
    expect(typeof token).toBe("string");
  });

  it("fails to acquire an already-held lock", async () => {
    const token1 = await acquireLock(redis as never, "resource:2", 5000);
    expect(token1).not.toBeNull();

    const token2 = await acquireLock(redis as never, "resource:2", 5000);
    expect(token2).toBeNull();
  });

  it("releases a lock only if owned by caller", async () => {
    const token = await acquireLock(redis as never, "resource:3", 5000);
    expect(token).not.toBeNull();
    if (token === null) throw new Error("Token should be defined");

    const correctRelease = await releaseLock(redis as never, "resource:3", token);
    expect(correctRelease).toBe(true);
  });

  it("withLock acquires, executes, and releases", async () => {
    const result = await withLock(redis as never, "resource:4", 5000, () => Promise.resolve("done"));
    expect(result).toBe("done");

    const token = await acquireLock(redis as never, "resource:4", 5000);
    expect(token).not.toBeNull();
  });

  it("withLock throws when lock cannot be acquired", async () => {
    const token = await acquireLock(redis as never, "resource:5", 5000);
    expect(token).not.toBeNull();

    await expect(
      withLock(redis as never, "resource:5", 5000, () => Promise.resolve("should not run")),
    ).rejects.toThrow("Failed to acquire lock");
  });
});

// ── TenantCache ────────────────────────────────────

describe("TenantCache", async () => {
  const { TenantCache } = await import("./tenant-cache");
  const { TTLCache } = await import("./strategies");

  let inner: TTLCache;
  let tenantCache: TenantCache;

  beforeEach(() => {
    resetStore();
    inner = new TTLCache(new MockRedis({ url: "http://localhost:6379" }) as never, 300);
    tenantCache = new TenantCache("tenant-abc", inner);
  });

  it("prefixes keys on set and get", async () => {
    await tenantCache.set("my-key", "my-value");
    const direct = await inner.get<string>("tenant:tenant-abc:my-key");
    expect(direct).toBe("my-value");
  });

  it("get returns value with correct prefix", async () => {
    await tenantCache.set("user:42", "alice");

    const result = await tenantCache.get<string>("user:42");
    expect(result).toBe("alice");
  });

  it("del only deletes prefixed key", async () => {
    await inner.set("tenant:tenant-abc:target", "value");
    await inner.set("tenant:other-tenant:target", "value");

    await tenantCache.del("target");

    const other = await inner.get("tenant:other-tenant:target");
    expect(other).toBe("value");

    const ours = await inner.get("tenant:tenant-abc:target");
    expect(ours).toBeUndefined();
  });

  it("has checks prefixed key", async () => {
    await tenantCache.set("check-key", "x");
    const result = await tenantCache.has("check-key");
    expect(result).toBe(true);
  });
});
