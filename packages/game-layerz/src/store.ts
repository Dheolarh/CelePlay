import { create } from 'zustand';

export interface LayerPiece {
  id: number; // 1 to 10, representing its correct layer slot (1 = top)
  imageUrl: string;
}

interface LayerzState {
  gameState: 'idle' | 'memorizing' | 'guessing' | 'dragging' | 'ended';
  pieces: LayerPiece[];
  shuffledQueue: LayerPiece[];
  currentPiece: LayerPiece | null;
  hiddenSlot: 'red' | 'blue' | null;
  revealedSlot: 'red' | 'blue' | null;
  placedPieces: { [layerId: number]: LayerPiece };
  lifelines: number;
  score: number; // Number of correctly placed layers * 10
  memorizeTimeLeft: number;
  gameTimeLeft: number;
  isWon: boolean;

  initializeGame: (pieces: LayerPiece[]) => void;
  guessSlot: (slot: 'red' | 'blue') => void;
  dropPiece: (layerId: number) => void; // Called when user drops the piece onto a stack slot
  tickMemorizeTimer: () => void;
  tickGameTimer: () => void;
  resetGame: () => void;
}

export const useLayerzStore = create<LayerzState>((set, get) => ({
  gameState: 'idle',
  pieces: [],
  shuffledQueue: [],
  currentPiece: null,
  hiddenSlot: null,
  revealedSlot: null,
  placedPieces: {},
  lifelines: 6,
  score: 0,
  memorizeTimeLeft: 10,
  gameTimeLeft: 60,
  isWon: false,

  initializeGame: (pieces) => {
    // Shuffle the pieces so they are presented in random order
    const shuffledQueue = [...pieces].sort(() => Math.random() - 0.5);
    const currentPiece = shuffledQueue.shift() || null;
    const hiddenSlot = Math.random() > 0.5 ? 'red' : 'blue';

    set({
      gameState: 'memorizing',
      pieces,
      shuffledQueue,
      currentPiece,
      hiddenSlot,
      revealedSlot: null,
      placedPieces: {},
      lifelines: 6,
      score: 0,
      memorizeTimeLeft: 10,
      gameTimeLeft: 60,
      isWon: false
    });
  },

  guessSlot: (slot) => {
    const { gameState, hiddenSlot, lifelines } = get();
    if (gameState !== 'guessing' || !hiddenSlot) return;

    if (slot === hiddenSlot) {
      // Correct guess: Reveal the piece in the slot
      const audio = new Audio('/assets/sounds/correct.mp3');
      audio.play().catch(() => {});
      set({ gameState: 'dragging', revealedSlot: hiddenSlot });
    } else {
      // Wrong guess: Lose lifeline, reveal piece in correct slot
      const audio = new Audio('/assets/sounds/wrong.mp3');
      audio.play().catch(() => {});
      
      const newLifelines = lifelines - 1;
      if (newLifelines <= 0) {
        set({ lifelines: 0, gameState: 'ended', isWon: false });
      } else {
        set({ lifelines: newLifelines, gameState: 'dragging', revealedSlot: hiddenSlot });
      }
    }
  },

  dropPiece: (layerId) => {
    const { gameState, currentPiece, shuffledQueue, placedPieces, lifelines, score } = get();
    if (gameState !== 'dragging' || !currentPiece) return;

    if (layerId === currentPiece.id) {
      // Correct placement
      const audio = new Audio('/assets/sounds/correct.mp3');
      audio.play().catch(() => {});

      const newPlacedPieces = { ...placedPieces, [layerId]: currentPiece };
      const newScore = score + 10;
      
      if (shuffledQueue.length === 0) {
        // All pieces placed!
        set({
          placedPieces: newPlacedPieces,
          score: newScore,
          gameState: 'ended',
          isWon: true
        });
      } else {
        // Queue up next piece
        const nextQueue = [...shuffledQueue];
        const nextPiece = nextQueue.shift() || null;
        const nextHiddenSlot = Math.random() > 0.5 ? 'red' : 'blue';

        set({
          placedPieces: newPlacedPieces,
          score: newScore,
          shuffledQueue: nextQueue,
          currentPiece: nextPiece,
          hiddenSlot: nextHiddenSlot,
          revealedSlot: null,
          gameState: 'guessing'
        });
      }
    } else {
      // Wrong placement
      const audio = new Audio('/assets/sounds/wrong.mp3');
      audio.play().catch(() => {});

      const newLifelines = lifelines - 1;
      if (newLifelines <= 0) {
        set({ lifelines: 0, gameState: 'ended', isWon: false });
      } else {
        // Snap back to slot (stay in 'dragging' state so user can try again)
        set({ lifelines: newLifelines });
      }
    }
  },

  tickMemorizeTimer: () => {
    const { memorizeTimeLeft, gameState } = get();
    if (gameState === 'memorizing' && memorizeTimeLeft > 0) {
      set({ memorizeTimeLeft: memorizeTimeLeft - 1 });
      if (memorizeTimeLeft - 1 === 0) {
        set({ gameState: 'guessing' });
      }
    }
  },

  tickGameTimer: () => {
    const { gameTimeLeft, gameState } = get();
    if ((gameState === 'guessing' || gameState === 'dragging') && gameTimeLeft > 0) {
      set({ gameTimeLeft: gameTimeLeft - 1 });
      if (gameTimeLeft - 1 === 0) {
        set({ gameState: 'ended', isWon: false });
      }
    }
  },

  resetGame: () => {
    set({
      gameState: 'idle',
      pieces: [],
      shuffledQueue: [],
      currentPiece: null,
      hiddenSlot: null,
      revealedSlot: null,
      placedPieces: {},
      lifelines: 6,
      score: 0,
      memorizeTimeLeft: 10,
      gameTimeLeft: 60,
      isWon: false
    });
  }
}));
