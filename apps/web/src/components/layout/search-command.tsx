"use client";

import { Search } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui";

export function SearchCommand(): React.ReactNode {
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent): void {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((prev) => !prev);
      }
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return (): void => { document.removeEventListener("keydown", handleKeyDown); };
  }, []);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  function handleSelect(): void {
    setOpen(false);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => { setOpen(true); }}
        className="flex w-full max-w-sm items-center gap-2 rounded-md border bg-background px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground"
      >
        <Search className="h-4 w-4" aria-hidden="true" />
        <span>Search...</span>
        <kbd className="ml-auto hidden rounded-sm border bg-muted px-1.5 text-xs md:inline">
          Cmd+K
        </kbd>
      </button>
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 pt-16"
          onClick={() => { setOpen(false); }}
        >
          <div
            className="w-full max-w-lg rounded-lg border bg-popover shadow-lg"
            onClick={(e) => { e.stopPropagation(); }}
          >
            <Command>
              <CommandInput placeholder="Search pages, documents, and more..." />
              <CommandList>
                <CommandEmpty>No results found.</CommandEmpty>
                <CommandGroup heading="Pages">
                  <CommandItem onSelect={handleSelect}>Chat</CommandItem>
                  <CommandItem onSelect={handleSelect}>Knowledge Base</CommandItem>
                  <CommandItem onSelect={handleSelect}>Connectors</CommandItem>
                  <CommandItem onSelect={handleSelect}>Agents</CommandItem>
                  <CommandItem onSelect={handleSelect}>Documents</CommandItem>
                  <CommandItem onSelect={handleSelect}>Settings</CommandItem>
                </CommandGroup>
              </CommandList>
            </Command>
          </div>
        </div>
      )}
    </>
  );
}
