import { db } from "@/lib/db";
import { csrfOk, json, limited, readJson, str } from "@/lib/auth/http";
import { hashPassword, passwordProblem, verifyPassword } from "@/lib/auth/password";
import { createSession, getCurrentClient, revokeAllSessions } from "@/lib/auth/session";

/** Change (or, for Google-only accounts, set) the password. Other devices are signed out. */
export async function POST(req: Request) {
  if (!csrfOk(req)) return json({ error: "forbidden" }, 403);
  const me = await getCurrentClient();
  if (!me) return json({ error: "unauthorized" }, 401);
  const rl = limited(req, "password", me.id, 20, 5);
  if (rl) return rl;
  const body = await readJson(req);
  const current = str(body?.current, 300);
  const next = str(body?.password, 300);
  const problem = passwordProblem(next);
  if (problem) return json({ error: "validation", fields: { password: problem } }, 400);
  const row = await db.client.findUnique({ where: { id: me.id }, select: { passwordHash: true } });
  if (row?.passwordHash && !(await verifyPassword(current, row.passwordHash))) {
    return json({ error: "validation", fields: { current: "wrong" } }, 400);
  }
  await db.client.update({ where: { id: me.id }, data: { passwordHash: await hashPassword(next) } });
  await revokeAllSessions(me.id);
  await createSession(me.id);
  return json({ ok: true });
}
