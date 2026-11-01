"use client";

import { useTranslations } from "next-intl";
import { BrandMark } from "./BrandMark";
import { useCallback, useEffect, useRef, useState } from "react";
import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/cn";
import { IconMenu } from "./icons";
import { AccountButton } from "./AccountButton";
import { LanguageToggle } from "./LanguageToggle";
import { ThemeToggle } from "./ThemeToggle";
import { MegaMenu } from "./MegaMenu";
import { MobileMenu } from "./MobileMenu";
import { PRIMARY_NAV, bookingHrefFor, isActivePath } from "./routes";
import { Icon } from "@/components/icons";

const navClass = (active: boolean) =>
  cn(
    "relative whitespace-nowrap rounded-sm py-1 text-[15px] font-medium transition-colors focus-visible:ring-focus",
    "after:absolute after:inset-x-0 after:-bottom-0.5 after:h-0.5 after:origin-center after:rounded-full after:bg-saffron-400 after:transition-transform after:duration-200",
    active ? "text-gold-300 after:scale-x-100" : "text-ink-2 after:scale-x-0 hover:text-ink-1 hover:after:scale-x-100",
  );

/** design.md §6.1–6.2 — sticky header, transparent → glass after 24px, mega-menu on desktop, sheet on mobile. */
export function Header() {
  const t = useTranslations("layout");
  const tRoot = useTranslations();
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const burgerRef = useRef<HTMLButtonElement>(null);
  const closeMenu = useCallback(() => setMenuOpen(false), []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", onScroll, { passive: true });
    const raf = requestAnimationFrame(onScroll);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  return (
    <header
      className={cn(
        "md-band theme-dark sticky top-0 z-40 h-[60px] border-b transition-[background-color,border-color,backdrop-filter] duration-200 md:h-[72px]",
        scrolled ? "border-line-subtle bg-night-0/72 backdrop-blur-[16px] backdrop-saturate-[1.4]" : "border-transparent",
      )}
    >
      <div className="container-page relative flex h-full items-center justify-between gap-3">
        <Link
          href="/"
          aria-label={t("brand.home")}
          className="flex min-h-11 shrink-0 items-center gap-2 rounded-sm font-display text-xl text-ink-1 focus-visible:ring-focus"
        >
          <BrandMark size={38} />
        </Link>

        <nav className="hidden xl:block" aria-label={t("nav.label")}>
          <ul className="flex items-center gap-5 2xl:gap-7">
            <MegaMenu navClass={navClass} />
            {PRIMARY_NAV.map((item) => {
              const active = isActivePath(pathname, item.href);
              return (
                <li key={item.href} className={"wide" in item ? "hidden 2xl:list-item" : undefined}>
                  <Link href={item.href} aria-current={active ? "page" : undefined} className={navClass(active)}>
                    {active && (
                      <Icon name="sparkle" size={9} animate="draw" className="absolute -top-2.5 left-1/2 -translate-x-1/2 text-gold-300" />
                    )}
                    {t(`nav.${item.key}`)}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <ThemeToggle />
          <LanguageToggle hint />
          <AccountButton className="hidden sm:inline-flex" />
          <Link
            href={bookingHrefFor(pathname)}
            className="relative hidden h-9 items-center rounded-full bg-grad-gold before:absolute before:-inset-y-1 before:inset-x-0 before:content-[''] px-3.5 text-sm font-semibold text-ink-ongold transition-all hover:-translate-y-0.5 hover:shadow-glow-gold focus-visible:ring-focus sm:inline-flex"
          >
            {tRoot("nav.book")}
          </Link>
          <button
            ref={burgerRef}
            type="button"
            onClick={() => setMenuOpen(true)}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            aria-label={t("mobile.open")}
            className="grid h-11 w-11 place-items-center rounded-full text-ink-1 hover:bg-white/6 focus-visible:ring-focus xl:hidden"
          >
            <IconMenu size={24} />
          </button>
        </div>
      </div>
      <MobileMenu id="mobile-menu" open={menuOpen} onClose={closeMenu} returnFocusRef={burgerRef} />
    </header>
  );
}
