/**
 * Rebuild readable lines from PDF text items (AMX-206). Designer tools (Canva etc.) split words
 * into pieces and place two columns side by side, so we:
 *  - group items into rows by baseline, then split a row into segments at big horizontal gaps;
 *  - glue pieces that touch (no stray spaces inside Hindi words), add a space at small gaps;
 *  - read the left column top-to-bottom, then the right column;
 *  - report the biggest-font text (the name heading on most biodatas) as `headline`.
 */
export interface PdfItem {
  str: string;
  x: number;
  y: number;
  w: number;
  h: number; // font size
}

interface Segment {
  x: number;
  y: number;
  h: number;
  text: string;
}

export function pdfLines(items: PdfItem[], pageWidth: number): { lines: string[]; headline: string | null } {
  const visible = items.filter((i) => i.str.trim());
  const rows = new Map<number, PdfItem[]>();
  for (const it of visible) {
    const key = [...rows.keys()].find((y) => Math.abs(y - it.y) <= Math.max(2, it.h * 0.35)) ?? it.y;
    rows.set(key, [...(rows.get(key) ?? []), it]);
  }

  const segments: Segment[] = [];
  for (const [y, row] of rows) {
    row.sort((a, b) => a.x - b.x);
    let seg: Segment | null = null;
    let end = -Infinity;
    for (const it of row) {
      const gap = it.x - end;
      if (!seg || gap > Math.max(32, it.h * 2.5)) {
        if (seg) segments.push(seg);
        seg = { x: it.x, y, h: it.h, text: it.str };
      } else {
        seg.text += gap > it.h * 0.15 ? ` ${it.str}` : it.str;
        seg.h = Math.max(seg.h, it.h);
      }
      end = it.x + it.w;
    }
    if (seg) segments.push(seg);
  }

  // Two-column layouts: a segment starting in the left ~45% belongs to the left column.
  const split = pageWidth * 0.45;
  const byY = (a: Segment, b: Segment) => b.y - a.y || a.x - b.x;
  const left = segments.filter((s) => s.x < split).sort(byY);
  const right = segments.filter((s) => s.x >= split).sort(byY);
  const twoCol = left.length > 3 && right.length > 3;
  const ordered = twoCol ? [...left, ...right] : segments.sort(byY);

  const maxH = Math.max(0, ...segments.map((s) => s.h));
  const big = segments.filter((s) => s.h >= maxH * 0.85 && /\p{L}{2}/u.test(s.text)).sort(byY);
  const headline = big.length ? big.map((s) => s.text.trim()).join(" ").replace(/\s+/g, " ") : null;

  return { lines: ordered.map((s) => s.text.replace(/\s+/g, " ").trim()), headline };
}
