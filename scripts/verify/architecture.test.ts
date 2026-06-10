import { describe, it, expect } from "vitest";

import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { resolve, dirname, extname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "../..");

const IMPLEMENTED_PACKAGES = [
  "types", "logger", "config", "validation", "utils", "crypto", "database", "cache", "ui",
];

function collectSourceFiles(pkgName: string, excludeTests = false): string[] {
  const srcDir = resolve(root, "packages", pkgName, "src");
  if (!existsSync(srcDir)) return [];

  const files: string[] = [];
  function walk(dir: string) {
    for (const entry of readdirSync(dir)) {
      const fullPath = join(dir, entry);
      const stat = statSync(fullPath);
      if (stat.isDirectory()) {
        walk(fullPath);
      } else if (entry.endsWith(".ts") || entry.endsWith(".tsx")) {
        if (excludeTests && (entry.endsWith(".test.ts") || entry.endsWith(".test.tsx") || entry.endsWith(".spec.ts") || entry.endsWith(".spec.tsx"))) {
          continue;
        }
        files.push(fullPath);
      }
    }
  }
  walk(srcDir);
  return files;
}

describe("Architecture rules", () => {
  describe("No console.log", () => {
    for (const pkg of IMPLEMENTED_PACKAGES) {
      it(`${pkg} should not use console.log/error/warn`, () => {
        const files = collectSourceFiles(pkg);
        const violations: string[] = [];

        for (const file of files) {
          const content = readFileSync(file, "utf-8");
          const lines = content.split("\n");
          for (let i = 0; i < lines.length; i++) {
            const line = lines[i]!;
            if (
              /console\.(log|warn|error|debug|info)\s*\(/.test(line) &&
              !line.includes("// eslint-disable")
            ) {
              violations.push(`${file}:${i + 1}: ${line.trim()}`);
            }
          }
        }

        expect(violations).toEqual([]);
      });
    }
  });

  describe("No direct process.env access", () => {
    for (const pkg of IMPLEMENTED_PACKAGES) {
      it(`${pkg} should not access process.env directly (use @repo/config)`, () => {
        if (pkg === "config") return;

        const files = collectSourceFiles(pkg, true);
        const violations: string[] = [];

        for (const file of files) {
          const content = readFileSync(file, "utf-8");
          const lines = content.split("\n");
          for (let i = 0; i < lines.length; i++) {
            const line = lines[i]!;
            if (
              /process\.env\./.test(line) &&
              !line.includes("// eslint-disable")
            ) {
              violations.push(`${file}:${i + 1}: ${line.trim()}`);
            }
          }
        }

        expect(violations).toEqual([]);
      });
    }
  });

  describe("Import order rule (barrel files)", () => {
    for (const pkg of IMPLEMENTED_PACKAGES) {
      it(`${pkg} barrel file follows external → @repo → relative ordering`, () => {
        const barrelPath = resolve(root, "packages", pkg, "src", "index.ts");
        if (!existsSync(barrelPath)) return;

        const content = readFileSync(barrelPath, "utf-8");
        const lines = content.split("\n");
        const seenGroups = new Set<string>();

        for (let i = 0; i < lines.length; i++) {
          const line = lines[i]!;
          const match = line.match(/from\s+"([^"]+)"/);
          if (!match) continue;
          if (line.trimStart().startsWith("//")) continue;

          const source = match[1]!;
          let group: string;
          if (source.startsWith("..") || source.startsWith(".")) {
            group = "relative";
          } else if (source.startsWith("@repo/")) {
            group = "repo";
          } else {
            group = "external";
          }

          seenGroups.add(group);
        }

        const groupsArr = ["external", "repo", "relative"];
        let lastSeen = -1;
        for (const group of groupsArr) {
          if (seenGroups.has(group)) {
            const idx = groupsArr.indexOf(group);
            expect(idx).toBeGreaterThanOrEqual(lastSeen);
            lastSeen = idx;
          }
        }
      });
    }
  });
});
