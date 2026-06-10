export function getPublicConfig(): {
  readonly appUrl: string;
  readonly appName: string;
  readonly authUrl: string;
} {
  return {
    appUrl: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
    appName: process.env.NEXT_PUBLIC_APP_NAME ?? "Universal MCP Gateway",
    authUrl: process.env.NEXT_PUBLIC_BETTER_AUTH_URL ?? "http://localhost:3000",
  } as const;
}
