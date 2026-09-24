import { create } from 'zustand';
import { ATTRACTIONS, type Attraction } from './attractions';

// Two minutes, matching the how-to-play card for this game.
const GAME_DURATION = 120;
// Points awarded per letter correctly placed. Because answers vary widely in
// length (8 to 15 letters), scoring by letter keeps long answers worth the
// time they cost instead of paying a flat rate for a much slower round.
const POINTS_PER_LETTER = 10;
// Pause after a correct answer so the player sees the completed word.
const SOLVED_DELAY_MS = 1200;

interface GuextaState {
  /** The attraction currently being solved. */
  current: Attraction | null;
  /** Shuffled letters still available in the tile bank. Each entry has a unique id. */
  bank: { id: string; char: string }[];
  /** Characters placed into the answer slots, null when a slot is empty. */
  slots: ({ id: string; char: string } | null)[];
  score: number;
  solvedCount: number;
  timeLeft: number;
  isPlaying: boolean;
  isGameEnded: boolean;
  /**
   * True for the brief window after the clock hits zero, while the missed
   * attraction is revealed. The end screen waits on this so the player sees the
   * answer instead of being cut straight to "TIME UP!".
   */
  timeUp: boolean;
  /** True briefly after a correct answer, to show the completed word. */
  justSolved: boolean;
  /** Attractions already used, so they are not repeated. */
  usedIndexes: number[];

  initializeGame: () => void;
  startGame: () => void;
  placeTile: (tileId: string, slotIndex: number) => void;
  returnTile: (slotIndex: number) => void;
  tickTimer: () => void;
  finishGame: () => void;
  resetGame: () => void;
  clearProgress: () => void;
}

const correctAudio = new Audio('/assets/sounds/correct.mp3');
const wrongAudio = new Audio('/assets/sounds/wrong.mp3');
const loseAudio = new Audio('/assets/sounds/lose.mp3');

const playSound = (audio: HTMLAudioElement) => {
  audio.currentTime = 0;
  audio.play().catch(() => {});
};

// The bank is a rolling tray, not the full anagram set. It always holds exactly
// TRAY_CORRECT letters that the answer still needs plus TRAY_WRONG letters that
// do NOT appear in the answer at all, so the player works with partial
// information and relies on the slot colour feedback to deduce the word.
const TRAY_CORRECT = 3;
const TRAY_WRONG = 2;
const TRAY_SIZE = TRAY_CORRECT + TRAY_WRONG;

let tileCounter = 0;
const makeTile = (char: string) => ({ id: `t${tileCounter++}-${char}`, char });

/** Letters the answer still needs, i.e. not already correctly placed on the board. */
const neededLetters = (
  attraction: Attraction,
  slots: ({ id: string; char: string } | null)[]
): string[] => {
  const answer = attraction.letters;
  // Start from the full answer, then remove one copy for each correctly placed
  // letter so the tray stops offering letters the player no longer needs.
  const pool: Record<string, number> = {};
  for (const ch of answer) pool[ch] = (pool[ch] ?? 0) + 1;

  slots.forEach((s, i) => {
    if (s && s.char === answer[i]) pool[s.char] -= 1;
  });

  const out: string[] = [];
  for (const ch of Object.keys(pool)) {
    for (let n = 0; n < Math.max(0, pool[ch]); n++) out.push(ch);
  }
  return out;
};

/** Alphabet letters guaranteed NOT to appear in the answer. */
const absentLetters = (attraction: Attraction): string[] => {
  const present = new Set(attraction.letters);
  return 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').filter((c) => !present.has(c));
};

/**
 * A slot is LOCKED once it holds the correct letter for its position. Locked
 * tiles cannot be dragged out or displaced, so progress the player has already
 * earned cannot be undone by accident.
 */
const isSlotLocked = (
  attraction: Attraction,
  slots: ({ id: string; char: string } | null)[],
  index: number
): boolean => {
  const t = slots[index];
  return !!t && t.char === attraction.letters[index];
};

