import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["hi", "en"],
  defaultLocale: "hi",
  // "/" is Hindi, "/en/..." is English.
  localePrefix: "as-needed",
  // Hindi stays the default even for English-language browsers; the cookie keeps an explicit choice.
  localeDetection: false,
});

export type Locale = (typeof routing.locales)[number];
