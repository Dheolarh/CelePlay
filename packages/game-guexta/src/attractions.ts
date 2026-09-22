// Attraction answers for Guexta.
//
// The player drags scrambled letter tiles into slots to spell the attraction.
// Answers must be unambiguously spellable by a player, so entries with slashes,
// alternative names, or administrative wording (e.g. "Gangirwal / Gashaka
// Mountains") are excluded - a player cannot know which name is expected.

export interface Attraction {
  /** Displayed answer, with proper spacing. */
  name: string;
  /**
   * Letters used for the tiles and slots. Uppercase A-Z only: spaces and
   * punctuation are stripped so the scramble is unambiguous.
   */
  letters: string;
  /**
   * One-line riddle shown by the hint button. Written in the second person as a
   * clue to the place, never naming it.
   */
  hint: string;
}

// Hints drawn from the event's "50 Nigerian Tourist Attractions" list. Where the
// source text was truncated by the PDF export, the hint has been rewritten so it
// reads as a complete sentence without giving the answer away.
const HINTS: Record<string, string> = {
  'Obudu Mountain Resort': 'I sit high above the ordinary, wrapped in clouds.',
  'Olumo Rock': 'I am a giant stone with stories; warriors sheltered around me.',
  'Idanre Hills': 'A landscape of great heights with ancient homes among my rocks.',
  'Mambilla Plateau': 'I am a highland paradise where tea grows in my cool air.',
  'Shere Hills': 'My rocks rise dramatically above the plains near Jos.',
  'Aso Rock': 'I stand tall beside power, in Nigeria\u2019s capital.',
  'Zuma Rock': 'I am a giant standing stone beside the Abuja\u2013Kaduna road.',
  'Mount Patti': 'A famous Nigerian city lies beneath me, in Lokoja.',
  'Mandara Mountains': 'I stretch across rugged terrain near the northeastern border.',
  'Idere Hills': 'I am a rocky adventure in Oyo State with views from above.',
  'Erin-Ijesha Waterfall': 'Water falls from great heights; I am also called Olumirin.',
  'Gurara Waterfalls': 'I roar over rocks in Niger State.',
  'Agbokim Waterfalls': 'I am not just one falling stream, in Cross River State.',
  'Assop Falls': 'I tumble through a rocky landscape, one of Nigeria\u2019s best known.',
  'Matsirga Waterfalls': 'I plunge dramatically over rocks in Kaduna State.',
  'Awhum Waterfall': 'A cave is part of my attraction, near Awhum in Enugu.',
  'Ogbunike Caves': 'I take visitors underground; a famous cave in Anambra.',
  'Iho Eleru Cave': 'I hold clues about ancient humans, a prehistoric cave in Ondo.',
  'Ikogosi Warm Springs': 'Two waters meet here: one is warm while another is cold.',
  'Oguta Lake': 'I am a beautiful inland body of water in Imo State.',
  'Jabi Lake': 'I bring water into the heart of Nigeria\u2019s capital city.',
  'Kainji Lake': 'I was created by a massive dam and stretch along the Niger.',
  'Lake Chad': 'I am shared across national boundaries, one of Africa\u2019s famous lakes.',
  'Yankari National Park': 'Elephants roam my wilderness and I am famous for warm springs.',
  'Gashaka Gumti National Park': 'I am vast and wild, Nigeria\u2019s largest national park.',
  'Cross River National Park': 'I protect one of Nigeria\u2019s richest forests.',
  'Kainji National Park': 'Wildlife and savannah meet here; a famous lake is nearby.',
  'Old Oyo National Park': 'I combine nature and history; ancient Oyo heritage surrounds me.',
  'Kamuku National Park': 'Savannah landscapes dominate me, in Kaduna State.',
  'Okomu National Park': 'I protect precious rainforest in Edo State.',
  'Jos Wildlife Park': 'I bring wildlife close to the city, in Jos.',
  'Okomu Forest Reserve': 'Elephants and primates can be found in my green world.',
  'Lekki Conservation Centre': 'A famous canopy walkway crosses my forest.',
  'Lufasi Nature Park': 'I am a green sanctuary near Lagos; my name is an acronym.',
  'Osun Osogbo Sacred Grove': 'Art and Yoruba tradition are deeply connected to me.',
  'Elegushi Royal Beach': 'Sand, waves and entertainment define me, a popular beach in Lekki.',
  'Ibeno Beach': 'I stretch along Nigeria\u2019s Atlantic coastline in Akwa Ibom.',
  'Coconut Beach': 'My name comes from a tropical fruit, in Badagry.',
  'Lekki Beach': 'I offer sand and sea near the city of Lagos.',
  'La Campagne Tropicana Beach': 'I offer a tropical resort experience along the Lagos coast.',
  'Sukur Cultural Landscape': 'Ancient architecture and culture define me in Adamawa.',
  'Ancient Kano City Walls': 'I once protected a great city and date back centuries.',
  'Emirs Palace Kano': 'I represent traditional royal authority; an Emir has lived here.',
};

