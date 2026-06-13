"use client";

import { Check } from "lucide-react";

import { Avatar, AvatarFallback, getInitials } from "@/components/ui";

import { cn } from "@repo/ui";

interface WorkspaceSwitcherItemProps {
  name: string;
  memberCount: number;
  isActive: boolean;
  onSelect: () => void;
}

export function WorkspaceSwitcherItem({
  name,
  memberCount,
  isActive,
  onSelect,
}: WorkspaceSwitcherItemProps): React.ReactNode {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "flex w-full items-center gap-3 rounded-md px-2 py-1.5 text-left text-sm transition-colors",
        isActive
          ? "bg-accent text-accent-foreground"
          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
      )}
    >
      <Avatar className="h-7 w-7 shrink-0">
        <AvatarFallback className="text-xs">{getInitials(name)}</AvatarFallback>
      </Avatar>
      <span className="flex-1 truncate">{name}</span>
      <span className="shrink-0 text-xs text-muted-foreground">{memberCount}</span>
      {isActive ? <Check className="h-4 w-4 shrink-0" aria-hidden="true" /> : null}
    </button>
  );
}
