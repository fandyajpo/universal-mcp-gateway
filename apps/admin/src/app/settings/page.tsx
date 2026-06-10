import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Settings",
};

export default function SettingsPage(): React.ReactNode {
  return (
    <main className="flex min-h-screen flex-col p-8">
      <h1 className="text-3xl font-bold">Settings</h1>
      <p className="mt-2 text-muted-foreground">
        System configuration and preferences
      </p>
    </main>
  );
}
