/**
 * Shared catalog — the single source for problems, services, plans and shop items
 * until Payload CMS (AMX-030) takes over. prisma/seed.ts loads the same data.
 * Prices are in whole INR.
 */

import type { IconName } from "@/components/icons/paths";

export type Locale = "hi" | "en";
export type Bilingual = { hi: string; en: string };

export type ServiceType = "JYOTISH" | "VASTU" | "GEMS" | "RECTIFICATION";
export type VisitMode = "ONLINE_ZOOM" | "PERSONAL_VISIT";
export type PlanType = "FULL_UPFRONT" | "SPLIT_PLAN";
export type ProductCategory = "GEM" | "RUDRAKSHA" | "YANTRA" | "VASTU";

export interface Problem {
  slug: string;
  title: Bilingual;
  icon: IconName; // components/icons line icon
  serviceSlug: string;
  defaultDuration: number;
}

export interface Service {
  slug: string;
  type: ServiceType;
  title: Bilingual;
  summary: Bilingual;
  modes: VisitMode[];
  durations: number[]; // minutes
  /** price per duration in INR */
  prices: Record<number, number>;
  splitAllowed: boolean;
  /** advance percentage when split plan is chosen */
  advancePct?: number;
  calEventSlug: Partial<Record<VisitMode, string>>;
}

export interface Plan {
  slug: string;
  serviceSlug: string;
  name: Bilingual;
  priceInr: number;
  durationMin: number;
  sessions: number;
  planType: PlanType;
  advancePct?: number;
  featured?: boolean;
  features: Bilingual[];
}

export interface Product {
  slug: string;
  sku: string;
  category: ProductCategory;
  title: Bilingual;
  description: Bilingual;
  suitableFor: Bilingual;
  priceHint: Bilingual;
  certified: boolean;
  image: string; // /images/shop/<slug>.jpg (placeholder gradient if missing)
  /** Gems only (AMX-204): the planet the stone serves and the weights we stock. */
  planet?: "sun" | "moon" | "mars" | "mercury" | "jupiter" | "venus" | "saturn" | "rahu" | "ketu";
  variants?: GemVariant[];
}

/** One stocked weight of a gem — ratti (or carat for diamond), price in ₹, and whether it is in stock. DRAFT sample stock. */
export interface GemVariant {
  weight: number;
  price: number;
  inStock: boolean;
}

const v = (weight: number, price: number, inStock = true): GemVariant => ({ weight, price, inStock });

export const SERVICES: Service[] = [
  {
    slug: "astrology",
    type: "JYOTISH",
    title: { hi: "ज्योतिष परामर्श", en: "Astrology Consultation" },
    summary: {
      hi: "करियर, विवाह, स्वास्थ्य और धन से जुड़े प्रश्नों पर कुंडली आधारित मार्गदर्शन।",
      en: "Kundali-based guidance on career, marriage, health and finance.",
    },
    modes: ["ONLINE_ZOOM", "PERSONAL_VISIT"],
    durations: [30, 60],
    prices: { 30: 1100, 60: 2100 },
    splitAllowed: false,
    calEventSlug: { ONLINE_ZOOM: "astrology-online", PERSONAL_VISIT: "astrology-visit" },
  },
  {
    slug: "vastu",
    type: "VASTU",
    title: { hi: "वास्तु शास्त्र परामर्श", en: "Vastu Shastra Consultation" },
    summary: {
      hi: "घर, ऑफिस, फैक्ट्री या प्लॉट — नक्शा देखकर या साइट विज़िट से वास्तु सलाह।",
      en: "Home, office, factory or plot — Vastu advice from your floor plan or a site visit.",
    },
    modes: ["ONLINE_ZOOM", "PERSONAL_VISIT"],
    durations: [60, 120],
    prices: { 60: 3100, 120: 5100 },
    splitAllowed: true,
    advancePct: 50,
    calEventSlug: { ONLINE_ZOOM: "vastu-online", PERSONAL_VISIT: "vastu-visit" },
  },
  {
    slug: "gems",
    type: "GEMS",
    title: { hi: "रत्न परामर्श", en: "Gemstone Consultation" },
    summary: {
      hi: "षड्बल और वर्ग कुंडली के आधार पर सही रत्न, वज़न और धारण विधि।",
      en: "The right gemstone, weight and wearing method from Shadbala and divisional charts.",
    },
    modes: ["ONLINE_ZOOM", "PERSONAL_VISIT"],
    durations: [30, 60],
    prices: { 30: 1100, 60: 2100 },
    splitAllowed: false,
    calEventSlug: { ONLINE_ZOOM: "gems-online", PERSONAL_VISIT: "gems-visit" },
  },
  {
    slug: "birth-time",
    type: "RECTIFICATION",
    title: { hi: "जन्म समय शोधन", en: "Birth Time Rectification" },
    summary: {
      hi: "जन्म समय या तारीख नहीं पता? जीवन की घटनाओं से सटीक समय निकालें।",
      en: "Don't know your birth time or date? We find it from your life events.",
    },
    modes: ["ONLINE_ZOOM", "PERSONAL_VISIT"],
    durations: [90],
    prices: { 90: 3100 },
    splitAllowed: false,
    calEventSlug: { ONLINE_ZOOM: "rectification-online", PERSONAL_VISIT: "rectification-visit" },
  },
];

