import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { PRODUCTS } from "@/content/catalog";
import { CategoryTabs } from "@/components/shop/CategoryTabs";
import { ProductCard } from "@/components/shop/ProductCard";
import { SectionTitle } from "@/components/ui/Display";
import { Link } from "@/i18n/navigation";
import { pageMetadata, withBrand } from "@/lib/seo";
import { filterProducts, parseShopFilter } from "@/lib/shop/catalog";
import { Icon } from "@/components/icons";

export async function generateMetadata({ params }: PageProps<"/[locale]/shop">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "shop.meta" });
  return pageMetadata({ locale, path: "/shop", title: withBrand(t("title")), description: t("description") });
}

export default async function ShopPage({ params, searchParams }: PageProps<"/[locale]/shop">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const filter = parseShopFilter((await searchParams).category);
  const t = await getTranslations("shop");
  const products = filterProducts(PRODUCTS, filter);

  return (
    <>
      <header className="relative overflow-hidden border-b border-line-subtle">
        <div aria-hidden className="absolute inset-0 bg-aurora opacity-50" />
        <div className="container-page relative py-14 md:py-20">
          <SectionTitle as="h1" align="left" eyebrow={t("header.eyebrow")} title={t("header.title")} highlight={t("header.highlight")} lead={t("header.lead")} />
          <ul className="mt-6 flex flex-wrap gap-2">
            {(["trust1", "trust2", "trust3"] as const).map((k) => (
              <li key={k} className="inline-flex h-9 items-center gap-1.5 rounded-full border border-line bg-night-s1/60 px-3.5 text-sm text-ink-2">
                <Icon name="sparkle" size={14} animate="draw" className="text-gold-300" />
                {t(`header.${k}`)}
              </li>
            ))}
          </ul>
        </div>
      </header>

      <div className="container-page flex flex-col gap-6 py-8 md:py-12">
        <CategoryTabs active={filter} />

        <aside className="flex flex-col gap-3 rounded-lg border border-line-gold bg-saffron-500/8 p-5 md:flex-row md:items-center md:justify-between md:p-6">
          <div className="flex gap-3">
            <Icon name="diya" size={28} animate="draw" className="shrink-0 text-gold-300" />
            <div>
              <p className="font-semibold text-ink-1">{t("note.title")}</p>
              <p className="mt-1 max-w-[68ch] text-sm text-ink-2">{t("note.body")}</p>
            </div>
          </div>
          <Link
            href="/book-appointment?problem=gemstone"
            className="inline-flex h-11 shrink-0 items-center justify-center gap-1.5 rounded-full border border-line-gold px-5 font-semibold text-gold-300 hover:bg-gold-300/8 focus-visible:ring-focus"
          >
            {t("note.cta")} <Icon name="arrow-right" size={16} />
          </Link>
        </aside>

        {/* Heading for the product list so the cards' h3 titles don't skip a level. */}
        <h2 className="text-sm font-normal text-ink-3">{t("count", { count: products.length })}</h2>

        {products.length ? (
          <ul className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
            {products.map((p) => (
              <li key={p.slug} className="flex">
                <ProductCard product={p} locale={locale} />
              </li>
            ))}
          </ul>
        ) : (
          <div className="flex flex-col items-center gap-3 rounded-xl border border-line bg-night-s1 px-6 py-14 text-center">
            <svg aria-hidden viewBox="0 0 120 60" className="h-16 w-32 text-gold-300/60">
              <path d="M10 45 L35 15 L60 35 L85 10 L110 40" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="3 3" />
              {[
                [10, 45],
                [35, 15],
                [60, 35],
                [85, 10],
                [110, 40],
              ].map(([x, y]) => (
                <circle key={`${x}-${y}`} cx={x} cy={y} r="2.5" fill="currentColor" />
              ))}
            </svg>
            <h2 className="text-xl">{t("empty.title")}</h2>
            <p className="max-w-[48ch] text-ink-2">{t("empty.body")}</p>
            <Link href="/shop" className="mt-2 inline-flex h-11 items-center rounded-full bg-grad-gold px-6 font-semibold text-ink-ongold focus-visible:ring-focus">
              {t("empty.cta")}
            </Link>
          </div>
        )}
      </div>
    </>
  );
}
