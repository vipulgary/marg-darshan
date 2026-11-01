# Astromax — Final Plan, Tickets & Implementation Guide

> Merges **Research by CL.md** and **Research by AG (Bilingual Astrology Website Architecture.docx)** into one plan. Where the two differed, the decision used is listed in §1.
> Use with **design.md** (UI system). Ticket IDs: `AMX-###`. Estimates are in ideal dev-days (d).

---

## 1. Final Decisions (Merged)

| Topic | Final Decision | Source / Reason |
|---|---|---|
| Frontend | Next.js 15 (App Router, TS), Tailwind, shadcn/ui, Framer Motion | Both |
| i18n | `next-intl`; `hi` default at `/`, `en` at `/en`; header toggle `[ अ हिंदी | A English ]`; switching keeps half-filled form state (form state lives in a Zustand store and is saved to sessionStorage) | AG (no lost form data) + CL (hreflang SEO) |
| Backend app API | Next.js Route Handlers / Server Actions for web logic (booking, payments, enquiries) | CL |
| Astro engine | **Python 3.11 FastAPI microservice** (Docker) | Both |
| Calculation libs | **PyJHora** (yogas, doshas, dashas, matching, Lahiri via `drik.set_ayanamsa_mode('LAHIRI')`) + **jyotishyamitra** (D1–D60 JSON, Balas, Ashtakavarga) on **pyswisseph** | AG |
| Chart SVG | **jyotichart** (North + South). Do **not** use the VedAstro North chart: it places planets in the wrong houses (bug #159) | AG |
| Rectification | `ephem` + PyJHora time-window scan; VedAstro Docker Birth Time Finder optional | AG |
| Panchang/newsletter data | `jyotisha` + `adyatithi` (MIT) | AG |
| Geo / TZ | `geopy` (Nominatim) + `timezonefinder` + `pytz`/`zoneinfo`; manual lat/long edit allowed | Both |
| Jobs | **Celery + Redis** (Python side: kundli, PDF, scans, newsletter); emails sent from the worker | AG |
| DB | PostgreSQL. The web app uses Prisma and owns the schema; Python reads and writes `horoscopes` through SQLAlchemy, mapped to the same tables | Merged |
| CMS | Payload CMS (bilingual fields: profile, services, shop, FAQ, testimonials) | CL |
| Scheduling | **Self-hosted Cal.com** (primary); Calendly as fallback adapter | Both |
| Video | Zoom Server-to-Server OAuth; Cal.com Zoom app or direct API | Both |
| Payments | **Razorpay** (UPI intent/GPay, UPI QR, Net Banking, cards). Plans: Full upfront / Split (50% advance + balance link) | CL gateway + AG plans |
| WhatsApp | Phase 1: `wa.me` deep links with context. Phase 2: WhatsApp Cloud API template messages | Both |
| Email | Resend (transactional) + Listmonk (newsletter, self-hosted) | CL |
| Storage | Cloudflare R2 (SVG, PDF, Vastu floor plans), signed URLs | CL |
| Licensing | AGPL (PyJHora, pyswisseph) → astro-engine repo kept **separate and public**, or buy a Swiss Ephemeris commercial licence later. MIT fallback: Skyfield + custom Lahiri | AG |
| Hosting | Vercel (web) · Railway/VPS Docker (engine, worker, Redis, Cal.com, Listmonk) · Neon/Supabase Postgres | CL |

### Architecture
```
 [Browser hi/en] ─► Next.js (Vercel) ── Prisma ──► PostgreSQL ◄── SQLAlchemy ── FastAPI Astro Engine (Docker)
        │              │  ├─ Payload CMS                                      │  PyJHora · jyotishyamitra
        │              │  ├─ Razorpay (orders + webhook)                      │  jyotichart · ephem · geopy
        │              │  ├─ Cal.com API + webhook ─► Zoom                    │  jyotisha · adyatithi
        │              │  └─ R2 storage                                       └─ Celery worker + Redis
        └─ wa.me ──► WhatsApp                     Resend (email) · Listmonk (newsletter) · Plausible (analytics)
```

---

## 2. Sitemap (both locales)

| Route | HI title | EN title |
|---|---|---|
| `/` | होम | Home |
| `/about-jyotish` | ज्योतिषाचार्य परिचय | About the Jyotish |
| `/services/astrology` | ज्योतिष परामर्श | Astrology Consulting |
| `/services/vastu` | वास्तु शास्त्र परामर्श | Vastu Consulting |
| `/services/gems` | रत्न परामर्श | Gemstone Consulting |
| `/birth-time-finder` | जन्म समय नहीं पता? | Birth Time Finder |
| `/free-kundali` + `/kundali/[id]` | ऑनलाइन कुंडली बनाएं | Free Kundali |
| `/book-appointment` | अपॉइंटमेंट बुक करें | Book Consultation |
| `/payment/[bookingId]` + `/payment/success` | सुरक्षित भुगतान | Secure Payment |
| `/pricing` | शुल्क एवं प्लान | Plans & Pricing |
| `/shop`, `/shop/[slug]` | रत्न एवं वास्तु शॉप | Enquiry Shop |
| `/newsletter` | हिंदी न्यूज़लेटर और पंचांग | Newsletter & Panchang |
| `/contact`, `/faq`, `/privacy`, `/terms`, `/refund-policy` | — | — (the policy pages are required for Razorpay KYC) |
| `/admin/*` | Admin (EN only) | |

---

## 3. Data Model (final)

```
clients(id, full_name, email, whatsapp_phone, preferred_lang, created_at)
birth_profiles(id, client_id, dob?, tob?, is_time_unknown, is_date_unknown, approx_window_start?, approx_window_end?,
               place_name, latitude, longitude, tz_name, tz_offset, life_events_json, prashna_ts?, prashna_lat?, prashna_lng?)
horoscopes(id, birth_profile_id, ayanamsa, d1_d60_json, yogas_doshas_json, dasha_json, north_svg_url, south_svg_url,
           pdf_url, lang, status[QUEUED|DONE|FAILED], emailed_at)
rectification_scans(id, birth_profile_id, candidates_json, status, created_at)
problems(id, slug, title_hi, title_en, icon, service_type, default_duration, sort)
services(id, slug, service_type[JYOTISH|VASTU|GEMS|RECTIFICATION], modes[], durations[], base_price_inr, split_allowed)
plans(id, service_id, name_hi, name_en, price_inr, sessions, plan_type[FULL_UPFRONT|SPLIT_PLAN], advance_pct)
appointments(id, client_id, birth_profile_id?, problem_id, problem_description, service_id, visit_mode[ONLINE_ZOOM|PERSONAL_VISIT],
             duration_mins, slot_start, slot_end, cal_booking_uid, zoom_url, vastu_property_json, vastu_map_url,
             status[DRAFT|HELD|PENDING_PAYMENT|CONFIRMED|PARTIALLY_PAID|COMPLETED|CANCELLED|EXPIRED|NO_SHOW|REFUNDED], hold_expires_at)
payments(id, appointment_id, plan_type, installment_no, total_inr, amount_inr, balance_due_inr, channel, razorpay_order_id,
         razorpay_payment_id, razorpay_link_id, status[CREATED|CAPTURED|FAILED|REFUNDED], raw_webhook_json)
products(id, slug, sku, category[GEM|RUDRAKSHA|YANTRA|VASTU], title_hi, title_en, desc_hi, desc_en, images[], price_hint, active)
shop_enquiries(id, client_id?, product_id, customer_note, problem_id?, whatsapp_redirected, created_at)
newsletter_subs(id, email, whatsapp_phone?, language, status[PENDING|ACTIVE|UNSUBSCRIBED], token, created_at)
notification_log(id, channel[EMAIL|WHATSAPP], template, to, entity_id, status, created_at)
webhook_events(id, provider, event_id UNIQUE, payload, processed_at)   -- idempotency
```
Constraint: a partial unique index on `(slot_start, visit_mode_resource)` for status ∈ {HELD, PENDING_PAYMENT, CONFIRMED} prevents double booking.

---

## 4. Core Business Logic

### 4.1 Booking funnel (`/book-appointment`, 5 steps)
1. **Problem**: card grid (Career, Marriage/Matching, Health, Finance, Education, Santaan, Vastu Residential/Commercial/Industrial, Gemstone, Dosha remedy, Birth time unknown, Other). Selecting one picks the `service_type`.
2. **Mode & duration**: Online Zoom / Personal Visit; 30 / 60 / 90 / 120 min, limited to what the service allows.
3. **Contextual intake**:
   - Jyotish/Gems → birth details (date, time, place autocomplete) and an optional question.
   - Vastu → property address (geocoded), type (home/office/factory/plot), facing, floor plan upload (PDF/JPG ≤ 10 MB).
   - "Don't know birth time/date" → rectification questionnaire (§4.3).
4. **Slot**: loads the matching Cal.com event type and shows hourly slots in IST (plus the user's local time if different). Choosing a slot creates `appointment HELD` with a 10-minute hold.
5. **Pay**: plan selector (Full / Split if `split_allowed`) → Razorpay checkout.

**State machine**
```
DRAFT → HELD(10m) → PENDING_PAYMENT ─(webhook payment.captured)→ CONFIRMED ─→ COMPLETED
          │                 └─(split: advance captured)→ PARTIALLY_PAID ─(balance captured)→ CONFIRMED
          └─(timeout)→ EXPIRED                 CONFIRMED → CANCELLED / REFUNDED / NO_SHOW
```
Rules:
- The status changes only on a **server webhook** with a verified signature. The client redirect only shows a "checking…" screen and polls.
- Webhooks are idempotent through `webhook_events.event_id`.
- On CONFIRMED:
  1. Create the Cal.com booking. Cal.com creates the Zoom link for online sessions; visits get the office address and a map link instead.
  2. Send email (.ics attached) and WhatsApp.
  3. Send the Jyotish a pre-read containing the kundli PDF or the rectification dossier.
  4. Schedule reminders at T-24h and T-1h.
- Split plan: the advance confirms the slot. The balance payment link is sent automatically N days before report delivery or the site visit (admin sets N).
- Cancellation policy (admin-configurable): more than 24h before the session → reschedule free; less than 24h → no refund.

### 4.2 Free Kundali
1. Form: name, gender, DOB, TOB, birthplace (autocomplete → `/geo/resolve`), email, WhatsApp (optional), language, chart style (North default for hi).
2. `POST /api/kundali` creates `birth_profile` and `horoscope QUEUED`, enqueues a Celery task, and returns `id`. The UI redirects to `/kundali/[id]` and polls every 2s (skeleton + zodiac loader).
3. Worker steps:
   1. Set ayanamsa LAHIRI.
   2. Run jyotishyamitra in a **process pool**, because the library keeps global state.
   3. PyJHora: yogas, doshas, Vimshottari dasha.
   4. jyotichart: North and South SVGs (Devanagari planet labels for hi).
   5. Render the HTML template and convert it to PDF with WeasyPrint (Noto Sans Devanagari).
   6. Upload to R2, mark DONE, send the email with the PDF attached.
4. Result page: summary chips (Lagna, Rashi, Nakshatra), chart toggle, planet table, current dasha, dosha badges, and CTA "विस्तृत परामर्श बुक करें".
5. Cache: the same normalised input returns the existing horoscope.
6. Rate limit: 5 kundalis per IP per hour; Turnstile captcha on the form.

### 4.3 Birth-time rectification
- **Date known, time unknown**: approximate window (or full 24h) plus 4–6 dated life events. The worker scans the window in 1-minute steps, records Lagna and D9 sign changes, and builds candidate windows. For each candidate it checks the running dasha (PyJHora `get_running_dhasa_for_given_date`) against the event dates, scores the match, and returns the top 3 candidates for the Jyotish to review. It is **never shown to the client as a final answer**.
- **Date also unknown**: store the Prashna timestamp and location at submission. The case can only be booked as a consultation.
- The output is a dossier PDF sent to the Jyotish. The client sees "हमारे ज्योतिषाचार्य आपसे संपर्क करेंगे" ("our Jyotish will contact you") and a booking CTA.

### 4.4 Language
- `middleware.ts` (next-intl): `/` → hi, `/en/*` → en. The cookie `NEXT_LOCALE` remembers the choice. Auto-redirect from browser language is **off**, so Hindi stays the default.
- The toggle uses `router.replace(pathname, {locale})`. Form data lives in a Zustand store persisted to sessionStorage, so switching language loses nothing.
- CMS content has `_hi` and `_en` fields. If the English field is missing, the Hindi text is shown.
- `lang` is passed to the engine (PDF/SVG labels) and to email/WhatsApp templates.

### 4.5 Shop (enquiry only)
Product card → "उपयुक्तता एवं मूल्य जानें" → modal (name, phone, note, optional problem) → save `shop_enquiry` → open `wa.me/<num>?text=<encoded hi/en template with title, SKU, problem>`. No cart and no checkout.

### 4.6 WhatsApp
A floating button on every page except payment. The prefilled message depends on the page and language (e.g. on `/services/vastu`: "नमस्ते, मुझे वास्तु परामर्श के बारे में जानकारी चाहिए").

### 4.7 Newsletter
Double opt-in (Listmonk). A Celery beat job runs weekly (Sunday 6 AM IST): jyotisha + adyatithi produce the week's tithi, nakshatra, festivals and muhurta. These fill a Hindi template that the admin reviews before the campaign is sent through Listmonk. Each issue is archived at `/newsletter`.

---

## 5. Astro Engine API Contract (FastAPI, `/api/v1`)

| Method | Path | Body / Query | Returns |
|---|---|---|---|
| GET | `/geo/search?q=` | city text | `[{place_name, lat, lng, tz_name}]` (top 8, cached) |
| POST | `/geo/resolve` | `{place}` or `{lat,lng}` | `{place_name, lat, lng, tz_name, tz_offset_at(dob)}` |
| POST | `/horoscope/create` | birth data + `lang` + `chart_style` | `{job_id}` |
| GET | `/horoscope/{id}` | — | status + chart JSON + SVG/PDF URLs |
| POST | `/horoscope/rectify-scan` | window + life events | `{job_id}` → candidates |
| POST | `/match` | two birth data | Ashtakoot score + doshas (phase 2) |
| GET | `/panchang?date&lat&lng` | — | tithi, nakshatra, yoga, karana, sunrise/sunset |
| GET | `/health` | — | engine and ephemeris status |

Auth: shared HMAC header `X-Engine-Key` (server-to-server only; the engine is never public).

---

## 6. Tickets

Format: **ID — Title** · Est · Depends on · Acceptance criteria (AC).

### EPIC 0 — Project Setup & DevOps
- **AMX-001 — Monorepo scaffold** · 1d · —
  pnpm + Turborepo: `apps/web` (Next.js), `apps/engine` (FastAPI), `packages/ui`, `packages/config`. AC: `pnpm dev` runs web and engine; lint and format pass.
- **AMX-002 — CI/CD** · 1d · 001
  GitHub Actions: lint, typecheck, tests; Vercel preview per PR; engine Docker build pushed to the registry. AC: a PR shows a green check and a preview URL.
- **AMX-003 — Environments & secrets** · 0.5d · 001
  `.env.example`, dev/staging/prod; secrets for Razorpay test/live, Cal.com, Zoom, Resend, R2, engine key. AC: staging deploy works with test keys.
- **AMX-004 — Postgres + Prisma schema v1** · 1.5d · 001
  All tables in §3, migrations, seed (problems, services, plans, sample products). AC: `prisma migrate` and seed run; the double-booking index exists.
- **AMX-005 — Infra: Redis, R2, Docker Compose** · 1d · 001
  Local compose with Postgres, Redis, engine, worker, Cal.com, Listmonk. AC: `docker compose up` starts everything.
- **AMX-006 — Observability** · 0.5d · 002
  Sentry (web + engine), Plausible, uptime check on `/health`. AC: test errors appear in Sentry.

### EPIC 1 — Design System & Layout (see design.md)
- **AMX-010 — Design tokens in Tailwind** · 1d · 001 · AC: colours, type, radius, shadow, and motion tokens exposed; dark/light themes.
- **AMX-011 — Fonts (Latin + Devanagari)** · 0.5d · 010 · AC: `next/font` subsets; Hindi line-height rules; no layout shift (CLS < 0.05).
- **AMX-012 — Core components** · 3d · 010
  Button (5 variants × all states), Input, Textarea, Select, Combobox, Checkbox, Radio, Switch, SelectableCard, Chip, Badge, Tabs, Stepper, Modal/Sheet, Toast, Skeleton, Tooltip. AC: Storybook covers every state; keyboard navigation and visible focus.
- **AMX-013 — Effects library** · 2d · 010
  PlasmaHero (OGL shader + static fallback), AuroraBackground, Starfield, ZodiacWheel, SpotlightCard, GradientBorder, Marquee, Reveal. AC: all respect `prefers-reduced-motion`; plasma is lazy-loaded; LCP unaffected.
- **AMX-014 — Layout shell** · 1.5d · 012, 020
  Sticky header (glass on scroll), nav with active state, mobile sheet menu, footer, sticky mobile CTA bar, floating WhatsApp. AC: 360–1440px responsive.

### EPIC 2 — Bilingual (i18n)
- **AMX-020 — next-intl setup** · 1d · 001 · AC: `/` serves Hindi, `/en` serves English; `<html lang>` correct; hreflang + canonical tags.
- **AMX-021 — Language toggle** · 1d · 020, 012 · AC: visible in the header at every breakpoint; switching keeps route and form data; cookie remembers the choice.
- **AMX-022 — Message catalogs + glossary** · 2d · 020 · AC: every UI string in `hi.json`/`en.json`; Jyotish glossary (Lagna/Ascendant, etc.); a CI check fails if a key is missing.
- **AMX-023 — Localized formats** · 0.5d · 020 · AC: dates (`३१ अक्टूबर` optional), INR ₹ format, IST time display.

### EPIC 3 — CMS & Content Pages
- **AMX-030 — Payload CMS setup** · 2d · 004 · Collections: Pages, Services, Problems, Plans, Products, Testimonials, FAQs, JyotishProfile, Settings (WhatsApp number, office address, policies). AC: admin can edit hi/en fields.
- **AMX-031 — Home page** · 3d · 013, 014, 030 · Sections follow design.md §12. AC: Lighthouse ≥ 90 on mobile.
- **AMX-032 — About Jyotish page** · 1.5d · 030 · AC: bio, lineage, credentials, timeline, media, video, CTA.
- **AMX-033 — Service: Astrology (online + visit)** · 1d · 030 · AC: online vs visit comparison; problem CTA deep-links into the booking funnel with the problem preselected.
- **AMX-034 — Service: Vastu** · 1d · 030 · AC: residential/commercial/industrial, process, split-plan info, CTA.
- **AMX-035 — Service: Gems** · 1d · 030 · AC: explanation, gem grid, CTA to booking and to the shop.
- **AMX-036 — Pricing page** · 1d · 030 · AC: plans from the CMS; featured card; full/split labels.
- **AMX-037 — Contact, FAQ, legal pages** · 1d · 030 · AC: privacy, terms, refund and cancellation policy published (needed for Razorpay KYC).
- **AMX-038 — SEO** · 1d · 031 · AC: metadata per locale, sitemap.xml, robots, OG images, JSON-LD (LocalBusiness, Person, Service, FAQ).

### EPIC 4 — Astro Engine (Python)
- **AMX-040 — FastAPI skeleton + Docker** · 1d · 005 · AC: `/health` OK; HMAC auth middleware; Pydantic models.
- **AMX-041 — Ephemeris install** · 0.5d · 040 · AC: the build copies PyJHora `data/ephe` files into the package; `/health` checks they exist.
- **AMX-042 — Geo service** · 1.5d · 040 · geopy Nominatim (custom user-agent, 1 req/s limit) + local GeoNames India cache, timezonefinder, historical offset at DOB. AC: Indian villages resolve; a 1940 Mumbai birth returns the correct historical offset (+05:21 Bombay Time vs IST).
- **AMX-043 — Chart calculation core** · 3d · 041 · jyotishyamitra in a ProcessPoolExecutor + PyJHora LAHIRI. AC: D1 + 15 vargas, Balas, Ashtakavarga, Vimshottari dasha returned as JSON.
- **AMX-044 — Yogas & doshas** · 1.5d · 043 · AC: Manglik (with cancellation), Kaal Sarp, Pitru, Guru Chandal, Shrapit, Sade Sati; active-yoga list with hi/en names.
- **AMX-045 — SVG charts (jyotichart)** · 1.5d · 043 · AC: North and South charts; brand colours; Devanagari labels for hi; retrograde planets underlined.
- **AMX-046 — PDF kundali** · 2d · 044, 045 · Jinja2 HTML → WeasyPrint. AC: branded 6–8 page PDF in hi or en; Devanagari renders correctly; under 1.5 MB.
- **AMX-047 — Celery worker + tasks** · 1d · 040 · AC: horoscope, PDF, email, and scan tasks run with retries (3×) and record status in the DB.
- **AMX-048 — Rectification scan** · 3d · 043 · AC: for a known test case with the time hidden, the true time falls in the top-3 candidates; dossier PDF produced.
- **AMX-049 — Panchang endpoint** · 1d · 041 · jyotisha + adyatithi. AC: matches a published Drik Panchang for 10 sample dates.
- **AMX-050 — Accuracy validation suite** · 2d · 043–045 · AC: 20 reference charts match Jagannatha Hora/AstroSage (Lagna, planet signs, nakshatra, dasha start) within 1 arcminute; pytest in CI.
- **AMX-051 — AGPL compliance** · 0.5d · 040 · AC: engine repo public with LICENSE; footer link "Source of astro engine".

### EPIC 5 — Free Kundali (web)
- **AMX-060 — Birthplace combobox** · 1.5d · 042, 012 · AC: debounced search, keyboard support, shows state/country, manual lat/long under "Advanced".
- **AMX-061 — Kundali form** · 1.5d · 060 · zod validation, "time unknown" checkbox (routes to rectification), consent checkbox, Turnstile captcha. AC: errors in both languages.
- **AMX-062 — Kundali API + polling** · 1d · 047, 061 · AC: rate-limited; returns the cached result for identical input; result page polls status.
- **AMX-063 — Result page** · 2.5d · 062, 013 · AC: aurora header, summary chips, North/South toggle, planet table, dasha timeline, doshas, PDF download, booking CTA.
- **AMX-064 — Kundali email** · 1d · 046 · React Email template hi/en with the PDF attached. AC: arrives within 60s; renders in Gmail and Outlook.

### EPIC 6 — Booking Funnel
- **AMX-070 — Cal.com self-host + event types** · 1.5d · 005 · 30/60 Online Zoom, 60 Visit, 90 Rectification, 120 Vastu; buffers; working hours; holidays. AC: slots readable through the API.
- **AMX-071 — Zoom integration** · 1d · 070 · AC: an online booking creates a unique Zoom link.
- **AMX-072 — Funnel shell + stepper + state store** · 1.5d · 012, 021 · AC: back/next without losing data; deep links `?problem=vastu`.
- **AMX-073 — Step 1 Problem cards** · 1d · 072 · AC: from the CMS; selected state as in design.md; maps to a service.
- **AMX-074 — Step 2 Mode & duration** · 0.5d · 073 · AC: only valid combinations shown; price updates live.
- **AMX-075 — Step 3 Contextual intake** · 2.5d · 060, 074 · Jyotish/Gems birth form; Vastu property form + floor plan upload to R2 (signed URL); rectification questionnaire. AC: each branch validates on its own.
- **AMX-076 — Step 4 Slot picker** · 2d · 070, 075 · AC: day chips + hourly pills; IST and local time; unavailable slots disabled; selecting one creates a HELD appointment with a 10-min countdown.
- **AMX-077 — Hold expiry job** · 0.5d · 076 · AC: unpaid holds expire and slots free up within 1 minute.
- **AMX-078 — Calendly adapter (fallback)** · 1d · 076 · AC: feature flag switches the provider.

### EPIC 7 — Payments
- **AMX-080 — Razorpay order + checkout** · 2d · 076 · AC: UPI intent (GPay/PhonePe) on mobile, QR on desktop, Net Banking, cards; test mode passes.
- **AMX-081 — Payment page UI** · 1.5d · 080 · AC: order summary, Full/Split toggle, trust badges, refund link, light clean UI.
- **AMX-082 — Webhook handler** · 1.5d · 080 · AC: signature verified; idempotent; `payment.captured` → CONFIRMED (or PARTIALLY_PAID); handles failed and duplicate events.
- **AMX-083 — Split plan + balance link** · 1.5d · 082 · AC: advance % per plan; Razorpay Payment Link for the balance sent on schedule; status updates on payment.
- **AMX-084 — Success/failure pages** · 0.5d · 082 · AC: "checking payment" polling screen; retry on failure; booking summary on success.
- **AMX-085 — GST invoice PDF** · 1d · 082 · AC: invoice number series; emailed with the confirmation.
- **AMX-086 — Refunds** · 1d · 082 · AC: admin triggers a full or partial refund; status syncs.

### EPIC 8 — Confirmation & Notifications
- **AMX-090 — Confirmation orchestrator** · 1.5d · 071, 082 · AC: on CONFIRMED, the Cal.com booking, Zoom/visit details, email with .ics, and Jyotish pre-read are created in order, retry-safe.
- **AMX-091 — Email templates (hi/en)** · 1.5d · 090 · confirmation, reminder, reschedule, cancellation, balance due, kundali ready. AC: previews in React Email.
- **AMX-092 — Reminders** · 0.5d · 090 · AC: T-24h and T-1h by email (and WhatsApp in phase 2).
- **AMX-093 — Reschedule/cancel via link** · 1d · 090 · AC: signed link; policy enforced.

### EPIC 9 — WhatsApp
- **AMX-100 — Floating WhatsApp + context messages** · 0.5d · 014 · AC: page- and language-aware prefilled text; hidden on the payment page.
- **AMX-101 — WhatsApp Cloud API (phase 2)** · 2d · 090 · AC: approved templates for confirmation and reminder; delivery logged.

### EPIC 10 — Shop (enquiry)
- **AMX-110 — Shop listing + filters** · 1.5d · 030 · AC: category chips, product cards, empty state.
- **AMX-111 — Product detail** · 1d · 110 · AC: gallery, hi/en description, certification info, related items.
- **AMX-112 — Enquiry modal → DB → WhatsApp** · 1d · 110 · AC: lead saved first, then redirect with a SKU-prefilled message; admin sees it.

### EPIC 11 — Newsletter & Panchang
- **AMX-120 — Listmonk setup + double opt-in** · 1d · 005 · AC: subscribe form (footer + page); confirmation email in Hindi.
- **AMX-121 — Weekly panchang job** · 1.5d · 049, 120 · AC: Celery beat creates a draft campaign; admin approves; archive page updated.
- **AMX-122 — Daily panchang widget (home)** · 1d · 049 · AC: today's tithi/nakshatra for Delhi by default, cached 24h.

### EPIC 12 — Birth Time Finder page
- **AMX-130 — Page + questionnaire** · 1.5d · 075 · AC: explains the process; 4–6 life events with dates; approximate window; Prashna timestamp captured if the date is unknown.
- **AMX-131 — Scan → dossier → booking** · 1d · 048, 130 · AC: the scan runs; the dossier goes to the Jyotish; the client is routed to a 90-min rectification booking.

### EPIC 13 — Admin
- **AMX-140 — Admin auth & roles** · 1d · 030 · AC: Payload auth; roles admin and jyotish.
- **AMX-141 — Bookings dashboard** · 2d · 090 · AC: today/upcoming list, filters, client birth data + chart link, session notes, mark completed or no-show.
- **AMX-142 — Payments & enquiries views + CSV export** · 1d · 082, 112
- **AMX-143 — Settings** · 0.5d · 140 · AC: prices, advance %, cancellation hours, WhatsApp number, office address editable.

### EPIC 14 — QA & Launch
- **AMX-150 — E2E tests (Playwright)** · 2d · all · kundali, full booking (test payment), split plan, shop enquiry, language toggle.
- **AMX-151 — Accessibility & performance pass** · 1d · AC: axe has no serious issues; Lighthouse ≥ 90 on mobile on 5 key pages.
- **AMX-152 — Device QA** · 1d · AC: UPI intent works on Android Chrome and iOS Safari; WhatsApp deep links open on both.
- **AMX-153 — Go-live** · 1d · AC: Razorpay live keys, DNS, SSL, backups, monitoring, client walkthrough.

**Total ≈ 115 dev-days.** With 2 devs (1 full-stack JS, 1 Python), that is about 9–10 weeks.

---

## 7. Detailed Implementation Plan (Sprints, 2 weeks each)

| Sprint | Web dev (Next.js) | Python dev (Engine) | Exit demo |
|---|---|---|---|
| **S1 (W1–2)** | 001–005, 010–012, 020–022 | 040–043 | Bilingual blank shell with components; engine returns D1 JSON |
| **S2 (W3–4)** | 013, 014, 030, 031, 032, 033–035 | 044–047, 050 | Home + service pages live on staging; SVG + PDF generated |
| **S3 (W5–6)** | 060–064, 036–038, 110–112, 100 | 048, 049, 051 | Free Kundali end to end with email; shop enquiries to WhatsApp |
| **S4 (W7–8)** | 070–077, 080–084 | 120, 121, 122, 130, 131 | Full booking with test payment and Zoom link; newsletter draft |
| **S5 (W9–10)** | 085, 086, 090–093, 140–143, 150–153 | Support, perf, 101 (if approved) | Production launch |

### Folder structure
```
astromax/
├─ apps/
│  ├─ web/                    # Next.js
│  │  ├─ app/[locale]/(site)/...   pages
│  │  ├─ app/[locale]/book-appointment/
│  │  ├─ app/api/{kundali,booking,payments/webhook,cal/webhook,enquiry}/
│  │  ├─ components/{ui,effects,sections,booking,kundali}/
│  │  ├─ lib/{engine-client,razorpay,calcom,zoom,whatsapp,email}.ts
│  │  ├─ messages/{hi,en}.json
│  │  └─ prisma/schema.prisma
│  └─ engine/                 # FastAPI (AGPL, public)
│     ├─ app/{main,routers/{geo,horoscope,rectify,panchang},services/,models/}
│     ├─ workers/{celery_app,tasks}.py
│     ├─ templates/pdf/{hi,en}/
│     └─ tests/reference_charts/
├─ packages/{ui,config}
└─ infra/docker-compose.yml
```

### Key integration snippets (reference)
```python
# engine: chart core (simplified)
from jhora.panchanga import drik
drik.set_ayanamsa_mode('LAHIRI')
with ProcessPoolExecutor(max_workers=2) as pool:      # jyotishyamitra keeps global state, so run it in its own process
    data = pool.submit(run_jyotishyamitra, birth).result()
```
```ts
// web: Razorpay webhook (simplified)
const ok = crypto.createHmac('sha256', SECRET).update(rawBody).digest('hex') === sig;
if (!ok) return new Response('bad sig', { status: 400 });
await db.webhookEvents.create({ data: { provider:'razorpay', eventId } }); // unique: a duplicate event throws here and is skipped
```

### Client inputs needed before S2
Jyotish bio, photos and video · services and prices · split-plan rules · office address and visit hours · WhatsApp business number · Razorpay KYC documents · Zoom Pro · domain and email · 10 testimonials · product catalog with images.

### Top risks & mitigations
| Risk | Mitigation |
|---|---|
| Chart inaccuracy (timezone/ayanamsa) | AMX-042 historical offsets + AMX-050 reference suite |
| jyotishyamitra global state under load | Process pool; queue through Celery |
| Double booking | DB partial unique index + 10-min hold + webhook-only confirm |
| AGPL exposure | Separate public engine repo, or a Swiss Ephemeris licence |
| UPI collect requests restricted by NPCI changes | Use intent + QR first; collect only if Razorpay supports it |
| WhatsApp API approval delays | Launch with wa.me; Cloud API in phase 2 |
| Nominatim rate limits | Local GeoNames India cache + 1 req/s throttle |
