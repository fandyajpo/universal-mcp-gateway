import { describe, it, expect, vi, beforeEach } from "vitest";

import { createFallbackChain } from "../fallback";
import { createRouter } from "../router";
import { getCircuitState, recordFailure, recordSuccess, resetCircuit } from "../fallback/circuit-breaker";

vi.mock("../fallback/circuit-breaker", () => ({
  getCircuitState: vi.fn(),
  recordFailure: vi.fn(),
  recordSuccess: vi.fn(),
  resetCircuit: vi.fn(),
}));

describe("Fallback Chain", () => {
  const router = createRouter();

  beforeEach(() => {
    vi.mocked(getCircuitState).mockResolvedValue("closed");
    vi.mocked(recordFailure).mockResolvedValue("closed");
    vi.mocked(recordSuccess).mockResolvedValue(undefined);
    vi.mocked(resetCircuit).mockResolvedValue(undefined);
  });

  describe("execute", () => {
    it("succeeds on first model", async () => {
      const chain = createFallbackChain({ router });
      const task = vi.fn().mockResolvedValue("ok");

      const { result, fallbackResult } = await chain.execute(task, "chat", "ws-1");

      expect(result).toBe("ok");
      expect(fallbackResult.fallbackDepth).toBe(0);
      expect(fallbackResult.totalAttempts).toBe(1);
      expect(fallbackResult.errors).toHaveLength(0);
    });

    it("falls back to next model on retryable error", async () => {
      vi.mocked(getCircuitState).mockResolvedValue("closed");
      vi.mocked(recordFailure).mockResolvedValue("open");

      const chain = createFallbackChain({ router });

      const task = vi
        .fn()
        .mockRejectedValueOnce(new Error("Service Unavailable"))
        .mockResolvedValueOnce("ok");

      const { result, fallbackResult } = await chain.execute(task, "chat", "ws-1");

      expect(result).toBe("ok");
      expect(fallbackResult.fallbackDepth).toBe(1);
      expect(fallbackResult.totalAttempts).toBe(2);
      expect(fallbackResult.errors).toHaveLength(1);
      expect(fallbackResult.errors[0].model).toBeTruthy();
    });

    it("throws after all models exhausted", async () => {
      vi.mocked(getCircuitState).mockResolvedValue("closed");
      vi.mocked(recordFailure).mockResolvedValue("open");

      const chain = createFallbackChain({ router });
      const task = vi.fn().mockRejectedValue(new Error("Always fails"));

      await expect(chain.execute(task, "chat", "ws-1")).rejects.toThrow("Fallback chain exhausted");
    });

    it("skips models with open circuit breaker", async () => {
      vi.mocked(getCircuitState)
        .mockResolvedValueOnce("open")
        .mockResolvedValueOnce("closed");

      const chain = createFallbackChain({ router });
      const task = vi.fn().mockResolvedValue("ok");

      const { result, fallbackResult } = await chain.execute(task, "chat", "ws-1");

      expect(result).toBe("ok");
      expect(fallbackResult.fallbackDepth).toBeGreaterThan(0);
    });

    it("uses embedding fallback list for embedding task", async () => {
      const chain = createFallbackChain({ router });
      const task = vi.fn().mockResolvedValue("ok");

      const { fallbackResult } = await chain.execute(task, "embedding", "ws-1");

      expect(fallbackResult.totalAttempts).toBe(1);
    });
  });
});
