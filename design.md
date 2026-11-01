# Astromax — UI/UX Design System v2 (design.md)

> Concept: **"Cosmic Saffron"**. A dark night sky (cosmos) with saffron-gold (divinity, tradition) and a violet aurora (mystery, modernity).
> Global references: Linear/Vercel-style aurora gradients, Apple-style bento grids, Stripe-style gradient borders, Co-Star-style astrology minimalism, with Indian ornament used sparingly.
> Implements tickets **AMX-010 → AMX-014** and the page tickets in `Final Plan.md`.

---

## 0. Design Principles

| # | Principle | Rule |
|---|---|---|
| 1 | **Hindi-first** | Devanagari gets about 10% more size and line-height. Never put Hindi in condensed or uppercase styles. |
| 2 | **Trust > Flash** | Effects only in the hero, CTA bands, the kundli result header and loaders. Forms, payment and legal pages stay calm. |
| 3 | **One primary CTA per view** | "परामर्श बुक करें / Book Consultation" is the gold button; everything else is secondary or ghost. |
| 4 | **Mobile-first, thumb-first** | Most visitors arrive from WhatsApp on mobile. Sticky bottom CTA bar; touch targets ≥ 44px. |
| 5 | **Motion with meaning** | Every animation guides attention or confirms an action. All honour `prefers-reduced-motion`. |
| 6 | **Language always visible** | The toggle is in the header at every breakpoint, never hidden in a menu. |

---

## 1. Color System

### 1.1 Brand palette
| Token | Hex | Role |
|---|---|---|
| `saffron-300` | `#FCD34D` | Highlights on dark |
| `saffron-400` | `#FBBF24` | Hover of primary |
| `saffron-500` | `#F59E0B` | **Primary brand** |
| `saffron-600` | `#D97706` | Active / pressed |
| `gold-200` | `#FDE7B0` | Soft gold text |
| `gold-300` | `#FCD98A` | Eyebrows, icons, active nav |
| `violet-300` | `#C4B5FD` | Links on dark |
| `violet-400` | `#A78BFA` | Glow |
| `violet-500` | `#7C3AED` | **Secondary brand** |
| `violet-700` | `#4C1D95` | Deep aurora |
| `magenta-500` | `#DB2777` | Gradient accent only |
| `sindoor-600` | `#B91C1C` | Traditional accent (dosha badges, sparing) |

### 1.2 Dark theme (default, site-wide)
| Token | Value | Role |
|---|---|---|
| `bg-0` | `#07060F` | Page background |
| `bg-1` | `#0D0A1C` | Alternate section |
| `surface-1` | `#15112A` | Cards |
| `surface-2` | `#1D1736` | Inputs, hovered cards |
| `surface-3` | `#262044` | Dropdown hover, chips |
| `border-subtle` | `rgba(255,255,255,0.06)` | Dividers |
| `border` | `rgba(255,255,255,0.10)` | Default border |
| `border-hover` | `rgba(255,255,255,0.18)` | Hover |
| `border-gold` | `rgba(252,217,138,0.40)` | Focus / selected |
| `text-1` | `#F8F5EE` | Headings |
| `text-2` | `#CFC8DF` | Body |
| `text-3` | `#948CAD` | Muted / captions |
| `text-on-gold` | `#1A1325` | Text on gold buttons |

### 1.3 Light theme (payment page, PDF, emails, legal pages)
`bg-0 #FFFBF3` · `bg-1 #FBF4E6` · `surface-1 #FFFFFF` · `surface-2 #FAF6EE` · `border #EADFC8` · `text-1 #1A1325` · `text-2 #4A4358` · `text-3 #7A7189` · primary stays `saffron-500` (with `saffron-700 #B45309` for text links, for contrast).

### 1.4 Semantic
| State | Dark | Light | Usage |
|---|---|---|---|
| Success | `#34D399` | `#059669` | Paid, confirmed |
| Warning | `#FBBF24` | `#B45309` | Hold timer, balance due |
| Error | `#F87171` | `#DC2626` | Validation, failed payment |
| Info | `#7DD3FC` | `#0284C7` | Tips |
Each semantic colour also has a `-bg` at 12% alpha for alerts and badges.

### 1.5 Gradients
```css
--grad-primary:  linear-gradient(135deg,#F59E0B 0%,#DB2777 55%,#7C3AED 100%);   /* hero accents, featured borders */
--grad-gold:     linear-gradient(135deg,#FDE7B0 0%,#F59E0B 45%,#D97706 100%);   /* primary CTA fill */
--grad-text:     linear-gradient(92deg,#FDE7B0 0%,#F59E0B 45%,#C4B5FD 100%);    /* 1–2 keywords per heading */
--grad-violet:   linear-gradient(160deg,#4C1D95 0%,#15112A 70%);                 /* section backgrounds */
--grad-border:   conic-gradient(from var(--angle),#FCD98A,#DB2777,#7C3AED,#FCD98A); /* animated card border */
--grad-aurora:
  radial-gradient(55% 45% at 15% 20%, rgba(124,58,237,.45), transparent 60%),
  radial-gradient(45% 40% at 85% 25%, rgba(245,158,11,.30), transparent 60%),
  radial-gradient(60% 55% at 50% 110%, rgba(219,39,119,.28), transparent 60%);
--grad-fade-bottom: linear-gradient(180deg, transparent, var(--bg-0));          /* section blend */
```

