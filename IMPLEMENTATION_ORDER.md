# Implementation Order

> Definitive build order for the Universal MCP Gateway. Every step depends only on prior completed steps. Follow this order exactly.

---

## Phase 00: Foundation (Complete)
| # | Step | Depends On |
|---|---|---|
| 00.01 | Repository setup | — |
| 00.02 | Core types package | 00.01 |
| 00.03 | Logger package | 00.02 |
| 00.04 | Config package | 00.02 |
| 00.05 | Validation package | 00.02 |
| 00.06 | Utils package | 00.02 |
| 00.07 | Crypto package | 00.02 |
| 00.08 | Database connection & BaseRepository | 00.02, 00.03 |
| 00.09 | Database repositories (User, Workspace, Session, ApiKey, AuditLog, Document) | 00.08 |
| 00.10 | Cache package | 00.02, 00.03 |
| 00.11 | UI package (shadcn/ui setup + core components) | 00.02 |
| 00.12 | ESLint + Prettier configuration | 00.01 |
| 00.13 | CI/CD workflows | 00.01 |
| 00.14 | Sentry integration | 00.01 |
| 00.15 | Verification suite | All above |

## Phase 01: Bootstrap
| # | Step | Depends On |
|---|---|---|
| 01.01 | Next.js app scaffold (web) | 00.02, 00.11 |
| 01.02 | Next.js app scaffold (admin) | 00.02, 00.11 |
| 01.03 | Next.js app scaffold (docs) | 00.02, 00.11 |
| 01.04 | Next.js app scaffold (landing) | 00.02, 00.11 |
| 01.05 | TailwindCSS theme configuration | 01.01 |
| 01.06 | shadcn/ui component registration | 01.01, 00.11 |
| 01.07 | App layout, navigation, and shell | 01.01 |
| 01.08 | Admin layout and navigation | 01.02 |
| 01.09 | Docs layout and navigation | 01.03 |
| 01.10 | Landing page sections | 01.04 |
| 01.11 | react-markdown + Shiki integration | 01.03 |
| 01.12 | Verification | All above |

## Phase 02: Authentication
| # | Step | Depends On |
|---|---|---|
| 02.01 | Better Auth server setup | 00.08, 00.03 |
| 02.02 | Auth schema and validation | 00.05 |
| 02.03 | Email/password auth | 02.01, 02.02 |
| 02.04 | OAuth providers (Google, GitHub) | 02.01 |
| 02.05 | Session management | 02.01 |
| 02.06 | RBAC framework | 00.02, 02.01 |
| 02.07 | Auth middleware | 02.01, 02.06 |
| 02.08 | Login page | 02.03, 01.01 |
| 02.09 | Register page | 02.03, 01.01 |
| 02.10 | Password reset flow | 02.03 |
| 02.11 | MFA setup | 02.01 |
| 02.12 | Auth verification | All above |

## Phase 03: Workspace
| # | Step | Depends On |
|---|---|---|
| 03.01 | Workspace schema and validation | 00.05 |
| 03.02 | Workspace repository | 00.09 |
| 03.03 | Workspace service | 03.02, 02.06 |
| 03.04 | Workspace API routes | 03.03 |
| 03.05 | Create workspace flow | 03.04, 01.01 |
| 03.06 | Workspace settings page | 03.04, 01.01 |
| 03.07 | Member management | 03.04, 02.06 |
| 03.08 | Invitation system | 03.07 |
| 03.09 | Workspace switcher UI | 03.04, 01.01 |
| 03.10 | Verification | All above |

## Phase 04: Database
| # | Step | Depends On |
|---|---|---|
| 04.01 | Index strategy implementation | 00.08 |
| 04.02 | Query optimization and profiling | 04.01 |
| 04.03 | Connection pooling configuration | 00.08 |
| 04.04 | Migration strategy and tooling | 00.08 |
| 04.05 | Seed scripts | 04.04 |
| 04.06 | Verification | All above |

## Phase 05: Storage
| # | Step | Depends On |
|---|---|---|
| 05.01 | R2 client setup | 00.02, 00.03 |
| 05.02 | File upload service | 05.01 |
| 05.03 | Signed URL generation | 05.01 |
| 05.04 | File type validation | 00.05 |
| 05.05 | Size limits and enforcement | 05.04 |
| 05.06 | Tenant-isolated storage paths | 05.01 |
| 05.07 | Upload API routes | 05.02, 05.05 |
| 05.08 | Upload UI component | 05.07, 01.01 |
| 05.09 | Verification | All above |

