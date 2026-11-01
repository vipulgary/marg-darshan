import { db } from "@/lib/db";
import { csrfOk, json, readJson } from "@/lib/auth/http";
import { profileData, savedProfileSchema } from "@/lib/auth/profile-schema";
import { getCurrentClient } from "@/lib/auth/session";

export async function PATCH(req: Request, ctx: RouteContext<"/api/account/profiles/[id]">) {
  if (!csrfOk(req)) return json({ error: "forbidden" }, 403);
  const me = await getCurrentClient();
  if (!me) return json({ error: "unauthorized" }, 401);
  const { id } = await ctx.params;
  const parsed = savedProfileSchema.safeParse(await readJson(req));
  if (!parsed.success) return json({ error: "validation", issues: parsed.error.issues.map((i) => i.path.join(".")) }, 400);
  // Scoped by clientId so one customer can never touch another's profile.
  const { count } = await db.birthProfile.updateMany({ where: { id, clientId: me.id }, data: profileData(parsed.data) }).catch(() => ({ count: 0 }));
  return count ? json({ ok: true }) : json({ error: "not_found" }, 404);
}

/**
 * Removes the profile from the saved list. Charts and bookings made from it keep their copy of
 * the birth data, so the row is only unlabelled rather than deleted.
 */
export async function DELETE(req: Request, ctx: RouteContext<"/api/account/profiles/[id]">) {
  if (!csrfOk(req)) return json({ error: "forbidden" }, 403);
  const me = await getCurrentClient();
  if (!me) return json({ error: "unauthorized" }, 401);
  const { id } = await ctx.params;
  const { count } = await db.birthProfile.updateMany({ where: { id, clientId: me.id }, data: { label: null } }).catch(() => ({ count: 0 }));
  return count ? json({ ok: true }) : json({ error: "not_found" }, 404);
}
