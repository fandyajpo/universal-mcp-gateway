"use client";

import {
  ChevronRight,
  Home,
} from "lucide-react";

import { usePathname } from "next/navigation";

import { ContextPanel } from "@/components/layout/context-panel";
import { Sidebar } from "@/components/layout/sidebar";
import { TopBar } from "@/components/layout/topbar";
import { useKeyboardShortcut } from "@/hooks/use-keyboard-shortcut";
import { useLayoutStore } from "@/lib/store/layout";

function Breadcrumbs(): React.ReactNode {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  if (segments.length === 0) return null;

  return (
    <nav aria-label="Breadcrumb" className="border-b bg-background px-4 py-2">
      <ol className="flex items-center gap-1 text-sm text-muted-foreground">
        <li>
          <a href="/" className="hover:text-foreground">
            <Home className="h-3.5 w-3.5" aria-hidden="true" />
            <span className="sr-only">Home</span>
          </a>
        </li>
        {segments.map((segment, index) => {
          const href = "/" + segments.slice(0, index + 1).join("/");
          const isLast = index === segments.length - 1;
          const label = segment
            .replace(/-/g, " ")
            .replace(/\b\w/g, (char) => char.toUpperCase());

          return (
            <li key={href} className="flex items-center gap-1">
              <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
              {isLast ? (
                <span className="text-foreground font-medium" aria-current="page">
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
  const { toggleSidebarCollapsed, toggleRightPanel } = useLayoutStore();

  useKeyboardShortcut({ key: "b", meta: true }, toggleSidebarCollapsed);
  useKeyboardShortcut({ key: "i", meta: true }, toggleRightPanel);

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <TopBar />
        <Breadcrumbs />
        <main id="main-content" className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
      <ContextPanel />
    </div>
  );
}
