// DRAFT — to be reviewed and approved by the client's Jyotish before launch
/**
 * AMX-205 — good periods ahead, study guidance and seva. Pure functions over the chart.
 *
 * Good periods: each upcoming antardasha (within ~12 years) is scored for a life area —
 * its lord rules the area's house (+3), is the area's natural significator (+2), sits in the
 * house (+2), and the running mahadasha lord does any of that too (+1). Lords of the 6th, 8th
 * or 12th lose points (except the Lagna lord). The best 2–3 periods (strong ones first, else
 * good ones) are shown in date order.
 */
import type { DashaPeriod, PlanetKey } from "@/lib/contracts";
import { PLANET_NAME, SIGN_LORD } from "./content/astro";
import type { Bi } from "./content/meta";

type Locale = "hi" | "en";
export type TimingArea = "career" | "marriage" | "education" | "money";

const AREA: Record<TimingArea, { houses: number[]; karakas: PlanetKey[] }> = {
  career: { houses: [10], karakas: ["sun", "saturn", "mercury"] },
  marriage: { houses: [7], karakas: ["venus", "jupiter"] },
  education: { houses: [5, 4], karakas: ["mercury", "jupiter"] },
  money: { houses: [2, 11], karakas: ["jupiter", "venus"] },
};

const signFrom = (from: number, n: number) => ((from - 1 + n - 1) % 12) + 1;

export interface Window {
  from: string; // YYYY-MM-DD
  to: string;
  lord: PlanetKey;
}

/** Best upcoming antardasha windows for an area (2–3, in date order). */
export function goodWindows(area: TimingArea, lagna: number, houseOf: (p: PlanetKey) => number, dashas: DashaPeriod[], today: string, years = 12): Window[] {
  const spec = AREA[area];
  const lords = new Set(spec.houses.map((h) => SIGN_LORD[signFrom(lagna, h)]));
  const lagnaLord = SIGN_LORD[lagna];
  const bad = new Set([6, 8, 12].map((h) => SIGN_LORD[signFrom(lagna, h)]).filter((p) => p !== lagnaLord));
  const fit = (p: PlanetKey) => (lords.has(p) ? 3 : 0) + (spec.karakas.includes(p) ? 2 : 0) + (spec.houses.includes(houseOf(p)) ? 2 : 0);
  const limit = `${Number(today.slice(0, 4)) + years}${today.slice(4)}`;

  const scored: (Window & { score: number })[] = [];
  for (const maha of dashas) {
    for (const a of maha.antardashas ?? []) {
      if (a.end <= today || a.start >= limit) continue;
      const score = fit(a.lord) + Math.min(1, fit(maha.lord)) - (bad.has(a.lord) ? 2 : 0);
      if (score >= 2) scored.push({ from: a.start > today ? a.start : today, to: a.end, lord: a.lord, score });
    }
  }
  // Prefer strong windows (score 3+); fall back to good ones (2) so there are at least two to show.
  const strong = scored.filter((x) => x.score >= 3);
  return (strong.length >= 2 ? strong : scored)
    .sort((x, y) => y.score - x.score || x.from.localeCompare(y.from))
    .slice(0, 3)
    .sort((x, y) => x.from.localeCompare(y.from));
}

const LINE: Record<TimingArea, Bi> = {
  career: { hi: "करियर शुरू करने, नौकरी बदलने या तरक्की के लिए अच्छे समय", en: "Good times to start a career, change jobs or move up" },
  marriage: { hi: "विवाह और रिश्ते के लिए शुभ समय", en: "Favourable times for marriage and commitment" },
  education: { hi: "पढ़ाई, परीक्षा और नए कोर्स के लिए अच्छे समय", en: "Good times for studies, exams and new courses" },
  money: { hi: "धन वृद्धि, निवेश और नई शुरुआत के लिए अच्छे समय", en: "Good times for money growth, investment and new ventures" },
};

const month = (iso: string, l: Locale) => new Date(`${iso}T00:00:00Z`).toLocaleDateString(l === "hi" ? "hi-IN" : "en-IN", { month: "short", year: "numeric", timeZone: "UTC" });

/** One plain sentence listing the windows, ready to append to a section (and to be read aloud). */
export function windowsSentence(area: TimingArea, w: Window[], l: Locale): string | null {
  if (!w.length) return null;
  const parts = w.map((x) => `${month(x.from, l)} – ${month(x.to, l)} (${PLANET_NAME[x.lord][l]})`);
  return `${LINE[area][l]}: ${parts.join("; ")}${l === "hi" ? "।" : "."}`;
}

