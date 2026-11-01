/**
 * RFC 5545 calendar file for a booking (AMX-090). Pure and dependency-free so the success
 * page can also build it in the browser for "Add to calendar".
 */

export interface IcsEvent {
  uid: string;
  start: Date;
  end: Date;
  title: string;
  description?: string;
  location?: string;
  url?: string;
  /** DTSTAMP; defaults to now */
  stamp?: Date;
  /** adds a display alarm this many minutes before start */
  alarmMinutesBefore?: number;
}

const CRLF = "\r\n";
const MAX_OCTETS = 75;
const encoder = new TextEncoder();

/** TEXT value escaping (RFC 5545 §3.3.11). */
export function escapeText(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r\n|\r|\n/g, "\\n");
}

/** UTC DATE-TIME form, e.g. 20261102T043000Z. */
export function formatUtc(d: Date): string {
  if (Number.isNaN(d.getTime())) throw new RangeError("invalid date");
  return d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

/**
 * Folds a content line at 75 octets (RFC 5545 §3.1). Splits only between code points so a
 * multi-byte UTF-8 sequence (e.g. Devanagari) is never cut; continuation lines start with a space.
 */
export function foldLine(line: string): string {
  const parts: string[] = [];
  let current = "";
  let octets = 0;
  for (const ch of line) {
    const size = encoder.encode(ch).length;
    if (octets + size > MAX_OCTETS) {
      parts.push(current);
      current = ` ${ch}`;
      octets = 1 + size;
    } else {
      current += ch;
      octets += size;
    }
  }
  parts.push(current);
  return parts.join(CRLF);
}

export function buildIcs(event: IcsEvent): string {
  const { uid, start, end, title, description, location, url, stamp = new Date(), alarmMinutesBefore } = event;
  if (!(end.getTime() > start.getTime())) throw new RangeError("event end must be after start");
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Marg Darshan//Booking//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${escapeText(uid)}`,
    `DTSTAMP:${formatUtc(stamp)}`,
    `DTSTART:${formatUtc(start)}`,
    `DTEND:${formatUtc(end)}`,
    `SUMMARY:${escapeText(title)}`,
    ...(description ? [`DESCRIPTION:${escapeText(description)}`] : []),
    ...(location ? [`LOCATION:${escapeText(location)}`] : []),
    // URL is a URI value, not TEXT: no escaping, but it must not break the line.
    ...(url ? [`URL:${url.replace(/[\r\n]/g, "")}`] : []),
    "STATUS:CONFIRMED",
    "TRANSP:OPAQUE",
    ...(alarmMinutesBefore && alarmMinutesBefore > 0
      ? ["BEGIN:VALARM", "ACTION:DISPLAY", `DESCRIPTION:${escapeText(title)}`, `TRIGGER:-PT${Math.round(alarmMinutesBefore)}M`, "END:VALARM"]
      : []),
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  return lines.map(foldLine).join(CRLF) + CRLF;
}

export function icsDataUrl(ics: string): string {
  return `data:text/calendar;charset=utf-8,${encodeURIComponent(ics)}`;
}
