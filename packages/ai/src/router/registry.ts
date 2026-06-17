import { setHealth } from "./health";
import type { HealthStatus, ModelRegistryEntry } from "./types";
import { createLogger } from "@repo/logger";

const logger = createLogger("router/registry");

export const DEFAULT_MODELS: ModelRegistryEntry[] = [
  {
    modelId: "openai/gpt-4o",
    providerId: "openai",
    capabilities: ["chat", "completion", "streaming", "function_calling", "vision", "json_mode"],
    contextWindow: 128_000,
    pricing: { prompt: 2.50, completion: 10.00 },
    tier: ["pro", "enterprise"],
    health: "healthy",
  },
  {
    modelId: "openai/gpt-4o-mini",
    providerId: "openai",
    capabilities: ["chat", "completion", "streaming", "function_calling", "json_mode"],
    contextWindow: 128_000,
    pricing: { prompt: 0.15, completion: 0.60 },
    tier: ["free", "pro", "enterprise"],
    health: "healthy",
  },
  {
    modelId: "anthropic/claude-sonnet-4",
    providerId: "anthropic",
    capabilities: ["chat", "completion", "streaming", "function_calling", "vision", "json_mode"],
    contextWindow: 200_000,
    pricing: { prompt: 3.00, completion: 15.00 },
    tier: ["pro", "enterprise"],
    health: "healthy",
  },
  {
    modelId: "anthropic/claude-haiku-3.5",
    providerId: "anthropic",
    capabilities: ["chat", "completion", "streaming", "function_calling", "json_mode"],
    contextWindow: 200_000,
    pricing: { prompt: 0.80, completion: 4.00 },
    tier: ["free", "pro", "enterprise"],
    health: "healthy",
  },
  {
    modelId: "google/gemini-2.0-flash",
    providerId: "google",
    capabilities: ["chat", "completion", "streaming", "function_calling", "vision", "json_mode"],
    contextWindow: 1_048_576,
    pricing: { prompt: 0.10, completion: 0.40 },
    tier: ["free", "pro", "enterprise"],
    health: "healthy",
  },
  {
    modelId: "openai/text-embedding-3-large",
    providerId: "openai",
    capabilities: ["embedding"],
    contextWindow: 8191,
    pricing: { prompt: 0.13, completion: 0.00 },
    tier: ["free", "pro", "enterprise"],
    health: "healthy",
  },
];

export function createRegistry(
  models?: ModelRegistryEntry[],
): Map<string, ModelRegistryEntry> {
  const entries = models ?? DEFAULT_MODELS;
  const registry = new Map<string, ModelRegistryEntry>();

  for (const entry of entries) {
    registry.set(entry.modelId, entry);
    setHealth(entry.modelId, entry.health);
  }

  logger.info({ modelCount: registry.size }, "Model registry initialized");
  return registry;
}

export async function saveRegistryToRedis(
  registry: Map<string, ModelRegistryEntry>,
): Promise<void> {
  try {
    const { set } = await import("@repo/cache");
    const data = Array.from(registry.values());
    await set("model:registry", JSON.stringify(data), 300);
    logger.info({ modelCount: data.length }, "Registry saved to Redis");
  } catch (error) {
    logger.warn({ error }, "Failed to save registry to Redis");
  }
}

export async function loadRegistryFromRedis(): Promise<Map<string, ModelRegistryEntry> | null> {
  try {
    const { get } = await import("@repo/cache");
    const raw = await get("model:registry");
    if (!raw) {
      return null;
    }

    const models = JSON.parse(raw) as ModelRegistryEntry[];
    const registry = new Map<string, ModelRegistryEntry>();
    for (const entry of models) {
      registry.set(entry.modelId, entry);
    }
    logger.info({ modelCount: registry.size }, "Registry loaded from Redis");
    return registry;
  } catch (error) {
    logger.warn({ error }, "Failed to load registry from Redis, using defaults");
    return null;
  }
}

export function updateModelHealth(
  registry: Map<string, ModelRegistryEntry>,
  modelId: string,
  health: HealthStatus,
): void {
  const entry = registry.get(modelId);
  if (entry) {
    entry.health = health;
    setHealth(modelId, health);
    logger.info({ modelId, health }, "Model health updated in registry");
  }
}
