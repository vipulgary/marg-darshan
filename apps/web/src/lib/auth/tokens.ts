import { createHash, randomBytes } from "node:crypto";

/** 32 random bytes, base64url — session cookies and emailed links. */
export const newToken = () => randomBytes(32).toString("base64url");

/** Only this digest is stored, so a DB leak doesn't hand out live sessions or links. */
export const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");

export const SESSION_TTL_MS = 30 * 86_400_000;
export const VERIFY_TTL_MS = 24 * 3_600_000;
export const RESET_TTL_MS = 3_600_000;

export const expiresIn = (ms: number, now = Date.now()) => new Date(now + ms);

/** A stored token row is usable when unused and not yet expired. */
export function tokenUsable(row: { expiresAt: Date; usedAt: Date | null } | null, now = Date.now()): boolean {
  return Boolean(row && !row.usedAt && row.expiresAt.getTime() > now);
}

/** Post-login redirect target: same-site relative paths only (no //host, backslashes or newlines). */
export function safeNext(next: string | null | undefined, fallback = "/account"): string {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.includes("\\") || /[\r\n\t]/.test(next)) return fallback;
  return next.slice(0, 512);
}

export const normalizeEmail = (email: string) => email.trim().toLowerCase();
