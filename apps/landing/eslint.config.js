import { baseConfig } from "@repo/config-eslint";

export default [
  {
    ignores: [
      "out/",
      "next.config.ts",
      "tailwind.config.ts",
      "sentry.client.config.ts",
      "sentry.server.config.ts",
      "sentry.edge.config.ts",
    ],
  },
  ...baseConfig,
];
