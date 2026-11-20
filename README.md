# Marg Darshan (मार्ग-दर्शन)

Bilingual (**Hindi default**, English toggle) Vedic astrology, Vastu and gemstone consulting website:
consultation booking with payments, free Kundali, Kundali Milan, Shubh Samay, Birth Time Finder,
a gemstone shop (enquiry-only), customer accounts and an admin panel for the Jyotish.

| | |
|---|---|
| **Live (temporary address)** | https://lightcyan-goat-734410.hostingersite.com |
| **Repository** | `git@github.com:vipulgary/marg-darshan.git` (branch `main`) |
| **Handover guide (owner / operations)** | [docs/HANDOVER.md](docs/HANDOVER.md) |
| Architecture, data model, tickets | [Final Plan.md](Final%20Plan.md) |
| Design system ("Cosmic Saffron") | [design.md](design.md) |
| Progress tracker (generated) | [task.md](task.md) |

---

## 1. Architecture

```
Browser ──► Next.js 16 web app (apps/web) ── Hostinger "Node.js app" hosting
              │  pages, API routes, admin, accounts, booking, payments
              ├──► PostgreSQL ............ Supabase (Prisma 7, pg driver adapter)
              ├──► Email ................. Gmail SMTP (App Password) or Resend
              ├──► Google sign-in ........ Google OAuth 2.0 (PKCE)
              ├──► Payments .............. Razorpay            (keys not yet set)
              ├──► Video / calendar ...... Zoom, Cal.com       (keys not yet set)
              └──► Astro engine .......... apps/engine, Python FastAPI (NOT hosted yet)
                                          charts, doshas, yogas, panchang, muhurat, rectification
```

| Folder | What it is |
|---|---|
| `apps/web` | Next.js 16 (App Router) site + API routes + Prisma schema/migrations/seed |
| `apps/engine` | Python FastAPI astro engine (AGPL, Swiss Ephemeris). Needs a VPS/Docker host |
| `apps/voice` | Optional self-hosted Piper TTS for read-aloud |
| `infra/` | `docker-compose.yml` for Postgres, Redis, engine, worker, Listmonk |
| `scripts/` | i18n check, smoke test, task tracker, **Hostinger packager** |

What works **without** the astro engine: every content page, booking + slot hold + double-booking
guard, accounts (sign-up, email verification, login, forgot/reset password, Google sign-in), shop
enquiries, newsletter sign-up, admin panel. What **needs** the engine: free Kundali, Kundali Milan,
Shubh Samay (muhurat), panchang, Birth Time Finder results.

---

## 2. Run locally

Requirements: **Node.js 22+** (24 tested), npm 10+. Python 3.11–3.13 only for the engine.

```bash
npm install
cp .env.example .env          # then fill at least DATABASE_URL (see §4)
npm run dev                   # http://localhost:3000 (Hindi) · /en (English)
```

Database tables (first time, or after pulling new migrations):

```bash
cd apps/web
npx prisma migrate deploy     # apply migrations
npx prisma db seed            # services, problems, plans, products
```

Locally, with no email provider configured, every email (verification, reset, booking) is printed
to the dev-server console with its link. On `localhost` the login page also offers a **Demo login**.

Astro engine (optional locally; on Windows install *Microsoft C++ Build Tools* first, or use Docker):

```bash
cd apps/engine
python -m venv .venv
.venv/Scripts/pip install -r requirements.txt -r requirements-dev.txt   # bin/pip on Linux/macOS
python scripts/install_ephe.py
uvicorn app.main:app --reload --port 8000
```

---

## 3. Checks

```bash
npm run i18n:check                       # hi/en message keys match
npm run typecheck                        # generates Prisma client + route types, then tsc
npm run lint
cd apps/web && node --import tsx --test "src/**/*.test.ts"
node scripts/smoke.mjs <baseUrl>         # end-to-end smoke test (default http://localhost:3000)
```

