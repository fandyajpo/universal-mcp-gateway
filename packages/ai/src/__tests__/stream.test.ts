import { describe, it, expect, vi } from "vitest";

import { createStream, formatStreamEvent, formatEventStream } from "../stream";

vi.mock("../providers/provider", () => ({
  withCostTracking: vi.fn(),
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

function createMockProvider() {
  let calls = 0;
  return {
    id: "openrouter",
    capabilities: ["chat", "streaming"],
    metadata: { baseUrl: "https://openrouter.ai/api/v1", models: [] },
    chatCompletion: vi.fn(),
    chatCompletionStream: vi.fn().mockImplementation(async function* () {
      calls++;
      yield {
        choices: [{ delta: { content: "Hello" }, index: 0 }],
      } as never;
      yield {
        choices: [{ delta: { content: " World" }, index: 0, finishReason: "stop" }],
        usage: { promptTokens: 10, completionTokens: 5, totalTokens: 15 },
      } as never;
    }),
    embed: vi.fn(),
    listModels: vi.fn(),
  };
}

describe("Stream Manager", () => {
  describe("createStream", () => {
    it("yields token events from stream chunks", async () => {
      const provider = createMockProvider();
      const handle = createStream(provider, {
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: "test" }],
      });

      const tokens: string[] = [];
      for await (const event of handle.events) {
        if (event.type === "token") {
          tokens.push(event.content);
        }
      }

      expect(tokens.length).toBeGreaterThanOrEqual(1);
      expect(tokens[0]).toBe("Hello");
    });

    it("calls onToken callback for each token", async () => {
      const onToken = vi.fn();

      const provider = createMockProvider();
      const handle = createStream(
        provider,
        {
          model: "gpt-4o-mini",
          messages: [{ role: "user", content: "test" }],
        },
        { onToken },
      );

      for await (const _ of handle.events) {
        // consume
      }

      expect(onToken).toHaveBeenCalled();
    });

    it("provides an abort controller", async () => {
      const provider = createMockProvider();
      const handle = createStream(
        provider,
        {
          model: "gpt-4o-mini",
          messages: [{ role: "user", content: "test" }],
        },
      );

      expect(handle.controller).toBeDefined();
      expect(typeof handle.controller.abort).toBe("function");

      const tokens: string[] = [];
      for await (const event of handle.events) {
        if (event.type === "token") {
          tokens.push(event.content);
        }
      }

      expect(tokens.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe("formatStreamEvent", () => {
    it("formats token event as SSE data", () => {
      const event = { type: "token" as const, content: "Hello" };
      const sse = formatStreamEvent(event);

      expect(sse).toContain("data: ");
      expect(sse).toContain("Hello");
      expect(sse).toMatch(/\n\n$/);
    });

    it("formats finish event with usage", () => {
      const event = {
        type: "finish" as const,
        finishReason: "stop" as const,
        usage: { promptTokens: 10, completionTokens: 5 },
      };
      const sse = formatStreamEvent(event);

      expect(sse).toContain("finish");
      expect(sse).toContain("promptTokens");
    });

    it("formats error event", () => {
      const event = { type: "error" as const, error: new Error("Test error") };
      const sse = formatStreamEvent(event);

      expect(sse).toMatch(/^data: /);
      expect(sse).toMatch(/\n\n$/);
      expect(sse).toContain("error");
    });
  });

  describe("formatEventStream", () => {
    it("converts async generator to ReadableStream", async () => {
      async function* testEvents() {
        yield { type: "token" as const, content: "A" };
        yield { type: "token" as const, content: "B" };
        yield { type: "finish" as const, finishReason: "stop" as const, usage: { promptTokens: 1, completionTokens: 2 } };
      }

      const stream = formatEventStream(testEvents());
      expect(stream).toBeInstanceOf(ReadableStream);

      const reader = stream.getReader();
      const chunks: Uint8Array[] = [];

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
      }

      const text = chunks.map((c) => new TextDecoder().decode(c)).join("");
      expect(text).toContain("A");
      expect(text).toContain("B");
      expect(text).toContain("finish");
    });
  });
});