---

## 2. Typography

### 2.1 Families
| Role | Latin | Devanagari | Fallback |
|---|---|---|---|
| Display (hero, H1–H2) | **Fraunces** (opsz, 600) | **Tiro Devanagari Hindi** 400 | serif |
| Headings H3–H6 / UI | **Plus Jakarta Sans** 600 | **Mukta** 600 | system-ui |
| Body | **Plus Jakarta Sans** 400 | **Mukta** 400 | system-ui |
| Numerals / data (charts, prices) | Plus Jakarta Sans, tabular-nums | — | |

Locale-switched via `:lang(hi)` selectors, so the font, size and leading change automatically.

### 2.2 Type scale
| Token | EN size / LH | HI size / LH | Weight | Tracking | Use |
|---|---|---|---|---|---|
| `display` | clamp(44,6.2vw,80) / 1.02 | clamp(40,5.6vw,72) / 1.22 | 600 | -0.025em (EN) | Hero |
| `h1` | clamp(34,4.6vw,56) / 1.08 | clamp(32,4.2vw,52) / 1.25 | 600 | -0.02em | Page titles |
| `h2` | clamp(28,3.4vw,42) / 1.12 | clamp(26,3.2vw,40) / 1.3 | 600 | -0.015em | Section titles |
| `h3` | 24 / 1.25 | 24 / 1.4 | 600 | -0.01em | Card titles |
| `h4` | 20 / 1.3 | 20 / 1.45 | 600 | 0 | Sub-blocks |
| `eyebrow` | 13 / 1.4 | 14 / 1.5 | 600 | 0.16em UPPER (EN only) | Above titles |
| `lead` (subtitle) | 19 / 1.6 | 20 / 1.75 | 400 | 0 | Intro paragraph |
| `body` | 16 / 1.65 | 17 / 1.8 | 400 | 0 | Paragraphs |
| `body-sm` | 14 / 1.55 | 15 / 1.7 | 400/500 | 0 | Labels, meta |
| `caption` | 12 / 1.4 | 13 / 1.5 | 500 | 0.02em | Helpers |
| `price` | 40 / 1 | same | 700 tabular | -0.02em | Pricing |

### 2.3 Text patterns
**Section title block** (centred on landing pages, left-aligned on inner pages):
```
✦ EYEBROW (gold-300)                 ← 12px glyph + label, 12px gap below
Heading with <gradient keyword>      ← h2, text-1, one keyword uses --grad-text
Lead/subtitle in text-2, max 60ch    ← 16px gap above
```
- **Paragraph**: `text-2`, max 68ch, 16px gap between paragraphs. Bold text uses `text-1` 600.
- **Links**: `violet-300`. Hover: `gold-300` with an underline (1.5px, offset 3px) that animates in from left to right.
- **Quote**: Fraunces italic 24px, 2px gold rule on the left.

---

## 3. Layout, Spacing, Radius, Elevation

- **Grid**: 12 columns, 1200px container (1320 for bento), gutters 24 (desktop) / 16 (mobile).
- **Breakpoints**: `sm 640` · `md 768` · `lg 1024` · `xl 1280` · `2xl 1536`.
- **Spacing scale (px)**: 2, 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96, 128.
- **Section padding**: 112 desktop / 72 tablet / 56 mobile.

| Radius | px | Use |
|---|---|---|
| `r-xs` | 6 | Checkbox, tiny tags |
| `r-sm` | 10 | Chips, badges, tooltips |
| `r-md` | 14 | Inputs, dropdowns, slot pills (non-pill variant) |
| `r-lg` | 20 | Cards |
| `r-xl` | 28 | Bento tiles, modals, sheets |
| `r-full` | 9999 | Buttons, toggle, avatars, slot pills |

| Elevation | Value | Use |
|---|---|---|
| `e0` | none | Flat |
| `e1` | `0 1px 0 rgba(255,255,255,.04) inset, 0 8px 24px -12px rgba(0,0,0,.6)` | Cards |
| `e2` | `0 1px 0 rgba(255,255,255,.06) inset, 0 24px 48px -20px rgba(0,0,0,.7)` | Hovered cards, dropdowns |
| `e3` | `0 40px 80px -24px rgba(0,0,0,.8)` | Modals |
| `glow-gold` | `0 0 0 1px rgba(252,217,138,.35), 0 12px 40px -10px rgba(245,158,11,.55)` | Primary hover |
| `glow-violet` | `0 12px 60px -16px rgba(124,58,237,.65)` | Featured cards |

