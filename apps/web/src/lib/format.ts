/**
 * AMX-023 — localized ₹ / IST formatting. Pure functions, safe on server and client.
 * Business time is always Asia/Kolkata (fixed +05:30), whatever the visitor's own zone is.
 */

export const IST_TIME_ZONE = "Asia/Kolkata";

/** "hi" -> hi-IN, everything else -> en-IN. Latin digits on purpose: prices and times stay scannable. */
export function intlLocale(locale: string): string {
  return locale === "en" ? "en-IN" : "hi-IN";
}

const cache = new Map<string, Intl.NumberFormat | Intl.DateTimeFormat>();

function numberFormat(locale: string, fractionDigits: number): Intl.NumberFormat {
  const key = `n|${locale}|${fractionDigits}`;
  let f = cache.get(key) as Intl.NumberFormat | undefined;
  if (!f) {
    f = new Intl.NumberFormat(intlLocale(locale), {
      style: "currency",
      currency: "INR",
      numberingSystem: "latn",
      minimumFractionDigits: fractionDigits,
      maximumFractionDigits: fractionDigits,
    });
    cache.set(key, f);
  }
  return f;
}

function dateFormat(locale: string, opts: Intl.DateTimeFormatOptions): Intl.DateTimeFormat {
  const key = `d|${locale}|${JSON.stringify(opts)}`;
  let f = cache.get(key) as Intl.DateTimeFormat | undefined;
  if (!f) {
    f = new Intl.DateTimeFormat(intlLocale(locale), { numberingSystem: "latn", ...opts, timeZone: IST_TIME_ZONE });
    cache.set(key, f);
  }
  return f;
}

function toDate(date: Date | string): Date | null {
  const d = date instanceof Date ? date : new Date(date);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** ₹ with Indian digit grouping: formatINR(100000, "hi") -> "₹1,00,000". Paise are shown only when present. */
export function formatINR(amount: number, locale: string): string {
  if (!Number.isFinite(amount)) return "";
  return numberFormat(locale, Number.isInteger(amount) ? 0 : 2).format(amount);
}

/** Plain number with Indian grouping (no currency), e.g. stats: 10000 -> "10,000". */
export function formatNumber(value: number, locale: string, fractionDigits = 0): string {
  if (!Number.isFinite(value)) return "";
  const key = `p|${locale}|${fractionDigits}`;
  let f = cache.get(key) as Intl.NumberFormat | undefined;
  if (!f) {
    f = new Intl.NumberFormat(intlLocale(locale), {
      numberingSystem: "latn",
      minimumFractionDigits: fractionDigits,
      maximumFractionDigits: fractionDigits,
    });
    cache.set(key, f);
  }
  return f.format(value);
}

/** Calendar date in IST. Default "31 अक्टूबर 2026" / "31 October 2026"; pass opts to change the parts. */
export function formatDateIST(date: Date | string, locale: string, opts?: Intl.DateTimeFormatOptions): string {
  const d = toDate(date);
  if (!d) return "";
  return dateFormat(locale, opts ?? { day: "numeric", month: "long", year: "numeric" }).format(d);
}

/** 24-hour IST clock time, "10:00" — the same style the booking slot pills use. */
export function formatTimeIST(date: Date | string, locale: string): string {
  const d = toDate(date);
  if (!d) return "";
  return dateFormat(locale, { hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(d);
}

/** Slot label "10:00 – 11:00" (IST, en dash with thin spacing as in design.md §5.7). */
export function formatSlotRange(start: Date | string, end: Date | string, locale: string): string {
  const a = formatTimeIST(start, locale);
  const b = formatTimeIST(end, locale);
  if (!a || !b) return "";
  return `${a} – ${b}`;
}

/** Short weekday name for a JS weekday number (0 = Sunday): "सोम" / "Mon". */
export function formatWeekday(day: number, locale: string, style: "short" | "long" = "short"): string {
  // 2024-01-07 was a Sunday; noon UTC is the same calendar day in IST.
  const d = new Date(Date.UTC(2024, 0, 7 + (((day % 7) + 7) % 7), 12));
  return dateFormat(locale, { weekday: style }).format(d);
}
