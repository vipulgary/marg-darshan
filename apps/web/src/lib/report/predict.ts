// DRAFT — to be reviewed and approved by the client's Jyotish before launch
/**
 * Plain-language life predictions. Each area is judged from real chart factors — where the
 * house lord sits, its strength, which planets occupy the house, the natural significator,
 * and whether the running dasha activates it — then composed into 2–3 paragraphs.
 * No planet jargon reaches the reader; the factor mix makes every chart read differently.
 */
import type { PlanetKey } from "@/lib/contracts";
import { SIGN_LORD } from "./content/astro";
import type { Bi } from "./content/meta";

type Locale = "hi" | "en";
type Dignity = "exalted" | "debilitated" | "own" | "friend" | "enemy" | "neutral";
export type AreaKey = "career" | "love" | "health" | "education";
export type Tone = "strong" | "mixed" | "challenging";

export interface PlanetPos {
  key: PlanetKey;
  house: number;
  dignity: Dignity;
}

interface AreaSpec {
  house: number;
  karakas: PlanetKey[];
  noun: Bi;
}

const AREAS: Record<AreaKey, AreaSpec> = {
  career: { house: 10, karakas: ["sun", "saturn"], noun: { hi: "करियर और काम", en: "career and work" } },
  love: { house: 7, karakas: ["venus"], noun: { hi: "प्रेम और वैवाहिक जीवन", en: "love and married life" } },
  health: { house: 1, karakas: ["sun"], noun: { hi: "सेहत और ऊर्जा", en: "health and energy" } },
  education: { house: 5, karakas: ["mercury", "jupiter"], noun: { hi: "पढ़ाई और सीखना", en: "education and learning" } },
};

const BENEFIC: PlanetKey[] = ["jupiter", "venus", "mercury", "moon"];
const UPACHAYA = [3, 6, 10, 11]; // houses where hard planets give drive rather than trouble

const signFrom = (from: number, n: number) => ((from - 1 + n - 1) % 12) + 1;
const b = (hi: string, en: string): Bi => ({ hi, en });

type Place = "kendra" | "trikona" | "gain" | "effort" | "hidden";
const placeOf = (h: number): Place =>
  [1, 4, 7, 10].includes(h) ? "kendra" : [5, 9].includes(h) ? "trikona" : [2, 11].includes(h) ? "gain" : h === 3 ? "effort" : "hidden";

// ——— sentence banks (two variants where it helps; chosen by chart so neighbours differ) ———

