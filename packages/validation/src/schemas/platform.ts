import { z } from "zod";

import { workspaceRoleSchema } from "./auth";

export const apiKeyScopeSchema = z.enum(["read", "write", "admin"]);

export const auditActionSchema = z.enum([
  "create",
  "update",
  "delete",
  "read",
  "login",
  "logout",
  "invite",
  "remove",
]);

export const apiKeySchema = z
  .object({
    id: z.string().min(1).max(128),
    workspaceId: z.string().min(1).max(128),
    name: z.string().min(1).max(128).trim(),
    key: z.string().min(1).max(512).trim(),
    scopes: z.array(apiKeyScopeSchema).min(1),
    expiresAt: z.coerce.date().optional(),
    isActive: z.boolean(),
    createdAt: z.coerce.date(),
    lastUsedAt: z.coerce.date().optional(),
  })
  .strip();

export const auditLogSchema = z
  .object({
    id: z.string().min(1).max(128),
    workspaceId: z.string().min(1).max(128),
    action: auditActionSchema,
    actorId: z.string().min(1).max(128),
    targetId: z.string().max(128).optional(),
    targetType: z.string().max(64).optional(),
    metadata: z.record(z.string(), z.unknown()).optional(),
    createdAt: z.coerce.date(),
  })
  .strip();

export const billingPlanSchema = z
  .object({
    id: z.string().min(1).max(128),
    name: z.string().min(1).max(128).trim(),
    price: z.number().min(0),
    currency: z.string().length(3, "Currency must be a 3-letter code"),
    features: z.array(z.string().max(256).trim()).max(100),
    isActive: z.boolean(),
  })
  .strip();

export const subscriptionSchema = z
  .object({
    id: z.string().min(1).max(128),
    workspaceId: z.string().min(1).max(128),
    planId: z.string().min(1).max(128),
    status: z.string().min(1).max(32).trim(),
    currentPeriodStart: z.coerce.date(),
    currentPeriodEnd: z.coerce.date(),
    createdAt: z.coerce.date(),
  })
  .strip();

export const invitationSchema = z
  .object({
    id: z.string().min(1).max(128),
    workspaceId: z.string().min(1).max(128),
    email: z.string().email().max(254).trim().toLowerCase(),
    role: workspaceRoleSchema,
    token: z.string().min(1).max(512),
    expiresAt: z.coerce.date(),
    acceptedAt: z.coerce.date().optional(),
    createdAt: z.coerce.date(),
  })
  .strip();

export const notificationSchema = z
  .object({
    id: z.string().min(1).max(128),
    workspaceId: z.string().min(1).max(128),
    userId: z.string().min(1).max(128),
    title: z.string().min(1).max(256).trim(),
    message: z.string().max(2000).trim().optional(),
    type: z.string().min(1).max(64).trim(),
    read: z.boolean(),
    createdAt: z.coerce.date(),
  })
  .strip();

export const permissionSchema = z
  .object({
    id: z.string().min(1).max(128),
    name: z.string().min(1).max(128).trim(),
    description: z.string().max(2000).trim().optional(),
    resource: z.string().min(1).max(128).trim(),
    action: z.string().min(1).max(64).trim(),
  })
  .strip();

export const rateLimitSchema = z
  .object({
    key: z.string().min(1).max(256).trim(),
    limit: z.number().int().min(1),
    remaining: z.number().int().min(0),
    resetAt: z.coerce.date(),
  })
  .strip();

export const webhookSchema = z
  .object({
    id: z.string().min(1).max(128),
    workspaceId: z.string().min(1).max(128),
    url: z.string().url().max(2048),
    events: z.array(z.string().min(1).max(128).trim()).min(1),
    secret: z.string().max(512).optional(),
    isActive: z.boolean(),
    createdAt: z.coerce.date(),
  })
  .strip();

export type ApiKeySchema = z.infer<typeof apiKeySchema>;
export type AuditLogSchema = z.infer<typeof auditLogSchema>;
export type BillingPlanSchema = z.infer<typeof billingPlanSchema>;
export type SubscriptionSchema = z.infer<typeof subscriptionSchema>;
export type InvitationSchema = z.infer<typeof invitationSchema>;
export type NotificationSchema = z.infer<typeof notificationSchema>;
export type PermissionSchema = z.infer<typeof permissionSchema>;
export type RateLimitSchema = z.infer<typeof rateLimitSchema>;
export type WebhookSchema = z.infer<typeof webhookSchema>;
