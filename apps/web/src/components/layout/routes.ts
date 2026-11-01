import { stripLocale } from "@/lib/whatsapp";

/** Route rules for the layout shell. Pathnames may or may not carry the /en prefix. */

export const SERVICE_ROUTES = [
  { slug: "astrology", href: "/services/astrology" },
  { slug: "vastu", href: "/services/vastu" },
  { slug: "gems", href: "/services/gems" },
  // Rectification has its own guided page rather than a /services/* page.
  { slug: "birth-time", href: "/birth-time-finder" },
] as const;

export const PRIMARY_NAV = [
  { href: "/free-kundali", key: "kundali" },
  { href: "/kundali-milan", key: "milan" },
  { href: "/shubh-samay", key: "muhurat" },
  { href: "/shop", key: "shop" },
  // Shown in the top bar only on very wide screens; always in the mobile menu and footer.
  { href: "/pricing", key: "pricing", wide: true },
  { href: "/about-jyotish", key: "about", wide: true },
] as const;

export function isActivePath(pathname: string, href: string): boolean {
  const path = stripLocale(pathname);
  if (href === "/") return path === "/";
  return path === href || path.startsWith(`${href}/`);
}

export function isServicesPath(pathname: string): boolean {
  return SERVICE_ROUTES.some((s) => isActivePath(pathname, s.href)) || isActivePath(pathname, "/services");
}

/** design.md §6.6 — the sticky bar is hidden where the page has its own bottom CTA (funnel, checkout). */
export function hidesMobileCtaBar(pathname: string): boolean {
  return isActivePath(pathname, "/book-appointment") || isActivePath(pathname, "/payment");
}

/** Final Plan §4.6 — WhatsApp float everywhere except checkout. */
export function hidesWhatsAppFloat(pathname: string): boolean {
  return isActivePath(pathname, "/payment");
}

const PROBLEM_FOR_PATH: [string, string][] = [
  ["/services/vastu", "vastu-residential"],
  ["/services/gems", "gemstone"],
  ["/shop", "gemstone"],
  ["/birth-time-finder", "birth-time-unknown"],
];

/** Booking link that preselects a problem when the current page implies one. */
export function bookingHrefFor(pathname: string): string {
  const match = PROBLEM_FOR_PATH.find(([prefix]) => isActivePath(pathname, prefix));
  return match ? `/book-appointment?problem=${match[1]}` : "/book-appointment";
}

/** Product slug when on /shop/<slug>, for a product-specific WhatsApp message. */
export function shopSlugFromPath(pathname: string): string | null {
  const m = /^\/shop\/([^/?#]+)/.exec(stripLocale(pathname));
  return m ? decodeURIComponent(m[1]) : null;
}
