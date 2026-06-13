"use client";

import { Menu } from "lucide-react";

import { Sidebar } from "@/components/layout/sidebar";
import { TableOfContents } from "@/components/layout/table-of-contents";
import { useLayoutStore } from "@/lib/store/layout";

export default function DocsLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>): React.ReactNode {
  const { setMobileSidebarOpen } = useLayoutStore();

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)]">
      <Sidebar />
      <div className="flex flex-1 flex-col">
        <button
          type="button"
          onClick={() => { setMobileSidebarOpen(true); }}
          className="flex items-center gap-2 border-b px-4 py-2 text-sm text-muted-foreground hover:text-foreground md:hidden"
          aria-label="Open documentation navigation"
        >
          <Menu className="h-4 w-4" aria-hidden="true" />
          <span>Documentation Navigation</span>
        </button>
        <main id="docs-content" className="flex-1 px-6 py-8 md:px-8 lg:px-12">
          {children}
        </main>
      </div>
      <TableOfContents />
    </div>
  );
}