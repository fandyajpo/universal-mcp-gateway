import sharedConfig from "@repo/ui/tailwind.config";

import type { Config } from "tailwindcss";

const config: Config = {
  presets: [sharedConfig],
  content: ["./src/**/*.{ts,tsx}", "./content/**/*.mdx"],
};

export default config;
