import { hasLocale } from "next-intl";
import { getRequestConfig } from "next-intl/server";
import { routing } from "./routing";

// messages/<locale>/common.json is mounted at the root; every other file is mounted
// under its own name, e.g. messages/hi/booking.json -> t("booking.*").
export const NAMESPACES = ["layout", "home", "pages", "booking", "payment", "kundali", "shop", "newsletter", "birthTime", "panchang", "manage", "account", "report", "muhurat", "milan", "numerology"] as const;

type Messages = Record<string, unknown>;

function deepMerge(a: Messages, b: Messages): Messages {
  const out: Messages = { ...a };
  for (const [k, v] of Object.entries(b)) {
    const prev = out[k];
    out[k] =
      prev && typeof prev === "object" && v && typeof v === "object"
        ? deepMerge(prev as Messages, v as Messages)
        : v;
  }
  return out;
}

export async function loadMessages(locale: string): Promise<Messages> {
  let messages: Messages = (await import(`../../messages/${locale}/common.json`)).default;
  for (const ns of NAMESPACES) {
    const part: Messages = (await import(`../../messages/${locale}/${ns}.json`)).default;
    messages = deepMerge(messages, { [ns]: part });
  }
  return messages;
}

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested) ? requested : routing.defaultLocale;
  return { locale, messages: await loadMessages(locale), timeZone: "Asia/Kolkata" };
});
