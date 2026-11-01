/**
 * Indian mobile numbers: 10 digits starting 6–9, optionally prefixed with +91, 91 or 0.
 * Stored in E.164 ("+919876543210") so WhatsApp links and lookups match.
 */
export function normalizeIndianMobile(input: string): string | null {
  const compact = input.replace(/[\s\-().]/g, "");
  const m = /^(?:\+?91|0)?([6-9]\d{9})$/.exec(compact);
  return m ? `+91${m[1]}` : null;
}

export const isIndianMobile = (input: string) => normalizeIndianMobile(input) !== null;

/** Loose but practical email check shared by client forms (server uses zod's z.email()). */
export const looksLikeEmail = (input: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(input.trim());
