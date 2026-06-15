import { LayoutShell } from "@/components/layout/layout-shell";

export default function ProtectedLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>): React.ReactNode {
  return <LayoutShell>{children}</LayoutShell>;
}
