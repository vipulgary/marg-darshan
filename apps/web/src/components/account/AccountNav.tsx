"use client";

import { useTranslations } from "next-intl";
import { type IconName, Icon } from "@/components/icons";
import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/cn";

const ITEMS: { href: string; key: string; icon: IconName }[] = [
  { href: "/account", key: "overview", icon: "user" },
  { href: "/account/kundalis", key: "kundalis", icon: "kundali" },
  { href: "/account/bookings", key: "bookings", icon: "calendar" },
  { href: "/account/payments", key: "payments", icon: "file" },
  { href: "/account/profiles", key: "profiles", icon: "star" },
  { href: "/kundali-milan", key: "match", icon: "rings" },
  { href: "/account/settings", key: "settings", icon: "lock" },
];

export function AccountNav() {
  const t = useTranslations("account.nav");
  const pathname = usePathname();
  return (
    <nav aria-label={t("label")} className="-mx-4 overflow-x-auto px-4 lg:mx-0 lg:overflow-visible lg:px-0">
      <ul className="flex gap-2 lg:flex-col lg:gap-1">
        {ITEMS.map((item) => {
          const active = item.href === "/account" ? pathname === "/account" : pathname.startsWith(item.href);
          return (
            <li key={item.href} className="shrink-0">
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex min-h-11 items-center gap-2.5 rounded-full px-4 text-sm font-medium transition-colors focus-visible:ring-focus lg:rounded-md",
                  active ? "bg-saffron-500/12 text-gold-200" : "text-ink-2 hover:bg-night-s2 hover:text-ink-1",
                )}
              >
                <Icon name={item.icon} size={18} animate="none" />
                {t(item.key)}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
