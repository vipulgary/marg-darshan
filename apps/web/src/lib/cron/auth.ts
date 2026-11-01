import { timingSafeEqual } from "node:crypto";

function secretMatches(given: string | null | undefined, expected: string): boolean {
  if (!given) return false;
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

/** Accepts `x-cron-secret: <CRON_SECRET>` or Vercel Cron's `Authorization: Bearer <CRON_SECRET>`. */
export function isCronAuthorized(req: Request, secret: string): boolean {
  const bearer = req.headers.get("authorization")?.match(/^Bearer\s+(.+)$/i)?.[1];
  return secretMatches(req.headers.get("x-cron-secret"), secret) || secretMatches(bearer, secret);
}

/** null when the request may proceed, otherwise the error response to return. */
export function cronGuard(req: Request, opts: { needsDb?: boolean } = {}): Response | null {
  const secret = process.env.CRON_SECRET;
  if (!secret) return Response.json({ error: "not_configured", message: "CRON_SECRET is not set" }, { status: 503 });
  if (!isCronAuthorized(req, secret)) return Response.json({ error: "unauthorized" }, { status: 401 });
  if (opts.needsDb && !process.env.DATABASE_URL) {
    return Response.json({ error: "not_configured", message: "DATABASE_URL is not set" }, { status: 503 });
  }
  return null;
}
