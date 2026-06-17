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

const logger = createLogger("api/rag/reindex");

export const runtime = "nodejs";

export async function POST(
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
    const result = {
      documentId,
      status: "reindexing" as const,
    };
    return Response.json(result);
  } catch (error) {
    logger.error({ error, documentId }, "Failed to trigger re-indexing");
    return serverError(error);
  }
}
