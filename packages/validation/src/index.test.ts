import { describe, it, expect } from "vitest";
import { z } from "zod";

import {
  slugSchema,
  emailSchema,
  urlSchema,
  uuidSchema,
  passwordSchema,
  hexColorSchema,
  userSchema,
  sessionSchema,
  workspaceSchema,
  workspaceRoleSchema,
  documentSchema,
  documentChunkSchema,
  connectorSchema,
  agentSchema,
  chatMessageSchema,
  chatThreadSchema,
  embeddingSchema,
  ragConfigSchema,
  mcpToolSchema,
  mcpRequestSchema,
  mcpResponseSchema,
  apiKeySchema,
  auditLogSchema,
  billingPlanSchema,
  webhookSchema,
  validateBody,
  validateQuery,
  validateParams,
  validateAction,
} from "./index";

// ── Primitives ─────────────────────────────────────

describe("slugSchema", () => {
  it("accepts valid slugs", () => {
    expect(slugSchema.parse("my-workspace")).toBe("my-workspace");
    expect(slugSchema.parse("test123")).toBe("test123");
    expect(slugSchema.parse("a-b-c")).toBe("a-b-c");
  });

  it("rejects invalid slugs", () => {
    expect(() => slugSchema.parse("My Workspace")).toThrow();
    expect(() => slugSchema.parse("UPPERCASE")).toThrow();
    expect(() => slugSchema.parse("ab")).toThrow();
    expect(() => slugSchema.parse("")).toThrow();
  });
});

describe("emailSchema", () => {
  it("accepts valid emails", () => {
    expect(emailSchema.parse("test@example.com")).toBe("test@example.com");
    expect(emailSchema.parse("user+tag@domain.co")).toBe("user+tag@domain.co");
  });

  it("rejects invalid emails", () => {
    expect(() => emailSchema.parse("not-an-email")).toThrow();
    expect(() => emailSchema.parse("")).toThrow();
  });

  it("transforms to lowercase", () => {
    expect(emailSchema.parse("Test@Example.COM")).toBe("test@example.com");
  });
});

describe("passwordSchema", () => {
  it("accepts strong passwords", () => {
    expect(passwordSchema.parse("StrongPass1")).toBe("StrongPass1");
    expect(passwordSchema.parse("Abcdefg1!")).toBe("Abcdefg1!");
  });

  it("rejects short passwords", () => {
    expect(() => passwordSchema.parse("Ab1")).toThrow();
  });

  it("rejects passwords without uppercase", () => {
    expect(() => passwordSchema.parse("abcdefgh1")).toThrow();
  });

  it("rejects passwords without lowercase", () => {
    expect(() => passwordSchema.parse("ABCDEFGH1")).toThrow();
  });

  it("rejects passwords without numbers", () => {
    expect(() => passwordSchema.parse("Abcdefgh")).toThrow();
  });
});

describe("urlSchema", () => {
  it("accepts valid URLs", () => {
    expect(urlSchema.parse("https://example.com")).toBe("https://example.com");
    expect(urlSchema.parse("http://localhost:3000/path")).toBe("http://localhost:3000/path");
  });

  it("rejects invalid URLs", () => {
    expect(() => urlSchema.parse("not-a-url")).toThrow();
  });
});

describe("uuidSchema", () => {
  it("accepts valid UUIDs", () => {
    expect(uuidSchema.parse("550e8400-e29b-41d4-a716-446655440000")).toBe("550e8400-e29b-41d4-a716-446655440000");
  });

  it("rejects invalid UUIDs", () => {
    expect(() => uuidSchema.parse("not-a-uuid")).toThrow();
  });
});

describe("hexColorSchema", () => {
  it("accepts valid hex colors", () => {
    expect(hexColorSchema.parse("#FF0000")).toBe("#FF0000");
    expect(hexColorSchema.parse("#ffffff")).toBe("#ffffff");
  });

  it("rejects invalid hex colors", () => {
    expect(() => hexColorSchema.parse("red")).toThrow();
    expect(() => hexColorSchema.parse("#FFF")).toThrow();
  });
});

// ── Auth Schemas ───────────────────────────────────

describe("userSchema", () => {
  const validUser = {
    id: "usr-1",
    email: "user@example.com",
    name: "Test User",
    isActive: true,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
  };

  it("accepts valid user data", () => {
    expect(() => userSchema.parse(validUser)).not.toThrow();
  });

  it("rejects missing required fields", () => {
    expect(() => userSchema.parse({})).toThrow();
  });

  it("strips unknown fields", () => {
    const result = userSchema.parse({ ...validUser, unknownField: "should-be-stripped" });
    expect(result).not.toHaveProperty("unknownField");
  });

  it("rejects HTML in name", () => {
    expect(() => userSchema.parse({ ...validUser, name: "<script>alert('xss')</script>" })).toThrow();
  });
});

describe("sessionSchema", () => {
  it("accepts valid session data", () => {
    expect(() =>
      sessionSchema.parse({
        id: "sess-1",
        userId: "usr-1",
        token: "tok-123",
        expiresAt: new Date(),
        createdAt: new Date(),
      }),
    ).not.toThrow();
  });
});

