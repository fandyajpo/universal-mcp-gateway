import { NextRequest, NextResponse } from "next/server";

import { badRequest, getAuthHeaders, ragQuerySchema, serverError, unauthorized } from "../schema";
import { createLogger } from "@repo/logger";
import { createRAGEngine } from "@repo/rag";
import { validateBody } from "@repo/validation";

const logger = createLogger("api/rag/query");

const engine = createRAGEngine(
  {
    embedText: () => {
      throw new Error("embedText not implemented — Phase 07 required");
    },
    retrieve: () => {
      throw new Error("retrieve not implemented — Phase 08.03 required");
    },
    rerank: () => {
      throw new Error("rerank not implemented — Phase 08.05 required");
    },
  },
  { middleware: [] },
);

export const runtime = "nodejs";

export async function POST(request: NextRequest): Promise<NextResponse> {
  const auth = getAuthHeaders(request);
  if (!auth) return unauthorized();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return badRequest("Invalid JSON body");
  }

  const parsed = validateBody(ragQuerySchema, body);
  if (!parsed.success) {
    return badRequest("Validation failed", parsed.error.issues);
  }

  const { query, workspaceId, options } = parsed.data;

  if (workspaceId !== auth.workspaceId) {
    logger.warn(
      { requestWorkspaceId: workspaceId, userWorkspaceId: auth.workspaceId },
      "Workspace mismatch",
    );
    return NextResponse.json(
      { error: { code: "FORBIDDEN", message: "Workspace access denied" } },
      { status: 403 },
    );
  }

  try {
    const result = await engine.ragQuery(query, {
      workspaceId,
      strategy: options?.strategy,
      rerank: options?.rerank,
      topK: options?.topK,
      topN: options?.topN,
      filters: options?.filters,
      conversationHistory: options?.conversationHistory,
      systemInstructions: options?.systemInstructions,
    });

    return NextResponse.json(result);
  } catch (error) {
    logger.error({ error, workspaceId }, "RAG query failed");
    return serverError(error);
  }
}
