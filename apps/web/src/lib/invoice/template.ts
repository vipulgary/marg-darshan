import { inrInWords } from "./gst";
import type { InvoiceBreakdown } from "./issue";

export interface InvoiceView {
  number: string;
  issuedAt: Date;
  totalPaise: number;
  taxablePaise: number;
  cgstPaise: number;
  sgstPaise: number;
  igstPaise: number;
  breakdown: InvoiceBreakdown;
}

const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

const money = (paise: number) =>
  `₹${(paise / 100).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

/** Printable tax invoice (HTML, light theme). PDF rendering reuses this markup (AMX-085). */
export function invoiceHtml(inv: InvoiceView): string {
  const { seller, buyer, items } = inv.breakdown;
  const registered = seller.registered && Boolean(seller.gstin);
  const title = registered ? "Tax Invoice / कर बीजक" : "Invoice / बिल";
  const date = inv.issuedAt.toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata", day: "2-digit", month: "short", year: "numeric" });
  const rows = items
    .map(
      (it, i) => `<tr><td>${i + 1}</td><td>${esc(it.description)}</td><td>${esc(it.sac)}</td><td class="r">${it.quantity}</td><td class="r">${money(it.amountPaise)}</td></tr>`,
    )
    .join("");
  const taxRows = !registered
    ? ""
    : inv.igstPaise
      ? `<tr><td>IGST @ 18%</td><td class="r">${money(inv.igstPaise)}</td></tr>`
      : `<tr><td>CGST @ 9%</td><td class="r">${money(inv.cgstPaise)}</td></tr><tr><td>SGST @ 9%</td><td class="r">${money(inv.sgstPaise)}</td></tr>`;

  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><title>${esc(inv.number)}</title>
<style>
  body{font-family:"Plus Jakarta Sans","Mukta","Noto Sans Devanagari",system-ui,sans-serif;color:#1a1325;background:#fffbf3;margin:0;padding:32px}
  .sheet{max-width:760px;margin:0 auto;background:#fff;border:1px solid #eadfc8;border-radius:14px;padding:32px}
  h1{font-size:22px;margin:0 0 4px} .muted{color:#7a7189;font-size:13px}
  .head{display:flex;justify-content:space-between;gap:24px;border-bottom:2px solid #f59e0b;padding-bottom:16px;margin-bottom:16px}
  .grid{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:20px;font-size:14px}
  table{width:100%;border-collapse:collapse;font-size:14px} th,td{padding:8px;border-bottom:1px solid #f1e9d8;text-align:left}
  th{background:#faf6ee;font-size:12px;text-transform:uppercase;letter-spacing:.04em;color:#4a4358} .r{text-align:right}
  .totals{width:320px;margin-left:auto;margin-top:12px} .totals tr:last-child td{font-weight:700;font-size:16px;border-top:2px solid #1a1325}
  .words{margin-top:12px;font-size:13px} footer{margin-top:24px;font-size:12px;color:#7a7189}
  @media print{body{background:#fff;padding:0}.sheet{border:0}}
</style></head>
<body><div class="sheet">
  <div class="head">
    <div><h1>${esc(seller.name)}</h1><div class="muted">${esc(seller.address)}</div>${registered ? `<div class="muted">GSTIN: ${esc(seller.gstin)}</div>` : ""}</div>
    <div style="text-align:right"><h1>${title}</h1><div class="muted">No. ${esc(inv.number)}</div><div class="muted">Date: ${date}</div></div>
  </div>
  <div class="grid">
    <div><strong>Billed to / ग्राहक</strong><br>${esc(buyer.name)}<br>${esc(buyer.email ?? "")}<br>${esc(buyer.phone ?? "")}</div>
    <div><strong>Place of supply</strong><br>State code ${esc(inv.breakdown.placeOfSupply)}${inv.breakdown.razorpayPaymentId ? `<br><span class="muted">Payment ref: ${esc(inv.breakdown.razorpayPaymentId)}</span>` : ""}</div>
  </div>
  <table><thead><tr><th>#</th><th>Description</th><th>SAC</th><th class="r">Qty</th><th class="r">Amount</th></tr></thead><tbody>${rows}</tbody></table>
  <table class="totals"><tbody>
    ${registered ? `<tr><td>Taxable value</td><td class="r">${money(inv.taxablePaise)}</td></tr>` : ""}
    ${taxRows}
    <tr><td>Total (paid)</td><td class="r">${money(inv.totalPaise)}</td></tr>
  </tbody></table>
  <p class="words">${inrInWords(inv.totalPaise)}</p>
  <footer>${registered ? "Prices are inclusive of GST." : "Supplier not registered under GST; no tax charged."} This is a computer-generated invoice and needs no signature.</footer>
</div></body></html>`;
}
