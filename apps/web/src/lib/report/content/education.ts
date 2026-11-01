// DRAFT — to be reviewed and approved by the client's Jyotish before launch
import type { Bi } from "./meta";

const b = (hi: string, en: string): Bi => ({ hi, en });

/** Study style per Lagna, keyed 1 (Aries) .. 12 (Pisces). */
export const EDUCATION: Record<number, Bi> = {
  1: b("आप तेज़ी से सीखते हैं और प्रतियोगिता में चमकते हैं; लंबी पढ़ाई में धैर्य बनाए रखना ज़रूरी है। इंजीनियरिंग, खेल, रक्षा और प्रबंधन के विषय अनुकूल।", "You learn fast and shine in competition; keep patience for long courses. Engineering, sports, defence and management suit you."),
  2: b("आप धीरे पर गहराई से सीखते हैं और जो सीखते हैं उसे याद रखते हैं। वित्त, वाणिज्य, कला, संगीत और भाषाएँ अनुकूल।", "You learn steadily and deeply, and retain what you learn. Finance, commerce, arts, music and languages suit you."),
  3: b("जिज्ञासु और बहुमुखी विद्यार्थी; एक साथ कई विषयों में रुचि। संचार, मीडिया, लेखन, आईटी और गणित अनुकूल — एकाग्रता पर काम करें।", "A curious, versatile learner interested in many subjects. Communication, media, writing, IT and maths suit you — work on focus."),
  4: b("भावनात्मक जुड़ाव से पढ़ाई अच्छी होती है; घर का शांत माहौल मदद करता है। मनोविज्ञान, नर्सिंग, होटल प्रबंधन, इतिहास और प्रॉपर्टी अनुकूल।", "You study best when emotionally engaged; a calm home helps. Psychology, nursing, hospitality, history and real estate suit you."),
  5: b("आत्मविश्वासी विद्यार्थी, नेतृत्व वाले विषयों में आगे। प्रशासन, राजनीति विज्ञान, चिकित्सा, प्रबंधन और कला अनुकूल।", "A confident student who excels where leadership is needed. Administration, political science, medicine, management and the arts suit you."),
  6: b("विश्लेषणात्मक और व्यवस्थित; विस्तार पर ध्यान आपकी ताकत। लेखा, चिकित्सा, विज्ञान, शोध और डेटा अनुकूल।", "Analytical and methodical; attention to detail is your strength. Accounts, medicine, science, research and data suit you."),
  7: b("संतुलित और सौंदर्य-बोध वाले विद्यार्थी; समूह में पढ़ना अच्छा लगता है। क़ानून, डिज़ाइन, फैशन, कूटनीति और मानव संसाधन अनुकूल।", "A balanced student with an eye for beauty who enjoys group study. Law, design, fashion, diplomacy and HR suit you."),
  8: b("गहन और शोधप्रिय; रहस्यमय या कठिन विषयों में रुचि। शोध, चिकित्सा, सर्जरी, ज्योतिष, बीमा और जासूसी विज्ञान अनुकूल।", "Intense and research-minded; drawn to deep or difficult subjects. Research, medicine, surgery, astrology, insurance and investigation suit you."),
  9: b("उच्च शिक्षा और दर्शन में स्वाभाविक रुचि; विदेश में पढ़ाई का योग। क़ानून, शिक्षण, धर्म, दर्शन और पर्यटन अनुकूल।", "A natural pull towards higher studies and philosophy; study abroad is indicated. Law, teaching, religion, philosophy and tourism suit you."),
  10: b("अनुशासित और लक्ष्य-केंद्रित विद्यार्थी; मेहनत से ऊँचे परिणाम। प्रशासन, इंजीनियरिंग, अर्थशास्त्र और सरकारी सेवा की तैयारी अनुकूल।", "A disciplined, goal-focused student; effort brings high results. Administration, engineering, economics and civil-service preparation suit you."),
  11: b("नवाचारी और तकनीकी सोच; नए विषयों में रुचि। विज्ञान, तकनीक, आईटी, सामाजिक कार्य और शोध अनुकूल।", "Innovative and technical in thinking; drawn to new fields. Science, technology, IT, social work and research suit you."),
  12: b("कल्पनाशील और अंतर्ज्ञानी विद्यार्थी; रचनात्मक विषयों में चमक। कला, संगीत, चिकित्सा, आध्यात्म और विदेश से जुड़ी पढ़ाई अनुकूल।", "An imaginative, intuitive learner who shines in creative fields. Arts, music, medicine, spirituality and overseas studies suit you."),
};
