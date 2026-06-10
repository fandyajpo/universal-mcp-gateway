import { z } from "zod";

export const embeddingModelSchema = z.string().min(1).max(256).trim();

export const embeddingSchema = z
  .object({
    vector: z.array(z.number()).min(1).max(4096),
    model: embeddingModelSchema,
    dimensions: z.number().int().min(1).max(4096),
  })
  .strip();

export const embeddingConfigSchema = z
  .object({
    model: embeddingModelSchema,
    dimensions: z.number().int().min(1).max(4096),
    batchSize: z.number().int().min(1).max(100).optional(),
  })
  .strip();

export type EmbeddingSchema = z.infer<typeof embeddingSchema>;
export type EmbeddingConfigSchema = z.infer<typeof embeddingConfigSchema>;
