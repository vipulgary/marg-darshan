"use client";

import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/cn";

/**
 * Karaoke-style follow-along for a section that a VoiceSectionPlayer is reading.
 * The player broadcasts how far it has got (`md-voice` events: {id, frac}); this maps that
 * fraction onto the displayed words, highlights the current sentence softly and the current
 * word strongly, and keeps the line in view. Symbols the voice skips (zodiac glyphs) carry no weight.
 */
export const VOICE_EVENT = "md-voice";
export type VoiceProgress = { id: string; frac: number | null };

const SILENT = /^[♈-♓︎·•|—–-]+$/;

type Word = { tok: string; start: number; end: number; sentence: number; space: boolean };

function buildModel(paragraphs: string[]): { paras: Word[][]; total: number } {
  const paras: Word[][] = [];
  let pos = 0;
  let sentence = 0;
  for (const p of paragraphs) {
    const words: Word[] = [];
    for (const tok of p.split(/(\s+)/)) {
      if (!tok.trim()) {
        words.push({ tok, start: pos, end: pos, sentence, space: true });
        continue;
      }
      const weight = SILENT.test(tok) ? 0 : tok.length + 1;
      words.push({ tok, start: pos, end: pos + weight, sentence, space: false });
      pos += weight;
      if (/[.!?।]$/.test(tok)) sentence++;
    }
    paras.push(words);
  }
  return { paras, total: pos || 1 };
}

export function SpokenText({ id, paragraphs, firstClassName = "text-ink-1", className }: { id: string; paragraphs: string[]; firstClassName?: string; className?: string }) {
  const [frac, setFrac] = useState<number | null>(null);
  const current = useRef<HTMLSpanElement>(null);

  // Words per paragraph, each with its cumulative spoken-character position and its sentence number.
  const model = useMemo(() => buildModel(paragraphs), [paragraphs]);

  useEffect(() => {
    const on = (e: Event) => {
      const d = (e as CustomEvent<VoiceProgress>).detail;
      if (d.id === id) setFrac(d.frac);
    };
    window.addEventListener(VOICE_EVENT, on);
    return () => window.removeEventListener(VOICE_EVENT, on);
  }, [id]);

  const at = frac === null ? -1 : frac * model.total;
  let activeSentence = -1;
  if (at >= 0) {
    for (const para of model.paras) for (const w of para) if (!w.space && w.start <= at && at < w.end) activeSentence = w.sentence;
  }

  useEffect(() => {
    const el = current.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    if (r.top < 90 || r.bottom > window.innerHeight - 40) el.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [activeSentence]);

  return (
    <div className={cn("flex flex-col gap-3 leading-relaxed", className)}>
      {model.paras.map((para, i) => (
        <p key={i} className={i === 0 ? firstClassName : undefined}>
          {para.map((w, k) => {
            if (w.space) return <Fragment key={k}>{w.tok}</Fragment>;
            const isWord = at >= w.start && at < w.end;
            const inSentence = activeSentence >= 0 && w.sentence === activeSentence;
            const spoken = at >= w.end;
            return (
              <span
                key={k}
                ref={isWord ? current : undefined}
                className={cn(
                  "rounded-[4px] transition-[background-color,color,box-shadow] duration-200",
                  frac !== null && (spoken || inSentence ? "text-ink-1" : "opacity-80"),
                  inSentence && "bg-gold-300/10",
                  isWord && "bg-gold-300/35 text-ink-1 shadow-[0_0_0_2px_rgba(245,162,93,.35)]",
                )}
              >
                {w.tok}
              </span>
            );
          })}
        </p>
      ))}
    </div>
  );
}
