# Status

> Project implementation status and tracking.

## Overall Progress

| Category | Count | Progress |
|---|---|---|---|---|
| Phases Total | 19 (00-18) | 3 completed |
| Steps Total | ~220 | 66 completed |
| Packages | 15 | 12 implemented |
| Apps | 4 | 4 scaffolded |

## Current Phase

**Phase 3: Workspace** — Building the multi-tenant workspace layer, enabling teams to collaborate within isolated environments.

## Current Step

**Step 03.09** — Workspace Switcher — Build the workspace switcher dropdown.

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

## Not Started

- App implementation code (apps/admin, apps/docs, apps/landing need pages, components, API routes)
- Errors package (@repo/errors)
- Errors package (@repo/errors)
- AI Gateway
- MCP Gateway
- RAG Engine
- Storage integration
- PDF processing
- Connector SDK and implementations
- Chat UI
- Admin dashboard
- Billing
- Marketplace
- Enterprise features
- Performance optimization
- Scalability

## Blocked

None.

## Technical Debt

| Item | Severity | Notes |
|---|---|---|
| Missing test coverage | Medium | No tests written yet |
| — | — | — |
| Missing Inngest setup | Low | Event/signing keys not configured |
| — | — | — |

## Architecture Violations

None detected.

## Pending Decisions

| Decision | Status | Owner |
|---|---|---|
| Model routing strategy (AI Gateway) | Pending | — |
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

2026-06-13 (Step 03.08 complete)
