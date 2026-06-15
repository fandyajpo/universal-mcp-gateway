# Universal MCP Gateway Roadmap

Enterprise AI Workspace Platform — integrating document intelligence, retrieval-augmented generation, and the Model Context Protocol into a multi-tenant SaaS offering.

---

## Phase 0: Foundation (Complete)

Establish the monorepo structure, toolchain, and architectural groundwork. All items in this phase are baseline requirements before any feature work begins.

- [x] Initialize TurboRepo monorepo with pnpm workspaces
- [x] Configure TypeScript base configuration with strict mode
- [x] Create project directory structure for apps and packages
- [x] Write pnpm-workspace.yaml defining workspace entry points
- [x] Build turbo.json pipeline with build, dev, test, lint, typecheck tasks
- [x] Document environment variables in .env.example for all services
- [x] Write architectural documentation covering system design and data flow
- [x] Create ADR directory for technology decision records
- [x] Set up GitHub issue templates (bug, feature, RFC)
- [x] Create CODE_OF_CONDUCT.md and CONTRIBUTING.md
- [x] Write SECURITY.md with vulnerability disclosure policy
- [x] Create CHANGELOG.md following Keep a Changelog format
- [x] Add .editorconfig, .gitattributes, and .gitignore for repository consistency
- [x] Create LICENSE file (MIT)
- [x] Configure env-aware pipeline with keys for database, Redis, R2, OpenRouter, Better Auth, Sentry, Inngest

---

## Phase 1: Bootstrap (Complete)

Scaffold the four Next.js applications and all shared packages with proper tooling, configuration, and build chains.

- [x] Scaffold apps/web with Next.js 15 App Router and src/ directory
- [x] Scaffold apps/admin with Next.js 15 App Router and src/ directory
- [x] Scaffold apps/docs with Next.js 15 and MDX support
- [x] Scaffold apps/landing with Next.js 15 and static export configuration
- [x] Initialize each package stub (ai, auth, cache, config, connector-sdk, connectors, crypto, database, logger, mcp, rag, types, ui, utils, validation) with package.json and tsconfig
- [x] Configure TailwindCSS v4 with CSS variables and dark mode support
- [x] Install and configure shadcn/ui with custom color tokens
- [x] Build packages/ui component library with button, card, input, dialog, dropdown, badge, avatar, toast, skeleton
- [x] Set up react-markdown with Shiki syntax highlighting in packages/ui
- [x] Create packages/types with shared Zod schemas for all domain objects
- [x] Create packages/config with shared ESLint, Prettier, and TypeScript configs
- [x] Create packages/logger with Pino-based structured logging
- [x] Create packages/validation with Zod utility schemas and middleware helpers
- [x] Configure CI workflow in .github/workflows for lint, typecheck, and build on PR
- [x] Set up commitlint and husky for conventional commit enforcement

---

## Phase 2: Authentication (Complete)

Implemented a complete authentication system using Better Auth with multi-factor, OAuth, and RBAC support.

- [x] Install and configure Better Auth in packages/auth with database adapter
- [x] Implement email and password authentication with password hashing (bcrypt)
- [x] Implement password reset flow with token expiration and email notification
- [x] Configure Google OAuth provider with proper redirect and callback handling
- [x] Configure GitHub OAuth provider with proper redirect and callback handling
- [x] Implement session management with refresh token rotation
- [x] Build login page in apps/web with form validation and error states
- [x] Build register page in apps/web with email verification flow
- [x] Implement multi-factor authentication with TOTP (authenticator app)
- [x] Build RBAC authorization framework in packages/auth with role hierarchy
- [x] Create auth middleware for Next.js with public/protected route configuration
- [x] Build email verification flow with resend support
- [x] Implement rate limiting on auth endpoints (login, register, reset)
- [x] Add session invalidation on password change and admin force-logout

---

## Phase 3: Workspace (Complete)

