import { describe, it, expect } from "vitest";

// ── Async Utilities ───────────────────────────────

describe("sleep", () => {
  it("resolves after the specified delay", async () => {
    const start = Date.now();
    await sleep(50);
    expect(Date.now() - start).toBeGreaterThanOrEqual(40);
  });
});

describe("retry", () => {
  it("returns the result on success", async () => {
    const result = await retry(() => Promise.resolve("ok"));
    expect(result).toBe("ok");
  });

  it("retries on failure and succeeds", async () => {
    let attempts = 0;
    const result = await retry<
      string
    >(
      () => {
        attempts++;
        if (attempts < 3) throw new Error("fail");
        return "success";
      },
      { maxRetries: 3, initialDelay: 10, jitter: false },
    );
    expect(result).toBe("success");
    expect(attempts).toBe(3);
  });

  it("throws after exhausting retries", async () => {
    await expect(
      retry(
        () => {
          throw new Error("persistent");
        },
        { maxRetries: 2, initialDelay: 10, jitter: false },
      ),
    ).rejects.toThrow("persistent");
  });

  it("calls onRetry callback", async () => {
    const calls: number[] = [];
    await retry(
      () => {
        throw new Error("fail");
      },
      {
        maxRetries: 2,
        initialDelay: 10,
        jitter: false,
        onRetry: (_, attempt) => {
          calls.push(attempt);
        },
      },
    ).catch(() => {}); // eslint-disable-line @typescript-eslint/no-empty-function
    expect(calls).toEqual([1, 2]);
  });
});

describe("timeout", () => {
  it("resolves if promise completes before timeout", async () => {
    const result = await timeout(Promise.resolve("done"), 100);
    expect(result).toBe("done");
  });

  it("rejects on timeout", async () => {
    await expect(
      timeout(
        new Promise((resolve) => setTimeout(resolve, 200)),
        50,
      ),
    ).rejects.toThrow("Timeout after 50ms");
  });
});

describe("parallel", () => {
  it("runs all tasks and returns results in order", async () => {
    const results = await parallel(
      [() => Promise.resolve(1), () => Promise.resolve(2), () => Promise.resolve(3)],
      2,
    );
    expect(results).toEqual([1, 2, 3]);
  });

  it("respects concurrency limit", async () => {
    let concurrent = 0;
    let maxConcurrent = 0;

    const tasks = Array.from({ length: 5 }, () => async () => {
      concurrent++;
      maxConcurrent = Math.max(maxConcurrent, concurrent);
      await sleep(30);
      concurrent--;
      return 1;
    });

    await parallel(tasks, 2);
    expect(maxConcurrent).toBeLessThanOrEqual(2);
  });
});

describe("debounce", () => {
  it("only calls function after idle period", async () => {
    let callCount = 0;
    const fn = debounce(() => {
      callCount++;
    }, 50);

    fn();
    fn();
    fn();

    expect(callCount).toBe(0);

    await sleep(100);
    expect(callCount).toBe(1);
  });
});

describe("throttle", () => {
  it("limits calls to once per interval", () => {
    let callCount = 0;
    const fn = throttle(() => {
      callCount++;
    }, 50);

    fn();
    fn();
    fn();

    expect(callCount).toBe(1);
  });
});

describe("raceWithTimeout", () => {
  it("resolves with fastest promise", async () => {
    const result = await raceWithTimeout(
      [sleep(20).then(() => "slow"), sleep(10).then(() => "fast")],
      100,
    );
    expect(result).toBe("fast");
  });

  it("rejects on timeout", async () => {
    await expect(
      raceWithTimeout([sleep(100).then(() => "late")], 30),
    ).rejects.toThrow("Timeout after 30ms");
  });
});

// ── String Utilities ───────────────────────────────

describe("slugify", () => {
  it("converts text to URL-safe slug", () => {
    expect(slugify("Hello World")).toBe("hello-world");
    expect(slugify("Hello  World")).toBe("hello-world");
    expect(slugify("hello-world")).toBe("hello-world");
  });

  it("strips HTML tags", () => {
    expect(slugify("<p>Hello</p>")).toBe("hello");
    expect(slugify("<script>alert('xss')</script>")).toBe("alertxss");
  });

  it("strips dangerous characters", () => {
    expect(slugify("Hello! @World #2024")).toBe("hello-world-2024");
  });
});

describe("truncate", () => {
  it("returns full text if shorter than max", () => {
    expect(truncate("Hello", 10)).toBe("Hello");
  });

  it("truncates at word boundary", () => {
    expect(truncate("Hello beautiful world", 10)).toBe("Hello...");
  });

  it("truncates without space boundary", () => {
    expect(truncate("HelloWorld", 5)).toBe("He...");
  });

  it("uses custom suffix", () => {
    expect(truncate("Hello beautiful world", 10, " [more]")).toBe("Hello [more]");
  });
});

