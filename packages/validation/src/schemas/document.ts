import { z } from "zod";

export const documentMetadataSchema = z
  .object({
    author: z.string().max(256).trim().optional(),
    source: z.string().max(256).trim().optional(),
    tags: z.array(z.string().max(64).trim()).max(50).optional(),
    category: z.string().max(128).trim().optional(),
    description: z.string().max(2000).trim().optional(),
  })
  .strip();

export const documentSourceSchema = z
  .object({
    type: z.string().min(1).max(64).trim(),
    url: z.string().url().max(2048).optional(),
    originalName: z.string().max(512).trim().optional(),
  })
  .strip();

export const documentSchema = z
  .object({
    id: z.string().min(1).max(128),
    workspaceId: z.string().min(1).max(128),
    title: z
      .string()
      .min(1, "Document title is required")
      .max(512, "Title must be at most 512 characters")
      .trim()
      .refine((val) => !/<[^>]*>/i.test(val), "Title must not contain HTML tags"),
    content: z.string().max(100_000).optional(),
    metadata: documentMetadataSchema,
    source: documentSourceSchema,
    createdAt: z.coerce.date(),
    updatedAt: z.coerce.date(),
  })
  .strip();

export const documentChunkSchema = z
  .object({
    id: z.string().min(1).max(128),
    documentId: z.string().min(1).max(128),
    content: z.string().min(1).max(100_000).trim(),
    index: z.number().int().min(0),
    embedding: z.array(z.number()).max(4096).optional(),
    metadata: z.record(z.string(), z.unknown()).default({}),
  })
  .strip();

export type DocumentMetadataSchema = z.infer<typeof documentMetadataSchema>;
export type DocumentSourceSchema = z.infer<typeof documentSourceSchema>;
export type DocumentSchema = z.infer<typeof documentSchema>;
export type DocumentChunkSchema = z.infer<typeof documentChunkSchema>;
