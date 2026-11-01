/**
 * Bilingual transactional email templates (AMX-091) as plain strings — subject, text and HTML.
 * HTML uses the light theme (design.md §1.3), table layout and inline styles for email clients,
 * and a Devanagari-safe font stack. Every interpolated value is HTML-escaped.
 */
import { SETTINGS } from "@/content/catalog";
import { formatDateIST, formatINR, formatSlotRange } from "@/lib/format";

type Lang = "hi" | "en";
export type VisitModeValue = "ONLINE_ZOOM" | "PERSONAL_VISIT";

export interface EmailContent {
  subject: string;
  text: string;
  html: string;
}

export interface BookingDetails {
  locale: string;
  name: string;
  serviceTitle: string;
  problemTitle?: string | null;
  mode: VisitModeValue;
  slotStart: Date;
  slotEnd: Date;
  durationMin: number;
  meetingUrl?: string | null;
  /** office / site address for a personal visit */
  address?: string | null;
  mapUrl?: string | null;
  /** page where the client can see the booking */
  manageUrl?: string | null;
}

const lang = (locale: string): Lang => (locale === "en" ? "en" : "hi");

const C = {
  bg: "#FFFBF3",
  card: "#FFFFFF",
  border: "#EADFC8",
  soft: "#FBF4E6",
  text1: "#1A1325",
  text2: "#4A4358",
  text3: "#7A7189",
  gold: "#F59E0B",
  link: "#B45309",
  success: "#059669",
  warning: "#B45309",
};
const FONT = "'Mukta','Noto Sans Devanagari','Plus Jakarta Sans','Segoe UI',Arial,sans-serif";

