# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Workspace CRUD API with Zod validation and RBAC enforcement
- Create workspace flow with dialog, slug uniqueness check, avatar upload
- Workspace settings page (name, slug, description, feature flags, archive/restore)
- Member management with role assignment, removal, last-owner guard
- Invitation system: email invite with accept/decline, 20/day rate limit, 7-day expiry
- Workspace switcher dropdown with Zustand persistence and React Query
- Workspace settings sub-navigation for General/Members tabs
- React Query provider for client-side data fetching

### Fixed

- Removed unnecessary type assertions in invitation and workspace repositories
- Removed redundant String() calls in invitation service
- Fixed import ordering in invitation service

- Phase 0: Project foundation
  - TurboRepo monorepo with pnpm workspace
  - TypeScript configuration with strict mode
  - Package architecture with 15 packages
  - Application architecture with 4 apps
  - Architectural Decision Records (ADRs)
  - CI/CD pipeline configuration
  - Documentation framework
  - Security policies and guidelines
  - Contributing guidelines
  - Environment configuration
  - Sentry integration (@repo/config initSentry, @repo/ui ErrorBoundary)
  - Verification suite (64 cross-package tests)
  - commitlint + husky + lint-staged (conventional commits enforced)
- Phase 1: Bootstrap — Complete (all 12 steps)
  - apps/web scaffolded with Next.js 15 App Router (layout, /chat, /settings, loading/error/404, env bridge, security headers)
  - apps/admin scaffolded with Next.js 15 App Router (layout, /dashboard, /users, /workspaces, /billing, /audit-logs, /settings, loading/error/404, security headers)
  - apps/docs scaffolded with Next.js 15 + MDX (layout, MDX support, two-column /docs layout with sidebar, [[...slug]] catch-all, mdx-components registry, loading/error/404, security headers)
  - apps/landing scaffolded with Next.js 15 static export (hero, features, pricing, CTA, footer sections, loading/error/404, eslint, sentry, security headers)
  - TailwindCSS v4 theme configured (shared HSL tokens, dark mode, 4 app presets, ThemeToggle component)
  - shadcn/ui components registered (6 new: Label, Switch, Tabs, Command, Sheet, Tooltip; 19 total; per-app re-export layers)
  - apps/web layout shell (collapsible sidebar 60/280px, top bar, context panel, breadcrumbs, mobile Sheet, Cmd+B/Cmd+I shortcuts)
  - apps/admin layout shell (dark-themed sidebar, 5 nav groups, 15 items, admin badge, support ticket badge, breadcrumbs)
  - apps/docs layout shell (6-section nav tree, 19 pages, IntersectionObserver TOC, header/footer, mobile Sheet)
  - apps/landing page sections (sticky header, hero, 6 feature cards, 4-step how-it-works, 3-tier pricing toggle, CTA signup, footer)
  - react-markdown + Shiki integration in apps/docs (react-markdown, remark-gfm, Shiki dual-theme highlighting, copy-to-clipboard, frontmatter parsing, Callout components, file-based MDX routing)
  - Phase 01 verification suite (24 tests: app names, next.config, root layout metadata, TailwindCSS theme consistency, no cross-app imports; 88 total tests passing across 6 test files)
- Phase 2: Authentication — Complete (all 12 steps)
  - Better Auth server with MongoDB adapter, email/password, multi-session, admin/bearer plugins, workspace plugin
  - Auth Zod schemas (login, register, reset password, verify email, MFA setup/verify, OAuth, session)
  - Email/password authentication (bcrypt cost 12), rate limiting, account lockout, verification/welcome email templates
  - OAuth providers Google and GitHub with account linking
  - Session management with Redis caching, user→sessions index, concurrency enforcement
  - RBAC framework: 17 permissions, 4 roles (owner>admin>member>viewer), Redis cache, Zustand usePermissions hook
  - Auth middleware: session validation, rate limiting (10 req/min/IP), route protection, security headers
  - Login page with form validation, OAuth buttons, error states, MFA redirect
  - Register page with password requirements, email verification flow
  - Password reset flow with no-user-enumeration, email templates, countdown redirect
  - MFA with TOTP (speakeasy), QR code generation, recovery codes (bcrypt hashed), HMAC-signed device trust
  - Security settings page with 3-step MFA enrollment and recovery codes management
  - All 88 verification tests passing, lint/typecheck/build clean
