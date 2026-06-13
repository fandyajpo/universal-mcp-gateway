"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

import { cn } from "@repo/ui";

const tabs = [
  { label: "General", href: "/settings/workspace" },
  { label: "Members", href: "/settings/workspace/members" },
] as const;

export function WorkspaceSettingsNav(): React.ReactNode {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const workspaceId = searchParams.get("workspaceId");

  if (!workspaceId) return null;

  return (
    <nav className="mb-8 flex gap-1 rounded-lg bg-muted p-1" aria-label="Workspace settings tabs">
      {tabs.map((tab) => {
        const href = `${tab.href}?workspaceId=${workspaceId}`;
        const isActive =
          pathname === tab.href || pathname.startsWith(tab.href + "/");

        return (
          <Link
            key={tab.href}
            href={href}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              isActive
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:bg-background/50 hover:text-foreground",
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
