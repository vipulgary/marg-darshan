import type { Product, ProductCategory } from "../../content/catalog";

/** URL values for the ?category= filter on /shop (lowercase, stable for sharing). */
export const SHOP_FILTERS = ["all", "gems", "rudraksha", "yantra", "vastu"] as const;
export type ShopFilter = (typeof SHOP_FILTERS)[number];

const FILTER_CATEGORY: Record<Exclude<ShopFilter, "all">, ProductCategory> = {
  gems: "GEM",
  rudraksha: "RUDRAKSHA",
  yantra: "YANTRA",
  vastu: "VASTU",
};

export function parseShopFilter(value: string | string[] | undefined): ShopFilter {
  const v = (Array.isArray(value) ? value[0] : value)?.toLowerCase();
  return (SHOP_FILTERS as readonly string[]).includes(v ?? "") ? (v as ShopFilter) : "all";
}

export function filterForCategory(category: ProductCategory): Exclude<ShopFilter, "all"> {
  const hit = Object.entries(FILTER_CATEGORY).find(([, c]) => c === category);
  return (hit?.[0] ?? "gems") as Exclude<ShopFilter, "all">;
}

export function filterProducts(products: readonly Product[], filter: ShopFilter): Product[] {
  if (filter === "all") return [...products];
  return products.filter((p) => p.category === FILTER_CATEGORY[filter]);
}

/** Same-category items first; topped up with other items so the section is never empty. */
export function relatedProducts(product: Product, products: readonly Product[], limit = 4): Product[] {
  const others = products.filter((p) => p.slug !== product.slug);
  const same = others.filter((p) => p.category === product.category);
  const rest = others.filter((p) => p.category !== product.category);
  return [...same, ...rest].slice(0, limit);
}

/** Which booking problem a "consult first" CTA should preselect for a product. */
export function consultProblemFor(category: ProductCategory): string {
  switch (category) {
    case "VASTU":
      return "vastu-residential";
    case "YANTRA":
      return "dosha";
    default:
      return "gemstone";
  }
}

export interface ProductTint {
  /** main stone / object colour */
  hue: string;
  /** deep background colour of the radial "macro shot" */
  deep: string;
}

const CATEGORY_TINT: Record<ProductCategory, ProductTint> = {
  GEM: { hue: "#F59E0B", deep: "#2A1A05" },
  RUDRAKSHA: { hue: "#B7793A", deep: "#21140A" },
  YANTRA: { hue: "#E8A04C", deep: "#24150A" },
  VASTU: { hue: "#A78BFA", deep: "#160F2E" },
};

// Gem colours follow the stone so the placeholder reads as the real thing at a glance.
const SLUG_TINT: { match: RegExp; tint: ProductTint }[] = [
  { match: /pukhraj|yellow-sapphire/, tint: { hue: "#FACC15", deep: "#2B2205" } },
  { match: /neelam|blue-sapphire/, tint: { hue: "#60A5FA", deep: "#0A1630" } },
  { match: /manik|ruby/, tint: { hue: "#F43F5E", deep: "#2E0A12" } },
  { match: /panna|emerald/, tint: { hue: "#34D399", deep: "#06261B" } },
  { match: /moti|pearl/, tint: { hue: "#E5E7EB", deep: "#1C1C24" } },
  { match: /moonga|coral/, tint: { hue: "#FB7185", deep: "#2A0E10" } },
  { match: /gomed|hessonite/, tint: { hue: "#C2410C", deep: "#2A1206" } },
  { match: /lehsunia|cat/, tint: { hue: "#A3A380", deep: "#1C1C10" } },
  { match: /heera|diamond/, tint: { hue: "#F8FAFC", deep: "#151525" } },
];

export function productTint(product: Pick<Product, "slug" | "category">): ProductTint {
  return SLUG_TINT.find((s) => s.match.test(product.slug))?.tint ?? CATEGORY_TINT[product.category];
}
