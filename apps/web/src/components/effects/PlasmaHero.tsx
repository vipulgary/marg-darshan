"use client";

import { type ReactNode, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { prefersReducedMotion, whenIdle } from "./loop";

/**
 * Home hero background (design.md §9.1): WebGL plasma behind the children. The static aurora
 * gradient is always painted first, so no-WebGL, reduced-motion and the pre-idle moment all
 * look intentional; the shader fades in on its first frame.
 */
export function PlasmaHero({ className, children }: { className?: string; children?: ReactNode }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [live, setLive] = useState(false);

  useEffect(() => {
    const host = hostRef.current;
    if (!host || prefersReducedMotion()) return;
    let cancelled = false;
    let dispose: (() => void) | undefined;

    const idle = whenIdle(() => {
      import("./plasma-gl")
        .then(({ startPlasma }) => {
          if (cancelled) return;
          dispose = startPlasma(host, { onReady: () => setLive(true), onLost: () => setLive(false) });
        })
        .catch(() => {
          // Chunk failed to load: the static gradient stays.
        });
    });

    return () => {
      cancelled = true;
      idle.cancel();
      dispose?.();
    };
  }, []);

  return (
    <div className={cn("relative isolate overflow-hidden bg-night-0", className)}>
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-aurora" />
      {/* Light theme: a warm "dawn" wash instead of the night-sky shader. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 hidden bg-[radial-gradient(60%_55%_at_12%_18%,rgba(255,159,67,.26),transparent_65%),radial-gradient(50%_50%_at_88%_22%,rgba(235,151,131,.30),transparent_65%),radial-gradient(70%_60%_at_50%_105%,rgba(244,115,90,.16),transparent_70%),linear-gradient(180deg,#fff1e2_0%,#fff8f1_100%)] [.light_&]:block"
      />
      <div
        ref={hostRef}
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-0 transition-opacity duration-[1200ms] ease-out [.light_&]:hidden",
          live ? "opacity-100" : "opacity-0",
        )}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-[linear-gradient(180deg,transparent,var(--page-bg))]"
      />
      <div className="relative z-10 w-full">{children}</div>
    </div>
  );
}
