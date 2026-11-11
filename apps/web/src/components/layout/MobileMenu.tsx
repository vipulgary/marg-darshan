"use client";

import { AnimatePresence, MotionConfig, motion } from "motion/react";
import { useLocale, useTranslations } from "next-intl";
import { type RefObject, useEffect, useRef, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { AuroraBackground } from "@/components/effects";
import { getService, pick } from "@/content/catalog";
import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/cn";
import { buildWhatsAppUrl, whatsappContextFromPath, whatsappMessage } from "@/lib/whatsapp";
import { IconClose, IconWhatsApp } from "./icons";
import { AccountButton } from "./AccountButton";
import { LanguageToggle } from "./LanguageToggle";
import { ThemeToggle } from "./ThemeToggle";
import { SERVICE_ICONS } from "./MegaMenu";
import { SERVICE_ROUTES, bookingHrefFor, isActivePath } from "./routes";
import { Icon } from "@/components/icons";

const MORE = [
  { href: "/", key: "home" },
  { href: "/free-kundali", key: "kundali" },
  { href: "/shop", key: "shop" },
  { href: "/pricing", key: "pricing" },
  { href: "/about-jyotish", key: "about" },
  { href: "/contact", key: "contact" },
  { href: "/faq", key: "faq" },
] as const;

const FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]),[tabindex]:not([tabindex="-1"])';
const noopSubscribe = () => () => {};

/**
 * design.md §6.6 — full-height sheet from the right over an aurora. Rendered in a portal because the
 * glass header's backdrop-filter would otherwise become the containing block for `position: fixed`.
 */
export function MobileMenu({
  open,
  onClose,
  id,
  returnFocusRef,
}: {
  open: boolean;
  onClose: () => void;
  id: string;
  returnFocusRef: RefObject<HTMLButtonElement | null>;
}) {
  const t = useTranslations("layout");
  const tRoot = useTranslations();
  const locale = useLocale();
  const pathname = usePathname();
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const isClient = useSyncExternalStore(noopSubscribe, () => true, () => false);

  useEffect(() => {
    if (!open) return;
    const panel = panelRef.current;
    const returnTo = returnFocusRef.current;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key !== "Tab" || !panel) return;
      const items = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((el) => el.getClientRects().length > 0);
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      const current = document.activeElement;
      if (!panel.contains(current)) {
        e.preventDefault();
        first.focus();
      } else if (e.shiftKey && current === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && current === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener("keydown", onKey);
      returnTo?.focus();
    };
  }, [open, onClose, returnFocusRef]);

  if (!isClient) return null;

  const waHref = buildWhatsAppUrl({ message: whatsappMessage(whatsappContextFromPath(pathname), locale) });
  const itemClass = (active: boolean) =>
    cn(
      "flex min-h-12 items-center rounded-md px-3 text-[20px] font-semibold transition-colors focus-visible:ring-focus",
      active ? "bg-saffron-500/10 text-gold-300" : "text-ink-1 hover:bg-white/6",
    );

  return createPortal(
    <MotionConfig reducedMotion="user">
      <AnimatePresence>
        {open && (
          <div className="fixed inset-0 z-[60] xl:hidden">
            <motion.div
              aria-hidden
              className="absolute inset-0 bg-night-0/70 backdrop-blur-[6px]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.24 }}
              onClick={onClose}
            />
            <motion.div
              ref={panelRef}
              id={id}
              role="dialog"
              aria-modal="true"
              aria-label={t("mobile.title")}
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 320, damping: 34 }}
              className="md-panel absolute inset-y-0 right-0 flex w-full max-w-[420px] flex-col overflow-hidden bg-night-0 shadow-e3"
            >
              <AuroraBackground intensity="strong" />
              <div className="relative flex items-center justify-between gap-3 border-b border-line-subtle px-4 py-3">
                <span className="flex items-center gap-2 font-display text-xl text-ink-1">
                  <Icon name="sparkle" size={20} className="text-gold-300" />
                  Marg Darshan
                </span>
                <button
                  ref={closeRef}
                  type="button"
                  onClick={onClose}
                  aria-label={t("mobile.close")}
                  className="grid h-11 w-11 place-items-center rounded-full text-ink-2 hover:bg-white/6 hover:text-ink-1 focus-visible:ring-focus"
                >
                  <IconClose size={22} />
                </button>
              </div>

              <div className="relative flex-1 overflow-y-auto overscroll-contain px-4 pb-6 pt-4">
                <div className="mb-5 flex items-center justify-between gap-3 rounded-lg border border-line-subtle bg-night-s1/60 p-3">
                  <span className="text-sm font-medium text-ink-2">{t("mobile.language")}</span>
                  <div className="flex items-center gap-2">
                    {/* The header drops its theme toggle below 400px; offer it here instead. */}
                    <div className="flex min-[400px]:hidden">
                      <ThemeToggle />
                    </div>
                    <LanguageToggle />
                  </div>
                  <AccountButton block className="mt-3" />
                </div>

                <nav aria-label={t("nav.label")}>
                  <p className="px-3 pb-2 text-[13px] font-semibold text-gold-300">{t("mobile.servicesHeading")}</p>
                  <ul className="mb-5 grid gap-1">
                    {SERVICE_ROUTES.map((s) => {
                      const service = getService(s.slug);
                      if (!service) return null;
                      const Icon = SERVICE_ICONS[s.slug];
                      const active = isActivePath(pathname, s.href);
                      return (
                        <li key={s.slug}>
                          <Link href={s.href} onClick={onClose} aria-current={active ? "page" : undefined} className={cn(itemClass(active), "gap-3 text-[18px]")}>
                            <Icon size={22} className="shrink-0 text-gold-300" />
                            {pick(service.title, locale)}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                  <p className="px-3 pb-2 text-[13px] font-semibold text-gold-300">{t("mobile.moreHeading")}</p>
                  <ul className="grid gap-1">
                    {MORE.map((item) => {
                      const active = isActivePath(pathname, item.href);
                      return (
                        <li key={item.href}>
                          <Link href={item.href} onClick={onClose} aria-current={active ? "page" : undefined} className={itemClass(active)}>
                            {t(`nav.${item.key}`)}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </nav>
              </div>

              <div className="relative grid gap-3 border-t border-line-subtle bg-night-0/60 px-4 pb-[calc(16px+env(safe-area-inset-bottom))] pt-4 backdrop-blur-[16px]">
                <Link
                  href={bookingHrefFor(pathname)}
                  onClick={onClose}
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-grad-gold px-6 font-semibold text-ink-ongold shadow-e1 focus-visible:ring-focus"
                >
                  {tRoot("cta.book")} <Icon name="arrow-right" size={18} />
                </Link>
                <a
                  href={waHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-[#25D366] px-6 font-semibold text-[#052e16] focus-visible:ring-focus"
                >
                  <IconWhatsApp size={20} />
                  {t("cta.whatsapp")}
                </a>
                <p className="text-center text-xs text-ink-3">{t("mobile.help")}</p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </MotionConfig>,
    document.body,
  );
}
