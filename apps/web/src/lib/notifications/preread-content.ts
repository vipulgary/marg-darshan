/** Jyotish pre-read email body (AMX-090). Pure: no DB, so it can be unit-tested. English only. */
import { escapeHtml, type EmailContent } from "./templates";

export interface PreReadData {
  appointmentId: string;
  reminder?: boolean;
  client: { name: string; email?: string | null; phone?: string | null; lang: string };
  serviceTitle: string;
  problemTitle: string;
  question?: string | null;
  mode: "ONLINE_ZOOM" | "PERSONAL_VISIT";
  slotStart: Date;
  slotEnd: Date;
  meetingUrl?: string | null;
  birth?: {
    name?: string | null;
    gender?: string | null;
    dob?: Date | null;
    tob?: Date | null;
    isTimeUnknown: boolean;
    isDateUnknown: boolean;
    approxWindowStart?: Date | null;
    approxWindowEnd?: Date | null;
    place: string;
    tzName: string;
  } | null;
  lifeEvents?: unknown;
  vastuProperty?: unknown;
  vastuMapUrl?: string | null;
  kundaliUrl?: string | null;
  kundaliPdfUrl?: string | null;
  adminUrl: string;
}

const IST: Intl.DateTimeFormatOptions = { timeZone: "Asia/Kolkata", dateStyle: "medium", timeStyle: "short" };
const fmtSlot = (s: Date, e: Date) =>
  `${s.toLocaleString("en-IN", IST)} - ${e.toLocaleTimeString("en-IN", { timeZone: "Asia/Kolkata", timeStyle: "short" })} IST`;
// @db.Date / @db.Time(0) columns come back as UTC-anchored Dates.
const isoDate = (d: Date) => d.toISOString().slice(0, 10);
const isoTime = (d: Date) => d.toISOString().slice(11, 16);

/** Flattens arbitrary JSON (life events, Vastu property) into readable "key: value" lines. */
export function describeJson(value: unknown, prefix = ""): string[] {
  if (value === null || value === undefined || value === "") return [];
  if (Array.isArray(value)) {
    return value.flatMap((v, i) =>
      typeof v === "object" && v !== null ? describeJson(v, `${prefix}${i + 1}. `) : [`${prefix}${i + 1}. ${String(v)}`],
    );
  }
  if (typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>).filter(([, v]) => v !== null && v !== undefined && v !== "");
    if (!entries.length) return [];
    const flat = entries.every(([, v]) => typeof v !== "object");
    if (flat) return [`${prefix}${entries.map(([k, v]) => `${k}: ${String(v)}`).join(", ")}`];
    return entries.flatMap(([k, v]) => (typeof v === "object" ? describeJson(v, `${prefix}${k} > `) : [`${prefix}${k}: ${String(v)}`]));
  }
  return [`${prefix}${String(value)}`];
}

function birthLines(b: NonNullable<PreReadData["birth"]>): [string, string][] {
  const time = b.isTimeUnknown
    ? b.approxWindowStart && b.approxWindowEnd
      ? `unknown (approx. ${isoTime(b.approxWindowStart)}-${isoTime(b.approxWindowEnd)})`
      : "unknown"
    : b.tob ? isoTime(b.tob) : "-";
  return [
    ["Name", b.name ?? "-"],
    ["Gender", b.gender ?? "-"],
    ["Date of birth", b.isDateUnknown ? "unknown" : b.dob ? isoDate(b.dob) : "-"],
    ["Time of birth", time],
    ["Place", `${b.place} (${b.tzName})`],
  ];
}

export function jyotishPreReadEmail(d: PreReadData): EmailContent {
  const sections: { title: string; rows: [string, string, string?][] }[] = [
    {
      title: "Session",
      rows: [
        ["Service", d.serviceTitle],
        ["Problem", d.problemTitle],
        ["Mode", d.mode === "ONLINE_ZOOM" ? "Online (Zoom)" : "Personal visit"],
        ["Slot", fmtSlot(d.slotStart, d.slotEnd)],
        ...(d.meetingUrl ? [["Meeting", d.meetingUrl, d.meetingUrl] as [string, string, string]] : []),
      ],
    },
    {
      title: "Client",
      rows: [
        ["Name", d.client.name],
        ["Email", d.client.email ?? "-"],
        ["WhatsApp", d.client.phone ?? "-"],
        ["Language", d.client.lang === "en" ? "English" : "Hindi"],
      ],
    },
  ];
  if (d.birth) sections.push({ title: "Birth details", rows: birthLines(d.birth) });
  const events = describeJson(d.lifeEvents);
  if (events.length) sections.push({ title: "Life events", rows: events.map((e) => ["", e]) });
  const property = describeJson(d.vastuProperty);
  if (property.length || d.vastuMapUrl) {
    sections.push({
      title: "Vastu property",
      rows: [
        ...property.map((p): [string, string] => ["", p]),
        ...(d.vastuMapUrl ? [["Floor plan", d.vastuMapUrl, d.vastuMapUrl] as [string, string, string]] : []),
      ],
    });
  }
  const links: [string, string, string?][] = [];
  if (d.kundaliUrl) links.push(["Kundali", d.kundaliUrl, d.kundaliUrl]);
  if (d.kundaliPdfUrl) links.push(["Kundali PDF", d.kundaliPdfUrl, d.kundaliPdfUrl]);
  links.push(["Admin", d.adminUrl, d.adminUrl]);
  sections.push({ title: "Links", rows: links });

  const question = d.question?.trim();
  const heading = `${d.reminder ? "Starting soon" : "New booking"}: ${d.client.name}`;
  const subject = `${d.reminder ? "[2h] " : ""}Pre-read: ${d.client.name} - ${d.serviceTitle}, ${d.slotStart.toLocaleString("en-IN", IST)} IST`;

  const text = [
    heading,
    "",
    ...(question ? ["Question:", question, ""] : []),
    ...sections.flatMap((s) => [`== ${s.title} ==`, ...s.rows.map(([k, v]) => (k ? `${k}: ${v}` : `- ${v}`)), ""]),
  ].join("\n");

  const cell = (v: string, href?: string) => (href ? `<a href="${escapeHtml(href)}">${escapeHtml(v)}</a>` : escapeHtml(v));
  const html = [
    `<div style="font-family:Arial,sans-serif;font-size:14px;color:#1f1a2e;max-width:640px">`,
    `<h2 style="margin:0 0 12px">${escapeHtml(heading)}</h2>`,
    question
      ? `<p style="background:#FFF4DC;padding:12px;border-radius:8px;white-space:pre-wrap"><strong>Question:</strong><br>${escapeHtml(question)}</p>`
      : "",
    ...sections.map(
      (s) =>
        `<h3 style="margin:16px 0 6px">${escapeHtml(s.title)}</h3><table cellpadding="4" style="border-collapse:collapse">` +
        s.rows
          .map(([k, v, href]) =>
            k
              ? `<tr><td style="color:#6b6480;vertical-align:top">${escapeHtml(k)}</td><td>${cell(v, href)}</td></tr>`
              : `<tr><td colspan="2">&bull; ${cell(v, href)}</td></tr>`,
          )
          .join("") +
        `</table>`,
    ),
    `</div>`,
  ].join("");

  return { subject, text, html };
}
