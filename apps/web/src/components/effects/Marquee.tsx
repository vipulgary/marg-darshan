import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/cn";
import { EffectsStyles } from "./styles";

/**
 * Infinite marquee (design.md §9.1). Children are rendered twice and the track slides by half its
 * width, so the loop is seamless. Pauses on hover/focus; becomes a static wrapped list under
 * reduced motion. `speed` is the duration of one full loop in seconds (lower = faster, 8–240).
 */
export function Marquee({
  children,
  reverse = false,
  speed = 40,
  className,
}: {
  children: ReactNode;
  reverse?: boolean;
  speed?: number;
  className?: string;
}) {
  const duration = Math.min(240, Math.max(8, Number.isFinite(speed) ? speed : 40));
  return (
    <div
      className={cn("amx-marquee", className)}
      data-reverse={reverse ? "" : undefined}
      style={{ "--amx-dur": `${duration}s` } as CSSProperties}
    >
      <EffectsStyles />
      <div className="amx-marquee-track">
        <div className="amx-marquee-copy">{children}</div>
        <div className="amx-marquee-copy" data-dup="" aria-hidden inert>
          {children}
        </div>
      </div>
    </div>
  );
}
