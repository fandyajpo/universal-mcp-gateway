import { Inter } from "next/font/google";
import Link from "next/link";

import { Search } from "@/components/layout/search";

import "../styles/globals.css";
import { ThemeToggle } from "@/components/ui";

import type { Metadata } from "next";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
  preload: true,
});

export const metadata: Metadata = {
  title: {
    default: "Docs — Universal MCP Gateway",
    template: "%s | Docs — Universal MCP Gateway",
  },
  description: "Documentation for the Universal MCP Gateway platform — architecture, API reference, guides, and ADRs",
  robots: { index: true, follow: true },
};

function Header(): React.ReactNode {
  return (
    <header className="flex h-14 items-center gap-4 border-b bg-background px-4">
      <div className="flex items-center gap-3">
        <Link href="/docs" className="flex items-center gap-2 font-semibold">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground text-xs font-bold">
            D
          </div>
          <span className="hidden text-sm sm:inline">Docs</span>
        </Link>
      </div>
      <div className="hidden flex-1 sm:flex sm:justify-center">
        <Search />
      </div>
      <div className="flex items-center gap-1">
        <ThemeToggle />
      </div>
    </header>
  );
}

function Footer(): React.ReactNode {
  return (
    <footer className="border-t bg-background px-4 py-6">
      <div className="mx-auto max-w-5xl text-center text-sm text-muted-foreground">
        <p>Universal MCP Gateway Documentation</p>
      </div>
    </footer>
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>): React.ReactNode {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <body>
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:z-50 focus:p-2 focus:bg-background focus:text-foreground"
        >
          Skip to content
        </a>
        <Header />
        <div id="main-content">{children}</div>
        <Footer />
      </body>
    </html>
  );
}