const OPEN: Record<AreaKey, Record<Tone, Bi[]>> = {
  career: {
    strong: [
      b("आपकी कुंडली में करियर का पक्ष मज़बूत है। मेहनत का फल आपको दिखाई देता है और समय के साथ पहचान व पद दोनों बढ़ते हैं।", "Your chart shows a strong career side. Your effort tends to show visible results, and both recognition and position grow with time."),
      b("काम-काज के मामले में आपकी कुंडली अच्छा साथ देती है। आप ज़िम्मेदारी संभालने के लिए बने हैं और लोग आपकी काबिलियत पर भरोसा करते हैं।", "Your chart supports you well in work. You are built to carry responsibility, and people come to trust your ability."),
    ],
    mixed: [
      b("करियर में आपकी तरक्की सीधी रेखा में नहीं, बल्कि सीढ़ी की तरह होती है — कुछ समय ठहराव, फिर अच्छी छलांग।", "Your career grows less like a straight line and more like a staircase — a pause, then a good step up."),
      b("काम के मामले में आपकी कुंडली मिले-जुले संकेत देती है। सही दिशा चुनने पर आप अच्छी स्थिरता और सम्मान पा सकते हैं।", "Your chart gives mixed signals for work. Once you pick the right direction, solid stability and respect are within reach."),
    ],
    challenging: [
      b("करियर में आपको बाकी लोगों से थोड़ा ज़्यादा धैर्य रखना पड़ सकता है। शुरुआत धीमी हो सकती है, पर लगातार प्रयास से नींव बहुत पक्की बनती है।", "Your career may ask for more patience than most. The start can be slow, but steady effort builds a very solid base."),
    ],
  },
  love: {
    strong: [
      b("प्रेम और विवाह का पक्ष आपकी कुंडली में सुखद है। आपको समझदार और साथ निभाने वाला जीवनसाथी मिलने के अच्छे संकेत हैं।", "Love and marriage look happy in your chart. There are good signs of an understanding partner who stands by you."),
      b("रिश्तों के मामले में आपकी कुंडली गर्मजोशी भरी है। आप साथी को सम्मान देते हैं और बदले में अपनापन पाते हैं।", "Your chart is warm when it comes to relationships. You give your partner respect and receive real closeness in return."),
    ],
    mixed: [
      b("आपका वैवाहिक जीवन समझ और बातचीत पर टिका है — जितना खुलकर आप बात करेंगे, रिश्ता उतना ही मज़बूत होगा।", "Your married life rests on understanding and conversation — the more openly you talk, the stronger the bond becomes."),
      b("रिश्तों में आपकी कुंडली मिले-जुले संकेत देती है। अच्छे पल बहुत हैं, बस छोटी बातों को बड़ा न होने देना ज़रूरी है।", "Your chart gives mixed signals in relationships. There are many good moments; the key is not letting small things grow big."),
    ],
    challenging: [
      b("रिश्तों में आपको धैर्य और समझदारी से चलना होगा। जल्दबाज़ी में लिए फ़ैसले बाद में भारी पड़ सकते हैं, इसलिए साथी चुनने में समय लें।", "Relationships ask you to move with patience and good sense. Hasty decisions can weigh on you later, so take your time choosing a partner."),
    ],
  },
  health: {
    strong: [
      b("आपकी शारीरिक बनावट और रोग-प्रतिरोधक क्षमता अच्छी है। बीमारी से आप जल्दी उबर जाते हैं।", "Your constitution and natural resistance are good, and you tend to recover quickly from illness."),
    ],
    mixed: [
      b("आपकी सेहत सामान्य रूप से ठीक रहती है, पर दिनचर्या बिगड़ने पर शरीर जल्दी संकेत देता है।", "Your health is generally fine, but your body signals quickly when your routine slips."),
    ],
    challenging: [
      b("सेहत आपके लिए ऐसा क्षेत्र है जिस पर नियमित ध्यान देना ज़रूरी है। छोटी परेशानी को टालें नहीं — समय पर देखभाल से आप लंबे समय तक स्वस्थ रह सकते हैं।", "Health is an area that needs regular attention for you. Don't ignore small issues — timely care keeps you well for the long run."),
    ],
  },
  education: {
    strong: [
      b("पढ़ाई और ज्ञान के मामले में आपकी कुंडली बहुत अच्छी है। आपकी समझ तेज़ है और सीखी हुई बात लंबे समय तक याद रहती है।", "Your chart is very good for learning. You grasp things quickly and remember what you learn for a long time."),
    ],
    mixed: [
      b("पढ़ाई में आपकी सफलता रुचि पर बहुत निर्भर करती है — जिस विषय में मन लगे, उसमें आप बहुत आगे जा सकते हैं।", "Your success in studies depends a lot on interest — in a subject you enjoy, you can go very far."),
    ],
    challenging: [
      b("पढ़ाई में बीच-बीच में रुकावटें या ध्यान भटकना संभव है। सही माहौल और एक तय दिनचर्या से आप अपनी पूरी क्षमता तक पहुँच सकते हैं।", "Studies may see breaks or lapses in focus at times. The right environment and a fixed routine help you reach your full ability."),
    ],
  },
};