/** Index of the slot holding a given tile, or -1. */
const slotIndexOfTile = (
  slots: ({ id: string; char: string } | null)[],
  tileId: string
): number => slots.findIndex((s) => s?.id === tileId);

/**
 * Builds the initial 3 correct + 2 wrong tray for a round.
 * Correct letters are drawn from what the answer needs; wrong letters are drawn
 * from letters the answer does not contain at all.
 */
const buildTray = (attraction: Attraction, slots: ({ id: string; char: string } | null)[]) => {
  const needed = neededLetters(attraction, slots);
  const absent = absentLetters(attraction);

  // Shuffle both pools so the tray is not always in answer order.
  const shuffledNeeded = [...new Set(needed)].sort(() => Math.random() - 0.5);
  const shuffledAbsent = [...absent].sort(() => Math.random() - 0.5);

  const tiles: { id: string; char: string }[] = [];
  for (let i = 0; i < TRAY_CORRECT; i++) {
    const ch = shuffledNeeded[i % Math.max(1, shuffledNeeded.length)];
    if (ch) tiles.push(makeTile(ch));
  }
  for (let i = 0; i < TRAY_WRONG; i++) {
    const ch = shuffledAbsent[i % Math.max(1, shuffledAbsent.length)];
    if (ch) tiles.push(makeTile(ch));
  }
  return tiles;
};

/** Builds the tray + empty slots for a given attraction. */
const buildRound = (attraction: Attraction) => {
  const slots: ({ id: string; char: string } | null)[] = Array.from(
    { length: attraction.letters.length },
    () => null
  );
  return {
    current: attraction,
    bank: buildTray(attraction, slots),
    slots,
  };
};

/**
 * Rebalances the tray back to TRAY_CORRECT correct + TRAY_WRONG wrong after a
 * tile has moved.
 *
 * `incoming` holds tiles the player just returned from the board. These take
 * PRIORITY: a returned tile must stay in the tray, so some *other* tile is the
 * one pushed out to keep the 3:2 balance.
 */
const rebalanceTray = (
  attraction: Attraction,
  slots: ({ id: string; char: string } | null)[],
  currentBank: { id: string; char: string }[],
  incoming: { id: string; char: string }[] = []
): { id: string; char: string }[] => {
  const needed = neededLetters(attraction, slots);
  const absent = new Set(absentLetters(attraction));

  // How many of each letter the answer still needs.
  const neededCount: Record<string, number> = {};
  for (const ch of needed) neededCount[ch] = (neededCount[ch] ?? 0) + 1;

  const kept: { id: string; char: string }[] = [];
  const keptIds = new Set<string>();

  /** Tries to keep a tile as a "correct" one, if the quota and need allow. */
  const tryKeepCorrect = (t: { id: string; char: string }) => {
    if (kept.length >= TRAY_CORRECT) return false;
    if (keptIds.has(t.id)) return false;
    if (neededCount[t.char] > 0) {
      kept.push(t);
      keptIds.add(t.id);
      neededCount[t.char] -= 1;
      return true;
    }
    return false;
  };

  // 1. Returned tiles first, so they are never the ones pushed out.
  for (const t of incoming) tryKeepCorrect(t);

  // 2. Then the tiles already sitting in the tray.
  for (const t of currentBank) tryKeepCorrect(t);

  // 3. Wrong-letter slots, same priority: returned tiles first.
  const keptWrong: { id: string; char: string }[] = [];
  for (const t of [...incoming, ...currentBank]) {
    if (keptWrong.length >= TRAY_WRONG) break;
    if (keptIds.has(t.id)) continue;
    if (absent.has(t.char)) {
      keptWrong.push(t);
      keptIds.add(t.id);
    }
  }

  // 4. Top up any shortfall with freshly generated tiles.
  const result = [...kept, ...keptWrong];
  const correctNeeded = TRAY_CORRECT - kept.length;
  const wrongNeeded = TRAY_WRONG - keptWrong.length;

  if (correctNeeded > 0) {
    const spare = Object.keys(neededCount).filter((c) => neededCount[c] > 0);
    const shuffled = spare.sort(() => Math.random() - 0.5);
    for (let i = 0; i < correctNeeded; i++) {
      const ch = shuffled[i % Math.max(1, shuffled.length)];
      if (ch) result.push(makeTile(ch));
    }
  }

  if (wrongNeeded > 0) {
    const pool = [...absent].filter((c) => !result.some((r) => r.char === c));
    const shuffled = pool.sort(() => Math.random() - 0.5);
    for (let i = 0; i < wrongNeeded; i++) {
      const ch = shuffled[i % Math.max(1, shuffled.length)];
      if (ch) result.push(makeTile(ch));
    }
  }

  return result.slice(0, TRAY_SIZE);
};

