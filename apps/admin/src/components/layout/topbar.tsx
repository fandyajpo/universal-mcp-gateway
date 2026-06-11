"use client";

import { Bell, LifeBuoy, Menu, Search } from "lucide-react";

import { AdminBadge } from "@/components/layout/admin-badge";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  Avatar,
  AvatarFallback,
  ThemeToggle,
} from "@/components/ui";
import { useLayoutStore } from "@/lib/store/layout";

export function TopBar(): React.ReactNode {
  const { setMobileSidebarOpen } = useLayoutStore();

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

      <AdminBadge />

      <div className="hidden flex-1 md:flex md:justify-center">
        <div className="flex w-full max-w-sm items-center gap-2 rounded-md border bg-background px-3 py-2 text-sm text-muted-foreground">
          <Search className="h-4 w-4" aria-hidden="true" />
          <span>Search admin...</span>
          <kbd className="ml-auto rounded-sm border bg-muted px-1.5 text-xs">
            Cmd+K
          </kbd>
        </div>
      </div>

      <div className="flex items-center gap-1">
        <button
          type="button"
          className="relative rounded-md p-2 text-muted-foreground hover:bg-accent hover:text-accent-foreground"
          aria-label="Support tickets"
        >
          <LifeBuoy className="h-5 w-5" aria-hidden="true" />
          <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-medium text-destructive-foreground">
            3
          </span>
        </button>

        <button
          type="button"
          className="rounded-md p-2 text-muted-foreground hover:bg-accent hover:text-accent-foreground"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5" aria-hidden="true" />
        </button>

        <ThemeToggle />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent"
            >
              <Avatar className="h-8 w-8">
                <AvatarFallback>AD</AvatarFallback>
              </Avatar>
              <span className="hidden text-sm font-medium md:inline">
                Admin User
              </span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col">
                <span>Admin User</span>
                <span className="text-xs font-normal text-muted-foreground">
                  admin@example.com
                </span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Profile</DropdownMenuItem>
            <DropdownMenuItem>Settings</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive">
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