describe("workspaceSchema", () => {
  it("accepts valid workspace data", () => {
    expect(() =>
      workspaceSchema.parse({
        id: "ws-1",
        name: "My Workspace",
        slug: "my-workspace",
        ownerId: "usr-1",
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
    ).not.toThrow();
  });

  it("rejects invalid slug", () => {
    expect(() =>
      workspaceSchema.parse({
        id: "ws-1",
        name: "My Workspace",
        slug: "Invalid Slug!",
        ownerId: "usr-1",
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
    ).toThrow();
  });
});

describe("workspaceRoleSchema", () => {
  it("accepts valid roles", () => {
    expect(workspaceRoleSchema.parse("owner")).toBe("owner");
    expect(workspaceRoleSchema.parse("admin")).toBe("admin");
    expect(workspaceRoleSchema.parse("member")).toBe("member");
    expect(workspaceRoleSchema.parse("viewer")).toBe("viewer");
  });

  it("rejects invalid roles", () => {
    expect(() => workspaceRoleSchema.parse("superadmin")).toThrow();
  });
});

// ── Document Schemas ───────────────────────────────

describe("documentSchema", () => {
  const validDoc = {
    id: "doc-1",
    workspaceId: "ws-1",
    title: "Test Document",
    metadata: {},
    source: { type: "manual" },
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  it("accepts valid document data", () => {
    expect(() => documentSchema.parse(validDoc)).not.toThrow();
  });

  it("rejects missing required fields", () => {
    expect(() => documentSchema.parse({})).toThrow();
  });

  it("rejects HTML in title", () => {
    expect(() => documentSchema.parse({ ...validDoc, title: "<b>bold</b>" })).toThrow();
  });
});

describe("documentChunkSchema", () => {
  it("accepts valid chunk data", () => {
    expect(() =>
      documentChunkSchema.parse({
        id: "chunk-1",
        documentId: "doc-1",
        content: "This is a chunk of text",
        index: 0,
        metadata: {},
      }),
    ).not.toThrow();
  });

  it("accepts chunk with embedding", () => {
    expect(() =>
      documentChunkSchema.parse({
        id: "chunk-1",
        documentId: "doc-1",
        content: "text",
        index: 0,
        embedding: [0.1, 0.2, 0.3],
        metadata: {},
      }),
    ).not.toThrow();
  });
});

// ── Connector Schemas ──────────────────────────────

describe("connectorSchema", () => {
  it("accepts valid connector data", () => {
    expect(() =>
      connectorSchema.parse({
        id: "conn-1",
        workspaceId: "ws-1",
        name: "Slack",
        type: "slack",
        config: {},
        status: "disconnected",
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
    ).not.toThrow();
  });

  it("rejects invalid connector type", () => {
    expect(() =>
      connectorSchema.parse({
        id: "conn-1",
        workspaceId: "ws-1",
        name: "Unknown",
        type: "invalid_type",
        config: {},
        status: "disconnected",
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
    ).toThrow();
  });
});

// ── Agent Schemas ──────────────────────────────────

describe("agentSchema", () => {
  it("accepts valid agent data", () => {
    expect(() =>
      agentSchema.parse({
        id: "agent-1",
        workspaceId: "ws-1",
        name: "Test Agent",
        config: {
          model: "gpt-4",
          instructions: "Be helpful",
          temperature: 0.7,
          maxTokens: 2048,
        },
        status: "inactive",
        tools: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
    ).not.toThrow();
  });

  it("rejects missing required config fields", () => {
    expect(() =>
      agentSchema.parse({
        id: "agent-1",
        workspaceId: "ws-1",
        name: "Test",
        config: {},
        status: "inactive",
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
    ).toThrow();
  });
});

// ── Chat Schemas ───────────────────────────────────

describe("chatMessageSchema", () => {
  it("accepts valid message data", () => {
    expect(() =>
      chatMessageSchema.parse({
        id: "msg-1",
        threadId: "thread-1",
        role: "user",
        content: "Hello!",
        createdAt: new Date(),
      }),
    ).not.toThrow();
  });
});

describe("chatThreadSchema", () => {
  it("accepts valid thread data", () => {
    expect(() =>
      chatThreadSchema.parse({
        id: "thread-1",
        workspaceId: "ws-1",
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
    ).not.toThrow();
  });
});

// ── Embedding Schemas ──────────────────────────────

describe("embeddingSchema", () => {
  it("accepts valid embedding data", () => {
    expect(() =>
      embeddingSchema.parse({
        vector: [0.1, 0.2, 0.3],
        model: "text-embedding-3",
        dimensions: 3,
      }),
    ).not.toThrow();
  });

  it("rejects empty vector", () => {
    expect(() =>
      embeddingSchema.parse({
        vector: [],
        model: "text-embedding-3",
        dimensions: 0,
      }),
    ).toThrow();
  });
});

// ── RAG Schemas ────────────────────────────────────

describe("ragConfigSchema", () => {
  it("accepts valid RAG config", () => {
    expect(() =>
      ragConfigSchema.parse({
        strategy: "hybrid",
        chunkStrategy: "semantic",
        topK: 10,
      }),
    ).not.toThrow();
  });

  it("applies default topK", () => {
    const result = ragConfigSchema.parse({
      strategy: "semantic",
      chunkStrategy: "fixed",
    });
    expect(result.topK).toBe(10);
  });
});

// ── MCP Schemas ────────────────────────────────────

describe("mcpToolSchema", () => {
  it("accepts valid MCP tool", () => {
    expect(() =>
      mcpToolSchema.parse({
        name: "get_weather",
        inputSchema: {},
      }),
    ).not.toThrow();
  });
});

describe("mcpRequestSchema", () => {
  it("accepts valid MCP request", () => {
    expect(() =>
      mcpRequestSchema.parse({
        id: "req-1",
        method: "tools/list",
      }),
    ).not.toThrow();
  });
});

describe("mcpResponseSchema", () => {
  it("accepts valid MCP response", () => {
    expect(() =>
      mcpResponseSchema.parse({
        id: "req-1",
        result: { tools: [] },
      }),
    ).not.toThrow();
  });
});

// ── Platform Schemas ───────────────────────────────

describe("apiKeySchema", () => {
  it("accepts valid API key data", () => {
    expect(() =>
      apiKeySchema.parse({
        id: "ak-1",
        workspaceId: "ws-1",
        name: "Test Key",
        key: "sk-...",
        scopes: ["read"],
        isActive: true,
        createdAt: new Date(),
      }),
    ).not.toThrow();
  });

  it("rejects empty scopes", () => {
    expect(() =>
      apiKeySchema.parse({
        id: "ak-1",
        workspaceId: "ws-1",
        name: "Test",
        key: "sk-...",
        scopes: [],
        isActive: true,
        createdAt: new Date(),
      }),
    ).toThrow();
  });
});

describe("auditLogSchema", () => {
  it("accepts valid audit log", () => {
    expect(() =>
      auditLogSchema.parse({
        id: "log-1",
        workspaceId: "ws-1",
        action: "create",
        actorId: "usr-1",
        createdAt: new Date(),
      }),
    ).not.toThrow();
  });
});

describe("billingPlanSchema", () => {
  it("accepts valid billing plan", () => {
    expect(() =>
      billingPlanSchema.parse({
        id: "plan-1",
        name: "Pro",
        price: 29.99,
        currency: "USD",
        features: ["feature1", "feature2"],
        isActive: true,
      }),
    ).not.toThrow();
  });
});

describe("webhookSchema", () => {
  it("accepts valid webhook", () => {
    expect(() =>
      webhookSchema.parse({
        id: "wh-1",
        workspaceId: "ws-1",
        url: "https://example.com/hook",
        events: ["document.created"],
        isActive: true,
        createdAt: new Date(),
      }),
    ).not.toThrow();
  });
});

// ── Validation Helpers ─────────────────────────────

describe("validateBody", () => {
  const testSchema = z.object({ name: z.string(), age: z.number() }).strip();

  it("returns success for valid data", () => {
    const result = validateBody(testSchema, { name: "Alice", age: 30 });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe("Alice");
    }
  });

  it("strips unknown fields", () => {
    const result = validateBody(testSchema, { name: "Bob", age: 25, extra: "should-be-stripped" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).not.toHaveProperty("extra");
    }
  });

  it("returns error for invalid data", () => {
    const result = validateBody(testSchema, { name: 123 });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBeDefined();
    }
  });
});

describe("validateQuery", () => {
  const querySchema = z.object({ page: z.coerce.number().int(), limit: z.coerce.number().int().optional() }).strip();

  it("parses URLSearchParams", () => {
    const params = new URLSearchParams("page=1&limit=10");
    const result = validateQuery(querySchema, params);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(1);
      expect(result.data.limit).toBe(10);
    }
  });

  it("parses record objects", () => {
    const result = validateQuery(querySchema, { page: "2" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(2);
    }
  });
});

describe("validateParams", () => {
  it("validates route params", () => {
    const paramSchema = z.object({ id: z.string().min(1) }).strip();
    const result = validateParams(paramSchema, { id: "abc-123" });
    expect(result.success).toBe(true);
  });
});

describe("validateAction", () => {
  it("validates plain objects", () => {
    const actionSchema = z.object({ email: z.string().email() }).strip();
    const result = validateAction(actionSchema, { email: "test@example.com" });
    expect(result.success).toBe(true);
  });

  it("validates FormData", () => {
    const actionSchema = z.object({ name: z.string() }).strip();
    const fd = new FormData();
    fd.append("name", "Alice");
    const result = validateAction(actionSchema, fd);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe("Alice");
    }
  });
});

// ── Inferred Types Match ───────────────────────────

describe("inferred types", () => {
  it("userSchema infers type with required fields", () => {
    const schema = userSchema;
    const data = {
      id: "u-1",
      email: "test@example.com",
      name: "Test",
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const parsed = schema.parse(data);
    // Type-level check: parsed should match the expected shape
    expect(parsed.email).toBe("test@example.com");
    expect(typeof parsed.isActive).toBe("boolean");
  });
});
