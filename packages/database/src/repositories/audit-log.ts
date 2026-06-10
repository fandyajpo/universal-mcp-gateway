import { AuditLogModel, IAuditLog } from "../models/audit-log";
import { TenantAwareRepository } from "./tenant-aware";
import { createLogger } from "@repo/logger";

const logger = createLogger("audit-log-repo");

export interface AuditLogFilters {
  userId?: string;
  action?: string;
  entityType?: string;
  entityId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  skip?: number;
  limit?: number;
}

export class AuditLogRepository extends TenantAwareRepository<IAuditLog> {
  constructor(tenantId: string) {
    super(AuditLogModel, tenantId);
  }

  async log(data: Partial<IAuditLog>): Promise<IAuditLog> {
    return this.create(data);
  }

  logAsync(data: Partial<IAuditLog>): void {
    this.create(data).catch((err: unknown) => {
      logger.error({ err }, "Audit log write failed");
    });
  }

  async findByWorkspace(filters?: AuditLogFilters): Promise<IAuditLog[]> {
    const query: Record<string, unknown> = {};
    if (filters?.userId) query.userId = filters.userId;
    if (filters?.action) query.action = filters.action;
    if (filters?.entityType) query.entityType = filters.entityType;
    if (filters?.entityId) query.entityId = filters.entityId;
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

  async findByUser(userId: string, filters?: Omit<AuditLogFilters, "userId">): Promise<IAuditLog[]> {
    return this.findByWorkspace({ ...filters, userId });
  }

  async findByEntity(entityType: string, entityId: string): Promise<IAuditLog[]> {
    return this.findMany({ entityType, entityId }, {
      sort: { createdAt: -1 },
    });
  }
}
