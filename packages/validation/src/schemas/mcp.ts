import { z } from "zod";

export const mcpToolSchema = z
  .object({
    name: z.string().min(1).max(128).trim(),
    description: z.string().max(2000).trim().optional(),
    inputSchema: z.record(z.string(), z.unknown()),
  })
  .strip();

export const mcpRequestSchema = z
  .object({
    id: z.string().min(1).max(128),
    method: z.string().min(1).max(256).trim(),
    params: z.unknown().optional(),
  })
  .strip();

export const mcpErrorSchema = z
  .object({
    code: z.number().int(),
    message: z.string().min(1).max(2000).trim(),
    data: z.unknown().optional(),
  })
  .strip();

export const mcpResponseSchema = z
  .object({
    id: z.string().min(1).max(128),
    result: z.unknown().optional(),
    error: mcpErrorSchema.optional(),
  })
  .strip();

export const mcpCapabilitySchema = z
  .object({
    name: z.string().min(1).max(128).trim(),
    version: z.string().min(1).max(32).trim(),
    tools: z.array(mcpToolSchema).max(500).optional(),
  })
  .strip();

export type MCPToolSchema = z.infer<typeof mcpToolSchema>;
export type MCPRequestSchema = z.infer<typeof mcpRequestSchema>;
export type MCPErrorSchema = z.infer<typeof mcpErrorSchema>;
export type MCPResponseSchema = z.infer<typeof mcpResponseSchema>;
export type MCPCapabilitySchema = z.infer<typeof mcpCapabilitySchema>;
