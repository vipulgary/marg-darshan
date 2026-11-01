/**
 * AMX-160 — serialise a rendered chart <svg> into a standalone file: computed
 * fill/stroke/font are inlined (Tailwind classes don't travel), a background rect
 * and a system-font fallback are added. Browser-only (uses getComputedStyle).
 */
const PROPS = ["fill", "stroke", "stroke-width", "font-family", "font-size", "font-weight", "text-decoration", "opacity"] as const;
const FONT_FALLBACK = '"Noto Sans Devanagari", Mukta, "Segoe UI", Arial, sans-serif';

export function serializeChartSvg(svg: SVGSVGElement, background = "#0B0B1A"): string {
  const clone = svg.cloneNode(true) as SVGSVGElement;
  const src = [svg, ...Array.from(svg.querySelectorAll("*"))];
  const dst = [clone, ...Array.from(clone.querySelectorAll("*"))];
  src.forEach((el, i) => {
    const cs = getComputedStyle(el);
    const out = dst[i];
    const style = PROPS.map((p) => {
      const v = cs.getPropertyValue(p);
      return v ? `${p}:${p === "font-family" ? `${v}, ${FONT_FALLBACK}` : v}` : "";
    })
      .filter(Boolean)
      .join(";");
    out.setAttribute("style", style);
    out.removeAttribute("class");
  });
  clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  clone.setAttribute("width", "800");
  clone.setAttribute("height", "800");
  const bg = document.createElementNS("http://www.w3.org/2000/svg", "rect");
  bg.setAttribute("width", "100%");
  bg.setAttribute("height", "100%");
  bg.setAttribute("fill", background);
  clone.insertBefore(bg, clone.firstChild);
  return `<?xml version="1.0" encoding="UTF-8"?>\n${new XMLSerializer().serializeToString(clone)}`;
}

export function downloadSvg(svg: SVGSVGElement, filename: string, background?: string): void {
  const blob = new Blob([serializeChartSvg(svg, background)], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.endsWith(".svg") ? filename : `${filename}.svg`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** "Rahul Sharma", "d9", "north" → "rahul-sharma-d9-north.svg" */
export function chartFilename(name: string, division: string, style: string): string {
  const slug =
    name
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[^\p{L}\p{N}]+/gu, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40) || "kundali";
  return `${slug}-${division}-${style}.svg`;
}
