# ADR-008: TanStack Query

## Status

Accepted

## Context

The platform needs server state management — caching API responses, optimistic updates, background refetching, and pagination. This is a separate concern from client-side state (UI state, modals, etc.).

## Decision

Use TanStack Query (React Query) for all server state management.

## Rationale

- **Declarative data fetching** — components declare data dependencies, Query handles caching, refetching, and invalidation
- **Automatic caching** — in-memory cache with configurable stale times, prevents redundant API calls
- **Background refetching** — automatically refetches stale data when window regains focus or network reconnects
- **Optimistic updates** — update UI immediately while mutation is in flight, rollback on failure
- **Infinite queries** — built-in pagination pattern for cursor and offset-based pagination
- **Query invalidation** — invalidate queries by key pattern after mutations to trigger refetches
- **Devtools** — excellent developer tools for debugging query states
- **TypeScript-first** — full type inference for query keys, variables, and responses
- **React 19 compatible** — supports the latest React features including use() and Suspense

## Trade-offs

- Adds ~12KB to bundle (gzipped ~4KB) — acceptable for the functionality provided
- Learning curve for advanced patterns (optimistic updates, infinite queries, query cancellation)
- Over-fetching can occur if queries are not granular enough
- Cache invalidation strategy requires careful design to avoid stale data

## Rejected Alternatives

- **SWR** — simpler API but less feature-rich (no mutations, no optimistic updates out of the box, no devtools)
- **RTK Query** — tied to Redux Toolkit, adds Redux overhead. Good if already using Redux but we're using Zustand
- **useEffect + fetch** — no caching, no deduplication, no background refetching, manual error handling
- **Relay/GraphQL** — too opinionated, requires GraphQL backend, overkill for REST API patterns
- **urql** — GraphQL-specific, not applicable for REST/procedure-based APIs

## Consequences

- All server data fetching uses TanStack Query hooks
- Query keys follow a convention: `["domain", "entity", {id, filters}]`
- Infinite queries for paginated lists (chat history, documents, audit logs)
- Mutations use `useMutation` with `onSuccess` callbacks for cache invalidation
- Default stale time is 30 seconds for real-time data, 5 minutes for reference data
