import { create } from 'zustand';

type GameState = 'playing' | 'flipping' | 'ended';

interface FlipiziState {
  gameState: GameState;
  timeLeft: number;
  score: number;
  chancesLeft: number;
  slots: (string | null)[]; // length 5, represents A L I K O
  currentHeadLetter: string;
  currentTailLetter: string;
  flipResult: 'head' | 'tail' | null;
  isWon: boolean;
  
  startGame: () => void;
  tickTimer: () => void;
  startFlip: () => void;
  resolveFlip: () => void;
  endGame: (won: boolean) => void;
}

const TARGET_WORD = ['a', 'l', 'i', 'k', 'o'];

export const useFlipiziStore = create<FlipiziState>((set) => {
  
  const setupNextTurn = (currentSlots: (string | null)[]) => {
    // Find missing letters
    const missingLetters = TARGET_WORD.filter((_, i) => currentSlots[i] === null);
    
    // If no missing letters, this shouldn't be called, but handle safely
    if (missingLetters.length === 0) {
      return { head: 'a', tail: 'l' };
    }

    // Pick one missing letter randomly
    const neededLetter = missingLetters[Math.floor(Math.random() * missingLetters.length)];
    
    // Pick another random letter (could be needed or not)
    const otherLetter = TARGET_WORD[Math.floor(Math.random() * TARGET_WORD.length)];

    // Randomly assign them to head and tail
    const isHeadNeeded = Math.random() < 0.5;
    
    return {
      head: isHeadNeeded ? neededLetter : otherLetter,
      tail: isHeadNeeded ? otherLetter : neededLetter
    };
  };

  return {
    gameState: 'playing',
    timeLeft: 60,
    score: 0,
    chancesLeft: 7,
    slots: [null, null, null, null, null],
    currentHeadLetter: 'a',
    currentTailLetter: 'l',
    flipResult: null,
    isWon: false,

    startGame: () => {
      const initialSlots = [null, null, null, null, null];
      const { head, tail } = setupNextTurn(initialSlots);
      
      set({
        gameState: 'playing',
        timeLeft: 60,
        score: 0,
        chancesLeft: 7,
        slots: initialSlots,
        currentHeadLetter: head,
        currentTailLetter: tail,
        flipResult: null,
        isWon: false,
      });
    },

    tickTimer: () => set((state) => {
      if (state.gameState !== 'playing' && state.gameState !== 'flipping') return state;
      if (state.timeLeft <= 1) {
        return { timeLeft: 0, gameState: 'ended', isWon: false };
      }
      return { timeLeft: state.timeLeft - 1 };
    }),

    startFlip: () => set((state) => {
      if (state.gameState !== 'playing' || state.chancesLeft <= 0) return state;
      
      // Determine flip result instantly
      const result = Math.random() < 0.5 ? 'head' : 'tail';
      
      return {
        gameState: 'flipping',
        flipResult: result,
        chancesLeft: state.chancesLeft - 1
      };
    }),

    resolveFlip: () => set((state) => {
      if (state.gameState !== 'flipping' || !state.flipResult) return state;

      const landedLetter = state.flipResult === 'head' ? state.currentHeadLetter : state.currentTailLetter;
      const newSlots = [...state.slots];
      let scoreGained = 0;

      // Find if landed letter is needed
      const targetIndex = TARGET_WORD.indexOf(landedLetter);
      if (targetIndex !== -1 && newSlots[targetIndex] === null) {
        // We needed it!
        newSlots[targetIndex] = landedLetter;
        scoreGained = 20;
      }

      const newScore = state.score + scoreGained;
      const isGameWon = newSlots.every(slot => slot !== null);

      if (isGameWon) {
        return {
          gameState: 'ended',
          slots: newSlots,
          score: newScore,
          isWon: true,
          flipResult: null
        };
      }

      if (state.chancesLeft <= 0) {
        return {
          gameState: 'ended',
          slots: newSlots,
          score: newScore,
          isWon: false,
          flipResult: null
        };
      }

      // Game continues, setup next turn
      const { head, tail } = setupNextTurn(newSlots);
      
      return {
        gameState: 'playing',
        slots: newSlots,
        score: newScore,
        currentHeadLetter: head,
        currentTailLetter: tail,
        flipResult: null
      };
    }),

    endGame: (won: boolean) => set({
      gameState: 'ended',
      isWon: won
    }),
  };
});
