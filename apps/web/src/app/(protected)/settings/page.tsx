import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Settings",
};

export default function SettingsPage(): React.ReactNode {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold">Settings</h1>
      <p className="mt-4 text-lg text-muted-foreground">
        Workspace and account settings
      </p>
    </main>
  );
}
