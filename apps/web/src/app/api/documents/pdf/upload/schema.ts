import { z } from "zod";

export const pdfUploadFormSchema = z
  .object({
    password: z.string().max(256).optional(),
  })
  .strip();

export type PdfUploadFormSchema = z.infer<typeof pdfUploadFormSchema>;

