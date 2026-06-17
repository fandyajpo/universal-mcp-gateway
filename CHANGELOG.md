# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Phase 10 Step 10.01: MCP Protocol Handler (`@repo/mcp`):
  - 8 new source files: types, protocol (handler, json-rpc, methods, errors), transports (interface, SSE, stdio)
  - JSON-RPC 2.0 parser/validator with full error code support (-32700, -32600, -32601, -32602, -32603)
  - Method registry for handler routing (initialize, ping, tools/list, tools/call, notifications)
  - Protocol handler with initialization handshake enforcement, cancellation support, batch requests
  - Transport abstraction interface with SSE (HTTP server) and stdio (subprocess) implementations
  - SSE transport: `/mcp/sse` endpoint for outgoing events, `/mcp` POST for incoming messages
  - Stdio transport: readline from stdin, line-delimited JSON to stdout
  - All exports via `@repo/mcp` barrel

- Phase 09 Step 09.10: AI Gateway Verification (`@repo/ai`, `apps/web`):
  - 10 test files with 70 tests covering all 9 AI Gateway components (09.01-09.09):
    - OpenRouter client (6 tests): chat completion, streaming, embedding, model listing, error classification, retry logic
    - Provider abstraction (5 tests): provider interface, adapter methods, error mapping
    - Model router (10 tests): route selection, tier restrictions, health-aware routing, cost limits, preferred model, Redis persistence
    - Streaming support (7 tests): token events, callbacks, abort, SSE formatting, ReadableStream conversion
    - Fallback & circuit breaker (5 tests): fallback depth, model exhaustion, circuit breaker skip, embedding fallback
    - Cost tracker (8 tests): record storage, batch flushing, pricing lookup, cost calculation with cached token discount
    - Rate limiter (3 tests): default config, configuration override, token bucket consumption
    - Prompt template system (19 tests): rendering, conditionals, iteration, nested templates, versioning, validation, token estimation
    - E2E (3 tests): chat completion, streaming, router+fallback (skipped without OPENROUTER_API_KEY)
    - Performance benchmarks (4 tests): burst rate limiting, CJK token estimation, circuit breaker tracking
  - Fixed `{{#if}}`/`{{/if}}` and `{{#each}}`/`{{/each}}` offset bug in prompt/engine.ts (off-by-one consumed next char)
  - Test infrastructure: `vitest.config.ts`, `tsconfig.json` exclusion, `vitest` devDependency
  - All tests pass with mocked `@repo/cache` and `@repo/logger` dependencies
  - Phase 09 marked complete

- Phase 09 Step 09.07: Rate Limiter (`@repo/ai`):
  - Token bucket algorithm with Lua script (`TOKEN_BUCKET_SCRIPT`) for atomic refill + consume in Redis
  - Three-tier rate limiting (global/workspace/user) with configurable capacities and refill rates (defaults: 100/50/10 req/min)
  - `createRateLimiter()` factory with checkLimit() (parallel three-tier check), consume(), resetLimit(), updateConfig(), getConfig()
  - Bypass flag for internal/admin requests — returns fake unlimited result
  - Config persistence to Redis key `ratelimit:ai:config` with 5min TTL
  - Dynamic `@repo/cache` import for Redis client (no circular dependency)
  - Fail-open on Redis errors — rate limiting never blocks API calls
  - Barrel exports in `packages/ai/src/index.ts`

- Phase 09 Step 09.09: AI Gateway API Routes (`apps/web` + `@repo/validation`):
  - `POST /api/ai/chat` — non-streaming chat completion with model routing and fallback chain
  - `POST /api/ai/chat/stream` — SSE streaming chat via `createStream` + `formatEventStream`
  - `POST /api/ai/embed` — text embedding with model routing fallback
  - `GET /api/ai/models` — model listing from OpenRouter API
  - `apps/web/src/app/api/ai/schema.ts` — Zod request/response schemas (chatRequestSchema, embedRequestSchema)
  - `apps/web/src/app/api/ai/middleware.ts` — auth context extraction, error response helpers
  - `packages/validation/src/schemas/ai.ts` — shared AI API validation schemas

