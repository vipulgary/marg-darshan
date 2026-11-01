// DRAFT — to be reviewed and approved by the client's Jyotish before launch
import type { PlanetKey } from "@/lib/contracts";
import type { Bi } from "./meta";

const b = (hi: string, en: string): Bi => ({ hi, en });

/** Per-planet remedial and "lucky" correspondences (traditional). */
export const PLANET_LORE: Record<PlanetKey, { gem: Bi; day: Bi; colour: Bi; number: number; metal: Bi; deity: Bi; mantra: string; daan: Bi }> = {
  sun: { gem: b("माणिक", "Ruby (Manik)"), day: b("रविवार", "Sunday"), colour: b("लाल, केसरिया", "Red, saffron"), number: 1, metal: b("सोना, तांबा", "Gold, copper"), deity: b("सूर्य देव", "Surya"), mantra: "ॐ घृणि सूर्याय नमः", daan: b("गेहूँ, गुड़, तांबा", "Wheat, jaggery, copper") },
  moon: { gem: b("मोती", "Pearl (Moti)"), day: b("सोमवार", "Monday"), colour: b("सफ़ेद, चाँदी", "White, silver"), number: 2, metal: b("चाँदी", "Silver"), deity: b("भगवान शिव", "Lord Shiva"), mantra: "ॐ सों सोमाय नमः", daan: b("चावल, दूध, सफ़ेद वस्त्र", "Rice, milk, white cloth") },
  mars: { gem: b("मूंगा", "Red Coral (Moonga)"), day: b("मंगलवार", "Tuesday"), colour: b("लाल", "Red"), number: 9, metal: b("तांबा", "Copper"), deity: b("हनुमान जी", "Hanuman ji"), mantra: "ॐ अं अंगारकाय नमः", daan: b("मसूर दाल, लाल वस्त्र", "Red lentils, red cloth") },
  mercury: { gem: b("पन्ना", "Emerald (Panna)"), day: b("बुधवार", "Wednesday"), colour: b("हरा", "Green"), number: 5, metal: b("कांसा", "Bronze"), deity: b("भगवान विष्णु / गणेश", "Lord Vishnu / Ganesha"), mantra: "ॐ बुं बुधाय नमः", daan: b("मूंग, हरी सब्ज़ियाँ", "Green gram, green vegetables") },
  jupiter: { gem: b("पुखराज", "Yellow Sapphire (Pukhraj)"), day: b("गुरुवार", "Thursday"), colour: b("पीला", "Yellow"), number: 3, metal: b("सोना", "Gold"), deity: b("भगवान विष्णु / गुरु", "Lord Vishnu / the Guru"), mantra: "ॐ बृं बृहस्पतये नमः", daan: b("चना दाल, हल्दी, पीले वस्त्र", "Chana dal, turmeric, yellow cloth") },
  venus: { gem: b("हीरा / ओपल", "Diamond / Opal"), day: b("शुक्रवार", "Friday"), colour: b("सफ़ेद, हल्का गुलाबी", "White, light pink"), number: 6, metal: b("चाँदी, प्लैटिनम", "Silver, platinum"), deity: b("माँ लक्ष्मी", "Goddess Lakshmi"), mantra: "ॐ शुं शुक्राय नमः", daan: b("चावल, घी, सफ़ेद मिठाई", "Rice, ghee, white sweets") },
  saturn: { gem: b("नीलम", "Blue Sapphire (Neelam)"), day: b("शनिवार", "Saturday"), colour: b("नीला, काला", "Blue, black"), number: 8, metal: b("लोहा", "Iron"), deity: b("शनि देव / हनुमान जी", "Shani Dev / Hanuman ji"), mantra: "ॐ शं शनैश्चराय नमः", daan: b("काले तिल, सरसों का तेल", "Black sesame, mustard oil") },
  rahu: { gem: b("गोमेद", "Hessonite (Gomed)"), day: b("शनिवार", "Saturday"), colour: b("धुएँ जैसा नीला", "Smoky blue"), number: 4, metal: b("सीसा", "Lead"), deity: b("माँ दुर्गा", "Goddess Durga"), mantra: "ॐ रां राहवे नमः", daan: b("सरसों, नीले वस्त्र", "Mustard, blue cloth") },
  ketu: { gem: b("लहसुनिया", "Cat's Eye (Lehsunia)"), day: b("मंगलवार", "Tuesday"), colour: b("धूसर", "Grey"), number: 7, metal: b("मिश्र धातु", "Mixed metals"), deity: b("भगवान गणेश", "Lord Ganesha"), mantra: "ॐ कें केतवे नमः", daan: b("कंबल, तिल", "Blankets, sesame") },
};

