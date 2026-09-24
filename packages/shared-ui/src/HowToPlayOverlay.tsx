import React from 'react';

interface HowToPlayOverlayProps {
  /** Instruction card image for this game. */
  imageUrl: string;
  /** Game name, used for the accessible label. */
  gameName: string;
  /** Called when the player dismisses the card, which starts the game. */
  onClose: () => void;
  /** Accent colour for the button. Defaults to the app red. */
  accentColor?: string;
}

/**
 * How-to-play overlay shown INSIDE a game, before its timer starts.
 *
 * It covers the viewport and swallows interaction, so the game cannot be played
 * and its clock cannot run until the player dismisses the instructions. Each
 * game owns the "dismissed yet" state and calls its store's startGame() on close,
 * which is what actually begins the countdown.
 */
export const HowToPlayOverlay: React.FC<HowToPlayOverlayProps> = ({
  imageUrl,
  gameName,
  onClose,
  accentColor = '#E53935',
}) => {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        // Above each game's own end-of-game overlay (z-index 9999) so the
        // instructions can never be hidden behind a result panel.
        zIndex: 10000,
        backgroundColor: 'rgba(0,0,0,0.85)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        boxSizing: 'border-box',
      }}
      // Swallow clicks so nothing underneath reacts while the card is open.
      onClick={(e) => e.stopPropagation()}
      role="dialog"
      aria-modal="true"
      aria-label={`How to play ${gameName}`}
    >
      <div
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: '320px',
          maxHeight: '80dvh',
          overflowY: 'auto',
          borderRadius: '16px',
          backgroundColor: 'white',
          boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        <img
          src={imageUrl}
          alt={`How to play ${gameName}`}
          style={{ display: 'block', width: '100%', height: 'auto' }}
        />
      </div>

      {/* The only way to begin. Closing the card is what starts the clock, so
          there is deliberately no separate start button and no tap-to-dismiss
          on the backdrop. */}
      <button
        onClick={onClose}
        style={{
          marginTop: '16px',
          padding: '14px 0',
          width: '100%',
          maxWidth: '320px',
          borderRadius: '30px',
          border: 'none',
          backgroundColor: accentColor,
          color: 'white',
          fontWeight: 900,
          fontSize: '18px',
          letterSpacing: '0.5px',
          cursor: 'pointer',
          boxShadow: '0 8px 22px rgba(0,0,0,0.35)',
        }}
      >
        CLOSE &amp; PLAY
      </button>
    </div>
  );
};
