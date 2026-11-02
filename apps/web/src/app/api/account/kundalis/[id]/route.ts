import { db } from "@/lib/db";
import { csrfOk, json } from "@/lib/auth/http";
import { getCurrentClient } from "@/lib/auth/session";

/**
 * Deletes a kundali from the account — and any duplicate copies of the same person (same birth
 * date, time and place), so it disappears from the list in one go. Scoped to the owner.
 */
export async function DELETE(req: Request, ctx: RouteContext<"/api/account/kundalis/[id]">) {
  if (!csrfOk(req)) return json({ error: "forbidden" }, 403);
  const me = await getCurrentClient();
  if (!me) return json({ error: "unauthorized" }, 401);
  const { id } = await ctx.params;
  const row = await db.horoscope.findFirst({ where: { id, birthProfile: { clientId: me.id } }, select: { inputHash: true } }).catch(() => null);
  if (!row) return json({ error: "not_found" }, 404);
  const { count } = await db.horoscope.deleteMany({ where: { inputHash: row.inputHash, birthProfile: { clientId: me.id } } });
  return json({ ok: true, deleted: count });
}
