import React, { useEffect, useRef, useState } from 'react';
import { useGuextaStore, GAME_DURATION } from './store';
import { layoutRows } from './attractions';

export interface GuextaGameProps {
  themeBannerUrl: string;
  themePrimaryColor: string;
  themeSecondaryColor: string;
  onGameEnd: (score: number, solved: number, timeTaken: number) => void;
  onExit: () => void;
}

const ACCENT_RED = '#E53935';
// Scrabble-style tile treatment: a warm cream face with a wood-toned edge and
// a small point value in the corner.
const TILE_FACE = '#F2D9A8';
const TILE_EDGE = '#C9A96A';
const TILE_TEXT = '#2B2B2B';
const SLOT_FILLED = '#1A3A6B';
const WIN_COLOR = '#1A3A6B';
// Distance the dragged tile sits above the pointer, so a finger does not cover it.
const DRAG_LIFT = 60;

// Placement feedback colours, in the style of a word-game tile checker:
//   green  - right letter, right slot
//   yellow - letter is in the answer, but this is the wrong slot
//   red    - letter is not in the answer at all
// The green and red are darkened from the obvious bright shades so white letter
// text clears WCAG AA contrast (4.5:1) against them.
const FEEDBACK_CORRECT = '#1F7A3D';
const FEEDBACK_PRESENT = '#E8B923';
const FEEDBACK_ABSENT = '#B3271F';

// Hint bulb. A saturated amber that still reads as "light" rather than
// "warning", and stays legible against both the pale slate and the dark
// background behind it.
const HINT_GOLD = '#FFB300';

/**
 * Classifies how well each placed letter matches the answer at its slot.
 *
 * Duplicate-aware, and importantly safe for PARTIALLY filled boards:
 *  - every answer letter is counted into `pool` up front
 *  - exact matches are marked green and removed from the pool
 *  - remaining tiles take a yellow only while the pool still holds that letter
 *
 * Counting the whole answer first (rather than only positions that failed to
 * match) is what makes a correct letter in the wrong slot show yellow even when
 * its true slot is still empty.
 */
// Scrabble-tile styling for placed letters. Each feedback colour gets a matching
// darker edge so a filled slot keeps the same raised, slab-like look as the bank
// tiles - only the colour changes.
const EMPTY_SLOT_FACE = 'rgba(255,255,255,0.92)';
const EMPTY_SLOT_EDGE = 'rgba(0,0,0,0.12)';

const slotStyleFor = (feedback: string | null) => {
  if (feedback === FEEDBACK_CORRECT) {
    return { face: FEEDBACK_CORRECT, edge: '#145228', text: '#FFFFFF' };
  }
  if (feedback === FEEDBACK_PRESENT) {
    return { face: FEEDBACK_PRESENT, edge: '#B98F12', text: '#3A2E05' };
  }
  return { face: FEEDBACK_ABSENT, edge: '#7A1A14', text: '#FFFFFF' };
};

/**
 * Classifies how well each placed letter matches the answer at its slot.
 *
 * Duplicate-aware, and importantly safe for PARTIALLY filled boards:
 *  - every answer letter is counted into `pool` up front
 *  - exact matches are marked green and removed from the pool
 *  - remaining tiles take a yellow only while the pool still holds that letter
 *
 * Counting the whole answer first (rather than only positions that failed to
 * match) is what makes a correct letter in the wrong slot show yellow even when
 * its true slot is still empty.
 */
