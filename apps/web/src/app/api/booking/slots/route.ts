import { getService } from "@/content/catalog";
import { slotsQuerySchema } from "@/lib/booking/schemas";
import { clampWindow, generateSlots, slotWindow } from "@/lib/booking/slots";
import { CalendarNotConfiguredError, getBusyRanges } from "@/lib/calendar";
import { getSettings } from "@/lib/settings";

/** GET /api/booking/slots?service=&mode=&duration=&from=YYYY-MM-DD&days= */
export async function GET(req: Request) {
  const params = Object.fromEntries(new URL(req.url).searchParams);
  const parsed = slotsQuerySchema.safeParse(params);
  if (!parsed.success) return Response.json({ error: "invalid_query", issues: parsed.error.issues }, { status: 400 });
  const { service: slug, mode, duration } = parsed.data;
  const service = getService(slug)!;
  if (!service.modes.includes(mode)) return Response.json({ error: "invalid_mode" }, { status: 400 });
  if (!service.durations.includes(duration)) return Response.json({ error: "invalid_duration" }, { status: 400 });

  const now = new Date();
  const { from, days } = clampWindow({ from: parsed.data.from, days: parsed.data.days, now });
  const range = slotWindow(from, days);
  try {
    const [busy, { workingHours }] = await Promise.all([getBusyRanges(range.start, range.end), getSettings()]);
    return Response.json(
      {
        timeZone: "Asia/Kolkata",
        service: slug,
        mode,
        durationMin: duration,
        days: generateSlots({ durationMin: duration, busy, now, from, days, workingHours }),
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (e) {
    if (e instanceof CalendarNotConfiguredError) return Response.json({ error: "calendar_unavailable", message: e.message }, { status: 503 });
    console.error("slots failed", e);
    return Response.json({ error: "calendar_unavailable" }, { status: 503 });
  }
}
