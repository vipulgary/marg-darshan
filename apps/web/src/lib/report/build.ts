/**
 * Phalit (interpretive) kundali report (AMX-180/181/200). Pure: ChartData → structured report in one
 * locale. All text comes from ./content (DRAFT until the client's Jyotish approves it).
 */
import { withGlyph } from "@/lib/zodiac";
import { type ChartData, type DashaPeriod, PLANET_ORDER, type PlanetKey } from "@/lib/contracts";
import { ENEMIES, EXALTATION, FRIENDS, HOUSE_NAME, OWN_SIGNS, PLANET_NAME, SIGN_LORD, SIGN_NAMES } from "./content/astro";
import { DASHA } from "./content/dasha";
import { EDUCATION } from "./content/education";
import { LAGNA } from "./content/lagna";
import { type Bi, DISCLAIMER, GEM_NOTE, REPORT_REVIEWED } from "./content/meta";
import { NAKSHATRA } from "./content/nakshatra";
import { DIGNITY_NOTE, PLANET_IN_HOUSE } from "./content/planets";
import { RASHI } from "./content/rashi";
import { type AreaKey, predictArea } from "./predict";
import { DOSHA_GENERIC_REMEDY, DOSHA_REMEDIES, PLANET_LORE } from "./content/remedies";
import { sadeSatiTimeline } from "./sade-sati";
export type { SadeSatiCycle, SadeSatiRow } from "./sade-sati";

export type Locale = "hi" | "en";
export type Dignity = "exalted" | "debilitated" | "own" | "friend" | "enemy" | "neutral";

const pick = (b: Bi, l: Locale) => b[l];
const signName = (sign: number, l: Locale) => withGlyph(sign, SIGN_NAMES[(sign - 1 + 12) % 12][l]);
/** Sign index (1..12) counted `n` houses from `from` (1 = same sign). */
export const signFrom = (from: number, n: number) => ((from - 1 + n - 1) % 12) + 1;

export function dignity(planet: PlanetKey, sign: number): Dignity {
  const ex = EXALTATION[planet];
  if (sign === ex) return "exalted";
  if (sign === ((ex + 5) % 12) + 1) return "debilitated";
  if (OWN_SIGNS[planet].includes(sign)) return "own";
  if (planet === "rahu" || planet === "ketu") return "neutral";
  const lord = SIGN_LORD[sign];
  if (FRIENDS[planet].includes(lord)) return "friend";
  if (ENEMIES[planet].includes(lord)) return "enemy";
  return "neutral";
}

/**
 * Lucky gemstone rule (documented for the Jyotish's review): primary = Lagna lord's gem;
 * alternate = 9th lord's gem, else 5th lord's — only when that trikona lord is a different planet
 * and not a natural enemy of the Lagna lord. Rahu/Ketu gems are never suggested automatically.
 */
export function luckyGems(lagnaSign: number): { primary: PlanetKey; alternate: PlanetKey | null } {
  const primary = SIGN_LORD[lagnaSign];
  for (const house of [9, 5]) {
    const lord = SIGN_LORD[signFrom(lagnaSign, house)];
    if (lord !== primary && !ENEMIES[primary].includes(lord) && !ENEMIES[lord].includes(primary)) return { primary, alternate: lord };
  }
  return { primary, alternate: null };
}

const fmtDate = (iso: string, l: Locale) =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString(l === "hi" ? "hi-IN" : "en-IN", { year: "numeric", month: "short", timeZone: "UTC" });

