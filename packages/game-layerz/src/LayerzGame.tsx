import React, { useEffect, useState, useRef } from 'react';
import { useLayerzStore } from './store';
import type { LayerPiece } from './store';

export interface LayerzGameProps {
  themeBannerUrl: string;
  themePrimaryColor: string;
  themeSecondaryColor: string;
  pieces: LayerPiece[];
  onGameEnd: (score: number, maxScore: number, timeTaken: number) => void;
  onExit: () => void;
}

export const LayerzGame: React.FC<LayerzGameProps> = ({
  themeBannerUrl,
  themePrimaryColor,
  themeSecondaryColor,
  pieces,
  onGameEnd
}) => {
  const {
    gameState,
    currentPiece,
    revealedSlot,
    placedPieces,
    lifelines,
    score,
    memorizeTimeLeft,
    gameTimeLeft,
    isWon,
    initializeGame,
    guessSlot,
    dropPiece,
    tickMemorizeTimer,
    tickGameTimer,
    resetGame
  } = useLayerzStore();

  const [scale, setScale] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Drag state
  const [isDragging, setIsDragging] = useState(false);
  const [dragPos, setDragPos] = useState({ x: 0, y: 0 });
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  
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
    initializeGame(pieces);
    return () => resetGame();
  }, [pieces, initializeGame, resetGame]);

  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (gameState === 'memorizing') {
      timer = setInterval(() => tickMemorizeTimer(), 1000);
    } else if (gameState === 'guessing' || gameState === 'dragging') {
      timer = setInterval(() => tickGameTimer(), 1000);
    }
    return () => clearInterval(timer);
  }, [gameState, tickMemorizeTimer, tickGameTimer]);

  useEffect(() => {
    if (gameTimeLeft <= 10 && gameTimeLeft > 0 && (gameState === 'guessing' || gameState === 'dragging')) {
      const audio = new Audio('/assets/sounds/beep.mp3');
      audio.volume = 0.5;
      audio.play().catch(() => {});
    }
  }, [gameTimeLeft, gameState]);

  useEffect(() => {
    if (gameState === 'ended') {
      const audio = new Audio(isWon ? '/assets/sounds/win.mp3' : '/assets/sounds/lose.mp3');
      audio.play().catch(() => {});
    }
  }, [gameState, isWon]);

  // Handle slot guessing
  const handleSlotClick = (slot: 'red' | 'blue') => {
    if (gameState !== 'guessing') return;
    guessSlot(slot);
  };

  // Drag and Drop Logic
  const handleDragStart = (e: React.MouseEvent | React.TouchEvent) => {
    if (gameState !== 'dragging') return;
    
    // Prevent default touch actions like scrolling
    if (e.type === 'touchstart') {
      const touchEvent = e as unknown as TouchEvent;
      if (touchEvent.cancelable) touchEvent.preventDefault();
    }
    
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
    
    // Calculate offset inside the piece so it drags from where you grabbed it
    const target = e.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    
    setDragOffset({
      x: clientX - rect.left,
      y: clientY - rect.top
    });
    
    setDragPos({ x: clientX, y: clientY });
    setIsDragging(true);
  };

  const handleDragMove = (e: MouseEvent | TouchEvent) => {
    if (!isDragging) return;
    if (e.cancelable) {
      e.preventDefault(); // Stop page from scrolling
    }
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as MouseEvent).clientY;
    setDragPos({ x: clientX, y: clientY });
  };

  const handleDragEnd = (e: MouseEvent | TouchEvent) => {
    if (!isDragging) return;
    setIsDragging(false);
    
    const clientX = 'changedTouches' in e ? e.changedTouches[0].clientX : (e as MouseEvent).clientX;
    const clientY = 'changedTouches' in e ? e.changedTouches[0].clientY : (e as MouseEvent).clientY;
    
    let droppedSlotId = -1;
    
    const stackContainer = document.getElementById('layerz-stack-container');
    if (stackContainer) {
      const rect = stackContainer.getBoundingClientRect();
      // Check if dropped inside the stack container
      if (
        clientX >= rect.left &&
        clientX <= rect.right &&
        clientY >= rect.top &&
        clientY <= rect.bottom
      ) {
        const relativeY = clientY - rect.top;
        const slotHeight = rect.height / 10;
        const rowIndex = Math.floor(relativeY / slotHeight);
        if (rowIndex >= 0 && rowIndex < 10) {
          droppedSlotId = rowIndex + 1; // 1 to 10
        }
      }
    }

    if (droppedSlotId !== -1) {
      dropPiece(droppedSlotId);
    }
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleDragMove, { passive: false });
      window.addEventListener('mouseup', handleDragEnd);
      window.addEventListener('touchmove', handleDragMove, { passive: false });
      window.addEventListener('touchend', handleDragEnd);
    } else {
      window.removeEventListener('mousemove', handleDragMove);
      window.removeEventListener('mouseup', handleDragEnd);
      window.removeEventListener('touchmove', handleDragMove);
      window.removeEventListener('touchend', handleDragEnd);
    }
    return () => {
      window.removeEventListener('mousemove', handleDragMove);
      window.removeEventListener('mouseup', handleDragEnd);
      window.removeEventListener('touchmove', handleDragMove);
      window.removeEventListener('touchend', handleDragEnd);
    };
  }, [isDragging]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // Stack is 10 layers. We render 1 to 10 top-to-bottom.
  const layers = Array.from({ length: 10 }, (_, i) => i + 1);

  return (
    <div style={{ 
      width: '100vw',
      height: '100dvh',
      backgroundColor: 'white',
      display: 'flex', 
      justifyContent: 'center',
      alignItems: 'center',
      overflow: 'hidden',
      touchAction: 'none',
      fontFamily: "'Outfit', sans-serif",
      position: 'relative',
      userSelect: 'none'
    }}>
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@700&display=swap');
          @keyframes flashTimerText {
            0%, 100% { color: white !important; background-color: ${themeSecondaryColor} !important; }
            50% { color: white !important; background-color: ${themeSecondaryColor} !important; }
          }
          .timer-flash {
            animation: flashTimerText 1s infinite;
          }
          
          .stack-slot {
            height: calc(100% / 10);
            width: 100%;
            border-bottom: 1px solid #ccc;
            box-sizing: border-box;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .stack-slot:last-child {
            border-bottom: none;
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
          marginTop: '40px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          {/* Score Box */}
          <div style={{
            backgroundColor: themePrimaryColor,
            color: 'white',
            fontWeight: 900,
            fontSize: '20px',
            padding: '8px 15px',
            borderRadius: '8px'
          }}>
            {score}
          </div>

          {/* Lifelines */}
          <div style={{ display: 'flex', gap: '4px' }}>
            {Array.from({ length: 6 }).map((_, i) => (
              <img 
                key={`life-${i}`} 
                src="/assets/dynamic/lifeline.webp" 
                alt="Lifeline" 
                style={{ 
                  width: '24px', 
                  height: '24px', 
                  objectFit: 'contain',
                  opacity: i < lifelines ? 1 : 0.2,
                  transition: 'opacity 0.3s'
                }} 
              />
            ))}
          </div>

          {/* Timer Box */}
          <div className={gameTimeLeft <= 10 && gameTimeLeft > 0 ? "timer-flash" : ""} style={{
            backgroundColor: themeSecondaryColor,
            color: 'white',
            fontWeight: 900,
            fontSize: '20px',
            padding: '8px 15px',
            borderRadius: '8px'
          }}>
            {formatTime(gameTimeLeft).split(':')[1]} {/* Just showing seconds according to screenshot "59" */}
          </div>
        </div>

        {/* Status Text */}
        <h2 style={{
          marginTop: '30px',
          marginBottom: '20px',
          fontSize: '22px',
          fontWeight: 900,
          fontStyle: 'italic',
          color: '#111',
          letterSpacing: '1px'
        }}>
          {gameState === 'memorizing' ? 'MEMORIZE THE IMAGE...' : 'START LAYING...'}
        </h2>

        {/* Main Stack Container */}
        <div id="layerz-stack-container" style={{
          width: '90%',
          aspectRatio: '1',
          backgroundColor: '#f9f9f9',
          border: '1px solid #111',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column'
        }}>
          {/* If Memorizing, show Full Image overlay covering the stack */}
          {gameState === 'memorizing' && (
            <div style={{
              position: 'absolute',
              top: 0, left: 0, width: '100%', height: '100%',
              zIndex: 10,
              backgroundColor: 'white'
            }}>
              <img src="/assets/dynamic/fullimage.webp" alt="Full" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              
              {/* Memorize Timer Overlay */}
              <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                color: 'white',
                fontSize: '80px',
                fontWeight: 900,
                padding: '20px 40px',
                borderRadius: '20px',
                fontFamily: "'Orbitron', sans-serif",
                textShadow: '0 4px 15px rgba(0,0,0,0.8)'
              }}>
                {memorizeTimeLeft}
              </div>
            </div>
          )}

          {/* Empty Slots Lines & Placed Pieces */}
          {layers.map((layerId) => {
            const placed = placedPieces[layerId];
            return (
              <div key={`slot-${layerId}`} data-id={layerId} className="stack-slot" style={{ position: 'relative' }}>
                {placed && (
                  <img 
                    src={placed.imageUrl} 
                    alt={`Layer ${layerId}`} 
                    style={{ 
                      position: 'absolute', 
                      width: '100%', 
                      height: '100%', 
                      objectFit: 'cover' 
                    }} 
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Hidden / Drag Slots */}
        <div style={{
          width: '90%',
          marginTop: '30px',
          display: 'flex',
          flexDirection: 'column',
          gap: '15px',
          position: 'relative' // Base for dragging coordinates if needed
        }}>
          {/* RED SLOT */}
          <div 
            onClick={() => handleSlotClick('red')}
            style={{
              width: '100%',
              height: '36px',
              backgroundColor: themeSecondaryColor,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              cursor: gameState === 'guessing' ? 'pointer' : 'default',
              position: 'relative'
            }}
          >
            {revealedSlot === 'red' && currentPiece && (
              <img 
                src={currentPiece.imageUrl} 
                alt="Revealed" 
                onTouchStart={handleDragStart}
                onMouseDown={handleDragStart}
                style={{ 
                  width: '100%', 
                  height: '100%', 
                  objectFit: 'cover',
                  cursor: 'grab',
                  opacity: isDragging ? 0 : 1
                }} 
              />
            )}
          </div>

          {/* BLUE SLOT */}
          <div 
            onClick={() => handleSlotClick('blue')}
            style={{
              width: '100%',
              height: '36px',
              backgroundColor: themePrimaryColor,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              cursor: gameState === 'guessing' ? 'pointer' : 'default',
              position: 'relative'
            }}
          >
            {revealedSlot === 'blue' && currentPiece && (
              <img 
                src={currentPiece.imageUrl} 
                alt="Revealed" 
                onTouchStart={handleDragStart}
                onMouseDown={handleDragStart}
                style={{ 
                  width: '100%', 
                  height: '100%', 
                  objectFit: 'cover',
                  cursor: 'grab',
                  opacity: isDragging ? 0 : 1
                }} 
              />
            )}
          </div>
        </div>

        {/* Bottom Banner */}
        <div style={{ width: '90%', marginTop: '30px' }}>
          <img src={themeBannerUrl} alt="Banner" style={{ width: '100%', borderRadius: '10px' }} />
        </div>

        {/* Bottom Logo */}
        <div style={{ marginTop: 'auto', marginBottom: '20px' }}>
          <img src="/assets/static/layerz.webp" alt="Layerz" style={{ width: '120px', objectFit: 'contain' }} />
        </div>

      </div>

      {/* Floating Draggable Piece */}
      {isDragging && currentPiece && (
        <div style={{
          position: 'fixed',
          left: 0,
          top: 0,
          transform: `translate(${dragPos.x - dragOffset.x}px, ${dragPos.y - dragOffset.y}px)`,
          width: `${(400 * scale) * 0.9}px`, // Match width of slot perfectly (90% of container)
          height: `${36 * scale}px`, // Match height of slot perfectly
          zIndex: 9999,
          pointerEvents: 'none',
          boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
        }}>
          <img src={currentPiece.imageUrl} alt="Dragging" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
      )}

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
          <h2 style={{ fontSize: '24px', fontWeight: 400, marginBottom: '20px' }}>
            Final Score: {score}
          </h2>
          
          <button 
            onClick={() => onGameEnd(score, 100, 60 - gameTimeLeft)}
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
            }}
          >
            VIEW LEADERBOARD
          </button>
        </div>
      )}

    </div>
  );
};
