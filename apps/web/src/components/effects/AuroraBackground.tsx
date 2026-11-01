import type { CSSProperties } from "react";
import { cn } from "@/lib/cn";
import { EffectsStyles } from "./styles";

const BLOBS: { color: string; left: string; top: string; size: string; anim: string }[] = [
  { color: "var(--aurora-1)", left: "-12%", top: "-28%", size: "62%", anim: "amx-drift-a 32s" },
  { color: "var(--aurora-2)", left: "52%", top: "-22%", size: "52%", anim: "amx-drift-b 38s" },
  { color: "var(--aurora-3)", left: "22%", top: "38%", size: "58%", anim: "amx-drift-c 27s" },
  { color: "var(--aurora-4)", left: "70%", top: "42%", size: "44%", anim: "amx-drift-a 40s reverse" },
];

/**
 * Moving aurora mesh (design.md §9.1): 4 soft blobs drifting on 24–40s loops. Fills the nearest
 * positioned ancestor — give the parent `relative overflow-hidden` and the content `relative`.
 * Blobs are radial gradients (no filter: blur) so the effect stays cheap; frozen under reduced motion.
 */
export function AuroraBackground({ className, intensity = "soft" }: { className?: string; intensity?: "soft" | "strong" }) {
  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none absolute inset-0 overflow-hidden",
        intensity === "strong" ? "opacity-100" : "opacity-60",
        className,
      )}
    >
      <EffectsStyles />
      <div className="absolute inset-0 bg-aurora" />
      {BLOBS.map((b) => (
        <span
          key={b.anim}
          className="amx-blob aspect-square"
          style={
            {
              left: b.left,
              top: b.top,
              width: b.size,
              background: `radial-gradient(closest-side, ${b.color}, transparent)`,
              "--amx-anim": b.anim,
            } as CSSProperties
          }
        />
      ))}
    </div>
  );
}
