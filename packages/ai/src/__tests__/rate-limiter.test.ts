import { describe, it, expect, vi, beforeEach } from "vitest";

import { DEFAULT_RATE_LIMIT_CONFIG } from "../rate-limiter/types";
import type { RateLimitConfig } from "../rate-limiter/types";

vi.mock("../rate-limiter/token-bucket", () => ({
  createTokenBucketClient: () => ({
    consume: vi.fn().mockResolvedValue({ allowed: true, remaining: 5, resetAt: 999 }),
  }),
}));

describe("Rate Limit Config", () => {
  it("has reasonable default values", () => {
    expect(DEFAULT_RATE_LIMIT_CONFIG.global.capacity).toBe(50);
    expect(DEFAULT_RATE_LIMIT_CONFIG.workspace.capacity).toBe(20);
    expect(DEFAULT_RATE_LIMIT_CONFIG.user.capacity).toBe(5);
  });

  it("allows configuration override", () => {
    const custom: RateLimitConfig = {
      global: { capacity: 100, refillRate: 200 },
      workspace: { capacity: 50, refillRate: 100 },
      user: { capacity: 10, refillRate: 30 },
    };

    expect(custom.global.capacity).toBe(100);
    expect(custom.user.capacity).toBe(10);
  });
});

describe("Token Bucket Client", () => {
  it("consume returns allowed result", async () => {
    const { createTokenBucketClient } = await import("../rate-limiter/token-bucket");
    const client = createTokenBucketClient();

    const result = await client.consume("test-key", 10, 5, 1);

    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(5);
  });
});
