import { getHealth } from "./router/health";
import { createRegistry, loadRegistryFromRedis, saveRegistryToRedis, updateModelHealth } from "./router/registry";
import { getTierConfig, isModelAllowedForTier } from "./router/tiers";
import type {
  HealthStatus,
  ModelRegistryEntry,
  RouteRequest,
  RouteResult,
  RouterConfig,
} from "./router/types";
import { createLogger } from "@repo/logger";

const logger = createLogger("model-router");

const DEFAULT_ESTIMATE_PROMPT_TOKENS = 500;
const DEFAULT_ESTIMATE_COMPLETION_TOKENS = 200;

export interface Router {
  route(request: RouteRequest): RouteResult;

  getRegistry(): ReadonlyMap<string, ModelRegistryEntry>;

  updateModelHealth(modelId: string, health: HealthStatus): void;

  refreshFromRedis(): Promise<void>;

  persistToRedis(): Promise<void>;
}

interface Candidate {
  entry: ModelRegistryEntry;
  cost: number;
}

function bestCandidate(
  candidates: Candidate[],
  preferredModel?: string,
): Candidate {
  if (preferredModel) {
    const preferred = candidates.find(
      (c) => c.entry.modelId === preferredModel,
    );
    if (preferred) {
      return preferred;
    }
  }

  let best: Candidate | undefined;

  for (const candidate of candidates) {
    if (!best) {
      best = candidate;
      continue;
    }

    const bestHealth = getHealth(best.entry.modelId);
    const candHealth = getHealth(candidate.entry.modelId);

    if (bestHealth === "healthy" && candHealth !== "healthy") {
      continue;
    }

    if (bestHealth !== "healthy" && candHealth === "healthy") {
      best = candidate;
      continue;
    }

    if (candidate.cost < best.cost) {
      best = candidate;
    }
  }

  // candidates is guaranteed to be non-empty by the caller
  if (!best) {
    throw new Error("bestCandidate called with empty candidates");
  }

  return best;
}

export function createRouter(config?: RouterConfig): Router {
  const estimatePromptTokens = config?.estimatePromptTokens ?? DEFAULT_ESTIMATE_PROMPT_TOKENS;
  const estimateCompletionTokens = config?.estimateCompletionTokens ?? DEFAULT_ESTIMATE_COMPLETION_TOKENS;

  const registry = createRegistry();

  function calculateCost(entry: ModelRegistryEntry): number {
    const promptCost = (estimatePromptTokens / 1_000_000) * entry.pricing.prompt;
    const completionCost = (estimateCompletionTokens / 1_000_000) * entry.pricing.completion;
    return promptCost + completionCost;
  }

  function matchesCapabilities(
    entry: ModelRegistryEntry,
    required: string[],
  ): boolean {
    if (required.length === 0) {
      return true;
    }

    return required.every((cap) => entry.capabilities.includes(cap));
  }

  function route(request: RouteRequest): RouteResult {
    const {
      taskType,
      capabilities = [],
      maxCost,
      preferredModel,
      userTier,
    } = request;

    const tierConfig = getTierConfig(userTier);
    const maxAllowedCost = maxCost ?? tierConfig.maxCost;
    const candidates: Candidate[] = [];

    for (const entry of registry.values()) {
      if (!entry.capabilities.includes(taskType)) {
        continue;
      }

      if (!isModelAllowedForTier(entry.modelId, userTier)) {
        continue;
      }

      if (!matchesCapabilities(entry, capabilities)) {
        continue;
      }

      const health = getHealth(entry.modelId);
      if (health === "down") {
        continue;
      }

      if (entry.tier.length > 0 && !entry.tier.includes(userTier)) {
        continue;
      }

      const cost = calculateCost(entry);
      if (cost > maxAllowedCost) {
        continue;
      }

      candidates.push({ entry, cost });
    }

    if (candidates.length === 0) {
      const allModelIds = Array.from(registry.keys()).sort().join(", ");
      logger.warn(
        {
          taskType,
          capabilities,
          maxCost: maxAllowedCost,
          userTier,
          preferredModel,
        },
        "No suitable model found",
      );
      return {
        model: "",
        provider: "",
        estimatedCost: 0,
        reasoning: `No model found matching taskType="${taskType}", capabilities=[${capabilities.join(", ")}], maxCost=${maxAllowedCost}, userTier="${userTier}"${preferredModel ? `, preferredModel="${preferredModel}"` : ""}. Available models: ${allModelIds || "none"}`,
      };
    }

    const selected = bestCandidate(candidates, preferredModel);

    const alternatives = candidates
      .filter((c) => c.entry.modelId !== selected.entry.modelId)
      .slice(0, 3)
      .map((c) => c.entry.modelId);

    logger.info(
      {
        taskType,
        userTier,
        selectedModel: selected.entry.modelId,
        estimatedCost: selected.cost.toFixed(6),
        alternatives,
      },
      "Route decision",
    );

    return {
      model: selected.entry.modelId,
      provider: selected.entry.providerId,
      estimatedCost: selected.cost,
      reasoning: `Selected ${selected.entry.modelId} (${selected.entry.providerId}) for taskType="${taskType}" at userTier="${userTier}": estimated cost $${selected.cost.toFixed(6)}. ${preferredModel && selected.entry.modelId === preferredModel ? "Preferred model was available and selected. " : preferredModel ? `Preferred model "${preferredModel}" was unavailable or excluded; fell back to cheapest capable model. ` : ""}Alternatives considered: ${alternatives.join(", ") || "none"}.`,
    };
  }

  return {
    route,

    getRegistry(): ReadonlyMap<string, ModelRegistryEntry> {
      return registry;
    },

    updateModelHealth(modelId: string, health: HealthStatus): void {
      updateModelHealth(registry, modelId, health);
    },

    async refreshFromRedis(): Promise<void> {
      const loaded = await loadRegistryFromRedis();
      if (loaded) {
        registry.clear();
        for (const [key, value] of loaded) {
          registry.set(key, value);
        }
        logger.info({ modelCount: registry.size }, "Registry refreshed from Redis");
      }
    },

    async persistToRedis(): Promise<void> {
      await saveRegistryToRedis(registry);
    },
  };
}
