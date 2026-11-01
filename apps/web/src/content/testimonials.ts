// SAMPLE CONTENT — replace with real, consented client testimonials before launch
import type { Bilingual } from "./catalog";

export interface Testimonial {
  id: string;
  /** First name only — never publish a surname without written consent. */
  name: Bilingual;
  city: Bilingual;
  problemSlug: string;
  rating: 1 | 2 | 3 | 4 | 5;
  text: Bilingual;
}

export const TESTIMONIALS: Testimonial[] = [
  {
    id: "t1",
    name: { hi: "प्रिया", en: "Priya" },
    city: { hi: "जयपुर", en: "Jaipur" },
    problemSlug: "career",
    rating: 5,
    text: {
      hi: "नौकरी बदलने को लेकर बहुत उलझन थी। आचार्य जी ने दशा देखकर सही समय बताया और तीन महीने में नई नौकरी मिल गई।",
      en: "I was torn about switching jobs. Acharya Ji read my dasha, suggested the right window, and I had a new role within three months.",
    },
  },
  {
    id: "t2",
    name: { hi: "राहुल", en: "Rahul" },
    city: { hi: "इंदौर", en: "Indore" },
    problemSlug: "vastu-commercial",
    rating: 5,
    text: {
      hi: "दुकान का वास्तु बिना तोड़-फोड़ के ठीक हुआ। नक्शा ऑनलाइन भेजा, सलाह बहुत व्यावहारिक थी।",
      en: "Our shop's Vastu was corrected without any demolition. I sent the floor plan online and the advice was very practical.",
    },
  },
  {
    id: "t3",
    name: { hi: "सुनीता", en: "Sunita" },
    city: { hi: "लखनऊ", en: "Lucknow" },
    problemSlug: "marriage",
    rating: 5,
    text: {
      hi: "बेटी की कुंडली मिलान में हर बात शांति से समझाई गई। डर की जगह भरोसा मिला।",
      en: "Every point of my daughter's match was explained calmly. We came away with confidence instead of fear.",
    },
  },
  {
    id: "t4",
    name: { hi: "अमित", en: "Amit" },
    city: { hi: "पुणे", en: "Pune" },
    problemSlug: "gemstone",
    rating: 5,
    text: {
      hi: "पहले किसी ने बिना कुंडली देखे नीलम पहनने को कहा था। यहाँ पूरी जाँच के बाद सही रत्न और वज़न बताया गया।",
      en: "Someone once told me to wear a blue sapphire without seeing my chart. Here I got the right stone and weight after a proper review.",
    },
  },
  {
    id: "t5",
    name: { hi: "नेहा", en: "Neha" },
    city: { hi: "दिल्ली", en: "Delhi" },
    problemSlug: "birth-time-unknown",
    rating: 5,
    text: {
      hi: "मुझे अपना जन्म समय नहीं पता था। जीवन की घटनाओं से समय निकाला गया — अब कुंडली पर पूरा भरोसा है।",
      en: "I never knew my birth time. It was worked out from my life events — now I can actually trust my chart.",
    },
  },
  {
    id: "t6",
    name: { hi: "विकास", en: "Vikas" },
    city: { hi: "भोपाल", en: "Bhopal" },
    problemSlug: "finance",
    rating: 5,
    text: {
      hi: "Zoom पर परामर्श उतना ही सहज था जितना आमने-सामने। बातें साफ़, कोई डराने वाली भविष्यवाणी नहीं।",
      en: "The Zoom session felt as personal as meeting face to face. Clear guidance and no fear-mongering predictions.",
    },
  },
  {
    id: "t7",
    name: { hi: "कविता", en: "Kavita" },
    city: { hi: "अहमदाबाद", en: "Ahmedabad" },
    problemSlug: "vastu-residential",
    rating: 5,
    text: {
      hi: "नए घर में जाने से पहले वास्तु देखा। छोटे-छोटे बदलाव बताए जो हम खुद कर सके।",
      en: "We had Vastu checked before moving into our new home. Small, doable changes we could make ourselves.",
    },
  },
  {
    id: "t8",
    name: { hi: "संदीप", en: "Sandeep" },
    city: { hi: "वाराणसी", en: "Varanasi" },
    problemSlug: "health",
    rating: 5,
    text: {
      hi: "स्वास्थ्य को लेकर चिंता थी। ज्योतिषीय उपाय के साथ डॉक्टर से मिलते रहने की सलाह भी दी — यह ईमानदारी अच्छी लगी।",
      en: "I was anxious about my health. Along with remedies, I was told to keep seeing my doctor — I valued that honesty.",
    },
  },
];
