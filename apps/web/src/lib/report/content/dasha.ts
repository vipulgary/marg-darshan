// DRAFT — to be reviewed and approved by the client's Jyotish before launch
import type { PlanetKey } from "@/lib/contracts";
import type { Bi } from "./meta";

/** Mahadasha themes (what the period tends to emphasise), plus a short antardasha flavour line. */
export const DASHA: Record<PlanetKey, { theme: Bi; focus: Bi; antar: Bi }> = {
  sun: {
    theme: { hi: "पहचान, अधिकार और आत्मविश्वास का समय।", en: "A period of recognition, authority and self-confidence." },
    focus: { hi: "करियर में नेतृत्व, सरकार/वरिष्ठों से संबंध और पिता के साथ रिश्ते पर ध्यान दें।", en: "Focus on leadership at work, dealings with government or seniors, and your bond with your father." },
    antar: { hi: "आत्मविश्वास और दृश्यता बढ़ती है; अहंकार से बचें।", en: "Visibility and confidence rise; keep ego in check." },
  },
  moon: {
    theme: { hi: "भावनाओं, परिवार और जनसंपर्क का समय।", en: "A period of emotions, family and public life." },
    focus: { hi: "घर, माता, मानसिक शांति और यात्राएँ प्रमुख रहेंगी; नींद और दिनचर्या संतुलित रखें।", en: "Home, mother, peace of mind and travel come forward; keep sleep and routine balanced." },
    antar: { hi: "मन संवेदनशील रहता है; रिश्तों और आराम पर ध्यान बढ़ता है।", en: "The mind is sensitive; relationships and comfort take priority." },
  },
  mars: {
    theme: { hi: "ऊर्जा, साहस और ठोस कदम उठाने का समय।", en: "A period of energy, courage and decisive action." },
    focus: { hi: "संपत्ति, तकनीकी काम, खेल और प्रतियोगिता में लाभ; क्रोध और जल्दबाज़ी पर नियंत्रण रखें।", en: "Gains through property, technical work, sport and competition; control anger and haste." },
    antar: { hi: "गति तेज़ होती है; विवाद और चोट से सावधान रहें।", en: "Pace quickens; be careful with disputes and injuries." },
  },
  rahu: {
    theme: { hi: "महत्वाकांक्षा, अचानक बदलाव और नए क्षेत्रों का समय।", en: "A period of ambition, sudden change and unfamiliar territory." },
    focus: { hi: "विदेश, तकनीक और बड़े अवसर संभव हैं; जल्दी अमीर बनने के शॉर्टकट और भ्रम से बचें।", en: "Foreign links, technology and big opportunities are possible; avoid get-rich-quick shortcuts and confusion." },
    antar: { hi: "अप्रत्याशित घटनाएँ; हर निर्णय दो बार जाँचें।", en: "Unexpected turns; double-check every decision." },
  },
  jupiter: {
    theme: { hi: "विस्तार, ज्ञान और आशीर्वाद का समय।", en: "A period of growth, wisdom and blessings." },
    focus: { hi: "शिक्षा, विवाह, संतान, धर्म और गुरु से जुड़ी बातें शुभ रहती हैं; उदारता और अनुशासन दोनों रखें।", en: "Education, marriage, children, faith and mentors are favoured; pair generosity with discipline." },
    antar: { hi: "मार्गदर्शन और अवसर मिलते हैं; अति-आत्मविश्वास से बचें।", en: "Guidance and openings arrive; avoid over-promising." },
  },
  saturn: {
    theme: { hi: "मेहनत, धैर्य और स्थायी नींव का समय।", en: "A period of hard work, patience and lasting foundations." },
    focus: { hi: "धीमी लेकिन पक्की प्रगति; अनुशासन, सेवा और ईमानदारी से किया गया काम बड़ा फल देता है।", en: "Slow but solid progress; discipline, service and honest effort pay off handsomely." },
    antar: { hi: "ज़िम्मेदारियाँ बढ़ती हैं; धैर्य सबसे बड़ा उपाय है।", en: "Responsibilities grow; patience is the best remedy." },
  },
  mercury: {
    theme: { hi: "बुद्धि, संवाद और व्यापार का समय।", en: "A period of intellect, communication and trade." },
    focus: { hi: "पढ़ाई, लेखन, व्यापार, गणना और नेटवर्किंग में लाभ; बिखराव से बचें।", en: "Gains through study, writing, business, numbers and networking; avoid scattering your energy." },
    antar: { hi: "नए कौशल और सौदे; अनुबंध ध्यान से पढ़ें।", en: "New skills and deals; read contracts carefully." },
  },
  ketu: {
    theme: { hi: "आत्म-चिंतन, वैराग्य और आध्यात्मिक गहराई का समय।", en: "A period of reflection, detachment and spiritual depth." },
    focus: { hi: "पुराने बंधन ढीले होते हैं; शोध, ध्यान और आध्यात्म में प्रगति, भौतिक मामलों में स्पष्टता रखें।", en: "Old attachments loosen; progress in research, meditation and spirituality — keep material matters clear." },
    antar: { hi: "अचानक अलगाव या बदलाव; भीतर की आवाज़ सुनें।", en: "Sudden endings or shifts; listen to your inner voice." },
  },
  venus: {
    theme: { hi: "प्रेम, सुख-सुविधा और रचनात्मकता का समय।", en: "A period of love, comfort and creativity." },
    focus: { hi: "विवाह, कला, वाहन, घर और विलासिता से जुड़े मामले आगे बढ़ते हैं; खर्च संतुलित रखें।", en: "Marriage, the arts, vehicles, home and finer things move forward; keep spending balanced." },
    antar: { hi: "रिश्तों और सौंदर्य में मिठास; भोग में संयम रखें।", en: "Sweetness in relationships and beauty; enjoy in moderation." },
  },
};
