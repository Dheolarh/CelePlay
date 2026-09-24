import React from 'react';

interface CallToActionOverlayProps {
  imageUrl: string;
  /**
   * 'auto' - the flier that appears on its own shortly after the board loads.
   * 'exit' - shown when EXIT is pressed, before actually leaving.
   *
   * Both modes show the same two choices; the name records why the flier is up.
   */
  mode: 'auto' | 'exit';
  /** Dismiss the flier and stay on the leaderboard. */
  onViewLeaderboard: () => void;
  /** Leave the leaderboard for the game selection screen. */
  onQuit: () => void;
}

/**
 * Promotional flier shown over the leaderboard after a game.
 *
 * Rendered as a full-viewport overlay rather than inside the leaderboard's
 * scaled container, so it covers the whole screen at any size and is not shrunk
 * along with the virtual canvas.
 *
 * Both buttons are always shown. Dismissing the flier lands the player back on
 * the leaderboard, which is what "view leaderboard" describes: they arrived
 * here from a finish screen, so the board has not been read yet.
 */
export const CallToActionOverlay: React.FC<CallToActionOverlayProps> = ({
  imageUrl,
  onViewLeaderboard,
  onQuit,
}) => {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.9)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        boxSizing: 'border-box',
        // Above the leaderboard, which sits in its own stacking context.
        zIndex: 2000,
      }}
      // Swallow taps so the leaderboard beneath cannot be interacted with while
      // the flier is open.
      onClick={(e) => e.stopPropagation()}
      role="dialog"
      aria-modal="true"
      aria-label="Thanks for playing"
    >
      <div
        style={{
          width: '100%',
          maxWidth: '340px',
          // The flier is tall, so cap the height and let it scroll on short
          // screens instead of overflowing past the viewport.
          maxHeight: '76dvh',
          overflowY: 'auto',
          borderRadius: '16px',
          backgroundColor: 'white',
          boxShadow: '0 20px 50px rgba(0,0,0,0.6)',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        <img
          src={imageUrl}
          alt="Thanks for playing — follow us on Instagram"
          style={{ display: 'block', width: '100%', height: 'auto' }}
        />
      </div>

      <div
        style={{
          marginTop: '16px',
          width: '100%',
          maxWidth: '340px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
        }}
      >
        {/* Primary: dismiss the flier and look at the board. */}
        <button
          onClick={onViewLeaderboard}
          style={{
            padding: '14px 0',
            borderRadius: '30px',
            border: 'none',
            backgroundColor: '#E53935',
            color: 'white',
            fontWeight: 900,
            fontSize: '18px',
            letterSpacing: '0.5px',
            cursor: 'pointer',
            boxShadow: '0 8px 22px rgba(0,0,0,0.35)',
          }}
        >
          VIEW LEADERBOARD
        </button>

        {/* Secondary: leave for the game selection screen. */}
        <button
          onClick={onQuit}
          style={{
            padding: '14px 0',
            borderRadius: '30px',
            border: '2px solid white',
            backgroundColor: 'transparent',
            color: 'white',
            fontWeight: 900,
            fontSize: '16px',
            letterSpacing: '0.5px',
            cursor: 'pointer',
          }}
        >
          QUIT
        </button>
      </div>
    </div>
  );
};
