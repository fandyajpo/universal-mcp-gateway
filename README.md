# Universal MCP Gateway

The enterprise-grade AI Workspace Platform for modern organizations.

---

## Vision

The Universal MCP Gateway was built on a single conviction: every knowledge worker deserves access to AI tooling that matches the sophistication of their domain. For too long, enterprises have been locked into monolithic AI platforms that dictate workflow, limit model choice, and silo data. We envision a world where organizations compose their own AI infrastructure from interchangeable, standards-based building blocks -- connecting any model, any knowledge source, and any tool into a unified workspace that adapts to how teams actually work. This platform is our bet that open protocols, composable architecture, and developer-led adoption will define the next generation of enterprise AI.

---

## Product Overview

The Universal MCP Gateway is a multi-tenant SaaS platform that combines a collaborative AI workspace with a programmable gateway layer built on the Model Context Protocol (MCP). The platform is composed of the following capabilities:

**AI Workspace** -- A browser-based environment where teams interact with AI models, share conversations, and manage knowledge. Supports real-time collaboration, thread-based chat, and inline content editing.

**AI Gateway** -- A centralized routing layer that mediates requests between the workspace and upstream model providers. Handles rate limiting, fallback, retry logic, token budgeting, and usage tracking across multiple AI providers.

**MCP Gateway** -- A server-side implementation of the Model Context Protocol that exposes internal tools, data sources, and knowledge bases as standardized MCP resources. Enables seamless integration with any MCP-compatible client.

**RAG Engine** -- A retrieval-augmented generation pipeline that combines vector search with structured data retrieval. Supports hybrid search, multi-query fusion, re-ranking, and context window optimization.

**Knowledge Base** -- A managed repository for organizational knowledge that supports document upload, web crawling, API ingestion, and manual entry. Documents are chunked, embedded, and indexed for semantic search.

**PDF Ingestion Pipeline** -- A specialized ingestion path for PDF documents that extracts text, tables, and metadata using hybrid extraction strategies. Handles scanned documents, complex layouts, and large files.

**Connector Marketplace** -- A registry of pre-built integrations with third-party services (Slack, Notion, Google Drive, Confluence, Jira, GitHub, and more). Each connector is packaged as an MCP server that translates external APIs into discoverable tools and resources.

**AI Agents** -- Composable, goal-driven agents that orchestrate multiple MCP tools, knowledge sources, and model calls to execute complex multi-step tasks. Agents are defined as state machines with configurable planning, observation, and execution loops.

**Team Collaboration** -- Real-time collaboration features including shared workspaces, conversation threads, comments, mentions, and presence indicators. Built on a WebSocket-based sync layer with operational transform for conflict-free editing.

**Multi-Workspace** -- Organizations can create multiple isolated workspaces for different teams, projects, or clients. Each workspace has its own knowledge base, connectors, agent configurations, and member roster.

**Enterprise SaaS** -- Multi-tenant architecture with role-based access control, audit logging, SSO/SAML, usage-based billing, and dedicated support SLAs. Deployed as a managed cloud service with regional data residency options.

---

## Tech Stack

### Monorepo & Tooling
| Category | Technology |
|---|---|
| Package Manager | pnpm 10 |
| Build System | TurboRepo |
| Language | TypeScript (strict mode) |
| Formatting | Prettier |
| Linting | ESLint with typescript-eslint |

### Frontend
| Category | Technology |
|---|---|
| Framework | Next.js 15 (App Router) |
| UI Runtime | React 19 |
| Styling | TailwindCSS |
| Component Library | shadcn/ui |
| Tables | TanStack Table |
| Virtualization | TanStack Virtual |
| Keyboard Shortcuts | TanStack HotKeys |
| State Management | Zustand, TanStack Query, nuqs |
| Forms | React Hook Form + Zod |
| Charts | Recharts |
| Markdown Rendering | react-markdown + Shiki |

### Backend & Infrastructure
| Category | Technology |
|---|---|
| Authentication | Better Auth |
| Primary Database | MongoDB Atlas |
| Vector Search | MongoDB Atlas Vector Search |
| Object Storage | Cloudflare R2 |
| AI Routing | OpenRouter |
| Task Queue | Inngest |
| Cache | Upstash Redis |
| Logging | Pino |
| Error Monitoring | Sentry |

---

## Architecture Summary

The platform follows a layered architecture with clear separation of concerns. At the infrastructure layer, MongoDB Atlas serves as the primary data store for both operational data (workspaces, users, conversations) and vector embeddings for semantic search. Cloudflare R2 provides durable object storage for documents, images, and exported artifacts, while Upstash Redis handles session caching, rate limit counters, and real-time presence data. Inngest orchestrates background jobs -- PDF ingestion, embedding generation, connector sync, and notification delivery -- with retry and observability built in.