describe("capitalize", () => {
  it("capitalizes first letter", () => {
    expect(capitalize("hello")).toBe("Hello");
    expect(capitalize("HELLO")).toBe("HELLO");
  });

  it("handles empty string", () => {
    expect(capitalize("")).toBe("");
  });
});

describe("titleCase", () => {
  it("converts to title case", () => {
    expect(titleCase("the quick brown fox")).toBe("The Quick Brown Fox");
  });

  it("does not capitalize small words", () => {
    expect(titleCase("a tale of two cities")).toBe("A Tale of Two Cities");
  });
});

describe("camelToKebab", () => {
  it("converts camelCase to kebab-case", () => {
    expect(camelToKebab("helloWorld")).toBe("hello-world");
    expect(camelToKebab("myLongVariableName")).toBe("my-long-variable-name");
  });
});

describe("kebabToCamel", () => {
  it("converts kebab-case to camelCase", () => {
    expect(kebabToCamel("hello-world")).toBe("helloWorld");
    expect(kebabToCamel("my-long-variable-name")).toBe("myLongVariableName");
  });
});

describe("generateId", () => {
  it("generates a URL-safe string of the given length", () => {
    const id = generateId();
    expect(id).toHaveLength(21);
  });

  it("generates unique IDs", () => {
    const ids = new Set(Array.from({ length: 100 }, () => generateId()));
    expect(ids.size).toBe(100);
  });

  it("uses only URL-safe characters", () => {
    const id = generateId();
    expect(id).toMatch(/^[a-zA-Z0-9_-]+$/);
  });
});

describe("maskEmail", () => {
  it("masks email for display", () => {
    expect(maskEmail("user@example.com")).toBe("u***@example.com");
  });

  it("handles short names", () => {
    expect(maskEmail("ab@example.com")).toBe("a***@example.com");
  });
});

describe("pluralize", () => {
  it("returns singular for count of 1", () => {
    expect(pluralize(1, "item")).toBe("item");
  });

  it("returns plural for other counts", () => {
    expect(pluralize(0, "item")).toBe("items");
    expect(pluralize(2, "item")).toBe("items");
  });

  it("handles custom plural", () => {
    expect(pluralize(2, "child", "children")).toBe("children");
  });

  it("handles -es endings", () => {
    expect(pluralize(2, "box")).toBe("boxes");
  });

  it("handles -ies endings", () => {
    expect(pluralize(2, "city")).toBe("cities");
  });
});

// ── Date Utilities ─────────────────────────────────

describe("formatDate", () => {
  it("formats a date using Intl.DateTimeFormat", () => {
    const date = new Date("2024-06-15T10:30:00Z");
    const result = formatDate(date);
    expect(result).toContain("2024");
    expect(result).toContain("Jun");
    expect(result).toContain("15");
  });
});

describe("formatRelative", () => {
  it('returns "just now" for recent dates', () => {
    expect(formatRelative(new Date())).toBe("just now");
  });

  it('returns minutes for recent past', () => {
    const past = new Date(Date.now() - 5 * 60 * 1000);
    expect(formatRelative(past)).toBe("5 minutes ago");
  });

  it("returns future time", () => {
    const future = new Date(Date.now() + 60 * 60 * 1000);
    expect(formatRelative(future)).toBe("1 hour from now");
  });
});

describe("isExpired", () => {
  it("returns true for past dates", () => {
    expect(isExpired(new Date("2020-01-01"))).toBe(true);
  });

  it("returns false for future dates", () => {
    const future = new Date(Date.now() + 86400000);
    expect(isExpired(future)).toBe(false);
  });
});

describe("addDays", () => {
  it("adds days to a date", () => {
    const date = new Date("2024-01-01");
    const result = addDays(date, 5);
    expect(result.getUTCDate()).toBe(6);
  });

  it("does not mutate original", () => {
    const date = new Date("2024-01-01");
    addDays(date, 5);
    expect(date.getUTCDate()).toBe(1);
  });
});

describe("diffInDays", () => {
  it("returns difference in days", () => {
    const a = new Date("2024-01-10");
    const b = new Date("2024-01-01");
    expect(diffInDays(a, b)).toBe(9);
  });

  it("returns negative for earlier dates", () => {
    const a = new Date("2024-01-01");
    const b = new Date("2024-01-10");
    expect(diffInDays(a, b)).toBe(-9);
  });
});

