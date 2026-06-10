import { describe, it, expect } from "vitest";

import { existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "../..");

describe("Build integrity", () => {
  it("pnpm build should succeed for implemented packages", () => {
    const result = execSync(
      "pnpm build --filter @repo/types --filter @repo/utils --filter @repo/validation --filter @repo/crypto --filter @repo/logger --filter @repo/config",
      {
        cwd: root,
        timeout: 120_000,
      },
    );

    expect(result).toBeDefined();
  });
});
