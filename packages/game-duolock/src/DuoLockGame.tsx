import React, { useEffect, useMemo } from 'react';
import { useDuoLockStore } from './store';

// Props passed from the main Game Client wrapper
export interface DuoLockGameProps {
  themeLogoUrl: string;
  themeBannerUrl: string;
  themePrimaryColor: string;
  themeSecondaryColor: string;
  onGameEnd: (score: number, timeTaken: number) => void;
  onExit: () => void;
  cardPairs: { id: string; imageT: string; imageI: string }[];
}

export const DuoLockGame: React.FC<DuoLockGameProps> = ({
  themeLogoUrl,
  themeBannerUrl,
  themePrimaryColor,
  themeSecondaryColor,
  onGameEnd,
  onExit,
  cardPairs
}) => {
  const { cards, score, timeLeft, isPlaying, initializeGame, flipCard, tickTimer } = useDuoLockStore();

  // Initialize game on mount
  useEffect(() => {
    initializeGame(cardPairs);
  }, [cardPairs, initializeGame]);

  // Timer logic
  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (isPlaying && timeLeft > 0) {
      timer = setInterval(() => tickTimer(), 1000);
    } else if (!isPlaying && timeLeft > 0 && cards.length > 0 && cards.every(c => c.isMatched)) {
      // Game won
      onGameEnd(score, 60 - timeLeft);
    } else if (!isPlaying && timeLeft === 0) {
      // Game over
      onGameEnd(score, 60);
    }
    return () => clearInterval(timer);
  }, [isPlaying, timeLeft, tickTimer, onGameEnd, score, cards]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div style={{ height: '100dvh', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      
      {/* Header Area */}
      <div style={{ width: '100%', padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <img src={themeLogoUrl} alt="Logo" style={{ height: '40px' }} />
          <img src={themeBannerUrl} alt="Banner" style={{ height: '50px' }} />
        </div>
      </div>

      {/* Timer and Score */}
      <div style={{ width: '100%', padding: '0.5rem 2rem', display: 'flex', justifyContent: 'space-between' }}>
        <div style={{ backgroundColor: 'white', color: themePrimaryColor, padding: '0.5rem 1rem', borderRadius: '10px', fontWeight: 'bold' }}>
          {formatTime(timeLeft)}
        </div>
        <div style={{ backgroundColor: themeSecondaryColor, color: 'white', padding: '0.5rem 1rem', borderRadius: '10px', fontWeight: 'bold' }}>
          SCORE {score}
        </div>
      </div>

      {/* Game Grid */}
      <div style={{
        flex: 1,
        width: '100%',
        maxWidth: '500px',
        padding: '1rem',
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '0.5rem',
        alignContent: 'center'
      }}>
        {cards.map((card, index) => (
          <div 
            key={card.id}
            onClick={() => flipCard(index)}
            style={{
              aspectRatio: '1',
              backgroundColor: card.isFlipped || card.isMatched ? 'transparent' : themePrimaryColor,
              borderRadius: '8px',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              cursor: 'pointer',
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
              overflow: 'hidden',
              backgroundImage: !card.isFlipped && !card.isMatched ? `url(${themeLogoUrl})` : 'none',
              backgroundSize: '50%',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat'
            }}
          >
            {(card.isFlipped || card.isMatched) && (
              <img src={card.imageUrl} alt="Card" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            )}
          </div>
        ))}
      </div>

      {/* Exit Button */}
      <button 
        onClick={onExit}
        style={{
          margin: '1rem',
          padding: '0.8rem 2rem',
          backgroundColor: themeSecondaryColor,
          color: 'white',
          border: 'none',
          borderRadius: '20px',
          fontWeight: 'bold'
        }}
      >
        EXIT
      </button>

    </div>
  );
};
