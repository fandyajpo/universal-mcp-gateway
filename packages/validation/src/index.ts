// Primitives
export {
  slugSchema,
  emailSchema,
  urlSchema,
  uuidSchema,
  brandedIdSchema,
  passwordSchema,
  hexColorSchema,
} from "./primitives";

// Auth schemas
export {
  userSchema,
  authSessionSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
  verifyEmailSchema,
  mfaSetupSchema,
  mfaVerifySchema,
  oauthSchema,
  sessionSchema,
  workspaceSchema,
  workspaceMemberSchema,
  workspaceRoleSchema,
} from "./schemas/auth";

// Workspace schemas
export {
  createWorkspaceSchema,
  updateWorkspaceSchema,
  workspaceSettingsSchema,
  memberRoleSchema,
  invitationSchema as sendInvitationSchema,
} from "./schemas/workspace";

// Document schemas
export {
  documentSchema,
  documentChunkSchema,
  documentMetadataSchema,
  documentSourceSchema,
  pdfUploadResponseSchema,
} from "./schemas/document";

// Connector schemas
export {
  connectorSchema,
  connectorConfigSchema,
  connectorStatusSchema,
  connectorTypeSchema,
} from "./schemas/connector";

// Agent schemas
export {
  agentSchema,
  agentConfigSchema,
  agentStatusSchema,
  agentToolSchema,
} from "./schemas/agent";

// Chat schemas
export {
  chatMessageSchema,
  chatThreadSchema,
  chatRoleSchema,
  chatConfigSchema,
} from "./schemas/chat";

// Embedding schemas
export {
  embeddingSchema,
  embeddingConfigSchema,
  embeddingModelSchema,
} from "./schemas/embedding";

// RAG schemas
export {
  ragResultSchema,
  ragConfigSchema,
  retrievalStrategySchema,
  chunkStrategySchema,
  ragQuerySchema,
  ragQueryOptionsSchema,
  documentIdParamsSchema,
} from "./schemas/rag";

// Storage schemas
export {
  fileTypeResultSchema,
  fileSizeSchema,
  uploadOptionsSchema,
} from "./schemas/storage";

// MCP schemas
export {
  mcpToolSchema,
  mcpRequestSchema,
  mcpResponseSchema,
  mcpErrorSchema,
  mcpCapabilitySchema,
} from "./schemas/mcp";

// Platform schemas
export {
  apiKeySchema,
  auditLogSchema,
  billingPlanSchema,
  subscriptionSchema,
  invitationSchema,
  notificationSchema,
  permissionSchema,
  rateLimitSchema,
  webhookSchema,
  apiKeyScopeSchema,
  auditActionSchema,
} from "./schemas/platform";

// Helpers
export {
  validateBody,
  validateQuery,
  validateParams,
  validateAction,
} from "./helpers";

export type {
  ValidationResult,
  ValidationSuccess,
  ValidationError,
} from "./helpers";

// Inferred types
export type {
  UserSchema,
  AuthSessionSchema,
  LoginInput,
  RegisterInput,
  ResetPasswordInput,
  VerifyEmailInput,
  MfaSetupInput,
  MfaVerifyInput,
  OAuthInput,
  SessionSchema,
  WorkspaceSchema,
  WorkspaceMemberSchema,
} from "./schemas/auth";
export type {
  CreateWorkspaceInput,
  UpdateWorkspaceInput,
  WorkspaceSettingsInput,
  MemberRoleInput,
  InvitationInput,
} from "./schemas/workspace";
export type {
  DocumentSchema,
  DocumentChunkSchema,
  DocumentMetadataSchema,
  DocumentSourceSchema,
  PdfUploadResponseSchema,
} from "./schemas/document";
export type {
  ConnectorSchema,
  ConnectorConfigSchema,
} from "./schemas/connector";
export type {
  AgentSchema,
  AgentConfigSchema,
  AgentToolSchema,
} from "./schemas/agent";
export type {
  ChatMessageSchema,
  ChatThreadSchema,
  ChatConfigSchema,
} from "./schemas/chat";
export type {
  EmbeddingSchema,
  EmbeddingConfigSchema,
} from "./schemas/embedding";
export type {
  RAGResultSchema,
  RAGConfigSchema,
  RAGQuerySchema,
  RAGQueryOptionsSchema,
  DocumentIdParamsSchema,
} from "./schemas/rag";
export type {
  MCPToolSchema,
  MCPRequestSchema,
  MCPResponseSchema,
  MCPErrorSchema,
  MCPCapabilitySchema,
} from "./schemas/mcp";
export type {
  FileTypeResultSchema,
  FileSizeSchema,
  UploadOptionsSchema,
} from "./schemas/storage";
export type {
  ApiKeySchema,
  AuditLogSchema,
  BillingPlanSchema,
  SubscriptionSchema,
  InvitationSchema,
  NotificationSchema,
  PermissionSchema,
  RateLimitSchema,
  WebhookSchema,
} from "./schemas/platform";
