// DRAFT — to be reviewed and approved by the client's Jyotish before launch
import type { Bi } from "./meta";

/** Janma nakshatra traits, keyed 1 (Ashwini) .. 27 (Revati). Deity per classical texts. */
export const NAKSHATRA: Record<number, { deity: Bi; traits: Bi }> = {
  1: { deity: { hi: "अश्विनी कुमार", en: "the Ashwini Kumaras" }, traits: { hi: "तेज़, उपचार करने वाली ऊर्जा और नई शुरुआत का साहस।", en: "Swift, healing energy and the courage to begin new things." } },
  2: { deity: { hi: "यम", en: "Yama" }, traits: { hi: "धैर्य, ज़िम्मेदारी और जीवन के बड़े बदलाव संभालने की क्षमता।", en: "Endurance, responsibility and the strength to carry life's big transitions." } },
  3: { deity: { hi: "अग्नि", en: "Agni" }, traits: { hi: "तीक्ष्ण बुद्धि, स्पष्टवादिता और गलत को काटने का साहस।", en: "A sharp mind, frankness and the courage to cut away what is wrong." } },
  4: { deity: { hi: "ब्रह्मा", en: "Brahma" }, traits: { hi: "आकर्षण, रचनात्मकता और सुख-समृद्धि बढ़ाने की कला।", en: "Charm, creativity and a gift for growing comfort and prosperity." } },
  5: { deity: { hi: "सोम", en: "Soma" }, traits: { hi: "जिज्ञासु, खोजी और कोमल स्वभाव; ज्ञान की सतत खोज।", en: "Curious, searching and gentle; a lifelong seeker of knowledge." } },
  6: { deity: { hi: "रुद्र", en: "Rudra" }, traits: { hi: "गहरी भावनाएँ, परिवर्तन से निखरने वाला स्वभाव और तीक्ष्ण विश्लेषण।", en: "Intense feelings, a nature that grows through upheaval, and sharp analysis." } },
  7: { deity: { hi: "अदिति", en: "Aditi" }, traits: { hi: "आशावाद, उदारता और गिरकर फिर उठने की शक्ति।", en: "Optimism, generosity and the power to rise again after setbacks." } },
  8: { deity: { hi: "बृहस्पति", en: "Brihaspati" }, traits: { hi: "पोषण करने वाला, धर्मपरायण और सबसे शुभ नक्षत्रों में एक।", en: "Nurturing, dutiful and counted among the most auspicious nakshatras." } },
  9: { deity: { hi: "सर्प (नाग)", en: "the Nagas" }, traits: { hi: "गहरी अंतर्दृष्टि, रणनीतिक सोच और रहस्यों की समझ।", en: "Deep insight, strategic thinking and an understanding of hidden matters." } },
  10: { deity: { hi: "पितर", en: "the Pitris (ancestors)" }, traits: { hi: "गरिमा, परंपरा से जुड़ाव और नेतृत्व का स्वाभाविक गुण।", en: "Dignity, a bond with tradition and natural leadership." } },
  11: { deity: { hi: "भग", en: "Bhaga" }, traits: { hi: "आनंद, रचनात्मकता और रिश्तों में गर्मजोशी।", en: "Joy, creativity and warmth in relationships." } },
  12: { deity: { hi: "अर्यमा", en: "Aryaman" }, traits: { hi: "मित्रता, वचन निभाना और सहयोग से सफलता।", en: "Friendship, keeping one's word and success through cooperation." } },
  13: { deity: { hi: "सविता", en: "Savitar" }, traits: { hi: "कुशल हाथ, व्यावहारिक बुद्धि और मेहनत से पहचान।", en: "Skilled hands, practical intelligence and recognition through effort." } },
  14: { deity: { hi: "विश्वकर्मा", en: "Vishwakarma" }, traits: { hi: "सौंदर्य-बोध, डिज़ाइन और निर्माण की प्रतिभा।", en: "An eye for beauty, design and a talent for building." } },
  15: { deity: { hi: "वायु", en: "Vayu" }, traits: { hi: "स्वतंत्रता, लचीलापन और व्यापार-कौशल।", en: "Independence, adaptability and business skill." } },
  16: { deity: { hi: "इंद्र-अग्नि", en: "Indra-Agni" }, traits: { hi: "लक्ष्य पर केंद्रित, महत्वाकांक्षी और धैर्य से जीतने वाला।", en: "Goal-focused, ambitious and victorious through persistence." } },
  17: { deity: { hi: "मित्र", en: "Mitra" }, traits: { hi: "सच्ची मित्रता, समर्पण और समूह में तालमेल।", en: "True friendship, devotion and harmony in groups." } },
  18: { deity: { hi: "इंद्र", en: "Indra" }, traits: { hi: "ज़िम्मेदारी, संरक्षण का भाव और अधिकार से काम करने की क्षमता।", en: "Responsibility, a protective instinct and the capacity to lead with authority." } },
  19: { deity: { hi: "निरृति", en: "Nirriti" }, traits: { hi: "जड़ तक जाने वाली खोज, सत्य की तलाश और पुराने को छोड़ने का साहस।", en: "Root-level enquiry, a search for truth and the courage to let go." } },
  20: { deity: { hi: "आपः (जल)", en: "Apah (the waters)" }, traits: { hi: "अजेय उत्साह, शुद्धता और प्रभावित करने की शक्ति।", en: "Invincible enthusiasm, purity and persuasive power." } },
  21: { deity: { hi: "विश्वदेव", en: "the Vishvadevas" }, traits: { hi: "स्थायी सफलता, नैतिकता और दूरगामी सोच।", en: "Lasting success, ethics and far-sighted thinking." } },
  22: { deity: { hi: "विष्णु", en: "Vishnu" }, traits: { hi: "सुनने और सीखने की कला, ज्ञान और संवाद से उन्नति।", en: "The art of listening and learning; progress through knowledge and communication." } },
  23: { deity: { hi: "अष्ट वसु", en: "the eight Vasus" }, traits: { hi: "समृद्धि, संगीत-प्रेम और समूह में चमकने की क्षमता।", en: "Prosperity, a love of rhythm and music, and the ability to shine in a group." } },
  24: { deity: { hi: "वरुण", en: "Varuna" }, traits: { hi: "उपचारक, स्वतंत्र विचारक और रहस्यों का शोधकर्ता।", en: "A healer, independent thinker and researcher of mysteries." } },
  25: { deity: { hi: "अज एकपाद", en: "Aja Ekapada" }, traits: { hi: "तीव्र संकल्प, आदर्शवाद और आध्यात्मिक गहराई।", en: "Fierce resolve, idealism and spiritual depth." } },
  26: { deity: { hi: "अहिर्बुध्न्य", en: "Ahirbudhnya" }, traits: { hi: "धैर्य, गहराई, ज्ञान और भीतर की स्थिरता।", en: "Patience, depth, wisdom and inner steadiness." } },
  27: { deity: { hi: "पूषा", en: "Pushan" }, traits: { hi: "करुणा, मार्गदर्शन और यात्राओं में संरक्षण।", en: "Compassion, guidance and protection on journeys." } },
};
