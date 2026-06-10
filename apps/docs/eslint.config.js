import { baseConfig } from "@repo/config-eslint";

export default [
  {
    ignores: [
      "next.config.ts",
      "mdx-components.tsx",
      "tailwind.config.ts",
      "sentry.client.config.ts",
      "sentry.server.config.ts",
      "sentry.edge.config.ts",
    ],
  },
  ...baseConfig,
];