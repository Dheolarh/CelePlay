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
  previewTimeLeft: number;
  isPlaying: boolean;
  isPreviewing: boolean;
  isGameEnded: boolean;
  isWon: boolean;
  initializeGame: (pairs: { id: string, imageA: string, imageB: string }[]) => void;
  flipCard: (index: number) => void;
  tickTimer: () => void;
  resetGame: () => void;
}

const correctAudio = new Audio('/assets/sounds/correct.mp3');
const wrongAudio = new Audio('/assets/sounds/wrong.mp3');
const winAudio = new Audio('/assets/sounds/win.mp3');
const loseAudio = new Audio('/assets/sounds/lose.mp3');

const playSound = (audio: HTMLAudioElement) => {
  audio.currentTime = 0;
  audio.play().catch(() => {});
};

export const useDuoLockStore = create<DuoLockState>((set, get) => ({
  cards: [],
  flippedIndices: [],
  score: 0,
  timeLeft: 60,
  previewTimeLeft: 10,
  isPlaying: false,
  isPreviewing: false,
  isGameEnded: false,
  isWon: false,

  initializeGame: (pairs) => {
    // Flatten pairs into an array of cards
    const deck: Card[] = [];
    pairs.forEach(pair => {
      deck.push({ id: `${pair.id}-a`, pairId: pair.id, imageUrl: pair.imageA, isFlipped: true, isMatched: false });
      deck.push({ id: `${pair.id}-b`, pairId: pair.id, imageUrl: pair.imageB, isFlipped: true, isMatched: false });
    });

    // Shuffle deck
    const shuffledDeck = deck.sort(() => Math.random() - 0.5);

    set({
      cards: shuffledDeck,
      flippedIndices: [],
      score: 0,
      timeLeft: 60,
      previewTimeLeft: 10,
      isPlaying: false,
      isPreviewing: true,
      isGameEnded: false,
      isWon: false
    });
  },

  flipCard: (index) => {
    const { cards, flippedIndices, isPlaying, isPreviewing, isGameEnded } = get();
    
    // Prevent flipping if not playing, or if already flipped/matched, or if 2 cards are already flipped
    if (!isPlaying || isPreviewing || isGameEnded || cards[index].isFlipped || cards[index].isMatched || flippedIndices.length >= 2) return;

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
          playSound(correctAudio);
          updatedCards[idx1] = { ...updatedCards[idx1], isMatched: true };
          updatedCards[idx2] = { ...updatedCards[idx2], isMatched: true };
          
          set({
            cards: updatedCards,
            flippedIndices: [],
            score: score + 10,
          });

          // Check win condition
          if (updatedCards.every(card => card.isMatched)) {
            playSound(winAudio);
            set({ isPlaying: false, isGameEnded: true, isWon: true });
          }
        } else {
          playSound(wrongAudio);
          updatedCards[idx1] = { ...updatedCards[idx1], isFlipped: false };
          updatedCards[idx2] = { ...updatedCards[idx2], isFlipped: false };
          set({ cards: updatedCards, flippedIndices: [] });
        }
      }, 700); // Wait 700ms before flipping back or locking match
    }
  },

  tickTimer: () => {
    const { timeLeft, previewTimeLeft, isPlaying, isPreviewing } = get();
    
    if (isPreviewing && previewTimeLeft > 0) {
      set({ previewTimeLeft: previewTimeLeft - 1 });
      if (previewTimeLeft - 1 === 0) {
        // End preview, start the real game
        const currentCards = get().cards;
        set({
          cards: currentCards.map(c => ({...c, isFlipped: false})),
          isPlaying: true,
          isPreviewing: false,
        });
      }
    } else if (isPlaying && timeLeft > 0) {
      set({ timeLeft: timeLeft - 1 });
    } else if (isPlaying && timeLeft === 0) {
      playSound(loseAudio);
      set({ isPlaying: false, isGameEnded: true, isWon: false });
    }
  },

  resetGame: () => {
    set({
      cards: [],
      flippedIndices: [],
      score: 0,
      timeLeft: 60,
      previewTimeLeft: 10,
      isPlaying: false,
      isPreviewing: false,
      isGameEnded: false,
      isWon: false
    });
  }
}));
