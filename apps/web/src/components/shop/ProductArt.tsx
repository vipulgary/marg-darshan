import Image from "next/image";
import type { Product } from "@/content/catalog";
import { PRODUCT_PHOTOS } from "@/content/product-photos";
import { cn } from "@/lib/cn";
import { productTint } from "@/lib/shop/catalog";

export type ArtView = "main" | "macro" | "certificate";

/**
 * Product visual (design.md §7.3): a licensed photo when one exists (content/product-photos.ts),
 * otherwise a gradient "macro shot" illustration. Works in server and client components alike.
 */
export function ProductArt({
  product,
  view = "main",
  label,
  className,
}: {
  product: Pick<Product, "slug" | "category">;
  view?: ArtView;
  label?: string;
  className?: string;
}) {
  const { hue, deep } = productTint(product);
  const photo = PRODUCT_PHOTOS[product.slug];
  if (photo && view !== "certificate") {
    return (
      <div
        role={label ? "img" : undefined}
        aria-label={label}
        aria-hidden={label ? undefined : true}
        className={cn("relative h-full w-full overflow-hidden bg-[#07060F]", className)}
      >
        <Image
          src={photo.src}
          alt=""
          fill
          sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
          className={cn(
            "object-cover transition-transform duration-500 ease-out group-hover:scale-105",
            view === "macro" && "scale-[1.8] group-hover:scale-[1.9]",
          )}
        />
        {/* CC BY / BY-SA attribution; full links on the product page. */}
        <span className="absolute bottom-1.5 right-2 max-w-[90%] truncate rounded-xs bg-black/55 px-1.5 py-0.5 text-[10px] leading-tight text-white/90">
          {photo.author} · {photo.license}
        </span>
      </div>
    );
  }
  return (
    <div
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      className={cn("relative grid h-full w-full place-items-center overflow-hidden", className)}
      style={{
        background: `radial-gradient(60% 55% at 50% 42%, ${hue}55 0%, ${deep} 62%, #07060F 100%)`,
      }}
    >
      <span
        className="absolute inset-0 opacity-30"
        style={{ background: `radial-gradient(30% 25% at 70% 20%, ${hue}66, transparent 70%)` }}
      />
      <svg
        viewBox="0 0 100 100"
        className={cn(
          "relative w-[58%] drop-shadow-[0_10px_30px_rgba(0,0,0,.55)] transition-transform duration-500 ease-out group-hover:scale-105",
          view === "macro" && "w-[88%] -rotate-12",
        )}
      >
        {view === "certificate" ? <Certificate hue={hue} /> : <Glyph category={product.category} hue={hue} />}
      </svg>
    </div>
  );
}

function Glyph({ category, hue }: { category: Product["category"]; hue: string }) {
  const stroke = { fill: "none", stroke: "#FDE7B0", strokeWidth: 1.2, strokeLinejoin: "round" as const, strokeOpacity: 0.85 };
  switch (category) {
    case "RUDRAKSHA":
      return (
        <g>
          <path d="M50 6 V20" stroke="#FCD98A" strokeWidth="1.2" />
          <circle cx="50" cy="55" r="32" fill={hue} fillOpacity="0.55" />
          {[-18, -9, 0, 9, 18].map((dx) => (
            <path key={dx} d={`M${50 + dx} 24 Q${50 + dx * 1.6} 55 ${50 + dx} 86`} {...stroke} />
          ))}
          <circle cx="50" cy="55" r="32" {...stroke} />
        </g>
      );
    case "YANTRA":
      return (
        <g {...stroke}>
          <path d="M12 12 H40 V8 H60 V12 H88 V40 H92 V60 H88 V88 H60 V92 H40 V88 H12 V60 H8 V40 H12 Z" fill={hue} fillOpacity="0.18" />
          <circle cx="50" cy="50" r="30" />
          <path d="M50 24 L74 64 H26 Z" />
          <path d="M50 76 L26 36 H74 Z" />
          <circle cx="50" cy="50" r="2.4" fill="#FCD98A" />
        </g>
      );
    case "VASTU":
      return (
        <g>
          <ellipse cx="50" cy="84" rx="38" ry="6" fill={hue} fillOpacity="0.25" />
          <path d="M50 14 L86 80 H14 Z" fill={hue} fillOpacity="0.45" />
          <path d="M50 14 L60 80" {...stroke} />
          <path d="M50 14 L86 80 H14 Z" {...stroke} />
        </g>
      );
    default:
      return (
        <g>
          <path d="M30 28 L70 28 L86 44 L50 84 L14 44 Z" fill={hue} fillOpacity="0.6" />
          <path d="M14 44 H86 M30 28 L40 44 L50 28 L60 44 L70 28 M40 44 L50 84 L60 44" {...stroke} />
          <path d="M30 28 L70 28 L86 44 L50 84 L14 44 Z" {...stroke} />
          <path d="M78 14 l1.6 4 4 1.6 -4 1.6 -1.6 4 -1.6 -4 -4 -1.6 4 -1.6 Z" fill="#FDE7B0" />
        </g>
      );
  }
}

function Certificate({ hue }: { hue: string }) {
  return (
    <g fill="none" stroke="#FDE7B0" strokeWidth="1.2" strokeOpacity="0.85">
      <rect x="18" y="12" width="64" height="78" rx="4" fill="#15112A" fillOpacity="0.8" />
      <path d="M28 28 H72 M28 38 H72 M28 48 H60 M28 58 H66" strokeOpacity="0.5" />
      <circle cx="64" cy="74" r="9" fill={hue} fillOpacity="0.6" />
      <path d="M59 74 l3.5 3.5 6.5 -7" stroke="#1A1325" strokeWidth="2" />
    </g>
  );
}