Build the multi-tenant workspace layer, enabling teams to collaborate within isolated environments.

- [x] Implement workspace CRUD API (create, read, update, delete, archive)
- [x] Build workspace settings page (name, slug, avatar, timezone, locale)
- [x] Implement member invitation flow via email with accept/decline
- [x] Build member management UI with role assignment and removal
- [x] Implement workspace-level RBAC with roles: owner, admin, member, viewer
- [x] Build workspace switcher component in app header
- [ ] Implement workspace-scoped session isolation
- [ ] Build workspace onboarding wizard for new workspaces
- [x] Implement soft delete and restore for workspaces
- [x] Add workspace transfer of ownership flow
- [ ] Build workspace-level audit log for configuration changes
- [x] Implement default workspace assignment on user registration
- [x] Add workspace slug uniqueness validation with character restrictions

---

## Phase 4: Database (Complete)

Establish the data access layer with MongoDB Atlas, repository pattern, tenant isolation, and production-grade connection management.

- [x] Set up MongoDB Atlas cluster (M10+, dedicated, multi-region)
- [x] Implement connection manager with health checks and auto-reconnect
- [x] Build repository pattern in packages/database with generic CRUD interface
- [x] Implement tenant-aware repository layer with automatic workspaceId scoping
- [x] Create indexing strategy document and apply compound indexes for common query patterns
- [x] Implement database migration framework with versioned, idempotent scripts
- [x] Configure connection pooling with optimal min/max pool sizes
- [x] Set up read replica configuration for analytics and reporting queries
- [x] Implement query timing and slow query logging
- [x] Build database health check endpoint for monitoring
- [x] Create seed scripts for development and staging environments
- [x] Implement transaction support for multi-document operations
- [x] Add database-level encryption at rest configuration

---

## Phase 5: Storage (Current)

Implement file storage infrastructure using Cloudflare R2 with signed URLs, validation, and CDN delivery.

- [ ] Provision Cloudflare R2 bucket with public and private access rules
- [ ] Implement file upload service with multipart support and progress tracking
- [ ] Build file download service with signed URL generation (expiring)
- [ ] Implement client-side file upload component with drag-and-drop and progress bar
- [ ] Add file type validation using magic bytes (not just extension)
- [ ] Enforce file size limits per workspace tier (configurable)
- [ ] Define folder structure per tenant: /workspaces/{workspaceId}/{entity}/{date}
- [ ] Configure Cloudflare CDN caching rules for public assets
- [ ] Implement file deletion with cascade to referenced entities
- [ ] Build file metadata extraction (dimensions, duration, page count)
- [ ] Add virus scanning integration (ClamAV or similar)
- [ ] Implement bandwidth usage tracking per workspace
- [ ] Build file browser UI with list/grid view, search, and folder navigation

---

## Phase 6: PDF Processing

Build the document ingestion pipeline: upload, extract, structure, and index PDF content.

- [ ] Implement PDF upload flow with immediate processing trigger via Inngest
- [ ] Set up Inngest event-driven queue for asynchronous PDF processing
- [ ] Implement text extraction using pdf.js (client-side preview) and PyMuPDF (server-side)
- [ ] Build OCR integration using Tesseract.js for scanned document fallback
- [ ] Implement chunking strategy: semantic split by heading, paragraph, and page boundary
- [ ] Extract document metadata (title, author, creation date, page count, PDF version)
- [ ] Build table extraction pipeline (Camelot/py with Python sidecar)
- [ ] Implement image and figure extraction from PDF pages
- [ ] Add processing status tracking with real-time WebSocket updates
- [ ] Build processing error handling with retry logic and dead-letter queue
- [ ] Implement PDF-to-text quality metrics (character confidence, extraction rate)
- [ ] Add support for password-protected PDFs with user-provided credentials
- [ ] Build processing dashboard showing queue depth, success rates, and failures

---

