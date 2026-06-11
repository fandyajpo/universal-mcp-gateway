"use client";

import {
  MessageSquare,
  BookOpen,
  Puzzle,
  Bot,
  FileText,
  Settings,
  HelpCircle,
  ChevronLeft,
} from "lucide-react";

import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetDescription,
} from "@/components/ui";
import { useLayoutStore } from "@/lib/store/layout";

import { cn } from "@repo/ui";

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const primaryNav: NavItem[] = [
  { label: "Chat", href: "/chat", icon: MessageSquare },
  { label: "Knowledge Base", href: "/knowledge-base", icon: BookOpen },
  { label: "Connectors", href: "/connectors", icon: Puzzle },
  { label: "Agents", href: "/agents", icon: Bot },
  { label: "Documents", href: "/documents", icon: FileText },
];

const secondaryNav: NavItem[] = [
  { label: "Settings", href: "/settings", icon: Settings },
  { label: "Help", href: "/help", icon: HelpCircle },
];

function NavItems({
  items,
  collapsed,
  pathname,
  onNavigate,
}: {
  items: NavItem[];
  collapsed: boolean;
  pathname: string;
  onNavigate?: () => void;
}): React.ReactNode {
  return (
    <>
      {items.map((item) => {
        const isActive =
          pathname === item.href || pathname.startsWith(item.href + "/");
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              isActive
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
              collapsed && "justify-center px-2",
            )}
            title={collapsed ? item.label : undefined}
          >
            <item.icon className="h-5 w-5 shrink-0" aria-hidden="true" />
            {!collapsed && <span>{item.label}</span>}
          </Link>
        );
      })}
    </>
  );
}

function DesktopSidebar(): React.ReactNode {
  const pathname = usePathname();
  const { sidebarCollapsed, toggleSidebarCollapsed } = useLayoutStore();

  return (
    <aside
      className={cn(
        "hidden h-screen flex-col border-r bg-background transition-all duration-200 md:flex",
        sidebarCollapsed ? "w-[60px]" : "w-[280px]",
      )}
    >
      <div className="flex h-14 items-center border-b px-4">
        <Link
          href="/"
          className={cn(
            "flex items-center gap-2 font-semibold",
            sidebarCollapsed && "justify-center",
          )}
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground text-xs font-bold">
            U
          </div>
          {!sidebarCollapsed && (
            <span className="text-sm">Universal MCP</span>
          )}
        </Link>
        <button
          type="button"
          onClick={toggleSidebarCollapsed}
          className={cn(
            "rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-accent-foreground",
            sidebarCollapsed ? "mx-auto" : "ml-auto",
          )}
          aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <ChevronLeft
            className={cn(
              "h-4 w-4 transition-transform",
              sidebarCollapsed && "rotate-180",
            )}
            aria-hidden="true"
          />
        </button>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        <NavItems items={primaryNav} collapsed={sidebarCollapsed} pathname={pathname} />
      </nav>

      <div className="border-t p-3">
        <NavItems items={secondaryNav} collapsed={sidebarCollapsed} pathname={pathname} />
      </div>
    </aside>
  );
}

function MobileSidebar(): React.ReactNode {
  const pathname = usePathname();
  const { mobileSidebarOpen, setMobileSidebarOpen } = useLayoutStore();

  return (
    <Sheet open={mobileSidebarOpen} onOpenChange={setMobileSidebarOpen}>
      <SheetContent side="left" className="w-[280px] p-0">
        <SheetTitle className="sr-only">Navigation</SheetTitle>
        <SheetDescription className="sr-only">
          Main navigation menu
        </SheetDescription>
        <div className="flex h-14 items-center border-b px-4">
          <Link
            href="/"
            className="flex items-center gap-2 font-semibold"
            onClick={() => { setMobileSidebarOpen(false); }}
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground text-xs font-bold">
              U
            </div>
            <span className="text-sm">Universal MCP</span>
          </Link>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          <NavItems
            items={primaryNav}
            collapsed={false}
            pathname={pathname}
            onNavigate={() => { setMobileSidebarOpen(false); }}
          />
        </nav>
        <div className="border-t p-3">
          <NavItems
            items={secondaryNav}
            collapsed={false}
            pathname={pathname}
            onNavigate={() => { setMobileSidebarOpen(false); }}
          />
        </div>
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
