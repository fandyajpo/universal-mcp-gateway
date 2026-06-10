import { z } from "zod";

export const workspaceRoleSchema = z.enum(["owner", "admin", "member", "viewer"]);

export const userSchema = z
  .object({
    id: z.string().min(1).max(128),
    email: z.string().email().max(254).trim().toLowerCase(),
    name: z
      .string()
      .min(1, "Name is required")
      .max(256, "Name must be at most 256 characters")
      .trim()
      .refine((val) => !/<[^>]*>/i.test(val), "Name must not contain HTML tags"),
    avatarUrl: z.string().url().max(2048).optional(),
    isActive: z.boolean(),
    createdAt: z.coerce.date(),
    updatedAt: z.coerce.date(),
  })
  .strip();

export const sessionSchema = z
  .object({
    id: z.string().min(1).max(128),
    userId: z.string().min(1).max(128),
    token: z.string().min(1).max(512),
    expiresAt: z.coerce.date(),
    createdAt: z.coerce.date(),
  })
  .strip();

export const workspaceSchema = z
  .object({
    id: z.string().min(1).max(128),
    name: z
      .string()
      .min(1, "Workspace name is required")
      .max(128, "Workspace name must be at most 128 characters")
      .trim()
      .refine((val) => !/<[^>]*>/i.test(val), "Name must not contain HTML tags"),
    slug: z
      .string()
      .min(3)
      .max(63)
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    ownerId: z.string().min(1).max(128),
    isActive: z.boolean(),
    createdAt: z.coerce.date(),
    updatedAt: z.coerce.date(),
  })
  .strip();

export const workspaceMemberSchema = z
  .object({
    userId: z.string().min(1).max(128),
    workspaceId: z.string().min(1).max(128),
    role: workspaceRoleSchema,
    joinedAt: z.coerce.date(),
  })
  .strip();

export type UserSchema = z.infer<typeof userSchema>;
export type SessionSchema = z.infer<typeof sessionSchema>;
export type WorkspaceSchema = z.infer<typeof workspaceSchema>;
export type WorkspaceMemberSchema = z.infer<typeof workspaceMemberSchema>;