## Phase 06: PDF Processing
| # | Step | Depends On |
|---|---|---|
| 06.01 | PDF upload flow (Inngest trigger) | 05.07, 00.12 |
| 06.02 | Text extraction service | 06.01 |
| 06.03 | OCR integration | 06.02 |
| 06.04 | Chunking strategy | 06.02 |
| 06.05 | Metadata extraction | 06.02 |
| 06.06 | Table extraction | 06.02 |
| 06.07 | Progress tracking (Inngest) | 06.01 |
| 06.08 | PDF processing UI | 06.01, 01.01 |
| 06.09 | Verification | All above |

## Phase 07: Embedding
| # | Step | Depends On |
|---|---|---|
| 07.01 | Embedding service (OpenRouter) | 00.06, 00.10 |
| 07.02 | Batch processing pipeline | 07.01, 06.04 |
| 07.03 | Rate limit handling | 07.01 |
| 07.04 | Embedding cache | 07.01, 00.10 |
| 07.05 | Cost tracking | 07.01 |
| 07.06 | Embedding validation | 07.01 |
| 07.07 | Verification | All above |

## Phase 08: RAG Engine
| # | Step | Depends On |
|---|---|---|
| 08.01 | MongoDB Atlas Vector Search index | 04.01 |
| 08.02 | Vector store service | 08.01, 07.01 |
| 08.03 | Retriever service | 08.02 |
| 08.04 | Hybrid search (vector + keyword) | 08.03 |
| 08.05 | Re-ranker service | 08.03 |
| 08.06 | Context window builder | 08.05 |
| 08.07 | RAG Engine composition | 08.06 |
| 08.08 | RAG API routes | 08.07 |
| 08.09 | Retrieval evaluation | 08.07 |
| 08.10 | Verification | All above |

## Phase 09: AI Gateway
| # | Step | Depends On |
|---|---|---|
| 09.01 | OpenRouter client | 00.06, 00.03 |
| 09.02 | Provider abstraction layer | 09.01 |
| 09.03 | Model router | 09.02 |
| 09.04 | Streaming support | 09.02 |
| 09.05 | Fallback logic | 09.03 |
| 09.06 | Cost tracker | 09.01 |
| 09.07 | Rate limiter | 09.01, 00.10 |
| 09.08 | Prompt template system | 09.01 |
| 09.09 | AI Gateway API routes | 09.04, 09.06 |
| 09.10 | Verification | All above |

## Phase 10: MCP Gateway
| # | Step | Depends On |
|---|---|---|
| 10.01 | MCP protocol handler | 00.02, 00.03 |
| 10.02 | Tool registry | 10.01 |
| 10.03 | Tool validation | 10.02, 00.05 |
| 10.04 | Execution sandbox | 10.02 |
| 10.05 | Streaming tool responses | 10.04 |
| 10.06 | Tool versioning | 10.02 |
| 10.07 | Error handling | 10.04 |
| 10.08 | Tool discovery API | 10.02 |
| 10.09 | MCP Gateway API routes | 10.05, 10.06 |
| 10.10 | Verification | All above |

## Phase 11: Connector SDK
| # | Step | Depends On |
|---|---|---|
| 11.01 | Connector interface | 10.02, 00.02 |
| 11.02 | Connector base class | 11.01 |
| 11.03 | OAuth helper | 11.01 |
| 11.04 | Webhook handler | 11.01 |
| 11.05 | Sync engine | 11.01 |
| 11.06 | Slack connector | 11.02 |
| 11.07 | Notion connector | 11.02 |
| 11.08 | GitHub connector | 11.02 |
| 11.09 | Linear connector | 11.02 |
| 11.10 | Jira connector | 11.02 |
| 11.11 | Confluence connector | 11.02 |
| 11.12 | Google Drive connector | 11.02 |
| 11.13 | Connector registry | 11.02 |
| 11.14 | Connector installation API | 11.13 |
| 11.15 | Verification | All above |

## Phase 12: Chat
| # | Step | Depends On |
|---|---|---|
| 12.01 | Chat thread schema and validation | 00.05 |
| 12.02 | Chat thread repository | 00.09 |
| 12.03 | Chat service | 12.02, 08.07, 09.09, 10.09 |
| 12.04 | Streaming chat API | 12.03, 09.04 |
| 12.05 | Chat UI (thread list) | 12.04, 01.01 |
| 12.06 | Chat UI (message area) | 12.04 |
| 12.07 | Message composition (input, attachments) | 12.04 |
| 12.08 | MCP tool integration in chat | 12.04, 10.09 |
| 12.09 | Citations display | 12.04, 08.07 |
| 12.10 | Multi-turn conversation context | 12.04 |
| 12.11 | Chat history | 12.04 |
| 12.12 | Verification | All above |

