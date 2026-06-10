import { z } from "zod";

export interface ValidationSuccess<T> { success: true; data: T }
export interface ValidationError { success: false; error: z.ZodError }
export type ValidationResult<T> = ValidationSuccess<T> | ValidationError;

export function validateBody<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
): ValidationResult<T> {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: result.error };
}

export function validateQuery<T>(
  schema: z.ZodSchema<T>,
  searchParams: URLSearchParams | Record<string, string | undefined>,
): ValidationResult<T> {
  const raw: Record<string, string | undefined> =
    searchParams instanceof URLSearchParams
      ? Object.fromEntries(searchParams.entries())
      : searchParams;

  const result = schema.safeParse(raw);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: result.error };
}

export function validateParams<T>(
  schema: z.ZodSchema<T>,
  params: Record<string, string | undefined>,
): ValidationResult<T> {
  const result = schema.safeParse(params);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: result.error };
}

export function validateAction<T>(
  schema: z.ZodSchema<T>,
  formData: FormData | Record<string, unknown>,
): ValidationResult<T> {
  const raw: Record<string, unknown> =
    formData instanceof FormData
      ? Object.fromEntries(formData.entries())
      : formData;

  const result = schema.safeParse(raw);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: result.error };
}
