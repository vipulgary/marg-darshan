import { cronGuard } from "@/lib/cron/auth";
import { expireHolds } from "@/lib/booking/expire";

/** Cron (Vercel GET every 5 min, or POST with x-cron-secret). */
async function handle(req: Request) {
  const denied = cronGuard(req, { needsDb: true });
  if (denied) return denied;
  try {
    return Response.json(await expireHolds());
  } catch (e) {
    console.error("expire-holds failed", e);
    return Response.json({ error: "server_error" }, { status: 500 });
  }
}

export const GET = handle;
export const POST = handle;
