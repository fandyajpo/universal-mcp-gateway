import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Documentation",
};

export default function DocsHomePage(): React.ReactNode {
  return (
    <div className="mx-auto max-w-3xl py-12">
      <h1 className="scroll-m-20 text-4xl font-bold tracking-tight">Documentation</h1>
      <p className="mt-4 text-lg text-muted-foreground">
        Welcome to the Universal MCP Gateway documentation. Browse the guides, API reference, and architectural documentation below.
      </p>
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg border p-4">
          <h2 className="text-xl font-semibold">Getting Started</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Set up your workspace, configure authentication, and start using the platform.
          </p>
        </div>
        <div className="rounded-lg border p-4">
          <h2 className="text-xl font-semibold">API Reference</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Complete API documentation for all endpoints and services.
          </p>
        </div>
        <div className="rounded-lg border p-4">
          <h2 className="text-xl font-semibold">Connectors</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Integrate with Slack, Notion, GitHub, and other third-party services.
          </p>
        </div>
        <div className="rounded-lg border p-4">
          <h2 className="text-xl font-semibold">Architecture</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            System design, data flow, and deployment architecture.
          </p>
        </div>
      </div>
    </div>
  );
}