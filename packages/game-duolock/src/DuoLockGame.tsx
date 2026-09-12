import React, { useEffect, useState } from 'react';
import { useDuoLockStore } from './store';

export interface DuoLockGameProps {
  themeLogoUrl: string;
  themeBannerUrl: string;
  themePrimaryColor: string;
  themeSecondaryColor: string;
  onGameEnd: (score: number, timeTaken: number) => void;
  onExit: () => void;
  cardPairs: { id: string; imageA: string; imageB: string }[];
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
  const { cards, score, timeLeft, previewTimeLeft, isPlaying, isPreviewing, isGameEnded, isWon, initializeGame, flipCard, tickTimer, resetGame } = useDuoLockStore();

  const [scale, setScale] = useState(1);
  useEffect(() => {
    const handleResize = () => {
      const baseWidth = 400;
      const baseHeight = 850;
      const scaleX = window.innerWidth / baseWidth;
      const scaleY = window.innerHeight / baseHeight;
      const newScale = Math.min(scaleX, scaleY);
      setScale(newScale); 
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    initializeGame(cardPairs);
    return () => resetGame(); // Clean up state when unmounting
  }, [cardPairs, initializeGame, resetGame]);

  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (isPlaying || isPreviewing) {
      timer = setInterval(() => tickTimer(), 1000);
    }
    return () => clearInterval(timer);
  }, [isPlaying, isPreviewing, tickTimer]);

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

  return (
    <div style={{ 
      width: '100vw',
      height: '100dvh',
      backgroundColor: '#111',
      display: 'flex', 
      justifyContent: 'center',
      alignItems: 'center',
      overflow: 'hidden',
      touchAction: 'none',
      fontFamily: "'Outfit', sans-serif",
      position: 'relative'
    }}>
      {/* Grayscale Background Layer */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundImage: `url('/assets/dynamic/gameBackground.webp')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        filter: 'grayscale(100%)',
        zIndex: 0
      }} />

      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@700&display=swap');
          
          @keyframes flashTimerText {
            0%, 100% { color: white !important; background-color: ${themeSecondaryColor} !important; border-color: ${themeSecondaryColor} !important; }
            50% { color: ${themePrimaryColor} !important; background-color: white !important; border-color: ${themePrimaryColor} !important; }
          }
          .timer-flash {
            animation: flashTimerText 1s infinite;
          }
        `}
      </style>
      
      <div style={{
        width: '400px',
        height: '850px',
        transform: `scale(${scale})`,
        transformOrigin: 'center center',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        zIndex: 1
      }}>
        
        {/* Top Banner section */}
        <div style={{ width: '90%', marginTop: '60px', position: 'relative' }}>
          <img 
            src={themeBannerUrl} 
            alt="Banner" 
            style={{ width: '100%', borderRadius: '10px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)', display: 'block' }} 
          />
          
          {/* Overlay Timer and Score */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            width: '100%',
            position: 'absolute',
            bottom: '-15px',
            padding: '0 15px',
            boxSizing: 'border-box',
            zIndex: 10
          }}>
            <div className={timeLeft <= 10 && timeLeft > 0 && !isPreviewing ? "timer-flash" : ""} style={{ 
              backgroundColor: 'white', 
              color: isPreviewing ? themeSecondaryColor : themePrimaryColor, 
              border: `2.5px solid ${isPreviewing ? themeSecondaryColor : themePrimaryColor}`,
              padding: '2px 12px', 
              borderRadius: '8px', 
              fontWeight: 800,
              fontSize: isPreviewing ? '14px' : '18px',
              fontFamily: "'Orbitron', sans-serif",
              boxShadow: '0 4px 10px rgba(0,0,0,0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              letterSpacing: '1px',
              transition: 'all 0.3s ease',
              whiteSpace: 'nowrap'
            }}>
              {isPreviewing ? `PREVIEW ${previewTimeLeft.toString().padStart(2, '0')}s` : formatTime(timeLeft)}
            </div>
            
            <div style={{ 
              backgroundColor: themeSecondaryColor, 
              color: 'white', 
              padding: '4px 16px', 
              borderRadius: '8px', 
              fontWeight: 900,
              fontSize: '16px',
              boxShadow: '0 4px 10px rgba(0,0,0,0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              letterSpacing: '1px'
            }}>
              SCORE {score}
            </div>
          </div>
        </div>

        {/* Game Grid */}
        <div style={{
          width: '90%',
          marginTop: '70px',
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '8px',
          perspective: '1000px'
        }}>
          {cards.map((card, index) => (
            <div 
              key={card.id}
              onClick={() => flipCard(index)}
              style={{
                aspectRatio: '1',
                borderRadius: '8px',
                cursor: 'pointer',
                boxShadow: '0 6px 12px rgba(0,0,0,0.4)',
                position: 'relative',
                transformStyle: 'preserve-3d',
                transition: 'transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                transform: card.isFlipped || card.isMatched ? 'rotateY(180deg)' : 'rotateY(0deg)'
              }}
            >
              {/* Back of card (unflipped) */}
              <div style={{
                position: 'absolute',
                width: '100%',
                height: '100%',
                backfaceVisibility: 'hidden',
                backgroundColor: themePrimaryColor,
                borderRadius: '8px',
                backgroundImage: `url(${themeLogoUrl})`,
                backgroundSize: '60%',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat'
              }} />

              {/* Front of card (flipped) */}
              <div style={{
                position: 'absolute',
                width: '100%',
                height: '100%',
                backfaceVisibility: 'hidden',
                transform: 'rotateY(180deg)',
                backgroundColor: 'white',
                borderRadius: '8px',
                overflow: 'hidden'
              }}>
                <img src={card.imageUrl} alt="Card" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            </div>
          ))}
        </div>



        {/* Bottom Logo */}
        <div 
          style={{ position: 'absolute', bottom: '40px', cursor: 'pointer', transition: 'transform 0.2s ease' }} 
          onClick={onExit}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          <img src="/assets/static/duolock.webp" alt="DuoLock" style={{ width: '140px', filter: 'drop-shadow(0 5px 15px rgba(0,0,0,0.5))' }} />
        </div>

      </div>

      {/* Game Win / Lose Screen Overlay (Full Screen) */}
      {isGameEnded && (
        <div className="animate-slide-up" style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100dvh',
          backgroundColor: isWon ? themePrimaryColor : themeSecondaryColor,
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          padding: '20px',
          textAlign: 'center'
        }}>
          <h1 style={{ fontSize: '48px', margin: 0, fontFamily: "'Orbitron', sans-serif" }}>
            {isWon ? 'YOU WON!' : 'TIME UP!'}
          </h1>
          <h2 style={{ fontSize: '24px', fontWeight: 400, marginBottom: '40px' }}>
            Final Score: {score}
          </h2>
          
          <button 
            onClick={() => onGameEnd(score, 60 - timeLeft)}
            style={{
              backgroundColor: 'white',
              color: isWon ? themePrimaryColor : themeSecondaryColor,
              border: 'none',
              padding: '15px 40px',
              borderRadius: '30px',
              fontSize: '18px',
              fontWeight: 800,
              cursor: 'pointer',
              boxShadow: '0 8px 20px rgba(0,0,0,0.3)',
              transition: 'transform 0.2s ease',
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            VIEW LEADERBOARD
          </button>
        </div>
      )}

    </div>
  );
};
