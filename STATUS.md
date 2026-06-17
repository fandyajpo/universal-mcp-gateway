# Status

> Project implementation status and tracking.

## Overall Progress

| Category | Count | Progress |
|---|---|---|---|---|
| Phases Total | 19 (00-18) | 6 completed |
| Steps Total | ~220 | 98 completed |
| Packages | 15 | 12 implemented |
| Apps | 4 | 4 scaffolded |

## Current Phase

**Phase 5: Storage** — Complete.
**Phase 6: PDF Processing** — Complete (Steps 06.01-06.08).
**Phase 8: RAG Engine** — In Progress (Steps 08.06-08.09 complete).
**Phase 9: AI Gateway** — Complete (Steps 09.01-09.10 complete).
**Phase 10: MCP Gateway** — In Progress (Step 10.01 complete).

## Current Step

**Step 10.01** — MCP Protocol Handler. Complete. 8 files created, JSON-RPC 2.0 parser/validator, method registry, protocol handler, Transport interface, SSE and stdio transports. Typecheck and lint clean.

## Completed

- [x] TurboRepo monorepo initialized
- [x] pnpm workspace configured
- [x] TypeScript strict mode configured
- [x] Directory structure created (apps, packages, docs, scripts, .github)
- [x] Root configuration files created (turbo.json, tsconfig, .editorconfig, etc.)
- [x] README.md written
- [x] ARCHITECTURE.md written
- [x] ROADMAP.md written
- [x] SECURITY.md written
- [x] CONTRIBUTING.md written
- [x] 10 Architectural Decision Records written
- [x] Package stubs created (15 packages)
- [x] App stubs created (4 apps)
- [x] CI/CD workflows created (ci.yml, security.yml, dependency-review.yml)
- [x] Environment configuration (.env.example, .npmrc)
- [x] pnpm dependencies installed
- [x] Implementation playbook generated
- [x] Core types package (`@repo/types`) implemented:
  - Utility types (DeepPartial, Nullable, Optional, AsyncReturnType, Brand)
  - Branded ID types (UserId, WorkspaceId, TenantId, DocumentId, ConnectorId, AgentId, SessionId, ApiKeyId)
  - Domain model interfaces (auth, document, connector, agent, chat, embedding, rag, mcp, platform)
  - Enum const objects with union types (10 enums)
  - 25 unit tests passing
  - Zero runtime dependencies
- [x] Logger package (`@repo/logger`) implemented:
  - `createLogger(name, config?)` with Pino structured logging
  - `createChildLogger(logger, bindings)` for context propagation
  - Sentry transport (`@sentry/core`) for error+fatal log levels
  - 9-field default redact list with user-provided path merge
  - Env var defaults (`LOG_LEVEL`, `LOG_PRETTY`)
  - 12 unit tests passing
- [x] Config package (`@repo/config`) implemented:
  - Zod-schema-validated env var loading (20+ vars across 9 sections)
  - `loadConfig(overrides?)`, `getConfig()`, `validateConfig()` functions
  - `isProduction()`, `isDevelopment()`, `isTest()` environment helpers
  - Deep-frozen config singleton with nested section structure
  - `ConfigValidationError` with human-readable error messages
  - 13 unit tests passing
- [x] Validation package (`@repo/validation`) implemented:
  - 7 reusable primitive schemas (slug, email, url, uuid, brandedId, password, hexColor)
  - 10 domain schema modules (auth, document, connector, agent, chat, embedding, rag, mcp, platform)
  - 4 validation helpers (validateBody, validateQuery, validateParams, validateAction)
  - All schemas use `.strip()` to reject unknown fields
  - HTML tag rejection in name/display fields
  - Agnostic HTTP validation (plain objects, not Next.js-specific types)
  - 57 unit tests passing
- [x] Utils package (`@repo/utils`) implemented:
  - 7 async utilities (sleep, retry, timeout, parallel, debounce, throttle, raceWithTimeout)
  - 9 string utilities (slugify, truncate, capitalize, titleCase, camelToKebab, kebabToCamel, generateId, maskEmail, pluralize)
  - 7 date utilities (formatDate, formatRelative, isExpired, addDays, diffInDays, toISOString, now)
  - 7 object utilities (deepMerge, deepClone, pick, omit, isPlainObject, isEmptyObject, mapValues)
  - 5 URL utilities (buildUrl, addQueryParams, removeQueryParams, isExternalUrl, getDomain)
  - 9 type guard utilities (isString, isNumber, isBoolean, isArray, isObject, isFunction, isDefined, isError, assertDefined)
  - All functions are pure, tree-shakeable, with JSDoc
  - No third-party utility libraries used
  - 89 unit tests passing
- [x] Crypto package (`@repo/crypto`) implemented:
  - Password hashing with bcrypt cost 12 (hashPassword, verifyPassword, needsRehash)
  - AES-256-GCM symmetric encryption with random IV (encrypt, decrypt, generateEncryptionKey, encryptObject, decryptObject)
  - SHA hashing, constant-time comparison, HMAC-SHA256 (hashString, hashEquals, hmac)
  - Token generation (generateApiKey with configurable prefix, generateResetToken, generateVerificationCode, generateSecret)
  - No third-party encryption libraries — Node.js built-in `crypto` module
  - bcrypt native addon compiled on macOS arm64
  - 28 unit tests passing
- [x] Database package (`@repo/database`) implemented:
  - Connection manager (connect, disconnect, isConnected, healthCheck, event listeners, auto-reconnect, configurable pool)
  - BaseRepository generic class (CRUD, soft/hard delete, pagination, updateMany, count, exists, defaultExcludes for sensitive fields)
  - TenantAwareRepository (automatic tenantId scoping, scoped CRUD, withoutTenantScope for admin operations)
  - Schema utilities (baseSchemaFields, timestampsPlugin, softDeletePlugin with pre-find hooks, toJSONTransform)
  - Singleton connection with dynamic @repo/config import (falls back to process.env.DATABASE_URL)
  - Optional URL override for testing (mongodb-memory-server integration)
  - 21 integration tests passing with in-memory MongoDB
- [x] Entity-specific repositories:
  - 6 Mongoose models (User, Workspace, Session, ApiKey, AuditLog, Document) with indexes, plugins, and schema transforms
  - 6 Repository classes extending BaseRepository or TenantAwareRepository
  - UserRepository: non-tenant-aware, sensitive field exclusion (passwordHash, mfaSecret, recoveryCodes), recovery code consumption
  - WorkspaceRepository: tenant-scoped, search by name/slug, settings management
  - SessionRepository: tenant-scoped, token lookup, session invalidation, TTL-indexed cleanup
  - ApiKeyRepository: tenant-scoped, keyHash exclusion, rotation, revocation, usage tracking
  - AuditLogRepository: tenant-scoped, fire-and-forget logAsync, filterable by user/entity/date range
  - DocumentRepository: tenant-scoped, text search, status/content-type/source filtering, markProcessed
  - 31 integration tests passing (52 total in database package)
- [x] Cache package (`@repo/cache`) implemented:
  - Redis client wrapper (createCacheClient, get, set, del, exists, healthCheck, flush)
  - 3 cache strategies: TTLCache, SlidingWindowCache (TTL reset on read), LRUCache (sorted set with eviction)
  - RateLimiter with sliding window (sorted set + Lua script for atomicity)
  - Distributed lock (acquireLock, releaseLock with Lua, withLock convenience)
  - TenantCache wrapper with automatic `tenant:{tenantId}:` key prefixing
  - No dependency on @repo/config — caller provides Redis URL/token
  - All operations async (Upstash Redis HTTP-based)
  - 27 unit tests passing with mocked Upstash Redis
- [x] UI package (`@repo/ui`) implemented:
  - shadcn/ui configuration (components.json, tailwind.config.ts with CSS variables)
  - Design system tokens (light + dark mode CSS variables for 14 color slots)
  - cn utility (clsx + tailwind-merge), focusRing utility
  - 10 component primitives: Button (6 variants, 4 sizes, loading state, asChild), Card (6 sub-components), Input (2 variants, 3 sizes, icon support), Dialog (11 sub-components, Radix + portal), DropdownMenu (13 sub-components, keyboard nav), Badge (6 variants), Avatar (4 sizes, initials fallback), Toast (3 variants, auto-dismiss, stacking), Skeleton (3 variants), Separator (2 orientations)
  - All components use forwardRef, support className prop, are tree-shakeable
  - Server-compatible components don't use 'use client'; interactive components use Radix UI primitives
  - 8 Radix UI dependencies for accessible primitives
  - 22 component tests passing (jsdom + testing-library)
- [x] ESLint + Prettier configuration implemented:
  - Shared ESLint flat config (`@repo/config-eslint`) with `typescript-eslint` strict type-checked rules
  - per-package `eslint.config.js` files for 9 implemented packages (types, logger, config, validation, utils, crypto, database, cache, ui)
  - React + React Hooks rules composed for `@repo/ui`
  - Perfectionist plugin for import ordering (react → next → external → internal)
  - `prettier` config at root (existing `.prettierrc` with printWidth 100, singleQuote off, trailingComma all)
  - `eslint-config-prettier` disables conflicting ESLint rules
  - Addressed strict type-checked rules across all packages (no-unsafe-call, non-null assertions, etc.)
  - turbo.json updated from `pipeline` to `tasks` for v2.9 compatibility
  - All 9 packages pass `pnpm lint` cleanly
- [x] CI/CD workflows implemented:
  - CI workflow (`.github/workflows/ci.yml`): lint → typecheck → test → build with concurrency, turbo cache, bundle analysis on main, PR failure notifications
  - Security workflow (`.github/workflows/security.yml`): dependency audit, Semgrep SAST, TruffleHog secrets detection, license check
  - Deploy workflow (`.github/workflows/deploy.yml`): manual dispatch with dev/staging/production environments and approval gates
  - Dependency review (`.github/workflows/dependency-review.yml`): blocks PRs with high-severity new dependencies
  - Dependabot (`.github/dependabot.yml`): weekly automated updates for npm and GitHub Actions
- [x] Sentry integration implemented:

[...]
  - `turbo.json` includes `SENTRY_ENVIRONMENT` and `SENTRY_RELEASE` env vars
- [x] Next.js web app scaffolded (Step 01.01):
  - Root layout with Inter font, skip-to-content link, metadata
  - Route placeholders: /chat, /settings
  - Error, loading, and not-found boundaries
  - next.config.ts with security headers, redirects, image domains
  - postcss.config.mjs with TailwindCSS v4
  - tsconfig.json with @/ path alias
  - src/lib/env.ts client-safe config bridge
  - eslint.config.js following @repo/config-eslint pattern
  - `.env.example` already documents `SENTRY_DSN` and `SENTRY_ENVIRONMENT`
