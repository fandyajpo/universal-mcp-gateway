export interface CacheConfig {
  url?: string;
  token?: string;
  defaultTtl?: number;
  enableAutoPipelining?: boolean;
}

export interface RateLimitConfig {
  maxRequests: number;
  windowSeconds: number;
}

export interface LockConfig {
  ttlMs: number;
  retryDelayMs?: number;
  maxRetries?: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

export interface HealthCheckResult {
  ok: boolean;
  latency: number;
}

export interface CacheStrategy {
  get<T>(key: string): Promise<T | undefined>;
  set(key: string, value: unknown, ttl?: number): Promise<void>;
  del(key: string): Promise<boolean>;
  has(key: string): Promise<boolean>;
  clear(): Promise<void>;
}
