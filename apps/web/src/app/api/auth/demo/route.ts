import { db } from "@/lib/db";
import { csrfOk, json } from "@/lib/auth/http";
import { createSession } from "@/lib/auth/session";

/** Local-development demo login: signs into a fixed fictional account. Disabled outside dev/localhost. */
const DEMO = { email: "demo.client@example.com", fullName: "Demo Client" };
const LOCAL = /^(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/;

export async function POST(req: Request) {
  if (process.env.NODE_ENV !== "development" || !LOCAL.test(req.headers.get("host") ?? "")) return json({ error: "not_found" }, 404);
  if (!csrfOk(req)) return json({ error: "forbidden" }, 403);
  const client = await db.client.upsert({
    where: { email: DEMO.email },
    update: {},
    create: { ...DEMO, emailVerifiedAt: new Date() },
    select: { id: true },
  });
  await createSession(client.id);
  return json({ ok: true });
}
