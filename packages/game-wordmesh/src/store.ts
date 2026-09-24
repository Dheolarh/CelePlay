import { create } from 'zustand';
import {
  DEFAULT_GRID_SIZE,
  generatePuzzle,
  findMatch,
  buildLinePath,
  type Placement,
} from './puzzles';

const WORDS_TO_FIND = 8;
// One minute 30 seconds, matching the how-to-play card for this game.
const GAME_DURATION = 90;
const POINTS_PER_WORD = 10;
// Pause after the final word so the player sees their last find highlighted
// before the win panel appears.
const END_OF_GAME_DELAY_MS = 1400;

interface WordMeshState {
  grid: string[][];
  /** Chosen at runtime from the device size; drives grid layout and path bounds. */
  gridSize: number;
  placements: Placement[];
  foundWords: string[];
  selectedCells: string[];
  /** The cell clicked first; null when nothing is being selected. */
  anchorCell: string | null;
  score: number;
  timeLeft: number;
  isPlaying: boolean;
  isGameEnded: boolean;
  isWon: boolean;
  /** The most recently found word, for feedback animation. */
  lastFoundWord: string | null;
  /** Cells of the most recently found word, for highlight animation. */
  lastFoundCells: string[];
  initializeGame: (gridSize?: number) => void;
  /** Starts the clock. Called once the instructions popup is closed. */
  startGame: () => void;
  startSelection: (cell: string) => void;
  previewSelection: (cell: string) => void;
  commitSelection: () => void;
  clearSelection: () => void;
  tickTimer: () => void;
  resetGame: () => void;
  /** Clears in-progress selection only - used on unmount so the board survives. */
  clearProgress: () => void;
}

const correctAudio = new Audio('/assets/sounds/correct.mp3');
const wrongAudio = new Audio('/assets/sounds/wrong.mp3');
const winAudio = new Audio('/assets/sounds/win.mp3');
const loseAudio = new Audio('/assets/sounds/lose.mp3');

const playSound = (audio: HTMLAudioElement) => {
  audio.currentTime = 0;
  audio.play().catch(() => {});
};

