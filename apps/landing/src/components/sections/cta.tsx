"use client";

import { ArrowRight } from "lucide-react";

import Link from "next/link";

import { useInView } from "@/hooks/use-in-view";

import { cn } from "@repo/ui";

export function Cta(): React.ReactNode {
  const [ref, isInView] = useInView();

  return (
    <section className="border-t border-border py-24">
      <div
        ref={ref}
        className="mx-auto max-w-3xl px-6 text-center"
      >
        <h2
          className={cn(
            "text-3xl font-bold tracking-tight transition-all duration-700",
            isInView ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0",
          )}
        >
          Ready to build?
        </h2>
        <p
          className={cn(
            "mx-auto mt-4 max-w-xl text-lg text-muted-foreground transition-all delay-150 duration-700",
            isInView ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0",
          )}
        >
          Get started with our comprehensive documentation or explore the source
          code on GitHub. Your first workspace is free.
        </p>
        <div
          className={cn(
            "mt-10 flex flex-col items-center justify-center gap-4 transition-all delay-300 duration-700 sm:flex-row",
            isInView ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0",
          )}
        >
          <Link
            href="/docs"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-8 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Read the Docs
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              const input = (e.target).elements.namedItem(
                "email",
              ) as HTMLInputElement | null;
              if (input?.value) {
                window.location.href = "/docs";
              }
            }}
            className="flex w-full max-w-md gap-2"
          >
            <label htmlFor="cta-email" className="sr-only">
              Email address
            </label>
            <input
              id="cta-email"
              name="email"
              type="email"
              placeholder="Enter your email"
              required
              className="flex-1 rounded-lg border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
            />
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Subscribe
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
