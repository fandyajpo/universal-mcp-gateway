"use client";

import { Cog, Rocket, Settings, Wifi } from "lucide-react";

import { StepsDiagram } from "@/components/ui/steps-diagram";
import { useInView } from "@/hooks/use-in-view";

import { cn } from "@repo/ui";

const steps = [
  {
    icon: Wifi,
    title: "Connect",
    description:
      "Set up your MCP-compatible tools and data sources with our one-click connectors.",
  },
  {
    icon: Settings,
    title: "Configure",
    description:
      "Define AI models, routing rules, and access controls through our intuitive dashboard.",
  },
  {
    icon: Cog,
    title: "Deploy",
    description:
      "Launch in your workspace with a single click. Your team can start using AI tools immediately.",
  },
  {
    icon: Rocket,
    title: "Scale",
    description:
      "Monitor usage, optimize performance, and grow with built-in analytics and billing.",
  },
];

export function HowItWorks(): React.ReactNode {
  const [ref, isInView] = useInView();

  return (
    <section className="border-t border-border py-24">
      <div ref={ref} className="mx-auto max-w-4xl px-6">
        <h2
          className={cn(
            "text-center text-3xl font-bold tracking-tight transition-all duration-700",
            isInView ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0",
          )}
        >
          How it works
        </h2>
        <p
          className={cn(
            "mx-auto mt-4 max-w-2xl text-center text-lg text-muted-foreground transition-all delay-150 duration-700",
            isInView ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0",
          )}
        >
          Get from zero to production in minutes with our streamlined workflow.
        </p>
        <div className="mt-16">
          <StepsDiagram steps={steps} />
        </div>
      </div>
    </section>
  );
}