const COPY = {
  hi: {
    brandLine: "वैदिक ज्योतिष · वास्तु · रत्न परामर्श",
    greeting: (n: string) => `नमस्ते ${n} जी,`,
    service: "सेवा",
    topic: "विषय",
    date: "दिनांक",
    time: "समय (IST)",
    duration: "अवधि",
    minutes: (m: number) => `${m} मिनट`,
    mode: "माध्यम",
    online: "ऑनलाइन (Zoom)",
    visit: "व्यक्तिगत भेंट",
    joinLink: "Zoom लिंक",
    linkSoon: "Zoom लिंक सत्र से पहले ईमेल और WhatsApp पर भेजा जाएगा।",
    address: "पता",
    map: "नक्शे में देखें",
    paid: "भुगतान प्राप्त",
    balance: "शेष राशि",
    dueBy: "अंतिम तिथि",
    viewBooking: "बुकिंग देखें",
    joinCta: "Zoom पर जुड़ें",
    footer: "यह ईमेल आपकी Marg Darshan बुकिंग से जुड़ा है। कोई प्रश्न हो तो इसी ईमेल का जवाब दें या WhatsApp करें।",
    signoff: "शुभकामनाओं सहित,\nटीम Marg Darshan",
    confirmed: {
      subject: (s: string, d: string) => `बुकिंग पक्की हुई — ${s}, ${d}`,
      heading: "आपकी बुकिंग पक्की हो गई है 🙏",
      intro: "धन्यवाद! आपका परामर्श निर्धारित हो गया है। विवरण नीचे है और कैलेंडर फ़ाइल (.ics) इस ईमेल के साथ संलग्न है।",
      partial: (bal: string, due: string) =>
        `आपका अग्रिम भुगतान मिल गया है और स्लॉट आपके लिए आरक्षित है। शेष ${bal} ${due} तक देय है — भुगतान लिंक अलग ईमेल में भेजा गया है।`,
      prepOnline: "सत्र से 5 मिनट पहले शांत जगह से जुड़ें और अपनी जन्म-तिथि, समय व स्थान पास रखें।",
      prepVisit: "कृपया समय से 10 मिनट पहले पहुँचें। वास्तु परामर्श के लिए घर/ऑफिस का नक्शा साथ लाएँ।",
      policy: (h: number) => `सत्र से ${h} घंटे पहले तक पुनर्निर्धारण निःशुल्क है; उसके बाद रद्द करने पर राशि वापस नहीं होगी।`,
    },
    reminder: {
      subject: (k: "24h" | "1h", s: string) => (k === "24h" ? `याद दिलाना: कल आपका ${s}` : `1 घंटे में शुरू: आपका ${s}`),
      heading: (k: "24h" | "1h") => (k === "24h" ? "कल आपका परामर्श है" : "आपका परामर्श 1 घंटे में शुरू होगा"),
      intro: "बस याद दिलाने के लिए — आपके सत्र का विवरण नीचे है।",
    },
    balanceMail: {
      subject: (amt: string) => `शेष भुगतान ${amt} — Marg Darshan`,
      heading: "शेष भुगतान का लिंक",
      intro: (amt: string, due: string) => `आपकी बुकिंग की शेष राशि ${amt} है। कृपया ${due} से पहले नीचे दिए सुरक्षित लिंक से भुगतान करें।`,
      cta: (amt: string) => `${amt} का भुगतान करें`,
      note: "भुगतान Razorpay द्वारा सुरक्षित है। UPI, कार्ड और नेट बैंकिंग स्वीकार्य हैं।",
    },
    cancel: {
      subject: (s: string) => `बुकिंग रद्द — ${s}`,
      heading: "आपकी बुकिंग रद्द हो गई है",
      introCancelled: "आपकी बुकिंग रद्द कर दी गई है।",
      introSlot: "क्षमा करें — भुगतान पूरा होने से पहले यह स्लॉट किसी और के लिए बुक हो गया। आपकी बुकिंग रद्द कर दी गई है।",
      refund: (amt: string) => `${amt} का रिफ़ंड शुरू कर दिया गया है; यह 5–7 कार्य-दिवसों में आपके खाते में आ जाएगा।`,
      rebook: "नया समय चुनें",
    },
    rescheduled: {
      subject: (s: string, d: string) => `नया समय तय हुआ — ${s}, ${d}`,
      heading: "आपका परामर्श नए समय पर तय हो गया है",
      intro: "आपके अनुरोध पर सत्र का समय बदल दिया गया है। नया विवरण नीचे है — पुराना समय अब मान्य नहीं है।",
      previous: "पिछला समय",
    },
    kundali: {
      subject: "आपकी मुफ्त कुंडली तैयार है ✨",
      heading: "आपकी कुंडली तैयार है",
      intro: "आपकी जन्म कुंडली, ग्रह स्थिति, दशा और दोष-योग विश्लेषण तैयार है।",
      cta: "कुंडली देखें",
      pdf: "PDF डाउनलोड करें",
      upsell: "विस्तृत विश्लेषण चाहिए? अनुभवी ज्योतिषाचार्य से परामर्श बुक करें।",
    },
  },
  en: {
    brandLine: "Vedic Astrology · Vastu · Gemstones",
    greeting: (n: string) => `Namaste ${n},`,
    service: "Service",
    topic: "Topic",
    date: "Date",
    time: "Time (IST)",
    duration: "Duration",
    minutes: (m: number) => `${m} min`,
    mode: "Mode",
    online: "Online (Zoom)",
    visit: "Personal visit",
    joinLink: "Zoom link",
    linkSoon: "Your Zoom link will be emailed and sent on WhatsApp before the session.",
    address: "Address",
    map: "Open in Maps",
    paid: "Paid",
    balance: "Balance",
    dueBy: "Due by",
    viewBooking: "View booking",
    joinCta: "Join on Zoom",
    footer: "This email is about your Marg Darshan booking. Questions? Just reply to this email or message us on WhatsApp.",
    signoff: "Warm regards,\nTeam Marg Darshan",
    confirmed: {
      subject: (s: string, d: string) => `Booking confirmed — ${s}, ${d}`,
      heading: "Your booking is confirmed 🙏",
      intro: "Thank you! Your consultation is scheduled. The details are below and a calendar file (.ics) is attached.",
      partial: (bal: string, due: string) =>
        `We've received your advance and your slot is reserved. The balance of ${bal} is due by ${due} — the payment link has been sent in a separate email.`,
      prepOnline: "Join 5 minutes early from a quiet place and keep your birth date, time and place handy.",
      prepVisit: "Please arrive 10 minutes early. For Vastu, bring the floor plan of your home or office.",
      policy: (h: number) => `Rescheduling is free up to ${h} hours before the session; later cancellations are not refundable.`,
    },
    reminder: {
      subject: (k: "24h" | "1h", s: string) => (k === "24h" ? `Reminder: your ${s} is tomorrow` : `Starting in 1 hour: your ${s}`),
      heading: (k: "24h" | "1h") => (k === "24h" ? "Your consultation is tomorrow" : "Your consultation starts in 1 hour"),
      intro: "A quick reminder — here are your session details.",
    },
    balanceMail: {
      subject: (amt: string) => `Balance payment of ${amt} — Marg Darshan`,
      heading: "Your balance payment link",
      intro: (amt: string, due: string) => `The balance for your booking is ${amt}. Please pay before ${due} using the secure link below.`,
      cta: (amt: string) => `Pay ${amt}`,
      note: "Payments are secured by Razorpay. UPI, cards and net banking are accepted.",
    },
    cancel: {
      subject: (s: string) => `Booking cancelled — ${s}`,
      heading: "Your booking has been cancelled",
      introCancelled: "Your booking has been cancelled.",
      introSlot: "We're sorry — this slot was booked by someone else before your payment completed, so the booking has been cancelled.",
      refund: (amt: string) => `A refund of ${amt} has been initiated and should reach your account in 5–7 working days.`,
      rebook: "Pick a new time",
    },
    rescheduled: {
      subject: (s: string, d: string) => `Rescheduled — ${s}, ${d}`,
      heading: "Your consultation has been rescheduled",
      intro: "As requested, your session has moved to a new time. The updated details are below — the previous time is no longer valid.",
      previous: "Previous time",
    },
    kundali: {
      subject: "Your free Kundali is ready ✨",
      heading: "Your Kundali is ready",
      intro: "Your birth chart, planetary positions, dasha periods and dosha/yoga analysis are ready.",
      cta: "View Kundali",
      pdf: "Download PDF",
      upsell: "Want a detailed reading? Book a consultation with our experienced Jyotishacharya.",
    },
  },
} as const;

