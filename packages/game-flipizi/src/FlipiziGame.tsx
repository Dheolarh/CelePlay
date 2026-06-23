import React, { useEffect, useState, useRef } from 'react';
import { useFlipiziStore } from './store';

interface FlipiziGameProps {
  themePrimaryColor: string;
  themeSecondaryColor: string;
  themeBannerUrl: string;
  onGameEnd: (score: number, maxScore: number, timeTaken: number) => void;
  onExit: () => void;
}

export const FlipiziGame: React.FC<FlipiziGameProps> = ({
  themePrimaryColor,
  themeSecondaryColor,
  themeBannerUrl,
  onGameEnd
}) => {
  const {
    gameState, timeLeft, score, chancesLeft, slots,
    currentHeadLetter, currentTailLetter, flipResult, isWon,
    startGame, tickTimer, startFlip, resolveFlip
  } = useFlipiziStore();

  const [scale, setScale] = useState(1);
  const [statusText, setStatusText] = useState("Mission: Flip ALIKO");
  const [isAnimating, setIsAnimating] = useState(false);
  
  const coinRef = useRef<HTMLDivElement>(null);

  // Audio refs
  const flipAudioRef = useRef<HTMLAudioElement | null>(null);
  const winAudioRef = useRef<HTMLAudioElement | null>(null);
  const loseAudioRef = useRef<HTMLAudioElement | null>(null);
  const correctAudioRef = useRef<HTMLAudioElement | null>(null);
  const wrongAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    startGame();
    setStatusText("Mission: Flip ALIKO");
    flipAudioRef.current = new Audio('/assets/sounds/coin flip.mp3');
    winAudioRef.current = new Audio('/assets/sounds/win.mp3');
    loseAudioRef.current = new Audio('/assets/sounds/lose.mp3');
    correctAudioRef.current = new Audio('/assets/sounds/correct.mp3');
    wrongAudioRef.current = new Audio('/assets/sounds/wrong.mp3');
  }, [startGame]);

  useEffect(() => {
    const handleResize = () => {
      const baseWidth = 400;
      const baseHeight = 850;
      const scaleX = window.innerWidth / baseWidth;
      const scaleY = window.innerHeight / baseHeight;
      setScale(Math.min(scaleX, scaleY));
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (gameState === 'playing' || gameState === 'flipping') {
      timer = setInterval(() => tickTimer(), 1000);
    }
    return () => clearInterval(timer);
  }, [gameState, tickTimer]);

  const hasPlayedAudioRef = useRef(gameState === 'ended');

  useEffect(() => {
    if (gameState === 'ended') {
      if (!hasPlayedAudioRef.current) {
        if (isWon) {
          winAudioRef.current?.play().catch(() => {});
          setStatusText("You Won!");
        } else {
          loseAudioRef.current?.play().catch(() => {});
          setStatusText("Game Over!");
        }
        hasPlayedAudioRef.current = true;
      }
    } else {
      hasPlayedAudioRef.current = false;
    }
  }, [gameState, isWon]);

  // Swipe logic
  const [touchStart, setTouchStart] = useState<number | null>(null);
  
  const handleTouchStart = (e: React.TouchEvent | React.MouseEvent) => {
    if (gameState !== 'playing' || isAnimating) return;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    setTouchStart(clientY);
  };

  const handleTouchEnd = (e: React.TouchEvent | React.MouseEvent) => {
    if (gameState !== 'playing' || isAnimating || touchStart === null) return;
    const clientY = 'changedTouches' in e ? e.changedTouches[0].clientY : e.clientY;
    
    // Swipe UP
    if (touchStart - clientY > 50) {
      triggerFlip();
    }
    setTouchStart(null);
  };

  const triggerFlip = () => {
    if (gameState !== 'playing' || isAnimating) return;
    setIsAnimating(true);
    startFlip();
    flipAudioRef.current?.play().catch(() => {});
    setStatusText("Flipping...");
  };

  useEffect(() => {
    if (gameState === 'flipping' && flipResult && coinRef.current) {
      // Determine rotation. 
      // Front is Head, Back is Tail (rotated 180deg).
      // We'll spin it 5 full times (1800deg) + extra if tail.
      const baseSpins = 1800; // 5 full rotations ending on Front
      const targetRotation = flipResult === 'head' ? baseSpins : baseSpins + 180;

      // Animate
      coinRef.current.style.transition = 'transform 1.5s cubic-bezier(0.25, 1, 0.5, 1)';
      coinRef.current.style.transform = `rotateX(${targetRotation}deg) scale(1.5)`;
      
      // Scale back down
      setTimeout(() => {
        if (coinRef.current) {
          coinRef.current.style.transition = 'transform 0.5s ease-in';
          coinRef.current.style.transform = `rotateX(${targetRotation}deg) scale(1)`;
        }
      }, 1500);

      // Resolve flip after animation completes
      setTimeout(() => {
        setIsAnimating(false);
        const oldSlots = [...slots];
        resolveFlip();
        
        // Let's deduce what happened based on the old slots vs new state 
        // by subscribing to the store, but here we can just use the fact that 
        // resolveFlip updates the Zustand store synchronously.
        setTimeout(() => {
          const state = useFlipiziStore.getState();
          const landedLetter = flipResult === 'head' ? currentHeadLetter : currentTailLetter;
          const letterTargetIndex = ['a', 'l', 'i', 'k', 'o'].indexOf(landedLetter);
          
          if (oldSlots[letterTargetIndex] === null) {
            setStatusText("You had a successful flip!");
            correctAudioRef.current?.play().catch(() => {});
          } else {
            setStatusText("Oops, letter already collected!");
            wrongAudioRef.current?.play().catch(() => {});
          }

          // Reset coin rotation safely for the next flip (without animation)
          if (coinRef.current && state.gameState === 'playing') {
             coinRef.current.style.transition = 'none';
             coinRef.current.style.transform = `rotateX(0deg) scale(1)`;
          }
        }, 50);

      }, 2000);
    }
  }, [gameState, flipResult]);

  return (
    <div style={{ 
      width: '100vw',
      height: '100dvh',
      backgroundColor: themePrimaryColor, // Dark blue background
      display: 'flex', 
      justifyContent: 'center',
      alignItems: 'center',
      overflow: 'hidden',
      touchAction: 'none',
      fontFamily: "'Outfit', sans-serif"
    }}>
      {/* Animation Wrapper */}
      <div className="animate-slide-up" style={{ width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        {/* Scaled Virtual Container */}
        <div style={{
          width: '400px',
          height: '850px',
          transform: `scale(${scale})`,
          transformOrigin: 'center center',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          paddingTop: '60px',
        }}>
        
        {/* Header Area */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '85%', marginBottom: '30px' }}>
          {/* Head Indicator */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <img src={`/assets/dynamic/flipizi/${currentHeadLetter}.webp`} alt="Head" style={{ width: '80px', height: '80px', objectFit: 'contain' }} />
            <span style={{ color: 'white', fontSize: '14px', fontWeight: 700, marginTop: '5px' }}>Head</span>
          </div>

          {/* Score & Timer */}
          <div style={{ display: 'flex', gap: '20px' }}>
            <div style={{ backgroundColor: 'white', color: themePrimaryColor, padding: '5px 20px', borderRadius: '4px', fontSize: '24px', fontWeight: 900, boxShadow: '0 4px 10px rgba(0,0,0,0.2)' }}>
              {score}
            </div>
            <div style={{ backgroundColor: themeSecondaryColor, color: 'white', padding: '5px 20px', borderRadius: '4px', fontSize: '24px', fontWeight: 900, boxShadow: '0 4px 10px rgba(0,0,0,0.2)' }}>
              {timeLeft.toString().padStart(2, '0')}
            </div>
          </div>

          {/* Tail Indicator */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <img src={`/assets/dynamic/flipizi/${currentTailLetter}.webp`} alt="Tail" style={{ width: '80px', height: '80px', objectFit: 'contain' }} />
            <span style={{ color: 'white', fontSize: '14px', fontWeight: 700, marginTop: '5px' }}>Tail</span>
          </div>
        </div>

        {/* ALIKO Slots */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
          {slots.map((letter, i) => (
            <div key={i} style={{ 
              width: '50px', 
              height: '50px', 
              backgroundColor: 'white', 
              borderRadius: '8px',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              boxShadow: '0 4px 10px rgba(0,0,0,0.2)',
              overflow: 'hidden'
            }}>
              {letter && <img src={`/assets/dynamic/flipizi/${letter}.webp`} alt={letter} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
            </div>
          ))}
        </div>

        {/* Chances Area */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '20px' }}>
          <div style={{ display: 'flex', gap: '5px' }}>
            {[...Array(7)].map((_, i) => (
              <img 
                key={i} 
                src="/assets/dynamic/flipizi/chances.webp" 
                alt="Chance" 
                style={{ 
                  width: '30px', 
                  opacity: i < chancesLeft ? 1 : 0.2,
                  filter: i < chancesLeft ? 'none' : 'grayscale(100%)'
                }} 
              />
            ))}
          </div>
          <span style={{ color: 'white', fontSize: '14px', fontWeight: 700, marginTop: '5px' }}>Chances</span>
        </div>

        {/* Status Text */}
        <div style={{ color: 'white', fontSize: '16px', fontWeight: 400, marginBottom: '60px', height: '20px' }}>
          {statusText}
        </div>

        {/* Big Coin Area */}
        <div style={{ 
          position: 'relative', 
          width: '100%', 
          display: 'flex', 
          justifyContent: 'center',
          alignItems: 'center',
          flex: 1,
          transform: 'translateY(-30px)'
        }}>
          
          {/* Flip Arrow */}
          <div style={{ position: 'absolute', left: '60px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
            <span style={{ color: 'white', fontSize: '18px', fontWeight: 800 }}>Flip</span>
            <div style={{ width: '2px', height: '100px', borderLeft: '2px dashed white', position: 'relative' }}>
              <div style={{ position: 'absolute', top: '-10px', left: '-6px', width: '0', height: '0', borderLeft: '5px solid transparent', borderRight: '5px solid transparent', borderBottom: '10px solid white' }}></div>
            </div>
          </div>

          {/* 3D Coin Container */}
          <div 
            style={{ perspective: '1000px', cursor: gameState === 'playing' ? 'pointer' : 'default' }}
            onMouseDown={handleTouchStart}
            onMouseUp={handleTouchEnd}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            <div 
              ref={coinRef}
              style={{
                width: '220px',
                height: '220px',
                position: 'relative',
                transformStyle: 'preserve-3d',
                borderRadius: '50%'
              }}
            >
              <img src={`/assets/dynamic/flipizi/${currentHeadLetter}.webp`} alt="Head Face" style={{
                position: 'absolute',
                width: '100%',
                height: '100%',
                backfaceVisibility: 'hidden',
                borderRadius: '50%',
                objectFit: 'contain',
                filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.6))'
              }} />

              <img src={`/assets/dynamic/flipizi/${currentTailLetter}.webp`} alt="Tail Face" style={{
                position: 'absolute',
                width: '100%',
                height: '100%',
                backfaceVisibility: 'hidden',
                borderRadius: '50%',
                transform: 'rotateX(180deg)',
                objectFit: 'contain',
                filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.6))'
              }} />
            </div>
          </div>

        </div>

        {/* Bottom Banner */}
        <div style={{ width: '90%', marginTop: 'auto', marginBottom: '20px', zIndex: 10 }}>
          <img src={themeBannerUrl} alt="Banner" style={{ width: '100%', borderRadius: '10px', boxShadow: '0 5px 15px rgba(0,0,0,0.3)' }} />
        </div>
        
        {/* Flipizi Logo */}
        <div style={{ marginBottom: '30px' }}>
          <img src="/assets/dynamic/flipizi/flipiziwhite logo.webp" alt="Flipizi" style={{ height: '30px', objectFit: 'contain' }} />
        </div>

      </div>
      </div>

      {/* Game Ended Overlay */}
      {gameState === 'ended' && (
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
            {isWon ? 'YOU WON!' : 'GAME OVER!'}
          </h1>
          <h2 style={{ fontSize: '24px', fontWeight: 400, marginBottom: '20px', fontFamily: "'Outfit', sans-serif" }}>
            Final Score: {score}
          </h2>
          
          <button 
            onClick={() => onGameEnd(score, 100, 60 - timeLeft)}
            style={{
              backgroundColor: 'white',
              color: isWon ? themePrimaryColor : themeSecondaryColor,
              border: 'none',
              padding: '15px 40px',
              borderRadius: '30px',
              fontSize: '18px',
              fontWeight: 800,
              cursor: 'pointer',
              marginTop: '40px',
              boxShadow: '0 8px 20px rgba(0,0,0,0.3)',
              fontFamily: "'Outfit', sans-serif"
            }}
          >
            VIEW LEADERBOARD
          </button>
        </div>
      )}

    </div>
  );
};
