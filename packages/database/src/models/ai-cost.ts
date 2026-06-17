import { Schema, model, type Model } from "mongoose";

import { timestampsPlugin, toJSONTransform } from "../schema";

export interface IAiCost {
  workspaceId: string;
  userId: string;
  requestId: string;
  model: string;
  provider: string;
  taskType: "chat" | "embedding";
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  cachedTokens?: number;
  cost: number;
  currency: string;
  timestamp: Date;
  metadata?: {
    streamed?: boolean;
    cached?: boolean;
    fallbackDepth?: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

const aiCostMetadataSchema = new Schema(
  {
    streamed: { type: Boolean },
    cached: { type: Boolean },
    fallbackDepth: { type: Number },
  },
  { _id: false },
);

const aiCostSchema = new Schema<IAiCost>({
  workspaceId: { type: String, required: true, index: true },
  userId: { type: String, required: true, index: true },
  requestId: { type: String, required: true },
  model: { type: String, required: true, index: true },
  provider: { type: String, required: true },
  taskType: { type: String, required: true, enum: ["chat", "embedding"] },
  promptTokens: { type: Number, required: true },
  completionTokens: { type: Number, required: true },
  totalTokens: { type: Number, required: true },
  cachedTokens: { type: Number },
  cost: { type: Number, required: true },
  currency: { type: String, required: true, default: "USD" },
  timestamp: { type: Date, required: true, default: Date.now, index: true },
  metadata: { type: aiCostMetadataSchema },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

aiCostSchema.index({ workspaceId: 1, timestamp: -1 }, { name: "idx_aiCosts_workspaceId_timestamp" });
aiCostSchema.index({ model: 1, timestamp: -1 }, { name: "idx_aiCosts_model_timestamp" });
aiCostSchema.index({ userId: 1, timestamp: -1 }, { name: "idx_aiCosts_userId_timestamp" });
aiCostSchema.index({ timestamp: 1 }, { expireAfterSeconds: 31536000, name: "idx_aiCosts_ttl" });

timestampsPlugin(aiCostSchema);
toJSONTransform(aiCostSchema);

export const AiCostModel: Model<IAiCost> = model<IAiCost>("AiCost", aiCostSchema);
