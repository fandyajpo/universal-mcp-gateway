import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Workspaces",
};

export default function WorkspacesPage(): React.ReactNode {
  return (
    <main className="flex min-h-screen flex-col p-8">
      <h1 className="text-3xl font-bold">Workspaces</h1>
      <p className="mt-2 text-muted-foreground">
        Workspace management and configuration
      </p>
    </main>
  );
}
