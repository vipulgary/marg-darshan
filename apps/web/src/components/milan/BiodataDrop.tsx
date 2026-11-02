"use client";

import { useTranslations } from "next-intl";
import { type DragEvent, useRef, useState } from "react";
import { Icon } from "@/components/icons";
import { cn } from "@/lib/cn";
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
 * AMX-206 — drop a biodata (PDF / photo); the server reads it and we fill this side of the form.
 * Missing birth time switches on "time not known". The file is sent once for reading and not stored.
 */
export function BiodataDrop({ onFill }: { onFill: (f: BiodataFill) => void }) {
  const t = useTranslations("milan.biodata");
  const input = useRef<HTMLInputElement>(null);
  const [state, setState] = useState<"idle" | "reading" | "done" | "error" | "off">("idle");
  const [over, setOver] = useState(false);
  const [missing, setMissing] = useState<string[]>([]);
  const [facts, setFacts] = useState<Facts | null>(null);

  const read = async (file: File | undefined) => {
    if (!file) return;
    setState("reading");
    const body = new FormData();
    body.append("file", file);
    const res = await fetch("/api/biodata", { method: "POST", body }).catch(() => null);
    if (res?.status === 501) return setState("off");
    if (!res?.ok) return setState("error");
    const d = (await res.json()) as { name: string | null; dob: string | null; tob: string | null; place: string | null } & Facts;

    let place: PlaceValue | null = null;
    if (d.place) {
      const geo = await fetch(`/api/geo/search?q=${encodeURIComponent(d.place)}`).then((r) => (r.ok ? r.json() : [])).catch(() => []);
      place = (Array.isArray(geo) && geo[0]) || null;
    }
    onFill({ name: d.name ?? undefined, dob: d.dob ?? undefined, tob: d.tob ?? "", timeUnknown: !d.tob, place });
    setMissing([!d.name && "name", !d.dob && "dob", !d.tob && "tob", !place && "place"].filter(Boolean) as string[]);
    setFacts({ height: d.height, education: d.education, profession: d.profession });
    setState("done");
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
        <span className="text-sm font-semibold text-ink-1">{state === "reading" ? t("reading") : t("drop")}</span>
        <span className="text-xs text-ink-3">{t("types")}</span>
      </button>
      <input ref={input} type="file" accept="application/pdf,image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => void read(e.target.files?.[0])} />
      {state === "off" && <p className="text-xs text-ink-3">{t("off")}</p>}
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
      <p className="text-[11px] text-ink-3">{t("privacy")}</p>
    </div>
  );
}
