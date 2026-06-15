import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Chat",
};

export default function ChatPage(): React.ReactNode {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold">Chat</h1>
      <p className="mt-4 text-lg text-muted-foreground">
        AI-powered workspace chat
      </p>
    </main>
  );
}
