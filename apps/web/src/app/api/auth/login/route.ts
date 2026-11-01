import { db } from "@/lib/db";
import { loginOutcome } from "@/lib/auth/claim";
import { sendVerifyEmail } from "@/lib/auth/emails";
import { csrfOk, json, limited, readJson, str } from "@/lib/auth/http";
import { verifyPassword } from "@/lib/auth/password";
import { createSession } from "@/lib/auth/session";
import { normalizeEmail } from "@/lib/auth/tokens";

export async function POST(req: Request) {
  if (!csrfOk(req)) return json({ error: "forbidden" }, 403);
  const body = await readJson(req);
  if (!body) return json({ error: "invalid_json" }, 400);
  const email = normalizeEmail(str(body.email));
  const password = str(body.password, 300);
  if (!email || !password) return json({ error: "invalid_credentials" }, 401);

  const rl = limited(req, "login", email, 20, 8);
  if (rl) return rl;

  try {
    const client = await db.client.findUnique({
      where: { email },
      select: { id: true, emailVerifiedAt: true, passwordHash: true, googleSub: true, preferredLang: true },
    });
    // verifyPassword runs a dummy hash for unknown accounts so timing doesn't leak existence.
    const ok = await verifyPassword(password, client?.passwordHash);
    const outcome = loginOutcome(client, ok);
    if (outcome === "invalid") return json({ error: "invalid_credentials" }, 401);
    if (outcome === "unverified") {
      await sendVerifyEmail({ id: client!.id, email }, client!.preferredLang);
      return json({ error: "unverified" }, 403);
    }
    await createSession(client!.id);
    return json({ ok: true });
  } catch (e) {
    console.error("[auth] login failed", e);
    return json({ error: "server_error" }, 500);
  }
}
