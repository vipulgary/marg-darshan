"use client";

import { MotionConfig } from "motion/react";
import type { ReactNode } from "react";

/**
 * AMX-151: every motion/react animation (menus, modal, tab and language indicators, toasts)
 * honours prefers-reduced-motion — transforms/layout jumps become instant, opacity fades stay.
 */
export function MotionProvider({ children }: { children: ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
