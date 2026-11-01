import type { OgFont } from "./font";
import { OG_FONT_FAMILY } from "./font";

/**
 * Satori draws glyphs straight from the cmap with no Indic shaping, so conjuncts, reph and the
 * ि matra come out broken. Devanagari strings are therefore rasterised by Pango/HarfBuzz through
 * sharp (already shipped with Next for image optimisation) and placed into the card as images.
 */

export const DEVANAGARI = /[ऀ-ॿ]/;

export interface TextImage {
  src: string;
  width: number;
  height: number;
}

const escapeMarkup = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export async function renderTextImage({
  text,
  font,
  sizePx,
  color,
  maxWidth,
}: {
  text: string;
  font: OgFont;
  sizePx: number;
  color: string;
  maxWidth: number;
}): Promise<TextImage | null> {
  if (!font.file) return null;
  try {
    const sharp = (await import("sharp")).default;
    const weightName = font.weight === 700 ? "Bold" : "Medium";
    const { data, info } = await sharp({
      text: {
        text: `<span foreground="${color}">${escapeMarkup(text)}</span>`,
        font: `${OG_FONT_FAMILY} ${weightName} ${sizePx}`,
        fontfile: font.file,
        dpi: 72, // 1pt = 1px
        spacing: -Math.round(sizePx * 0.25), // extra inter-line space; Mukta's default leading (~1.47) is too loose for a card
        width: maxWidth,
        wrap: "word",
        rgba: true,
      },
    })
      .png()
      .toBuffer({ resolveWithObject: true });
    return { src: `data:image/png;base64,${data.toString("base64")}`, width: info.width, height: info.height };
  } catch {
    return null;
  }
}
