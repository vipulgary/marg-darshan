import Link from "next/link";
import { Badge } from "@/components/ui/Display";
import { requireAdmin } from "@/lib/admin/auth";
import { db } from "@/lib/db";
import { issueInvoice } from "../../actions";
import { PAYMENT_TONE, fmtDateTime, fmtInr, label } from "../../_lib/fmt";

export const metadata = { title: "Payments" };

export default async function PaymentsPage() {
  await requireAdmin("admin");
  const payments = await db.payment.findMany({
    include: { invoice: true, appointment: { include: { client: true } } },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl">Payments</h1>
        <a download href="/admin/export/payments" className="rounded-full border border-line px-3 py-1.5 text-sm text-ink-2 hover:bg-night-s2">Export CSV</a>
      </div>
      <div className="overflow-x-auto rounded-lg border border-line bg-night-s1">
        <table className="w-full min-w-[860px] text-sm">
          <thead className="bg-night-s2 text-left text-xs uppercase tracking-wide text-ink-3">
            <tr><th className="p-3">Created</th><th className="p-3">Client</th><th className="p-3">Plan</th><th className="p-3">Amount</th><th className="p-3">Status</th><th className="p-3">Razorpay</th><th className="p-3">Invoice</th></tr>
          </thead>
          <tbody>
            {payments.length === 0 && <tr><td colSpan={7} className="p-8 text-center text-ink-3">No payments yet.</td></tr>}
            {payments.map((p) => (
              <tr key={p.id} className="border-t border-line-subtle">
                <td className="p-3 whitespace-nowrap">{fmtDateTime(p.createdAt)}</td>
                <td className="p-3"><Link className="text-ink-1 hover:underline" href={`/admin/appointments/${p.appointmentId}`}>{p.appointment.client.fullName}</Link></td>
                <td className="p-3">{label(p.planType)} #{p.installmentNo}</td>
                <td className="p-3 tabular-nums">{fmtInr(p.amountInr)}{p.balanceDueInr > 0 && <div className="text-xs text-warning">Balance {fmtInr(p.balanceDueInr)}</div>}</td>
                <td className="p-3"><Badge tone={PAYMENT_TONE[p.status]}>{label(p.status)}</Badge></td>
                <td className="p-3 font-mono text-xs">{p.razorpayPaymentId ?? p.razorpayOrderId ?? "—"}</td>
                <td className="p-3">
                  {p.invoice ? (
                    <a className="text-violet-500 underline" href={`/admin/invoices/${p.invoice.id}`}>{p.invoice.number}</a>
                  ) : p.status === "CAPTURED" ? (
                    <form action={issueInvoice} className="flex gap-1">
                      <input type="hidden" name="paymentId" value={p.id} />
                      <input name="stateCode" placeholder="State" aria-label="Buyer state code" className="h-8 w-16 rounded-sm border border-line px-2 text-xs" />
                      <button className="rounded-full border border-line px-3 text-xs hover:bg-night-s2">Issue</button>
                    </form>
                  ) : (
                    "—"
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
