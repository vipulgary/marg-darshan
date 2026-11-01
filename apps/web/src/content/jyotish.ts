/**
 * Jyotish profile for /about-jyotish and the home "Meet the Jyotish" section.
 * The client has not supplied the bio yet: everything below is deliberately generic
 * placeholder copy. Moves to the Payload JyotishProfile collection in AMX-030.
 */
import type { Bilingual } from "./catalog";

export interface LineageEntry {
  period: Bilingual;
  title: Bilingual;
  detail: Bilingual;
}

export interface Credential {
  title: Bilingual;
  detail: Bilingual;
}

export interface StorySection {
  id: string;
  heading: Bilingual;
  paragraphs: Bilingual[];
}

export const JYOTISH = {
  // TODO(client): replace
  name: { hi: "आचार्य जी", en: "Acharya Ji" } as Bilingual,
  // TODO(client): replace
  initials: { hi: "आ", en: "AJ" } as Bilingual,
  // TODO(client): replace
  role: { hi: "वैदिक ज्योतिषाचार्य एवं वास्तु सलाहकार", en: "Vedic Jyotish & Vastu Consultant" } as Bilingual,
  // TODO(client): replace
  tagline: {
    hi: "शास्त्र की गहराई, आज की भाषा में — ताकि हर सलाह आपके जीवन में काम आए।",
    en: "The depth of the shastras, in today's language — so every piece of advice works in your real life.",
  } as Bilingual,
  // TODO(client): replace
  shortBio: {
    hi: "पारंपरिक गुरु-शिष्य परंपरा में प्रशिक्षित, आचार्य जी कुंडली, दशा और गोचर के आधार पर स्पष्ट और व्यावहारिक मार्गदर्शन देते हैं। उनका मानना है कि ज्योतिष डराने के लिए नहीं, दिशा देने के लिए है।",
    en: "Trained in the traditional guru–shishya lineage, Acharya Ji offers clear, practical guidance grounded in your birth chart, dashas and transits. He believes Jyotish exists to give direction, never to frighten.",
  } as Bilingual,
  // TODO(client): replace
  quote: {
    hi: "ग्रह मजबूर नहीं करते, संकेत देते हैं। सही समय पर सही कदम — यही ज्योतिष का सार है।",
    en: "The planets don't compel, they indicate. The right step at the right time — that is the essence of Jyotish.",
  } as Bilingual,
  // TODO(client): replace — verify every number before launch
  stats: { years: 20, consultations: 10000, rating: 4.9 },
  // TODO(client): replace
  chips: [
    { hi: "पाराशरी ज्योतिष", en: "Parashari Jyotish" },
    { hi: "वास्तु शास्त्र", en: "Vastu Shastra" },
    { hi: "रत्न विज्ञान", en: "Gemology" },
    { hi: "जन्म समय शोधन", en: "Birth-time rectification" },
  ] as Bilingual[],
  // TODO(client): replace
  languages: { hi: "हिंदी, English", en: "Hindi, English" } as Bilingual,
  // TODO(client): replace
  story: [
    {
      id: "journey",
      heading: { hi: "यात्रा की शुरुआत", en: "Where the journey began" },
      paragraphs: [
        {
          hi: "बचपन से ही घर में पंचांग, मुहूर्त और शास्त्र-चर्चा का वातावरण रहा। यहीं से ग्रहों की भाषा को समझने की जिज्ञासा जागी, जो आगे चलकर जीवन का उद्देश्य बन गई।",
          en: "He grew up in a home where the panchang, muhurta and scriptural discussion were part of daily life. That early curiosity about the language of the planets slowly became a life's purpose.",
        },
        {
          hi: "गुरु के सान्निध्य में वर्षों तक पाराशरी पद्धति, दशा-गणना और फलित का अध्ययन किया — हर सिद्धांत को वास्तविक कुंडलियों पर परखते हुए।",
          en: "Years of study under his guru followed — the Parashari system, dasha calculation and predictive technique — with every principle tested against real charts.",
        },
      ],
    },
    {
      id: "approach",
      heading: { hi: "परामर्श का तरीका", en: "How he consults" },
      paragraphs: [
        {
          hi: "हर परामर्श से पहले आपकी कुंडली, वर्ग-चार्ट और चल रही दशा का अध्ययन किया जाता है। बातचीत में तकनीकी शब्दों की जगह साफ़ भाषा और ठोस अगले कदम होते हैं।",
          en: "Before every session your birth chart, divisional charts and running dasha are studied in advance. In the conversation, jargon gives way to plain language and concrete next steps.",
        },
        {
          hi: "उपाय हमेशा सरल और आपकी परिस्थिति के अनुसार — मंत्र, दान, जीवनशैली में बदलाव या ज़रूरत हो तो रत्न। महंगे उपायों का दबाव कभी नहीं।",
          en: "Remedies are always simple and suited to your situation — mantra, charity, lifestyle changes or, only when warranted, a gemstone. Never pressure to buy expensive fixes.",
        },
      ],
    },
    {
      id: "vastu",
      heading: { hi: "वास्तु और रत्न", en: "Vastu and gemstones" },
      paragraphs: [
        {
          hi: "घर, दुकान, ऑफिस और फैक्ट्री के वास्तु परामर्श में नक्शे, दिशा और उपयोग — तीनों को साथ देखा जाता है, ताकि सुधार बिना अनावश्यक तोड़-फोड़ के हो सकें।",
          en: "Vastu work for homes, shops, offices and factories looks at the floor plan, orientation and actual use together, so corrections rarely need demolition.",
        },
        {
          hi: "रत्न केवल कुंडली की पूरी जाँच के बाद सुझाए जाते हैं — सही ग्रह, सही वज़न, सही धातु और धारण का शुभ समय।",
          en: "Gemstones are suggested only after a full chart review — the right planet, weight, metal and an auspicious time to wear it.",
        },
      ],
    },
  ] as StorySection[],
  // TODO(client): replace
  lineage: [
    {
      period: { hi: "प्रारंभिक वर्ष", en: "Early years" },
      title: { hi: "पारिवारिक परंपरा", en: "Family tradition" },
      detail: { hi: "पंचांग और मुहूर्त गणना से पहला परिचय।", en: "First introduction to panchang and muhurta calculation." },
    },
    {
      period: { hi: "गुरुकुल अध्ययन", en: "Gurukul study" },
      title: { hi: "गुरु-शिष्य परंपरा में दीक्षा", en: "Initiation in the guru–shishya lineage" },
      detail: { hi: "बृहत् पाराशर होरा शास्त्र, फलदीपिका और जातक पारिजात का अध्ययन।", en: "Study of Brihat Parashara Hora Shastra, Phaladeepika and Jataka Parijata." },
    },
    {
      period: { hi: "विशेषज्ञता", en: "Specialisation" },
      title: { hi: "वास्तु और रत्न शास्त्र", en: "Vastu and gem shastra" },
      detail: { hi: "आवासीय और व्यावसायिक वास्तु तथा रत्न-चयन में विशेष प्रशिक्षण।", en: "Focused training in residential and commercial Vastu and gemstone selection." },
    },
    {
      period: { hi: "आज", en: "Today" },
      title: { hi: "ऑनलाइन और व्यक्तिगत परामर्श", en: "Online and in-person consultations" },
      detail: { hi: "देश-विदेश के परिवारों को हिंदी और अंग्रेज़ी में मार्गदर्शन।", en: "Guiding families in India and abroad, in Hindi and English." },
    },
  ] as LineageEntry[],
  // TODO(client): replace
  credentials: [
    {
      title: { hi: "ज्योतिषाचार्य", en: "Jyotishacharya" },
      detail: { hi: "मान्यता प्राप्त संस्थान से उपाधि (विवरण जल्द)", en: "Degree from a recognised institution (details soon)" },
    },
    {
      title: { hi: "वास्तु विशेषज्ञ", en: "Vastu specialist" },
      detail: { hi: "आवासीय, व्यावसायिक और औद्योगिक वास्तु", en: "Residential, commercial and industrial Vastu" },
    },
    {
      title: { hi: "रत्न परामर्श", en: "Gemstone advisory" },
      detail: { hi: "केवल प्रमाणित (lab certified) रत्नों की सलाह", en: "Recommends lab-certified stones only" },
    },
    {
      title: { hi: "जन्म समय शोधन", en: "Birth-time rectification" },
      detail: { hi: "जीवन की घटनाओं और दशा से समय-निर्धारण", en: "Timing from life events and dashas" },
    },
  ] as Credential[],
  // TODO(client): replace
  philosophy: {
    hi: "ज्योतिष भय का नहीं, विवेक का शास्त्र है। मेरा काम आपको डराना नहीं, आपके सामने रास्ता रोशन करना है।",
    en: "Jyotish is a science of discernment, not of fear. My work is not to frighten you but to light up the path in front of you.",
  } as Bilingual,
  // TODO(client): replace — YouTube/Vimeo embed id for the intro video, or null to show the placeholder
  videoId: null as string | null,
};
