import { describe, it, expect } from "vitest";

import type {
  DeepPartial,
  Nullable,
  Optional,
  AsyncReturnType,
  Brand,
  UserId,
  WorkspaceId,
  TenantId,
  User,
  Workspace,
  Document,
  Connector,
  Agent,
  ChatThread,
  MCPTool,
  ApiKey,
} from "./index";
import {
  WorkspaceRole,
  ConnectorType,
  ConnectorStatus,
  AgentStatus,
  ChatRole,
  RetrievalStrategy,
  ChunkStrategy,
  AuditAction,
  ApiKeyScope,
  FeatureFlag,
} from "./index";

describe("Branded IDs", () => {
  it("UserId should not be assignable to WorkspaceId", () => {
    const userId = "user-1" as UserId;
    // @ts-expect-error — UserId must not be assignable to WorkspaceId
    const _check: WorkspaceId = userId;
    void _check;
  });

  it("TenantId should be aliased to WorkspaceId", () => {
    const workspaceId = "ws-1" as WorkspaceId;
    const tenantId: TenantId = workspaceId;
    expect(typeof tenantId).toBe("string");
  });
});

describe("Utility types", () => {
  it("DeepPartial should make all properties optional recursively", () => {
    type TestDeep = DeepPartial<{ a: { b: string; c: number } }>;
    const val: TestDeep = { a: { b: "test" } };
    expect(val).toEqual({ a: { b: "test" } });
  });

  it("Nullable should accept T, null, or undefined", () => {
    const v1: Nullable<string> = "hello";
    const v2: Nullable<string> = null;
    const v3: Nullable<string> = undefined;
    expect(v1).toBe("hello");
    expect(v2).toBeNull();
    expect(v3).toBeUndefined();
  });

  it("Optional should accept T or undefined", () => {
    const v1: Optional<string> = "hello";
    const v2: Optional<string> = undefined;
    expect(v1).toBe("hello");
    expect(v2).toBeUndefined();
  });

  it("AsyncReturnType should unwrap Promise", () => {
    type Result = AsyncReturnType<() => Promise<string>>;
    const val: Result = "done";
    expect(val).toBe("done");
  });

  it("Brand should create branded types", () => {
    const branded = "test" as Brand<string, "test">;
    expect(typeof branded).toBe("string");
  });
});

describe("Enums", () => {
  it("WorkspaceRole should contain expected values", () => {
    expect(WorkspaceRole.Owner).toBe("owner");
    expect(WorkspaceRole.Admin).toBe("admin");
    expect(WorkspaceRole.Member).toBe("member");
    expect(WorkspaceRole.Viewer).toBe("viewer");
  });

  it("ConnectorType should contain expected values", () => {
    expect(ConnectorType.Slack).toBe("slack");
    expect(ConnectorType.GoogleDrive).toBe("google_drive");
    expect(ConnectorType.Notion).toBe("notion");
    expect(ConnectorType.Confluence).toBe("confluence");
    expect(ConnectorType.Github).toBe("github");
    expect(ConnectorType.Custom).toBe("custom");
  });

  it("ConnectorStatus should contain expected values", () => {
    expect(ConnectorStatus.Connected).toBe("connected");
    expect(ConnectorStatus.Disconnected).toBe("disconnected");
    expect(ConnectorStatus.Error).toBe("error");
    expect(ConnectorStatus.Syncing).toBe("syncing");
  });

  it("AgentStatus should contain expected values", () => {
    expect(AgentStatus.Active).toBe("active");
    expect(AgentStatus.Inactive).toBe("inactive");
    expect(AgentStatus.Error).toBe("error");
    expect(AgentStatus.Training).toBe("training");
  });

  it("ChatRole should contain expected values", () => {
    expect(ChatRole.User).toBe("user");
    expect(ChatRole.Assistant).toBe("assistant");
    expect(ChatRole.System).toBe("system");
  });

  it("RetrievalStrategy should contain expected values", () => {
    expect(RetrievalStrategy.Semantic).toBe("semantic");
    expect(RetrievalStrategy.Keyword).toBe("keyword");
    expect(RetrievalStrategy.Hybrid).toBe("hybrid");
    expect(RetrievalStrategy.Rerank).toBe("rerank");
  });

  it("ChunkStrategy should contain expected values", () => {
    expect(ChunkStrategy.Fixed).toBe("fixed");
    expect(ChunkStrategy.Semantic).toBe("semantic");
    expect(ChunkStrategy.Recursive).toBe("recursive");
    expect(ChunkStrategy.Hybrid).toBe("hybrid");
  });

  it("AuditAction should contain expected values", () => {
    expect(AuditAction.Create).toBe("create");
    expect(AuditAction.Update).toBe("update");
    expect(AuditAction.Delete).toBe("delete");
    expect(AuditAction.Read).toBe("read");
    expect(AuditAction.Login).toBe("login");
    expect(AuditAction.Logout).toBe("logout");
    expect(AuditAction.Invite).toBe("invite");
    expect(AuditAction.Remove).toBe("remove");
  });

  it("ApiKeyScope should contain expected values", () => {
    expect(ApiKeyScope.Read).toBe("read");
    expect(ApiKeyScope.Write).toBe("write");
    expect(ApiKeyScope.Admin).toBe("admin");
  });

  it("FeatureFlag should contain expected values", () => {
    expect(FeatureFlag.AiGateway).toBe("ai_gateway");
    expect(FeatureFlag.McpGateway).toBe("mcp_gateway");
    expect(FeatureFlag.RagEngine).toBe("rag_engine");
    expect(FeatureFlag.AdvancedAnalytics).toBe("advanced_analytics");
    expect(FeatureFlag.CustomBranding).toBe("custom_branding");
    expect(FeatureFlag.Sso).toBe("sso");
  });
});

