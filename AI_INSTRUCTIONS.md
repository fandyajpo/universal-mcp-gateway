# AI_INSTRUCTIONS — Engineering Rules for AI Assistants

> **Authority:** This document is derived from `PROJECT_CONSTITUTION.md` — the highest authority document. In case of any conflict, `PROJECT_CONSTITUTION.md` prevails.
>
> This document provides actionable, day-to-day rules for AI assistants. Read `PROJECT_CONSTITUTION.md` first for principles and context.

---

## 1. Architecture Compliance

### 1.1 Clean Architecture

- **NEVER** violate Clean Architecture boundaries. Domain layer must NOT depend on Infrastructure layer.
- Repository interfaces belong in the domain layer. Implementations belong in the infrastructure layer.
- Use cases orchestrate domain objects. They do NOT contain database or HTTP logic.

### 1.2 Repository Pattern

- **ALWAYS** use the Repository Pattern for database access. NEVER call Mongoose directly from services, route handlers, or components.
- `TenantAwareRepository` must be used for all tenant-scoped data access.
- Repositories return domain entities, not database documents.

### 1.3 Dependency Inversion

- High-level modules must NOT depend on low-level modules. Both depend on abstractions.
- Services depend on repository interfaces, not concrete implementations.

### 1.4 Package Boundaries

- **NEVER** break package boundaries. A package exports only what is in its `src/index.ts`.
- `@repo/types` must remain zero-dependency — it is the foundation of the type system.
- Packages must NOT depend on apps. Apps depend on packages.
- Circular dependencies between packages are FORBIDDEN. Detect and eliminate them immediately.

---

## 2. Code Quality

### 2.1 TypeScript

- **NEVER** use `any` without written justification in a comment. Prefer `unknown` and narrow with type guards.
- Enable all strict mode checks. Do NOT disable `strict`, `noUncheckedIndexedAccess`, or `noImplicitAny`.
- Prefer `interface` over `type` for object shapes. Use `type` for unions, intersections, and utility types.
- Use `const` assertions for literal types and configuration objects.
- Mark all public APIs with explicit return types. Do NOT rely on type inference for exported functions.
- Use branded types for domain identifiers: `UserId`, `WorkspaceId`, `TenantId`.

### 2.2 Naming Conventions

- PascalCase: components, classes, types, interfaces, enums
- camelCase: functions, methods, variables, properties, parameters
- kebab-case: filenames for config files, directories
- camelCase: filenames for utilities and hooks
- SCREAMING_SNAKE_CASE: constants, environment variables, enum values
- Prefix event handlers with `handle`: `handleSubmit`, `handleClick`
- Prefix boolean variables with `is`, `has`, `should`: `isLoading`, `hasError`

### 2.3 Imports

- Group order: external → internal (`@repo/*`) → relative (`./`, `../`)
- Use path aliases: `@repo/ai/` instead of relative paths inside apps
- Named exports only. NO default exports — they break renaming and tree-shaking.
- Barrel files (`index.ts`) re-export only. NO implementation logic in barrel files.

### 2.4 Functions

- Every public function must have JSDoc describing its purpose, parameters, and return value.
- Pure functions preferred over functions with side effects.
- Functions should do one thing. Max 30 lines per function.
- Minimize optional parameters — prefer explicit overloads or options objects.

---

## 3. React & Next.js

### 3.1 Server Components

- **PREFER** Server Components by default. Only add `'use client'` when you need interactivity, browser APIs, or hooks.
- Keep data fetching in Server Components. Pass data as props to Client Components.
- Use Next.js `loading.tsx` and `error.tsx` conventions for boundary states.

### 3.2 Client Components

- Minimize the number of Client Components. Each one increases the client bundle.
- Push state management down to the leaves of the component tree.
- Use `useMemo` and `useCallback` only when profiling shows a performance issue — not preemptively.

### 3.3 Server Actions

- Use Server Actions for form submissions and mutations.
- Validate all inputs with Zod before processing.
- Return typed responses, not raw errors.
- Keep business logic OUT of route handlers and Server Actions. Call service layer functions instead.

### 3.4 TanStack Query

- Server state belongs in TanStack Query cache, NOT in Zustand.
- Every query must have a unique key following the convention: `["domain", "entity", {id, filters}]`
- Use `queryOptions` factory functions for reusable query configurations.
- Mutations invalidate related queries on success.

### 3.5 Zustand

- Client state only: UI state (modals, sidebars, theme, preferences).
- NEVER store server data in Zustand — it belongs in TanStack Query.
- Store actions dispatch side-effect-free state changes. Side effects belong in components or hooks.

## 3.6 Next.js Rendering Strategy

