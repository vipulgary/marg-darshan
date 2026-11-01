# Astromax — Task Tracker

> Auto-generated from `tasks.json` by `node scripts/gen-tasks.mjs` · Last updated: 2026-11-01 19:21 UTC
> Progress is weighted by estimate (dev-days): Done = 100%, In progress = 50%.

## Overall Project Progress

```
Project  ██████████████████████████████████░░░░░░ 85.3%
```

| Total tickets | ✅ Done | 🔄 In progress | ⏳ Pending | Effort done / total |
|---|---|---|---|---|
| **100** | **82** | **8** | **10** | 105.8 / 124.0 days |

## Progress by Sprint

| Sprint | Tickets | Done | In progress | Pending | Progress |
|---|---|---|---|---|---|
| S1 | 15 | 12 | 3 | 0 | `███████████████████░ 93.6%` |
| S2 | 15 | 11 | 2 | 2 | `████████████████░░░░ 78.4%` |
| S3 | 20 | 20 | 0 | 0 | `████████████████████ 100.0%` |
| S4 | 18 | 15 | 2 | 1 | `██████████████████░░ 89.4%` |
| S5 | 32 | 24 | 1 | 7 | `███████████████░░░░░ 72.9%` |

## Progress by Segment (Epic)

| Epic | Segment | Tickets | Done | In progress | Pending | Progress |
|---|---|---|---|---|---|---|
| E0 | Project Setup & DevOps | 6 | 2 | 4 | 0 | `███████████████░░░░░ 72.7%` |
| E1 | Design System & Layout | 5 | 5 | 0 | 0 | `████████████████████ 100.0%` |
| E2 | Bilingual (i18n) | 4 | 4 | 0 | 0 | `████████████████████ 100.0%` |
| E3 | CMS & Content Pages | 9 | 8 | 0 | 1 | `█████████████████░░░ 84.0%` |
| E4 | Astro Engine (Python) | 12 | 10 | 1 | 1 | `█████████████████░░░ 86.5%` |
| E5 | Free Kundali (web) | 7 | 7 | 0 | 0 | `████████████████████ 100.0%` |
| E6 | Booking Funnel | 9 | 7 | 1 | 1 | `█████████████████░░░ 82.6%` |
| E7 | Payments | 7 | 7 | 0 | 0 | `████████████████████ 100.0%` |
| E8 | Confirmation & Notifications | 4 | 4 | 0 | 0 | `████████████████████ 100.0%` |
| E9 | WhatsApp | 2 | 1 | 0 | 1 | `████░░░░░░░░░░░░░░░░ 20.0%` |
| E10 | Shop (enquiry) | 3 | 3 | 0 | 0 | `████████████████████ 100.0%` |
| E11 | Newsletter & Panchang | 8 | 7 | 1 | 0 | `███████████████████░ 93.3%` |
| E12 | Birth Time Finder | 2 | 2 | 0 | 0 | `████████████████████ 100.0%` |
| E13 | Admin | 4 | 4 | 0 | 0 | `████████████████████ 100.0%` |
| E14 | QA & Launch | 4 | 2 | 0 | 2 | `████████████░░░░░░░░ 60.0%` |
| E15 | Autonomous extras (no client dependency) | 6 | 6 | 0 | 0 | `████████████████████ 100.0%` |
| E16 | Customer Accounts | 4 | 3 | 1 | 0 | `███████████████████░ 94.4%` |
| E17 | Report accuracy, tone & voice | 4 | 0 | 0 | 4 | `░░░░░░░░░░░░░░░░░░░░ 0.0%` |

## All Tickets

### E0 — Project Setup & DevOps  ·  2/6 done

