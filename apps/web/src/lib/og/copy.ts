import type { Bilingual } from "@/content/catalog";

/** AMX-038: share-card copy for the static pages (kept short — it is drawn at 56–78px). */
export const OG_COPY = {
  home: {
    eyebrow: { hi: "वैदिक ज्योतिष · वास्तु · रत्न", en: "Vedic astrology · Vastu · Gems" },
    title: { hi: "आपकी कुंडली, सही मार्गदर्शन", en: "Your chart, guided with clarity" },
    subtitle: { hi: "ऑनलाइन या व्यक्तिगत परामर्श — हिंदी और English में", en: "Online or in-person consultations in Hindi & English" },
  },
  about: {
    eyebrow: { hi: "हमारे ज्योतिषाचार्य", en: "Meet the Jyotish" },
    title: { hi: "परंपरा, अनुभव और ईमानदार सलाह", en: "Tradition, experience, honest advice" },
    subtitle: { hi: "वैदिक ज्योतिष, वास्तु और रत्न विज्ञान", en: "Vedic astrology, Vastu and gemology" },
  },
  freeKundali: {
    eyebrow: { hi: "मुफ्त कुंडली", en: "Free Kundali" },
    title: { hi: "अपनी जन्म कुंडली मुफ्त देखें", en: "Get your birth chart free" },
    subtitle: { hi: "लग्न, ग्रह स्थिति, दशा और दोष विश्लेषण", en: "Lagna, planets, dasha and dosha analysis" },
  },
  pricing: {
    eyebrow: { hi: "शुल्क और प्लान", en: "Fees & plans" },
    title: { hi: "स्पष्ट शुल्क, कोई छिपा खर्च नहीं", en: "Clear fees, no hidden costs" },
    subtitle: { hi: "ज्योतिष, वास्तु और रत्न परामर्श — UPI से भुगतान", en: "Astrology, Vastu and gem consultations — pay by UPI" },
  },
  service: { hi: "परामर्श सेवा", en: "Consultation" },
  shop: { hi: "Marg Darshan रत्न भंडार", en: "Marg Darshan gem store" },
} satisfies Record<string, Bilingual | Record<string, Bilingual>>;

export const OG_ALT = {
  home: "Marg Darshan — Vedic astrology, Vastu and gemstone consulting",
  about: "Marg Darshan — about our Jyotish",
  freeKundali: "Marg Darshan — free Kundali (Vedic birth chart)",
  pricing: "Marg Darshan — consultation fees and plans",
  service: "Marg Darshan consultation service",
  shop: "Marg Darshan gemstone and spiritual product",
};

export const ogLocale = (locale: string) => (locale === "en" ? "en" : "hi");
