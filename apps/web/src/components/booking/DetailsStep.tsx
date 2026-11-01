"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { BirthplaceCombobox } from "@/components/kundali/BirthplaceCombobox";
import { Button } from "@/components/ui/Button";
import { Checkbox, Radio } from "@/components/ui/Choice";
import { Field, Input, Select, Textarea } from "@/components/ui/Field";
import { intakeKind, usesAttachedProfile } from "@/lib/booking/draft";
import { FACINGS, type Facing, GENDERS, type Gender, PROPERTY_TYPES, type PropertyType } from "@/lib/booking/schemas";
import { istDateKey } from "@/lib/booking/slots";
import { useBookingStore } from "@/stores/booking";
import { FloorPlanUpload } from "./FloorPlanUpload";
import { LifeEventsRepeater } from "./LifeEventsRepeater";
import { Icon } from "@/components/icons";

type ErrFn = (key: string) => string | undefined;

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-5">
      <h3 className="border-b border-line-subtle pb-2 text-lg font-semibold text-ink-1">{title}</h3>
      {children}
    </section>
  );
}

export function DetailsStep({ err, touch }: { err: ErrFn; touch: (key: string) => void }) {
  const t = useTranslations("booking.details");
  const tc = useTranslations();
  const s = useBookingStore();
  const kind = intakeKind(s);
  const profileAttached = usesAttachedProfile(s);
  const [today] = useState(() => istDateKey(new Date()));

  return (
    <div className="flex flex-col gap-10">
      <Section title={t("contactTitle")}>
        <Field label={tc("form.name")} required error={err("name")}>
          {(id, d) => (
            <Input
              id={id}
              aria-describedby={d}
              aria-invalid={!!err("name")}
              autoComplete="name"
              placeholder={tc("form.namePlaceholder")}
              value={s.name}
              onChange={(e) => s.update({ name: e.target.value })}
              onBlur={() => touch("name")}
            />
          )}
        </Field>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label={tc("form.email")} required error={err("email")} hint={t("emailHint")}>
            {(id, d) => (
              <Input
                id={id}
                type="email"
                inputMode="email"
                aria-describedby={d}
                aria-invalid={!!err("email")}
                autoComplete="email"
                value={s.email}
                onChange={(e) => s.update({ email: e.target.value })}
                onBlur={() => touch("email")}
              />
            )}
          </Field>
          <Field label={tc("form.phone")} required error={err("phone")} hint={t("phoneHint")}>
            {(id, d) => (
              <Input
                id={id}
                type="tel"
                inputMode="tel"
                aria-describedby={d}
                aria-invalid={!!err("phone")}
                autoComplete="tel"
                placeholder="98765 43210"
                value={s.phone}
                onChange={(e) => s.update({ phone: e.target.value })}
                onBlur={() => touch("phone")}
              />
            )}
          </Field>
        </div>
      </Section>

      {kind !== "vastu" && profileAttached && (
        <div className="flex flex-col gap-3 rounded-lg border border-line-gold bg-saffron-500/8 p-5" role="status">
          <p className="flex items-center gap-1.5 font-semibold text-gold-200"><Icon name="check" size={18} animate="draw" /> {t("profileAttached")}</p>
          <p className="text-sm text-ink-2">{t("profileAttachedHint")}</p>
          <Button type="button" variant="link" className="w-fit" onClick={() => s.update({ birthProfileId: null })}>
            {t("profileDetach")}
          </Button>
        </div>
      )}

      {kind !== "vastu" && !profileAttached && (
        <Section title={kind === "rectification" ? t("rectificationTitle") : t("birthTitle")}>
          <fieldset>
            <legend className="mb-3 text-sm font-medium text-ink-2">
              {tc("form.gender")}
              <span className="ml-0.5 text-saffron-400">*</span>
            </legend>
            <div className="flex flex-wrap gap-x-6 gap-y-3">
              {GENDERS.map((g) => (
                <Radio
                  key={g}
                  name="gender"
                  value={g}
                  label={tc(`form.${g}`)}
                  checked={s.gender === g}
                  onChange={() => s.update({ gender: g as Gender })}
                  className="min-h-11"
                />
              ))}
            </div>
            {err("gender") && (
              <p role="alert" className="mt-2 text-[13px] text-error">
                <Icon name="alert-triangle" size={14} animate="none" className="mr-1 inline-block align-[-2px]" />{err("gender")}
              </p>
            )}
          </fieldset>

          <div className="grid gap-5 sm:grid-cols-2">
            <Field label={t("dob")} required error={err("dob")}>
              {(id, d) => (
                <Input
                  id={id}
                  type="date"
                  min="1900-01-01"
                  max={today}
                  autoComplete="bday"
                  aria-describedby={d}
                  aria-invalid={!!err("dob")}
                  value={s.dob}
                  onChange={(e) => s.update({ dob: e.target.value })}
                  onBlur={() => touch("dob")}
                />
              )}
            </Field>
            {kind === "birth" && (
              <Field label={t("tob")} required error={err("tob")} hint={t("tobHint")}>
                {(id, d) => (
                  <Input
                    id={id}
                    type="time"
                    aria-describedby={d}
                    aria-invalid={!!err("tob")}
                    value={s.tob}
                    onChange={(e) => s.update({ tob: e.target.value })}
                    onBlur={() => touch("tob")}
                  />
                )}
              </Field>
            )}
          </div>

          <BirthplaceCombobox
            label={t("birthplace")}
            required
            value={s.place}
            error={err("place")}
            onChange={(place) => {
              s.update({ place });
              touch("place");
            }}
          />

          {s.problemSlug !== "birth-time-unknown" && (
            <Checkbox
              featured
              label={tc("form.timeUnknown")}
              hint={tc("form.timeUnknownHint")}
              checked={s.timeUnknown}
              onChange={(e) => s.setTimeUnknown(e.target.checked)}
            />
          )}

          {kind === "rectification" && (
            <>
              <fieldset className="flex flex-col gap-3">
                <legend className="mb-1 text-base font-semibold text-ink-1">{t("windowLegend")}</legend>
                <p className="text-sm text-ink-3">{t("windowHint")}</p>
                <div className="grid gap-5 sm:grid-cols-2">
                  <Field label={t("windowStart")} required error={err("approxStart")}>
                    {(id, d) => (
                      <Input
                        id={id}
                        type="time"
                        aria-describedby={d}
                        aria-invalid={!!err("approxStart")}
                        value={s.approxStart}
                        onChange={(e) => s.update({ approxStart: e.target.value })}
                        onBlur={() => touch("approxStart")}
                      />
                    )}
                  </Field>
                  <Field label={t("windowEnd")} required error={err("approxEnd")}>
                    {(id, d) => (
                      <Input
                        id={id}
                        type="time"
                        aria-describedby={d}
                        aria-invalid={!!err("approxEnd")}
                        value={s.approxEnd}
                        onChange={(e) => s.update({ approxEnd: e.target.value })}
                        onBlur={() => touch("approxEnd")}
                      />
                    )}
                  </Field>
                </div>
              </fieldset>
              <LifeEventsRepeater err={err} touch={touch} max={today} />
            </>
          )}
        </Section>
      )}

      {kind === "vastu" && (
        <Section title={t("propertyTitle")}>
          <Field label={t("address")} required error={err("vastuAddress")} hint={t("addressHint")}>
            {(id, d) => (
              <Textarea
                id={id}
                aria-describedby={d}
                aria-invalid={!!err("vastuAddress")}
                autoComplete="street-address"
                className="min-h-[96px]"
                value={s.vastuAddress}
                onChange={(e) => s.update({ vastuAddress: e.target.value })}
                onBlur={() => touch("vastuAddress")}
              />
            )}
          </Field>
          <BirthplaceCombobox
            label={t("propertyLocation")}
            required
            value={s.vastuPlace}
            error={err("vastuPlace")}
            onChange={(vastuPlace) => {
              s.update({ vastuPlace });
              touch("vastuPlace");
            }}
          />
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label={t("propertyType")} required error={err("propertyType")}>
              {(id, d) => (
                <Select
                  id={id}
                  aria-describedby={d}
                  aria-invalid={!!err("propertyType")}
                  value={s.propertyType}
                  onChange={(e) => s.update({ propertyType: e.target.value as PropertyType })}
                  onBlur={() => touch("propertyType")}
                >
                  <option value="">{tc("form.selectPlaceholder")}</option>
                  {PROPERTY_TYPES.map((p) => (
                    <option key={p} value={p}>
                      {t(`propertyTypes.${p}`)}
                    </option>
                  ))}
                </Select>
              )}
            </Field>
            <Field label={t("facing")} required error={err("facing")} hint={t("facingHint")}>
              {(id, d) => (
                <Select
                  id={id}
                  aria-describedby={d}
                  aria-invalid={!!err("facing")}
                  value={s.facing}
                  onChange={(e) => s.update({ facing: e.target.value as Facing })}
                  onBlur={() => touch("facing")}
                >
                  <option value="">{tc("form.selectPlaceholder")}</option>
                  {FACINGS.map((f) => (
                    <option key={f} value={f}>
                      {t(`facings.${f}`)}
                    </option>
                  ))}
                </Select>
              )}
            </Field>
          </div>
          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium text-ink-2">{t("floorPlan")}</p>
            <FloorPlanUpload />
          </div>
        </Section>
      )}

      <Field label={tc("form.question")} hint={t("questionHint")} error={err("question")}>
        {(id, d) => (
          <Textarea
            id={id}
            aria-describedby={d}
            maxLength={2000}
            placeholder={tc("form.questionPlaceholder")}
            value={s.question}
            onChange={(e) => s.update({ question: e.target.value })}
          />
        )}
      </Field>
    </div>
  );
}
