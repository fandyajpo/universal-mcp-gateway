import type { ApiKeyScope, AuditAction, WorkspaceRole } from "../enums";
import type { ApiKeyId, UserId, WorkspaceId } from "../types/branded";

export interface ApiKey {
  id: ApiKeyId;
  workspaceId: WorkspaceId;
  name: string;
  key: string;
  scopes: ApiKeyScope[];
  expiresAt?: Date;
  isActive: boolean;
  createdAt: Date;
  lastUsedAt?: Date;
}

export interface AuditLog {
  id: string;
  workspaceId: WorkspaceId;
  action: AuditAction;
  actorId: string;
  targetId?: string;
  targetType?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

export interface BillingPlan {
  id: string;
  name: string;
  price: number;
  currency: string;
  features: string[];
  isActive: boolean;
}

export interface Subscription {
  id: string;
  workspaceId: WorkspaceId;
  planId: string;
  status: string;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  createdAt: Date;
}

export interface Invitation {
  id: string;
  workspaceId: WorkspaceId;
  email: string;
  role: WorkspaceRole;
  token: string;
  expiresAt: Date;
  acceptedAt?: Date;
  createdAt: Date;
}

export interface Notification {
  id: string;
  workspaceId: WorkspaceId;
  userId: UserId;
  title: string;
  message?: string;
  type: string;
  read: boolean;
  createdAt: Date;
}

export interface Permission {
  id: string;
  name: string;
  description?: string;
  resource: string;
  action: string;
}

export interface RateLimit {
  key: string;
  limit: number;
  remaining: number;
  resetAt: Date;
}

export interface Webhook {
  id: string;
  workspaceId: WorkspaceId;
  url: string;
  events: string[];
  secret?: string;
  isActive: boolean;
  createdAt: Date;
}
