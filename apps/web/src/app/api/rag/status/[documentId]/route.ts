import { NextRequest } from "next/server";

import {
  badRequest,
  documentIdParamsSchema,
  getAuthHeaders,
  serverError,
  unauthorized,
} from "../../schema";
import { createLogger } from "@repo/logger";
import { validateParams } from "@repo/validation";

const logger = createLogger("api/rag/status");

export const runtime = "nodejs";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ documentId: string }> },
): Promise<Response> {
  const auth = getAuthHeaders(_request);
  if (!auth) return unauthorized();

  const resolvedParams = await params;
  const parsed = validateParams(documentIdParamsSchema, resolvedParams);
  if (!parsed.success) {
    return badRequest("Invalid document ID", parsed.error.issues);
  }

  const { documentId } = parsed.data;

  try {
    const status = {
      documentId,
      status: "processing" as const,
      chunksCount: 0,
      lastIndexedAt: null as string | null,
    };
    return Response.json(status);
  } catch (error) {
    logger.error({ error, documentId }, "Failed to get document indexing status");
    return serverError(error);
  }
}

export async function HEAD(
  _request: NextRequest,
  { params }: { params: Promise<{ documentId: string }> },
): Promise<Response> {
  const resolvedParams = await params;
  const parsed = validateParams(documentIdParamsSchema, resolvedParams);
  if (!parsed.success) {
    return badRequest("Invalid document ID", parsed.error.issues);
  }
  return Response.json({});
}
