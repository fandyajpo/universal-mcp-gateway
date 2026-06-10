import { baseConfig } from "@repo/config-eslint";

export default [
  ...baseConfig,
  {
    ignores: ["eslint/**"],
  },
];
