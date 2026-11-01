import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { EffectsStyles } from "./styles";

/**
 * Animated conic gradient border (design.md §4.2 / §9.1) without @property: an oversized
 * conic layer rotates behind a 1.5px inset content layer. Defaults to rounded-lg — pass a
 * rounded-* class to change it (the inner layer inherits). Max two per viewport.
 */
export function GradientBorder({
  children,
  className,
  animated = true,
}: {
  children: ReactNode;
  className?: string;
  animated?: boolean;
}) {
  return (
    <div className={cn("amx-gb", className)}>
      <EffectsStyles />
      <span aria-hidden className="amx-gb-spin" data-animated={animated ? "" : undefined} />
      <div className="amx-gb-inner">{children}</div>
    </div>
  );
}