/** Traditional remedies per dosha key (keys match the engine's Dosha.key). */
export const DOSHA_REMEDIES: Record<string, Bi[]> = {
  manglik: [
    b("मंगलवार को हनुमान चालीसा का पाठ करें।", "Recite the Hanuman Chalisa on Tuesdays."),
    b("मंगलवार को मसूर दाल या लाल वस्त्र का दान करें।", "Donate red lentils or red cloth on Tuesdays."),
    b("विवाह से पहले कुंडली मिलान अवश्य कराएँ — कई बार दोष स्वतः निरस्त हो जाता है।", "Always match charts before marriage — the dosha is often cancelled."),
  ],
  kaal_sarp: [
    b("नाग पंचमी या सोमवार को शिवलिंग पर जल और दूध अर्पित करें।", "Offer water and milk to the Shivling on Mondays or Nag Panchami."),
    b("महामृत्युंजय मंत्र का नियमित जाप करें।", "Chant the Mahamrityunjaya mantra regularly."),
    b("विशेष परिस्थिति में त्र्यंबकेश्वर आदि में कालसर्प शांति पूजा कराई जाती है।", "Where advised, a Kaal Sarp shanti puja (e.g. at Trimbakeshwar) is performed."),
  ],
  sade_sati: [
    b("शनिवार को हनुमान जी के दर्शन और हनुमान चालीसा का पाठ करें।", "Visit Hanuman ji and recite the Hanuman Chalisa on Saturdays."),
    b("शनिवार को सरसों का तेल और काले तिल का दान करें।", "Donate mustard oil and black sesame on Saturdays."),
    b("ईमानदारी, अनुशासन और बड़ों-मज़दूरों की सेवा शनि को प्रसन्न करती है।", "Honesty, discipline and serving elders and labourers please Saturn."),
  ],
  pitru: [
    b("अमावस्या और पितृपक्ष में पितरों के लिए तर्पण-श्राद्ध करें।", "Perform tarpan and shraddha for ancestors on Amavasya and during Pitru Paksha."),
    b("पीपल के वृक्ष को जल अर्पित करें और गाय-कौवे को भोजन दें।", "Offer water to a peepal tree and feed cows and crows."),
  ],
  guru_chandal: [
    b("गुरुवार को गुरु मंत्र का जाप और पीली वस्तुओं का दान करें।", "Chant Jupiter's mantra and donate yellow items on Thursdays."),
    b("गुरुजनों, शिक्षकों और बड़ों का सम्मान करें।", "Honour teachers, mentors and elders."),
  ],
  shrapit: [
    b("शनिवार को शनि और राहु मंत्र का जाप करें।", "Chant Saturn and Rahu mantras on Saturdays."),
    b("ज़रूरतमंदों को भोजन और कंबल दान करें।", "Donate food and blankets to those in need."),
  ],
  grahan: [
    b("सूर्य/चंद्र ग्रहण के दिन मंत्र-जाप और दान करें।", "Chant mantras and give charity on eclipse days."),
    b("आदित्य हृदय स्तोत्र (सूर्य) या चंद्र मंत्र का नियमित पाठ करें।", "Regularly recite the Aditya Hridaya Stotra (Sun) or the Moon mantra."),
  ],
};

export const DOSHA_GENERIC_REMEDY: Bi[] = [b("ज्योतिषी से व्यक्तिगत परामर्श लेकर उपाय करें।", "Take remedies only after a personal consultation with the Jyotish.")];
