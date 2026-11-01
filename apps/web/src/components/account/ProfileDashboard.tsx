import { getTranslations } from "next-intl/server";
import { Icon, type IconName } from "@/components/icons";
import { SummaryChips } from "@/components/kundali/SummaryChips";
import { KundaliReport } from "@/components/report/KundaliReport";
import { Link } from "@/i18n/navigation";
import { type SavedProfile, ensureProfileKundali } from "@/lib/account/profile-kundali";
import { cn } from "@/lib/cn";
import { getPanchang } from "@/lib/engine/client";
import { dayMuhurat, nextGoodWindow } from "@/lib/muhurat/choghadiya";
import { buildReport } from "@/lib/report/build";
import { goldLink, pillLink } from "./parts";

/** Today's next good choghadiya and Rahu Kaal at the profile's place; null if the engine is unreachable. */
async function todayTimes(place: SavedProfile["place"]) {
  try {
    const tz = place.tzName;
    const date = new Intl.DateTimeFormat("en-CA", { timeZone: tz }).format(new Date());
    const next = new Date(Date.parse(`${date}T00:00:00Z`) + 864e5).toISOString().slice(0, 10);
    const q = { lat: place.latitude, lng: place.longitude, tz };
    const [a, b] = await Promise.all([getPanchang({ ...q, date }), getPanchang({ ...q, date: next })]);
    if (!a.sunrise || !a.sunset || !b.sunrise) return null;
    const m = dayMuhurat(new Date(`${date}T00:00:00Z`).getUTCDay(), new Date(a.sunrise), new Date(a.sunset), new Date(b.sunrise));
    const now = new Date();
    const good = nextGoodWindow(m, now, { minutes: 30 });
    const slot = good ? m.slots.find((s) => s.start <= good.start && good.start < s.end) ?? null : null;
    return { good, slotName: slot?.name ?? null, rahu: m.rahuKaal, tz };
  } catch {
    return null;
  }
}

const TOOLS: { key: string; href: string; icon: IconName }[] = [
  { key: "milan", href: "/kundali-milan", icon: "rings" },
  { key: "muhurat", href: "/shubh-samay", icon: "clock" },
  { key: "numerology", href: "/numerology", icon: "star" },
  { key: "book", href: "/book-appointment", icon: "calendar" },
];

/**
 * Logged-in home: a profile switcher (Self, spouse, kids…) and, for the selected profile, its
 * automatically created kundali with every report section, PDF download and quick tools.
 */
