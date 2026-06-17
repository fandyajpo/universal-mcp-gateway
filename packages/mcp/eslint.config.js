import { baseConfig } from "@repo/config-eslint";

export default [
  ...baseConfig,
  {
    rules: {
      "@typescript-eslint/no-non-null-assertion": "off",
      "@typescript-eslint/require-await": "off",
    },
  },
];