| Ticket | Title | Est (d) | Sprint | Status | Notes |
|---|---|---|---|---|---|
| AMX-001 | Monorepo scaffold | 1 | S1 | ✅ Done |  |
| AMX-002 | CI/CD (GitHub Actions) | 1 | S1 | 🔄 In progress | Workflow file written; runs on first push to GitHub |
| AMX-003 | Environments & secrets | 0.5 | S1 | 🔄 In progress | .env.example done; real secrets pending from client |
| AMX-004 | Postgres + Prisma schema v1 | 1.5 | S1 | ✅ Done | Migrations applied + seeded on local PGlite |
| AMX-005 | Infra: Redis, R2, Docker Compose | 1 | S1 | 🔄 In progress | docker-compose written; Docker not installed locally |
| AMX-006 | Observability (Sentry, Plausible) | 0.5 | S2 | 🔄 In progress | Plausible env-gated done; Sentry needs account |

### E1 — Design System & Layout  ·  5/5 done

| Ticket | Title | Est (d) | Sprint | Status | Notes |
|---|---|---|---|---|---|
| AMX-010 | Design tokens | 1 | S1 | ✅ Done |  |
| AMX-011 | Fonts (Latin + Devanagari) | 0.5 | S1 | ✅ Done |  |
| AMX-012 | Core UI components | 3 | S1 | ✅ Done |  |
| AMX-013 | Effects library (plasma, aurora…) | 2 | S2 | ✅ Done | Done; not yet seen in browser |
| AMX-014 | Layout shell (header, footer, mobile bar) | 1.5 | S2 | ✅ Done | Done; not yet seen in browser |

### E2 — Bilingual (i18n)  ·  4/4 done

| Ticket | Title | Est (d) | Sprint | Status | Notes |
|---|---|---|---|---|---|
| AMX-020 | next-intl setup (hi default) | 1 | S1 | ✅ Done |  |
| AMX-021 | Language toggle | 1 | S1 | ✅ Done |  |
| AMX-022 | Message catalogs + glossary + CI check | 2 | S1 | ✅ Done |  |
| AMX-023 | Localized formats (₹, IST) | 0.5 | S2 | ✅ Done | Done; not yet seen in browser |

### E3 — CMS & Content Pages  ·  8/9 done

| Ticket | Title | Est (d) | Sprint | Status | Notes |
|---|---|---|---|---|---|
| AMX-030 | Payload CMS setup | 2 | S2 | ⏳ Pending |  |
| AMX-031 | Home page | 3 | S2 | ✅ Done | Done; content has TODO(client)/legal review markers |
| AMX-032 | About Jyotish page | 1.5 | S2 | ✅ Done | Done; content has TODO(client)/legal review markers |
| AMX-033 | Service: Astrology | 1 | S2 | ✅ Done | Done; content has TODO(client)/legal review markers |
| AMX-034 | Service: Vastu | 1 | S2 | ✅ Done | Done; content has TODO(client)/legal review markers |
| AMX-035 | Service: Gems | 1 | S2 | ✅ Done | Done; content has TODO(client)/legal review markers |
| AMX-036 | Pricing page | 1 | S3 | ✅ Done | Done; content has TODO(client)/legal review markers |
| AMX-037 | Contact, FAQ, legal pages | 1 | S3 | ✅ Done | Done; content has TODO(client)/legal review markers |
| AMX-038 | SEO (hreflang, sitemap, JSON-LD) | 1 | S3 | ✅ Done | Done; 52 share images verified, a11y fixes applied |

### E4 — Astro Engine (Python)  ·  10/12 done

