import { mkdir, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

/**
 * AMX-038: Mukta (Latin + Devanagari) for share cards, fetched from Google Fonts once per process.
 * Google serves TTF to non-browser user agents — Satori cannot read WOFF2. The file is also written
 * to the OS temp dir because Pango (via sharp) loads fonts by path for the Devanagari text images.
 */

export const OG_FONT_FAMILY = "Mukta";

export interface OgFont {
  weight: 500 | 700;
  data: ArrayBuffer;
  /** Local TTF path, or null when the temp dir is not writable. */
  file: string | null;
}

// On globalThis so every OG route bundle shares one copy (each route is its own module instance in dev).
const g = globalThis as typeof globalThis & { __astromaxOgFonts?: Map<number, Promise<OgFont | null>> };
const cache = (g.__astromaxOgFonts ??= new Map());

async function fetchFont(weight: 500 | 700): Promise<OgFont | null> {
  try {
    const css = await fetch(`https://fonts.googleapis.com/css2?family=${OG_FONT_FAMILY}:wght@${weight}`, {
      cache: "force-cache",
      signal: AbortSignal.timeout(5000),
    }).then((r) => (r.ok ? r.text() : ""));
    const src = css.match(/src:\s*url\(([^)]+)\)\s*format\('(?:opentype|truetype)'\)/)?.[1];
    if (!src) return null;
    const res = await fetch(src, { cache: "force-cache", signal: AbortSignal.timeout(8000) });
    if (!res.ok) return null;
    const data = await res.arrayBuffer();
    let file: string | null = join(tmpdir(), "astromax-og", `mukta-${weight}.ttf`);
    try {
      // Never rewrite an existing copy: fontconfig keeps it open, and Windows refuses writes to it.
      const existing = await stat(file).catch(() => null);
      if (existing?.size !== data.byteLength) {
        await mkdir(join(tmpdir(), "astromax-og"), { recursive: true });
        await writeFile(file, Buffer.from(data));
      }
    } catch {
      file = null;
    }
    return { weight, data, file };
  } catch {
    return null;
  }
}

/** Resolves to null when offline / blocked; a failure is not cached so the next request retries. */
export function loadOgFont(weight: 500 | 700): Promise<OgFont | null> {
  let hit = cache.get(weight);
  if (!hit) {
    hit = fetchFont(weight).then((font) => {
      if (!font) cache.delete(weight);
      return font;
    });
    cache.set(weight, hit);
  }
  return hit;
}
