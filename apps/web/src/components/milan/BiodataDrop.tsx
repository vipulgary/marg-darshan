"use client";

import { useTranslations } from "next-intl";
import { type DragEvent, useRef, useState } from "react";
import { Icon } from "@/components/icons";
import { cn } from "@/lib/cn";
import type { BiodataFields } from "@/lib/biodata/parse";
import { parseBiodata } from "@/lib/biodata/parse";
import type { PlaceValue } from "@/lib/contracts";

export interface BiodataFill {
  name?: string;
  dob?: string;
  tob?: string;
  timeUnknown?: boolean;
  place?: PlaceValue | null;
}
type Facts = { height: string | null; education: string | null; profession: string | null };

/**
 * AMX-206 — drop a biodata (PDF / photo) or paste its text; we fill this side of the form.
 * With ANTHROPIC_API_KEY the server's AI reads it (best on photos); otherwise it is read entirely
 * in this browser (PDF text / Tesseract OCR) and never uploaded. Missing birth time switches on
 * "time not known".
 */
export function BiodataDrop({ onFill }: { onFill: (f: BiodataFill) => void }) {
  const t = useTranslations("milan.biodata");
  const input = useRef<HTMLInputElement>(null);
  const [state, setState] = useState<"idle" | "reading" | "done" | "error">("idle");
  const [pct, setPct] = useState<number | null>(null);
  const [paste, setPaste] = useState(false);
  const [pasted, setPasted] = useState("");
  const [over, setOver] = useState(false);
  const [missing, setMissing] = useState<string[]>([]);
  const [facts, setFacts] = useState<Facts | null>(null);

  const apply = async (d: BiodataFields) => {
    let place: PlaceValue | null = null;
    if (d.place) {
      const geo = await fetch(`/api/geo/search?q=${encodeURIComponent(d.place)}`).then((r) => (r.ok ? r.json() : [])).catch(() => []);
      place = (Array.isArray(geo) && geo[0]) || null;
    }
    onFill({ name: d.name ?? undefined, dob: d.dob ?? undefined, tob: d.tob ?? "", timeUnknown: !d.tob, place });
    setMissing([!d.name && "name", !d.dob && "dob", !d.tob && "tob", !place && "place"].filter(Boolean) as string[]);
    setFacts({ height: d.height, education: d.education, profession: d.profession });
    setState(d.name || d.dob ? "done" : "error");
  };

  const read = async (file: File | undefined) => {
    if (!file) return;
    setState("reading");
    setPct(null);
    // 1) Server AI if configured (best on photos/handwriting); 501 = not configured.
    const body = new FormData();
    body.append("file", file);
    const res = await fetch("/api/biodata", { method: "POST", body }).catch(() => null);
    if (res?.ok) return apply((await res.json()) as BiodataFields);
    // 2) Free, private, in-browser reading.
    try {
      const { readBiodataLocally } = await import("@/lib/biodata/read-local");
      await apply(await readBiodataLocally(file, setPct));
    } catch (e) {
      console.error("[biodata] local read failed", e);
      setState("error");
    } finally {
      setPct(null);
    }
  };

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setOver(false);
    void read(e.dataTransfer.files[0]);
  };

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={() => input.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={onDrop}
        className={cn(
          "flex min-h-24 flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed px-4 py-3 text-center transition-colors focus-visible:ring-focus",
          over ? "border-saffron-400 bg-saffron-500/10" : "border-line-gold/60 hover:bg-gold-300/6",
        )}
      >
        <Icon name="upload" size={22} className="text-gold-300" />
        <span className="text-sm font-semibold text-ink-1">{state === "reading" ? (pct !== null ? t("readingPct", { pct }) : t("reading")) : t("drop")}</span>
        <span className="text-xs text-ink-3">{t("types")}</span>
      </button>
      <input ref={input} type="file" accept="application/pdf,image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => void read(e.target.files?.[0])} />
      <button type="button" onClick={() => setPaste((v) => !v)} className="self-start text-xs font-semibold text-gold-300 underline-offset-4 hover:underline focus-visible:ring-focus">
        {t("pasteToggle")}
      </button>
      {paste && (
        <div className="flex flex-col gap-2">
          <textarea
            value={pasted}
            onChange={(e) => setPasted(e.target.value)}
            rows={5}
            placeholder={t("pastePlaceholder")}
            className="w-full rounded-md border border-line bg-night-s2 p-3 text-sm text-ink-1 placeholder:text-ink-3 focus-visible:ring-focus"
          />
          <button type="button" disabled={!pasted.trim()} onClick={() => void apply(parseBiodata(pasted))} className="self-start rounded-full border border-line-gold px-4 py-1.5 text-sm font-semibold text-gold-300 hover:bg-gold-300/8 disabled:opacity-40 focus-visible:ring-focus">
            {t("pasteRead")}
          </button>
        </div>
      )}
      {state === "error" && <p role="alert" className="text-xs text-error">{t("error")}</p>}
      {state === "done" && (
        <div className="flex flex-col gap-1.5 text-xs">
          <p className="text-success">{t("filled")}</p>
          {missing.length > 0 && <p className="text-warning">{t("missing", { fields: missing.map((m) => t(`field.${m}`)).join(", ") })}</p>}
          {facts && (facts.height || facts.education || facts.profession) && (
            <p className="flex flex-wrap gap-1.5">
              {[facts.height, facts.education, facts.profession].filter(Boolean).map((f) => (
                <span key={f} className="rounded-full bg-night-s3 px-2 py-0.5 text-ink-2">
                  {f}
                </span>
              ))}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
