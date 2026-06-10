# TypeScript Standard

## Configuration

- `strict: true` — never disable
- `noUncheckedIndexedAccess: true` — never disable
- `exactOptionalPropertyTypes: true` — never disable
- `noImplicitReturns: true` — never disable
- `noFallthroughCasesInSwitch: true` — always enabled
- `skipLibCheck: true` — acceptable for build speed

## Types

- Prefer `interface` for object shapes (extends, implements, declaration merging)
- Prefer `type` for unions, intersections, tuples, mapped types
- Branded types for domain identifiers: `type UserId = string & { __brand: "UserId" }`
- Never use `any` — use `unknown` with type guards
- Never use `as` casts — use type guards or zod parsing
- Prefer `const` over `let` for immutable bindings

## Generics

- Meaningful type parameter names: `TEntity`, `TId`, `TData`
- Constrain generics with `extends` where possible
- Use `satisfies` for type validation without widening

## Utility Types

```typescript
type DeepPartial<T> = T extends object ? { [P in keyof T]?: DeepPartial<T[P]> } : T;
type Nullable<T> = T | null | undefined;
type Brand<T, B> = T & { __brand: B };
```

## Functions

- Explicit return types on all public functions
- Use overloads for varying parameter shapes
- Prefer `function` keyword for standalone functions
- Prefer arrow functions for callbacks and short utilities