const feedbackFor = (answer: string, placed: (string | null)[]): string[] => {
  const result: string[] = new Array(placed.length).fill(FEEDBACK_ABSENT);

  const pool: Record<string, number> = {};
  for (const ch of answer) pool[ch] = (pool[ch] ?? 0) + 1;

  // Pass 1: exact matches claim their slot and consume the letter first.
  placed.forEach((char, i) => {
    if (char === null) return;
    if (char === answer[i]) {
      result[i] = FEEDBACK_CORRECT;
      pool[char] -= 1;
    }
  });

  // Pass 2: remaining tiles are yellow while unmatched copies exist.
  placed.forEach((char, i) => {
    if (char === null || result[i] === FEEDBACK_CORRECT) return;
    if ((pool[char] ?? 0) > 0) {
      result[i] = FEEDBACK_PRESENT;
      pool[char] -= 1;
    }
  });

  return result;
};
// Slot and tile sizing. One shared size keeps the dragged tile an exact
// preview of the slot it will land in, and larger cells make the drop target
// easier to hit with a finger.
const SLOT_SIZE = 56;
const TILE_SIZE = SLOT_SIZE;
// Opacity of the slate artwork. The source image is solid white, so lowering the
// opacity is what turns it into the translucent "chopping board" surface.
const SLATE_OPACITY = 0.35;

/**
 * Interaction sounds.
 *
 * Created once at module scope rather than per render, so repeated pickups
 * reuse the same element. `currentTime = 0` rewinds it, which is what allows a
 * rapid series of pickups to retrigger instead of being ignored while the
 * previous play is still running.
 */
const pickUpAudio = new Audio('/assets/sounds/square drag.mp3');
pickUpAudio.volume = 0.6;

const dropAudio = new Audio('/assets/sounds/click.mp3');
dropAudio.volume = 0.7;

const hintAudio = new Audio('/assets/sounds/click.mp3');
hintAudio.volume = 0.7;

const playSound = (audio: HTMLAudioElement) => {
  audio.currentTime = 0;
  audio.play().catch(() => {});
};

