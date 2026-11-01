import { csrfOk, json } from "@/lib/auth/http";
import { revokeCurrentSession } from "@/lib/auth/session";

export async function POST(req: Request) {
  if (!csrfOk(req)) return json({ error: "forbidden" }, 403);
  await revokeCurrentSession();
  return json({ ok: true });
}
