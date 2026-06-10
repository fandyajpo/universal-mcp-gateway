import type { CacheStrategy } from "./types";

export class TenantCache implements CacheStrategy {
  private tenantId: string;
  private cache: CacheStrategy;

  constructor(tenantId: string, cache: CacheStrategy) {
    this.tenantId = tenantId;
    this.cache = cache;
  }

  private prefixKey(key: string): string {
    return `tenant:${this.tenantId}:${key}`;
  }

  async get<T>(key: string): Promise<T | undefined> {
    return this.cache.get<T>(this.prefixKey(key));
  }

  async set(key: string, value: unknown, ttl?: number): Promise<void> {
    return this.cache.set(this.prefixKey(key), value, ttl);
  }

  async del(key: string): Promise<boolean> {
    return this.cache.del(this.prefixKey(key));
  }

  async has(key: string): Promise<boolean> {
    return this.cache.has(this.prefixKey(key));
  }

  async clear(): Promise<void> {
    return this.cache.clear();
  }
}
