import type { BetterAuthPlugin } from "better-auth";

export function workspacePlugin(): BetterAuthPlugin {
  return {
    id: "workspace-plugin",
    version: "0.0.1",
  };
}
