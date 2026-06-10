# ADR-005: Better Auth

## Status

Accepted

## Context

The platform requires authentication with email/password, OAuth providers, session management, MFA, and RBAC. The solution must integrate well with Next.js and support multi-tenancy.

## Decision

Use Better Auth as the authentication library.

## Rationale

- **Next.js native** — designed for Next.js App Router with built-in middleware, server actions, and API route support
- **Type-safe** — full TypeScript support with inferred types for session, user, and account data
- **Database agnostic** — supports MongoDB, PostgreSQL (via Drizzle), SQLite, and more
- **OAuth built-in** — Google, GitHub, Discord providers included out of the box
- **MFA support** — TOTP and backup codes for multi-factor authentication
- **Session management** — automatic session rotation, expiration, and revocation
- **Rate limiting** — built-in rate limiting for auth endpoints
- **API keys** — supports API key authentication for programmatic access
- **Organization support** — built-in multi-tenancy with teams and roles
- **Active development** — frequent releases, responsive maintainers, growing community

## Trade-offs

- Newer library compared to NextAuth.js (libraries.io: introduced 2024) — smaller community
- MongoDB adapter is community-maintained rather than official
- Less documentation and fewer examples than established alternatives
- Organization/team features are evolving rapidly — API may change

## Rejected Alternatives

- **NextAuth.js (Auth.js)** — mature and widely adopted but has several pain points: complex callback system, difficult custom session extensions, MongoDB support is an afterthought (requires adapter), and middleware integration requires workarounds. The v5 rewrite has been in beta for an extended period
- **Clerk** — excellent DX and feature-rich but proprietary, expensive at scale, and creates vendor lock-in for user data. Cannot self-host
- **Auth0** — enterprise-grade but expensive, complex configuration, and proprietary. Better suited for large enterprises with compliance requirements
- **Supabase Auth** — well-integrated with Supabase ecosystem but tied to PostgreSQL and requires Supabase hosting
- **Custom auth** — full control but significant security risk and engineering effort to implement password hashing, session management, OAuth, MFA, rate limiting, and audit logging correctly

## Consequences

- `@repo/auth` wraps Better Auth configuration and exposes clean interfaces for the rest of the application
- Auth middleware in each Next.js app checks session validity and redirects unauthenticated users
- RBAC is implemented using Better Auth's roles/permissions system
- Multi-tenancy leverages Better Auth's organization features
- Future migration to a different provider is possible because `@repo/auth` abstracts the implementation
