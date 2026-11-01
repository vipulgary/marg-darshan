"use client";

import { useTranslations } from "next-intl";
import { type KeyboardEvent, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Display";
import { Field, Input, Select } from "@/components/ui/Field";
import { cn } from "@/lib/cn";
import type { PlaceValue } from "@/lib/contracts";
import { Icon } from "@/components/icons";

export const TZ_OPTIONS = [
  "Asia/Kolkata",
  "Asia/Kathmandu",
  "Asia/Dhaka",
  "Asia/Karachi",
  "Asia/Colombo",
  "Asia/Dubai",
  "Asia/Singapore",
  "Asia/Tokyo",
  "Europe/London",
  "Europe/Berlin",
  "America/New_York",
  "America/Chicago",
  "America/Los_Angeles",
  "America/Toronto",
  "Australia/Sydney",
  "Africa/Nairobi",
  "UTC",
];

interface Props {
  value: PlaceValue | null;
  onChange: (v: PlaceValue | null) => void;
  label: string;
  error?: string;
  required?: boolean;
  hint?: string;
  /** Pre-fills the search text (e.g. from a ?place= deep link) without selecting anything. */
  initialQuery?: string;
  placeholder?: string;
}

type Status = "idle" | "loading" | "done" | "error";

function Highlight({ text, query }: { text: string; query: string }) {
  const q = query.trim();
  const i = q ? text.toLowerCase().indexOf(q.toLowerCase()) : -1;
  if (i < 0) return <>{text}</>;
  return (
    <>
      {text.slice(0, i)}
      <span className="text-gold-300">{text.slice(i, i + q.length)}</span>
      {text.slice(i + q.length)}
    </>
  );
}

/** AMX-060 — ARIA 1.2 combobox over GET /api/geo/search, with manual lat/long fallback. */
export function BirthplaceCombobox({ value, onChange, label, error, required, hint, initialQuery, placeholder }: Props) {
  const t = useTranslations("kundali.place");
  const [query, setQuery] = useState(value?.placeName ?? initialQuery ?? "");
  const [results, setResults] = useState<PlaceValue[]>([]);
  const [status, setStatus] = useState<Status>("idle");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [manual, setManual] = useState({ lat: "", lng: "", tz: "Asia/Kolkata" });
  const [manualError, setManualError] = useState(false);

  // Keep the text in sync when the parent value / prefill changes (e.g. drafts restored after mount).
  const [synced, setSynced] = useState({ value, initialQuery });
  if (synced.value !== value || synced.initialQuery !== initialQuery) {
    setSynced({ value, initialQuery });
    if (value && value.placeName !== query) setQuery(value.placeName);
    else if (!value && initialQuery && initialQuery !== synced.initialQuery) setQuery(initialQuery);
  }

  const cache = useRef(new Map<string, PlaceValue[]>());
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const inflight = useRef<AbortController | null>(null);
  const listRef = useRef<HTMLUListElement>(null);

  useEffect(
    () => () => {
      clearTimeout(timer.current);
      inflight.current?.abort();
    },
    [],
  );

  useEffect(() => {
    if (active < 0) return;
    listRef.current?.querySelector(`[data-index="${active}"]`)?.scrollIntoView({ block: "nearest" });
  }, [active]);

  function search(q: string) {
    clearTimeout(timer.current);
    inflight.current?.abort();
    const term = q.trim();
    if (term.length < 2) {
      setStatus("idle");
      setResults([]);
      return;
    }
    const hit = cache.current.get(term.toLowerCase());
    if (hit) {
      setResults(hit);
      setStatus("done");
      setActive(-1);
      return;
    }
    setStatus("loading");
    timer.current = setTimeout(async () => {
      const ctrl = new AbortController();
      inflight.current = ctrl;
      try {
        const res = await fetch(`/api/geo/search?q=${encodeURIComponent(term)}`, { signal: ctrl.signal });
        if (!res.ok) throw new Error(String(res.status));
        const data = (await res.json()) as PlaceValue[];
        cache.current.set(term.toLowerCase(), data);
        setResults(data);
        setStatus("done");
        setActive(-1);
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
        setResults([]);
        setStatus("error");
      }
    }, 300);
  }

  function select(p: PlaceValue) {
    onChange(p);
    setQuery(p.placeName);
    setOpen(false);
    setActive(-1);
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        if (!open) {
          setOpen(true);
          if (status === "idle") search(query);
        } else setActive((i) => Math.min(results.length - 1, i + 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        setActive((i) => Math.max(0, i - 1));
        break;
      case "Enter":
        if (open && results.length) {
          e.preventDefault();
          select(results[active >= 0 ? active : 0]);
        }
        break;
      case "Escape":
        if (open) {
          e.preventDefault();
          setOpen(false);
        }
        break;
      case "Tab":
        setOpen(false);
        break;
    }
  }

  function applyManual() {
    const lat = Number(manual.lat);
    const lng = Number(manual.lng);
    if (manual.lat.trim() === "" || manual.lng.trim() === "" || !(Math.abs(lat) <= 90) || !(Math.abs(lng) <= 180)) {
      setManualError(true);
      return;
    }
    setManualError(false);
    select({ placeName: query.trim() || `${lat.toFixed(4)}, ${lng.toFixed(4)}`, latitude: lat, longitude: lng, tzName: manual.tz });
  }

  const showList = open && query.trim().length >= 2 && status !== "idle";
  const statusText =
    status === "loading" ? t("searching") : status === "error" ? t("error") : status === "done" ? (results.length ? t("resultsCount", { count: results.length }) : t("noResults")) : "";

  return (
    <div className="flex flex-col gap-3">
      <Field label={label} hint={hint} error={error} required={required}>
        {(id, describedBy) => {
          const listId = `${id}-list`;
          return (
            <div className="relative">
              <svg aria-hidden viewBox="0 0 20 20" className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-ink-3">
                <circle cx="9" cy="9" r="6" fill="none" stroke="currentColor" strokeWidth="1.6" />
                <path d="M13.5 13.5L17 17" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
              <Input
                id={id}
                data-field="place"
                role="combobox"
                aria-autocomplete="list"
                aria-expanded={showList}
                aria-controls={listId}
                aria-activedescendant={showList && active >= 0 ? `${listId}-${active}` : undefined}
                aria-describedby={describedBy}
                aria-invalid={!!error || undefined}
                aria-required={required || undefined}
                autoComplete="off"
                spellCheck={false}
                placeholder={placeholder ?? t("placeholder")}
                value={query}
                onChange={(e) => {
                  const q = e.target.value;
                  setQuery(q);
                  setOpen(true);
                  if (value) onChange(null);
                  search(q);
                }}
                onFocus={() => {
                  if (!value && query.trim().length >= 2) {
                    setOpen(true);
                    if (status === "idle") search(query);
                  }
                }}
                onBlur={() => setOpen(false)}
                onKeyDown={onKeyDown}
                className="pl-11 pr-11"
              />
              {value && (
                <Icon name="check" size={18} animate="none" className="absolute right-4 top-1/2 -translate-y-1/2 text-success" />
              )}
              <ul
                ref={listRef}
                id={listId}
                role="listbox"
                aria-label={label}
                aria-busy={status === "loading" || undefined}
                hidden={!showList}
                className="absolute inset-x-0 top-full z-30 mt-2 max-h-80 overflow-auto rounded-md border border-line bg-night-s1/95 p-1.5 shadow-e2 backdrop-blur-[18px]"
              >
                {status === "loading" &&
                  [0, 1, 2].map((i) => (
                    <li key={i} aria-hidden className="flex items-center gap-3 px-3 py-2.5">
                      <Skeleton className="h-4 w-4 rounded-full" />
                      <Skeleton className="h-4 flex-1" />
                    </li>
                  ))}
                {status === "done" &&
                  results.map((p, i) => {
                    const [head, ...rest] = p.placeName.split(",");
                    return (
                      <li
                        key={`${p.placeName}-${p.latitude}-${p.longitude}`}
                        id={`${listId}-${i}`}
                        data-index={i}
                        role="option"
                        aria-selected={i === active}
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => select(p)}
                        onMouseEnter={() => setActive(i)}
                        className={cn(
                          "relative flex min-h-11 cursor-pointer items-start gap-2.5 rounded-sm px-3 py-2 text-[15px] text-ink-2",
                          i === active && "bg-night-s3 text-ink-1 before:absolute before:inset-y-2 before:left-0 before:w-0.5 before:rounded-full before:bg-gold-300",
                        )}
                      >
                        <Icon name="map-pin" size={18} className="mt-0.5 text-gold-300" />
                        <span className="min-w-0 flex-1">
                          <span className="font-semibold text-ink-1">
                            <Highlight text={head.trim()} query={query} />
                          </span>
                          {rest.length > 0 && <span className="block truncate text-[13px] text-ink-3">{rest.join(",").trim()}</span>}
                        </span>
                        <span className="shrink-0 pt-0.5 text-xs text-ink-3">{p.tzName}</span>
                      </li>
                    );
                  })}
                {(status === "error" || (status === "done" && results.length === 0)) && (
                  <li className="px-3 py-3 text-sm text-ink-3">{status === "error" ? t("error") : t("noResults")}</li>
                )}
              </ul>
              <p className="sr-only" aria-live="polite">
                {open ? statusText : ""}
              </p>
            </div>
          );
        }}
      </Field>

      {value && (
        <p className="flex flex-wrap items-center gap-x-2 text-xs text-ink-3">
          <span className="sr-only">{t("selected")}:</span>
          <span className="inline-flex items-center gap-1 text-ink-2"><Icon name="map-pin" size={14} animate="none" /> {value.placeName}</span>
          <span aria-hidden>·</span>
          <span>{value.tzName}</span>
          <span aria-hidden>·</span>
          <span className="tabular-nums">
            {value.latitude.toFixed(4)}, {value.longitude.toFixed(4)}
          </span>
        </p>
      )}

      <details
        className="group rounded-md border border-line-subtle bg-night-s1/60 open:border-line"
        onToggle={(e) => {
          if ((e.currentTarget as HTMLDetailsElement).open && value && !manual.lat) {
            setManual({ lat: String(value.latitude), lng: String(value.longitude), tz: TZ_OPTIONS.includes(value.tzName) ? value.tzName : "Asia/Kolkata" });
          }
        }}
      >
        <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2 rounded-md px-4 text-sm text-violet-300 hover:text-gold-300 focus-visible:ring-focus [&::-webkit-details-marker]:hidden">
          <span aria-hidden className="transition-transform group-open:rotate-90">
            ›
          </span>
          {t("advanced")}
        </summary>
        <div className="grid gap-4 px-4 pb-4 sm:grid-cols-2">
          <Field label={t("lat")}>
            {(id, d) => (
              <Input id={id} aria-describedby={d} type="number" inputMode="decimal" step="any" min={-90} max={90} value={manual.lat} onChange={(e) => setManual((m) => ({ ...m, lat: e.target.value }))} />
            )}
          </Field>
          <Field label={t("lng")}>
            {(id, d) => (
              <Input id={id} aria-describedby={d} type="number" inputMode="decimal" step="any" min={-180} max={180} value={manual.lng} onChange={(e) => setManual((m) => ({ ...m, lng: e.target.value }))} />
            )}
          </Field>
          <div className="sm:col-span-2">
            <Field label={t("tz")}>
              {(id, d) => (
                <Select id={id} aria-describedby={d} value={manual.tz} onChange={(e) => setManual((m) => ({ ...m, tz: e.target.value }))}>
                  {TZ_OPTIONS.map((tz) => (
                    <option key={tz} value={tz}>
                      {tz}
                    </option>
                  ))}
                </Select>
              )}
            </Field>
          </div>
          {manualError && (
            <p role="alert" className="text-[13px] text-error sm:col-span-2">
              <Icon name="alert-triangle" size={14} animate="none" className="mr-1 inline-block align-[-2px]" />{t("coordsInvalid")}
            </p>
          )}
          <div className="sm:col-span-2">
            <Button type="button" variant="secondary" size="sm" className="h-11" onClick={applyManual}>
              {t("useCoords")}
            </Button>
          </div>
        </div>
      </details>
    </div>
  );
}
