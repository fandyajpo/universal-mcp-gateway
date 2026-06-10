# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

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
- Phase 0: Verification suite (64 cross-package tests)
- Phase 0: commitlint + husky + lint-staged (conventional commits enforced)
- Phase 1: apps/web scaffold with Next.js 15 App Router
  - Root layout with Inter font, skip-to-content link, metadata
  - Route placeholders: /chat, /settings
  - Error, loading, and not-found boundaries
  - Security headers (CSP, HSTS, X-Frame-Options, etc.)
  - Client-safe env bridge (src/lib/env.ts)
  - ESLint config following @repo/config-eslint pattern
- Phase 1: apps/admin scaffold with Next.js 15 App Router
  - Root layout with admin-specific metadata, skip-to-content link
  - Route placeholders: /dashboard, /users, /workspaces, /billing, /audit-logs, /settings
  - Error, loading, and not-found boundaries
  - Security headers (CSP, HSTS, X-Frame-Options, etc.)
  - ESLint config following @repo/config-eslint pattern
- Phase 1: apps/docs scaffold with Next.js 15 and MDX support
  - Root layout with docs-specific metadata, skip-to-content link
  - Two-column /docs layout with sidebar navigation
  - Catch-all route [[...slug]] for MDX content pages
  - MDX component registry (mdx-components.tsx)
  - @next/mdx, @mdx-js/loader, @mdx-js/react, next-mdx-remote deps
