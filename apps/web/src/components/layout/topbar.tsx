"use client";

import { Bell, Menu, PanelRight } from "lucide-react";

import { SearchCommand } from "@/components/layout/search-command";
import { UserMenu } from "@/components/layout/user-menu";
import { WorkspaceSwitcher } from "@/components/layout/workspace-switcher";
import { useLayoutStore } from "@/lib/store/layout";

import { ThemeToggle } from "@repo/ui";

export function TopBar(): React.ReactNode {
  const { setMobileSidebarOpen, toggleRightPanel } = useLayoutStore();

  return (
    <header className="flex h-14 items-center gap-4 border-b bg-background px-4">
      <button
        type="button"
        onClick={() => { setMobileSidebarOpen(true); }}
        className="rounded-md p-2 text-muted-foreground hover:bg-accent hover:text-accent-foreground md:hidden"
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" aria-hidden="true" />
      </button>

      <WorkspaceSwitcher />

      <div className="hidden flex-1 md:flex md:justify-center">
        <SearchCommand />
      </div>

      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={toggleRightPanel}
          className="rounded-md p-2 text-muted-foreground hover:bg-accent hover:text-accent-foreground"
          aria-label="Toggle context panel"
        >
          <PanelRight className="h-5 w-5" aria-hidden="true" />
        </button>

        <button
          type="button"
          className="rounded-md p-2 text-muted-foreground hover:bg-accent hover:text-accent-foreground"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5" aria-hidden="true" />
        </button>

        <ThemeToggle />
        <UserMenu />
      </div>
    </header>
  );
}
