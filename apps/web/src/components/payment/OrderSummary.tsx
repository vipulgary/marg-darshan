import { useLocale, useTranslations } from "next-intl";
import { getProblem, getService, pick } from "@/content/catalog";
import { formatDateIST, formatSlotRange } from "@/lib/format";

export interface BookingSummaryData {
  problemSlug: string;
  serviceSlug: string;
  mode: "ONLINE_ZOOM" | "PERSONAL_VISIT";
  slotStart: string;
  slotEnd: string;
  durationMin: number;
}

/** design.md §11.7 order summary — plain definition list, works on server and client. */
export function OrderSummary({ data, title }: { data: BookingSummaryData; title?: string }) {
  const t = useTranslations("payment");
  const locale = useLocale();
  const problem = getProblem(data.problemSlug);
  const service = getService(data.serviceSlug);
  const rows: [string, string][] = [
    ...(problem ? ([[t("problem"), pick(problem.title, locale)]] as [string, string][]) : []),
    [t("service"), service ? pick(service.title, locale) : data.serviceSlug],
    [t("mode"), data.mode === "ONLINE_ZOOM" ? t("online") : t("visit")],
    [t("date"), formatDateIST(data.slotStart, locale, { weekday: "short", day: "numeric", month: "long", year: "numeric" })],
    [t("time"), t("istSuffix", { range: formatSlotRange(data.slotStart, data.slotEnd, locale) })],
    [t("duration"), t("minutes", { count: data.durationMin })],
  ];
  return (
    <section aria-labelledby="order-summary-title" className="rounded-md border border-line bg-night-s2 p-4">
      <h2 id="order-summary-title" className="mb-2 text-base font-semibold text-ink-1">
        {title ?? t("summaryTitle")}
      </h2>
      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-[15px]">
        {rows.map(([label, value]) => (
          <div key={label} className="contents">
            <dt className="text-ink-3">{label}</dt>
            <dd className="text-right font-medium text-ink-1">{value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
