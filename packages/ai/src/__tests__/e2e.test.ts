import { describe, it, expect, vi, beforeAll } from "vitest";

import { createProvider } from "../providers/provider";
import { createRouter } from "../router";
import { createStreamManager } from "../stream";
import { createFallbackChain } from "../fallback";
import { getCircuitState } from "../fallback/circuit-breaker";

vi.mock("../fallback/circuit-breaker", () => ({
  getCircuitState: vi.fn(),
  recordFailure: vi.fn(),
  recordSuccess: vi.fn(),
  resetCircuit: vi.fn(),
}));

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

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

function skipIfNoKey() {
  if (!OPENROUTER_API_KEY) {
    console.warn("Skipping E2E test: no OPENROUTER_API_KEY set");
  }
}

describe("AI Gateway E2E", () => {
  beforeAll(() => {
    vi.mocked(getCircuitState).mockResolvedValue("closed");
  });

  describe("Chat Completion", () => {
    it("completes a simple chat request", { timeout: 30_000 }, async () => {
      skipIfNoKey();
      if (!OPENROUTER_API_KEY) return;

      const provider = createProvider({
        apiKey: OPENROUTER_API_KEY,
        baseUrl: "https://openrouter.ai/api/v1",
      });

      const result = await provider.chatCompletion({
        model: "openai/gpt-4o-mini",
        messages: [
          { role: "user", content: "Say hello in one word" },
        ],
      });

      expect(result.id).toBeTruthy();
      expect(result.choices).toHaveLength(1);
      expect(result.choices[0].message.content).toBeTruthy();
      expect(result.usage).toBeDefined();
      expect(result.usage?.promptTokens).toBeGreaterThan(0);
    });
  });

  describe("Streaming", () => {
    it("streams tokens from a chat completion", { timeout: 30_000 }, async () => {
      skipIfNoKey();
      if (!OPENROUTER_API_KEY) return;

      const provider = createProvider({
        apiKey: OPENROUTER_API_KEY,
        baseUrl: "https://openrouter.ai/api/v1",
      });

      const stream = await provider.chatCompletionStream({
        model: "openai/gpt-4o-mini",
        messages: [
          { role: "user", content: "Count to 3" },
        ],
      });

      const manager = createStreamManager();
      const chunks: string[] = [];

      for await (const chunk of manager.iterate(stream)) {
        chunks.push(chunk);
      }

      const fullText = chunks.join("");
      expect(fullText.length).toBeGreaterThan(0);
    });
  });

  describe("Router + Fallback", () => {
    it("routes and falls back across providers", { timeout: 60_000 }, async () => {
      skipIfNoKey();
      if (!OPENROUTER_API_KEY) return;

      const router = createRouter();
      const chain = createFallbackChain({ router });

      const task = vi.fn().mockImplementation(async () => {
        const provider = createProvider({
          apiKey: OPENROUTER_API_KEY!,
          baseUrl: "https://openrouter.ai/api/v1",
        });

        return provider.chatCompletion({
          model: "openai/gpt-4o-mini",
          messages: [{ role: "user", content: "Say hi" }],
        });
      });

      const { result } = await chain.execute(task, "chat", "e2e-ws");
      expect(result.choices[0].message.content).toBeTruthy();
    });
  });
});