- Phase 09 Step 09.08: Prompt Template System (`@repo/ai`):
  - Custom template engine: segment-based parser + renderer supporting `{{var}}`, `{{var:default}}`, `{{#if}}`/`{{/if}}`, `{{#each}}`/`{{/each}}`, and `{{> nestedTemplate}}`
  - Template registry (`createPromptRegistry`) with versioning (integer versions, latest-by-default), built-in templates (system/default, system/rag, system/tools, user/query), template composition via `{{> name}}`
  - `render(templateName, variables)`, `renderMessages(templateName, variables)` for system/user message construction, `validate()`, `estimateTokens()` with CJK/code-aware heuristics
  - Compiled template caching — templates parsed once, render function cached in memory
  - Required variable validation throws clear error; optional strict mode warns on unused variables
  - Token estimation: CJK ×1.5, code blocks ÷3, plain text ÷4 — sync, < 2ms
  - All types exported via `@repo/ai` barrel

- Phase 09 Step 09.06: Cost Tracker (`@repo/ai` + `@repo/database`):
  - Mongoose schema (`AiCostModel`) with workspaceId, userId, requestId, model, provider, taskType, prompt/completion/totalTokens, cachedTokens (50% discount), cost, currency, timestamp, metadata. Indexes on workspaceId+timeramp, model+timestamp, userId+timestamp. TTL index: 365 days.
  - Cost tracker service (`createCostTracker`) in `@repo/ai` with batch buffer (flush every 10s or 100 records), fire-and-forget writes, graceful shutdown via `shutdown()`
  - Pricing lookup (`getPricing`) from model registry with `calculateCost()` (per-token * price / 1M) and cached-token 50% discount. Estimation fallback (chars/4 heuristic) when usage data missing
  - Aggregation queries (`CostAggregationService`): getWorkspaceCost, getModelCostBreakdown, getUserCost, getDailyCostTrend via MongoDB aggregation pipelines
  - Provider decorator (`withCostTracking`) wrapping chatCompletion, chatCompletionStream (records after stream completes), and embed — non-blocking cost recording
  - Database services: `insertCostRecords()` and `runCostAggregation()` in `@repo/database` for decoupled MongoDB access
  - Barrel exports in both `@repo/ai` and `@repo/database`

- Phase 09 Step 09.05: Fallback & Circuit Breaker (`@repo/ai`):
  - Provider failover chain: configurable fallback model list per task type (chat/embedding), retryable error detection (ProviderError.retryable flag), circuit breaker check before each attempt
  - Redis-backed circuit breaker: 3 consecutive failures in 5-min window → OPEN state, exponential backoff (60s–600s), HALF_OPEN probe on cooldown expiry, reset on success
  - State machine: CLOSED → failures → OPEN → backoff → HALF_OPEN → success → CLOSED, or failure → OPEN with 2x backoff
  - Router health integration: setHealth("down") on circuit open, "degraded" on failure, "healthy" on success
  - getHealthWithCircuit() async helper combining in-memory health + circuit breaker state for routing decisions
  - Circuit breaker keys: `circuit:{workspaceId}:{modelId}` with 600s TTL via `@repo/cache`
  - Fallback chain resets on non-retryable errors (auth, bad request) — marks model down immediately
  - Barrel exports: createFallbackChain, FallbackChain/FallbackChainOptions/FallbackChainResult types, circuit breaker functions (getCircuitState, recordFailure, recordSuccess, resetCircuit)

- Phase 09 Step 09.04: Streaming support (`@repo/ai`):
  - Stream manager: `createStream(provider, request, options)` with typed AsyncGenerator event stream
  - 7 StreamEvent types: token, tool_call_start, tool_call_delta, tool_call_complete, citations, finish, error
  - Tool call accumulation from streaming deltas via `ToolCallAccumulator`
  - Backpressure controller: high-watermark 50, low-watermark 20, max 100 chunks
  - SSE formatting helpers: `formatStreamEvent()` + `formatEventStream()` (ReadableStream)
  - AbortController-based cancellation with signal threading through Provider → OpenRouter → fetch
  - 60-second idle timeout, onToken/onToolCall/onFinish callbacks
  - Provider.chatCompletionStream accepts optional AbortSignal for provider-level abort
  - StreamChunk delta extended with toolCalls field for streaming tool call detection
  - OpenRouter StreamDelta extended with tool_calls field

