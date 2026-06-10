import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Users",
};

export default function UsersPage(): React.ReactNode {
  return (
    <main className="flex min-h-screen flex-col p-8">
      <h1 className="text-3xl font-bold">Users</h1>
      <p className="mt-2 text-muted-foreground">
        User management and administration
      </p>
    </main>
  );
}
