"use client";

import { LogOut, Settings, User } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  Avatar,
  AvatarFallback,
} from "@/components/ui";

const PLACEHOLDER_USER = {
  name: "John Doe",
  email: "john@example.com",
  initials: "JD",
};

export function UserMenu(): React.ReactNode {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent"
        >
          <Avatar className="h-8 w-8">
            <AvatarFallback>{PLACEHOLDER_USER.initials}</AvatarFallback>
          </Avatar>
          <span className="hidden text-sm font-medium md:inline">
            {PLACEHOLDER_USER.name}
          </span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <div className="flex flex-col">
            <span>{PLACEHOLDER_USER.name}</span>
            <span className="text-xs font-normal text-muted-foreground">
              {PLACEHOLDER_USER.email}
            </span>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <User className="mr-2 h-4 w-4" aria-hidden="true" />
          Profile
        </DropdownMenuItem>
        <DropdownMenuItem>
          <Settings className="mr-2 h-4 w-4" aria-hidden="true" />
          Settings
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="text-destructive">
          <LogOut className="mr-2 h-4 w-4" aria-hidden="true" />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
