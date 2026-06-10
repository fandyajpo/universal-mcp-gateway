# ADR-006: Cloudflare R2

## Status

Accepted

## Context

The platform needs object storage for user-uploaded files (PDFs, images, documents), exported data, and AI-generated artifacts. The solution must be scalable, cost-effective, and globally accessible.

## Decision

Use Cloudflare R2 for object storage.

## Rationale

- **S3-compatible API** — works with existing S3 SDKs and tools, no vendor lock-in
- **No egress fees** — unlike AWS S3, Cloudflare R2 charges zero egress fees, significantly reducing costs for AI-generated content delivery
- **Global edge network** — Cloudflare's network provides fast content delivery worldwide
- **Presigned URLs** — supports time-limited, signed URLs for secure uploads and downloads
- **Automatic S3 migration** — can migrate existing S3 data without application changes
- **Cheap storage** — $0.015/GB/month with no minimum retention
- **Integration with Cloudflare ecosystem** — Workers, KV, D1, and image optimization services available for future use
- **Server-side encryption** — supports SSE-C and SSE-S3 for data at rest

## Trade-offs

- No native CDN for non-R2 origins (unlike S3 + CloudFront)
- Less mature than AWS S3 — fewer features (no object lock, no intelligent tiering)
- Limited regions compared to AWS (but growing)
- Performance in regions far from Cloudflare's network may be slower than S3

## Rejected Alternatives

- **AWS S3** — industry standard but egress fees make AI content delivery expensive. When users download generated files or view embedded documents, bandwidth costs accumulate. R2's zero-egress model saves significant costs
- **Google Cloud Storage** — similar to S3 with egress fees, less mature SDK ecosystem
- **Azure Blob Storage** — enterprise-focused, complex pricing tiers, egress fees
- **Local filesystem** — not scalable, not distributed, data loss risk
- **MinIO** — self-hosted S3-compatible storage. Good for on-premise deployments but adds operational overhead. Consider for enterprise self-hosted SKU

## Consequences

- All file operations go through `@repo/storage` (future package) which wraps the S3 SDK
- Presigned URLs are used for client-side uploads to avoid server CPU/Memory bottlenecks
- Files are organized by `tenant/{workspace_id}/{entity_type}/{entity_id}/` prefix
- Public assets are served through R2 public bucket URLs with CDN caching
- Future: Cloudflare Workers can process files at the edge (image resizing, format conversion)
