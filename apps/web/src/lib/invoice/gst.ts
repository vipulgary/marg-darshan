/**
 * GST maths for consultation invoices (AMX-085). Consumer prices are GST-inclusive.
 * Astrology/Vastu consultations: SAC 999799 ("other services n.e.c."), 18%.
 * Intra-state supply → CGST 9% + SGST 9%; inter-state → IGST 18%.
 * All amounts are integer paise to avoid float drift.
 */

export const SAC_CONSULTING = "999799";
export const GST_RATE_BPS = 1800; // 18.00% in basis points

export interface GstBreakdown {
  totalPaise: number;
  taxablePaise: number;
  cgstPaise: number;
  sgstPaise: number;
  igstPaise: number;
  rateBps: number;
  interState: boolean;
}

export const rupeesToPaise = (inr: number) => Math.round(inr * 100);

/**
 * Split a GST-inclusive total. Taxable value is rounded to the paisa; tax is the
 * remainder so taxable + tax always equals the amount actually paid.
 */
export function splitInclusive(
  totalPaise: number,
  opts: { registered: boolean; supplierState: string; placeOfSupply?: string; rateBps?: number },
): GstBreakdown {
  if (!Number.isInteger(totalPaise) || totalPaise < 0) throw new RangeError("totalPaise must be a non-negative integer");
  const rateBps = opts.rateBps ?? GST_RATE_BPS;
  const interState = Boolean(opts.placeOfSupply && opts.placeOfSupply !== opts.supplierState);
  if (!opts.registered || rateBps === 0) {
    return { totalPaise, taxablePaise: totalPaise, cgstPaise: 0, sgstPaise: 0, igstPaise: 0, rateBps: 0, interState };
  }
  const taxablePaise = Math.round((totalPaise * 10_000) / (10_000 + rateBps));
  const tax = totalPaise - taxablePaise;
  if (interState) return { totalPaise, taxablePaise, cgstPaise: 0, sgstPaise: 0, igstPaise: tax, rateBps, interState };
  const cgstPaise = Math.floor(tax / 2);
  return { totalPaise, taxablePaise, cgstPaise, sgstPaise: tax - cgstPaise, igstPaise: 0, rateBps, interState };
}

/** Indian financial year label for a date in IST, e.g. 2027-01-15 → "2026-27". */
export function financialYear(date: Date): string {
  const ist = new Date(date.getTime() + 5.5 * 3600 * 1000);
  const y = ist.getUTCFullYear();
  const start = ist.getUTCMonth() >= 3 ? y : y - 1; // April = month 3
  return `${start}-${String((start + 1) % 100).padStart(2, "0")}`;
}

export function formatInvoiceNumber(fy: string, seq: number, prefix = "AMX"): string {
  return `${prefix}/${fy}/${String(seq).padStart(5, "0")}`;
}

/** Amount in words (Indian system) for the invoice footer. */
export function inrInWords(paise: number): string {
  const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve",
    "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
  const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
  const two = (n: number) => (n < 20 ? ones[n] : `${tens[Math.floor(n / 10)]}${n % 10 ? ` ${ones[n % 10]}` : ""}`);
  const three = (n: number) =>
    n >= 100 ? `${ones[Math.floor(n / 100)]} Hundred${n % 100 ? ` ${two(n % 100)}` : ""}` : two(n);

  const words = (n: number): string => {
    if (n === 0) return "Zero";
    const parts: string[] = [];
    const crore = Math.floor(n / 1e7);
    const lakh = Math.floor((n % 1e7) / 1e5);
    const thousand = Math.floor((n % 1e5) / 1e3);
    const rest = n % 1e3;
    if (crore) parts.push(`${words(crore)} Crore`);
    if (lakh) parts.push(`${two(lakh)} Lakh`);
    if (thousand) parts.push(`${two(thousand)} Thousand`);
    if (rest) parts.push(three(rest));
    return parts.join(" ");
  };

  const rupees = Math.floor(paise / 100);
  const p = paise % 100;
  return `Rupees ${words(rupees)}${p ? ` and ${two(p)} Paise` : ""} Only`;
}
