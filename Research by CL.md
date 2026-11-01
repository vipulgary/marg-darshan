# Astromax — Research by CL

> Jyotish consulting website · Hinglish-first (default), one-tap English toggle · Online + in-person consultations · Kundli generation · Payments upfront.

---

## 1. Product Summary

| Item | Decision |
|---|---|
| Default language | Hindi/Hinglish (`/hi`), English at `/en` — toggle visible in header on every page (not hidden in a menu) |
| Core money flow | Choose problem → choose service → choose slot → pay upfront → confirmation (email + WhatsApp) → Zoom link / visit address |
| Core free/lead flow | Free Kundli generator → email PDF → newsletter opt-in → upsell consultation |
| Shop | Enquiry-only (no cart/checkout) → WhatsApp / form |

---

## 2. Recommended Architecture

```
                ┌───────────────────────────────────────────┐
  Browser  ───► │ Next.js 15 (App Router, SSR/ISR)          │  Vercel / VPS
                │  • next-intl  (/hi default, /en)          │
                │  • Tailwind + Framer Motion + shadcn/ui   │
                │  • API routes / Server Actions            │
                └───────┬─────────────┬──────────────┬──────┘
                        │             │              │
               ┌────────▼───┐  ┌──────▼──────┐  ┌────▼────────────┐
               │ PostgreSQL │  │ Astro Engine │  │ Payload CMS     │
               │ (Prisma)   │  │ FastAPI (Py) │  │ (content, shop, │
               │ users,     │  │ Swiss Ephem. │  │  profile, blog) │
               │ bookings,  │  │ + PyJHora    │  └─────────────────┘
               │ payments,  │  │ Docker       │
               │ kundlis    │  └──────────────┘
               └────────────┘
  External: Razorpay (UPI/GPay/NetBanking) · Calendly · Zoom · WhatsApp Cloud API
            Resend/Brevo (email) · Listmonk (newsletter) · Nominatim + timezonefinder (geo)
            Cloudflare R2/S3 (PDF storage) · Upstash/BullMQ (jobs: PDF, email)
```

**Why split the Astro Engine into Python:** the best open-source Vedic libraries (Swiss Ephemeris bindings, PyJHora, Kerykeion) are Python. Keep it as an isolated microservice so its AGPL license and heavy maths stay separate from the web app.

### Tech Stack
- **Frontend/Backend:** Next.js 15 + TypeScript, Tailwind CSS, shadcn/ui, Framer Motion, (optional) OGL/three.js for plasma hero
- **i18n:** `next-intl` — locale routing, `hi` default, messages in `/messages/hi.json`, `/messages/en.json`
- **DB:** PostgreSQL (Neon/Supabase) + Prisma
- **CMS:** Payload CMS (open-source, Next-native) — for Jyotish profile, services, shop items, blog, FAQs in both languages
- **Auth:** Auth.js (email OTP / Google) — optional; bookings work as guest
- **Jobs:** BullMQ + Redis (PDF generation, emails, reminders)
- **Hosting:** Vercel (web) + Railway/Render/VPS Docker (astro engine, Listmonk)

---

## 3. Open-Source Connectors (Astrology + Supporting Data)

### 3.1 Astrology Calculation

| Library | Lang | License | Use for | Verdict |
|---|---|---|---|---|
| **Swiss Ephemeris** (`pyswisseph`) | C/Python | AGPL or paid commercial | Planet positions, Lahiri ayanamsa, houses, sunrise — gold standard accuracy | ✅ Core |
| **PyJHora** | Python | AGPL | Full Vedic: D1–D60 vargas, Vimshottari/other dashas, Panchang, Ashtakavarga, yogas, doshas, matching | ✅ Primary Vedic layer |
| **VedAstro** (vedastro.org) | C#/Python, open API | MIT | Ready REST API: charts, predictions, matching; good for fast MVP | ✅ MVP / fallback |
| **Kerykeion** | Python | AGPL | Beautiful SVG chart rendering, sidereal mode | ✅ Chart SVGs |
| **jyotishganit / jhora-style forks** | Python | Various | Alternate Vedic calcs | Optional |
| **Astronomy Engine** | JS/TS | MIT | Client-side planetary positions (live "today's planets" widget) | ✅ Frontend widget |
| **Skyfield** | Python | MIT | Astronomy cross-checks | Optional |

> **License note:** AGPL means if you modify and serve it, you must publish source of *that service*. Running it as a separate microservice with published source is the clean path; or buy Swiss Ephemeris commercial license (~CHF 750) later.

