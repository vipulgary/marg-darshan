"use client";

import { useTranslations } from "next-intl";
import { Icon } from "@/components/icons";
import { Link, usePathname } from "@/i18n/navigation";
import { isActivePath } from "./routes";

/** Floating "Book a consultation" button (desktop). Replaces the WhatsApp float; hidden where booking is already the page. */
export function BookFloat() {
  const t = useTranslations("layout.cta");
  const pathname = usePathname();
  if (["/payment", "/book-appointment"].some((p) => isActivePath(pathname, p))) return null;

  return (
    <Link
      href="/book-appointment"
      aria-label={`${t("book")} — ${t("bookHint")}`}
      className="group fixed bottom-6 right-6 z-40 hidden h-14 items-center gap-0 rounded-full bg-grad-gold pl-4 pr-4 text-ink-ongold shadow-e2 transition-[transform,gap,padding] duration-200 ease-out hover:-translate-y-0.5 hover:gap-2 hover:pr-5 hover:shadow-glow-gold focus-visible:gap-2 focus-visible:pr-5 focus-visible:ring-focus md:inline-flex"
    >
      <Icon name="calendar" size={24} animate="hover" />
      <span className="max-w-0 overflow-hidden whitespace-nowrap text-[15px] font-semibold transition-[max-width] duration-300 ease-out group-hover:max-w-56 group-focus-visible:max-w-56">
        {t("book")}
      </span>
    </Link>
  );
}
