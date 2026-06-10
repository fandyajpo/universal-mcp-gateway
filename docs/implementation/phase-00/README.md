# Phase 00: Foundation

> Build the foundational layer of the Universal MCP Gateway — the core types, utilities, infrastructure packages, and developer tooling that every subsequent phase depends on.

---

## Objective

Establish the bedrock packages, configurations, and infrastructure wiring that all higher-level features (auth, workspace, AI, MCP, RAG) will build upon. By the end of this phase, every shared package must compile, lint, type-check, and have basic unit test coverage. The monorepo must be CI-ready with automated quality gates.

---

## Scope

| Package | Responsibility |
|---------|---------------|
| `@repo/types` | Domain model types, branded IDs, DTOs, enums, shared interfaces |
| `@repo/logger` | Pino-based structured logging with context, correlation IDs, Sentry transport |
| `@repo/config` | Environment variable loading with Zod validation, typed config object |
| `@repo/validation` | Zod schemas for every domain entity, request/response validation helpers |
| `@repo/utils` | General-purpose utilities (async, string, date, object, URL, retry) |
| `@repo/crypto` | AES-256-GCM encryption, bcrypt hashing, key derivation, secure random |
| `@repo/database` | MongoDB/Mongoose connection manager, BaseRepository, all entity repositories |
| `@repo/cache` | Upstash Redis client wrapper, cache strategies, rate limiter, distributed lock |
| `@repo/ui` | shadcn/ui component registry, design system primitives (Button, Card, Input, Dialog, etc.) |
| Tooling | ESLint flat config, Prettier shared config, CI workflow, Sentry setup |
| Verification | Cross-package integration test suite that validates all package contracts |

---

## Dependencies

| Step | Depends On | Description |
|------|------------|-------------|
| 00.02 | 00.01 | Core types package — zero-dependency foundation |
| 00.03 | 00.02 | Logger package — depends on types |
| 00.04 | 00.02 | Config package — depends on types |
| 00.05 | 00.02 | Validation package — depends on types |
| 00.06 | 00.02 | Utils package — depends on types |
| 00.07 | 00.02 | Crypto package — depends on types |
| 00.08 | 00.02, 00.03 | Database connection + BaseRepository |
| 00.09 | 00.08 | Database repositories (User, Workspace, Session, ApiKey, AuditLog, Document) |
| 00.10 | 00.02, 00.03 | Cache package |
| 00.11 | 00.02 | UI package + shadcn/ui setup |
| 00.12 | 00.01 | ESLint + Prettier shared configs |
| 00.13 | 00.01 | CI/CD workflows |
| 00.14 | 00.01 | Sentry integration |
| 00.15 | All above | Verification suite |

---

## Expected Outputs

1. **15 packages** with complete implementation, barrel exports, and tests
2. **Working CI pipeline** that runs lint → typecheck → test → build on every push
3. **ESLint flat config** shared across all packages and apps
4. **Prettier config** shared across all packages and apps
5. **Sentry** DSN-based error reporting wired into the logger package
6. **shadcn/ui** component registry with 8-10 primitives ready for app consumption
7. **Database layer** with Mongoose connection, health checks, and 6 entity repositories
8. **Cache layer** with Redis client, TTL management, rate limiter, and distributed locks
9. **Verification suite** that validates all package contracts and cross-package integration

---

## Architecture Constraints

| Constraint | Enforcement |
|------------|-------------|
| `@repo/types` must have zero runtime dependencies | `package.json` checked in CI |
| No package may import from an app | ESLint `import/no-restricted-paths` |
| No circular dependencies | Turbo dependency graph enforced |
| Package public API = `src/index.ts` only | ESLint `import/no-internal-modules` |
| All database access goes through repositories | Architecture test in verification suite |
| Every repository method includes `tenantId` filter | Code review + test enforcement |
| Cache keys follow `tenant:{id}:{domain}:{entity}:{id}` | Linter rule or test convention |
| Logger must never log secrets | Pino `redact` configuration tested |
| All Zod schemas infer TypeScript types | `z.infer<typeof schema>` used everywhere |

---

## Completion Criteria

| Criteria | Verification |
|----------|-------------|
| All packages compile with `tsc --noEmit` | `pnpm typecheck` passes |
| All packages pass ESLint with no errors | `pnpm lint` passes |
| All packages have passing unit tests | `pnpm test` passes with ≥80% coverage |
| CI pipeline runs green on pull request | GitHub Actions workflow verified |
| All package barrel files export correct API | Verification suite checks each package |
| Database connects, health-check returns OK | Integration test with test MongoDB instance |
| Cache connects, set/get works | Integration test with test Redis |
| UI components render without error | Component test for each primitive |
| Sentry transport delivers test error | Manual smoke test with Sentry DSN |

---

## Risk Assessment

| Risk | Mitigation |
|------|------------|
| `@repo/types` grows too large | Split domain types into separate files before barrel export |
| Mongoose schema changes break repositories | Repository tests validate every CRUD operation |
| Redis connection flaky in CI | Use `@upstash/redis` mock in unit tests, integration test only on CI with Redis |
| shadcn/ui component version mismatch | Pin all shadcn/ui versions in package.json |
| ESLint config conflicts with Prettier | Run `eslint-config-prettier` to disable formatting rules in ESLint |

---

## Step Map

| File | Step | Description |
|------|------|-------------|
| `00.02-core-types.md` | 00.02 | Core types package |
| `00.03-logger.md` | 00.03 | Logger package |
| `00.04-config.md` | 00.04 | Config package |
| `00.05-validation.md` | 00.05 | Validation package |
| `00.06-utils.md` | 00.06 | Utils package |
| `00.07-crypto.md` | 00.07 | Crypto package |
| `00.08-database-connection.md` | 00.08 | Database connection + BaseRepository |
| `00.09-database-repositories.md` | 00.09 | Database repositories |
| `00.10-cache.md` | 00.10 | Cache package |
| `00.11-ui-package.md` | 00.11 | UI package + shadcn/ui setup |
| `00.12-eslint-prettier.md` | 00.12 | ESLint + Prettier |
| `00.13-cicd-workflows.md` | 00.13 | CI/CD workflows |
| `00.14-sentry-integration.md` | 00.14 | Sentry integration |
| `00.15-verification.md` | 00.15 | Verification suite |
