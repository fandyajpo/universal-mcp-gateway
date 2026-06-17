import { createRAGEngine } from "../engine";
import type { RAGEngineDependencies } from "../engine/types";
import { computePerQueryMetrics, computeAggregatedMetrics } from "./metrics";
import type {
  EvalDataset,
  EvalConfig,
  EvalResult,
  PerQueryMetrics,
  EvalSummary,
} from "./types";
import { DEFAULT_EVAL_CONFIG, EVAL_METRIC_KS } from "./types";

export class EvalRunner {
  private deps: RAGEngineDependencies;

  constructor(deps: RAGEngineDependencies) {
    this.deps = deps;
  }

  async run(
    dataset: EvalDataset,
    config: EvalConfig = DEFAULT_EVAL_CONFIG,
  ): Promise<EvalResult> {
    const engine = createRAGEngine(this.deps);
    const ks = [...EVAL_METRIC_KS];

    const startTime = performance.now();
    const perQuery: PerQueryMetrics[] = [];

    for (const query of dataset.queries) {
      try {
        const result = await engine.ragQuery(query.query, {
          workspaceId: "__eval__",
          strategy: config.strategy,
          rerank: config.rerank,
          topK: config.topK,
          topN: config.topN,
        });

        const retrievedChunkIds = result.allChunks.map((c) => c.chunkId);

        perQuery.push(
          computePerQueryMetrics(query, retrievedChunkIds, ks),
        );
      } catch (err) {
        perQuery.push({
          queryId: query.id,
          query: query.query,
          retrievedChunkIds: [],
          relevantChunkIds: query.relevantChunkIds,
          hitAtK: Object.fromEntries(ks.map((k) => [k, false])),
          reciprocalRank: 0,
          relevantRanks: [],
        });
      }
    }

    const totalDurationMs = Math.round(performance.now() - startTime);
    const aggregated = computeAggregatedMetrics(perQuery, ks);

    const summary: EvalSummary = {
      datasetName: dataset.name,
      config,
      aggregated,
      queryCount: dataset.queries.length,
      totalDurationMs,
      timestamp: new Date().toISOString(),
    };

    return { summary, perQuery };
  }
}
