import { Inter } from "next/font/google";

import { Footer } from "@/components/sections/footer";

import "./globals.css";

import { Header } from "@/components/sections/header";

import type { Metadata } from "next";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
  preload: true,
});

export const metadata: Metadata = {
  title: {
    default: "Universal MCP Gateway — AI Workspace Platform",
    template: "%s | Universal MCP Gateway",
  },
  description:
    "Enterprise-grade AI Workspace Platform with AI Gateway, MCP Gateway, RAG Engine, and Connector Marketplace.",
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>): React.ReactNode {
  return (
    <html lang="en" className={inter.variable}>
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