## Phase 13: Admin
| # | Step | Depends On |
|---|---|---|
| 13.01 | Admin auth guard | 02.07 |
| 13.02 | User management page | 13.01, 00.09 |
| 13.03 | Workspace management page | 13.01, 03.02 |
| 13.04 | Billing overview page | 13.01, 14.03 |
| 13.05 | Audit log viewer | 13.01, 00.09 |
| 13.06 | System health dashboard | 13.01 |
| 13.07 | Feature flags UI | 13.01 |
| 13.08 | Announcements system | 13.01 |
| 13.09 | Verification | All above |

## Phase 14: Billing
| # | Step | Depends On |
|---|---|---|
| 14.01 | Pricing schema and validation | 00.05 |
| 14.02 | Stripe integration | 14.01 |
| 14.03 | Subscription management | 14.02 |
| 14.04 | Usage tracking | 14.03, 09.06 |
| 14.05 | Metered billing (AI tokens) | 14.04 |
| 14.06 | Invoicing | 14.02 |
| 14.07 | Payment webhooks | 14.02 |
| 14.08 | Billing portal UI | 14.03, 01.01 |
| 14.09 | Verification | All above |

## Phase 15: Marketplace
| # | Step | Depends On |
|---|---|---|
| 15.01 | Marketplace listing schema | 00.05 |
| 15.02 | Listing/publishing flow | 15.01, 11.13 |
| 15.03 | Version management | 15.01 |
| 15.04 | Reviews/ratings | 15.01 |
| 15.05 | Installation metrics | 15.02 |
| 15.06 | Revenue sharing | 15.05, 14.04 |
| 15.07 | Marketplace API | 15.02 |
| 15.08 | Marketplace UI | 15.07, 01.01 |
| 15.09 | Verification | All above |

## Phase 16: Enterprise Features
| # | Step | Depends On |
|---|---|---|
| 16.01 | SSO/SAML integration | 02.01 |
| 16.02 | Directory sync (SCIM) | 16.01 |
| 16.03 | Custom branding | 16.01 |
| 16.04 | Audit trails (extended) | 00.09 |
| 16.05 | Data retention policies | 16.04 |
| 16.06 | Compliance reporting (SOC2, GDPR) | 16.05 |
| 16.07 | SLA monitoring | 13.06 |
| 16.08 | Dedicated infrastructure support | 16.07 |
| 16.09 | Verification | All above |

## Phase 17: Performance Optimization
| # | Step | Depends On |
|---|---|---|
| 17.01 | Bundle analysis and optimization | All above |
| 17.02 | Image optimization | 17.01 |
| 17.03 | CDN strategy | 17.02 |
| 17.04 | Database query optimization | 04.02 |
| 17.05 | N+1 elimination | 17.04 |
| 17.06 | Caching strategy review | 17.05, 00.10 |
| 17.07 | Edge functions | 17.01 |
| 17.08 | Performance testing | 17.07 |
| 17.09 | Verification | All above |

## Phase 18: Scalability
| # | Step | Depends On |
|---|---|---|
| 18.01 | Horizontal scaling review | All above |
| 18.02 | Database sharding strategy | 04.01 |
| 18.03 | Read replica configuration | 04.01 |
| 18.04 | Queue worker autoscaling | 00.12 |
| 18.05 | Global edge deployment | 17.07 |
| 18.06 | Microservice extraction plan | 18.01 |
| 18.07 | Disaster recovery | 18.06 |
| 18.08 | Multi-region support | 18.07 |
| 18.09 | Load testing | 18.08 |
| 18.10 | Verification | All above |

---

## Dependency Graph Summary

```
types ─┬─ logger ─┬─ database ─┬─ auth
       │          │            ├─ cache
       │          │            └─ rag
       │          │
       ├─ validation ────────── all services
       ├─ utils ─────────────── all packages
       ├─ crypto ────────────── auth
       ├─ config ────────────── all apps
       ├─ ui ────────────────── all apps
       └─ mcp ──── connector-sdk ── connectors
```

No circular dependencies. Every phase builds on the output of the previous phase.
