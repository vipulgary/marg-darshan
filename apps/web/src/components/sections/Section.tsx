import type { ReactNode } from "react";
import { Reveal } from "@/components/effects";
import { cn } from "@/lib/cn";

/** Section rhythm (design.md §3): 56 mobile / 72 tablet / 112 desktop, revealed on scroll. */
export function Section({
  id,
  children,
  className,
  alt,
  reveal = true,
}: {
  id?: string;
  children: ReactNode;
  className?: string;
  /** alternate background (bg-1) */
  alt?: boolean;
  reveal?: boolean;
}) {
  return (
    <section id={id} className={cn("scroll-mt-24 py-14 md:py-[72px] lg:py-28", alt && "bg-night-1", className)}>
      <div className="container-page">{reveal ? <Reveal>{children}</Reveal> : children}</div>
    </section>
  );
}
