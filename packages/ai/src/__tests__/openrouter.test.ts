import { describe, it, expect, vi, beforeEach } from "vitest";

import { createOpenRouterClient } from "../providers/openrouter";
import type { ChatCompletionResponse, EmbeddingResponse, ModelInfo } from "../providers/openrouter/types";

function mockFetch(response: unknown, ok = true, status = 200) {
  return vi.fn().mockResolvedValue({
    ok,
    status,
    json: () => Promise.resolve(response),
    body: !ok
      ? null
      : new ReadableStream({
          start(controller) {
            controller.enqueue(new TextEncoder().encode("data: " + JSON.stringify({ id: "test", model: "test", choices: [{ delta: { content: "Hello" }, finish_reason: null }] }) + "\n\n"));
            controller.enqueue(new TextEncoder().encode("data: [DONE]\n\n"));
            controller.close();
          },
        }),
    headers: new Headers(),
  });
}

describe("OpenRouterClient", () => {
  beforeEach(() => {
    vi.stubEnv("OPENROUTER_API_KEY", "test-key");
  });

  describe("chatCompletion", () => {
    it("sends correct request and returns typed response", async () => {
      const mockResponse: ChatCompletionResponse = {
        id: "chat-1",
        model: "openai/gpt-4o-mini",
        choices: [
          {
            index: 0,
            message: { role: "assistant", content: "Hello!" },
            finish_reason: "stop",
          },
        ],
        usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 },
      };

      const fetch = mockFetch(mockResponse);
      const client = createOpenRouterClient({ fetch, apiKey: "test" });

      const result = await client.chatCompletion({
        model: "openai/gpt-4o-mini",
        messages: [{ role: "user", content: "Hi" }],
      });

      expect(result.id).toBe("chat-1");
      expect(result.choices[0].message.content).toBe("Hello!");
      expect(result.usage.total_tokens).toBe(15);
    });

    it("throws on non-ok response", async () => {
      const fetch = mockFetch({ error: { message: "Invalid API key" } }, false, 401);
      const client = createOpenRouterClient({ fetch, apiKey: "bad-key" });

      await expect(
        client.chatCompletion({
          model: "openai/gpt-4o-mini",
          messages: [{ role: "user", content: "Hi" }],
        }),
      ).rejects.toThrow();
    });

    it("uses OPENROUTER_API_KEY env var when no key provided", async () => {
      const mockResponse: ChatCompletionResponse = {
        id: "chat-2",
        model: "openai/gpt-4o-mini",
        choices: [{ index: 0, message: { role: "assistant", content: "OK" }, finish_reason: "stop" }],
        usage: { prompt_tokens: 1, completion_tokens: 1, total_tokens: 2 },
      };

      const fetch = mockFetch(mockResponse);
      const client = createOpenRouterClient({ fetch });

      const result = await client.chatCompletion({
        model: "openai/gpt-4o-mini",
        messages: [{ role: "user", content: "Hi" }],
      });

      expect(result.id).toBe("chat-2");
    });
  });

  describe("chatCompletionStream", () => {
    it("yields stream chunks from SSE data", async () => {
      const fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        body: new ReadableStream({
          start(controller) {
            const encoder = new TextEncoder();
            controller.enqueue(encoder.encode("data: " + JSON.stringify({ id: "s1", model: "m", choices: [{ index: 0, delta: { content: "A" }, finish_reason: null }] }) + "\n\n"));
            controller.enqueue(encoder.encode("data: " + JSON.stringify({ id: "s2", model: "m", choices: [{ index: 0, delta: { content: "B" }, finish_reason: null }] }) + "\n\n"));
            controller.enqueue(encoder.encode("data: [DONE]\n\n"));
            controller.close();
          },
        }),
        headers: new Headers(),
      });

      const client = createOpenRouterClient({ fetch, apiKey: "test" });
      const tokens: string[] = [];

      for await (const chunk of client.chatCompletionStream({
        model: "openai/gpt-4o-mini",
        messages: [{ role: "user", content: "Hi" }],
      })) {
        for (const c of chunk.choices) {
          if (c.delta.content) tokens.push(c.delta.content);
        }
      }

      expect(tokens).toEqual(["A", "B"]);
    });
  });

  describe("embed", () => {
    it("sends embed request and returns vectors", async () => {
      const mockResponse: EmbeddingResponse = {
        model: "openai/text-embedding-3-large",
        data: [{ index: 0, embedding: [0.1, 0.2, 0.3] }],
        usage: { prompt_tokens: 4, total_tokens: 4 },
      };

      const fetch = mockFetch(mockResponse);
      const client = createOpenRouterClient({ fetch, apiKey: "test" });

      const result = await client.embed({
        model: "openai/text-embedding-3-large",
        input: "test text",
      });

      expect(result.data[0].embedding).toHaveLength(3);
      expect(result.model).toBe("openai/text-embedding-3-large");
    });
  });

  describe("listModels", () => {
    it("returns list of models", async () => {
      const mockModels: ModelInfo[] = [
        {
          id: "openai/gpt-4o",
          name: "GPT-4o",
          context_length: 128000,
          capabilities: { chat: true, embeddings: false, vision: true, function_calling: true },
          pricing: { prompt: 2.5, completion: 10 },
        },
      ];

      const fetch = mockFetch({ data: mockModels });
      const client = createOpenRouterClient({ fetch, apiKey: "test" });

      const models = await client.listModels();

      expect(models).toHaveLength(1);
      expect(models[0].id).toBe("openai/gpt-4o");
    });
  });
});
