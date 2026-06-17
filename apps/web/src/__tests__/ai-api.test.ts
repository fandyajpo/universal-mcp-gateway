import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

import { POST as chatPost } from "../app/api/ai/chat/route";
import { POST as streamPost } from "../app/api/ai/chat/stream/route";
import { GET as modelsGet } from "../app/api/ai/models/route";

vi.mock("@repo/logger", () => ({
  default: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("../app/api/ai/middleware", () => ({
  withAuth: vi.fn().mockImplementation((handler) => handler),
}));

vi.mock("../app/api/ai/schema", () => ({
  validateChatRequest: vi.fn().mockImplementation((body: unknown) => body),
  validateEmbedRequest: vi.fn().mockImplementation((body: unknown) => body),
}));

vi.mock("@repo/ai", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...(actual as Record<string, unknown>),
    createRateLimiter: () => ({
      check: vi.fn().mockResolvedValue({ allowed: true, remaining: 10, resetAt: 0 }),
    }),
  };
});

function createMockRequest(body: unknown, headers?: Record<string, string>): NextRequest {
  return {
    json: vi.fn().mockResolvedValue(body),
    headers: new Map(Object.entries(headers ?? {})),
    method: "POST",
  } as unknown as NextRequest;
}

describe("AI API Routes", () => {
  describe("POST /api/ai/chat", () => {
    it("returns 400 for missing messages", async () => {
      const req = createMockRequest({});
      const res = await chatPost(req);

      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toBeDefined();
    });

    it("returns 200 for valid chat request", async () => {
      const req = createMockRequest({
        messages: [{ role: "user", content: "Hello" }],
        model: "openai/gpt-4o-mini",
      });

      const res = await chatPost(req);

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toBeDefined();
    });
  });

  describe("POST /api/ai/chat/stream", () => {
    it("returns 400 for missing messages", async () => {
      const req = createMockRequest({});
      const res = await streamPost(req);

      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toBeDefined();
    });

    it("returns 200 for valid stream request", async () => {
      const req = createMockRequest({
        messages: [{ role: "user", content: "Hello" }],
        model: "openai/gpt-4o-mini",
      });

      const res = await streamPost(req);

      expect(res.status).toBe(200);
      expect(res.headers.get("content-type")).toContain("text/event-stream");
    });
  });

  describe("GET /api/ai/models", () => {
    it("returns a list of models", async () => {
      const req = { headers: new Map() } as unknown as NextRequest;
      const res = await modelsGet(req);

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.data).toBeDefined();
      expect(Array.isArray(body.data)).toBe(true);
    });
  });
});