- Phase 09 Step 09.03: Model router (`@repo/ai`):
  - Model registry with 6 pre-populated models and their capabilities, pricing, and tier access
  - `route()` function implementing priority chain: task capability → tier restrictions → capability matching → cost limit → health filter → cost optimization
  - Tier enforcement: free (only cheap models), pro ($0.01 max), enterprise (unlimited)
  - Health-aware selection: skips `down` models, prefers `healthy` over `degraded`
  - Preferred model override with fallback to cheapest capable
  - Redis-backed registry caching (`model:registry`, 5-minute TTL)
  - All routing decisions logged with alternatives considered
  - Routing latency: < 10ms (pure in-memory, no API calls)
  - Types: RouteRequest, RouteResult, ModelRegistryEntry, TaskType, HealthStatus, TierConfig

- Phase 09 Step 09.02: Provider abstraction layer (`@repo/ai`):
  - `Provider` interface with 4 methods: `chatCompletion`, `chatCompletionStream`, `embed`, `listModels`
  - Unified cross-provider types: `ChatRequest`/`ChatResponse`, `StreamChunk`, `EmbedRequest`/`EmbedResponse`, `Model`, `ProviderCapability`, `ProviderConfig`
  - Provider error hierarchy: `ProviderError`, `CapabilityError`, `ProviderConfigurationError`, `ProviderNotFoundError` with `mapProviderError()` factory
  - `createOpenRouterProvider()` adapter — wraps `OpenRouterClient` behind `Provider` interface, converts snake_case OpenRouter types to camelCase unified types
  - `createProvider()` factory and `createProviderFromConfig()` convenience function
  - Updated barrel exports in `packages/ai/src/index.ts`
  - Lint and typecheck clean

- Phase 09 Step 09.01: OpenRouter client (`@repo/ai`):
  - `createOpenRouterClient()` factory with 4 methods: `chatCompletion`, `chatCompletionStream` (SSE AsyncGenerator), `embed`, `listModels`
  - Typed request/response types: ChatCompletionRequest, StreamChunk, EmbeddingRequest, ModelInfo, OpenRouterConfig
  - Error classification hierarchy: RateLimitError, TimeoutError, AuthError, ServerError, InvalidRequestError with `classifyError()` factory
  - Selective retry logic: `withRetry()` with exponential backoff (1s, 2s, 4s + jitter), AbortController timeout, retry only on 429/503/5xx
  - Injectable `fetch` function for testability, configurable `HTTP-Referer`/`X-Title` headers, API key from `OPENROUTER_API_KEY` env var
  - All API calls logged via `@repo/logger` with model, token count, latency
  - Provider type definitions (AIProvider, ProviderConfig, ProviderType) for future abstraction layer
  - `packages/ai/eslint.config.js` added, `@repo/utils` and `@repo/config-eslint` dependencies added

- Retrieval evaluation framework (`@repo/rag`):
  - `EvalRunner` class with dependency-injected RAGEngine for automated evaluation against datasets
  - 5 metrics computed at K=1,3,5,10,20: hit rate, Mean Reciprocal Rank (MRR), Normalized DCG (NDCG), precision, recall
  - `PerQueryMetrics` tracking retrieved vs relevant chunk IDs, hit-at-K flags, reciprocal rank
  - `AggregatedMetrics` with mean-of-means aggregation across all queries, average relevant rank
  - Dataset types: `EvalQuery` (id, query, relevantChunkIds), `EvalDataset`, `EvalConfig`
  - `validateDataset()` with field checks, duplicate detection, and zero-tolerance for invalid entries
  - `computeDCG()` / `computeIDCG()` for per-query NDCG calculation with binary relevance
  - `formatMetricTable()` producing markdown tables for console/CI output
  - Sample dataset (`fixtures/sample.ts`) with 20 synthetic queries covering all RAG features
  - `EvaluationError` typed class with code + details for structured error handling
  - `scripts/run-eval.ts` CLI entry point running 3 config variants (vector-only, hybrid, hybrid+rerank)
  - `pnpm --filter @repo/rag eval` script registered in `package.json`

