"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Icon } from "@/components/icons";

/** AMX-160 — screen-only toolbar on the printable kundali (hidden in print). */
export function PrintToolbar({ id }: { id: string }) {
  const t = useTranslations("kundali.print");
  return (
    <div className="print-hide mx-auto mb-6 flex max-w-[210mm] flex-wrap items-center justify-between gap-3">
      <Link href={`/kundali/${id}`} className="inline-flex h-11 items-center gap-2 rounded-full border border-line px-5 text-sm font-semibold text-ink-2 hover:text-ink-1 focus-visible:ring-focus">
        <Icon name="arrow-left" size={18} /> {t("back")}
      </Link>
      <p className="order-last w-full text-xs text-ink-3 sm:order-none sm:w-auto">{t("hint")}</p>
      <button
        type="button"
        onClick={() => window.print()}
        className="inline-flex h-11 items-center gap-2 rounded-full bg-grad-gold px-5 text-sm font-semibold text-ink-ongold shadow-e1 focus-visible:ring-focus"
      >
        <Icon name="printer" size={18} /> {t("toolbarPrint")}
      </button>
    </div>
  );
}
