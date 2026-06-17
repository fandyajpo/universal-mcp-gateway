import type { Provider } from "./providers/provider";
import type { ChatRequest, StreamChunk } from "./providers/types";
import { ToolCallAccumulator } from "./stream/accumulator";
import { BackpressureController } from "./stream/backpressure";
import type {
  StreamEvent,
  StreamHandle,
  StreamOptions,
  TokenUsage,
} from "./stream/types";
import { createLogger } from "@repo/logger";

const logger = createLogger("stream-manager");

const DEFAULT_STREAM_TIMEOUT = 60_000;

function detectToolCalls(
  chunk: StreamChunk,
  accumulator: ToolCallAccumulator,
): StreamEvent[] {
  const events: StreamEvent[] = [];

  for (const choice of chunk.choices) {
    const toolCalls = choice.delta.toolCalls;

    if (!toolCalls || toolCalls.length === 0) {
      continue;
    }

    for (const tc of toolCalls) {
      const toolCallId = tc.id ?? "";
      const name = tc.function?.name ?? "";
      const argsDelta = tc.function?.arguments ?? "";

      if (!accumulator.hasPending()) {
        events.push({
          type: "tool_call_start",
          toolCallId,
          name,
          arguments: argsDelta,
        });
      } else {
        events.push({
          type: "tool_call_delta",
          toolCallId,
          arguments: argsDelta,
        });
      }

      accumulator.addDelta(tc.index, toolCallId, name, argsDelta);
    }
  }

  return events;
}

async function* processProviderStream(
  providerStream: AsyncGenerator<StreamChunk>,
  options?: StreamOptions,
): AsyncGenerator<StreamEvent> {
  const accumulator = new ToolCallAccumulator();
  const backpressure = new BackpressureController();
  const timeout = options?.timeout ?? DEFAULT_STREAM_TIMEOUT;

  let lastChunkTime = Date.now();
  let finalUsage: TokenUsage | undefined;
  let finishReason = "";

  const signal = options?.signal;

  for (;;) {
    const elapsed = Date.now() - lastChunkTime;

    if (elapsed >= timeout) {
      logger.warn({ timeout }, "Stream timed out");
      yield { type: "error", error: new Error("Stream timed out") };
      return;
    }

    if (signal?.aborted) {
      break;
    }

    if (backpressure.paused) {
      await new Promise((resolve) => setTimeout(resolve, 10));
      continue;
    }

    const result = await providerStream.next();

    if (result.done) {
      break;
    }

    lastChunkTime = Date.now();
    backpressure.push();

    const chunk = result.value;

    for (const choice of chunk.choices) {
      const delta = choice.delta;

      if (delta.content) {
        yield { type: "token", content: delta.content };
      }

      const toolEvents = detectToolCalls(chunk, accumulator);
      for (const event of toolEvents) {
        yield event;
      }

      if (choice.finishReason) {
        finishReason = choice.finishReason;
      }
    }

    if (chunk.usage) {
      finalUsage = {
        promptTokens: chunk.usage.promptTokens,
        completionTokens: chunk.usage.completionTokens,
        totalTokens: chunk.usage.totalTokens,
      };
    }

    backpressure.pop();
  }

  if (signal?.aborted) {
    logger.info("Stream aborted by consumer");
    yield { type: "finish", finishReason: "aborted" };
    return;
  }

  if (finishReason === "tool_calls" && accumulator.hasPending()) {
    const completed = accumulator.getCompleted();
    if (completed) {
      for (const tc of completed) {
        yield {
          type: "tool_call_complete",
          toolCallId: tc.toolCallId,
          name: tc.name,
          arguments: tc.arguments,
        };
      }
    }
  }

  yield {
    type: "finish",
    finishReason,
    usage: finalUsage,
  };

  accumulator.reset();
  backpressure.reset();
}

export function createStream(
  provider: Provider,
  request: ChatRequest,
  options?: StreamOptions,
): StreamHandle {
  const abortController = new AbortController();

  const combinedSignal = options?.signal
    ? AbortSignal.any([options.signal, abortController.signal])
    : abortController.signal;

  const wrappedOptions: StreamOptions = {
    ...options,
    signal: combinedSignal,
  };

  const onToken = options?.onToken;
  const onToolCall = options?.onToolCall;
  const onFinish = options?.onFinish;

  async function* eventGenerator(): AsyncGenerator<StreamEvent> {
    const providerStream = provider.chatCompletionStream(
      { ...request, stream: true },
      combinedSignal,
    );

    const eventStream = processProviderStream(providerStream, wrappedOptions);

    try {
      for await (const event of eventStream) {
        if (onToken && event.type === "token") {
          onToken(event.content);
        }

        if (onToolCall && event.type === "tool_call_complete") {
          onToolCall(event);
        }

        if (onFinish && event.type === "finish") {
          onFinish(event.finishReason, event.usage);
        }

        yield event;
      }
    } finally {
      void providerStream.return(undefined);
    }
  }

  return {
    events: eventGenerator(),
    controller: {
      abort(): void {
        abortController.abort();
      },
    },
  };
}

export { formatStreamEvent, formatEventStream } from "./stream/sse";
export type { StreamEvent, StreamOptions, StreamHandle, TokenUsage, Citation } from "./stream/types";
