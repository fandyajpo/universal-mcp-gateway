"use client";

import {
  LayoutDashboard,
  Users,
  Building2,
  Cable,
  ScrollText,
  ListOrdered,
  HeartPulse,
  CreditCard,
  Package,
  FileText,
  Settings,
  Flag,
  Megaphone,
} from "lucide-react";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { Sheet, SheetContent, SheetTitle, SheetDescription } from "@/components/ui";
import { useLayoutStore } from "@/lib/store/layout";

interface NavItem {
  label: string;
  href?: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    label: "Overview",
    items: [{ label: "Dashboard", href: "/dashboard", icon: LayoutDashboard }],
  },
  {
    label: "Management",
    items: [
      { label: "Users", href: "/users", icon: Users },
      { label: "Workspaces", href: "/workspaces", icon: Building2 },
      { label: "Connectors", href: "/connectors", icon: Cable },
    ],
  },
  {
    label: "Operations",
    items: [
      { label: "Audit Logs", href: "/audit-logs", icon: ScrollText },
      { label: "Queue", icon: ListOrdered },
      { label: "Health", icon: HeartPulse },
    ],
  },
  {
    label: "Billing",
    items: [
      { label: "Overview", href: "/billing", icon: CreditCard },
      { label: "Plans", icon: Package },
      { label: "Invoices", icon: FileText },
    ],
  },
  {
    label: "Configuration",
    items: [
      { label: "Settings", href: "/settings", icon: Settings },
      { label: "Feature Flags", icon: Flag },
      { label: "Announcements", icon: Megaphone },
    ],
  },
];

function NavItemLink({
  item,
  pathname,
  onNavigate,
}: {
  item: NavItem;
  pathname: string;
  onNavigate?: () => void;
}): React.ReactNode {
  const isActive =
    item.href !== undefined &&
    (pathname === item.href || pathname.startsWith(item.href + "/"));

  if (item.href === undefined) {
    return (
      <span className="flex cursor-default items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-500">
        <item.icon className="h-4 w-4 shrink-0" aria-hidden="true" />
        <span>{item.label}</span>
      </span>
    );
  }

  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
        isActive
          ? "bg-slate-800 text-white"
          : "text-slate-400 hover:bg-slate-800 hover:text-white"
      }`}
    >
      <item.icon className="h-4 w-4 shrink-0" aria-hidden="true" />
      <span>{item.label}</span>
    </Link>
  );
}

function DesktopSidebar(): React.ReactNode {
  const pathname = usePathname();

  return (
    <aside className="hidden h-screen w-64 flex-col overflow-y-auto border-r border-slate-800 bg-slate-900 md:flex">
      <div className="flex h-14 items-center gap-2 border-b border-slate-800 px-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-slate-900 text-xs font-bold">
          A
        </div>
        <span className="text-sm font-semibold text-white">Admin Panel</span>
      </div>
      <nav className="flex-1 space-y-4 p-3">
        {navGroups.map((group) => (
          <div key={group.label}>
            <h3 className="mb-1 px-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
              {group.label}
            </h3>
            <div className="space-y-0.5">
              {group.items.map((item) => (
                <NavItemLink
                  key={item.label}
                  item={item}
                  pathname={pathname}
                />
              ))}
            </div>
          </div>
        ))}
      </nav>
    </aside>
  );
}

function MobileSidebar(): React.ReactNode {
  const pathname = usePathname();
  const { mobileSidebarOpen, setMobileSidebarOpen } = useLayoutStore();

  return (
    <Sheet open={mobileSidebarOpen} onOpenChange={setMobileSidebarOpen}>
      <SheetContent side="left" className="w-64 border-r-slate-800 bg-slate-900 p-0">
        <SheetTitle className="sr-only">Admin Navigation</SheetTitle>
        <SheetDescription className="sr-only">
          Admin dashboard navigation menu
        </SheetDescription>
        <div className="flex h-14 items-center gap-2 border-b border-slate-800 px-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-slate-900 text-xs font-bold">
            A
          </div>
          <span className="text-sm font-semibold text-white">Admin Panel</span>
        </div>
        <nav className="flex-1 space-y-4 p-3">
          {navGroups.map((group) => (
            <div key={group.label}>
              <h3 className="mb-1 px-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                {group.label}
              </h3>
              <div className="space-y-0.5">
                {group.items.map((item) => (
                  <NavItemLink
                    key={item.label}
                    item={item}
                    pathname={pathname}
                    onNavigate={() => { setMobileSidebarOpen(false); }}
                  />
                ))}
              </div>
            </div>
          ))}
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