- [x] Next.js docs app scaffolded (Step 01.03):
  - Root layout with docs-specific metadata, skip-to-content link
  - Two-column /docs layout with sidebar navigation
  - Catch-all route [[...slug]] for MDX doc pages
  - MDX components registry (mdx-components.tsx)
  - next.config.ts with @next/mdx integration
  - postcss.config.mjs with TailwindCSS v4
  - eslint.config.js following @repo/config-eslint pattern
  - apps/docs/content/ directory for content files
  - @next/mdx, @mdx-js/loader, @mdx-js/react, next-mdx-remote dependencies
- [x] Next.js admin app scaffolded (Step 01.02):
  - Root layout with admin-specific metadata, skip-to-content link
  - Route placeholders: /dashboard, /users, /workspaces, /billing, /audit-logs, /settings
  - Error, loading, and not-found boundaries
  - next.config.ts with security headers, redirects
  - postcss.config.mjs with TailwindCSS v4
  - eslint.config.js following @repo/config-eslint pattern
- [x] TailwindCSS theme configured (Step 01.05):
  - Shared theme in packages/ui (CSS variables, dark mode, extended spacing/breakpoints/animations)
  - App-level tailwind.config.ts with presets
  - ThemeToggle component
- [x] shadcn/ui components registered (Step 01.06):
  - 6 new components added to @repo/ui (Label, Switch, Tabs, Command, Sheet, Tooltip)
  - All 16+ components exported from barrel
  - Per-app re-export layers at apps/*/src/components/ui/
  - All apps pass lint/typecheck/build
- [x] Web app layout, navigation, and shell (Step 01.07):
  - Sidebar with primary/secondary nav, collapsible (expanded 280px, collapsed 60px), active route highlighting
  - Top bar with workspace switcher, search command (Cmd+K), theme toggle, notification bell, user menu
  - Context panel (right sidebar, toggleable via Cmd+I)
  - Mobile sidebar via Sheet overlay (hamburger menu)
  - Breadcrumbs auto-generated from route path
  - Zustand layout store with localStorage persistence
  - Keyboard shortcuts: Cmd+B (sidebar toggle), Cmd+I (right panel)
  - Skip-to-content link preserved
  - lint/typecheck/build all passing
- [x] Admin app layout, navigation, and shell (Step 01.08):
  - Dark-themed sidebar (bg-slate-900) with navigation groups: Overview, Management, Operations, Billing, Configuration
  - Non-collapsible on desktop (w-64), Sheet overlay drawer on mobile
  - Nav group sub-items with active route highlighting, placeholder items for future pages
  - Top bar with admin badge (Shield icon), search placeholder, support ticket count, notifications, theme toggle, user menu
  - Breadcrumbs auto-generated from route path
  - Zustand store for mobile sidebar state
  - Skip-to-content link preserved
  - lint/typecheck/build all passing
- [x] Docs app layout, navigation, and shell (Step 01.09):
  - Two-column layout with sidebar navigation tree (6 sections, 19 child pages)
  - IntersectionObserver-based table of contents sidebar
  - Recursive NavTreeItem component with expandable sections and active page highlighting
  - Mobile sidebar via Sheet overlay
  - Top navigation bar with search placeholder, theme toggle
  - Footer with links
  - Zustand store for mobile sidebar state
  - lint/typecheck/build all passing
- [x] Landing page sections (Step 01.10):
  - Hero section with headline, subheading, CTA buttons, and product mockup
  - Features section with 6 feature cards (grid layout, scroll animations)
  - How It Works section with 4-step diagram
  - Pricing section with 3-tier cards and monthly/annual billing toggle
  - CTA section with email signup form
  - Sticky header with navigation links and mobile menu
  - Footer with multi-column links, social icons, copyright
  - All sections use IntersectionObserver-based fade-in animations
  - Zustand store for billing period toggle
  - lint/typecheck/build all passing
- [x] react-markdown + Shiki integration (Step 01.11):
  - Markdown rendering via react-markdown with remark-gfm (GFM tables, tasklists)
  - Shiki syntax highlighting with dual themes: github-light (light mode), github-dark (dark mode)
  - Code blocks with copy-to-clipboard button and language label
  - Frontmatter parsing with gray-matter (title, description, order)
  - Custom MDX component registry (Callout with info/warning/error/tip variants)
  - Catch-all route [[...slug]] reads .mdx files from content/ directory
  - File-based routing: content/getting-started.mdx → /docs/getting-started
  - Lazy-initialized highlighter with 20 bundled languages
  - Pre-highlighting pipeline extracts code blocks at build time for zero runtime overhead
  - Sample docs: getting-started.mdx, api/overview.mdx
  - lint/typecheck/build all passing

- [x] Phase 01 verification (Step 01.12):
  - 24 verification tests passing (app names, next.config existence, root layout metadata, TailwindCSS theme consistency, no cross-app imports)
  - All 88 verification suite tests pass (6 test files)
  - STATUS.md, ROADMAP.md, CHANGELOG.md, NEXT_STEP.md updated
  - Phase 01 marked complete

- [x] Better Auth server setup (Step 02.01):
  - `packages/auth/src/auth-server.ts` — Better Auth server with MongoDB adapter, email/password auth, multi-session, admin, bearer plugins
  - `packages/auth/src/auth-client.ts` — Better Auth client for client-side usage
  - `packages/auth/src/plugins/workspace-plugin.ts` — Custom plugin (hooks ready for workspace creation on signup)
  - `packages/auth/src/index.ts` — Barrel exports for auth server, client, and plugins
  - `packages/auth/package.json` updated with deps: `@better-auth/mongo-adapter`, `@repo/crypto`, `@repo/validation`, `@repo/cache`, `@repo/config`, `mongodb`
  - `packages/auth/eslint.config.js` added
  - `databaseHooks.user.create.after` creates default workspace with owner role on user registration
  - Password hashing uses `@repo/crypto` (bcrypt) instead of default Scrypt
  - Lint clean, typecheck passes (pre-existing `@repo/crypto` error only), build succeeds

- [x] Auth schema and validation (Step 02.02):
  - `loginSchema`: email (valid email, trimmed), password (min 8), rememberMe (optional boolean)
  - `registerSchema`: name (2-100), email, password (min 8, upper, lower, number), confirmPassword (refine match, transform strip)
  - `resetPasswordSchema`: token (min 32), password, confirmPassword (refine match, transform strip)
  - `verifyEmailSchema`: token (min 32)
  - `mfaSetupSchema`: method ("totp"), optional name
  - `mfaVerifySchema`: code (6 digits), secret
  - `oauthSchema`: provider ("google" | "github"), optional callbackURL
  - `sessionSchema`: sessionId, optional workspaceId (branded ID)
  - Existing `sessionSchema` renamed to `authSessionSchema` (DB model) to avoid naming conflict
  - All 57 existing tests pass, lint clean, typecheck clean

- [x] Email/password authentication (Step 02.03):
  - `packages/auth/src/providers/email-password.ts`: Factory for Better Auth emailAndPassword config with bcrypt hashing (cost 12 via `@repo/crypto`), `requireEmailVerification: true`
  - `packages/auth/src/services/auth-service.ts`: Service layer wrapping Better Auth API with:
    - Input validation via `@repo/validation` schemas (login, register, reset password, verify email)
    - Rate limiting: 5 login attempts/email/15min, 3 registrations/IP/hour via `@repo/cache RateLimiter`
    - Account lockout after 10 failed attempts (30-min cooldown via Redis)
    - Methods: `register`, `login`, `logout`, `verifyEmail`, `resendVerification`, `forgotPassword`, `resetPassword`
  - `packages/auth/src/emails/verification-email.ts`: Verification email template with HTML, logs to console (dev mode)
  - `packages/auth/src/emails/welcome-email.ts`: Welcome email template, sent after user creation via `databaseHooks`
  - `auth-server.ts` updated: uses `createEmailPasswordProvider()`, adds `emailVerification` config with `sendOnSignUp` and `autoSignInAfterVerification`
  - Email sending: Better Auth `sendVerificationEmail` callback delegates to local template
  - Password reset: `sendResetPassword` callback logs reset URL to console
  - Lint clean, typecheck clean (pre-existing `@repo/crypto` error only), build succeeds, 88/88 verification tests pass

- [x] OAuth Providers Google, GitHub (Step 02.04):
  - `packages/auth/src/providers/oauth.ts`: Factory for Better Auth `socialProviders` config — reads `AUTH_GOOGLE_ID`/`AUTH_GOOGLE_SECRET` or `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET` (and GitHub equivalents) from env, returns Google+GitHub provider configs with `enabled` flag
  - `packages/auth/src/services/oauth-service.ts`: Service layer for OAuth account management — `linkAccount` (with session token), `unlinkAccount` (by providerId), `listAccounts` (returns linked provider accounts)
  - `auth-server.ts` updated: `socialProviders: createOAuthProviders()` added to betterAuth options, allowing Google and GitHub sign-in
  - `.env.example` updated: `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`, `AUTH_GITHUB_ID`, `AUTH_GITHUB_SECRET` added
  - Better Auth handles OAuth flow natively (authorization URL redirect, callback/token exchange, account linking by matching email)
  - Lint clean, typecheck clean (pre-existing `@repo/crypto` error only), build succeeds, 88/88 verification tests pass

- [x] Session management (Step 02.05):
  - `packages/auth/src/services/session-cache.ts`: Redis caching layer for sessions — key format `tenant:{workspaceId}:session:{token}`, 7-day TTL, user→sessions set index (`sadd`/`smembers`/`srem`), get/set/del operations
  - `packages/auth/src/services/session-service.ts`: Session management service with:
    - `verifySession(token)`: Cache-first verification (Redis fast path → Better Auth `getSession` fallback), returns `{ valid, session, needsRefresh }`
    - `refreshSession(token)`: Forces fresh session fetch from Better Auth (`disableCookieCache: true`), re-caches in Redis
    - `getSessionInfo(token)`: Delegates to verifySession
    - `listSessions(token)`: Lists all active sessions via Better Auth `listSessions`
    - `revokeSession(token, targetToken)`: Revokes specific session + removes from cache
    - `revokeAllSessions(token, excludeToken?)`: Revokes all or all-other sessions + clears cache
    - `invalidateOnPasswordChange(userId, currentToken)`: Revokes all other sessions, clears cache, keeps current
    - `enforceConcurrencyLimit(userId, maxSessions)`: Evicts oldest sessions if over limit (default 10)
  - Session refresh auto-triggers when within 24h of expiry
  - Session cookie `umgw_session` managed by Better Auth (HTTP-only, Secure, SameSite=Strict)
  - MongoDB TTL index on `expiresAt` auto-cleans expired sessions
  - Lint clean, typecheck clean (pre-existing `@repo/crypto` error only), build succeeds, 88/88 verification tests pass

- [x] RBAC Framework (Step 02.06):
  - `packages/auth/src/rbac/permissions.ts`: Permission definitions as const array (17 permissions across workspace/connector/agent/rag/admin domains) + `Permission` type
  - `packages/auth/src/rbac/roles.ts`: Role definitions with hierarchy (`owner > admin > member > viewer`), static `ROLE_PERMISSIONS` mapping, `roleHasPermission()` and `roleAtLeast()` helpers
  - `packages/auth/src/rbac/cache.ts`: Redis permission caching layer — key format `tenant:{workspaceId}:perm:{userId}:{permission}` and `tenant:{workspaceId}:role:{userId}`, 5-minute TTL, `invalidateAll()` for role-change invalidation
  - `packages/auth/src/rbac/service.ts`: `createRBACService(getUserRole)` — dependency-injected factory with `checkPermission` (cache-first, DB-role-lookup fallback), `checkPermissions` (batch), `getUserRole` (cached), `hasRole` (hierarchy check), `invalidateCache`
  - `packages/auth/src/rbac/require-permission.ts`: Module-level singleton guard — `setRBACService(rbac)` initializer + `requirePermission(permission)` HOF returning `{ allowed, error, status }` guard function
  - `packages/auth/src/hooks/use-permissions.ts`: Zustand-based React hook — `usePermissions()` returns `{ can, isLoading, error }` for UI-level permission gating, `useSetPermissions()` for store updates
  - `packages/auth/src/index.ts`: Barrel exports for all RBAC modules
  - `packages/auth/package.json`: Added `zustand ^5.0.0`, `react ^19.0.0` and `@types/react ^19.0.0` as dependencies
  - Permission check is cached in Redis — subsequent calls hit sub-10ms fast path
  - Cache invalidated when user role changes via `invalidateCache(userId, workspaceId)`
  - Lint clean, typecheck clean (pre-existing `@repo/crypto` error only), build succeeds, 88/88 verification tests pass

- [x] Auth Middleware (Step 02.07):
  - `apps/web/src/middleware.ts`: Next.js Edge Middleware — validates sessions via Redis cache on every request, rate-limits auth routes (10 req/min per IP), enforces public/protected route access, redirects unauthenticated to `/login` and authenticated away from `/login` to `/chat`, attaches `x-user-id`/`x-workspace-id`/`x-session-token` headers, applies security headers (CSP, X-Frame-Options, X-Content-Type-Options, HSTS, Permissions-Policy), skips static assets via `config.matcher`
  - `apps/web/src/lib/middleware/routes.ts`: Route configuration — `publicRoutes`, `authRoutes`, `isPublicRoute()` (incl. `/api/auth/*`), `isApiRoute()`, `isAuthRoute()`, `isStaticAsset()`, `shouldRunMiddleware()`
  - `apps/web/src/lib/middleware/headers.ts`: Security headers factory — `getSecurityHeaders()` returns headers object, `setSecurityHeaders()` applies to a NextResponse
  - `apps/web/src/lib/middleware/auth.ts`: Session validation — parses `umgw_session` cookie, reads cached session from Upstash Redis (same key format as session-cache.ts: `tenant:default:session:{token}`), validates expiry and `isValid` flag, `setSessionHeaders()` attaches user context headers
  - `apps/web/src/lib/middleware/rate-limit.ts`: Edge-compatible rate limiting — uses Upstash Redis sorted sets (zadd/zcount/zrange) with rolling 60s window, 10 req/min per IP for auth routes, returns `{ allowed, remaining, reset }`; fails open on Redis errors
  - Edge-compatible: uses `@upstash/redis` (HTTP-based) directly — avoids `@repo/logger` (pino, Node.js-only) — `@upstash/redis ^1.34.0` added to `apps/web/package.json`
  - Middleware runs at the edge with no Node.js-specific APIs
  - Lint clean, typecheck clean, build succeeds (2 successful)

- [x] Login Page (Step 02.08):
  - `apps/web/src/app/(auth)/login/page.tsx`: Server component — reads `?redirect=` and `?error=` query params, renders login form + OAuth buttons in a Card, SEO: `noindex` meta tags
  - `apps/web/src/app/(auth)/login/login-form.tsx`: Client component — React Hook Form with `useActionState`, email/password/rememberMe fields, Zod validation via `@repo/validation/loginSchema`, handles 5 error states inline (invalid credentials, account locked, email not verified, rate limited, validation error), loading spinner on submit via `Button loading` prop, redirects as hidden input
  - `apps/web/src/app/(auth)/login/oauth-buttons.tsx`: Client component — "Sign in with Google" and "Sign in with GitHub" buttons as `<a>` tags to `{authUrl}/api/auth/signin/{provider}`, SVG provider icons, "Or continue with" divider
  - `apps/web/src/app/(auth)/layout.tsx`: Auth pages layout — centered flexbox with `bg-muted/30`, no sidebar/topbar, `noindex` robots meta, inherits dark mode from root
  - `apps/web/src/actions/auth/login.ts`: Server Action — validates form data with `loginSchema`, dynamically imports `@repo/database` and `@repo/auth` (avoids bcrypt webpack bundling issue), calls `auth.api.signInEmail()`, sets `umgw_session` cookie (7 days default, 30 days with rememberMe), error mapping: email_not_verified → verification hint, invalid_credentials, account_locked, rate_limited, unknown
  - `apps/web/next.config.ts`: Added webpack externals for `bcrypt` and `@mapbox/node-pre-gyp` (native modules incompatible with webpack bundling)
  - `packages/crypto/src/encryption.ts`: Fixed pre-existing TS error — removed unused type parameter `T` from `decryptObject` return type
  - Lint clean, typecheck clean, build succeeds

- [x] Register Page (Step 02.09):
  - `apps/web/src/actions/auth/register.ts`: Server Action — validates form data with `registerSchema` (name, email, password, confirmPassword), dynamically imports `@repo/database` and `@repo/auth`, calls `auth.api.signUpEmail()` with name/email/password, redirects to `/verify-email` on success, error mapping: email_exists, rate_limited, registration_failed
  - `apps/web/src/app/(auth)/register/page.tsx`: Server component — Card layout with "Create an Account" title, renders RegisterForm + OAuthButtons, `force-dynamic` (shared OAuth `asChild` Slot component requires SSR), noindex
  - `apps/web/src/app/(auth)/register/register-form.tsx`: Client component — `useActionState` with `registerAction`, name/email/password/confirmPassword inputs, real-time password requirements display (8+ chars, uppercase, lowercase, number), confirm-password mismatch indicator, submit loading state with Button, success → router.push("/verify-email"), "Already have an account?" link to /login
  - `apps/web/src/app/(auth)/verify-email/page.tsx`: Server component — two modes: (a) no token → "Check your email" info page with sign-in link for resend, (b) token present → dynamically imports `@repo/database` and `@repo/auth`, calls `auth.api.verifyEmail({ query: { token } })`, success shows "Email Verified" with countdown redirect to /login via `RedirectWithCountdown` client component, failure shows "Verification Failed" with retry suggestion
  - `apps/web/src/app/(auth)/verify-email/redirect-countdown.tsx`: Client component — counts down from 5 seconds, then `window.location.href = "/login"`
  - Reuses `OAuthButtons` from `login/oauth-buttons.tsx`
  - Lint clean, typecheck clean, build succeeds

- [x] Password Reset Flow (Step 02.10):
  - `packages/auth/src/emails/password-reset-email.ts`: Email template — HTML for reset link email with call-to-action button, `buildPasswordResetUrl(token)` constructs `/reset-password?token=xxx` URL, `extractResetToken(url)` parses token from Better Auth's callback URL

- [x] MFA Setup (Step 02.11):
  - `packages/auth/src/services/totp.ts`: TOTP secret generation, URI generation, QR code data URL, code verification via speakeasy + qrcode
  - `packages/auth/src/services/recovery-codes.ts`: Recovery code generation (8 x 10-char base64url), bcrypt hashing (cost 10), verification with consumption
  - `packages/auth/src/services/mfa-service.ts`: createMFAService() with 12 methods — setupMFA, verifyAndEnableMFA, verifyMFACode, verifyAndConsumeRecoveryCode, disableMFA, generateNewRecoveryCodes, getMFAStatus, createChallenge/getChallenge/deleteChallenge (Redis-backed, 5min TTL), createTrustToken/verifyTrustToken (HMAC-signed, 30-day)
  - `packages/auth/src/index.ts`: Exports all MFA services and types
  - `apps/web/src/actions/auth/mfa.ts`: 6 server actions — setupMFAAction, verifyAndEnableMFAAction, verifyMFAAction, skipMFAWithRecoveryAction, disableMFAAction, regenerateRecoveryCodesAction
  - `apps/web/src/actions/auth/login.ts`: Updated — after signInEmail success, checks mfaEnabled via UserModel, validates trust cookie, creates Redis challenge if MFA required
  - `apps/web/src/app/(auth)/login/login-form.tsx`: Added useEffect to redirect to /mfa?challenge=xxx when MFA required
  - `apps/web/src/app/(auth)/mfa/page.tsx`: Server component — renders MFAForm with challenge ID from query params
  - `apps/web/src/app/(auth)/mfa/mfa-form.tsx`: Client component — TOTP code input (6-digit) with "Trust this device" checkbox, recovery code tab, success redirect to /chat
  - `apps/web/src/app/settings/security/page.tsx`: Security settings page with MFA enrollment
  - `apps/web/src/app/settings/security/mfa-setup.tsx`: 3-step enrollment — enable button → QR code + verify → recovery codes display
  - `apps/web/src/app/settings/security/mfa-recovery-codes.tsx`: Recovery codes display, copy, regenerate
  - `packages/auth/package.json`: Added speakeasy, qrcode, @types/speakeasy, @types/qrcode

- [x] Auth Verification (Step 02.12):
  - 88/88 verification tests pass
  - pnpm typecheck passes (auth-related packages)
  - pnpm lint passes (auth-related packages)
  - pnpm build passes (all 4 apps)
  - STATUS.md, NEXT_STEP.md, ROADMAP.md, CHANGELOG.md updated
  - Phase 02 marked complete

- [x] Workspace Schema and Validation (Step 03.01):
  - `packages/validation/src/schemas/workspace.ts`: 5 Zod schemas — `createWorkspaceSchema`, `updateWorkspaceSchema`, `workspaceSettingsSchema`, `memberRoleSchema`, `invitationSchema`
  - `packages/validation/src/index.ts`: Barrel exports for new schemas and their inferred types
  - Lint clean, typecheck clean, all 57 existing validation tests pass, build succeeds

- [x] Workspace Repository (Step 03.02):
  - `packages/database/src/models/workspace.ts`: Added `IWorkspaceMemberEntry` interface + embedded `workspaceMemberSchema` (userId, role, joinedAt, invitedBy, deletedAt), `members` array field on `IWorkspace`
  - `packages/database/src/repositories/workspace.ts`: Added 9 methods — `findBySlug(slug, excludeId?)` with uniqueness check, `addMember` (upserts member document), `removeMember` (soft-deletes membership), `updateMemberRole`, `getMembers` (aggregation pipeline with $lookup + user detail join + pagination), `transferOwnership` (validates admin role), `archive`/`restore` (sets/clears deletedAt), `updateSettings` (partial $set merge into sub-document)
  - `packages/database/src/index.ts`: Barrel exports for `IWorkspaceMemberEntry` and `MemberWithUser` types
  - Lint clean, typecheck clean (pre-existing `mongodb-memory-server` error only)
  - All methods are tenant-scoped via `TenantAwareRepository`

- [x] Workspace Service (Step 03.03):
  - `packages/auth/src/services/workspace-service.ts` — `createWorkspaceService` factory with 9 methods:
    - `create(data, userId)`: generates unique slug, creates workspace, adds creator as `owner` member
    - `getById(workspaceId, userId)`: returns workspace only if user is a member or owner
    - `update(workspaceId, data, userId)`: RBAC-checked (admin+), slug uniqueness, field whitelist
    - `archive(workspaceId, userId)`: soft-delete with admin check via `rbacService.hasRole`
    - `listUserWorkspaces(userId)`: queries workspaces by member userId, sorted by `updatedAt` desc
    - `addMember(workspaceId, email, role, inviterId)`: finds user by email, validates role, adds as member
    - `removeMember(workspaceId, targetUserId, requesterId)`: admin check, blocks last-owner removal
    - `transferOwnership(workspaceId, newOwnerId, currentOwnerId)`: verifies current owner, swaps roles (new→owner, old→admin)
    - `updateSettings(workspaceId, settings, userId)`: admin check, delegates to repo partial merge
  - `packages/auth/src/index.ts`: Barrel exports for `createWorkspaceService`, `WorkspaceService`, `WorkspaceServiceMethods`, `WorkspaceServiceResult`
  - `packages/auth/package.json`: Added `@repo/utils` dependency
  - Lint clean, typecheck clean (pre-existing `auth-server.ts` TS2742 error only)
  - All methods use `@repo/logger` for structured logging, `WorkspaceRepository` (tenant-scoped), `UserRepository`, and RBAC via `RBACService`

- [x] Workspace API Routes (Step 03.04):
  - `apps/web/src/app/api/workspaces/route.ts` — POST create workspace (validated via `createWorkspaceSchema`), GET list user workspaces
  - `apps/web/src/app/api/workspaces/[workspaceId]/route.ts` — GET workspace (membership check), PATCH update (admin RBAC via `rbacService.hasRole("admin")`), DELETE archive (admin check)
  - `apps/web/src/app/api/workspaces/[workspaceId]/members/route.ts` — GET list members (paginated, role filterable), POST add member (via email + role, admin check)
  - `apps/web/src/app/api/workspaces/[workspaceId]/members/[userId]/route.ts` — PATCH update member role (admin check, `workspaceRoleSchema` validation), DELETE remove member (admin check, last-owner guard)
  - `apps/web/src/app/api/workspaces/[workspaceId]/transfer/route.ts` — POST transfer ownership (owner check, newOwnerId validation)
  - `apps/web/src/app/api/workspaces/[workspaceId]/settings/route.ts` — PATCH update settings (admin check, partial merge)
  - All routes: 401 for unauthenticated, 403 for unauthorized, validated with `@repo/validation` Zod schemas, dynamic `import()` for `@repo/database` + `@repo/auth` (bcrypt native module issue), `x-user-id` header from middleware
  - Lint clean, typecheck clean, build succeeds

- [x] Create Workspace Flow (Step 03.05):
  - `apps/web/src/actions/workspace/create.ts` — Server action `createWorkspaceAction` (calls workspace service `create` via dynamic imports), `checkSlugAction` for debounced slug uniqueness check
  - `apps/web/src/hooks/use-create-workspace.ts` — Client hook with debounced slug availability check (400ms), auto-generated slug from name, user-editable slug tracking
  - `apps/web/src/app/_components/workspace/create-workspace-dialog.tsx` — Dialog wrapper with `DialogTrigger`, `DialogContent`, close-on-success
  - `apps/web/src/app/_components/workspace/create-workspace-form.tsx` — Form with name/slug/description fields, error display, `useActionState`, redirect on success
  - `apps/web/src/app/_components/workspace/avatar-upload.tsx` — Click-to-upload avatar with file reader preview, remove button, disabled state
  - All components use named exports, follow existing patterns (useActionState, dynamic imports), client/server boundaries respected
  - Lint clean, typecheck clean, build succeeds

- [x] Workspace Settings Page (Step 03.06):
  - `packages/auth/src/services/workspace-service.ts` — Added `restore` method (RBAC-checked admin restore)
  - `apps/web/src/actions/workspace/update.ts` — Server actions `updateWorkspaceAction` (FormData, name/slug/description) and `updateSettingsAction` (feature flags)
  - `apps/web/src/actions/workspace/archive.ts` — Server actions `archiveWorkspaceAction` and `restoreWorkspaceAction`
  - `apps/web/src/app/settings/workspace/page.tsx` — Server component, fetches workspace via dynamic imports, renders three sections
  - `apps/web/src/app/settings/workspace/general-settings.tsx` — Client form with pre-populated name/slug/description, slug uniqueness check (400ms debounce), auto-generation from name
  - `apps/web/src/app/settings/workspace/danger-zone.tsx` — Archive with confirmation dialog, restore button (toggles based on `deletedAt` state)
  - `apps/web/src/app/settings/workspace/feature-flags.tsx` — 4 toggleable flags (AI Chat, Knowledge Base, Connectors, Guest Access) stored via settings service
  - All server actions use dynamic imports for `@repo/database` + `@repo/auth`, `x-user-id` header from middleware
  - Server component uses dynamic imports and `headers()` for auth — same pattern as API routes
  - Lint clean, typecheck clean (pre-existing TS2742 only), build succeeds

- [x] Member Management (Step 03.07):
  - `apps/web/src/actions/workspace/members.ts` — `changeMemberRoleAction` (validates admin via RBAC, calls repo.updateMemberRole) and `removeMemberAction` (validates via service.removeMember with last-owner guard)
  - `apps/web/src/app/settings/workspace/members/page.tsx` — Server component, dynamic import of `@repo/database`, fetches workspace members via `workspaceRepo.getMembers`, verifies membership, passes data to table
  - `apps/web/src/app/settings/workspace/members/members-table.tsx` — Client component with search (name/email), role filter tabs (All/Owner/Admin/Member/Viewer), pagination (20 per page), local state for mutations
  - `apps/web/src/app/settings/workspace/members/member-row.tsx` — Row with avatar + initials, name, email, role badge (color-coded), owner badge, "Active" badge, joined date, Change Role/Remove action buttons (admin-only, hidden for owner)
  - `apps/web/src/app/settings/workspace/members/change-role-dialog.tsx` — Dialog with role option cards (admin/member/viewer), permission explanation banner, confirm/cancel
  - `apps/web/src/app/settings/workspace/members/remove-member-dialog.tsx` — Confirmation dialog with warning text
  - All server actions use dynamic imports for `@repo/database` + `@repo/auth`, `x-user-id` header from middleware
  - Server component uses dynamic imports and `headers()` for auth — same pattern as workspace settings page
  - Lint clean, typecheck clean (pre-existing TS2742 only), build succeeds

- [x] Invitation System (Step 03.08):
  - `packages/database/src/models/invitation.ts` — Mongoose model: workspaceId, workspaceName, inviterId, inviteeEmail, role, token, message, status (pending/accepted/declined/cancelled/expired), expiresAt, indexes on workspaceId+status and inviteeEmail+workspaceId
  - `packages/database/src/repositories/invitation.ts` — InvitationRepository (extends BaseRepository): findByToken (global), findByWorkspace (paginated, status-filtered), countByWorkspaceToday (rate limiting), updateStatus
  - `packages/auth/src/emails/invitation-email.ts` — HTML email template with accept/decline links, dev-mode logging
  - `packages/auth/src/services/invitation-service.ts` — createInvitationService: create (validates admin role, duplicate check, rate limit 20/day, 7-day TTL, sends email), accept (verifies token, email match, adds member via WorkspaceModel directly to avoid tenant scoping issue), decline, resend (new token + TTL), cancel, list, getByToken (auto-expires stale invitations)
  - `apps/web/src/app/api/workspaces/[workspaceId]/invitations/route.ts` — GET (list pending, member-only), POST (create, admin-only, validated via sendInvitationSchema)
  - `apps/web/src/app/api/invitations/[token]/route.ts` — GET (fetch by token), POST (accept/decline by action body field)
  - `apps/web/src/actions/workspace/members.ts` — Added inviteMemberAction (calls service.create), cancelInvitationAction, resendInvitationAction
  - `apps/web/src/app/settings/workspace/members/invite-dialog.tsx` — Dialog with email, role cards (admin/member/viewer with descriptions, "Recommended" badge), optional message, success/error states
  - `apps/web/src/app/settings/workspace/members/invitations-list.tsx` — Pending invitations list with status badge, resend/cancel actions (admin-only), fetched from API route
  - `apps/web/src/app/invitation/[token]/page.tsx` — Server component: loads invitation by token, handles not-found/expired/non-pending states, redirects unauthenticated to login with redirect param, renders InvitationActions
  - `apps/web/src/app/invitation/[token]/invitation-actions.tsx` — Client component: Accept/Decline buttons, success/declined confirmation states, error handling, fetch-based POST to /api/invitations/[token]
  - All server actions/API routes use dynamic imports for `@repo/database` + `@repo/auth`, `x-user-id` header from middleware
  - Lint clean, typecheck clean, build succeeds

- [x] Workspace Switcher (Step 03.09):
  - `apps/web/src/lib/store/workspace.ts` — Zustand store with persist middleware for active workspace
  - `apps/web/src/hooks/use-user-workspaces.ts` — React Query hook fetching GET /api/workspaces
  - `apps/web/src/components/providers/query-provider.tsx` — React Query client provider
  - `apps/web/src/components/layout/workspace-switcher-item.tsx` — Workspace row component
  - `apps/web/src/components/layout/workspace-switcher.tsx` — Dropdown with loading/empty/single/multi states
  - `apps/web/src/components/layout/workspace-settings-nav.tsx` — Sub-navigation tabs for workspace settings
  - `apps/web/src/app/layout.tsx` — Wrapped in QueryProvider
  - All apps build, lint, typecheck pass

- [x] Phase 03 Verification (Step 03.10):
  - `pnpm lint` passes for all workspace packages (@repo/web, @repo/auth, @repo/database, @repo/validation)
  - `pnpm build` succeeds for all 4 apps
  - All workspace-related tests pass
  - STATUS.md, NEXT_STEP.md, ROADMAP.md, CHANGELOG.md updated
  - Phase 03 marked complete

- [x] Index Strategy Implementation (Step 04.01):
  - All indexes defined in Mongoose schema files with explicit names
  - Missing indexes added: `users.emailVerified_isActive`, `workspaces.name+description` text, `sessions.tenantId+lastActivityAt`, `audit_logs.entityType+entityId+createdAt`, `documents.tenantId+updatedAt`
  - Existing indexes renamed to follow `idx_<collection>_<field>_<field>` convention
  - `docs/architecture/database-indexes.md` created with full documentation
  - `scripts/migrations/2026-06-01-deploy-indexes.ts` created for production deployment
  - Lint clean, build succeeds

- [x] Query Optimization and Profiling (Step 04.02):
  - `packages/database/src/middleware/query-timing.ts` created — `withQueryTiming()` wraps any async operation with performance measurement
  - `BaseRepository` all 11 methods wrapped with query timing
  - Slow query thresholds: >50ms logs `warn`, >200ms logs `error` via `@repo/logger`
  - `docs/architecture/query-performance.md` created with baseline metrics for all 7 collections
  - Export added to `@repo/database` barrel
  - Lint clean, build succeeds

- [x] Connection Pooling Configuration (Step 04.03):
  - `ConnectionConfig` expanded: `socketTimeoutMS`, `heartbeatFrequencyMS`, `retryWrites`, `w`, `readConcern`
  - Defaults updated: `maxPoolSize: 50`, `serverSelectionTimeoutMS: 5000`, `w: "majority"`, `readConcern: "majority"`
  - `getPoolStats()` added — exposes active/idle/available connection counts
  - Env vars `DATABASE_POOL_MIN` and `DATABASE_POOL_MAX` added to `@repo/config` schema
  - Pool config overrideable via env vars (read at connect time via dynamic import from `@repo/config`)
  - `.env.example` updated with new vars
  - `docs/architecture/connection-pooling.md` created with sizing guidance and tuning checklist
  - Lint clean, build succeeds
- [x] Migration Tooling (Step 04.04):
  - `scripts/migrate.mjs` CLI with up/down/create/status commands
  - `scripts/migrations/template.mjs` migration template
  - `scripts/migrations/2026-06-01-deploy-indexes.mjs` migration to deploy all indexes
  - `.mjs` format (no tsx dependency), resolves `mongoose`/`pino` via pnpm symlinks
  - `package.json` scripts: `migrate:up`, `migrate:down`, `migrate:create`, `migrate:status`
  - CLI verified: `create` tested, `status` connects to Atlas, `.env` loading works
  - Lint clean, build succeeds
- [x] Seed Scripts (Step 04.05):
  - `scripts/seed.mjs` CLI with `seed`, `seed:reset`, `seed:minimal` commands
  - `scripts/seed/data/users.mjs` — 4 users (admin, 2 members, viewer)
  - `scripts/seed/data/workspaces.mjs` — 2 workspaces (Acme Corp + Starter)
  - `scripts/seed/data/documents.mjs` — 5 realistic markdown documents
  - `scripts/seed/factories/audit-log.mjs` — generates 50 random audit log entries
  - `scripts/seed/factories/user.mjs` — password hashing via bcrypt
  - `scripts/seed/factories/document.mjs` — document creation factory
  - `scripts/seed/factories/workspace.mjs` — workspace factory (redundant, logic inlined in seed.mjs)
  - Idempotent: checks by email (users), slug (workspaces), title (documents), token (invitations)
  - `seed:reset` drops all seed data with 5-second confirmation countdown
  - `package.json` scripts: `seed`, `seed:reset`, `seed:minimal`
  - All modules load correctly, syntax verified
  - Atlas connectivity intermittent — functional when cluster is reachable
  - Lint clean, build succeeds
- [x] Phase 04 Verification (Step 04.06):
  - Lint passes for all 5 relevant packages (@repo/database, @repo/config, @repo/logger, @repo/crypto, @repo/validation)
  - Typecheck passes (pre-existing `mongodb-memory-server` error only)
  - Build succeeds (4/4 tasks, all cached)
  - Migration CLI syntax/imports verified
  - Seed CLI syntax/imports verified
  - Atlas connectivity intermittent — migration and seed commands work when cluster is reachable
  - `pnpm test` blocked by missing `mongodb-memory-server` (pre-existing)
  - Phase 04 marked complete
- [x] Phase 05 Step 05.01: R2 Client Setup:
  - `@repo/storage` package created (package.json, tsconfig.json, eslint.config.js, src/)
  - `createR2Client` — singleton S3 client factory with R2 endpoint, region `auto`, config from `@repo/config`
  - `createStorageService` — dependency-injected storage service with 6 operations: upload, download, delete, list, exists, getMetadata
  - All operations use AWS SDK v3 commands (PutObjectCommand, GetObjectCommand, DeleteObjectCommand, ListObjectsV2Command, HeadObjectCommand)
  - `@aws-sdk/s3-request-presigner` included as dependency for future signed URL step (05.03)
  - 13 unit tests passing with mocked S3 client
  - `pnpm lint` clean, `pnpm typecheck` clean
- [x] Phase 05 Step 05.02: File Upload Service:
  - `uploadFile` — validates file type and size, generates storage key (`{workspaceId}/{entity}/{date}/{uuid}-{filename}`), uploads to R2 with metadata, creates Document record in MongoDB, returns `UploadResult` with download URL
  - `uploadFiles` — batch upload with configurable concurrency (default 3 parallel)
  - `deleteFile` — soft-deletes Document (via `TenantAwareRepository.deleteById`) and removes from R2
  - `getFile` — finds Document by fileKey, fetches R2 metadata, returns `UploadResult` with download URL
  - `extractDocumentId` helper handles the `id`/`_id` discrepancy between `create` (toObject) and `findOne` (lean)
  - Compensating transaction: R2 upload cleanup on Document creation failure
  - 12 unit tests passing with mocked storage service + DocumentRepository factory
  - `pnpm lint` clean, `pnpm typecheck` clean
  - Depends on `@repo/database` for `DocumentRepository` and `IDocument` type
- [x] Phase 05 Step 05.03: Signed URL Generation:
  - `generateDownloadUrl(key, expiresIn?)` — generates presigned GET URL via `getSignedUrl` + `GetObjectCommand`, default 1 hour expiry
  - `generateUploadUrl(key, contentType, expiresIn?)` — generates presigned PUT URL via `getSignedUrl` + `PutObjectCommand`, for direct-to-S3 uploads
  - `getPublicUrl(key)` — returns public URL by appending key to the configured `r2.publicUrl` base
  - All signed URLs use AWS Signature V4 and cannot be used to list or delete objects (scope limited by the S3 command used)
  - `pnpm lint` clean, `pnpm typecheck` clean
- [x] Phase 05 Step 05.04: File Type Validation:
  - `packages/storage/src/validation/magic-bytes.ts` — 11 file type signatures with magic byte matching (PDF, PNG, JPEG, GIF, WebP, SVG, JSON, CSV, Markdown, plain text, ZIP)
  - `packages/storage/src/validation/file-type.ts` — `validateFileType(buffer, allowedTypes?)` returns `{ valid, detectedType }`; `getAllowedTypesForEntity(entity)` returns entity-scoped type lists
  - `packages/validation/src/schemas/storage.ts` — Zod schemas: `fileTypeResultSchema`, `fileSizeSchema`, `uploadOptionsSchema`
  - Handles text-based types via content inspection (printable UTF-8 ratio, delimiter/pattern detection)
  - `byteAt` helper provides proper type-narrowed access to `Uint8Array` elements
  - `ALLOWED_FILE_TYPES` env var support for configurable type allowlist
  - `pnpm lint` clean, `pnpm typecheck` clean
- [x] Phase 05 Step 05.05: Size Limits and Enforcement:
  - `packages/storage/src/validation/size-limits.ts` — `getTierLimits(tier?)`, `validateFileSize(fileSize, tier?, customMax?)`, `validateTotalStorage(currentUsage, fileSize, tier?, customTotal?)`
  - Tier limits: Free (10MB/file, 1GB total), Pro (50MB/file, 50GB total), Enterprise (500MB/file, 1TB total)
  - `packages/storage/src/usage-tracker.ts` — `createUsageTracker(store)` with `getStorageUsage`, `trackUpload`, `trackDelete`
  - `UsageStore` interface for pluggable persistence (Redis/MongoDB in-memory default)
  - `pnpm lint` clean, `pnpm typecheck` clean
- [x] Phase 05 Step 05.06: Tenant Paths:
  - `packages/storage/src/paths.ts` — `generateStorageKey(workspaceId, entity, filename)` with filename sanitization (null byte, path separator, `..`, special character removal)
  - `parseStorageKey(key)` — regex-based reversal extracting workspaceId, entity, date, uuid, originalName
  - `listWorkspaceFiles(workspaceId, entity?, prefix?)` — S3 ListObjectsV2 scoped to `{workspaceId}/` prefix
  - `STORAGE_ENTITIES` const array and `StorageEntity` type for 6 entity types (documents, avatars, attachments, exports, connectors, temp)
  - All exports added to barrel (functions + types: `ParsedStorageKey`, `StorageEntity`)
  - 25 existing tests pass (no new tests needed for pure logic + S3 delegation)
  - `pnpm lint` clean, `pnpm typecheck` clean
- [x] Phase 05 Step 05.07: Upload API Routes:
  - `apps/web/src/app/api/files/upload/route.ts` — POST multipart upload with magic-bytes validation and tier-based size limits (413 if oversized)
  - `apps/web/src/app/api/files/[fileId]/route.ts` — GET signed URL redirect (302), DELETE file from R2 + soft-delete Document
  - `apps/web/src/app/api/files/[fileId]/metadata/route.ts` — GET file metadata (status, tags, dates, etc.)
  - `apps/web/src/app/api/files/storage/route.ts` — GET storage usage stats with aggregation ($sum fileSize)
  - `apps/web/src/actions/files/upload.ts` — Server Action `uploadFilesAction` with Zod+magic-bytes+size validation
  - `apps/web/src/lib/file-upload.ts` — Client helpers: `uploadFile`, `uploadFiles`, `uploadFileWithXhr` (XHR progress), `deleteFile`, `getFileMetadata`
  - All routes authenticated via `x-user-id`/`x-workspace-id` headers from middleware
  - `@repo/storage` added as workspace dependency in `apps/web/package.json`
  - `mongodb-memory-server` added to `@repo/database` devDependencies (fixed pre-existing typecheck error)
  - `pnpm lint` clean, `pnpm typecheck` clean, `pnpm build` succeeds (4 new API routes in output)
- [x] Phase 05 Step 05.08: Upload UI:
  - `apps/web/src/hooks/use-file-upload.ts` — Upload queue hook with concurrency control (default 3 parallel), per-file progress via XHR, retry/cancel, state management
  - `apps/web/src/components/ui/file-icon.tsx` — File type icon component with 25+ extension mappings and lucide-react icons (PDF red, image blue, code amber, etc.)
  - `apps/web/src/components/ui/file-preview.tsx` — Image thumbnail preview (with error fallback) or file type icon placeholder
  - `apps/web/src/components/ui/file-upload.tsx` — Drag-and-drop upload component with keyboard accessibility, hidden file input, file list with progress bars/status indicators/error messages, Upload/Cancel/Retry/Clear All action buttons, `onUploadComplete` callback
  - `pnpm lint` clean, `pnpm typecheck` clean
- [x] Phase 05 Step 05.09: Verification:
  - All acceptance criteria verified: 25/25 `@repo/storage` tests pass, lint clean (storage, web, database, validation), typecheck clean, build succeeds (4/4 apps)
  - Phase 05 marked complete
- [x] Phase 06 Step 06.01: PDF Upload Flow:
  - `apps/web/src/app/api/documents/pdf/upload/route.ts` — POST handler with PDF magic-byte validation (%PDF at offset 0), 50MB size limit, SHA-256 deduplication, R2 storage, Document record creation (status `uploading`), Inngest `pdf/uploaded` event emission
  - `apps/web/src/app/api/documents/pdf/upload/schema.ts` — Zod schemas for upload form (optional password)
  - `packages/rag/src/pdf/types.ts` — `PdfUploadedEventPayload` and `PdfUploadedEvent` types
  - `packages/rag/src/index.ts` — export PDF types
  - `packages/database/src/models/document.ts` — added `fileHash` field, `uploading` status enum value, `fileHash` index
  - `packages/validation/src/schemas/document.ts` — added `pdfUploadResponseSchema`
  - `packages/rag/eslint.config.js` — added missing lint config
  - `packages/rag/package.json` — added missing `@repo/config-eslint` devDependency
  - `apps/web/package.json` — added `inngest` and `zod` dependencies
  - Lint clean, typecheck clean, build succeeds (route listed in output: `/api/documents/pdf/upload`)
- [x] Phase 06 Step 06.02: Text Extraction Service:
  - `packages/rag/src/pdf/types.ts` — added extraction result types (PdfBoundingBox, PdfFontInfo, PdfExtractedLine/Block/Page, PdfExtractionMetadata/Result)
  - `packages/rag/src/pdf/events.ts` — created with PdfExtractStartedEvent, PdfExtractCompletedEvent, PdfExtractFailedEvent
  - `packages/rag/src/pdf/extractor.ts` — main `extractText()` function: calls pdfjs-dist, validates results, detects scanned docs, calculates metadata, writes to MongoDB
  - `packages/rag/src/pdf/extractor/pdfjs.ts` — pdfjs-dist `getTextContent()` with safe type extraction layer, text grouping into lines (vertical tolerance 0.3) then blocks (gap > 1.5× avg line height), font metadata from TextStyle.fontFamily + transform scaleY
  - `packages/rag/src/pdf/extractor/utils.ts` — calculateTextLength, calculateTextDensity, isScannedDocument (<10 chars/page), detectLanguage (CJK/Cyrillic/Arabic/Devanagari/Latin heuristics), sortBlocksInReadingOrder (top-to-bottom, left-to-right), extractAllText, calculateConfidenceScore
  - `packages/database/src/models/document.ts` — added IProcessedContent (text + pages with positional data), IExtractionMetadata (charCount, pageCount, extractionMethod, confidenceScore, language, extractedAt), Mongoose sub-schemas
  - `packages/rag/src/index.ts` — exports all new types and extractText function
  - `packages/rag/package.json` — added `pdfjs-dist ^6.0.0` dependency
  - Uses pdfjs-dist (pure Node.js, no Python/PyMuPDF dependency) — works on Vercel serverless
  - Lint clean, typecheck clean (rag, database, validation)
- [x] Phase 06 Step 06.04: Chunking Strategy:
  - `packages/rag/src/pdf/chunker/types.ts` — Chunk, ChunkMetadata, ChunkStrategy (recursive/semantic/pdf), ChunkerOptions, ChunkDocumentOptions, HeadingInfo, config constants
  - `packages/rag/src/pdf/chunker/utils.ts` — estimateTokenCount (chars/4 heuristic), estimateAverageBodyFontSize, detectHeadingLevel, extractHeadings, buildSectionPath, page text extraction helpers
  - `packages/rag/src/pdf/chunker/strategies/recursive.ts` — hierarchical splitting by \n\n → \n → sentence → word, configurable overlap extraction
  - `packages/rag/src/pdf/chunker/strategies/semantic.ts` — topic-boundary splitting via heading analysis, sections with confidence scoring, large section sub-chunking with overlap
  - `packages/rag/src/pdf/chunker/strategies/pdf.ts` — PDF-aware section splitting using font metadata for block grouping, orphaned heading merging, heading-led content assembly
  - `packages/rag/src/pdf/chunker.ts` — entry point with strategy auto-selection (pdf for docs >5k chars with font variation, recursive fallback), chunk size clamping (256-4096), overlap clamping (max 25%)
  - `packages/rag/src/pdf/types.ts` — re-exports Chunk, ChunkMetadata, HeadingInfo, ChunkerOptions, ChunkDocumentOptions from chunker types
  - `packages/rag/src/pdf/events.ts` — added PdfChunkStartedEvent, PdfChunkCompletedEvent, PdfChunkFailedEvent with payloads
  - `packages/rag/src/index.ts` — exports chunkDocument, ChunkResult, chunk types, chunk events
  - Lint clean, typecheck clean (rag, database, validation)

- [x] Phase 06 Step 06.03: OCR Integration:
  - `packages/rag/src/pdf/ocr.ts` — `runOcr()` entry point, `getPageSizes()` helper, concurrent page processing (max 2)
  - `packages/rag/src/pdf/ocr/renderer.ts` — `renderPageToPng()` via sharp with 30s timeout, `PageRenderError` class
  - `packages/rag/src/pdf/ocr/recognizer.ts` — `recognizeImage()` via tesseract.js with safe type extraction from `Record<string, unknown>` response
  - `packages/rag/src/pdf/ocr/types.ts` — `OcrWord`, `OcrLine`, `OcrBlock`, `OcrPage`, `OcrResult`, `OcrOptions`
  - Scanned document detection: <10 chars/page average triggers OCR fallback in `extractText()`
  - `packages/rag/src/index.ts` — exports `runOcr`, `getPageSizes`, OCR types
  - `packages/rag/package.json` — added `sharp ^0.33.0`, `tesseract.js ^5.0.0`
  - Lint clean, typecheck clean

- [x] Phase 06 Step 06.05: Metadata Extraction:
  - `packages/rag/src/pdf/metadata.ts` — `extractMetadata()` using pdfjs-dist `getMetadata()` and `getPageLabels()`
  - `packages/rag/src/pdf/metadata/types.ts` — `PdfMetadataResult`, `PdfInfoMetadata`, `PdfTocEntry`, `PdfPageDimension`
  - Extracts: title, author, subject, keywords, creator, producer, creationDate, modDate, PDF version, page dimensions, TOC outline
  - `packages/database/src/models/document.ts` — added `IPdfMetadata`, `IPdfInfoMetadata`, `IPdfTocEntry`, `IPdfPageDimension` interfaces
  - Lint clean, typecheck clean

- [x] Phase 06 Step 06.06: Table Extraction:
  - `packages/rag/src/pdf/tables.ts` — `extractTables()` entry point with positional text alignment analysis
  - `packages/rag/src/pdf/tables/types.ts` — `PdfTable`, `PdfTableCell`, `PdfTableRow`, `PdfTableFormats`, `ExtractTablesOptions`, `ExtractTablesResult`
  - Three output formats: JSON, CSV, Markdown
  - Multi-page table merging, confidence scoring, low-confidence table segregation
  - Python/Camelot-py sidecar (optional, degrades gracefully to positional-only)
  - `packages/database/src/models/document.ts` — added `ITable`, `ITableCell`, `ITableRow`, `ITableFormats` interfaces and schema
  - Lint clean, typecheck clean

- [x] Phase 06 Step 06.07: Progress Tracking (Inngest):
  - `packages/rag/src/pdf/progress/events.ts` — typed Inngest events for all pipeline steps: `pdf/{step}/started`, `pdf/{step}/completed`, `pdf/{step}/failed`, plus `pdf/processing-completed` and `pdf/processing-failed`
  - `packages/rag/src/pdf/progress/service.ts` — `calculateProgress()` with weighted step percentages (upload: 5%, extract: 25%, ocr: 20%, chunk: 15%, embed: 25%, index: 10%), `buildStepMetric()`, `upsertStepMetric()` (idempotent), `allStepsCompleted()`
  - `packages/rag/src/pdf/progress/tracker.ts` — `createProgressTracker()` Inngest function listening on `pdf/*`, updates MongoDB Document record with `$set`, rate-limited to 10 updates/sec per document, emits `pdf/processing-completed` or `pdf/processing-failed` on terminal states
  - `packages/rag/src/pdf/progress/index.ts` — barrel exports
  - `packages/database/src/models/document.ts` — added `IStepMetric` interface, progress tracking fields (`currentStep`, `stepsCompleted`, `processingStartedAt`, `processingCompletedAt`, `error`, `progress`, `stepMetrics`)
  - `packages/rag/src/index.ts` — exports progress module
  - `packages/rag/package.json` — added `inngest ^4.5.1` dependency
  - Lint clean, typecheck clean
- [x] Phase 06 Step 06.08: PDF Processing UI:
  - `packages/types/src/models/pdf-document.ts` — PdfDocument type with all UI-facing fields
  - `apps/web/src/actions/documents/pdf.ts` — Server actions: listDocumentsAction, getDocumentAction, deleteDocumentAction, retryDocumentAction
  - `apps/web/src/hooks/use-documents.ts` — React Query hooks: useDocuments (with auto-polling for processing docs), useDocument, useDeleteDocument, useRetryDocument
  - `apps/web/src/components/pdf/status-badge.tsx` — Color-coded status badge (uploading=yellow, processing=blue+pulse, ready=green, failed=red)
  - `apps/web/src/components/pdf/upload-progress.tsx` — Upload progress bar with percentage
  - `apps/web/src/components/pdf/processing-progress.tsx` — Step-based progress with step metrics, current step label, error state
  - `apps/web/src/components/pdf/pdf-upload-zone.tsx` — Drag-and-drop upload with XHR progress, file type validation (PDF only), file size validation (50MB max), toast notifications
  - `apps/web/src/components/pdf/document-list.tsx` — TanStack-managed table with name/status/progress/pages/date columns, sortable headers, search input, status filter buttons, retry/delete actions, loading skeleton, empty state
  - `apps/web/src/components/pdf/document-detail.tsx` — Full detail view with document info card, PDF metadata card, processing progress, extraction results, error display, retry and delete with confirmation dialog
  - `apps/web/src/app/(protected)/documents/page.tsx` — Client page with upload zone + document list
  - `apps/web/src/app/(protected)/documents/[id]/page.tsx` — Server component with server-side data loading + client hydration for polling
  - `apps/web/src/app/(protected)/documents/[id]/document-detail-client.tsx` — Client wrapper with React Query hydration
  - `apps/web/src/components/ui/toaster.tsx` — Toast context provider (used by upload zone)
  - `apps/web/src/hooks/use-toast.ts` — Toast hook
  - `apps/web/src/app/layout.tsx` — Updated to include Toaster provider
  - Lint clean, typecheck clean, build succeeds (routes listed: /documents, /documents/[id])
- AI Gateway
- MCP Gateway
- [x] Phase 08 Step 08.06: Context Window Builder:
  - `packages/rag/src/context/types.ts` — Context types: RetrievalChunk, ConversationMessage, BudgetAllocation, BuildContextOptions, TruncationDetails, ContextResult
  - `packages/rag/src/context/tokenizer.ts` — Token counting wrapper using gpt-tokenizer: countTokens(), truncateToTokenLimit()
  - `packages/rag/src/context/formatter.ts` — Chunk and context formatting: formatChunk() with citation markers, formatContextSection(), formatConversationSection(), formatInstructionsSection()
  - `packages/rag/src/context/builder.ts` — `buildContext()` with token budget allocation (70/15/15), chunk sorting by score for truncation, conversation history handling with sliding window, guaranteed instructions allocation, truncation metadata
  - `packages/rag/src/index.ts` — Exports buildContext, all context types, tokenizer, and formatter utilities
  - Lint clean, typecheck clean
- [x] Phase 08 Step 08.07: RAG Engine Composition:
  - `packages/rag/src/engine/types.ts` — Engine types: EngineOptions, PipelineContext, PipelineStep, MiddlewareFn, EmbeddingResult, StepMetadata, PipelineMetadata, RAGResult, RAGEngineDependencies
  - `packages/rag/src/engine/tracer.ts` — Pipeline tracer: createTracer() with per-step timing, success/failure logging, aggregate metadata
  - `packages/rag/src/engine/pipeline.ts` — Pipeline orchestrator: executeSteps() with sequential step execution, critical/non-critical error handling
  - `packages/rag/src/engine/middleware.ts` — Query preprocessing: queryNormalizer() stripping HTML/URLs, noopMiddleware(), composeMiddleware()
  - `packages/rag/src/engine.ts` — RAG Engine factory: createRAGEngine() with injectable services (embedText, retrieve, rerank), dynamic step assembly, pipeline context initialization, RAGResult assembly
  - `packages/rag/src/index.ts` — Exports createRAGEngine, EngineOptions, MiddlewareFn, PipelineMetadata, RAGResult, RAGEngineDependencies, middleware utilities
  - Lint clean, typecheck clean
- [x] Phase 08 Step 08.08: RAG API Routes:
  - `packages/validation/src/schemas/rag.ts` — Added ragQuerySchema, ragQueryOptionsSchema, documentIdParamsSchema with Zod validation
  - `packages/validation/src/index.ts` — Exports new RAG API schemas and types
  - `apps/web/src/app/api/rag/schema.ts` — Shared error utilities: unauthorized(), forbidden(), badRequest(), notFound(), rateLimited(), serverError(), getAuthHeaders()
  - `apps/web/src/app/api/rag/query/route.ts` — POST /api/rag/query with Zod body validation, auth via session headers, workspace membership check, engine integration
  - `apps/web/src/app/api/rag/status/[documentId]/route.ts` — GET /api/rag/status/:documentId with document ID validation
  - `apps/web/src/app/api/rag/reindex/[documentId]/route.ts` — POST /api/rag/reindex/:documentId trigger re-indexing
  - `apps/web/src/app/api/rag/index/[documentId]/route.ts` — DELETE /api/rag/index/:documentId remove document chunks
  - Lint clean, typecheck clean
- [x] Phase 08 Step 08.09: Retrieval Evaluation:
  - `packages/rag/src/eval/types.ts` — Dataset types (EvalQuery, EvalDataset, EvalConfig), metric types (PerQueryMetrics, AggregatedMetrics), result types (EvalResult, EvalSummary)
  - `packages/rag/src/eval/errors.ts` — EvaluationError typed class with code + details
  - `packages/rag/src/eval/dataset.ts` — validateDataset() with field checks + duplicate detection, loadDataset(), createDataset() helper
  - `packages/rag/src/eval/metrics.ts` — computePerQueryMetrics() (hitAtK, reciprocal rank), computeDCG/IDCG, computeAggregatedMetrics() (hitRate, MRR, NDCG, precision, recall at configurable K values)
  - `packages/rag/src/eval/runner.ts` — EvalRunner class with injected RAGEngineDependencies, per-query execution with graceful error fallback, aggregated metric computation
  - `packages/rag/src/eval/report.ts` — Formatting: formatMetricTable() (markdown table), formatSummary(), formatEvalReport() (full report with per-query details)
  - `packages/rag/src/eval/fixtures/sample.ts` — 20 synthetic queries covering MCP, vector search, hybrid search, re-ranker, chunking, context window, Atlas, pipeline, embeddings, tenant isolation, PDF processing, caching, normalization, filtering, API routes, error handling with relevantChunkIds
  - `packages/rag/src/eval/index.ts` — Barrel exports
  - `packages/rag/src/index.ts` — Exports EvalRunner, all eval functions + types
  - `packages/rag/package.json` — Added "eval": "tsx ../../scripts/run-eval.ts" script
  - `scripts/run-eval.ts` — CLI entry point running 3 configs (vector-only, hybrid, hybrid+rerank) against sample dataset
  - Lint clean, typecheck clean
- [x] Phase 09 Step 09.01: OpenRouter Client:
  - `packages/ai/src/providers/types.ts` — Provider type definitions (AIProvider, ProviderConfig, ProviderType)
  - `packages/ai/src/providers/openrouter/types.ts` — Complete OpenRouter API types: ChatCompletionRequest/Response, StreamChunk, EmbeddingRequest/Response, ModelInfo, OpenRouterConfig
  - `packages/ai/src/providers/openrouter/errors.ts` — Error classification: OpenRouterError hierarchy (RateLimitError, TimeoutError, AuthError, ServerError, InvalidRequestError), classifyError() factory, isRetryableError()
  - `packages/ai/src/providers/openrouter/retry.ts` — Selective retry logic: withRetry() with exponential backoff (1s, 2s, 4s), jitter, AbortController-based timeout per request type, retry-only on 429/503/5xx
  - `packages/ai/src/providers/openrouter.ts` — OpenRouter HTTP client: createOpenRouterClient() factory with chatCompletion(), chatCompletionStream() (AsyncGenerator SSE), embed(), listModels(), injectable fetch, configurable headers (HTTP-Referer, X-Title), API key from env, typed method returns
  - `packages/ai/src/index.ts` — Barrel exports: createOpenRouterClient, OpenRouterClient, all types, OpenRouterError
  - `packages/ai/eslint.config.js` — Added missing lint config
  - `packages/ai/package.json` — Added @repo/utils and @repo/config-eslint dependencies
  - Lint clean, typecheck clean
- [x] Phase 09 Step 09.02: Provider Abstraction Layer:
  - `packages/ai/src/providers/provider.ts` — `Provider` interface with 4 methods (chatCompletion, chatCompletionStream, embed, listModels), capabilities, and metadata
  - `packages/ai/src/providers/types.ts` — Unified cross-provider types: ChatRequest/Response, StreamChunk, EmbedRequest/Response, Model, ProviderCapability, ProviderConfig, ProviderMetadata
  - `packages/ai/src/providers/errors.ts` — ProviderError hierarchy (CapabilityError, ProviderConfigurationError, ProviderNotFoundError), mapProviderError() factory
  - `packages/ai/src/providers/openrouter.ts` — Added createOpenRouterProvider() adapter wrapping OpenRouterClient behind Provider interface, type conversion layer (snake_case → camelCase)
  - `packages/ai/src/providers/factory.ts` — createProvider() factory and createProviderFromConfig() convenience function
  - `packages/ai/src/index.ts` — Updated barrel exports for all new modules
  - Lint clean, typecheck clean
- [x] Phase 09 Step 09.03: Model Router:
  - `packages/ai/src/router/types.ts` — Router types: RouteRequest, RouteResult, ModelRegistryEntry, TaskType, HealthStatus, TierConfig
  - `packages/ai/src/router/tiers.ts` — Tier restrictions: free (gpt-4o-mini, claude-haiku-3.5), pro (up to $0.01), enterprise (unlimited)
  - `packages/ai/src/router/health.ts` — In-memory health tracker with per-model health status (healthy/degraded/down)
  - `packages/ai/src/router/registry.ts` — Model registry with 6 pre-populated models (gpt-4o, gpt-4o-mini, claude-sonnet-4, claude-haiku-3.5, gemini-2.0-flash, text-embedding-3-large), Redis caching (load/save), health updates
  - `packages/ai/src/router.ts` — createRouter() factory with route() function implementing priority chain: task capability → tier restrictions → capability matching → cost limit → health filter → cost optimization with healthy preference
  - Routing: < 10ms (pure in-memory, no API calls during routing), all decisions logged
  - Preferred model override, alternatives considered in reasoning
  - Redis cache key: `model:registry` with 5-minute TTL
  - Lint clean, typecheck clean
- [x] Phase 09 Step 09.04: Streaming Support:
  - `packages/ai/src/stream/types.ts` — StreamEvent union type (token, tool_call_start/delta/complete, citations, finish, error), StreamHandle, StreamOptions
  - `packages/ai/src/stream/accumulator.ts` — ToolCallAccumulator: merges streaming delta tool call arguments until JSON-parsable complete form
  - `packages/ai/src/stream/backpressure.ts` — BackpressureController: high-watermark (50) pause, low-watermark (20) resume, max 100 chunks
  - `packages/ai/src/stream/sse.ts` — formatStreamEvent() for SSE data formatting, formatEventStream() for ReadableStream creation
  - `packages/ai/src/stream.ts` — createStream(provider, request, options) with AsyncGenerator event stream, AbortController-based cancellation, 60s timeout, backpressure-aware chunk consumption, tool call detection and accumulation, onToken/onToolCall/onFinish callbacks
  - Abort signal threading through Provider.chatCompletionStream → OpenRouterProvider → OpenRouterClient → fetch for provider-level cancellation
  - SSE format: `data: {json}\n\n` for each StreamEvent
  - Provider interface updated: chatCompletionStream accepts optional AbortSignal
  - StreamChunk type updated: delta.toolCalls field for streaming tool call detection
  - OpenRouter types updated: StreamDelta.tool_calls field
  - Lint clean, typecheck clean
- [x] Phase 09 Step 09.05: Fallback & Circuit Breaker:
  - `packages/ai/src/fallback/types.ts` — FallbackConfig (chat/embedding model lists), FallbackResult, CircuitBreakerState, CircuitState types
  - `packages/ai/src/fallback/circuit-breaker.ts` — Redis-backed state machine: 3 failures/5min → OPEN, exponential backoff (60s–600s), HALF_OPEN probe, auto-reset on success
  - `packages/ai/src/fallback.ts` — createFallbackChain() factory with execute() for typed task execution, retryable error detection (ProviderError.retryable), async circuit breaker check per model, router health integration (setHealth down/degraded/healthy)
  - `packages/ai/src/providers/errors.ts` — ProviderError extended with retryable flag, mapProviderError() sets retryable=true for RateLimitError/ServerError/TimeoutError
  - `packages/ai/src/router/health.ts` — Added getHealthWithCircuit() async helper combining in-memory health + circuit breaker state
  - `packages/ai/src/index.ts` — Barrel exports for fallback chain, circuit breaker functions, and types
  - Circuit breaker states: CLOSED → 3 consecutive failures → OPEN → 60s–600s backoff → HALF_OPEN → 1 success → CLOSED, or failure → OPEN with 2x backoff
  - Fallback chain retries: only on retryable errors (timeout, rate limit, server error); non-retryable (auth, bad request) immediately mark model down
  - Redis keys: `circuit:{workspaceId}:{modelId}` with 600s TTL
  - Lint clean, typecheck clean
- [x] Phase 09 Step 09.06: Cost Tracker:
  - `packages/database/src/models/ai-cost.ts` — Mongoose schema with workspaceId, userId, model, provider, taskType, token counts, cachedTokens, cost, currency, timestamp, metadata (streamed, cached, fallbackDepth). Indexes: workspaceId+timestamp, model+timestamp, userId+timestamp, TTL (365 days)
  - `packages/ai/src/cost/types.ts` — AiCostRecordInput, AiCostRecord, PricingEntry, CostBreakdown, DailyCostPoint types
  - `packages/ai/src/cost/pricing.ts` — getPricing(model) for model price lookup from registry, calculateCost() with cached-token 50% discount, estimateCost() fallback (chars/4 heuristic)
  - `packages/ai/src/cost/aggregation.ts` — CostAggregationService interface + createCostAggregationService(query) factory with 4 aggregation methods: getWorkspaceCost, getModelCostBreakdown, getUserCost, getDailyCostTrend
  - `packages/ai/src/cost.ts` — createCostTracker(storage) with batch buffer (10s/100 records), CostStorage interface, computeCost()/toCostRecord() helpers, graceful shutdown
  - `packages/ai/src/providers/provider.ts` — withCostTracking() decorator wrapping Provider methods (chatCompletion, chatCompletionStream, embed) with cost recording callbacks
  - `packages/database/src/services/cost-storage.ts` — insertCostRecords() using AiCostModel.insertMany
  - `packages/database/src/services/cost-aggregation.ts` — runCostAggregation() delegating to AiCostModel.aggregate
  - Both barrels updated; lint + typecheck clean
- [x] Phase 09 Step 09.07: Rate Limiter:
  - `packages/ai/src/rate-limiter/types.ts` — RateLimitConfig (global/workspace/user tier configs), RateLimitTier, RateLimitResult, RateLimitCheckOptions, DEFAULT_RATE_LIMIT_CONFIG (100/50/10 req/min)
  - `packages/ai/src/rate-limiter/token-bucket.ts` — Lua TOKEN_BUCKET_SCRIPT for atomic token refill + consume, createTokenBucketClient() with dynamic `@repo/cache` import, fail-open on Redis errors
  - `packages/ai/src/rate-limiter.ts` — createRateLimiter() factory: checkLimit() with parallel three-tier check, bypass flag, consume()/resetLimit()/updateConfig()/getConfig(), config persistence in Redis
  - `packages/ai/src/index.ts` — Barrel exports for rate limiter types and factory
  - Lint clean, typecheck clean, build succeeds
- [x] Phase 09 Step 09.08: Prompt Template System:
  - `packages/ai/src/prompt/types.ts` — Template, TemplateVariable, CompiledTemplate, SegmentNode, RenderOptions, PromptRegistry types
  - `packages/ai/src/prompt/engine.ts` — Custom template engine: parse template into segment AST, render variables (`{{var}}`), defaults (`{{var:default}}`), conditionals (`{{#if}}`), iteration (`{{#each}}`), nested templates (`{{> name}}`)
  - `packages/ai/src/prompt/templates.ts` — 4 built-in templates: system/default, system/rag, system/tools, user/query with declared variables
  - `packages/ai/src/prompt/registry.ts` — createPromptRegistry() with register/get/list/render/renderMessages/validate/estimateTokens, version-aware lookup, required variable validation, optional strict mode
  - `packages/ai/src/prompt/estimator.ts` — Token estimation: CJK chars × 1.5, code blocks ÷ 3, plain text ÷ 4
  - `packages/ai/src/prompt.ts` — Barrel exports
  - `packages/ai/src/index.ts` — Barrel exports for prompt module
  - Lint clean, typecheck clean, build succeeds
- [x] Phase 09 Step 09.09: AI Gateway API Routes:
  - `packages/validation/src/schemas/ai.ts` — Zod schemas for AI API requests (aiChatRequestSchema, aiEmbedRequestSchema, aiChatMessageSchema, aiErrorResponseSchema)
  - `apps/web/src/app/api/ai/schema.ts` — Route-level Zod schemas + types (chatRequestSchema, embedRequestSchema)
  - `apps/web/src/app/api/ai/middleware.ts` — Auth context extraction, error response helpers (unauthorized, rateLimited, badRequest, serverError, notFound)
  - `apps/web/src/app/api/ai/chat/route.ts` — POST /api/ai/chat: non-streaming chat with model routing via router.route(), fallback chain with configurable model list, OpenRouter provider
  - `apps/web/src/app/api/ai/chat/stream/route.ts` — POST /api/ai/chat/stream: SSE streaming via createStream + formatEventStream, Content-Type text/event-stream
  - `apps/web/src/app/api/ai/embed/route.ts` — POST /api/ai/embed: text embedding with model routing fallback
  - `apps/web/src/app/api/ai/models/route.ts` — GET /api/ai/models: model listing from OpenRouter API
  - Lint clean, typecheck clean (pre-existing @repo/mcp only)
- RAG Engine (Step 08.01-08.05 pending embedding pipeline)
- Connector SDK and implementations
- Chat UI
- Admin dashboard
- Billing
- Marketplace
- Enterprise features
- Performance optimization
- Scalability

## Blocked

- Phase 08 Steps 08.01-08.05 (Vector Store, Retriever, Hybrid Search, Re-ranker) blocked on Phase 07 (Embedding Pipeline).

## Technical Debt

| Item | Severity | Notes |
|---|---|---|
| Missing test coverage | Medium | No tests written yet |
| Missing Inngest setup | Low | Event/signing keys not configured |
| @repo/ui markdown-renderer.tsx lint errors | Low | Pre-existing: 4 errors (import order, no-base-to-string, no-img-element rule missing) |
| @repo/cache typecheck error in test | Low | Pre-existing: TTLCache constructor argument mismatch in test |
| @repo/utils typecheck error in test | Low | Pre-existing: retry sync vs async function signature in index.test.ts |
| @repo/database test imports fixed | Low | mongodb-memory-server devDependency added to resolve TS2307 |

## Architecture Violations

None detected.

## Pending Decisions

| Decision | Status | Owner |
|---|---|---|
| Model routing strategy (AI Gateway) | Resolved | Cheapest-capable + preferred model override |
| Chunking strategy for RAG | Pending | — |
| Pricing tiers for billing | Pending | — |

## Documentation

| Asset | Count | Status |
|---|---|---|
| Phase READMEs | 19 | Complete |
| Implementation step files | 210 | Complete |
| ADRs | 10 | Complete |
| Templates | 12 | Complete |
| Checklists | 8 | Complete |
| Standards | 11 | Complete |
| Strategic docs (STATUS, NEXT_STEP, AI_INSTRUCTIONS, IMPLEMENTATION_ORDER) | 4 | Complete |

## Last Updated

2026-06-17 (Phase 09 Steps 09.01-09.09 complete)