const LORD_PLACE: Record<Place, Bi> = {
  kendra: b("इस क्षेत्र को आपकी कुंडली में मज़बूत आधार मिला है, इसलिए यहाँ के परिणाम सामने और स्पष्ट दिखते हैं।", "This area has a firm footing in your chart, so its results tend to be visible and clear."),
  trikona: b("इस क्षेत्र पर भाग्य का साथ है — सही समय पर सही लोग और अवसर अपने आप मिलते हैं।", "Luck supports this area — the right people and openings tend to arrive at the right time."),
  gain: b("यह क्षेत्र सीधे आपकी आमदनी और लाभ से जुड़ा है; यहाँ की मेहनत धन के रूप में लौटती है।", "This area is tied directly to your income and gains; effort here comes back as money."),
  effort: b("यहाँ सफलता आपकी अपनी पहल, हिम्मत और बातचीत की कला से आती है — दूसरों का इंतज़ार न करें।", "Success here comes from your own initiative, courage and way with words — don't wait on others."),
  hidden: b("यहाँ के परिणाम धीरे और कुछ उतार-चढ़ाव के बाद आते हैं। पर्दे के पीछे की मेहनत, शोध या विदेश/दूर के संपर्क यहाँ ख़ास भूमिका निभा सकते हैं।", "Results here come slowly and after some ups and downs. Behind-the-scenes work, research, or distant and foreign links can play a special role."),
};

const LORD_STRENGTH: Record<"high" | "low", Bi> = {
  high: b("इस क्षेत्र को चलाने वाली ऊर्जा आपकी कुंडली में बलवान है, जो आत्मविश्वास और अच्छे निर्णय देती है।", "The energy that runs this area is strong in your chart, giving confidence and sound judgement."),
  low: b("इस क्षेत्र की ऊर्जा थोड़ी कमज़ोर है, इसलिए आत्म-संदेह या देरी आ सकती है — उपाय और धैर्य यहाँ अच्छा सुधार लाते हैं।", "The energy behind this area is a little weak, which can bring self-doubt or delays — remedies and patience bring good improvement here."),
};

const OCCUPANTS = {
  benefic: b("इस भाव में शुभ प्रभाव होने से अच्छे मार्गदर्शक, सहयोगी लोग और सुखद अनुभव मिलते हैं।", "Gentle influences sitting here bring good mentors, supportive people and pleasant experiences."),
  hardDrive: b("यहाँ बैठा कठोर प्रभाव आपको प्रतिस्पर्धा में धार देता है — दबाव में आप और बेहतर करते हैं।", "A tough influence here gives you a competitive edge — you do better under pressure."),
  hard: b("यहाँ कुछ कठोर प्रभाव भी है, जो समय-समय पर तनाव या टकराव ला सकता है; शांत रहकर फ़ैसले लेना आपको बचाता है।", "There is also a tough influence here that can bring stress or friction at times; staying calm when deciding protects you."),
};

const KARAKA: Record<"high" | "low", Record<AreaKey, Bi>> = {
  high: {
    career: b("अधिकार और अनुशासन की ऊर्जा आपके पक्ष में है — नेतृत्व या ज़िम्मेदारी वाले पद आपको अच्छे लगते हैं।", "The energy of authority and discipline is on your side — roles with leadership or responsibility suit you."),
    love: b("प्रेम और सुंदरता की ऊर्जा मज़बूत है, जो रिश्तों में आकर्षण और मिठास बनाए रखती है।", "The energy of love and beauty is strong, keeping charm and sweetness in your relationships."),
    health: b("आपकी जीवन-शक्ति अच्छी है, जो थकान से जल्दी उबरने में मदद करती है।", "Your vitality is good, which helps you bounce back from fatigue."),
    education: b("बुद्धि और ज्ञान की ऊर्जा मज़बूत है — आप तर्क से सोचते हैं और अच्छे शिक्षक/मार्गदर्शक पाते हैं।", "The energy of intellect and wisdom is strong — you think logically and find good teachers and guides."),
  },
  low: {
    career: b("कभी-कभी वरिष्ठों से तालमेल या मान्यता मिलने में देरी हो सकती है; अपना काम लिखित और स्पष्ट रखें।", "At times, getting along with seniors or getting recognised may be delayed; keep your work documented and clear."),
    love: b("रिश्तों में अपेक्षाएँ कभी-कभी पूरी न होने का एहसास हो सकता है; छोटी-छोटी खुशियों की कद्र करना यहाँ बहुत मदद करता है।", "You may sometimes feel your expectations in love go unmet; valuing small joys helps a great deal here."),
    health: b("ऊर्जा कभी-कभी कम महसूस हो सकती है, इसलिए धूप, नींद और समय पर भोजन को प्राथमिकता दें।", "Energy may dip at times, so put sunlight, sleep and regular meals first."),
    education: b("एकाग्रता बनाए रखने के लिए छोटे-छोटे लक्ष्य और नियमित दोहराव आपके लिए सबसे असरदार हैं।", "Short goals and regular revision are the most effective way for you to keep focus."),
  },
};

