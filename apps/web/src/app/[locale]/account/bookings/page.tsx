import { getTranslations, setRequestLocale } from "next-intl/server";
import { BookingCard, Empty, PageHead, goldLink } from "@/components/account/parts";
import { Link } from "@/i18n/navigation";
import { listBookings, splitBookings } from "@/lib/account/queries";
import { requireClient } from "@/lib/auth/require";

export default async function AccountBookings({ params }: PageProps<"/[locale]/account/bookings">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const me = await requireClient(locale, "/account/bookings");
  const t = await getTranslations("account");
  const { upcoming, past } = splitBookings(await listBookings(me.id, locale));
  return (
    <div className="flex flex-col gap-10">
      <PageHead title={t("bookings.title")} action={<Link href="/book-appointment" className={goldLink}>{t("overview.book")}</Link>} />
      {[
        { key: "upcoming", rows: upcoming },
        { key: "past", rows: past },
      ].map((group) => (
        <section key={group.key} className="flex flex-col gap-4" aria-labelledby={`bk-${group.key}`}>
          <h2 id={`bk-${group.key}`} className="text-xl font-semibold text-ink-1">
            {t(`bookings.${group.key}`)} <span className="text-ink-3">({group.rows.length})</span>
          </h2>
          {group.rows.length ? (
            <ul className="grid gap-4 xl:grid-cols-2">
              {group.rows.map((b) => (
                <BookingCard key={b.id} b={b} locale={locale} upcoming={group.key === "upcoming"} />
              ))}
            </ul>
          ) : (
            <Empty icon="calendar">{t("bookings.empty")}</Empty>
          )}
        </section>
      ))}
    </div>
  );
}