---

## 4. Buttons & CTAs

### 4.1 Sizes
| Size | Height | Padding-x | Font | Icon |
|---|---|---|---|---|
| `lg` | 56 | 28 | 17/600 | 20 |
| `md` (default) | 48 | 22 | 16/600 | 18 |
| `sm` | 36 | 14 | 14/600 | 16 |
| `icon` | 44×44 | — | — | 20 |

Shape is pill (`r-full`), icon gap 8px. Transition: `220ms cubic-bezier(.2,.8,.2,1)` on transform, box-shadow, background and border-color.

### 4.2 Variants × states
| Variant | Default | Hover | Active / pressed | Focus-visible | Disabled | Loading |
|---|---|---|---|---|---|---|
| **Primary (gold)** | `--grad-gold` fill, `text-on-gold`, `e1` | lift `-2px`, `glow-gold`, shimmer sweep 700ms, arrow icon slides +4px | `scale(.97)`, fill `saffron-600`, no glow | 3px ring `rgba(252,217,138,.55)` + 2px offset `bg-0` | 40% opacity, grayscale(.3), `not-allowed` | spinner replaces icon, label "कृपया प्रतीक्षा करें…", width locked |
| **Secondary (outline gold)** | transparent, 1px `border-gold`, `gold-300` text | bg `rgba(252,217,138,.08)`, border 100% gold | bg `.14`, `scale(.98)` | same ring | 40% opacity | spinner |
| **Ghost** | transparent, `text-2` | bg `rgba(255,255,255,.06)`, `text-1` | bg `.10` | ring | 40% | — |
| **Gradient-border (special)** | `surface-1` fill, 1.5px animated `--grad-border` (4s rotation) | rotation speeds to 1.5s, inner glow | `scale(.98)` | ring | — | — |
| **WhatsApp** | `#25D366`, white text + WA icon | `#1EBE5A`, lift | `scale(.97)` | green ring | — | — |
| **Danger** (admin) | `#DC2626` | darken 8% | scale | red ring | 40% | — |
| **Link button** | `violet-300` text | `gold-300` + underline | — | ring | — | — |

**Shimmer sweep**: `::after` with `linear-gradient(115deg, transparent 30%, rgba(255,255,255,.55) 50%, transparent 70%)`, translateX from -120% to 120%.

**Light theme (payment page)**: Primary keeps the gold fill. Secondary uses border `saffron-600` and text `saffron-700`.

### 4.3 CTA copy (hi / en)
| Context | Hindi (default) | English |
|---|---|---|
| Main | परामर्श बुक करें → | Book Consultation → |
| Kundali | मुफ्त कुंडली बनाएं | Create Free Kundali |
| Birth time | जन्म समय नहीं पता? हम मदद करेंगे | Don't know your birth time? We'll help |
| Shop | उपयुक्तता एवं मूल्य जानें | Check suitability & price |
| Pay | ₹1,100 सुरक्षित भुगतान करें | Pay ₹1,100 securely |
| WhatsApp | WhatsApp पर बात करें | Chat on WhatsApp |

---

## 5. Form Controls

### 5.1 Text input / textarea
| State | Spec |
|---|---|
| Default | h 52, `r-md`, bg `surface-2`, 1px `border`, text `text-1` 16px, placeholder `text-3`, padding-x 16 |
| Hover | border `border-hover` |
| Focus | border `saffron-400`, ring `0 0 0 4px rgba(245,158,11,.18)`, label turns `gold-300` |
| Filled | same as default; right check icon if validated |
| Error | border `#F87171`, ring red 15%, helper text red with ⚠ icon, one 6px shake (200ms) |
| Disabled | bg `surface-1`, text `text-3`, 60% opacity |
| Read-only | dashed border |

The label sits above the field (14px/500, `text-2`, 8px gap), followed by helper text (12px `text-3`, 6px gap). Required fields show a `*` in `saffron-400`. Textarea min-height is 120 and auto-grows.

### 5.2 Dropdown / Select
- **Trigger**: input style plus a chevron that rotates 180° (200ms) when open. When open, the border is gold.
- **Menu**: `surface-1` at 92% alpha, `backdrop-blur(18px)`, 1px `border`, `r-md`, `e2`, padding 6, max-height 320 with scrolling. Enter animation: opacity 0→1 with `translateY(-6px)→0`, 160ms.
- **Item**: h 42, `r-sm`, padding-x 12, 15px.

| Item state | Spec |
|---|---|
| Default | `text-2` |
| Hover / keyboard-highlight | bg `surface-3`, `text-1`, 2px gold bar on the left |
| Selected | bg `rgba(245,158,11,.14)`, `gold-300`, ✓ on the right |
| Disabled | `text-3`, 50% |

