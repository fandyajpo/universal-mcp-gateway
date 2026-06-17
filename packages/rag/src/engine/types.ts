import type { RetrievalChunk } from "../context/types";

export interface EngineOptions {
  workspaceId: string;
  strategy?: "vector" | "hybrid";
  rerank?: boolean;
  topK?: number;
  topN?: number;
  filters?: Record<string, unknown>;
  modelMaxTokens?: number;
  conversationHistory?: { role: "user" | "assistant" | "system"; content: string }[];
  systemInstructions?: string;
  documentIds?: string[];
}

export interface PipelineContext {
  workspaceId: string;
  traceId: string;
  query: string;
  queryVector: number[];
  embeddingModel: string;
  strategy: "vector" | "hybrid";
  rerank: boolean;
  topK: number;
  topN: number;
  filters: Record<string, unknown>;
  documentIds: string[];
  modelMaxTokens: number;
  conversationHistory: { role: "user" | "assistant" | "system"; content: string }[];
  systemInstructions: string;
  retrievalResults: RetrievalChunk[];
}

export interface PipelineStep<I, O> {
  name: string;
  required: boolean;
  execute(input: I, context: PipelineContext): Promise<O>;
}

export type MiddlewareFn = (query: string) => string | Promise<string>;

export interface EmbeddingResult {
  vector: number[];
  model: string;
  dimensions: number;
  tokenCount: number;
}

export interface StepMetadata {
  name: string;
  durationMs: number;
  success: boolean;
  error?: string;
}

export interface PipelineMetadata {
  steps: StepMetadata[];
  totalDurationMs: number;
  strategyUsed: "vector" | "hybrid";
  modelUsed?: string;
}

export interface RAGResult {
  context: string;
  query: string;
  chunks: RetrievalChunk[];
  allChunks: RetrievalChunk[];
  tokenCount: number;
  pipelineMetadata: PipelineMetadata;
}

export interface RAGEngineDependencies {
  embedText: (text: string) => Promise<EmbeddingResult>;
  retrieve: (opts: {
    query: string;
    vector: number[];
    workspaceId: string;
    topK: number;
    strategy: "vector" | "hybrid";
    filters: Record<string, unknown>;
    documentIds: string[];
  }) => Promise<RetrievalChunk[]>;
  rerank: (opts: {
    query: string;
    results: RetrievalChunk[];
    topN: number;
  }) => Promise<RetrievalChunk[]>;
}