| Ticket | Title | Est (d) | Sprint | Status | Notes |
|---|---|---|---|---|---|
| AMX-040 | FastAPI skeleton + Docker | 1 | S1 | ✅ Done |  |
| AMX-041 | Ephemeris install | 0.5 | S1 | ✅ Done | Verified live: pyswisseph built, 57 engine tests pass, kundali generated end to end |
| AMX-042 | Geo service (geopy + timezonefinder) | 1.5 | S1 | ✅ Done | Verified live: pyswisseph built, 57 engine tests pass, kundali generated end to end |
| AMX-043 | Chart calculation core | 3 | S1 | ✅ Done | Verified live: pyswisseph built, 57 engine tests pass, kundali generated end to end |
| AMX-044 | Yogas & doshas | 1.5 | S2 | ✅ Done | 40 pytest pass; swisseph paths untested locally |
| AMX-045 | SVG charts (jyotichart) | 1.5 | S2 | ✅ Done | Superseded: charts drawn in TS (North/South, D1/D9) |
| AMX-046 | PDF kundali | 2 | S2 | ✅ Done | Light-theme print page with Save as PDF button at top of result; server-side PDF optional later |
| AMX-047 | Celery worker + tasks | 1 | S2 | 🔄 In progress | Logic done; needs swisseph to verify, PDF/DB TODO |
| AMX-048 | Rectification scan | 3 | S3 | ✅ Done | Live scan works; scoring needs tuning with real cases; dossier PDF with AMX-046 |
| AMX-049 | Panchang endpoint | 1 | S3 | ✅ Done | Verified live (New Delhi panchang, sunrise 06:32) |
| AMX-050 | Accuracy validation suite | 2 | S2 | ⏳ Pending |  |
| AMX-051 | AGPL compliance | 0.5 | S3 | ✅ Done | Engine LICENSE (AGPL) + footer link via NEXT_PUBLIC_ENGINE_SOURCE_URL |

### E5 — Free Kundali (web)  ·  7/7 done

| Ticket | Title | Est (d) | Sprint | Status | Notes |
|---|---|---|---|---|---|
| AMX-060 | Birthplace combobox | 1.5 | S3 | ✅ Done | Done; untested live (no DB/engine) |
| AMX-061 | Kundali form | 1.5 | S3 | ✅ Done | Done; untested live (no DB/engine) |
| AMX-062 | Kundali API + polling | 1 | S3 | ✅ Done | Done; untested live (no DB/engine) |
| AMX-063 | Result page | 2.5 | S3 | ✅ Done | Done; print/SVG need browser check |
| AMX-064 | Kundali email | 1 | S3 | ✅ Done | Email with view + PDF links after compute (attachment with AMX-046) |
| AMX-180 | Phalit report engine (Lagna/Rashi/Nakshatra/houses/dasha) | 2 | S5 | ✅ Done | Live on result tab + print PDF; DRAFT text pending Jyotish review |
| AMX-181 | Remedies, gemstone & lucky factors in report | 0.5 | S5 | ✅ Done | Live on result tab + print PDF; DRAFT text pending Jyotish review |

### E6 — Booking Funnel  ·  7/9 done

| Ticket | Title | Est (d) | Sprint | Status | Notes |
|---|---|---|---|---|---|
| AMX-070 | Cal.com self-host + event types | 1.5 | S4 | ⏳ Pending |  |
| AMX-071 | Zoom integration | 1 | S4 | 🔄 In progress | Zoom client done+tested; Cal.com creates links today |
| AMX-072 | Funnel shell + stepper + store | 1.5 | S4 | ✅ Done | Done; untested live (no DB/Cal.com) |
| AMX-073 | Step 1 Problem cards | 1 | S4 | ✅ Done | Done; untested live (no DB/Cal.com) |
| AMX-074 | Step 2 Mode & duration | 0.5 | S4 | ✅ Done | Done; untested live (no DB/Cal.com) |
| AMX-075 | Step 3 Contextual intake | 2.5 | S4 | ✅ Done | Done; untested live (no DB/Cal.com) |
| AMX-076 | Step 4 Slot picker + hold | 2 | S4 | ✅ Done | Done; untested live (no DB/Cal.com) |
| AMX-077 | Hold expiry job | 0.5 | S4 | ✅ Done | Done; untested live (no DB/Cal.com) |
| AMX-078 | Calendly adapter (fallback) | 1 | S5 | ✅ Done | Done; untested live (no DB/Cal.com) |

### E7 — Payments  ·  7/7 done

