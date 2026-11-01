// DRAFT — to be reviewed and approved by the client's Jyotish before launch
import type { Bi } from "./meta";

export interface RashiReading {
  mind: Bi;
  tip: Bi;
}

/** Moon-sign (Rashi) readings: emotional nature and a practical tip. Keyed 1..12. */
export const RASHI: Record<number, RashiReading> = {
  1: { mind: { hi: "मेष राशि का चंद्र मन को उत्साही और तुरंत प्रतिक्रिया देने वाला बनाता है। भावनाएँ तेज़ आती हैं और जल्दी शांत भी हो जाती हैं।", en: "A Moon in Aries gives an eager, quick-reacting mind. Feelings flare fast and settle just as fast." }, tip: { hi: "बड़ा फ़ैसला लेने से पहले दस गहरी साँसें लें।", en: "Take ten deep breaths before any big decision." } },
  2: { mind: { hi: "वृषभ में चंद्र उच्च का होता है — मन स्थिर, संतोषी और सौंदर्य-प्रेमी रहता है। आप भावनात्मक रूप से भरोसेमंद हैं।", en: "The Moon is exalted in Taurus — the mind is calm, contented and fond of comfort. You are emotionally dependable." }, tip: { hi: "बदलाव को धीरे-धीरे अपनाएँ, पर टालें नहीं।", en: "Embrace change gradually, but don't postpone it." } },
  3: { mind: { hi: "मिथुन का चंद्र मन को जिज्ञासु और चंचल बनाता है। बातचीत और नई जानकारी से आपको भावनात्मक ऊर्जा मिलती है।", en: "A Gemini Moon makes the mind curious and lively. Conversation and new ideas recharge you emotionally." }, tip: { hi: "डायरी लिखना मन के विचारों को व्यवस्थित करता है।", en: "Journaling helps settle a busy mind." } },
  4: { mind: { hi: "कर्क चंद्र की अपनी राशि है — मन कोमल, ममतामयी और घर से गहराई से जुड़ा होता है।", en: "Cancer is the Moon's own sign — a tender, nurturing mind deeply tied to home and family." }, tip: { hi: "अपने लिए भी उतनी ही देखभाल करें जितनी दूसरों की करते हैं।", en: "Care for yourself as much as you care for others." } },
  5: { mind: { hi: "सिंह का चंद्र मन को गर्मजोशी भरा और गरिमापूर्ण बनाता है। सराहना से आप खिल उठते हैं।", en: "A Leo Moon gives a warm, proud heart that blossoms with appreciation." }, tip: { hi: "दूसरों की तारीफ़ खुलकर करें — वही लौटकर आती है।", en: "Praise others generously — it comes back to you." } },
  6: { mind: { hi: "कन्या का चंद्र मन को विश्लेषणात्मक और सेवाभावी बनाता है। आप भावनाओं को भी तर्क से समझना चाहते हैं।", en: "A Virgo Moon gives an analytical, helpful mind that wants to reason through feelings." }, tip: { hi: "चिंता की सूची के साथ आभार की सूची भी बनाएँ।", en: "Keep a gratitude list next to the worry list." } },
  7: { mind: { hi: "तुला का चंद्र मन को संतुलन, सौहार्द और साथ की चाह देता है।", en: "A Libra Moon seeks balance, harmony and companionship." }, tip: { hi: "अपनी पसंद को भी उतना ही महत्व दें जितना दूसरों की।", en: "Give your own preferences the same weight as others'." } },
  8: { mind: { hi: "वृश्चिक में चंद्र नीच का माना जाता है — भावनाएँ गहरी और तीव्र होती हैं, पर इससे गहरी अंतर्दृष्टि भी मिलती है।", en: "The Moon is debilitated in Scorpio — feelings run deep and intense, which also brings profound insight." }, tip: { hi: "ध्यान और विश्वसनीय मित्र से बातचीत मन को हल्का रखते हैं।", en: "Meditation and a trusted confidant keep the heart light." } },
  9: { mind: { hi: "धनु का चंद्र मन को आशावादी और दार्शनिक बनाता है। अर्थ और उद्देश्य से आपको सुकून मिलता है।", en: "A Sagittarius Moon is optimistic and philosophical; meaning and purpose bring you peace." }, tip: { hi: "किसी वादे से पहले समय और क्षमता जाँच लें।", en: "Check time and capacity before making promises." } },
  10: { mind: { hi: "मकर का चंद्र मन को गंभीर, संयमी और ज़िम्मेदार बनाता है। आप भावनाएँ कम दिखाते हैं पर गहराई से निभाते हैं।", en: "A Capricorn Moon is serious, reserved and responsible — you show little but stand by people deeply." }, tip: { hi: "काम के बीच छोटी खुशियों के लिए समय निकालें।", en: "Schedule small joys between the work." } },
  11: { mind: { hi: "कुंभ का चंद्र मन को स्वतंत्र, मित्रवत और आदर्शवादी बनाता है।", en: "An Aquarius Moon is independent, friendly and idealistic." }, tip: { hi: "दिल की बात कहना कमज़ोरी नहीं, ताक़त है।", en: "Sharing your feelings is strength, not weakness." } },
  12: { mind: { hi: "मीन का चंद्र मन को करुणामय, कल्पनाशील और भावुक बनाता है। आप दूसरों का दर्द महसूस कर लेते हैं।", en: "A Pisces Moon is compassionate, imaginative and sensitive — you feel others' pain." }, tip: { hi: "भीड़ और तनाव के बाद अकेले में थोड़ा समय ज़रूर बिताएँ।", en: "Take quiet time alone after crowds or stress." } },
};
