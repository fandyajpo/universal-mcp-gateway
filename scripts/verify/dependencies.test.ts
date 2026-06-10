import { describe, it, expect } from "vitest";

import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "../..");

interface PackageNode {
  name: string;
  dependencies: string[];
  isApp: boolean;
}

const PACKAGE_DIRS = [
  "packages/types", "packages/logger", "packages/config", "packages/validation",
  "packages/utils", "packages/crypto", "packages/database", "packages/cache",
  "packages/ui", "packages/ai", "packages/auth", "packages/mcp", "packages/rag",
  "packages/connector-sdk", "packages/connectors",
];

const APP_DIRS = ["apps/web", "apps/admin", "apps/docs", "apps/landing"];

function getPackageGraph(): PackageNode[] {
  const all: PackageNode[] = [];

  for (const dir of [...PACKAGE_DIRS, ...APP_DIRS]) {
    const pkgPath = resolve(root, dir, "package.json");
    const pkgJson = JSON.parse(readFileSync(pkgPath, "utf-8"));
    const deps = Object.keys(pkgJson.dependencies ?? {});
    const repoDeps = deps.filter((d) => d.startsWith("@repo/"));

    all.push({
      name: pkgJson.name,
      dependencies: repoDeps,
      isApp: dir.startsWith("apps/"),
    });
  }

  return all;
}

function hasCycle(nodes: PackageNode[]): { hasCycle: boolean; cycle?: string[] } {
  const adjacency = new Map<string, string[]>();
  const nodeMap = new Map<string, PackageNode>();

  for (const node of nodes) {
    adjacency.set(node.name, node.dependencies);
    nodeMap.set(node.name, node);
  }

  const visited = new Set<string>();
  const inStack = new Set<string>();
  const path: string[] = [];

  function dfs(nodeName: string): boolean {
    if (inStack.has(nodeName)) {
      const cycleStart = path.indexOf(nodeName);
      if (cycleStart >= 0) {
        return true;
      }
      return false;
    }
    if (visited.has(nodeName)) {
      return false;
    }

    visited.add(nodeName);
    inStack.add(nodeName);
    path.push(nodeName);

    const neighbors = adjacency.get(nodeName) ?? [];
    for (const neighbor of neighbors) {
      if (dfs(neighbor)) {
        return true;
      }
    }

    path.pop();
    inStack.delete(nodeName);
    return false;
  }

  for (const node of nodes) {
    if (!visited.has(node.name)) {
      if (dfs(node.name)) {
        return { hasCycle: true };
      }
    }
  }

  return { hasCycle: false };
}

describe("Dependency graph", () => {
  const graph = getPackageGraph();

  it("should be a DAG (no circular dependencies)", () => {
    const result = hasCycle(graph);
    expect(result.hasCycle).toBe(false);
  });

  it("no package should depend on any app", () => {
    const appNames = new Set(APP_DIRS.map((d) => {
      const pkgPath = resolve(root, d, "package.json");
      return JSON.parse(readFileSync(pkgPath, "utf-8")).name;
    }));

    for (const node of graph) {
      if (node.isApp) continue;
      const appDeps = node.dependencies.filter((d) => appNames.has(d));
      expect(appDeps).toEqual([]);
    }
  });

  it("@repo/types must have zero runtime dependencies", () => {
    const typesPkg = JSON.parse(
      readFileSync(resolve(root, "packages/types/package.json"), "utf-8"),
    );
    const deps = typesPkg.dependencies ?? {};
    expect(Object.keys(deps)).toHaveLength(0);
  });

  it("dependency hierarchy should be respected (no upward deps)", () => {
    const level = new Map<string, number>([
      ["@repo/types", 0],
      ["@repo/logger", 1],
      ["@repo/config", 1],
      ["@repo/validation", 1],
      ["@repo/utils", 1],
      ["@repo/crypto", 1],
      ["@repo/cache", 2],
      ["@repo/database", 2],
      ["@repo/ui", 1],
      ["@repo/auth", 3],
      ["@repo/ai", 3],
      ["@repo/mcp", 2],
      ["@repo/rag", 4],
      ["@repo/connector-sdk", 3],
      ["@repo/connectors", 4],
    ]);

    for (const node of graph) {
      if (node.isApp) continue;
      const nodeLevel = level.get(node.name);
      if (nodeLevel === undefined) continue;

      for (const dep of node.dependencies) {
        const depLevel = level.get(dep);
        if (depLevel !== undefined) {
          expect(depLevel).toBeLessThan(nodeLevel);
        }
      }
    }
  });
});
