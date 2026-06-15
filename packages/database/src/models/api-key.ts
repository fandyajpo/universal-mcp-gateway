import { Schema, model, Model } from "mongoose";

import { timestampsPlugin, toJSONTransform } from "../schema";

export interface IApiKey {
  tenantId: string;
  name: string;
  keyHash: string;
  keyPrefix: string;
  scopes: string[];
  expiresAt?: Date;
  lastUsedAt?: Date;
  isActive: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

const apiKeySchema = new Schema<IApiKey>({
  tenantId: { type: String, required: true, index: true },
  name: { type: String, required: true, trim: true },
  keyHash: { type: String, required: true, unique: true },
  keyPrefix: { type: String, required: true },
  scopes: { type: [String], default: [] },
  expiresAt: { type: Date },
  lastUsedAt: { type: Date },
  isActive: { type: Boolean, default: true },
  createdBy: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  deletedAt: { type: Date, default: null },
});

apiKeySchema.index({ tenantId: 1, isActive: 1 }, { name: "idx_apikeys_tenantId_isActive" });
apiKeySchema.index(
  { expiresAt: 1 },
  { name: "idx_apikeys_expiresAt_partial", partialFilterExpression: { expiresAt: { $exists: true } } },
);

timestampsPlugin(apiKeySchema);
toJSONTransform(apiKeySchema);

export const ApiKeyModel: Model<IApiKey> = model<IApiKey>("ApiKey", apiKeySchema);