const ACTIVE: Bi = b(
  "अभी चल रहा समय ({until} तक) सीधे इस क्षेत्र को सक्रिय कर रहा है, इसलिए इन वर्षों में यहाँ बदलाव और नए अवसर ज़्यादा दिखेंगे।",
  "Your current phase of life (until {until}) directly activates this area, so expect more change and new openings here during these years.",
);
const QUIET: Bi = b(
  "फ़िलहाल यह क्षेत्र स्थिर चाल से चल रहा है; बड़े बदलाव जीवन के अगले चरणों में अधिक दिखेंगे।",
  "For now this area moves at a steady pace; bigger shifts show up more in later phases of life.",
);

const ADVICE: Record<AreaKey, Record<Tone, Bi>> = {
  career: {
    strong: b("सलाह: बड़े लक्ष्य रखें और ज़िम्मेदारी लेने से न हिचकें — आपकी कुंडली इसे संभालने की ताक़त देती है।", "Advice: aim high and don't hold back from responsibility — your chart gives you the strength to carry it."),
    mixed: b("सलाह: एक क्षेत्र चुनकर उसमें गहराई से कौशल बनाएँ; बार-बार दिशा बदलने से बचें।", "Advice: choose one field and build deep skill in it; avoid changing direction too often."),
    challenging: b("सलाह: नौकरी या व्यवसाय बदलने से पहले अच्छी तैयारी करें, और शनिवार को ज़रूरतमंदों की सेवा करें — यह धैर्य और स्थिरता देता है।", "Advice: prepare well before changing jobs or business, and serve those in need on Saturdays — it builds patience and stability."),
  },
  love: {
    strong: b("सलाह: अपने अच्छे योग का पूरा लाभ लें — साथी के साथ समय बिताएँ और आभार जताते रहें।", "Advice: make the most of this good placement — spend real time with your partner and keep expressing gratitude."),
    mixed: b("सलाह: गुस्से में कोई बात न कहें; ज़रूरी बातें शांत समय पर करें। विवाह से पहले कुंडली मिलान ज़रूर करें।", "Advice: don't say things in anger; keep important talks for calm moments. Do a proper kundali match before marriage."),
    challenging: b("सलाह: विवाह से पहले कुंडली मिलान और किसी अनुभवी ज्योतिषी से सलाह ज़रूर लें; शुक्रवार को सफ़ेद वस्तुओं का दान शुभ रहेगा।", "Advice: always do a kundali match and consult an experienced Jyotish before marriage; donating white items on Fridays is helpful."),
  },
  health: {
    strong: b("सलाह: अच्छी सेहत को आदत बनाए रखें — नियमित व्यायाम आपकी ताक़त को लंबे समय तक बनाए रखेगा।", "Advice: keep good health a habit — regular exercise will preserve your strength for years."),
    mixed: b("सलाह: रोज़ 20–30 मिनट टहलना या योग, और सोने-जागने का तय समय आपके लिए सबसे बड़ा उपाय है।", "Advice: a daily 20–30 minute walk or yoga, and fixed sleep and wake times, are your best remedy."),
    challenging: b("सलाह: साल में एक बार पूरी जाँच करवाएँ, प्राणायाम करें और सूर्योदय के समय सूर्य को जल अर्पित करें।", "Advice: get a full check-up once a year, practise pranayama and offer water to the rising Sun."),
  },
  education: {
    strong: b("सलाह: उच्च शिक्षा या विशेषज्ञता की ओर ज़रूर बढ़ें — आपकी कुंडली इसमें अच्छी सफलता दिखाती है।", "Advice: do pursue higher studies or specialisation — your chart shows good success there."),
    mixed: b("सलाह: अपनी रुचि का विषय चुनें और पढ़ाई के लिए रोज़ एक तय समय रखें।", "Advice: pick subjects you genuinely enjoy and keep a fixed daily study time."),
    challenging: b("सलाह: पढ़ाई की जगह साफ़ और शांत रखें, बुधवार को गणेश जी का स्मरण करें और कठिन विषयों में मार्गदर्शन लेने से न झिझकें।", "Advice: keep your study space clean and quiet, remember Lord Ganesha on Wednesdays, and don't hesitate to get help with hard subjects."),
  },
};