const define = (name: string): Attraction => ({
  name,
  // Keep only A-Z so tiles never contain spaces or punctuation.
  letters: name.toUpperCase().replace(/[^A-Z]/g, ''),
  hint: HINTS[name] ?? 'A well-known Nigerian attraction.',
});

/**
 * Longest answer allowed into the game. Answers are shuffled from the tourist
 * site list, and without a cap a single round could consume most of the clock
 * (the longest list entries run to 24 letters).
 */
export const MAX_ANSWER_LENGTH = 15;

const ALL_ATTRACTIONS: Attraction[] = [
  // --- Mountains, hills and rocks ---
  'Olumo Rock',
  'Zuma Rock',
  'Aso Rock',
  'Idanre Hills',
  'Shere Hills',
  'Mount Patti',
  'Mambilla Plateau',
  'Mandara Mountains',
  'Obudu Mountain Resort',
  'Idere Hills',

  // --- Waterfalls ---
  'Erin-Ijesha Waterfall',
  'Gurara Waterfalls',
  'Agbokim Waterfalls',
  'Assop Falls',
  'Matsirga Waterfalls',
  'Awhum Waterfall',

  // --- Caves ---
  'Ogbunike Caves',
  'Iho Eleru Cave',

  // --- Springs and lakes ---
  'Ikogosi Warm Springs',
  'Oguta Lake',
  'Jabi Lake',
  'Kainji Lake',
  'Lake Chad',

  // --- National parks and reserves ---
  'Yankari National Park',
  'Gashaka Gumti National Park',
  'Cross River National Park',
  'Kainji National Park',
  'Old Oyo National Park',
  'Kamuku National Park',
  'Okomu National Park',
  'Jos Wildlife Park',

  // --- Forests and sanctuaries ---
  'Okomu Forest Reserve',
  'Lekki Conservation Centre',
  'Lufasi Nature Park',
  'Osun Osogbo Sacred Grove',

  // --- Beaches ---
  'Elegushi Royal Beach',
  'Ibeno Beach',
  'Coconut Beach',
  'Lekki Beach',
  'La Campagne Tropicana Beach',

  // --- Heritage sites ---
  'Sukur Cultural Landscape',
  'Ancient Kano City Walls',
  'Emirs Palace Kano',
].map(define);

/**
 * The playable pool: every attraction whose letters fit within
 * MAX_ANSWER_LENGTH. Applied here so the rule lives in one place rather than
 * being repeated wherever answers are read.
 */
export const ATTRACTIONS: Attraction[] = ALL_ATTRACTIONS.filter(
  (a) => a.letters.length <= MAX_ANSWER_LENGTH
);

/**
 * Returns a freshly shuffled list of tile characters for an answer.
 * Uses Fisher-Yates so the shuffle is uniform.
 */
export const scrambleLetters = (letters: string): string[] => {
  const chars = [...letters];
  for (let i = chars.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars;
};

/**
 * Splits an answer into the rows of slots to display.
 *
 * Row count is derived from the answer, not fixed: each word starts a new row
 * when it fits within the per-row limit, otherwise long words wrap. This keeps
 * single long words and multi-word phrases both laid out sensibly.
 *
 * IMPORTANT: each returned row reports `count`, the number of SLOT positions it
 * occupies. That count is derived from the same letters-only transform used for
 * `Attraction.letters`, so the total always equals `letters.length`. Using the
 * raw word token instead would over-count punctuation (e.g. "ERIN-IGHESHA" is
 * 12 characters but only 11 slots), which desynchronises the slot indices.
 */
export interface SlotRow {
  /** Text for the row, letters only (used for sizing/debug). */
  text: string;
  row: number;
  /** Number of slot positions in this row. */
  count: number;
}

export const layoutRows = (name: string, maxPerRow = 7): SlotRow[] => {
  const words = name
    .toUpperCase()
    .split(/\s+/)
    .filter(Boolean)
    // Strip punctuation so token length matches the slot count.
    .map((w) => w.replace(/[^A-Z]/g, ''))
    .filter((w) => w.length > 0);

  const rows: SlotRow[] = [];
  let currentRow = 0;
  let usedInRow = 0;

  for (const word of words) {
    // A word wider than a row gets its own row(s).
    if (word.length > maxPerRow) {
      if (usedInRow > 0) {
        currentRow++;
        usedInRow = 0;
      }
      rows.push({ text: word, row: currentRow, count: word.length });
      currentRow++;
      usedInRow = 0;
      continue;
    }

    // Start a new row if this word would overflow the current one.
    if (usedInRow > 0 && usedInRow + 1 + word.length > maxPerRow) {
      currentRow++;
      usedInRow = 0;
    }

    rows.push({ text: word, row: currentRow, count: word.length });
    usedInRow += (usedInRow > 0 ? 1 : 0) + word.length;
  }

  return rows;
};
