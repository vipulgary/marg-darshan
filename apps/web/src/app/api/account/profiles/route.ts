import { db } from "@/lib/db";
import { csrfOk, json, readJson } from "@/lib/auth/http";
import { profileData, savedProfileSchema } from "@/lib/auth/profile-schema";
import { getCurrentClient } from "@/lib/auth/session";

const MAX_PROFILES = 20;

export async function POST(req: Request) {
  if (!csrfOk(req)) return json({ error: "forbidden" }, 403);
  const me = await getCurrentClient();
  if (!me) return json({ error: "unauthorized" }, 401);
  const parsed = savedProfileSchema.safeParse(await readJson(req));
  if (!parsed.success) return json({ error: "validation", issues: parsed.error.issues.map((i) => i.path.join(".")) }, 400);
  const count = await db.birthProfile.count({ where: { clientId: me.id, label: { not: null } } });
  if (count >= MAX_PROFILES) return json({ error: "too_many" }, 400);
  const created = await db.birthProfile.create({ data: { clientId: me.id, ...profileData(parsed.data) }, select: { id: true } });
  return json({ id: created.id }, 201);
}
