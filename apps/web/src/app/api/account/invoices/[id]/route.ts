import { db } from "@/lib/db";
import { getCurrentClient } from "@/lib/auth/session";
import type { InvoiceBreakdown } from "@/lib/invoice/issue";
import { invoiceHtml } from "@/lib/invoice/template";
import { isUuid } from "@/lib/kundali/store";

/** Customer copy of a GST invoice — only the client who paid can open it. */
export async function GET(_req: Request, ctx: RouteContext<"/api/account/invoices/[id]">) {
  const me = await getCurrentClient();
  if (!me) return new Response("Unauthorized", { status: 401 });
  const { id } = await ctx.params;
  if (!isUuid(id)) return new Response("Not found", { status: 404 });
  const inv = await db.invoice.findFirst({ where: { id, payment: { appointment: { clientId: me.id } } } });
  if (!inv) return new Response("Not found", { status: 404 });
  const html = invoiceHtml({ ...inv, breakdown: inv.breakdown as unknown as InvoiceBreakdown });
  return new Response(html, {
    headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "private, no-store", "X-Robots-Tag": "noindex" },
  });
}
