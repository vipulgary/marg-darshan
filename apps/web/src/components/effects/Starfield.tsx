"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/cn";
import { prefersReducedMotion, runWhileVisible, whenIdle } from "./loop";

/**
 * Realistic night-sky canvas (design.md §9.1):
 *  - three depth layers drifting at different speeds (parallax),
 *  - irregular scintillation (two incommensurate waves, not a regular pulse),
 *  - real star colours (blue-white → white → warm yellow → rare orange),
 *  - soft glow on the brightest few, and an occasional shooting star.
 * Density scales with area; static under reduced motion; paused off-screen.
 */

type Star = {
  x: number;
  y: number;
  r: number;
  base: number;
  f1: number;
  f2: number;
  p1: number;
  p2: number;
  depth: number; // 0 far … 1 near
  color: string;
  glow: boolean;
};

type Meteor = { x: number; y: number; vx: number; vy: number; life: number; max: number };

const COLOURS = [
  { c: "#cfe0ff", w: 0.16 }, // blue-white
  { c: "#ffffff", w: 0.56 }, // white
  { c: "#fff4d6", w: 0.2 }, // warm white
  { c: "#ffd59a", w: 0.06 }, // yellow
  { c: "#ffb27a", w: 0.02 }, // orange
];

function pickColour(r: number) {
  let acc = 0;
  for (const { c, w } of COLOURS) {
    acc += w;
    if (r <= acc) return c;
  }
  return "#ffffff";
}

const LAYERS = [
  { share: 0.62, r: [0.25, 0.6], a: [0.25, 0.55], drift: 2.2 }, // far: many, tiny, dim, slow
  { share: 0.3, r: [0.5, 0.95], a: [0.45, 0.8], drift: 4.5 },
  { share: 0.08, r: [0.9, 1.45], a: [0.75, 1], drift: 8 }, // near: few, brighter, faster
];

export function Starfield({ className, density = 120 }: { className?: string; density?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const reduce = prefersReducedMotion();

    let w = 0;
    let h = 0;
    let stars: Star[] = [];
    const meteors: Meteor[] = [];
    let nextMeteor = performance.now() + 4000 + Math.random() * 6000;
    let last = performance.now();
    // Drift direction: a slow diagonal, like the sky turning.
    const dirX = -0.92;
    const dirY = 0.38;

    const seed = () => {
      // `density` scales stars per area (170 ≈ 400 stars on a 1280×800 hero, ~100 on a phone).
      const perArea = Math.max(20, density) / 400;
      const total = Math.min(1400, Math.round(((w * h) / 1000) * perArea * 0.9));
      stars = [];
      LAYERS.forEach((layer, depthIdx) => {
        const n = Math.round(total * layer.share);
        for (let i = 0; i < n; i++) {
          const r = layer.r[0] + Math.random() * (layer.r[1] - layer.r[0]);
          stars.push({
            x: Math.random() * w,
            y: Math.random() * h,
            r,
            base: layer.a[0] + Math.random() * (layer.a[1] - layer.a[0]),
            f1: 0.6 + Math.random() * 1.8,
            f2: 1.7 + Math.random() * 3.1,
            p1: Math.random() * Math.PI * 2,
            p2: Math.random() * Math.PI * 2,
            depth: depthIdx / (LAYERS.length - 1),
            color: pickColour(Math.random()),
            glow: depthIdx === LAYERS.length - 1 && Math.random() < 0.35,
          });
        }
      });
    };

    const spawnMeteor = () => {
      const fromTop = Math.random() < 0.7;
      const x = fromTop ? w * (0.3 + Math.random() * 0.7) : w * (0.85 + Math.random() * 0.15);
      const y = fromTop ? -10 : h * Math.random() * 0.4;
      const speed = 0.55 + Math.random() * 0.4; // px per ms
      const angle = Math.PI * (0.72 + Math.random() * 0.1); // down-left
      meteors.push({ x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, life: 0, max: 700 + Math.random() * 500 });
    };

    const draw = (now: number) => {
      const dt = Math.min(64, now - last);
      last = now;
      ctx.clearRect(0, 0, w, h);
      const t = now / 1000;

      for (const s of stars) {
        if (!reduce) {
          const speed = LAYERS[Math.round(s.depth * (LAYERS.length - 1))].drift / 1000; // px per ms
          s.x += dirX * speed * dt;
          s.y += dirY * speed * dt;
          if (s.x < -4) s.x += w + 8;
          if (s.y > h + 4) s.y -= h + 8;
        }
        // Scintillation: two waves with unrelated frequencies → irregular, natural twinkle.
        const tw = reduce ? 1 : 0.72 + 0.18 * Math.sin(t * s.f1 + s.p1) + 0.1 * Math.sin(t * s.f2 + s.p2);
        const alpha = Math.max(0, Math.min(1, s.base * tw));

        if (s.glow) {
          const g = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.r * 5);
          g.addColorStop(0, s.color);
          g.addColorStop(1, "transparent");
          ctx.globalAlpha = alpha * 0.28;
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.arc(s.x, s.y, s.r * 5, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.globalAlpha = alpha;
        ctx.fillStyle = s.color;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
      }

      if (!reduce) {
        if (now >= nextMeteor) {
          spawnMeteor();
          nextMeteor = now + 6000 + Math.random() * 8000;
        }
        for (let i = meteors.length - 1; i >= 0; i--) {
          const m = meteors[i];
          m.life += dt;
          m.x += m.vx * dt;
          m.y += m.vy * dt;
          const k = m.life / m.max;
          if (k >= 1) {
            meteors.splice(i, 1);
            continue;
          }
          const fade = k < 0.15 ? k / 0.15 : 1 - (k - 0.15) / 0.85;
          const tail = 90 + 60 * (1 - k);
          const tx = m.x - (m.vx / Math.hypot(m.vx, m.vy)) * tail;
          const ty = m.y - (m.vy / Math.hypot(m.vx, m.vy)) * tail;
          const g = ctx.createLinearGradient(m.x, m.y, tx, ty);
          g.addColorStop(0, "rgba(255,255,255,0.95)");
          g.addColorStop(1, "rgba(255,255,255,0)");
          ctx.globalAlpha = fade;
          ctx.strokeStyle = g;
          ctx.lineWidth = 1.2;
          ctx.lineCap = "round";
          ctx.beginPath();
          ctx.moveTo(m.x, m.y);
          ctx.lineTo(tx, ty);
          ctx.stroke();
        }
      }
      ctx.globalAlpha = 1;
    };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = Math.max(1, Math.round(w * dpr));
      canvas.height = Math.max(1, Math.round(h * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      seed();
      draw(performance.now());
    };
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    resize();

    // Animation waits for idle so it never competes with hydration / LCP on the hero.
    let stop = () => {};
    const idle = reduce ? null : whenIdle(() => ((last = performance.now()), (stop = runWhileVisible(canvas, 50, draw))));
    return () => {
      idle?.cancel();
      stop();
      ro.disconnect();
    };
  }, [density]);

  return <canvas ref={ref} aria-hidden className={cn("pointer-events-none absolute inset-0 h-full w-full [.light_&]:hidden", className)} />;
}
