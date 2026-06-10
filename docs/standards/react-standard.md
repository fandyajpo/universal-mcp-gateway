# React Standard

## Component Types

- Server Components by default
- Client Components only when interactivity or browser APIs needed
- `'use client'` at the top of client component files

## Component Structure

```typescript
// Imports
// Types/Interfaces
// Component function
// Sub-components (if private)
// Styles (if any)
// Default export (avoid — use named)
```

## Props

- `interface [Name]Props` — explicit, documented
- Destructure props in function signature
- Default values in destructuring, not in prop types

## State

- Server state: TanStack Query
- Client state: Zustand
- URL state: nuqs
- Form state: React Hook Form

## Event Handlers

```typescript
const handleSubmit = useCallback(async (data: FormData) => {
  // implementation
}, [dependencies]);
```

## Hooks

- Custom hooks in `hooks/` directory
- Prefix with `use`
- Return typed object with named properties
- Encapsulate side effects
