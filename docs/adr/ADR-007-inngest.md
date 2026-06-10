# ADR-007: Inngest

## Status

Accepted

## Context

The platform requires background job processing for PDF ingestion, document embedding, connector sync, email notifications, and other asynchronous workloads. The solution must support complex workflows with retries, delays, and observability.

## Decision

Use Inngest as the queue and background job processing system.

## Rationale

- **TypeScript-native** — typed function arguments and return values, full type safety end-to-end
- **Declarative workflows** — define steps, retries, and scheduling as code with `inngestMiddleware`
- **Built-in observability** — web dashboard for inspecting runs, logs, failures, and latency
- **Multi-step workflows** — support for fan-out, wait-for-event, sleep, and parallel execution patterns
- **Idempotency** — built-in deduplication and idempotent execution keys
- **Cancellation** — ability to cancel in-progress runs
- **No infrastructure** — managed service, no Redis/queue server to self-host during MVP
- **Step-level error handling** — retry with exponential backoff per step, not per entire function
- **Local development** — `inngest dev` CLI for local testing with the Inngest SDK

## Trade-offs

- Managed service dependency — if Inngest is down, async processing stops
- Cost at scale — per-execution pricing may become expensive at high volume (evaluated: 100k executions/month free, $20/100k after)
- Limited to Node.js/TypeScript — cannot have workers in Python or other languages
- Vendor lock-in — custom workflow DSL that doesn't map directly to other queue systems (BullMQ, Celery)
- No native priority queues — all tasks are processed fairly, no way to prioritize critical jobs

## Rejected Alternatives

- **BullMQ (Redis)** — self-hosted, battle-tested, but requires managing Redis infrastructure. More control but more operational overhead. Consider for enterprise self-hosted SKU
- **Bull + Redis** — predecessor to BullMQ, less feature-rich, still requires Redis management
- **AWS SQS** — simple queue but no built-in workflow orchestration, retry policies, or observability
- **Temporal** — enterprise-grade workflow engine but heavy, complex, and requires self-hosting a Temporal Server
- **Trigger.dev** — similar to Inngest but newer, smaller ecosystem, and TypeScript-only
- **RabbitMQ** — robust message broker but requires custom workflow orchestration code
- **Zeebe (Camunda)** — BPMN-based workflow engine, overly complex for this use case
- **Direct async in Next.js** — `fetch` + `waitUntil` pattern works for simple cases but breaks down with retries, complex workflows, and observability

## Consequences

- `@repo/queue` (future package) wraps Inngest function definitions and client setup
- All async processing (PDF ingestion, embedding, connector sync, notifications) uses Inngest functions
- The Inngest dashboard is the primary observability tool for background jobs
- Future migration to BullMQ for self-hosted deployments is possible by implementing the same job interfaces
