export class OpenRouterError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code: string,
  ) {
    super(message);
    this.name = "OpenRouterError";
  }
}

export class RateLimitError extends OpenRouterError {
  constructor(
    message: string,
    public readonly retryAfter?: number,
  ) {
    super(message, 429, "rate_limited");
    this.name = "RateLimitError";
  }
}

export class TimeoutError extends OpenRouterError {
  constructor(message: string) {
    super(message, 0, "timeout");
    this.name = "TimeoutError";
  }
}

export class AuthError extends OpenRouterError {
  constructor(message: string) {
    super(message, 401, "auth_error");
    this.name = "AuthError";
  }
}

export class ServerError extends OpenRouterError {
  constructor(message: string, status: number) {
    super(message, status, "server_error");
    this.name = "ServerError";
  }
}

export class InvalidRequestError extends OpenRouterError {
  constructor(message: string, status: number, code = "invalid_request") {
    super(message, status, code);
    this.name = "InvalidRequestError";
  }
}

export type ErrorCategory =
  | "rate_limited"
  | "timeout"
  | "auth_error"
  | "server_error"
  | "invalid_request"
  | "unknown";

export function classifyError(
  status: number,
  body: Record<string, unknown>,
): OpenRouterError {
  const errorBody = body.error as Record<string, unknown> | undefined;
  const message =
    typeof errorBody?.message === "string"
      ? errorBody.message
      : `OpenRouter API error (${status})`;
  const code =
    typeof errorBody?.code === "string" ? errorBody.code : "unknown";

  switch (status) {
    case 429: {
      const retryAfter =
        typeof body.retry_after === "number" ? body.retry_after : undefined;
      return new RateLimitError(message, retryAfter);
    }
    case 401:
      return new AuthError(message);
    case 403:
      return new AuthError(message);
    case 400:
    case 404:
    case 422:
      return new InvalidRequestError(message, status, code);
    default:
      if (status >= 500) {
        return new ServerError(message, status);
      }
      return new InvalidRequestError(message, status, "unknown");
  }
}

export function isRetryableError(error: unknown): boolean {
  if (error instanceof RateLimitError) return true;
  if (error instanceof ServerError) return true;
  if (error instanceof TimeoutError) return true;
  return false;
}
