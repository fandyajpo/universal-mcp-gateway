# Next.js Standard

## App Router

- App Router for all applications. Pages Router is not used.
- Route segments use `[param]` for dynamic params
- Route groups `(group)` for layout organization
- Parallel routes `@modal` for modals/sidebars

## Layouts

- Root layout in `app/layout.tsx`
- Nested layouts for section-specific shells
- `loading.tsx` for loading states
- `error.tsx` for error boundaries
- `not-found.tsx` for 404 pages

## Data Fetching

- Server Components: direct data access via repositories
- Client Components: TanStack Query hooks
- Server Actions for mutations
- `revalidateTag` / `revalidatePath` for cache invalidation

## Middleware

- Auth checks in `src/middleware.ts`
- Tenant resolution in middleware
- Redirect logic in middleware
- CSP headers in middleware

## API Routes

- Route handlers in `app/api/[route]/route.ts`
- Named exports: `GET`, `POST`, `PUT`, `PATCH`, `DELETE`
- Validation with Zod in each handler
- Consistent error response format

## Configuration

- `transpilePackages` in next.config.ts for monorepo packages
- `reactCompiler: true` in experimental
- Image optimization with `next/image`
- Font optimization with `next/font`
