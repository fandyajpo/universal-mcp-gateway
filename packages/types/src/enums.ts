export const WorkspaceRole = {
  Owner: "owner",
  Admin: "admin",
  Member: "member",
  Viewer: "viewer",
} as const;

export type WorkspaceRole = (typeof WorkspaceRole)[keyof typeof WorkspaceRole];

export const ConnectorType = {
  Slack: "slack",
  GoogleDrive: "google_drive",
  Notion: "notion",
  Confluence: "confluence",
  Github: "github",
  Custom: "custom",
} as const;

export type ConnectorType = (typeof ConnectorType)[keyof typeof ConnectorType];

export const ConnectorStatus = {
  Connected: "connected",
  Disconnected: "disconnected",
  Error: "error",
  Syncing: "syncing",
} as const;

export type ConnectorStatus = (typeof ConnectorStatus)[keyof typeof ConnectorStatus];

export const AgentStatus = {
  Active: "active",
  Inactive: "inactive",
  Error: "error",
  Training: "training",
} as const;

export type AgentStatus = (typeof AgentStatus)[keyof typeof AgentStatus];

export const ChatRole = {
  User: "user",
  Assistant: "assistant",
  System: "system",
} as const;

export type ChatRole = (typeof ChatRole)[keyof typeof ChatRole];

export const RetrievalStrategy = {
  Semantic: "semantic",
  Keyword: "keyword",
  Hybrid: "hybrid",
  Rerank: "rerank",
} as const;

export type RetrievalStrategy = (typeof RetrievalStrategy)[keyof typeof RetrievalStrategy];

export const ChunkStrategy = {
  Fixed: "fixed",
  Semantic: "semantic",
  Recursive: "recursive",
  Hybrid: "hybrid",
} as const;

export type ChunkStrategy = (typeof ChunkStrategy)[keyof typeof ChunkStrategy];

export const AuditAction = {
  Create: "create",
  Update: "update",
  Delete: "delete",
  Read: "read",
  Login: "login",
  Logout: "logout",
  Invite: "invite",
  Remove: "remove",
} as const;

export type AuditAction = (typeof AuditAction)[keyof typeof AuditAction];

export const ApiKeyScope = {
  Read: "read",
  Write: "write",
  Admin: "admin",
} as const;

export type ApiKeyScope = (typeof ApiKeyScope)[keyof typeof ApiKeyScope];

export const FeatureFlag = {
  AiGateway: "ai_gateway",
  McpGateway: "mcp_gateway",
  RagEngine: "rag_engine",
  AdvancedAnalytics: "advanced_analytics",
  CustomBranding: "custom_branding",
  Sso: "sso",
} as const;

export type FeatureFlag = (typeof FeatureFlag)[keyof typeof FeatureFlag];
