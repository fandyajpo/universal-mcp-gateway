import { describe, it, expect } from "vitest";

import { readFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "../..");

const APPS = [
  { name: "web", packageName: "@repo/web", hasStylesDir: true },
  { name: "admin", packageName: "@repo/admin", hasStylesDir: true },
  { name: "docs", packageName: "@repo/docs", hasStylesDir: true },
  { name: "landing", packageName: "@repo/landing", hasStylesDir: false },
] as const;

function collectSourceFiles(dir: string): string[] {
  if (!existsSync(dir)) return [];
  const files: string[] = [];
  function walk(d: string) {
    for (const entry of readdirSync(d)) {
      const full = resolve(d, entry);
      const stat = statSync(full);
      if (stat.isDirectory()) {
        walk(full);
      } else if (entry.endsWith(".ts") || entry.endsWith(".tsx")) {
        files.push(full);
      }
    }
  }
  walk(dir);
  return files;
}

describe("Phase 01: App scaffolding", () => {
  describe.each(APPS)("$name", ({ name, packageName, hasStylesDir }) => {
    const appDir = resolve(root, "apps", name);

    it("has correct package name", () => {
      const pkgJson = JSON.parse(
        readFileSync(resolve(appDir, "package.json"), "utf-8"),
      );
      expect(pkgJson.name).toBe(packageName);
    });

    it("has next.config.ts", () => {
      expect(existsSync(resolve(appDir, "next.config.ts"))).toBe(true);
    });

    it("has root layout with metadata export", () => {
      const layoutPath = resolve(appDir, "src", "app", "layout.tsx");
      const content = readFileSync(layoutPath, "utf-8");
      expect(content).toContain("export const metadata");
      expect(content).toContain("Metadata");
      expect(content).toContain("Skip to content");
    });

    it("has tailwind.config.ts using shared preset", () => {
      const twConfig = readFileSync(
        resolve(appDir, "tailwind.config.ts"),
        "utf-8",
      );
      expect(twConfig).toContain(
        'import sharedConfig from "@repo/ui/tailwind.config"',
      );
      expect(twConfig).toContain("presets: [sharedConfig]");
    });

    it("imports shared globals.css from @repo/ui", () => {
      const globalsPath = hasStylesDir
        ? resolve(appDir, "src", "styles", "globals.css")
        : resolve(appDir, "src", "app", "globals.css");
      const globals = readFileSync(globalsPath, "utf-8");
      expect(globals).toContain('@import "@repo/ui/globals.css"');
    });
  });

  describe("cross-app imports", () => {
    const appNames = APPS.map((a) => a.name);

    for (const app of appNames) {
      it(`${app} should not import from another app`, () => {
        const srcDir = resolve(root, "apps", app, "src");
        const files = collectSourceFiles(srcDir);
        const otherApps = appNames.filter((a) => a !== app);
        const violations: string[] = [];

        for (const file of files) {
          const content = readFileSync(file, "utf-8");
          for (const other of otherApps) {
            if (
              content.includes(`@repo/${other}`) ||
              content.includes(`apps/${other}`)
            ) {
              violations.push(`${file} imports from ${other}`);
            }
          }
        }

        expect(violations).toEqual([]);
      });
    }
  });
});
