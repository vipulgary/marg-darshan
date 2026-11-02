import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { PRODUCTS, getProduct, pick } from "@/content/catalog";
import { JsonLd } from "@/components/sections/JsonLd";
import { EnquiryButton } from "@/components/shop/EnquiryModal";
import { ProductCard } from "@/components/shop/ProductCard";
import { ProductGallery } from "@/components/shop/ProductGallery";
import { Badge } from "@/components/ui/Display";
import { cn } from "@/lib/cn";
import { Link } from "@/i18n/navigation";
import { SITE_NAME, absoluteUrl, breadcrumbJsonLd, localePath, pageMetadata, withBrand } from "@/lib/seo";
import { consultProblemFor, relatedProducts } from "@/lib/shop/catalog";
import { Icon } from "@/components/icons";

export const dynamicParams = false;

export function generateStaticParams() {
  return PRODUCTS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps<"/[locale]/shop/[slug]">): Promise<Metadata> {
  const { locale, slug } = await params;
  const product = getProduct(slug);
  if (!product) return {};
  const t = await getTranslations({ locale, namespace: "shop.meta" });
  const title = pick(product.title, locale);
  return pageMetadata({
    locale,
    path: `/shop/${slug}`,
    title: withBrand(t("detailTitle", { title })),
    description: t("detailDescription", { title, description: pick(product.description, locale) }),
  });
}