## Phase 7: Embedding

Implement the embedding pipeline to convert extracted text into vector representations using OpenRouter's model gateway.

- [ ] Integrate OpenRouter client in packages/ai for embedding model access
- [ ] Select and configure primary embedding model (e.g., text-embedding-3-large)
- [ ] Implement batch processing pipeline with configurable batch sizes
- [ ] Build rate limit handler with exponential backoff and queue management
- [ ] Implement embedding cache with LRU eviction and TTL
- [ ] Add cost tracking per workspace per embedding model
- [ ] Build embedding validation with dimensionality and normalization checks
- [ ] Implement incremental embedding for document updates (not full re-embed)
- [ ] Add embedding quality monitoring (cosine similarity distribution)
- [ ] Implement concurrent embedding with controlled parallelism
- [ ] Build fallback model chain on primary model failure
- [ ] Add embedding performance metrics (latency p50/p95/p99, throughput)

---

## Phase 8: RAG Engine

Build the retrieval-augmented generation engine with hybrid search, re-ranking, and citation management.

- [ ] Create MongoDB Atlas Vector Search index with appropriate dimensions and similarity metric
- [ ] Implement hybrid search combining vector similarity and full-text keyword search
- [ ] Build re-ranking service using Cohere or BGE cross-encoder model
- [ ] Implement context window management with dynamic truncation and sliding window
- [ ] Build citation tracking with source document, page number, and text excerpt
- [ ] Implement retrieval evaluation pipeline (hit rate, MRR, NDCG)
- [ ] Build query expansion using LLM-generated paraphrases
- [ ] Implement metadata filtering for workspace-scoped and document-scoped retrieval
- [ ] Add document-level access control enforcement in retrieval queries
- [ ] Build A/B testing framework for retrieval strategy comparison
- [ ] Implement caching layer for frequent queries with embedding hash keys
- [ ] Add retrieval latency monitoring and query profiling

---

## Phase 9: AI Gateway

Build the unified AI gateway that routes requests to appropriate models through OpenRouter with cost control and reliability.

- [ ] Implement OpenRouter client wrapper with retry, timeout, and error handling
- [ ] Build model routing logic: cheapest capable model by task type
- [ ] Create provider abstraction layer for multi-provider fallback
- [ ] Implement streaming support with Server-Sent Events (SSE)
- [ ] Build fallback chain on provider failure (e.g., OpenAI -> Anthropic -> Google)
- [ ] Implement cost tracking per request, per workspace, per model
- [ ] Add rate limiting with token bucket algorithm per API key and per workspace
- [ ] Build prompt templating system with variable interpolation and versioning
- [ ] Implement request/response logging for audit and debugging
- [ ] Add content moderation pre-filter and post-filter
- [ ] Build token usage monitoring dashboard
- [ ] Implement prompt validation against injection patterns and excessive length
- [ ] Add model capability registry (context window, supported features, pricing)

---

## Phase 10: MCP Gateway

Build the core MCP (Model Context Protocol) gateway that enables AI models to discover and invoke tools dynamically.

- [ ] Implement MCP protocol server (JSON-RPC 2.0 over SSE and stdio transports)
- [ ] Build tool registry with schema validation and dynamic registration
- [ ] Implement tool execution sandbox with timeout, resource limits, and output cap
- [ ] Build streaming tool responses for long-running tool invocations
- [ ] Implement tool versioning with backward compatibility guarantees
- [ ] Build error handling with structured error codes and recovery hints
- [ ] Implement tool discovery endpoints for listing available capabilities
- [ ] Build tool-level authentication and authorization checks
- [ ] Implement tool invocation audit trail with full request/response capture
- [ ] Add tool health monitoring and circuit breaker for failing tools
- [ ] Build tool testing playground in apps/web for developers
- [ ] Implement caching layer for deterministic tool invocations
- [ ] Add pagination support for tool listing and result streaming

---