export function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

export function mapsUrl(address: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
}

type Row = { label: string; value: string; href?: string };

interface LayoutInput {
  lang: Lang;
  preheader: string;
  heading: string;
  greeting: string;
  paragraphs: string[];
  rows?: Row[];
  cta?: { label: string; href: string };
  secondary?: { label: string; href: string };
  notes?: string[];
}

function render({ lang: l, preheader, heading, greeting, paragraphs, rows = [], cta, secondary, notes = [] }: LayoutInput): {
  html: string;
  text: string;
} {
  const c = COPY[l];
  const e = escapeHtml;
  const p = (s: string) => `<p style="margin:0 0 14px;font-size:16px;line-height:1.7;color:${C.text2};">${e(s)}</p>`;
  const rowHtml = rows
    .map(
      (r) =>
        `<tr><td style="padding:10px 0;border-top:1px solid ${C.border};font-size:14px;color:${C.text3};width:38%;vertical-align:top;">${e(r.label)}</td>` +
        `<td style="padding:10px 0;border-top:1px solid ${C.border};font-size:15px;color:${C.text1};font-weight:600;">${
          r.href ? `<a href="${e(r.href)}" style="color:${C.link};text-decoration:underline;">${e(r.value)}</a>` : e(r.value)
        }</td></tr>`,
    )
    .join("");
  const button = (b: { label: string; href: string }, primary: boolean) =>
    `<a href="${e(b.href)}" style="display:inline-block;margin:6px 8px 6px 0;padding:14px 26px;border-radius:999px;font-size:16px;font-weight:700;text-decoration:none;${
      primary ? `background:${C.gold};color:${C.text1};` : `border:1.5px solid ${C.link};color:${C.link};`
    }">${e(b.label)}</a>`;

  const html = `<!doctype html>
<html lang="${l}">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><title>${e(heading)}</title></head>
<body style="margin:0;padding:0;background:${C.bg};font-family:${FONT};">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${e(preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.bg};">
<tr><td align="center" style="padding:28px 12px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:${C.card};border:1px solid ${C.border};border-radius:20px;overflow:hidden;">
<tr><td style="height:6px;background:linear-gradient(135deg,#FDE7B0 0%,#F59E0B 45%,#D97706 100%);background-color:${C.gold};"></td></tr>
<tr><td style="padding:26px 28px 6px;">
<p style="margin:0;font-size:20px;font-weight:700;color:${C.text1};">✦ Marg Darshan</p>
<p style="margin:2px 0 0;font-size:13px;color:${C.text3};">${e(c.brandLine)}</p>
</td></tr>
<tr><td style="padding:18px 28px 8px;">
<h1 style="margin:0 0 16px;font-size:24px;line-height:1.35;color:${C.text1};">${e(heading)}</h1>
${p(greeting)}
${paragraphs.map(p).join("\n")}
${rows.length ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:8px 0 18px;border-bottom:1px solid ${C.border};">${rowHtml}</table>` : ""}
${cta || secondary ? `<div style="margin:6px 0 18px;">${cta ? button(cta, true) : ""}${secondary ? button(secondary, false) : ""}</div>` : ""}
${notes.map((n) => `<p style="margin:0 0 10px;padding:12px 14px;background:${C.soft};border-radius:12px;font-size:14px;line-height:1.6;color:${C.text2};">${e(n)}</p>`).join("\n")}
<p style="margin:18px 0 0;font-size:15px;line-height:1.7;color:${C.text2};white-space:pre-line;">${e(c.signoff)}</p>
</td></tr>
<tr><td style="padding:18px 28px 26px;border-top:1px solid ${C.border};font-size:12px;line-height:1.6;color:${C.text3};">${e(c.footer)}</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;

  const text = [
    heading,
    "",
    greeting,
    "",
    ...paragraphs.flatMap((s) => [s, ""]),
    ...rows.map((r) => `${r.label}: ${r.value}${r.href && r.href !== r.value ? ` (${r.href})` : ""}`),
    ...(rows.length ? [""] : []),
    ...(cta ? [`${cta.label}: ${cta.href}`] : []),
    ...(secondary ? [`${secondary.label}: ${secondary.href}`] : []),
    ...(cta || secondary ? [""] : []),
    ...notes.flatMap((n) => [n, ""]),
    c.signoff,
    "",
    "—",
    c.footer,
  ].join("\n");

  return { html, text };
}

