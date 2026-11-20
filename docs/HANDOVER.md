# Marg Darshan — Handover Guide

Status as of **19 Nov 2026**. For developer setup see the [README](../README.md).

## 1. What is delivered and live

Website: **https://lightcyan-goat-734410.hostingersite.com** (temporary Hostinger address —
connect your own domain before public launch, see §5).

| Area | Status on live site |
|---|---|
| All pages, Hindi + English, mobile-responsive (no sideways scroll at 320–414 px) | ✅ Working |
| Consultation booking: services, slots, slot hold, double-booking protection | ✅ Working |
| Customer accounts: sign-up, email verification, login, forgot / reset password | ✅ Working — emails go out via Gmail once the package from commit `e470ded` or later is uploaded |
| "Continue with Google" sign-in | ✅ Working |
| Customer dashboard (bookings, kundalis, payments, birth profiles) | ✅ Working |
| Gemstone shop (enquiry → WhatsApp) | ✅ Working |
| Newsletter sign-up | ✅ Saved (sending campaigns needs Listmonk, §4) |
| Admin panel (bookings, invoices, settings, exports) | ✅ Working |
| Online payment (Razorpay) | ⏳ Built — needs Razorpay keys |
| Free Kundali, Kundali Milan, Shubh Samay, Panchang, Birth Time Finder results | ⏳ Built — needs the astro engine hosted |
| Zoom links / Cal.com calendar sync | ⏳ Built — needs Zoom / Cal.com accounts |

Automated smoke test on the live site: **11 / 13 checks pass**; the 2 failures are the engine-based
features above.

## 2. Logins and where they are managed

| What | Where | Notes |
|---|---|---|
| Admin panel | `/admin/login` | Password only. Admin = `ADMIN_PASSWORD`, Jyotish = `JYOTISH_PASSWORD` (Hostinger env vars). **Change both before launch.** |
| Hosting | Hostinger hPanel → website `lightcyan-goat-734410` | Deployments, environment variables, runtime logs |
| Database | Supabase → project **Mag darshan** (Free plan, Sydney) | |
| Outgoing email | Gmail account set as `SMTP_USER` + App Password | Up to ~500 emails/day |
| Google sign-in | Google Cloud → project **Marg Darshan** → OAuth client | Consent screen must stay **Published** |
| Code | GitHub `vipulgary/marg-darshan` | |

Transfer each of these accounts (or invite the client as owner) at handover, then **rotate every
secret** that was shared during development: database password, Gmail App Password, Google client
secret, admin/jyotish passwords, `ADMIN_SESSION_SECRET`, `MANAGE_LINK_SECRET`, `CRON_SECRET`.

## 3. Day-to-day operations

- **Updating the site:** commit → `node scripts/package-hostinger.mjs` → hPanel → Deployments →
  Redeploy → **Upload files** → `marg-darshan-web.tar.gz` → Deploy. (Redeploy *without* uploading
  re-uses the previous code — only useful after changing environment variables.)
- **Changing a setting** (passwords, keys, site address): hPanel → Environment variables → edit →
  Redeploy. `NEXT_PUBLIC_*` values only take effect after a redeploy.
- **Errors:** hPanel → Runtime logs (or `hbuilds/current/nodejs/stderr.log` over SSH).
- **Supabase Free plan pauses the database after 7 days without traffic.** The site then shows
  errors on every login / booking until someone clicks **Resume project** in Supabase. Avoid this by
  upgrading Supabase to Pro (~US$25/month) or adding a daily keep-alive request (cron).

## 4. Pending before full public launch

Owner/client actions (accounts, keys, decisions):

1. **Own domain** (e.g. margdarshan.in) — connect in hPanel, then update `NEXT_PUBLIC_SITE_URL`,
   the Google OAuth origins/redirect URI, and redeploy.
2. **Razorpay** live keys + webhook secret (test with `rzp_test_` keys first).
3. **Astro engine hosting** — `apps/engine` needs a small VPS or Docker host (Hostinger shared
   hosting cannot run it). Then set `ENGINE_URL` / `ENGINE_KEY`, and publish the engine source
   (`NEXT_PUBLIC_ENGINE_SOURCE_URL`) as its AGPL licence requires.
4. **Zoom / Cal.com** accounts for automatic meeting links (or keep a fixed `DEFAULT_MEETING_URL`).
5. **WhatsApp number** (`NEXT_PUBLIC_WHATSAPP_NUMBER`), contact email, office map link.
6. **Content review** — pages contain `TODO(client)` / legal-review markers (prices, bios, policies).
7. **Business details for GST invoices** — `BUSINESS_NAME`, `BUSINESS_ADDRESS`, `BUSINESS_GSTIN`,
   `BUSINESS_STATE_CODE`.
8. **Device QA** on real phones (UPI payment flow, WhatsApp hand-off) once Razorpay is live.

Not started (optional / phase 2): Payload CMS for editing content without code, astrology accuracy
validation suite, WhatsApp Cloud API automation, Sentry error monitoring, Listmonk newsletter server.

## 5. Known limitations

- The live address is a temporary `hostingersite.com` subdomain; emails are sent from a Gmail
  address until a domain is verified with Resend.
- Database region is Sydney (`ap-southeast-2`); a Mumbai project would be faster for Indian users.
- GitHub CI: the web job passes; the engine job currently fails and needs a look when the engine is
  set up for hosting.
