"use client";

import { useState } from "react";
import type { Product } from "@/content/catalog";
import { cn } from "@/lib/cn";
import { type ArtView, ProductArt } from "./ProductArt";
import { PRODUCT_PHOTOS } from "@/content/product-photos";

export function ProductGallery({
  product,
  labels,
}: {
  product: Pick<Product, "slug" | "category">;
  /** view → localized label, plus the "show {view}" template and placeholder note */
  labels: { views: { view: ArtView; label: string; show: string }[]; gallery: string; placeholder: string; title: string };
}) {
  const [active, setActive] = useState<ArtView>("main");
  const current = labels.views.find((v) => v.view === active) ?? labels.views[0];
  const photo = PRODUCT_PHOTOS[product.slug];
  return (
    <section aria-label={labels.gallery} className="flex flex-col gap-3">
      <div className="relative aspect-square overflow-hidden rounded-xl border border-line shadow-e2">
        <ProductArt product={product} view={active} label={`${labels.title} — ${current.label}`} />
        {!photo && (
          <span className="absolute bottom-3 right-3 rounded-sm bg-night-0/70 px-2.5 py-1 text-xs text-ink-2 backdrop-blur">
            {labels.placeholder}
          </span>
        )}
      </div>
      {photo && (
        <p className="text-xs text-ink-3">
          Photo:{" "}
          <a href={photo.sourceUrl} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-gold-300">
            {photo.author}
          </a>
          {" · "}
          {photo.licenseUrl ? (
            <a href={photo.licenseUrl} target="_blank" rel="noopener noreferrer license" className="underline underline-offset-2 hover:text-gold-300">
              {photo.license}
            </a>
          ) : (
            photo.license
          )}
          {" · Wikimedia Commons"}
        </p>
      )}
      <div className="flex gap-3">
        {labels.views.map((v) => (
          <button
            key={v.view}
            type="button"
            aria-label={v.show}
            aria-pressed={active === v.view}
            onClick={() => setActive(v.view)}
            className={cn(
              "h-16 w-16 overflow-hidden rounded-md border transition-colors focus-visible:ring-focus sm:h-20 sm:w-20",
              active === v.view ? "border-gold-300" : "border-line hover:border-line-hover",
            )}
          >
            <ProductArt product={product} view={v.view} />
          </button>
        ))}
      </div>
    </section>
  );
}
