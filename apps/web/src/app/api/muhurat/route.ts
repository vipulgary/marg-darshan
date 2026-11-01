import { NextResponse } from "next/server";
import { EngineError, getPanchang, isEngineConfigured } from "@/lib/engine/client";
import { dayMuhurat } from "@/lib/muhurat/choghadiya";
import { clientIp, rateLimit } from "@/lib/rate-limit";

const DELHI = { lat: 28.6139, lng: 77.209, tz: "Asia/Kolkata" };

const todayIn = (tz: string) => new Intl.DateTimeFormat("en-CA", { timeZone: tz }).format(new Date());
const addDay = (iso: string) => new Date(Date.parse(`${iso}T00:00:00Z`) + 864e5).toISOString().slice(0, 10);

/** GET /api/muhurat?lat=&lng=&tz=&date= — panchang + choghadiya + Rahu Kaal + Abhijit for one local day. */
export async function GET(req: Request) {
  const sp = new URL(req.url).searchParams;
  const lat = Number(sp.get("lat") ?? DELHI.lat);
  const lng = Number(sp.get("lng") ?? DELHI.lng);
  const tz = sp.get("tz") ?? DELHI.tz;
  if (!Number.isFinite(lat) || Math.abs(lat) > 90 || !Number.isFinite(lng) || Math.abs(lng) > 180) {
    return NextResponse.json({ error: "bad_location" }, { status: 400 });
  }
  try {
    new Intl.DateTimeFormat("en", { timeZone: tz });
  } catch {
    return NextResponse.json({ error: "bad_tz" }, { status: 400 });
  }
  const date = sp.get("date") ?? todayIn(tz);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return NextResponse.json({ error: "bad_date" }, { status: 400 });

  const limit = rateLimit(`muhurat:${clientIp(req)}`, 60, 60_000);
  if (!limit.ok) return NextResponse.json({ error: "rate_limited" }, { status: 429, headers: { "Retry-After": String(limit.retryAfterSec) } });
  if (!isEngineConfigured()) return NextResponse.json({ error: "engine_unavailable" }, { status: 503 });

  try {
    const [today, tomorrow] = await Promise.all([getPanchang({ date, lat, lng, tz }), getPanchang({ date: addDay(date), lat, lng, tz })]);
    if (!today.sunrise || !today.sunset || !tomorrow.sunrise) return NextResponse.json({ error: "no_sunrise" }, { status: 422 });
    const weekday = new Date(`${date}T00:00:00Z`).getUTCDay();
    const m = dayMuhurat(weekday, new Date(today.sunrise), new Date(today.sunset), new Date(tomorrow.sunrise));
    return NextResponse.json(
      { date, tz, lat, lng, panchang: today, ...m },
      { headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=600" } },
    );
  } catch (err) {
    console.error("[muhurat]", err);
    const status = err instanceof EngineError && err.status === 503 ? 503 : 502;
    return NextResponse.json({ error: "engine_unavailable" }, { status });
  }
}
