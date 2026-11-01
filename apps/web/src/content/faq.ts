/** FAQ content (moves to the Payload FAQs collection in AMX-030). */
import type { Bilingual } from "./catalog";

export type FaqCategory = "booking" | "payments" | "kundali" | "services" | "privacy";

export const FAQ_CATEGORIES: FaqCategory[] = ["booking", "services", "kundali", "payments", "privacy"];

export interface FaqItem {
  id: string;
  category: FaqCategory;
  /** Service slugs this answer is relevant to (service pages show these). */
  services?: string[];
  /** Shown in the home page FAQ (top 5 by order). */
  top?: boolean;
  q: Bilingual;
  a: Bilingual;
}

export const FAQS: FaqItem[] = [
  {
    id: "how-to-book",
    category: "booking",
    top: true,
    services: ["astrology", "vastu", "gems"],
    q: { hi: "परामर्श कैसे बुक करें?", en: "How do I book a consultation?" },
    a: {
      hi: "“परामर्श बुक करें” पर क्लिक करें, अपनी समस्या चुनें, Online या व्यक्तिगत भेंट और अवधि तय करें, विवरण भरें, समय चुनें और Razorpay से सुरक्षित भुगतान करें। पुष्टि ईमेल और WhatsApp पर तुरंत मिल जाती है।",
      en: "Tap “Book Consultation”, choose your concern, pick online or in-person and a duration, fill in your details, choose a slot and pay securely via Razorpay. Confirmation arrives instantly by email and WhatsApp.",
    },
  },
  {
    id: "online-vs-visit",
    category: "booking",
    top: true,
    services: ["astrology", "vastu", "gems"],
    q: { hi: "ऑनलाइन परामर्श और व्यक्तिगत भेंट में क्या अंतर है?", en: "What's the difference between online and in-person sessions?" },
    a: {
      hi: "दोनों में कुंडली का अध्ययन और समय एक जैसा है। ऑनलाइन परामर्श Zoom पर होता है और लिंक बुकिंग के बाद मिलता है; व्यक्तिगत भेंट हमारे कार्यालय में होती है। वास्तु साइट विज़िट में आचार्य जी आपकी जगह पर आते हैं।",
      en: "Both include the same chart preparation and session length. Online sessions run on Zoom with a link sent after booking; in-person sessions are at our office. For a Vastu site visit, Acharya Ji comes to your property.",
    },
  },
  {
    id: "reschedule",
    category: "booking",
    services: ["astrology", "vastu", "gems"],
    q: { hi: "क्या मैं अपना समय बदल सकता/सकती हूँ?", en: "Can I reschedule my session?" },
    a: {
      hi: "हाँ। सत्र से 24 घंटे पहले तक समय बदलना निःशुल्क है — WhatsApp पर संदेश भेजें। 24 घंटे से कम समय रहने पर बदलाव या रिफंड संभव नहीं है।",
      en: "Yes. Rescheduling is free up to 24 hours before the session — just message us on WhatsApp. Within 24 hours, changes and refunds are not possible.",
    },
  },
  {
    id: "what-to-prepare",
    category: "booking",
    services: ["astrology", "gems"],
    q: { hi: "परामर्श से पहले मुझे क्या तैयार रखना चाहिए?", en: "What should I keep ready before the session?" },
    a: {
      hi: "जन्म तिथि, जन्म समय और जन्म स्थान सही-सही रखें, और अपने 2–3 मुख्य प्रश्न लिख लें। ताकि समय का पूरा उपयोग हो सके।",
      en: "Have your exact date, time and place of birth ready, and write down your two or three main questions so the time is well used.",
    },
  },
  {
    id: "birth-time-unknown",
    category: "services",
    top: true,
    services: ["astrology"],
    q: { hi: "मुझे जन्म समय नहीं पता — क्या फिर भी परामर्श हो सकता है?", en: "I don't know my birth time — can I still consult?" },
    a: {
      hi: "बिल्कुल। Birth Time Finder में अपनी अनुमानित अवधि और जीवन की 4–6 प्रमुख घटनाएँ भरें। आचार्य जी जन्म समय शोधन करके सही कुंडली के आधार पर परामर्श देंगे।",
      en: "Absolutely. Use the Birth Time Finder to share an approximate window and four to six key life events. Acharya Ji rectifies your birth time and consults from the corrected chart.",
    },
  },
  {
    id: "vastu-without-demolition",
    category: "services",
    services: ["vastu"],
    q: { hi: "क्या वास्तु सुधार के लिए तोड़-फोड़ करनी पड़ेगी?", en: "Will Vastu corrections need demolition?" },
    a: {
      hi: "ज़्यादातर मामलों में नहीं। रंग, फर्नीचर की दिशा, उपयोग में बदलाव और सरल उपकरणों से अधिकांश दोष ठीक हो जाते हैं। संरचनात्मक बदलाव केवल तभी सुझाए जाते हैं जब कोई और रास्ता न हो।",
      en: "In most cases, no. Colours, furniture placement, changes in how rooms are used and simple remedies fix most defects. Structural changes are suggested only when there is no other way.",
    },
  },
  {
    id: "vastu-online",
    category: "services",
    services: ["vastu"],
    q: { hi: "क्या वास्तु परामर्श ऑनलाइन हो सकता है?", en: "Can a Vastu consultation be done online?" },
    a: {
      hi: "हाँ। बुकिंग के समय नक्शा (PDF/JPG) अपलोड करें और दिशा बताएं। ज़रूरत हो तो सत्र में वीडियो-कॉल पर जगह दिखा सकते हैं। बड़े प्रोजेक्ट के लिए साइट विज़िट बेहतर है।",
      en: "Yes. Upload your floor plan (PDF/JPG) and its facing while booking; you can also walk us through the space on the video call. For large projects, a site visit works best.",
    },
  },
  {
    id: "gem-without-chart",
    category: "services",
    top: true,
    services: ["gems"],
    q: { hi: "क्या बिना कुंडली देखे रत्न पहनना ठीक है?", en: "Is it safe to wear a gemstone without a chart review?" },
    a: {
      hi: "नहीं। गलत ग्रह का रत्न नुकसान भी कर सकता है। हम पहले कुंडली देखकर सही रत्न, वज़न, धातु और धारण का समय तय करते हैं — इसलिए शॉप पर भी पहले परामर्श की सलाह देते हैं।",
      en: "No. A stone for the wrong planet can do harm. We first review your chart to fix the right stone, weight, metal and wearing time — which is why even our shop recommends a consultation first.",
    },
  },
  {
    id: "gem-certified",
    category: "services",
    services: ["gems"],
    q: { hi: "क्या आपके रत्न प्रमाणित होते हैं?", en: "Are your gemstones certified?" },
    a: {
      hi: "हाँ, रत्न प्रतिष्ठित लैब के प्रमाण-पत्र के साथ आते हैं। शॉप में “Lab certified” बैज वाले उत्पादों के साथ प्रमाण-पत्र की प्रति मिलती है।",
      en: "Yes, our gemstones come with a certificate from a reputed lab. Products marked “Lab certified” in the shop ship with a copy of the certificate.",
    },
  },
  {
    id: "free-kundali",
    category: "kundali",
    top: true,
    q: { hi: "क्या मुफ्त कुंडली सच में मुफ्त है?", en: "Is the free Kundali really free?" },
    a: {
      hi: "हाँ, पूरी तरह मुफ्त। जन्म विवरण भरते ही लग्न, राशि, नक्षत्र, ग्रह स्थिति, दशा और प्रमुख दोष-योग दिख जाते हैं। विस्तृत विश्लेषण के लिए आप परामर्श बुक कर सकते हैं।",
      en: "Yes, completely free. Enter your birth details to see your Lagna, Rashi, Nakshatra, planetary positions, dashas and key doshas and yogas. Book a consultation for a detailed reading.",
    },
  },
  {
    id: "kundali-accuracy",
    category: "kundali",
    q: { hi: "कुंडली की गणना कितनी सटीक है?", en: "How accurate is the Kundali calculation?" },
    a: {
      hi: "गणना Swiss Ephemeris और लाहिरी अयनांश पर आधारित है — वही मानक जो अधिकांश वैदिक ज्योतिषी उपयोग करते हैं। सटीकता आपके दिए जन्म समय पर निर्भर करती है।",
      en: "Calculations use the Swiss Ephemeris with Lahiri ayanamsa — the standard most Vedic astrologers rely on. Accuracy ultimately depends on the birth time you provide.",
    },
  },
  {
    id: "payment-methods",
    category: "payments",
    services: ["astrology", "vastu", "gems"],
    q: { hi: "भुगतान कैसे कर सकते हैं?", en: "How can I pay?" },
    a: {
      hi: "Razorpay के ज़रिए UPI (GPay, PhonePe, Paytm), नेट बैंकिंग, डेबिट और क्रेडिट कार्ड से। आपकी कार्ड जानकारी हमारे पास कभी नहीं आती।",
      en: "Through Razorpay via UPI (GPay, PhonePe, Paytm), net banking, and debit or credit cards. Your card details never reach our servers.",
    },
  },
  {
    id: "split-plan",
    category: "payments",
    services: ["vastu"],
    q: { hi: "आंशिक भुगतान (Split Plan) क्या है?", en: "What is the Split Plan?" },
    a: {
      hi: "वास्तु जैसी बड़ी सेवाओं में आप 50% अग्रिम देकर स्लॉट पक्का कर सकते हैं। शेष राशि का भुगतान लिंक रिपोर्ट या साइट विज़िट से पहले भेजा जाता है।",
      en: "For larger services like Vastu, you can confirm the slot with a 50% advance. A payment link for the balance is sent before the report or site visit.",
    },
  },
  {
    id: "refund",
    category: "payments",
    q: { hi: "रिफंड कब और कैसे मिलता है?", en: "When and how are refunds issued?" },
    a: {
      hi: "यदि हम किसी कारण सत्र रद्द करते हैं तो पूरा रिफंड मिलता है। स्वीकृत रिफंड 5–7 कार्य-दिवसों में उसी माध्यम में लौटता है जिससे भुगतान हुआ था। पूरी जानकारी रिफंड नीति में है।",
      en: "If we cancel a session for any reason, you receive a full refund. Approved refunds return to the original payment method within 5–7 working days. See the refund policy for details.",
    },
  },
  {
    id: "privacy",
    category: "privacy",
    top: true,
    q: { hi: "क्या मेरी जानकारी गोपनीय रहती है?", en: "Is my information kept confidential?" },
    a: {
      hi: "हाँ। आपकी जन्म-जानकारी और बातचीत केवल परामर्श के लिए उपयोग होती है, किसी से साझा या बेची नहीं जाती। डेटा डिजिटल व्यक्तिगत डेटा संरक्षण अधिनियम, 2023 के अनुसार सुरक्षित रखा जाता है।",
      en: "Yes. Your birth details and conversations are used only for your consultation and are never shared or sold. Data is handled in line with India's Digital Personal Data Protection Act, 2023.",
    },
  },
  {
    id: "delete-data",
    category: "privacy",
    q: { hi: "मैं अपना डेटा कैसे हटवा सकता/सकती हूँ?", en: "How can I have my data deleted?" },
    a: {
      hi: "संपर्क पेज पर दिए ईमेल या WhatsApp पर अनुरोध भेजें। कानूनी रूप से आवश्यक रिकॉर्ड (जैसे भुगतान) छोड़कर आपका डेटा हटा दिया जाएगा।",
      en: "Send a request by email or WhatsApp from the contact page. We'll erase your data, except records we must keep by law (such as payment records).",
    },
  },
];

export const topFaqs = (n = 5) => FAQS.filter((f) => f.top).slice(0, n);
export const faqsForService = (slug: string) => FAQS.filter((f) => f.services?.includes(slug));
