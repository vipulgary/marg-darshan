"use client";

import { useLocale, useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";
import { Icon } from "@/components/icons";
import { BirthplaceCombobox } from "@/components/kundali/BirthplaceCombobox";
import { Button } from "@/components/ui/Button";
import { Switch } from "@/components/ui/Choice";
import { Badge, Card, Skeleton } from "@/components/ui/Display";
import { Field, Select } from "@/components/ui/Field";
import { cn } from "@/lib/cn";
import type { PlaceValue } from "@/lib/contracts";
import { type ChoghadiyaName, type DayMuhurat, type Quality, type Span, currentSlot, nextGoodWindow } from "@/lib/muhurat/choghadiya";

type Name = { name_en: string; name_hi: string };
interface Data {
  date: string;
  tz: string;
  panchang: { sunrise: string; sunset: string; vara: Name; tithi: Name & { paksha_en: string; paksha_hi: string }; nakshatra: Name; yoga: Name };
  slots: { name: ChoghadiyaName; quality: Quality; start: string; end: string; night: boolean }[];
  rahuKaal: { start: string; end: string };
  yamaganda: { start: string; end: string };
  gulika: { start: string; end: string };
  abhijit: { start: string; end: string };
  abhijitAvoid: boolean;
}

const DELHI: PlaceValue = { placeName: "New Delhi, Delhi, India", latitude: 28.6139, longitude: 77.209, tzName: "Asia/Kolkata" };
const PLACE_KEY = "md-shubh-place";
const toSpan = (s: { start: string; end: string }): Span => ({ start: new Date(s.start), end: new Date(s.end) });

function revive(d: Data): DayMuhurat {
  return {
    slots: d.slots.map((s) => ({ ...s, start: new Date(s.start), end: new Date(s.end) })),
    rahuKaal: toSpan(d.rahuKaal),
    yamaganda: toSpan(d.yamaganda),
    gulika: toSpan(d.gulika),
    abhijit: toSpan(d.abhijit),
    abhijitAvoid: d.abhijitAvoid,
  };
}

const TONE: Record<Quality, string> = {
  good: "border-success/40 bg-success/12 text-success",
  neutral: "border-info/40 bg-info/12 text-info",
  avoid: "border-error/30 bg-error/10 text-error",
};

/** Shubh Samay: today's choghadiya, Rahu Kaal, Abhijit and "when should I start?" for the chosen city. */
export function ShubhSamay() {
  const t = useTranslations("muhurat");
  const locale = useLocale();
  const hi = locale !== "en";
  const [place, setPlace] = useState<PlaceValue>(DELHI);
  const [data, setData] = useState<Data | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [now, setNow] = useState(() => new Date());
  const [minutes, setMinutes] = useState("30");
  const [travel, setTravel] = useState(true);
  const [locating, setLocating] = useState(false);

  const fmt = useCallback(
    (d: Date | string) => new Date(d).toLocaleTimeString(hi ? "hi-IN" : "en-IN", { timeZone: place.tzName, hour: "2-digit", minute: "2-digit", hour12: true }),
    [hi, place.tzName],
  );
  const range = (s: { start: Date | string; end: Date | string }) => `${fmt(s.start)} – ${fmt(s.end)}`;
  const nm = (n: Name) => (hi ? n.name_hi : n.name_en);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(PLACE_KEY);
      // Restoring a saved city after mount (storage isn't readable during SSR).
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (saved) setPlace(JSON.parse(saved) as PlaceValue);
    } catch {
      // ignore unreadable storage
    }
    const id = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    let live = true;
    fetch(`/api/muhurat?lat=${place.latitude}&lng=${place.longitude}&tz=${encodeURIComponent(place.tzName)}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((d: Data) => live && (setData(d), setState("ready")))
      .catch(() => live && setState("error"));
    return () => {
      live = false;
    };
  }, [place]);

  const choose = (p: PlaceValue | null) => {
    if (!p) return;
    setState("loading");
    setPlace(p);
    try {
      localStorage.setItem(PLACE_KEY, JSON.stringify(p));
    } catch {
      // ignore
    }
  };

  const locate = () => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        choose({
          placeName: t("myLocation"),
          latitude: Number(pos.coords.latitude.toFixed(4)),
          longitude: Number(pos.coords.longitude.toFixed(4)),
          tzName: Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Kolkata",
        });
      },
      () => setLocating(false),
      { timeout: 10_000 },
    );
  };

  const m = data ? revive(data) : null;
  const cur = m ? currentSlot(m, now) : null;
  const inRahu = m ? m.rahuKaal.start <= now && now < m.rahuKaal.end : false;
  const next = m ? nextGoodWindow(m, now, { minutes: Number(minutes), travel }) : null;
  const waitMin = next ? Math.max(0, Math.round((next.start.getTime() - now.getTime()) / 60_000)) : null;

  return (
    <div className="flex flex-col gap-6">
      <Card className="flex flex-col gap-4">
        <div className="grid items-end gap-4 md:grid-cols-[1fr_auto]">
          <BirthplaceCombobox label={t("city")} value={place} onChange={choose} />
          <Button variant="secondary" loading={locating} onClick={locate} iconLeft={<Icon name="map-pin" size={18} />}>
            {t("useLocation")}
          </Button>
        </div>
      </Card>

      {state === "loading" && <Skeleton className="h-64 w-full" />}
      {state === "error" && (
        <Card>
          <p role="alert" className="text-error">{t("error")}</p>
        </Card>
      )}

      {state === "ready" && data && m && (
        <>
          <section aria-live="polite" className={cn("rounded-xl border p-6", cur ? TONE[inRahu ? "avoid" : cur.quality] : "border-line")}>
            <p className="text-sm font-semibold">{t("rightNow")}</p>
            <p className="mt-1 font-display text-3xl text-ink-1">
              {cur ? t(`names.${cur.name}`) : "—"}
              {cur && <span className="ml-3 text-base font-sans text-ink-2">{t("until", { time: fmt(cur.end) })}</span>}
            </p>
            <p className="mt-2 text-ink-2">{inRahu ? t("rahuNow", { until: fmt(m.rahuKaal.end) }) : cur ? t(`meaning.${cur.name}`) : ""}</p>
          </section>

          <Card className="flex flex-col gap-4">
            <h2 className="flex items-center gap-2 text-xl">
              <Icon name="clock" size={22} animate="draw" className="text-gold-300" /> {t("planTitle")}
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={t("startsIn")}>
                {(id) => (
                  <Select id={id} value={minutes} onChange={(e) => setMinutes(e.target.value)}>
                    {["15", "30", "60", "120"].map((v) => (
                      <option key={v} value={v}>
                        {t("needMinutes", { n: Number(v) })}
                      </option>
                    ))}
                  </Select>
                )}
              </Field>
              <div className="flex items-end pb-3">
                <Switch label={t("travel")} checked={travel} onChange={(e) => setTravel(e.target.checked)} />
              </div>
            </div>
            <p className="rounded-md bg-night-s2 p-4 text-ink-1">
              {next
                ? waitMin === 0
                  ? t("goNow", { until: fmt(next.end) })
                  : t("waitUntil", { start: fmt(next.start), end: fmt(next.end), mins: waitMin ?? 0 })
                : t("noneToday")}
            </p>
          </Card>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {(
              [
                ["abhijit", m.abhijit, "good"],
                ["rahuKaal", m.rahuKaal, "avoid"],
                ["yamaganda", m.yamaganda, "avoid"],
                ["gulika", m.gulika, "neutral"],
              ] as const
            ).map(([k, span, tone]) => (
              <div key={k} className={cn("rounded-lg border p-4", TONE[tone])}>
                <p className="text-sm font-semibold">{t(`spans.${k}`)}</p>
                <p className="mt-1 text-lg text-ink-1">{range(span)}</p>
                <p className="mt-1 text-xs text-ink-3">{k === "abhijit" && data.abhijitAvoid ? t("abhijitWed") : t(`spanNote.${k}`)}</p>
              </div>
            ))}
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {([false, true] as const).map((night) => (
              <Card key={String(night)}>
                <h2 className="mb-3 flex items-center gap-2 text-lg">
                  <Icon name={night ? "moon" : "sun"} size={20} className="text-gold-300" /> {night ? t("night") : t("day")}
                </h2>
                <ul className="flex flex-col gap-2">
                  {m.slots
                    .filter((s) => s.night === night)
                    .map((s) => {
                      const active = cur === s || (cur && cur.start.getTime() === s.start.getTime());
                      return (
                        <li key={s.start.toISOString()} className={cn("flex items-center justify-between gap-3 rounded-md border px-3 py-2", TONE[s.quality], active && "ring-2 ring-saffron-400")}>
                          <span className="font-semibold">{t(`names.${s.name}`)}</span>
                          <span className="text-sm text-ink-2">{range(s)}</span>
                        </li>
                      );
                    })}
                </ul>
              </Card>
            ))}
          </div>

          <Card>
            <h2 className="mb-3 text-lg">{t("panchangTitle")}</h2>
            <dl className="grid gap-x-6 gap-y-2 sm:grid-cols-2">
              {(
                [
                  ["vara", nm(data.panchang.vara)],
                  ["tithi", `${nm(data.panchang.tithi)} (${hi ? data.panchang.tithi.paksha_hi : data.panchang.tithi.paksha_en})`],
                  ["nakshatra", nm(data.panchang.nakshatra)],
                  ["yoga", nm(data.panchang.yoga)],
                  ["sunrise", fmt(data.panchang.sunrise)],
                  ["sunset", fmt(data.panchang.sunset)],
                ] as const
              ).map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4 border-b border-line-subtle py-1.5">
                  <dt className="text-ink-3">{t(`panchang.${k}`)}</dt>
                  <dd className="text-ink-1">{v}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-3 flex flex-wrap gap-2 text-xs text-ink-3">
              <Badge tone="success">{t("legendGood")}</Badge>
              <Badge tone="neutral">{t("legendTravel")}</Badge>
              <Badge tone="error">{t("legendAvoid")}</Badge>
            </p>
          </Card>
        </>
      )}
    </div>
  );
}