/** Stable small hash so the same chart always reads the same, but different charts vary. */
const hash = (...n: number[]) => n.reduce((h, x) => (h * 31 + x) >>> 0, 7);

export interface AreaPrediction {
  tone: Tone;
  paragraphs: string[];
}

export function predictArea(
  area: AreaKey,
  ctx: { lagnaSign: number; planets: PlanetPos[]; dashaLords: PlanetKey[]; dashaUntil: string | null; fieldText: string },
  l: Locale,
): AreaPrediction {
  const spec = AREAS[area];
  const at = (k: PlanetKey) => ctx.planets.find((p) => p.key === k)!;
  const lordKey = SIGN_LORD[signFrom(ctx.lagnaSign, spec.house)];
  const lord = at(lordKey);
  const place = placeOf(lord.house);
  const occupants = ctx.planets.filter((p) => p.house === spec.house && p.key !== lordKey);
  const benefics = occupants.filter((p) => BENEFIC.includes(p.key));
  const hard = occupants.filter((p) => !BENEFIC.includes(p.key));
  const upachaya = UPACHAYA.includes(spec.house);
  const strong = (d: Dignity) => d === "exalted" || d === "own";
  const lordStrength = strong(lord.dignity) ? "high" : lord.dignity === "debilitated" ? "low" : null;
  const karakas = spec.karakas.map(at).filter((p) => p.key !== lordKey);
  const karakaHigh = karakas.some((p) => strong(p.dignity));
  const karakaLow = karakas.some((p) => p.dignity === "debilitated");

  let score = { kendra: 2, trikona: 2, gain: 1, effort: 0, hidden: -2 }[place];
  score += lordStrength === "high" ? 2 : lordStrength === "low" ? -2 : lord.dignity === "friend" ? 1 : lord.dignity === "enemy" ? -1 : 0;
  score += benefics.length;
  score += upachaya ? Math.min(1, hard.length) : -hard.length;
  score += karakaHigh ? 1 : 0;
  score -= karakaLow ? 1 : 0;
  const tone: Tone = score >= 3 ? "strong" : score <= -1 ? "challenging" : "mixed";

  const variants = OPEN[area][tone];
  const open = variants[hash(ctx.lagnaSign, lord.house, spec.house) % variants.length][l];
  const p1 = `${open} ${ctx.fieldText}`;

  const details: Bi[] = [LORD_PLACE[place]];
  if (lordStrength) details.push(LORD_STRENGTH[lordStrength]);
  if (benefics.length) details.push(OCCUPANTS.benefic);
  if (hard.length) details.push(upachaya ? OCCUPANTS.hardDrive : OCCUPANTS.hard);
  if (karakaHigh) details.push(KARAKA.high[area]);
  else if (karakaLow) details.push(KARAKA.low[area]);
  const p2 = details.map((d) => d[l]).join(" ");

  const active = ctx.dashaLords.includes(lordKey) || ctx.dashaLords.some((k) => at(k).house === spec.house);
  const timing = active && ctx.dashaUntil ? ACTIVE[l].replace("{until}", ctx.dashaUntil) : QUIET[l];
  const p3 = `${timing} ${ADVICE[area][tone][l]}`;

  return { tone, paragraphs: [p1, p2, p3] };
}
