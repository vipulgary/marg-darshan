"use client";

import { useLocale, useTranslations } from "next-intl";
import { type FormEvent, useEffect, useRef, useState } from "react";
import { Icon } from "@/components/icons";
import { BirthplaceCombobox } from "@/components/kundali/BirthplaceCombobox";
import { EnquiryButton } from "@/components/shop/EnquiryModal";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Display";
import { Field, Input, Select } from "@/components/ui/Field";
import { Link, useRouter } from "@/i18n/navigation";
import { useViewer } from "@/components/account/useViewer";
import { cn } from "@/lib/cn";
import type { PlaceValue } from "@/lib/contracts";
import { CONCERNS, type Concern } from "@/lib/gems/finder";

export interface GemProfile {
  id: string;
  label: string;
  name: string;
  dob: string;
  tob: string;
  place: PlaceValue;
}

type Variant = { weight: number; price: number; inStock: boolean };
interface Result {
  lagna: string;
  avoid: string[];
  gems: {
    planet: string;
    gem: string;
    weight: number;
    unit: "ratti" | "carat";
    why: string;
    helps: Concern[];
    finger: string;
    metal: string;
    day: string;
    mantra: string;
    note?: string;
    product: { slug: string; sku: string; title: string; variants: Variant[]; best: Variant | null } | null;
  }[];
}

const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;

