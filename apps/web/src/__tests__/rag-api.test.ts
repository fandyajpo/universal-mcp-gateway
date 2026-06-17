import { describe, it, expect, vi, beforeAll } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@repo/rag", () => ({
  createRAGEngine: () => ({
    ragQuery: vi.fn().mockRejectedValue(
      new Error("embedText not implemented — Phase 07 required"),
    ),
  }),
}));

vi.mock("@repo/logger", () => ({
  createLogger: () => ({
    warn: vi.fn(),
    error: vi.fn(),
  }),
}));

vi.mock("@repo/validation", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@repo/validation")>();
  return {
    ...actual,
    validateBody: vi.fn().mockImplementation(
      (_schema: unknown, data: unknown) => {
        const body = data as Record<string, unknown>;
        if (!body.query || typeof body.query !== "string") {
          return {
            success: false,
            error: { issues: [{ message: "Query is required" }] },
          };
        }
        return {
          success: true,
          data: {
            query: body.query,
            workspaceId: body.workspaceId,
            options: body.options,
          },
        };
      },
    ),
  };
});

let POST: typeof import("../app/api/rag/query/route").POST;

beforeAll(async () => {
  const mod = await import("../app/api/rag/query/route");
  POST = mod.POST;
});

function makeRequest(
  body: unknown,
  headers?: Record<string, string>,
): NextRequest {
  const url = new URL("http://localhost:3000/api/rag/query");
  const init: RequestInit & { headers: Record<string, string> } = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    body: JSON.stringify(body),
  };
  return new NextRequest(url, init);
}

describe("POST /api/rag/query", () => {
  it("returns 401 without auth headers", async () => {
    const request = makeRequest(
      { query: "test", workspaceId: "ws-1" },
      {},
    );

    const response = await POST(request);
    expect(response.status).toBe(401);

    const body = await response.json();
    expect(body.error.code).toBe("UNAUTHORIZED");
  });

  it("returns 403 on workspace mismatch", async () => {
    const request = makeRequest(
      { query: "test", workspaceId: "ws-2" },
      { "x-user-id": "user-1", "x-workspace-id": "ws-1" },
    );

    const response = await POST(request);
    expect(response.status).toBe(403);

    const body = await response.json();
    expect(body.error.code).toBe("FORBIDDEN");
  });

  it("returns 400 for invalid JSON body", async () => {
    const request = new NextRequest(
      new URL("http://localhost:3000/api/rag/query"),
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": "user-1",
          "x-workspace-id": "ws-1",
        },
        body: "not-json",
      },
    );

    const response = await POST(request);
    expect(response.status).toBe(400);

    const body = await response.json();
    expect(body.error.code).toBe("VALIDATION_ERROR");
  });

  it("returns 500 for unimplemented engine", async () => {
    const request = makeRequest(
      { query: "test query", workspaceId: "ws-1" },
      { "x-user-id": "user-1", "x-workspace-id": "ws-1" },
    );

    const response = await POST(request);
    expect(response.status).toBe(500);

    const body = await response.json();
    expect(body.error.code).toBe("INTERNAL_ERROR");
  });

  it("accepts optional query options", async () => {
    const request = makeRequest(
      {
        query: "test",
        workspaceId: "ws-1",
        options: {
          strategy: "hybrid",
          rerank: true,
          topK: 20,
          topN: 5,
        },
      },
      { "x-user-id": "user-1", "x-workspace-id": "ws-1" },
    );

    const response = await POST(request);
    expect(response.status).toBe(500);
  });
});
