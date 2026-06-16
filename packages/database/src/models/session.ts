import { Schema, model, Model } from "mongoose";

import { timestampsPlugin, toJSONTransform, softDeletePlugin } from "../schema";

export interface ISession {
  tenantId: string;
  userId: string;
  token: string;
  expiresAt: Date;
  ipAddress?: string;
  userAgent?: string;
  isValid: boolean;
  lastActivityAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

const sessionSchema = new Schema<ISession>({
  tenantId: { type: String, required: true, index: true },
  userId: { type: String, required: true },
  token: { type: String, required: true, unique: true },
  expiresAt: { type: Date, required: true, index: { expires: 0 } },
  ipAddress: { type: String },
  userAgent: { type: String },
  isValid: { type: Boolean, default: true },
  lastActivityAt: { type: Date },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  deletedAt: { type: Date, default: null },
});

sessionSchema.index({ userId: 1, isValid: 1 }, { name: "idx_sessions_userId_isValid" });
sessionSchema.index({ tenantId: 1, lastActivityAt: 1 }, { name: "idx_sessions_tenantId_lastActivityAt" });

timestampsPlugin(sessionSchema);
softDeletePlugin(sessionSchema);
toJSONTransform(sessionSchema);

export const SessionModel: Model<ISession> = model<ISession>("Session", sessionSchema);
