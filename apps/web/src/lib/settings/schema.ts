/**
 * AMX-143: admin-editable business settings. Pure logic only (no DB / Next imports) so it can be
 * unit-tested and shared by the server loader, the admin action and the price/slot consumers.
 * Storage: one `settings` row per top-level key below; anything missing or invalid falls back to
 * the catalog defaults, so a broken row can never take pricing or booking down.
 */
import { z } from "zod";
import { type Bilingual, SERVICES, SETTINGS, getService } from "@/content/catalog";
import type { ServiceLookup } from "@/lib/booking/pricing";

export interface WorkingHoursSetting {
  start: number;
  end: number;
  days: number[];
}

export interface ServicePricing {
  /** INR per session duration (minutes) */
  prices: Record<number, number>;
  /** split-plan advance; only for services that allow splitting */
  advancePct?: number;
}

export interface BusinessSettings {
  whatsappNumber: string;
  contactEmail: string;
  officeAddress: Bilingual;
  workingHours: WorkingHoursSetting;
  holdMinutes: number;
  cancellationHours: number;
  paymentBalanceDaysBefore: number;
  services: Record<string, ServicePricing>;
}

export type SettingKey = keyof BusinessSettings;
export const SETTING_KEYS: SettingKey[] = [
  "whatsappNumber",
  "contactEmail",
  "officeAddress",
  "workingHours",
  "holdMinutes",
  "cancellationHours",
  "paymentBalanceDaysBefore",
  "services",
];

type Env = Record<string, string | undefined>;

export const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"] as const;

function envBalanceDays(env: Env): number {
  const n = Number(env.PAYMENT_BALANCE_DAYS_BEFORE);
  return env.PAYMENT_BALANCE_DAYS_BEFORE && Number.isFinite(n) && n >= 0 ? n : 1;
}

/** The pre-AMX-143 values: catalog.ts + env. Used whenever the DB has nothing (or is unavailable). */
export function defaultSettings(env: Env = process.env): BusinessSettings {
  return {
    whatsappNumber: SETTINGS.whatsappNumber,
    // Same fallback as CONTACT_EMAIL in lib/seo.ts.
    contactEmail: env.NEXT_PUBLIC_CONTACT_EMAIL ?? "namaste@astromax.example",
    officeAddress: { ...SETTINGS.officeAddress },
    workingHours: { ...SETTINGS.workingHours, days: [...SETTINGS.workingHours.days] },
    holdMinutes: SETTINGS.holdMinutes,
    cancellationHours: SETTINGS.cancellationHours,
    paymentBalanceDaysBefore: envBalanceDays(env),
    services: Object.fromEntries(
      SERVICES.map((s) => [s.slug, { prices: { ...s.prices }, ...(s.splitAllowed ? { advancePct: s.advancePct ?? 50 } : {}) }]),
    ),
  };
}

const int = (label: string, min: number, max: number) =>
  z
    .number({ error: `${label} must be a number` })
    .int(`${label} must be a whole number`)
    .min(min, `${label} must be at least ${min}`)
    .max(max, `${label} must be at most ${max}`);

const priceSchema = int("Price", 1, 10_000_000);

const fieldSchemas = {
  whatsappNumber: z
    .string()
    .transform((s) => s.replace(/[\s()+-]/g, ""))
    .pipe(z.string().regex(/^\d{10,15}$/, "Enter the number with country code, digits only (e.g. 919876543210)")),
  contactEmail: z.string().trim().pipe(z.email("Enter a valid email address")),
  officeAddress: z.object({
    hi: z.string().trim().min(1, "Hindi address is required").max(300, "Keep it under 300 characters"),
    en: z.string().trim().min(1, "English address is required").max(300, "Keep it under 300 characters"),
  }),
  workingHours: z
    .object({
      start: int("Opening hour", 0, 23),
      end: int("Closing hour", 1, 24),
      days: z
        .array(z.number().int().min(0).max(6))
        .min(1, "Pick at least one working day")
        .transform((d) => [...new Set(d)].sort((a, b) => a - b)),
    })
    .refine((w) => w.end > w.start, { message: "Closing hour must be after opening hour", path: ["end"] }),
  holdMinutes: int("Slot hold", 5, 60),
  cancellationHours: int("Free cancellation window", 0, 168),
  paymentBalanceDaysBefore: int("Balance due", 0, 30),
  services: servicesSchema(),
};

/** Known services and durations only — new durations need a catalog change (and Cal.com event types). */
function servicesSchema() {
  return z.object(
    Object.fromEntries(
      SERVICES.map((s) => [
        s.slug,
        z.object({
          prices: z.object(Object.fromEntries(s.durations.map((d) => [String(d), priceSchema]))),
          ...(s.splitAllowed ? { advancePct: int("Advance", 1, 99) } : {}),
        }),
      ]),
    ),
  );
}

/** Stored service pricing may be partial (older rows, removed durations): validate per field. */
function mergeServices(base: BusinessSettings["services"], raw: unknown): BusinessSettings["services"] {
  if (!raw || typeof raw !== "object") throw new Error("services must be an object");
  const out: BusinessSettings["services"] = structuredClone(base);
  for (const s of SERVICES) {
    const stored = (raw as Record<string, unknown>)[s.slug] as { prices?: Record<string, unknown>; advancePct?: unknown } | undefined;
    if (!stored || typeof stored !== "object") continue;
    for (const d of s.durations) {
      const p = priceSchema.safeParse(stored.prices?.[String(d)]);
      if (p.success) out[s.slug].prices[d] = p.data;
    }
    if (s.splitAllowed) {
      const a = int("Advance", 1, 99).safeParse(stored.advancePct);
      if (a.success) out[s.slug].advancePct = a.data;
    }
  }
  return out;
}