export const useGuextaStore = create<GuextaState>((set, get) => ({
  current: null,
  bank: [],
  slots: [],
  score: 0,
  solvedCount: 0,
  timeLeft: GAME_DURATION,
  isPlaying: false,
  isGameEnded: false,
  timeUp: false,
  justSolved: false,
  usedIndexes: [],

  /**
   * Builds the first round and leaves it PAUSED.
   *
   * isPlaying stays false until startGame() runs, which happens when the player
   * dismisses the how-to-play popup. That keeps the clock from ticking while
   * they are still reading the rules.
   */
  initializeGame: () => {
    const first = ATTRACTIONS[Math.floor(Math.random() * ATTRACTIONS.length)];
    set({
      ...buildRound(first),
      score: 0,
      solvedCount: 0,
      timeLeft: GAME_DURATION,
      isPlaying: false,
      isGameEnded: false,
      timeUp: false,
      justSolved: false,
      usedIndexes: [ATTRACTIONS.indexOf(first)],
    });
  },

  /** Starts the clock. Called once the instructions popup is closed. */
  startGame: () => set({ isPlaying: true }),

  /**
   * Moves a tile from the bank into a slot. If the target slot already holds a
   * tile, that tile returns to the bank so no letter is ever lost.
   */
  placeTile: (tileId, slotIndex) => {
    const { bank, slots, isPlaying, isGameEnded } = get();
    if (!isPlaying || isGameEnded) return;
    if (slotIndex < 0 || slotIndex >= slots.length) return;

    const attraction = get().current as Attraction;

    // A correctly-placed tile is locked: it cannot be moved, and nothing can
    // displace it.
    if (isSlotLocked(attraction, slots, slotIndex)) return;

    // The tile may be coming from the bank OR from another slot (the player
    // dragged it out to reposition it). Check both so neither path fails.
    const fromBank = bank.some((t) => t.id === tileId);
    const fromSlotIndex = slotIndexOfTile(slots, tileId);

    // Do not allow dragging a locked tile out of its slot.
    if (fromSlotIndex !== -1 && isSlotLocked(attraction, slots, fromSlotIndex)) return;

    const tile = fromBank ? bank.find((t) => t.id === tileId) : slots[fromSlotIndex];
    if (!tile) return;
    // Dropping a tile back onto its own slot is a no-op.
    if (fromSlotIndex === slotIndex) return;

    const nextSlots = [...slots];
    const displaced = nextSlots[slotIndex];
    nextSlots[slotIndex] = tile;

    // If the tile came out of another slot, clear that slot.
    if (fromSlotIndex !== -1) nextSlots[fromSlotIndex] = null;

    const nextBank = fromBank ? bank.filter((t) => t.id !== tileId) : [...bank];
    // A displaced tile goes back to the bank, unless the displaced tile IS the
    // one being moved (already handled above).
    if (displaced && displaced.id !== tileId) nextBank.push(displaced);

    const answer = get().current?.letters ?? '';
    const attempt = nextSlots.map((s) => s?.char ?? '').join('');

    // Only validate once every slot is filled.
    if (attempt.length === answer.length && !nextSlots.some((s) => s === null)) {
      if (attempt === answer) {
        playSound(correctAudio);
        set({
          slots: nextSlots,
          bank: nextBank,
          score: get().score + answer.length * POINTS_PER_LETTER,
          solvedCount: get().solvedCount + 1,
          justSolved: true,
        });

        // Show the completed word briefly, then load the next attraction.
        setTimeout(() => {
          const state = get();
          // The timer may have expired during the pause - do not advance then.
          if (!state.isPlaying || state.isGameEnded) {
            set({ justSolved: false });
            return;
          }
          set({ ...nextAttraction(state), justSolved: false });
        }, SOLVED_DELAY_MS);
        return;
      }

      playSound(wrongAudio);
      // Wrong: leave tiles in place so the player can rearrange rather than
      // losing their work.
    }

    // Rebalance so the tray refills to 3 correct + 2 wrong after the move.
    const nextTray = rebalanceTray(attraction, nextSlots, nextBank);
    set({ slots: nextSlots, bank: nextTray });
  },

  returnTile: (slotIndex) => {
    const { slots, bank, isPlaying, isGameEnded } = get();
    if (!isPlaying || isGameEnded) return;

    const tile = slots[slotIndex];
    if (!tile) return;

    // Locked (correctly placed) tiles stay on the board.
    const attraction = get().current as Attraction;
    if (isSlotLocked(attraction, slots, slotIndex)) return;

    const nextSlots = [...slots];
    nextSlots[slotIndex] = null;

    // The returned tile takes priority in the tray, so a DIFFERENT tile is the
    // one pushed out to preserve the 3:2 balance.
    const nextTray = rebalanceTray(attraction, nextSlots, bank, [tile]);
    set({ slots: nextSlots, bank: nextTray });
  },

  tickTimer: () => {
    const { timeLeft, isPlaying, isGameEnded } = get();
    if (!isPlaying || isGameEnded) return;

    if (timeLeft > 0) {
      set({ timeLeft: timeLeft - 1 });
      return;
    }

    // Clock has run out. Hold isGameEnded back so the component can reveal the
    // attraction the player ran out of time on; it calls finishGame() afterwards.
    playSound(loseAudio);
    set({ isPlaying: false, timeUp: true });
  },

  /** Shows the end screen. Called once the reveal has finished. */
  finishGame: () => set({ isGameEnded: true, timeUp: false }),

  resetGame: () => {
    set({
      current: null,
      bank: [],
      slots: [],
      score: 0,
      solvedCount: 0,
      timeLeft: GAME_DURATION,
      isPlaying: false,
      isGameEnded: false,
      timeUp: false,
      justSolved: false,
      usedIndexes: [],
    });
  },

  clearProgress: () => {
    // Deliberately does NOT stop the game. This runs on effect cleanup, which
    // React StrictMode triggers right after mount during its double-invoke
    // check; stopping here would freeze the timer before play begins.
    set({ justSolved: false });
  },
}));

/** Picks the next unused attraction, reshuffling once every one has been seen. */
function nextAttraction(state: GuextaState) {
  const remaining = ATTRACTIONS.map((_, i) => i).filter(
    (i) => !state.usedIndexes.includes(i)
  );

  // All attractions seen - start a fresh pass but avoid an immediate repeat.
  if (remaining.length === 0) {
    const pool = ATTRACTIONS.map((_, i) => i).filter(
      (i) => i !== ATTRACTIONS.indexOf(state.current as Attraction)
    );
    const pick = pool[Math.floor(Math.random() * pool.length)];
    return { ...buildRound(ATTRACTIONS[pick]), usedIndexes: [pick] };
  }

  const pick = remaining[Math.floor(Math.random() * remaining.length)];
  return {
    ...buildRound(ATTRACTIONS[pick]),
    usedIndexes: [...state.usedIndexes, pick],
  };
}

export { GAME_DURATION, POINTS_PER_LETTER, SOLVED_DELAY_MS, ATTRACTIONS };
