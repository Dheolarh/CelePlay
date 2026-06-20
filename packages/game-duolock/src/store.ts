import { create } from 'zustand';

export interface Card {
  id: string; // Unique ID for the grid instance
  pairId: string; // The prefix (e.g., 'acs') used to identify a match
  imageUrl: string;
  isFlipped: boolean;
  isMatched: boolean;
}

interface DuoLockState {
  cards: Card[];
  flippedIndices: number[];
  score: number;
  timeLeft: number;
  isPlaying: boolean;
  initializeGame: (pairs: { id: string, imageT: string, imageI: string }[]) => void;
  flipCard: (index: number) => void;
  tickTimer: () => void;
  resetGame: () => void;
}

export const useDuoLockStore = create<DuoLockState>((set, get) => ({
  cards: [],
  flippedIndices: [],
  score: 0,
  timeLeft: 60,
  isPlaying: false,

  initializeGame: (pairs) => {
    // Flatten pairs into an array of cards
    const deck: Card[] = [];
    pairs.forEach(pair => {
      deck.push({ id: `${pair.id}-T`, pairId: pair.id, imageUrl: pair.imageT, isFlipped: false, isMatched: false });
      deck.push({ id: `${pair.id}-I`, pairId: pair.id, imageUrl: pair.imageI, isFlipped: false, isMatched: false });
    });

    // Shuffle deck
    const shuffledDeck = deck.sort(() => Math.random() - 0.5);

    set({
      cards: shuffledDeck,
      flippedIndices: [],
      score: 0,
      timeLeft: 60,
      isPlaying: true,
    });
  },

  flipCard: (index) => {
    const { cards, flippedIndices, isPlaying } = get();
    
    // Prevent flipping if not playing, or if already flipped/matched, or if 2 cards are already flipped
    if (!isPlaying || cards[index].isFlipped || cards[index].isMatched || flippedIndices.length >= 2) return;

    const newCards = [...cards];
    newCards[index] = { ...newCards[index], isFlipped: true };
    const newFlippedIndices = [...flippedIndices, index];

    set({ cards: newCards, flippedIndices: newFlippedIndices });

    // If two cards are flipped, check for match
    if (newFlippedIndices.length === 2) {
      const [idx1, idx2] = newFlippedIndices;
      const isMatch = newCards[idx1].pairId === newCards[idx2].pairId;

      setTimeout(() => {
        const { cards: currentCards, score } = get();
        const updatedCards = [...currentCards];

        if (isMatch) {
          updatedCards[idx1] = { ...updatedCards[idx1], isMatched: true };
          updatedCards[idx2] = { ...updatedCards[idx2], isMatched: true };
          
          set({
            cards: updatedCards,
            flippedIndices: [],
            score: score + 10,
          });

          // Check win condition
          if (updatedCards.every(card => card.isMatched)) {
            set({ isPlaying: false });
          }
        } else {
          updatedCards[idx1] = { ...updatedCards[idx1], isFlipped: false };
          updatedCards[idx2] = { ...updatedCards[idx2], isFlipped: false };
          set({ cards: updatedCards, flippedIndices: [] });
        }
      }, 1000); // Wait 1s before flipping back or locking match
    }
  },

  tickTimer: () => {
    const { timeLeft, isPlaying } = get();
    if (isPlaying && timeLeft > 0) {
      set({ timeLeft: timeLeft - 1 });
    } else if (timeLeft === 0) {
      set({ isPlaying: false });
    }
  },

  resetGame: () => {
    set({
      cards: [],
      flippedIndices: [],
      score: 0,
      timeLeft: 60,
      isPlaying: false,
    });
  }
}));
