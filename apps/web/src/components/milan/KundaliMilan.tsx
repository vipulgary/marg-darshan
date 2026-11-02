"use client";

import { glyphName } from "@/lib/zodiac";
import { useLocale, useTranslations } from "next-intl";
import { type FormEvent, useEffect, useState } from "react";
import { Icon } from "@/components/icons";
import { BirthplaceCombobox } from "@/components/kundali/BirthplaceCombobox";
import { Button } from "@/components/ui/Button";
import { Badge, Card } from "@/components/ui/Display";
import { Field, Input, Select } from "@/components/ui/Field";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/cn";
import type { PlaceValue } from "@/lib/contracts";
import type { MatchResult } from "@/lib/engine/client";
import { SIGN_NAMES } from "@/lib/kundali/chart-layout";

export interface MilanProfile {
  id: string;
  label: string;
  name: string;
  gender: "male" | "female" | "other";
  dob: string;
  tob: string;
  place: PlaceValue;
}

/** Koots grouped into life aspects a couple understands. */
const ASPECTS: { key: string; koots: MatchResult["koots"][number]["key"][] }[] = [
  { key: "love", koots: ["yoni", "vashya"] },
  { key: "mind", koots: ["maitri", "gana"] },
  { key: "family", koots: ["bhakoot"] },
  { key: "health", koots: ["nadi", "tara"] },
  { key: "work", koots: ["varna"] },
];

/** Moon-sign element: 0 fire, 1 earth, 2 air, 3 water. */
const element = (rashiEn: string) => {
  const i = SIGN_NAMES.en.indexOf(rashiEn);
  return i < 0 ? null : i % 4;
};
function elementMatch(a: string, b: string): "same" | "complement" | "effort" | null {
  const x = element(a);
  const y = element(b);
  if (x === null || y === null) return null;
  if (x === y) return "same";
  const pair = [x, y].sort().join("");
  return pair === "02" || pair === "13" ? "complement" : "effort";
}

interface Person {
  name: string;
  dob: string;
  tob: string;
  place: PlaceValue | null;
}
const EMPTY: Person = { name: "", dob: "", tob: "", place: null };

const VERDICT_TONE = { excellent: "success", good: "success", average: "warning", low: "error" } as const;

function PersonForm({ side, value, onChange, bad, profiles }: { side: "boy" | "girl"; value: Person; onChange: (p: Person) => void; bad: string[]; profiles: MilanProfile[] }) {
  const t = useTranslations("milan");
  const has = (k: string) => bad.some((b) => b === `${side}.${k}` || b.startsWith(`${side}.${k}.`));
  // AMX-202: the boy's side never lists female profiles and vice versa ("other" fits either side).
  const opposite = side === "boy" ? "female" : "male";
  const visibleProfiles = profiles.filter((p) => p.gender !== opposite);
  return (
    <Card className="flex flex-col gap-4">
      <h2 className="flex items-center gap-2 text-xl">
        <Icon name="user" size={22} className="text-gold-300" /> {t(side)}
      </h2>
      {visibleProfiles.length > 0 && (
        <Field label={t("fromProfile")}>
          {(id) => (
            <Select
              id={id}
              defaultValue=""
              onChange={(e) => {
                const p = visibleProfiles.find((x) => x.id === e.target.value);
                if (p) onChange({ name: p.name || p.label, dob: p.dob, tob: p.tob, place: p.place });
              }}
            >
              <option value="">{t("chooseProfile")}</option>
              {visibleProfiles.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                  {p.name ? ` — ${p.name}` : ""}
                </option>
              ))}
            </Select>
          )}
        </Field>
      )}
      <Field label={t("name")} required error={has("name") ? t("required") : undefined}>
        {(id, d) => <Input id={id} aria-describedby={d} aria-invalid={has("name")} value={value.name} onChange={(e) => onChange({ ...value, name: e.target.value })} />}
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t("dob")} required error={has("dob") ? t("required") : undefined}>
          {(id, d) => <Input id={id} type="date" aria-describedby={d} aria-invalid={has("dob")} value={value.dob} onChange={(e) => onChange({ ...value, dob: e.target.value })} />}
        </Field>
        <Field label={t("tob")} required error={has("tob") ? t("required") : undefined}>
          {(id, d) => <Input id={id} type="time" aria-describedby={d} aria-invalid={has("tob")} value={value.tob} onChange={(e) => onChange({ ...value, tob: e.target.value })} />}
        </Field>
      </div>
      <BirthplaceCombobox label={t("place")} required value={value.place} onChange={(place) => onChange({ ...value, place })} error={has("place") ? t("required") : undefined} />
    </Card>
  );
}

