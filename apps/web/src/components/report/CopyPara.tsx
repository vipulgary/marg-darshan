"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";

/** One copy-to-clipboard button for a whole section; sits top-right of its block (hidden in print). */
export function CopyPara({ text, label }: { text: string; label: string }) {
  const [done, setDone] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setDone(true);
      window.setTimeout(() => setDone(false), 1500);
    } catch {
      // Clipboard blocked: nothing to do.
    }
  };
  return (
      <button
        type="button"
        onClick={copy}
        aria-label={label}
        title={label}
        className={cn(
          "no-print absolute right-0 top-0 grid h-8 w-8 place-items-center rounded-md text-ink-3 transition-colors hover:bg-night-s2 hover:text-gold-300 focus-visible:ring-focus print:hidden",
          done && "text-success",
        )}
      >
        <svg aria-hidden viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          {done ? <path d="m5 12 5 5L20 7" /> : <><rect x="9" y="9" width="11" height="11" rx="2" /><path d="M5 15V6a2 2 0 0 1 2-2h9" /></>}
        </svg>
      </button>
  );
}
