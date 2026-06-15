import { Schema, model, Model } from "mongoose";

import { timestampsPlugin, toJSONTransform } from "../schema";
import { WorkspaceRole } from "@repo/types";

export interface IWorkspaceMemberEntry {
  userId: string;
  role: (typeof WorkspaceRole)[keyof typeof WorkspaceRole];
  joinedAt: Date;
  invitedBy?: string;
  deletedAt?: Date | null;
}

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
  members?: IWorkspaceMemberEntry[];
  settings?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

const workspaceMemberSchema = new Schema<IWorkspaceMemberEntry>({
  userId: { type: String, required: true },
  role: { type: String, enum: Object.values(WorkspaceRole), default: WorkspaceRole.Member },
  joinedAt: { type: Date, default: Date.now },
  invitedBy: { type: String },
  deletedAt: { type: Date, default: null },
});

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
  members: { type: [workspaceMemberSchema], default: [] },
  settings: { type: Schema.Types.Mixed, default: {} },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  deletedAt: { type: Date, default: null },
});

workspaceSchema.index({ isActive: 1, plan: 1 }, { name: "idx_workspaces_isActive_plan" });
workspaceSchema.index({ ownerId: 1, deletedAt: 1 }, { name: "idx_workspaces_ownerId_deletedAt" });
workspaceSchema.index({ "members.userId": 1, "members.deletedAt": 1 }, { name: "idx_workspaces_membersUserId_membersDeletedAt" });
workspaceSchema.index({ tenantId: 1, deletedAt: 1 }, { name: "idx_workspaces_tenantId_deletedAt" });
workspaceSchema.index(
  { name: "text", description: "text" },
  {
    name: "idx_workspaces_name_text_description_text",
    weights: { name: 10, description: 5 },
  },
);

timestampsPlugin(workspaceSchema);
toJSONTransform(workspaceSchema);

export const WorkspaceModel: Model<IWorkspace> = model<IWorkspace>("Workspace", workspaceSchema);
