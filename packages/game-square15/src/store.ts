import { create } from 'zustand';

type GameState = 'playing' | 'ended';

interface Square15Store {
  grid: number[];
  gameState: GameState;
  isPeeking: boolean;
  timeLeft: number;
  score: number;
  isWon: boolean;
  
  initializeGame: () => void;
  movePiece: (index: number) => void;
  setPeeking: (peeking: boolean) => void;
  tickTimer: () => void;
  resetGame: () => void;
}

const SOLVED_STATE = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];

const calculateScore = (grid: number[]) => {
  let score = 0;
  // Check positions 0 to 14 (we don't score the empty slot 15 to make max score 150)
  for (let i = 0; i < 15; i++) {
    if (grid[i] === i) {
      score += 10;
    }
  }
  return score;
};

// Get valid neighbors for a 1D array representing a 4x4 grid
const getValidMoves = (emptyIndex: number) => {
  const moves: number[] = [];
  const row = Math.floor(emptyIndex / 4);
  const col = emptyIndex % 4;

  if (row > 0) moves.push(emptyIndex - 4); // Up
  if (row < 3) moves.push(emptyIndex + 4); // Down
  if (col > 0) moves.push(emptyIndex - 1); // Left
  if (col < 3) moves.push(emptyIndex + 1); // Right

  return moves;
};

// Shuffle by simulating random valid moves
const generateSolvableGrid = () => {
  let grid = [...SOLVED_STATE];
  let emptyIndex = 15;
  let lastMove = -1;

  for (let i = 0; i < 200; i++) {
    const validMoves = getValidMoves(emptyIndex);
    // Don't just undo the last move immediately to ensure good scrambling
    const filteredMoves = validMoves.filter((m) => m !== lastMove);
    const move = filteredMoves[Math.floor(Math.random() * filteredMoves.length)];
    
    // Swap
    [grid[emptyIndex], grid[move]] = [grid[move], grid[emptyIndex]];
    lastMove = emptyIndex;
    emptyIndex = move;
  }
  
  return grid;
};

export const useSquare15Store = create<Square15Store>((set, get) => ({
  grid: [...SOLVED_STATE],
  gameState: 'playing',
  isPeeking: false,
  timeLeft: 180,
  score: 0,
  isWon: false,

  initializeGame: () => {
    const newGrid = generateSolvableGrid();
    set({
      grid: newGrid,
      gameState: 'playing',
      isPeeking: false,
      timeLeft: 180,
      score: calculateScore(newGrid),
      isWon: false,
    });
  },

  movePiece: (index: number) => {
    const { grid, gameState } = get();
    if (gameState !== 'playing') return;

    const emptyIndex = grid.indexOf(15);
    const validMoves = getValidMoves(emptyIndex);

    if (validMoves.includes(index)) {
      // It's adjacent to the empty space, we can swap
      const newGrid = [...grid];
      [newGrid[emptyIndex], newGrid[index]] = [newGrid[index], newGrid[emptyIndex]];
      
      const newScore = calculateScore(newGrid);
      const isWon = newScore === 150; // All 15 pieces in correct spots

      set({ 
        grid: newGrid, 
        score: newScore,
        ...(isWon && { gameState: 'ended', isWon: true })
      });
    }
  },

  setPeeking: (peeking: boolean) => {
    const { gameState } = get();
    if (gameState === 'playing') {
      set({ isPeeking: peeking });
    }
  },

  tickTimer: () => {
    set((state) => {
      if (state.gameState !== 'playing') return state;
      
      const newTime = state.timeLeft - 1;
      if (newTime <= 0) {
        return { timeLeft: 0, gameState: 'ended', isWon: false };
      }
      return { timeLeft: newTime };
    });
  },

  resetGame: () => {
    set({
      grid: [...SOLVED_STATE],
      gameState: 'playing',
      isPeeking: false,
      timeLeft: 180,
      score: 0,
      isWon: false,
    });
  }
}));