export async function ProfileDashboard({ clientId, locale, profiles, active }: { clientId: string; locale: string; profiles: SavedProfile[]; active: SavedProfile | null }) {
  const t = await getTranslations("account.dash");

  if (!active) {
    return (
      <section className="flex flex-col items-start gap-4 rounded-xl border border-line-gold bg-night-s1 p-6 shadow-e1 sm:p-8">
        <Icon name="kundali" size={36} animate="draw" className="text-gold-300" />
        <h2 className="font-display text-2xl text-ink-1">{t("emptyTitle")}</h2>
        <p className="max-w-[62ch] text-ink-2">{t("emptyBody")}</p>
        <Link href="/account/profiles" className={goldLink}>
          {t("emptyCta")}
        </Link>
      </section>
    );
  }

  const lang = locale === "en" ? "en" : "hi";
  const [k, times] = await Promise.all([ensureProfileKundali(clientId, active, lang), todayTimes(active.place)]);
  const tm = await getTranslations("muhurat");
  const lucky = k ? buildReport(k.chart, lang).lucky : null;
  const fmt = (d: Date) => d.toLocaleTimeString(lang === "hi" ? "hi-IN" : "en-IN", { timeZone: times?.tz, hour: "numeric", minute: "2-digit", hour12: true });
  const glance: { key: string; icon: IconName; value: string; note?: string; tone?: string }[] = [
    ...(times
      ? [
          {
            key: "nextGood",
            icon: "clock" as IconName,
            value: times.good ? `${fmt(times.good.start)} – ${fmt(times.good.end)}` : t("noneToday"),
            note: times.slotName ? tm(`names.${times.slotName}`) : undefined,
            tone: "text-success",
          },
          { key: "rahu", icon: "alert-triangle" as IconName, value: `${fmt(times.rahu.start)} – ${fmt(times.rahu.end)}`, tone: "text-error" },
        ]
      : []),
    ...(lucky
      ? [
          { key: "luckyColour", icon: "sparkle" as IconName, value: lucky.colour },
          { key: "luckyNumber", icon: "star" as IconName, value: String(lucky.number) },
          { key: "luckyDay", icon: "calendar" as IconName, value: lucky.day },
          { key: "luckyGem", icon: "gem" as IconName, value: lucky.gem },
        ]
      : []),
  ];

  return (
    <div className="flex flex-col gap-6">
      <nav aria-label={t("profilesBar")} className="-mx-1 flex items-center gap-2 overflow-x-auto px-1 pb-1">
        {profiles.map((p) => {
          const on = p.id === active.id;
          return (
            <Link
              key={p.id}
              href={`/account?p=${p.id}`}
              aria-current={on ? "page" : undefined}
              className={cn(
                "inline-flex h-10 shrink-0 items-center gap-2 rounded-full border px-4 text-sm font-semibold transition-colors focus-visible:ring-focus",
                on ? "border-transparent bg-grad-gold text-ink-ongold shadow-e1" : "border-line text-ink-2 hover:border-line-gold hover:text-ink-1",
              )}
            >
              <Icon name="user" size={16} />
              {p.label}
            </Link>
          );
        })}
        <Link href="/account/profiles" className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full border border-dashed border-line-gold px-4 text-sm font-semibold text-gold-300 hover:bg-gold-300/8 focus-visible:ring-focus">
          + {t("addProfile")}
        </Link>
      </nav>

      <section className="flex flex-col gap-5 rounded-xl border border-line bg-night-s1 p-5 shadow-e1 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[13px] font-semibold text-gold-300">{active.label}</p>
            <h2 className="font-display text-3xl text-ink-1">{active.name || active.label}</h2>
            <p className="mt-1 text-sm text-ink-3">
              {[active.dob, active.tob, active.place.placeName].filter(Boolean).join(" · ")}
            </p>
            {!active.tob && <p className="mt-1 text-xs text-warning">{t("approxTime")}</p>}
          </div>
          {k && (
            <div className="flex flex-wrap gap-2">
              <Link href={`/kundali/${k.id}`} className={pillLink}>
                <Icon name="kundali" size={16} /> {t("openChart")}
              </Link>
              <Link href={`/kundali/${k.id}/print`} className={goldLink}>
                <Icon name="download" size={16} /> {t("pdf")}
              </Link>
              <span aria-disabled className={cn(pillLink, "cursor-not-allowed opacity-60")} title={t("soon")}>
                <Icon name="play" size={16} /> {t("listen")} · {t("soon")}
              </span>
            </div>
          )}
        </div>
        {k ? <SummaryChips chart={k.chart} lang={lang} /> : <p role="alert" className="text-error">{t("unavailable")}</p>}
      </section>

      {glance.length > 0 && (
        <section className="flex flex-col gap-3">
          <h3 className="flex items-baseline gap-2 text-lg font-semibold text-ink-1">
            {t("glance")} <span className="text-xs font-normal text-ink-3">{t("forCity", { city: active.place.placeName.split(",")[0] })}</span>
          </h3>
          <ul className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
            {glance.map((g) => (
              <li key={g.key} className="flex flex-col gap-1 rounded-lg border border-line bg-night-s1 p-4">
                <span className="flex items-center gap-1.5 text-xs font-semibold text-ink-3">
                  <Icon name={g.icon} size={14} className={g.tone ?? "text-gold-300"} /> {t(g.key)}
                </span>
                <span className="text-[15px] font-semibold leading-snug text-ink-1">{g.value}</span>
                {g.note && <span className="text-xs text-ink-3">{g.note}</span>}
              </li>
            ))}
          </ul>
        </section>
      )}

      {k && <KundaliReport chart={k.chart} locale={locale} name={active.name} dob={active.dob} />}

      <section className="flex flex-col gap-3">
        <h3 className="text-lg font-semibold text-ink-1">{t("more", { name: active.label })}</h3>
        <ul className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {TOOLS.map((tool) => (
            <li key={tool.key}>
              <Link
                href={tool.href}
                className="group flex h-full flex-col gap-2 rounded-lg border border-line bg-night-s1 p-4 transition-all hover:-translate-y-0.5 hover:border-line-gold hover:shadow-e2 focus-visible:ring-focus"
              >
                <Icon name={tool.icon} size={26} animate="hover" className="text-gold-300" />
                <span className="font-semibold text-ink-1">{t(`tools.${tool.key}.title`)}</span>
                <span className="text-sm text-ink-3">{t(`tools.${tool.key}.desc`)}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
