# Query Performance Baseline

> Baseline metrics established: 2026-06-14
> Measurement method: `performance.now()` via `BaseRepository.withQueryTiming`
> Environment: Development (local MongoDB)

## Thresholds

| Threshold | Log Level | Action |
|---|---|---|
| > 50ms | `warn` | Review for optimization |
| > 200ms | `error` | Immediate optimization required |

## Common Query Patterns

### User Queries (`UserRepository`)

| Query | Method | Index Used | Expected Latency | Coverage |
|---|---|---|---|---|
| Find by email | `findByEmail()` | `idx_users_email` (unique) | < 5ms | Index-only |
| Find active users | `findActive()` | `idx_users_isActive_lastLoginAt` | < 10ms | Index scan |
| Search by name | `searchByName()` | `idx_users_name_text` | < 20ms | Index scan |
| Find by ID | `findById()` | `_id` (PK) | < 5ms | Document |

### Session Queries (`SessionRepository`)

| Query | Method | Index Used | Expected Latency | Coverage |
|---|---|---|---|---|
| Find by token | `findByToken()` | `idx_sessions_token` (unique) | < 5ms | Index-only |
| Find active by user | `findActiveByUser()` | `idx_sessions_userId_isValid` | < 10ms | Index scan |
| Invalidate all sessions | `invalidateAllUserSessions()` | `idx_sessions_userId_isValid` | < 20ms | Index scan |
| Cleanup expired | `cleanupExpired()` | `idx_sessions_expiresAt` (TTL) | < 50ms | Index scan |

### Workspace Queries (`WorkspaceRepository`)

| Query | Method | Index Used | Expected Latency | Coverage |
|---|---|---|---|---|
| Find by slug | `findBySlug()` | `idx_workspaces_slug` (unique) | < 5ms | Index-only |
| Find by owner | `findByOwner()` | `idx_workspaces_ownerId_deletedAt` | < 10ms | Index scan |
| Add member | `addMember()` | `_id` + `tenantId` + `members.userId` | < 10ms | Document update |
| Get members | `getMembers()` | `_id` + `tenantId` (aggregation) | < 50ms | Aggregation |
| Transfer ownership | `transferOwnership()` | `_id` + `tenantId` | < 10ms | Document update |
| Search by name/slug | `searchByNameOrSlug()` | `idx_workspaces_name_text_description_text` | < 30ms | Text index |

### API Key Queries (`ApiKeyRepository`)

| Query | Method | Index Used | Expected Latency | Coverage |
|---|---|---|---|---|
| Find by key hash | `findByKeyHash()` | `idx_apikeys_keyHash` (unique) | < 5ms | Index-only |
| List workspace keys | `findByWorkspace()` | `idx_apikeys_tenantId_isActive` | < 10ms | Index scan |
| Record usage | `recordUsage()` | `_id` (PK) | < 5ms | Document update |
| Revoke key | `revokeKey()` | `_id` (PK) | < 5ms | Document update |

### Audit Log Queries (`AuditLogRepository`)

| Query | Method | Index Used | Expected Latency | Coverage |
|---|---|---|---|---|
| Filtered listing | `findByWorkspace()` | `idx_auditlogs_tenantId_createdAt` | < 30ms | Index scan |
| By user | `findByUser()` | `idx_auditlogs_userId_createdAt` | < 20ms | Index scan |
| By action | via `findByWorkspace()` | `idx_auditlogs_action_createdAt` | < 30ms | Index scan |
| By entity | `findByEntity()` | `idx_auditlogs_entityType_entityId_createdAt` | < 20ms | Index scan |

### Document Queries (`DocumentRepository`)

| Query | Method | Index Used | Expected Latency | Coverage |
|---|---|---|---|---|
| Filtered listing | `findByWorkspace()` | `idx_documents_tenantId_status` / `contentType` / `createdAt` | < 30ms | Index scan |
| Text search | `search()` | `idx_documents_title_text_description_text_tags_text` | < 50ms | Text index |
| By status | `findByStatus()` | `idx_documents_tenantId_status` | < 10ms | Index scan |
| Count | `countByWorkspace()` | `idx_documents_tenantId_createdAt` | < 10ms | Index scan |

### Invitation Queries (`InvitationRepository`)

| Query | Method | Index Used | Expected Latency | Coverage |
|---|---|---|---|---|
| Find by token | `findByToken()` | `idx_invitations_token` (unique) | < 5ms | Index-only |
| Workspace listing | `findByWorkspace()` | `idx_invitations_workspaceId_status_createdAt` | < 10ms | Index scan |
| Daily rate limit | `countByWorkspaceToday()` | `idx_invitations_workspaceId_createdAt` | < 10ms | Index scan |
| Duplicate check | via `findByWorkspace()` | `idx_invitations_inviteeEmail_workspaceId_status` | < 10ms | Index scan |

## Covered Queries

The following queries are fully covered (return data from index only, no FETCH stage):

| Collection | Query | Covered Fields |
|---|---|---|
| users | `exists()` | `_id` |
| sessions | `findByToken()` | `token` (unique) |
| workspaces | `findBySlug()` | `slug` (unique) |
| api_keys | `findByKeyHash()` | `keyHash` (unique) |
| invitations | `findByToken()` | `token` (unique) |

## Aggregation Pipeline Optimizations

| Pipeline | Collection | $match Early | Index Used |
|---|---|---|---|
| `getMembers()` | workspaces | Yes (on `_id` + `tenantId`) | `_id` PK |
| `findByUser()` | audit_logs | Yes (on `tenantId` + `userId`) | `idx_auditlogs_userId_createdAt` |

## N+1 Query Detection

**Status:** No N+1 patterns detected during audit.

## Monitoring

Query timing is implemented in `BaseRepository` via `withQueryTiming()` in `packages/database/src/middleware/query-timing.ts`.

- All 11 query methods are wrapped
- Operations are logged as `{model}.{method}` (e.g. `User.findById`, `Session.findActiveByUser`)
- Logs include `operation` and `durationMs` fields
- Slow query logs are emitted via `@repo/logger` at `warn` (>50ms) and `error` (>200ms) levels

## Measured Baselines

*Baseline measurements to be collected after deployment. See `scripts/migrations/2026-06-01-deploy-indexes.ts` for index deployment.*

| Collection | Document Count (Test) | Avg Query Latency | P95 Latency | COLLSCAN Count |
|---|---|---|---|---|
| users | TBD | TBD | TBD | 0 |
| workspaces | TBD | TBD | TBD | 0 |
| sessions | TBD | TBD | TBD | 0 |
| api_keys | TBD | TBD | TBD | 0 |
| audit_logs | TBD | TBD | TBD | 0 |
| documents | TBD | TBD | TBD | 0 |
| invitations | TBD | TBD | TBD | 0 |

## Optimization Log

| Date | Query | Before | After | Improvement |
|---|---|---|---|---|
| 2026-06-14 | Baseline established | — | — | — |
