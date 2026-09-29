import React from 'react';

export interface QuitButtonProps {
  /** Quits the game without recording a score. */
  onQuit: () => void;
  /** Seconds left on the clock. */
  timeLeft: number;
  /** Total seconds in the round, used to work out the 10% lock point. */
  duration: number;
  /** Colour used for the icon so it matches the surrounding chrome. */
  color?: string;
  /**
   * True while instructions or a results overlay is up. The button is hidden
   * rather than merely disabled, because neither state is a live round.
   */
  hidden?: boolean;
}

/**
 * Small quit icon shown in the corner of a game.
 *
 * Quitting abandons the round: no score is submitted and the game is not marked
 * as played, so the player can come back to it. To stop that being used to dodge
 * a bad result, the button locks once the clock reaches the last 10% of the
 * round, at which point the score is treated as final.
 */
export const QuitButton: React.FC<QuitButtonProps> = ({
  onQuit,
  timeLeft,
  duration,
  color = '#111',
  hidden = false,
}) => {
  if (hidden) return null;

  // Ceil so the lock begins exactly when the remaining time is at or under 10%.
  // e.g. a 120s round locks at 12s left, a 60s round at 6s left.
  const lockThreshold = Math.ceil(duration * 0.1);
  const isLocked = timeLeft <= lockThreshold;

  return (
    <button
      type="button"
      onClick={() => {
        if (!isLocked) onQuit();
      }}
      disabled={isLocked}
      aria-label={isLocked ? 'Cannot quit this late in the game' : 'Quit game'}
      title={isLocked ? 'You cannot quit this late in the game' : 'Quit game'}
      style={{
        width: '40px',
        height: '40px',
        borderRadius: '50%',
        border: `2.5px solid ${isLocked ? '#9ca3af' : color}`,
        backgroundColor: isLocked ? '#e5e7eb' : 'white',
        color: isLocked ? '#9ca3af' : color,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 0,
        cursor: isLocked ? 'not-allowed' : 'pointer',
        opacity: isLocked ? 0.6 : 1,
        boxShadow: isLocked ? 'none' : '0 4px 12px rgba(0,0,0,0.25)',
        transition: 'all 0.25s ease',
        flexShrink: 0,
      }}
    >
      {/* Corner-style exit icon: an arrow leaving a doorway. */}
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M14 4h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4" />
        <path d="M10 17l-5-5 5-5" />
        <path d="M5 12h10" />
      </svg>
    </button>
  );
};

export default QuitButton;
