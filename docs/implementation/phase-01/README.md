# Phase 01: Bootstrap

> Scaffold the four Next.js applications and configure the shared theming, layout, and navigation systems.

---

## Objective

Create the four Next.js 15 applications (web, admin, docs, landing) with proper App Router setup, TailwindCSS theme configuration, shadcn/ui component registration, and complete layout/navigation shells. By the end of this phase, every app must be runnable, themed, and navigable.

---

## Scope

| Step | App | Description |
|------|-----|-------------|
| 01.01 | web | Next.js 15 App Router scaffold with src/ directory |
| 01.02 | admin | Next.js 15 App Router scaffold with src/ directory |
| 01.03 | docs | Next.js 15 App Router scaffold with MDX support |
| 01.04 | landing | Next.js 15 App Router scaffold with static export |
| 01.05 | All | TailwindCSS v4 theme with CSS variables, dark mode |
| 01.06 | All | shadcn/ui component registration and customization |
| 01.07 | web | App layout, navigation, and shell components |
| 01.08 | admin | Admin layout and sidebar navigation |
| 01.09 | docs | Docs layout with sidebar table of contents |
| 01.10 | landing | Landing page sections (hero, features, pricing, CTA) |
| 01.11 | docs | react-markdown + Shiki syntax highlighting |
| 01.12 | All | Verification — all apps build, render, navigate |

---

## Dependencies

All steps depend on Phase 00 completion (types, ui, config packages). Step 01.05 depends on 01.01. Steps 01.07-01.10 depend on their respective app scaffolds and 01.05-01.06.

---

## Expected Outputs

1. Four runnable Next.js 15 apps with proper `package.json`, `tsconfig`, and `next.config`
2. Shared TailwindCSS theme with CSS variable-based design tokens and dark mode
3. shadcn/ui components registered in each app with consistent theming
4. Web app: sidebar navigation, top bar, user menu, workspace switcher shell
5. Admin app: sidebar layout with navigation groups (users, workspaces, billing, audit)
6. Docs app: two-column layout with table of contents sidebar
7. Landing app: hero, features, pricing, and CTA sections
8. react-markdown with Shiki syntax highlighting in the docs app

---

## Architecture Constraints

- Apps must NOT import from each other — only from `@repo/*` packages
- All apps use `src/` directory convention
- All apps share the same TailwindCSS theme via `@repo/ui`
- App-specific layouts are in the app, not in `@repo/ui`
- Only the web app and admin app use client-side auth — docs and landing are public

---

## Completion Criteria

| Criteria | Verification |
|----------|-------------|
| All 4 apps run with `pnpm dev` | `pnpm dev` starts without errors |
| TailwindCSS theme renders correctly | Visual inspection of each app |
| shadcn/ui components render | Buttons, cards, inputs visible on test pages |
| Navigation links work | Click through each app's navigation |
| Dark mode toggles correctly | Toggle dark mode, verify CSS variable change |
| Docs markdown renders with syntax highlighting | Render a test markdown page |
| Landing page sections render | Visual inspection |
| `pnpm build` succeeds for all apps | `pnpm build` exits with code 0 |

---

## Step Map

| File | Step | Description |
|------|------|-------------|
| `01.01-web-app-scaffold.md` | 01.01 | Web app scaffold |
| `01.02-admin-app-scaffold.md` | 01.02 | Admin app scaffold |
| `01.03-docs-app-scaffold.md` | 01.03 | Docs app scaffold |
| `01.04-landing-app-scaffold.md` | 01.04 | Landing app scaffold |
| `01.05-tailwind-theme.md` | 01.05 | TailwindCSS theme config |
| `01.06-shadcn-registration.md` | 01.06 | shadcn/ui component registration |
| `01.07-web-layout.md` | 01.07 | Web app layout and navigation |
| `01.08-admin-layout.md` | 01.08 | Admin layout |
| `01.09-docs-layout.md` | 01.09 | Docs layout |
| `01.10-landing-sections.md` | 01.10 | Landing page sections |
| `01.11-markdown-shiki.md` | 01.11 | react-markdown + Shiki |
| `01.12-verification.md` | 01.12 | Verification |
