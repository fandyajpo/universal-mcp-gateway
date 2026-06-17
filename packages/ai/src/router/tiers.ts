import type { TierConfig, TierName } from "./types";

export const TIER_CONFIG: Record<TierName, TierConfig> = {
  free: {
    maxCost: 0.01,
    allowlist: ["gpt-4o-mini", "claude-haiku-3.5", "gemini-2.0-flash"],
  },
  pro: {
    maxCost: 0.01,
    allowlist: [],
  },
  enterprise: {
    maxCost: Infinity,
    allowlist: [],
  },
};

export function getTierConfig(tier: TierName): TierConfig {
  return TIER_CONFIG[tier];
}

export function isModelAllowedForTier(
  modelId: string,
  tier: TierName,
): boolean {
  const config = getTierConfig(tier);

  if (config.allowlist.length > 0) {
    return config.allowlist.some((pattern) => modelId === pattern || modelId.endsWith(`/${pattern}`));
  }

  return true;
}
