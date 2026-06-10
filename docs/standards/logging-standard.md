# Logging Standard

## Logger

Use `@repo/logger` exclusively. Never use `console.log`, `console.error`, or `process.stdout`.

## Log Levels

| Level | When to Use |
|---|---|
| `fatal` | Service is about to crash |
| `error` | Request failed, operation failed |
| `warn` | Unexpected but handled, degraded state |
| `info` | Normal operations (startup, shutdown, state changes) |
| `debug` | Development debugging only |
| `trace` | Detailed tracing (rarely used) |

## Context

Every log line must include:
- `correlationId` — request tracing ID
- `tenantId` — tenant context (if applicable)
- `userId` — user context (if applicable)
- `service` — service/module name

## Structured Logging

```typescript
logger.info({ correlationId, tenantId, userId, duration: 150 }, "Request completed");
// NOT: logger.info(`Request completed for user ${userId}`);
```

## What to Log

- Request start/completion with duration
- Database queries (slow queries at warn level)
- Auth events (login, logout, failed attempts)
- State mutations (create, update, delete)
- External API calls (OpenRouter, R2, Redis)
- Errors with stack traces
- Rate limit hits

## What NOT to Log

- Passwords, secrets, API keys
- Tokens, session IDs
- Personal data (PII)
- Full request/response bodies (metadata only)
- Binary data
