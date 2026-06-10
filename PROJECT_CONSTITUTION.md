# Project Constitution — Universal MCP Gateway

> **Version:** 1.0.0  
> **Authority:** Highest — supersedes all other project documentation.  
> **Scope:** Architecture, engineering, process, and governance for the Universal MCP Gateway platform.  
> **Amendments:** Requires ADR approval. See Section 17: ADR Policy.

---

## Preamble

The Universal MCP Gateway is an enterprise-grade AI Workspace Platform. This constitution establishes the permanent engineering principles, architectural rules, and governance model that govern its development. Every engineer — human or AI — working on this codebase must adhere to this constitution.

All other project documents (AI_INSTRUCTIONS.md, ARCHITECTURE.md, CONTRIBUTING.md, SECURITY.md, docs/standards/) derive their authority from this constitution and must be consistent with it. Where a conflict exists, this document prevails.

---

## Table of Contents

1. [Project Mission](#1-project-mission)
2. [Product Vision](#2-product-vision)
3. [Engineering Philosophy](#3-engineering-philosophy)
4. [Architectural Principles](#4-architectural-principles)
5. [Monorepo Principles](#5-monorepo-principles)
6. [Package Boundary Rules](#6-package-boundary-rules)
7. [Dependency Rules](#7-dependency-rules)
8. [Coding Standards](#8-coding-standards)
9. [Documentation Standards](#9-documentation-standards)
10. [AI Assistant Rules](#10-ai-assistant-rules)
11. [Security Principles](#11-security-principles)
12. [Performance Principles](#12-performance-principles)
13. [Scalability Principles](#13-scalability-principles)
14. [Testing Policy](#14-testing-policy)
15. [Refactoring Policy](#15-refactoring-policy)
16. [Definition of Done](#16-definition-of-done)
17. [ADR Policy](#17-adr-policy)
18. [Technology Adoption Policy](#18-technology-adoption-policy)
19. [Breaking Change Policy](#19-breaking-change-policy)
20. [Long-term Evolution Strategy](#20-long-term-evolution-strategy)

---

## 1. Project Mission

### 1.1 Mission Statement

Democratize enterprise AI tooling by building an open, composable platform where organizations connect any AI model, any knowledge source, and any tool into a unified, secure workspace.

### 1.2 Core Tenets

| Tenet | Meaning |
|---|---|
| **Open** | Built on open protocols (MCP, SSE, JSON-RPC). No proprietary lock-in. |
| **Composable** | Every capability is a package. Mix, match, and extend. |
| **Enterprise-grade** | Multi-tenant, secure, auditable, scalable from startup to Fortune 500. |
| **AI-first** | AI is the primary interface. Chat, agents, and automation are first-class. |
| **Standards-based** | MCP is the integration standard. Connectors speak MCP natively. |

---

## 2. Product Vision

### 2.1 Product Components

The platform delivers the following capabilities, each owned by one or more packages:

- **AI Workspace** — Browser-based environment for teams to interact with AI, share knowledge, and collaborate.
- **AI Gateway** — Centralized routing layer for LLM requests with model selection, fallback, rate limiting, and cost tracking. Owned by `@repo/ai`.
- **MCP Gateway** — Model Context Protocol server for tool discovery and execution. Owned by `@repo/mcp`.
- **RAG Engine** — Retrieval-augmented generation pipeline with hybrid search and re-ranking. Owned by `@repo/rag`.
- **Knowledge Base** — Managed document repository with chunking, embedding, and semantic search.
- **Connector Marketplace** — Registry of MCP-compatible integrations with third-party services. Owned by `@repo/connectors`.
- **AI Agents** — Composable, multi-step task automation using MCP tools and RAG context.
- **Enterprise SaaS** — Multi-tenant, RBAC, SSO/SAML, audit logging, usage-based billing.

### 2.2 Target Users

- **End Users** — Knowledge workers who chat with AI, query knowledge bases, and use AI tools.
- **Developers** — Build connectors, deploy custom tools, manage API keys.
- **Administrators** — Manage tenants, configure SSO, monitor usage, audit activity.

---

## 3. Engineering Philosophy

### 3.1 Design Principles

| Principle | Description |
|---|---|
| **Clean Architecture over quick wins** | No shortcuts. Every abstraction must earn its place. |
| **Domain-Driven Design** | Ubiquitous language, bounded contexts, entities, value objects, aggregates. |
| **SOLID** | Single responsibility, open-closed, Liskov substitution, interface segregation, dependency inversion. |
| **Composition over Inheritance** | Prefer composing behaviors through dependency injection. |
| **Explicit over Implicit** | No magic. No hidden side effects. No implicit state. |
| **Fail Fast** | Validate at boundaries. Fail with clear messages. Never silently swallow errors. |
| **Secure by Default** | Every feature must consider security from inception. |
| **Future-Proof** | Architect for extraction to microservices from day one. |

### 3.2 What We Optimize For

1. **Long-term maintainability** — Code must be understandable 2 years from now.
2. **Deterministic execution** — Given the same input, every build should produce the same output.
3. **Production readiness** — No demo code. No TODO features. No half-implemented abstractions.
4. **Developer experience** — Fast builds, clear errors, comprehensive tests, good documentation.

### 3.3 What We Do NOT Tolerate

- `any` types without written justification
- Circular dependencies between packages
- Direct database access from UI components
- Business logic in route handlers or server actions
- Unvalidated user input reaching the service layer
- Secrets committed to the repository
- Monolithic packages that violate single responsibility

---

## 4. Architectural Principles

### 4.1 Layered Architecture

The system follows a strict layered architecture:

```
┌─────────────────────────────────────────────┐
│  Infrastructure Layer                        │
│  (Next.js, Mongoose, Redis, R2, Inngest)     │
│  ┌─────────────────────────────────────────┐ │
│  │  Application Layer                      │ │
│  │  (Services, Use Cases, Orchestration)   │ │
│  │  ┌─────────────────────────────────────┐│ │
│  │  │  Domain Layer                       ││ │
│  │  │  (Entities, Value Objects,          ││ │
│  │  │   Repository Interfaces)            ││ │
│  │  └─────────────────────────────────────┘│ │
│  └─────────────────────────────────────────┘ │
└─────────────────────────────────────────────┘
```

**Rules:**
- Domain layer depends on NOTHING outside itself.
- Application layer depends on domain layer only.
- Infrastructure layer depends on domain layer and implements its interfaces.
- Dependencies point INWARD. Nothing in the inner layers knows about the outer layers.

### 4.2 Repository Pattern

ALL database access uses the Repository Pattern. This is non-negotiable.

- `BaseRepository` — Generic CRUD for non-tenant entities.
- `TenantAwareRepository` — Extends BaseRepository with automatic `tenantId` filtering.
- Repositories return domain entities — NOT database documents, NOT plain objects.
- Services depend on repository interfaces (Interfaces), not concrete implementations (Dependency Inversion).

### 4.3 Multi-Tenant Isolation

Every entity is tenant-scoped. Isolation is enforced at every layer:

| Layer | Mechanism |
|---|---|
| Database | `tenantId` field on every document, mandatory in all queries |
| Cache | Key prefix: `tenant:{tenantId}:` |
| Storage | Path prefix: `/{tenantId}/` |
| Queue | Event metadata includes `tenantId` |
| Logging | Every log line includes `tenantId` field |

The repository layer enforces tenant isolation automatically. It must be structurally impossible to read another tenant's data without explicitly bypassing the repository (which requires elevated permissions documented in an ADR).

### 4.4 Streaming-First Architecture

AI responses are streaming by default. The entire pipeline — from OpenRouter through the AI Gateway to the browser — supports SSE streaming. Non-streaming responses are the exception, not the rule.

### 4.5 Future Microservice Extraction

The monorepo is designed for eventual extraction into independent microservices. Every package must be:
- Independently testable (no framework coupling)
- Independently deployable (no shared state assumptions)
- Independently scalable (stateless where possible)

See `ARCHITECTURE.md` Section 14 for the extraction strategy.

---

## 5. Monorepo Principles

### 5.1 TurboRepo + pnpm

- TurboRepo is the build orchestrator. All packages and apps are part of the `turbo.json` pipeline.
- pnpm is the package manager. All internal dependencies use `workspace:*` protocol.
- The lockfile (`pnpm-lock.yaml`) is committed and must remain consistent.

### 5.2 Workspace Structure

```
apps/       — Runnable applications (Next.js 15)
packages/   — Shared libraries (zero or low framework coupling)
docs/       — Architecture, ADRs, implementation plans, standards
scripts/    — Build, migration, and automation scripts
.github/    — CI/CD workflows and issue templates
```

### 5.3 Incremental Builds

TurboRepo's caching must be leveraged for fast CI. Packages declare their dependencies explicitly in `turbo.json` and `package.json` so the build graph is fully known.

### 5.4 No App-to-App Dependencies

Applications must NOT depend on other applications. All sharing happens through packages.

---

## 6. Package Boundary Rules

### 6.1 Package Listing

| Package | Responsibility |
|---|---|
| `@repo/types` | Foundation types, DTOs, enums, branded types. Zero dependencies. |
| `@repo/validation` | Zod schemas, input validation, type inference helpers. |
| `@repo/logger` | Pino structured logging, correlation IDs, transport configuration. |
| `@repo/utils` | General utilities: formatting, async, arrays, objects, results. |
| `@repo/config` | Environment-aware configuration loading with Zod schema validation. |
| `@repo/crypto` | AES-256-GCM encryption, bcrypt hashing, key derivation, token utilities. |
| `@repo/cache` | Upstash Redis client, cache strategies, rate limiting, distributed mutexes. |
| `@repo/database` | MongoDB connection, Mongoose schemas, Repository pattern, migrations. |
| `@repo/auth` | Better Auth integration, RBAC enforcement, session management, OAuth, MFA. |
| `@repo/ai` | AI Gateway: OpenRouter client, model routing, provider abstraction, streaming, cost tracking. |
| `@repo/mcp` | MCP Gateway: protocol handler, tool registry, execution sandbox, streaming. |
| `@repo/rag` | RAG Engine: chunking, embedding, vector search, retrieval, re-ranking, context assembly. |
| `@repo/connector-sdk` | SDK for building third-party connectors: base class, OAuth helpers, sync engine. |
| `@repo/connectors` | Built-in connectors: Slack, Notion, GitHub, Linear, Jira, Confluence, Google Drive. |
| `@repo/ui` | Shared React components built on shadcn/ui primitives. |
| `@repo/config` | Shared configuration and environment schema. |

### 6.2 Boundary Rules

- Every package must have a clear single responsibility.
- Every package exports ONLY what is in its `src/index.ts` barrel file. Internal modules are private.
- No package may import from any app.
- No package may have circular dependencies with any other package.
- `@repo/types` must remain zero-dependency — it is the root of the dependency tree.
- Adding a new package requires an ADR.

### 6.3 Package README Requirement

Every package must have a README.md documenting:
- Purpose (one paragraph)
- Public API (list of exported functions/types)
- Dependencies (other packages)
- Usage example
- Configuration (if any)
- Testing instructions

---

## 7. Dependency Rules

### 7.1 Dependency Graph

The dependency graph is a Directed Acyclic Graph (DAG). Circular dependencies are FORBIDDEN.

```
Foundation: types
Infrastructure: logger, utils, crypto, config
Data: database (→ types, logger), cache (→ types, logger)
Services: auth (→ database, types, logger, cache)
          ai (→ types, logger, cache)
          mcp (→ types, logger)
          rag (→ database, ai, types, logger, cache)
Connectors: connector-sdk (→ types, mcp)
            connectors (→ connector-sdk)
UI: ui (→ types)
Apps: web, admin, docs, landing (→ any package)
```

### 7.2 Enforcement

- TurboRepo's build graph automatically enforces build order.
- No package may depend on another package that would create a cycle.
- `@repo/connectors` is the only package that imports third-party connector implementations.
- Apps may import any package. Packages must NOT import any app.
- New dependencies between packages must be justified in code review.

### 7.3 External Dependencies

- New external dependencies require written justification and team review.
- Prefer established, maintained libraries with TypeScript support.
- No dependency with a known CVE may be added.
- Runtime dependencies must be justified over devDependencies.
- Bundle size impact of new frontend dependencies must be assessed.

---

## 8. Coding Standards

### 8.1 TypeScript

- Strict mode is mandatory: `strict`, `noUncheckedIndexedAccess`, `noImplicitReturns`, `noFallthroughCasesInSwitch`.
- `any` is FORBIDDEN. Use `unknown` with type guards.
- `null` is FORBIDDEN. Use `undefined` or the `Result<T, E>` pattern from `@repo/utils`.
- `!` (non-null assertion) is FORBIDDEN. Use proper type narrowing.
- Named exports only. NO default exports.
- Explicit return types on all public functions.
- Branded types for domain identifiers: `UserId`, `TenantId`, `WorkspaceId`.

### 8.2 Naming

| Category | Convention | Example |
|---|---|---|
| Types, interfaces, enums, classes | PascalCase | `UserProfile`, `AuthConfig` |
| Functions, methods, variables | camelCase | `getUserById` |
| Constants, environment variables | SCREAMING_SNAKE | `MAX_RETRY_COUNT` |
| Files (config, dirs) | kebab-case | `tailwind.config.ts` |
| Files (components) | PascalCase | `UserAvatar.tsx` |
| Files (utilities, hooks) | camelCase | `useAuth.ts`, `formatDate.ts` |
| Boolean variables | `is`, `has`, `should` prefix | `isLoading` |
| Event handlers | `handle` prefix | `handleSubmit` |

### 8.3 Imports

Order: external → `@repo/*` internal → relative (`./`, `../`).
No default imports. Path aliases (`@repo/*`) preferred over relative paths inside apps.

### 8.4 Functions

- Max 30 lines per function.
- Pure functions preferred. Side effects must be explicit.
- Minimize optional parameters. Use options objects for 3+ optional params.
- Prefer `function` keyword for standalone functions. Prefer arrow functions for short callbacks.

### 8.5 Prohibited Patterns

| Forbidden | Replacement |
|---|---|
| `any` | `unknown` + type guard |
| `null` | `undefined` or `Result<T, E>` |
| Default exports | Named exports |
| `console.log` | `@repo/logger` |
| Direct Mongoose in services | Repository Pattern |
| `// @ts-ignore` | Fix the type correctly |
| `!` (non-null assertion) | Proper narrowing |
| `Object.assign` | Spread or `deepMerge` from `@repo/utils` |
| Magic strings/numbers | Constants or enums |
| Synchronous I/O | `async/await` |
| Nested ternaries | Early returns or `switch` |
| Direct `fetch` in components | TanStack Query hooks |
| Business logic in route handlers | Service layer |

### 8.6 Framework-Specific Rules

**Next.js:** Prefer Server Components. `'use client'` only when interactivity or browser APIs are needed. Data fetching in Server Components. Mutations via Server Actions with Zod validation.

**React:** No `useMemo`/`useCallback` preemptively — profile first. Server state in TanStack Query. Client state in Zustand. URL state in nuqs. Form state in React Hook Form.

**TanStack Query:** Every query must have a unique key: `["domain", "entity", {id, filters}]`. Mutations invalidate related queries on success.

**Zustand:** Client state only (UI, modals, sidebars, theme, preferences). NEVER store server data.

---

## 9. Documentation Standards

### 9.1 Required Documentation

Every change must include:
- JSDoc on all new public exports
- CHANGELOG.md entry
- Updated STATUS.md and NEXT_STEP.md

Additionally:
- New packages require a package README.md
- New features require documented acceptance criteria
- Architecture changes require an ADR
- API changes require OpenAPI documentation in `docs/api/`

### 9.2 Document Hierarchy

```
PROJECT_CONSTITUTION.md      ← Highest authority (this document)
AI_INSTRUCTIONS.md           ← Actionable rules for AI assistants
ARCHITECTURE.md              ← System architecture (C4 model)
SECURITY.md                  ← Security policies
CONTRIBUTING.md              ← Contribution process
docs/standards/*             ← Detailed technical standards
docs/checklists/*            ← Quality checklists
docs/implementation/phase-*  ← Step-by-step implementation plans
docs/adr/*                   ← Architectural Decision Records
docs/templates/*             ← Reusable document templates
```

### 9.3 Diagrams

All architecture diagrams use Mermaid syntax embedded in markdown. No external diagramming tools.

---

## 10. AI Assistant Rules

### 10.1 Before Writing Code

1. Read `PROJECT_CONSTITUTION.md` (this document)
2. Read `AI_INSTRUCTIONS.md` for actionable rules
3. Read `NEXT_STEP.md` for current position
4. Read the step document in `docs/implementation/phase-XX/`
5. Read `STATUS.md` for full context
6. Read `ARCHITECTURE.md` for system architecture
7. Read the relevant package or app README
8. Read existing similar implementations for pattern consistency

### 10.2 After Writing Code

1. Run `pnpm typecheck` — fix all type errors
2. Run `pnpm lint` — fix all lint errors
3. Run `pnpm test` — ensure tests pass
4. Update `STATUS.md` with progress
5. Update `NEXT_STEP.md` to point to the next step
6. Update `CHANGELOG.md` with a summary of changes
7. Update `ROADMAP.md` if scope changed

### 10.3 Scope Management

- Implement ONLY what the current step requires.
- Modify ONLY files listed in the step's `Files To Modify`.
- If you discover missing functionality, document as technical debt in STATUS.md, NOT as a feature addition.

### 10.4 When Blocked

1. Document the blocker in STATUS.md under "Blocked"
2. Move to the next independent step
3. Return to the blocked step when dependencies are resolved

### 10.5 Enforcement

Violations of this constitution must be:
1. Flagged in code review
2. Documented as technical debt in STATUS.md
3. Fixed before merging

---

## 11. Security Principles

### 11.1 Core Tenets

- **Least privilege** — Every user, service, and API key has the minimum permissions required.
- **Defense in depth** — Security enforced at network, application, and data layers.
- **Secure by default** — New features must consider security from day one.
- **Assume breach** — Design for containment if an attacker gains access.

### 11.2 Authentication

- Better Auth handles all authentication — email/password, OAuth (Google, GitHub, Microsoft), magic links.
- Sessions use HTTP-only, Secure, SameSite=Strict cookies.
- API keys are hashed with bcrypt (cost >= 12) before storage. The raw key is shown exactly once at creation.
- MFA with TOTP is available for sensitive operations.

### 11.3 Authorization

- RBAC is enforced at the SERVICE layer — NOT the UI layer.
- Permission checks before every mutation.
- Roles: `owner` > `admin` > `member` > `viewer`.
- Permissions follow the pattern: `{domain}:{action}` (e.g., `workspace:chat`, `connector:install`).

### 11.4 Data Protection

- TLS 1.3 for all data in transit.
- Encryption at rest via MongoDB Atlas and R2 SSE.
- Sensitive fields encrypted with AES-256-GCM at the application layer.
- Secrets stored in environment variables only. `.env` files are gitignored.
- No secrets in client-side code or logs.

### 11.5 Rate Limiting

| Endpoint Type | Limit |
|---|---|
| Authentication | 10 req/min per IP |
| General API | 100 req/min per user |
| AI completions | 50 req/min per user |
| File upload | 10 req/min per user |

### 11.6 Prompt Injection & RAG Poisoning

- User input is placed in `{user_input}` slots in parameterized prompts — NEVER concatenated.
- System prompts are immutable at runtime.
- Document sources are tracked with blame metadata.
- Content hash verification before indexing.
- Access control on document ingestion.

For the complete security policy, see `SECURITY.md`.

---

## 12. Performance Principles

### 12.1 Frontend

- Lighthouse score >= 90 on all categories.
- First Contentful Paint < 1.5s.
- Largest Contentful Paint < 2.5s.
- First Input Delay < 100ms.
- Bundle size < 500KB (gzipped) per route.

### 12.2 Backend

- API response time < 200ms (p95).
- Database query time < 50ms (p95).
- Cache hit rate > 80% for cacheable data.
- No N+1 queries — detect and eliminate in code review.
- Pagination on ALL list endpoints — no unbounded queries.

### 12.3 Streaming

- AI streaming: first token under 1s.
- SSE backpressure handling for slow consumers.
- Abort signal propagation throughout the streaming pipeline.

### 12.4 Measurement

Performance benchmarks are recorded before and after each phase. Degradations must be justified and approved.

---

## 13. Scalability Principles

### 13.1 Stateless Design

All application servers are stateless. Session state lives in Redis. File storage lives in R2. Job state lives in Inngest.

### 13.2 Horizontal Scaling

Every container can scale horizontally:
- Next.js apps: stateless, scale via load balancer.
- AI Gateway: stateless, scales horizontally.
- MCP Gateway: stateless, scales horizontally.
- Queue workers: scale via Inngest worker concurrency.

### 13.3 Database Scaling

- MongoDB Atlas with read replicas for read-heavy workloads.
- Vector search indexes scoped by `tenantId` for pre-filtering.
- Sharding strategy documented for Phase 18.

### 13.4 Caching Strategy

- Hot data (sessions, rate limit counters): Redis.
- Embeddings: Redis with TTL, invalidated on re-index.
- API responses: TanStack Query in-memory cache + optional CDN.
- Static assets: Cloudflare CDN with long cache headers.

---

## 14. Testing Policy

### 14.1 Coverage Requirements

| Type | Coverage Target | Location |
|---|---|---|
| Unit tests | >= 80% lines | Colocated: `src/**/*.test.ts` |
| Integration tests | All API routes | `src/**/*.test.ts` |
| Component tests | All interactive components | `src/**/*.test.tsx` |
| E2E tests | Critical user flows | `e2e/*.spec.ts` |

### 14.2 Testing Principles

- Tests are colocated with source files.
- Use factory/fixture functions for test data — NOT production data.
- Mock external services (OpenRouter, Inngest, Redis, R2) in unit tests.
- Use `mongodb-memory-server` for database integration tests — do NOT mock the database.
- Test error cases, edge cases, and happy paths.
- Tests must be deterministic — no flaky tests allowed.
- CI must pass all tests before merge.

### 14.3 What NOT to Test

- Internal implementation details (test behavior, not implementation).
- Third-party library internals.
- Generated code.
- Configuration files.

---

## 15. Refactoring Policy

### 15.1 When to Refactor

- Code duplication detected (DRY violations).
- Package boundary violations (a package doing too much).
- Performance bottlenecks identified by profiling.
- Test coverage gaps that make changes risky.
- Architecture drift (deviation from Clean Architecture principles documented in this constitution).

### 15.2 Refactoring Rules

- Refactoring must have its own step or phase. No refactoring-as-side-effect during feature work.
- Refactoring must maintain or improve test coverage.
- Refactoring must NOT change external behavior — verify with existing tests.
- Large refactors require an ADR and a migration plan.
- Each refactoring step must be independently verifiable.

### 15.3 Technical Debt Management

Technical debt is tracked in `STATUS.md` with severity and notes. Debt must be addressed within a defined timeline:
- **High severity:** Must be resolved within one phase.
- **Medium severity:** Must be resolved within three phases.
- **Low severity:** Can be deferred but must be scheduled.

---

## 16. Definition of Done

A step or feature is DONE when ALL of the following criteria are met:

### 16.1 Implementation

- [ ] All functional requirements implemented and verified
- [ ] All non-functional requirements met (performance, security, accessibility)
- [ ] All acceptance criteria pass
- [ ] Code follows this constitution (architecture, boundaries, standards)

### 16.2 Testing

- [ ] Unit tests pass (>= 80% coverage on new code)
- [ ] Integration tests pass
- [ ] Component tests pass (for UI changes)
- [ ] E2E tests pass (for critical flows)
- [ ] Edge cases and error paths tested

### 16.3 Quality

- [ ] TypeScript strict mode passes (`pnpm typecheck`)
- [ ] Lint passes (`pnpm lint`)
- [ ] Build succeeds (`pnpm build`)
- [ ] No architecture violations introduced
- [ ] No new `any` types without justification
- [ ] No circular dependencies

### 16.4 Documentation

- [ ] `STATUS.md` updated
- [ ] `NEXT_STEP.md` updated (points to next step)
- [ ] `CHANGELOG.md` updated
- [ ] `ROADMAP.md` updated if scope changed
- [ ] New public APIs have JSDoc
- [ ] Package README updated if package API changed

### 16.5 Security

- [ ] Security checklist passed (see `docs/checklists/security-checklist.md`)
- [ ] No secrets exposed
- [ ] Tenant isolation verified
- [ ] Input validation in place
- [ ] Output sanitized for XSS

---

## 17. ADR Policy

### 17.1 When an ADR is Required

- Adding a new package to the monorepo
- Adding a new external dependency
- Changing the architecture (layer violations, new patterns)
- Choosing between significant technical alternatives
- Introducing a new infrastructure service
- Modifying the dependency graph
- Any decision that affects cross-package contracts

### 17.2 ADR Format

Every ADR follows the template in `docs/templates/adr-template.md` with these sections:

1. **Title** — `ADR-NNN: Decision Title`
2. **Status** — Proposed / Accepted / Deprecated / Superseded
3. **Context** — Why is this decision needed?
4. **Decision** — What was decided?
5. **Rationale** — Why was this chosen over alternatives?
6. **Trade-offs** — What was sacrificed?
7. **Rejected Alternatives** — What else was considered and why rejected?
8. **Consequences** — What changes as a result?
9. **Future Migration Strategy** — How to undo or change this decision later

### 17.3 ADR Lifecycle

1. **Proposed** — Decision proposed for discussion
2. **Accepted** — Decision approved and implemented
3. **Deprecated** — Decision no longer recommended (superseded by newer ADR)
4. **Superseded** — Replaced by a newer ADR

ADRs are immutable once accepted. To change a decision, create a new ADR that supersedes the old one.

---

## 18. Technology Adoption Policy

### 18.1 Evaluation Criteria

Before a new technology can be adopted, it must be evaluated against:

| Criterion | Weight |
|---|---|
| Maturity & stability | High |
| Community size & activity | High |
| TypeScript support | High |
| Bundle size impact (frontend) | Medium |
| Operational complexity (backend) | Medium |
| License compatibility | High (no AGPL, no SSPL) |
| Migration effort from current solution | Medium |
| Long-term maintenance outlook | High |

### 18.2 Adoption Process

1. File an issue describing the need and candidate solutions
2. Write a brief RFC evaluating options against criteria
3. Prototype the top candidate (max 2 engineering days)
4. Write ADR with the decision
5. Implement across the codebase
6. Monitor for regressions for one phase

### 18.3 Current Technology Stack (Ratified)

See `README.md` for the complete ratified technology stack. Changes to this stack require an ADR.

---

## 19. Breaking Change Policy

### 19.1 Definition

A breaking change is any change that:
- Removes or renames a public export from a package
- Changes the signature of a public function
- Changes the shape of a response type
- Removes or renames a database field
- Changes HTTP status codes or error shapes
- Removes a feature with existing users
- Changes configuration schema

### 19.2 Process

1. Breaking changes must be announced before implementation.
2. Breaking changes require an ADR.
3. Breaking changes must have a migration path for existing users.
4. Breaking changes must be documented in CHANGELOG.md under "Changed" or "Removed".
5. Database migrations must be backward-compatible for at least one deploy cycle.

### 19.3 Versioning

The project follows Semantic Versioning (semver):
- **MAJOR** — Breaking changes
- **MINOR** — New features, backward-compatible
- **PATCH** — Bug fixes, backward-compatible

Pre-1.0: Breaking changes increment the minor version. The API is considered unstable until 1.0.

---

## 20. Long-term Evolution Strategy

### 20.1 Phased Extraction to Microservices

The monorepo architecture is designed for eventual extraction. The extraction order (as traffic and team size demand) is:

1. `@repo/ai` → AI Gateway microservice
2. `@repo/mcp` → MCP Gateway microservice
3. `@repo/rag` → RAG Engine microservice
4. `@repo/auth` → Auth microservice
5. `@repo/connectors` → Connector sync microservice

### 20.2 What Enables Extraction

- Package isolation: Each package is independently testable and contains no Next.js-specific code.
- Repository pattern: Data access can be swapped from in-process to HTTP without changing service logic.
- Event-driven integration: Cross-cutting concerns emit Inngest events. Extracted services subscribe to the same event bus.
- Shared types: `@repo/types` becomes a published npm package consumed by all microservices.

### 20.3 When to Extract

Extract when:
- Traffic demands independent scaling (one service needs more resources than others).
- Deployment velocity requires it (a change to one package requires full monolith deployment).
- Team boundaries form (autonomous teams own individual services).
- Operational isolation is needed (a crash in one service must not affect others).

**Until then, the monorepo monolith provides faster iteration velocity, simpler workflows, and lower operational overhead.**

### 20.4 Deprecation Policy

- Deprecated features are marked in CHANGELOG.md.
- Deprecated features receive security patches for 6 months.
- Removal of deprecated features requires a MAJOR version bump.
- Legacy API versions (v1) are supported for 12 months after v2 is introduced.

### 20.5 Governance

This constitution is maintained by the project's architecture team. Amendments require:
1. Issue filed describing the amendment
2. ADR written with rationale and trade-offs
3. Maintainer review and approval
4. 2-week comment period for the community

---

## Signature

This constitution was established on 2026-06-10 after a complete repository audit. It reflects the architecture, philosophy, and governance rules that will guide the Universal MCP Gateway through its entire lifecycle.

*Every engineer — human or AI — is expected to read this constitution before contributing code.*
