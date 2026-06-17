import { createTokenBucketClient } from "./rate-limiter/token-bucket";
import { DEFAULT_RATE_LIMIT_CONFIG } from "./rate-limiter/types";
import type { RateLimitConfig, RateLimitResult, RateLimitTier } from "./rate-limiter/types";
import { createLogger } from "@repo/logger";

const logger = createLogger("rate-limiter");

const CONFIG_REDIS_KEY = "ratelimit:ai:config";
const CONFIG_TTL = 300;

const KEY_PREFIX = "ratelimit:ai";
const KEY_GLOBAL = `${KEY_PREFIX}:global`;
const KEY_WORKSPACE = `${KEY_PREFIX}:workspace`;
const KEY_USER = `${KEY_PREFIX}:user`;

interface TierCheckResult {
  tier: RateLimitTier;
  result: RateLimitResult;
}

function getTierKey(tier: RateLimitTier, workspaceId?: string, userId?: string): string {
  switch (tier) {
    case "global":
      return KEY_GLOBAL;
    case "workspace":
      return `${KEY_WORKSPACE}:${workspaceId ?? "unknown"}`;
    case "user":
      return `${KEY_USER}:${userId ?? "unknown"}`;
  }
}

async function loadConfigFromRedis(): Promise<RateLimitConfig | undefined> {
  try {
    const { get } = await import("@repo/cache");
    const raw = await get(CONFIG_REDIS_KEY);
    if (raw) {
      return JSON.parse(raw) as RateLimitConfig;
    }
  } catch (error) {
    logger.warn({ error }, "Failed to load rate limit config from Redis");
  }
  return undefined;
}

async function saveConfigToRedis(config: RateLimitConfig): Promise<void> {
  try {
    const { set } = await import("@repo/cache");
    await set(CONFIG_REDIS_KEY, config as unknown as Record<string, unknown>, CONFIG_TTL);
  } catch (error) {
    logger.warn({ error }, "Failed to save rate limit config to Redis");
  }
}

export interface RateLimiter {
  checkLimit(options: {
    cost?: number;
    workspaceId?: string;
    userId?: string;
    bypass?: boolean;
  }): Promise<{
    allowed: boolean;
    remaining: number;
    resetAt: number;
    tier: RateLimitTier | undefined;
    limits: Record<RateLimitTier, RateLimitResult>;
  }>;

  consume(key: string, cost?: number): Promise<RateLimitResult>;

  resetLimit(key: string): Promise<void>;

  updateConfig(config: Partial<RateLimitConfig>): Promise<void>;

  getConfig(): Promise<RateLimitConfig>;
}

export function createRateLimiter(config?: Partial<RateLimitConfig>): RateLimiter {
  const client = createTokenBucketClient();
  let currentConfig: RateLimitConfig = { ...DEFAULT_RATE_LIMIT_CONFIG, ...config };
  let configLoaded = false;

  async function ensureConfigLoaded(): Promise<void> {
    if (configLoaded) {
      return;
    }

    const redisConfig = await loadConfigFromRedis();
    if (redisConfig) {
      currentConfig = redisConfig;
    }

    configLoaded = true;
  }

  function getTierConfig(tier: RateLimitTier): { capacity: number; refillRate: number } {
    switch (tier) {
      case "global":
        return currentConfig.global;
      case "workspace":
        return currentConfig.workspace;
      case "user":
        return currentConfig.user;
    }
  }

  async function checkSingleTier(
    tier: RateLimitTier,
    cost: number,
    workspaceId?: string,
    userId?: string,
  ): Promise<TierCheckResult> {
    const key = getTierKey(tier, workspaceId, userId);
    const tierConfig = getTierConfig(tier);
    const result = await client.consume(key, tierConfig.capacity, tierConfig.refillRate, cost);
    return { tier, result };
  }

  async function checkLimit(options: {
    cost?: number;
    workspaceId?: string;
    userId?: string;
    bypass?: boolean;
  }): Promise<{
    allowed: boolean;
    remaining: number;
    resetAt: number;
    tier: RateLimitTier | undefined;
    limits: Record<RateLimitTier, RateLimitResult>;
  }> {
    await ensureConfigLoaded();

    if (options.bypass) {
      const allowedResult: RateLimitResult = { allowed: true, remaining: 999, resetAt: 0 };
      return {
        allowed: true,
        remaining: 999,
        resetAt: 0,
        tier: undefined,
        limits: { global: allowedResult, workspace: allowedResult, user: allowedResult },
      };
    }

    const cost = options.cost ?? 1;

    const [globalResult, workspaceResult, userResult] = await Promise.all([
      checkSingleTier("global", cost, options.workspaceId, options.userId),
      checkSingleTier("workspace", cost, options.workspaceId, options.userId),
      checkSingleTier("user", cost, options.workspaceId, options.userId),
    ]);

    const allResults: Record<RateLimitTier, RateLimitResult> = {
      global: globalResult.result,
      workspace: workspaceResult.result,
      user: userResult.result,
    };

    const failing = [globalResult, workspaceResult, userResult].find((r) => !r.result.allowed);

    if (failing) {
      logger.warn(
        { tier: failing.tier, remaining: failing.result.remaining, resetAt: failing.result.resetAt },
        "Rate limit exceeded",
      );
      return {
        allowed: false,
        remaining: failing.result.remaining,
        resetAt: failing.result.resetAt,
        tier: failing.tier,
        limits: allResults,
      };
    }

    return {
      allowed: true,
      remaining: Math.min(globalResult.result.remaining, workspaceResult.result.remaining, userResult.result.remaining),
      resetAt: Math.min(globalResult.result.resetAt, workspaceResult.result.resetAt, userResult.result.resetAt),
      tier: undefined,
      limits: allResults,
    };
  }

  async function consume(key: string, cost = 1): Promise<RateLimitResult> {
    return client.consume(key, currentConfig.global.capacity, currentConfig.global.refillRate, cost);
  }

  async function resetLimit(key: string): Promise<void> {
    try {
      const { del } = await import("@repo/cache");
      await del(key);
    } catch (error) {
      logger.warn({ error, key }, "Failed to reset rate limit");
    }
  }

  async function updateConfig(partial: Partial<RateLimitConfig>): Promise<void> {
    currentConfig = { ...currentConfig, ...partial };
    await saveConfigToRedis(currentConfig);
    logger.info({ config: currentConfig }, "Rate limit config updated");
  }

  async function getConfig(): Promise<RateLimitConfig> {
    await ensureConfigLoaded();
    return { ...currentConfig };
  }

  return { checkLimit, consume, resetLimit, updateConfig, getConfig };
}
