import { NextResponse } from "next/server";

import { z } from "zod";

import { ragQuerySchema, documentIdParamsSchema } from "@repo/validation";

export { ragQuerySchema, documentIdParamsSchema };

export const reindexParamsSchema = documentIdParamsSchema;
export const deleteIndexParamsSchema = documentIdParamsSchema;

export function getAuthHeaders(request: Request): { userId: string; workspaceId: string } | null {
  const userId = request.headers.get("x-user-id");
  const workspaceId = request.headers.get("x-workspace-id");
  if (!userId || !workspaceId) return null;
  return { userId, workspaceId };
}

export function parseParams<T>(
  schema: z.ZodType<T>,
  params: Record<string, string | undefined>,
): { success: true; data: T } | { success: false; error: z.ZodError } {
  const result = schema.safeParse(params);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: result.error };
}

export function unauthorized(): NextResponse {
  return NextResponse.json(
    { error: { code: "UNAUTHORIZED", message: "Authentication required" } },
    { status: 401 },
  );
}

export function forbidden(): NextResponse {
  return NextResponse.json(
    { error: { code: "FORBIDDEN", message: "Insufficient permissions" } },
    { status: 403 },
  );
}

export function badRequest(message: string, details?: unknown): NextResponse {
  return NextResponse.json(
    { error: { code: "VALIDATION_ERROR", message, details } },
    { status: 400 },
  );
}

export function notFound(message = "Resource not found"): NextResponse {
  return NextResponse.json(
    { error: { code: "NOT_FOUND", message } },
    { status: 404 },
  );
}

export function rateLimited(retryAfter: number): NextResponse {
  return NextResponse.json(
    { error: { code: "RATE_LIMITED", message: "Too many requests" } },
    { status: 429, headers: { "Retry-After": String(retryAfter) } },
  );
}

export function serverError(error: unknown): NextResponse {
  const message = error instanceof Error ? error.message : "Internal server error";
  return NextResponse.json(
    { error: { code: "INTERNAL_ERROR", message } },
    { status: 500 },
  );
}
