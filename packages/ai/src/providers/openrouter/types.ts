export interface OpenRouterMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: string;
  name?: string;
}

export interface ChatCompletionRequest {
  model: string;
  messages: OpenRouterMessage[];
  max_tokens?: number;
  temperature?: number;
  top_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
  stop?: string[];
  stream?: boolean;
}

export interface ChatCompletionChoice {
  index: number;
  message: OpenRouterMessage;
  finish_reason: string;
}

export interface ChatCompletionResponse {
  id: string;
  model: string;
  choices: ChatCompletionChoice[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface StreamDelta {
  content?: string;
  role?: string;
  tool_calls?: {
    index: number;
    id?: string;
    function?: { name?: string; arguments?: string };
  }[];
}

export interface StreamChoice {
  index: number;
  delta: StreamDelta;
  finish_reason: string | null;
}

export interface StreamChunk {
  id: string;
  model: string;
  choices: StreamChoice[];
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface EmbeddingRequest {
  model: string;
  input: string | string[];
}

export interface EmbeddingData {
  index: number;
  embedding: number[];
}

export interface EmbeddingResponse {
  model: string;
  data: EmbeddingData[];
  usage: {
    prompt_tokens: number;
    total_tokens: number;
  };
}

export interface ModelPricing {
  prompt: number;
  completion: number;
}

export interface ModelCapabilities {
  chat?: boolean;
  embeddings?: boolean;
  vision?: boolean;
  function_calling?: boolean;
}

export interface ModelInfo {
  id: string;
  name: string;
  pricing: ModelPricing;
  context_length: number;
  capabilities: ModelCapabilities;
}

export interface OpenRouterConfig {
  apiKey?: string;
  baseUrl?: string;
  timeout?: number;
  maxRetries?: number;
  httpReferer?: string;
  xTitle?: string;
  fetch?: typeof globalThis.fetch;
}
