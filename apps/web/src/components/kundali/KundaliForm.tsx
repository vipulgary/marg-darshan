"use client";

import { useLocale, useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { type FormEvent, type ReactNode, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Checkbox, Radio, SelectableCard } from "@/components/ui/Choice";
import { Skeleton } from "@/components/ui/Display";
import { Field, Input, Select } from "@/components/ui/Field";
import { Link, useRouter } from "@/i18n/navigation";
import { cn } from "@/lib/cn";
import type { PlaceValue } from "@/lib/contracts";
import { type KundaliField, MIN_YEAR, fieldErrors, joinDob, joinTob, kundaliRequestSchema, splitDob, splitTob } from "@/lib/kundali/schema";
import { useFormDraft, useDraftField } from "@/stores/formDraft";
import { api } from "@/components/account/api";
import { useViewer } from "@/components/account/useViewer";
import { BirthplaceCombobox } from "./BirthplaceCombobox";
import { KundaliLoader } from "./KundaliLoader";
import { Turnstile } from "./Turnstile";
import { useHydrated } from "./useHydrated";
import { Icon } from "@/components/icons";

const FORM = "kundali";
const ORDER: KundaliField[] = ["name", "gender", "dob", "tob", "place", "email", "whatsapp", "consent"];
const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
const DAYS = Array.from({ length: 31 }, (_, i) => String(i + 1));
const HOURS = Array.from({ length: 12 }, (_, i) => String(i + 1));
const MINUTES = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, "0"));

function FormSkeleton() {
  return (
    <div aria-hidden className="flex flex-col gap-6">
      {[0, 1, 2, 3, 4].map((i) => (
        <div key={i} className="flex flex-col gap-2">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-[52px] w-full" />
        </div>
      ))}
    </div>
  );
}

/** A fieldset styled like <Field>, for grouped controls (gender chips, DOB/TOB selects). */
function Group({ legend, error, hint, required, errorId, children, onLeave }: { legend: string; error?: string; hint?: string; required?: boolean; errorId: string; children: ReactNode; onLeave: () => void }) {
  return (
    <fieldset
      className="group/field flex min-w-0 flex-col gap-2"
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) onLeave();
      }}
    >
      <legend className="mb-2 text-sm font-medium text-ink-2 group-focus-within/field:text-gold-300">
        {legend}
        {required && <span className="ml-0.5 text-saffron-400">*</span>}
      </legend>
      {children}
      {error ? (
        <p id={errorId} role="alert" className="flex items-center gap-1.5 text-[13px] text-error">
          <Icon name="alert-triangle" size={14} animate="none" />
          {error}
        </p>
      ) : (
        hint && <p className="text-xs text-ink-3">{hint}</p>
      )}
    </fieldset>
  );
}

function MiniChart({ kind }: { kind: "north" | "south" }) {
  return (
    <svg viewBox="0 0 40 40" className="h-10 w-10" aria-hidden>
      <rect x="2" y="2" width="36" height="36" fill="none" stroke="currentColor" strokeWidth="1.5" />
      {kind === "north" ? (
        <path d="M2 2L38 38M38 2L2 38M20 2L38 20L20 38L2 20Z" fill="none" stroke="currentColor" strokeWidth="1.2" />
      ) : (
        <path d="M11 2V38M29 2V38M2 11H38M2 29H38M20 2V11M20 29V38M2 20H11M29 20H38" fill="none" stroke="currentColor" strokeWidth="1.2" />
      )}
    </svg>
  );
}

/** AMX-061 — free kundali form (design.md §11.4). Drafts survive the language switch. */
export function KundaliForm() {
  const hydrated = useHydrated();
  return hydrated ? <KundaliFormInner /> : <FormSkeleton />;
}

