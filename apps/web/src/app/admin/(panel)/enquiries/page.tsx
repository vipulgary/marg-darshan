import { requireAdmin } from "@/lib/admin/auth";
import { db } from "@/lib/db";
import { fmtDateTime } from "../../_lib/fmt";

export const metadata = { title: "Enquiries" };

export default async function EnquiriesPage() {
  await requireAdmin("admin");
  const [enquiries, subs] = await Promise.all([
    db.shopEnquiry.findMany({ include: { product: true, problem: true }, orderBy: { createdAt: "desc" }, take: 200 }),
    db.newsletterSub.groupBy({ by: ["status"], _count: true }),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl">Shop enquiries</h1>
        <div className="flex gap-2">
          <a download href="/admin/export/enquiries" className="rounded-full border border-line px-3 py-1.5 text-sm text-ink-2 hover:bg-night-s2">Export enquiries</a>
          <a download href="/admin/export/subscribers" className="rounded-full border border-line px-3 py-1.5 text-sm text-ink-2 hover:bg-night-s2">Export subscribers</a>
        </div>
      </div>
      <p className="text-sm text-ink-3">
        Newsletter: {subs.map((s) => `${s._count} ${s.status.toLowerCase()}`).join(" · ") || "no subscribers yet"}
      </p>
      <div className="overflow-x-auto rounded-lg border border-line bg-night-s1">
        <table className="w-full min-w-[760px] text-sm">
          <thead className="bg-night-s2 text-left text-xs uppercase tracking-wide text-ink-3">
            <tr><th className="p-3">When</th><th className="p-3">Name</th><th className="p-3">Phone</th><th className="p-3">Product</th><th className="p-3">Problem</th><th className="p-3">Note</th></tr>
          </thead>
          <tbody>
            {enquiries.length === 0 && <tr><td colSpan={6} className="p-8 text-center text-ink-3">No enquiries yet.</td></tr>}
            {enquiries.map((e) => (
              <tr key={e.id} className="border-t border-line-subtle">
                <td className="p-3 whitespace-nowrap">{fmtDateTime(e.createdAt)}</td>
                <td className="p-3 text-ink-1">{e.name}</td>
                <td className="p-3"><a className="text-violet-500 underline" href={`https://wa.me/${e.phone.replace(/\D/g, "")}`}>{e.phone}</a></td>
                <td className="p-3">{e.product.titleEn}<div className="text-xs text-ink-3">{e.product.sku}</div></td>
                <td className="p-3">{e.problem?.titleEn ?? "—"}</td>
                <td className="p-3 max-w-xs">{e.customerNote ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
