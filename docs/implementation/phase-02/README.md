# Phase 02: Authentication

> Implement the complete authentication system using Better Auth with email/password, OAuth, MFA, RBAC, and session management.

---

## Objective

Build a production-grade authentication system that handles user registration, login, OAuth (Google, GitHub), password reset, multi-factor authentication (TOTP), session management with refresh token rotation, and role-based access control (RBAC). All auth logic lives in `@repo/auth` and is consumed by the web app.

---

## Scope

| Step | Description |
|------|-------------|
| 02.01 | Better Auth server setup with database adapter |
| 02.02 | Auth schema and Zod validation |
| 02.03 | Email/password authentication |
| 02.04 | OAuth providers (Google, GitHub) |
| 02.05 | Session management |
| 02.06 | RBAC framework |
| 02.07 | Auth middleware |
| 02.08 | Login page |
| 02.09 | Register page |
| 02.10 | Password reset flow |
| 02.11 | MFA setup |
| 02.12 | Verification |

---

## Dependencies

Depends on Phase 00 (types, validation, database, logger, cache, crypto). Login/register pages depend on web app layout from Phase 01.

---

## Architecture Constraints

- Auth library: Better Auth (not Auth.js, not Clerk)
- Sessions stored in Redis via `@repo/cache` (for performance), with MongoDB as fallback
- RBAC enforced at middleware, service, and UI layers
- MFA uses TOTP (authenticator app) — no SMS or email MFA
- OAuth tokens encrypted with `@repo/crypto` before storage
- Rate limiting on auth endpoints via `@repo/cache`

---

## Expected Outputs

1. Better Auth configured with MongoDB adapter and email/password provider
2. Login page at `/login` with email/password and OAuth buttons
3. Register page at `/register` with email verification flow
4. Password reset flow with email notification
5. OAuth login with Google and GitHub
6. MFA enrollment and verification with TOTP
7. RBAC enforcement with 4 roles (owner, admin, member, viewer)
8. Auth middleware protecting all routes except public ones
9. Session management with configurable TTL and refresh rotation
10. Rate limiting on all auth endpoints

---

## Step Map

| File | Step | Description |
|------|------|-------------|
| `02.01-better-auth-setup.md` | 02.01 | Better Auth server setup |
| `02.02-auth-schema.md` | 02.02 | Auth schema and validation |
| `02.03-email-password.md` | 02.03 | Email/password auth |
| `02.04-oauth.md` | 02.04 | OAuth providers |
| `02.05-session-management.md` | 02.05 | Session management |
| `02.06-rbac.md` | 02.06 | RBAC framework |
| `02.07-auth-middleware.md` | 02.07 | Auth middleware |
| `02.08-login-page.md` | 02.08 | Login page |
| `02.09-register-page.md` | 02.09 | Register page |
| `02.10-password-reset.md` | 02.10 | Password reset flow |
| `02.11-mfa.md` | 02.11 | MFA setup |
| `02.12-verification.md` | 02.12 | Verification |
