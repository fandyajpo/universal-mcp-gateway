function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function deepMerge<T extends Record<string, unknown>, U extends Record<string, unknown>>(
  target: T,
  source: U,
  seen?: WeakMap<object, unknown>,
): T & U {
  const refs = seen ?? new WeakMap<object, unknown>();
  const result = { ...target } as Record<string, unknown>;

  if (refs.has(source)) return refs.get(source) as T & U;
  refs.set(source, result);

  for (const key of Object.keys(source)) {
    const sourceVal = source[key];
    const targetVal = target[key as keyof T];

    if (Array.isArray(sourceVal) && Array.isArray(targetVal)) {
      const srcArr: unknown[] = sourceVal;
      const tgtArr: unknown[] = targetVal;
      result[key] = [...new Set([...tgtArr, ...srcArr])];
    } else if (isObject(sourceVal) && isObject(targetVal)) {
      result[key] = deepMerge(
        targetVal as Record<string, unknown>,
        sourceVal,
        refs,
      );
    } else {
      result[key] = sourceVal;
    }
  }

  return result as T & U;
}

export function deepClone<T>(obj: T): T {
  if (typeof structuredClone === "function") {
    return structuredClone(obj);
  }

  if (obj === null || typeof obj !== "object") return obj;
  if (obj instanceof Date) return new Date(obj.getTime()) as T;
  if (obj instanceof RegExp) return new RegExp(obj) as T;
  if (Array.isArray(obj)) return obj.map((item: unknown) => deepClone(item)) as T;

  const cloned: Record<string, unknown> = {};
  for (const key of Object.keys(obj)) {
    cloned[key] = deepClone((obj as Record<string, unknown>)[key]);
  }
  return cloned as T;
}

export function pick<T extends Record<string, unknown>, K extends keyof T>(
  obj: T,
  keys: K[],
): Pick<T, K> {
  const result = {} as Pick<T, K>;
  for (const key of keys) {
    if (key in obj) {
      result[key] = obj[key];
    }
  }
  return result;
}

export function omit<T extends Record<string, unknown>, K extends keyof T>(
  obj: T,
  keys: K[],
): Omit<T, K> {
  const keysSet = new Set(keys as string[]);
  const result = {} as Record<string, unknown>;
  for (const key of Object.keys(obj)) {
    if (!keysSet.has(key)) {
      result[key] = obj[key];
    }
  }
  return result as Omit<T, K>;
}

export function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (value === null || typeof value !== "object") return false;
  if (Object.getPrototypeOf(value) !== Object.prototype) return false;
  return true;
}

export function isEmptyObject(obj: Record<string, unknown>): boolean {
  return Object.keys(obj).length === 0;
}

export function mapValues<T extends Record<string, unknown>, R>(
  obj: T,
  fn: (value: T[keyof T], key: keyof T) => R,
): Record<keyof T, R> {
  const result = {} as Record<keyof T, R>;
  for (const key of Object.keys(obj) as (keyof T)[]) {
    result[key] = fn(obj[key], key);
  }
  return result;
}