| Ticket | Title | Est (d) | Sprint | Status | Notes |
|---|---|---|---|---|---|
| AMX-080 | Razorpay order + checkout | 2 | S4 | ✅ Done | Done; untested live (needs Razorpay test keys + DB) |
| AMX-081 | Payment page UI | 1.5 | S4 | ✅ Done | Done; untested live (needs Razorpay test keys + DB) |
| AMX-082 | Webhook handler | 1.5 | S4 | ✅ Done | Done; untested live (needs Razorpay test keys + DB) |
| AMX-083 | Split plan + balance link | 1.5 | S4 | ✅ Done | Done; untested live (needs Razorpay test keys + DB) |
| AMX-084 | Success/failure pages | 0.5 | S4 | ✅ Done | Done; untested live (needs Razorpay test keys + DB) |
| AMX-085 | GST invoice PDF | 1 | S5 | ✅ Done | Auto-issued on capture; HTML invoice (print to PDF) |
| AMX-086 | Refunds | 1 | S5 | ✅ Done | Done; untested live (needs Razorpay test keys + DB) |

### E8 — Confirmation & Notifications  ·  4/4 done

| Ticket | Title | Est (d) | Sprint | Status | Notes |
|---|---|---|---|---|---|
| AMX-090 | Confirmation orchestrator | 1.5 | S5 | ✅ Done | Done; untested live |
| AMX-091 | Email templates (hi/en) | 1.5 | S5 | ✅ Done | Done; untested live (needs Razorpay test keys + DB) |
| AMX-092 | Reminders | 0.5 | S5 | ✅ Done | Done; untested live |
| AMX-093 | Reschedule/cancel via link | 1 | S5 | ✅ Done | Done; untested live |

### E9 — WhatsApp  ·  1/2 done

| Ticket | Title | Est (d) | Sprint | Status | Notes |
|---|---|---|---|---|---|
| AMX-100 | Floating WhatsApp + context messages | 0.5 | S3 | ✅ Done | Done; not yet seen in browser |
| AMX-101 | WhatsApp Cloud API (phase 2) | 2 | S5 | ⏳ Pending |  |

### E10 — Shop (enquiry)  ·  3/3 done

| Ticket | Title | Est (d) | Sprint | Status | Notes |
|---|---|---|---|---|---|
| AMX-110 | Shop listing + filters | 1.5 | S3 | ✅ Done | Done; untested against live DB |
| AMX-111 | Product detail | 1 | S3 | ✅ Done | Done; untested against live DB |
| AMX-112 | Enquiry modal → DB → WhatsApp | 1 | S3 | ✅ Done | Done; untested against live DB |

### E11 — Newsletter & Panchang  ·  7/8 done

| Ticket | Title | Est (d) | Sprint | Status | Notes |
|---|---|---|---|---|---|
| AMX-120 | Listmonk + double opt-in | 1 | S4 | 🔄 In progress | Web side done; Listmonk opt-in template pending |
| AMX-121 | Weekly panchang job | 1.5 | S4 | ✅ Done | Done; widget hidden until engine has pyswisseph |
| AMX-122 | Daily panchang widget | 1 | S4 | ✅ Done | Verified live (New Delhi panchang, sunrise 06:32) |
| AMX-190 | Shubh Samay: choghadiya, Rahu Kaal, Abhijit, when-to-start | 1 | S5 | ✅ Done | Live at /shubh-samay, verified against today |
| AMX-191 | Kundali Milan (Ashtakoot 36 + doshas) | 1 | S5 | ✅ Done | Live at /kundali-milan; tables DRAFT pending Jyotish check on known matches |
| AMX-192 | Report dashboard (7 cards) + quick/full | 1 | S5 | ✅ Done | Dashboard tiles + personalised career/love/health/education; light PDF with emblem |
| AMX-193 | Marg Darshan rebrand | 0.5 | S5 | ✅ Done | Name + emblem in header/footer/icons/emails/meta; PDF cover logo with AMX-192 |
| AMX-194 | Numerology: Mulank, Bhagyank, Namank, lucky factors | 0.5 | S5 | ✅ Done | Live at /numerology; card reused on dashboard |

### E12 — Birth Time Finder  ·  2/2 done

| Ticket | Title | Est (d) | Sprint | Status | Notes |
|---|---|---|---|---|---|
| AMX-130 | Page + questionnaire | 1.5 | S4 | ✅ Done | Done; untested against live DB |
| AMX-131 | Scan → dossier → booking | 1 | S4 | ✅ Done | Done; untested against live DB |

