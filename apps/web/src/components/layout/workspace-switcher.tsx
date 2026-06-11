"use client";

import { ChevronDown } from "lucide-react";
import { useState } from "react";

import { cn } from "@repo/ui";

interface Workspace {
  id: string;
  name: string;
  slug: string;
}

const PLACEHOLDER_WORKSPACES: Workspace[] = [
  { id: "1", name: "Personal", slug: "personal" },
  { id: "2", name: "Engineering", slug: "engineering" },
  { id: "3", name: "Marketing", slug: "marketing" },
];

const DEFAULT_WORKSPACE: Workspace = { id: "1", name: "Personal", slug: "personal" };

export function WorkspaceSwitcher(): React.ReactNode {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Workspace>(DEFAULT_WORKSPACE);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => { setOpen(!open); }}
        className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-foreground hover:bg-accent hover:text-accent-foreground"
      >
        <span>{selected.name}</span>
        <ChevronDown className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
      </button>
      {open && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => { setOpen(false); }}
            aria-hidden="true"
          />
          <div className="absolute left-0 top-full z-50 mt-1 w-56 rounded-md border bg-popover p-1 shadow-md">
            {PLACEHOLDER_WORKSPACES.map((workspace) => (
              <button
                key={workspace.id}
                type="button"
                onClick={() => {
                  setSelected(workspace);
                  setOpen(false);
                }}
                className={cn(
                  "flex w-full items-center rounded-sm px-2 py-1.5 text-sm",
                  selected.id === workspace.id
                    ? "bg-accent text-accent-foreground"
                    : "text-popover-foreground hover:bg-accent hover:text-accent-foreground",
                )}
              >
                {workspace.name}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
