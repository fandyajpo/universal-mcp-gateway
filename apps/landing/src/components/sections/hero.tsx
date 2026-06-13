"use client";

import { ArrowRight } from "lucide-react";

import Link from "next/link";

import { useInView } from "@/hooks/use-in-view";

import { cn } from "@repo/ui";

export function Hero(): React.ReactNode {
  const [ref, isInView] = useInView({ once: true });

  return (
    <section className="relative overflow-hidden pb-32 pt-24">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(var(--primary)/0.08),transparent_60%)]" />
      <div
        ref={ref}
        className="relative mx-auto max-w-7xl px-6 text-center"
      >
        <div
          className={cn(
            "inline-flex items-center gap-2 rounded-full border border-border bg-muted px-4 py-1.5 text-sm text-muted-foreground transition-all duration-700",
            isInView ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0",
          )}
        >
          <span className="h-2 w-2 rounded-full bg-green-500" />
          Now available in public beta
        </div>

        <h1
          className={cn(
            "mt-8 text-5xl font-bold leading-tight tracking-tight transition-all delay-150 duration-700 sm:text-6xl lg:text-7xl",
            isInView ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0",
          )}
        >
          Build AI-Powered
          <br />
          <span className="text-primary">Workspaces</span>
        </h1>

        <p
          className={cn(
            "mx-auto mt-6 max-w-3xl text-lg text-muted-foreground transition-all delay-300 duration-700 sm:text-xl",
            isInView ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0",
          )}
        >
          The open platform combining AI Gateway, MCP Gateway, RAG Engine, and
          Connector Marketplace — everything you need to build enterprise AI
          applications.
        </p>

        <div
          className={cn(
            "mt-10 flex flex-col items-center justify-center gap-4 transition-all delay-500 duration-700 sm:flex-row",
            isInView ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0",
          )}
        >
          <Link
            href="/docs"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-8 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Get Started
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
          <Link
            href="https://github.com/anomalyco/universal-mcp-gateway"
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-8 py-3 text-sm font-medium text-card-foreground hover:bg-accent"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
            </svg>
            Star on GitHub
          </Link>
        </div>

        <div
          className={cn(
            "mt-16 transition-all delay-700 duration-700",
            isInView ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0",
          )}
        >
          <div className="mx-auto max-w-5xl rounded-xl border border-border bg-card p-2 shadow-2xl">
            <div className="flex items-center gap-2 border-b border-border px-4 py-3">
              <div className="h-3 w-3 rounded-full bg-red-500" />
              <div className="h-3 w-3 rounded-full bg-yellow-500" />
              <div className="h-3 w-3 rounded-full bg-green-500" />
              <div className="ml-4 rounded-md bg-muted px-3 py-1 text-xs text-muted-foreground">
                universal-mcp-gateway.vercel.app
              </div>
            </div>
            <div className="flex h-64 items-center justify-center bg-gradient-to-br from-primary/5 to-primary/10 p-8 sm:h-80">
              <div className="grid w-full max-w-2xl gap-4 sm:grid-cols-2">
                <div className="space-y-3 rounded-lg bg-background/60 p-4 backdrop-blur">
                  <div className="h-3 w-24 rounded bg-muted-foreground/20" />
                  <div className="h-2 w-full rounded bg-muted-foreground/10" />
                  <div className="h-2 w-3/4 rounded bg-muted-foreground/10" />
                  <div className="h-2 w-1/2 rounded bg-muted-foreground/10" />
                </div>
                <div className="space-y-3 rounded-lg bg-background/60 p-4 backdrop-blur">
                  <div className="h-3 w-20 rounded bg-muted-foreground/20" />
                  <div className="h-2 w-full rounded bg-muted-foreground/10" />
                  <div className="h-2 w-3/4 rounded bg-muted-foreground/10" />
                  <div className="h-2 w-2/3 rounded bg-muted-foreground/10" />
                </div>
                <div className="space-y-3 rounded-lg bg-background/60 p-4 backdrop-blur sm:col-span-2">
                  <div className="h-3 w-32 rounded bg-muted-foreground/20" />
                  <div className="flex gap-2">
                    <div className="h-2 flex-1 rounded bg-muted-foreground/10" />
                    <div className="h-2 flex-1 rounded bg-primary/20" />
                    <div className="h-2 flex-1 rounded bg-muted-foreground/10" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
