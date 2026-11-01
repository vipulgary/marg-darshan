"use client";

import { useLocale, useTranslations } from "next-intl";
import { SelectableCard } from "@/components/ui/Choice";
import { formatINR } from "@/lib/format";
import { serviceForProblem } from "@/lib/booking/schemas";
import { useBookingStore } from "@/stores/booking";
import { Icon } from "@/components/icons";

const MODE_ICONS = { ONLINE_ZOOM: "video", PERSONAL_VISIT: "temple" } as const;

export function ModeStep() {
  const t = useTranslations("booking.mode");
  const locale = useLocale();
  const problemSlug = useBookingStore((s) => s.problemSlug);
  const mode = useBookingStore((s) => s.mode);
  const durationMin = useBookingStore((s) => s.durationMin);
  const setMode = useBookingStore((s) => s.setMode);
  const setDuration = useBookingStore((s) => s.setDuration);
  const service = serviceForProblem(problemSlug);
  if (!service) return null;

  return (
    <div className="flex flex-col gap-8">
      <fieldset>
        <legend className="mb-4 text-lg font-semibold text-ink-1">{t("modeLegend")}</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          {service.modes.map((m) => (
            <SelectableCard
              key={m}
              name="mode"
              value={m}
              checked={mode === m}
              onChange={() => setMode(m)}
              icon={<Icon name={MODE_ICONS[m]} size={36} animate="draw" />}
              title={t(`${m}.title`)}
              subtitle={t(`${m}.desc`)}
            />
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="mb-4 text-lg font-semibold text-ink-1">{t("durationLegend")}</legend>
        <div className="flex flex-wrap gap-3">
          {service.durations.map((d) => (
            <label
              key={d}
              className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-full border border-line px-5 text-[15px] text-ink-2 transition-colors hover:border-gold-300 hover:text-ink-1 has-checked:border-transparent has-checked:bg-grad-gold has-checked:font-semibold has-checked:text-ink-ongold has-checked:shadow-glow-gold has-focus-visible:ring-focus"
            >
              <input
                type="radio"
                name="duration"
                value={d}
                checked={durationMin === d}
                onChange={() => setDuration(d)}
                className="sr-only"
              />
              {t("minutes", { count: d })}
              <span aria-hidden>·</span>
              {formatINR(service.prices[d], locale)}
            </label>
          ))}
        </div>
        <p className="mt-3 text-sm text-ink-3">{t("durationHint")}</p>
      </fieldset>
    </div>
  );
}
