// DRAFT — to be reviewed and approved by the client's Jyotish before launch
import type { Bi } from "./meta";

export interface LagnaReading {
  personality: Bi;
  strengths: Bi;
  challenges: Bi;
  career: Bi;
  relationships: Bi;
  health: Bi;
}

/** Ascendant readings, keyed by sign 1 (Aries) .. 12 (Pisces). */
export const LAGNA: Record<number, LagnaReading> = {
  1: {
    personality: { hi: "मेष लग्न आपको ऊर्जावान, सीधा और पहल करने वाला बनाता है। आप नई शुरुआत से घबराते नहीं, बल्कि उसमें आनंद पाते हैं।", en: "Aries rising makes you energetic, direct and quick to take the initiative. New beginnings excite rather than worry you." },
    strengths: { hi: "साहस, नेतृत्व, तेज़ निर्णय और मुश्किल में भी डटे रहने का जज़्बा।", en: "Courage, leadership, quick decisions and the grit to stay in the fight." },
    challenges: { hi: "जल्दबाज़ी और गुस्सा कभी-कभी काम बिगाड़ सकते हैं; धैर्य से किया गया काम आपको और आगे ले जाएगा।", en: "Impatience and a quick temper can undo good work; patience multiplies your results." },
    career: { hi: "सेना, पुलिस, खेल, इंजीनियरिंग, सर्जरी, उद्यमिता और ऐसे काम जिनमें आप अगुवाई कर सकें।", en: "Defence, police, sports, engineering, surgery, entrepreneurship — any role where you lead from the front." },
    relationships: { hi: "रिश्तों में आप स्पष्ट और वफ़ादार हैं; साथी की बात पूरी सुनने की आदत रिश्ते को गहरा बनाएगी।", en: "You are honest and loyal in love; listening fully before reacting deepens your bonds." },
    health: { hi: "सिर, आँखों और रक्तचाप पर ध्यान दें; नियमित व्यायाम आपकी अतिरिक्त ऊर्जा को सही दिशा देता है।", en: "Look after the head, eyes and blood pressure; regular exercise channels your surplus energy well." },
  },
  2: {
    personality: { hi: "वृषभ लग्न आपको स्थिर, धैर्यवान और सुंदरता-प्रेमी बनाता है। आप सोच-समझकर चलते हैं और भरोसेमंद माने जाते हैं।", en: "Taurus rising makes you steady, patient and fond of beauty. You move deliberately and people find you dependable." },
    strengths: { hi: "धैर्य, व्यावहारिक समझ, धन संभालने की कला और कलात्मक रुचि।", en: "Patience, practical sense, a talent for managing money and an artistic eye." },
    challenges: { hi: "ज़िद और बदलाव से बचने की आदत; छोटे-छोटे नए प्रयोग आपके लिए अच्छे रहेंगे।", en: "Stubbornness and resisting change; small, regular experiments will serve you well." },
    career: { hi: "बैंकिंग, वित्त, कृषि, खाद्य, फैशन, संगीत, कला, होटल और लक्ज़री से जुड़े क्षेत्र।", en: "Banking, finance, agriculture, food, fashion, music, the arts, hospitality and luxury goods." },
    relationships: { hi: "आप प्रेम में स्थायित्व और सुरक्षा चाहते हैं; भावनाएँ खुलकर कहना आपके रिश्ते को मज़बूत बनाएगा।", en: "You seek stability and security in love; voicing feelings openly will strengthen your relationships." },
    health: { hi: "गला, थायरॉइड और वज़न पर ध्यान रखें; मीठे और भारी भोजन में संयम लाभ देगा।", en: "Watch the throat, thyroid and weight; moderation with rich and sweet food helps." },
  },
  3: {
    personality: { hi: "मिथुन लग्न आपको जिज्ञासु, बातूनी और तेज़ दिमाग़ वाला बनाता है। आप एक साथ कई विषयों में रुचि रखते हैं।", en: "Gemini rising gives you a curious, talkative and quick mind with many interests at once." },
    strengths: { hi: "संवाद कला, लेखन, सीखने की तेज़ी और हर स्थिति में ढल जाने की क्षमता।", en: "Communication, writing, fast learning and the ability to adapt to any situation." },
    challenges: { hi: "मन का भटकना और काम अधूरे छोड़ना; एक समय में एक लक्ष्य रखें।", en: "A restless mind and unfinished tasks; keep one clear goal at a time." },
    career: { hi: "मीडिया, लेखन, पढ़ाना, मार्केटिंग, सेल्स, आईटी, ट्रैवल और व्यापार।", en: "Media, writing, teaching, marketing, sales, IT, travel and trade." },
    relationships: { hi: "आपको बौद्धिक साथी चाहिए जिससे खुलकर बात हो सके; भावनात्मक गहराई पर भी समय दें।", en: "You want a partner you can talk to about everything; give emotional depth time as well." },
    health: { hi: "कंधे, हाथ, फेफड़े और नसों का तनाव — अच्छी नींद और प्राणायाम बहुत सहायक हैं।", en: "Shoulders, arms, lungs and nervous tension — good sleep and pranayama help a lot." },
  },
  4: {
    personality: { hi: "कर्क लग्न आपको भावुक, संवेदनशील और परिवार-प्रेमी बनाता है। दूसरों की देखभाल करना आपका स्वभाव है।", en: "Cancer rising makes you emotional, sensitive and family-centred. Caring for others comes naturally." },
    strengths: { hi: "सहानुभूति, अच्छी स्मृति, अंतर्ज्ञान और घर-परिवार को जोड़कर रखने की क्षमता।", en: "Empathy, a strong memory, intuition and a gift for holding a family together." },
    challenges: { hi: "मूड बदलना और बातों को दिल पर ले लेना; अपनी भावनाओं के लिए भी जगह बनाएँ।", en: "Mood swings and taking things to heart; make room for your own feelings too." },
    career: { hi: "नर्सिंग, शिक्षा, होटल, खाद्य, रियल एस्टेट, समाज सेवा और जल से जुड़े काम।", en: "Nursing, education, hospitality, food, real estate, social work and water-related trades." },
    relationships: { hi: "आप गहरे और समर्पित साथी हैं; अपेक्षाएँ शब्दों में कहें, अनुमान पर न छोड़ें।", en: "You are a deep, devoted partner; say your expectations aloud instead of hoping they are guessed." },
    health: { hi: "पाचन, छाती और जल-संतुलन पर ध्यान दें; भावनात्मक तनाव सीधे पेट पर असर करता है।", en: "Mind digestion, the chest and fluid balance; emotional stress shows up in the stomach." },
  },
  5: {
    personality: { hi: "सिंह लग्न आपको आत्मविश्वासी, उदार और गरिमापूर्ण बनाता है। आप स्वाभाविक रूप से ध्यान का केंद्र बनते हैं।", en: "Leo rising makes you confident, generous and dignified. You naturally become the centre of attention." },
    strengths: { hi: "नेतृत्व, उदारता, रचनात्मकता और दूसरों को प्रेरित करने की क्षमता।", en: "Leadership, generosity, creativity and the power to inspire others." },
    challenges: { hi: "अहंकार और प्रशंसा की चाह; विनम्रता आपकी चमक को और बढ़ाती है।", en: "Pride and a need for praise; humility only makes your light shine brighter." },
    career: { hi: "प्रशासन, सरकारी सेवा, राजनीति, मैनेजमेंट, मनोरंजन, चिकित्सा (हृदय) और अपना व्यवसाय।", en: "Administration, government service, politics, management, entertainment, medicine and your own business." },
    relationships: { hi: "आप प्रेम में उदार और रक्षक हैं; साथी को भी बराबर का मंच दें।", en: "You are generous and protective in love; give your partner an equal stage." },
    health: { hi: "हृदय, रीढ़ और ऊर्जा स्तर पर ध्यान दें; सुबह की धूप और नियमित दिनचर्या लाभदायक है।", en: "Look after the heart, spine and vitality; morning sunlight and a regular routine help." },
  },
  6: {
    personality: { hi: "कन्या लग्न आपको विश्लेषणात्मक, व्यवस्थित और सेवा-भावी बनाता है। आप बारीकियों पर ध्यान देते हैं।", en: "Virgo rising makes you analytical, organised and service-minded, with an eye for detail." },
    strengths: { hi: "सूक्ष्म विश्लेषण, मेहनत, व्यावहारिक बुद्धि और सुधार की लगन।", en: "Sharp analysis, hard work, practical intelligence and a drive to improve things." },
    challenges: { hi: "अत्यधिक आलोचना और चिंता; हर काम परफ़ेक्ट होना ज़रूरी नहीं।", en: "Over-criticism and worry; not everything needs to be perfect." },
    career: { hi: "अकाउंट्स, ऑडिट, डेटा, चिकित्सा, फ़ार्मा, संपादन, रिसर्च और सेवा क्षेत्र।", en: "Accounts, audit, data, healthcare, pharma, editing, research and the service sector." },
    relationships: { hi: "आप व्यवहार से प्रेम जताते हैं; कभी-कभी शब्दों में तारीफ़ भी करें।", en: "You show love through practical care; offer words of appreciation too." },
    health: { hi: "आंतें, पाचन और नर्वस तनाव — सादा भोजन और समय पर विश्राम ज़रूरी।", en: "Intestines, digestion and nervous strain — simple food and timely rest matter." },
  },
  7: {
    personality: { hi: "तुला लग्न आपको संतुलित, मिलनसार और न्यायप्रिय बनाता है। आप सौंदर्य और शांति पसंद करते हैं।", en: "Libra rising makes you balanced, sociable and fair-minded, with a love of harmony and beauty." },
    strengths: { hi: "कूटनीति, शिष्टता, सौंदर्य-बोध और लोगों को जोड़ने की कला।", en: "Diplomacy, grace, aesthetic sense and a gift for bringing people together." },
    challenges: { hi: "निर्णय टालना और सबको खुश रखने की कोशिश; अपनी राय पर भरोसा रखें।", en: "Indecision and trying to please everyone; trust your own view." },
    career: { hi: "कानून, डिज़ाइन, फैशन, कला, जनसंपर्क, परामर्श, व्यापार साझेदारी।", en: "Law, design, fashion, art, public relations, counselling and business partnerships." },
    relationships: { hi: "साझेदारी आपके जीवन का केंद्र है; बराबरी और खुला संवाद रिश्ते को सुंदर बनाते हैं।", en: "Partnership is central to your life; equality and open dialogue keep it beautiful." },
    health: { hi: "किडनी, कमर के निचले हिस्से और त्वचा का ध्यान रखें; पानी पर्याप्त पिएँ।", en: "Care for the kidneys, lower back and skin; drink enough water." },
  },
  8: {
    personality: { hi: "वृश्चिक लग्न आपको गहरा, दृढ़ और रहस्यमय बनाता है। आप सतह के नीचे की सच्चाई तक पहुँचना चाहते हैं।", en: "Scorpio rising makes you intense, determined and private. You want the truth beneath the surface." },
    strengths: { hi: "दृढ़ इच्छाशक्ति, शोध-क्षमता, संकट में स्थिरता और गहरी वफ़ादारी।", en: "Willpower, research ability, calm in a crisis and deep loyalty." },
    challenges: { hi: "शक और बातें मन में रखना; भरोसेमंद लोगों से खुलकर बात करें।", en: "Suspicion and bottling things up; open up to people you trust." },
    career: { hi: "रिसर्च, जाँच, सर्जरी, बीमा, टैक्स, खनन, मनोविज्ञान और गूढ़ विद्याएँ।", en: "Research, investigation, surgery, insurance, tax, mining, psychology and occult studies." },
    relationships: { hi: "आप पूर्ण समर्पण चाहते और देते हैं; ईर्ष्या की जगह विश्वास चुनें।", en: "You give and expect total commitment; choose trust over jealousy." },
    health: { hi: "प्रजनन अंग, मूत्र तंत्र और पुराने तनाव पर ध्यान दें; नियमित जाँच लाभदायक है।", en: "Mind the reproductive and urinary systems and stored stress; regular check-ups help." },
  },
  9: {
    personality: { hi: "धनु लग्न आपको आशावादी, धार्मिक और स्वतंत्र विचारों वाला बनाता है। ज्ञान और यात्रा आपको आकर्षित करते हैं।", en: "Sagittarius rising makes you optimistic, principled and free-spirited, drawn to knowledge and travel." },
    strengths: { hi: "ईमानदारी, उदारता, शिक्षण-क्षमता और दूर की सोच।", en: "Honesty, generosity, a gift for teaching and a long-range vision." },
    challenges: { hi: "बिना सोचे बोल देना और अति-आत्मविश्वास; छोटी बातों पर भी ध्यान दें।", en: "Blunt words and over-confidence; give the small details their due." },
    career: { hi: "शिक्षा, कानून, धर्म, प्रकाशन, विदेश व्यापार, पर्यटन, बैंकिंग और परामर्श।", en: "Education, law, religion, publishing, foreign trade, tourism, banking and advisory work." },
    relationships: { hi: "आपको खुलापन और स्वतंत्रता चाहिए; साथी की भावनात्मक ज़रूरतों के लिए भी रुकें।", en: "You need space and freedom; pause for your partner's emotional needs too." },
    health: { hi: "जाँघ, कूल्हे और लीवर का ध्यान रखें; भोजन में संयम और नियमित टहलना लाभदायक।", en: "Look after the thighs, hips and liver; moderate eating and daily walks help." },
  },
  10: {
    personality: { hi: "मकर लग्न आपको अनुशासित, महत्वाकांक्षी और ज़िम्मेदार बनाता है। आप धीरे-धीरे पर मज़बूती से आगे बढ़ते हैं।", en: "Capricorn rising makes you disciplined, ambitious and responsible. You climb slowly but surely." },
    strengths: { hi: "मेहनत, धैर्य, व्यावहारिकता और लंबी अवधि की योजना बनाने की क्षमता।", en: "Hard work, patience, practicality and long-term planning." },
    challenges: { hi: "अत्यधिक गंभीरता और काम का बोझ; आराम और आनंद को भी जगह दें।", en: "Over-seriousness and overwork; make space for rest and joy." },
    career: { hi: "प्रशासन, सरकारी सेवा, इंजीनियरिंग, निर्माण, खनन, प्रबंधन और संगठित व्यवसाय।", en: "Administration, government, engineering, construction, mining, management and structured business." },
    relationships: { hi: "आप भरोसेमंद और ज़िम्मेदार साथी हैं; प्रेम भरे छोटे इशारे रिश्ते में गर्माहट लाएँगे।", en: "You are a reliable, responsible partner; small affectionate gestures bring warmth." },
    health: { hi: "घुटने, हड्डियाँ, जोड़ और दाँत — कैल्शियम, धूप और स्ट्रेचिंग पर ध्यान दें।", en: "Knees, bones, joints and teeth — mind calcium, sunlight and stretching." },
  },
  11: {
    personality: { hi: "कुंभ लग्न आपको मानवतावादी, मौलिक और स्वतंत्र विचारक बनाता है। आप समाज के लिए कुछ नया करना चाहते हैं।", en: "Aquarius rising makes you humanitarian, original and independent-minded, wanting to improve society." },
    strengths: { hi: "नवाचार, मित्रता, वैज्ञानिक सोच और बड़े समूहों के साथ काम करने की क्षमता।", en: "Innovation, friendship, a scientific mind and ease with large groups." },
    challenges: { hi: "भावनात्मक दूरी और ज़िद; अपनों के साथ दिल की बात भी साझा करें।", en: "Emotional distance and fixed opinions; share your heart with those close to you." },
    career: { hi: "टेक्नोलॉजी, रिसर्च, सामाजिक संस्थाएँ, एनजीओ, विज्ञान, नेटवर्किंग और नए स्टार्टअप।", en: "Technology, research, social causes, NGOs, science, networking and start-ups." },
    relationships: { hi: "आपके लिए साथी पहले मित्र है; भावनाएँ व्यक्त करने में संकोच न करें।", en: "Your partner is first your friend; don't hold back in expressing feelings." },
    health: { hi: "पिंडलियाँ, टखने और रक्त-संचार — नियमित चलना और गर्म पानी लाभदायक।", en: "Calves, ankles and circulation — regular walking and warm water help." },
  },
  12: {
    personality: { hi: "मीन लग्न आपको कोमल, कल्पनाशील और आध्यात्मिक बनाता है। आपमें गहरी करुणा और अंतर्ज्ञान है।", en: "Pisces rising makes you gentle, imaginative and spiritual, with deep compassion and intuition." },
    strengths: { hi: "करुणा, रचनात्मकता, आध्यात्मिक समझ और दूसरों के दुख को समझने की शक्ति।", en: "Compassion, creativity, spiritual insight and the ability to feel others' pain." },
    challenges: { hi: "वास्तविकता से बचना और 'ना' न कह पाना; स्पष्ट सीमाएँ आपको सुरक्षित रखेंगी।", en: "Escapism and difficulty saying no; clear boundaries will protect you." },
    career: { hi: "कला, संगीत, फ़िल्म, चिकित्सा, आध्यात्मिक कार्य, समुद्र/विदेश से जुड़े काम और सेवा।", en: "Art, music, film, healing, spiritual work, marine or overseas work and service." },
    relationships: { hi: "आप निस्वार्थ प्रेम करते हैं; अपनी ज़रूरतों को भी उतना ही महत्व दें।", en: "You love selflessly; give your own needs equal importance." },
    health: { hi: "पैर, नींद और प्रतिरोधक क्षमता — ध्यान, पर्याप्त नींद और नशे से दूरी ज़रूरी।", en: "Feet, sleep and immunity — meditation, enough sleep and avoiding intoxicants matter." },
  },
};
