# Auth Flow — Recommended Fix Priority Order

## P0 — Critical (Ship-blocking)

| # | Issue | File(s) | Effort |
|---|-------|---------|--------|
| 1 | **Encryption key derivation bug** — `hashString` returns hex, `getKeyBytes` expects base64. MFA TOTP secrets encrypted with wrong key. | `packages/crypto/src/encryption.ts`, `packages/auth/src/services/mfa-service.ts` | 1hr |
| 2 | **Hardcoded dev secrets** — MFA trust token and encryption key fall back to known strings if env vars unset. | `packages/auth/src/services/mfa-service.ts` | 30min |

## P1 — High Priority

| # | Issue | File(s) | Effort |
|---|-------|---------|--------|
| 3 | **Recovery code TOCTOU race** — read-modify-write allows two concurrent requests to consume the same single-use code. | `packages/auth/src/services/mfa-service.ts` | 1hr |
| 4 | **Permission cache invalidation incomplete** — role change deletes role key but leaves stale per-permission entries for up to 5 min. | `packages/auth/src/rbac/cache.ts` | 2hr |
| 5 | **No MFA brute-force protection** — 6-digit TOTP verification has no rate limiting. | `packages/auth/src/services/mfa-service.ts` | 1hr |
| 6 | **Two divergent session cache key formats** — middleware uses `tenant:default:session:{token}`, auth package uses `tenant:{workspaceId}:session:{token}`. Login writes `default` key. | `apps/web/src/lib/middleware/auth.ts`, `packages/auth/src/services/session-cache.ts`, `apps/web/src/actions/auth/login.ts` | 2hr |
| 7 | **Logout does not invalidate Redis cache** — after logout, the session cache entry remains until TTL expiry. Middleware continues to accept it. | logout server action | 1hr |

## P2 — Medium Priority

| # | Issue | File(s) | Effort |
|---|-------|---------|--------|
| 8 | **softDeletePlugin not applied** — defined in `schema.ts` but no model calls it. Queries can return soft-deleted records. | `packages/database/src/schema.ts`, all model files | 2hr |
| 9 | **Direct Mongoose calls bypass repository** — 9+ instances in workspace repo, plus session and user repos use `Model` directly instead of `this.model`. Bypasses tenant scoping + timing wrapper. | `packages/database/src/repositories/workspace.ts`, `session.ts`, `user.ts` | 4hr |
| 10 | **ReDoS in workspace search** — `new RegExp(query, "i")` from unsanitized user input. | `packages/database/src/repositories/workspace.ts` | 30min |
| 11 | **Middleware does not extend session TTL** — active users logged out after static TTL regardless of activity. | `apps/web/src/lib/middleware/auth.ts` | 1hr |

## P3 — Lower Priority

| # | Issue | File(s) | Effort |
|---|-------|---------|--------|
| 12 | **Session service not used on login** — login action writes Redis directly, bypassing `enforceConcurrencyLimit` and `addUserSession`. | `apps/web/src/actions/auth/login.ts`, `packages/auth/src/services/session-service.ts` | 3hr |
| 13 | **Transfer ownership TOCTOU** — reads workspace, checks admin, then updates. Between read and write the target's role can change. | `packages/database/src/repositories/workspace.ts` | 1hr |
| 14 | **Invalidate session TOCTOU** — reads session by token, extracts `_id`, then updates by `_id`. Session could be invalidated between read and write. | `packages/database/src/repositories/session.ts` | 1hr |
| 15 | **Duplicate Redis URL parsing** — identical `redis://` → `https://` conversion in 3 separate files. | `apps/web/src/lib/middleware/auth.ts`, `rate-limit.ts`, `login.ts` | 1hr |
| 16 | **CSP allows `unsafe-eval` + `unsafe-inline`** — weakens XSS protection. | `apps/web/src/lib/middleware/headers.ts` | 1hr |

## P4 — Nice to Have

| # | Issue | File(s) | Effort |
|---|-------|---------|--------|
| 17 | **Duplicate RBAC hierarchy** — `ROLE_HIERARCHY` defined in both `roles.ts` and `service.ts`. Desync risk. | `packages/auth/src/rbac/service.ts` | 30min |
| 18 | **No IP/user-agent binding on session** — stolen cookie is usable from any IP/device. | `apps/web/src/lib/middleware/auth.ts` | 2hr |
| 19 | **Account lockout not atomic** — `incr` + `expire` are separate calls, concurrency can bypass threshold. | `packages/auth/src/services/auth-service.ts` | 1hr |
| 20 | **No `_id` in model interfaces** — forces fragile casts like `as unknown as { _id: unknown }`. | All model files | 2hr |

## P5 — Polish

| # | Issue | File(s) | Effort |
|---|-------|---------|--------|
| 21 | `listSessions` returns empty `email` and `name` — no user data fetch. | `packages/auth/src/services/session-service.ts` | 1hr |
| 22 | Rate limiter failure is fail-open — Redis outage allows unlimited auth requests. | `packages/auth/src/services/auth-service.ts` | 30min |
| 23 | `cleanupExpired` competes with TTL index — both try to clean expired sessions. | `packages/database/src/repositories/session.ts` | 30min |
| 24 | Two aggregation pipelines in `getMembers` — double scan. Use `$facet`. | `packages/database/src/repositories/workspace.ts` | 1hr |
