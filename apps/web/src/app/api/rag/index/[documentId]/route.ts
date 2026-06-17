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

const logger = createLogger("api/rag/index-delete");

export const runtime = "nodejs";

export async function DELETE(
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
      chunksDeleted: 0,
    };
    return Response.json(result);
  } catch (error) {
    logger.error({ error, documentId }, "Failed to delete document index");
    return serverError(error);
  }
}
