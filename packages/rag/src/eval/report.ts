import fs from "node:fs/promises";
import path from "node:path";

import type { EvalResult, EvalSummary, AggregatedMetrics } from "./types";

export function formatMetricTable(metrics: AggregatedMetrics): string {
  const ks = Object.keys(metrics.hitRate).map(Number).sort((a, b) => a - b);
  if (ks.length === 0) return "(no metrics)";

  const colWidth = Math.max(8, ...ks.map((k) => `@${k}`.length));

  const header = `| Metric    | ${ks.map((k) => `@${k}`.padEnd(colWidth)).join(" | ")} |`;
  const separator = `|-----------|${ks.map(() => "-".repeat(colWidth)).join("-|-")}|`;

  const rows = [
    formatRow("HitRate", ks, metrics.hitRate, colWidth),
    formatRow("MRR", ks, metrics.mrr, colWidth),
    formatRow("NDCG", ks, metrics.ndcg, colWidth),
    formatRow("Precision", ks, metrics.precision, colWidth),
    formatRow("Recall", ks, metrics.recall, colWidth),
  ];

  return [header, separator, ...rows].join("\n");
}

function formatRow(
  label: string,
  ks: number[],
  values: Record<number, number>,
  colWidth: number,
): string {
  const cells = ks.map((k) => {
    const v = values[k];
    return v !== undefined ? v.toFixed(4).padStart(colWidth) : "-".padStart(colWidth);
  });
  return `| ${label.padEnd(9)} | ${cells.join(" | ")} |`;
}

export function formatSummary(summary: EvalSummary): string {
  const lines: string[] = [
    `Dataset:     ${summary.datasetName}`,
    `Queries:     ${summary.queryCount}`,
    `Duration:    ${summary.totalDurationMs}ms`,
    `Strategy:    ${summary.config.strategy}`,
    `Rerank:      ${summary.config.rerank}`,
    `TopK:        ${summary.config.topK}`,
    `TopN:        ${summary.config.topN}`,
    `Timestamp:   ${summary.timestamp}`,
  ];

  if (summary.aggregated.avgFirstRelevantRank !== null) {
    lines.push(
      `Avg First Rel Rank: ${summary.aggregated.avgFirstRelevantRank.toFixed(2)}`,
    );
  }

  return lines.join("\n");
}

export function formatJSON(result: EvalResult): string {
  return JSON.stringify(result, null, 2);
}

export function formatEvalReport(result: EvalResult): string {
  const parts: string[] = [
    "=".repeat(60),
    "RAG EVALUATION REPORT",
    "=".repeat(60),
    "",
    formatSummary(result.summary),
    "",
    formatMetricTable(result.summary.aggregated),
    "",
    "-".repeat(60),
    "Per-Query Results",
    "-".repeat(60),
  ];

  for (const pq of result.perQuery) {
    const hitStr = Object.entries(pq.hitAtK)
      .filter(([, v]) => v)
      .map(([k]) => `@${k}`)
      .join(", ");
    parts.push(
      `\n[${pq.queryId}] ${pq.query}`,
      `  Hits:         ${hitStr || "none"}`,
      `  RR:           ${pq.reciprocalRank.toFixed(4)}`,
      `  Retrieved:     ${pq.retrievedChunkIds.length} chunks`,
      `  Relevant:      ${pq.relevantChunkIds.length} chunks in dataset`,
      `  Relevant Ranks: [${pq.relevantRanks.join(", ")}]`,
    );
  }

  return parts.join("\n");
}

export async function saveResult(
  result: EvalResult,
  filePath: string,
): Promise<void> {
  const dir = path.dirname(filePath);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(filePath, formatJSON(result), "utf-8");
}

export async function loadResult(filePath: string): Promise<EvalResult> {
  const raw = await fs.readFile(filePath, "utf-8");
  return JSON.parse(raw) as EvalResult;
}
