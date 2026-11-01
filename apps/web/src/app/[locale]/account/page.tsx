import { getTranslations, setRequestLocale } from "next-intl/server";
import { BookingCard, KundaliCard, PageHead, goldLink, pillLink } from "@/components/account/parts";
import { Link } from "@/i18n/navigation";
import { countProfiles, listBookings, listKundalis, listPayments, splitBookings } from "@/lib/account/queries";
import { requireClient } from "@/lib/auth/require";

export default async function AccountOverview({ params }: PageProps<"/[locale]/account">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const me = await requireClient(locale, "/account");
  const t = await getTranslations("account.overview");
  const [kundalis, bookings, payments, profiles] = await Promise.all([
    listKundalis(me.id, 3),
    listBookings(me.id, locale),
    listPayments(me.id, locale),
    countProfiles(me.id),
  ]);
  const kundaliCount = kundalis.length < 3 ? kundalis.length : (await listKundalis(me.id)).length;
  const { upcoming } = splitBookings(bookings);
  const stats = [
    { key: "kundalis", value: kundaliCount, href: "/account/kundalis" },
    { key: "upcoming", value: upcoming.length, href: "/account/bookings" },
    { key: "payments", value: payments.length, href: "/account/payments" },
    { key: "profiles", value: profiles, href: "/account/profiles" },
  ];

  return (
    <div className="flex flex-col gap-10">
      <PageHead
        eyebrow={t("eyebrow")}
        title={t("greeting", { name: me.fullName.split(" ")[0] })}
        lead={t("lead")}
        action={
          <div className="flex flex-wrap gap-2">
            <Link href="/book-appointment" className={goldLink}>{t("book")}</Link>
            <Link href="/free-kundali" className={pillLink}>{t("newKundali")}</Link>
          </div>
        }
      />
      <ul className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {stats.map((s) => (
          <li key={s.key}>
            <Link href={s.href} className="flex flex-col gap-1 rounded-lg border border-line bg-night-s1 p-4 transition-colors hover:border-line-hover focus-visible:ring-focus">
              <span className="font-display text-3xl text-gold-200">{s.value}</span>
              <span className="text-sm text-ink-2">{t(`stats.${s.key}`)}</span>
            </Link>
          </li>
        ))}
      </ul>
      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold text-ink-1">{t("next")}</h2>
        {upcoming[0] ? (
          <ul>
            <BookingCard b={upcoming[0]} locale={locale} upcoming />
          </ul>
        ) : (
          <p className="text-ink-3">{t("noUpcoming")}</p>
        )}
      </section>
      {kundalis.length > 0 && (
        <section className="flex flex-col gap-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xl font-semibold text-ink-1">{t("recentKundalis")}</h2>
            <Link href="/account/kundalis" className="text-sm font-semibold text-gold-300 underline-offset-4 hover:underline focus-visible:ring-focus">
              {t("viewAll")}
            </Link>
          </div>
          <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {kundalis.map((k) => (
              <KundaliCard key={k.id} k={k} locale={locale} />
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
