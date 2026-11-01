"use client";

import { animate, motion, useInView, useMotionValue, useReducedMotion, useTransform } from "motion/react";
import { useLocale } from "next-intl";
import { useEffect, useRef } from "react";
import { formatNumber } from "@/lib/format";

/**
 * Counts from 0 to `to` the first time it scrolls into view (design.md §7.2 stat tiles).
 * Uses Indian digit grouping; decimals follow `to` (4.9 → one decimal). Screen readers get
 * the final value only.
 */
export function CountUp({ to, suffix = "", duration = 1.6 }: { to: number; suffix?: string; duration?: number }) {
  const locale = useLocale();
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "0px 0px -10% 0px" });
  const reduce = useReducedMotion();
  const decimals = Number.isInteger(to) ? 0 : Math.min(2, (String(to).split(".")[1] ?? "").length);
  const value = useMotionValue(0);
  const text = useTransform(value, (v) => `${formatNumber(v, locale, decimals)}${suffix}`);

  useEffect(() => {
    if (!inView) return;
    if (reduce) {
      value.set(to);
      return;
    }
    const controls = animate(value, to, { duration, ease: [0.2, 0.8, 0.2, 1] });
    return () => controls.stop();
  }, [inView, reduce, to, duration, value]);

  const final = `${formatNumber(to, locale, decimals)}${suffix}`;
  // The invisible final value reserves the width, so counting never reflows the line (no CLS).
  return (
    <span className="inline-grid tabular-nums">
      <span aria-hidden className="invisible [grid-area:1/1]">
        {final}
      </span>
      <motion.span ref={ref} aria-hidden className="text-end [grid-area:1/1]">
        {text}
      </motion.span>
      <span className="sr-only">{final}</span>
    </span>
  );
}