- RAG API routes (`@repo/web`):
  - `POST /api/rag/query` — RAG query endpoint with Zod validation, auth via session headers, workspace membership check
  - `GET /api/rag/status/:documentId` — document indexing status check
  - `POST /api/rag/reindex/:documentId` — trigger document re-indexing
  - `DELETE /api/rag/index/:documentId` — delete document index (chunks)
  - Shared error utility functions: `unauthorized()`, `forbidden()`, `badRequest()`, `notFound()`, `rateLimited()`, `serverError()`
  - Zod schemas: `ragQuerySchema`, `ragQueryOptionsSchema`, `documentIdParamsSchema` in `@repo/validation`

- RAG Engine composition (`@repo/rag`):
  - `createRAGEngine(deps)` factory with injectable services (embedText, retrieve, rerank)
  - Pipeline orchestration: embedding → retrieval → re-ranking → context builder
  - `PipelineStep<I, O>` interface with `name`, `required`, `execute()` for composable pipeline steps
  - Error recovery: critical steps (embedding, retrieval) fail the pipeline; non-critical (reranker) degrades gracefully
  - Pipeline tracing via `createTracer()` with per-step duration, success/failure logging, aggregate metadata
  - Query normalization middleware stripping HTML tags and URLs before embedding
  - `RAGResult` output with assembled context, retrieved chunks, token count, and pipeline metadata

- Context window builder (`@repo/rag`):
  - `buildContext()` with token budget allocation (context 70%, instructions 15%, history 15%)
  - Chunk formatting with sequential citation markers `[1]`, `[2]`, etc., source document title, section path, page number
  - Conversation history handling with oldest-first truncation and sliding window summarization
  - Overflow truncation: lowest-score chunks removed first, then oldest history messages
  - Guaranteed system instructions allocation (never truncated)
  - Structured context output with section separators (`<context>`, `<conversation_history>`, `<instructions>`)
  - `TruncationDetails` metadata reporting what was removed and why
  - Token counting via `gpt-tokenizer` with `countTokens()` and `truncateToTokenLimit()` utilities
  - Context assembly time < 100ms for up to 20 chunks

- PDF progress tracking via Inngest event-driven pipeline:
  - Typed Inngest events for all 6 pipeline steps: `pdf/{step}/started`, `pdf/{step}/completed`, `pdf/{step}/failed`
  - Step lifecycle events: `uploaded`, `extract`, `ocr`, `chunk`, `embed`, `index`
  - `PIPELINE_STEPS` constant, `PipelineStep` union type, `STEP_WEIGHTS` mapping (upload: 5%, extract: 25%, ocr: 20%, chunk: 15%, embed: 25%, index: 10%)
  - `calculateProgress()` with weighted percentage, `buildStepMetric()`, `upsertStepMetric()` (idempotent), `allStepsCompleted()`
  - `createProgressTracker()` Inngest function listening on `pdf/*` events
  - Rate-limited MongoDB updates (10/sec per document) with `$set` operations
  - Terminal event emission: `pdf/processing-completed` on all-steps-success, `pdf/processing-failed` on retry-exhausted failure
  - `IStepMetric` interface and schema on Document model (`currentStep`, `stepsCompleted`, `stepMetrics`, `processingStartedAt`, `processingCompletedAt`, `error`, `progress`)
  - Events: `PdfStepStartedEvent`, `PdfStepCompletedEvent`, `PdfStepFailedEvent`, `PdfProcessingCompletedEvent`, `PdfProcessingFailedEvent`, `PdfProgressEvent` union

