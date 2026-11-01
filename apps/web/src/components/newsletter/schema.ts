import { z } from "zod";
import { isIndianMobile } from "@/lib/shop/phone";

/** POST /api/newsletter body; `website` is a honeypot that humans never see. */
export const newsletterSchema = z.object({
  email: z.email().max(160),
  whatsapp: z
    .string()
    .trim()
    .max(20)
    .optional()
    .refine((v) => !v || isIndianMobile(v)),
  locale: z.enum(["hi", "en"]).default("hi"),
  website: z.string().max(200).optional(),
});

export type NewsletterStatus = "pending" | "active";
