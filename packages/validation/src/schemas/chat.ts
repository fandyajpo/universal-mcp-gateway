import { z } from "zod";

export const chatRoleSchema = z.enum(["user", "assistant", "system"]);

export const chatMessageSchema = z
  .object({
    id: z.string().min(1).max(128),
    threadId: z.string().min(1).max(128),
    role: chatRoleSchema,
    content: z.string().min(1).max(100_000).trim(),
    metadata: z.record(z.string(), z.unknown()).optional(),
    createdAt: z.coerce.date(),
  })
  .strip();

export const chatConfigSchema = z
  .object({
    model: z.string().max(256).trim().optional(),
    temperature: z.number().min(0).max(2).optional(),
    maxTokens: z.number().int().min(1).max(1_000_000).optional(),
    systemPrompt: z.string().max(10_000).trim().optional(),
  })
  .strip();

export const chatThreadSchema = z
  .object({
    id: z.string().min(1).max(128),
    workspaceId: z.string().min(1).max(128),
    title: z
      .string()
      .max(256)
      .trim()
      .refine((val) => !/<[^>]*>/i.test(val), "Title must not contain HTML tags")
      .optional(),
    messages: z.array(chatMessageSchema).max(1000).optional(),
    config: chatConfigSchema.optional(),
    createdAt: z.coerce.date(),
    updatedAt: z.coerce.date(),
  })
  .strip();

export type ChatMessageSchema = z.infer<typeof chatMessageSchema>;
export type ChatConfigSchema = z.infer<typeof chatConfigSchema>;
export type ChatThreadSchema = z.infer<typeof chatThreadSchema>;