/** Temperament by Lagna element (fire, earth, air, water) — how the person comes across. */
const TEMPERAMENT: Bi[] = [
  { hi: "स्वभाव से आप आत्मविश्वासी और स्पष्ट हैं; लोग आपको नेतृत्व करने वाला मानते हैं। कभी-कभी यह आत्मविश्वास अहंकार जैसा दिख सकता है, इसलिए विनम्रता आपके व्यक्तित्व को और भी आकर्षक बनाती है।", en: "By temperament you are confident and direct, and people see you as a natural leader. At times that confidence can read as pride, so humility makes your personality even more magnetic." },
  { hi: "स्वभाव से आप ज़मीन से जुड़े, व्यावहारिक और विनम्र हैं। आप दिखावे से ज़्यादा काम पर भरोसा करते हैं, और लोग आपकी विश्वसनीयता की क़द्र करते हैं।", en: "By temperament you are grounded, practical and modest. You trust work over show, and people value how reliable you are." },
  { hi: "स्वभाव से आप मिलनसार, विचारशील और संतुलित हैं। बातचीत और नए विचार आपको ऊर्जा देते हैं, और आप लोगों को आपस में जोड़ने की कला जानते हैं।", en: "By temperament you are sociable, thoughtful and balanced. Conversation and new ideas energise you, and you have a gift for bringing people together." },
  { hi: "स्वभाव से आप संवेदनशील, भावुक और दूसरों की परवाह करने वाले हैं। आपका अंतर्ज्ञान गहरा है; बस दूसरों की भावनाओं का बोझ खुद पर ज़्यादा न लें।", en: "By temperament you are sensitive, caring and deeply intuitive. Just don't carry other people's feelings as your own burden." },
];

