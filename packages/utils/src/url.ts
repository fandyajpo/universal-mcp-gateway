export type QueryParams = Record<string, string | string[] | undefined | null>;

export function buildUrl(base: string, path: string, params?: QueryParams): string {
  const baseStr = base.replace(/\/+$/, "");
  const pathStr = path.replace(/^\/+/, "");
  const url = new URL(`${baseStr}/${pathStr}`);

  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value === undefined || value === null) continue;
      if (Array.isArray(value)) {
        for (const v of value) {
          url.searchParams.append(key, v);
        }
      } else {
        url.searchParams.set(key, value);
      }
    }
  }

  return url.toString();
}

export function addQueryParams(url: string, params: QueryParams): string {
  const parsed = new URL(url);

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null) continue;
    if (Array.isArray(value)) {
      for (const v of value) {
        parsed.searchParams.append(key, v);
      }
    } else {
      parsed.searchParams.set(key, value);
    }
  }

  return parsed.toString();
}

export function removeQueryParams(url: string, keys: string[]): string {
  const parsed = new URL(url);

  for (const key of keys) {
    parsed.searchParams.delete(key);
  }

  return parsed.toString();
}

export function isExternalUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export function getDomain(url: string): string | null {
  try {
    const parsed = new URL(url);
    return parsed.hostname;
  } catch {
    return null;
  }
}