function bookingRows(d: BookingDetails, l: Lang): Row[] {
  const c = COPY[l];
  const rows: Row[] = [{ label: c.service, value: d.serviceTitle }];
  if (d.problemTitle) rows.push({ label: c.topic, value: d.problemTitle });
  rows.push(
    { label: c.date, value: formatDateIST(d.slotStart, l, { weekday: "long", day: "numeric", month: "long", year: "numeric" }) },
    { label: c.time, value: formatSlotRange(d.slotStart, d.slotEnd, l) },
    { label: c.duration, value: c.minutes(d.durationMin) },
    { label: c.mode, value: d.mode === "ONLINE_ZOOM" ? c.online : c.visit },
  );
  if (d.mode === "ONLINE_ZOOM" && d.meetingUrl) rows.push({ label: c.joinLink, value: d.meetingUrl, href: d.meetingUrl });
  if (d.mode === "PERSONAL_VISIT" && d.address) {
    rows.push({ label: c.address, value: d.address });
    rows.push({ label: c.map, value: c.map, href: d.mapUrl ?? mapsUrl(d.address) });
  }
  return rows;
}

const shortDate = (d: Date, l: Lang) => formatDateIST(d, l, { day: "numeric", month: "short" });

export function bookingConfirmedEmail(
  d: BookingDetails & { paidInr: number; balanceInr?: number; balanceDueAt?: Date | null },
): EmailContent {
  const l = lang(d.locale);
  const c = COPY[l];
  const rows = bookingRows(d, l);
  rows.push({ label: c.paid, value: formatINR(d.paidInr, l) });
  const paragraphs: string[] = [c.confirmed.intro];
  if (d.balanceInr && d.balanceInr > 0) {
    const due = d.balanceDueAt ? formatDateIST(d.balanceDueAt, l) : formatDateIST(d.slotStart, l);
    rows.push({ label: c.balance, value: formatINR(d.balanceInr, l) });
    paragraphs.push(c.confirmed.partial(formatINR(d.balanceInr, l), due));
  }
  if (d.mode === "ONLINE_ZOOM" && !d.meetingUrl) paragraphs.push(c.linkSoon);
  const { html, text } = render({
    lang: l,
    preheader: `${d.serviceTitle} · ${formatDateIST(d.slotStart, l)} · ${formatSlotRange(d.slotStart, d.slotEnd, l)} IST`,
    heading: c.confirmed.heading,
    greeting: c.greeting(d.name),
    paragraphs,
    rows,
    cta: d.mode === "ONLINE_ZOOM" && d.meetingUrl ? { label: c.joinCta, href: d.meetingUrl } : d.manageUrl ? { label: c.viewBooking, href: d.manageUrl } : undefined,
    secondary: d.mode === "ONLINE_ZOOM" && d.meetingUrl && d.manageUrl ? { label: c.viewBooking, href: d.manageUrl } : undefined,
    notes: [d.mode === "ONLINE_ZOOM" ? c.confirmed.prepOnline : c.confirmed.prepVisit, c.confirmed.policy(SETTINGS.cancellationHours)],
  });
  return { subject: c.confirmed.subject(d.serviceTitle, shortDate(d.slotStart, l)), html, text };
}

