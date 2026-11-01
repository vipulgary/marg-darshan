import type { Metadata } from "next";
import { PRODUCTS, SETTINGS, type Service, pick } from "@/content/catalog";
import type { FaqItem } from "@/content/faq";
import { JYOTISH } from "@/content/jyotish";

/** AMX-038: shared SEO helpers — canonical URLs, hreflang alternates and JSON-LD builders. */

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
export const SITE_NAME = "Marg Darshan";
// TODO(client): replace with the real inbox before launch
export const CONTACT_EMAIL = process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? "namaste@astromax.example";

type SeoLocale = "hi" | "en";
const HREFLANG: Record<SeoLocale, string> = { hi: "hi-IN", en: "en-IN" };

/** Every indexable route (without locale prefix). Payment, kundali results and the design system stay out. */
export const PUBLIC_ROUTES = [
  "/",
  "/about-jyotish",
  "/shubh-samay",
  "/kundali-milan",
  "/numerology",
  "/services/astrology",
  "/services/vastu",
  "/services/gems",
  "/birth-time-finder",
  "/free-kundali",
  "/book-appointment",
  "/pricing",
  "/shop",
  ...PRODUCTS.map((p) => `/shop/${p.slug}`),
  "/newsletter",
  "/contact",
  "/faq",
  "/privacy",
  "/terms",
  "/refund-policy",
];

/** Hindi lives at "/", English under "/en" (localePrefix "as-needed"). */
export function localePath(locale: string, path: string): string {
  const clean = path === "/" ? "" : path;
  if (locale === "en") return `/en${clean}`;
  return clean || "/";
}

export const absoluteUrl = (path: string) => `${SITE_URL}${path === "/" ? "" : path}`;

/** hreflang map for a route — relative paths resolve against metadataBase from the root layout. */
export function languageAlternates(path: string, absolute = false): Record<string, string> {
  const fmt = (p: string) => (absolute ? absoluteUrl(p) : p);
  return {
    [HREFLANG.hi]: fmt(localePath("hi", path)),
    [HREFLANG.en]: fmt(localePath("en", path)),
    "x-default": fmt(localePath("hi", path)),
  };
}

export function pageMetadata({
  locale,
  path,
  title,
  description,
  noIndex,
}: {
  locale: string;
  path: string;
  title: string;
  description: string;
  noIndex?: boolean;
}): Metadata {
  const url = localePath(locale, path);
  // No openGraph/twitter `images` here on purpose: page-level config metadata would override the
  // colocated opengraph-image / twitter-image files (AMX-038) because it resolves at a deeper segment.
  return {
    title,
    description,
    alternates: { canonical: url, languages: languageAlternates(path) },
    openGraph: {
      title,
      description,
      url,
      siteName: SITE_NAME,
      type: "website",
      locale: locale === "en" ? "en_IN" : "hi_IN",
      alternateLocale: locale === "en" ? ["hi_IN"] : ["en_IN"],
    },
    twitter: { card: "summary_large_image", title, description },
    ...(noIndex ? { robots: { index: false, follow: false } } : {}),
  };
}

/** "<page> | Marg Darshan" — the root layout title is not a template, so pages compose their own. */
export const withBrand = (title: string) => `${title} | ${SITE_NAME}`;

/* ---------- JSON-LD (schema.org) ---------- */

type JsonLd = Record<string, unknown>;

const orgId = `${SITE_URL}/#business`;
const personId = `${SITE_URL}/#jyotish`;

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const hh = (h: number) => `${String(h).padStart(2, "0")}:00`;

export function businessJsonLd(locale: string): JsonLd {
  const { workingHours } = SETTINGS;
  return {
    "@context": "https://schema.org",
    "@type": ["ProfessionalService", "LocalBusiness"],
    "@id": orgId,
    name: SITE_NAME,
    description: pick(
      {
        hi: "वैदिक ज्योतिष, वास्तु शास्त्र और रत्न परामर्श — ऑनलाइन और व्यक्तिगत।",
        en: "Vedic astrology, Vastu Shastra and gemstone consulting — online and in person.",
      },
      locale,
    ),
    url: absoluteUrl(localePath(locale, "/")),
    email: CONTACT_EMAIL,
    telephone: `+${SETTINGS.whatsappNumber.replace(/\D/g, "")}`,
    // TODO(client): replace with the structured office address once supplied
    address: { "@type": "PostalAddress", streetAddress: pick(SETTINGS.officeAddress, locale), addressCountry: "IN" },
    areaServed: "IN",
    availableLanguage: ["hi", "en"],
    priceRange: "₹₹",
    currenciesAccepted: "INR",
    paymentAccepted: "UPI, Credit Card, Debit Card, Net Banking",
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: workingHours.days.map((d) => `https://schema.org/${DAY_NAMES[d]}`),
        opens: hh(workingHours.start),
        closes: hh(workingHours.end),
      },
    ],
    founder: { "@id": personId },
  };
}

export function personJsonLd(locale: string): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    "@id": personId,
    name: pick(JYOTISH.name, locale),
    jobTitle: pick(JYOTISH.role, locale),
    description: pick(JYOTISH.shortBio, locale),
    url: absoluteUrl(localePath(locale, "/about-jyotish")),
    knowsAbout: ["Vedic astrology", "Jyotish", "Vastu Shastra", "Gemstones", "Birth-time rectification"],
    knowsLanguage: ["hi", "en"],
    worksFor: { "@id": orgId },
  };
}

export function serviceJsonLd(service: Service, locale: string): JsonLd {
  const prices = Object.values(service.prices);
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name: pick(service.title, locale),
    description: pick(service.summary, locale),
    serviceType: service.title.en,
    url: absoluteUrl(localePath(locale, `/services/${service.slug}`)),
    provider: { "@id": orgId },
    areaServed: "IN",
    availableChannel: [
      { "@type": "ServiceChannel", name: "Online (Zoom)", serviceUrl: absoluteUrl(localePath(locale, "/book-appointment")) },
      { "@type": "ServiceChannel", name: "In person" },
    ],
    offers: {
      "@type": "AggregateOffer",
      priceCurrency: "INR",
      lowPrice: Math.min(...prices),
      highPrice: Math.max(...prices),
      offerCount: prices.length,
    },
  };
}

export function faqJsonLd(items: FaqItem[], locale: string): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((f) => ({
      "@type": "Question",
      name: pick(f.q, locale),
      acceptedAnswer: { "@type": "Answer", text: pick(f.a, locale) },
    })),
  };
}

export function breadcrumbJsonLd(locale: string, items: { name: string; path: string }[]): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      item: absoluteUrl(localePath(locale, it.path)),
    })),
  };
}

/** Serialise for a <script type="application/ld+json"> — escapes "<" so content can't close the tag. */
export const serializeJsonLd = (data: JsonLd | JsonLd[]) => JSON.stringify(data).replace(/</g, "\\u003c");
