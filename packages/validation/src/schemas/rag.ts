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

const conversationMessageSchema = z
  .object({
    role: z.enum(["user", "assistant", "system"]),
    content: z.string().min(1).max(100_000).trim(),
  })
  .strip();

export const ragQueryOptionsSchema = z
  .object({
    strategy: z.enum(["vector", "hybrid"]).optional(),
    rerank: z.boolean().optional(),
    topK: z.number().int().min(1).max(100).optional(),
    topN: z.number().int().min(1).max(50).optional(),
    filters: z.record(z.string(), z.unknown()).optional(),
    conversationHistory: z.array(conversationMessageSchema).max(100).optional(),
    systemInstructions: z.string().max(10_000).trim().optional(),
  })
  .strip();

export const ragQuerySchema = z
  .object({
    query: z.string().min(1).max(10_000).trim(),
    workspaceId: z.string().min(1).max(128),
    options: ragQueryOptionsSchema.optional(),
  })
  .strip();

export const documentIdParamsSchema = z
  .object({
    documentId: z.string().min(1).max(128),
  })
  .strip();

export type RAGResultSchema = z.infer<typeof ragResultSchema>;
export type RAGConfigSchema = z.infer<typeof ragConfigSchema>;
export type RAGQueryOptionsSchema = z.infer<typeof ragQueryOptionsSchema>;
export type RAGQuerySchema = z.infer<typeof ragQuerySchema>;
export type DocumentIdParamsSchema = z.infer<typeof documentIdParamsSchema>;
