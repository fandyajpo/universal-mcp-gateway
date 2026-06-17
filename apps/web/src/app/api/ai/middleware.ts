import { NextResponse } from "next/server";

export interface AiAuthContext {
  userId: string;
  workspaceId: string;
}

export function getAiAuthContext(request: Request): AiAuthContext | null {
  const userId = request.headers.get("x-user-id");
  const workspaceId = request.headers.get("x-workspace-id");
  if (!userId || !workspaceId) return null;
  return { userId, workspaceId };
}

export function unauthorizedResponse(): NextResponse {
  return NextResponse.json(
    { error: { code: "UNAUTHORIZED", message: "Authentication required" } },
    { status: 401 },
  );
}

export function rateLimitedResponse(): NextResponse {
  return NextResponse.json(
    { error: { code: "RATE_LIMITED", message: "Too many requests" } },
    { status: 429, headers: { "Retry-After": "60" } },
  );
}

export function badRequestResponse(message: string, details?: unknown): NextResponse {
  return NextResponse.json(
    { error: { code: "VALIDATION_ERROR", message, details } },
    { status: 400 },
  );
}

export function serverErrorResponse(error: unknown): NextResponse {
  const message = error instanceof Error ? error.message : "Internal server error";
  return NextResponse.json(
    { error: { code: "INTERNAL_ERROR", message } },
    { status: 500 },
  );
}

export function notFoundResponse(message = "Resource not found"): NextResponse {
  return NextResponse.json(
    { error: { code: "NOT_FOUND", message } },
    { status: 404 },
  );
}
