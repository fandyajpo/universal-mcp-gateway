import { EvaluationError } from "./errors";
import type { EvalDataset, EvalQuery } from "./types";

export function validateDataset(raw: unknown): EvalDataset {
  if (!raw || typeof raw !== "object") {
    throw new EvaluationError("Dataset must be a non-null object", "INVALID_DATASET");
  }

  const d = raw as Record<string, unknown>;

  if (!d.name || typeof d.name !== "string") {
    throw new EvaluationError("Dataset must have a string `name` field", "MISSING_NAME");
  }

  if (!Array.isArray(d.queries)) {
    throw new EvaluationError("Dataset must have an array `queries` field", "MISSING_QUERIES");
  }

  const seenIds = new Set<string>();

  for (let i = 0; i < d.queries.length; i++) {
    const q = d.queries[i] as Record<string, unknown>;

    if (!q.id || typeof q.id !== "string") {
      throw new EvaluationError(`Query at index ${i} is missing a string \`id\``, "INVALID_QUERY");
    }

    if (seenIds.has(q.id)) {
      throw new EvaluationError(`Duplicate query id: ${q.id}`, "DUPLICATE_QUERY_ID");
    }
    seenIds.add(q.id);

    if (!q.query || typeof q.query !== "string") {
      throw new EvaluationError(`Query "${q.id}" is missing a string \`query\``, "INVALID_QUERY");
    }

    if (!Array.isArray(q.relevantChunkIds)) {
      throw new EvaluationError(`Query "${q.id}" is missing an array \`relevantChunkIds\``, "INVALID_QUERY");
    }

    for (const chunkId of q.relevantChunkIds) {
      if (typeof chunkId !== "string") {
        throw new EvaluationError(`Query "${q.id}" has non-string chunk id in relevantChunkIds`, "INVALID_QUERY");
      }
    }
  }

  return raw as EvalDataset;
}

export function loadDataset(data: Record<string, unknown>): EvalDataset {
  return validateDataset(data);
}

export function createDataset(
  name: string,
  queries: EvalQuery[],
  description?: string,
): EvalDataset {
  return validateDataset({
    name,
    description,
    queries,
    createdAt: new Date(),
    version: "1.0.0",
  });
}
