// WordMesh puzzle generation and helpers.

export type Direction = 'E' | 'W' | 'N' | 'S' | 'NE' | 'NW' | 'SE' | 'SW';

export interface Placement {
  word: string;
  row: number;
  col: number;
  direction: Direction;
  /** Ordered list of "row,col" cells the word occupies. */
  cells: string[];
}

export interface Puzzle {
  grid: string[][];
  words: string[];
  placements: Placement[];
}

// Grid dimensions are chosen at runtime from the device size. These bounds keep
// puzzles solvable at the small end and readable at the large end.
export const MIN_GRID_SIZE = 10;
export const MAX_GRID_SIZE = 15;
export const DEFAULT_GRID_SIZE = 12;

/**
 * Picks a grid size from the viewport. Larger screens get a larger grid, which
 * in turn gives diagonal placements room to fit. Capped at MAX_GRID_SIZE so the
 * board never becomes too dense to read.
 */
export const pickGridSize = (width: number, height: number): number => {
  // Base the decision on the smaller usable dimension so a wide-but-short
  // landscape window does not produce an oversized grid.
  const basis = Math.min(width, height);

  if (basis < 480) return 10;
  if (basis < 700) return 11;
  if (basis < 950) return 12;
  if (basis < 1200) return 13;
  if (basis < 1500) return 14;
  return MAX_GRID_SIZE;
};

// Word bank of Nigerian tourist sites. Letters only, no spaces or punctuation.
export const WORD_BANK = [
  'ASSOPFALLS',
  'IDANREHILL',
  'JABILAKE',
  'KAINJILAKE',
  'MOUNTPATTI',
  'OLUMOROCK',
  'SHEREHILLS',
  'ZUMAROCK',
  'OBUDU',
  'YANKARI',
  'GURARA',
  'ERINIJE',
  'MBULA',
  'OSUN',
  'OGUN',
  'SUKUR',
  'AGBOKIM',
  'AROCHUKWU',
  'BADAGRY',
  'CALABAR',
];

// A word must have at least this many letters to be placed in reverse.
const MIN_REVERSE_LENGTH = 5;

// Maximum placement attempts per word before giving up (grid is small).
const MAX_ATTEMPTS_PER_WORD = 300;

const DIRECTION_VECTORS: Record<Direction, { dr: number; dc: number }> = {
  E: { dr: 0, dc: 1 },
  W: { dr: 0, dc: -1 },
  S: { dr: 1, dc: 0 },
  N: { dr: -1, dc: 0 },
  SE: { dr: 1, dc: 1 },
  SW: { dr: 1, dc: -1 },
  NE: { dr: -1, dc: 1 },
  NW: { dr: -1, dc: -1 },
};

const ALL_DIRECTIONS: Direction[] = ['E', 'W', 'S', 'N', 'SE', 'SW', 'NE', 'NW'];

const DIAGONAL_DIRECTIONS: Direction[] = ['SE', 'SW', 'NE', 'NW'];

export const cellKey = (row: number, col: number) => `${row},${col}`;

const parseCell = (key: string) => {
  const [row, col] = key.split(',').map(Number);
  return { row, col };
};

/**
 * Attempts to place a word at the given origin/direction.
 * Returns the occupied cells, or null if it collides with a different letter.
 */
const tryPlace = (
  grid: (string | null)[][],
  word: string,
  row: number,
  col: number,
  direction: Direction,
  gridSize: number
): string[] | null => {
  const { dr, dc } = DIRECTION_VECTORS[direction];
  const cells: string[] = [];

  for (let i = 0; i < word.length; i++) {
    const r = row + dr * i;
    const c = col + dc * i;

    if (r < 0 || r >= gridSize || c < 0 || c >= gridSize) return null;

    const existing = grid[r][c];
    // Empty cell is fine; same letter is a valid crossing; anything else fails.
    if (existing !== null && existing !== word[i]) return null;

    cells.push(cellKey(r, c));
  }

  return cells;
};

const commitPlacement = (
  grid: (string | null)[][],
  word: string,
  cells: string[]
) => {
  cells.forEach((key, i) => {
    const { row, col } = parseCell(key);
    grid[row][col] = word[i];
  });
};

/**
 * Collects every position where `word` could be placed so that it crosses an
 * existing letter on the board. Each candidate is validated with `tryPlace`,
 * so only genuinely legal placements are returned.
 */
