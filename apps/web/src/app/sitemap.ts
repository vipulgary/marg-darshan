import type { MetadataRoute } from "next";
import { PUBLIC_ROUTES, absoluteUrl, languageAlternates, localePath } from "@/lib/seo";

// AMX-038: every public route in both locales, each entry carrying its hreflang alternates.
const PRIORITY: Record<string, number> = { "/": 1, "/book-appointment": 0.9, "/free-kundali": 0.9 };

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  return PUBLIC_ROUTES.flatMap((path) =>
    (["hi", "en"] as const).map((locale) => ({
      url: absoluteUrl(localePath(locale, path)),
      lastModified,
      changeFrequency: path === "/" || path === "/newsletter" ? ("weekly" as const) : ("monthly" as const),
      priority: Math.round((PRIORITY[path] ?? (path.startsWith("/services/") ? 0.8 : 0.6)) * (locale === "hi" ? 100 : 90)) / 100,
      alternates: { languages: languageAlternates(path, true) },
    })),
  );
}
