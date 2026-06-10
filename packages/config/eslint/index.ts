import js from "@eslint/js";
import prettierConfig from "eslint-config-prettier";
import perfectionist from "eslint-plugin-perfectionist";
import reactPlugin from "eslint-plugin-react";
import reactHooksPlugin from "eslint-plugin-react-hooks";
import tseslint from "typescript-eslint";

const ignores = {
  ignores: [
    "**/dist/**",
    "**/node_modules/**",
    "**/.next/**",
    "**/coverage/**",
    "**/*.d.ts",
  ],
};

const tsRules = {
  rules: {
    "@typescript-eslint/consistent-type-definitions": ["error", "interface"],
    "@typescript-eslint/explicit-function-return-type": "error",
    "@typescript-eslint/no-unused-vars": [
      "error",
      {
        argsIgnorePattern: "^_",
        varsIgnorePattern: "^_|Brand$",
      },
    ],
    "@typescript-eslint/prefer-nullish-coalescing": "error",
    "@typescript-eslint/prefer-optional-chain": "error",
    "@typescript-eslint/restrict-template-expressions": [
      "error",
      {
        allowNumber: true,
        allowBoolean: true,
        allowAny: false,
        allowNullish: true,
      },
    ],
    "no-console": ["error", { allow: ["warn", "error"] }],
    "no-debugger": "error",
    "prefer-const": "error",
    eqeqeq: ["error", "always"],
  },
};

const importSorting = {
  plugins: { perfectionist },
  rules: {
    "perfectionist/sort-imports": [
      "error",
      {
        type: "natural",
        order: "asc",
        groups: [
          "react",
          "next",
          ["builtin", "external"],
          ["internal", "parent", "sibling", "index", "type"],
        ],
        customGroups: {
          value: {
            react: ["react", "react-dom"],
            next: ["next", "next/*"],
          },
        },
        newlinesBetween: "always",
        internalPattern: ["^@repo/"],
      },
    ],
  },
};

const testOverrides = {
  files: ["**/*.test.ts", "**/*.test.tsx", "**/*.spec.ts", "**/vitest.config.ts"],
  rules: {
    "@typescript-eslint/no-unsafe-call": "off",
    "@typescript-eslint/no-unsafe-member-access": "off",
    "@typescript-eslint/no-unsafe-assignment": "off",
    "@typescript-eslint/no-unsafe-return": "off",
    "@typescript-eslint/explicit-function-return-type": "off",
  },
};

const typeOnlyOverride = {
  files: ["**/*.ts", "**/*.tsx"],
  rules: {
    "@typescript-eslint/no-unused-vars": [
      "error",
      {
        argsIgnorePattern: "^_",
        varsIgnorePattern: "^_|Brand$",
        caughtErrors: "none",
      },
    ],
  },
};

export const baseConfig = tseslint.config(
  ignores,
  js.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: {
          allowDefaultProject: ["*.ts", "*.tsx", "*.mjs", "*.js", "eslint.config.js"],
        },
        tsconfigRootDir: process.cwd(),
      },
    },
  },
  tsRules,
  importSorting,
  testOverrides,
  typeOnlyOverride,
  prettierConfig,
);

export const reactConfig = tseslint.config(
  {
    plugins: {
      react: reactPlugin,
    },
    settings: {
      react: {
        version: "detect",
      },
    },
    rules: {
      ...reactPlugin.configs.recommended.rules,
      ...reactPlugin.configs["jsx-runtime"].rules,
      "react/prop-types": "off",
    },
  },
  {
    plugins: {
      "react-hooks": reactHooksPlugin,
    },
    rules: {
      ...reactHooksPlugin.configs.recommended.rules,
    },
  },
);