export function reminderEmail(d: BookingDetails & { kind: "24h" | "1h" }): EmailContent {
  const l = lang(d.locale);
  const c = COPY[l];
  const { html, text } = render({
    lang: l,
    preheader: `${d.serviceTitle} · ${formatSlotRange(d.slotStart, d.slotEnd, l)} IST`,
    heading: c.reminder.heading(d.kind),
    greeting: c.greeting(d.name),
    paragraphs: [c.reminder.intro, ...(d.mode === "ONLINE_ZOOM" && !d.meetingUrl ? [c.linkSoon] : [])],
    rows: bookingRows(d, l),
    cta: d.mode === "ONLINE_ZOOM" && d.meetingUrl ? { label: c.joinCta, href: d.meetingUrl } : d.manageUrl ? { label: c.viewBooking, href: d.manageUrl } : undefined,
    notes: [d.mode === "ONLINE_ZOOM" ? c.confirmed.prepOnline : c.confirmed.prepVisit],
  });
  return { subject: c.reminder.subject(d.kind, d.serviceTitle), html, text };
}

export function balanceDueEmail(d: {
  locale: string;
  name: string;
  serviceTitle: string;
  slotStart: Date;
  slotEnd: Date;
  amountInr: number;
  payUrl: string;
  dueAt: Date;
}): EmailContent {
  const l = lang(d.locale);
  const c = COPY[l];
  const amt = formatINR(d.amountInr, l);
  const due = `${formatDateIST(d.dueAt, l)}, ${formatSlotRange(d.dueAt, d.dueAt, l).split(" – ")[0]} IST`;
  const { html, text } = render({
    lang: l,
    preheader: c.balanceMail.intro(amt, due),
    heading: c.balanceMail.heading,
    greeting: c.greeting(d.name),
    paragraphs: [c.balanceMail.intro(amt, due)],
    rows: [
      { label: c.service, value: d.serviceTitle },
      { label: c.date, value: `${formatDateIST(d.slotStart, l)} · ${formatSlotRange(d.slotStart, d.slotEnd, l)} IST` },
      { label: c.balance, value: amt },
      { label: c.dueBy, value: due },
    ],
    cta: { label: c.balanceMail.cta(amt), href: d.payUrl },
    notes: [c.balanceMail.note],
  });
  return { subject: c.balanceMail.subject(amt), html, text };
}

