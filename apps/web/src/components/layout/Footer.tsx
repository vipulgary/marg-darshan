import { getLocale, getTranslations } from "next-intl/server";
import { AuroraBackground } from "@/components/effects";
import { BrandMark } from "./BrandMark";
import { NewsletterSignup } from "@/components/newsletter/NewsletterSignup";
import { SETTINGS, getService, pick } from "@/content/catalog";
import { Link } from "@/i18n/navigation";
import { formatWeekday } from "@/lib/format";
import { buildWhatsAppUrl, whatsappMessage } from "@/lib/whatsapp";
import { IconClock, IconExternal, IconMapPin, IconWhatsApp } from "./icons";
import { LanguageToggle } from "./LanguageToggle";
import { SERVICE_ROUTES } from "./routes";
import { Icon } from "@/components/icons";

const QUICK_LINKS = [
  { href: "/free-kundali", key: "kundali" },
  { href: "/shop", key: "shop" },
  { href: "/newsletter", key: "newsletter" },
  { href: "/birth-time-finder", key: "birthTime" },
  { href: "/about-jyotish", key: "about" },
  { href: "/contact", key: "contact" },
  { href: "/faq", key: "faq" },
  { href: "/pricing", key: "pricing" },
] as const;

const LEGAL_LINKS = [
  { href: "/privacy", key: "privacy" },
  { href: "/terms", key: "terms" },
  { href: "/refund-policy", key: "refund" },
] as const;

const linkClass =
  "inline-flex min-h-11 items-center rounded-sm text-[15px] text-ink-2 transition-colors hover:text-gold-300 focus-visible:ring-focus md:pointer-fine:min-h-9";

const pad = (h: number) => `${String(h).padStart(2, "0")}:00`;

/** design.md §11.1 #13 — aurora top edge, newsletter, 4 columns, language toggle repeated, AGPL link. */
export async function Footer() {
  const locale = await getLocale();
  const t = await getTranslations("layout");
  const { days, start, end } = SETTINGS.workingHours;
  const dayRange = `${formatWeekday(days[0], locale)}–${formatWeekday(days[days.length - 1], locale)}`;
  const waHref = buildWhatsAppUrl({ message: whatsappMessage("general", locale) });

  return (
    <footer className="md-band theme-dark relative mt-16 overflow-hidden border-t border-line-subtle bg-night-1">
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-56 [mask-image:linear-gradient(180deg,#000,transparent)]">
        <div aria-hidden className="[.light_&]:hidden">
          <AuroraBackground />
        </div>
      </div>

      <div className="container-page relative">
        <section
          aria-labelledby="footer-newsletter"
          className="grid gap-6 border-b border-line-subtle py-12 md:grid-cols-2 md:items-center md:py-14"
        >
          <div>
            <h2 id="footer-newsletter" className="font-display text-[clamp(24px,3vw,32px)] leading-tight">
              {t("footer.newsletterTitle")}
            </h2>
            <p className="mt-2 max-w-[52ch] text-ink-2">{t("footer.newsletterLead")}</p>
          </div>
          <NewsletterSignup variant="footer" />
        </section>

        <div className="grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div className="flex flex-col gap-4">
            <Link href="/" aria-label={t("brand.home")} className="flex min-h-11 w-fit items-center gap-2 rounded-sm font-display text-2xl text-ink-1 focus-visible:ring-focus">
              <BrandMark size={48} />
            </Link>
            <p className="max-w-[44ch] text-[15px] text-ink-3">{t("footer.blurb")}</p>
            <a
              href={waHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-11 w-fit items-center gap-2 rounded-full bg-[#25D366] px-5 text-[15px] font-semibold text-[#052e16] transition-all hover:-translate-y-0.5 hover:bg-[#1EBE5A] focus-visible:ring-focus [.light_&]:bg-[#fff3e8] [.light_&]:text-[#8e2f1f] [.light_&]:shadow-[0_8px_24px_-12px_rgba(0,0,0,.45)] [.light_&]:hover:bg-white"
            >
              <IconWhatsApp size={20} />
              {t("cta.whatsapp")}
            </a>
            <dl className="grid gap-3 text-sm text-ink-2">
              <div className="flex gap-2">
                <IconMapPin size={18} className="mt-0.5 shrink-0 text-gold-300" />
                <div>
                  <dt className="font-semibold text-ink-1">{t("footer.office")}</dt>
                  <dd>{pick(SETTINGS.officeAddress, locale)}</dd>
                </div>
              </div>
              <div className="flex gap-2">
                <IconClock size={18} className="mt-0.5 shrink-0 text-gold-300" />
                <div>
                  <dt className="font-semibold text-ink-1">{t("footer.hours")}</dt>
                  <dd>{t("footer.hoursValue", { days: dayRange, start: pad(start), end: pad(end) })}</dd>
                </div>
              </div>
            </dl>
          </div>

          <nav aria-labelledby="footer-services">
            <h2 id="footer-services" className="mb-3 text-[13px] font-semibold text-gold-300 [:lang(en)_&]:uppercase [:lang(en)_&]:tracking-[0.16em]">
              {t("footer.services")}
            </h2>
            <ul>
              {SERVICE_ROUTES.map((s) => {
                const service = getService(s.slug);
                return service ? (
                  <li key={s.slug}>
                    <Link href={s.href} className={linkClass}>
                      {pick(service.title, locale)}
                    </Link>
                  </li>
                ) : null;
              })}
            </ul>
          </nav>

          <nav aria-labelledby="footer-quick">
            <h2 id="footer-quick" className="mb-3 text-[13px] font-semibold text-gold-300 [:lang(en)_&]:uppercase [:lang(en)_&]:tracking-[0.16em]">
              {t("footer.quickLinks")}
            </h2>
            <ul>
              {QUICK_LINKS.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className={linkClass}>
                    {t(`nav.${l.key}`)}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-labelledby="footer-legal">
            <h2 id="footer-legal" className="mb-3 text-[13px] font-semibold text-gold-300 [:lang(en)_&]:uppercase [:lang(en)_&]:tracking-[0.16em]">
              {t("footer.legal")}
            </h2>
            <ul>
              {LEGAL_LINKS.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className={linkClass}>
                    {t(`footer.${l.key}`)}
                  </Link>
                </li>
              ))}
              <li>
                {/* AGPL §13: the engine source must be public — set NEXT_PUBLIC_ENGINE_SOURCE_URL before launch. */}
                <a href={process.env.NEXT_PUBLIC_ENGINE_SOURCE_URL ?? "https://github.com/"} target="_blank" rel="noopener noreferrer" lang="en" className={`${linkClass} gap-1.5`}>
                  {t("footer.agpl")}
                  <IconExternal size={14} />
                  <span className="sr-only">{t("footer.newTab")}</span>
                </a>
              </li>
            </ul>
            <div className="mt-6 flex flex-col gap-2">
              <span className="text-sm text-ink-3">{t("footer.language")}</span>
              <LanguageToggle />
            </div>
          </nav>
        </div>

        <div className="flex flex-col gap-2 border-t border-line-subtle py-6 text-xs text-ink-3 md:flex-row md:items-center md:justify-between">
          <p>{t("footer.rights", { year: new Date().getFullYear() })}</p>
          <p className="max-w-[70ch]">{t("footer.disclaimer")}</p>
        </div>
      </div>
    </footer>
  );
}
