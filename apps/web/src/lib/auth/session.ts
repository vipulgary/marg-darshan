import { cookies, headers } from "next/headers";
import { db } from "@/lib/db";
import { SESSION_TTL_MS, expiresIn, hashToken, newToken } from "./tokens";

/** Customer sessions (separate from the /admin cookie): random token in an httpOnly cookie, SHA-256 in the DB. */
export const SESSION_COOKIE = "amx_session";

const cookieOptions = (maxAgeSec: number) => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: maxAgeSec,
});

export async function createSession(clientId: string): Promise<void> {
  const token = newToken();
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || null;
  await db.session.create({
    data: {
      clientId,
      tokenHash: hashToken(token),
      expiresAt: expiresIn(SESSION_TTL_MS),
      userAgent: h.get("user-agent")?.slice(0, 300) ?? null,
      ip: ip?.slice(0, 64) ?? null,
    },
  });
  (await cookies()).set(SESSION_COOKIE, token, cookieOptions(SESSION_TTL_MS / 1000));
}

const clientSelect = {
  id: true,
  fullName: true,
  email: true,
  whatsappPhone: true,
  preferredLang: true,
  emailVerifiedAt: true,
  avatarUrl: true,
  googleSub: true,
  passwordHash: true,
  createdAt: true,
} as const;

async function lookup() {
  if (!process.env.DATABASE_URL) return null;
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token || token.length > 100) return null;
  try {
    const session = await db.session.findUnique({ where: { tokenHash: hashToken(token) }, select: { id: true, expiresAt: true, client: { select: clientSelect } } });
    if (!session || session.expiresAt.getTime() <= Date.now()) return null;
    return session;
  } catch (e) {
    console.error("[auth] session lookup failed", e);
    return null;
  }
}

export interface CurrentClient {
  id: string;
  sessionId: string;
  fullName: string;
  email: string | null;
  whatsappPhone: string | null;
  preferredLang: "hi" | "en";
  emailVerified: boolean;
  avatarUrl: string | null;
  hasPassword: boolean;
  hasGoogle: boolean;
  createdAt: Date;
}

/** The logged-in customer for this request, or null. Never exposes the password hash. */
export async function getCurrentClient(): Promise<CurrentClient | null> {
  const s = await lookup();
  if (!s) return null;
  const { passwordHash, googleSub, emailVerifiedAt, ...c } = s.client;
  return { ...c, sessionId: s.id, emailVerified: Boolean(emailVerifiedAt), hasPassword: Boolean(passwordHash), hasGoogle: Boolean(googleSub) };
}

/** Ends this browser's session (DB row + cookie). */
export async function revokeCurrentSession(): Promise<void> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (token) await db.session.deleteMany({ where: { tokenHash: hashToken(token) } }).catch(() => undefined);
  store.set(SESSION_COOKIE, "", cookieOptions(0));
}

export async function revokeAllSessions(clientId: string): Promise<void> {
  await db.session.deleteMany({ where: { clientId } });
}
