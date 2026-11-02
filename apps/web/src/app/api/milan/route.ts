import { NextResponse } from "next/server";
import { z } from "zod";
import { EngineError, computeHoroscope, isEngineConfigured, matchCharts } from "@/lib/engine/client";
import { placeSchema } from "@/lib/kundali/schema";
import { clientIp, rateLimit } from "@/lib/rate-limit";

const person = z.object({
  name: z.string().trim().min(2).max(80),
  dob: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  tob: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  place: placeSchema,
});
const bodySchema = z.object({ boy: person, girl: person, lang: z.enum(["hi", "en"]).default("hi") });

/** POST /api/milan — Kundali Milan (Ashtakoot 36 + Nadi/Bhakoot/Manglik) for a boy and a girl. */
export async function POST(req: Request) {
  const limit = rateLimit(`milan:${clientIp(req)}`, 20, 60 * 60_000);
  if (!limit.ok) return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "validation", issues: parsed.error.issues.map((i) => i.path.join(".")) }, { status: 400 });
  if (!isEngineConfigured()) return NextResponse.json({ error: "engine_unavailable" }, { status: 503 });
  const { boy, girl, lang } = parsed.data;
  try {
    const b = { ...boy, gender: "male" as const, lang };
    const g = { ...girl, gender: "female" as const, lang };
    // Both full charts too, so the result can compare the two people side by side.
    const [result, boyChart, girlChart] = await Promise.all([matchCharts(b, g), computeHoroscope(b), computeHoroscope(g)]);
    const strip = ({ vargas: _v, ...c }: typeof boyChart) => c;
    return NextResponse.json({ ...result, charts: { boy: strip(boyChart), girl: strip(girlChart) } });
  } catch (err) {
    console.error("[milan]", err);
    return NextResponse.json({ error: "engine_unavailable" }, { status: err instanceof EngineError && err.status === 422 ? 400 : 503 });
  }
}
