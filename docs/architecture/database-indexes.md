# MongoDB Index Strategy

> Documented: 2026-06-14
> Applies to all entity collections in the Universal MCP Gateway.

## Naming Convention

All indexes follow the pattern: `idx_<collection>_<field>_<field>`

Compound indexes list fields in order. Suffixes for special types: `_text`, `_partial`.

---

## Users (`users`)

| Index Name | Fields | Type | Query Pattern |
|---|---|---|---|
| `idx_users_email` | `{ email: 1 }` | Unique | `findByEmail()` — login, lookup by email |
| `idx_users_name_text` | `{ name: "text" }` | Text | `searchByName()` — user search |
| `idx_users_isActive_lastLoginAt` | `{ isActive: 1, lastLoginAt: 1 }` | Compound | `findActive()` sorted by last login |
| `idx_users_emailVerified_isActive` | `{ emailVerified: 1, isActive: 1 }` | Compound | Admin user management, filtering active verified users |

**ESR Analysis:** `emailVerified_isActive` — equality on `emailVerified` (or `{ $exists: true }`), equality on `isActive`.

---

## Workspaces (`workspaces`)

| Index Name | Fields | Type | Query Pattern |
|---|---|---|---|
| `idx_workspaces_slug` | `{ slug: 1 }` | Unique | `findBySlug()` — lookup by slug |
| `idx_workspaces_ownerId_deletedAt` | `{ ownerId: 1, deletedAt: 1 }` | Compound | `findByOwner()` — active workspaces by owner |
| `idx_workspaces_isActive_plan` | `{ isActive: 1, plan: 1 }` | Compound | Admin filtering by active status and plan tier |
| `idx_workspaces_tenantId_deletedAt` | `{ tenantId: 1, deletedAt: 1 }` | Compound | Tenant-scoped listing excluding archived |
| `idx_workspaces_membersUserId_membersDeletedAt` | `{ "members.userId": 1, "members.deletedAt": 1 }` | Compound | Member lookup in embedded array |
| `idx_workspaces_name_text_description_text` | `{ name: "text", description: "text" }` | Text (weights: name=10, desc=5) | `searchByNameOrSlug()` — full-text workspace search |

**ESR Analysis:**
- `ownerId_deletedAt` — equality on `ownerId`, filter on `deletedAt` (ESR: E=E).
- `tenantId_deletedAt` — equality on `tenantId`, filter on `deletedAt` (ESR: E=E).
- `membersUserId_membersDeletedAt` — equality on userId in embedded array, filter on deletedAt.

---

## Sessions (`sessions`)

| Index Name | Fields | Type | Query Pattern |
|---|---|---|---|
| `idx_sessions_token` | `{ token: 1 }` | Unique | `findByToken()` — session lookup by token |
| `idx_sessions_userId_isValid` | `{ userId: 1, isValid: 1 }` | Compound | `findActiveByUser()`, `invalidateAllUserSessions()` |
| `idx_sessions_expiresAt` | `{ expiresAt: 1 }` | TTL (expireAfterSeconds: 0) | `cleanupExpired()` — auto-cleanup expired sessions |
| `idx_sessions_tenantId_lastActivityAt` | `{ tenantId: 1, lastActivityAt: 1 }` | Compound | Session listing by tenant sorted by activity |

**ESR Analysis:**
- `userId_isValid` — equality on `userId`, equality on `isValid` (ESR: E=E).
- `tenantId_lastActivityAt` — equality on `tenantId`, range on `lastActivityAt` (ESR: E=R).

---

## API Keys (`api_keys`)

| Index Name | Fields | Type | Query Pattern |
|---|---|---|---|
| `idx_apikeys_keyHash` | `{ keyHash: 1 }` | Unique, Sparse | `findByKeyHash()` — API key authentication |
| `idx_apikeys_tenantId_isActive` | `{ tenantId: 1, isActive: 1 }` | Compound | `findByWorkspace()` — listing active keys per tenant |
| `idx_apikeys_expiresAt_partial` | `{ expiresAt: 1 }` | Partial (non-null expiresAt) | Rotation query — keys with expiry dates |

**ESR Analysis:** `tenantId_isActive` — equality on `tenantId`, equality on `isActive` (ESR: E=E).

---

## Audit Logs (`audit_logs`)

