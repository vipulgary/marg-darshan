import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/Display";
import { canTransition } from "@/lib/booking/machine";
import { db } from "@/lib/db";
import { changeStatus, saveNotes } from "../../../actions";
import { PAYMENT_TONE, STATUS_TONE, fmtDate, fmtDateTime, fmtInr, label } from "../../../_lib/fmt";
import { requireAdmin } from "@/lib/admin/auth";
import { Icon } from "@/components/icons";

export const metadata = { title: "Appointment" };

function Row({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[140px_1fr] gap-3 py-1.5 text-sm">
      <dt className="text-ink-3">{k}</dt>
      <dd className="text-ink-1 break-words">{v ?? "—"}</dd>
    </div>
  );
}

export default async function AppointmentPage({ params }: PageProps<"/admin/appointments/[id]">) {
  await requireAdmin();
  const { id } = await params;
  const a = await db.appointment.findUnique({
    where: { id },
    include: {
      client: true,
      problem: true,
      service: true,
      payments: { include: { invoice: true }, orderBy: { installmentNo: "asc" } },
      birthProfile: { include: { horoscopes: { where: { status: "DONE" }, take: 1, orderBy: { createdAt: "desc" } } } },
    },
  });
  if (!a) notFound();
  const bp = a.birthProfile;
  const horoscope = bp?.horoscopes[0];
  const actions = (["COMPLETE", "NO_SHOW", "CANCEL"] as const).filter((e) => canTransition(a.status, e));

  return (
    <div className="flex max-w-4xl flex-col gap-6">
      <Link href="/admin" className="inline-flex items-center gap-1.5 text-sm text-ink-3 hover:text-ink-1"><Icon name="arrow-left" size={16} /> Bookings</Link>
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl">{a.client.fullName}</h1>
        <Badge tone={STATUS_TONE[a.status]}>{label(a.status)}</Badge>
      </div>

      <section className="grid gap-6 lg:grid-cols-2">
        <dl className="rounded-lg border border-line bg-night-s1 p-5">
          <h2 className="mb-2 text-base">Session</h2>
          <Row k="Slot (IST)" v={`${fmtDateTime(a.slotStart)} · ${a.durationMins} min`} />
          <Row k="Problem" v={a.problem.titleEn} />
          <Row k="Service" v={a.service.titleEn} />
          <Row k="Mode" v={a.visitMode === "ONLINE_ZOOM" ? "Online (Zoom)" : "Personal visit"} />
          <Row k="Zoom" v={a.zoomUrl ? <a className="text-violet-500 underline" href={a.zoomUrl}>Join link</a> : null} />
          <Row k="Question" v={a.problemDescription} />
        </dl>
        <dl className="rounded-lg border border-line bg-night-s1 p-5">
          <h2 className="mb-2 text-base">Client</h2>
          <Row k="Email" v={a.client.email} />
          <Row k="WhatsApp" v={a.client.whatsappPhone} />
          <Row k="Language" v={a.client.preferredLang} />
          {bp && (
            <>
              <Row k="Birth date" v={bp.isDateUnknown ? "Unknown" : fmtDate(bp.dob)} />
              <Row k="Birth time" v={bp.isTimeUnknown ? "Unknown" : bp.tob?.toISOString().slice(11, 16)} />
              <Row k="Birthplace" v={bp.placeName} />
              <Row k="Kundali" v={horoscope ? <a className="text-violet-500 underline" href={`/en/kundali/${horoscope.id}`}>Open chart</a> : "Not generated"} />
            </>
          )}
        </dl>
      </section>

      {a.vastuProperty && (
        <section className="rounded-lg border border-line bg-night-s1 p-5">
          <h2 className="mb-2 text-base">Vastu property</h2>
          <pre className="overflow-x-auto whitespace-pre-wrap text-xs">{JSON.stringify(a.vastuProperty, null, 2)}</pre>
          {a.vastuMapUrl && <a className="text-sm text-violet-500 underline" href={a.vastuMapUrl}>Floor plan</a>}
        </section>
      )}
      {bp?.lifeEvents && (
        <section className="rounded-lg border border-line bg-night-s1 p-5">
          <h2 className="mb-2 text-base">Life events (rectification)</h2>
          <pre className="overflow-x-auto whitespace-pre-wrap text-xs">{JSON.stringify(bp.lifeEvents, null, 2)}</pre>
        </section>
      )}

      <section className="rounded-lg border border-line bg-night-s1 p-5">
        <h2 className="mb-3 text-base">Payments</h2>
        {a.payments.length === 0 ? (
          <p className="text-sm text-ink-3">No payments yet.</p>
        ) : (
          <ul className="flex flex-col gap-2 text-sm">
            {a.payments.map((p) => (
              <li key={p.id} className="flex flex-wrap items-center gap-3">
                <span>#{p.installmentNo}</span>
                <span className="tabular-nums">{fmtInr(p.amountInr)}</span>
                <Badge tone={PAYMENT_TONE[p.status]}>{label(p.status)}</Badge>
                {p.invoice && <a className="text-violet-500 underline" href={`/admin/invoices/${p.invoice.id}`}>{p.invoice.number}</a>}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-lg border border-line bg-night-s1 p-5">
        <h2 className="mb-3 text-base">Session notes (private)</h2>
        <form action={saveNotes} className="flex flex-col gap-3">
          <input type="hidden" name="id" value={a.id} />
          <textarea name="notes" defaultValue={a.sessionNotes ?? ""} rows={6} aria-label="Session notes" className="rounded-md border border-line bg-night-s2 p-3 text-sm" />
          <button className="self-start rounded-full bg-grad-gold px-4 py-2 text-sm font-semibold text-ink-ongold">Save notes</button>
        </form>
      </section>

      {actions.length > 0 && (
        <section className="flex flex-wrap gap-3">
          {actions.map((e) => (
            <form key={e} action={changeStatus}>
              <input type="hidden" name="id" value={a.id} />
              <input type="hidden" name="event" value={e} />
              <button className={`rounded-full border px-4 py-2 text-sm font-medium ${e === "CANCEL" ? "border-error text-error" : "border-line text-ink-1 hover:bg-night-s2"}`}>
                {e === "COMPLETE" ? "Mark completed" : e === "NO_SHOW" ? "Mark no-show" : "Cancel booking"}
              </button>
            </form>
          ))}
        </section>
      )}
    </div>
  );
}
