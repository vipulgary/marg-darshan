"use client";

import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { Icon } from "@/components/icons";
import { Badge, Card } from "@/components/ui/Display";
import { Field, Input } from "@/components/ui/Field";
import { type NumerologyResult, numerology } from "@/lib/numerology";

/** Result card — reused on the report dashboard. */
export function NumerologyCard({ result }: { result: NumerologyResult }) {
  const t = useTranslations("numerology");
  const l = useLocale() === "en" ? "en" : "hi";
  const lore = result.mulankLore;
  const big = (label: string, n: number | null, hint: string) => (
    <div className="flex flex-col items-center rounded-lg border border-line-gold bg-night-s2 p-4 text-center">
      <span className="text-sm text-ink-3">{label}</span>
      <span className="font-display text-5xl text-gold-300">{n ?? "—"}</span>
      <span className="mt-1 text-xs text-ink-3">{hint}</span>
    </div>
  );
  return (
    <div className="flex flex-col gap-5">
      <div className="grid gap-4 sm:grid-cols-3">
        {big(t("mulank"), result.mulank, t("mulankHint"))}
        {big(t("bhagyank"), result.bhagyank, t("bhagyankHint"))}
        {big(t("namank"), result.namank, result.namank === null ? t("namankLatin") : t("namankHint"))}
      </div>
      <Card className="flex flex-col gap-3">
        <h3 className="flex items-center gap-2 text-lg">
          <Icon name="sparkle" size={20} animate="draw" className="text-gold-300" /> {t("yourNature", { n: result.mulank, planet: lore.planet[l] })}
        </h3>
        <p className="text-ink-2">{lore.traits[l]}</p>
        <p className="text-sm text-ink-3">{t("destinyLine", { n: result.bhagyank, planet: result.bhagyankLore.planet[l] })} {result.bhagyankLore.traits[l]}</p>
      </Card>
      <Card>
        <h3 className="mb-3 text-lg">{t("luckyTitle")}</h3>
        <dl className="grid gap-x-6 gap-y-2 sm:grid-cols-2">
          {(
            [
              ["luckyNumbers", result.lucky.join(", ")],
              ["luckyDays", lore.days[l]],
              ["luckyColours", lore.colours[l]],
              ["gem", lore.gem[l]],
            ] as const
          ).map(([k, v]) => (
            <div key={k} className="flex justify-between gap-4 border-b border-line-subtle py-1.5">
              <dt className="text-ink-3">{t(k)}</dt>
              <dd className="text-right text-ink-1">{v}</dd>
            </div>
          ))}
        </dl>
        {result.nameFit && (
          <p className="mt-3 flex flex-wrap items-center gap-2 text-sm">
            <Badge tone={result.nameFit === "good" ? "success" : result.nameFit === "ok" ? "gold" : "warning"}>{t(`nameFit.${result.nameFit}`)}</Badge>
            {t(`nameFitText.${result.nameFit}`)}
          </p>
        )}
        <p className="mt-3 text-xs text-ink-3">{t("gemNote")}</p>
      </Card>
    </div>
  );
}

/** Standalone calculator: name + date of birth → instant result (no server call). */
export function NumerologyCalculator() {
  const t = useTranslations("numerology");
  const [name, setName] = useState("");
  const [dob, setDob] = useState("");
  const valid = /^\d{4}-\d{2}-\d{2}$/.test(dob) && name.trim().length >= 2;
  return (
    <div className="flex flex-col gap-6">
      <Card className="grid gap-4 sm:grid-cols-2">
        <Field label={t("name")} hint={t("nameHint")} required>
          {(id, d) => <Input id={id} aria-describedby={d} autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} />}
        </Field>
        <Field label={t("dob")} required>
          {(id) => <Input id={id} type="date" value={dob} onChange={(e) => setDob(e.target.value)} />}
        </Field>
      </Card>
      <div aria-live="polite">{valid ? <NumerologyCard result={numerology(name, dob)} /> : <p className="text-center text-ink-3">{t("enterDetails")}</p>}</div>
    </div>
  );
}