- OCR integration for scanned PDFs:
  - `renderPageToPng()` via sharp (with PDF page + density support), 30s timeout per page
  - `recognizeImage()` via tesseract.js with safe type extraction from Tesseract's `Record<string, unknown>` response
  - `runOcr()` entry point processing up to 2 pages concurrently for performance
  - OCR fallback in `extractText()` when pdfjs-dist yields <10 chars/page average
  - `@repo/rag` now depends on `sharp ^0.33.0` and `tesseract.js ^5.0.0`
  - OCR types: `OcrWord`, `OcrLine`, `OcrBlock`, `OcrPage`, `OcrResult`, `OcrOptions`

- PDF chunking strategy with three strategies:
  - `recursive` — hierarchical splitting by `\n\n` → `\n` → sentence → word, configurable overlap
  - `semantic` — topic-boundary splitting via heading analysis with confidence scoring
  - `pdf` — PDF-aware section splitting using font metadata for block grouping, orphaned heading merging
  - Heading detection via font size ratio analysis (H1: >225% body, H2: >150% body)
  - Section hierarchy path tracking (e.g., `["1. Introduction", "2. Architecture"]`)
  - Configurable chunk size (256-4096 tokens, default 1024) and overlap (0-25%, default 128)
  - Strategy auto-selection: `pdf` for docs >5k chars with font variation, `recursive` fallback
  - Token estimation via char_count/4 heuristic
  - Chunk events: `pdf/chunk/started`, `pdf/chunk/completed`, `pdf/chunk/failed`

- PDF text extraction service using pdfjs-dist (pure Node.js, Vercel-compatible)
  - `packages/rag/src/pdf/extractor.ts` — main `extractText()` function
  - `packages/rag/src/pdf/extractor/pdfjs.ts` — pdfjs-dist `getTextContent()` integration with safe type extraction layer, text grouping into lines/blocks with positional metadata
  - `packages/rag/src/pdf/extractor/utils.ts` — text density, language detection, reading order, confidence scoring
  - `packages/rag/src/pdf/events.ts` — `pdf/extract/started`, `pdf/extract/completed`, `pdf/extract/failed` event types
  - Scanned document detection: <10 non-whitespace chars per page average → flagged for OCR
  - Language detection via Unicode range heuristics (CJK, Cyrillic, Arabic, Devanagari, Latin)
  - Blocks sorted in reading order (top-to-bottom, left-to-right within same line height)
  - Extraction metadata persisted: charCount, pageCount, extractionMethod, confidenceScore, language
  - Document model extended with `processedContent` (text + positional page data) and `extractionMetadata` sub-schemas

- PDF upload flow with Inngest trigger (`POST /api/documents/pdf/upload`)
  - PDF magic-byte validation (`%PDF` at offset 0), 50MB size limit, 413 for oversized
  - SHA-256 file hash deduplication scoped to workspace
  - R2 storage at `{workspaceId}/pdfs/{documentId}.pdf`
  - Document record created with `uploading` status, `fileHash` field
  - `pdf/uploaded` Inngest event emitted with document metadata
  - Optional `password` field for password-protected PDFs
  - Compensating transaction: R2 cleanup on failure

- `packages/rag/src/pdf/types.ts` — PDF event payload types (`PdfUploadedEventPayload`, `PdfUploadedEvent`)
- `packages/validation/src/schemas/document.ts` — `pdfUploadResponseSchema` for endpoint response

- Phase 05 (Storage) verification and completion
  - 25/25 automated tests pass for `@repo/storage`
  - Lint clean: storage, web, database, validation
  - Typecheck clean: all apps
  - Build succeeds: all 4 apps

- Upload UI components for file selection, progress tracking, and type-aware preview
  - `useFileUpload` hook (concurrency control, per-file XHR progress, retry/cancel)
  - `FileIcon` component (25+ extension mappings with lucide-react icons)
  - `FilePreview` component (image thumbnail with error fallback, file icon placeholder)
  - `FileUpload` component (drag-and-drop zone, keyboard accessible, file list with progress bars, Upload/Cancel/Retry/Clear actions)
  - All components pass `pnpm lint` and `pnpm typecheck` cleanly

