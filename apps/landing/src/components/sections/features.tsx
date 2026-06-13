"use client";

import {
  BrainCircuit,
  Building2,
  FileText,
  Plug,
  Puzzle,
  Search,
} from "lucide-react";

import { FeatureCard } from "@/components/ui/feature-card";
import { useInView } from "@/hooks/use-in-view";

import { cn } from "@repo/ui";

const features = [
  {
    icon: BrainCircuit,
    title: "AI Gateway",
    description:
      "Unified interface for 200+ LLMs with smart routing, fallbacks, rate limiting, and cost tracking.",
  },
  {
    icon: Plug,
    title: "MCP Gateway",
    description:
      "Model Context Protocol server enabling AI assistants to discover and interact with your tools and data.",
  },
  {
    icon: Search,
    title: "RAG Engine",
    description:
      "Enterprise retrieval-augmented generation with hybrid search, re-ranking, and multi-modal support.",
  },
  {
    icon: Puzzle,
    title: "Connector Marketplace",
    description:
      "Pre-built integrations for Slack, Google Drive, Notion, Confluence, and 50+ enterprise tools.",
  },
  {
    icon: FileText,
    title: "Document Intelligence",
    description:
      "PDF parsing, OCR, table extraction, and chunking strategies optimized for AI context windows.",
  },
  {
    icon: Building2,
    title: "Workspace Platform",
    description:
      "Multi-tenant workspaces with RBAC, audit logging, SSO, usage analytics, and billing.",
  },
];

export function Features(): React.ReactNode {
  const [ref, isInView] = useInView();

  return (
    <section className="border-t border-border py-24">
      <div ref={ref} className="mx-auto max-w-7xl px-6">
        <h2
          className={cn(
            "text-center text-3xl font-bold tracking-tight transition-all duration-700",
            isInView ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0",
          )}
        >
          Everything you need to ship AI features
        </h2>
        <p
          className={cn(
            "mx-auto mt-4 max-w-2xl text-center text-lg text-muted-foreground transition-all delay-150 duration-700",
            isInView ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0",
          )}
        >
          A complete platform for building, deploying, and scaling AI-powered
          applications in your organization.
        </p>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <FeatureCard
              key={feature.title}
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