- **Combobox (birthplace)**: search icon on the left; results show city in bold, then state and country muted, with a 📍 icon. Matched text is bold gold. While loading: a 3-row skeleton. No results: "स्थान नहीं मिला — Advanced में lat/long डालें".

### 5.3 Checkbox
| State | Spec |
|---|---|
| Default | 20×20, `r-xs`, 1.5px `text-3` border, transparent |
| Hover | border `gold-300`, bg `rgba(252,217,138,.06)` |
| Checked | fill `--grad-gold`, ✓ stroke `text-on-gold` drawn via stroke-dashoffset (180ms), small pop `scale(.9→1)` |
| Indeterminate | gold fill with a dash |
| Focus | gold ring |
| Disabled | 40% |
| Error | red border |

Label sits 10px to the right, 15px, and is clickable. The **"Don't know birth time"** checkbox is a featured variant: a full-width tinted card (`surface-2`, gold border on check) with a sub-label.

### 5.4 Radio
A 20px circle. When checked: 1.5px gold ring and a 10px gold dot that scales in (spring).

### 5.5 Switch
44×24 pill. Off: `surface-3`. On: `--grad-gold`. 20px white knob slides over 200ms (spring). Used for the "Full / Split payment" toggle.

### 5.6 Selectable card (Problem picker, Mode picker, Plan picker)
| State | Spec |
|---|---|
| Default | `surface-1`, 1px `border`, `r-lg`, padding 20, 40px line icon `gold-300`, title (h4 hi) + sub (body-sm en, `text-3`) |
| Hover | lift `-3px`, border `border-hover`, `e2`, icon glows (`drop-shadow gold 40%`), spotlight follows the cursor |
| Focus | gold ring |
| Selected / active | 1.5px `--grad-primary` border (mask), bg `rgba(245,158,11,.08)`, ✓ badge top-right (gold circle 22px), title `gold-200` |
| Disabled | 40%, tooltip explains why |

Grid: 2 columns on mobile, 3 on tablet, 4 on desktop, 16px gap.

### 5.7 Date & slot picker
- **Day chips**: horizontal scroll, 64×76, `r-md`, weekday (caption) + date (h4). Selected: gold fill. Today: dot below. Fully booked: strikethrough at 40%.
- **Slot pills**: h 44, `r-full`, label "10:00 – 11:00".

| Slot state | Spec |
|---|---|
| Available | 1px `border`, `text-2` |
| Hover | border `gold-300`, `text-1` |
| Selected | `--grad-gold` fill, `text-on-gold`, `glow-gold` |
| Unavailable | `text-3`, line-through, 35% opacity, not focusable |
| Held (yours) | gold fill + countdown chip "09:42 बाकी" in warning colour |

- **Timezone note**: below the grid, "समय IST में · आपका समय: 5:30 AM (London)".

### 5.8 File upload (Vastu floor plan)
Dashed 1.5px `border` drop zone, `r-lg`, 160px tall, upload icon and hint "PDF/JPG, max 10MB". When dragging over: gold dashed border with tint. While uploading: progress bar with `--grad-gold`. When done: file chip with a thumbnail and a remove (×) button.

### 5.9 Validation & messages
Fields validate on blur, and again on change once an error is showing. Each field shows its message inline. When the form is submitted with errors, a summary banner appears at the top and the page scrolls to the first error. All messages exist in both hi and en.

---

## 6. Navigation & Active States

### 6.1 Header
- 72px desktop / 60px mobile, sticky.
- At the top of the page it is transparent. After 24px of scroll: `rgba(7,6,15,.72)`, `backdrop-blur(16px) saturate(140%)`, bottom `border-subtle`, with a 200ms transition.
- Layout: logo (left) · nav (centre, desktop) · **language toggle** + "बुक करें" primary `sm` (right).

### 6.2 Nav link states
| State | Spec |
|---|---|
| Default | 15px/500 `text-2` |
| Hover | `text-1`, 2px gold underline grows from the centre (200ms) |
| Active (current page) | `gold-300`, permanent 2px underline, 4px ✦ glyph above |
| Focus | ring |

Dropdown nav ("सेवाएं / Services") opens a **mega-menu**: a 3-column glass panel with Astrology, Vastu and Gems cards, each with an icon, a one-line description and an arrow.

### 6.3 Language toggle (key component)
```
┌──────────────────────────┐
│ [ अ हिंदी ]   A English  │   ← segmented pill, h 36, r-full, surface-2, 1px border
└──────────────────────────┘
```
- The active segment has a gold fill (`--grad-gold`) and `text-on-gold`. The indicator slides between segments with a spring (Framer `layoutId`).
- Inactive segment: `text-2`. Hover: `text-1`.
- On mobile (< 768) it reads `[ हि | EN ]` and stays in the header.
- First visit shows a tooltip once: "Switch to English" pointing at EN (dismissed by click or after 5s).
- `aria-label="भाषा बदलें / Change language"`, `role="radiogroup"`.

