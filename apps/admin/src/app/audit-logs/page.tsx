import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Audit Logs",
};

export default function AuditLogsPage(): React.ReactNode {
  return (
    <main className="flex min-h-screen flex-col p-8">
      <h1 className="text-3xl font-bold">Audit Logs</h1>
      <p className="mt-2 text-muted-foreground">
        System-wide audit trail and event history
      </p>
    </main>
  );
}
