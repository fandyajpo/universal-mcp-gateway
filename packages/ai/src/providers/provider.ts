import type { AiCostRecordInput } from "../cost/types";
import type {
  ChatRequest,
  ChatResponse,
  StreamChunk,
  EmbedRequest,
  EmbedResponse,
  Model,
  ProviderCapability,
  ProviderMetadata,
} from "./types";
import { createLogger } from "@repo/logger";

const logger = createLogger("provider");

export interface Provider {
  readonly id: string;
  readonly capabilities: ProviderCapability[];
  readonly metadata: ProviderMetadata;

  chatCompletion(request: ChatRequest): Promise<ChatResponse>;

  chatCompletionStream(request: ChatRequest, signal?: AbortSignal): AsyncGenerator<StreamChunk>;

  embed(request: EmbedRequest): Promise<EmbedResponse>;

  listModels(): Promise<Model[]>;
}

export type CostRecordInput = Omit<AiCostRecordInput, "cost" | "currency">;

async function* recordStreamCost(
  stream: AsyncGenerator<StreamChunk>,
  recordCost: (input: CostRecordInput) => void,
  request: ChatRequest,
  providerId: string,
): AsyncGenerator<StreamChunk, void, unknown> {
  const chunks: StreamChunk[] = [];

  try {
    for await (const chunk of stream) {
      chunks.push(chunk);
      yield chunk;
    }
  } finally {
    const finalChunk = chunks.length > 0 ? chunks[chunks.length - 1] : undefined;

    if (finalChunk?.usage) {
      recordCost({
        workspaceId: "",
        userId: "",
        requestId: finalChunk.id,
        model: request.model,
        provider: providerId,
        taskType: "chat",
        promptTokens: finalChunk.usage.promptTokens,
        completionTokens: finalChunk.usage.completionTokens,
        totalTokens: finalChunk.usage.totalTokens,
        metadata: { streamed: true },
      });
    } else if (chunks.length > 0) {
      logger.warn({ model: request.model }, "Stream completed without usage data");
    }
  }
}

export function withCostTracking(
  provider: Provider,
  recordCost: (input: CostRecordInput) => void,
): Provider {
  return {
    ...provider,

    async chatCompletion(request: ChatRequest): Promise<ChatResponse> {
      const response = await provider.chatCompletion(request);

      const usage = response.usage ?? { promptTokens: 0, completionTokens: 0, totalTokens: 0 };

      recordCost({
        workspaceId: "",
        userId: "",
        requestId: response.id,
        model: request.model,
        provider: provider.id,
        taskType: "chat",
        promptTokens: usage.promptTokens,
        completionTokens: usage.completionTokens,
        totalTokens: usage.totalTokens,
        metadata: { streamed: false },
      });

      return response;
    },

    chatCompletionStream(
      request: ChatRequest,
      signal?: AbortSignal,
    ): AsyncGenerator<StreamChunk> {
      const stream = provider.chatCompletionStream(request, signal);
      return recordStreamCost(stream, recordCost, request, provider.id);
    },

    async embed(request: EmbedRequest): Promise<EmbedResponse> {
      const response = await provider.embed(request);

      recordCost({
        workspaceId: "",
        userId: "",
        requestId: "",
        model: request.model,
        provider: provider.id,
        taskType: "embedding",
        promptTokens: response.usage.promptTokens,
        completionTokens: 0,
        totalTokens: response.usage.promptTokens,
        metadata: { streamed: false },
      });

      return response;
    },
  };
}
