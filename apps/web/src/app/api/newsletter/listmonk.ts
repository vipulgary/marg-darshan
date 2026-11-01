/**
 * Minimal Listmonk REST client (AMX-120). Listmonk sends the double-opt-in email itself
 * (its opt-in template is where the Hindi confirmation copy lives) when the target lists are
 * double-opt-in and preconfirm_subscriptions is false.
 *
 * Env: LISTMONK_URL, LISTMONK_LIST_IDS ("3,4"), and either LISTMONK_API_USER + LISTMONK_API_TOKEN
 * (Listmonk ≥ v4 API users) or LISTMONK_USERNAME + LISTMONK_PASSWORD (older basic auth).
 */
export interface ListmonkConfig {
  url: string;
  authorization: string;
  lists: number[];
}

export function listmonkConfig(): ListmonkConfig | null {
  const url = process.env.LISTMONK_URL;
  if (!url) return null;
  let authorization: string | null = null;
  if (process.env.LISTMONK_API_USER && process.env.LISTMONK_API_TOKEN) {
    authorization = `token ${process.env.LISTMONK_API_USER}:${process.env.LISTMONK_API_TOKEN}`;
  } else if (process.env.LISTMONK_USERNAME && process.env.LISTMONK_PASSWORD) {
    authorization = `Basic ${Buffer.from(`${process.env.LISTMONK_USERNAME}:${process.env.LISTMONK_PASSWORD}`).toString("base64")}`;
  }
  if (!authorization) return null;
  const lists = (process.env.LISTMONK_LIST_IDS ?? "")
    .split(",")
    .map((s) => Number(s.trim()))
    .filter((n) => Number.isInteger(n) && n > 0);
  return { url: url.replace(/\/+$/, ""), authorization, lists };
}

export async function listmonkSubscribe(
  cfg: ListmonkConfig,
  sub: { email: string; language: string; whatsapp?: string | null },
): Promise<void> {
  const res = await fetch(`${cfg.url}/api/subscribers`, {
    method: "POST",
    headers: { Authorization: cfg.authorization, "Content-Type": "application/json" },
    body: JSON.stringify({
      email: sub.email,
      name: sub.email.split("@")[0],
      status: "enabled",
      lists: cfg.lists,
      preconfirm_subscriptions: false,
      attribs: { language: sub.language, whatsapp: sub.whatsapp ?? null, source: "website" },
    }),
    signal: AbortSignal.timeout(8000),
  });
  // 409 = already a Listmonk subscriber; their opt-in state is managed there.
  if (res.ok || res.status === 409) return;
  const text = await res.text().catch(() => "");
  throw new Error(`Listmonk ${res.status}: ${text.slice(0, 300)}`);
}
