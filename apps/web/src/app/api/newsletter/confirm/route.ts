import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Hindi is served at "/", English under "/en" (localePrefix "as-needed"). */
const newsletterPath = (locale: string) => (locale === "en" ? "/en/newsletter" : "/newsletter");

/** AMX-120 — double opt-in confirmation link: PENDING → ACTIVE, then back to the localized page. */
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const token = url.searchParams.get("token") ?? "";
  const fallbackLocale = req.cookies.get("NEXT_LOCALE")?.value === "en" ? "en" : "hi";
  const go = (locale: string, ok: boolean) =>
    NextResponse.redirect(new URL(`${newsletterPath(locale)}?confirmed=${ok ? "1" : "0"}`, url.origin), 303);

  if (!UUID.test(token)) return go(fallbackLocale, false);
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: "db_unavailable", message: "Database is not configured." }, { status: 503 });
  }

  try {
    const sub = await db.newsletterSub.findUnique({ where: { token } });
    // An old link must not silently re-subscribe someone who unsubscribed.
    if (!sub || sub.status === "UNSUBSCRIBED") return go(sub?.language ?? fallbackLocale, false);
    if (sub.status === "PENDING") await db.newsletterSub.update({ where: { id: sub.id }, data: { status: "ACTIVE" } });
    return go(sub.language, true);
  } catch (err) {
    console.error("[api/newsletter/confirm] failed", err);
    return NextResponse.json({ error: "server_error", message: "Could not confirm the subscription." }, { status: 500 });
  }
}
