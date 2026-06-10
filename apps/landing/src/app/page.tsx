import Link from "next/link";

const features = [
  {
    title: "AI Gateway",
    description: "Unified interface for 200+ LLMs with smart routing, fallbacks, rate limiting, and cost tracking.",
  },
  {
    title: "MCP Gateway",
    description: "Model Context Protocol server enabling AI assistants to discover and interact with your tools and data.",
  },
  {
    title: "RAG Engine",
    description: "Enterprise retrieval-augmented generation with hybrid search, re-ranking, and multi-modal support.",
  },
  {
    title: "Connector Marketplace",
    description: "Pre-built integrations for Slack, Google Drive, Notion, Confluence, and 50+ enterprise tools.",
  },
  {
    title: "Document Intelligence",
    description: "PDF parsing, OCR, table extraction, and chunking strategies optimized for AI context windows.",
  },
  {
    title: "Workspace Platform",
    description: "Multi-tenant workspaces with RBAC, audit logging, SSO, usage analytics, and billing.",
  },
];

const plans = [
  {
    name: "Starter",
    price: "Free",
    description: "Perfect for small teams getting started with AI.",
    features: ["Up to 5 users", "1 workspace", "Basic AI Gateway", "Community support"],
  },
  {
    name: "Pro",
    price: "$49",
    period: "/month",
    description: "For growing teams that need advanced capabilities.",
    features: ["Up to 50 users", "Unlimited workspaces", "Full AI Gateway", "RAG Engine", "Connector Marketplace", "Priority support"],
    highlighted: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    description: "For organizations with advanced security and compliance needs.",
    features: ["Unlimited users", "SSO/SAML", "Custom connectors", "Dedicated support", "SLA guarantee", "On-premise option"],
  },
];

export default function LandingPage(): React.ReactNode {
  return (
    <div className="min-h-screen">
      <header className="border-b border-border">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <span className="text-lg font-bold tracking-tight">
            Universal MCP Gateway
          </span>
          <div className="flex items-center gap-4">
            <Link
              href="https://github.com/anomalyco/universal-mcp-gateway"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              GitHub
            </Link>
            <Link
              href="/docs"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Docs
            </Link>
          </div>
        </nav>
      </header>

      <main>
        <section className="mx-auto max-w-7xl px-6 pb-32 pt-24 text-center">
          <h1 className="text-5xl font-bold leading-tight tracking-tight sm:text-6xl">
            Build AI-Powered Workspaces
          </h1>
          <p className="mx-auto mt-6 max-w-3xl text-xl text-muted-foreground">
            The open platform combining AI Gateway, MCP Gateway, RAG Engine, and
            Connector Marketplace — everything you need to build enterprise AI
            applications.
          </p>
          <div className="mt-10 flex items-center justify-center gap-4">
            <Link
              href="/docs"
              className="rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground"
            >
              Get Started
            </Link>
            <Link
              href="https://github.com/anomalyco/universal-mcp-gateway"
              className="rounded-lg border border-border bg-card px-6 py-3 text-sm font-medium text-card-foreground"
            >
              Star on GitHub
            </Link>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 pb-32">
          <h2 className="mb-12 text-center text-3xl font-bold tracking-tight">
            Everything you need to ship AI features
          </h2>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="rounded-xl border border-border bg-card p-6"
              >
                <h3 className="text-lg font-semibold text-card-foreground">
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="border-t border-border bg-muted py-24">
          <div className="mx-auto max-w-7xl px-6">
            <h2 className="mb-4 text-center text-3xl font-bold tracking-tight">
              Simple, transparent pricing
            </h2>
            <p className="mb-12 text-center text-lg text-muted-foreground">
              Start free. Scale as you grow.
            </p>
            <div className="grid gap-8 lg:grid-cols-3">
              {plans.map((plan) => (
                <div
                  key={plan.name}
                  className={`rounded-xl border p-8 ${
                    plan.highlighted
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-card"
                  }`}
                >
                  <h3 className="text-xl font-semibold">{plan.name}</h3>
                  <p className="mt-1 text-sm opacity-80">{plan.description}</p>
                  <div className="mt-6 flex items-baseline gap-1">
                    <span className="text-4xl font-bold">{plan.price}</span>
                    {plan.period && (
                      <span className="text-sm opacity-80">{plan.period}</span>
                    )}
                  </div>
                  <ul className="mt-8 space-y-3">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-2 text-sm">
                        <span className="h-1.5 w-1.5 rounded-full bg-current opacity-60" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-t border-border py-24 text-center">
          <div className="mx-auto max-w-3xl px-6">
            <h2 className="text-3xl font-bold tracking-tight">
              Ready to build?
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Get started with our documentation or explore the source code on GitHub.
            </p>
            <div className="mt-8 flex items-center justify-center gap-4">
              <Link
                href="/docs"
                className="rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground"
              >
                Read the Docs
              </Link>
              <Link
                href="https://github.com/anomalyco/universal-mcp-gateway"
                className="rounded-lg border border-border bg-background px-6 py-3 text-sm font-medium text-foreground"
              >
                View on GitHub
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border py-8 text-center text-sm text-muted-foreground">
        <p>Universal MCP Gateway. Open source under the MIT License.</p>
      </footer>
    </div>
  );
}
