import { getTranslations } from "next-intl/server";
import { type Product, pick } from "@/content/catalog";
import { Badge } from "@/components/ui/Display";
import { Link } from "@/i18n/navigation";
import { EnquiryButton } from "./EnquiryModal";
import { ProductArt } from "./ProductArt";
import { Icon } from "@/components/icons";

/** design.md §7.3 product card — stretched title link + an independent enquiry button. */
export async function ProductCard({ product, locale }: { product: Product; locale: string }) {
  const t = await getTranslations("shop");
  const title = pick(product.title, locale);
  return (
    <article className="group relative flex w-full flex-col overflow-hidden rounded-lg border border-line bg-night-s1 shadow-e1 transition-all duration-200 ease-out hover:-translate-y-1 hover:border-line-hover hover:shadow-e2 has-[a:focus-visible]:ring-focus">
      <div className="relative aspect-square overflow-hidden">
        <ProductArt product={product} />
        {product.certified && (
          <Badge tone="success" className="absolute left-3 top-3 bg-night-0/70 backdrop-blur">
            <Icon name="check" size={14} animate="none" /> {t("card.certified")}
          </Badge>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1.5 p-3.5 sm:p-4">
        <span className="text-xs font-semibold text-gold-300">{t(`category.${product.category}`)}</span>
        <h3 className="text-[15px] leading-snug sm:text-base">
          <Link href={`/shop/${product.slug}`} className="outline-none after:absolute after:inset-0 after:content-['']">
            {title}
          </Link>
        </h3>
        <p className="text-sm text-ink-3">
          <span className="sr-only">{t("card.priceHint")}: </span>
          {pick(product.priceHint, locale)}
        </p>
        <div className="relative z-10 mt-auto pt-2">
          <EnquiryButton
            product={{ slug: product.slug, sku: product.sku, title }}
            label={t("card.enquire")}
            size="sm"
            className="h-11 w-full justify-center"
          />
        </div>
      </div>
    </article>
  );
}
