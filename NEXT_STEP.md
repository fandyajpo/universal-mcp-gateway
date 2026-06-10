# Next Step

## Current Position

- **Phase:** 01 (Bootstrap)
- **Step:** 01.07 — App layout, navigation, and shell (web) — shared layout components, sidebar navigation, top navigation bar, responsive shell.
- **Progress:** Phase 0 complete. Phase 1 — all four apps scaffolded, shared TailwindCSS theme configured, shadcn/ui components registered. Next: app layout, navigation, and shell for the web app.

## Next Implementation

**Step 01.07: App Layout, Navigation, and Shell (Web)**

Build the shared app shell for the web application, including sidebar navigation, top navigation bar, responsive layout, and breadcrumb components.

## Dependencies

| Dependency | Status | Notes |
|---|---|---|---|
| @repo/types | Done | Zero-dependency foundation types |
| @repo/ui | Done | shadcn/ui component library with 19 components |
| @repo/config | Done | Environment config with Zod |
| apps/web scaffold | Done | Main web app scaffolded |
| apps/admin scaffold | Done | Admin dashboard scaffolded |
| apps/docs scaffold | Done | Documentation site scaffolded |
| apps/landing scaffold | Done | Marketing landing page scaffolded |
| TailwindCSS theme | Done | Shared theme with CSS variables + dark mode |
| shadcn/ui registration | Done | All components registered and re-exported |

## Warnings

1. Do NOT modify the tsconfig.base.json — it provides strict mode shared across all packages.
2. Do NOT skip typecheck before marking a step complete.
3. Do not introduce `any` without justification in an ADR.
4. All Next.js apps must use the same scaffold pattern established in 01.01-01.03.
5. Shared shadcn/ui components are in @repo/ui; apps should only re-export, not duplicate.

## Preparation Before Next Step

1. [ ] Read `docs/implementation/phase-01/01.07-layout-navigation.md`
2. [ ] Review existing Next.js app layout patterns in apps/web/src/app/layout.tsx
3. [ ] Review @repo/ui components available for building the shell

## After Completion

Update STATUS.md and mark Step 01.06 as complete before proceeding to Step 01.07.

## Quick Reference

```bash
pnpm dev --filter @repo/web       # Start web app
pnpm dev --filter @repo/landing   # Start landing app
pnpm typecheck                    # TypeScript check
pnpm lint                         # ESLint check
pnpm verify                       # Run verification suite
```
