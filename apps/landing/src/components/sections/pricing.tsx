"use client";

import { PricingCard } from "@/components/ui/pricing-card";
import { useInView } from "@/hooks/use-in-view";
import { usePricingStore } from "@/lib/store/pricing";

import { cn } from "@repo/ui";

const plans = [
  {
    name: "Free",
    monthlyPrice: "$0",
    annualPrice: "$0",
    description: "Perfect for individuals getting started.",
    features: [
      "Up to 5 users",
      "1 workspace",
      "Basic AI Gateway",
      "Community support",
    ],
    ctaLabel: "Get Started",
    ctaHref: "/docs",
  },
  {
    name: "Pro",
    monthlyPrice: "$49",
    annualPrice: "$399",
    description: "For growing teams that need advanced capabilities.",
    features: [
      "Up to 50 users",
      "Unlimited workspaces",
      "Full AI Gateway",
      "RAG Engine",
      "Connector Marketplace",
      "Priority support",
    ],
    highlighted: true,
    popular: true,
    ctaLabel: "Start Free Trial",
    ctaHref: "/docs",
  },
  {
    name: "Enterprise",
    monthlyPrice: "Custom",
    annualPrice: "Custom",
    description: "For organizations with advanced security and compliance needs.",
    features: [
      "Unlimited users",
      "SSO/SAML",
      "Custom connectors",
      "Dedicated support",
      "SLA guarantee",
      "On-premise option",
    ],
    ctaLabel: "Contact Sales",
    ctaHref: "mailto:sales@universal-mcp-gateway.com",
  },
];

export function Pricing(): React.ReactNode {
  const [ref, isInView] = useInView();
  const billingPeriod = usePricingStore((state) => state.billingPeriod);
  const setBillingPeriod = usePricingStore((state) => state.setBillingPeriod);

  return (
    <section className="border-t border-border bg-muted/30 py-24">
      <div ref={ref} className="mx-auto max-w-7xl px-6">
        <h2
          className={cn(
            "text-center text-3xl font-bold tracking-tight transition-all duration-700",
            isInView ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0",
          )}
        >
          Simple, transparent pricing
        </h2>
        <p
          className={cn(
            "mx-auto mt-4 max-w-2xl text-center text-lg text-muted-foreground transition-all delay-150 duration-700",
            isInView ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0",
          )}
        >
          Start free. Scale as you grow. No hidden fees.
        </p>

        <div
          className={cn(
            "mt-8 flex items-center justify-center gap-3 transition-all delay-300 duration-700",
            isInView ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0",
          )}
        >
          <span
            className={cn(
              "text-sm font-medium",
              billingPeriod === "monthly"
                ? "text-foreground"
                : "text-muted-foreground",
            )}
          >
            Monthly
          </span>
          <button
            type="button"
            onClick={() =>
              { setBillingPeriod(
                billingPeriod === "monthly" ? "annual" : "monthly",
              ); }
            }
            className={cn(
              "relative h-6 w-11 rounded-full transition-colors",
              billingPeriod === "annual"
                ? "bg-primary"
                : "bg-muted-foreground/30",
            )}
            aria-label={`Switch to ${billingPeriod === "monthly" ? "annual" : "monthly"} billing`}
          >
            <span
              className={cn(
                "absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-background shadow-sm transition-transform",
                billingPeriod === "annual" && "translate-x-5",
              )}
            />
          </button>
          <span
            className={cn(
              "text-sm font-medium",
              billingPeriod === "annual"
                ? "text-foreground"
                : "text-muted-foreground",
            )}
          >
            Annual
            <span className="ml-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
              Save 20%
            </span>
          </span>
        </div>

        <div
          className={cn(
            "mt-12 grid gap-8 lg:grid-cols-3",
            isInView ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0",
          )}
        >
          {plans.map((plan) => (
            <PricingCard key={plan.name} {...plan} />
          ))}
        </div>
      </div>
    </section>
  );
}