export interface SettingRow {
  key: string;
  value: unknown;
}

/** DB rows over defaults. Unknown keys are ignored; invalid values are reported and skipped. */
export function mergeSettings(defaults: BusinessSettings, rows: SettingRow[]): { settings: BusinessSettings; invalid: string[] } {
  const settings = structuredClone(defaults);
  const invalid: string[] = [];
  const byKey = new Map(rows.map((r) => [r.key, r.value]));
  for (const key of SETTING_KEYS) {
    if (!byKey.has(key)) continue;
    const value = byKey.get(key);
    if (key === "services") {
      try {
        settings.services = mergeServices(settings.services, value);
      } catch {
        invalid.push(key);
      }
      continue;
    }
    const parsed = fieldSchemas[key].safeParse(value);
    if (parsed.success) (settings as unknown as Record<string, unknown>)[key] = parsed.data;
    else invalid.push(key);
  }
  return { settings, invalid };
}

export const settingsSchema = z.object(fieldSchemas);

export type FieldErrors = Record<string, string>;

interface FormLike {
  get(name: string): FormDataEntryValue | null;
  getAll(name: string): FormDataEntryValue[];
}

const str = (form: FormLike, name: string) => {
  const v = form.get(name);
  return typeof v === "string" ? v : "";
};
const num = (form: FormLike, name: string) => {
  const s = str(form, name).trim();
  return s === "" ? Number.NaN : Number(s);
};

/**
 * Admin form → validated settings. Field names are the dotted settings paths
 * (e.g. "workingHours.start", "services.astrology.prices.30"), so zod issue paths map 1:1 to inputs.
 */
export function parseSettingsForm(
  form: FormLike,
): { ok: true; value: BusinessSettings } | { ok: false; fieldErrors: FieldErrors } {
  const raw = {
    whatsappNumber: str(form, "whatsappNumber"),
    contactEmail: str(form, "contactEmail"),
    officeAddress: { hi: str(form, "officeAddress.hi"), en: str(form, "officeAddress.en") },
    workingHours: {
      start: num(form, "workingHours.start"),
      end: num(form, "workingHours.end"),
      days: form.getAll("workingHours.days").map((d) => Number(d)),
    },
    holdMinutes: num(form, "holdMinutes"),
    cancellationHours: num(form, "cancellationHours"),
    paymentBalanceDaysBefore: num(form, "paymentBalanceDaysBefore"),
    services: Object.fromEntries(
      SERVICES.map((s) => [
        s.slug,
        {
          prices: Object.fromEntries(s.durations.map((d) => [String(d), num(form, `services.${s.slug}.prices.${d}`)])),
          ...(s.splitAllowed ? { advancePct: num(form, `services.${s.slug}.advancePct`) } : {}),
        },
      ]),
    ),
  };
  const parsed = settingsSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: FieldErrors = {};
    for (const issue of parsed.error.issues) {
      const path = issue.path.join(".");
      fieldErrors[path] ??= issue.message;
    }
    return { ok: false, fieldErrors };
  }
  return { ok: true, value: parsed.data as BusinessSettings };
}

export type { ServiceLookup };

/** Catalog services with the editable prices / advance applied — the injectable price source for quotes. */
export function serviceLookup(settings: Pick<BusinessSettings, "services">): ServiceLookup {
  return (slug) => {
    const base = getService(slug);
    if (!base) return undefined;
    const o = settings.services[slug];
    if (!o) return base;
    return { ...base, prices: { ...base.prices, ...o.prices }, ...(base.splitAllowed && o.advancePct ? { advancePct: o.advancePct } : {}) };
  };
}

/** Form field name → input value(s); names are the dotted settings paths. */
export type FormValues = Record<string, string | string[]>;

export function flattenSettings(settings: BusinessSettings): FormValues {
  const out: FormValues = {
    whatsappNumber: settings.whatsappNumber,
    contactEmail: settings.contactEmail,
    "officeAddress.hi": settings.officeAddress.hi,
    "officeAddress.en": settings.officeAddress.en,
    "workingHours.start": String(settings.workingHours.start),
    "workingHours.end": String(settings.workingHours.end),
    "workingHours.days": settings.workingHours.days.map(String),
    holdMinutes: String(settings.holdMinutes),
    cancellationHours: String(settings.cancellationHours),
    paymentBalanceDaysBefore: String(settings.paymentBalanceDaysBefore),
  };
  for (const s of SERVICES) {
    const o = settings.services[s.slug];
    for (const d of s.durations) out[`services.${s.slug}.prices.${d}`] = String(o?.prices[d] ?? s.prices[d] ?? "");
    if (s.splitAllowed) out[`services.${s.slug}.advancePct`] = String(o?.advancePct ?? s.advancePct ?? 50);
  }
  return out;
}

/** The raw submission, so a rejected save re-renders exactly what the admin typed. */
export function formValuesFrom(form: { keys(): Iterable<string>; getAll(name: string): FormDataEntryValue[] }): FormValues {
  const out: FormValues = {};
  for (const k of new Set(form.keys())) {
    if (k.startsWith("$")) continue; // React's internal action fields
    const v = form.getAll(k).filter((x): x is string => typeof x === "string");
    out[k] = k === "workingHours.days" ? v : (v[0] ?? "");
  }
  out["workingHours.days"] ??= [];
  return out;
}

/** Admin form action state (useActionState). */
export interface SettingsFormState {
  status: "idle" | "success" | "error";
  message?: string;
  fieldErrors?: FieldErrors;
  values?: FormValues;
  submittedAt?: number;
}
