import Link from "next/link";
import type { Prisma } from "@/generated/prisma/client";
import { Badge } from "@/components/ui/Display";
import { db } from "@/lib/db";
import { STATUS_TONE, fmtDateTime, fmtInr, istDayRange, label } from "../_lib/fmt";
import { requireAdmin } from "@/lib/admin/auth";

export const metadata = { title: "Bookings" };

const VIEWS = ["today", "upcoming", "held", "past", "all"] as const;
type View = (typeof VIEWS)[number];

function whereFor(view: View, q?: string): Prisma.AppointmentWhereInput {
  const now = new Date();
  const { start, end } = istDayRange(now);
  const base: Prisma.AppointmentWhereInput = q
    ? { client: { OR: [{ fullName: { contains: q, mode: "insensitive" } }, { email: { contains: q, mode: "insensitive" } }, { whatsappPhone: { contains: q } }] } }
    : {};
  switch (view) {
    case "today":
      return { ...base, slotStart: { gte: start, lt: end }, status: { in: ["CONFIRMED", "PARTIALLY_PAID", "COMPLETED", "NO_SHOW"] } };
    case "upcoming":
      return { ...base, slotStart: { gte: now }, status: { in: ["CONFIRMED", "PARTIALLY_PAID"] } };
    case "held":
      return { ...base, status: { in: ["HELD", "PENDING_PAYMENT"] } };
    case "past":
      return { ...base, slotStart: { lt: now } };
    default:
      return base;
  }
}

export default async function BookingsPage({ searchParams }: PageProps<"/admin">) {
  // Layouts and pages render in parallel, so each page checks auth before touching the DB.
  await requireAdmin();
  const sp = await searchParams;
  const view: View = VIEWS.includes(sp.view as View) ? (sp.view as View) : "today";
  const q = typeof sp.q === "string" && sp.q.trim() ? sp.q.trim() : undefined;
  const now = new Date();
  const { start, end } = istDayRange(now);
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));

  const [rows, todayCount, upcomingCount, heldCount, revenue, enquiries] = await Promise.all([
    db.appointment.findMany({
      where: whereFor(view, q),
      include: { client: true, problem: true, service: true, payments: { select: { status: true, amountInr: true } } },
      orderBy: { slotStart: view === "past" ? "desc" : "asc" },
      take: 200,
    }),
    db.appointment.count({ where: { slotStart: { gte: start, lt: end }, status: { in: ["CONFIRMED", "PARTIALLY_PAID"] } } }),
    db.appointment.count({ where: { slotStart: { gte: now }, status: { in: ["CONFIRMED", "PARTIALLY_PAID"] } } }),
    db.appointment.count({ where: { status: { in: ["HELD", "PENDING_PAYMENT"] } } }),
    db.payment.aggregate({ where: { status: "CAPTURED", updatedAt: { gte: monthStart } }, _sum: { amountInr: true } }),
    db.shopEnquiry.count({ where: { createdAt: { gte: new Date(now.getTime() - 7 * 86400_000) } } }),
  ]);

  const kpis = [
    { label: "Sessions today", value: todayCount },
    { label: "Upcoming confirmed", value: upcomingCount },
    { label: "Held / awaiting payment", value: heldCount },
    { label: "Collected this month", value: fmtInr(revenue._sum.amountInr ?? 0) },
    { label: "Shop enquiries (7d)", value: enquiries },
  ];

  return (
    <div className="flex flex-col gap-6">
      {sp.denied && <p role="alert" className="rounded-md bg-warning/12 px-3 py-2 text-sm text-warning">That page needs the admin role.</p>}
      <h1 className="text-2xl">Bookings</h1>
      <dl className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        {kpis.map((k) => (
          <div key={k.label} className="rounded-lg border border-line bg-night-s1 p-4">
            <dt className="text-xs text-ink-3">{k.label}</dt>
            <dd className="mt-1 text-2xl font-semibold text-ink-1 tabular-nums">{k.value}</dd>
          </div>
        ))}
      </dl>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <nav aria-label="views" className="flex flex-wrap gap-2">
          {VIEWS.map((v) => (
            <Link
              key={v}
              href={{ query: { view: v, ...(q ? { q } : {}) } }}
              aria-current={v === view ? "page" : undefined}
              className={`rounded-full px-3 py-1.5 text-sm font-medium ${v === view ? "bg-grad-gold text-ink-ongold" : "border border-line text-ink-2 hover:bg-night-s2"}`}
            >
              {label(v)}
            </Link>
          ))}
        </nav>
        <form className="flex gap-2">
          <input type="hidden" name="view" value={view} />
          <input name="q" defaultValue={q} placeholder="Name, email or phone" aria-label="Search clients" className="h-9 w-56 rounded-md border border-line bg-night-s1 px-3 text-sm" />
          <a download href="/admin/export/appointments" className="inline-flex h-9 items-center rounded-full border border-line px-3 text-sm text-ink-2 hover:bg-night-s2">Export CSV</a>
        </form>
      </div>

      <div className="overflow-x-auto rounded-lg border border-line bg-night-s1">
        <table className="w-full min-w-[820px] text-sm">
          <thead className="bg-night-s2 text-left text-xs uppercase tracking-wide text-ink-3">
            <tr>
              <th className="p-3">Slot (IST)</th><th className="p-3">Client</th><th className="p-3">Problem</th><th className="p-3">Mode</th><th className="p-3">Status</th><th className="p-3">Paid</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr><td colSpan={6} className="p-8 text-center text-ink-3">No bookings in this view.</td></tr>
            )}
            {rows.map((a) => {
              const paid = a.payments.filter((p) => p.status === "CAPTURED").reduce((s, p) => s + p.amountInr, 0);
              return (
                <tr key={a.id} className="border-t border-line-subtle hover:bg-night-s2">
                  <td className="p-3 whitespace-nowrap"><Link href={`/admin/appointments/${a.id}`} className="font-medium text-ink-1 underline-offset-2 hover:underline">{fmtDateTime(a.slotStart)}</Link><div className="text-xs text-ink-3">{a.durationMins} min</div></td>
                  <td className="p-3"><div className="text-ink-1">{a.client.fullName}</div><div className="text-xs text-ink-3">{a.client.whatsappPhone ?? a.client.email}</div></td>
                  <td className="p-3">{a.problem.titleEn}<div className="text-xs text-ink-3">{a.service.titleEn}</div></td>
                  <td className="p-3">{a.visitMode === "ONLINE_ZOOM" ? "Online" : "Visit"}</td>
                  <td className="p-3"><Badge tone={STATUS_TONE[a.status]}>{label(a.status)}</Badge></td>
                  <td className="p-3 tabular-nums">{paid ? fmtInr(paid) : "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
