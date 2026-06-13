"use client";

import { useInView } from "@/hooks/use-in-view";

import { cn } from "@repo/ui";
import type { LucideIcon } from "lucide-react";

interface Step {
  icon: LucideIcon;
  title: string;
  description: string;
}

interface StepsDiagramProps {
  steps: Step[];
}

export function StepsDiagram({ steps }: StepsDiagramProps): React.ReactNode {
  const [ref, isInView] = useInView();

  return (
    <div ref={ref} className="relative">
      {steps.map((step, index) => (
        <div
          key={step.title}
          className={cn(
            "relative flex gap-6 pb-12 transition-all duration-700",
            isInView
              ? "translate-x-0 opacity-100"
              : "translate-x-8 opacity-0",
          )}
          style={{ transitionDelay: `${index * 150}ms` }}
        >
          {index < steps.length - 1 && (
            <div className="absolute left-5 top-10 h-full w-0.5 bg-border" />
          )}
          <div className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-primary bg-background text-primary">
            <step.icon className="h-5 w-5" aria-hidden="true" />
          </div>
          <div className="pt-1">
            <h3 className="font-semibold text-foreground">{step.title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {step.description}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
