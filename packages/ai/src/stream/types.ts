export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export interface Citation {
  title: string;
  url?: string;
  text?: string;
}

export interface StreamHandle {
  events: AsyncGenerator<StreamEvent>;
  controller: { abort: () => void };
}

export interface StreamOptions {
  onToken?: (token: string) => void;
  onToolCall?: (toolCall: {
    toolCallId: string;
    name: string;
    arguments: Record<string, unknown>;
  }) => void;
  onFinish?: (finishReason: string, usage?: TokenUsage) => void;
  signal?: AbortSignal;
  timeout?: number;
}

export type StreamEvent =
  | { type: "token"; content: string }
  | { type: "tool_call_start"; toolCallId: string; name: string; arguments: string }
  | { type: "tool_call_delta"; toolCallId: string; arguments: string }
  | { type: "tool_call_complete"; toolCallId: string; name: string; arguments: Record<string, unknown> }
  | { type: "citations"; sources: Citation[] }
  | { type: "finish"; finishReason: string; usage?: TokenUsage }
  | { type: "error"; error: Error };