### 6.4 Tabs (Chart North/South, Shop categories)
Underline tabs: 15px/500, active shows `gold-300` with a 2px bar that slides between tabs. Chip-tabs on mobile: active chip has a gold fill.

### 6.5 Stepper (booking funnel)
```
 (✓)────(✓)────( 3 )────( 4 )────( 5 )
Problem  Mode  Details   Slot    Pay
```
| Step state | Spec |
|---|---|
| Completed | 28px gold-filled circle with ✓, connector line filled with `--grad-gold`; clickable to go back |
| Current | 28px circle with 2px gold ring, pulsing halo (2s), number in gold, label `text-1` 600 |
| Upcoming | 1px `border` circle, number `text-3`, label `text-3` |

On mobile it collapses to "चरण 3/5 · विवरण" with a gold progress bar.

### 6.6 Mobile
- Hamburger opens a full-height sheet sliding from the right over an aurora background, with large nav items (20px) and the language toggle repeated.
- Sticky bottom bar (h 64, glass): `[WhatsApp icon-button] [परामर्श बुक करें — full-width primary]`. Hidden on booking and payment pages.

### 6.7 Breadcrumbs
Shown on inner pages: `text-3` 13px with `/` separators and the current page in `text-1`.

---

## 7. Cards, Bento & Data Display

### 7.1 Card (base)
`surface-1`, 1px `border`, `r-lg`, padding 28 (24 on mobile), `e1`.
- **Hover**: lift -4px, `e2`, gradient border fades in (opacity 0→1), and a spotlight `radial-gradient(400px at var(--mx) var(--my), rgba(252,217,138,.10), transparent 60%)` follows the cursor.
- **Active (pressed)**: `scale(.99)`.

### 7.2 Bento grid (Home: Services + Why us)
```
┌──────────────┬───────┬───────┐
│ FREE KUNDALI │ VASTU │ GEMS  │
│ (2×2, aurora │ (1×1) │ (1×1) │
│ + zodiac     ├───────┴───────┤
│ wheel)       │ ONLINE/VISIT  │
├───────┬──────┴──┬────────────┤
│ 20+ YRS│ 10K+   │ BIRTH TIME │
│ stat   │ clients│ FINDER(2×1)│
└───────┴─────────┴────────────┘
```
12-column CSS grid with 16px gap and `r-xl` tiles. The key tile has a moving aurora background and a slowly rotating zodiac wheel. Stat tiles count up when scrolled into view. On mobile it becomes a single column in priority order.

### 7.3 Specialised cards
- **Service card**: icon, h3, 2-line description, "और जानें →" link, plus a price chip ("₹1,100 से").
- **Pricing card**: plan name, price (`price` token), duration and mode chips, feature list with gold ✓, CTA. **Featured**: animated gradient border, `glow-violet`, "सबसे लोकप्रिय" badge, scale 1.03 on desktop.
- **Testimonial card**: gold quote glyph, text (body), avatar, name, city, ★★★★★ (gold), problem tag chip.
- **Product card (shop)**: 1:1 image on a dark radial background (gem macro), category chip, title, "Lab certified" badge, secondary CTA "पूछताछ करें". Hover: image zooms 1.05 and the card lifts.
- **Glass card** (only over gradients): `rgba(255,255,255,.04)`, `blur(20px)`, 1px `rgba(255,255,255,.10)`.

### 7.4 Badges & chips
h 26, `r-sm`, 12px/600, padding-x 10.
- Gold: `rgba(245,158,11,.14)` bg, `gold-300` text.
- Violet: `rgba(124,58,237,.18)` bg, `violet-300` text.
- Success, warning and error use their semantic `-bg` colours.
- Dosha badges: Manglik uses `sindoor` tint. "No dosha" uses success.

### 7.5 Tables (planet table, admin)
Header: `text-3` caption UPPER (EN) on `surface-2`. Rows are 48px with `border-subtle` dividers and `surface-2` on hover. Numbers use tabular-nums. Retrograde planets are marked with a gold "R" superscript. On mobile, rows become stacked cards.

### 7.6 Dasha timeline
A horizontal scrolling bar of mahadasha segments, each coloured by its planet's colour token. The current segment has a gold outline and a "अभी / Now" marker. Tapping a segment expands its antardashas.

### 7.7 Kundali chart frame
The SVG sits in a card with a `r-xl` border-glow. North chart: gold 1.5px strokes on `surface-1`; planet glyphs in `text-1`, Lagna marked "ल / Asc" in `saffron-400`, house numbers in `text-3`. North/South toggle above it, plus a download icon-button.

---

## 8. Feedback & Overlays

