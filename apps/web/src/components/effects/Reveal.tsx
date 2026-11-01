"use client";

import { MotionConfig, motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";

const EASE_OUT = [0.2, 0.8, 0.2, 1] as const;

/**
 * Scroll reveal (design.md §9.2): opacity 0→1, y 24→0, blur 6px→0 over 480ms, once, -10% margin.
 * Reduced motion: MotionConfig makes the y-shift instant, so it reads as a 150ms fade.
 * Stagger siblings with `delay` (design uses 0.07s steps). Don't wrap the hero (LCP).
 */
export function Reveal({ children, delay = 0, className }: { children: ReactNode; delay?: number; className?: string }) {
  const reduce = useReducedMotion();
  return (
    <MotionConfig reducedMotion="user">
      <motion.div
        className={className}
        initial={{ opacity: 0, y: 24, filter: "blur(6px)" }}
        whileInView={{
          opacity: 1,
          y: 0,
          filter: "blur(0px)",
          // A lingering filter would create a containing block for fixed/sticky descendants.
          transitionEnd: { filter: "none" },
        }}
        viewport={{ once: true, margin: "0px 0px -10% 0px" }}
        transition={reduce ? { duration: 0.15 } : { duration: 0.48, delay, ease: EASE_OUT }}
      >
        {children}
      </motion.div>
    </MotionConfig>
  );
}