export const useWordMeshStore = create<WordMeshState>((set, get) => ({
  grid: [],
  gridSize: DEFAULT_GRID_SIZE,
  placements: [],
  foundWords: [],
  selectedCells: [],
  anchorCell: null,
  score: 0,
  timeLeft: GAME_DURATION,
  isPlaying: false,
  isGameEnded: false,
  isWon: false,
  lastFoundWord: null,
  lastFoundCells: [],

  /**
   * Builds a puzzle and leaves it PAUSED.
   *
   * isPlaying stays false until startGame() runs, which happens when the player
   * closes the how-to-play popup. Without this the clock would run
   * down while they were still reading the rules.
   */
  initializeGame: (gridSize = DEFAULT_GRID_SIZE) => {
    const puzzle = generatePuzzle(WORDS_TO_FIND, gridSize);
    set({
      grid: puzzle.grid,
      gridSize,
      placements: puzzle.placements,
      foundWords: [],
      selectedCells: [],
      anchorCell: null,
      score: 0,
      timeLeft: GAME_DURATION,
      isPlaying: false,
      isGameEnded: false,
      isWon: false,
      lastFoundWord: null,
      lastFoundCells: [],
    });
  },

  /** Starts the clock. Called once the instructions popup is closed. */
  startGame: () => set({ isPlaying: true }),

  startSelection: (cell) => {
    const { isPlaying, isGameEnded } = get();
    if (!isPlaying || isGameEnded) return;

    // First click sets the anchor. A second click on the SAME cell clears it,
    // so the player can cancel a bad start without committing.
    const { anchorCell } = get();
    if (anchorCell === cell) {
      set({ anchorCell: null, selectedCells: [] });
      return;
    }

    set({ anchorCell: cell, selectedCells: [cell] });
  },

  /**
   * Hover preview: computes the straight line from the anchor to the hovered
   * cell and selects exactly those cells. Because the path is recomputed from
   * scratch each time (rather than appended to), moving the mouse backwards
   * along the line naturally shrinks the selection.
   */
  previewSelection: (cell) => {
    const { anchorCell, isPlaying, isGameEnded, gridSize } = get();
    if (!isPlaying || isGameEnded || !anchorCell) return;

    if (cell === anchorCell) {
      set({ selectedCells: [anchorCell] });
      return;
    }

    const path = buildLinePath(anchorCell, cell, gridSize);
    // A diagonal that is not 45° (or any non-straight offset) yields null and
    // is simply ignored, so the previous valid preview stays on screen.
    if (!path) return;

    set({ selectedCells: path });
  },

  /**
   * Second click validates the word. If it is wrong, the selection clears
   * entirely - the player must click a fresh start letter.
   */
  commitSelection: () => {
    const {
      selectedCells,
      placements,
      foundWords,
      score,
      isPlaying,
      isGameEnded,
    } = get();

    if (!isPlaying || isGameEnded) return;

    // Nothing meaningful selected yet - just clear the anchor.
    if (selectedCells.length < 2) {
      set({ selectedCells: [], anchorCell: null });
      return;
    }

    const match = findMatch(placements, selectedCells);

    if (!match || foundWords.includes(match.word)) {
      playSound(wrongAudio);
      set({ selectedCells: [], anchorCell: null });
      return;
    }

    playSound(correctAudio);
    const nextFound = [...foundWords, match.word];
    const nextScore = score + POINTS_PER_WORD;
    const allFound = nextFound.length === placements.length;

    // Show the final word highlight first, then raise the result overlay.
    // Without this delay the overlay covers the board in the same frame, so the
    // player never sees the word they just found.
    if (allFound) {
      playSound(winAudio);
      set({
        foundWords: nextFound,
        score: nextScore,
        selectedCells: [],
        anchorCell: null,
        lastFoundWord: match.word,
        lastFoundCells: match.cells,
        isPlaying: false,
      });

      setTimeout(() => {
        set({ isGameEnded: true, isWon: true });
      }, END_OF_GAME_DELAY_MS);
      return;
    }

    set({
      foundWords: nextFound,
      score: nextScore,
      selectedCells: [],
      anchorCell: null,
      lastFoundWord: match.word,
      lastFoundCells: match.cells,
    });
  },

  clearSelection: () => {
    const { isPlaying, isGameEnded } = get();
    if (!isPlaying || isGameEnded) return;
    set({ selectedCells: [], anchorCell: null });
  },

  tickTimer: () => {
    const { timeLeft, isPlaying } = get();
    // `isPlaying` is already false during the end-of-game pause, so the timer
    // cannot fire a lose state on top of a pending win.
    if (!isPlaying) return;

    if (timeLeft > 0) {
      set({ timeLeft: timeLeft - 1 });
    } else {
      playSound(loseAudio);
      set({ isPlaying: false, isGameEnded: true, isWon: false });
    }
  },

  clearProgress: () => {
    // IMPORTANT: do not touch `isPlaying` here. This runs on effect cleanup,
    // which React StrictMode triggers immediately after mount during its
    // double-invoke check. Clearing `isPlaying` would stop the game timer
    // before the player ever starts, leaving the board frozen.
    set({
      selectedCells: [],
      anchorCell: null,
    });
  },

  resetGame: () => {
    set({
      grid: [],
      placements: [],
      foundWords: [],
      selectedCells: [],
      anchorCell: null,
      score: 0,
      timeLeft: GAME_DURATION,
      isPlaying: false,
      isGameEnded: false,
      isWon: false,
      lastFoundWord: null,
      lastFoundCells: [],
    });
  },
}));

export { GAME_DURATION, POINTS_PER_WORD, END_OF_GAME_DELAY_MS };
