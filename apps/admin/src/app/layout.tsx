import { Inter } from "next/font/google";

import { LayoutShell } from "@/components/layout/layout-shell";

import "../styles/globals.css";
import type { Metadata } from "next";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
  preload: true,
});

export const metadata: Metadata = {
  title: {
    default: "Admin — Universal MCP Gateway",
    template: "%s | Admin — Universal MCP Gateway",
  },
  description: "Administration dashboard — user management, billing, system health, audit logs",
  robots: { index: false, follow: false },
};

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
        <LayoutShell>{children}</LayoutShell>
      </body>
    </html>
  );
}