| Component | Spec |
|---|---|
| **Toast** | Bottom-centre on mobile, top-right on desktop. `surface-1` glass, `r-md`, `e2`, 4px left bar in the semantic colour, auto-dismiss after 4s, slides in. |
| **Modal** | Backdrop `rgba(7,6,15,.7)` with blur 6. Panel `surface-1`, `r-xl`, `e3`, max-w 560. Enters with `scale(.96)→1` and fade over 200ms. Close × is a 44px target. On mobile it becomes a **bottom sheet** with a drag handle. |
| **Tooltip** | `surface-3`, `r-sm`, 13px, 8px padding, 150ms delay. |
| **Skeleton** | `surface-2` with a moving shimmer `linear-gradient(90deg, transparent, rgba(255,255,255,.05), transparent)` over 1.4s. |
| **Loader (kundali)** | Rotating zodiac wheel (SVG, 6s per turn) with rotating text: "ग्रहों की गणना हो रही है…" → "चार्ट बन रहा है…" → "PDF तैयार हो रहा है…" |
| **Empty state** | Line illustration (constellation), h4, body, CTA. |
| **Hold timer** | Warning chip "⏳ 09:42 में स्लॉट रिलीज़ होगा", pulses below 2 minutes. |
| **Success screen** | Burst of gold particles (one-off, 1.2s), green check that draws itself, booking summary card, "Calendar में जोड़ें" + WhatsApp CTA. |

---

## 9. Effects & Motion

### 9.1 Effect placement map
| Effect | Where used | Never on |
|---|---|---|
| **Plasma shader** (OGL fragment shader: saffron, magenta and violet noise flow, 30fps cap, 0.6 DPR) | Home hero only | — |
| **Moving aurora mesh** (3–4 blurred blobs drifting on a 24–40s loop) | Hero fallback, CTA bands, kundali result header, mobile menu, footer top | Forms, payment |
| **Starfield** (canvas, ~120 stars, twinkle) | Hero and the about page header, at low opacity | Text-dense sections |
| **Zodiac wheel** (SVG, 120s rotation) | Hero right side, Free-Kundali bento tile, loader | — |
| **Bento grid** | Home services, About "Why us" | — |
| **Gradient text** | One keyword per H1/H2 | Body |
| **Animated gradient border** | Featured pricing card, special CTA | More than 2 per viewport |
| **Spotlight hover** | Cards (desktop pointer only) | Touch devices |
| **Mandala / yantra line texture** | Section backgrounds at 4–6% opacity | Over text |
| **Marquee** | Testimonials, "featured in" logos | — |
| **Scroll reveal** | All sections | — |

### 9.2 Motion tokens
| Token | Value |
|---|---|
| `dur-instant` | 100ms (press) |
| `dur-fast` | 160ms (hover, dropdown) |
| `dur-base` | 240ms (modal, toggle) |
| `dur-slow` | 480ms (reveals) |
| `dur-ambient` | 24–40s (aurora), 120s (wheel) |
| `ease-out` | `cubic-bezier(.2,.8,.2,1)` |
| `ease-in-out` | `cubic-bezier(.65,0,.35,1)` |
| `spring` | Framer `{stiffness: 320, damping: 30}` |

**Reveal pattern**: `opacity 0→1`, `y 24→0`, `filter blur(6px)→0`, 480ms, children staggered 70ms, `once: true`, viewport margin -10%.

**Reduced motion**: the shader becomes a static gradient image; aurora and wheel freeze; marquee becomes a static list; reveals become plain fades (150ms).

**Performance**: shaders are dynamically imported after `requestIdleCallback` and paused when off-screen (IntersectionObserver) or when the tab is hidden. GPU-only properties (transform, opacity).

---

## 10. Iconography, Imagery, Illustration

- **Icons**: Lucide at 1.5px stroke, sizes 16/20/24. A custom set in the same stroke for the 9 grahas, 12 rashis, Vastu directions, gem types and the problem categories (career briefcase, marriage rings, health heart-pulse, finance coins, santaan cradle, property house-compass, legal scales, travel plane).
- **Planet colour tokens** (charts, dasha): Sun `#F59E0B`, Moon `#E5E7EB`, Mars `#EF4444`, Mercury `#22C55E`, Jupiter `#FACC15`, Venus `#F9A8D4`, Saturn `#6366F1`, Rahu `#64748B`, Ketu `#A16207`.
- **Photography**: real photos of the Jyotish in warm light (no stock clichés), framed with a thin gold arch (temple-arch mask `r-[200px_200px_20px_20px]`). Gems shown as macro shots on black.
- **Ornament**: mandala, yantra and constellation line art in `gold-300` at low opacity. Never full-colour clipart.

---

## 11. Page Designs

### 11.1 Home `/`
1. **Hero** (100vh, max 860): plasma background with a starfield overlay.
   - Left: eyebrow "✦ वैदिक ज्योतिष · वास्तु · रत्न", display title "आपकी कुंडली, <gradient>आपका मार्गदर्शन</gradient>", lead, CTAs `[परामर्श बुक करें →]` (primary lg) `[मुफ्त कुंडली बनाएं]` (secondary lg), trust row (★ 4.9 · 10,000+ परामर्श · 20+ वर्ष).
   - Right: zodiac wheel with a floating glass "Quick Kundali" mini form (DOB, TOB, place → CTA).
