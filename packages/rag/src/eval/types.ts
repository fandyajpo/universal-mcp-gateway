export interface EvalQuery {
  id: string;
  query: string;
  relevantChunkIds: string[];
  metadata?: Record<string, unknown>;
}

export interface EvalDataset {
  name: string;
  description?: string;
  queries: EvalQuery[];
  createdAt?: Date;
  version?: string;
}

export interface EvalConfig {
  strategy: "vector" | "hybrid";
  rerank: boolean;
  topK: number;
  topN: number;
}

export interface PerQueryMetrics {
  queryId: string;
  query: string;
  retrievedChunkIds: string[];
  relevantChunkIds: string[];
  hitAtK: Record<number, boolean>;
  reciprocalRank: number;
  relevantRanks: number[];
}

export interface AggregatedMetrics {
  hitRate: Record<number, number>;
  mrr: Record<number, number>;
  ndcg: Record<number, number>;
  precision: Record<number, number>;
  recall: Record<number, number>;
  avgFirstRelevantRank: number | null;
  totalQueries: number;
}

export interface EvalSummary {
  datasetName: string;
  config: EvalConfig;
  aggregated: AggregatedMetrics;
  queryCount: number;
  totalDurationMs: number;
  timestamp: string;
}

export interface EvalResult {
  summary: EvalSummary;
  perQuery: PerQueryMetrics[];
}

export const DEFAULT_EVAL_CONFIG: EvalConfig = {
  strategy: "hybrid",
  rerank: true,
  topK: 20,
  topN: 5,
};

export const EVAL_METRIC_KS = [1, 3, 5, 10, 20] as const;
