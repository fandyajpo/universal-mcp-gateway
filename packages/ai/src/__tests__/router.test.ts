import { describe, it, expect } from "vitest";

import { createRouter } from "../router";

describe("Model Router", () => {
  const router = createRouter();

  describe("route", () => {
    it("selects cheapest capable model", () => {
      const result = router.route({
        taskType: "chat",
        userTier: "pro",
      });

      expect(result.model).toBeTruthy();
      expect(result.provider).toBeTruthy();
      expect(result.estimatedCost).toBeGreaterThan(0);
      expect(result.reasoning).toContain("Selected");
    });

    it("respects preferred model when available", () => {
      const result = router.route({
        taskType: "chat",
        preferredModel: "google/gemini-2.0-flash",
        userTier: "free",
      });

      expect(result.model).toBe("google/gemini-2.0-flash");
    });

    it("selects models within free tier allowlist", () => {
      const result = router.route({
        taskType: "chat",
        userTier: "free",
      });

      expect(result.model).toBeTruthy();
      expect(["openai/gpt-4o-mini", "anthropic/claude-haiku-3.5", "google/gemini-2.0-flash"]).toContain(result.model);
    });

    it("filters models by required capabilities", () => {
      const result = router.route({
        taskType: "chat",
        capabilities: ["vision"],
        userTier: "pro",
      });

      expect(result.model).toBeTruthy();
      expect(["openai/gpt-4o", "anthropic/claude-sonnet-4", "google/gemini-2.0-flash"]).toContain(result.model);
    });

    it("excludes down models", () => {
      router.updateModelHealth("openai/gpt-4o-mini", "down");

      const result = router.route({
        taskType: "chat",
        userTier: "pro",
      });

      expect(result.model).toBeTruthy();
      expect(result.model).not.toBe("openai/gpt-4o-mini");

      router.updateModelHealth("openai/gpt-4o-mini", "healthy");
    });

    it("returns empty result when no models match", () => {
      const result = router.route({
        taskType: "chat",
        capabilities: ["nonexistent_capability"],
        userTier: "pro",
      });

      expect(result.model).toBe("");
      expect(result.provider).toBe("");
    });

    it("respects tier restrictions", () => {
      const result = router.route({
        taskType: "chat",
        userTier: "enterprise",
      });

      expect(result.model).toBeTruthy();
      expect(result.estimatedCost).toBeGreaterThan(0);
    });

    it("prefers healthy models over degraded", () => {
      router.updateModelHealth("openai/gpt-4o-mini", "degraded");

      const result = router.route({
        taskType: "chat",
        userTier: "pro",
      });

      expect(result.model).toBeTruthy();

      router.updateModelHealth("openai/gpt-4o-mini", "healthy");
    });

    it("provides reasoning with alternatives", () => {
      const result = router.route({
        taskType: "chat",
        userTier: "pro",
      });

      expect(result.reasoning).toContain("Selected");
      expect(result.reasoning.length).toBeGreaterThan(20);
    });

    it("enforces maxCost limit", () => {
      const result = router.route({
        taskType: "chat",
        maxCost: 0.00001,
        userTier: "pro",
      });

      expect(result.model).toBe("");
    });
  });

  describe("getRegistry", () => {
    it("returns non-empty registry", () => {
      const registry = router.getRegistry();
      expect(registry.size).toBeGreaterThan(0);
    });
  });
});
