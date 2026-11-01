import { clientIp, rateLimit } from "@/lib/rate-limit";

/** JSON helpers + CSRF guard for the customer auth/account route handlers. */
export const json = (body: unknown, status = 200, extra?: Record<string, string>) =>
  Response.json(body, { status, headers: { "Cache-Control": "no-store", ...extra } });

/**
 * State-changing endpoints accept only JSON (a cross-site form can't send it without a CORS
 * preflight) and, when the browser sends an Origin, it must be this site. Together with the
 * SameSite=Lax cookie this blocks CSRF.
 */
export function csrfOk(req: Request): boolean {
  if (!(req.headers.get("content-type") ?? "").toLowerCase().startsWith("application/json")) return false;
  const origin = req.headers.get("origin");
  if (!origin) return true;
  try {
    const o = new URL(origin);
    const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
    const site = process.env.NEXT_PUBLIC_SITE_URL ? new URL(process.env.NEXT_PUBLIC_SITE_URL).host : null;
    return o.host === host || o.host === site;
  } catch {
    return false;
  }
}

export async function readJson(req: Request): Promise<Record<string, unknown> | null> {
  try {
    const v = await req.json();
    return v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

/** Per-IP and per-email limits; returns a 429 response when either is exceeded. */
export function limited(req: Request, action: string, email: string | null, perIp: number, perEmail: number, windowMs = 15 * 60_000): Response | null {
  const checks = [rateLimit(`auth:${action}:ip:${clientIp(req)}`, perIp, windowMs)];
  if (email) checks.push(rateLimit(`auth:${action}:email:${email}`, perEmail, windowMs));
  const hit = checks.find((c) => !c.ok);
  return hit ? json({ error: "rate_limited", retryAfterSec: hit.retryAfterSec }, 429, { "Retry-After": String(hit.retryAfterSec) }) : null;
}

export const str = (v: unknown, max = 320) => (typeof v === "string" ? v.slice(0, max) : "");

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const siteUrl = () => (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");

export const localePrefix = (locale: string) => (locale === "en" ? "/en" : "");
