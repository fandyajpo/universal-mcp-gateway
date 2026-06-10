export { createCacheClient, get, set, del, exists, healthCheck, flush } from "./client";
export { TTLCache, SlidingWindowCache, LRUCache } from "./strategies";
export { RateLimiter } from "./rate-limiter";
export { acquireLock, releaseLock, withLock } from "./lock";
export { TenantCache } from "./tenant-cache";
export type { CacheStrategy, CacheConfig, RateLimitConfig, LockConfig, RateLimitResult, HealthCheckResult } from "./types";
