import { z } from "zod";

export const aiChatMessageSchema = z.object({
  role: z.enum(["system", "user", "assistant", "tool"]),
  content: z.string().min(1).max(128_000),
  name: z.string().max(256).optional(),
}).strip();

export const aiChatRequestSchema = z.object({
  model: z.string().max(256).trim().optional(),
  messages: z.array(aiChatMessageSchema).min(1).max(100),
  temperature: z.number().min(0).max(2).optional(),
  max_tokens: z.number().int().min(1).max(128_000).optional(),
  stream: z.literal(false).optional().default(false),
}).strip();

export const aiEmbedRequestSchema = z.object({
  model: z.string().max(256).trim().optional(),
  input: z.union([z.string().min(1), z.array(z.string()).min(1).max(100)]),
}).strip();

export const aiErrorResponseSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.unknown().optional(),
  }),
}).strip();
