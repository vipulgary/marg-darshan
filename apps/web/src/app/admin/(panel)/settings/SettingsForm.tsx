"use client";

import { type ReactNode, useActionState, useEffect, useRef } from "react";
import { Icon } from "@/components/icons";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Choice";
import { Field, Input, Select, Textarea } from "@/components/ui/Field";
import { SERVICES } from "@/content/catalog";
import { cn } from "@/lib/cn";
import { DAY_NAMES, type FormValues, type SettingsFormState } from "@/lib/settings/schema";
import { saveBusinessSettings } from "../../actions";

const HOURS = Array.from({ length: 25 }, (_, h) => h);
const hourLabel = (h: number) => `${String(h).padStart(2, "0")}:00`;

function Section({ id, title, description, children }: { id: string; title: string; description: string; children: ReactNode }) {
  return (
    <section aria-labelledby={id} className="rounded-lg border border-line bg-night-s1 p-5 shadow-e1 md:p-6">
      <h2 id={id} className="text-base text-ink-1">
        {title}
      </h2>
      <p className="mb-5 mt-1 text-sm text-ink-3">{description}</p>
      <div className="grid gap-5 sm:grid-cols-2">{children}</div>
    </section>
  );
}

export function SettingsForm({ initial, canSave }: { initial: FormValues; canSave: boolean }) {
  const [state, action, pending] = useActionState<SettingsFormState, FormData>(saveBusinessSettings, { status: "idle" });
  const bannerRef = useRef<HTMLDivElement>(null);
  const values = state.values ?? initial;
  const errors = state.fieldErrors ?? {};
  const val = (name: string) => {
    const v = values[name];
    return Array.isArray(v) ? "" : (v ?? "");
  };
  const err = (name: string) => errors[name];
  const days = new Set((Array.isArray(values["workingHours.days"]) ? values["workingHours.days"] : []).map(Number));

  useEffect(() => {
    if (state.status !== "idle") bannerRef.current?.focus();
  }, [state.submittedAt, state.status]);

  const text = (name: string, label: string, props: { type?: string; hint?: string; inputMode?: "numeric" | "email" | "tel"; prefix?: string; suffix?: string; required?: boolean } = {}) => (
    <Field key={name} label={label} hint={props.hint} error={err(name)} required={props.required ?? true}>
      {(id, describedBy) => (
        <div className="relative">
          {props.prefix && (
            <span aria-hidden className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-3">
              {props.prefix}
            </span>
          )}
          <Input
            id={id}
            name={name}
            type={props.type ?? "text"}
            inputMode={props.inputMode}
            defaultValue={val(name)}
            required={props.required ?? true}
            aria-invalid={err(name) ? true : undefined}
            aria-describedby={describedBy}
            className={cn(props.prefix && "pl-9", props.suffix && "pr-16")}
          />
          {props.suffix && (
            <span aria-hidden className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm text-ink-3">
              {props.suffix}
            </span>
          )}
        </div>
      )}
    </Field>
  );

  const hourSelect = (name: string, label: string, from: number, to: number) => (
    <Field label={label} error={err(name)} required>
      {(id, describedBy) => (
        <Select id={id} name={name} defaultValue={val(name)} aria-invalid={err(name) ? true : undefined} aria-describedby={describedBy}>
          {HOURS.filter((h) => h >= from && h <= to).map((h) => (
            <option key={h} value={h}>
              {hourLabel(h)} IST
            </option>
          ))}
        </Select>
      )}
    </Field>
  );

  const splitServices = SERVICES.filter((s) => s.splitAllowed);

  return (
    // Remount after every save so uncontrolled inputs pick up the saved / echoed values.
    <form key={state.submittedAt ?? 0} action={action} noValidate className="flex flex-col gap-6" aria-describedby="settings-status">
      <div
        id="settings-status"
        ref={bannerRef}
        tabIndex={-1}
        role={state.status === "error" ? "alert" : "status"}
        aria-live="polite"
        className={cn(
          "flex items-start gap-2 rounded-md border px-4 py-3 text-sm outline-none focus-visible:ring-focus",
          state.status === "idle" && "sr-only",
          state.status === "success" && "border-success/40 bg-success/10 text-ink-1",
          state.status === "error" && "border-error/40 bg-error/10 text-ink-1",
        )}
      >
        {state.status !== "idle" && (
          <Icon
            name={state.status === "success" ? "check" : "alert-triangle"}
            size={18}
            animate="none"
            className={state.status === "success" ? "text-success" : "text-error"}
          />
        )}
        <span>{state.message}</span>
      </div>

      <Section id="settings-contact" title="Contact" description="Shown on the contact page, in emails and in WhatsApp links.">
        {text("whatsappNumber", "WhatsApp number", { inputMode: "tel", hint: "Country code + number, digits only, e.g. 919876543210" })}
        {text("contactEmail", "Contact email", { type: "email", inputMode: "email" })}
        {(["en", "hi"] as const).map((l) => {
          const name = `officeAddress.${l}`;
          return (
            <Field key={l} label={l === "en" ? "Office address (English)" : "Office address (Hindi)"} error={err(name)} required>
              {(id, describedBy) => (
                <Textarea
                  id={id}
                  name={name}
                  lang={l}
                  rows={3}
                  defaultValue={val(name)}
                  required
                  maxLength={300}
                  aria-invalid={err(name) ? true : undefined}
                  aria-describedby={describedBy}
                  className="min-h-[96px]"
                />
              )}
            </Field>
          );
        })}
      </Section>

      <Section id="settings-hours" title="Hours & booking rules" description="Hourly slots are generated inside these hours (IST). Existing bookings are not changed.">
        {hourSelect("workingHours.start", "Opening hour", 0, 23)}
        {hourSelect("workingHours.end", "Closing hour (sessions end by)", 1, 24)}
        <fieldset className="sm:col-span-2" aria-describedby={err("workingHours.days") ? "days-err" : undefined}>
          <legend className="mb-3 text-sm font-medium text-ink-2">
            Working days<span className="ml-0.5 text-saffron-400">*</span>
          </legend>
          <div className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-4">
            {DAY_NAMES.map((name, d) => (
              <Checkbox key={name} name="workingHours.days" value={String(d)} label={name} defaultChecked={days.has(d)} className="min-h-11 items-center" />
            ))}
          </div>
          {err("workingHours.days") && (
            <p id="days-err" role="alert" className="mt-2 flex items-center gap-1.5 text-[13px] text-error">
              <Icon name="alert-triangle" size={14} animate="none" />
              {err("workingHours.days")}
            </p>
          )}
        </fieldset>
        {text("holdMinutes", "Slot hold while paying", { inputMode: "numeric", suffix: "min", hint: "5–60 minutes" })}
        {text("cancellationHours", "Free reschedule / cancel until", { inputMode: "numeric", suffix: "hours", hint: "Hours before the session (0–168)" })}
      </Section>

      <Section id="settings-prices" title="Prices" description="Whole rupees per session length. Applies to new bookings and checkouts; already-paid bookings keep their price.">
        {SERVICES.map((s) => (
          <fieldset key={s.slug} className="rounded-md border border-line-subtle p-4">
            <legend className="px-1 text-sm font-semibold text-ink-1">{s.title.en}</legend>
            <div className="mt-2 flex flex-col gap-4">
              {s.durations.map((d) => text(`services.${s.slug}.prices.${d}`, `${d} min session`, { inputMode: "numeric", prefix: "₹" }))}
            </div>
          </fieldset>
        ))}
      </Section>

      <Section id="settings-payments" title="Payments" description="Split plan: an advance now, the balance before the session.">
        {splitServices.map((s) =>
          text(`services.${s.slug}.advancePct`, `${s.title.en} — advance`, { inputMode: "numeric", suffix: "%", hint: "1–99% of the total" }),
        )}
        {text("paymentBalanceDaysBefore", "Balance due", { inputMode: "numeric", suffix: "days", hint: "Days before the session the balance link expires (0–30)" })}
      </Section>

      <div className="sticky bottom-0 -mx-4 flex flex-wrap items-center gap-3 border-t border-line bg-night-1/95 px-4 py-4 backdrop-blur md:-mx-8 md:px-8">
        <Button type="submit" loading={pending} loadingLabel="Saving…" disabled={!canSave}>
          Save settings
        </Button>
        {!canSave && <p className="text-sm text-ink-3">Saving needs a database (DATABASE_URL). The site is using the defaults shown.</p>}
      </div>
    </form>
  );
}
