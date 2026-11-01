import type { FaqItem } from "@/content/faq";
import { pick } from "@/content/catalog";
import { cn } from "@/lib/cn";
import { ChevronDownIcon } from "./icons";

/**
 * design.md §11.1/12 — native <details> so it works without JS. Chevron rotates, the open item
 * gets a gold left bar, and height animates where ::details-content + interpolate-size are supported.
 */
export function FaqAccordion({ items, locale, className }: { items: FaqItem[]; locale: string; className?: string }) {
  return (
    <div className={cn("flex flex-col gap-3", className)}>
      {items.map((f) => (
        <details
          key={f.id}
          id={`faq-${f.id}`}
          className={cn(
            "group relative scroll-mt-28 overflow-hidden rounded-lg border border-line bg-night-s1 shadow-e1 transition-colors duration-200",
            "before:absolute before:inset-y-0 before:left-0 before:w-0.5 before:bg-grad-gold before:opacity-0 before:transition-opacity open:border-line-hover open:before:opacity-100",
            "[interpolate-size:allow-keywords] [&::details-content]:h-0 [&::details-content]:overflow-hidden",
            "[&::details-content]:transition-[height,content-visibility] [&::details-content]:duration-300 [&::details-content]:[transition-behavior:allow-discrete]",
            "open:[&::details-content]:h-auto",
          )}
        >
          <summary
            className={cn(
              "flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 rounded-lg px-5 py-4 text-left text-[17px] font-semibold text-ink-1",
              "transition-colors hover:text-gold-200 focus-visible:ring-focus md:px-6 [&::-webkit-details-marker]:hidden",
            )}
          >
            <span>{pick(f.q, locale)}</span>
            <ChevronDownIcon className="text-ink-3 transition-transform duration-200 group-open:rotate-180 group-open:text-gold-300" />
          </summary>
          <div className="max-w-[68ch] px-5 pb-5 text-ink-2 md:px-6">{pick(f.a, locale)}</div>
        </details>
      ))}
    </div>
  );
}