### E13 — Admin  ·  4/4 done

| Ticket | Title | Est (d) | Sprint | Status | Notes |
|---|---|---|---|---|---|
| AMX-140 | Admin auth & roles | 1 | S5 | ✅ Done | Done; untested against a live DB |
| AMX-141 | Bookings dashboard | 2 | S5 | ✅ Done | Done; untested against a live DB |
| AMX-142 | Payments & enquiries + CSV | 1 | S5 | ✅ Done | Done; untested against a live DB |
| AMX-143 | Settings | 0.5 | S5 | ✅ Done | Editable; booking wizard UI prices still catalog defaults (follow-up) |

### E14 — QA & Launch  ·  2/4 done

| Ticket | Title | Est (d) | Sprint | Status | Notes |
|---|---|---|---|---|---|
| AMX-150 | E2E tests (Playwright) | 2 | S5 | ✅ Done | scripts/smoke.mjs — all flows pass live |
| AMX-151 | Accessibility & performance | 1 | S5 | ✅ Done | Done; 52 share images verified, a11y fixes applied |
| AMX-152 | Device QA (UPI, WhatsApp) | 1 | S5 | ⏳ Pending |  |
| AMX-153 | Go-live | 1 | S5 | ⏳ Pending |  |

### E15 — Autonomous extras (no client dependency)  ·  6/6 done

| Ticket | Title | Est (d) | Sprint | Status | Notes |
|---|---|---|---|---|---|
| AMX-160 | Printable kundali PDF + chart SVG download | 1 | S3 | ✅ Done | Done; print/SVG need browser check |
| AMX-161 | Cron routes + Vercel cron config | 0.5 | S5 | ✅ Done | Done; untested live |
| AMX-162 | Licensed product photos (Wikimedia) + credits | 0.5 | S3 | ✅ Done | 6 photos, CC/PD; replace with client photos before launch |
| AMX-163 | Light/dark theme toggle + WCAG contrast pass | 1 | S3 | ✅ Done |  |
| AMX-164 | Animated stroke icon system (54 icons) | 1 | S3 | ✅ Done |  |
| AMX-165 | Birthplace search fallback (OSM) without engine | 0.5 | S3 | ✅ Done |  |

### E16 — Customer Accounts  ·  3/4 done

| Ticket | Title | Est (d) | Sprint | Status | Notes |
|---|---|---|---|---|---|
| AMX-170 | Customer auth: email+password (signup, login, reset) | 1.5 | S5 | ✅ Done | Verified live: signup, verify, login, 6 account pages, claim, logout |
| AMX-171 | Google sign-in (OAuth, env-gated) | 0.5 | S5 | 🔄 In progress | Code complete; needs GOOGLE_CLIENT_ID/SECRET only |
| AMX-172 | My Account: kundalis, bookings, payments, invoices | 1.5 | S5 | ✅ Done | Verified live: signup, verify, login, 6 account pages, claim, logout |
| AMX-173 | Saved birth profiles + link past activity | 1 | S5 | ✅ Done | Verified live: signup, verify, login, 6 account pages, claim, logout |

### E17 — Report accuracy, tone & voice  ·  0/4 done

| Ticket | Title | Est (d) | Sprint | Status | Notes |
|---|---|---|---|---|---|
| AMX-200 | Sade Sati & Dhaiya timeline: exact phase dates (rising/peak/setting, small panoti), current status, end date, and the free period in between — do not stretch into the Saturn Mahadasha | 2 | S5 | ⏳ Pending |  |
| AMX-201 | Predictions tone pass: encouraging, motivational wording; highlight strengths and earning potential (still honest) | 1 | S5 | ⏳ Pending |  |
| AMX-202 | Kundali Milan: filter saved profiles by gender (boy side shows male, girl side female) | 0.5 | S5 | ⏳ Pending |  |
| AMX-203 | Voice per report section: play/pause, progress + time left, 1x/1.5x/2x speed (needs HF_TOKEN + model) | 2 | S5 | ⏳ Pending |  |

---
Full acceptance criteria for every ticket: see `Final Plan.md` §6.
