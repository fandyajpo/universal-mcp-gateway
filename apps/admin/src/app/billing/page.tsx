import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Billing",
};

export default function BillingPage(): React.ReactNode {
  return (
    <main className="flex min-h-screen flex-col p-8">
      <h1 className="text-3xl font-bold">Billing</h1>
      <p className="mt-2 text-muted-foreground">
        Billing overview and subscription management
      </p>
    </main>
  );
}
