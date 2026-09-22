import React, { useEffect, useRef, useState } from 'react';
import { useWordMeshStore, GAME_DURATION } from './store';
import { pickGridSize } from './puzzles';

export interface WordMeshGameProps {
  themeLogoUrl: string;
  themeBannerUrl: string;
  themePrimaryColor: string;
  themeSecondaryColor: string;
  /** Optional word bank override; defaults to the built-in Nigerian sites list. */
  onGameEnd: (score: number, timeTaken: number) => void;
  onExit: () => void;
}

const ACCENT_RED = '#E53935';
const FOUND_COLOR = '#2E7D32';
const SELECT_COLOR = '#8AB4F8';

export const WordMeshGame: React.FC<WordMeshGameProps> = ({
  themeBannerUrl,
  themePrimaryColor,
  themeSecondaryColor,
  onGameEnd,
  onExit,
}) => {
  const {
    grid,
    gridSize,
    placements,
    foundWords,
    selectedCells,
    anchorCell,
    score,
    timeLeft,
    isPlaying,
    isGameEnded,
    isWon,
    lastFoundCells,
    initializeGame,
    startSelection,
    previewSelection,
    commitSelection,
    clearSelection,
    tickTimer,
    clearProgress,
  } = useWordMeshStore();

  // Vertical scale for the fixed-width layout. Width is capped at 480px so the
  // board does not stretch into an unreadable band on wide screens, while height
  // still scales up on tall displays.
  const CONTENT_WIDTH = 480;
  const BASE_HEIGHT = 850;

  const [viewport, setViewport] = useState(() => ({
    width: typeof window !== 'undefined' ? window.innerWidth : CONTENT_WIDTH,
    height: typeof window !== 'undefined' ? window.innerHeight : BASE_HEIGHT,
  }));

  useEffect(() => {
    const handleResize = () => {
      setViewport({ width: window.innerWidth, height: window.innerHeight });
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  const contentWidth = Math.min(viewport.width, CONTENT_WIDTH);
  // Scale up on tall/large screens, shrink on short ones.
  const scale = Math.min(
    viewport.width / CONTENT_WIDTH,
    viewport.height / BASE_HEIGHT
  );

  // Grid size follows the device: a bigger screen gets a bigger board, capped
  // at MAX_GRID_SIZE. Larger boards also admit more diagonal placements.
  const desiredGridSize = pickGridSize(viewport.width, viewport.height);
  const lastGridSize = useRef<number | null>(null);

  useEffect(() => {
    // Rebuild when the chosen size changes, when the board is empty, or when a
    // game exists but is not running. The last condition self-heals the
    // StrictMode case where an effect cleanup stopped the timer after mount.
    const state = useWordMeshStore.getState();
    const needsInit =
      lastGridSize.current !== desiredGridSize ||
      state.grid.length === 0 ||
      !state.isPlaying;

    if (!needsInit) return;

    lastGridSize.current = desiredGridSize;
    initializeGame(desiredGridSize);
  }, [desiredGridSize, initializeGame]);

  useEffect(() => {
    return () => {
      // Clear only the in-progress selection on unmount. The grid and the
      // running game are intentionally left alone.
      clearProgress();
    };
  }, [clearProgress]);

  useEffect(() => {
    if (!isPlaying) return;
    const timer = setInterval(() => tickTimer(), 1000);
    return () => clearInterval(timer);
  }, [isPlaying, tickTimer]);

  // Countdown warning beep in the final 10 seconds.
  useEffect(() => {
    if (timeLeft <= 10 && timeLeft > 0 && isPlaying) {
      const audio = new Audio('/assets/sounds/beep.mp3');
      audio.volume = 0.5;
      audio.play().catch(() => {});
    }
  }, [timeLeft, isPlaying]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const isCellSelected = (key: string) => selectedCells.includes(key);
  const isCellFound = (key: string) =>
    placements.some((p) => foundWords.includes(p.word) && p.cells.includes(key));
  const isCellJustFound = (key: string) => lastFoundCells.includes(key);

  /**
   * Maps a screen point onto a grid cell.
   *
   * Hit-testing is done from coordinates rather than by attaching handlers to
   * each cell, because on a touchscreen a finger that starts on one letter and
   * slides to another never fires mouseenter on the cells it passes over. Mouse
   * events arrive at the element under the cursor, so per-cell handlers only
   * work with a mouse.
   */
  const gridRef = useRef<HTMLDivElement | null>(null);

  const cellFromPoint = (clientX: number, clientY: number): string | null => {
    const el = gridRef.current;
    if (!el) return null;

    const rect = el.getBoundingClientRect();
    if (
      clientX < rect.left ||
      clientX > rect.right ||
      clientY < rect.top ||
      clientY > rect.bottom
    ) {
      return null;
    }

    // The grid is a square of cells with a 2px gap, so the pitch is the track
    // size plus the gap. Deriving the pitch from the measured width keeps this
    // correct at every scale rather than assuming a pixel size.
    const GAP = 2;
    const pitch = (rect.width + GAP) / gridSize;
    const col = Math.floor((clientX - rect.left) / pitch);
    const row = Math.floor((clientY - rect.top) / pitch);

    if (row < 0 || col < 0 || row >= gridSize || col >= gridSize) return null;
    return `${row},${col}`;
  };

  /**
   * First contact picks the start letter.
   *
   * Everything else happens on move and release, which keeps the whole gesture
   * on one code path for mouse and touch alike.
   */
  const handlePointerDown = (e: React.PointerEvent) => {
    if (!isPlaying || isGameEnded) return;
    const cell = cellFromPoint(e.clientX, e.clientY);
    if (!cell) return;

    // Pressing the current anchor clears it, so a mistap can be undone.
    startSelection(cell);
  };

  /**
   * Pointer movement previews the line from the anchor to the pointer.
   *
   * This is what makes the selection follow the finger across the board, and is
   * the part that previously did nothing on touch devices.
   */
  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isPlaying || isGameEnded) return;
    if (anchorCell === null) return;

    const cell = cellFromPoint(e.clientX, e.clientY);
    if (cell) previewSelection(cell);
  };

  /**
   * Release commits the word.
   *
   * Lifting off a single letter selects nothing, because the store ignores a
   * selection shorter than two cells, so a plain tap simply sets the anchor.
   */
  const handlePointerUp = (e: React.PointerEvent) => {
    if (!isPlaying || isGameEnded) return;
    if (anchorCell === null) return;

    const cell = cellFromPoint(e.clientX, e.clientY);
    if (cell) previewSelection(cell);
    commitSelection();
  };

  return (
    <div
      style={{
        width: '100vw',
        height: '100dvh',
        backgroundColor: '#111',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
        touchAction: 'none',
        fontFamily: "'Outfit', sans-serif",
        position: 'relative',
      }}
      className="wordmesh-root"
      onPointerLeave={clearSelection}
    >
      {/* Background Layer */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundImage: `url('/assets/dynamic/gameBackground.webp')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          zIndex: 0,
        }}
      />

      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@700&display=swap');

          @keyframes flashTimerText {
            0%, 100% { color: white !important; background-color: ${themeSecondaryColor} !important; }
            50% { color: ${themePrimaryColor} !important; background-color: white !important; }
          }
          .timer-flash {
            animation: flashTimerText 1s infinite;
          }
          @keyframes wordFoundPop {
            0% { transform: scale(1); }
            50% { transform: scale(1.15); }
            100% { transform: scale(1); }
          }
          .word-found-pop {
            animation: wordFoundPop 0.45s ease;
          }
        `}
      </style>

      <div
        style={{
          width: `${CONTENT_WIDTH}px`,
          height: `${BASE_HEIGHT}px`,
          transform: `scale(${scale})`,
          transformOrigin: 'center center',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          zIndex: 1,
          // On small screens the scale shrinks this canvas; the width below
          // keeps the visible box aligned to the actual viewport.
          maxWidth: `${contentWidth}px`,
        }}
      >
        {/* Top Banner section - mirrors the DuoLock header */}
        <div style={{ width: '90%', marginTop: '60px', position: 'relative' }}>
          <img
            src={themeBannerUrl}
            alt="Banner"
            style={{ width: '100%', borderRadius: '10px', display: 'block' }}
          />

          {/* Overlay Timer and Score */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              width: '100%',
              position: 'absolute',
              bottom: '-15px',
              padding: '0 15px',
              boxSizing: 'border-box',
              zIndex: 10,
            }}
          >
            <div
              className={timeLeft <= 10 && timeLeft > 0 && isPlaying ? 'timer-flash' : ''}
              style={{
                backgroundColor: 'white',
                color: themePrimaryColor,
                border: `2.5px solid ${themePrimaryColor}`,
                padding: '2px 12px',
                borderRadius: '8px',
                fontWeight: 800,
                fontSize: '18px',
                fontFamily: "'Orbitron', sans-serif",
                boxShadow: '0 4px 10px rgba(0,0,0,0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                letterSpacing: '1px',
                transition: 'all 0.3s ease',
                whiteSpace: 'nowrap',
              }}
            >
              {formatTime(timeLeft)}
            </div>

            <div
              style={{
                backgroundColor: ACCENT_RED,
                color: 'white',
                padding: '4px 16px',
                borderRadius: '8px',
                fontWeight: 900,
                fontSize: '16px',
                boxShadow: '0 4px 10px rgba(0,0,0,0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                letterSpacing: '1px',
              }}
            >
              SCORE {score}
            </div>
          </div>
        </div>

        {/* Letter Grid */}
        <div
          style={{
            width: '96%',
            marginTop: '60px',
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '6px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.35)',
            boxSizing: 'border-box',
          }}
        >
          <div
            ref={gridRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            style={{
              display: 'grid',
              // minmax(0, 1fr) is required: plain `1fr` has an auto minimum, so
              // the columns would refuse to shrink and overflow the container.
              gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))`,
              gap: '2px',
              width: '100%',
              // Stop the browser treating a drag as a scroll gesture, which would
              // otherwise cancel the pointer sequence mid-word.
              touchAction: 'none',
            }}
          >
            {grid.map((rowArr, row) =>
              rowArr.map((letter, col) => {
                const key = `${row},${col}`;
                const selected = isCellSelected(key);
                const found = isCellFound(key);
                const justFound = isCellJustFound(key);
                const isAnchor = anchorCell === key;

                // The word just found gets a distinct colour so the player can
                // see it during the pause before the result panel appears.
                const background = justFound && found
                  ? '#F9A825'
                  : selected
                    ? SELECT_COLOR
                    : found
                      ? FOUND_COLOR
                      : '#f5f5f5';
                const color = selected || found ? 'white' : '#222';

                return (
                  <div
                    key={key}
                    className={justFound ? 'word-found-pop' : ''}
                    style={{
                      aspectRatio: '1',
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      backgroundColor: background,
                      color,
                      borderRadius: '4px',
                      fontWeight: 700,
                      // Fewer columns means bigger cells, so scale the glyph with
                      // the grid instead of using a fixed size.
                      fontSize: `${Math.round(260 / gridSize)}px`,
                      lineHeight: 1,
                      minWidth: 0,
                      cursor: isPlaying ? 'pointer' : 'default',
                      userSelect: 'none',
                      transition: 'background-color 0.15s ease',
                      fontFamily: "'Outfit', sans-serif",
                      // Ring on the start letter so the player can see where the
                      // word began while hovering toward the end letter.
                      boxShadow: isAnchor ? '0 0 0 2px white, 0 0 0 4px #1A3A6B' : 'none',
                      position: 'relative',
                      zIndex: isAnchor ? 2 : undefined,
                    }}
                  >
                    {letter}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Word List */}
        <div
          style={{
            width: '90%',
            marginTop: '18px',
            flex: 1,
            overflowY: 'auto',
          }}
          className="wordmesh-wordlist"
        >
          <div
            onClick={onExit}
            role="button"
            title="Back to games"
            style={{
              color: 'white',
              fontWeight: 800,
              fontSize: '14px',
              marginBottom: '8px',
              letterSpacing: '0.5px',
              textShadow: '0 2px 6px rgba(0,0,0,0.6)',
              cursor: 'pointer',
              // Tapping the heading exits, since the bottom logo was removed.
              display: 'inline-block',
            }}
          >
            Tourist sites in Nigeria
          </div>
          <div
            style={{
              display: 'grid',
              // Four columns so long site names fit without wrapping.
              gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
              gap: '5px 10px',
            }}
          >
            {placements.map((p) => {
              const found = foundWords.includes(p.word);
              return (
                <div
                  key={p.word}
                  style={{
                    color: found ? '#8AB4F8' : 'white',
                    fontWeight: 700,
                    fontSize: '14px',
                    textDecoration: found ? 'line-through' : 'none',
                    textShadow: '0 2px 6px rgba(0,0,0,0.6)',
                    transition: 'color 0.2s ease',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {p.word}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Win / Lose Overlay */}
      {isGameEnded && (
        <div
          className="animate-slide-up"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100dvh',
            backgroundColor: isWon ? '#1A3A6B' : ACCENT_RED,
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            padding: '20px',
            textAlign: 'center',
          }}
        >
          <h1 style={{ fontSize: '48px', margin: 0, fontFamily: "'Orbitron', sans-serif" }}>
            {isWon ? 'YOU WON!' : 'TIME UP!'}
          </h1>
          <h2 style={{ fontSize: '24px', fontWeight: 400, marginBottom: '40px' }}>
            Final Score: {score}
          </h2>

          <button
            onClick={() => onGameEnd(score, GAME_DURATION - timeLeft)}
            style={{
              backgroundColor: 'white',
              color: isWon ? '#1A3A6B' : ACCENT_RED,
              border: 'none',
              padding: '15px 40px',
              borderRadius: '30px',
              fontSize: '18px',
              fontWeight: 800,
              cursor: 'pointer',
              boxShadow: '0 8px 20px rgba(0,0,0,0.3)',
              transition: 'transform 0.2s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.05)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
          >
            VIEW LEADERBOARD
          </button>
        </div>
      )}
    </div>
  );
};
