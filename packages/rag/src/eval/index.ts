export { EvalRunner } from "./runner";
export { validateDataset, loadDataset, createDataset } from "./dataset";
export {
  computePerQueryMetrics,
  computeAggregatedMetrics,
  computeDCG,
  computeIDCG,
} from "./metrics";
export {
  formatMetricTable,
  formatSummary,
  formatEvalReport,
  formatJSON,
  saveResult,
  loadResult,
} from "./report";
export { EvaluationError } from "./errors";
export { loadSampleDataset } from "./fixtures/sample";
export type {
  EvalQuery,
  EvalDataset,
  EvalConfig,
  PerQueryMetrics,
  AggregatedMetrics,
  EvalSummary,
  EvalResult,
} from "./types";
export {
  DEFAULT_EVAL_CONFIG,
  EVAL_METRIC_KS,
} from "./types";