export function buildReport(chart: ChartData, locale: Locale, now = new Date()) {
  const l = locale;
  const lagnaSign = chart.ascendant.sign;
  const moonSign = chart.rashi.sign;
  const moonNak = chart.planets.moon.nakshatra;
  const lagnaLord = SIGN_LORD[lagnaSign];
  const lagnaText = LAGNA[lagnaSign];
  const rashiText = RASHI[moonSign];
  const nak = NAKSHATRA[moonNak.index];

  const planets = PLANET_ORDER.map((key) => {
    const p = chart.planets[key];
    const d = dignity(key, p.sign);
    return {
      key,
      name: pick(PLANET_NAME[key], l),
      sign: signName(p.sign, l),
      house: p.house,
      houseTopic: pick(HOUSE_NAME[p.house], l),
      retrograde: p.retrograde && key !== "rahu" && key !== "ketu",
      dignity: d,
      result: pick(PLANET_IN_HOUSE[key][p.house - 1], l),
      dignityNote: pick(DIGNITY_NOTE[d], l),
    };
  });

  const today = now.toISOString().slice(0, 10);
  const maha = chart.vimshottari.find((d) => d.start <= today && today < d.end) ?? chart.running_mahadasha ?? null;
  const antar = maha?.antardashas?.find((d) => d.start <= today && today < d.end) ?? null;
  const period = (d: DashaPeriod) => ({ lord: d.lord, name: pick(PLANET_NAME[d.lord], l), from: fmtDate(d.start, l), to: fmtDate(d.end, l) });
  const upcoming = chart.vimshottari.filter((d) => d.start > today).slice(0, 3).map((d) => ({ ...period(d), theme: pick(DASHA[d.lord].theme, l) }));

  const doshas = (chart.yogas_doshas?.doshas ?? []).map((d) => ({
    key: d.key,
    name: l === "hi" ? d.name_hi : d.name_en,
    present: d.present,
    cancelled: !!d.cancelled,
    severity: d.severity ?? null,
    details: l === "hi" ? d.details_hi : d.details_en,
    remedies: d.present && !d.cancelled ? (DOSHA_REMEDIES[d.key] ?? DOSHA_GENERIC_REMEDY).map((r) => pick(r, l)) : [],
  }));
  const yogas = (chart.yogas_doshas?.yogas ?? []).map((y) => ({
    key: y.key,
    name: l === "hi" ? y.name_hi : y.name_en,
    description: l === "hi" ? y.description_hi : y.description_en,
  }));

  // AMX-200 — Sade Sati & small Panoti from the engine's real Saturn transits.
  const sadeSati = sadeSatiTimeline(chart.sade_sati_periods, today);
  const mon = (iso: string) => fmtDate(iso, l);
  const sadeSatiText: string[] = !sadeSati
    ? []
    : sadeSati.status === "sade_sati"
      ? [
          l === "hi"
            ? `अभी आपकी साढ़े साती का ${sadeSati.current ? { rising: "पहला (आरोही)", peak: "मध्य (शीर्ष)", setting: "अंतिम (अवरोही)" }[sadeSati.current.phase as "rising"] ?? "" : ""} चरण चल रहा है, जो ${mon(sadeSati.currentEnd!)} में पूरी तरह समाप्त होगी। यह समय मेहनत, धैर्य और ज़िम्मेदारी सिखाता है — और इसी दौरान बनी नींव आगे सबसे ज़्यादा फल देती है।`
            : `You are in the ${sadeSati.current ? { rising: "first (rising)", peak: "middle (peak)", setting: "final (setting)" }[sadeSati.current.phase as "rising"] ?? "" : ""} phase of Sade Sati, which ends completely in ${mon(sadeSati.currentEnd!)}. This period teaches effort, patience and responsibility — and the foundation you build now pays off the most later.`,
          ...(sadeSati.freeFrom
            ? [l === "hi"
                ? `इसके बाद ${mon(sadeSati.freeFrom)}${sadeSati.freeUntil ? ` से ${mon(sadeSati.freeUntil)} तक` : " से"} शनि का दबाव हट जाता है — यह खुलकर आगे बढ़ने, नई शुरुआत और मेहनत का पूरा फल पाने का समय है।`
                : `After that, from ${mon(sadeSati.freeFrom)}${sadeSati.freeUntil ? ` until ${mon(sadeSati.freeUntil)}` : ""}, Saturn's pressure lifts — a time to move ahead freely, start new things and enjoy the full reward of your effort.`]
            : []),
        ]
      : sadeSati.status === "small_panoti"
        ? [l === "hi"
            ? `अभी शनि की छोटी पनोती (ढैय्या) चल रही है, जो ${mon(sadeSati.currentEnd!)} तक है। यह साढ़े साती से हल्की होती है — अनुशासन और धैर्य से यह समय आसानी से निकल जाता है।${sadeSati.freeUntil ? ` इसके बाद ${mon(sadeSati.freeFrom!)} से ${mon(sadeSati.freeUntil)} तक अच्छा, खुला समय है।` : ""}`
            : `Saturn's small Panoti (Dhaiya) is running until ${mon(sadeSati.currentEnd!)}. It is much lighter than Sade Sati — discipline and patience carry you through it easily.${sadeSati.freeUntil ? ` Then ${mon(sadeSati.freeFrom!)} to ${mon(sadeSati.freeUntil)} is a good, open stretch.` : ""}`]
        : [l === "hi"
            ? `अभी आप साढ़े साती और ढैय्या दोनों से मुक्त हैं — यह आगे बढ़ने, निवेश और नई शुरुआत के लिए अच्छा समय है${sadeSati.freeUntil ? ` (${mon(sadeSati.freeUntil)} तक)` : ""}।${sadeSati.nextSadeSati ? ` अगली साढ़े साती ${mon(sadeSati.nextSadeSati.start)} में शुरू होगी।` : ""}`
            : `You are free of both Sade Sati and Dhaiya right now — a good time to grow, invest and begin new things${sadeSati.freeUntil ? ` (until ${mon(sadeSati.freeUntil)})` : ""}.${sadeSati.nextSadeSati ? ` The next Sade Sati begins in ${mon(sadeSati.nextSadeSati.start)}.` : ""}`];

  // Life areas: plain-language paragraphs composed from this chart's own factors (see ./predict).
  const manglik = (chart.yogas_doshas?.doshas ?? []).find((d) => d.key === "manglik");
  const dashaLords = [maha?.lord, antar?.lord].filter(Boolean) as PlanetKey[];
  const dashaUntil = maha ? fmtDate(maha.end, l) : null;
  const predict = (area: AreaKey, fieldText: string) => predictArea(area, { lagnaSign, planets, dashaLords, dashaUntil, fieldText }, l);
  const life = {
    career: predict("career", `${l === "hi" ? "आपके लिए अनुकूल क्षेत्र" : "Fields that suit you"}: ${pick(lagnaText.career, l)}`),
    love: { ...predict("love", pick(lagnaText.relationships, l)), manglik: manglik ? { present: manglik.present, cancelled: !!manglik.cancelled } : null },
    health: predict("health", pick(lagnaText.health, l)),
    education: predict("education", pick(EDUCATION[lagnaSign], l)),
  };

  const gems = luckyGems(lagnaSign);
  const lore = PLANET_LORE[lagnaLord];

  // Complete summary: one flowing read (≈500–900 words) covering every area, built from the same
  // chart-specific pieces as the sections below, so it never contradicts them.
  const hi = l === "hi";
  const presentDoshas = doshas.filter((d) => d.present && !d.cancelled).map((d) => d.name);
  const nextDasha = upcoming[0];
  const overview = [
    hi
      ? `आपका जन्म ${signName(lagnaSign, l)} लग्न में हुआ है, चंद्रमा ${signName(moonSign, l)} राशि में है और जन्म नक्षत्र ${moonNak.name_hi} (चरण ${moonNak.pada}) है, जिसके देवता ${pick(nak.deity, l)} हैं। ${pick(lagnaText.personality, l)}`
      : `You were born with ${signName(lagnaSign, l)} rising, the Moon in ${signName(moonSign, l)}, and ${moonNak.name_en} (pada ${moonNak.pada}) as your birth star, presided over by ${pick(nak.deity, l)}. ${pick(lagnaText.personality, l)}`,
    `${pick(TEMPERAMENT[(lagnaSign - 1) % 4], l)} ${hi ? "आपकी सबसे बड़ी ताक़तें हैं —" : "Your greatest strengths are"} ${(hi ? pick(lagnaText.strengths, l) : pick(lagnaText.strengths, l).replace(/^./, (c) => c.toLowerCase())).replace(/[.।]$/, "")}${hi ? "।" : "."} ${pick(lagnaText.challenges, l)}`,
    `${pick(rashiText.mind, l)} ${pick(nak.traits, l)} ${hi ? "मन के लिए एक छोटी सलाह:" : "A small tip for your mind:"} ${pick(rashiText.tip, l)}`,
    `${life.career.paragraphs[0]} ${life.career.paragraphs[1]} ${life.career.paragraphs[2]}`,
    `${life.love.paragraphs[0]} ${life.love.paragraphs[1]} ${life.love.paragraphs[2]} ${
      !manglik ? "" : !manglik.present ? (hi ? "आपकी कुंडली मांगलिक नहीं है।" : "Your chart is not Manglik.") : manglik.cancelled ? (hi ? "मांगलिक योग है, पर वह भंग (निष्प्रभावी) हो जाता है।" : "Manglik placement exists but is cancelled.") : hi ? "कुंडली में मांगलिक दोष है, इसलिए विवाह से पहले मिलान ज़रूर करें।" : "The chart is Manglik, so always match charts before marriage."
    }`,
    `${life.health.paragraphs[0]} ${life.health.paragraphs[2]}`,
    `${life.education.paragraphs[0]} ${life.education.paragraphs[2]}`,
    maha
      ? hi
        ? `अभी आप ${pick(PLANET_NAME[maha.lord], l)} की महादशा में हैं, जो ${fmtDate(maha.end, l)} तक चलेगी। ${pick(DASHA[maha.lord].theme, l)} ${pick(DASHA[maha.lord].focus, l)}${nextDasha ? ` इसके बाद ${nextDasha.name} की दशा आएगी — ${nextDasha.theme}` : ""}`
        : `You are now in the ${pick(PLANET_NAME[maha.lord], l)} Mahadasha, running until ${fmtDate(maha.end, l)}. ${pick(DASHA[maha.lord].theme, l)} ${pick(DASHA[maha.lord].focus, l)}${nextDasha ? ` After this comes the ${nextDasha.name} period — ${nextDasha.theme}` : ""}`
      : "",
    `${
      presentDoshas.length
        ? hi ? `कुंडली में ध्यान देने योग्य दोष: ${presentDoshas.join(", ")} — सरल उपाय नीचे दिए गए हैं।` : `Doshas to note: ${presentDoshas.join(", ")} — simple remedies are given below.`
        : hi ? "आपकी कुंडली किसी बड़े सक्रिय दोष से मुक्त है।" : "Your chart is free of any major active dosha."
    }${yogas.length ? (hi ? ` शुभ योग: ${yogas.map((y) => y.name).join(", ")}।` : ` Beneficial yogas: ${yogas.map((y) => y.name).join(", ")}.`) : ""} ${
      hi
        ? `आपका शुभ रंग ${pick(lore.colour, l)}, शुभ अंक ${lore.number}, शुभ दिन ${pick(lore.day, l)} और शुभ रत्न ${pick(PLANET_LORE[gems.primary].gem, l)} है (रत्न पहनने से पहले सलाह ज़रूर लें)।`
        : `Your lucky colour is ${pick(lore.colour, l)}, lucky number ${lore.number}, lucky day ${pick(lore.day, l)} and lucky gem ${pick(PLANET_LORE[gems.primary].gem, l)} (consult before wearing a gem).`
    }`,
  ].filter(Boolean);

  return {
    reviewed: REPORT_REVIEWED,
    sadeSati,
    sadeSatiText,
    overview,
    summary: {
      lagna: signName(lagnaSign, l),
      lagnaLord: pick(PLANET_NAME[lagnaLord], l),
      rashi: signName(moonSign, l),
      nakshatra: `${l === "hi" ? moonNak.name_hi : moonNak.name_en} (${moonNak.pada})`,
      currentDasha: maha ? `${pick(PLANET_NAME[maha.lord], l)}${antar ? ` / ${pick(PLANET_NAME[antar.lord], l)}` : ""}` : null,
    },
    lagna: {
      sign: signName(lagnaSign, l),
      personality: pick(lagnaText.personality, l),
      strengths: pick(lagnaText.strengths, l),
      challenges: pick(lagnaText.challenges, l),
      career: pick(lagnaText.career, l),
      relationships: pick(lagnaText.relationships, l),
      health: pick(lagnaText.health, l),
    },
    rashi: { sign: signName(moonSign, l), mind: pick(rashiText.mind, l), tip: pick(rashiText.tip, l) },
    nakshatra: { name: l === "hi" ? moonNak.name_hi : moonNak.name_en, pada: moonNak.pada, deity: pick(nak.deity, l), traits: pick(nak.traits, l) },
    planets,
    life,
    currentDasha: maha
      ? {
          maha: period(maha),
          antar: antar ? period(antar) : null,
          theme: pick(DASHA[maha.lord].theme, l),
          focus: pick(DASHA[maha.lord].focus, l),
          antarNote: antar ? pick(DASHA[antar.lord].antar, l) : null,
        }
      : null,
    upcomingDashas: upcoming,
    doshas,
    yogas,
    lucky: {
      gem: pick(PLANET_LORE[gems.primary].gem, l),
      alternateGem: gems.alternate ? pick(PLANET_LORE[gems.alternate].gem, l) : null,
      gemNote: pick(GEM_NOTE, l),
      day: pick(lore.day, l),
      colour: pick(lore.colour, l),
      number: lore.number,
      metal: pick(lore.metal, l),
      deity: pick(lore.deity, l),
      mantra: lore.mantra,
      daan: pick(lore.daan, l),
    },
    disclaimer: pick(DISCLAIMER, l),
  };
}

export type KundaliReport = ReturnType<typeof buildReport>;