/** AMX-204 — pick problems, get gems that are safe for your own kundali, the right weight, and buy or request it. */
export function GemFinder({ profiles }: { profiles: GemProfile[] }) {
  const t = useTranslations("gems");
  const locale = useLocale();
  const l = locale === "en" ? "en" : "hi";
  const [dob, setDob] = useState("");
  const [tob, setTob] = useState("");
  const [place, setPlace] = useState<PlaceValue | null>(null);
  const [weight, setWeight] = useState("60");
  const [concerns, setConcerns] = useState<Concern[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<Result | null>(null);

  const viewer = useViewer();
  const router = useRouter();
  const resume = useRef(false);
  // Back from login: restore the details and find the gems once.
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("md-gem-draft");
      if (!raw) return;
      const d = JSON.parse(raw) as { dob: string; tob: string; place: PlaceValue; weight: string; concerns: Concern[] };
      // Restoring a saved session after mount (storage isn't readable during SSR).
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDob(d.dob);
      setTob(d.tob);
      setPlace(d.place);
      setWeight(d.weight);
      setConcerns(d.concerns);
      resume.current = true;
    } catch {
      // storage blocked
    }
  }, []);
  useEffect(() => {
    if (!resume.current || !viewer || !place) return;
    resume.current = false;
    sessionStorage.removeItem("md-gem-draft");
    document.querySelector<HTMLFormElement>("form[data-gem-form]")?.requestSubmit();
  }, [viewer, place]);

  const unit = (u: "ratti" | "carat") => t(`unit.${u}`);
  const toggle = (c: Concern) => setConcerns((cs) => (cs.includes(c) ? cs.filter((x) => x !== c) : [...cs, c]));

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!dob || !tob || !place) {
      setError(t("fill"));
      return;
    }
    if (viewer === null) {
      try {
        sessionStorage.setItem("md-gem-draft", JSON.stringify({ dob, tob, place, weight, concerns }));
      } catch {
        // storage blocked: they'll re-enter after login
      }
      router.push(`/login?next=${encodeURIComponent("/gem-finder")}`);
      return;
    }
    setBusy(true);
    setError("");
    const res = await fetch("/api/gems", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dob, tob, place, weightKg: Number(weight) || 60, concerns, lang: l }),
    }).catch(() => null);
    setBusy(false);
    if (!res?.ok) {
      setError(t("error"));
      return;
    }
    setResult((await res.json()) as Result);
    requestAnimationFrame(() => document.getElementById("gem-results")?.scrollIntoView({ behavior: "smooth", block: "start" }));
  };

  return (
    <div className="flex flex-col gap-8">
      <form data-gem-form onSubmit={submit} noValidate className="flex flex-col gap-6">
        <Card className="flex flex-col gap-4">
          <h2 className="flex items-center gap-2 text-xl">
            <Icon name="sparkle" size={20} className="text-gold-300" /> {t("step1")}
          </h2>
          <div className="flex flex-wrap gap-2">
            {CONCERNS.map((c) => {
              const on = concerns.includes(c.key);
              return (
                <button
                  key={c.key}
                  type="button"
                  aria-pressed={on}
                  onClick={() => toggle(c.key)}
                  className={cn(
                    "min-h-11 rounded-full border px-4 text-sm font-semibold transition-colors focus-visible:ring-focus",
                    on ? "border-transparent bg-grad-gold text-ink-ongold" : "border-line text-ink-2 hover:border-line-gold hover:text-ink-1",
                  )}
                >
                  {c.label[l]}
                </button>
              );
            })}
          </div>
          <p className="text-xs text-ink-3">{t("step1Hint")}</p>
        </Card>

        <Card className="flex flex-col gap-4">
          <h2 className="flex items-center gap-2 text-xl">
            <Icon name="kundali" size={20} className="text-gold-300" /> {t("step2")}
          </h2>
          {profiles.length > 0 && (
            <Field label={t("fromProfile")}>
              {(id) => (
                <Select
                  id={id}
                  defaultValue=""
                  onChange={(e) => {
                    const p = profiles.find((x) => x.id === e.target.value);
                    if (!p) return;
                    setDob(p.dob);
                    setTob(p.tob || "12:00");
                    setPlace(p.place);
                  }}
                >
                  <option value="">{t("chooseProfile")}</option>
                  {profiles.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.label}
                      {p.name ? ` — ${p.name}` : ""}
                    </option>
                  ))}
                </Select>
              )}
            </Field>
          )}
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label={t("dob")} required>
              {(id) => <Input id={id} type="date" value={dob} onChange={(e) => setDob(e.target.value)} />}
            </Field>
            <Field label={t("tob")} required>
              {(id) => <Input id={id} type="time" value={tob} onChange={(e) => setTob(e.target.value)} />}
            </Field>
            <Field label={t("weight")} hint={t("weightHint")}>
              {(id) => <Input id={id} type="number" inputMode="numeric" min={20} max={200} value={weight} onChange={(e) => setWeight(e.target.value)} />}
            </Field>
          </div>
          <BirthplaceCombobox label={t("place")} required value={place} onChange={setPlace} />
        </Card>

        {error && <p role="alert" className="text-error">{error}</p>}
        <Button type="submit" size="lg" className="self-center" loading={busy} loadingLabel={t("finding")} iconRight={<Icon name="gem" size={18} />}>
          {t("submit")}
        </Button>
      </form>

      {result && (
        <section id="gem-results" aria-live="polite" className="flex scroll-mt-24 flex-col gap-5">
          <h2 className="text-2xl">{t("resultTitle", { lagna: result.lagna })}</h2>
          <ul className="grid gap-5 lg:grid-cols-3">
            {result.gems.map((g, i) => {
              const best = g.product?.best ?? null;
              const exact = best && best.weight === g.weight;
              return (
                <li key={g.planet} className={cn("flex flex-col gap-4 rounded-xl border bg-night-s1/80 p-5 shadow-e1 backdrop-blur-xl", i === 0 ? "border-saffron-400" : "border-line")}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      {i === 0 && <p className="text-xs font-bold text-gold-300">{t("topPick")}</p>}
                      <h3 className="text-xl font-semibold text-ink-1">{g.gem}</h3>
                    </div>
                    <Icon name="gem" size={30} animate="hover" className="text-gold-300" />
                  </div>
                  <p className="font-display text-3xl text-ink-1">
                    {g.weight} <span className="font-sans text-base text-ink-2">{unit(g.unit)}</span>
                  </p>
                  <p className="text-sm text-ink-2">
                    <strong className="text-ink-1">{t("why")}: </strong>
                    {g.why}
                  </p>
                  {g.helps.length > 0 && (
                    <p className="flex flex-wrap gap-1.5">
                      {g.helps.map((h) => (
                        <span key={h} className="rounded-full bg-success/12 px-2 py-0.5 text-xs font-semibold text-success">
                          {CONCERNS.find((c) => c.key === h)!.label[l]}
                        </span>
                      ))}
                    </p>
                  )}
                  <dl className="grid grid-cols-2 gap-x-3 gap-y-1 text-sm">
                    <dt className="text-ink-3">{t("finger")}</dt>
                    <dd className="text-ink-1">{g.finger}</dd>
                    <dt className="text-ink-3">{t("metal")}</dt>
                    <dd className="text-ink-1">{g.metal}</dd>
                    <dt className="text-ink-3">{t("day")}</dt>
                    <dd className="text-ink-1">{g.day}</dd>
                    <dt className="text-ink-3">{t("mantra")}</dt>
                    <dd className="text-ink-1">{g.mantra}</dd>
                  </dl>
                  {g.note && <p className="rounded-md bg-warning/10 px-3 py-2 text-xs text-ink-1">{g.note}</p>}

                  <div className="mt-auto flex flex-col gap-2 border-t border-line-subtle pt-4">
                    {g.product && best?.inStock ? (
                      <>
                        <Link href={`/shop/${g.product.slug}?w=${best.weight}`} className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-grad-gold px-5 font-semibold text-ink-ongold shadow-e1 focus-visible:ring-focus">
                          {t("buy", { weight: best.weight, unit: unit(g.unit), price: inr(best.price) })} <Icon name="arrow-right" size={16} />
                        </Link>
                        {!exact && <p className="text-center text-xs text-ink-3">{t("closest", { weight: g.weight, unit: unit(g.unit) })}</p>}
                      </>
                    ) : g.product ? (
                      <EnquiryButton
                        product={{ slug: g.product.slug, sku: g.product.sku, title: g.product.title, presetNote: t("requestNote", { weight: g.weight, unit: unit(g.unit) }) }}
                        label={t("request", { weight: g.weight, unit: unit(g.unit) })}
                        variant="primary"
                        className="justify-center"
                      />
                    ) : null}
                    {g.product && (
                      <p className="text-center text-xs text-ink-3">
                        {t("stock")}:{" "}
                        {g.product.variants.map((v) => `${v.weight}${v.inStock ? "✓" : "✗"}`).join(" · ")}
                      </p>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
          {result.avoid.length > 0 && (
            <p className="rounded-md border border-error/30 bg-error/8 px-4 py-3 text-sm text-ink-1">
              <strong>{t("avoid")}: </strong>
              {result.avoid.join(", ")}
            </p>
          )}
          <p className="text-sm text-ink-3">{t("disclaimer")}</p>
          <Link href="/book-appointment?problem=gemstone" className="self-start text-sm font-semibold text-gold-300 underline-offset-4 hover:underline">
            {t("consult")} →
          </Link>
        </section>
      )}
    </div>
  );
}
