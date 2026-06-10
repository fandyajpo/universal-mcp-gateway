import { z } from "zod";

import { documentChunkSchema } from "./document";

export const retrievalStrategySchema = z.enum([
  "semantic",
  "keyword",
  "hybrid",
  "rerank",
]);

export const chunkStrategySchema = z.enum([
  "fixed",
  "semantic",
  "recursive",
  "hybrid",
]);

export const ragResultSchema = z
  .object({
    query: z.string().min(1).max(10_000).trim(),
    chunks: z.array(documentChunkSchema).max(100),
    scores: z.array(z.number().min(0).max(1)).max(100).optional(),
    metadata: z.record(z.string(), z.unknown()).optional(),
  })
  .strip();

export const ragConfigSchema = z
  .object({
    strategy: retrievalStrategySchema,
    chunkStrategy: chunkStrategySchema,
    topK: z.number().int().min(1).max(100).default(10),
    minScore: z.number().min(0).max(1).optional(),
  })
  .strip();

export type RAGResultSchema = z.infer<typeof ragResultSchema>;
export type RAGConfigSchema = z.infer<typeof ragConfigSchema>;
