# ADR-010: Project Architecture

## Status

Accepted

## Context

This record explains the overall project architecture decisions — monorepo package boundaries, dependency rules, and the architectural patterns that govern the codebase. This ADR serves as a reference for architecture decisions not covered by the more specific ADRs.

## Domain-Driven Design & Clean Architecture

The codebase follows Domain-Driven Design (DDD) principles and Clean Architecture layers:

```
┌────────────────────────────────────────────┐
│  Infrastructure (Next.js, Drivers, DB)      │
│  ┌──────────────────────────────────────┐   │
│  │  Application (Use Cases, Services)    │   │
│  │  ┌────────────────────────────────┐   │   │
│  │  │  Domain (Entities, Value       │   │   │
│  │  │  Objects, Repository           │   │   │
│  │  │  Interfaces)                   │   │   │
│  │  └────────────────────────────────┘   │   │
│  └──────────────────────────────────────┘   │
└────────────────────────────────────────────┘
```

- **Domain Layer** — entities, value objects, repository interfaces (contracts)
- **Application Layer** — use cases, services that orchestrate domain objects
- **Infrastructure Layer** — actual implementations (Mongoose models, HTTP clients, cache adapters)

## Package Dependency Rules

```
@repo/types          ← Zero dependencies, foundation package
@repo/validation     ← @repo/types only
@repo/logger         ← @repo/types only
@repo/utils          ← @repo/types only
@repo/crypto         ← @repo/types only
@repo/cache          ← @repo/types, @repo/logger
@repo/config         ← @repo/types only
@repo/database       ← @repo/types, @repo/logger
@repo/auth           ← @repo/database, @repo/types, @repo/logger
@repo/ai             ← @repo/types, @repo/logger, @repo/cache
@repo/mcp            ← @repo/types, @repo/logger
@repo/rag            ← @repo/database, @repo/ai, @repo/types, @repo/logger, @repo/cache
@repo/connector-sdk  ← @repo/types, @repo/mcp
@repo/connectors     ← @repo/connector-sdk, @repo/logger, @repo/types
@repo/ui             ← @repo/types, react, class-variance-authority, clsx, tailwind-merge
```

Rules:
- NO circular dependencies — verified by TurboRepo's build graph
- NO package depends on any app
- Apps depend on any package they need
- `@repo/types` is the foundation — no other package dependencies
- Business logic packages (ai, auth, mcp, rag) depend only on infrastructure packages (database, cache, logger) and types

## Repository Pattern

- `BaseRepository` provides CRUD operations for MongoDB collections
- `TenantAwareRepository` extends BaseRepository with tenant filtering
- Repositories are interfaces in the domain layer, implemented in the infrastructure layer
- Services depend on repository interfaces, not implementations (Dependency Inversion)

## Feature-First Organization

Within packages, code is organized by feature/domain rather than by technical concern:

```
packages/rag/src/
  chunker/       ← Feature: document chunking
  embedding/     ← Feature: text embedding
  vector-store/  ← Feature: vector search
  retriever/     ← Feature: document retrieval
  re-ranker/     ← Feature: result re-ranking
  context/       ← Feature: context window assembly
  engine.ts      ← Composition: combines features
```

## Multi-Tenant Strategy

- Tenant isolation is enforced at the repository level — every query includes a `tenantId` filter
- Database: tenant-isolated via collection filter (`tenantId` field on every document)
- Cache: key prefixed per tenant (`tenant:{id}:{key}`)
- Storage: path-prefixed per tenant (`tenants/{id}/...`)
- Queue: event metadata includes tenant ID for routing
- Auth: workspaces are tenant boundaries, users can belong to multiple tenants

## Future Microservice Extraction

The monorepo architecture is designed for future extraction into microservices:

1. Well-defined package boundaries — each package has a clear public API surface
2. Repository pattern — database access is abstracted, services depend on interfaces
3. Event-driven integration — cross-domain communication uses events (Inngest or message queue)
4. API composition — Next.js API routes can be extracted into standalone Express/Fastify services
5. Shared types package — ensures contract compatibility between services

Extraction candidates (in order):
1. `@repo/ai` → AI Gateway service
2. `@repo/mcp` → MCP Gateway service
3. `@repo/rag` → RAG Engine service
4. `@repo/connectors` → Connector sync service
5. `@repo/auth` → Auth service

## Consequences

- All new code follows DDD layered architecture
- Repository pattern must be used for all database access — no direct Mongoose calls outside `@repo/database`
- Package dependencies are reviewed in PRs to prevent circular dependencies
- New features start with domain types in `@repo/types`, then validation schemas in `@repo/validation`, then infrastructure
- The architecture supports incremental extraction to microservices without rewrites