// ── Study guidance ────────────────────────────────────────────────────────
const STREAM: Record<PlanetKey, Bi> = {
  sun: { hi: "चिकित्सा, प्रशासन, सरकारी सेवा, राजनीति विज्ञान", en: "medicine, administration, civil services, political science" },
  moon: { hi: "मनोविज्ञान, नर्सिंग, होटल प्रबंधन, खाद्य विज्ञान", en: "psychology, nursing, hospitality, food science" },
  mars: { hi: "इंजीनियरिंग, सर्जरी, रक्षा सेवाएँ, खेल विज्ञान", en: "engineering, surgery, defence services, sports science" },
  mercury: { hi: "कॉमर्स, सीए/फ़ाइनेंस, आईटी, डेटा, पत्रकारिता", en: "commerce, CA/finance, IT, data, journalism" },
  jupiter: { hi: "क़ानून, शिक्षण, प्रबंधन, बैंकिंग, अर्थशास्त्र", en: "law, teaching, management, banking, economics" },
  venus: { hi: "डिज़ाइन, फ़ैशन, कला, मीडिया, आर्किटेक्चर", en: "design, fashion, arts, media, architecture" },
  saturn: { hi: "सिविल/मैकेनिकल इंजीनियरिंग, शोध, कृषि, लोक प्रशासन", en: "civil/mechanical engineering, research, agriculture, public administration" },
  rahu: { hi: "नई तकनीक — AI, कंप्यूटर साइंस, साइबर सुरक्षा, विदेश अध्ययन", en: "new technology — AI, computer science, cyber security, study abroad" },
  ketu: { hi: "शोध, गणित, प्रोग्रामिंग, ज्योतिष और अध्यात्म", en: "research, mathematics, programming, astrology and spirituality" },
};

/** Two stream suggestions (from the 5th and 10th) and whether higher studies are strongly indicated. */
export function studyGuidance(lagna: number, houseOf: (p: PlanetKey) => number, l: Locale): string {
  const fifth = SIGN_LORD[signFrom(lagna, 5)];
  const tenth = SIGN_LORD[signFrom(lagna, 10)];
  const occupants = (["sun", "moon", "mars", "mercury", "jupiter", "venus", "saturn", "rahu", "ketu"] as PlanetKey[]).filter((p) => [5, 10].includes(houseOf(p)));
  const picks = [...new Set([fifth, tenth, ...occupants])].slice(0, 2);
  const ninth = SIGN_LORD[signFrom(lagna, 9)];
  const strongPlace = (p: PlanetKey) => [1, 4, 5, 7, 9, 10, 11].includes(houseOf(p));
  const higher = strongPlace(ninth) || strongPlace("jupiter");
  const streams = picks.map((p) => STREAM[p][l]).join(l === "hi" ? "; या " : "; or ");
  return l === "hi"
    ? `पढ़ाई की दिशा: आपकी कुंडली इन क्षेत्रों की ओर अच्छा झुकाव दिखाती है — ${streams}। ${higher ? "उच्च शिक्षा (मास्टर्स, विशेषज्ञता या विदेश में पढ़ाई) के योग मज़बूत हैं — इसे ज़रूर आगे बढ़ाएँ।" : "व्यावहारिक कोर्स, स्किल सर्टिफ़िकेशन और काम के साथ पढ़ाई आपके लिए ज़्यादा फलदायी रहेगी।"}`
    : `Study direction: your chart leans well towards ${streams}. ${higher ? "Higher education (a master's, specialisation or study abroad) is strongly supported — do pursue it." : "Practical courses, skill certifications and learning alongside work will pay off best for you."}`;
}

// ── Seva ───────────────────────────────────────────────────────────────────
const SEVA: Record<PlanetKey, Bi> = {
  sun: { hi: "रविवार को गेहूँ या गुड़ का दान करें और पिता/बुज़ुर्गों का आशीर्वाद लें", en: "donate wheat or jaggery on Sundays and seek elders' blessings" },
  moon: { hi: "सोमवार को दूध या चावल का दान करें, माँ और महिलाओं की सेवा करें", en: "donate milk or rice on Mondays and care for mothers and women" },
  mars: { hi: "रक्तदान करें या मंगलवार को मसूर दाल का दान करें", en: "donate blood, or red lentils on Tuesdays" },
  mercury: { hi: "बुधवार को ज़रूरतमंद बच्चों को किताबें या कॉपियाँ दें", en: "give books or notebooks to children in need on Wednesdays" },
  jupiter: { hi: "गुरुवार को गौशाला में चारा या दान दें और बच्चों को पढ़ाएँ", en: "feed cows at a gaushala on Thursdays, and help teach children" },
  venus: { hi: "शुक्रवार को बेटियों की पढ़ाई में सहयोग करें या गौशाला में दान दें", en: "support girls' education or donate to a gaushala on Fridays" },
  saturn: { hi: "शनिवार को मज़दूरों या वृद्धाश्रम में भोजन कराएँ", en: "feed labourers or an old-age home on Saturdays" },
  rahu: { hi: "आवारा कुत्तों को भोजन दें और सफ़ाई कर्मचारियों की मदद करें", en: "feed stray dogs and help sanitation workers" },
  ketu: { hi: "आवारा कुत्तों को भोजन दें और साधु-संतों/आश्रमों की सेवा करें", en: "feed stray dogs and serve ashrams or saints" },
};

/** A simple, doable seva for the running mahadasha, with gaushala seva as the always-good default. */
export function sevaSuggestion(mahaLord: PlanetKey | null, l: Locale): string {
  const main = mahaLord ? SEVA[mahaLord][l] : null;
  return l === "hi"
    ? `सेवा से कृपा: ${main ? `अभी चल रही ${PLANET_NAME[mahaLord!][l]} की दशा में — ${main}। ` : ""}साथ ही महीने में एक बार गौशाला में सेवा या दान करना हर किसी के लिए शुभ है। छोटी-सी नियमित सेवा भी मन को शांति और जीवन में शुभता लाती है।`
    : `Seva brings grace: ${main ? `in your current ${PLANET_NAME[mahaLord!][l]} period — ${main}. ` : ""}Seva or a donation at a gaushala once a month is auspicious for everyone. Even small, regular service brings peace of mind and blessings.`;
}
