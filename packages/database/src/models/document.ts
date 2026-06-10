import { Schema, model, Model } from "mongoose";

import { timestampsPlugin, toJSONTransform } from "../schema";

export interface IDocument {
  tenantId: string;
  title: string;
  description?: string;
  source: string;
  sourceUrl?: string;
  contentType?: string;
  fileSize?: number;
  fileKey?: string;
  pageCount?: number;
  status: string;
  metadata?: Record<string, unknown>;
  tags?: string[];
  processedAt?: Date;
  uploadedBy: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

const documentSchema = new Schema<IDocument>({
  tenantId: { type: String, required: true, index: true },
  title: { type: String, required: true, trim: true },
  description: { type: String },
  source: { type: String, required: true, enum: ["upload", "webhook", "connector", "api"] },
  sourceUrl: { type: String },
  contentType: { type: String },
  fileSize: { type: Number },
  fileKey: { type: String },
  pageCount: { type: Number },
  status: { type: String, required: true, enum: ["processing", "ready", "error"], default: "processing" },
  metadata: { type: Schema.Types.Mixed, default: {} },
  tags: { type: [String], default: [] },
  processedAt: { type: Date },
  uploadedBy: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  deletedAt: { type: Date, default: null },
});

documentSchema.index({ tenantId: 1, status: 1 });
documentSchema.index({ tenantId: 1, contentType: 1 });
documentSchema.index({ tenantId: 1, createdAt: -1 });
documentSchema.index(
  { title: "text", description: "text", tags: "text" },
  { weights: { title: 10, description: 5, tags: 3 } },
);

timestampsPlugin(documentSchema);
toJSONTransform(documentSchema);

export const DocumentModel: Model<IDocument> = model<IDocument>("Document", documentSchema);