export const GuextaGame: React.FC<GuextaGameProps> = ({
  themeBannerUrl,
  onGameEnd,
  onExit,
}) => {
  const {
    current,
    bank,
    slots,
    score,
    solvedCount,
    timeLeft,
    isPlaying,
    isGameEnded,
    justSolved,
    initializeGame,
    placeTile,
    returnTile,
    tickTimer,
    clearProgress,
  } = useGuextaStore();

  const CONTENT_WIDTH = 480;
  const BASE_HEIGHT = 850;

  const [viewport, setViewport] = useState(() => ({
    width: typeof window !== 'undefined' ? window.innerWidth : CONTENT_WIDTH,
    height: typeof window !== 'undefined' ? window.innerHeight : BASE_HEIGHT,
  }));

  useEffect(() => {
    const handleResize = () =>
      setViewport({ width: window.innerWidth, height: window.innerHeight });
    handleResize();
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  const contentWidth = Math.min(viewport.width, CONTENT_WIDTH);
  const scale = Math.min(viewport.width / CONTENT_WIDTH, viewport.height / BASE_HEIGHT);

  // Start a round on mount, and self-heal if a cleanup stopped the game.
  useEffect(() => {
    const state = useGuextaStore.getState();
    if (!state.current || state.slots.length === 0 || !state.isPlaying) {
      initializeGame();
    }
  }, [initializeGame]);

  useEffect(() => {
    return () => clearProgress();
  }, [clearProgress]);

  useEffect(() => {
    if (!isPlaying || isGameEnded) return;
    const timer = setInterval(() => tickTimer(), 1000);
    return () => clearInterval(timer);
  }, [isPlaying, isGameEnded, tickTimer]);

  useEffect(() => {
    if (timeLeft <= 10 && timeLeft > 0 && isPlaying) {
      const audio = new Audio('/assets/sounds/beep.mp3');
      audio.volume = 0.5;
      audio.play().catch(() => {});
    }
  }, [timeLeft, isPlaying]);

  const [dragOverSlot, setDragOverSlot] = useState<number | null>(null);
  const [showHint, setShowHint] = useState(false);

  // Hide the hint popup whenever the target attraction changes, so a solved word
  // never leaves a stale clue on screen for the next one.
  useEffect(() => {
    setShowHint(false);
  }, [current?.name]);
  // Pointer-based dragging. HTML5 drag-and-drop does not follow the finger on
  // touch devices and is unreliable in mobile browsers, so the tile is dragged
  // manually and a floating copy is offset above the pointer.
  const [dragTile, setDragTile] = useState<{ id: string; char: string } | null>(null);
  const [dragPos, setDragPos] = useState({ x: 0, y: 0 });
  /** Slot index the drag started from, or null when it came from the bank. */
  const [dragFromSlot, setDragFromSlot] = useState<number | null>(null);
  const slotRefs = useRef<(HTMLDivElement | null)[]>([]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // Build slot rows. `slotRowOf[i]` is the row for slot index i. The total
  // always equals the slot count because layoutRows counts letters only.
  const rows = current ? layoutRows(current.name) : [];
  const maxRow = rows.reduce((m, r) => Math.max(m, r.row), 0);
  const slotRowOf: number[] = [];
  for (let row = 0; row <= maxRow; row++) {
    for (const r of rows) {
      if (r.row === row) {
        for (let i = 0; i < r.count; i++) slotRowOf.push(row);
      }
    }
  }

  // Track the pointer while dragging and hit-test against the slot rectangles.
  // The tile follows the pointer freely - it is not snapped, so the player can
  // move it wherever they like before releasing.
  useEffect(() => {
    if (!dragTile) return;

    const move = (e: PointerEvent) => {
      const x = e.clientX;
      // The tile renders DRAG_LIFT (in canvas units) above the finger, so convert
      // that offset into real screen pixels via the scale factor before hit-testing.
      const tileY = e.clientY - DRAG_LIFT * scale;

      let hit: number | null = null;
      slotRefs.current.forEach((el, index) => {
        if (!el) return;
        const r = el.getBoundingClientRect();
        if (x >= r.left && x <= r.right && tileY >= r.top && tileY <= r.bottom) hit = index;
      });

      setDragOverSlot(hit);
      setDragPos({ x, y: tileY });
    };

    const up = () => {
      const target = dragOverSlot;
      const tile = dragTile;
      const from = dragFromSlot;
      setDragTile(null);
      setDragOverSlot(null);
      setDragFromSlot(null);
      if (!tile) return;

      // Feedback for the release itself, so every drop is audible even when the
      // move is rejected (locking, out-of-bounds, no-op same-slot release).
      playSound(dropAudio);

      if (from === null) {
        // Dragged from the bank: place it if released over a slot.
        if (target !== null) placeTile(tile.id, target);
        return;
      }

      // Dragged OUT of a slot.
      if (target === null) {
        // Released over empty space - return the tile to the bank.
        returnTile(from);
      } else if (target !== from) {
        // Released over a different slot - move it there.
        placeTile(tile.id, target);
      }
      // Released over its own slot: no change.
    };

    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
    return () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', up);
    };
  }, [dragTile, dragOverSlot, dragFromSlot, placeTile, returnTile, scale]);

  const handleDragStart = (
    tile: { id: string; char: string },
    e: React.PointerEvent,
    fromSlot: number | null = null
  ) => {
    e.preventDefault();
    // Fires for both a bank tile and one lifted out of a slot, so the same
    // pickup sound covers either case.
    playSound(pickUpAudio);
    setDragTile(tile);
    setDragFromSlot(fromSlot);
    setDragPos({ x: e.clientX, y: e.clientY - DRAG_LIFT * scale });
  };

  // Colour feedback for whatever is currently in the slots. Recomputed from the
  // answer each render, so it updates live as tiles are moved.
  const slotFeedback =
    current && slots.length === current.letters.length
      ? feedbackFor(
          current.letters,
          slots.map((s) => s?.char ?? null)
        )
      : [];

  const renderSlot = (index: number) => {
    const filled = slots[index];
    const isTarget = dragOverSlot === index;
    const feedback = filled ? slotFeedback[index] : null;
    // A correctly-placed tile is locked: it cannot be dragged out and nothing
    // can be dropped on top of it.
    const isLocked = !!filled && !!current && filled.char === current.letters[index];

    // Filled slots use the same raised scrabble-tile look as the bank, recoloured
    // by how well the letter matches: green (right place), yellow (in the word,
    // wrong place), red (not in the word).
    const style = filled ? slotStyleFor(feedback) : null;
    const faceColor = style ? style.face : EMPTY_SLOT_FACE;
    const edgeColor = style ? style.edge : EMPTY_SLOT_EDGE;
    const textColor = style ? style.text : 'white';

    return (
      <div
        key={`slot-${index}`}
        ref={(el) => {
          slotRefs.current[index] = el;
        }}
        onPointerDown={(e) => {
          // Only unlocked, filled slots can be dragged out.
          if (filled && !isLocked) handleDragStart(filled, e, index);
        }}
        style={{
          width: `${SLOT_SIZE}px`,
          height: `${SLOT_SIZE}px`,
          borderRadius: '10px',
          // Empty slots read as blank white tiles, as in the design.
          backgroundColor: faceColor,
          border: isTarget
            ? `3px dashed ${ACCENT_RED}`
            : `2px solid ${edgeColor}`,
          color: textColor,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          fontWeight: 800,
          fontSize: '24px',
          cursor: filled ? (isLocked ? 'default' : 'grab') : 'default',
          // Keep touch scrolling from hijacking a drag that started on a tile.
          touchAction: filled && !isLocked ? 'none' : undefined,
          transition: 'background-color 0.15s ease, border-color 0.15s ease',
          userSelect: 'none',
          fontFamily: "'Outfit', sans-serif",
          boxSizing: 'border-box',
          // The 0-offset slab under the tile is what gives it the scrabble depth,
          // matching the bank tiles. Only present on filled slots.
          boxShadow: style
            ? `0 3px 0 ${edgeColor}, 0 5px 10px rgba(0,0,0,0.3)`
            : 'none',
          transform: isTarget ? 'scale(1.06)' : 'scale(1)',
          // Fade the source tile while its floating copy is being dragged.
          opacity: dragFromSlot === index && dragTile ? 0.3 : 1,
        }}
      >
        {filled?.char ?? ''}
      </div>
    );
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
          @keyframes solvedPop {
            0% { transform: scale(1); }
            50% { transform: scale(1.06); }
            100% { transform: scale(1); }
          }
          .solved-pop { animation: solvedPop 0.45s ease; }
          @keyframes timerPulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.08); }
          }
          .timer-pulse { animation: timerPulse 1s infinite; }
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
          maxWidth: `${contentWidth}px`,
        }}
      >
        {/* Banner stays outside the slate */}
        <div style={{ width: '96%', marginTop: '40px' }}>
          <img
            src={themeBannerUrl}
            alt="Banner"
            style={{ width: '100%', borderRadius: '10px', display: 'block' }}
          />
        </div>

        {/* ---- SLATE: the play surface ---- */}
        <div
          style={{
            position: 'relative',
            width: '96%',
            flex: 1,
            marginTop: '22px',
            marginBottom: '22px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            overflow: 'hidden',
          }}
        >
          {/* Slate artwork, made translucent so it reads as a board. */}
          <img
            src="/assets/dynamic/guextaframe.webp"
            alt=""
            aria-hidden="true"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              objectFit: 'fill',
              opacity: SLATE_OPACITY,
              pointerEvents: 'none',
            }}
          />

          {/* Content stacked on the slate */}
          <div
            style={{
              position: 'relative',
              width: '100%',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '26px 18px',
              boxSizing: 'border-box',
            }}
          >
            {/* Score, at the top of the slate, with the hint button opposite */}
            <div
              style={{
                alignSelf: 'stretch',
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                position: 'relative',
              }}
            >
              <div
                style={{
                  backgroundColor: ACCENT_RED,
                  color: 'white',
                  padding: '6px 18px',
                  borderRadius: '10px',
                  fontWeight: 900,
                  fontSize: '16px',
                  letterSpacing: '1px',
                  boxShadow: '0 4px 10px rgba(0,0,0,0.3)',
                }}
              >
                SCORE {score}
              </div>

              {/* Hint button. Tapping it reveals a riddle for the current word.
                  Drawn as an inline SVG lightbulb so it needs no image asset and
                  stays crisp at any size. Gold keeps it noticeable against the
                  slate, and the 48px hit area suits touch input. */}
              <div
                onClick={() => {
                  playSound(hintAudio);
                  setShowHint((v) => !v);
                }}
                role="button"
                aria-label="Show hint"
                title="Show hint"
                style={{
                  width: '48px',
                  height: '48px',
                  flexShrink: 0,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  filter: 'drop-shadow(0 3px 6px rgba(0,0,0,0.55))',
                }}
              >
                <svg
                  viewBox="0 0 24 24"
                  width="42"
                  height="42"
                  fill="none"
                  stroke={HINT_GOLD}
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  {/* Bulb */}
                  <path d="M9 18h6" />
                  <path d="M10 21h4" />
                  <path d="M12 3a6 6 0 0 0-3.6 10.8c.5.4.8 1 .9 1.6l.1.6h5.2l.1-.6c.1-.6.4-1.2.9-1.6A6 6 0 0 0 12 3z" />
                </svg>
              </div>

              {/* Hint popup. Scrabble-tile styling: cream face, wood-toned edge,
                  rectangular so longer hint text fits. */}
              {showHint && current && (
                <div
                  style={{
                    position: 'absolute',
                    top: '44px',
                    right: 0,
                    maxWidth: '290px',
                    backgroundColor: TILE_FACE,
                    border: `3px solid ${TILE_EDGE}`,
                    borderRadius: '12px',
                    padding: '12px 16px',
                    color: TILE_TEXT,
                    fontWeight: 700,
                    fontSize: '15px',
                    lineHeight: 1.35,
                    boxShadow: `0 4px 0 ${TILE_EDGE}, 0 10px 22px rgba(0,0,0,0.45)`,
                    zIndex: 50,
                  }}
                >
                  {current.hint}
                </div>
              )}
            </div>

            {/* Slots */}
            <div
              className={justSolved ? 'solved-pop' : ''}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '8px',
                marginTop: '10px',
              }}
            >
              {Array.from({ length: maxRow + 1 }, (_, row) => (
                <div
                  key={`row-${row}`}
                  style={{
                    display: 'flex',
                    justifyContent: 'center',
                    gap: '6px',
                    flexWrap: 'wrap',
                  }}
                >
                  {slotRowOf
                    .map((r, i) => (r === row ? i : -1))
                    .filter((i) => i !== -1)
                    .map((slotIndex) => renderSlot(slotIndex))}
                </div>
              ))}
            </div>

            {/* Tile bank */}
            {/* Tile tray. Always a single row of 5 tiles (the store keeps it
                balanced at 3 letters from the answer + 2 absent ones), so it
                never wraps and never steals vertical space from the slots. */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'row',
                flexWrap: 'nowrap',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '8px',
                maxWidth: '100%',
              }}
            >
              {bank.map((tile) => (
                <div
                  key={tile.id}
                  onPointerDown={(e) => handleDragStart(tile, e)}
                  style={{
                    width: `${TILE_SIZE}px`,
                    height: `${TILE_SIZE}px`,
                    flex: '0 0 auto',
                    borderRadius: '10px',
                    backgroundColor: TILE_FACE,
                    border: `2px solid ${TILE_EDGE}`,
                    color: TILE_TEXT,
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    fontWeight: 800,
                    fontSize: '24px',
                    cursor: 'grab',
                    userSelect: 'none',
                    touchAction: 'none',
                    boxShadow: `0 3px 0 ${TILE_EDGE}, 0 5px 10px rgba(0,0,0,0.35)`,
                    fontFamily: "'Outfit', sans-serif",
                    // Hide the source tile while its floating copy is dragging.
                    opacity: dragTile?.id === tile.id ? 0.35 : 1,
                  }}
                >
                  {tile.char}
                </div>
              ))}
            </div>

            {/* Circular timer, at the bottom of the slate */}
            <div
              className={timeLeft <= 10 && timeLeft > 0 && isPlaying ? 'timer-pulse' : ''}
              style={{
                width: '96px',
                height: '96px',
                borderRadius: '50%',
                backgroundColor: SLOT_FILLED,
                color: 'white',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                fontFamily: "'Orbitron', sans-serif",
                fontWeight: 700,
                fontSize: '24px',
                letterSpacing: '0.5px',
                boxShadow: '0 6px 16px rgba(0,0,0,0.4)',
              }}
            >
              {formatTime(timeLeft)}
            </div>
          </div>
        </div>

        {/* Progress + exit, below the slate */}
        <div
          style={{
            marginBottom: '20px',
            color: 'white',
            fontWeight: 700,
            fontSize: '14px',
            textShadow: '0 2px 6px rgba(0,0,0,0.7)',
            display: 'flex',
            gap: '18px',
          }}
        >
          <span>SOLVED {solvedCount}</span>
          <span
            onClick={onExit}
            role="button"
            title="Back to games"
            style={{ cursor: 'pointer', textDecoration: 'underline' }}
          >
            EXIT
          </span>
        </div>
      </div>

      {/* Floating tile that follows the pointer during a drag.
          It lives OUTSIDE the scaled canvas, so it must be scaled by the same
          factor as the slots - otherwise it renders at full size while the
          slots render smaller, making the dragged tile look oversized. */}
      {dragTile && (
        <div
          style={{
            position: 'fixed',
            left: dragPos.x - (SLOT_SIZE * scale) / 2,
            top: dragPos.y - (SLOT_SIZE * scale) / 2,
            width: `${SLOT_SIZE}px`,
            height: `${SLOT_SIZE}px`,
            transform: `scale(${scale})`,
            transformOrigin: 'center center',
            // border-box keeps the 2px borders inside the box, matching the slot.
            boxSizing: 'border-box',
            borderRadius: '10px',
            backgroundColor: TILE_FACE,
            border: `2px solid ${TILE_EDGE}`,
            color: TILE_TEXT,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            fontWeight: 800,
            fontSize: '24px',
            fontFamily: "'Outfit', sans-serif",
            boxShadow: `0 3px 0 ${TILE_EDGE}, 0 5px 10px rgba(0,0,0,0.3)`,
            pointerEvents: 'none',
            zIndex: 10000,
          }}
        >
          {dragTile.char}
        </div>
      )}

      {/* Result Overlay */}
      {isGameEnded && (
        <div
          className="animate-slide-up"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100dvh',
            backgroundColor: ACCENT_RED,
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
            TIME UP!
          </h1>
          <h2 style={{ fontSize: '24px', fontWeight: 400, margin: '10px 0 6px' }}>
            Final Score: {score}
          </h2>
          <h3 style={{ fontSize: '18px', fontWeight: 400, marginBottom: '40px' }}>
            Attractions solved: {solvedCount}
          </h3>

          <button
            onClick={() => onGameEnd(score, solvedCount, GAME_DURATION - timeLeft)}
            style={{
              backgroundColor: 'white',
              color: WIN_COLOR,
              border: 'none',
              padding: '15px 40px',
              borderRadius: '30px',
              fontSize: '18px',
              fontWeight: 800,
              cursor: 'pointer',
              boxShadow: '0 8px 20px rgba(0,0,0,0.3)',
            }}
          >
            VIEW LEADERBOARD
          </button>
        </div>
      )}
    </div>
  );
};