export const PROBLEMS: Problem[] = [
  { slug: "career", title: { hi: "करियर और व्यवसाय", en: "Career & Business" }, icon: "briefcase", serviceSlug: "astrology", defaultDuration: 60 },
  { slug: "marriage", title: { hi: "विवाह और कुंडली मिलान", en: "Marriage & Matching" }, icon: "rings", serviceSlug: "astrology", defaultDuration: 60 },
  { slug: "health", title: { hi: "स्वास्थ्य", en: "Health" }, icon: "heart-pulse", serviceSlug: "astrology", defaultDuration: 30 },
  { slug: "finance", title: { hi: "धन और निवेश", en: "Finance & Investment" }, icon: "coins", serviceSlug: "astrology", defaultDuration: 30 },
  { slug: "education", title: { hi: "शिक्षा", en: "Education" }, icon: "book", serviceSlug: "astrology", defaultDuration: 30 },
  { slug: "santaan", title: { hi: "संतान", en: "Children" }, icon: "baby", serviceSlug: "astrology", defaultDuration: 60 },
  { slug: "dosha", title: { hi: "दोष निवारण", en: "Dosha Remedies" }, icon: "diya", serviceSlug: "astrology", defaultDuration: 60 },
  { slug: "foreign", title: { hi: "विदेश यात्रा / निवास", en: "Foreign Travel & Settlement" }, icon: "plane", serviceSlug: "astrology", defaultDuration: 30 },
  { slug: "vastu-residential", title: { hi: "वास्तु — घर", en: "Vastu — Home" }, icon: "home", serviceSlug: "vastu", defaultDuration: 60 },
  { slug: "vastu-commercial", title: { hi: "वास्तु — ऑफिस / दुकान", en: "Vastu — Office / Shop" }, icon: "building", serviceSlug: "vastu", defaultDuration: 120 },
  { slug: "vastu-industrial", title: { hi: "वास्तु — फैक्ट्री / प्लॉट", en: "Vastu — Factory / Plot" }, icon: "factory", serviceSlug: "vastu", defaultDuration: 120 },
  { slug: "gemstone", title: { hi: "रत्न सलाह", en: "Gemstone Advice" }, icon: "gem", serviceSlug: "gems", defaultDuration: 30 },
  { slug: "birth-time-unknown", title: { hi: "जन्म समय नहीं पता", en: "Birth Time Unknown" }, icon: "hourglass", serviceSlug: "birth-time", defaultDuration: 90 },
];

