import { type JsonWebKey, createHash, createPublicKey, randomBytes, timingSafeEqual, verify as verifySig } from "node:crypto";

/** Google OAuth 2.0 / OpenID Connect (authorization code + PKCE + state + nonce), no SDK. */
export const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
export const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
export const GOOGLE_JWKS_URL = "https://www.googleapis.com/oauth2/v3/certs";
const ISSUERS = ["https://accounts.google.com", "accounts.google.com"];

export const googleConfigured = (env: NodeJS.ProcessEnv = process.env) => Boolean(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET);

const rand = () => randomBytes(32).toString("base64url");

export function pkcePair(verifier = rand()) {
  return { verifier, challenge: createHash("sha256").update(verifier).digest("base64url") };
}

export interface OAuthState {
  state: string;
  nonce: string;
  verifier: string;
  next: string;
}

export function newOAuthState(next: string): OAuthState {
  return { state: rand(), nonce: rand(), verifier: rand(), next };
}

export const encodeOAuthState = (s: OAuthState) => Buffer.from(JSON.stringify(s)).toString("base64url");

export function decodeOAuthState(raw: string | undefined): OAuthState | null {
  if (!raw) return null;
  try {
    const v = JSON.parse(Buffer.from(raw, "base64url").toString("utf8")) as OAuthState;
    return [v.state, v.nonce, v.verifier, v.next].every((x) => typeof x === "string" && x) ? v : null;
  } catch {
    return null;
  }
}

export function stateMatches(expected: string, given: string | null): boolean {
  if (!given) return false;
  const a = Buffer.from(expected);
  const b = Buffer.from(given);
  return a.length === b.length && timingSafeEqual(a, b);
}

export function googleAuthUrl(o: { clientId: string; redirectUri: string; state: OAuthState }): string {
  const q = new URLSearchParams({
    client_id: o.clientId,
    redirect_uri: o.redirectUri,
    response_type: "code",
    scope: "openid email profile",
    state: o.state.state,
    nonce: o.state.nonce,
    code_challenge: pkcePair(o.state.verifier).challenge,
    code_challenge_method: "S256",
    prompt: "select_account",
  });
  return `${GOOGLE_AUTH_URL}?${q}`;
}

export interface GoogleIdentity {
  sub: string;
  email: string;
  emailVerified: boolean;
  name: string;
  picture: string | null;
}

export type Jwk = JsonWebKey & { kid?: string };

/** Verifies an RS256 id_token against Google's JWKS plus issuer, audience, expiry and nonce. */
export function verifyIdToken(idToken: string, keys: Jwk[], o: { audience: string; nonce: string; now?: number }): GoogleIdentity | null {
  const parts = idToken.split(".");
  if (parts.length !== 3) return null;
  try {
    const header = JSON.parse(Buffer.from(parts[0], "base64url").toString("utf8")) as { alg?: string; kid?: string };
    if (header.alg !== "RS256") return null;
    const jwk = keys.find((k) => k.kid === header.kid);
    if (!jwk) return null;
    const ok = verifySig(
      "RSA-SHA256",
      Buffer.from(`${parts[0]}.${parts[1]}`),
      createPublicKey({ key: jwk, format: "jwk" }),
      Buffer.from(parts[2], "base64url"),
    );
    if (!ok) return null;
    const c = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8")) as Record<string, unknown>;
    const now = Math.floor((o.now ?? Date.now()) / 1000);
    const aud = Array.isArray(c.aud) ? c.aud : [c.aud];
    if (!ISSUERS.includes(String(c.iss)) || !aud.includes(o.audience)) return null;
    if (typeof c.exp !== "number" || c.exp + 60 < now) return null;
    if (c.nonce !== o.nonce || typeof c.sub !== "string" || typeof c.email !== "string") return null;
    return {
      sub: c.sub,
      email: c.email.toLowerCase(),
      emailVerified: c.email_verified === true || c.email_verified === "true",
      name: typeof c.name === "string" ? c.name : c.email.split("@")[0],
      picture: typeof c.picture === "string" ? c.picture : null,
    };
  } catch {
    return null;
  }
}
