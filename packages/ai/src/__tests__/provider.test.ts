import { describe, it, expect, vi, beforeEach } from "vitest";

import { createProvider } from "../providers/factory";
import type { ChatResponse, EmbedResponse, Model } from "../providers/types";

vi.mock("../providers/openrouter", () => {
  const mockProvider = {
    id: "openrouter",
    capabilities: ["chat", "streaming", "embedding", "function_calling", "json_mode"],
    metadata: { id: "openrouter", name: "OpenRouter", capabilities: [] },
    chatCompletion: vi.fn(),
    chatCompletionStream: vi.fn(),
    embed: vi.fn(),
    listModels: vi.fn(),
  };

  return {
    createOpenRouterProvider: () => mockProvider,
    createOpenRouterClient: vi.fn(),
  };
});

describe("Provider Abstraction", () => {
  beforeEach(() => {
    vi.stubEnv("OPENROUTER_API_KEY", "test-key");
  });

  describe("createProvider", () => {
    it("creates a provider with chat capability", () => {
      const provider = createProvider("openrouter");

      expect(provider.id).toBe("openrouter");
      expect(provider.capabilities).toContain("chat");
    });

    it("chatCompletion returns typed response", async () => {
      const provider = createProvider("openrouter");
      const mockResponse: ChatResponse = {
        id: "test-1",
        model: "openai/gpt-4o-mini",
        choices: [{ index: 0, message: { role: "assistant", content: "Hi" }, finishReason: "stop" }],
        usage: { promptTokens: 5, completionTokens: 5, totalTokens: 10 },
      };

      vi.mocked(provider.chatCompletion).mockResolvedValue(mockResponse);

      const result = await provider.chatCompletion({
        model: "openai/gpt-4o-mini",
        messages: [{ role: "user", content: "Hello" }],
      });

      expect(result.choices[0].message.content).toBe("Hi");
    });

    it("chatCompletionStream returns async generator", async () => {
      const provider = createProvider("openrouter");

      async function* mockStream() {
        yield {
          id: "s1",
          model: "openai/gpt-4o-mini",
          choices: [{ index: 0, delta: { content: "A" }, finishReason: null }],
        };
      }

      vi.mocked(provider.chatCompletionStream).mockReturnValue(mockStream());

      const stream = provider.chatCompletionStream({
        model: "openai/gpt-4o-mini",
        messages: [{ role: "user", content: "Hi" }],
      });

      const chunks = [];
      for await (const c of stream) {
        chunks.push(c);
      }

      expect(chunks).toHaveLength(1);
    });

    it("embed returns typed response", async () => {
      const provider = createProvider("openrouter");
      const mockResponse: EmbedResponse = {
        model: "openai/text-embedding-3-large",
        data: [{ index: 0, embedding: [0.1, 0.2] }],
        usage: { promptTokens: 3, totalTokens: 3 },
      };

      vi.mocked(provider.embed).mockResolvedValue(mockResponse);

      const result = await provider.embed({
        model: "openai/text-embedding-3-large",
        input: "test",
      });

      expect(result.data[0].embedding).toHaveLength(2);
    });

    it("listModels returns models", async () => {
      const provider = createProvider("openrouter");
      const mockModels: Model[] = [
        { id: "openai/gpt-4o", name: "GPT-4o", provider: "openrouter", contextLength: 128000, capabilities: ["chat"] },
      ];

      vi.mocked(provider.listModels).mockResolvedValue(mockModels);

      const models = await provider.listModels();
      expect(models).toHaveLength(1);
    });
  });
});