export const PLANS: Plan[] = [
  {
    slug: "astro-30",
    serviceSlug: "astrology",
    name: { hi: "त्वरित परामर्श", en: "Quick Consultation" },
    priceInr: 1100,
    durationMin: 30,
    sessions: 1,
    planType: "FULL_UPFRONT",
    features: [
      { hi: "एक मुख्य प्रश्न", en: "One main question" },
      { hi: "कुंडली विश्लेषण", en: "Kundali analysis" },
      { hi: "उपाय सुझाव", en: "Remedy suggestions" },
    ],
  },
  {
    slug: "astro-60",
    serviceSlug: "astrology",
    name: { hi: "विस्तृत परामर्श", en: "Detailed Consultation" },
    priceInr: 2100,
    durationMin: 60,
    sessions: 1,
    planType: "FULL_UPFRONT",
    featured: true,
    features: [
      { hi: "सभी प्रश्न", en: "All your questions" },
      { hi: "दशा और गोचर विश्लेषण", en: "Dasha & transit analysis" },
      { hi: "PDF सारांश", en: "PDF summary" },
      { hi: "7 दिन WhatsApp फॉलो-अप", en: "7-day WhatsApp follow-up" },
    ],
  },
  {
    slug: "vastu-site",
    serviceSlug: "vastu",
    name: { hi: "वास्तु साइट विज़िट", en: "Vastu Site Visit" },
    priceInr: 5100,
    durationMin: 120,
    sessions: 1,
    planType: "SPLIT_PLAN",
    advancePct: 50,
    features: [
      { hi: "साइट निरीक्षण", en: "On-site inspection" },
      { hi: "नक्शा विश्लेषण", en: "Floor-plan analysis" },
      { hi: "लिखित रिपोर्ट", en: "Written report" },
      { hi: "50% अग्रिम, शेष रिपोर्ट से पहले", en: "50% advance, balance before report" },
    ],
  },
];