**Paid fallback (if needed):** Prokerala API, AstrologyAPI.com — quick, but per-call cost.

### 3.2 Location / Time (critical for kundli accuracy)
| Need | Tool |
|---|---|
| Birth place autocomplete → lat/long | **Nominatim (OpenStreetMap)** self-host or **Photon** (OSM-based autocomplete); GeoNames dump for Indian cities offline |
| Lat/long → timezone | **timezonefinder** (Python) |
| Historic DST/offset | **IANA tzdata** via `zoneinfo` (handles pre-1947 India offsets) |
| Map pin picker | **Leaflet + OSM tiles** |

### 3.3 Business Integrations
| Feature | Connector | Notes |
|---|---|---|
| Payments (UPI, GPay, NetBanking, cards) | **Razorpay** (Payment Links/Checkout + webhooks); alt: Cashfree, PhonePe PG | Static UPI QR as manual fallback |
| Scheduling | **Calendly API v2** + webhooks *or* open-source **Cal.com** (self-host, free, has Zoom + Razorpay-friendly flow) | Recommend Cal.com for full control |
| Video | **Zoom Server-to-Server OAuth** — auto-create meeting on paid booking | Google Meet as alt |
| WhatsApp | `https://wa.me/91XXXXXXXXXX?text=...` (click-to-chat) + **WhatsApp Cloud API** (Meta) for confirmations/reminders | Templates must be pre-approved |
| Email | **Resend** or **Brevo** + React Email templates | Hindi Unicode fonts in templates |
| Newsletter | **Listmonk** (open-source, self-host) or Brevo | Hindi double opt-in |
| PDF Kundli | **Playwright HTML→PDF** or `@react-pdf/renderer` with Noto Sans Devanagari | |
| Analytics | Plausible / Umami (open-source) | |

---

## 4. Complete Functionality List

### Public
1. **Language toggle** — HI (default) ⇄ EN pill in header; remembers choice (cookie); every URL has both versions (SEO hreflang).
2. **Home** — hero, services, problem picker, free kundli CTA, testimonials, Jyotish intro, newsletter, WhatsApp float.
3. **Services**
   - Online consultation (Zoom)
   - Personal visit (in-office)
   - Vastu Shastra consulting (home/office; online plan review or site visit)
   - Gems (Ratna) consulting
   - Kundli making / matching
   - Birth time rectification ("Janm samay nahi pata? Hum madad karenge")
4. **Problem-first booking** — user picks a problem (Career, Marriage, Health, Finance, Education, Santaan, Property/Vastu, Legal, Foreign travel, Other) → system suggests matching service + duration.
5. **Booking calendar** — hourly slots ("hours to hours" e.g. 10:00–11:00); mode: Online / Visit; IST shown with user's local time.
6. **Upfront payment** — pricing plans (e.g. 30 min / 60 min / Vastu package / Annual plan); UPI, GPay, NetBanking, cards via Razorpay.
7. **Free Online Kundli** — form (name, gender, DOB, TOB, birthplace autocomplete → lat/long/tz, email, phone) → chart on screen + PDF emailed.
8. **"Don't know birth time/date"** — checkbox switches flow to rectification request: life events questionnaire (marriage date, job, siblings, accidents) → paid rectification service.
9. **Jyotish profile page** — biography, lineage/guru, experience, certifications, media, photos, video.
10. **Shop (enquiry-only)** — gemstones, rudraksha, yantras; each product has "Enquire on WhatsApp" + enquiry form; no cart.
11. **Hindi newsletter** — subscribe (email + optional WhatsApp), double opt-in, monthly rashifal.
12. **WhatsApp floating button** — prefilled message with page context.
13. **Blog / Rashifal / Panchang** (phase 2) — daily panchang auto-generated from engine.
14. **Contact, FAQ, Privacy, Terms, Refund policy** (needed for Razorpay KYC).

### User (optional login)
- My bookings, reschedule/cancel (policy-based), my kundlis, invoices.

### Admin
- Dashboard: bookings, payments, enquiries, subscribers
- Manage slots/availability, holidays, prices, plans
- Manage services/problems/shop/content (Payload CMS)
- View user birth details + generated chart before session; add session notes
- Export CSV; trigger newsletter

---

## 5. Key Logic

