"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";

const GLYPHS = ["♈", "♉", "♊", "♋", "♌", "♍", "♎", "♏", "♐", "♑", "♒", "♓"];
const STEPS = ["step1", "step2", "step3"] as const;

/** design.md §8 kundali loader: zodiac wheel (6s/turn) with rotating status text. */
export function KundaliLoader({ className, extra }: { className?: string; extra?: string }) {
  const t = useTranslations("kundali.loader");
  const [step, setStep] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setStep((s) => (s + 1) % STEPS.length), 2400);
    return () => clearInterval(id);
  }, []);

  return (
    <div className={cn("flex flex-col items-center gap-5 py-10 text-center", className)}>
      <svg viewBox="0 0 200 200" className="h-36 w-36" aria-hidden style={{ animation: "spin 6s linear infinite" }}>
        <circle cx="100" cy="100" r="92" className="fill-none stroke-gold-300" strokeOpacity=".6" strokeWidth="1.5" />
        <circle cx="100" cy="100" r="66" className="fill-none stroke-gold-300" strokeOpacity=".35" strokeWidth="1" />
        <circle cx="100" cy="100" r="22" className="fill-none stroke-saffron-400" strokeWidth="1.5" />
        {GLYPHS.map((g, i) => {
          const a = ((i * 30 - 90 + 15) * Math.PI) / 180;
          const b = ((i * 30 - 90) * Math.PI) / 180;
          return (
            <g key={g}>
              <line x1={100 + 22 * Math.cos(b)} y1={100 + 22 * Math.sin(b)} x2={100 + 92 * Math.cos(b)} y2={100 + 92 * Math.sin(b)} className="stroke-gold-300" strokeOpacity=".25" />
              <text x={100 + 79 * Math.cos(a)} y={100 + 79 * Math.sin(a)} textAnchor="middle" dominantBaseline="central" fontSize="14" className="fill-gold-200">
                {g}
              </text>
            </g>
          );
        })}
      </svg>
      <p role="status" aria-live="polite" className="min-h-7 text-lg font-medium text-ink-1">
        {t(STEPS[step])}
      </p>
      <p className="text-sm text-ink-3">{extra ?? t("note")}</p>
    </div>
  );
}
