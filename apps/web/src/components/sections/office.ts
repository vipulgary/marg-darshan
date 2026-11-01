import { SETTINGS } from "@/content/catalog";

const intlLocale = (locale: string) => (locale === "en" ? "en-IN" : "hi-IN");

// 7 Jan 2024 was a Sunday, so 7 + d is weekday d (0 = Sunday).
const dayName = (d: number, locale: string) =>
  new Intl.DateTimeFormat(intlLocale(locale), { weekday: "short", timeZone: "UTC" }).format(new Date(Date.UTC(2024, 0, 7 + d)));

const hour = (h: number) => `${String(h).padStart(2, "0")}:00`;

/** "Mon–Sat" / "सोम–शनि" when contiguous, else a comma list. */
export function officeDays(locale: string): string {
  const days = [...SETTINGS.workingHours.days].sort((a, b) => a - b);
  const contiguous = days.every((d, i) => i === 0 || d === days[i - 1] + 1);
  if (contiguous && days.length > 2) return `${dayName(days[0], locale)}–${dayName(days[days.length - 1], locale)}`;
  return days.map((d) => dayName(d, locale)).join(", ");
}

export const officeTime = () => `${hour(SETTINGS.workingHours.start)} – ${hour(SETTINGS.workingHours.end)} IST`;
