// RAG Engine — exports added as modules are implemented
// See Phase 08 for implementation

export type { PdfUploadedEventPayload, PdfUploadedEvent } from "./pdf/types";
export type {
  PdfBoundingBox,
  PdfFontInfo,
  PdfExtractedLine,
  PdfExtractedBlock,
  PdfExtractedPage,
  PdfExtractionMetadata,
  PdfExtractionResult,
} from "./pdf/types";
export type {
  PdfExtractStartedEventPayload,
  PdfExtractStartedEvent,
  PdfExtractCompletedEventPayload,
  PdfExtractCompletedEvent,
  PdfExtractFailedEventPayload,
  PdfExtractFailedEvent,
} from "./pdf/events";

export { extractText } from "./pdf/extractor";
export type { ExtractTextOptions } from "./pdf/extractor";
export { runOcr, getPageSizes } from "./pdf/ocr";
export type { RunOcrOptions, OcrPageRender } from "./pdf/ocr";
export type { OcrWord, OcrLine, OcrBlock, OcrPage, OcrResult, OcrOptions } from "./pdf/ocr/types";
export { PageRenderError } from "./pdf/ocr/renderer";
export { chunkDocument } from "./pdf/chunker";
export type { ChunkResult } from "./pdf/chunker";
export type { Chunk, ChunkMetadata, ChunkStrategy, ChunkerOptions, ChunkDocumentOptions } from "./pdf/chunker/types";
export type {
  PdfChunkStartedEventPayload,
  PdfChunkStartedEvent,
  PdfChunkCompletedEventPayload,
  PdfChunkCompletedEvent,
  PdfChunkFailedEventPayload,
  PdfChunkFailedEvent,
} from "./pdf/events";
export { extractMetadata } from "./pdf/metadata";
export type { PdfMetadataResult, PdfInfoMetadata, PdfTocEntry, PdfPageDimension } from "./pdf/metadata/types";
export { extractTables } from "./pdf/tables";
export type { ExtractTablesOptions, ExtractTablesResult, PdfTable, PdfTableCell, PdfTableRow, PdfTableFormats } from "./pdf/tables/types";
export {
  createProgressTracker,
  calculateProgress,
  upsertStepMetric,
  allStepsCompleted,
  PIPELINE_STEPS,
  STEP_WEIGHTS,
  STEP_ORDER,
} from "./pdf/progress";
export type {
  PipelineStep,
  PdfStepStartedEvent,
  PdfStepCompletedEvent,
  PdfStepFailedEvent,
  PdfProcessingCompletedEvent,
  PdfProcessingFailedEvent,
  PdfProgressEvent,
} from "./pdf/progress";

export { buildContext } from "./context/builder";
export type {
  RetrievalChunk,
  ConversationMessage,
  BudgetAllocation,
  BuildContextOptions,
  TruncationDetails,
  ContextResult,
} from "./context/types";
export { countTokens, truncateToTokenLimit } from "./context/tokenizer";
export {
  formatChunk,
  formatContextSection,
  formatConversationSection,
  formatInstructionsSection,
} from "./context/formatter";
export type { ChunkFormatOptions } from "./context/formatter";

export { createRAGEngine } from "./engine";
export type {
  EngineOptions,
  MiddlewareFn,
  PipelineMetadata,
  RAGResult,
  RAGEngineDependencies,
} from "./engine/types";
export { queryNormalizer, noopMiddleware, composeMiddleware } from "./engine/middleware";

// Eval
export { EvalRunner } from "./eval/runner";
export {
  validateDataset,
  loadDataset,
  createDataset,
  computePerQueryMetrics,
  computeAggregatedMetrics,
  computeDCG,
  computeIDCG,
  formatMetricTable,
  formatSummary,
  formatEvalReport,
  formatJSON,
  saveResult,
  loadResult,
  EvaluationError,
  loadSampleDataset,
  DEFAULT_EVAL_CONFIG,
  EVAL_METRIC_KS,
} from "./eval";
export type {
  EvalQuery,
  EvalDataset,
  EvalConfig,
  PerQueryMetrics,
  AggregatedMetrics,
  EvalSummary,
  EvalResult,
} from "./eval/types";
