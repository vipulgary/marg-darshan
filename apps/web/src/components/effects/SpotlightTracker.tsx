"use client";

import { useEffect } from "react";

/** Feeds the cursor position (--mx/--my) to the hovered gold CTA so its spotlight follows the pointer. */
export function SpotlightTracker() {
  useEffect(() => {
    const move = (e: PointerEvent) => {
      const el = (e.target as Element | null)?.closest?.<HTMLElement>(".bg-grad-gold");
      if (!el) return;
      const r = el.getBoundingClientRect();
      el.style.setProperty("--mx", `${e.clientX - r.left}px`);
      el.style.setProperty("--my", `${e.clientY - r.top}px`);
    };
    document.addEventListener("pointermove", move, { passive: true });
    return () => document.removeEventListener("pointermove", move);
  }, []);
  return null;
}
