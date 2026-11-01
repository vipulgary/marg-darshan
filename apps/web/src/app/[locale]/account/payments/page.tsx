import { getTranslations, setRequestLocale } from "next-intl/server";
import { Icon } from "@/components/icons";
import { Empty, PageHead, pillLink } from "@/components/account/parts";
import { Badge } from "@/components/ui/Display";
import { listPayments } from "@/lib/account/queries";
import { requireClient } from "@/lib/auth/require";
import { formatDateIST, formatINR } from "@/lib/format";

export default async function AccountPayments({ params }: PageProps<"/[locale]/account/payments">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const me = await requireClient(locale, "/account/payments");
  const t = await getTranslations("account.payments");
  const rows = await listPayments(me.id, locale);
  return (
    <>
      <PageHead title={t("title")} />
      {rows.length ? (
        <ul className="flex flex-col gap-3">
          {rows.map((p) => (
            <li key={p.id} className="flex flex-col gap-3 rounded-lg border border-line bg-night-s1 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="font-semibold text-ink-1">
                  {p.serviceTitle}
                  {p.installmentNo > 1 && <span className="text-ink-3"> · {t("installment", { n: p.installmentNo })}</span>}
                </p>
                <p className="text-sm text-ink-3">
                  {formatDateIST(p.createdAt, locale, { day: "numeric", month: "short", year: "numeric" })}
                  {p.invoiceNumber && ` · ${p.invoiceNumber}`}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <span className="font-display text-xl text-gold-200">{formatINR(p.amountInr, locale)}</span>
                <Badge tone={p.status === "CAPTURED" ? "success" : "neutral"}>{t(`status.${p.status}`)}</Badge>
                {p.invoiceId ? (
                  <a href={`/api/account/invoices/${p.invoiceId}`} target="_blank" rel="noopener" className={pillLink}>
                    <Icon name="file" size={16} animate="none" /> {t("invoice")}
                  </a>
                ) : (
                  <span className="text-sm text-ink-3">{t("noInvoice")}</span>
                )}
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <Empty icon="file">{t("empty")}</Empty>
      )}
    </>
  );
}
