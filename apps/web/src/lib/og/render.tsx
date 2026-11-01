import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import type { Bilingual } from "@/content/catalog";
import { SITE_NAME, SITE_URL } from "@/lib/seo";
import { OG_FONT_FAMILY, loadOgFont } from "./font";
import { DEVANAGARI, type TextImage, renderTextImage } from "./text-image";

/** AMX-038: shared 1200×630 share-card renderer (design.md brand: night bg, aurora, gold title, ✦ mark). */

export const OG_SIZE = { width: 1200, height: 630 };
export const OG_CONTENT_TYPE = "image/png";

const C = {
  night: "#07060f",
  gold: "#fcd98a",
  gold200: "#fde7b0",
  saffron: "#f59e0b",
  magenta: "#db2777",
  violet: "#7c3aed",
  ink2: "#cfc8df",
  ink3: "#948cad",
};
const GRAD = `linear-gradient(90deg, ${C.saffron} 0%, ${C.magenta} 55%, ${C.violet} 100%)`;

export interface OgInput {
  locale: string;
  eyebrow: Bilingual;
  title: Bilingual;
  subtitle?: Bilingual;
  /** Public path of a local photo (e.g. /images/shop/x.jpg); falls back to brand art when unreadable. */
  photo?: string;
}

const STAR_PATH = "M50 0C54 35 65 46 100 50C65 54 54 65 50 100C46 65 35 54 0 50C35 46 46 35 50 0Z";

function StarMark({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100">
      <defs>
        <linearGradient id="star" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={C.gold200} />
          <stop offset="50%" stopColor={C.saffron} />
          <stop offset="100%" stopColor={C.magenta} />
        </linearGradient>
      </defs>
      <path d={STAR_PATH} fill="url(#star)" />
    </svg>
  );
}

/** Zodiac-ring brand art used when there is no photo. */
function BrandArt() {
  const ticks = Array.from({ length: 12 }, (_, i) => {
    const a = (i * Math.PI) / 6;
    return { x1: 200 + Math.cos(a) * 150, y1: 200 + Math.sin(a) * 150, x2: 200 + Math.cos(a) * 185, y2: 200 + Math.sin(a) * 185 };
  });
  return (
    <div style={{ display: "flex", position: "relative", width: 400, height: 400, alignItems: "center", justifyContent: "center" }}>
      <svg width={400} height={400} viewBox="0 0 400 400" style={{ position: "absolute", top: 0, left: 0 }}>
        <circle cx="200" cy="200" r="185" fill="none" stroke={C.gold} strokeOpacity="0.55" strokeWidth="2" />
        <circle cx="200" cy="200" r="150" fill="none" stroke={C.gold} strokeOpacity="0.35" strokeWidth="1.5" />
        <circle cx="200" cy="200" r="95" fill="none" stroke={C.violet} strokeOpacity="0.6" strokeWidth="1.5" />
        {ticks.map((t, i) => (
          <line key={i} x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2} stroke={C.gold} strokeOpacity="0.6" strokeWidth="2" />
        ))}
        <polygon points="200,50 330,275 70,275" fill="none" stroke={C.saffron} strokeOpacity="0.35" strokeWidth="1.5" />
        <polygon points="200,350 70,125 330,125" fill="none" stroke={C.magenta} strokeOpacity="0.35" strokeWidth="1.5" />
      </svg>
      <StarMark size={150} />
    </div>
  );
}

async function photoDataUrl(path: string | undefined): Promise<string | null> {
  if (!path || !/^\/images\/[\w/-]+\.(jpe?g|png)$/i.test(path)) return null;
  try {
    const buf = await readFile(join(process.cwd(), "public", path));
    const mime = /\.png$/i.test(path) ? "image/png" : "image/jpeg";
    return `data:${mime};base64,${buf.toString("base64")}`;
  } catch {
    return null;
  }
}

