import { PRODUCTS, getProduct } from "@/content/catalog";
import { PRODUCT_PHOTOS } from "@/content/product-photos";
import { OG_ALT, OG_COPY } from "@/lib/og/copy";
import { OG_CONTENT_TYPE, OG_SIZE, renderOgImage } from "@/lib/og/render";

export const alt = OG_ALT.shop;
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export function generateStaticParams() {
  return PRODUCTS.map((p) => ({ slug: p.slug }));
}

export default async function Image({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  const product = getProduct(slug);
  if (!product) return renderOgImage({ locale, ...OG_COPY.home });
  return renderOgImage({
    locale,
    eyebrow: OG_COPY.shop,
    title: product.title,
    subtitle: product.description,
    photo: PRODUCT_PHOTOS[slug]?.src,
  });
}
