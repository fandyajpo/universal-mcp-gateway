import { z } from "zod";

export const slugSchema = z
  .string()
  .min(3, "Slug must be at least 3 characters")
  .max(63, "Slug must be at most 63 characters")
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    "Slug must contain only lowercase letters, numbers, and hyphens",
  );

export const emailSchema = z
  .string()
  .email("Invalid email address")
  .max(254, "Email must be at most 254 characters")
  .trim()
  .toLowerCase();

export const urlSchema = z
  .string()
  .url("Invalid URL")
  .max(2048, "URL must be at most 2048 characters");

export const uuidSchema = z.string().uuid("Invalid UUID format");

export const brandedIdSchema = z
  .string()
  .min(1, "ID is required")
  .max(128, "ID must be at most 128 characters");

export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(128, "Password must be at most 128 characters")
  .refine((val) => /[A-Z]/.test(val), "Password must contain at least one uppercase letter")
  .refine((val) => /[a-z]/.test(val), "Password must contain at least one lowercase letter")
  .refine((val) => /[0-9]/.test(val), "Password must contain at least one number");

export const hexColorSchema = z
  .string()
  .regex(/^#[0-9a-fA-F]{6}$/, "Invalid hex color code (must be #RRGGBB)");
