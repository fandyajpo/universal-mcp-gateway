# Testing Standard

## Test Framework

- Vitest for unit and integration tests
- Testing Library for React component tests
- Playwright for E2E tests
- MSW (Mock Service Worker) for API mocking

## Test Structure

- Colocated with source: `src/[module].test.ts`
- Describe blocks for test groups
- It blocks for individual tests
- Arrange-Act-Assert pattern
- Factory functions for test data

## Coverage

- Line coverage: >= 80%
- Branch coverage: >= 70%
- Function coverage: >= 90%
- New code must maintain or improve coverage

## What to Test

- Services: all public methods, error cases, edge cases
- Repositories: CRUD operations, tenant filtering, error handling
- Components: rendering, interactions, loading/error/empty states
- Hooks: state changes, side effects, cleanup
- API routes: status codes, response shape, validation errors
- Utils: input/output pairs, edge cases, type correctness

## What NOT to Test

- Internal implementation details (test behavior, not implementation)
- Third-party library internals
- Generated code
- Configuration files

## Mocking

- Mock external services: OpenRouter, Redis, R2, Inngest
- Do NOT mock database — use in-memory MongoDB (mongodb-memory-server)
- Mock at the boundary, not internally
- `vi.mock()` for module-level mocking
