"use client";

import { useEffect, useRef, type CSSProperties } from "react";
import { cn } from "@/lib/cn";
import { ICON_PATHS, type IconName } from "./paths";

export type IconAnimation = "draw" | "hover" | "none";

export interface IconProps {
  name: IconName;
  /** px; a className with h-/w- utilities overrides it. */
  size?: number;
  className?: string;
  /**
   * draw  — strokes draw in once when scrolled into view (decorative / section icons), and
   *         redraw on group hover like "hover";
   * hover — (default) strokes redraw while an interactive ancestor (a, button, summary, label,
   *         `.group` or a named `group/x`) is hovered or keyboard-focused;
   * none  — static (tiny inline status icons).
   */
  animate?: IconAnimation;
  /** Accessible name for a meaningful icon; omitted → aria-hidden. */
  label?: string;
  strokeWidth?: number;
  style?: CSSProperties;
}

/**
 * Every subpath becomes its own <path pathLength=1> so dashes run per stroke and can be
 * staggered. Server output carries no data-state, so icons are fully drawn without JS; the
 * client hides "draw" icons only after hydration, then reveals them on intersection.
 */
const CSS = `
@keyframes amx-icon-draw{from{stroke-dashoffset:1}to{stroke-dashoffset:0}}
@layer components{
  .amx-icon[data-animate] path{stroke-dasharray:1 1}
  .amx-icon[data-state=hidden] path{stroke-dashoffset:1;opacity:0}
  .amx-icon[data-state=drawn] path{stroke-dashoffset:0;opacity:1;transition:stroke-dashoffset .7s cubic-bezier(.65,0,.35,1) calc(var(--i)*90ms),opacity .12s linear calc(var(--i)*90ms)}
  :is(a,button,summary,label,.group,[class*="group/"]):is(:hover,:focus-visible,:focus-within) .amx-icon[data-animate] path{animation:amx-icon-draw .7s cubic-bezier(.65,0,.35,1) calc(var(--i)*70ms) both}
}
@media (prefers-reduced-motion:reduce){
  .amx-icon path{animation:none!important;transition:none!important;stroke-dashoffset:0!important;opacity:1!important}
}
`;

const SPLIT = /(?=M)/;
const split = (name: IconName) => ICON_PATHS[name].flatMap((d) => d.split(SPLIT));

type Reveal = (visible: boolean) => void;
let observer: IntersectionObserver | null = null;
const watchers = new Map<Element, Reveal>();

function observe(el: Element, cb: Reveal) {
  observer ??= new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        watchers.get(e.target)?.(true);
        watchers.delete(e.target);
        observer?.unobserve(e.target);
      }
    },
    { rootMargin: "0px 0px -8% 0px" },
  );
  watchers.set(el, cb);
  observer.observe(el);
  return () => {
    watchers.delete(el);
    observer?.unobserve(el);
  };
}

export function Icon({ name, size = 20, className, animate = "hover", label, strokeWidth = 1.5, style }: IconProps) {
  const ref = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (animate !== "draw" || !el || typeof IntersectionObserver === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    el.dataset.state = "hidden";
    let frame = 0;
    const stop = observe(el, () => {
      // one frame in the hidden state so the transition has a start value
      frame = requestAnimationFrame(() => {
        frame = requestAnimationFrame(() => (el.dataset.state = "drawn"));
      });
    });
    return () => {
      stop();
      cancelAnimationFrame(frame);
      delete el.dataset.state;
    };
  }, [animate]);

  return (
    <>
      <style href="amx-icon" precedence="medium">
        {CSS}
      </style>
      <svg
        ref={ref}
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        focusable="false"
        role={label ? "img" : undefined}
        aria-label={label}
        aria-hidden={label ? undefined : true}
        data-animate={animate === "none" ? undefined : animate}
        className={cn("amx-icon inline-block shrink-0", className)}
        style={style}
      >
        {split(name).map((d, i) => (
          <path key={i} d={d} pathLength={1} style={{ "--i": i } as CSSProperties} />
        ))}
      </svg>
    </>
  );
}
