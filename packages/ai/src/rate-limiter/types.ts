export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

export type RateLimitTier = "global" | "workspace" | "user";

export interface RateLimitTierConfig {
  capacity: number;
  refillRate: number;
}

export interface RateLimitConfig {
  global: RateLimitTierConfig;
  workspace: RateLimitTierConfig;
  user: RateLimitTierConfig;
}

export interface RateLimitCheckOptions {
  cost?: number;
  workspaceId?: string;
  userId?: string;
  bypass?: boolean;
}

export const DEFAULT_RATE_LIMIT_CONFIG: RateLimitConfig = {
  global: { capacity: 50, refillRate: 1000 / 60 },
  workspace: { capacity: 20, refillRate: 100 / 60 },
  user: { capacity: 5, refillRate: 20 / 60 },
};