const findCrossingPlacements = (
  grid: (string | null)[][],
  word: string,
  gridSize: number
): { row: number; col: number; direction: Direction; cells: string[] }[] => {
  const results: { row: number; col: number; direction: Direction; cells: string[] }[] = [];

  for (let row = 0; row < gridSize; row++) {
    for (let col = 0; col < gridSize; col++) {
      const existing = grid[row][col];
      if (existing === null) continue;

      // Every index in the word where this board letter occurs is a crossing point.
      for (let i = 0; i < word.length; i++) {
        if (word[i] !== existing) continue;

        for (const direction of ALL_DIRECTIONS) {
          const { dr, dc } = DIRECTION_VECTORS[direction];
          // Walk backwards from the crossing cell to the word's origin.
          const originRow = row - dr * i;
          const originCol = col - dc * i;

          const cells = tryPlace(grid, word, originRow, originCol, direction, gridSize);
          if (cells) {
            results.push({ row: originRow, col: originCol, direction, cells });
          }
        }
      }
    }
  }

  return results;
};

/**
 * Generates a puzzle by mixing two placement strategies:
 *   - crossing placements, which interlock new words with existing letters
 *   - random placements, which let words land in open space
 *
 * The mix keeps puzzles feeling interlocked without forcing every word through
 * a crossing, which on a small grid would make short words nearly impossible
 * to place. Remaining cells are filled with random letters.
 */
export const generatePuzzle = (
  wordCount = 8,
  gridSize: number = DEFAULT_GRID_SIZE
): Puzzle => {
  // Longest-first gives the highest chance of fitting the big words.
  const candidates = [...new Set(WORD_BANK)]
    .filter((w) => w.length <= gridSize)
    .sort((a, b) => b.length - a.length);

  const grid: (string | null)[][] = Array.from({ length: gridSize }, () =>
    Array<string | null>(gridSize).fill(null)
  );

  const placements: Placement[] = [];

  // Seed the board with one horizontal word near the middle. Everything after
  // this has something to potentially cross.
  const seedIndex = Math.floor(Math.random() * candidates.length);
  const [seedWord] = candidates.splice(seedIndex, 1);
  const seedRow = Math.floor(gridSize / 2);
  const seedCol = Math.floor((gridSize - seedWord.length) / 2);
  const seedCells = tryPlace(grid, seedWord, seedRow, seedCol, 'E', gridSize);
  if (seedCells) {
    commitPlacement(grid, seedWord, seedCells);
    placements.push({ word: seedWord, row: seedRow, col: seedCol, direction: 'E', cells: seedCells });
  }

  // Chance that a given word is attempted as a crossing first. Remaining
  // attempts fall back to the random strategy.
  const CROSSING_BIAS = 0.65;

  // Larger grids have room for more diagonals, and diagonals make the puzzle
  // feel richer, so the required count scales with grid size. On a 12x12 this
  // yields 2; on a 15x15 it yields 3.
  const diagonalQuota = Math.max(1, Math.round((gridSize - 9) * 0.5));
  const countDiagonals = () =>
    placements.filter((p) => DIAGONAL_DIRECTIONS.includes(p.direction)).length;

  for (const word of candidates) {
    if (placements.length >= wordCount) break;

    // Reverse longer words sometimes so the puzzle isn't all forward-reading.
    const reverseEligible = word.length >= MIN_REVERSE_LENGTH;
    const letters =
      reverseEligible && Math.random() < 0.3 ? [...word].reverse().join('') : word;

    let placed = false;

    // While the diagonal quota is unmet, only accept diagonal placements.
    const needDiagonal = countDiagonals() < diagonalQuota;

    // Strategy 1: try to interlock via a crossing.
    if (Math.random() < CROSSING_BIAS && placements.length > 0) {
      const allOptions = findCrossingPlacements(grid, letters, gridSize);
      const diagOptions = allOptions.filter((o) => DIAGONAL_DIRECTIONS.includes(o.direction));

      // Honour the quota first, then fall back to any crossing.
      const options = needDiagonal && diagOptions.length > 0 ? diagOptions : allOptions;

      if (options.length > 0) {
        const wantDiagonal = needDiagonal || Math.random() < 0.35;
        const pool = wantDiagonal
          ? options.filter((o) => DIAGONAL_DIRECTIONS.includes(o.direction))
          : options.filter((o) => !DIAGONAL_DIRECTIONS.includes(o.direction));
        const usable = pool.length > 0 ? pool : options;
        const chosen = usable[Math.floor(Math.random() * usable.length)];

        commitPlacement(grid, letters, chosen.cells);
        placements.push({
          word,
          row: chosen.row,
          col: chosen.col,
          direction: chosen.direction,
          cells: chosen.cells,
        });
        placed = true;
      }
    }

    // Strategy 2: fall back to random placement in open space.
    for (let attempt = 0; attempt < MAX_ATTEMPTS_PER_WORD && !placed; attempt++) {
      // Bias toward diagonals while the quota is unmet, then keep a moderate
      // diagonal bias so the board is not dominated by horizontal words.
      const wantDiagonal = needDiagonal || Math.random() < 0.45;
      const direction = wantDiagonal
        ? DIAGONAL_DIRECTIONS[Math.floor(Math.random() * DIAGONAL_DIRECTIONS.length)]
        : ALL_DIRECTIONS[Math.floor(Math.random() * ALL_DIRECTIONS.length)];

      const row = Math.floor(Math.random() * gridSize);
      const col = Math.floor(Math.random() * gridSize);

      const cells = tryPlace(grid, letters, row, col, direction, gridSize);
      if (!cells) continue;

      commitPlacement(grid, letters, cells);
      placements.push({ word, row, col, direction, cells });
      placed = true;
    }
  }

  // Fill empty cells with random letters.
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const filled: string[][] = grid.map((rowArr) =>
    rowArr.map((cell) => cell ?? alphabet[Math.floor(Math.random() * alphabet.length)])
  );

  return {
    grid: filled,
    // Only report words that actually made it in.
    words: placements.map((p) => p.word),
    placements,
  };
};

