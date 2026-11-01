"use client";

import { useTranslations } from "next-intl";
import { useSyncExternalStore } from "react";
import { cn } from "@/lib/cn";

/**
 * Dark is the brand default; light is an opt-in per visitor, stored in localStorage
 * and applied as `.light` on <html> by THEME_INIT_SCRIPT before first paint.
 */
export const THEME_KEY = "amx-theme";

export const THEME_INIT_SCRIPT = `try{if(localStorage.getItem("${THEME_KEY}")==="light")document.documentElement.classList.add("light")}catch(e){}`;

const listeners = new Set<() => void>();
const subscribe = (cb: () => void) => {
  listeners.add(cb);
  return () => listeners.delete(cb);
};
const isLight = () => document.documentElement.classList.contains("light");

export function ThemeToggle({ className }: { className?: string }) {
  const t = useTranslations("layout.theme");
  const light = useSyncExternalStore(subscribe, isLight, () => false);

  const toggle = () => {
    const next = !isLight();
    document.documentElement.classList.toggle("light", next);
    try {
      localStorage.setItem(THEME_KEY, next ? "light" : "dark");
    } catch {
      // Storage blocked: the switch still works for this page view.
    }
    listeners.forEach((l) => l());
  };

  const label = light ? t("toDark") : t("toLight");
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={label}
      title={label}
      className={cn(
        "group relative grid h-9 w-9 place-items-center rounded-full border before:absolute before:-inset-1.5 before:content-[''] border-line bg-night-s2 text-gold-300 transition-colors hover:border-line-gold hover:text-saffron-400 focus-visible:ring-focus",
        className,
      )}
    >
      {/* Sun and moon cross-fade with a quarter turn; stroke icons to match the icon set. */}
      <svg
        viewBox="0 0 24 24"
        aria-hidden
        className={cn(
          "absolute h-[18px] w-[18px] fill-none stroke-current stroke-[1.6] transition-all duration-300 ease-out [stroke-linecap:round]",
          light ? "rotate-0 scale-100 opacity-100" : "-rotate-90 scale-50 opacity-0",
        )}
      >
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
      </svg>
      <svg
        viewBox="0 0 24 24"
        aria-hidden
        className={cn(
          "absolute h-[18px] w-[18px] fill-none stroke-current stroke-[1.6] transition-all duration-300 ease-out [stroke-linecap:round] [stroke-linejoin:round]",
          light ? "rotate-90 scale-50 opacity-0" : "rotate-0 scale-100 opacity-100",
        )}
      >
        <path d="M20.5 14.5A8.5 8.5 0 0 1 9.5 3.5a8.5 8.5 0 1 0 11 11Z" />
      </svg>
    </button>
  );
}
