import { getTierLimits } from "./validation/size-limits";
import { createLogger } from "@repo/logger";

const logger = createLogger("usage-tracker");

export interface UsageStore {
  get(workspaceId: string): Promise<number>;
  set(workspaceId: string, used: number): Promise<void>;
  increment(workspaceId: string, bytes: number): Promise<number>;
  decrement(workspaceId: string, bytes: number): Promise<number>;
}

export interface StorageUsage {
  used: number;
  limit: number;
  percentage: number;
}

export interface UsageTracker {
  getStorageUsage(workspaceId: string, tier?: string): Promise<StorageUsage>;
  trackUpload(workspaceId: string, fileSize: number): Promise<void>;
  trackDelete(workspaceId: string, fileSize: number): Promise<void>;
}

export function createUsageTracker(store: UsageStore): UsageTracker {
  async function getStorageUsage(workspaceId: string, tier?: string): Promise<StorageUsage> {
    const used = await store.get(workspaceId);
    const limit = getTierLimits(tier).totalStorage;
    const percentage = limit > 0 ? Math.round((used / limit) * 10000) / 100 : 0;

    return { used, limit, percentage };
  }

  async function trackUpload(workspaceId: string, fileSize: number): Promise<void> {
    if (fileSize <= 0) {
      logger.warn({ workspaceId, fileSize }, "Attempted to track upload with non-positive file size");
      return;
    }

    await store.increment(workspaceId, fileSize);
    logger.debug({ workspaceId, fileSize }, "Storage usage incremented after upload");
  }

  async function trackDelete(workspaceId: string, fileSize: number): Promise<void> {
    if (fileSize <= 0) {
      logger.warn({ workspaceId, fileSize }, "Attempted to track delete with non-positive file size");
      return;
    }

    const current = await store.get(workspaceId);
    const decremented = Math.max(0, current - fileSize);
    await store.set(workspaceId, decremented);
    logger.debug({ workspaceId, fileSize }, "Storage usage decremented after delete");
  }

  return {
    getStorageUsage,
    trackUpload,
    trackDelete,
  };
}