### Static vs Dynamic

- Prefer Static Rendering whenever data rarely changes.
- Prefer ISR when data changes periodically.
- Use Dynamic Rendering only when request-specific information is required.
- Dynamic rendering should be the exception, not the default.
- Avoid unnecessary calls to `cookies()`, `headers()`, or `searchParams` that force dynamic rendering.

### Streaming

- Use Suspense boundaries around slow asynchronous sections.
- Stream independent content instead of blocking the entire page.
- Split multiple slow sections into separate Suspense boundaries.

### Data Fetching

- Fetch independent resources in parallel using `Promise.all`.
- Avoid sequential awaits unless dependencies exist.
- Never fetch identical resources twice.
- Prefer server-side fetching over client-side fetching.

### Cache

- Prefer cache over repeated computation.
- Cache expensive operations whenever consistency allows.
- Invalidate cache precisely.
- Prefer tag-based invalidation instead of global invalidation.

---

## 3.7 Next.js File Convention

### layout.tsx

Use layout.tsx for UI that should persist between navigations.

Examples:

- navigation
- sidebar
- providers
- authentication wrapper
- theme provider

Do not place page-specific state inside layouts.

---

### template.tsx

Use template.tsx only when subtree remounting is desired.

Examples:

- restarting animations
- clearing local state
- resetting forms
- restarting transitions

Prefer layout.tsx whenever remount behavior is unnecessary.

---

### loading.tsx

- Prefer skeleton loaders over spinners.
- Skeletons should preserve final layout dimensions.
- Prevent cumulative layout shift.

---

### error.tsx

Every major route should have an error boundary.

Error pages should:

- allow retry
- preserve navigation
- avoid leaking implementation details

---

### not-found.tsx

Missing resources should render not-found.tsx.

Do not redirect missing pages to the home page.

Return proper HTTP 404 status.

---

## 3.8 Image Optimization

- Always prefer `next/image`.
- Use `priority` only for LCP images.
- Lazy load non-critical images.
- Always specify width and height.
- Prevent cumulative layout shift.
- Prefer AVIF or WebP.
- Avoid PNG unless transparency is required.
- Decorative images should have empty alt text.
- Meaningful images require descriptive alt text.
- Do not optimize SVG through `next/image` unless necessary.

---

## 3.9 React Performance

Before using memoization, optimize architecture.

Prefer:

- state colocation
- composition
- splitting components
- reducing props
- reducing context updates

Use `useMemo` only for expensive calculations.

Use `useCallback` only when referential stability matters.

Never memoize prematurely.

Reduce client-side JavaScript whenever possible.

---

## 3.10 React Patterns

Prefer:

- composition
- custom hooks
- compound components
- headless components
- controlled state

Avoid:

- prop drilling across many levels
- giant components
- duplicated state
- duplicated effects

Derived values should be computed instead of stored.

---

## 3.11 TanStack Query Best Practices

Every query should define:

- staleTime
- gcTime
- queryKey
- retry strategy

Use optimistic updates only when rollback is possible.

Invalidate only affected queries.

Never duplicate server state inside Zustand.

Use prefetching for predictable navigation.

Cancel obsolete requests.

---

## 3.12 Zustand Best Practices

Zustand is for client UI state only.

Allowed:

- theme
- modal state
- sidebar state
- wizard progress
- UI preferences

Forbidden:

- API responses
- server cache
- pagination data
- user profile fetched from backend

Prefer slices over monolithic stores.

Prefer selectors over direct state access.

---

## 3.13 Forms

Prefer:

- React Hook Form
- Zod
- Server Actions

Validation schema should be the single source of truth.

Infer types from Zod.

Never duplicate validation rules.

Prefer optimistic UI for fast interactions.

---

## 3.14 Accessibility

Every interactive element must be keyboard accessible.

Forms require labels.

Dialogs require focus trapping.

Images require alt text.

Prefer semantic HTML over generic divs.

Meet WCAG AA whenever practical.

---

## 3.15 Performance Budget

AI should actively reduce:

- bundle size
- hydration cost
- rerenders
- memory allocation
- network requests
- layout shift
- TTFB
- LCP
- INP

Architecture improvements take precedence over memoization.

Minimize client-side JavaScript.

Prefer Server Components whenever possible.

---

## 4. Data

### 4.1 Database Access

- ALL database access goes through `@repo/database` repositories.
- EVERY query must include `tenantId` filter for multi-tenant isolation.
- Use Mongoose schemas for document validation at the database layer.
- Define indexes in schema files. Do NOT create indexes manually.

### 4.2 Validation