describe("Model interfaces", () => {
  it("User should be constructible with required fields", () => {
    const user: User = {
      id: "u-1" as UserId,
      email: "test@example.com",
      name: "Test User",
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    expect(user.email).toBe("test@example.com");
  });

  it("Workspace should be constructible with required fields", () => {
    const ws: Workspace = {
      id: "ws-1" as WorkspaceId,
      name: "Test Workspace",
      slug: "test-workspace",
      ownerId: "u-1" as UserId,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    expect(ws.name).toBe("Test Workspace");
  });

  it("Document should be constructible with required fields", () => {
    const doc: Document = {
      id: "d-1" as import("./types/branded").DocumentId,
      workspaceId: "ws-1" as import("./types/branded").WorkspaceId,
      title: "Test Doc",
      metadata: {},
      source: { type: "manual" },
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    expect(doc.title).toBe("Test Doc");
  });

  it("Connector should be constructible with required fields", () => {
    const conn: Connector = {
      id: "c-1" as import("./types/branded").ConnectorId,
      workspaceId: "ws-1" as WorkspaceId,
      name: "Test Connector",
      type: ConnectorType.Custom,
      config: {},
      status: ConnectorStatus.Disconnected,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    expect(conn.name).toBe("Test Connector");
  });

  it("Agent should be constructible with required fields", () => {
    const agent: Agent = {
      id: "a-1" as import("./types/branded").AgentId,
      workspaceId: "ws-1" as WorkspaceId,
      name: "Test Agent",
      config: {
        model: "gpt-4",
        instructions: "Be helpful",
        temperature: 0.7,
        maxTokens: 2048,
      },
      status: AgentStatus.Inactive,
      tools: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    expect(agent.name).toBe("Test Agent");
  });

  it("ChatThread should be constructible with required fields", () => {
    const thread: ChatThread = {
      id: "thread-1",
      workspaceId: "ws-1" as WorkspaceId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    expect(thread.id).toBe("thread-1");
  });

  it("MCPTool should be constructible with required fields", () => {
    const tool: MCPTool = {
      name: "get_weather",
      inputSchema: {},
    };
    expect(tool.name).toBe("get_weather");
  });

  it("ApiKey should be constructible with required fields", () => {
    const apiKey: ApiKey = {
      id: "ak-1" as import("./types/branded").ApiKeyId,
      workspaceId: "ws-1" as WorkspaceId,
      name: "Test Key",
      key: "sk-...",
      scopes: [ApiKeyScope.Read],
      isActive: true,
      createdAt: new Date(),
    };
    expect(apiKey.name).toBe("Test Key");
  });
});
