import { SETTINGS } from "@/content/catalog";

/**
 * AMX-100 — wa.me deep links with page- and language-aware prefilled text (Final Plan §4.6).
 * Phase 2 (AMX-101) moves outbound notifications to the Cloud API; these links stay for inbound chats.
 */

export type WhatsAppContext = "general" | "astrology" | "vastu" | "gems" | "shop" | "kundali" | "booking" | "birthTime";

export interface WhatsAppExtra {
  productTitle?: string;
  sku?: string;
  problem?: string;
}

/** wa.me needs the full international number as digits only (no +, spaces or dashes). */
export function normalizeWhatsAppNumber(raw: string | undefined): string | null {
  const digits = (raw ?? "").replace(/\D/g, "");
  if (digits.length === 10) return `91${digits}`; // bare Indian mobile
  // Shorter means a placeholder such as "91XXXXXXXXXX" — better to open the chat picker than a wrong number.
  return digits.length >= 11 && digits.length <= 15 ? digits : null;
}

export function buildWhatsAppUrl({ number, message }: { number?: string; message: string }): string {
  const target = normalizeWhatsAppNumber(number ?? SETTINGS.whatsappNumber);
  const text = encodeURIComponent(message.trim());
  return target ? `https://wa.me/${target}?text=${text}` : `https://wa.me/?text=${text}`;
}

type Template = { hi: string; en: string };

const BASE: Record<WhatsAppContext, Template> = {
  general: {
    hi: "नमस्ते, मुझे Marg Darshan पर ज्योतिष परामर्श के बारे में जानकारी चाहिए।",
    en: "Hello, I'd like to know more about consultations at Marg Darshan.",
  },
  astrology: {
    hi: "नमस्ते, मुझे ज्योतिष परामर्श के बारे में जानकारी चाहिए।",
    en: "Hello, I'd like to know more about an astrology consultation.",
  },
  vastu: {
    hi: "नमस्ते, मुझे वास्तु परामर्श के बारे में जानकारी चाहिए।",
    en: "Hello, I'd like to know more about a Vastu consultation.",
  },
  gems: {
    hi: "नमस्ते, मुझे रत्न परामर्श के बारे में जानकारी चाहिए — मेरे लिए कौन सा रत्न सही रहेगा?",
    en: "Hello, I'd like gemstone guidance — which gemstone would suit me?",
  },
  shop: {
    hi: "नमस्ते, मुझे आपकी शॉप के रत्न और वस्तुओं के बारे में जानकारी चाहिए।",
    en: "Hello, I'd like to know more about the gemstones and items in your shop.",
  },
  kundali: {
    hi: "नमस्ते, मैंने मुफ्त कुंडली देखी है। मुझे अपनी कुंडली का विस्तृत विश्लेषण चाहिए।",
    en: "Hello, I've seen my free Kundali and would like a detailed reading.",
  },
  booking: {
    hi: "नमस्ते, मुझे परामर्श बुक करने में मदद चाहिए।",
    en: "Hello, I need help booking a consultation.",
  },
  birthTime: {
    hi: "नमस्ते, मुझे अपना सही जन्म समय नहीं पता। जन्म समय शोधन (Birth Time Rectification) के बारे में जानकारी चाहिए।",
    en: "Hello, I don't know my exact birth time. I'd like to know about Birth Time Rectification.",
  },
};

const PRODUCT: Template = {
  hi: "नमस्ते, मुझे \"{title}\" के बारे में जानकारी चाहिए।",
  en: "Hello, I'm interested in \"{title}\".",
};
const SKU: Template = { hi: "SKU: {sku}", en: "SKU: {sku}" };
const PROBLEM: Template = { hi: "मेरी समस्या: {problem}", en: "My concern: {problem}" };
const SHOP_ASK: Template = {
  hi: "कृपया मेरी कुंडली के अनुसार उपयुक्तता और मूल्य बताएं।",
  en: "Please advise on suitability for my chart and the price.",
};

const fill = (s: string, key: string, value: string) => s.replace(`{${key}}`, value.trim());

/** Prefilled chat text. Any locale other than "en" gets Hindi, matching the site default. */
export function whatsappMessage(context: WhatsAppContext, locale: string, extra?: WhatsAppExtra): string {
  const lang: keyof Template = locale === "en" ? "en" : "hi";
  const lines: string[] = [];
  const title = extra?.productTitle?.trim();

  if (context === "shop" && title) {
    lines.push(fill(PRODUCT[lang], "title", title));
  } else {
    lines.push(BASE[context]?.[lang] ?? BASE.general[lang]);
  }
  if (extra?.sku?.trim()) lines.push(fill(SKU[lang], "sku", extra.sku));
  if (extra?.problem?.trim()) lines.push(fill(PROBLEM[lang], "problem", extra.problem));
  if (context === "shop" && title) lines.push(SHOP_ASK[lang]);

  return lines.join("\n");
}

/** Picks the message context from a pathname (with or without the /en prefix). */
export function whatsappContextFromPath(pathname: string): WhatsAppContext {
  const path = stripLocale(pathname);
  if (path.startsWith("/services/astrology")) return "astrology";
  if (path.startsWith("/services/vastu")) return "vastu";
  if (path.startsWith("/services/gems")) return "gems";
  if (path.startsWith("/shop")) return "shop";
  if (path.startsWith("/free-kundali") || path.startsWith("/kundali")) return "kundali";
  if (path.startsWith("/book-appointment") || path.startsWith("/pricing")) return "booking";
  if (path.startsWith("/birth-time-finder")) return "birthTime";
  return "general";
}

export function stripLocale(pathname: string): string {
  const p = pathname.split(/[?#]/)[0] || "/";
  if (p === "/en" || p === "/hi") return "/";
  if (p.startsWith("/en/") || p.startsWith("/hi/")) return p.slice(3);
  return p;
}