2. **Trust strip**: marquee of media logos and certifications.
3. **"आपकी समस्या क्या है?"** problem-picker cards (8). Clicking one deep-links to booking with that problem preselected.
4. **Services bento** (§7.2).
5. **Meet the Jyotish**: arch-framed photo on the left; quote, short bio, credentials chips and "पूरा परिचय →" on the right.
6. **How it works**: 4 steps (समस्या चुनें → समय चुनें → भुगतान करें → परामर्श लें) with numbered gold circles joined by a dotted line.
7. **Online vs Visit**: two cards side by side.
8. **Pricing preview**: 3 cards, the middle one featured.
9. **Birth-time band**: full-width aurora band, "जन्म समय नहीं पता? हम मदद करेंगे" + CTA.
10. **Testimonials marquee**: 2 rows moving in opposite directions.
11. **Today's Panchang widget** + **Newsletter signup** side by side.
12. **FAQ accordion**: chevron rotates, content height animates, gold left bar on the open item.
13. **Footer**: aurora top edge, 4 columns, WhatsApp, address, policies, AGPL source link, language toggle repeated.

### 11.2 About Jyotish `/about-jyotish`
Hero: large arch portrait with name in display font, title chips and a CTA. Then a sticky left index alongside the story, a lineage/guru timeline (vertical gold line with nodes), credentials grid, media/video (16:9, `r-xl`), philosophy quote band, testimonials, and the booking CTA.

### 11.3 Service pages `/services/*`
Hero with a service illustration, then "किन समस्याओं में मदद" chips, process steps, the online vs visit comparison table, pricing cards (Vastu shows a Split Plan badge), FAQ, and a sticky side CTA card on desktop.

### 11.4 Free Kundali `/free-kundali`
- **Desktop**: 2 columns. Left: title and benefits list ("D1–D60 चार्ट", "दशा", "दोष विश्लेषण", "PDF ईमेल पर"). Right: the form card.
- **Form order**: name → gender (radio chips) → DOB (3 selects day/month/year, easier than a date picker for older users) → TOB (hour/minute/AM-PM selects) → birthplace combobox → "Advanced: lat/long" collapsible → email → WhatsApp (optional) → chart style (North/South radio cards) → consent checkbox → primary CTA.
- Featured checkbox "जन्म समय नहीं पता?" switches to the rectification CTA.

### 11.5 Kundali result `/kundali/[id]`
Aurora header with the name, birth details and summary chips (Lagna · Rashi · Nakshatra · current dasha). Then tabs: **चार्ट** (North/South toggle, D1/D9 selector) · **ग्रह** (table) · **दशा** (timeline) · **दोष & योग** (badges and cards). A sticky bottom card reads "विस्तृत विश्लेषण चाहिए? परामर्श बुक करें" with a "PDF ईमेल किया गया ✓" status.

### 11.6 Booking funnel `/book-appointment`
- **Layout**: stepper on top; a 2-column body with the step content (8 columns) and a sticky **summary card** (4 columns: problem, mode, duration, slot, price, plan). On mobile the summary becomes a collapsible bottom sheet with the price always visible.
- Step transitions: content slides on the x axis (±24px) with a fade over 240ms.
- Back is a ghost button; Next is primary and disabled until the step is valid.
- Step 4 shows the hold timer once a slot is chosen.

### 11.7 Payment `/payment/[id]` (light theme, no effects)
Centred card (max 520). Contents:
- Merchant name and logo; order summary.
- **Plan switch** "पूरा भुगतान / आंशिक (50%)", only for eligible plans.
- Big amount; method preview icons (UPI, GPay, PhonePe, NetBanking, cards).
- Primary "₹X सुरक्षित भुगतान करें"; lock icon, "Secured by Razorpay", refund policy link.
- After payment: a "भुगतान की पुष्टि हो रही है…" screen with a spinner, then the success screen (§8).

### 11.8 Shop `/shop`
Header band, sticky category chip-tabs (सभी · रत्न · रुद्राक्ष · यंत्र · वास्तु), a 2-column (mobile) / 4-column (desktop) product grid, and a note card: "रत्न कुंडली के अनुसार ही धारण करें — पहले परामर्श लें". **Product detail**: gallery with thumbnails, info, certification, a "किसके लिए उपयुक्त" section, an enquiry CTA (opens a modal, then WhatsApp), and a "पहले रत्न परामर्श बुक करें" secondary CTA.

### 11.9 Birth Time Finder `/birth-time-finder`
Empathetic hero ("चिंता न करें"), then 3 explainer steps, then a form: approximate date or window → life-event repeater (event type select + date + "+ और जोड़ें") → contact details → CTA to book a 90-min rectification.

