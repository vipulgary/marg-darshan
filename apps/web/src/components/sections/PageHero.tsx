import type { ReactNode } from "react";
import { SectionTitle } from "@/components/ui/Display";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/cn";

export interface Crumb {
  label: string;
  href?: string;
}

/** design.md §6.7 — text-3 13px, "/" separators, current page in text-1. */
export function Breadcrumbs({ items, label }: { items: Crumb[]; label: string }) {
  return (
    <nav aria-label={label}>
      <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] text-ink-3">
        {items.map((c, i) => {
          const last = i === items.length - 1;
          return (
            <li key={`${c.label}-${i}`} className="flex items-center gap-2">
              {c.href && !last ? (
                <Link href={c.href} className="relative rounded-xs transition-colors before:absolute before:-inset-y-3 before:-inset-x-1 before:content-[''] hover:text-gold-300 focus-visible:ring-focus">
                  {c.label}
                </Link>
              ) : (
                <span aria-current={last ? "page" : undefined} className={cn(last && "text-ink-1")}>
                  {c.label}
                </span>
              )}
              {!last && <span aria-hidden>/</span>}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

/** Inner-page hero: breadcrumbs + left-aligned title block over a calm static gradient (no moving effects). */
export function PageHero({
  eyebrow,
  title,
  highlight,
  lead,
  crumbs,
  crumbsLabel,
  children,
  aside,
}: {
  eyebrow?: string;
  title: string;
  highlight?: string;
  lead?: string;
  crumbs: Crumb[];
  crumbsLabel: string;
  children?: ReactNode;
  aside?: ReactNode;
}) {
  return (
    <section className="relative isolate overflow-hidden border-b border-line-subtle">
      <div
        aria-hidden
        className="bg-aurora pointer-events-none absolute inset-x-0 -top-40 -z-10 h-[520px] opacity-50 blur-2xl"
      />
      <div className="container-page grid gap-10 pb-14 pt-8 md:pb-20 md:pt-12 lg:grid-cols-12 lg:items-center">
        <div className={cn("flex flex-col gap-6", aside ? "lg:col-span-7" : "lg:col-span-9")}>
          <Breadcrumbs items={crumbs} label={crumbsLabel} />
          <SectionTitle as="h1" align="left" eyebrow={eyebrow} title={title} highlight={highlight} lead={lead} />
          {children}
        </div>
        {aside && <div className="lg:col-span-5">{aside}</div>}
      </div>
    </section>
  );
}
