import { csrfOk, json } from "@/lib/auth/http";
import { getCurrentClient, revokeAllSessions, revokeCurrentSession } from "@/lib/auth/session";

/** "Sign out everywhere": deletes every session of this client, including this one. */
export async function DELETE(req: Request) {
  if (!csrfOk(req)) return json({ error: "forbidden" }, 403);
  const me = await getCurrentClient();
  if (!me) return json({ error: "unauthorized" }, 401);
  await revokeAllSessions(me.id);
  await revokeCurrentSession();
  return json({ ok: true });
}