### 5.1 Booking state machine
```
DRAFT → (slot hold 10 min) → PENDING_PAYMENT → PAID → CONFIRMED → COMPLETED
                         ↘ EXPIRED (hold released)      ↘ CANCELLED / REFUNDED / NO_SHOW
```
- Slot is **locked** (DB row lock / unique constraint on `slot_id`) while payment pending; auto-release after 10 min via job.
- Status moves to PAID **only from Razorpay webhook** (verify signature), never from client redirect.
- On CONFIRMED: create Zoom meeting (online) → email + WhatsApp with link/address → calendar invite (.ics) → reminders at T-24h and T-1h.

### 5.2 Problem → Service mapping
`problems` table maps to recommended `services` + default duration + price. Vastu problems → Vastu service; "birth time unknown" → rectification.

### 5.3 Kundli generation
1. Geocode place → lat/long → tz via timezonefinder → UTC conversion with historic offset.
2. Call Astro Engine `POST /chart` → returns planets, houses, Lagna, Nakshatra, D1/D9, Vimshottari dasha, doshas (Manglik, Kaal Sarp, Sade Sati).
3. Render SVG North-Indian + South-Indian chart; store JSON in `kundlis`.
4. Queue PDF job → upload to R2 → email signed link + attach.

### 5.4 Language
- Static UI strings: `next-intl` JSON. Dynamic content: CMS localized fields (`title.hi`, `title.en`).
- Astro terms glossary maintained in both (e.g. Lagna/Ascendant, Graha/Planet).

### 5.5 Payments
- Plans: single session, bundle (3 sessions), Vastu package, annual "Jyotish guidance" plan.
- Coupon codes; GST invoice PDF; refund via Razorpay API from admin.

---

## 6. Data Model (core tables)
`users` · `birth_profiles` (name, dob, tob, tob_unknown, place, lat, lng, tz) · `kundlis` (profile_id, chart_json, pdf_url) · `problems` · `services` (mode, duration, price) · `plans` · `availability_rules` · `slots` · `bookings` (status, mode, problem_id, service_id, slot_id, zoom_url) · `payments` (razorpay_order_id, status, amount) · `enquiries` (product_id, channel) · `products` · `subscribers` (lang, status) · `notifications_log`

---

## 7. Astro Engine API (FastAPI)
| Endpoint | Purpose |
|---|---|
| `POST /chart` | Full birth chart JSON |
| `POST /chart/svg?style=north\|south` | Chart image |
| `POST /dasha` | Vimshottari periods |
| `POST /match` | Ashtakoot Guna Milan |
| `GET /panchang?date&lat&lng` | Daily panchang |
| `POST /doshas` | Manglik / Kaal Sarp / Sade Sati |

---

## 8. Implementation Plan

| Phase | Duration | Deliverables |
|---|---|---|
| **0. Setup** | Week 1 | Repo, Next.js + Tailwind + next-intl, design tokens from `design.md`, Postgres + Prisma, Payload CMS, CI/CD |
| **1. Content site** | Weeks 2–3 | Home, Services (Online, Visit, Vastu, Gems), Jyotish profile, Shop (enquiry), Contact/legal pages, HI/EN toggle, WhatsApp button, SEO hreflang |
| **2. Astro Engine** | Weeks 3–4 | FastAPI + pyswisseph + PyJHora, geocoding + tz, `/chart`, SVG charts, Docker; validate 20 charts vs known software (Jagannatha Hora) |
| **3. Free Kundli** | Week 5 | Form + place autocomplete, result page, PDF (Devanagari fonts), email delivery, newsletter opt-in |
| **4. Booking + Payments** | Weeks 5–7 | Problem picker → service → Cal.com/Calendly slots → Razorpay checkout → webhooks → Zoom auto-create → email/WhatsApp confirmations + reminders |
| **5. Birth-time help** | Week 7 | "Don't know birth time" flow, questionnaire, paid rectification booking |
| **6. Admin + Newsletter** | Week 8 | Admin dashboard, Listmonk integration, Hindi templates, CSV export |
| **7. QA + Launch** | Week 9 | Payment test mode → live KYC, Lighthouse ≥90, mobile QA, accessibility, analytics, backup |
| **8. Phase 2** | Later | Daily rashifal/panchang, kundli matching, user dashboard, blog, PWA |

### Pre-requisites from client
Razorpay KYC (PAN, bank, GST optional) · Zoom Pro account · WhatsApp Business number + Meta verification · Calendly/Cal.com account · Jyotish bio, photos, pricing, office address · Domain + business email.

### Risks
- **Kundli accuracy** depends on correct timezone/ayanamsa — test against reference software.
- **AGPL** compliance for astro engine.
- **WhatsApp API** template approval delays (start with wa.me links).
- Double-booking — enforce DB-level unique slot lock.