| Index Name | Fields | Type | Query Pattern |
|---|---|---|---|
| `idx_auditlogs_tenantId_createdAt` | `{ tenantId: 1, createdAt: -1 }` | Compound | `findByWorkspace()` — tenant-scoped audit log listing |
| `idx_auditlogs_userId_createdAt` | `{ userId: 1, createdAt: -1 }` | Compound, Partial | `findByUser()` — per-user audit history |
| `idx_auditlogs_action_createdAt` | `{ action: 1, createdAt: -1 }` | Compound | `findByWorkspace()` with `action` filter |
| `idx_auditlogs_entityType_entityId_createdAt` | `{ entityType: 1, entityId: 1, createdAt: -1 }` | Compound | `findByEntity()` — entity-scoped audit trail |

**ESR Analysis:**
- `tenantId_createdAt` — equality on `tenantId`, sort on `createdAt` (ESR: E=S).
- `userId_createdAt` — equality on `userId`, sort on `createdAt` (ESR: E=S).
- `action_createdAt` — equality on `action`, sort on `createdAt` (ESR: E=S).
- `entityType_entityId_createdAt` — equality on `entityType + entityId`, sort on `createdAt` (ESR: E=E+S).

---

## Documents (`documents`)

| Index Name | Fields | Type | Query Pattern |
|---|---|---|---|
| `idx_documents_tenantId_status` | `{ tenantId: 1, status: 1 }` | Compound | `findByWorkspace()` with `status` filter |
| `idx_documents_tenantId_contentType` | `{ tenantId: 1, contentType: 1 }` | Compound | `findByWorkspace()` with `contentType` filter |
| `idx_documents_tenantId_createdAt` | `{ tenantId: 1, createdAt: -1 }` | Compound | `findByWorkspace()` — document listing sorted by creation |
| `idx_documents_tenantId_updatedAt` | `{ tenantId: 1, updatedAt: 1 }` | Compound | Document listing sorted by last update |
| `idx_documents_title_text_description_text_tags_text` | `{ title: "text", description: "text", tags: "text" }` | Text (weights: title=10, desc=5, tags=3) | `search()` — full-text document search |

**ESR Analysis:**
- `tenantId_status` — equality on `tenantId`, equality on `status` (ESR: E=E).
- `tenantId_contentType` — equality on `tenantId`, equality on `contentType` (ESR: E=E).
- `tenantId_createdAt` — equality on `tenantId`, sort on `createdAt` (ESR: E=S).
- `tenantId_updatedAt` — equality on `tenantId`, range on `updatedAt` (ESR: E=R).

---

## Invitations (`invitations`)

| Index Name | Fields | Type | Query Pattern |
|---|---|---|---|
| `idx_invitations_token` | `{ token: 1 }` | Unique | `findByToken()` — invitation lookup by token |
| `idx_invitations_expiresAt` | `{ expiresAt: 1 }` | TTL (expireAfterSeconds: 0) | Auto-cleanup expired invitations |
| `idx_invitations_workspaceId_status_createdAt` | `{ workspaceId: 1, status: 1, createdAt: -1 }` | Compound | `findByWorkspace()` — filtered by status, sorted by creation |
| `idx_invitations_inviteeEmail_workspaceId_status` | `{ inviteeEmail: 1, workspaceId: 1, status: 1 }` | Compound | Duplicate check — active invitations for email+workspace |
| `idx_invitations_workspaceId_createdAt` | `{ workspaceId: 1, createdAt: 1 }` | Compound | `countByWorkspaceToday()` — daily invitation rate limit |

**ESR Analysis:**
- `workspaceId_status_createdAt` — equality on `workspaceId`, equality on `status`, sort on `createdAt` (ESR: E=E+S).
- `inviteeEmail_workspaceId_status` — equality on `inviteeEmail + workspaceId`, equality on `status` (ESR: E=E).
- `workspaceId_createdAt` — equality on `workspaceId`, range on `createdAt` (ESR: E=R).

---

## Deployment Notes

- All indexes are defined in Mongoose schema files under `packages/database/src/models/`.
- Indexes are created automatically by Mongoose when the application starts (`mongoose.model(...).createIndexes()`).
- For production deployments, run `scripts/migrations/2026-06-01-deploy-indexes.ts` during a low-traffic window.
- Index creation uses `background: true` by default in MongoDB — it does not block reads/writes.
- Multi-key indexes (arrays, like `tags` on documents) are limited to one array field per index.
- Text indexes are limited to one per collection (MongoDB constraint). Documents uses the single text index for `title + description + tags`.
- TTL indexes (`expiresAt` on sessions and invitations) use `expireAfterSeconds: 0` — documents expire immediately when `expiresAt` ≤ current time. Actual deletion delay is ~60s (TTL monitor interval).

## Index Maintenance

- New indexes must be added via schema files only — never manually via `db.collection.createIndex()`.
- Index changes require a migration step and verification via `listIndexes()`.
- Review index usage via `$indexStats` periodically (quarterly).
- Remove unused indexes to reduce write amplification.
