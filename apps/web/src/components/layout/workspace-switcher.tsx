"use client";

import {
  ChevronsUpDown,
  Plus,
} from "lucide-react";

import Link from "next/link";
import { useRouter } from "next/navigation";

import {
  Avatar,
  AvatarFallback,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  getInitials,
} from "@/components/ui";
import { useUserWorkspaces } from "@/hooks/use-user-workspaces";
import { useWorkspaceStore } from "@/lib/store/workspace";

import { WorkspaceSwitcherItem } from "./workspace-switcher-item";
import { cn } from "@repo/ui";

interface WorkspaceSwitcherProps {
  collapsed?: boolean;
}

export function WorkspaceSwitcher({ collapsed = false }: WorkspaceSwitcherProps): React.ReactNode {
  const router = useRouter();
  const { workspaces, isLoading } = useUserWorkspaces();
  const { activeWorkspaceId, setActiveWorkspaceId } = useWorkspaceStore();

  const activeWorkspace = workspaces?.find((w) => w._id === activeWorkspaceId) ?? workspaces?.[0];

  function handleSelect(id: string): void {
    setActiveWorkspaceId(id);
    router.push(`/workspace/${id}`);
  }

  if (isLoading || !workspaces) {
    return (
      <div className="flex h-8 w-8 animate-pulse items-center justify-center rounded-lg bg-muted" />
    );
  }

  if (workspaces.length === 0) {
    return (
      <Link
        href="/"
        className="flex items-center gap-2 font-semibold"
      >
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground text-xs font-bold">
          U
        </div>
        {!collapsed && <span className="text-sm">Universal MCP</span>}
      </Link>
    );
  }

  const singleWs = workspaces[0];
  if (workspaces.length === 1 && singleWs) {
    return (
      <div className={cn("flex items-center gap-2", collapsed && "justify-center")}>
        <Avatar className="h-8 w-8 shrink-0">
          <AvatarFallback className="text-xs font-bold">
            {getInitials(singleWs.name)}
          </AvatarFallback>
        </Avatar>
        {!collapsed && <span className="truncate text-sm font-semibold">{singleWs.name}</span>}
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={cn(
            "flex flex-1 items-center gap-2 rounded-md px-0 py-1.5 text-left transition-colors hover:bg-accent hover:text-accent-foreground",
            collapsed && "justify-center",
          )}
        >
          <Avatar className="h-7 w-7 shrink-0">
            <AvatarFallback className="text-xs font-bold">
              {getInitials(activeWorkspace?.name ?? "")}
            </AvatarFallback>
          </Avatar>
          {!collapsed && (
            <>
              <span className="flex-1 truncate text-sm font-semibold">{activeWorkspace?.name}</span>
              <ChevronsUpDown className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
            </>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" side="right" className="w-64">
        <DropdownMenuLabel>Workspaces</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <div className="max-h-48 overflow-y-auto">
          {workspaces.map((ws) => (
            <DropdownMenuItem key={ws._id} asChild>
              <WorkspaceSwitcherItem
                name={ws.name}
                memberCount={ws.memberCount}
                isActive={ws._id === (activeWorkspaceId ?? workspaces[0]?._id ?? "")}
                onSelect={function (): void {
                  handleSelect(ws._id);
                }}
              />
            </DropdownMenuItem>
          ))}
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link
            href="/"
            className="flex items-center gap-3 rounded-md px-2 py-1.5 text-sm text-muted-foreground hover:text-foreground"
          >
            <Plus className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>Create workspace</span>
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
