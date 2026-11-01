import { NextResponse } from "next/server";
import { isDbConfigured, isUuid, loadKundali } from "@/lib/kundali/store";

const noStore = { "Cache-Control": "no-store" };

export async function GET(_req: Request, ctx: RouteContext<"/api/kundali/[id]">) {
  const { id } = await ctx.params;
  if (!isUuid(id)) return NextResponse.json({ error: "not_found" }, { status: 404, headers: noStore });
  if (!isDbConfigured()) return NextResponse.json({ error: "unavailable" }, { status: 503, headers: noStore });

  try {
    const k = await loadKundali(id);
    if (!k) return NextResponse.json({ error: "not_found" }, { status: 404, headers: noStore });
    return NextResponse.json(
      {
        status: k.status,
        ...(k.status === "DONE" && k.chart ? { chart: k.chart } : {}),
        // The raw engine error stays server-side; the UI shows a friendly retry message.
        ...(k.status === "FAILED" ? { error: "compute_failed" } : {}),
      },
      { headers: noStore },
    );
  } catch (err) {
    console.error("[kundali/:id]", err);
    return NextResponse.json({ error: "server_error" }, { status: 500, headers: noStore });
  }
}
