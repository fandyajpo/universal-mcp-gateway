# ADR-002: TurboRepo Monorepo

## Status

Accepted

## Context

The platform consists of multiple applications (web, admin, docs, landing) and shared packages (ai, auth, database, etc.). A monorepo tool is needed to manage dependencies, build orchestration, and cross-package concerns efficiently.

## Decision

Use TurboRepo with pnpm workspaces as the monorepo management tool.

## Rationale

- **Incremental builds** — TurboRepo caches build outputs and skips unchanged packages, reducing CI times from minutes to seconds
- **Parallel execution** — runs build, lint, test tasks across packages in parallel respecting dependency order
- **Remote caching** — supports shared build caches across CI and local development
- **pnpm-native** — works directly with pnpm workspaces without additional abstraction layers
- **Task graph** — declarative `turbo.json` pipeline configuration with dependency tracking
- **Minimal configuration** — no need for Nx-style workspace generators or plugins
- **Zero-config** — works out of the box with TypeScript, Next.js, and the existing toolchain

## Trade-offs

- Less extensible than Nx (no custom executors, fewer code-generation features)
- Caching can cause confusion when stale cache is used incorrectly
- No built-in dependency graph visualization

## Rejected Alternatives

- **Nx** — more powerful but heavier, steeper learning curve, more configuration overhead. The extensibility is unnecessary for our use case
- **Lerna** — deprecated in maintenance mode, no longer recommended for new projects
- **npm workspaces only** — lacks build orchestration, caching, and task scheduling
- **Bazel** — enterprise-grade but massive overhead for this scale
- **Turborepo vs Nx** — Nx was the primary alternative. Nx offers more features (generators, executors, dependency graphs) but adds complexity. TurboRepo's simplicity aligns with keeping the foundation lean

## Consequences

- All packages are referenced via `workspace:*` protocol in package.json
- `turbo.json` defines the pipeline for build, dev, lint, test, and typecheck
- Remote caching should be configured for CI speed
- Packages explicitly declare inter-package dependencies so TurboRepo can optimize the build graph
