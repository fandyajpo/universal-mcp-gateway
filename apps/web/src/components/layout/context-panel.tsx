"use client";

import { X } from "lucide-react";

import { useLayoutStore } from "@/lib/store/layout";

import { cn } from "@repo/ui";

export function ContextPanel(): React.ReactNode {
  const { rightPanelOpen, setRightPanelOpen } = useLayoutStore();

  return (
    <>
      <aside
        className={cn(
          "hidden h-screen flex-col border-l bg-background transition-all duration-200 lg:flex",
          rightPanelOpen ? "w-80" : "w-0 overflow-hidden border-l-0",
        )}
      >
        {rightPanelOpen && (
          <>
            <div className="flex h-14 items-center justify-between border-b px-4">
              <h2 className="text-sm font-semibold">Context</h2>
              <button
                type="button"
                onClick={() => { setRightPanelOpen(false); }}
                className="rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                aria-label="Close context panel"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <p className="text-sm text-muted-foreground">
                Thread context and related documents will appear here.
              </p>
            </div>
          </>
        )}
      </aside>
    </>
  );
}
