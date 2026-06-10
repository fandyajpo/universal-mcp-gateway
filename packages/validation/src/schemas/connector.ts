import { z } from "zod";

export const connectorTypeSchema = z.enum([
  "slack",
  "google_drive",
  "notion",
  "confluence",
  "github",
  "custom",
]);

export const connectorStatusSchema = z.enum([
  "connected",
  "disconnected",
  "error",
  "syncing",
]);

export const connectorConfigSchema = z
  .record(z.string(), z.unknown())
  .default({});

export const connectorSchema = z
  .object({
    id: z.string().min(1).max(128),
    workspaceId: z.string().min(1).max(128),
    name: z
      .string()
      .min(1, "Connector name is required")
      .max(128)
      .trim()
      .refine((val) => !/<[^>]*>/i.test(val), "Name must not contain HTML tags"),
    type: connectorTypeSchema,
    config: connectorConfigSchema,
    status: connectorStatusSchema,
    lastSyncAt: z.coerce.date().optional(),
    createdAt: z.coerce.date(),
    updatedAt: z.coerce.date(),
  })
  .strip();

export type ConnectorConfigSchema = z.infer<typeof connectorConfigSchema>;
export type ConnectorSchema = z.infer<typeof connectorSchema>;