describe("toISOString", () => {
  it("returns ISO string", () => {
    const date = new Date("2024-01-01T00:00:00Z");
    expect(toISOString(date)).toBe(date.toISOString());
  });
});

describe("now", () => {
  it("returns current date", () => {
    const before = Date.now();
    const result = now();
    const after = Date.now();
    expect(result.getTime()).toBeGreaterThanOrEqual(before);
    expect(result.getTime()).toBeLessThanOrEqual(after);
  });
});

// ── Object Utilities ───────────────────────────────

describe("deepMerge", () => {
  it("merges flat objects", () => {
    const result = deepMerge({ a: 1, b: 2 }, { b: 3, c: 4 });
    expect(result).toEqual({ a: 1, b: 3, c: 4 });
  });

  it("merges nested objects", () => {
    const result = deepMerge({ a: { x: 1 } }, { a: { y: 2 } });
    expect(result).toEqual({ a: { x: 1, y: 2 } });
  });

  it("does not mutate inputs", () => {
    const target = { a: 1 };
    const source = { b: 2 };
    deepMerge(target, source);
    expect(target).toEqual({ a: 1 });
  });

  it("concatenates arrays", () => {
    const result = deepMerge({ items: [1, 2] }, { items: [2, 3] });
    expect(result).toEqual({ items: [1, 2, 3] });
  });

  it("handles circular references", () => {
    const a: Record<string, unknown> = { name: "a" };
    const b: Record<string, unknown> = { name: "b" };
    a.self = a;
    b.self = b;

    expect(() => deepMerge(a, b)).not.toThrow();
  });
});

describe("deepClone", () => {
  it("produces a deep equal independent copy", () => {
    const original = { a: 1, b: { c: 2 } };
    const cloned = deepClone(original);
    expect(cloned).toEqual(original);
    expect(cloned).not.toBe(original);
    expect(cloned.b).not.toBe(original.b);
  });

  it("clones arrays", () => {
    const original = [1, [2, 3]];
    const cloned = deepClone(original);
    expect(cloned).toEqual(original);
    expect(cloned).not.toBe(original);
  });
});

describe("pick", () => {
  it("picks specified keys", () => {
    const result = pick({ a: 1, b: 2, c: 3 }, ["a", "c"]);
    expect(result).toEqual({ a: 1, c: 3 });
  });

  it("returns empty object for no keys", () => {
    const result = pick({ a: 1, b: 2 }, []);
    expect(result).toEqual({});
  });
});

describe("omit", () => {
  it("omits specified keys", () => {
    const result = omit({ a: 1, b: 2, c: 3 }, ["a", "c"]);
    expect(result).toEqual({ b: 2 });
  });
});

describe("isPlainObject", () => {
  it("returns true for plain objects", () => {
    expect(isPlainObject({})).toBe(true);
    expect(isPlainObject({ a: 1 })).toBe(true);
  });

  it("returns false for non-plain objects", () => {
    expect(isPlainObject(null)).toBe(false);
    expect(isPlainObject([])).toBe(false);
    expect(isPlainObject("string")).toBe(false);
  });
});

describe("isEmptyObject", () => {
  it("returns true for empty objects", () => {
    expect(isEmptyObject({})).toBe(true);
  });

  it("returns false for non-empty objects", () => {
    expect(isEmptyObject({ a: 1 })).toBe(false);
  });
});

describe("mapValues", () => {
  it("maps over object values", () => {
    const result = mapValues({ a: 1, b: 2 }, (v) => v * 2);
    expect(result).toEqual({ a: 2, b: 4 });
  });

  it("preserves keys", () => {
    const result = mapValues({ foo: "bar", baz: "qux" }, (v) => v.toUpperCase());
    expect(result).toEqual({ foo: "BAR", baz: "QUX" });
  });
});

// ── URL Utilities ──────────────────────────────────

describe("buildUrl", () => {
  it("builds a URL with path", () => {
    const result = buildUrl("https://example.com", "/api/v1/users");
    expect(result).toBe("https://example.com/api/v1/users");
  });

  it("adds query parameters", () => {
    const result = buildUrl("https://example.com", "/search", { q: "test", page: "1" });
    expect(result).toContain("q=test");
    expect(result).toContain("page=1");
  });

  it("skips undefined and null params", () => {
    const result = buildUrl("https://example.com", "/", { a: "1", b: undefined, c: null });
    expect(result).toContain("a=1");
    expect(result).not.toContain("b=");
    expect(result).not.toContain("c=");
  });
});

describe("addQueryParams", () => {
  it("adds params to existing URL", () => {
    const result = addQueryParams("https://example.com/page?existing=1", { new: "2" });
    expect(result).toContain("existing=1");
    expect(result).toContain("new=2");
  });
});

