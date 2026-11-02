"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";

/**
 * AMX-203 — read a report section aloud with the browser's speech engine.
 * Play/pause, progress, time left and 1x/1.5x/2x. Prefers a natural female voice in the page
 * language; if the browser has no voice for that language it says so instead of mis-reading.
 *
 * Reliability notes (all of these broke the first version):
 *  - text is spoken in short sentence chunks (Chrome cuts long utterances at ~15 s);
 *  - every start gets a run id, so callbacks from a cancelled run are ignored (no double audio);
 *  - pause = cancel + remember the chunk (Google voices ignore speechSynthesis.pause());
 *  - zodiac glyphs and decorative symbols are stripped before speaking.
 */

type Rate = 1 | 1.5 | 2;
const RATES: Rate[] = [1, 1.5, 2];
/** Spoken characters per second at 1x, used for the time-left estimate until calibrated. */
const CPS = { hi: 13, en: 15 };

// Preferred voices, best first: natural/neural female voices on Edge, Windows, Chrome, macOS, Android.
const PREFERRED = {
  hi: ["swara", "kalpana", "heera", "lekha", "google हिन्दी", "hindi female", "hindi"],
  en: ["neerja", "heera", "veena", "google uk english female", "zira", "samantha", "female"],
};

let stopOthers: (() => void) | null = null;

function cleanForSpeech(text: string): string {
  return text
    .replace(/[♈-♓]︎?/g, "") // ♈︎…♓︎
    .replace(/[·•|]/g, ", ")
    .replace(/\s+[—–]\s+/g, ", ")
    .replace(/\s+/g, " ")
    .trim();
}

function chunk(text: string): string[] {
  const out: string[] = [];
  for (const sentence of cleanForSpeech(text).split(/(?<=[.!?।])\s+/)) {
    if (sentence.length <= 180) {
      if (sentence) out.push(sentence);
      continue;
    }
    let buf = "";
    for (const part of sentence.split(/(?<=[,;:])\s+/)) {
      if ((buf + " " + part).trim().length > 180 && buf) {
        out.push(buf.trim());
        buf = part;
      } else buf = `${buf} ${part}`;
    }
    if (buf.trim()) out.push(buf.trim());
  }
  return out;
}

function voicesReady(): Promise<SpeechSynthesisVoice[]> {
  const synth = window.speechSynthesis;
  const now = synth.getVoices();
  if (now.length) return Promise.resolve(now);
  return new Promise((resolve) => {
    const done = () => {
      synth.removeEventListener("voiceschanged", done);
      resolve(synth.getVoices());
    };
    synth.addEventListener("voiceschanged", done);
    window.setTimeout(done, 1500);
  });
}

function pickVoice(voices: SpeechSynthesisVoice[], lang: "hi" | "en"): SpeechSynthesisVoice | null {
  const inLang = voices.filter((v) => v.lang.toLowerCase().replace("_", "-").startsWith(lang === "hi" ? "hi" : "en"));
  if (!inLang.length) return null;
  const indian = (v: SpeechSynthesisVoice) => v.lang.toLowerCase().includes("in");
  for (const hint of PREFERRED[lang]) {
    const hit = inLang.find((v) => v.name.toLowerCase().includes(hint) && (lang === "hi" || indian(v))) ?? inLang.find((v) => v.name.toLowerCase().includes(hint));
    if (hit) return hit;
  }
  return inLang.find(indian) ?? inLang[0];
}