export default async function ProductPage({ params, searchParams }: PageProps<"/[locale]/shop/[slug]">) {
  const { locale, slug } = await params;
  const sp = await searchParams;
  setRequestLocale(locale);
  const product = getProduct(slug);
  if (!product) notFound();
  const t = await getTranslations("shop");
  const tc = await getTranslations();
  const title = pick(product.title, locale);
  const weightUnit = product.planet === "venus" ? (locale === "en" ? "carat" : "कैरेट") : locale === "en" ? "ratti" : "रत्ती";
  const wanted = Number(typeof sp.w === "string" ? sp.w : NaN);
  const selected = product.variants?.find((v) => v.weight === wanted) ?? product.variants?.find((v) => v.inStock) ?? null;
  const consultKey = product.category === "VASTU" ? "consultVastu" : product.category === "YANTRA" ? "consultAstro" : "consultGems";
  const related = relatedProducts(product, PRODUCTS, 4);
  const views = [
    { view: "main" as const, label: t("detail.viewMain") },
    { view: "macro" as const, label: t("detail.viewMacro") },
    { view: "certificate" as const, label: product.certified ? t("detail.viewCertificate") : t("detail.viewEnergised") },
  ].map((v) => ({ ...v, show: t("detail.showView", { view: v.label }) }));

  // Enquiry-only catalogue: no Offer/price, which is valid Product markup (just not price-rich-result eligible).
  const productLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: title,
    description: pick(product.description, locale),
    sku: product.sku,
    category: t(`category.${product.category}`),
    brand: { "@type": "Brand", name: SITE_NAME },
    url: absoluteUrl(localePath(locale, `/shop/${slug}`)),
  };
  const crumbs = [
    { name: tc("nav.home"), path: "/" },
    { name: tc("nav.shop"), path: "/shop" },
    { name: title, path: `/shop/${slug}` },
  ];

  return (
    <div className="container-page py-8 md:py-12">
      <JsonLd data={[productLd, breadcrumbJsonLd(locale, crumbs)]} />
      <nav aria-label={t("detail.breadcrumb")} className="mb-6 text-[13px] text-ink-3">
        <ol className="flex flex-wrap items-center gap-1.5">
          <li>
            <Link href="/" className="hover:text-gold-300 focus-visible:ring-focus">
              {tc("nav.home")}
            </Link>
          </li>
          <li aria-hidden>/</li>
          <li>
            <Link href="/shop" className="hover:text-gold-300 focus-visible:ring-focus">
              {tc("nav.shop")}
            </Link>
          </li>
          <li aria-hidden>/</li>
          <li aria-current="page" className="text-ink-1">
            {title}
          </li>
        </ol>
      </nav>

      <div className="grid gap-8 lg:grid-cols-12 lg:gap-12">
        <div className="lg:col-span-6">
          <ProductGallery
            product={product}
            labels={{ views, gallery: t("detail.gallery"), placeholder: t("detail.placeholder"), title }}
          />
        </div>

        <div className="flex flex-col gap-6 lg:col-span-6">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="gold">{t(`category.${product.category}`)}</Badge>
            {product.certified && <Badge tone="success"><Icon name="check" size={14} animate="none" /> {t("card.certified")}</Badge>}
            <span className="text-xs text-ink-3">
              {t("detail.sku")}: {product.sku}
            </span>
          </div>
          <h1 className="font-display text-[clamp(32px,4.2vw,52px)] leading-[1.1]">{title}</h1>
          <p className="max-w-[60ch] text-[17px] text-ink-2">{pick(product.description, locale)}</p>

          <div className="rounded-lg border border-line bg-night-s1 p-5">
            <p className="text-sm text-ink-3">{t("detail.priceHint")}</p>
            <p className="mt-1 text-2xl font-bold tabular-nums text-ink-1">{selected ? `₹${selected.price.toLocaleString("en-IN")}` : pick(product.priceHint, locale)}</p>
            {product.variants && (
              <div className="mt-4 flex flex-col gap-2">
                <p className="text-sm font-semibold text-ink-1">{t("detail.chooseWeight", { unit: weightUnit })}</p>
                <ul className="flex flex-wrap gap-2">
                  {product.variants.map((v) => {
                    const on = selected?.weight === v.weight;
                    return (
                      <li key={v.weight}>
                        <Link
                          href={`/shop/${product.slug}?w=${v.weight}`}
                          scroll={false}
                          aria-current={on ? "true" : undefined}
                          className={cn(
                            "inline-flex min-h-11 flex-col items-center justify-center rounded-lg border px-3 py-1.5 text-sm transition-colors focus-visible:ring-focus",
                            on ? "border-saffron-400 bg-saffron-500/12 font-semibold text-ink-1" : "border-line text-ink-2 hover:border-line-gold",
                          )}
                        >
                          <span>{v.weight} {weightUnit}</span>
                          <span className={cn("text-[11px]", v.inStock ? "text-success" : "text-ink-3")}>{v.inStock ? t("detail.inStock") : t("detail.onRequest")}</span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
            <p className="mt-2 text-sm text-ink-3">{t("detail.priceNote")}</p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <EnquiryButton
              product={{ slug: product.slug, sku: product.sku, title, presetNote: selected ? `${selected.weight} ${weightUnit}${selected.inStock ? "" : ` — ${t("detail.onRequest")}`}` : undefined }}
              label={selected && !selected.inStock ? t("detail.requestThis") : tc("cta.enquire")}
              variant="primary"
              size="lg"
              className="justify-center"
              iconRight={<Icon name="arrow-right" size={18} />}
            />
            <Link
              href={`/book-appointment?problem=${consultProblemFor(product.category)}`}
              className="inline-flex h-14 items-center justify-center rounded-full border border-line-gold px-7 font-semibold text-gold-300 transition-colors hover:border-gold-300 hover:bg-gold-300/8 focus-visible:ring-focus"
            >
              {t(`detail.${consultKey}`)}
            </Link>
          </div>

          <section className="flex flex-col gap-2 border-t border-line-subtle pt-6">
            <h2 className="text-xl">{t("detail.suitableFor")}</h2>
            <p className="text-ink-2">{pick(product.suitableFor, locale)}</p>
            <p className="text-sm text-ink-3">{t("detail.suitableNote")}</p>
          </section>
          <section className="flex flex-col gap-2 border-t border-line-subtle pt-6">
            <h2 className="text-xl">{t("detail.certification")}</h2>
            <p className="text-ink-2">{product.certified ? t("detail.certifiedBody") : t("detail.uncertifiedBody")}</p>
          </section>
          <aside className="rounded-lg border border-line-gold bg-saffron-500/8 p-5 text-sm">
            <p className="font-semibold text-ink-1">{t("note.title")}</p>
            <p className="mt-1 text-ink-2">{t("note.body")}</p>
          </aside>
        </div>
      </div>

      <section className="mt-14 md:mt-20">
        <h2 className="mb-6 text-2xl">{t("detail.howTitle")}</h2>
        <ol className="grid gap-4 md:grid-cols-3">
          {([1, 2, 3] as const).map((n) => (
            <li key={n} className="flex gap-4 rounded-lg border border-line bg-night-s1 p-5">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-grad-gold font-semibold text-ink-ongold">{n}</span>
              <div>
                <h3 className="text-lg">{t(`detail.how${n}Title`)}</h3>
                <p className="mt-1 text-sm text-ink-2">{t(`detail.how${n}Body`)}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {related.length > 0 && (
        <section className="mt-14 md:mt-20">
          <h2 className="mb-6 text-2xl">{t("detail.related")}</h2>
          <ul className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
            {related.map((p) => (
              <li key={p.slug} className="flex">
                <ProductCard product={p} locale={locale} />
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
