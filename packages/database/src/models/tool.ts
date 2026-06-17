import { Schema, model, Model } from "mongoose";

import { timestampsPlugin, toJSONTransform } from "../schema";

export interface IToolMetadata {
  version: string;
  author: string;
  tags: string[];
  categories: string[];
  deprecated: boolean;
  deprecationMessage?: string;
  removed: boolean;
}

export interface ITool {
  tenantId: string;
  workspaceId: string;
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  outputSchema?: Record<string, unknown>;
  handlerRef: string;
  metadata: IToolMetadata;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

const toolMetadataSchema = new Schema<IToolMetadata>(
  {
    version: { type: String, required: true },
    author: { type: String, required: true },
    tags: { type: [String], default: [] },
    categories: { type: [String], default: [] },
    deprecated: { type: Boolean, default: false },
    deprecationMessage: { type: String },
    removed: { type: Boolean, default: false },
  },
  { _id: false },
);

const toolSchema = new Schema<ITool>({
  tenantId: { type: String, required: true, index: true },
  workspaceId: { type: String, required: true },
  name: { type: String, required: true },
  description: { type: String, required: true },
  inputSchema: { type: Schema.Types.Mixed, required: true },
  outputSchema: { type: Schema.Types.Mixed },
  handlerRef: { type: String, required: true },
  metadata: { type: toolMetadataSchema, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  deletedAt: { type: Date, default: null },
});

toolSchema.index({ workspaceId: 1, name: 1 }, { name: "idx_tools_workspaceId_name" });
toolSchema.index(
  { workspaceId: 1, name: 1 },
  { name: "idx_tools_workspaceId_name_unique", unique: true },
);
toolSchema.index(
  { workspaceId: 1, "metadata.categories": 1 },
  { name: "idx_tools_workspaceId_categories" },
);
toolSchema.index(
  { workspaceId: 1, "metadata.tags": 1 },
  { name: "idx_tools_workspaceId_tags" },
);

timestampsPlugin(toolSchema);
toJSONTransform(toolSchema);

export const ToolModel: Model<ITool> = model<ITool>("Tool", toolSchema);