const fmt = (s: number) => {
  const t = Math.max(0, Math.round(s));
  return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, "0")}`;
};

export function VoiceSectionPlayer({ text, locale, title, className }: { text: string; locale: string; title?: string; className?: string }) {
  const lang: "hi" | "en" = locale === "en" ? "en" : "hi";
  const [supported, setSupported] = useState(false);
  const [noVoice, setNoVoice] = useState(false);
  const [state, setState] = useState<"idle" | "playing" | "paused">("idle");
  const [rate, setRate] = useState<Rate>(1);
  const [progress, setProgress] = useState(0);
  const [left, setLeft] = useState(0);

  const chunks = useRef<string[]>([]);
  const index = useRef(0);
  const run = useRef(0);
  const voice = useRef<SpeechSynthesisVoice | null>(null);
  const cps = useRef(CPS[lang]);
  const rateRef = useRef<Rate>(1);
  const chunkStartedAt = useRef(0);
  const self = useRef<() => void>(() => {});

  useEffect(() => {
    // Feature detection has to wait for the browser.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSupported(typeof window !== "undefined" && "speechSynthesis" in window);
  }, []);

  useEffect(() => {
    chunks.current = chunk(text);
  }, [text]);

  const totalChars = () => chunks.current.reduce((n, c) => n + c.length, 0) || 1;
  const charsBefore = (i: number) => chunks.current.slice(0, i).reduce((n, c) => n + c.length, 0);

  const update = useCallback(() => {
    const done = charsBefore(index.current);
    setProgress(Math.round((done / totalChars()) * 100));
    setLeft((totalChars() - done) / (cps.current * rateRef.current));
  }, []);

  const stop = useCallback(() => {
    run.current++;
    window.speechSynthesis?.cancel();
    index.current = 0;
    setState("idle");
    setProgress(0);
    if (stopOthers === self.current) stopOthers = null;
  }, []);
  useEffect(() => {
    self.current = stop;
  }, [stop]);

  const speakFrom = useCallback(
    (i: number) => {
      const id = ++run.current;
      const synth = window.speechSynthesis;
      synth.cancel();
      const next = (k: number) => {
        if (id !== run.current) return;
        if (k >= chunks.current.length) {
          stop();
          return;
        }
        index.current = k;
        update();
        const u = new SpeechSynthesisUtterance(chunks.current[k]);
        u.lang = voice.current?.lang ?? (lang === "hi" ? "hi-IN" : "en-IN");
        if (voice.current) u.voice = voice.current;
        u.rate = rateRef.current;
        u.onstart = () => {
          chunkStartedAt.current = performance.now();
        };
        u.onend = () => {
          if (id !== run.current) return;
          // Calibrate the time estimate from how long this chunk really took.
          const secs = (performance.now() - chunkStartedAt.current) / 1000;
          if (secs > 0.5) cps.current = 0.7 * cps.current + 0.3 * ((chunks.current[k].length / secs) / rateRef.current);
          next(k + 1);
        };
        u.onerror = (e) => {
          if (id !== run.current || e.error === "interrupted" || e.error === "canceled") return;
          next(k + 1);
        };
        synth.speak(u);
      };
      next(i);
    },
    [lang, stop, update],
  );

  useEffect(() => () => stop(), [stop]);

  const play = async () => {
    if (state === "playing") {
      // Pause = stop speaking but keep our place (pause()/resume() is unreliable across voices).
      run.current++;
      window.speechSynthesis.cancel();
      setState("paused");
      return;
    }
    if (stopOthers && stopOthers !== self.current) stopOthers();
    stopOthers = self.current;
    if (!voice.current) {
      voice.current = pickVoice(await voicesReady(), lang);
      if (!voice.current) {
        setNoVoice(true);
        return;
      }
    }
    setState("playing");
    speakFrom(state === "paused" ? index.current : 0);
  };

  const cycleRate = () => {
    const nextRate = RATES[(RATES.indexOf(rate) + 1) % RATES.length];
    setRate(nextRate);
    rateRef.current = nextRate;
    update();
    if (state === "playing") speakFrom(index.current);
  };

  if (!supported) return null;

  if (noVoice) {
    return (
      <span className={cn("no-print text-xs text-ink-3 print:hidden", className)}>
        {lang === "hi" ? "इस ब्राउज़र में हिंदी आवाज़ उपलब्ध नहीं — Chrome या Edge में खोलें" : "No English voice in this browser — try Chrome or Edge"}
      </span>
    );
  }

  const label = state === "playing" ? (lang === "hi" ? "रोकें" : "Pause") : state === "paused" ? (lang === "hi" ? "जारी रखें" : "Resume") : lang === "hi" ? "सुनें" : "Listen";

  return (
    <div
      role="group"
      aria-label={title ? `${title} — ${lang === "hi" ? "आवाज़" : "audio"}` : undefined}
      className={cn(
        "no-print flex items-center gap-1.5 rounded-full border border-line bg-night-s2 px-1.5 py-1 text-xs text-ink-2 print:hidden",
        state !== "idle" && "border-line-gold",
        className,
      )}
    >
      <button
        type="button"
        onClick={play}
        aria-label={label}
        className="inline-flex h-8 items-center gap-1.5 rounded-full px-2.5 font-semibold text-gold-300 hover:bg-gold-300/10 focus-visible:ring-focus"
      >
        <svg aria-hidden viewBox="0 0 24 24" className="h-4 w-4 fill-current">
          {state === "playing" ? <path d="M6 5h4v14H6zM14 5h4v14h-4z" /> : <path d="M8 5v14l11-7z" />}
        </svg>
        {label}
      </button>
      {state !== "idle" && (
        <>
          <div className="hidden h-1.5 w-20 overflow-hidden rounded-full bg-night-s3 sm:block" aria-hidden>
            <div className="h-full bg-grad-gold transition-[width] duration-300" style={{ width: `${Math.max(4, progress)}%` }} />
          </div>
          <span className="tabular-nums text-ink-3" aria-label={lang === "hi" ? "शेष समय" : "time left"}>
            -{fmt(left)}
          </span>
          <button type="button" onClick={cycleRate} aria-label={`${lang === "hi" ? "गति" : "Speed"} ${rate}x`} className="h-8 rounded-full px-2 font-semibold text-ink-1 hover:bg-gold-300/10 focus-visible:ring-focus">
            {rate}x
          </button>
          <button type="button" onClick={stop} aria-label={lang === "hi" ? "बंद करें" : "Stop"} className="grid h-8 w-8 place-items-center rounded-full text-ink-3 hover:text-ink-1 focus-visible:ring-focus">
            <svg aria-hidden viewBox="0 0 24 24" className="h-3 w-3 fill-current">
              <rect x="5" y="5" width="14" height="14" rx="2" />
            </svg>
          </button>
        </>
      )}
    </div>
  );
}
