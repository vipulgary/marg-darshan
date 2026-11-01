/**
 * Free-kundali request validation, shared by the form (client) and POST /api/kundali.
 * Error messages are i18n keys under "kundali.errors.*" so both languages come
 * from messages/{hi,en}/kundali.json.
 */
import { z } from "zod";

export const MIN_YEAR = 1900;
const INDIAN_MOBILE = /^(?:\+?91[\s-]?|0)?[6-9]\d{9}$/;

export function isRealDate(iso: string): boolean {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return false;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const dt = new Date(Date.UTC(y, mo - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === mo - 1 && dt.getUTCDate() === d;
}

/** Compares as calendar dates in IST (the business timezone). */
export function isNotFuture(iso: string, now: Date = new Date()): boolean {
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(now); // YYYY-MM-DD
  return iso <= today;
}

export const placeSchema = z.object(
  {
    placeName: z.string().trim().min(1, { error: "placeRequired" }).max(300),
    latitude: z.number({ error: "latInvalid" }).min(-90, { error: "latInvalid" }).max(90, { error: "latInvalid" }),
    longitude: z.number({ error: "lngInvalid" }).min(-180, { error: "lngInvalid" }).max(180, { error: "lngInvalid" }),
    tzName: z
      .string()
      .min(1)
      .max(64)
      .refine((tz) => {
        try {
          new Intl.DateTimeFormat("en", { timeZone: tz });
          return true;
        } catch {
          return false;
        }
      }, { error: "tzInvalid" }),
  },
  { error: "placeRequired" },
);

export const kundaliRequestSchema = z.object({
  name: z.string({ error: "nameRequired" }).trim().min(2, { error: "nameRequired" }).max(80, { error: "nameTooLong" }),
  gender: z.enum(["male", "female", "other"], { error: "genderRequired" }),
  dob: z
    .string({ error: "dobRequired" })
    .min(1, { error: "dobRequired" })
    .refine(isRealDate, { error: "dobInvalid" })
    .refine((d) => Number(d.slice(0, 4)) >= MIN_YEAR, { error: "dobInvalid" })
    .refine((d) => isNotFuture(d), { error: "dobFuture" }),
  tob: z.string({ error: "tobRequired" }).regex(/^([01]\d|2[0-3]):[0-5]\d$/, { error: "tobRequired" }),
  place: placeSchema,
  email: z.email({ error: "emailInvalid" }).max(200, { error: "emailInvalid" }),
  whatsapp: z
    .string()
    .trim()
    .max(20, { error: "phoneInvalid" })
    .refine((v) => v === "" || INDIAN_MOBILE.test(v.replace(/\s+/g, "")), { error: "phoneInvalid" })
    .optional(),
  chartStyle: z.enum(["north", "south"]),
  lang: z.enum(["hi", "en"]),
  consent: z.literal(true, { error: "consentRequired" }),
  turnstileToken: z.string().max(4096).optional(),
});

export type KundaliRequest = z.infer<typeof kundaliRequestSchema>;
export type KundaliField = "name" | "gender" | "dob" | "tob" | "place" | "email" | "whatsapp" | "consent";
export type FieldErrors = Partial<Record<KundaliField, string>>;

const FIELDS: KundaliField[] = ["name", "gender", "dob", "tob", "place", "email", "whatsapp", "consent"];

/** First error key per top-level field (place sub-errors collapse onto "place"). */
export function fieldErrors(error: z.ZodError): FieldErrors {
  const out: FieldErrors = {};
  for (const issue of error.issues) {
    const field = issue.path[0];
    if (typeof field !== "string" || !FIELDS.includes(field as KundaliField)) continue;
    const key = field as KundaliField;
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

/** Normalises a WhatsApp number to +91XXXXXXXXXX; empty stays undefined. */
export function normalizeIndianPhone(raw: string | undefined): string | undefined {
  const digits = (raw ?? "").replace(/\D/g, "");
  if (!digits) return undefined;
  const ten = digits.slice(-10);
  return `+91${ten}`;
}

/* ---------- Form <-> request helpers (selects are 12-hour, DOB is three selects) ---------- */

export interface DobParts {
  day: string; // "1".."31"
  month: string; // "1".."12"
  year: string; // "1990"
}

export interface TobParts {
  hour: string; // "1".."12"
  minute: string; // "00".."59"
  period: "AM" | "PM" | "";
}

export function joinDob({ day, month, year }: DobParts): string {
  if (!day || !month || !year) return "";
  return `${year.padStart(4, "0")}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
}

export function splitDob(iso: string | null | undefined): DobParts | null {
  if (!iso || !isRealDate(iso)) return null;
  const [y, m, d] = iso.split("-");
  return { year: y, month: String(Number(m)), day: String(Number(d)) };
}

/** 12-hour selects → "HH:mm" (24h); "" while incomplete. */
export function joinTob({ hour, minute, period }: TobParts): string {
  if (!hour || minute === "" || !period) return "";
  const h12 = Number(hour) % 12;
  const h24 = period === "PM" ? h12 + 12 : h12;
  return `${String(h24).padStart(2, "0")}:${minute.padStart(2, "0")}`;
}

export function splitTob(hhmm: string | null | undefined): TobParts | null {
  const m = /^([01]?\d|2[0-3]):([0-5]\d)(?::[0-5]\d)?$/.exec(hhmm ?? "");
  if (!m) return null;
  const h = Number(m[1]);
  return { hour: String(h % 12 === 0 ? 12 : h % 12), minute: m[2], period: h < 12 ? "AM" : "PM" };
}