export const PRODUCTS: Product[] = [
  {
    slug: "yellow-sapphire-pukhraj",
    sku: "GEM-PUK-001",
    category: "GEM",
    title: { hi: "पुखराज (पीला नीलम)", en: "Yellow Sapphire (Pukhraj)" },
    description: { hi: "बृहस्पति का रत्न — ज्ञान, समृद्धि और विवाह सुख के लिए।", en: "Jupiter's gem — for wisdom, prosperity and marital harmony." },
    suitableFor: { hi: "धनु, मीन लग्न (कुंडली देखकर ही)", en: "Sagittarius, Pisces ascendant (only after chart review)" },
    priceHint: { hi: "₹4,500 / रत्ती से", en: "From ₹4,500 / ratti" },
    certified: true,
    image: "/images/shop/yellow-sapphire-pukhraj.jpg",
    planet: "jupiter",
    variants: [v(3, 13500), v(4, 18000), v(5, 22500), v(6, 27000, false)],
  },
  {
    slug: "blue-sapphire-neelam",
    sku: "GEM-NEE-001",
    category: "GEM",
    title: { hi: "नीलम", en: "Blue Sapphire (Neelam)" },
    description: { hi: "शनि का रत्न — तेज़ असर, परीक्षण के बाद ही धारण करें।", en: "Saturn's gem — fast-acting, wear only after a trial period." },
    suitableFor: { hi: "मकर, कुंभ लग्न (कुंडली देखकर ही)", en: "Capricorn, Aquarius ascendant (only after chart review)" },
    priceHint: { hi: "₹6,000 / रत्ती से", en: "From ₹6,000 / ratti" },
    certified: true,
    image: "/images/shop/blue-sapphire-neelam.jpg",
    planet: "saturn",
    variants: [v(3, 18000), v(4, 24000, false), v(5, 30000), v(6, 36000, false)],
  },
  {
    slug: "ruby-manik",
    sku: "GEM-MAN-001",
    category: "GEM",
    title: { hi: "माणिक", en: "Ruby (Manik)" },
    description: { hi: "सूर्य का रत्न — आत्मविश्वास और नेतृत्व के लिए।", en: "Sun's gem — for confidence and leadership." },
    suitableFor: { hi: "मेष, सिंह लग्न", en: "Aries, Leo ascendant" },
    priceHint: { hi: "₹3,500 / रत्ती से", en: "From ₹3,500 / ratti" },
    certified: true,
    image: "/images/shop/ruby-manik.jpg",
    planet: "sun",
    variants: [v(3, 10500), v(4, 14000), v(5, 17500, false), v(6, 21000)],
  },
  {
    slug: "emerald-panna",
    sku: "GEM-PAN-001",
    category: "GEM",
    title: { hi: "पन्ना", en: "Emerald (Panna)" },
    description: { hi: "बुध का रत्न — बुद्धि, वाणी और व्यापार के लिए।", en: "Mercury's gem — for intellect, speech and business." },
    suitableFor: { hi: "मिथुन, कन्या लग्न", en: "Gemini, Virgo ascendant" },
    priceHint: { hi: "₹3,000 / रत्ती से", en: "From ₹3,000 / ratti" },
    certified: true,
    image: "/images/shop/emerald-panna.jpg",
    planet: "mercury",
    variants: [v(3, 9000), v(4, 12000), v(5, 15000), v(6, 18000, false)],
  },
  {
    slug: "pearl-moti",
    sku: "GEM-MOT-001",
    category: "GEM",
    title: { hi: "मोती", en: "Pearl (Moti)" },
    description: { hi: "चंद्र का रत्न — मन की शांति, भावनात्मक संतुलन और नींद के लिए।", en: "Moon's gem — for calm, emotional balance and sleep." },
    suitableFor: { hi: "कर्क, वृश्चिक, मीन लग्न (कुंडली देखकर ही)", en: "Cancer, Scorpio, Pisces ascendant (only after chart review)" },
    priceHint: { hi: "₹1,200 / रत्ती से", en: "From ₹1,200 / ratti" },
    certified: true,
    image: "/images/shop/pearl-moti.jpg",
    planet: "moon",
    variants: [v(4, 4800), v(5, 6000), v(6, 7200), v(7, 8400, false)],
  },
  {
    slug: "red-coral-moonga",
    sku: "GEM-MOO-001",
    category: "GEM",
    title: { hi: "मूंगा", en: "Red Coral (Moonga)" },
    description: { hi: "मंगल का रत्न — साहस, ऊर्जा और रक्त-स्वास्थ्य के लिए।", en: "Mars's gem — for courage, energy and vitality." },
    suitableFor: { hi: "मेष, सिंह, वृश्चिक, धनु लग्न (कुंडली देखकर ही)", en: "Aries, Leo, Scorpio, Sagittarius ascendant (only after chart review)" },
    priceHint: { hi: "₹900 / रत्ती से", en: "From ₹900 / ratti" },
    certified: true,
    image: "/images/shop/red-coral-moonga.jpg",
    planet: "mars",
    variants: [v(5, 4500), v(6, 5400), v(7, 6300), v(8, 7200, false), v(9, 8100, false)],
  },
  {
    slug: "diamond-heera",
    sku: "GEM-HEE-001",
    category: "GEM",
    title: { hi: "हीरा", en: "Diamond (Heera)" },
    description: { hi: "शुक्र का रत्न — प्रेम, विवाह सुख, कला और वैभव के लिए।", en: "Venus's gem — for love, marital harmony, art and luxury." },
    suitableFor: { hi: "वृषभ, तुला, मकर, कुंभ लग्न (कुंडली देखकर ही)", en: "Taurus, Libra, Capricorn, Aquarius ascendant (only after chart review)" },
    priceHint: { hi: "₹45,000 / कैरेट से", en: "From ₹45,000 / carat" },
    certified: true,
    image: "/images/shop/diamond-heera.jpg",
    planet: "venus",
    variants: [v(0.5, 22500), v(0.75, 33750), v(1, 45000, false), v(1.5, 67500, false)],
  },
  {
    slug: "hessonite-gomed",
    sku: "GEM-GOM-001",
    category: "GEM",
    title: { hi: "गोमेद", en: "Hessonite (Gomed)" },
    description: { hi: "राहु का रत्न — भ्रम दूर करने और अचानक अवसरों के लिए; सलाह के बाद ही।", en: "Rahu's gem — clears confusion, sudden opportunities; only after advice." },
    suitableFor: { hi: "केवल ज्योतिषी की सलाह पर", en: "Only on a Jyotish's advice" },
    priceHint: { hi: "₹700 / रत्ती से", en: "From ₹700 / ratti" },
    certified: true,
    image: "/images/shop/hessonite-gomed.jpg",
    planet: "rahu",
    variants: [v(5, 3500), v(6, 4200), v(7, 4900, false), v(8, 5600, false)],
  },
  {
    slug: "cats-eye-lehsunia",
    sku: "GEM-LEH-001",
    category: "GEM",
    title: { hi: "लहसुनिया", en: "Cat's Eye (Lehsunia)" },
    description: { hi: "केतु का रत्न — आध्यात्मिक सुरक्षा और एकाग्रता; सलाह के बाद ही।", en: "Ketu's gem — spiritual protection and focus; only after advice." },
    suitableFor: { hi: "केवल ज्योतिषी की सलाह पर", en: "Only on a Jyotish's advice" },
    priceHint: { hi: "₹1,500 / रत्ती से", en: "From ₹1,500 / ratti" },
    certified: true,
    image: "/images/shop/cats-eye-lehsunia.jpg",
    planet: "ketu",
    variants: [v(4, 6000, false), v(5, 7500), v(6, 9000), v(7, 10500, false)],
  },
  {
    slug: "panchmukhi-rudraksha",
    sku: "RUD-005-001",
    category: "RUDRAKSHA",
    title: { hi: "पंचमुखी रुद्राक्ष", en: "Five-Mukhi Rudraksha" },
    description: { hi: "नेपाली, प्राण-प्रतिष्ठित — मानसिक शांति के लिए।", en: "Nepali, energised — for peace of mind." },
    suitableFor: { hi: "सभी के लिए", en: "Suitable for everyone" },
    priceHint: { hi: "₹1,100 से", en: "From ₹1,100" },
    certified: true,
    image: "/images/shop/panchmukhi-rudraksha.jpg",
  },
  {
    slug: "shri-yantra",
    sku: "YAN-SHR-001",
    category: "YANTRA",
    title: { hi: "श्री यंत्र (ताम्र)", en: "Shri Yantra (Copper)" },
    description: { hi: "समृद्धि और सकारात्मक ऊर्जा के लिए, विधिवत सिद्ध।", en: "For prosperity and positive energy, ritually energised." },
    suitableFor: { hi: "घर, ऑफिस का पूजा स्थान", en: "Home or office prayer space" },
    priceHint: { hi: "₹2,100 से", en: "From ₹2,100" },
    certified: false,
    image: "/images/shop/shri-yantra.jpg",
  },
  {
    slug: "vastu-pyramid-set",
    sku: "VAS-PYR-001",
    category: "VASTU",
    title: { hi: "वास्तु पिरामिड सेट", en: "Vastu Pyramid Set" },
    description: { hi: "बिना तोड़-फोड़ वास्तु दोष सुधार के लिए।", en: "Correct Vastu defects without demolition." },
    suitableFor: { hi: "वास्तु परामर्श के बाद", en: "After a Vastu consultation" },
    priceHint: { hi: "₹1,500 से", en: "From ₹1,500" },
    certified: false,
    image: "/images/shop/vastu-pyramid-set.jpg",
  },
];

export const getService = (slug: string) => SERVICES.find((s) => s.slug === slug);
export const getProblem = (slug: string) => PROBLEMS.find((p) => p.slug === slug);
export const getProduct = (slug: string) => PRODUCTS.find((p) => p.slug === slug);
/** The shop gem that serves a planet (AMX-204). */
export const gemProductFor = (planet: string) => PRODUCTS.find((p) => p.category === "GEM" && p.planet === planet);
export const pick = (b: Bilingual, locale: string) => (locale === "en" ? b.en : b.hi);

/** Business contact settings (moved to CMS Settings in AMX-143). */
export const SETTINGS = {
  whatsappNumber: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "91XXXXXXXXXX",
  officeAddress: { hi: "कार्यालय पता — जल्द अपडेट होगा", en: "Office address — to be updated" },
  workingHours: { start: 10, end: 19, days: [1, 2, 3, 4, 5, 6] }, // Mon–Sat, 10:00–19:00 IST
  holdMinutes: 10,
  cancellationHours: 24,
  timeZone: "Asia/Kolkata",
};
