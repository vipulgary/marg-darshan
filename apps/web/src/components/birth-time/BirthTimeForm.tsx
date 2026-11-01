"use client";

import { type FormEvent, type ReactNode, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { BirthplaceCombobox } from "@/components/kundali/BirthplaceCombobox";
import { useHydrated } from "@/components/shop/useHydrated";
import { Button } from "@/components/ui/Button";
import { Checkbox, SelectableCard } from "@/components/ui/Choice";
import { Field, Input, Select } from "@/components/ui/Field";
import { Link, useRouter } from "@/i18n/navigation";
import { cn } from "@/lib/cn";
import type { PlaceValue } from "@/lib/contracts";
import {
  LIFE_EVENT_TYPES,
  MAX_LIFE_EVENTS,
  MIN_LIFE_EVENTS,
  isIsoDate,
  todayIST,
  validateLifeEvents,
} from "@/lib/rectification/events";
import type { RectificationMode } from "@/lib/rectification/schema";
import { type WindowPreset, resolveWindow } from "@/lib/rectification/windows";
import { isIndianMobile, looksLikeEmail } from "@/lib/shop/phone";
import { useDraftField } from "@/stores/formDraft";
import { Icon } from "@/components/icons";

const FORM_ID = "birthTime";

interface EventRow {
  id: string;
  type: string;
  date: string;
  note: string;
}
type Geo = { lat: number; lng: number } | null;
type GeoStatus = "idle" | "requesting" | "denied" | "unavailable";

const blankRows = (n: number): EventRow[] => Array.from({ length: n }, (_, i) => ({ id: `e${i + 1}`, type: "", date: "", note: "" }));

const PRESETS: { key: WindowPreset; label: string }[] = [
  { key: "morning", label: "presetMorning" },
  { key: "day", label: "presetDay" },
  { key: "evening", label: "presetEvening" },
  { key: "night", label: "presetNight" },
  { key: "full", label: "presetFull" },
  { key: "custom", label: "presetCustom" },
];

/** Draft-backed field that renders its fallback until hydrated (sessionStorage isn't available on the server). */
function useDraft<T>(field: string, fallback: T, hydrated: boolean): [T, (v: T) => void] {
  const [value, set] = useDraftField<T>(FORM_ID, field, fallback);
  return [hydrated ? value : fallback, set];
}

/** AMX-130 — birth-time rectification questionnaire (Final Plan §4.3, design.md §11.9). */
export function BirthTimeForm() {
  const t = useTranslations("birthTime");
  const locale = useLocale();
  const router = useRouter();
  const hydrated = useHydrated();

  const [mode, setMode] = useDraft<RectificationMode>("mode", "date_known", hydrated);
  const [dob, setDob] = useDraft("dob", "", hydrated);
  const [preset, setPreset] = useDraft<WindowPreset | "">("preset", "", hydrated);
  const [customStart, setCustomStart] = useDraft("customStart", "", hydrated);
  const [customEnd, setCustomEnd] = useDraft("customEnd", "", hydrated);
  const [place, setPlace] = useDraft<PlaceValue | null>("place", null, hydrated);
  const [events, setEvents] = useDraft<EventRow[]>("events", blankRows(MIN_LIFE_EVENTS), hydrated);
  const [geo, setGeo] = useDraft<Geo>("geo", null, hydrated);
  const [name, setName] = useDraft("name", "", hydrated);
  const [email, setEmail] = useDraft("email", "", hydrated);
  const [phone, setPhone] = useDraft("phone", "", hydrated);
  const [consent, setConsent] = useDraft("consent", false, hydrated);

  const [geoStatus, setGeoStatus] = useState<GeoStatus>("idle");
  const [attempted, setAttempted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const known = mode === "date_known";
  const today = todayIST();
  const minRows = known ? MIN_LIFE_EVENTS : 1;

  function validate() {
    const errs: Record<string, string> = {};
    if (known) {
      if (!isIsoDate(dob)) errs.dob = "dob";
      else if (dob > today || dob < "1900-01-01") errs.dob = "dobRange";
      if (!preset || !resolveWindow(preset, { start: customStart, end: customEnd })) errs.window = "window";
      if (!place) errs.place = "place";
    }
    const ev = validateLifeEvents(events, { dob: known ? dob : null, today, min: known ? MIN_LIFE_EVENTS : 0 });
    if (ev.countError) errs.events = ev.countError;
    ev.rowErrors.forEach((e, i) => {
      if (e?.type) errs[`ev.${i}.type`] = e.type;
      if (e?.date) errs[`ev.${i}.date`] = e.date;
    });
    if (name.trim().length < 2) errs.name = "name";
    if (!looksLikeEmail(email)) errs.email = "email";
    if (!isIndianMobile(phone)) errs.phone = "phone";
    if (!consent) errs.consent = "consent";
    return errs;
  }

  const errors = attempted ? validate() : {};
  const err = (key: string) => (errors[key] ? t(`form.errors.${errors[key]}`) : undefined);
  const hasErrors = Object.keys(errors).length > 0;

  const updateRow = (id: string, patch: Partial<EventRow>) => setEvents(events.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  const addRow = () =>
    events.length < MAX_LIFE_EVENTS && setEvents([...events, { id: `e${Date.now().toString(36)}`, type: "", date: "", note: "" }]);
  const removeRow = (id: string) => events.length > minRows && setEvents(events.filter((r) => r.id !== id));

  function askLocation() {
    if (!("geolocation" in navigator)) {
      setGeoStatus("unavailable");
      return;
    }
    setGeoStatus("requesting");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        // 4 dp (~11 m) is plenty for a chart and avoids storing a pinpoint location.
        setGeo({ lat: Math.round(pos.coords.latitude * 1e4) / 1e4, lng: Math.round(pos.coords.longitude * 1e4) / 1e4 });
        setGeoStatus("idle");
      },
      (e) => setGeoStatus(e.code === e.PERMISSION_DENIED ? "denied" : "unavailable"),
      { enableHighAccuracy: false, timeout: 10_000, maximumAge: 600_000 },
    );
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    setAttempted(true);
    setServerError(null);
    if (Object.keys(validate()).length) {
      requestAnimationFrame(() => {
        form.querySelector<HTMLElement>("[data-error-summary]")?.scrollIntoView({ block: "center" });
        form.querySelector<HTMLElement>("[aria-invalid='true']")?.focus({ preventScroll: true });
      });
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/rectification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode,
          dob: known ? dob : undefined,
          window: known && preset ? { preset, start: customStart || undefined, end: customEnd || undefined } : undefined,
          place: place ?? null,
          lifeEvents: events
            .filter((r) => r.type || r.date || r.note.trim())
            .map((r) => ({ type: r.type, date: r.date, note: r.note.trim() || undefined })),
          prashna: known
            ? undefined
            : { lat: geo?.lat, lng: geo?.lng, tzName: Intl.DateTimeFormat().resolvedOptions().timeZone },
          contact: { name: name.trim(), email: email.trim(), phone },
          locale,
          consent: true,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { profileId?: string };
      if (res.ok && data.profileId) {
        router.push(`/book-appointment?problem=birth-time-unknown&profile=${encodeURIComponent(data.profileId)}`);
        return;
      }
      setServerError(t(res.status === 429 ? "form.errors.rateLimit" : "form.errors.server"));
    } catch {
      setServerError(t("form.errors.network"));
    }
    setSubmitting(false);
  }

  const window_ = preset ? resolveWindow(preset, { start: customStart, end: customEnd }) : null;

  return (
    <form noValidate onSubmit={onSubmit} className="flex flex-col gap-8">
      <div aria-live="polite">
        {(hasErrors || serverError) && (
          <p data-error-summary role="alert" className="rounded-md border border-error/40 bg-error/12 px-4 py-3 text-sm text-error">
            <Icon name="alert-triangle" size={14} animate="none" className="mr-1 inline-block align-[-2px]" />{serverError ?? t("form.errors.summary")}
          </p>
        )}
      </div>

      <fieldset className="flex flex-col gap-3">
        <legend className="mb-3 text-lg font-semibold text-ink-1">{t("form.modeLegend")}</legend>
        <div className="grid gap-3 sm:grid-cols-2">
          <SelectableCard name="bt-mode" value="date_known" checked={known} onChange={() => setMode("date_known")} icon={<Icon name="calendar" size={28} />} title={t("form.modeKnown")} subtitle={t("form.modeKnownSub")} />
          <SelectableCard name="bt-mode" value="date_unknown" checked={!known} onChange={() => setMode("date_unknown")} icon={<Icon name="crystal-ball" size={28} />} title={t("form.modeUnknown")} subtitle={t("form.modeUnknownSub")} />
        </div>
      </fieldset>

      <Section title={t("form.sectionBirth")}>
        {known ? (
          <>
            <Field label={t("form.dob")} required error={err("dob")}>
              {(id, d) => (
                <Input id={id} type="date" autoComplete="bday" min="1900-01-01" max={hydrated ? today : undefined} aria-describedby={d} aria-invalid={!!errors.dob} value={dob} onChange={(e) => setDob(e.target.value)} />
              )}
            </Field>

            <fieldset aria-describedby="bt-window-hint" aria-invalid={!!errors.window}>
              <legend className="mb-2 text-sm font-medium text-ink-2">
                {t("form.window")}
                <span className="ml-0.5 text-saffron-400">*</span>
              </legend>
              <p id="bt-window-hint" className="mb-3 text-xs text-ink-3">
                {t("form.windowHint")}
              </p>
              <div className="flex flex-wrap gap-2">
                {PRESETS.map((p) => (
                  <label
                    key={p.key}
                    className={cn(
                      "inline-flex min-h-11 cursor-pointer items-center rounded-full border px-4 text-[15px] transition-colors has-focus-visible:ring-focus",
                      preset === p.key ? "border-transparent bg-grad-gold font-semibold text-ink-ongold" : "border-line text-ink-2 hover:border-gold-300 hover:text-ink-1",
                    )}
                  >
                    <input type="radio" name="bt-window" value={p.key} checked={preset === p.key} onChange={() => setPreset(p.key)} className="sr-only" />
                    {t(`form.${p.label}`)}
                  </label>
                ))}
              </div>
              {preset === "custom" && (
                <div className="mt-4 grid grid-cols-2 gap-3 sm:max-w-sm">
                  <Field label={t("form.customStart")}>
                    {(id) => <Input id={id} type="time" step={300} value={customStart} onChange={(e) => setCustomStart(e.target.value)} />}
                  </Field>
                  <Field label={t("form.customEnd")}>
                    {(id) => <Input id={id} type="time" step={300} value={customEnd} onChange={(e) => setCustomEnd(e.target.value)} />}
                  </Field>
                </div>
              )}
              {window_?.overnight && <p className="mt-2 text-xs text-info">{t("form.overnight")}</p>}
              {errors.window && (
                <p role="alert" className="mt-2 text-[13px] text-error">
                  <Icon name="alert-triangle" size={14} animate="none" className="mr-1 inline-block align-[-2px]" />{err("window")}
                </p>
              )}
            </fieldset>
          </>
        ) : (
          <div className="flex flex-col gap-4 rounded-lg border border-line bg-night-s2 p-5">
            <div>
              <h4 className="text-lg">{t("form.prashnaTitle")}</h4>
              <p className="mt-1 text-[15px] text-ink-2">{t("form.prashnaBody")}</p>
            </div>
            <p className="text-sm text-ink-2">{t("form.prashnaAsk")}</p>
            <div className="flex flex-wrap items-center gap-3">
              {geo ? (
                <Button type="button" variant="ghost" size="sm" className="h-11" onClick={() => setGeo(null)}>
                  {t("form.geoClear")}
                </Button>
              ) : (
                <Button type="button" variant="secondary" size="sm" className="h-11" loading={geoStatus === "requesting"} loadingLabel={t("form.geoRequesting")} onClick={askLocation} iconLeft={<Icon name="map-pin" size={18} />}>
                  {t("form.geoShare")}
                </Button>
              )}
              <p aria-live="polite" className="text-sm text-ink-3">
                {geo
                  ? t("form.geoGranted")
                  : geoStatus === "denied"
                    ? t("form.geoDenied")
                    : geoStatus === "unavailable"
                      ? t("form.geoUnavailable")
                      : null}
              </p>
            </div>
          </div>
        )}

        <BirthplaceCombobox
          key={hydrated ? `h-${mode}` : "ssr"}
          value={place}
          onChange={setPlace}
          label={known ? t("form.place") : t("form.placeOptional")}
          error={err("place")}
          required={known}
        />
      </Section>

      <Section title={t("form.eventsTitle")} lead={known ? t("form.eventsLead") : t("form.eventsLeadOptional")}>
        <ol className="flex flex-col gap-4">
          {events.map((row, i) => (
            <li key={row.id} className="rounded-lg border border-line bg-night-s2/60 p-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-sm font-semibold text-gold-300">{t("form.eventRow", { n: i + 1 })}</span>
                <button
                  type="button"
                  onClick={() => removeRow(row.id)}
                  disabled={events.length <= minRows}
                  aria-label={t("form.removeEvent", { n: i + 1 })}
                  className="grid h-11 w-11 place-items-center rounded-full text-ink-3 hover:bg-white/6 hover:text-ink-1 focus-visible:ring-focus disabled:invisible"
                >
                  <Icon name="x" size={18} />
                </button>
              </div>
              <div className="grid gap-3 sm:grid-cols-[1.3fr_1fr]">
                <Field label={t("form.eventType")} required={known} error={err(`ev.${i}.type`)}>
                  {(id, d) => (
                    <Select id={id} aria-describedby={d} aria-invalid={!!errors[`ev.${i}.type`]} value={row.type} onChange={(e) => updateRow(row.id, { type: e.target.value })}>
                      <option value="">{t("form.eventTypePlaceholder")}</option>
                      {LIFE_EVENT_TYPES.map((k) => (
                        <option key={k} value={k}>
                          {t(`eventTypes.${k}`)}
                        </option>
                      ))}
                    </Select>
                  )}
                </Field>
                <Field label={t("form.eventDate")} required={known} error={err(`ev.${i}.date`)}>
                  {(id, d) => (
                    <Input id={id} type="date" min="1900-01-01" max={hydrated ? today : undefined} aria-describedby={d} aria-invalid={!!errors[`ev.${i}.date`]} value={row.date} onChange={(e) => updateRow(row.id, { date: e.target.value })} />
                  )}
                </Field>
                <div className="sm:col-span-2">
                  <Field label={t("form.eventNote")}>
                    {(id) => <Input id={id} maxLength={300} placeholder={t("form.eventNotePlaceholder")} value={row.note} onChange={(e) => updateRow(row.id, { note: e.target.value })} />}
                  </Field>
                </div>
              </div>
            </li>
          ))}
        </ol>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Button type="button" variant="ghost" onClick={addRow} disabled={events.length >= MAX_LIFE_EVENTS}>
            {t("form.addEvent")}
          </Button>
          <span className="text-sm text-ink-3">{t("form.eventCount", { count: events.length })}</span>
        </div>
        {errors.events && (
          <p role="alert" className="text-[13px] text-error">
            <Icon name="alert-triangle" size={14} animate="none" className="mr-1 inline-block align-[-2px]" />{err("events")}
          </p>
        )}
      </Section>

      <Section title={t("form.sectionContact")}>
        <Field label={t("form.name")} required error={err("name")}>
          {(id, d) => <Input id={id} autoComplete="name" aria-describedby={d} aria-invalid={!!errors.name} value={name} onChange={(e) => setName(e.target.value)} />}
        </Field>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label={t("form.email")} required error={err("email")}>
            {(id, d) => <Input id={id} type="email" inputMode="email" autoComplete="email" aria-describedby={d} aria-invalid={!!errors.email} value={email} onChange={(e) => setEmail(e.target.value)} />}
          </Field>
          <Field label={t("form.phone")} required hint={t("form.phoneHint")} error={err("phone")}>
            {(id, d) => <Input id={id} type="tel" inputMode="tel" autoComplete="tel" aria-describedby={d} aria-invalid={!!errors.phone} value={phone} onChange={(e) => setPhone(e.target.value)} />}
          </Field>
        </div>
        <div>
          <Checkbox
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
            aria-invalid={!!errors.consent}
            label={t("form.consent")}
          />
          <Link href="/privacy" className="ml-[30px] text-sm text-violet-300 underline-offset-[3px] hover:text-gold-300 hover:underline focus-visible:ring-focus">
            {t("form.privacyLink")}
          </Link>
          {errors.consent && (
            <p role="alert" className="mt-2 text-[13px] text-error">
              <Icon name="alert-triangle" size={14} animate="none" className="mr-1 inline-block align-[-2px]" />{err("consent")}
            </p>
          )}
        </div>
      </Section>

      <div className="flex flex-col gap-3">
        <Button type="submit" size="lg" className="w-full justify-center sm:w-auto sm:self-start" loading={submitting} loadingLabel={t("form.submitting")} iconRight={<Icon name="arrow-right" size={18} />}>
          {t("form.submit")}
        </Button>
        <p className="text-sm text-ink-3">{t("form.after")}</p>
      </div>
    </form>
  );
}

function Section({ title, lead, children }: { title: string; lead?: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-5 border-t border-line-subtle pt-7">
      <div>
        <h3 className="text-xl">{title}</h3>
        {lead && <p className="mt-1 text-[15px] text-ink-2">{lead}</p>}
      </div>
      {children}
    </section>
  );
}
