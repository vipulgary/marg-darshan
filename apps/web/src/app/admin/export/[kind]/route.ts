import { getSession } from "@/lib/admin/auth";
import { type CsvValue, toCsv } from "@/lib/csv";
import { db } from "@/lib/db";

const KINDS = ["appointments", "payments", "enquiries", "subscribers"] as const;
type Kind = (typeof KINDS)[number];

async function build(kind: Kind): Promise<[string[], CsvValue[][]]> {
  switch (kind) {
    case "appointments": {
      const rows = await db.appointment.findMany({ include: { client: true, problem: true, service: true }, orderBy: { slotStart: "desc" } });
      return [
        ["id", "slot_start", "duration_min", "status", "mode", "service", "problem", "client", "email", "phone"],
        rows.map((a) => [a.id, a.slotStart, a.durationMins, a.status, a.visitMode, a.service.slug, a.problem.slug, a.client.fullName, a.client.email, a.client.whatsappPhone]),
      ];
    }
    case "payments": {
      const rows = await db.payment.findMany({ include: { invoice: true }, orderBy: { createdAt: "desc" } });
      return [
        ["id", "created_at", "appointment_id", "plan", "installment", "amount_inr", "status", "razorpay_payment_id", "invoice"],
        rows.map((p) => [p.id, p.createdAt, p.appointmentId, p.planType, p.installmentNo, p.amountInr, p.status, p.razorpayPaymentId, p.invoice?.number]),
      ];
    }
    case "enquiries": {
      const rows = await db.shopEnquiry.findMany({ include: { product: true }, orderBy: { createdAt: "desc" } });
      return [["created_at", "name", "phone", "sku", "product", "note"], rows.map((e) => [e.createdAt, e.name, e.phone, e.product.sku, e.product.titleEn, e.customerNote])];
    }
    case "subscribers": {
      const rows = await db.newsletterSub.findMany({ orderBy: { createdAt: "desc" } });
      return [["created_at", "email", "whatsapp", "language", "status"], rows.map((s) => [s.createdAt, s.email, s.whatsappPhone, s.language, s.status])];
    }
  }
}

export async function GET(_req: Request, ctx: RouteContext<"/admin/export/[kind]">) {
  const session = await getSession();
  if (session?.role !== "admin") return new Response("Unauthorized", { status: 401 });
  const { kind } = await ctx.params;
  if (!KINDS.includes(kind as Kind)) return new Response("Not found", { status: 404 });
  const [headers, rows] = await build(kind as Kind);
  return new Response(toCsv(headers, rows), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="astromax-${kind}-${new Date().toISOString().slice(0, 10)}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