- ALL user input must be validated with Zod schemas from `@repo/validation`.
- Validate at the API boundary (server action, route handler) before processing.
- Share validation schemas between client and server using the `@repo/validation` package.
- Infer TypeScript types from Zod schemas, do NOT duplicate type definitions.

### 4.3 Caching

- Use `@repo/cache` for all Redis interactions.
- Cache keys follow the pattern: `tenant:{tenantId}:{domain}:{entity}:{id}:{field}`
- Set appropriate TTLs. Never cache without TTL.
- Invalidate cache on mutations, not on reads.

### 4.4 Logging

- Use `@repo/logger` for all logging. NEVER use `console.log`.
- Include correlation IDs in every log line for request tracing.
- Log at appropriate levels: debug (development), info (normal ops), warn (unexpected but handled), error (failure).
- Never log secrets, tokens, or personal data.

---

## 5. Security

### 5.1 Authentication & Authorization

- EVERY route must verify authentication unless explicitly marked as public.
- RBAC checks happen at the service layer, not the UI layer.
- API keys are hashed with bcrypt before storage. The raw key is shown exactly once at creation.
- Sessions are rotated on privilege escalation.

### 5.2 Input Handling

- Sanitize all user input at the API boundary.
- Use parameterized queries / prepared statements for all database operations.
- Escape output in all rendering contexts.
- Set CSP headers on all responses.

### 5.3 Secrets

- NEVER commit secrets, API keys, tokens, passwords, or connection strings.
- All secrets are environment variables. Access them through `@repo/config`.
- `.env` files are gitignored. Use `.env.example` as the template.

---

## 6. Testing

### 6.1 Test Coverage

- Unit tests required for all services, repositories, and utilities.
- Integration tests required for all API routes and server actions.
- Component tests required for all interactive UI components.
- Minimum 80% coverage on new code.

### 6.2 Test Patterns

- Tests are colocated with source files: `src/**/*.test.ts`
- Use factories/fixtures for test data, not production data.
- Mock external services (OpenRouter, Inngest, Redis, R2) in unit tests.
- Test error cases, edge cases, and happy paths.

---

## 7. Process

### 7.1 Before Writing Code

1. Read `AI_INSTRUCTIONS.md` (this file)
2. Read `NEXT_STEP.md` to know current position
3. Read the step document in `docs/implementation/phase-XX/`
4. Read `STATUS.md` for full context
5. Read `ARCHITECTURE.md` for system architecture
6. Read the relevant package or app README
7. Read existing similar implementations for pattern consistency

### 7.2 After Writing Code

1. Run `pnpm typecheck` — fix all type errors
2. Run `pnpm lint` — fix all lint errors
3. Run `pnpm test` — ensure tests pass
4. Update `STATUS.md` with progress
5. Update `NEXT_STEP.md` to point to the next step
6. Update `CHANGELOG.md` with a summary of changes
7. Update `ROADMAP.md` if scope changed

### 7.3 Scope Management

- Do NOT implement features outside the current step's scope.
- Do NOT modify files outside the current step's `Files To Modify` list.
- If you discover missing functionality, document it as technical debt in STATUS.md, not as a feature addition.

### 7.4 When Blocked

1. Document the blocker in STATUS.md under "Blocked"
2. Move to the next independent step
3. Return to the blocked step when dependencies are resolved

---

## 8. Documentation

- Every package must have a README.md explaining its purpose, public API, and dependencies.
- Every public function must have JSDoc.
- Architecture changes require an ADR.
- API changes require documentation in `docs/api/`.
- All documentation uses markdown. Diagrams use Mermaid.

---

## 9. Prohibited Patterns

| Forbidden                    | Replacement                              |
| ---------------------------- | ---------------------------------------- |
| `any` type                   | `unknown` + type guard                   |
| `null`                       | `undefined` or `Option<T>`               |
| default exports              | named exports                            |
| `console.log`                | `@repo/logger`                           |
| direct Mongoose in services  | Repository Pattern                       |
| `// @ts-ignore`              | Fix the type                             |
| `!` (non-null assertion)     | Proper narrowing                         |
| `Object.assign`              | Spread or `deepMerge` from `@repo/utils` |
| magic strings/numbers        | Constants or enums                       |
| synchronous I/O              | async/await                              |
| nested ternaries             | Early returns or switch                  |
| `any` in generic constraints | Proper constraints                       |
| direct `fetch` in components | Custom hooks with TanStack Query         |

---

## 10. Enforcement

Violations of this constitution should be:

1. Flagged in code review
2. Documented as technical debt in STATUS.md
3. Fixed before merging

AI assistants are expected to follow this constitution autonomously. If a trade-off is necessary, document the exception with a comment explaining why and reference this document.
