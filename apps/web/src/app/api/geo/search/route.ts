import { NextResponse } from "next/server";
import { EngineError, isEngineConfigured, searchPlaces } from "@/lib/engine/client";
import { searchNominatim } from "@/lib/geo/nominatim";
import { clientIp, rateLimit } from "@/lib/rate-limit";

export async function GET(req: Request) {
  const q = (new URL(req.url).searchParams.get("q") ?? "").trim();
  if (q.length < 2) return NextResponse.json({ error: "query_too_short", message: "q must be at least 2 characters" }, { status: 400 });
  if (q.length > 120) return NextResponse.json({ error: "query_too_long", message: "q must be at most 120 characters" }, { status: 400 });

  const limit = rateLimit(`geo:${clientIp(req)}`, 30, 60_000);
  if (!limit.ok) {
    return NextResponse.json(
      { error: "rate_limited", retryAfterSec: limit.retryAfterSec },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSec) } },
    );
  }

  // Prefer the engine (exact historical timezones); fall back to Nominatim so the form never dead-ends.
  if (isEngineConfigured()) {
    try {
      const places = await searchPlaces(q);
      return NextResponse.json(places, { headers: { "Cache-Control": "public, max-age=86400" } });
    } catch (err) {
      if (err instanceof EngineError && (err.status === 422 || err.status === 400)) {
        return NextResponse.json({ error: "bad_query", message: "Invalid place query" }, { status: 400 });
      }
      console.warn("[geo/search] engine failed, using Nominatim fallback", err);
    }
  }

  try {
    const places = await searchNominatim(q);
    return NextResponse.json(places, { headers: { "Cache-Control": "public, max-age=86400" } });
  } catch (err) {
    console.error("[geo/search] fallback failed", err);
    return NextResponse.json({ error: "geo_unavailable", message: "Place search is temporarily unavailable" }, { status: 503 });
  }
}
