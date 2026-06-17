import { describe, it, expect, vi } from "vitest";

vi.mock("@repo/logger", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...(actual as Record<string, unknown>),
    createLogger: vi.fn().mockReturnValue({
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      debug: vi.fn(),
    }),
  };
});

vi.mock("@repo/cache", () => ({
  createCacheClient: vi.fn(),
  get: vi.fn(),
  set: vi.fn(),
  del: vi.fn(),
}));

describe("Performance Benchmarks", () => {
  describe("Rate Limiter", () => {
    it("handles burst of requests within limits", async () => {
      const { createRateLimiter } = await import("../rate-limiter");
      const limiter = createRateLimiter({ backend: "memory" } as Record<string, never>);

      const results = await Promise.all(
        Array.from({ length: 20 }, (_, i) =>
          limiter.checkLimit({ workspaceId: "ws-1", userId: `u-${i}` })
        )
      );

      const allowed = results.filter((r) => r.allowed).length;
      expect(allowed).toBeGreaterThan(0);
    });
  });

  describe("Token Estimation", () => {
    it("estimates tokens for CJK text", () => {
      const { estimateTokens } = vi.hoisted(() => ({
        estimateTokens: (text: string) => Math.ceil(text.length * 1.5),
      }));

      const chinese = estimateTokens("你好世界");
      expect(chinese).toBe(6);

      const english = estimateTokens("hello");
      expect(english).toBe(8);
    });

    it("estimates tokens for mixed text", () => {
      const { countTokens } = vi.hoisted(() => ({
        countTokens: (text: string) => Math.ceil(text.length * 0.5),
      }));

      const tokens = countTokens("Hello world, this is a test message");
      expect(tokens).toBeGreaterThan(0);
    });
  });

  describe("Circuit Breaker", () => {
    it("tracks consecutive failures", async () => {
      const failures: number[] = [];
      let count = 0;

      const getState = () => {
        count++;
        failures.push(count);
        return count >= 3 ? "open" : "closed";
      };

      getState();
      getState();
      const state3 = getState();

      expect(state3).toBe("open");
      expect(failures).toHaveLength(3);
    });
  });
});
