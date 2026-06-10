import { Schema, model, Model } from "mongoose";

import { timestampsPlugin, toJSONTransform } from "../schema";

export interface IWorkspace {
  tenantId: string;
  name: string;
  slug: string;
  avatar?: string;
  description?: string;
  ownerId: string;
  memberCount?: number;
  plan?: string;
  isActive: boolean;
  settings?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

const workspaceSchema = new Schema<IWorkspace>({
  tenantId: { type: String, required: true, index: true },
  name: { type: String, required: true, trim: true },
  slug: { type: String, required: true, unique: true, trim: true },
  avatar: { type: String },
  description: { type: String },
  ownerId: { type: String, required: true, index: true },
  memberCount: { type: Number, default: 0 },
  plan: { type: String, default: "free" },
  isActive: { type: Boolean, default: true },
  settings: { type: Schema.Types.Mixed, default: {} },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  deletedAt: { type: Date, default: null },
});

workspaceSchema.index({ isActive: 1, plan: 1 });

timestampsPlugin(workspaceSchema);
toJSONTransform(workspaceSchema);

export const WorkspaceModel: Model<IWorkspace> = model<IWorkspace>("Workspace", workspaceSchema);
