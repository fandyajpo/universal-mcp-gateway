import type { MiddlewareFn } from "./types";

const URL_PATTERN = /https?:\/\/\S+/g;
const HTML_TAG_PATTERN = /<[^>]*>/g;
const WHITESPACE_PATTERN = /\s+/g;

export const queryNormalizer: MiddlewareFn = (query: string): string => {
  return query
    .replace(HTML_TAG_PATTERN, "")
    .replace(URL_PATTERN, "")
    .replace(WHITESPACE_PATTERN, " ")
    .trim();
};

export const noopMiddleware: MiddlewareFn = (query: string): string => query;

export function composeMiddleware(...middleware: MiddlewareFn[]): MiddlewareFn {
  return async (query: string): Promise<string> => {
    let result = query;
    for (const fn of middleware) {
      result = await fn(result);
    }
    return result;
  };
}
