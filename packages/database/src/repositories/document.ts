import { DocumentModel, IDocument } from "../models/document";
import { TenantAwareRepository } from "./tenant-aware";

export interface DocumentFilters {
  status?: string;
  contentType?: string;
  source?: string;
  dateFrom?: Date;
  dateTo?: Date;
  skip?: number;
  limit?: number;
}

export class DocumentRepository extends TenantAwareRepository<IDocument> {
  constructor(tenantId: string) {
    super(DocumentModel, tenantId);
  }

  async findByWorkspace(filters?: DocumentFilters): Promise<IDocument[]> {
    const query: Record<string, unknown> = {};
    if (filters?.status) query.status = filters.status;
    if (filters?.contentType) query.contentType = filters.contentType;
    if (filters?.source) query.source = filters.source;
    if (filters?.dateFrom || filters?.dateTo) {
      query.createdAt = {};
      if (filters.dateFrom) (query.createdAt as Record<string, unknown>).$gte = filters.dateFrom;
      if (filters.dateTo) (query.createdAt as Record<string, unknown>).$lte = filters.dateTo;
    }

    return this.findMany(query, {
      skip: filters?.skip,
      limit: filters?.limit,
      sort: { createdAt: -1 },
    });
  }

  async findByStatus(status: string): Promise<IDocument[]> {
    return this.findMany({ status });
  }

  async search(query: string): Promise<IDocument[]> {
    return this.findMany(
      { $text: { $search: query } },
      { sort: { score: { $meta: "textScore" } } },
    );
  }

  async updateStatus(documentId: string, status: string): Promise<IDocument | null> {
    return this.updateById(documentId, { status });
  }

  async markProcessed(documentId: string): Promise<IDocument | null> {
    return this.updateById(documentId, {
      status: "ready",
      processedAt: new Date(),
    });
  }

  async countByWorkspace(): Promise<number> {
    return this.count({});
  }
}
