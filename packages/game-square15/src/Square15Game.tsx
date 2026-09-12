import React, { useEffect, useState, useRef } from 'react';
import { useSquare15Store } from './store';

export interface Square15GameProps {
  themeBannerUrl: string;
  themePrimaryColor: string;
  themeSecondaryColor: string;
  onGameEnd: (score: number, maxScore: number, timeTaken: number) => void;
  onExit: () => void;
}

export const Square15Game: React.FC<Square15GameProps> = ({
  themeBannerUrl,
  themePrimaryColor,
  themeSecondaryColor,
  onGameEnd
}) => {
  const {
    grid,
    gameState,
    isPeeking,
    timeLeft,
    score,
    isWon,
    initializeGame,
    movePiece,
    setPeeking,
    tickTimer,
    resetGame
  } = useSquare15Store();

  const [scale, setScale] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [dragInfo, setDragInfo] = useState<{
    index: number;
    startX: number;
    startY: number;
    currentX: number;
    currentY: number;
    direction: 'up' | 'down' | 'left' | 'right';
  } | null>(null);

  // Audio refs
  const beepAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    beepAudioRef.current = new Audio('/assets/sounds/beep.mp3');
    beepAudioRef.current.volume = 0.5;
  }, []);

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
    initializeGame();
    return () => resetGame();
  }, [initializeGame, resetGame]);

  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (gameState === 'playing') {
      timer = setInterval(() => tickTimer(), 1000);
    }
    return () => clearInterval(timer);
  }, [gameState, tickTimer]);

  useEffect(() => {
    if (timeLeft <= 10 && timeLeft > 0 && gameState === 'playing') {
      if (beepAudioRef.current) {
        beepAudioRef.current.currentTime = 0;
        beepAudioRef.current.play().catch(() => {});
      }
    }
  }, [timeLeft, gameState]);

  useEffect(() => {
    if (gameState === 'ended') {
      const audio = new Audio(isWon ? '/assets/sounds/win.mp3' : '/assets/sounds/lose.mp3');
      audio.play().catch(() => {});
    }
  }, [gameState, isWon]);

  useEffect(() => {
    const handleMove = (e: PointerEvent) => {
      if (!dragInfo) return;
      if (e.cancelable) e.preventDefault(); // Stop scrolling while dragging
      
      const clientX = e.clientX;
      const clientY = e.clientY;
      setDragInfo(prev => prev ? { ...prev, currentX: clientX, currentY: clientY } : null);
    };

    const handleUp = () => {
      if (!dragInfo) return;
      const dx = dragInfo.currentX - dragInfo.startX;
      const dy = dragInfo.currentY - dragInfo.startY;
      
      const threshold = 40 * scale; // Snap threshold
      let shouldMove = false;

      if (dragInfo.direction === 'right' && dx > threshold) shouldMove = true;
      if (dragInfo.direction === 'left' && dx < -threshold) shouldMove = true;
      if (dragInfo.direction === 'down' && dy > threshold) shouldMove = true;
      if (dragInfo.direction === 'up' && dy < -threshold) shouldMove = true;

      // Allow tap to move
      if (Math.abs(dx) < 5 && Math.abs(dy) < 5) {
        shouldMove = true; 
      }

      if (shouldMove) {
        handleTileClick(dragInfo.index);
      }
      
      setDragInfo(null);
    };

    if (dragInfo) {
      window.addEventListener('pointermove', handleMove, { passive: false });
      window.addEventListener('pointerup', handleUp);
      window.addEventListener('pointercancel', handleUp);
    }

    return () => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
      window.removeEventListener('pointercancel', handleUp);
    };
  }, [dragInfo, scale, gameState]);

  const handlePointerDown = (e: React.PointerEvent, index: number) => {
    if (gameState !== 'playing') return;
    // We optionally capture the pointer so it tracks even if finger slides off the element
    if (e.target instanceof HTMLElement) {
      e.target.setPointerCapture(e.pointerId);
    }

    const emptyIndex = grid.indexOf(15);
    
    // Check adjacency
    const row = Math.floor(index / 4);
    const col = index % 4;
    const emptyRow = Math.floor(emptyIndex / 4);
    const emptyCol = emptyIndex % 4;

    let direction: 'up' | 'down' | 'left' | 'right' | null = null;
    
    if (row === emptyRow && col === emptyCol - 1) direction = 'right';
    else if (row === emptyRow && col === emptyCol + 1) direction = 'left';
    else if (col === emptyCol && row === emptyRow - 1) direction = 'down';
    else if (col === emptyCol && row === emptyRow + 1) direction = 'up';

    if (!direction) return; // Can't move

    const clientX = e.clientX;
    const clientY = e.clientY;

    setDragInfo({
      index,
      startX: clientX,
      startY: clientY,
      currentX: clientX,
      currentY: clientY,
      direction
    });
  };

  const getDragTransform = (index: number, row: number, col: number) => {
    let dx = 0;
    let dy = 0;

    if (dragInfo && dragInfo.index === index) {
      dx = (dragInfo.currentX - dragInfo.startX) / scale;
      dy = (dragInfo.currentY - dragInfo.startY) / scale;

      const maxDist = (400 * 0.9) * 0.25; // size of one tile slot

      if (dragInfo.direction === 'right') {
        dx = Math.max(0, Math.min(dx, maxDist));
        dy = 0;
      } else if (dragInfo.direction === 'left') {
        dx = Math.max(-maxDist, Math.min(dx, 0));
        dy = 0;
      } else if (dragInfo.direction === 'down') {
        dy = Math.max(0, Math.min(dy, maxDist));
        dx = 0;
      } else if (dragInfo.direction === 'up') {
        dy = Math.max(-maxDist, Math.min(dy, 0));
        dx = 0;
      }
    }

    return `translate(calc(${col * 100}% + ${dx}px), calc(${row * 100}% + ${dy}px))`;
  };

  const handleTileClick = (index: number) => {
    if (gameState !== 'playing') return;
    
    // Play a subtle click sound
    const audio = new Audio('/assets/sounds/click.mp3');
    audio.volume = 0.5;
    audio.play().catch(() => {});
    
    movePiece(index);
  };

  // We want to format timer as just the number of seconds padded if < 100, wait screenshot shows 180 and 025.
  // It's a 3-digit padded string.
  const formatTimerNumber = (seconds: number) => {
    return seconds.toString().padStart(3, '0');
  };

  // We map the numbers 0 to 14. We don't render 15 (empty slot).
  const pieces = Array.from({ length: 15 }, (_, i) => i);

  return (
    <div style={{ 
      width: '100vw',
      height: '100dvh',
      backgroundColor: '#f3f4f6', 
      backgroundImage: 'url(/assets/static/S15BG.webp)',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      display: 'flex', 
      justifyContent: 'center',
      alignItems: 'center',
      overflow: 'hidden',
      touchAction: 'none',
      fontFamily: "'Orbitron', sans-serif", // Score & timer use orbitron
      position: 'relative',
      userSelect: 'none'
    }}>
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@700;900&display=swap');
          @keyframes pulseRedText {
            0%, 100% { color: white; }
            50% { color: ${themeSecondaryColor}; }
          }
          .timer-danger {
            animation: pulseRedText 1s infinite;
          }
        `}
      </style>

      <div ref={containerRef} style={{
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
        
        {/* Top Header Row */}
        <div style={{ 
          width: '90%', 
          marginTop: '60px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '20px'
        }}>
          {/* Left Timer Box */}
          <div style={{
            backgroundColor: themePrimaryColor,
            width: '60px',
            height: '60px',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            color: 'white',
            fontWeight: 900,
            fontSize: '24px',
            borderRadius: '4px',
            boxShadow: '0 4px 10px rgba(0,0,0,0.2)'
          }} className={timeLeft <= 10 && timeLeft > 0 ? "timer-danger" : ""}>
            {formatTimerNumber(timeLeft)}
          </div>

          {/* Center Logo */}
          <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
            <img 
              src="/assets/static/square15.webp" 
              alt="Square 15" 
              style={{ width: '100px', objectFit: 'contain' }} 
            />
          </div>

          {/* Right Score Box */}
          <div style={{
            backgroundColor: themeSecondaryColor,
            width: '60px',
            height: '60px',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            color: 'white',
            fontWeight: 900,
            fontSize: '24px',
            borderRadius: '4px',
            boxShadow: '0 4px 10px rgba(0,0,0,0.2)'
          }}>
            {score}
          </div>
        </div>

        {/* Lightbulb Hint Button */}
        <div 
          style={{
            marginTop: '30px',
            marginBottom: '30px',
            cursor: 'pointer',
            padding: '10px'
          }}
          onClick={() => setPeeking(true)}
        >
          {/* SVG Lightbulb Icon mimicking the screenshot */}
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke={themePrimaryColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 18h6" />
            <path d="M10 22h4" />
            <path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1.75.72 3.1 1.5 4.5.76.76 1.23 1.52 1.41 2.5" />
            <path d="M12 2v2" />
            <path d="M4 8h2" />
            <path d="M18 8h2" />
            <path d="M6 3l1.5 1.5" />
            <path d="M18 3l-1.5 1.5" />
          </svg>
        </div>

        {/* Puzzle Board Area */}
        <div style={{
          width: '90%',
          aspectRatio: '1',
          backgroundColor: '#d1d5db', // Darker gray frame background
          border: '6px solid #6b7280', // Thick grey border
          borderRadius: '8px',
          position: 'relative',
          padding: '2px', // tiny gap around the edge
          boxSizing: 'border-box',
          boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
          overflow: 'hidden'
        }}>
          
          {/* Render puzzle pieces */}
          <div style={{ width: '100%', height: '100%', position: 'relative' }}>
            {pieces.map((id) => {
              const currentIndex = grid.indexOf(id);
              const row = Math.floor(currentIndex / 4);
              const col = currentIndex % 4;

              return (
                <div
                  key={id}
                  onPointerDown={(e) => handlePointerDown(e, currentIndex)}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '25%',
                    height: '25%',
                    padding: '2px', // Increased padding for clearer tile separation
                    boxSizing: 'border-box',
                    transition: dragInfo?.index === currentIndex ? 'none' : 'transform 0.2s ease-out',
                    transform: getDragTransform(currentIndex, row, col),
                    cursor: gameState === 'playing' ? (dragInfo?.index === currentIndex ? 'grabbing' : 'grab') : 'default',
                    zIndex: dragInfo?.index === currentIndex ? 5 : 1
                  }}
                >
                  <img 
                    src={`/assets/dynamic/sq${id}.webp`} 
                    alt={`Piece ${id}`} 
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                  />
                </div>
              );
            })}

            {/* Peeking Overlay */}
            <div style={{
              position: 'absolute',
              top: 0, left: 0,
              width: '100%', height: '100%',
              backgroundColor: 'white',
              opacity: isPeeking ? 1 : 0,
              pointerEvents: isPeeking ? 'auto' : 'none',
              transition: 'opacity 0.2s',
              zIndex: 10,
              display: 'flex',
              flexDirection: 'column'
            }}>
              <img src="/assets/dynamic/fullimage.webp" alt="Hint" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              
              {/* Close Button */}
              {isPeeking && (
                <button
                  onClick={() => setPeeking(false)}
                  style={{
                    position: 'absolute',
                    top: '10px',
                    right: '10px',
                    backgroundColor: themePrimaryColor,
                    color: 'white',
                    border: 'none',
                    width: '35px',
                    height: '35px',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    borderRadius: '6px',
                    fontSize: '20px',
                    fontWeight: 900,
                    cursor: 'pointer',
                    boxShadow: '0 4px 10px rgba(0,0,0,0.5)',
                    fontFamily: "'Orbitron', sans-serif"
                  }}
                >
                  X
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Banner */}
        <div style={{ width: '90%', marginTop: '50px' }}>
          <img src={themeBannerUrl} alt="Banner" style={{ width: '100%', borderRadius: '10px' }} />
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
            onClick={() => onGameEnd(score, 150, 180 - timeLeft)}
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
