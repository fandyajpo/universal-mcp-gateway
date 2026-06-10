export default function DocsLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>): React.ReactNode {
  return (
    <div className="flex">
      <aside className="hidden w-64 shrink-0 border-r md:block">
        <nav className="sticky top-0 p-6">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Guides
          </h2>
          <ul className="space-y-2 text-sm">
            <li>
              <a href="/docs" className="text-muted-foreground hover:text-foreground">
                Overview
              </a>
            </li>
            <li>
              <a href="/docs/getting-started" className="text-muted-foreground hover:text-foreground">
                Getting Started
              </a>
            </li>
            <li>
              <a href="/docs/api" className="text-muted-foreground hover:text-foreground">
                API Reference
              </a>
            </li>
            <li>
              <a href="/docs/connectors" className="text-muted-foreground hover:text-foreground">
                Connectors
              </a>
            </li>
          </ul>
        </nav>
      </aside>
      <main className="flex-1 px-8 py-6">{children}</main>
    </div>
  );
}