/**
 * Given the currently selected cells, returns the matched placement if the
 * selection exactly equals a word's cells in forward or reverse order.
 */
export const findMatch = (
  placements: Placement[],
  selected: string[]
): Placement | null => {
  if (selected.length < 2) return null;
  const forward = selected.join('|');
  const backward = [...selected].reverse().join('|');

  return (
    placements.find((p) => {
      const target = p.cells.join('|');
      return target === forward || target === backward;
    }) ?? null
  );
};

/**
 * True when the two cells are adjacent (including diagonally).
 * Used to stop selections that "jump" across the grid.
 */
export const isAdjacent = (a: string, b: string) => {
  const first = parseCell(a);
  const second = parseCell(b);
  return Math.abs(first.row - second.row) <= 1 && Math.abs(first.col - second.col) <= 1;
};

/**
 * Builds the straight line of cells from `from` to `to`.
 *
 * Only the eight compass directions are allowed: horizontal, vertical, and
 * exact 45-degree diagonals. Turns are impossible because the path is a single
 * straight run - any offset that is not axis-aligned or an equal-magnitude
 * diagonal returns null, and the caller ignores it.
 *
 * The returned array always starts at `from` and ends at `to`, which is what
 * makes hover-preview reversible: recomputing for a nearer cell yields a
 * shorter array, so moving the mouse backwards visually un-highlights.
 */
export const buildLinePath = (
  from: string,
  to: string,
  gridSize: number = DEFAULT_GRID_SIZE
): string[] | null => {
  const start = parseCell(from);
  const end = parseCell(to);

  const rowDelta = end.row - start.row;
  const colDelta = end.col - start.col;

  const absRow = Math.abs(rowDelta);
  const absCol = Math.abs(colDelta);

  // Reject anything that is not horizontal, vertical, or an exact diagonal.
  const isDiagonal = absRow === absCol && absRow > 0;
  const isStraight = rowDelta === 0 || colDelta === 0;
  if (!isDiagonal && !isStraight) return null;

  // Same cell - a single-cell path.
  if (rowDelta === 0 && colDelta === 0) return [from];

  const steps = Math.max(absRow, absCol);
  const rowStep = Math.sign(rowDelta);
  const colStep = Math.sign(colDelta);

  const path: string[] = [];
  for (let i = 0; i <= steps; i++) {
    const row = start.row + rowStep * i;
    const col = start.col + colStep * i;
    if (row < 0 || row >= gridSize || col < 0 || col >= gridSize) return null;
    path.push(cellKey(row, col));
  }

  return path;
};

/** Exposed for tests / debugging. */
export const getCellParts = parseCell;
