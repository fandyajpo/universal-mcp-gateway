# Hook: use[Name]

## Package
App-level (`apps/*/src/hooks/`)

## Signature

```typescript
function use[Name](options?: [Name]Options): [Name]Result
```

## Parameters

## Return Value

## Dependencies

- TanStack Query (server state)
- Zustand (client state, if needed)

## Usage

```typescript
const { data, isLoading, error } = use[Name]({ id });
```

## Tests