function KundaliFormInner() {
  const t = useTranslations("kundali");
  const locale = useLocale() === "en" ? "en" : "hi";
  const router = useRouter();
  const search = useSearchParams();

  const [name, setName] = useDraftField(FORM, "name", "");
  const [gender, setGender] = useDraftField<"" | "male" | "female" | "other">(FORM, "gender", "");
  const [dobDay, setDobDay] = useDraftField(FORM, "dobDay", "");
  const [dobMonth, setDobMonth] = useDraftField(FORM, "dobMonth", "");
  const [dobYear, setDobYear] = useDraftField(FORM, "dobYear", "");
  const [tobHour, setTobHour] = useDraftField(FORM, "tobHour", "");
  const [tobMinute, setTobMinute] = useDraftField(FORM, "tobMinute", "");
  const [tobPeriod, setTobPeriod] = useDraftField<"" | "AM" | "PM">(FORM, "tobPeriod", "");
  const [place, setPlace] = useDraftField<PlaceValue | null>(FORM, "place", null);
  const [placeQuery] = useDraftField(FORM, "placeQuery", "");
  const [email, setEmail] = useDraftField(FORM, "email", "");
  const [whatsapp, setWhatsapp] = useDraftField(FORM, "whatsapp", "");
  const [chartStyle, setChartStyle] = useDraftField<"" | "north" | "south">(FORM, "chartStyle", "");
  const [consent, setConsent] = useDraftField(FORM, "consent", false);
  const [timeUnknown, setTimeUnknown] = useDraftField(FORM, "timeUnknown", false);

  const [touched, setTouched] = useState<Partial<Record<KundaliField, boolean>>>({});
  const [submitted, setSubmitted] = useState(false);
  const [serverErrors, setServerErrors] = useState<Partial<Record<KundaliField, string>>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [token, setToken] = useState("");
  const viewer = useViewer();
  const resumed = useRef(false);

  // ?name=&dob=&tob=&place= deep link (home quick form). Applied once per distinct link so a
  // language switch (which keeps the query) doesn't overwrite later edits.
  useEffect(() => {
    const keys = ["name", "dob", "tob", "place"] as const;
    const vals = keys.map((k) => (search.get(k) ?? "").trim());
    if (!vals.some(Boolean)) return;
    const store = useFormDraft.getState();
    const sig = keys.map((k, i) => `${k}=${vals[i]}`).join("&");
    if (store.drafts[FORM]?.prefillKey === sig) return;
    const set = (f: string, v: unknown) => store.setField(FORM, f, v);
    const [n, dob, tob, pl] = vals;
    if (n) set("name", n.slice(0, 80));
    const d = splitDob(dob);
    if (d) {
      set("dobDay", d.day);
      set("dobMonth", d.month);
      set("dobYear", d.year);
    }
    const tm = splitTob(tob);
    if (tm) {
      set("tobHour", tm.hour);
      set("tobMinute", tm.minute);
      set("tobPeriod", tm.period);
    }
    if (pl) {
      set("placeQuery", pl.slice(0, 120));
      set("place", null);
    }
    set("prefillKey", sig);
  }, [search]);

  const style = chartStyle || (locale === "hi" ? "north" : "south");
  const parsed = kundaliRequestSchema.safeParse({
    name,
    gender: gender || undefined,
    dob: joinDob({ day: dobDay, month: dobMonth, year: dobYear }),
    tob: joinTob({ hour: tobHour, minute: tobMinute, period: tobPeriod }),
    place: place ?? undefined,
    email: email.trim(),
    whatsapp,
    chartStyle: style,
    lang: locale,
    consent,
  });
  const clientErrors = parsed.success ? {} : fieldErrors(parsed.error);
  const errorFor = (f: KundaliField): string | undefined => {
    const key = serverErrors[f] ?? ((touched[f] || submitted) && clientErrors[f]);
    return key ? t(`errors.${key}` as "errors.server") : undefined;
  };
  const touch = (f: KundaliField) => setTouched((s) => (s[f] ? s : { ...s, [f]: true }));
  const edited = (f: KundaliField) => {
    if (serverErrors[f]) setServerErrors((s) => ({ ...s, [f]: undefined }));
  };

  // Back from login with ?resume=1: submit the saved details once, automatically.
  useEffect(() => {
    if (search.get("resume") !== "1" || !viewer || resumed.current || !parsed.success) return;
    resumed.current = true;
    document.querySelector<HTMLFormElement>("form[data-kundali-form]")?.requestSubmit();
  }, [search, viewer, parsed.success]);

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: currentYear - MIN_YEAR + 1 }, (_, i) => String(currentYear - i));

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (timeUnknown) return;
    setSubmitted(true);
    setFormError(null);
    if (!parsed.success) {
      const errs = fieldErrors(parsed.error);
      const first = ORDER.find((f) => errs[f]);
      const el = first && document.querySelector<HTMLElement>(`[data-field="${first}"]`);
      el?.scrollIntoView({ block: "center", behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
      el?.focus({ preventScroll: true });
      setFormError(t("form.errorSummary"));
      return;
    }
    if (TURNSTILE_SITE_KEY && !token) {
      setFormError(t("errors.captcha"));
      return;
    }
    // Logged out: the typed details are already kept as a draft — sign in, then come back and finish.
    if (viewer === null) {
      router.push(`/login?next=${encodeURIComponent("/free-kundali?resume=1")}`);
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/kundali", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...parsed.data, turnstileToken: token || undefined }),
      });
      const body = (await res.json().catch(() => ({}))) as { id?: string; fields?: Partial<Record<KundaliField, string>>; retryAfterSec?: number };
      if (res.ok && body.id) {
        // Signed in: keep this person as a saved profile and open them on the dashboard.
        if (viewer) {
          const d = parsed.data;
          const same = viewer.profiles.find((p) => p.dob === d.dob && (p.tob || "") === (d.tob || "") && p.place.placeName === d.place.placeName);
          let pid = same?.id;
          if (!pid) {
            const r = await api("/api/account/profiles", "POST", {
              label: viewer.profiles.length ? d.name.split(" ")[0] : locale === "hi" ? "स्वयं" : "Self",
              name: d.name,
              gender: d.gender ?? "other",
              dob: d.dob,
              tob: d.tob ?? "",
              place: d.place,
            });
            pid = (r.data as { id?: string } | undefined)?.id;
          }
          if (pid) {
            router.push(`/account?p=${pid}`);
            return;
          }
        }
        router.push(`/kundali/${body.id}`);
        return; // keep the loader up until navigation completes
      }
      if (res.status === 400 && body.fields) {
        setServerErrors(body.fields);
        setFormError(t("form.errorSummary"));
      } else if (res.status === 429) {
        setFormError(t("errors.rateLimited", { minutes: Math.max(1, Math.ceil((body.retryAfterSec ?? 3600) / 60)) }));
      } else if (res.status === 403) {
        setFormError(t("errors.captcha"));
      } else if (res.status === 503) {
        setFormError(t("errors.unavailable"));
      } else {
        setFormError(t("errors.server"));
      }
    } catch {
      setFormError(t("errors.network"));
    }
    setBusy(false);
  }

  const dobErr = errorFor("dob");
  const tobErr = errorFor("tob");
  const genderErr = errorFor("gender");

  return (
    <div className="relative">
      <form data-kundali-form noValidate onSubmit={onSubmit} className="flex flex-col gap-6" aria-busy={busy || undefined}>
        {formError && (
          <div role="alert" className="rounded-md border border-error/40 bg-error/10 px-4 py-3 text-sm text-ink-1">
            <Icon name="alert-triangle" size={14} animate="none" className="mr-1 inline-block align-[-2px]" />{formError}
          </div>
        )}

        <Field label={t("form.name")} required error={errorFor("name")}>
          {(id, d) => (
            <Input
              id={id}
              data-field="name"
              aria-describedby={d}
              aria-invalid={!!errorFor("name") || undefined}
              autoComplete="name"
              placeholder={t("form.namePlaceholder")}
              value={name}
              maxLength={80}
              onChange={(e) => {
                setName(e.target.value);
                edited("name");
              }}
              onBlur={() => touch("name")}
            />
          )}
        </Field>

        <Group legend={t("form.gender")} required error={genderErr} errorId="kf-gender-err" onLeave={() => touch("gender")}>
          <div className="flex flex-wrap gap-2.5" role="radiogroup" aria-describedby={genderErr ? "kf-gender-err" : undefined}>
            {(["male", "female", "other"] as const).map((g, i) => (
              <Radio
                key={g}
                name="gender"
                value={g}
                data-field={i === 0 ? "gender" : undefined}
                checked={gender === g}
                aria-invalid={!!genderErr || undefined}
                onChange={() => {
                  setGender(g);
                  edited("gender");
                }}
                label={t(`form.${g}`)}
                className="h-11 rounded-full border border-line px-4 transition-colors hover:border-line-hover has-checked:border-line-gold has-checked:bg-saffron-500/8"
              />
            ))}
          </div>
        </Group>

        <Group legend={t("form.dob")} required error={dobErr} errorId="kf-dob-err" onLeave={() => touch("dob")}>
          <div className="grid grid-cols-[1fr_1.6fr_1.3fr] gap-2.5">
            <Select data-field="dob" aria-label={t("form.day")} autoComplete="bday-day" aria-invalid={!!dobErr || undefined} aria-describedby={dobErr ? "kf-dob-err" : undefined} value={dobDay} onChange={(e) => (setDobDay(e.target.value), edited("dob"))}>
              <option value="">{t("form.day")}</option>
              {DAYS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </Select>
            <Select aria-label={t("form.month")} autoComplete="bday-month" aria-invalid={!!dobErr || undefined} aria-describedby={dobErr ? "kf-dob-err" : undefined} value={dobMonth} onChange={(e) => (setDobMonth(e.target.value), edited("dob"))}>
              <option value="">{t("form.month")}</option>
              {DAYS.slice(0, 12).map((m) => (
                <option key={m} value={m}>
                  {t(`months.${m}` as "months.1")}
                </option>
              ))}
            </Select>
            <Select aria-label={t("form.year")} autoComplete="bday-year" aria-invalid={!!dobErr || undefined} aria-describedby={dobErr ? "kf-dob-err" : undefined} value={dobYear} onChange={(e) => (setDobYear(e.target.value), edited("dob"))}>
              <option value="">{t("form.year")}</option>
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </Select>
          </div>
        </Group>

        {!timeUnknown && (
          <Group legend={t("form.tob")} required error={tobErr} hint={t("form.tobHint")} errorId="kf-tob-err" onLeave={() => touch("tob")}>
            <div className="grid grid-cols-3 gap-2.5">
              <Select data-field="tob" aria-label={t("form.hour")} aria-invalid={!!tobErr || undefined} aria-describedby={tobErr ? "kf-tob-err" : undefined} value={tobHour} onChange={(e) => (setTobHour(e.target.value), edited("tob"))}>
                <option value="">{t("form.hour")}</option>
                {HOURS.map((h) => (
                  <option key={h} value={h}>
                    {h}
                  </option>
                ))}
              </Select>
              <Select aria-label={t("form.minute")} aria-invalid={!!tobErr || undefined} aria-describedby={tobErr ? "kf-tob-err" : undefined} value={tobMinute} onChange={(e) => (setTobMinute(e.target.value), edited("tob"))}>
                <option value="">{t("form.minute")}</option>
                {MINUTES.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </Select>
              <Select aria-label={t("form.period")} aria-invalid={!!tobErr || undefined} aria-describedby={tobErr ? "kf-tob-err" : undefined} value={tobPeriod} onChange={(e) => (setTobPeriod(e.target.value as "" | "AM" | "PM"), edited("tob"))}>
                <option value="">{t("form.period")}</option>
                <option value="AM">{t("form.am")}</option>
                <option value="PM">{t("form.pm")}</option>
              </Select>
            </div>
          </Group>
        )}

        <Checkbox featured checked={timeUnknown} onChange={(e) => setTimeUnknown(e.target.checked)} label={t("form.timeUnknown")} hint={t("form.timeUnknownHint")} />

        {timeUnknown ? (
          <div className="flex flex-col gap-4 rounded-lg border border-line-gold bg-saffron-500/8 p-5" aria-live="polite">
            <h3 className="text-lg">{t("form.timeUnknownTitle")}</h3>
            <p className="text-[15px] text-ink-2">{t("form.timeUnknownBody")}</p>
            <Link
              href="/birth-time-finder"
              className="inline-flex h-14 items-center justify-center gap-2 rounded-full bg-grad-gold px-7 text-[17px] font-semibold text-ink-ongold shadow-e1 transition-[transform,box-shadow] hover:-translate-y-0.5 hover:shadow-glow-gold focus-visible:ring-focus"
            >
              {t("form.timeUnknownCta")} <Icon name="arrow-right" size={18} />
            </Link>
          </div>
        ) : (
          <>
            <div onBlur={(e) => !e.currentTarget.contains(e.relatedTarget as Node | null) && touch("place")}>
              <BirthplaceCombobox
                value={place}
                onChange={(v) => {
                  setPlace(v);
                  edited("place");
                }}
                label={t("form.place")}
                hint={t("form.placeHint")}
                required
                error={errorFor("place")}
                initialQuery={placeQuery || undefined}
              />
            </div>

            <Field label={t("form.email")} required hint={t("form.emailHint")} error={errorFor("email")}>
              {(id, d) => (
                <Input
                  id={id}
                  data-field="email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  aria-describedby={d}
                  aria-invalid={!!errorFor("email") || undefined}
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => (setEmail(e.target.value), edited("email"))}
                  onBlur={() => touch("email")}
                />
              )}
            </Field>

            <Field label={t("form.whatsapp")} hint={t("form.whatsappHint")} error={errorFor("whatsapp")}>
              {(id, d) => (
                <Input
                  id={id}
                  data-field="whatsapp"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  aria-describedby={d}
                  aria-invalid={!!errorFor("whatsapp") || undefined}
                  placeholder="98XXXXXXXX"
                  value={whatsapp}
                  onChange={(e) => (setWhatsapp(e.target.value), edited("whatsapp"))}
                  onBlur={() => touch("whatsapp")}
                />
              )}
            </Field>

            <fieldset className="flex flex-col gap-2">
              <legend className="mb-2 text-sm font-medium text-ink-2">{t("form.chartStyle")}</legend>
              <div className="grid grid-cols-2 gap-3">
                {(["north", "south"] as const).map((s) => (
                  <SelectableCard
                    key={s}
                    name="chartStyle"
                    value={s}
                    checked={style === s}
                    onChange={() => setChartStyle(s)}
                    icon={<MiniChart kind={s} />}
                    title={t(`form.${s}`)}
                    subtitle={t(`form.${s}Hint`)}
                  />
                ))}
              </div>
            </fieldset>

            <div data-field="consent" tabIndex={-1} className="flex flex-col gap-2 outline-none">
              <Checkbox
                checked={consent}
                aria-invalid={!!errorFor("consent") || undefined}
                onChange={(e) => (setConsent(e.target.checked), edited("consent"), touch("consent"))}
                label={
                  <>
                    {t("form.consentStart")}{" "}
                    <Link href="/privacy" className="text-violet-300 underline-offset-[3px] hover:text-gold-300 hover:underline">
                      {t("form.consentLink")}
                    </Link>{" "}
                    {t("form.consentEnd")}
                  </>
                }
              />
              {errorFor("consent") && (
                <p role="alert" className="flex items-center gap-1.5 text-[13px] text-error">
                  <Icon name="alert-triangle" size={14} animate="none" />
                  {errorFor("consent")}
                </p>
              )}
            </div>

            {TURNSTILE_SITE_KEY && (
              <div aria-label={t("form.captcha")}>
                <Turnstile siteKey={TURNSTILE_SITE_KEY} locale={locale} onToken={setToken} />
              </div>
            )}

            <Button type="submit" size="lg" className="w-full justify-center" loading={busy} loadingLabel={t("form.submitting")} iconRight={<Icon name="arrow-right" size={18} />}>
              {t("form.submit")}
            </Button>
            <p className="flex items-start gap-2 text-[13px] text-ink-3">
              <Icon name="lock" size={16} animate="none" className="mt-0.5" />
              {t("page.privacy")}
            </p>
          </>
        )}
      </form>

      {busy && (
        <div className={cn("absolute inset-0 z-10 grid place-items-center rounded-lg bg-night-s1/92 backdrop-blur-sm")}>
          <KundaliLoader />
        </div>
      )}
    </div>
  );
}
