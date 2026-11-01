"use client";

import { useLocale, useTranslations } from "next-intl";
import { PROBLEMS, getService, pick } from "@/content/catalog";
import { SelectableCard } from "@/components/ui/Choice";
import { useBookingStore } from "@/stores/booking";
import { Icon } from "@/components/icons";

export function ProblemStep() {
  const t = useTranslations("booking.problem");
  const locale = useLocale();
  const problemSlug = useBookingStore((s) => s.problemSlug);
  const selectProblem = useBookingStore((s) => s.selectProblem);
  return (
    <fieldset>
      <legend className="sr-only">{t("legend")}</legend>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
        {PROBLEMS.map((p) => {
          const service = getService(p.serviceSlug);
          return (
            <SelectableCard
              key={p.slug}
              name="problem"
              value={p.slug}
              checked={problemSlug === p.slug}
              onChange={selectProblem}
              icon={<Icon name={p.icon} size={40} animate="draw" />}
              title={pick(p.title, locale)}
              subtitle={locale === "hi" ? p.title.en : service && pick(service.title, locale)}
            />
          );
        })}
      </div>
    </fieldset>
  );
}
