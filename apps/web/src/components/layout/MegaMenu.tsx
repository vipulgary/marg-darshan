"use client";

import { AnimatePresence, motion } from "motion/react";
import { useLocale, useTranslations } from "next-intl";
import { type KeyboardEvent, useEffect, useId, useRef, useState } from "react";
import { getService, pick } from "@/content/catalog";
import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/cn";
import { formatINR } from "@/lib/format";
import { IconArrowRight, IconAstrology, IconChevronDown, IconGem, IconHourglass, IconVastu } from "./icons";
import { SERVICE_ROUTES, isActivePath, isServicesPath } from "./routes";
import { Icon } from "@/components/icons";

const TOOLS = [
  { key: "kundali", href: "/free-kundali", icon: "kundali" },
  { key: "milan", href: "/kundali-milan", icon: "rings" },
  { key: "shubh", href: "/shubh-samay", icon: "clock" },
  { key: "numerology", href: "/numerology", icon: "star" },
  { key: "birthTime", href: "/birth-time-finder", icon: "hourglass" },
] as const;

export const SERVICE_ICONS = { astrology: IconAstrology, vastu: IconVastu, gems: IconGem, "birth-time": IconHourglass } as const;

/** design.md §6.2 — "Services" disclosure opening a glass mega-menu panel. Esc / outside click / focus-out close it. */
export function MegaMenu({ navClass }: { navClass: (active: boolean) => string }) {
  const t = useTranslations("layout");
  const locale = useLocale();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLLIElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const panelId = useId();
  const active = isServicesPath(pathname);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const onButtonKey = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      requestAnimationFrame(() => panelRef.current?.querySelector<HTMLElement>("a")?.focus());
    }
  };

  const close = () => setOpen(false);

  return (
    <li
      ref={rootRef}
      onBlur={(e) => {
        if (!rootRef.current?.contains(e.relatedTarget as Node | null)) setOpen(false);
      }}
    >
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={onButtonKey}
        className={cn(navClass(active || open), "inline-flex items-center gap-1")}
      >
        {active && (
          <Icon name="sparkle" size={9} animate="draw" className="absolute -top-2.5 left-1/2 -translate-x-1/2 text-gold-300" />
        )}
        {t("nav.services")}
        <IconChevronDown size={16} className={cn("transition-transform duration-200", open && "rotate-180")} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            ref={panelRef}
            id={panelId}
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.16, ease: [0.2, 0.8, 0.2, 1] }}
            className="md-panel absolute inset-x-4 top-[calc(100%+8px)] z-50 mx-auto max-w-[1120px] rounded-xl border border-line bg-night-s1/92 p-4 shadow-e2 backdrop-blur-[18px] md:inset-x-6"
          >
            <p className="px-2 pb-3 text-[13px] font-semibold text-gold-300">{t("mega.intro")}</p>
            <ul className="grid grid-cols-2 gap-3 xl:grid-cols-4">
              {SERVICE_ROUTES.map((s) => {
                const service = getService(s.slug);
                if (!service) return null;
                const Icon = SERVICE_ICONS[s.slug];
                const from = Math.min(...Object.values(service.prices));
                const current = isActivePath(pathname, s.href);
                return (
                  <li key={s.slug}>
                    <Link
                      href={s.href}
                      onClick={close}
                      aria-current={current ? "page" : undefined}
                      className={cn(
                        "group flex h-full flex-col gap-2 rounded-lg border p-4 transition-all duration-200 ease-out focus-visible:ring-focus",
                        "hover:-translate-y-0.5 hover:border-line-hover hover:bg-night-s2",
                        current ? "border-line-gold bg-saffron-500/8" : "border-line-subtle",
                      )}
                    >
                      <span className="grid h-10 w-10 place-items-center rounded-md bg-saffron-500/14 text-gold-300">
                        <Icon size={22} />
                      </span>
                      <span className="text-[16px] font-semibold text-ink-1">{pick(service.title, locale)}</span>
                      <span className="line-clamp-2 text-sm leading-snug text-ink-3">{pick(service.summary, locale)}</span>
                      <span className="mt-auto flex items-center justify-between gap-2 pt-1 text-xs font-semibold">
                        <span className="rounded-sm bg-white/6 px-2 py-1 text-ink-2">
                          {t("mega.fromPrice", { price: formatINR(from, locale) })}
                        </span>
                        <span className="inline-flex items-center gap-1 text-violet-300 group-hover:text-gold-300">
                          {t("mega.learnMore")}
                          <IconArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
                        </span>
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
            <p className="px-2 pb-2 pt-4 text-[13px] font-semibold text-gold-300">{t("mega.toolsIntro")}</p>
            <ul className="grid grid-cols-2 gap-2 lg:grid-cols-5">
              {TOOLS.map((tool) => (
                <li key={tool.key}>
                  <Link
                    href={tool.href}
                    onClick={close}
                    aria-current={isActivePath(pathname, tool.href) ? "page" : undefined}
                    className="group flex h-full items-start gap-3 rounded-lg border border-line-subtle p-3 transition-all duration-200 hover:-translate-y-0.5 hover:border-line-hover hover:bg-night-s2 focus-visible:ring-focus"
                  >
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-saffron-500/14 text-gold-300">
                      <Icon name={tool.icon} size={18} animate="hover" />
                    </span>
                    <span className="flex min-w-0 flex-col">
                      <span className="flex items-center gap-1.5 text-sm font-semibold text-ink-1">
                        {t(`mega.tools.${tool.key}.title`)}
                        <span className="rounded-full bg-success/14 px-1.5 text-[10px] font-bold uppercase text-success">{t("mega.free")}</span>
                      </span>
                      <span className="text-xs leading-snug text-ink-3">{t(`mega.tools.${tool.key}.desc`)}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-line-subtle px-2 pt-3 text-sm">
              <Link href="/pricing" onClick={close} className="rounded-sm py-1 text-violet-300 hover:text-gold-300 focus-visible:ring-focus">
                {t("mega.allPricing")} <Icon name="arrow-right" size={16} className="inline-block align-[-3px]" />
              </Link>
              <Link href="/free-kundali" onClick={close} className="rounded-sm py-1 text-gold-300 hover:text-gold-200 focus-visible:ring-focus">
                <Icon name="sparkle" size={14} className="mr-1 inline-block align-[-2px]" />{t("mega.kundaliPromo")}
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </li>
  );
}
