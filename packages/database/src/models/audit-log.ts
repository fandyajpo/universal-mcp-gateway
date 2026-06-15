import { Schema, model, Model } from "mongoose";

import { timestampsPlugin, toJSONTransform } from "../schema";

export interface IAuditLog {
  tenantId: string;
  userId?: string;
  action: string;
  entityType?: string;
  entityId?: string;
  changes?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

const auditLogSchema = new Schema<IAuditLog>({
  tenantId: { type: String, required: true, index: true },
  userId: { type: String },
  action: { type: String, required: true },
  entityType: { type: String },
  entityId: { type: String },
  changes: { type: Schema.Types.Mixed },
  ipAddress: { type: String },
  userAgent: { type: String },
  metadata: { type: Schema.Types.Mixed },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  deletedAt: { type: Date, default: null },
});

auditLogSchema.index({ tenantId: 1, createdAt: -1 }, { name: "idx_auditlogs_tenantId_createdAt" });
auditLogSchema.index({ userId: 1, createdAt: -1 }, { name: "idx_auditlogs_userId_createdAt" });
auditLogSchema.index({ action: 1, createdAt: -1 }, { name: "idx_auditlogs_action_createdAt" });
auditLogSchema.index({ entityType: 1, entityId: 1, createdAt: -1 }, { name: "idx_auditlogs_entityType_entityId_createdAt" });

timestampsPlugin(auditLogSchema);
toJSONTransform(auditLogSchema);

export const AuditLogModel: Model<IAuditLog> = model<IAuditLog>("AuditLog", auditLogSchema);
