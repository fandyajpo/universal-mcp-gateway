# Phase 15: Marketplace

> Build the connector and extension marketplace where developers can publish, discover, install, and monetize integrations.

---

## Objective

Create a fully functional marketplace that allows third-party developers to publish connectors and tools through a standardized listing and review process, and allows users to discover, install, rate, and manage these integrations. The marketplace includes version management, revenue sharing, and usage analytics.

## Scope

| Area | Coverage |
|------|----------|
| Listing Schema | Connector metadata, screenshots, pricing, category, author info |
| Publishing Flow | Developer onboarding, submission, review, approval workflow |
| Version Management | Semantic versioning, changelog, compatibility matrix, rollback |
| Reviews/Ratings | Star ratings, written reviews, moderation, helpfulness voting |
| Installation Metrics | Install count, active users, API call volume, error rates |
| Revenue Sharing | Payout calculations, seller dashboard, payment disbursement |
| Marketplace API | Programmatic discovery, installation, update notifications |
| Marketplace UI | Browse, search, detail view, install button, developer dashboard |
| Verification | End-to-end test of publisher and consumer flows |

## Dependencies

| Step ID | Dependency | Purpose |
|---------|------------|---------|
| 15.01 | 00.05 (Validation) | Marketplace listing Zod schemas |
| 15.02 | 15.01, 11.13 | Publishing flow uses connector registry |
| 15.03 | 15.01 | Version management builds on listing schema |
| 15.04 | 15.01 | Reviews schema depends on listing schema |
| 15.05 | 15.02 | Installation metrics collected from publishing flow |
| 15.06 | 15.05, 14.04 | Revenue sharing uses installation metrics and billing system |
| 15.07 | 15.02 | Marketplace API exposes listing and installation data |
| 15.08 | 15.07 | Marketplace UI consumes the marketplace API |
| 15.09 | All above | Full integration test suite |

## Expected Outputs

1. Marketplace listing schema with metadata, categorization, and pricing support
2. Connector publishing flow with submission, review, and approval stages
3. Version management with semantic versioning and changelog tracking
4. Reviews and ratings system with moderation capabilities
5. Installation metrics dashboard for publishers
6. Revenue sharing model with payout calculations
7. Marketplace API for programmatic access
8. Marketplace UI for browsing, searching, and installing connectors
9. Verification suite for marketplace flows

## Architecture Constraints

- Marketplace listings are stored in MongoDB with full-text search indexes
- Connector installation creates a workspace-specific configuration record
- Version manifests are immutable after publication
- Revenue sharing calculations are processed monthly via Inngest cron
- Marketplace API must support cursor-based pagination for large result sets
- Review moderation queue requires admin review before public visibility
- All marketplace actions (install, uninstall, review, rate) must be audited

## Completion Criteria

- All 9 steps are verified with passing tests
- Developers can publish connectors through the marketplace
- Users can discover, browse, and install connectors
- Version management supports updates and rollbacks
- Reviews and ratings provide community feedback
- Publishers can see installation metrics
- Revenue sharing calculations are accurate
- Marketplace API supports programmatic access
- TypeScript strict mode passes with no errors
- Lint passes with no errors
- Build succeeds for web and admin apps

---

## Steps

| # | Step | Depends On | Est. Time | Priority |
|---|------|------------|-----------|----------|
| 15.01 | Marketplace listing schema | 00.05 | 4h | Critical |
| 15.02 | Listing/publishing flow | 15.01, 11.13 | 8h | Critical |
| 15.03 | Version management | 15.01 | 6h | High |
| 15.04 | Reviews/ratings | 15.01 | 6h | Medium |
| 15.05 | Installation metrics | 15.02 | 4h | Medium |
| 15.06 | Revenue sharing | 15.05, 14.04 | 6h | Low |
| 15.07 | Marketplace API | 15.02 | 6h | High |
| 15.08 | Marketplace UI | 15.07 | 8h | High |
| 15.09 | Verification | All above | 4h | Critical |
