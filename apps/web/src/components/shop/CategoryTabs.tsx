import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/cn";
import { SHOP_FILTERS, type ShopFilter } from "@/lib/shop/catalog";

/** Plain links driven by ?category= so filtering works without JavaScript. */
export async function CategoryTabs({ active }: { active: ShopFilter }) {
  const t = await getTranslations("shop.categories");
  return (
    <nav
      aria-label={t("label")}
      className="sticky top-[60px] z-20 -mx-4 border-b border-line-subtle bg-night-0/80 px-4 py-3 backdrop-blur-md md:top-[72px] md:mx-0 md:rounded-lg md:border md:px-3"
    >
      <ul className="flex gap-2 overflow-x-auto [scrollbar-width:none]">
        {SHOP_FILTERS.map((f) => {
          const isActive = f === active;
          return (
            <li key={f} className="shrink-0">
              <Link
                href={f === "all" ? "/shop" : `/shop?category=${f}`}
                scroll={false}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "inline-flex h-11 items-center rounded-full px-5 text-[15px] font-medium transition-colors focus-visible:ring-focus",
                  isActive
                    ? "bg-grad-gold text-ink-ongold"
                    : "border border-line text-ink-2 hover:border-gold-300 hover:text-ink-1",
                )}
              >
                {t(f)}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
