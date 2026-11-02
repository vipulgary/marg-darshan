import { NextResponse } from "next/server";
import { z } from "zod";
import { gemProductFor, pick } from "@/content/catalog";
import { EngineError, computeHoroscope, isEngineConfigured } from "@/lib/engine/client";
import { CONCERNS, type Concern, findGems } from "@/lib/gems/finder";
import { placeSchema } from "@/lib/kundali/schema";
import { clientIp, rateLimit } from "@/lib/rate-limit";

const bodySchema = z.object({
  dob: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  tob: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  place: placeSchema,
  weightKg: z.number().min(20).max(200).default(60),
  concerns: z.array(z.enum(CONCERNS.map((c) => c.key) as [Concern, ...Concern[]])).max(7).default([]),
  lang: z.enum(["hi", "en"]).default("hi"),
});

/** POST /api/gems — AMX-204 Gem Finder: safe gems for this chart and these problems, with shop stock. */
export async function POST(req: Request) {
  const limit = rateLimit(`gems:${clientIp(req)}`, 30, 60 * 60_000);
  if (!limit.ok) return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "validation", issues: parsed.error.issues.map((i) => i.path.join(".")) }, { status: 400 });
  if (!isEngineConfigured()) return NextResponse.json({ error: "engine_unavailable" }, { status: 503 });
  const { dob, tob, place, weightKg, concerns, lang } = parsed.data;
  try {
    const chart = await computeHoroscope({ name: "Gem Finder", gender: "other", dob, tob, place, lang });
    const { gems, avoid } = findGems(chart.ascendant.sign, concerns, weightKg, lang);
    return NextResponse.json({
      lagna: lang === "hi" ? chart.ascendant.sign_hi : chart.ascendant.sign_en,
      lagnaSign: chart.ascendant.sign,
      avoid,
      gems: gems.map((g) => {
        const product = gemProductFor(g.planet);
        // The stocked weight closest to the recommendation (ties go to the heavier stone).
        const best = product?.variants?.slice().sort((a, b) => Math.abs(a.weight - g.weight) - Math.abs(b.weight - g.weight) || b.weight - a.weight)[0] ?? null;
        return {
          ...g,
          product: product
            ? { slug: product.slug, sku: product.sku, title: pick(product.title, lang), variants: product.variants ?? [], best }
            : null,
        };
      }),
    });
  } catch (err) {
    console.error("[gems]", err);
    return NextResponse.json({ error: "engine_unavailable" }, { status: err instanceof EngineError && err.status === 422 ? 400 : 503 });
  }
}
