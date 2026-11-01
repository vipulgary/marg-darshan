import { db } from "@/lib/db";
import { sendResetEmail } from "@/lib/auth/emails";
import { EMAIL_RE, csrfOk, json, limited, readJson, str } from "@/lib/auth/http";
import { normalizeEmail } from "@/lib/auth/tokens";

/** Same answer whether or not the email has an account. */
export async function POST(req: Request) {
  if (!csrfOk(req)) return json({ error: "forbidden" }, 403);
  const body = await readJson(req);
  const email = normalizeEmail(str(body?.email));
  if (!EMAIL_RE.test(email)) return json({ error: "validation", fields: { email: "invalid" } }, 400);
  const rl = limited(req, "forgot", email, 10, 3, 60 * 60_000);
  if (rl) return rl;
  try {
    const client = await db.client.findUnique({ where: { email }, select: { id: true, preferredLang: true } });
    if (client) await sendResetEmail({ id: client.id, email }, body?.locale === "en" ? "en" : client.preferredLang);
  } catch (e) {
    console.error("[auth] forgot failed", e);
  }
  return json({ ok: true });
}
