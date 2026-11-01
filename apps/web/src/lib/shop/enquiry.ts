import { z } from "zod";
import { isIndianMobile } from "./phone";

/** Shared by EnquiryModal (client-side checks) and POST /api/enquiry. */
export const enquirySchema = z.object({
  productSlug: z.string().trim().min(1).max(120),
  name: z.string().trim().min(2).max(80),
  phone: z.string().trim().refine(isIndianMobile),
  note: z.string().trim().max(1000).optional(),
  problemSlug: z.string().trim().max(60).optional(),
  locale: z.enum(["hi", "en"]).default("hi"),
});

export type EnquiryInput = z.input<typeof enquirySchema>;
export type EnquiryField = "name" | "phone" | "note" | "problemSlug" | "productSlug";

/** Field → first failing field name, so the UI can show one localized message per field. */
export function enquiryFieldErrors(input: EnquiryInput): Partial<Record<EnquiryField, true>> {
  const res = enquirySchema.safeParse(input);
  if (res.success) return {};
  const out: Partial<Record<EnquiryField, true>> = {};
  for (const issue of res.error.issues) {
    const f = issue.path[0];
    if (typeof f === "string") out[f as EnquiryField] = true;
  }
  return out;
}
