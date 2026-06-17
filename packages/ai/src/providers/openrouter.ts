import { mapProviderError, CapabilityError } from "./errors";
import { classifyError } from "./openrouter/errors";
import { withRetry } from "./openrouter/retry";
import type {
  ChatCompletionRequest,
  ChatCompletionResponse,
  EmbeddingRequest,
  EmbeddingResponse,
  ModelInfo,
  OpenRouterConfig,
  StreamChunk as ORStreamChunk,
} from "./openrouter/types";
import type { Provider } from "./provider";
import type {
  ChatRequest,
  ChatResponse,
  EmbedRequest,
  EmbedResponse,
  Model,
  ProviderCapability,
  StreamChunk,
} from "./types";
import { createLogger } from "@repo/logger";

const logger = createLogger("openrouter/client");

async function parseJsonResponse(
  response: Response,
): Promise<Record<string, unknown>> {
  try {
    const data = (await response.json()) as Record<string, unknown>;
    return data;
  } catch {
    return {};
  }
}

const DEFAULT_BASE_URL = "https://openrouter.ai/api/v1";
const DEFAULT_CHAT_TIMEOUT = 60_000;
const DEFAULT_EMBED_TIMEOUT = 30_000;
const DEFAULT_MAX_RETRIES = 3;

function getApiKey(): string {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY environment variable is not set");
  }
  return apiKey;
}

function resolveTotalTokens(raw: unknown): number {
  if (raw && typeof raw === "object" && "usage" in raw) {
    const usage = (raw as Record<string, unknown>).usage;
    if (usage && typeof usage === "object" && "total_tokens" in usage) {
      return (usage as Record<string, number>).total_tokens ?? 0;
    }
  }
  return 0;
}

function toORRequest(req: ChatRequest): ChatCompletionRequest {
  return {
    model: req.model,
    messages: req.messages,
    max_tokens: req.maxTokens,
    temperature: req.temperature,
    top_p: req.topP,
    stop: req.stop,
    stream: req.stream,
  };
}

function fromORResponse(res: ChatCompletionResponse): ChatResponse {
  return {
    id: res.id,
    model: res.model,
    choices: res.choices.map((c) => ({
      index: c.index,
      message: c.message,
      finishReason: c.finish_reason,
    })),
    usage: {
      promptTokens: res.usage.prompt_tokens,
      completionTokens: res.usage.completion_tokens,
      totalTokens: res.usage.total_tokens,
    },
  };
}

function fromORStreamChunk(chunk: ORStreamChunk): StreamChunk {
  return {
    id: chunk.id,
    model: chunk.model,
    choices: chunk.choices.map((c) => ({
      index: c.index,
      delta: {
        content: c.delta.content,
        role: c.delta.role,
        toolCalls: c.delta.tool_calls?.map((tc) => ({
          index: tc.index,
          id: tc.id,
          function: tc.function
            ? { name: tc.function.name, arguments: tc.function.arguments }
            : undefined,
        })),
      },
      finishReason: c.finish_reason,
    })),
    usage: chunk.usage
      ? {
          promptTokens: chunk.usage.prompt_tokens,
          completionTokens: chunk.usage.completion_tokens,
          totalTokens: chunk.usage.total_tokens,
        }
      : undefined,
  };
}

function fromOREmbedResponse(res: EmbeddingResponse): EmbedResponse {
  return {
    model: res.model,
    data: res.data.map((d) => ({
      index: d.index,
      embedding: d.embedding,
    })),
    usage: {
      promptTokens: res.usage.prompt_tokens,
      totalTokens: res.usage.total_tokens,
    },
  };
}

function fromORModelInfo(models: ModelInfo[]): Model[] {
  const orCapToProvider: Record<string, ProviderCapability> = {
    chat: "chat",
    embeddings: "embedding",
    vision: "vision",
    function_calling: "function_calling",
  };

  return models.map((m) => ({
    id: m.id,
    name: m.name,
    provider: "openrouter",
    contextLength: m.context_length,
    capabilities: (Object.entries(m.capabilities) as [string, boolean][])
      .filter(([, v]) => v)
      .map(([k]) => orCapToProvider[k])
      .filter((c): c is ProviderCapability => c !== undefined),
    pricing: {
      prompt: m.pricing.prompt,
      completion: m.pricing.completion,
    },
  }));
}

export interface OpenRouterClient {
  chatCompletion(
    request: ChatCompletionRequest,
  ): Promise<ChatCompletionResponse>;
  chatCompletionStream(
    request: ChatCompletionRequest,
    signal?: AbortSignal,
  ): AsyncGenerator<ORStreamChunk>;
  embed(request: EmbeddingRequest): Promise<EmbeddingResponse>;
  listModels(): Promise<ModelInfo[]>;
}