export async function renderOgImage({ locale, eyebrow, title, subtitle, photo }: OgInput): Promise<ImageResponse> {
  const host = SITE_URL.replace(/^https?:\/\//, "");
  const pickFor = (lang: "hi" | "en") => ({ eyebrow: eyebrow[lang], title: title[lang], subtitle: subtitle?.[lang] ?? "" });
  const [bold, medium, image] = await Promise.all([loadOgFont(700), loadOgFont(500), photoDataUrl(photo)]);
  const fonts = [bold, medium].flatMap((f) =>
    f ? [{ name: OG_FONT_FAMILY, data: f.data, weight: f.weight, style: "normal" as const }] : [],
  );

  let text = pickFor(locale === "en" ? "en" : "hi");
  const titleSize = (s: string) => (s.length > 42 ? 56 : s.length > 26 ? 66 : 78);
  let rendered: { eyebrow: TextImage | null; title: TextImage | null; subtitle: TextImage | null } | null = null;
  if (DEVANAGARI.test(text.eyebrow + text.title + text.subtitle)) {
    const t = text;
    const shaped = bold && medium
      ? await Promise.all([
          renderTextImage({ text: t.eyebrow, font: medium, sizePx: 24, color: C.gold, maxWidth: 640 }),
          renderTextImage({ text: t.title, font: bold, sizePx: titleSize(t.title), color: C.gold, maxWidth: 680 }),
          t.subtitle ? renderTextImage({ text: t.subtitle, font: medium, sizePx: 28, color: C.ink2, maxWidth: 680 }) : null,
        ])
      : null;
    if (shaped && shaped[0] && shaped[1] && (shaped[2] || !t.subtitle)) {
      rendered = { eyebrow: shaped[0], title: shaped[1], subtitle: shaped[2] };
    } else {
      // No font or no shaper: an English card beats broken Devanagari.
      text = pickFor("en");
    }
  }
  const fontFamily = fonts.length === 2 ? OG_FONT_FAMILY : undefined;
  const asImg = (img: TextImage) => (
    // eslint-disable-next-line @next/next/no-img-element -- Satori renders plain <img>
    <img src={img.src} width={img.width} height={img.height} alt="" />
  );

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          backgroundColor: C.night,
          backgroundImage: [
            "radial-gradient(55% 60% at 12% 18%, rgba(124,58,237,0.45), transparent 70%)",
            "radial-gradient(45% 55% at 88% 20%, rgba(245,158,11,0.28), transparent 70%)",
            "radial-gradient(60% 60% at 55% 115%, rgba(219,39,119,0.32), transparent 70%)",
          ].join(", "),
          fontFamily,
          color: C.ink2,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", flex: 1, padding: "56px 64px 64px", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <StarMark size={46} />
            <div style={{ display: "flex", fontSize: 40, fontWeight: 700, color: C.gold200, letterSpacing: -0.5 }}>{SITE_NAME}</div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", maxWidth: 680, gap: 18 }}>
            <div
              style={{
                display: "flex",
                alignSelf: "flex-start",
                padding: "6px 18px",
                borderRadius: 999,
                border: "1.5px solid rgba(252,217,138,0.45)",
                color: C.gold,
                fontSize: 24,
                fontWeight: 500,
              }}
            >
              {rendered?.eyebrow ? asImg(rendered.eyebrow) : text.eyebrow}
            </div>
            <div style={{ display: "flex", fontSize: titleSize(text.title), fontWeight: 700, color: C.gold, lineHeight: 1.12 }}>
              {rendered?.title ? asImg(rendered.title) : text.title}
            </div>
            {rendered?.subtitle ? (
              <div style={{ display: "flex" }}>{asImg(rendered.subtitle)}</div>
            ) : text.subtitle ? (
              <div style={{ display: "flex", fontSize: 28, fontWeight: 500, color: C.ink2, lineHeight: 1.4 }}>{text.subtitle}</div>
            ) : null}
          </div>

          <div style={{ display: "flex", fontSize: 22, fontWeight: 500, color: C.ink3 }}>{host}</div>
        </div>

        <div style={{ display: "flex", width: 470, alignItems: "center", justifyContent: "center", paddingRight: 48 }}>
          {image ? (
            <div style={{ display: "flex", padding: 6, borderRadius: 36, backgroundImage: GRAD }}>
              {/* eslint-disable-next-line @next/next/no-img-element -- Satori renders plain <img> */}
              <img src={image} width={400} height={400} alt="" style={{ objectFit: "cover", borderRadius: 30 }} />
            </div>
          ) : (
            <BrandArt />
          )}
        </div>

        <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 10, display: "flex", backgroundImage: GRAD }} />
      </div>
    ),
    { ...OG_SIZE, fonts: fonts.length === 2 ? fonts : undefined },
  );
}
