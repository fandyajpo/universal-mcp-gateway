import type { Brand } from "./utils";

declare const UserIdBrand: unique symbol;

export type UserId = Brand<string, typeof UserIdBrand>;

declare const WorkspaceIdBrand: unique symbol;

export type WorkspaceId = Brand<string, typeof WorkspaceIdBrand>;

export type TenantId = WorkspaceId;

declare const DocumentIdBrand: unique symbol;

export type DocumentId = Brand<string, typeof DocumentIdBrand>;

declare const ConnectorIdBrand: unique symbol;

export type ConnectorId = Brand<string, typeof ConnectorIdBrand>;

declare const AgentIdBrand: unique symbol;

export type AgentId = Brand<string, typeof AgentIdBrand>;

declare const SessionIdBrand: unique symbol;

export type SessionId = Brand<string, typeof SessionIdBrand>;

declare const ApiKeyIdBrand: unique symbol;

export type ApiKeyId = Brand<string, typeof ApiKeyIdBrand>;
