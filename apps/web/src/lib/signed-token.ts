import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Compact HMAC-SHA256 signed tokens: base64url(json).base64url(sig).
 * Used for the admin session cookie and the client's reschedule/cancel links.
 */

type Claims = Record<string, unknown> & { exp: number };

const b64url = (buf: Buffer) => buf.toString("base64url");

function sign(data: string, secret: string) {
  return createHmac("sha256", secret).update(data).digest();
}

export function signToken<T extends Record<string, unknown>>(
  payload: T,
  secret: string,
  ttlSec: number,
  now = Date.now(),
): string {
  if (!secret) throw new Error("signing secret is not configured");
  const body = b64url(Buffer.from(JSON.stringify({ ...payload, exp: Math.floor(now / 1000) + ttlSec })));
  return `${body}.${b64url(sign(body, secret))}`;
}

export function verifyToken<T extends Record<string, unknown>>(
  token: string | undefined | null,
  secret: string,
  now = Date.now(),
): (T & Claims) | null {
  if (!token || !secret) return null;
  const dot = token.indexOf(".");
  if (dot <= 0 || dot !== token.lastIndexOf(".")) return null;
  const body = token.slice(0, dot);
  let given: Buffer;
  try {
    given = Buffer.from(token.slice(dot + 1), "base64url");
  } catch {
    return null;
  }
  const expected = sign(body, secret);
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return null;
  try {
    const claims = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as T & Claims;
    if (typeof claims.exp !== "number" || claims.exp * 1000 <= now) return null;
    return claims;
  } catch {
    return null;
  }
}

/** Constant-time string comparison for passwords / shared secrets. */
export function safeEqual(a: string, b: string): boolean {
  const ha = createHmac("sha256", "cmp").update(a).digest();
  const hb = createHmac("sha256", "cmp").update(b).digest();
  return timingSafeEqual(ha, hb) && a.length === b.length;
}
