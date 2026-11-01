import { db } from "@/lib/db";
import { consumeToken } from "@/lib/auth/emails";
import { csrfOk, json, limited, readJson, str } from "@/lib/auth/http";
import { hashPassword, passwordProblem } from "@/lib/auth/password";
import { createSession, revokeAllSessions } from "@/lib/auth/session";

export async function POST(req: Request) {
  if (!csrfOk(req)) return json({ error: "forbidden" }, 403);
  const rl = limited(req, "reset", null, 20, 0);
  if (rl) return rl;
  const body = await readJson(req);
  const password = str(body?.password, 300);
  const problem = passwordProblem(password);
  if (problem) return json({ error: "validation", fields: { password: problem } }, 400);
  const clientId = await consumeToken(str(body?.token, 100), "RESET_PASSWORD").catch(() => null);
  if (!clientId) return json({ error: "invalid_token" }, 400);
  // The reset link proves the mailbox, so it also verifies the email; old sessions are logged out.
  await db.client.update({ where: { id: clientId }, data: { passwordHash: await hashPassword(password), emailVerifiedAt: new Date() } });
  await revokeAllSessions(clientId);
  await createSession(clientId);
  return json({ ok: true });
}
