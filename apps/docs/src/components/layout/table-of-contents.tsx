"use client";

import { useTableOfContents } from "@/lib/table-of-contents";

import { cn } from "@repo/ui";

export function TableOfContents(): React.ReactNode {
  const headings = useTableOfContents("#docs-content");

  if (headings.length === 0) return null;

  return (
    <aside className="hidden w-56 shrink-0 overflow-y-auto xl:block">
      <nav className="sticky top-14 p-4" aria-label="Table of contents">
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          On this page
        </h2>
        <ul className="space-y-1">
          {headings.map((heading) => (
            <li key={heading.id}>
              <a
                href={`#${heading.id}`}
                className={cn(
                  "block text-sm transition-colors",
                  heading.level === 3 ? "pl-4" : "",
                  heading.level === 4 ? "pl-8" : "",
                  heading.isActive
                    ? "font-medium text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {heading.text}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}
