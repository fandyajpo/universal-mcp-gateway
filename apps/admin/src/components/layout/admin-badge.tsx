"use client";

import { Shield } from "lucide-react";

export function AdminBadge(): React.ReactNode {
  return (
    <span className="inline-flex items-center gap-1 rounded-md bg-slate-900 px-2 py-0.5 text-xs font-semibold text-white">
      <Shield className="h-3 w-3" aria-hidden="true" />
      Admin
    </span>
  );
}