export function cancellationEmail(d: {
  locale: string;
  name: string;
  serviceTitle: string;
  slotStart: Date;
  slotEnd: Date;
  reason: "cancelled" | "slot_unavailable";
  refundInr?: number;
  rebookUrl?: string;
}): EmailContent {
  const l = lang(d.locale);
  const c = COPY[l];
  const paragraphs: string[] = [d.reason === "slot_unavailable" ? c.cancel.introSlot : c.cancel.introCancelled];
  if (d.refundInr && d.refundInr > 0) paragraphs.push(c.cancel.refund(formatINR(d.refundInr, l)));
  const { html, text } = render({
    lang: l,
    preheader: paragraphs[0],
    heading: c.cancel.heading,
    greeting: c.greeting(d.name),
    paragraphs,
    rows: [
      { label: c.service, value: d.serviceTitle },
      { label: c.date, value: `${formatDateIST(d.slotStart, l)} · ${formatSlotRange(d.slotStart, d.slotEnd, l)} IST` },
    ],
    cta: d.rebookUrl ? { label: c.cancel.rebook, href: d.rebookUrl } : undefined,
  });
  return { subject: c.cancel.subject(d.serviceTitle), html, text };
}

export function rescheduledEmail(d: BookingDetails & { previousStart: Date; previousEnd: Date }): EmailContent {
  const l = lang(d.locale);
  const c = COPY[l];
  const rows = bookingRows(d, l);
  rows.push({ label: c.rescheduled.previous, value: `${formatDateIST(d.previousStart, l)} · ${formatSlotRange(d.previousStart, d.previousEnd, l)} IST` });
  const { html, text } = render({
    lang: l,
    preheader: `${d.serviceTitle} · ${formatDateIST(d.slotStart, l)} · ${formatSlotRange(d.slotStart, d.slotEnd, l)} IST`,
    heading: c.rescheduled.heading,
    greeting: c.greeting(d.name),
    paragraphs: [c.rescheduled.intro, ...(d.mode === "ONLINE_ZOOM" && !d.meetingUrl ? [c.linkSoon] : [])],
    rows,
    cta: d.mode === "ONLINE_ZOOM" && d.meetingUrl ? { label: c.joinCta, href: d.meetingUrl } : d.manageUrl ? { label: c.viewBooking, href: d.manageUrl } : undefined,
    secondary: d.mode === "ONLINE_ZOOM" && d.meetingUrl && d.manageUrl ? { label: c.viewBooking, href: d.manageUrl } : undefined,
    notes: [c.confirmed.policy(SETTINGS.cancellationHours)],
  });
  return { subject: c.rescheduled.subject(d.serviceTitle, shortDate(d.slotStart, l)), html, text };
}

export function kundaliReadyEmail(d: { locale: string; name: string; kundaliUrl: string; pdfUrl?: string | null; bookUrl?: string }): EmailContent {
  const l = lang(d.locale);
  const c = COPY[l];
  const { html, text } = render({
    lang: l,
    preheader: c.kundali.intro,
    heading: c.kundali.heading,
    greeting: c.greeting(d.name),
    paragraphs: [c.kundali.intro],
    cta: { label: c.kundali.cta, href: d.kundaliUrl },
    secondary: d.pdfUrl ? { label: c.kundali.pdf, href: d.pdfUrl } : undefined,
    notes: d.bookUrl ? [`${c.kundali.upsell} ${d.bookUrl}`] : [c.kundali.upsell],
  });
  return { subject: c.kundali.subject, html, text };
}
