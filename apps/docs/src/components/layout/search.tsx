"use client";

import { Search as SearchIcon } from "lucide-react";

export function Search(): React.ReactNode {
  return (
    <div className="flex w-full max-w-sm items-center gap-2 rounded-md border bg-background px-3 py-1.5 text-sm text-muted-foreground">
      <SearchIcon className="h-4 w-4" aria-hidden="true" />
      <span>Search docs...</span>
      <kbd className="ml-auto rounded-sm border bg-muted px-1.5 text-xs">
        Cmd+K
      </kbd>
    </div>
  );
}