GitHub Actions (`.github/workflows/ci.yml`) runs the web checks + build and the engine tests on
every push to `main`.

---

## 4. Configuration (environment variables)

All variables are documented in [`.env.example`](.env.example). Locally they live in the root `.env`;
on Hostinger they are set in **hPanel → Website → Environment variables**. Never commit real values.

| Variable | Needed for | Notes |
|---|---|---|
| `DATABASE_URL` | everything with data | Supabase **Session pooler** URI + `?sslmode=require&uselibpqcompat=true` |
| `NEXT_PUBLIC_SITE_URL` | links in emails, Google redirect | **Must equal the live address.** Baked in at build → redeploy after changing |
| `ADMIN_PASSWORD`, `JYOTISH_PASSWORD` | `/admin/login` | Password-only logins (admin = full, jyotish = bookings) |
| `ADMIN_SESSION_SECRET`, `MANAGE_LINK_SECRET`, `CRON_SECRET`, `ENGINE_KEY` | sessions, signed links, cron, engine | Long random strings |
| `SMTP_USER`, `SMTP_PASS` (`SMTP_HOST`, `SMTP_PORT`) | all emails | Gmail address + 16-char App Password; defaults `smtp.gmail.com:465`. Used first when set |
| `RESEND_API_KEY`, `EMAIL_FROM`, `EMAIL_REPLY_TO` | all emails (alternative) | Resend needs a verified **own domain** for `EMAIL_FROM` |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | "Continue with Google" | Button appears automatically when both are set |
| `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET` | online payments | Use `rzp_test_` keys until go-live |
| `ENGINE_URL` | Kundali, Milan, Shubh Samay, panchang | URL of the hosted `apps/engine` |
| `ZOOM_*`, `CALCOM_*` | meeting links, calendar | Optional |
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | WhatsApp buttons | Digits only, e.g. `9198XXXXXXXX` |
| `NEXT_PUBLIC_ENGINE_SOURCE_URL` | AGPL source link in footer | Set once the engine is public; link hidden until then |

---

## 5. Deploy to Hostinger

Hosting is Hostinger's managed **Node.js app** (website `lightcyan-goat-734410.hostingersite.com`).
Hostinger only detects Next.js when `next` is in the top-level `package.json`, so we upload a package
of `apps/web` alone:

```bash
git commit ...                           # only committed code is packaged
node scripts/package-hostinger.mjs       # → marg-darshan-web.tar.gz
```

Then in **hPanel → Website → Deployments → Redeploy → Upload files**, choose
`marg-darshan-web.tar.gz` and **Deploy**. *Redeploy without uploading re-uses the previous code.*

Build settings Hostinger should show: Framework **Next.js**, root `./`, Node **22.x**. The build
uses webpack and 2 workers on purpose (Turbopack and 64 parallel workers exceed shared-hosting
limits — see `apps/web/next.config.ts`).

Database changes: run `npx prisma migrate deploy` from `apps/web` with the production
`DATABASE_URL` in `.env` **before** uploading code that needs them.

---

## 6. Accounts & sign-in (how it works)

- **Sign up** `/signup` → verification email → link activates the account and signs in.
- **Log in** `/login`; unverified accounts get the link re-sent.
- **Forgot password** `/forgot-password` → 1-hour reset link; resetting logs out other sessions.
- **Google** `/api/auth/google/start` — needs the OAuth client's redirect URI
  `<NEXT_PUBLIC_SITE_URL>/api/auth/google/callback` and the consent screen **published**.
- Bookings/kundalis made as a guest attach to the account once that email is verified.
- **Admin** `/admin/login` — password only, separate from customer accounts.

---

## 7. Track progress

```bash
node scripts/set-task.mjs done AMX-031 AMX-032          # or doing / todo, optional --note "…"
node scripts/gen-tasks.mjs                              # regenerate task.md from tasks.json
```