- Upload API routes for file upload, download, delete, metadata, and storage usage
  - `POST /api/files/upload` — multipart upload with magic-bytes type validation and workspace tier size limits
  - `GET /api/files/[fileId]` — signed download URL redirect (302)
  - `DELETE /api/files/[fileId]` — delete from R2 + soft-delete Document
  - `GET /api/files/[fileId]/metadata` — file metadata (status, tags, dates)
  - `GET /api/files/storage` — aggregated storage usage with Mongoose $sum
  - `apps/web/src/actions/files/upload.ts` — Server Action `uploadFilesAction`
  - `apps/web/src/lib/file-upload.ts` — Client helpers with XHR progress tracking
  - All routes authenticated via middleware headers
  - `@repo/storage` added as workspace dependency

- `@repo/storage` tenant-isolated storage path functions (`generateStorageKey`, `parseStorageKey`, `listWorkspaceFiles`)
  - `packages/storage/src/paths.ts` — key generation with filename sanitization, regex-based key parsing, S3 ListObjectsV2 scoped to workspace prefix
  - `STORAGE_ENTITIES` const + `StorageEntity` / `ParsedStorageKey` types exported from barrel
  - 25 existing tests pass, lint/typecheck clean

- `@repo/storage` size limits and usage tracker (`getTierLimits`, `validateFileSize`, `validateTotalStorage`, `createUsageTracker`)
  - `packages/storage/src/validation/size-limits.ts` — tier limits (Free 10MB/1GB, Pro 50MB/50GB, Enterprise 500MB/1TB) and validation functions
  - `packages/storage/src/usage-tracker.ts` — abstract `UsageStore` interface with `createUsageTracker` factory; supports pluggable persistence backends

- `@repo/storage` magic-byte file type validation (`validateFileType`, `getAllowedTypesForEntity`)
  - `packages/storage/src/validation/magic-bytes.ts` — 11 file type signatures with magic byte/content inspection
  - `packages/storage/src/validation/file-type.ts` — validation function and entity-scoped type mapping
  - `packages/validation/src/schemas/storage.ts` — Zod schemas for file type, size, and upload options

- `@repo/storage` signed URL generation (`generateDownloadUrl`, `generateUploadUrl`, `getPublicUrl`)
  - `generateDownloadUrl` — presigned GET URL via AWS Signature V4, default 1-hour expiry
  - `generateUploadUrl` — presigned PUT URL for direct-to-R2 uploads
  - `getPublicUrl` — constructs public URL from configured base + object key
  - Uses `@aws-sdk/s3-request-presigner` (already a dependency)

- `@repo/storage` upload service (`uploadFile`, `uploadFiles`, `deleteFile`, `getFile`)
  - File type validation (allowed MIME types) and file size validation (10MB default, configurable)
  - Storage key generation: `{workspaceId}/{entity}/{date}/{uuid}-{filename}`
  - Document record creation in MongoDB via `DocumentRepository`
  - Compensating transaction: R2 file cleanup on Document creation failure
  - Batch upload with configurable concurrency (default 3)
  - Download URL generation via `getPublicUrl()`
  - 12 new unit tests (25 total), all passing

- `@repo/storage` package with Cloudflare R2 client and storage service
  - R2 S3 client factory (`createR2Client`) with singleton client, config from `@repo/config`
  - Storage service (`createStorageService`) with 6 operations: upload, download, delete, list, exists, getMetadata
  - All operations use AWS SDK v3 commands (PutObject, GetObject, DeleteObject, ListObjectsV2, HeadObject)
  - Mocked S3 client in tests — 13 unit tests passing
  - `@aws-sdk/client-s3` and `@aws-sdk/s3-request-presigner` dependencies

- Workspace CRUD API with Zod validation and RBAC enforcement
- Create workspace flow with dialog, slug uniqueness check, avatar upload
- Workspace settings page (name, slug, description, feature flags, archive/restore)
- Member management with role assignment, removal, last-owner guard
- Invitation system: email invite with accept/decline, 20/day rate limit, 7-day expiry
- Workspace switcher dropdown with Zustand persistence and React Query
- Workspace settings sub-navigation for General/Members tabs
- React Query provider for client-side data fetching

### Fixed

- Installed missing `mongodb-memory-server` devDependency in `@repo/database` (resolves pre-existing typecheck error)

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
