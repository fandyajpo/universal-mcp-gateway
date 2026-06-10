import { Inter } from "next/font/google";

import type { Metadata } from "next";
import "../styles/globals.css";

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
        <div id="main-content">{children}</div>
      </body>
    </html>
  );
}