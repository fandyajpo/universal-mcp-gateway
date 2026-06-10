import { describe, it, expect } from "vitest";

import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "../..");

interface PackageInfo {
  name: string;
  path: string;
  barrelPath: string;
  packageJson: { dependencies?: Record<string, string>; devDependencies?: Record<string, string> };
}

const IMPLEMENTED_PACKAGES: PackageInfo[] = [
  "types", "logger", "config", "validation", "utils", "crypto", "database", "cache", "ui",
].map((pkg) => {
  const pkgPath = resolve(root, "packages", pkg);
  const pkgJson = JSON.parse(readFileSync(resolve(pkgPath, "package.json"), "utf-8"));
  return {
    name: `@repo/${pkg}`,
    path: pkgPath,
    barrelPath: resolve(pkgPath, "src", "index.ts"),
    packageJson: pkgJson,
  };
});

function getExportNames(filePath: string): string[] {
  const content = readFileSync(filePath, "utf-8");
  const exports: string[] = [];

  const reexportRegex = /export\s+(?:type\s+)?\{\s*([^}]+)\}\s*from/g;
  let match: RegExpExecArray | null;
  while ((match = reexportRegex.exec(content)) !== null) {
    const names = match[1]!.split(",").map((n) => {
      const trimmed = n.trim();
      const asMatch = trimmed.match(/^(\w+)\s+as\s+\w+/);
      return asMatch ? asMatch[1]! : trimmed;
    }).filter((n) => n && !n.startsWith("//"));
    exports.push(...names);
  }

  const singleRegex = /export\s+(const|function|class|type|interface|var|let)\s+(\w+)/g;
  while ((match = singleRegex.exec(content)) !== null) {
    exports.push(match[2]!);
  }

  return [...new Set(exports.filter(Boolean))];
}

describe("Package contracts", () => {
  for (const pkg of IMPLEMENTED_PACKAGES) {
    describe(`${pkg.name}`, () => {
      it("barrel file (src/index.ts) exists", () => {
        expect(existsSync(pkg.barrelPath)).toBe(true);
      });

      it("all @repo/* imports in dependencies are declared in package.json", () => {
        const barrelContent = readFileSync(pkg.barrelPath, "utf-8");
        const repoImports = barrelContent.match(/from\s+"@repo\/[^"]+"/g) ?? [];
        const importedPkgs = repoImports.map((imp) => {
          const m = imp.match(/@repo\/[a-z-]+/);
          return m ? m[0] : null;
        }).filter(Boolean) as string[];

        const declaredDeps = {
          ...pkg.packageJson.dependencies,
          ...pkg.packageJson.devDependencies,
        };

        for (const imported of importedPkgs) {
          expect(declaredDeps).toHaveProperty(imported);
        }
      });

      it("exports are non-empty", () => {
        const exports = getExportNames(pkg.barrelPath);
        expect(exports.length).toBeGreaterThan(0);
      });
    });
  }
});
