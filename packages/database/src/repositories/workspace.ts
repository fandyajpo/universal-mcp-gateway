import { WorkspaceModel, IWorkspace } from "../models/workspace";
import { TenantAwareRepository } from "./tenant-aware";

export class WorkspaceRepository extends TenantAwareRepository<IWorkspace> {
  constructor(tenantId: string) {
    super(WorkspaceModel, tenantId);
  }

  async findBySlug(slug: string): Promise<IWorkspace | null> {
    return this.findOne({ slug });
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

  async updateSettings(workspaceId: string, settings: Record<string, unknown>): Promise<IWorkspace | null> {
    return this.updateById(workspaceId, { settings });
  }
}
