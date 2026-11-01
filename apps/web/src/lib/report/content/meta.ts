// DRAFT — to be reviewed and approved by the client's Jyotish before launch

/** Bilingual text unit used by all report content files. */
export interface Bi {
  hi: string;
  en: string;
}

/** Flip to true only after the client's Jyotish has signed off every content file. */
export const REPORT_REVIEWED = false;

export const CONTENT_VERSION = "2026.11-draft";

export const DISCLAIMER: Bi = {
  hi: "यह फलादेश आपकी जन्म कुंडली के पारंपरिक वैदिक नियमों पर आधारित एक सामान्य मार्गदर्शन है। यह कोई निश्चित भविष्यवाणी नहीं है और चिकित्सा, कानूनी या वित्तीय सलाह का विकल्प नहीं है। रत्न धारण करने या कोई बड़ा उपाय शुरू करने से पहले अनुभवी ज्योतिषी से व्यक्तिगत परामर्श अवश्य लें।",
  en: "This reading is general guidance based on traditional Vedic rules applied to your birth chart. It is not a fixed prediction and is not a substitute for medical, legal or financial advice. Please consult an experienced Jyotish personally before wearing a gemstone or beginning any major remedy.",
};

export const GEM_NOTE: Bi = {
  hi: "रत्न केवल ज्योतिषी से परामर्श के बाद ही धारण करें — कुंडली की पूरी जाँच, रत्न की शुद्धता और सही वजन ज़रूरी है।",
  en: "Wear a gemstone only after consulting the Jyotish — it needs a full chart check, a genuine stone and the right weight.",
};
