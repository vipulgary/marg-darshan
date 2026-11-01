import { getTranslations, setRequestLocale } from "next-intl/server";
import { Empty, KundaliCard, PageHead, goldLink } from "@/components/account/parts";
import { Link } from "@/i18n/navigation";
import { listKundalis } from "@/lib/account/queries";
import { requireClient } from "@/lib/auth/require";

export default async function AccountKundalis({ params }: PageProps<"/[locale]/account/kundalis">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const me = await requireClient(locale, "/account/kundalis");
  const t = await getTranslations("account");
  const rows = await listKundalis(me.id);
  return (
    <>
      <PageHead title={t("kundalis.title")} />
      {rows.length ? (
        <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {rows.map((k) => (
            <KundaliCard key={k.id} k={k} locale={locale} />
          ))}
        </ul>
      ) : (
        <Empty icon="kundali" action={<Link href="/free-kundali" className={goldLink}>{t("overview.newKundali")}</Link>}>
          {t("kundalis.empty")}
        </Empty>
      )}
    </>
  );
}
