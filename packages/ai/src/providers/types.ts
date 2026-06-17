export type ProviderType = "openrouter";

export interface ProviderConfig {
  type: ProviderType;
  apiKey?: string;
  baseUrl?: string;
  timeout?: number;
  maxRetries?: number;
  httpReferer?: string;
  xTitle?: string;
  fetch?: typeof globalThis.fetch;
}

export type ProviderCapability =
  | "chat"
  | "streaming"
  | "embedding"
  | "function_calling"
  | "vision"
  | "json_mode";

export interface ProviderMetadata {
  id: string;
  name: string;
  capabilities: ProviderCapability[];
}

// ── Chat types ──────────────────────────────────────

export interface ChatMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: string;
  name?: string;
}

export interface ChatRequest {
  model: string;
  messages: ChatMessage[];
  maxTokens?: number;
  temperature?: number;
  topP?: number;
  stop?: string[];
  stream?: boolean;
}

export interface ChatChoice {
  index: number;
  message: ChatMessage;
  finishReason: string;
}

export interface ChatResponse {
  id: string;
  model: string;
  choices: ChatChoice[];
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

// ── Streaming types ─────────────────────────────────

export interface StreamDeltaToolCall {
  index: number;
  id?: string;
  function?: { name?: string; arguments?: string };
}

export interface StreamChoice {
  index: number;
  delta: {
    content?: string;
    role?: string;
    toolCalls?: StreamDeltaToolCall[];
  };
  finishReason: string | null;
}

export interface StreamChunk {
  id: string;
  model: string;
  choices: StreamChoice[];
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

// ── Embedding types ─────────────────────────────────

export interface EmbedRequest {
  model: string;
  input: string | string[];
}

export interface EmbeddingData {
  index: number;
  embedding: number[];
}

export interface EmbedResponse {
  model: string;
  data: EmbeddingData[];
  usage: {
    promptTokens: number;
    totalTokens: number;
  };
}

// ── Model types ─────────────────────────────────────

export interface Model {
  id: string;
  name: string;
  provider: string;
  contextLength: number;
  capabilities: ProviderCapability[];
  pricing?: {
    prompt: number;
    completion: number;
  };
}
