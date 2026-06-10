# Phase 14: Billing

> Build the billing and subscription system with Stripe integration, metered usage tracking, invoicing, and a customer-facing billing portal.

---

## Objective

Implement a complete billing system that handles subscription lifecycle management (create, upgrade, downgrade, cancel), metered billing for AI token consumption, automated invoicing, payment processing via Stripe, and a self-service billing portal UI. This phase transforms the platform from free-only to revenue-generating with tiered pricing.

## Scope

| Area | Coverage |
|------|----------|
| Pricing Schema | Plan tiers, feature mapping, price definitions, limits configuration |
| Stripe Integration | Products, prices, customer portal, webhook event handling |
| Subscription Management | Create, upgrade, downgrade, cancel, reactivate, trial management |
| Usage Tracking | AI token counting, storage usage, API call counting, metering events |
| Metered Billing | Per-unit pricing for AI tokens, overage calculations, invoice line items |
| Invoicing | Automated monthly invoice generation, invoice PDFs, payment reconciliation |
| Payment Webhooks | Stripe event processing, idempotency, event replay |
| Billing Portal UI | Current plan display, usage statistics, invoice history, payment methods |
| Verification | End-to-end billing flow testing with Stripe test mode |

## Dependencies

| Step ID | Dependency | Purpose |
|---------|------------|---------|
| 14.01 | 00.05 (Validation) | Pricing and subscription Zod schemas |
| 14.02 | 14.01 | Stripe client setup depends on validated price schemas |
| 14.03 | 14.02 | Subscription operations require Stripe integration |
| 14.04 | 14.03, 09.06 | Usage tracking needs subscription context and AI cost data |
| 14.05 | 14.04 | Metered billing builds on tracked usage |
| 14.06 | 14.02 | Invoices generated from Stripe subscription data |
| 14.07 | 14.02 | Webhook handler processes Stripe events |
| 14.08 | 14.03 | Billing portal UI displays subscription and usage data |
| 14.09 | All above | Full integration test suite |

## Expected Outputs

1. Pricing schema with plan tier definitions and Stripe product/price synchronization
2. Stripe SDK integration with webhook verification and idempotent event processing
3. Subscription management service with lifecycle hooks
4. Usage tracking service for AI tokens, storage, and API calls
5. Metered billing engine with tiered pricing and overage calculations
6. Invoice generation and PDF delivery
7. Stripe webhook handler with event replay capability
8. Billing portal UI showing plan, usage, invoices, and payment methods
9. Verification suite with Stripe test mode

## Architecture Constraints

- All Stripe API calls must go through an abstraction layer (`@repo/billing`) — never call Stripe SDK directly from app code
- Stripe webhook events must be idempotent: processing the same event twice must produce the same result
- Subscription changes must be atomic — if Stripe succeeds but database update fails, reconcile on next webhook
- Usage metering must be eventually consistent — latencies up to 5 minutes are acceptable for billing calculations
- Invoice data must be read-only after generation (immutable)
- Payment method changes must be processed through Stripe's Elements or Stripe Checkout — never send raw card data to the server
- Trial periods must be tracked independently of Stripe for grace period management

## Completion Criteria

- All 9 steps are verified with passing tests
- Pricing tiers are configurable through Stripe dashboard
- Subscriptions can be created, upgraded, downgraded, and canceled
- AI token usage is tracked per workspace and billed correctly
- Monthly invoices are generated automatically
- Stripe webhooks are processed reliably with idempotency
- Billing portal displays accurate plan, usage, and invoice data
- TypeScript strict mode passes with no errors
- Lint passes with no errors
- Build succeeds for both admin and web apps

---

## Steps

| # | Step | Depends On | Est. Time | Priority |
|---|------|------------|-----------|----------|
| 14.01 | Pricing schema and validation | 00.05 | 4h | Critical |
| 14.02 | Stripe integration | 14.01 | 8h | Critical |
| 14.03 | Subscription management | 14.02 | 8h | Critical |
| 14.04 | Usage tracking | 14.03, 09.06 | 6h | High |
| 14.05 | Metered billing (AI tokens) | 14.04 | 6h | High |
| 14.06 | Invoicing | 14.02 | 6h | High |
| 14.07 | Payment webhooks | 14.02 | 6h | Critical |
| 14.08 | Billing portal UI | 14.03 | 8h | High |
| 14.09 | Verification | All above | 4h | Critical |
