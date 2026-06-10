# ADR-001: Next.js App Router

## Status

Accepted

## Context

The platform requires a modern React framework with server-side rendering, static site generation, and API route support. We evaluated options for building the frontend and API layers.

## Decision

Use Next.js 15 with App Router for all applications (web, admin, docs, landing).

## Rationale

- **React Server Components (RSC)** — enables server-side rendering with zero client JS for static content
- **App Router** — provides nested layouts, loading states, error boundaries as conventions
- **API Routes** — eliminates need for a separate API server during MVP, reducing operational complexity
- **Server Actions** — enables direct database mutations from components without API boilerplate
- **Streaming SSR** — supports progressive rendering for AI streaming responses
- **Middleware** — enables auth checks, redirects, and request manipulation at the edge
- **Large ecosystem** — mature tooling, extensive community, Vercel deployment support
- **TypeScript-first** — first-class TypeScript support with strict mode

## Trade-offs

- Locked into Vercel's ecosystem for optimal deployment (can self-host but loses edge features)
- Server Actions can bypass traditional API layers, making migration to microservices harder later
- Monolithic by default — requires discipline to maintain clean architecture boundaries

## Rejected Alternatives

- **Remix** — similar capabilities but smaller ecosystem and fewer enterprise integrations
- **create-react-app** — outdated, no SSR, no longer actively maintained
- **Vite + React Router** — requires manual SSR setup, no built-in API routes
- **Express + React** — too much manual configuration, lacks conventions

## Consequences

- All apps use `next build` as the build target
- API routes live alongside frontend code in `src/app/api/`
- Middleware handles auth in a single location
- Future microservice extraction requires moving API routes out to standalone services
