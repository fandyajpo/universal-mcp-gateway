import { z } from "zod";

import { slugSchema } from "../primitives";
import { workspaceRoleSchema } from "./auth";

export const createWorkspaceSchema = z
  .object({
    name: z
      .string()
      .min(2, "Name must be at least 2 characters")
      .max(100, "Name must be at most 100 characters")
      .trim()
      .refine((val) => !/<[^>]*>/i.test(val), "Name must not contain HTML tags"),
    slug: slugSchema,
    description: z.string().max(500, "Description must be at most 500 characters").trim().optional(),
  })
  .strip();

export const updateWorkspaceSchema = createWorkspaceSchema.partial().strip();

export const workspaceSettingsSchema = z
  .object({
    timezone: z.string().min(1, "Timezone is required").max(64, "Timezone must be at most 64 characters"),
    locale: z.string().min(2, "Locale is required").max(10, "Locale must be at most 10 characters"),
    featureFlags: z.array(z.string().min(1).max(64)).max(50).optional(),
  })
  .strip();

export const memberRoleSchema = z
  .object({
    workspaceId: z.string().min(1, "Workspace ID is required").max(128),
    userId: z.string().min(1, "User ID is required").max(128),
    role: workspaceRoleSchema,
  })
  .strip();

export const invitationSchema = z
  .object({
    email: z.string().email("Invalid email address").max(254).trim().toLowerCase(),
    role: workspaceRoleSchema,
    message: z.string().max(1000, "Message must be at most 1000 characters").trim().optional(),
  })
  .strip();

export type CreateWorkspaceInput = z.infer<typeof createWorkspaceSchema>;
export type UpdateWorkspaceInput = z.infer<typeof updateWorkspaceSchema>;
export type WorkspaceSettingsInput = z.infer<typeof workspaceSettingsSchema>;
export type MemberRoleInput = z.infer<typeof memberRoleSchema>;
export type InvitationInput = z.infer<typeof invitationSchema>;
