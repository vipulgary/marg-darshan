"use client";

import { type PointerEvent, type ReactNode, useRef } from "react";
import { cn } from "@/lib/cn";

/**
 * design.md §7.1 card with a cursor-following gold spotlight. Only mouse pointers drive it
 * (touch would leave a stuck highlight). Position goes into CSS vars, so moving never re-renders.
 * Base card look is included; add padding/layout through className.
 */
export function SpotlightCard({ children, className }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== "mouse") return;
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    el.style.setProperty("--mx", `${e.clientX - rect.left}px`);
    el.style.setProperty("--my", `${e.clientY - rect.top}px`);
  };

  return (
    <div
      ref={ref}
      onPointerMove={onPointerMove}
      className={cn(
        "group/spot relative isolate overflow-hidden rounded-lg border border-line bg-night-s1 shadow-e1",
        "transition-[transform,box-shadow,border-color] duration-200 ease-out",
        "hover:-translate-y-1 hover:border-line-hover hover:shadow-e2 motion-reduce:hover:translate-y-0",
        className,
      )}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 opacity-0 transition-opacity duration-300 pointer-fine:group-hover/spot:opacity-100"
        style={{
          background: "radial-gradient(400px circle at var(--mx, 50%) var(--my, 50%), rgba(252,217,138,.10), transparent 60%)",
        }}
      />
      {children}
    </div>
  );
}
