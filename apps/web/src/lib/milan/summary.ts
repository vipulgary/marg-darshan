// DRAFT — wording to be reviewed by the client's Jyotish
/**
 * A 7–8 sentence plain-language read of a couple (AMX-206): overall score, how their minds,
 * attraction, family life and health line up, how their natures combine, the doshas, and
 * what to do next. Built only from the match result and both charts — nothing invented.
 */
import type { MatchResult } from "@/lib/engine/client";

type L = "hi" | "en";
const ELEMENT = ["fire", "earth", "air", "water"] as const;
type Element = (typeof ELEMENT)[number];

const NATURE: Record<Element, [string, string]> = {
  fire: ["आत्मविश्वासी और पहल करने वाले", "confident and quick to take the lead"],
  earth: ["व्यावहारिक, स्थिर और भरोसेमंद", "practical, steady and dependable"],
  air: ["मिलनसार, विचारशील और संतुलित", "sociable, thoughtful and balanced"],
  water: ["भावुक, संवेदनशील और परवाह करने वाले", "warm, sensitive and caring"],
};

const pct = (r: MatchResult, keys: string[]) => {
  const ks = r.koots.filter((k) => keys.includes(k.key));
  const max = ks.reduce((n, k) => n + k.max, 0);
  return max ? ks.reduce((n, k) => n + k.score, 0) / max : 0;
};
const level = (p: number, l: L) => (p >= 0.7 ? (l === "hi" ? "बहुत अच्छा" : "very good") : p >= 0.4 ? (l === "hi" ? "ठीक-ठाक" : "fair") : l === "hi" ? "कमज़ोर" : "weak");

export function coupleSummary(r: MatchResult, l: L): string[] {
  const hi = l === "hi";
  const b = r.boy.name;
  const g = r.girl.name;
  const total = r.certainty && !r.certainty.exact ? `${hi ? "लगभग " : "about "}${r.total}` : `${r.total}`;
  const lines: string[] = [];

  lines.push(
    hi
      ? `${b} और ${g} के 36 में से ${total} गुण मिलते हैं — ${r.total >= 28 ? "यह बहुत उत्तम मेल है" : r.total >= 18 ? "यह विवाह के लिए अच्छा, स्वीकार्य मेल है" : "यह मेल कमज़ोर है, निर्णय से पहले गहराई से विचार ज़रूरी है"}।`
      : `${b} and ${g} match ${total} of 36 gunas — ${r.total >= 28 ? "an excellent match" : r.total >= 18 ? "a good, workable match for marriage" : "a weak match that needs careful thought before deciding"}.`,
  );

  const mind = pct(r, ["maitri", "gana"]);
  const love = pct(r, ["yoni", "vashya"]);
  const family = pct(r, ["bhakoot"]);
  const health = pct(r, ["nadi", "tara"]);
  lines.push(
    hi
      ? `मन और स्वभाव का तालमेल ${level(mind, l)} है, और आपसी आकर्षण व अपनापन ${level(love, l)} है।`
      : `Their mental and temperamental harmony is ${level(mind, l)}, and mutual attraction and closeness is ${level(love, l)}.`,
  );
  lines.push(
    hi
      ? `परिवार, प्रेम और धन-समृद्धि का पक्ष ${level(family, l)} है, जबकि स्वास्थ्य और संतान का पक्ष ${level(health, l)} है।`
      : `Family, love and prosperity look ${level(family, l)}, while health and children look ${level(health, l)}.`,
  );

  const bs = r.charts?.boy?.ascendant?.sign;
  const gs = r.charts?.girl?.ascendant?.sign;
  if (bs && gs) {
    const be = ELEMENT[(bs - 1) % 4];
    const ge = ELEMENT[(gs - 1) % 4];
    const fit = be === ge ? (hi ? "दोनों का स्वभाव एक जैसा है, इसलिए एक-दूसरे को जल्दी समझेंगे" : "their natures are alike, so they'll understand each other quickly")
      : [be, ge].sort().join() === "air,fire" || [be, ge].sort().join() === "earth,water" ? (hi ? "दोनों का स्वभाव एक-दूसरे का पूरक है — एक की कमी दूसरा पूरी करेगा" : "their natures complement each other — each fills the other's gaps")
      : hi ? "दोनों का स्वभाव अलग है — धैर्य और खुली बातचीत से यह अंतर ताक़त बन सकता है" : "their natures differ — patience and open talk can turn that into a strength";
    lines.push(
      hi
        ? `${b} स्वभाव से ${NATURE[be][0]} हैं और ${g} ${NATURE[ge][0]}; ${fit}।`
        : `${b} is by nature ${NATURE[be][1]} and ${g} ${NATURE[ge][1]}; ${fit}.`,
    );
  }

  const issues: string[] = [];
  if (r.nadi_dosha.present && !r.nadi_dosha.cancelled) issues.push(hi ? "नाड़ी दोष" : "Nadi dosha");
  if (r.bhakoot_dosha.present && !r.bhakoot_dosha.cancelled) issues.push(hi ? "भकूट दोष" : "Bhakoot dosha");
  lines.push(
    issues.length
      ? hi ? `${issues.join(" और ")} है — इसका उपाय और किसी अनुभवी ज्योतिषाचार्य की सलाह ज़रूर लें।` : `${issues.join(" and ")} is present — do get its remedy and an experienced Jyotish's advice.`
      : hi ? "कोई बड़ा मिलान-दोष नहीं है, या जो है वह शास्त्रीय नियम से निरस्त हो जाता है।" : "There is no major matching dosha, or it is cancelled by classical rules.",
  );
  lines.push(
    r.manglik === "unknown"
      ? hi ? "मांगलिक जाँच के लिए दोनों का सटीक जन्म समय ज़रूरी है।" : "An exact birth time for both is needed to check Manglik."
      : r.manglik === "none" ? (hi ? "दोनों में से कोई मांगलिक नहीं है।" : "Neither is Manglik.")
      : r.manglik === "both" ? (hi ? "दोनों मांगलिक हैं, इसलिए यह दोष आपस में संतुलित हो जाता है।" : "Both are Manglik, so it balances out between them.")
      : hi ? "केवल एक पक्ष मांगलिक है — विवाह से पहले उपाय की सलाह लें।" : "Only one is Manglik — take advice on a remedy before marriage.",
  );

  const next = r.vivah_muhurats?.[0];
  lines.push(
    r.total >= 18
      ? hi
        ? `कुल मिलाकर यह रिश्ता आगे बढ़ाने योग्य है${next ? ` — अगला शुभ विवाह मुहूर्त ${new Date(`${next.date}T00:00:00Z`).toLocaleDateString("hi-IN", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" })} को है` : ""}।`
        : `Overall this relationship is worth taking forward${next ? ` — the next auspicious wedding date is ${new Date(`${next.date}T00:00:00Z`).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" })}` : ""}.`
      : hi ? "आगे बढ़ने से पहले दोनों परिवार किसी अनुभवी ज्योतिषाचार्य से विस्तार में कुंडली दिखवाएँ।" : "Before going ahead, both families should have the charts studied in detail by an experienced Jyotish.",
  );
  if (r.certainty && !r.certainty.exact) {
    lines.push(hi ? `जन्म समय न होने से गुण ${r.certainty.min} से ${r.certainty.max} के बीच हो सकते हैं — सटीक समय मिलने पर नतीजा पक्का होगा।` : `Without a birth time the score may be ${r.certainty.min}–${r.certainty.max}; an exact time makes it certain.`);
  }
  return lines;
}
