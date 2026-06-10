# Phase 04: Database

> Optimize the database layer with indexing strategy, query optimization, connection pooling, migration tooling, and seed scripts.

---

## Objective

Harden the MongoDB Atlas database layer for production: create a comprehensive indexing strategy for all query patterns, profile and optimize slow queries, configure optimal connection pooling, implement a migration framework with versioned scripts, and create seed data for development environments.

---

## Scope

| Step | Description |
|------|-------------|
| 04.01 | Index strategy implementation |
| 04.02 | Query optimization and profiling |
| 04.03 | Connection pooling configuration |
| 04.04 | Migration strategy and tooling |
| 04.05 | Seed scripts |
| 04.06 | Verification |

---

## Dependencies

Depends on Phase 00 database repositories and Phase 03 workspace models.

---

## Expected Outputs

1. Documented indexing strategy with all indexes deployed
2. Query profiling output with optimization results
3. Connection pool configured with optimal min/max size
4. Migration framework with versioned, idempotent migration scripts
5. Seed scripts for development and staging environments
6. Database health check endpoint

---

## Step Map

| File | Step | Description |
|------|------|-------------|
| `04.01-index-strategy.md` | 04.01 | Index strategy |
| `04.02-query-optimization.md` | 04.02 | Query optimization |
| `04.03-connection-pooling.md` | 04.03 | Connection pooling |
| `04.04-migration-tooling.md` | 04.04 | Migration tooling |
| `04.05-seed-scripts.md` | 04.05 | Seed scripts |
| `04.06-verification.md` | 04.06 | Verification |
