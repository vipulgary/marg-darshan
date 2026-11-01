"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select } from "@/components/ui/Field";
import { LIFE_EVENT_TYPES, type LifeEventType, MAX_LIFE_EVENTS, MIN_LIFE_EVENTS } from "@/lib/booking/schemas";
import { useBookingStore } from "@/stores/booking";
import { Icon } from "@/components/icons";

export function LifeEventsRepeater({ err, touch, max }: { err: (k: string) => string | undefined; touch: (k: string) => void; max: string }) {
  const t = useTranslations("booking.events");
  const events = useBookingStore((s) => s.lifeEvents);
  const addLifeEvent = useBookingStore((s) => s.addLifeEvent);
  const updateLifeEvent = useBookingStore((s) => s.updateLifeEvent);
  const removeLifeEvent = useBookingStore((s) => s.removeLifeEvent);
  const listError = err("lifeEvents");

  return (
    <fieldset className="flex flex-col gap-4">
      <legend className="mb-1 text-base font-semibold text-ink-1">{t("legend")}</legend>
      <p className="text-sm text-ink-3">{t("hint", { min: MIN_LIFE_EVENTS, max: MAX_LIFE_EVENTS })}</p>
      <ol className="flex flex-col gap-4">
        {events.map((ev, i) => (
          <li key={ev.id} className="grid gap-3 rounded-lg border border-line-subtle bg-night-s2/50 p-4 sm:grid-cols-[1fr_180px_auto] sm:items-end">
            <Field label={t("type", { n: i + 1 })} required error={err(`lifeEvents.${i}.type`)}>
              {(id, d) => (
                <Select
                  id={id}
                  aria-describedby={d}
                  aria-invalid={!!err(`lifeEvents.${i}.type`)}
                  value={ev.type}
                  onChange={(e) => updateLifeEvent(ev.id, { type: e.target.value as LifeEventType })}
                  onBlur={() => touch(`lifeEvents.${i}.type`)}
                >
                  <option value="">{t("choose")}</option>
                  {LIFE_EVENT_TYPES.map((k) => (
                    <option key={k} value={k}>
                      {t(`types.${k}`)}
                    </option>
                  ))}
                </Select>
              )}
            </Field>
            <Field label={t("date")} required error={err(`lifeEvents.${i}.date`)}>
              {(id, d) => (
                <Input
                  id={id}
                  type="date"
                  min="1900-01-01"
                  max={max}
                  aria-describedby={d}
                  aria-invalid={!!err(`lifeEvents.${i}.date`)}
                  value={ev.date}
                  onChange={(e) => updateLifeEvent(ev.id, { date: e.target.value })}
                  onBlur={() => touch(`lifeEvents.${i}.date`)}
                />
              )}
            </Field>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => removeLifeEvent(ev.id)}
              disabled={events.length <= MIN_LIFE_EVENTS}
              aria-label={t("remove", { n: i + 1 })}
            >
              <Icon name="x" size={18} />
            </Button>
          </li>
        ))}
      </ol>
      {listError && (
        <p role="alert" className="text-[13px] text-error">
          <Icon name="alert-triangle" size={14} animate="none" className="mr-1 inline-block align-[-2px]" />{listError}
        </p>
      )}
      {events.length < MAX_LIFE_EVENTS && (
        <Button type="button" variant="secondary" size="sm" className="w-fit" iconLeft="+" onClick={addLifeEvent}>
          {t("add")}
        </Button>
      )}
    </fieldset>
  );
}
