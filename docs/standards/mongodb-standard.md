# MongoDB Standard

## Schemas

- Define schemas in `@repo/database/src/schemas/`
- Use Mongoose schema with TypeScript inference
- All schemas include `tenantId` for multi-tenant isolation
- Timestamps: `createdAt`, `updatedAt` on all documents
- Soft deletes with `deletedAt` field

## Indexes

- Define indexes in schema files
- Index naming: `{field}_{direction}` or compound: `{field1}_{field2}`
- Text indexes for searchable fields
- Vector indexes for embedding fields
- TTL indexes for expiring data (sessions, tokens)

## Repository Pattern

- ALL database access through repositories
- `BaseRepository` for non-tenant entities
- `TenantAwareRepository` for tenant-scoped entities
- Queries return domain types, not Mongoose documents

## Queries

- Always filter by `tenantId` for tenant-scoped collections
- Use projection to limit returned fields
- Use `.lean()` for read-only queries
- Avoid `$lookup` in hot paths — denormalize instead
- Pagination with `skip`/`limit` or cursor-based

## Migrations

- Migration scripts in `@repo/database/src/migrations/`
- Idempotent migration functions
- Rollback scripts for each migration
- Test migrations against staging before production
