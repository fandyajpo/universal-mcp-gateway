import { Schema, model, Model } from "mongoose";

import { timestampsPlugin, toJSONTransform } from "../schema";
import { WorkspaceRole } from "@repo/types";

export type InvitationStatus = "pending" | "accepted" | "declined" | "cancelled" | "expired";

export interface IInvitation {
  tenantId: string;
  workspaceId: string;
  workspaceName: string;
  inviterId: string;
  inviteeEmail: string;
  role: (typeof WorkspaceRole)[keyof typeof WorkspaceRole];
  token: string;
  message?: string;
  status: InvitationStatus;
  expiresAt: Date;
  acceptedAt?: Date;
  declinedAt?: Date;
  cancelledAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

const invitationSchema = new Schema<IInvitation>({
  tenantId: { type: String, required: true, index: true },
  workspaceId: { type: String, required: true, index: true },
  workspaceName: { type: String, required: true },
  inviterId: { type: String, required: true },
  inviteeEmail: { type: String, required: true, lowercase: true, trim: true },
  role: { type: String, enum: Object.values(WorkspaceRole), required: true },
  token: { type: String, required: true, unique: true, index: true },
  message: { type: String, maxlength: 1000 },
  status: {
    type: String,
    enum: ["pending", "accepted", "declined", "cancelled", "expired"],
    default: "pending",
    index: true,
  },
  expiresAt: { type: Date, required: true, index: { expires: 0 } },
  acceptedAt: { type: Date },
  declinedAt: { type: Date },
  cancelledAt: { type: Date },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  deletedAt: { type: Date, default: null },
});

invitationSchema.index({ workspaceId: 1, status: 1 });
invitationSchema.index({ inviteeEmail: 1, workspaceId: 1 });

timestampsPlugin(invitationSchema);
toJSONTransform(invitationSchema);

export const InvitationModel: Model<IInvitation> = model<IInvitation>("Invitation", invitationSchema);
