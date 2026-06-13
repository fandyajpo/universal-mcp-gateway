"use client";

import { Check } from "lucide-react";

import { usePricingStore } from "@/lib/store/pricing";

import { cn } from "@repo/ui";

interface PricingCardProps {
  name: string;
  monthlyPrice: string;
  annualPrice: string;
  description: string;
  features: string[];
  highlighted?: boolean;
  ctaLabel?: string;
  ctaHref?: string;
  popular?: boolean;
}

export function PricingCard({
  name,
  monthlyPrice,
  annualPrice,
  description,
  features,
  highlighted = false,
  ctaLabel = "Get Started",
  ctaHref = "/docs",
  popular = false,
}: PricingCardProps): React.ReactNode {
  const billingPeriod = usePricingStore((state) => state.billingPeriod);
  const price = billingPeriod === "monthly" ? monthlyPrice : annualPrice;

  return (
    <div
      className={cn(
        "relative flex flex-col rounded-xl border p-8 transition-shadow duration-300",
        popular
          ? "border-primary shadow-lg shadow-primary/10"
          : "border-border",
        highlighted ? "bg-primary text-primary-foreground" : "bg-card",
      )}
    >
      {popular && (
        <span
          className={cn(
            "absolute -top-3 left-1/2 -translate-x-1/2 rounded-full px-4 py-1 text-xs font-semibold",
            highlighted
              ? "bg-background text-foreground"
              : "bg-primary text-primary-foreground",
          )}
        >
          Most Popular
        </span>
      )}

      <h3 className="text-xl font-semibold">{name}</h3>
      <p
        className={cn(
          "mt-1 text-sm",
          highlighted ? "text-primary-foreground/80" : "text-muted-foreground",
        )}
      >
        {description}
      </p>

      <div className="mt-6 flex items-baseline gap-1">
        <span className="text-4xl font-bold">{price}</span>
        {price !== "Custom" && (
          <span
            className={cn(
              "text-sm",
              highlighted
                ? "text-primary-foreground/80"
                : "text-muted-foreground",
            )}
          >
            /{billingPeriod === "monthly" ? "month" : "year"}
          </span>
        )}
      </div>

      {billingPeriod === "annual" && price !== "Custom" && (
        <p
          className={cn(
            "mt-1 text-xs",
            highlighted
              ? "text-primary-foreground/60"
              : "text-muted-foreground",
          )}
        >
          Save ~20% vs monthly
        </p>
      )}

      <ul className="mt-8 flex-1 space-y-3">
        {features.map((feature) => (
          <li key={feature} className="flex items-center gap-2 text-sm">
            <Check
              className={cn(
                "h-4 w-4 shrink-0",
                highlighted ? "text-primary-foreground" : "text-primary",
              )}
              aria-hidden="true"
            />
            {feature}
          </li>
        ))}
      </ul>

      <a
        href={ctaHref}
        className={cn(
          "mt-8 inline-flex items-center justify-center rounded-lg px-6 py-3 text-sm font-medium transition-colors",
          highlighted
            ? "bg-background text-foreground hover:bg-background/90"
            : popular
              ? "bg-primary text-primary-foreground hover:bg-primary/90"
              : "border border-border bg-background text-foreground hover:bg-accent",
        )}
      >
        {ctaLabel}
      </a>
    </div>
  );
}
