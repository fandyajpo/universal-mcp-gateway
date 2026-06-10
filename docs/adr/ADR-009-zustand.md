# ADR-009: Zustand

## Status

Accepted

## Context

The platform requires client-side state management for UI state (modals, sidebars, active workspace, theme, preferences) that is not server data. This is separate from server state managed by TanStack Query.

## Decision

Use Zustand for client-side state management.

## Rationale

- **Minimal boilerplate** — create a store with a single function call, no providers, no reducers, no actions
- **No providers** — stores are accessed via hooks directly, no wrapping components in Provider trees
- **TypeScript-first** — excellent type inference with minimal type annotations
- **Immer middleware** — enables mutable-style state updates with immutable state under the hood
- **Persist middleware** — automatic state persistence to localStorage/sessionStorage
- **Devtools middleware** — Redux DevTools integration for debugging
- **Tiny bundle** — ~1KB gzipped, negligible impact on bundle size
- **React 19 compatible** — works with the latest React without workarounds
- **Selective subscriptions** — components only re-render when selected state changes, not the entire store
- **Middleware ecosystem** — persist, immer, devtools, subscribeWithSelector, and custom middleware

## Trade-offs

- No built-in side effects handling (unlike Redux Saga/Thunk) — side effects belong in TanStack Query or React hooks, not in stores
- No built-in normalization — must handle yourself for complex relational state
- Less structured than Redux — requires team discipline to avoid spaghetti stores

## Rejected Alternatives

- **Redux Toolkit** — the most popular state management library but heavier (~12KB), requires more boilerplate (slices, reducers, actions, providers), and much of its value (RTK Query) overlaps with TanStack Query. Using Redux for UI state alone is overkill
- **Jotai** — similar to Zustand but uses atomic state primitives. Good for fine-grained reactivity but can lead to many small atoms that are harder to manage at scale
- **Valtio** — proxy-based state management, simpler mental model but less TypeScript-friendly due to proxy wrapping
- **Context + useReducer** — built-in but causes unnecessary re-renders for frequent updates, no middleware, no devtools, no persist. Context is suitable for dependency injection, not state management
- **Recoil** — Meta-maintained but has been in experimental/beta for years, larger bundle, complex atom/selector model
- **MobX** — powerful but too much magic with observables, less TypeScript-friendly, outdated ecosystem

## Consequences

- Zustand stores are used for: UI state (sidebar, modals, theme), workspace context, preferences, and transient form state
- Server data is NOT stored in Zustand — it belongs in TanStack Query's cache
- Stores are split by domain: `useUIStore`, `useWorkspaceStore`, `usePreferencesStore`
- The persist middleware is used for preferences and workspace selection
- Stores are defined in `@repo/stores` (future package) or colocated in apps
