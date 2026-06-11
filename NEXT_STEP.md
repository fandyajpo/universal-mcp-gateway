# Next Step

## Current Position

- **Phase:** 01 (Bootstrap)
- **Step:** 01.09 — App layout, navigation, and shell (docs) — docs layout shell, sidebar with table of contents, top navigation bar, responsive shell.
- **Progress:** Phase 0 complete. Phase 1 — all four apps scaffolded, shared TailwindCSS theme configured, shadcn/ui components registered, web app layout shell built, admin layout shell built. Next: docs app layout and navigation shell.

## Next Implementation

**Step 01.09: App Layout, Navigation, and Shell (Docs)**

Build the docs app layout shell with documentation-specific sidebar (table of contents), top navigation bar, and responsive shell structure.

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
| Web app layout shell | Done | Sidebar, topbar, context panel, breadcrumbs, store, keyboard shortcuts |
| Admin app layout shell | Done | Dark sidebar with nav groups, admin badge, topbar |

## Warnings

1. Do NOT modify the tsconfig.base.json — it provides strict mode shared across all packages.
2. Do NOT skip typecheck before marking a step complete.
3. Do not introduce `any` without justification in an ADR.
4. All Next.js apps must use the same scaffold pattern established in 01.01-01.03.
5. Shared shadcn/ui components are in @repo/ui; apps should only re-export, not duplicate.
6. The docs layout should follow a different pattern than web/admin — two-column layout with sidebar Table of Contents.

## Preparation Before Next Step

1. [ ] Read `docs/implementation/phase-01/01.09-docs-layout.md`
2. [ ] Review the docs app existing layout at apps/docs/src/app/docs/layout.tsx
3. [ ] Review @repo/ui components available for building the docs shell

## After Completion

Update STATUS.md and mark Step 01.08 as complete before proceeding to Step 01.09.

## Quick Reference

```bash
pnpm dev --filter @repo/web       # Start web app
pnpm dev --filter @repo/landing   # Start landing app
pnpm typecheck                    # TypeScript check
pnpm lint                         # ESLint check
pnpm verify                       # Run verification suite
```
