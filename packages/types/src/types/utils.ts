declare const BrandBrand: unique symbol;
export type Brand<T, B extends string | symbol> = T & { [BrandBrand]: B };

type DeepPartial<T> = T extends object
  ? { [P in keyof T]?: DeepPartial<T[P]> }
  : T;

type Nullable<T> = T | null | undefined;

type Optional<T> = T | undefined;

type AsyncReturnType<T extends (...args: unknown[]) => unknown> =
  T extends (...args: unknown[]) => Promise<infer R> ? R
    : T extends (...args: unknown[]) => infer R ? R
    : never;

export type { DeepPartial, Nullable, Optional, AsyncReturnType };