## Phase 11: Connector SDK

Build the connector ecosystem that allows third-party service integration through a standardized SDK.

- [ ] Design and document the connector interface specification
- [ ] Build the connector-sdk package with abstract base class and lifecycle hooks
- [ ] Implement Slack connector: messages, channels, search, file upload
- [ ] Implement Notion connector: pages, databases, search, comments
- [ ] Implement GitHub connector: repos, issues, PRs, file content, search
- [ ] Implement Linear connector: issues, projects, comments, search
- [ ] Implement Jira connector: issues, projects, sprints, search
- [ ] Implement Confluence connector: pages, spaces, attachments, search
- [ ] Implement Google Drive connector: files, folders, search, permission reading
- [ ] Build connector marketplace API for listing, installing, and configuring connectors
- [ ] Build connector installation flow with OAuth2 authorization
- [ ] Implement connector credential encryption and secure storage
- [ ] Build connector health monitoring and reconnection logic
- [ ] Add connector usage analytics (requests, latency, error rates)

---

## Phase 12: Chat

Build the conversational AI interface with full context management, file attachments, and MCP tool integration.

- [ ] Build chat UI with shadcn/ui components: message list, input, thread sidebar
- [ ] Implement streaming chat with real-time token display via SSE
- [ ] Build message persistence layer with MongoDB document storage
- [ ] Implement conversation context management with token budget tracking
- [ ] Build multi-turn conversation support with edit history and branching
- [ ] Implement file attachment upload and preview within chat
- [ ] Integrate MCP tool invocation as inline chat suggestions
- [ ] Build citations display with source preview on hover
- [ ] Implement conversation search across all user threads
- [ ] Build conversation export (JSON, Markdown, PDF)
- [ ] Add message feedback (thumbs up/down) for quality monitoring
- [ ] Implement suggested follow-up questions generation
- [ ] Build system prompt configuration UI per workspace
- [ ] Add conversation sharing with view-only links

---

## Phase 13: Admin

Build the administrative dashboard for platform-wide management, monitoring, and configuration.

- [ ] Build admin dashboard with overview metrics (users, workspaces, revenue, errors)
- [ ] Implement user management: list, search, suspend, delete, impersonate
- [ ] Implement workspace management: list, search, suspend, data export
- [ ] Build billing overview: MRR, churn rate, active subscriptions, failed payments
- [ ] Implement audit log viewer with filtering by entity, action, user, and date range
- [ ] Build system health dashboard: service status, uptime, incident history
- [ ] Implement feature flag management UI with percentage rollout and user targeting
- [ ] Build announcements system with dismissible in-app notifications
- [ ] Implement background job monitoring (Inngest queue depth, success rate)
- [ ] Build API key management for workspace integrations
- [ ] Implement rate limit configuration and monitoring per endpoint
- [ ] Build support ticket view with workspace context
- [ ] Add email notification preferences and templates management

---

## Phase 14: Billing

Build the billing and subscription system with Stripe integration, metered usage, and invoicing.

- [ ] Design and document pricing tiers (Free, Pro, Business, Enterprise)
- [ ] Integrate Stripe with webhook handling for subscription lifecycle events
- [ ] Implement subscription management: create, upgrade, downgrade, cancel
- [ ] Build usage tracking service for AI tokens, storage, and API calls
- [ ] Implement metered billing for AI token consumption based on model tier
- [ ] Build invoicing system with automated monthly billing
- [ ] Implement payment method management (add, remove, default)
- [ ] Build billing portal UI: current plan, usage, invoices, payment methods
- [ ] Implement dunning management for failed payments with retry logic
- [ ] Build coupon and discount code system
- [ ] Implement trial period management with expiration notifications
- [ ] Build revenue analytics dashboard for internal use
- [ ] Add multi-currency support for international customers

---

## Phase 15: Marketplace

Build the connector and extension marketplace where developers can publish and monetize integrations.