export function KundaliMilan({ profiles = [] }: { profiles?: MilanProfile[] }) {
  const t = useTranslations("milan");
  const locale = useLocale();
  const hi = locale !== "en";
  const [boy, setBoy] = useState<Person>(EMPTY);
  const [girl, setGirl] = useState<Person>(EMPTY);
  const [bad, setBad] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<MatchResult | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    const res = await fetch("/api/milan", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ boy, girl, lang: hi ? "hi" : "en" }) }).catch(() => null);
    const data = res ? await res.json().catch(() => ({})) : {};
    setBusy(false);
    if (res?.ok) {
      setResult(data as MatchResult);
      setBad([]);
      requestAnimationFrame(() => document.getElementById("milan-result")?.scrollIntoView({ behavior: "smooth", block: "start" }));
    } else {
      setBad((data as { issues?: string[] }).issues ?? []);
      setError((data as { issues?: string[] }).issues ? t("fixFields") : t("error"));
    }
  };

  // Printing always uses the light theme (users save the result as a PDF).
  useEffect(() => {
    const root = document.documentElement;
    let wasLight = false;
    const before = () => {
      wasLight = root.classList.contains("light");
      root.classList.add("light");
    };
    const afterPrint = () => {
      if (!wasLight) root.classList.remove("light");
    };
    window.addEventListener("beforeprint", before);
    window.addEventListener("afterprint", afterPrint);
    return () => {
      window.removeEventListener("beforeprint", before);
      window.removeEventListener("afterprint", afterPrint);
    };
  }, []);

  const pct = result ? Math.round((result.total / result.max) * 100) : 0;
  const nm = (p: MatchResult["boy"], k: "rashi" | "nakshatra" | "lagna") => {
    const v = hi ? p[`${k}_hi`] : p[`${k}_en`];
    return k === "nakshatra" ? v : glyphName(v);
  };

  return (
    <div className="flex flex-col gap-8">
      <form onSubmit={submit} noValidate className="flex flex-col gap-6">
        <div className="grid gap-6 lg:grid-cols-2">
          <PersonForm side="boy" value={boy} onChange={setBoy} bad={bad} profiles={profiles} />
          <PersonForm side="girl" value={girl} onChange={setGirl} bad={bad} profiles={profiles} />
        </div>
        {error && <p role="alert" className="text-error">{error}</p>}
        <Button type="submit" size="lg" className="self-center" loading={busy} loadingLabel={t("matching")} iconRight={<Icon name="arrow-right" size={18} />}>
          {t("submit")}
        </Button>
      </form>

      {result && (
        <section id="milan-result" aria-live="polite" className="milan-print flex scroll-mt-24 flex-col gap-6">
          <style>{"@media print{@page{size:A4;margin:12mm}body *{visibility:hidden!important}.milan-print,.milan-print *{visibility:visible!important}.milan-print{position:absolute;inset:0 auto auto 0;width:100%}.no-print{display:none!important}}"}</style>
          <div className="hidden items-center gap-3 border-b-2 border-saffron-600 pb-3 print:flex">
            {/* eslint-disable-next-line @next/next/no-img-element -- plain img prints reliably */}
            <img src="/brand/emblem.png" alt="" width={44} height={44} className="h-11 w-11 rounded-full" />
            <div>
              <p className="text-lg font-bold text-ink-1">{hi ? "मार्ग-दर्शन" : "Marg Darshan"} · {t("title")}</p>
              <p className="text-xs text-ink-3">{new Date().toLocaleDateString(hi ? "hi-IN" : "en-IN", { dateStyle: "long" })}</p>
            </div>
          </div>
          <Card className="flex flex-col items-center gap-3 text-center">
            <p className="text-sm text-ink-3">
              {result.boy.name} × {result.girl.name}
            </p>
            <p className="font-display text-6xl text-ink-1">
              {result.total}
              <span className="text-2xl text-ink-3">/36</span>
            </p>
            <div className="h-3 w-full max-w-md overflow-hidden rounded-full bg-night-s3">
              <div className="h-full bg-grad-gold" style={{ width: `${pct}%` }} />
            </div>
            <Badge tone={VERDICT_TONE[result.verdict]}>{t(`verdict.${result.verdict}`)}</Badge>
            <p className="max-w-[60ch] text-ink-2">{t(`verdictText.${result.verdict}`)}</p>
          </Card>

          <Card>
            <h2 className="mb-4 text-xl">{t("aspectsTitle")}</h2>
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              {ASPECTS.map((a) => {
                const ks = result.koots.filter((k) => a.koots.includes(k.key));
                const score = ks.reduce((n, k) => n + k.score, 0);
                const max = ks.reduce((n, k) => n + k.max, 0);
                const pct = max ? Math.round((score / max) * 100) : 0;
                return (
                  <li key={a.key} className="flex flex-col gap-1.5">
                    <span className="text-sm font-semibold text-ink-1">{t(`aspects.${a.key}`)}</span>
                    <span className="font-display text-2xl text-ink-1">{pct}%</span>
                    <div className="h-2 overflow-hidden rounded-full bg-night-s3">
                      <div className={cn("h-full", pct >= 70 ? "bg-success" : pct >= 40 ? "bg-warning" : "bg-error")} style={{ width: `${Math.max(4, pct)}%` }} />
                    </div>
                    <span className="text-xs text-ink-3">
                      {score}/{max} {t("gunas")}
                    </span>
                  </li>
                );
              })}
            </ul>
            {(() => {
              const em = elementMatch(result.boy.rashi_en, result.girl.rashi_en);
              return em ? (
                <p className="mt-5 rounded-md bg-night-s2 p-4 text-ink-2">
                  <strong className="text-ink-1">
                    {nm(result.boy, "rashi")} × {nm(result.girl, "rashi")}:{" "}
                  </strong>
                  {t(`element.${em}`)}
                </p>
              ) : null;
            })()}
          </Card>

          <div className="grid gap-4 sm:grid-cols-2">
            {(["boy", "girl"] as const).map((s) => (
              <Card key={s} className="text-sm">
                <p className="mb-1 font-semibold text-ink-1">{result[s].name}</p>
                <p>
                  {t("rashi")}: {nm(result[s], "rashi")} · {t("nakshatra")}: {nm(result[s], "nakshatra")} · {t("lagna")}: {nm(result[s], "lagna")}
                </p>
                <p className="mt-1">{result[s].manglik ? t("isManglik") : t("notManglik")}</p>
              </Card>
            ))}
          </div>

          <Card>
            <h2 className="mb-4 text-xl">{t("kootsTitle")}</h2>
            <ul className="flex flex-col gap-4">
              {result.koots.map((k) => {
                const ratio = k.score / k.max;
                return (
                  <li key={k.key}>
                    <div className="mb-1 flex items-baseline justify-between gap-3">
                      <span className="font-semibold text-ink-1">{t(`koot.${k.key}.name`)}</span>
                      <span className="tabular-nums text-ink-2">
                        {k.score}/{k.max}
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-night-s3">
                      <div className={cn("h-full", ratio >= 0.75 ? "bg-success" : ratio >= 0.4 ? "bg-warning" : "bg-error")} style={{ width: `${Math.max(4, ratio * 100)}%` }} />
                    </div>
                    <p className="mt-1 text-sm text-ink-3">{t(`koot.${k.key}.meaning`)}</p>
                  </li>
                );
              })}
            </ul>
          </Card>

          <Card className="flex flex-col gap-3">
            <h2 className="text-xl">{t("doshaTitle")}</h2>
            <p>
              <strong className="text-ink-1">{t("nadi")}: </strong>
              {!result.nadi_dosha.present ? t("noDosha") : result.nadi_dosha.cancelled ? t("cancelled") : t("nadiPresent")}
            </p>
            <p>
              <strong className="text-ink-1">{t("bhakoot")}: </strong>
              {!result.bhakoot_dosha.present ? t("noDosha") : result.bhakoot_dosha.cancelled ? t("cancelled") : t("bhakootPresent")}
            </p>
            <p>
              <strong className="text-ink-1">{t("manglik")}: </strong>
              {t(`manglikMatch.${result.manglik}`)}
            </p>
          </Card>

          <Card className="flex flex-col items-start gap-3">
            <p className="text-ink-2">{t("consultNote")}</p>
            <button type="button" onClick={() => window.print()} className="no-print inline-flex min-h-11 items-center gap-2 rounded-full border border-line-gold px-5 font-semibold text-gold-300 hover:bg-gold-300/8 focus-visible:ring-focus">
              <Icon name="printer" size={18} /> {t("print")}
            </button>
            <Link href="/book-appointment?problem=marriage" className="no-print inline-flex min-h-11 items-center gap-2 rounded-full bg-grad-gold px-5 font-semibold text-ink-ongold focus-visible:ring-focus">
              <Icon name="calendar" size={18} /> {t("book")}
            </Link>
          </Card>
        </section>
      )}
    </div>
  );
}
