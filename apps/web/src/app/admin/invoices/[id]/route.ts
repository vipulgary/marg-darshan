import { getSession } from "@/lib/admin/auth";
import { db } from "@/lib/db";
import type { InvoiceBreakdown } from "@/lib/invoice/issue";
import { invoiceHtml } from "@/lib/invoice/template";

export async function GET(_req: Request, ctx: RouteContext<"/admin/invoices/[id]">) {
  if (!(await getSession())) return new Response("Unauthorized", { status: 401 });
  const { id } = await ctx.params;
  const inv = await db.invoice.findUnique({ where: { id } });
  if (!inv) return new Response("Not found", { status: 404 });
  const html = invoiceHtml({ ...inv, breakdown: inv.breakdown as unknown as InvoiceBreakdown });
  return new Response(html, { headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" } });
}
