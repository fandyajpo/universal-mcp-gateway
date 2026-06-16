import { FilterQuery, PipelineStage } from "mongoose";

import { WorkspaceModel, IWorkspace, IWorkspaceMemberEntry } from "../models/workspace";
import { TenantAwareRepository } from "./tenant-aware";
import { WorkspaceRole } from "@repo/types";

export interface MemberWithUser extends IWorkspaceMemberEntry {
  user?: {
    id: string;
    email: string;
    name: string;
    avatarUrl?: string;
  } | null;
}

export class WorkspaceRepository extends TenantAwareRepository<IWorkspace> {
  constructor(tenantId: string) {
    super(WorkspaceModel, tenantId);
  }

  async findBySlug(slug: string, excludeId?: string): Promise<IWorkspace | null> {
    const filter: FilterQuery<IWorkspace> = { slug };
    if (excludeId) {
      filter._id = { $ne: excludeId };
    }
    return this.findOne(filter);
  }

  async findByOwner(ownerId: string): Promise<IWorkspace[]> {
    return this.findMany({ ownerId });
  }

  async searchByNameOrSlug(query: string): Promise<IWorkspace[]> {
    const regex = new RegExp(query, "i");
    return this.findMany({
      $or: [{ name: { $regex: regex } }, { slug: { $regex: regex } }],
    });
  }

  async addMember(
    workspaceId: string,
    userId: string,
    role: (typeof WorkspaceRole)[keyof typeof WorkspaceRole] = WorkspaceRole.Member,
  ): Promise<IWorkspaceMemberEntry> {
    const entry: IWorkspaceMemberEntry = {
      userId,
      role,
      joinedAt: new Date(),
    };

    const result = await this.model.updateOne(
      { _id: workspaceId, tenantId: this.tenantId, "members.userId": { $ne: userId } },
      {
        $push: { members: entry },
        $inc: { memberCount: 1 },
      },
    );

    if (result.matchedCount === 0) {
      const exists = await this.model.exists({ _id: workspaceId, tenantId: this.tenantId });
      if (!exists) throw new Error("Workspace not found");
      throw new Error("User is already a member");
    }

    return entry;
  }

  async removeMember(workspaceId: string, userId: string): Promise<boolean> {
    const result = await this.model.updateOne(
      { _id: workspaceId, tenantId: this.tenantId, "members.userId": userId, "members.deletedAt": null },
      { $set: { "members.$.deletedAt": new Date() }, $inc: { memberCount: -1 } },
    );
    return result.modifiedCount > 0;
  }

  async updateMemberRole(
    workspaceId: string,
    userId: string,
    role: (typeof WorkspaceRole)[keyof typeof WorkspaceRole],
  ): Promise<boolean> {
    const result = await this.model.updateOne(
      { _id: workspaceId, tenantId: this.tenantId, "members.userId": userId, "members.deletedAt": null },
      { $set: { "members.$.role": role } },
    );
    return result.modifiedCount > 0;
  }

  async getMembers(
    workspaceId: string,
    filters?: { role?: string; skip?: number; limit?: number },
  ): Promise<{ members: MemberWithUser[]; total: number }> {
    const pipeline = [
      { $match: { _id: workspaceId, tenantId: this.tenantId } },
      { $unwind: { path: "$members" } },
      { $match: { "members.deletedAt": null } },
    ] as PipelineStage[];

    if (filters?.role) {
      pipeline.push({ $match: { "members.role": filters.role } });
    }

    const countPipeline = [...pipeline, { $count: "total" }];
    const countResult = await this.model.aggregate<{ total: number }>(countPipeline);
    const total = countResult.length > 0 ? (countResult[0]?.total ?? 0) : 0;

    if (filters?.skip) pipeline.push({ $skip: filters.skip });
    if (filters?.limit) pipeline.push({ $limit: filters.limit });

    pipeline.push({
      $lookup: {
        from: "users",
        localField: "members.userId",
        foreignField: "_id",
        as: "user",
      },
    });

    pipeline.push({ $unwind: { path: "$user", preserveNullAndEmptyArrays: true } });

    pipeline.push({
      $project: {
        userId: "$members.userId",
        role: "$members.role",
        joinedAt: "$members.joinedAt",
        invitedBy: "$members.invitedBy",
        deletedAt: "$members.deletedAt",
        user: {
          id: "$user._id",
          email: "$user.email",
          name: "$user.name",
          avatarUrl: "$user.avatarUrl",
        },
      },
      });

    const members = await this.model.aggregate<MemberWithUser>(pipeline);
    return { members, total };
  }

  async transferOwnership(workspaceId: string, newOwnerId: string): Promise<IWorkspace | null> {
    const workspace = await this.findById(workspaceId);
    if (!workspace) return null;

    const isAdmin = workspace.members?.some(
      (m) => m.userId === newOwnerId && m.role === WorkspaceRole.Admin && !m.deletedAt,
    );
    if (!isAdmin) throw new Error("New owner must be an admin member of the workspace");

    await this.model.updateOne(
      { _id: workspaceId, tenantId: this.tenantId },
      {
        $set: { ownerId: newOwnerId },
      },
    );

    return this.findById(workspaceId);
  }

  async archive(workspaceId: string): Promise<IWorkspace | null> {
    return this.model.findOneAndUpdate(
      { _id: workspaceId, tenantId: this.tenantId, deletedAt: null },
      { $set: { deletedAt: new Date() } },
      { new: true },
    ).lean();
  }

  async restore(workspaceId: string): Promise<IWorkspace | null> {
    return this.model.findOneAndUpdate(
      { _id: workspaceId, tenantId: this.tenantId, deletedAt: { $ne: null } },
      { $set: { deletedAt: null } },
      { new: true },
    ).lean();
  }

  async updateSettings(workspaceId: string, settings: Record<string, unknown>): Promise<IWorkspace | null> {
    const setObj: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(settings)) {
      setObj[`settings.${key}`] = value;
    }

    return this.model.findOneAndUpdate(
      { _id: workspaceId, tenantId: this.tenantId },
      { $set: setObj },
      { new: true },
    ).lean();
  }
}
