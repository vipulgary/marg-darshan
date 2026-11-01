import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { decideGoogle } from "@/lib/auth/claim";
import { siteUrl } from "@/lib/auth/http";
import { GOOGLE_JWKS_URL, GOOGLE_TOKEN_URL, type Jwk, decodeOAuthState, stateMatches, verifyIdToken } from "@/lib/auth/oauth";
import { createSession } from "@/lib/auth/session";
import { safeNext } from "@/lib/auth/tokens";

const OAUTH_COOKIE = "amx_oauth";
const authSelect = { id: true, emailVerifiedAt: true, passwordHash: true, googleSub: true } as const;

let jwksCache: { keys: Jwk[]; at: number } | null = null;
async function googleKeys(): Promise<Jwk[]> {
  if (jwksCache && Date.now() - jwksCache.at < 3_600_000) return jwksCache.keys;
  const res = await fetch(GOOGLE_JWKS_URL, { cache: "no-store", signal: AbortSignal.timeout(10_000) });
  if (!res.ok) throw new Error(`jwks HTTP ${res.status}`);
  const { keys } = (await res.json()) as { keys: Jwk[] };
  jwksCache = { keys, at: Date.now() };
  return keys;
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const store = await cookies();
  const saved = decodeOAuthState(store.get(OAUTH_COOKIE)?.value);
  store.set(OAUTH_COOKIE, "", { path: "/api/auth/google", maxAge: 0 });
  const [locale, nextRaw] = (saved?.next ?? "hi|/account").split("|");
  const prefix = locale === "en" ? "/en" : "";
  const fail = (code: string) => Response.redirect(`${siteUrl()}${prefix}/login?error=${code}`, 303);

  if (!saved || !stateMatches(saved.state, url.searchParams.get("state"))) return fail("google_state");
  const code = url.searchParams.get("code");
  if (!code) return fail("google_cancelled");

  try {
    const res = await fetch(GOOGLE_TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID ?? "",
        client_secret: process.env.GOOGLE_CLIENT_SECRET ?? "",
        redirect_uri: `${siteUrl()}/api/auth/google/callback`,
        grant_type: "authorization_code",
        code_verifier: saved.verifier,
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });
    const tokens = (await res.json().catch(() => null)) as { id_token?: string } | null;
    if (!res.ok || !tokens?.id_token) return fail("google_failed");

    const identity = verifyIdToken(tokens.id_token, await googleKeys(), { audience: process.env.GOOGLE_CLIENT_ID ?? "", nonce: saved.nonce });
    if (!identity) return fail("google_failed");

    const [bySub, byEmail] = await Promise.all([
      db.client.findUnique({ where: { googleSub: identity.sub }, select: authSelect }),
      db.client.findUnique({ where: { email: identity.email }, select: authSelect }),
    ]);
    const decision = decideGoogle(identity, bySub, byEmail);
    let clientId: string;
    if (decision.kind === "reject") return fail(`google_${decision.reason}`);
    if (decision.kind === "login") {
      clientId = decision.clientId;
    } else if (decision.kind === "link") {
      clientId = decision.clientId;
      await db.client.update({
        where: { id: clientId },
        data: {
          googleSub: identity.sub,
          emailVerifiedAt: new Date(),
          avatarUrl: identity.picture,
          ...(decision.dropPassword && { passwordHash: null }),
        },
      });
    } else {
      const created = await db.client.create({
        data: {
          fullName: identity.name.slice(0, 80),
          email: identity.email,
          googleSub: identity.sub,
          emailVerifiedAt: new Date(),
          avatarUrl: identity.picture,
          preferredLang: locale === "en" ? "en" : "hi",
        },
        select: { id: true },
      });
      clientId = created.id;
    }
    await createSession(clientId);
    const next = safeNext(nextRaw);
    return Response.redirect(`${siteUrl()}${prefix}${next === "/" && prefix ? "" : next}`, 303);
  } catch (e) {
    console.error("[auth] google callback failed", e);
    return fail("google_failed");
  }
}
