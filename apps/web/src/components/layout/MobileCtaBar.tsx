"use client";

import { useLocale, useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { buildWhatsAppUrl, whatsappContextFromPath, whatsappMessage } from "@/lib/whatsapp";
import { IconWhatsApp } from "./icons";
import { bookingHrefFor, hidesMobileCtaBar } from "./routes";
import { Icon } from "@/components/icons";

/**
 * design.md §6.6 — fixed glass bar on mobile: WhatsApp + full-width "Book". The WhatsApp float is
 * merged into this bar on mobile. A spacer in normal flow keeps the footer from being covered.
 */
export function MobileCtaBar() {
  const t = useTranslations();
  const locale = useLocale();
  const pathname = usePathname();
  if (hidesMobileCtaBar(pathname)) return null;

  const waHref = buildWhatsAppUrl({ message: whatsappMessage(whatsappContextFromPath(pathname), locale) });

  return (
    <>
      <div aria-hidden className="h-[calc(64px+env(safe-area-inset-bottom))] md:hidden" />
      <nav
        aria-label={t("layout.cta.barLabel")}
        className="fixed inset-x-0 bottom-0 z-40 border-t border-line-subtle bg-night-0/72 pb-[env(safe-area-inset-bottom)] backdrop-blur-[16px] backdrop-saturate-[1.4] md:hidden"
      >
        <div className="container-page flex h-16 items-center gap-3">
          <a
            href={waHref}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={t("layout.cta.whatsapp")}
            className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#25D366] text-[#052e16] transition-transform active:scale-[.97] focus-visible:ring-focus"
          >
            <IconWhatsApp size={22} />
          </a>
          <Link
            href={bookingHrefFor(pathname)}
            className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-full bg-grad-gold px-5 text-base font-semibold text-ink-ongold shadow-e1 transition-transform active:scale-[.97] focus-visible:ring-focus"
          >
            {t("cta.book")} <Icon name="arrow-right" size={18} />
          </Link>
        </div>
      </nav>
    </>
  );
}
