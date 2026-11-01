import { db } from "@/lib/db";
import { decideSignup } from "@/lib/auth/claim";
import { sendResetEmail, sendVerifyEmail } from "@/lib/auth/emails";
import { EMAIL_RE, csrfOk, json, limited, readJson, str } from "@/lib/auth/http";
import { hashPassword, passwordProblem } from "@/lib/auth/password";
import { normalizeEmail } from "@/lib/auth/tokens";

/**
 * Always answers {ok:true} for a well-formed request so the form can't be used to probe which
 * emails have accounts; what actually happens is told to the mailbox owner.
 */
export async function POST(req: Request) {
  if (!csrfOk(req)) return json({ error: "forbidden" }, 403);
  const body = await readJson(req);
  if (!body) return json({ error: "invalid_json" }, 400);
  const name = str(body.name, 80).trim();
  const email = normalizeEmail(str(body.email));
  const password = str(body.password, 300);
  const lang = body.locale === "en" ? "en" : "hi";

  const fields: Record<string, string> = {};
  if (name.length < 2) fields.name = "required";
  if (!EMAIL_RE.test(email)) fields.email = "invalid";
  const pw = passwordProblem(password);
  if (pw) fields.password = pw;
  if (Object.keys(fields).length) return json({ error: "validation", fields }, 400);

  const rl = limited(req, "signup", email, 10, 3, 60 * 60_000);
  if (rl) return rl;

  try {
    const existing = await db.client.findUnique({
      where: { email },
      select: { id: true, emailVerifiedAt: true, passwordHash: true, googleSub: true },
    });
    const decision = decideSignup(existing);
    if (decision.kind === "notify_existing") {
      await sendResetEmail({ id: decision.clientId, email }, lang, "exists");
    } else {
      const passwordHash = await hashPassword(password);
      const client =
        decision.kind === "create"
          ? await db.client.create({ data: { fullName: name, email, preferredLang: lang, passwordHash }, select: { id: true } })
          : await db.client.update({ where: { id: decision.clientId }, data: { fullName: name, passwordHash, preferredLang: lang }, select: { id: true } });
      await sendVerifyEmail({ id: client.id, email }, lang);
    }
    return json({ ok: true });
  } catch (e) {
    console.error("[auth] signup failed", e);
    return json({ error: "server_error" }, 500);
  }
}