### 11.10 Newsletter `/newsletter`
Subscribe hero (email + optional WhatsApp, inline success state), today's panchang card, and an archive grid of past issues.

### 11.11 Admin
Light theme, dense layout, shadcn defaults with brand primary. No effects.

---

## 12. Accessibility & Quality Bar

- **Contrast**: body text ≥ 4.5:1, large text ≥ 3:1. Gold is never used for body text on light backgrounds (use `saffron-700`).
- **Focus**: every interactive element has a visible focus ring (gold), and focus order follows the visual order.
- **Touch**: targets ≥ 44×44, with ≥ 8px between slot pills.
- **Screen readers**: correct `lang` attribute; aria-live announcements for validation errors, the hold timer and payment status; SVG charts include a text summary.
- **Forms**: native inputs for date/time selects; autocomplete attributes (`name`, `email`, `tel`, `bday`).
- **Performance**: LCP < 2.5s (hero text is the LCP element, not the shader), CLS < 0.05, INP < 200ms, JS for the hero route < 170KB.
- **Older users**: a base font of 17px for Hindi, clear labels, and no swipe-only interactions.

---

## 13. Implementation Tokens (Tailwind excerpt)

```ts
// packages/config/tailwind.preset.ts
export default {
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        saffron: { 300:'#FCD34D', 400:'#FBBF24', 500:'#F59E0B', 600:'#D97706', 700:'#B45309' },
        gold:    { 200:'#FDE7B0', 300:'#FCD98A' },
        violet:  { 300:'#C4B5FD', 400:'#A78BFA', 500:'#7C3AED', 700:'#4C1D95' },
        magenta: { 500:'#DB2777' }, sindoor: { 600:'#B91C1C' },
        night:   { 0:'#07060F', 1:'#0D0A1C', s1:'#15112A', s2:'#1D1736', s3:'#262044' },
        ink:     { 1:'#F8F5EE', 2:'#CFC8DF', 3:'#948CAD', ongold:'#1A1325' },
      },
      fontFamily: {
        display: ['var(--font-fraunces)', 'var(--font-tiro)', 'serif'],
        sans:    ['var(--font-jakarta)', 'var(--font-mukta)', 'system-ui', 'sans-serif'],
      },
      borderRadius: { xs:'6px', sm:'10px', md:'14px', lg:'20px', xl:'28px' },
      boxShadow: {
        e1: '0 1px 0 rgba(255,255,255,.04) inset, 0 8px 24px -12px rgba(0,0,0,.6)',
        e2: '0 1px 0 rgba(255,255,255,.06) inset, 0 24px 48px -20px rgba(0,0,0,.7)',
        e3: '0 40px 80px -24px rgba(0,0,0,.8)',
        'glow-gold': '0 0 0 1px rgba(252,217,138,.35), 0 12px 40px -10px rgba(245,158,11,.55)',
        'glow-violet': '0 12px 60px -16px rgba(124,58,237,.65)',
      },
      transitionTimingFunction: { out: 'cubic-bezier(.2,.8,.2,1)' },
      keyframes: {
        shimmer: { from:{ transform:'translateX(-120%)' }, to:{ transform:'translateX(120%)' } },
        aurora:  { '0%,100%':{ transform:'translate(0,0) scale(1)' }, '50%':{ transform:'translate(4%,-3%) scale(1.08)' } },
        spin:    { to:{ transform:'rotate(360deg)' } },
      },
      animation: { shimmer:'shimmer .7s ease-out', aurora:'aurora 32s ease-in-out infinite', wheel:'spin 120s linear infinite' },
    },
  },
};
```
```css
/* globals.css */
:lang(hi) body { font-size: 17px; line-height: 1.8; }
:lang(hi) h1, :lang(hi) h2 { line-height: 1.25; letter-spacing: 0; }
@property --angle { syntax:'<angle>'; inherits:false; initial-value:0deg; }
@media (prefers-reduced-motion: reduce) { *,*::before,*::after { animation-duration:.01ms!important; transition-duration:.01ms!important; } }
```

---

## 14. Component → Ticket Map
| Component | Ticket |
|---|---|
| Tokens, fonts | AMX-010, 011 |
| Button, inputs, select, combobox, checkbox, radio, switch, selectable card, chips, tabs, stepper, modal, toast, skeleton | AMX-012 |
| Plasma, aurora, starfield, zodiac wheel, spotlight, gradient border, marquee, reveal | AMX-013 |
| Header, language toggle, mega-menu, mobile sheet, sticky CTA bar, footer, WhatsApp float | AMX-014, 021, 100 |
| Slot picker, hold timer, booking summary | AMX-076 |
| Kundali chart frame, planet table, dasha timeline | AMX-063 |
| Payment page | AMX-081 |
| Product card, enquiry modal | AMX-110–112 |
