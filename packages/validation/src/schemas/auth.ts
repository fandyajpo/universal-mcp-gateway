import { z } from "zod";

import { brandedIdSchema, emailSchema, passwordSchema } from "../primitives";

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

export const authSessionSchema = z
  .object({
    id: z.string().min(1).max(128),
    userId: z.string().min(1).max(128),
    token: z.string().min(1).max(512),
    expiresAt: z.coerce.date(),
    createdAt: z.coerce.date(),
  })
  .strip();

export const loginSchema = z
  .object({
    email: emailSchema,
    password: z.string().min(8, "Password must be at least 8 characters"),
    rememberMe: z.boolean().optional(),
  })
  .strip();

export const registerSchema = z
  .object({
    name: z
      .string()
      .min(2, "Name must be at least 2 characters")
      .max(100, "Name must be at most 100 characters")
      .trim(),
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })
  .transform(({ confirmPassword: _, ...rest }) => rest);

export const resetPasswordSchema = z
  .object({
    token: z.string().min(32, "Token must be at least 32 characters"),
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })
  .transform(({ confirmPassword: _, ...rest }) => rest);

export const verifyEmailSchema = z
  .object({
    token: z.string().min(32, "Token must be at least 32 characters"),
  })
  .strip();

export const mfaSetupSchema = z
  .object({
    method: z.literal("totp"),
    name: z.string().optional(),
  })
  .strip();

export const mfaVerifySchema = z
  .object({
    code: z
      .string()
      .length(6, "Code must be exactly 6 digits")
      .regex(/^\d{6}$/, "Code must contain only digits"),
    secret: z.string().min(1, "Secret is required"),
  })
  .strip();

export const oauthSchema = z
  .object({
    provider: z.enum(["google", "github"]),
    callbackURL: z.string().url("Invalid callback URL").optional(),
  })
  .strip();

export const sessionSchema = z
  .object({
    sessionId: z.string().min(1, "Session ID is required"),
    workspaceId: brandedIdSchema.optional(),
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
export type AuthSessionSchema = z.infer<typeof authSessionSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.input<typeof registerSchema>;
export type ResetPasswordInput = z.input<typeof resetPasswordSchema>;
export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;
export type MfaSetupInput = z.infer<typeof mfaSetupSchema>;
export type MfaVerifyInput = z.infer<typeof mfaVerifySchema>;
export type OAuthInput = z.infer<typeof oauthSchema>;
export type SessionSchema = z.infer<typeof sessionSchema>;
export type WorkspaceSchema = z.infer<typeof workspaceSchema>;
export type WorkspaceMemberSchema = z.infer<typeof workspaceMemberSchema>;