describe("removeQueryParams", () => {
  it("removes specified params", () => {
    const result = removeQueryParams("https://example.com/page?a=1&b=2&c=3", ["a", "c"]);
    expect(result).toContain("b=2");
    expect(result).not.toContain("a=");
    expect(result).not.toContain("c=");
  });
});

describe("isExternalUrl", () => {
  it("returns true for http/https URLs", () => {
    expect(isExternalUrl("https://example.com")).toBe(true);
    expect(isExternalUrl("http://example.com")).toBe(true);
  });

  it("returns false for non-http URLs", () => {
    expect(isExternalUrl("/relative/path")).toBe(false);
    expect(isExternalUrl("")).toBe(false);
  });
});

describe("getDomain", () => {
  it("extracts domain from URL", () => {
    expect(getDomain("https://www.example.com/path")).toBe("www.example.com");
  });

  it("returns null for invalid URLs", () => {
    expect(getDomain("not-a-url")).toBe(null);
  });
});

// ── Type Guard Utilities ───────────────────────────

describe("type guards", () => {
  describe("isString", () => {
    it("returns true for strings", () => {
      expect(isString("hello")).toBe(true);
    });
    it("returns false for non-strings", () => {
      expect(isString(42)).toBe(false);
      expect(isString(null)).toBe(false);
    });
  });

  describe("isNumber", () => {
    it("returns true for finite numbers", () => {
      expect(isNumber(42)).toBe(true);
      expect(isNumber(0)).toBe(true);
    });
    it("returns false for Infinity and NaN", () => {
      expect(isNumber(Infinity)).toBe(false);
      expect(isNumber(NaN)).toBe(false);
    });
  });

  describe("isBoolean", () => {
    it("returns true for booleans", () => {
      expect(isBoolean(true)).toBe(true);
      expect(isBoolean(false)).toBe(true);
    });
  });

  describe("isArray", () => {
    it("returns true for arrays", () => {
      expect(isArray([1, 2, 3])).toBe(true);
    });
    it("returns false for non-arrays", () => {
      expect(isArray({})).toBe(false);
    });
  });

  describe("isObject", () => {
    it("returns true for non-null objects", () => {
      expect(isObject({})).toBe(true);
    });
    it("returns false for arrays and null", () => {
      expect(isObject([])).toBe(false);
      expect(isObject(null)).toBe(false);
    });
  });

  describe("isFunction", () => {
    it("returns true for functions", () => {
      expect(isFunction((): void => {})).toBe(true); // eslint-disable-line @typescript-eslint/no-empty-function
    });
  });

  describe("isDefined", () => {
    it("returns true for defined values", () => {
      expect(isDefined("")).toBe(true);
      expect(isDefined(0)).toBe(true);
      expect(isDefined(false)).toBe(true);
    });
    it("returns false for null and undefined", () => {
      expect(isDefined(null)).toBe(false);
      expect(isDefined(undefined)).toBe(false);
    });
  });

  describe("isError", () => {
    it("returns true for Error instances", () => {
      expect(isError(new Error())).toBe(true);
    });
  });

  describe("assertDefined", () => {
    it("does not throw for defined values", () => {
      expect(() => { assertDefined("hello"); }).not.toThrow();
      expect(() => { assertDefined(0); }).not.toThrow();
    });

    it("throws TypeError for null", () => {
      expect(() => { assertDefined(null, "value"); }).toThrow("value is required");
    });

    it("throws TypeError for undefined", () => {
      expect(() => { assertDefined(undefined); }).toThrow("Value is required");
    });
  });
});

// ── Import the modules (tested via type imports at the end) ──

import {
  sleep,
  retry,
  timeout,
  parallel,
  debounce,
  throttle,
  raceWithTimeout,
} from "./async";
import {
  formatDate,
  formatRelative,
  isExpired,
  addDays,
  diffInDays,
  toISOString,
  now,
} from "./date";
import {
  isString,
  isNumber,
  isBoolean,
  isArray,
  isObject,
  isFunction,
  isDefined,
  isError,
  assertDefined,
} from "./guard";
import {
  deepMerge,
  deepClone,
  pick,
  omit,
  isPlainObject,
  isEmptyObject,
  mapValues,
} from "./object";
import {
  slugify,
  truncate,
  capitalize,
  titleCase,
  camelToKebab,
  kebabToCamel,
  generateId,
  maskEmail,
  pluralize,
} from "./string";
import {
  buildUrl,
  addQueryParams,
  removeQueryParams,
  isExternalUrl,
  getDomain,
} from "./url";
