import { cookies } from "next/headers";
import { siteUrl } from "@/lib/auth/http";
import { encodeOAuthState, googleAuthUrl, googleConfigured, newOAuthState } from "@/lib/auth/oauth";
import { safeNext } from "@/lib/auth/tokens";
import { clientIp, rateLimit } from "@/lib/rate-limit";

const OAUTH_COOKIE = "amx_oauth";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const locale = url.searchParams.get("locale") === "en" ? "en" : "hi";
  const prefix = locale === "en" ? "/en" : "";
  if (!googleConfigured()) return Response.redirect(`${siteUrl()}${prefix}/login?error=google_unavailable`, 303);
  if (!rateLimit(`auth:google:${clientIp(req)}`, 30, 15 * 60_000).ok) return Response.redirect(`${siteUrl()}${prefix}/login?error=rate_limited`, 303);

  const state = newOAuthState(`${locale}|${safeNext(url.searchParams.get("next"))}`);
  (await cookies()).set(OAUTH_COOKIE, encodeOAuthState(state), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax", // must survive the top-level redirect back from Google
    path: "/api/auth/google",
    maxAge: 600,
  });
  const target = googleAuthUrl({ clientId: process.env.GOOGLE_CLIENT_ID!, redirectUri: `${siteUrl()}/api/auth/google/callback`, state });
  return new Response(null, { status: 303, headers: { Location: target, "Cache-Control": "no-store" } });
}
