import { describe, it, expect, vi, beforeEach } from "vitest";

import { createCostTracker } from "../cost";
import { calculateCost, estimateCost, getPricing } from "../cost/pricing";
import type { CostStorage } from "../cost";

function createMockStorage(): CostStorage {
  return {
    insertMany: vi.fn().mockResolvedValue(undefined),
  };
}

describe("Cost Tracker", () => {
  let storage: CostStorage;

  beforeEach(() => {
    storage = createMockStorage();
  });

  describe("createCostTracker", () => {
    it("stores a cost record", async () => {
      const tracker = createCostTracker(storage);

      tracker.record({
        workspaceId: "ws-1",
        userId: "u-1",
        requestId: "r-1",
        model: "openai/gpt-4o-mini",
        provider: "openai",
        taskType: "chat",
        promptTokens: 100,
        completionTokens: 50,
        totalTokens: 150,
        cachedTokens: 0,
        metadata: { streamed: false },
        cost: 0,
        currency: "USD",
      });

      await tracker.flush();
      expect(storage.insertMany).toHaveBeenCalled();
    });

    it("batches multiple records before flush", async () => {
      const tracker = createCostTracker(storage);

      for (let i = 0; i < 5; i++) {
        tracker.record({
          workspaceId: "ws-1",
          userId: "u-1",
          requestId: `r-${i}`,
          model: "openai/gpt-4o-mini",
          provider: "openai",
          taskType: "chat",
          promptTokens: 10,
          completionTokens: 5,
          totalTokens: 15,
          cachedTokens: 0,
          metadata: { streamed: false },
          cost: 0,
          currency: "USD",
        });
      }

      await tracker.flush();
      expect(storage.insertMany).toHaveBeenCalled();
    });

    it("shuts down gracefully", async () => {
      const tracker = createCostTracker(storage);
      await expect(tracker.shutdown()).resolves.toBeUndefined();
    });
  });

  describe("calculateCost", () => {
    it("calculates cost from token counts using model pricing", () => {
      const cost = calculateCost(100, 50, "openai/gpt-4o-mini");
      const expected = (100 * 0.15 + 50 * 0.60) / 1_000_000;
      expect(cost).toBe(expected);
    });

    it("applies 50% discount for cached tokens", () => {
      const cost = calculateCost(100, 50, "openai/gpt-4o-mini", 50);
      const effectivePrompt = 100 - 50 + 50 * 0.5;
      const expected = (effectivePrompt * 0.15 + 50 * 0.60) / 1_000_000;
      expect(cost).toBe(expected);
    });
  });

  describe("estimateCost", () => {
    it("estimates cost from text length", () => {
      const cost = estimateCost("Hello world", "openai/gpt-4o-mini");
      expect(cost).toBeGreaterThan(0);
    });
  });

  describe("getPricing", () => {
    it("returns pricing for known model", () => {
      const pricing = getPricing("openai/gpt-4o-mini");
      expect(pricing).toBeDefined();
      expect(pricing.promptPrice).toBe(0.15);
    });

    it("returns default pricing for unknown model", () => {
      const pricing = getPricing("unknown/model");
      expect(pricing).toBeDefined();
      expect(pricing.promptPrice).toBe(0.10);
      expect(pricing.completionPrice).toBe(0.40);
    });
  });
});
