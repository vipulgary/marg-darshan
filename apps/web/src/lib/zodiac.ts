import { SIGN_NAMES } from "@/lib/kundali/chart-layout";

/** Zodiac glyphs ♈…♓ (text presentation, never emoji), indexed by sign 1..12. */
export const ZODIAC_GLYPH = ["♈︎", "♉︎", "♊︎", "♋︎", "♌︎", "♍︎", "♎︎", "♏︎", "♐︎", "♑︎", "♒︎", "♓︎"];

/** "♌︎ Leo" from a sign number and its display name. */
export const withGlyph = (sign: number, name: string) => `${ZODIAC_GLYPH[(sign - 1 + 12) % 12]} ${name}`;

/** Same, when only the (English or Hindi) sign name is known. Unknown names pass through. */
export function glyphName(name: string): string {
  const i = Math.max(SIGN_NAMES.en.indexOf(name), SIGN_NAMES.hi.indexOf(name));
  return i < 0 ? name : withGlyph(i + 1, name);
}
