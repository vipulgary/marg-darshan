"use client";

import { useLocale, useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { useEffect, useId, useState, useTransition } from "react";
import { motion } from "motion/react";
import { usePathname, useRouter } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { cn } from "@/lib/cn";

const HINT_KEY = "amx-lang-hint-seen";

/**
 * design.md §6.3 — always-visible segmented [ अ हिंदी | A English ] toggle.
 * `hint` shows the one-time "Switch to English" tooltip (use it on the header instance only).
 */
export function LanguageToggle({ className, hint = false }: { className?: string; hint?: boolean }) {
  const t = useTranslations("language");
  const locale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const [pending, startTransition] = useTransition();
  const [showHint, setShowHint] = useState(false);
  const id = useId();

  useEffect(() => {
    if (!hint) return;
    let seen = true;
    try {
      seen = localStorage.getItem(HINT_KEY) === "1";
      if (!seen) localStorage.setItem(HINT_KEY, "1");
    } catch {
      // Storage blocked: skip the hint rather than show it on every page.
    }
    if (seen) return;
    const show = window.setTimeout(() => setShowHint(true), 1200);
    const hide = window.setTimeout(() => setShowHint(false), 6200);
    return () => {
      window.clearTimeout(show);
      window.clearTimeout(hide);
    };
  }, [hint]);

  const switchTo = (next: Locale) => {
    setShowHint(false);
    if (next === locale) return;
    // Read the query at click time (useSearchParams would force a Suspense boundary in the root layout).
    const query = Object.fromEntries(new URLSearchParams(window.location.search));
    startTransition(() => {
      // Client-side navigation keeps React state; drafts live in sessionStorage anyway.
      // @ts-expect-error -- params of the current route always match the pathname
      router.replace({ pathname, params, query }, { locale: next, scroll: false });
    });
  };

  const options: { value: Locale; full: string; short: string; glyph: string }[] = [
    { value: "hi", full: t("hi"), short: t("hiShort"), glyph: "अ" },
    { value: "en", full: t("en"), short: t("enShort"), glyph: "A" },
  ];
  const other = locale === "hi" ? "en" : "hi";

  return (
    <div className={cn("relative inline-flex", className)}>
      <div
        role="radiogroup"
        aria-label={t("label")}
        className={cn(
          "relative inline-flex h-9 items-center rounded-full border border-line bg-night-s2 p-0.5",
          pending && "opacity-70",
        )}
      >
        {options.map((o) => {
          const active = o.value === locale;
          return (
            <button
              key={o.value}
              type="button"
              role="radio"
              aria-checked={active}
              lang={o.value}
              onClick={() => switchTo(o.value)}
              className={cn(
                "relative z-10 flex h-8 min-w-11 items-center justify-center gap-1.5 rounded-full px-3 text-sm font-semibold transition-colors focus-visible:ring-focus",
                "before:absolute before:-inset-y-1.5 before:inset-x-0 before:content-['']",
                active ? "text-ink-ongold" : "text-ink-2 hover:text-ink-1",
              )}
            >
              {active && (
                <motion.span
                  layoutId={`lang-indicator-${id}`}
                  transition={{ type: "spring", stiffness: 320, damping: 30 }}
                  className="absolute inset-0 -z-10 rounded-full bg-grad-gold"
                />
              )}
              <span aria-hidden className="hidden sm:inline">
                {o.glyph}
              </span>
              <span className="hidden sm:inline">{o.full}</span>
              <span className="sm:hidden">{o.short}</span>
            </button>
          );
        })}
      </div>
      {showHint && (
        <button
          type="button"
          lang={other}
          onClick={() => switchTo(other)}
          className="absolute right-0 top-[calc(100%+10px)] z-50 whitespace-nowrap rounded-sm bg-night-s3 px-3 py-2 text-[13px] font-medium text-ink-1 shadow-e2 focus-visible:ring-focus before:absolute before:-top-1 before:right-6 before:h-2 before:w-2 before:rotate-45 before:bg-night-s3 before:content-['']"
        >
          {t("hint")}
        </button>
      )}
    </div>
  );
}
