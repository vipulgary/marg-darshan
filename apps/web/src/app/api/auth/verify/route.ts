import { db } from "@/lib/db";
import { consumeToken } from "@/lib/auth/emails";
import { csrfOk, json, limited, readJson, str } from "@/lib/auth/http";
import { createSession } from "@/lib/auth/session";

/** POST (not GET) so mail scanners that prefetch links can't burn the token. */
export async function POST(req: Request) {
  if (!csrfOk(req)) return json({ error: "forbidden" }, 403);
  const rl = limited(req, "verify", null, 30, 0);
  if (rl) return rl;
  const body = await readJson(req);
  const clientId = await consumeToken(str(body?.token, 100), "VERIFY_EMAIL").catch(() => null);
  if (!clientId) return json({ error: "invalid_token" }, 400);
  // Proving the email claims the Client row and every booking/kundali/enquiry already on it.
  await db.client.update({ where: { id: clientId }, data: { emailVerifiedAt: new Date() } });
  await createSession(clientId);
  return json({ ok: true });
}
