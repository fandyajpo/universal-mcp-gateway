"use client";

import { ChevronRight, Home } from "lucide-react";

import { usePathname } from "next/navigation";

import { Sidebar } from "@/components/layout/sidebar";
import { TopBar } from "@/components/layout/topbar";

function Breadcrumbs(): React.ReactNode {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  if (segments.length === 0) return null;

  return (
    <nav aria-label="Breadcrumb" className="border-b bg-background px-4 py-2">
      <ol className="flex items-center gap-1 text-sm text-muted-foreground">
        <li>
          <a href="/dashboard" className="hover:text-foreground">
            <Home className="h-3.5 w-3.5" aria-hidden="true" />
            <span className="sr-only">Home</span>
          </a>
        </li>
        {segments.map((segment, index) => {
          const href = "/" + segments.slice(0, index + 1).join("/");
          const isLast = index === segments.length - 1;
          const label = segment
            .replace(/-/g, " ")
            .replace(/\b\w/g, (char: string) => char.toUpperCase());

          return (
            <li key={href} className="flex items-center gap-1">
              <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
              {isLast ? (
                <span className="font-medium text-foreground" aria-current="page">
                  {label}
                </span>
              ) : (
                <a href={href} className="hover:text-foreground">
                  {label}
                </a>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export function LayoutShell({
  children,
}: {
  children: React.ReactNode;
}): React.ReactNode {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <TopBar />
        <Breadcrumbs />
        <main id="main-content" className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
