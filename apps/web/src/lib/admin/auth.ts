import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { safeEqual, signToken, verifyToken } from "@/lib/signed-token";

/**
 * Admin auth (AMX-140) until Payload CMS auth lands: two shared passwords from env,
 * one per role, and an HMAC-signed httpOnly session cookie scoped to /admin.
 *   admin   — everything (payments, refunds, exports, settings)
 *   jyotish — bookings, client details, session notes
 */
export type AdminRole = "admin" | "jyotish";

const COOKIE = "amx_admin";
const TTL_SEC = 12 * 3600;

const secret = () => process.env.ADMIN_SESSION_SECRET ?? "";

export function roleForPassword(password: string, env: NodeJS.ProcessEnv = process.env): AdminRole | null {
  if (env.ADMIN_PASSWORD && safeEqual(password, env.ADMIN_PASSWORD)) return "admin";
  if (env.JYOTISH_PASSWORD && safeEqual(password, env.JYOTISH_PASSWORD)) return "jyotish";
  return null;
}

export const adminConfigured = () => Boolean(secret() && (process.env.ADMIN_PASSWORD || process.env.JYOTISH_PASSWORD));

export async function startSession(role: AdminRole) {
  const store = await cookies();
  store.set(COOKIE, signToken({ role }, secret(), TTL_SEC), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/admin",
    maxAge: TTL_SEC,
  });
}

export async function endSession() {
  (await cookies()).delete({ name: COOKIE, path: "/admin" });
}

export async function getSession(): Promise<{ role: AdminRole } | null> {
  const claims = verifyToken<{ role: AdminRole }>((await cookies()).get(COOKIE)?.value, secret());
  return claims && (claims.role === "admin" || claims.role === "jyotish") ? { role: claims.role } : null;
}

/** Use at the top of every admin page/action. `need: "admin"` blocks the jyotish role. */
export async function requireAdmin(need: AdminRole = "jyotish") {
  const session = await getSession();
  if (!session) redirect("/admin/login");
  if (need === "admin" && session.role !== "admin") redirect("/admin?denied=1");
  return session;
}