- [ ] Design marketplace listing schema (name, description, icon, screenshots, pricing)
- [ ] Build connector publishing flow with versioned releases
- [ ] Implement version management with semantic versioning and changelog
- [ ] Build reviews and ratings system with moderation
- [ ] Implement installation metrics dashboard for publishers
- [ ] Build revenue sharing model with automated payout calculations
- [ ] Implement marketplace API for programmatic discovery and installation
- [ ] Build developer onboarding flow with documentation and starter templates
- [ ] Implement connector submission review process
- [ ] Build enterprise approval workflow for connector whitelisting
- [ ] Implement usage analytics per connector (installs, active users, API calls)
- [ ] Build featured and curated connector collections
- [ ] Add connector update notification and auto-upgrade flow

---

## Phase 16: Enterprise Features

Deliver enterprise-grade features required for organizational adoption: SSO, compliance, audit, and dedicated infrastructure.

- [ ] Implement SSO/SAML with identity provider configuration UI
- [ ] Build SCIM directory sync for user and group provisioning
- [ ] Implement custom branding with logo, colors, domain, and email templates
- [ ] Build comprehensive audit trail with immutable log storage
- [ ] Implement data retention policies with automated purging schedules
- [ ] Achieve SOC 2 Type II compliance with evidence collection automation
- [ ] Implement GDPR data subject request workflows (access, delete, portability)
- [ ] Build SLA monitoring and reporting dashboard
- [ ] Implement dedicated infrastructure provisioning (isolated compute, database, storage)
- [ ] Build IP allowlisting for workspace API access
- [ ] Implement organization-wide policy controls (password policy, session timeout, MFA enforcement)
- [ ] Build activity reports for compliance officers
- [ ] Implement data egress controls and geographic restrictions

---

## Phase 17: Performance Optimization

Optimize the entire platform for speed, efficiency, and resource utilization across frontend, backend, and data layers.

- [ ] Run webpack bundle analysis and implement code splitting by route
- [ ] Implement Next.js image optimization with Cloudflare Image Resizing
- [ ] Configure CDN caching strategy with cache tags and purging
- [ ] Run database query analysis and optimize slow queries with compound indexes
- [ ] Eliminate N+1 query patterns using MongoDB aggregation and batch loading
- [ ] Tune MongoDB connection pooling for concurrent request workload
- [ ] Implement multi-level caching: in-memory, Redis, CDN with cache stampede prevention
- [ ] Move compute-heavy operations to edge functions (Cloudflare Workers)
- [ ] Implement React Server Components for data-fetching pages
- [ ] Optimize streaming chat with backpressure handling and chunk tuning
- [ ] Profile and optimize RAG retrieval pipeline latency
- [ ] Implement database query result caching with workspace-aware invalidation
- [ ] Run Lighthouse audits and achieve 95+ scores on all routes

---

## Phase 18: Scalability

Architect the platform to handle 10x growth with horizontal scaling, global distribution, and disaster recovery.

- [ ] Implement horizontal scaling for API servers with session affinity
- [ ] Design and implement database sharding strategy by workspace ID
- [ ] Configure MongoDB read replica set with automated failover
- [ ] Implement queue worker autoscaling based on queue depth metrics
- [ ] Deploy to global edge regions (US, EU, APAC) with latency-based routing
- [ ] Create microservice extraction plan identifying bounded context boundaries
- [ ] Implement disaster recovery with cross-region replication and RTO/RPO targets
- [ ] Build multi-region active-active deployment architecture
- [ ] Implement database migration zero-downtime strategy
- [ ] Build load testing suite with k6 simulating realistic user patterns
- [ ] Implement circuit breakers and bulkheads for service isolation
- [ ] Build auto-scaling policies for compute, database, and worker resources
- [ ] Implement canary deployments with automated rollback
- [ ] Create runbooks for common failure scenarios and scaling events
