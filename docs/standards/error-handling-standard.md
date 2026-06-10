# Error Handling Standard

## Error Types

```typescript
class AppError extends Error {
  constructor(
    public code: string,
    public message: string,
    public statusCode: number = 500,
    public details?: unknown,
  ) { super(message); }
}

class ValidationError extends AppError {
  constructor(details: unknown) {
    super("VALIDATION_ERROR", "Validation failed", 400, details);
  }
}

class NotFoundError extends AppError {
  constructor(resource: string) {
    super("NOT_FOUND", `${resource} not found`, 404);
  }
}

class UnauthorizedError extends AppError {
  constructor() {
    super("UNAUTHORIZED", "Authentication required", 401);
  }
}

class ForbiddenError extends AppError {
  constructor() {
    super("FORBIDDEN", "Insufficient permissions", 403);
  }
}

class RateLimitError extends AppError {
  constructor() {
    super("RATE_LIMITED", "Too many requests", 429);
  }
}
```

## Error Handling Pattern

- Services throw typed errors
- Repositories wrap database errors
- API routes catch and format errors
- Server Actions return typed error responses
- Log all errors with correlation ID

## Global Error Handler

```typescript
function handleError(error: unknown, logger: Logger): APIResponse {
  if (error instanceof AppError) {
    return { status: error.statusCode, body: { error: { code: error.code, message: error.message, details: error.details } } };
  }
  logger.error({ error }, "Unhandled error");
  return { status: 500, body: { error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred" } } };
}
```

## Never

- Expose stack traces in production
- Leak internal error details to clients
- Swallow errors silently
- Use error codes for control flow
- Log sensitive data in error context
