import { DEFAULT_MODELS } from "../router/registry";
import type { PricingEntry } from "./types";
import { createLogger } from "@repo/logger";

const logger = createLogger("cost/pricing");

const DEFAULT_PROMPT_PRICE = 0.10;
const DEFAULT_COMPLETION_PRICE = 0.40;

let pricingCache: Map<string, { prompt: number; completion: number }> | undefined;

function getDefaultPricingMap(): Map<string, { prompt: number; completion: number }> {
  if (pricingCache) {
    return pricingCache;
  }

  const map = new Map<string, { prompt: number; completion: number }>();

  for (const entry of DEFAULT_MODELS) {
    map.set(entry.modelId, entry.pricing);
  }

  pricingCache = map;
  return map;
}

function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

export function getPricing(model: string): PricingEntry {
  const pricingMap = getDefaultPricingMap();
  const pricing = pricingMap.get(model);

  if (pricing) {
    return {
      model,
      promptPrice: pricing.prompt,
      completionPrice: pricing.completion,
    };
  }

  logger.warn({ model }, "No pricing found for model, using defaults");
  return {
    model,
    promptPrice: DEFAULT_PROMPT_PRICE,
    completionPrice: DEFAULT_COMPLETION_PRICE,
  };
}

export function calculateCost(
  promptTokens: number,
  completionTokens: number,
  model: string,
  cachedTokens?: number,
): number {
  const pricing = getPricing(model);

  const effectivePromptTokens =
    cachedTokens !== undefined && cachedTokens > 0
      ? promptTokens - cachedTokens + cachedTokens * 0.5
      : promptTokens;

  const promptCost = (effectivePromptTokens * pricing.promptPrice) / 1_000_000;
  const completionCost = (completionTokens * pricing.completionPrice) / 1_000_000;

  return promptCost + completionCost;
}

export function estimateCost(input: string, model: string): number {
  const estimatedPromptTokens = estimateTokens(input);
  return calculateCost(estimatedPromptTokens, 0, model);
}

export function getModelPricingList(): PricingEntry[] {
  const pricingMap = getDefaultPricingMap();
  const entries: PricingEntry[] = [];

  for (const [model, pricing] of pricingMap) {
    entries.push({
      model,
      promptPrice: pricing.prompt,
      completionPrice: pricing.completion,
    });
  }

  return entries;
}
