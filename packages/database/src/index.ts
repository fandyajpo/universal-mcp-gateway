export { connect, disconnect, getConnection, getPoolStats, isConnected, healthCheck } from "./connection";
export type { HealthCheckResult, ConnectionConfig } from "./connection";
export { BaseRepository } from "./repositories/base";
export type { PaginationOptions } from "./repositories/base";
export { TenantAwareRepository } from "./repositories/tenant-aware";
export { baseSchemaFields, timestampsPlugin, softDeletePlugin, toJSONTransform } from "./schema";
export { withQueryTiming } from "./middleware/query-timing";

export type { IUser } from "./models/user";
export type { IWorkspace, IWorkspaceMemberEntry } from "./models/workspace";
export type { MemberWithUser } from "./repositories/workspace";
export type { ISession } from "./models/session";
export type { IApiKey } from "./models/api-key";
export type { IAuditLog } from "./models/audit-log";
export type { IDocument, IProcessedContent, IProcessedContentPage, IExtractionMetadata, IPdfMetadata, IPdfInfoMetadata, IPdfPageDimension, IPdfTocEntry, ITable, ITableRow, ITableCell, ITableFormats, IStepMetric } from "./models/document";
export type { IInvitation, InvitationStatus } from "./models/invitation";

export { UserModel } from "./models/user";
export { WorkspaceModel } from "./models/workspace";
export { SessionModel } from "./models/session";
export { ApiKeyModel } from "./models/api-key";
export { AuditLogModel } from "./models/audit-log";
export { DocumentModel } from "./models/document";
export { InvitationModel } from "./models/invitation";

export { UserRepository } from "./repositories/user";
export { WorkspaceRepository } from "./repositories/workspace";
export { SessionRepository } from "./repositories/session";
export { ApiKeyRepository } from "./repositories/api-key";
export { AuditLogRepository } from "./repositories/audit-log";
export type { AuditLogFilters } from "./repositories/audit-log";
export { DocumentRepository } from "./repositories/document";
export type { DocumentFilters } from "./repositories/document";
export { InvitationRepository } from "./repositories/invitation";
export type { InvitationFilters } from "./repositories/invitation";
