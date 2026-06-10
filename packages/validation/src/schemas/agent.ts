import { z } from "zod";

export const agentStatusSchema = z.enum(["active", "inactive", "error", "training"]);

export const agentToolSchema = z
  .object({
    name: z.string().min(1).max(128).trim(),
    description: z.string().max(2000).trim(),
    inputSchema: z.record(z.string(), z.unknown()),
  })
  .strip();

export const agentConfigSchema = z
  .object({
    model: z.string().min(1).max(256).trim(),
    instructions: z.string().max(10_000).trim(),
    temperature: z.number().min(0).max(2).default(0.7),
    maxTokens: z.number().int().min(1).max(1_000_000).default(2048),
  })
  .strip();

export const agentSchema = z
  .object({
    id: z.string().min(1).max(128),
    workspaceId: z.string().min(1).max(128),
    name: z
      .string()
      .min(1, "Agent name is required")
      .max(128)
      .trim()
      .refine((val) => !/<[^>]*>/i.test(val), "Name must not contain HTML tags"),
    description: z.string().max(2000).trim().optional(),
    config: agentConfigSchema,
    status: agentStatusSchema,
    tools: z.array(agentToolSchema).max(100).default([]),
    createdAt: z.coerce.date(),
    updatedAt: z.coerce.date(),
  })
  .strip();

export type AgentToolSchema = z.infer<typeof agentToolSchema>;
export type AgentConfigSchema = z.infer<typeof agentConfigSchema>;
export type AgentSchema = z.infer<typeof agentSchema>;
