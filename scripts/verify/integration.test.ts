import { describe, it, expect } from "vitest";

import type { UserId, WorkspaceId } from "@repo/types";
import { slugify, deepMerge } from "@repo/utils";
import { emailSchema, validateBody } from "@repo/validation";
import z from "zod";

describe("Cross-package integration", () => {
  it("should use branded IDs from @repo/types", () => {
    const userId = "user-abc" as UserId;
    const workspaceId = "ws-xyz" as WorkspaceId;

    expect(typeof userId).toBe("string");
    expect(typeof workspaceId).toBe("string");
    expect(userId).not.toBe(workspaceId);
  });

  it("should use slugify from @repo/utils", () => {
    const result = slugify("Hello World!");
    expect(result).toBe("hello-world");
  });

  it("should use deepMerge from @repo/utils", () => {
    const result = deepMerge({ a: 1, b: { c: 2 } }, { b: { d: 3 } });
    expect(result).toEqual({ a: 1, b: { c: 2, d: 3 } });
  });

  it("should validate email using @repo/validation", () => {
    const validResult = emailSchema.safeParse("user@example.com");
    expect(validResult.success).toBe(true);

    const invalidResult = emailSchema.safeParse("not-an-email");
    expect(invalidResult.success).toBe(false);
  });

  it("should use validateBody helper from @repo/validation", () => {
    const schema = z.object({ name: z.string().min(1) });
    const result = validateBody(schema, { name: "test" });
    expect(result.success).toBe(true);

    const failResult = validateBody(schema, { name: "" });
    expect(failResult.success).toBe(false);
  });
});
