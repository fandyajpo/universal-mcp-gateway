import { FilterQuery } from "mongoose";

import { InvitationModel, IInvitation } from "../models/invitation";
import { BaseRepository } from "./base";

export interface InvitationFilters {
  status?: string;
  skip?: number;
  limit?: number;
}

export class InvitationRepository extends BaseRepository<IInvitation> {
  constructor() {
    super(InvitationModel);
  }

  async findByToken(token: string): Promise<IInvitation | null> {
    return this.findOne({ token } as FilterQuery<IInvitation>);
  }

  async findByWorkspace(
    workspaceId: string,
    filters?: InvitationFilters,
  ): Promise<{ invitations: IInvitation[]; total: number }> {
    const query: FilterQuery<IInvitation> = { workspaceId };

    if (filters?.status) {
      query.status = filters.status;
    }

    const total = await this.count(query);
    const invitations = await this.findMany(query, {
      skip: filters?.skip,
      limit: filters?.limit,
      sort: { createdAt: -1 },
    });

    return { invitations, total };
  }

  async countByWorkspaceToday(workspaceId: string): Promise<number> {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    return this.count({
      workspaceId,
      createdAt: { $gte: startOfDay },
    } as FilterQuery<IInvitation>);
  }

  async updateStatus(
    id: string,
    status: IInvitation["status"],
    extra?: Partial<IInvitation>,
  ): Promise<IInvitation | null> {
    return this.updateById(id, { status, ...extra } as Partial<IInvitation>);
  }
}
