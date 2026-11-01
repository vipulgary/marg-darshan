import { NextResponse } from "next/server";
import { EngineError, getPanchang, isEngineConfigured } from "@/lib/engine/client";

const DEFAULTS = { lat: 28.6139, lng: 77.209, tz: "Asia/Kolkata" };
const CACHE = "public, s-maxage=21600, max-age=3600, stale-while-revalidate=3600";

function num(v: string | null, fallback: number, limit: number): number | null {
  if (v === null || v === "") return fallback;
  const n = Number(v);
  return Number.isFinite(n) && Math.abs(n) <= limit ? n : null;
}

export async function GET(req: Request) {
  const sp = new URL(req.url).searchParams;
  const date = sp.get("date") ?? undefined;
  const lat = num(sp.get("lat"), DEFAULTS.lat, 90);
  const lng = num(sp.get("lng"), DEFAULTS.lng, 180);
  const tz = sp.get("tz") || DEFAULTS.tz;
  if ((date && !/^\d{4}-\d{2}-\d{2}$/.test(date)) || lat === null || lng === null || tz.length > 64) {
    return NextResponse.json({ error: "invalid_params" }, { status: 400 });
  }
  if (!isEngineConfigured()) {
    return NextResponse.json({ error: "engine_unavailable" }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
  try {
    const data = await getPanchang({ date, lat, lng, tz });
    return NextResponse.json(data, { headers: { "Cache-Control": CACHE } });
  } catch (err) {
    const status = err instanceof EngineError && (err.status === 400 || err.status === 422) ? 400 : 503;
    console.error("[panchang]", err);
    return NextResponse.json({ error: status === 400 ? "invalid_params" : "engine_unavailable" }, { status, headers: { "Cache-Control": "no-store" } });
  }
}
