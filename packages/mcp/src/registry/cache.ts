import type { ToolDefinition } from "./types";

interface CacheEntry {
  tool: ToolDefinition;
  expiresAt: number;
}

export class ToolCache {
  private store = new Map<string, CacheEntry>();
  private ttlMs;

  constructor(ttlMs: number = 60_000) {
    this.ttlMs = ttlMs;
  }

  private key(workspaceId: string, name: string): string {
    return `${workspaceId}:${name}`;
  }

  private isExpired(entry: CacheEntry): boolean {
    return Date.now() > entry.expiresAt;
  }

  get(workspaceId: string, name: string): ToolDefinition | undefined {
    const entry = this.store.get(this.key(workspaceId, name));
    if (!entry) return undefined;
    if (this.isExpired(entry)) {
      this.store.delete(this.key(workspaceId, name));
      return undefined;
    }
    return entry.tool;
  }

  set(workspaceId: string, name: string, tool: ToolDefinition): void {
    this.store.set(this.key(workspaceId, name), {
      tool,
      expiresAt: Date.now() + this.ttlMs,
    });
  }

  delete(workspaceId: string, name: string): void {
    this.store.delete(this.key(workspaceId, name));
  }

  invalidateAll(): void {
    this.store.clear();
  }

  get size(): number {
    return this.store.size;
  }
}
