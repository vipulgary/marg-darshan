import { NextResponse } from "next/server";
import { clientIp, rateLimit } from "@/lib/rate-limit";

/** POST /api/tts {text, lang} → natural voice audio from the self-hosted Piper service (AMX-203). */
const VOICE_URL = process.env.VOICE_URL ?? "http://127.0.0.1:8001";

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as { text?: unknown; lang?: unknown } | null;
  const text = typeof body?.text === "string" ? body.text.trim() : "";
  if (!text || text.length > 2000) return NextResponse.json({ error: "bad_text" }, { status: 400 });
  const lang = body?.lang === "en" ? "en" : "hi";

  const limit = rateLimit(`tts:${clientIp(req)}`, 240, 60_000);
  if (!limit.ok) return NextResponse.json({ error: "rate_limited" }, { status: 429 });

  try {
    const res = await fetch(`${VOICE_URL}/tts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, lang }),
      signal: AbortSignal.timeout(60_000),
    });
    if (!res.ok) return NextResponse.json({ error: "voice_failed" }, { status: 502 });
    return new Response(res.body, { headers: { "Content-Type": "audio/wav", "Cache-Control": "private, max-age=86400" } });
  } catch {
    return NextResponse.json({ error: "voice_unavailable" }, { status: 503 });
  }
}
