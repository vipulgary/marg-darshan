import { signToken, verifyToken } from "@/lib/signed-token";

const DAY_SEC = 24 * 3600;

export const manageSecret = () => process.env.MANAGE_LINK_SECRET ?? "";

interface ManageClaims extends Record<string, unknown> {
  a: string;
  p: "manage";
}

/** Token valid until one day after the slot starts. */
export function manageToken(appointmentId: string, slotStart: Date, secret = manageSecret(), now = Date.now()): string {
  const ttl = Math.max(60, Math.floor((slotStart.getTime() - now) / 1000) + DAY_SEC);
  return signToken<ManageClaims>({ a: appointmentId, p: "manage" }, secret, ttl, now);
}

/** Appointment id from a valid manage token, else null. */
export function readManageToken(token: string | null | undefined, secret = manageSecret(), now = Date.now()): string | null {
  const claims = verifyToken<ManageClaims>(token, secret, now);
  return claims && claims.p === "manage" && typeof claims.a === "string" ? claims.a : null;
}

const site = () => (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");

/** Absolute reschedule/cancel link, or null when MANAGE_LINK_SECRET is not configured. */
export function manageUrl(appointmentId: string, locale: string, slotStart: Date, now = Date.now()): string | null {
  const secret = manageSecret();
  if (!secret) return null;
  return `${site()}${locale === "en" ? "/en" : ""}/manage/${manageToken(appointmentId, slotStart, secret, now)}`;
}
