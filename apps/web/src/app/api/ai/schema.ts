import { z } from "zod";

export const chatRequestSchema = z.object({
  model: z.string().max(256).trim().optional(),
  messages: z.array(
    z.object({
      role: z.enum(["system", "user", "assistant", "tool"]),
      content: z.string().min(1).max(128_000),
      name: z.string().max(256).optional(),
    }).strip(),
  ).min(1).max(100),
  temperature: z.number().min(0).max(2).optional(),
  max_tokens: z.number().int().min(1).max(128_000).optional(),
  stream: z.boolean().optional().default(false),
}).strip();

export const embedRequestSchema = z.object({
  model: z.string().max(256).trim().optional(),
  input: z.union([z.string().min(1), z.array(z.string()).min(1).max(100)]),
}).strip();

export type ChatRequestBody = z.infer<typeof chatRequestSchema>;
export type EmbedRequestBody = z.infer<typeof embedRequestSchema>;