export function createOpenRouterClient(
  config?: OpenRouterConfig,
): OpenRouterClient {
  const apiKey = config?.apiKey ?? getApiKey();
  const baseUrl = config?.baseUrl ?? DEFAULT_BASE_URL;
  const chatTimeout = config?.timeout ?? DEFAULT_CHAT_TIMEOUT;
  const embedTimeout = config?.timeout ?? DEFAULT_EMBED_TIMEOUT;
  const maxRetries = config?.maxRetries ?? DEFAULT_MAX_RETRIES;
  const fetchFn = config?.fetch ?? globalThis.fetch;

  const baseHeaders: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${apiKey}`,
  };

  if (config?.httpReferer) {
    baseHeaders["HTTP-Referer"] = config.httpReferer;
  }
  if (config?.xTitle) {
    baseHeaders["X-Title"] = config.xTitle;
  }

  async function requestJson<T>(
    path: string,
    options: {
      method?: string;
      body?: unknown;
      timeout?: number;
      retryOverride?: number;
    } = {},
  ): Promise<T> {
    const method = options.method ?? "POST";
    const timeout = options.timeout ?? chatTimeout;

    const result = await withRetry<T>(
      async (_signal) => {
        const response = await fetchFn(`${baseUrl}${path}`, {
          method,
          headers: baseHeaders,
          body: options.body ? JSON.stringify(options.body) : undefined,
        });

        if (!response.ok) {
          const errorBody = await parseJsonResponse(response);
          throw classifyError(response.status, errorBody);
        }

        const raw: unknown = await response.json();
        const data = raw as T;

        logger.info(
          {
            method,
            path,
            status: 200,
            model:
              typeof options.body === "object" && options.body !== null
                ? (options.body as Record<string, unknown>).model
                : undefined,
            tokenCount: resolveTotalTokens(raw),
          },
          "OpenRouter API call",
        );

        return data;
      },
      { maxRetries: options.retryOverride ?? maxRetries, timeout },
    );

    return result;
  }

  return {
    async chatCompletion(
      requestBody: ChatCompletionRequest,
    ): Promise<ChatCompletionResponse> {
      return requestJson<ChatCompletionResponse>("/chat/completions", {
        body: { ...requestBody, stream: false },
        timeout: chatTimeout,
      });
    },

    async *chatCompletionStream(
      requestBody: ChatCompletionRequest,
      signal?: AbortSignal,
    ): AsyncGenerator<ORStreamChunk> {
      const response = await fetchFn(`${baseUrl}/chat/completions`, {
        method: "POST",
        headers: baseHeaders,
        body: JSON.stringify({ ...requestBody, stream: true }),
        signal,
      });

      if (!response.ok) {
        const errorBody = await parseJsonResponse(response);
        throw classifyError(response.status, errorBody);
      }

      if (!response.body) {
        throw new Error("Response body is not readable");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      for (;;) {
        const { done, value } = await reader.read();
        if (done) {
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) {
            continue;
          }

          const data = line.slice(6).trim();

          if (data === "[DONE]") {
            return;
          }

          try {
            const chunk = JSON.parse(data) as ORStreamChunk;
            yield chunk;
          } catch {
            logger.warn({ data }, "Failed to parse SSE chunk");
          }
        }
      }
    },

    async embed(
      requestBody: EmbeddingRequest,
    ): Promise<EmbeddingResponse> {
      return requestJson<EmbeddingResponse>("/embeddings", {
        body: requestBody,
        timeout: embedTimeout,
      });
    },

    async listModels(): Promise<ModelInfo[]> {
      const data = await requestJson<{ data: ModelInfo[] }>("/models", {
        method: "GET",
        timeout: 30000,
      });
      return data.data;
    },
  };
}

const OPENROUTER_CAPABILITIES: ProviderCapability[] = [
  "chat",
  "streaming",
  "embedding",
  "function_calling",
  "json_mode",
];

function requireCapability(
  capability: ProviderCapability,
): void {
  if (!OPENROUTER_CAPABILITIES.includes(capability)) {
    throw new CapabilityError("openrouter", capability);
  }
}

export function createOpenRouterProvider(
  config?: OpenRouterConfig,
): Provider {
  const client = createOpenRouterClient(config);

  return {
    id: "openrouter",
    capabilities: OPENROUTER_CAPABILITIES,
    metadata: {
      id: "openrouter",
      name: "OpenRouter",
      capabilities: OPENROUTER_CAPABILITIES,
    },

    async chatCompletion(request: ChatRequest): Promise<ChatResponse> {
      requireCapability("chat");

      try {
        const orResponse = await client.chatCompletion(toORRequest(request));
        return fromORResponse(orResponse);
      } catch (error) {
        throw mapProviderError(error);
      }
    },

    async *chatCompletionStream(
      request: ChatRequest,
      signal?: AbortSignal,
    ): AsyncGenerator<StreamChunk> {
      requireCapability("streaming");

      try {
        const orStream = client.chatCompletionStream({
          ...toORRequest(request),
          stream: true,
        }, signal);

        for await (const chunk of orStream) {
          yield fromORStreamChunk(chunk);
        }
      } catch (error) {
        throw mapProviderError(error);
      }
    },

    async embed(request: EmbedRequest): Promise<EmbedResponse> {
      requireCapability("embedding");

      try {
        const orResponse = await client.embed({
          model: request.model,
          input: request.input,
        });
        return fromOREmbedResponse(orResponse);
      } catch (error) {
        throw mapProviderError(error);
      }
    },

    async listModels(): Promise<Model[]> {
      try {
        const models = await client.listModels();
        return fromORModelInfo(models);
      } catch (error) {
        throw mapProviderError(error);
      }
    },
  };
}

export type { OpenRouterConfig } from "./openrouter/types";
export type {
  ChatCompletionRequest,
  ChatCompletionResponse,
  EmbeddingRequest,
  EmbeddingResponse,
  ModelInfo,
  OpenRouterMessage,
  StreamChunk as ORStreamChunk,
} from "./openrouter/types";
export { OpenRouterError } from "./openrouter/errors";
