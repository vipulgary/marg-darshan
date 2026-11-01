/**
 * Numerology (Indian/Chaldean, numbers 1–9). Pure and instant.
 *  - Mulank (psychic number): day of birth reduced to one digit.
 *  - Bhagyank (destiny number): all digits of the full date reduced.
 *  - Namank (name number): Chaldean letter values of the name reduced.
 * Correspondences (planet, days, colours, friendly numbers) follow common Indian numerology.
 * DRAFT — to be reviewed by the client's Jyotish.
 */

export type Bi = { hi: string; en: string };
const b = (hi: string, en: string): Bi => ({ hi, en });

export function reduce(n: number): number {
  let x = Math.abs(Math.trunc(n));
  while (x > 9) x = String(x).split("").reduce((s, d) => s + Number(d), 0);
  return x;
}

const CHALDEAN: Record<string, number> = {
  a: 1, i: 1, j: 1, q: 1, y: 1, b: 2, k: 2, r: 2, c: 3, g: 3, l: 3, s: 3, d: 4, m: 4, t: 4,
  e: 5, h: 5, n: 5, x: 5, u: 6, v: 6, w: 6, o: 7, z: 7, f: 8, p: 8,
};

/** Name number from Latin letters (Chaldean values); other characters are ignored. */
export function nameNumber(name: string): number | null {
  const sum = [...name.toLowerCase()].reduce((s, ch) => s + (CHALDEAN[ch] ?? 0), 0);
  return sum ? reduce(sum) : null;
}

export function mulank(dob: string): number {
  return reduce(Number(dob.slice(8, 10)));
}

export function bhagyank(dob: string): number {
  return reduce(dob.replace(/\D/g, "").split("").reduce((s, d) => s + Number(d), 0));
}

export const NUMBER_LORE: Record<number, { planet: Bi; days: Bi; colours: Bi; gem: Bi; friends: number[]; traits: Bi }> = {
  1: { planet: b("सूर्य", "Sun"), days: b("रविवार, सोमवार", "Sunday, Monday"), colours: b("सुनहरा, नारंगी, पीला", "Gold, orange, yellow"), gem: b("माणिक", "Ruby"), friends: [1, 2, 3, 9], traits: b("नेतृत्व, आत्मविश्वास और स्वतंत्र सोच। आप शुरुआत करने वाले हैं।", "Leadership, confidence and independent thinking. You are a natural starter.") },
  2: { planet: b("चंद्र", "Moon"), days: b("सोमवार, शुक्रवार", "Monday, Friday"), colours: b("सफ़ेद, क्रीम, हल्का हरा", "White, cream, light green"), gem: b("मोती", "Pearl"), friends: [1, 2, 3, 5], traits: b("संवेदनशील, सहयोगी और कल्पनाशील। रिश्तों में तालमेल आपकी ताकत है।", "Sensitive, cooperative and imaginative. Harmony in relationships is your strength.") },
  3: { planet: b("गुरु", "Jupiter"), days: b("गुरुवार", "Thursday"), colours: b("पीला, बैंगनी", "Yellow, purple"), gem: b("पुखराज", "Yellow Sapphire"), friends: [1, 2, 3, 6, 9], traits: b("ज्ञानी, अनुशासित और मार्गदर्शक। शिक्षा और सलाह में चमकते हैं।", "Wise, disciplined and a guide to others. You shine in learning and advising.") },
  4: { planet: b("राहु", "Rahu"), days: b("शनिवार, रविवार", "Saturday, Sunday"), colours: b("नीला, धूसर", "Blue, grey"), gem: b("गोमेद", "Hessonite"), friends: [1, 5, 6, 7], traits: b("मेहनती, व्यावहारिक और अलग सोच वाले। व्यवस्था बनाना आपको आता है।", "Hard-working, practical and unconventional. You are good at building systems.") },
  5: { planet: b("बुध", "Mercury"), days: b("बुधवार, शुक्रवार", "Wednesday, Friday"), colours: b("हरा, हल्का भूरा", "Green, light brown"), gem: b("पन्ना", "Emerald"), friends: [1, 4, 5, 6], traits: b("चतुर, बातूनी और बदलाव पसंद। व्यापार और संवाद में तेज़।", "Clever, communicative and fond of change. Quick in business and communication.") },
  6: { planet: b("शुक्र", "Venus"), days: b("शुक्रवार, मंगलवार", "Friday, Tuesday"), colours: b("गुलाबी, सफ़ेद, आसमानी", "Pink, white, sky blue"), gem: b("हीरा / ओपल", "Diamond / Opal"), friends: [3, 4, 5, 6, 9], traits: b("सौंदर्य-प्रेमी, परिवारप्रिय और आकर्षक। कला और सुख-सुविधा से जुड़ाव।", "Beauty-loving, family-oriented and charming. Drawn to the arts and comfort.") },
  7: { planet: b("केतु", "Ketu"), days: b("सोमवार, रविवार", "Monday, Sunday"), colours: b("हल्का हरा, सफ़ेद", "Light green, white"), gem: b("लहसुनिया", "Cat's Eye"), friends: [1, 4, 5, 6], traits: b("गहरा चिंतन, अंतर्ज्ञान और आध्यात्मिक झुकाव। शोध में रुचि।", "Deep thinking, intuition and a spiritual leaning. Drawn to research.") },
  8: { planet: b("शनि", "Saturn"), days: b("शनिवार, शुक्रवार", "Saturday, Friday"), colours: b("गहरा नीला, काला", "Dark blue, black"), gem: b("नीलम", "Blue Sapphire"), friends: [3, 5, 6], traits: b("धैर्यवान, ज़िम्मेदार और मेहनती। सफलता देर से पर पक्की आती है।", "Patient, responsible and hard-working. Success comes late but lasts.") },
  9: { planet: b("मंगल", "Mars"), days: b("मंगलवार, गुरुवार", "Tuesday, Thursday"), colours: b("लाल, गुलाबी", "Red, pink"), gem: b("मूंगा", "Red Coral"), friends: [1, 2, 3, 6, 9], traits: b("साहसी, ऊर्जावान और मददगार। चुनौतियों से नहीं डरते।", "Brave, energetic and helpful. You don't back down from challenges.") },
};

export function numerology(name: string, dob: string) {
  const m = mulank(dob);
  const bh = bhagyank(dob);
  const n = nameNumber(name);
  const lucky = [...new Set([m, bh, ...NUMBER_LORE[m].friends])].sort((x, y) => x - y);
  // A name number friendly with both core numbers is traditionally considered favourable.
  const nameFit = n === null ? null : n === m || n === bh || (NUMBER_LORE[m].friends.includes(n) && NUMBER_LORE[bh].friends.includes(n)) ? "good" : NUMBER_LORE[m].friends.includes(n) || NUMBER_LORE[bh].friends.includes(n) ? "ok" : "weak";
  return { mulank: m, bhagyank: bh, namank: n, lucky, nameFit, mulankLore: NUMBER_LORE[m], bhagyankLore: NUMBER_LORE[bh] };
}

export type NumerologyResult = ReturnType<typeof numerology>;
