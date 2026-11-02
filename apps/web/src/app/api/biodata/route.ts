import { NextResponse } from "next/server";
import { clientIp, rateLimit } from "@/lib/rate-limit";

/**
 * POST /api/biodata (multipart "file") — AMX-206. Reads a marriage biodata (PDF or photo) with
 * Claude and returns only what is actually written: name, gender, DOB, birth time, birthplace,
 * height, education, profession. Missing fields come back null (never guessed). The file is not stored.
 * Needs ANTHROPIC_API_KEY; without it returns 501 so the page can say "not configured".
 */
const MODEL = process.env.BIODATA_MODEL ?? "claude-sonnet-5-5";
const TYPES: Record<string, "image" | "document"> = {
  "image/jpeg": "image",
  "image/png": "image",
  "image/webp": "image",
  "application/pdf": "document",
};

const PROMPT = `This is an Indian marriage biodata (Hindi and/or English). Extract ONLY what is written.
Return strict JSON, no prose:
{"name": string|null, "gender": "male"|"female"|null, "dob": "YYYY-MM-DD"|null, "tob": "HH:mm" (24h)|null,
 "place": string|null (birthplace as "City, State, Country"), "height": string|null, "education": string|null, "profession": string|null}
Rules: never guess or infer a value that is not written. Convert Hindi numerals and AM/PM to the formats above.
If the birth time is missing or only approximate ("morning"), tob must be null. If several people appear, use the person the biodata is for.`;

export async function POST(req: Request) {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return NextResponse.json({ error: "not_configured" }, { status: 501 });
  const limit = rateLimit(`biodata:${clientIp(req)}`, 20, 60 * 60_000);
  if (!limit.ok) return NextResponse.json({ error: "rate_limited" }, { status: 429 });

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "no_file" }, { status: 400 });
  const kind = TYPES[file.type];
  if (!kind) return NextResponse.json({ error: "bad_type" }, { status: 415 });
  if (file.size > 8 * 1024 * 1024) return NextResponse.json({ error: "too_large" }, { status: 413 });

  const data = Buffer.from(await file.arrayBuffer()).toString("base64");
  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "x-api-key": key, "anthropic-version": "2023-06-01", "content-type": "application/json" },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 600,
        messages: [{ role: "user", content: [{ type: kind, source: { type: "base64", media_type: file.type, data } }, { type: "text", text: PROMPT }] }],
      }),
      signal: AbortSignal.timeout(60_000),
    });
    if (!res.ok) {
      console.error("[biodata] model error", res.status);
      return NextResponse.json({ error: "read_failed" }, { status: 502 });
    }
    const out = (await res.json()) as { content?: { type: string; text?: string }[] };
    const text = out.content?.find((c) => c.type === "text")?.text ?? "";
    const json = JSON.parse(text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1)) as Record<string, string | null>;
    const ok = (v: unknown, re: RegExp) => (typeof v === "string" && re.test(v) ? v : null);
    return NextResponse.json({
      name: typeof json.name === "string" ? json.name.slice(0, 80) : null,
      gender: json.gender === "male" || json.gender === "female" ? json.gender : null,
      dob: ok(json.dob, /^\d{4}-\d{2}-\d{2}$/),
      tob: ok(json.tob, /^([01]\d|2[0-3]):[0-5]\d$/),
      place: typeof json.place === "string" ? json.place.slice(0, 120) : null,
      height: typeof json.height === "string" ? json.height.slice(0, 40) : null,
      education: typeof json.education === "string" ? json.education.slice(0, 120) : null,
      profession: typeof json.profession === "string" ? json.profession.slice(0, 120) : null,
    });
  } catch (err) {
    console.error("[biodata]", err);
    return NextResponse.json({ error: "read_failed" }, { status: 502 });
  }
}