The application layer is split between the Next.js frontend applications and the shared backend packages. The `web` app serves as the main workspace interface, while the `admin` app provides organization-level management. All business logic lives in the `packages/` directory, ensuring that the AI Gateway, MCP Gateway, RAG Engine, and authentication logic are framework-agnostic and independently testable. The MCP Gateway package implements the full Model Context Protocol specification, exposing registered tools and resources over both SSE and streaming HTTP transports.

On the AI side, the gateway layer abstracts model selection behind a unified interface. Requests flow from the workspace through the AI Gateway, which applies policies (model allowlists, token limits, cost controls) before routing to OpenRouter. The RAG Engine intercepts queries that require grounding, performing hybrid search across vector embeddings and full-text indexes, then injecting retrieved context into the model prompt. Agents extend this further by breaking complex tasks into sub-steps, invoking MCP tools as needed, and synthesizing results into coherent responses.

```
                    ┌──────────────┐
                    │   Clients    │
                    │ (Web, MCP)   │
                    └──────┬───────┘
                           │
              ┌────────────┴────────────┐
              │      AI Gateway         │
              │  (routing, policies)    │
              └────────────┬────────────┘
                           │
              ┌────────────┼────────────┐
              │            │            │
         ┌────┴────┐ ┌────┴────┐ ┌────┴────┐
         │  MCP    │ │  RAG    │ │ Agents  │
         │ Gateway │ │ Engine  │ │         │
         └─────────┘ └─────────┘ └─────────┘
              │            │
         ┌────┴────┐ ┌────┴────────────┐
         │Connectors│ │  Vector Store   │
         │(Slack,  │ │  + Knowledge    │
         │ Notion..)│ │     Base        │
         └─────────┘ └─────────────────┘
```

---

## Monorepo Structure

```
universal-mcp-gateway/
├── apps/
│   ├── web/            Main workspace application (Next.js 15)
│   ├── admin/          Organization admin dashboard (Next.js 15)
│   ├── docs/           Documentation site (Next.js 15)
│   └── landing/        Marketing landing page (Next.js 15)
│
├── packages/
│   ├── ai/             AI Gateway client and model routing
│   ├── auth/           Authentication and authorization (Better Auth)
│   ├── cache/          Distributed caching layer (Upstash Redis)
│   ├── config/         Shared configuration and environment schema
│   ├── connector-sdk/  SDK for building custom connectors
│   ├── connectors/     Built-in connector implementations
│   ├── crypto/         Encryption and hashing utilities
│   ├── database/       Database access layer (MongoDB via Mongoose)
│   ├── logger/         Structured logging (Pino with OpenTelemetry)
│   ├── mcp/            MCP Gateway protocol implementation
│   ├── rag/            RAG Engine and vector search pipeline
│   ├── types/          Shared TypeScript type definitions
│   ├── ui/             Shared UI components (shadcn/ui primitives)
│   ├── utils/          General-purpose utility functions
│   └── validation/     Zod schemas and request validation
│
├── scripts/            Build, migration, and maintenance scripts
├── docs/               Architecture decision records and design docs
│
├── turbo.json          TurboRepo pipeline configuration
├── pnpm-workspace.yaml Workspace definition
├── tsconfig.base.json  Shared TypeScript configuration
├── .env.example        Environment variable reference
├── CONTRIBUTING.md     Contribution guidelines
├── SECURITY.md         Security policy and disclosure
└── LICENSE             MIT license
```

---

## Installation

### Prerequisites

- **Node.js** 20.x or later
- **pnpm** 10.x (`npm install -g pnpm@10`)
- **MongoDB Atlas** cluster (free tier is sufficient for development)
- **Upstash Redis** database (free tier)
- **Cloudflare R2** bucket
- **OpenRouter** API key

### Setup

```bash
# 1. Clone the repository
git clone https://github.com/your-org/universal-mcp-gateway.git
cd universal-mcp-gateway

# 2. Install dependencies
pnpm install

# 3. Copy environment variables and configure
cp .env.example .env.local
# Edit .env.local with your credentials (see Environment Variables section)

# 4. Build all packages
pnpm build

# 5. Start the development server
pnpm dev
```

The workspace application is available at `http://localhost:3000` and the admin dashboard at `http://localhost:3001`.

---

## Development

### Commands

```bash
pnpm dev          # Start all applications in development mode
pnpm build        # Build all packages and applications
pnpm lint         # Run ESLint across the entire monorepo
pnpm typecheck    # Run TypeScript type checking
pnpm test         # Run all tests
pnpm clean        # Remove build artifacts and node_modules
```

### Starting Specific Applications

Use `--filter` to start only the apps you need:

```bash
pnpm dev --filter @repo/web        # Main workspace app (port 3000)
pnpm dev --filter @repo/admin      # Admin dashboard (port 3001)
pnpm dev --filter @repo/docs       # Documentation site (port 3002)
pnpm dev --filter @repo/landing    # Landing page (port 3003)
```

Start multiple specific apps:

```bash
pnpm dev --filter @repo/web --filter @repo/admin
```

Start a specific app with its dependencies:

```bash
pnpm dev --filter @repo/web...
```

### Code Quality

- **TypeScript strict mode** is enforced across all packages. The `tsconfig.base.json` enables `strict`, `noUncheckedIndexedAccess`, and `exactOptionalPropertyTypes`.
- **ESLint** with `typescript-eslint` catches common mistakes and enforces consistent code style.
- **Prettier** handles formatting. Configuration is shared via the root `.editorconfig` and `prettier` settings.
- **Testing** uses Vitest for unit and integration tests, Playwright for end-to-end tests, and Testing Library for React component tests. Tests are colocated with source files following the `*.test.ts` convention.
- **Conventional Commits** are required. The commit message format is enforced by a commit hook and CI check.

### Package Conventions

Each package in `packages/` exposes a public API via `src/index.ts`. Internal implementation details are never exported. Packages use the `@repo/<name>` import alias, configured in `tsconfig.base.json`. The `types` package holds shared interfaces used across multiple packages; package-specific types remain in their respective packages.

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `NODE_ENV` | Yes | Runtime environment (`development`, `production`, `test`) |
| `APP_URL` | Yes | Public URL of the application |
| `APP_NAME` | Yes | Application display name |
| `DATABASE_URL` | Yes | MongoDB Atlas connection string |
| `REDIS_URL` | Yes | Upstash Redis connection string |
| `R2_ACCESS_KEY_ID` | Yes | Cloudflare R2 access key |
| `R2_SECRET_ACCESS_KEY` | Yes | Cloudflare R2 secret key |
| `R2_BUCKET_NAME` | Yes | Cloudflare R2 bucket name |
| `R2_ACCOUNT_ID` | Yes | Cloudflare R2 account ID |
| `R2_PUBLIC_URL` | No | Cloudflare R2 public bucket URL |
| `OPENROUTER_API_KEY` | Yes | OpenRouter API key |
| `OPENROUTER_BASE_URL` | No | OpenRouter API base URL |
| `OPENROUTER_REFERRER` | No | Referrer header for OpenRouter requests |
| `BETTER_AUTH_SECRET` | Yes | Secret key for Better Auth token signing |
| `BETTER_AUTH_URL` | Yes | Auth callback URL |
| `SENTRY_DSN` | No | Sentry project DSN for error tracking |
| `SENTRY_ENVIRONMENT` | No | Sentry environment tag |
| `INNGEST_EVENT_KEY` | Yes | Inngest event ingestion key |
| `INNGEST_SIGNING_KEY` | Yes | Inngest webhook signing key |
| `INNGEST_APP_ID` | No | Inngest application identifier |
| `LOG_LEVEL` | No | Pino log level (`trace`, `debug`, `info`, `warn`, `error`, `fatal`) |
| `LOG_PRETTY` | No | Enable pretty-printed console logging in development |

Generate the `BETTER_AUTH_SECRET` with:

```bash
pnpm dlx better-auth@latest generate
```

---

## Scripts

| Script | Description |
|---|---|
| `pnpm dev` | Start all apps in development mode with hot module replacement |
| `pnpm build` | Build all packages and applications for production |
| `pnpm start` | Start production builds |
| `pnpm test` | Run all test suites across the monorepo |
| `pnpm lint` | Run ESLint across all packages and apps |
| `pnpm typecheck` | Run TypeScript type checking across all packages and apps |
| `pnpm clean` | Remove `.next/`, `dist/`, and `node_modules` directories |
| `pnpm format` | Format all files with Prettier |
| `pnpm format:check` | Check formatting without making changes |
| `pnpm audit` | Run security audit on dependencies |
| `pnpm outdated` | List outdated dependencies |

---

## Deployment

The platform is designed for deployment on container orchestration platforms. Each application (`web`, `admin`, `docs`, `landing`) is built as a standalone Next.js application and can be scaled independently.

### Production Build

```bash
pnpm build
```

The build output for each app lives in `apps/<name>/.next/` and can be served with `next start` or exported as a standalone deployment using the Next.js output file tracing feature.

### Infrastructure Requirements

- Node.js runtime (20.x)
- MongoDB Atlas cluster (M10+ recommended for production)
- Upstash Redis (production tier with TLS)
- Cloudflare R2 bucket with public access configured
- Inngest event queue (production workspace)
- Sentry project (for error monitoring)

### CI/CD

The repository includes GitHub Actions workflows for continuous integration. Each push runs linting, type checking, and testing across all packages. Deployment is handled through environment-specific workflows that build, containerize, and deploy to the target infrastructure provider.

---

## Roadmap

See [ROADMAP.md](./ROADMAP.md) for the current roadmap, planned features, and release timeline.

---

## Contributing

We welcome contributions from the community. Please read [CONTRIBUTING.md](./CONTRIBUTING.md) before submitting a pull request.

All contributions are subject to the project's code of conduct and security policies.

---

## License

[MIT](./LICENSE) -- Copyright (c) 2026 Universal MCP Gateway
