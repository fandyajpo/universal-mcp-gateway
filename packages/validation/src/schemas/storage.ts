import { z } from "zod";

export const fileTypeResultSchema = z
  .object({
    valid: z.boolean(),
    detectedType: z.string(),
  })
  .strip();

export const fileSizeSchema = z
  .object({
    bytes: z.number().int().positive(),
    maxBytes: z.number().int().positive(),
    valid: z.boolean(),
  })
  .strip();

export const uploadOptionsSchema = z
  .object({
    concurrency: z.number().int().min(1).max(10).default(3),
    entity: z.string().min(1).max(64).default("documents"),
    maxFileSize: z.number().int().positive().optional(),
    allowedTypes: z.array(z.string()).optional(),
  })
  .strip();

export type FileTypeResultSchema = z.infer<typeof fileTypeResultSchema>;
export type FileSizeSchema = z.infer<typeof fileSizeSchema>;
export type UploadOptionsSchema = z.infer<typeof uploadOptionsSchema>;
