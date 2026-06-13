"use client";

import { ChevronDown, ChevronRight, BookOpen } from "lucide-react";
import { useState } from "react";

import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetDescription,
} from "@/components/ui";
import { navigationTree, type NavItem } from "@/lib/navigation";
import { useLayoutStore } from "@/lib/store/layout";

import { cn } from "@repo/ui";

function isActivePath(href: string, pathname: string): boolean {
  return pathname === href || pathname.startsWith(href + "/");
}

function hasActiveChild(item: NavItem, pathname: string): boolean {
  if (isActivePath(item.href, pathname)) return true;
  if (item.children) {
    return item.children.some((child) => hasActiveChild(child, pathname));
  }
  return false;
}

function NavTreeItem({
  item,
  pathname,
  depth = 0,
  onNavigate,
}: {
  item: NavItem;
  pathname: string;
  depth?: number;
  onNavigate?: () => void;
}): React.ReactNode {
  const hasChildren = item.children !== undefined && item.children.length > 0;
  const [expanded, setExpanded] = useState(
    hasChildren && hasActiveChild(item, pathname),
  );
  const isActive = isActivePath(item.href, pathname);

  function handleClick(): void {
    if (hasChildren) {
      setExpanded((prev) => !prev);
    }
    onNavigate?.();
  }

  const children = item.children;

  return (
    <li>
      <Link
        href={item.href}
        onClick={handleClick}
        className={cn(
          "flex items-center gap-2 rounded-md px-3 py-1.5 text-sm transition-colors",
          depth === 0 ? "font-medium" : "",
          isActive
            ? "bg-accent text-accent-foreground"
            : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
        )}
        style={{ paddingLeft: `${12 + depth * 16}px` }}
      >
        {hasChildren ? (
          <span className="shrink-0">
            {expanded ? (
              <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
            )}
          </span>
        ) : (
          <span className="w-3.5" />
        )}
        <span>{item.title}</span>
      </Link>
      {children !== undefined && expanded && (
        <ul className="mt-0.5 space-y-0.5">
          {children.map((child) => (
            <NavTreeItem
              key={child.href}
              item={child}
              pathname={pathname}
              depth={depth + 1}
              onNavigate={onNavigate}
            />
          ))}
        </ul>
      )}
    </li>
  );
}

function DesktopSidebar(): React.ReactNode {
  const pathname = usePathname();

  return (
    <aside className="hidden h-full w-64 shrink-0 overflow-y-auto border-r bg-background md:block">
      <div className="flex h-14 items-center gap-2 border-b px-4">
        <BookOpen className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
        <span className="text-sm font-semibold">Documentation</span>
      </div>
      <nav className="p-3" aria-label="Documentation navigation">
        <ul className="space-y-1">
          <li>
            <Link
              href="/docs"
              className={cn(
                "flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                pathname === "/docs"
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
              )}
            >
              Overview
            </Link>
          </li>
          {navigationTree.map((item) => (
            <NavTreeItem key={item.href} item={item} pathname={pathname} />
          ))}
        </ul>
      </nav>
    </aside>
  );
}

function MobileSidebar(): React.ReactNode {
  const pathname = usePathname();
  const { mobileSidebarOpen, setMobileSidebarOpen } = useLayoutStore();

  return (
    <Sheet open={mobileSidebarOpen} onOpenChange={setMobileSidebarOpen}>
      <SheetContent side="left" className="w-72 p-0">
        <SheetTitle className="sr-only">Documentation Navigation</SheetTitle>
        <SheetDescription className="sr-only">
          Documentation sidebar navigation
        </SheetDescription>
        <div className="flex h-14 items-center gap-2 border-b px-4">
          <BookOpen className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
          <span className="text-sm font-semibold">Documentation</span>
        </div>
        <nav className="p-3" aria-label="Documentation navigation">
          <ul className="space-y-1">
            <li>
              <Link
                href="/docs"
                onClick={() => { setMobileSidebarOpen(false); }}
                className={cn(
                  "flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                  pathname === "/docs"
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                )}
              >
                Overview
              </Link>
            </li>
            {navigationTree.map((item) => (
              <NavTreeItem
                key={item.href}
                item={item}
                pathname={pathname}
                onNavigate={() => { setMobileSidebarOpen(false); }}
              />
            ))}
          </ul>
        </nav>
      </SheetContent>
    </Sheet>
  );
}

export function Sidebar(): React.ReactNode {
  return (
    <>
      <DesktopSidebar />
      <MobileSidebar />
    </>
  );
}
