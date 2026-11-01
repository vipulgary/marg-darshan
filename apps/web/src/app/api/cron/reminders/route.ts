import { cronGuard } from "@/lib/cron/auth";
import { sendDueReminders } from "@/lib/notifications/scheduled";

/** Cron (Vercel GET every 15 min, or POST with x-cron-secret): client reminders + Jyotish 2h pre-read. */
async function handle(req: Request) {
  const denied = cronGuard(req, { needsDb: true });
  if (denied) return denied;
  try {
    return Response.json(await sendDueReminders(new Date()));
  } catch (e) {
    console.error("reminders cron failed", e);
    return Response.json({ error: "server_error" }, { status: 500 });
  }
}

export const GET = handle;
export const POST = handle;
