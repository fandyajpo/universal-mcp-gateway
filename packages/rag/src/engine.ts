import { buildContext } from "./context/builder";
import type { ContextResult, RetrievalChunk } from "./context/types";
import { composeMiddleware, queryNormalizer } from "./engine/middleware";
import { executeSteps } from "./engine/pipeline";
import { createTracer } from "./engine/tracer";
import type { Tracer } from "./engine/tracer";
import type {
  EmbeddingResult,
  EngineOptions,
  MiddlewareFn,
  PipelineContext,
  PipelineStep,
  RAGEngineDependencies,
  RAGResult,
  StepMetadata,
} from "./engine/types";

function buildPipelineContext(query: string, options: EngineOptions): PipelineContext {
  return {
    workspaceId: options.workspaceId,
    traceId: `rag-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    query,
    queryVector: [],
    embeddingModel: "",
    strategy: options.strategy ?? "hybrid",
    rerank: options.rerank ?? true,
    topK: options.topK ?? 20,
    topN: options.topN ?? 5,
    filters: options.filters ?? {},
    documentIds: options.documentIds ?? [],
    modelMaxTokens: options.modelMaxTokens ?? 128_000,
    conversationHistory: options.conversationHistory ?? [],
    systemInstructions: options.systemInstructions ?? "",
    retrievalResults: [],
  };
}

function createEmbeddingStep(
  embedText: RAGEngineDependencies["embedText"],
): PipelineStep<string, EmbeddingResult> {
  return {
    name: "embedding",
    required: true,
    async execute(query, context): Promise<EmbeddingResult> {
      const result = await embedText(query);
      context.queryVector = result.vector;
      context.embeddingModel = result.model;
      return result;
    },
  };
}

function createRetrievalStep(
  retrieve: RAGEngineDependencies["retrieve"],
): PipelineStep<EmbeddingResult, RetrievalChunk[]> {
  return {
    name: "retrieval",
    required: true,
    async execute(input, context): Promise<RetrievalChunk[]> {
      const results = await retrieve({
        query: context.query,
        vector: input.vector,
        workspaceId: context.workspaceId,
        topK: context.topK,
        strategy: context.strategy,
        filters: context.filters,
        documentIds: context.documentIds,
      });
      context.retrievalResults = results;
      return results;
    },
  };
}

function createRerankerStep(
  rerank: RAGEngineDependencies["rerank"],
): PipelineStep<RetrievalChunk[], RetrievalChunk[]> {
  return {
    name: "reranker",
    required: false,
    async execute(input, context): Promise<RetrievalChunk[]> {
      if (!context.rerank) return input;

      return rerank({
        query: context.query,
        results: input,
        topN: context.topN,
      });
    },
  };
}

function createContextBuilderStep(): PipelineStep<RetrievalChunk[], ContextResult> {
  return {
    name: "context_builder",
    required: true,
    execute(input, context): Promise<ContextResult> {
      return Promise.resolve(buildContext(context.query, input, {
        modelMaxTokens: context.modelMaxTokens,
        conversationHistory: context.conversationHistory,
        systemInstructions: context.systemInstructions,
        maxChunks: context.topN,
      }));
    },
  };
}

export function createRAGEngine(
  deps: RAGEngineDependencies,
  config?: { middleware?: MiddlewareFn[] },
): { ragQuery: (query: string, options: EngineOptions) => Promise<RAGResult> } {
  const middleware = config?.middleware?.length
    ? composeMiddleware(...config.middleware)
    : queryNormalizer;

  return {
    async ragQuery(query: string, options: EngineOptions): Promise<RAGResult> {
      const tracer: Tracer = createTracer(options.strategy ?? "hybrid");
      const context = buildPipelineContext(query, options);

      const processedQuery = await middleware(query);

      const embeddingStep = createEmbeddingStep(deps.embedText);
      const retrievalStep = createRetrievalStep(deps.retrieve);
      const rerankerStep = createRerankerStep(deps.rerank);
      const contextBuilderStep = createContextBuilderStep();

      const steps: PipelineStep<unknown, unknown>[] = [
        embeddingStep,
        retrievalStep,
      ];

      if (context.rerank) {
        steps.push(rerankerStep);
      }

      steps.push(contextBuilderStep);

      const result = await executeSteps(steps, processedQuery, context, tracer);

      if (!isContextResult(result)) {
        throw new Error("Pipeline did not produce a valid context result");
      }

      const pipelineMetadata = tracer.getMetadata();
      const modelStep = pipelineMetadata.steps.find((s: StepMetadata) => s.name === "embedding");
      pipelineMetadata.modelUsed = modelStep?.success ? context.embeddingModel : undefined;

      const allChunks = context.retrievalResults;

      return {
        context: result.context,
        query,
        chunks: allChunks.slice(0, context.topN),
        allChunks,
        tokenCount: result.tokenCount,
        pipelineMetadata,
      };
    },
  };
}

function isContextResult(value: unknown): value is ContextResult {
  return (
    typeof value === "object" &&
    value !== null &&
    "context" in value &&
    "tokenCount" in value &&
    "chunksUsed" in value &&
    "truncated" in value
  );
}
