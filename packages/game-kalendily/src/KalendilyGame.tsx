import React, { useEffect, useState } from 'react';
import { useKalendilyStore } from './store';
import type { KalendilyQuestion } from './store';
import { getDaysInMonth, getFirstDayOfMonth, monthNames, formatTime } from './utils';

export interface KalendilyGameProps {
  themeLogoUrl: string;
  themeBannerUrl: string;
  themePrimaryColor: string;
  themeSecondaryColor: string;
  questions: KalendilyQuestion[];
  onGameEnd: (score: number, maxScore: number, timeTaken: number) => void;
  onExit: () => void;
}

export const KalendilyGame: React.FC<KalendilyGameProps> = ({
  themeBannerUrl,
  themePrimaryColor,
  themeSecondaryColor,
  questions: initialQuestions,
  onGameEnd
}) => {
  const { 
    questions,
    currentQuestionIndex, 
    score, 
    timeLeft, 
    gameState, 
    selectedDay, 
    correctDay,
    initializeGame, 
    submitAnswer, 
    showAnswer,
    nextQuestion, 
    tickTimer, 
    resetGame 
  } = useKalendilyStore();

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
    initializeGame(initialQuestions);
    return () => resetGame();
  }, [initialQuestions, initializeGame, resetGame]);

  const scrollRef = React.useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [currentQuestionIndex]);

  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (gameState === 'playing' || gameState === 'flashing') {
      timer = setInterval(() => tickTimer(), 1000);
    }
    return () => clearInterval(timer);
  }, [gameState, tickTimer]);

  useEffect(() => {
    if (timeLeft <= 10 && timeLeft > 0 && gameState === 'playing') {
      const audio = new Audio('/assets/sounds/beep.mp3');
      audio.volume = 0.5;
      audio.play().catch(() => {});
    }
  }, [timeLeft, gameState]);

  // Handle Correct / Wrong sound effects
  useEffect(() => {
    if (gameState === 'flashing') {
      const isCorrect = selectedDay === correctDay;
      const audio = new Audio(isCorrect ? '/assets/sounds/correct.mp3' : '/assets/sounds/wrong.mp3');
      audio.play().catch(() => {});
    }
  }, [gameState, selectedDay, correctDay]);

  // Handle Win / Lose sound effects
  useEffect(() => {
    if (gameState === 'ended' && questions.length > 0) {
      const isWon = score >= questions.length / 2;
      const audio = new Audio(isWon ? '/assets/sounds/win.mp3' : '/assets/sounds/lose.mp3');
      audio.play().catch(() => {});
    }
  }, [gameState, score, questions.length]);

  const currentQ = questions[currentQuestionIndex];

  const answeredCount = gameState === 'playing' ? currentQuestionIndex : currentQuestionIndex + 1;
  const wrongCount = answeredCount - score;

  const handleDayClick = (day: number) => {
    if (gameState !== 'playing') return;
    
    submitAnswer(day);
    
    // Auto proceed after brief flash
    setTimeout(() => {
      const isCorrect = day === currentQ.day;
      if (isCorrect) {
        nextQuestion(); // Skip answer screen if correct
      } else {
        showAnswer(); // Show answer overlay if wrong
      }
    }, 1000); // Wait 1s so user sees the red/green flash
  };

  const getCalendarCells = () => {
    if (!currentQ) return { offset: 0, days: 0 };
    return {
      offset: getFirstDayOfMonth(currentQ.year, currentQ.month),
      days: getDaysInMonth(currentQ.year, currentQ.month)
    };
  };

  const calendar = getCalendarCells();
  const dayNames = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  return (
    <div style={{ 
      width: '100vw',
      height: '100dvh',
      backgroundColor: themePrimaryColor,
      display: 'flex', 
      justifyContent: 'center',
      alignItems: 'center',
      overflow: 'hidden',
      touchAction: 'none',
      fontFamily: "'Outfit', sans-serif",
      position: 'relative'
    }}>
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@700&display=swap');
          
          .flash-correct {
            animation: flashGreen 0.5s ease 3;
            background-color: #22c55e !important;
            color: white !important;
          }
          
          .flash-incorrect {
            animation: flashRed 0.5s ease 3;
            background-color: ${themeSecondaryColor} !important;
            color: white !important;
          }

          @keyframes flashGreen {
            0%, 100% { background-color: #111; }
            50% { background-color: #22c55e; }
          }

          @keyframes flashRed {
            0%, 100% { background-color: #111; }
            50% { background-color: ${themeSecondaryColor}; }
          }
          
          .calendar-day {
            background-color: #111;
            color: white;
          }
          
          .question-text-scroll::-webkit-scrollbar {
            width: 6px;
          }
          .question-text-scroll::-webkit-scrollbar-thumb {
            background: ${themeSecondaryColor};
            border-radius: 10px;
          }

          @keyframes flashTimerText {
            0%, 100% { color: white !important; background-color: ${themeSecondaryColor} !important; border-color: ${themeSecondaryColor} !important; }
            50% { color: #111 !important; background-color: white !important; border-color: ${themeSecondaryColor} !important; }
          }
          .timer-flash {
            animation: flashTimerText 1s infinite;
          }
        `}
      </style>

      {/* Scaled Container (No inline anims!) */}
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
        
        {/* Banner Section */}
        <div className="animate-slide-up" style={{ width: '90%', marginTop: '50px', display: 'flex', justifyContent: 'center' }}>
          <img src={themeBannerUrl} alt="Banner" style={{ width: '80%', borderRadius: '10px', boxShadow: '0 4px 15px rgba(0,0,0,0.3)' }} />
        </div>

        {/* Stats Row */}
        <div className="animate-slide-up delay-100" style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          width: '90%', 
          marginTop: '20px',
          alignItems: 'center'
        }}>
          {/* Wrong Answers Bubble */}
          <div style={{ 
            backgroundColor: 'white', 
            borderRadius: '20px', 
            padding: '5px 15px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 4px 10px rgba(0,0,0,0.3)'
          }}>
            <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: themeSecondaryColor }} />
            <span style={{ fontWeight: 800, fontSize: '18px', color: '#111' }}>{wrongCount}</span>
          </div>

          {/* Timer Bubble */}
          <div className={timeLeft <= 10 && timeLeft > 0 ? "timer-flash" : ""} style={{
            backgroundColor: 'white',
            border: `3px solid ${themeSecondaryColor}`,
            padding: '4px 20px',
            borderRadius: '10px',
            fontFamily: "'Orbitron', sans-serif",
            fontWeight: 800,
            fontSize: '18px',
            color: '#111',
            boxShadow: '0 4px 10px rgba(0,0,0,0.3)'
          }}>
            {formatTime(timeLeft)}
          </div>

          {/* Correct Answers Bubble */}
          <div style={{ 
            backgroundColor: 'white', 
            borderRadius: '20px', 
            padding: '5px 15px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 4px 10px rgba(0,0,0,0.3)'
          }}>
            <span style={{ fontWeight: 800, fontSize: '18px', color: '#111' }}>{score}</span>
            <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: themePrimaryColor }} />
          </div>
        </div>

        {/* Question Text Box */}
        {currentQ && (
          <div className="animate-slide-up delay-200" style={{
            width: '90%',
            backgroundColor: 'white',
            borderRadius: '15px',
            padding: '20px',
            marginTop: '25px',
            boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
            display: 'flex',
            alignItems: 'center',
            gap: '15px'
          }}>
            <img src={currentQ.imageUrl} alt="Question Visual" style={{ width: '70px', height: '70px', borderRadius: '10px', objectFit: 'contain', flexShrink: 0, backgroundColor: '#f9f9f9' }} />
            <div ref={scrollRef} className="question-text-scroll" style={{ maxHeight: '70px', overflowY: 'auto', paddingRight: '5px' }}>
              <p style={{ fontSize: '14px', fontWeight: 600, color: '#333', margin: 0, lineHeight: 1.4 }}>
                {currentQ.text}
              </p>
            </div>
          </div>
        )}

        {/* Calendar Box */}
        {currentQ && (
          <div className="animate-slide-up delay-300" style={{
            width: '90%',
            backgroundColor: 'white',
            border: `8px solid ${themeSecondaryColor}`,
            borderRadius: '20px',
            marginTop: '30px',
            padding: '15px',
            boxSizing: 'border-box'
          }}>
            <div style={{ textAlign: 'center', marginBottom: '10px' }}>
              <span style={{ fontSize: '18px', fontWeight: 800, color: '#111' }}>
                {currentQuestionIndex + 1}/{questions.length}
              </span>
              <div style={{ 
                backgroundColor: '#111', 
                color: 'white', 
                padding: '8px', 
                borderRadius: '8px', 
                marginTop: '5px',
                fontSize: '22px',
                fontWeight: 900,
                letterSpacing: '1px'
              }}>
                {monthNames[currentQ.month]} {currentQ.year}
              </div>
            </div>

            {/* Grid Header */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', marginBottom: '8px' }}>
              {dayNames.map((d, i) => (
                <div key={i} style={{ textAlign: 'center', color: themeSecondaryColor, fontWeight: 900, fontSize: '18px' }}>
                  {d}
                </div>
              ))}
            </div>

            {/* Grid Cells */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '6px' }}>
              {/* Offsets */}
              {Array.from({ length: calendar.offset }).map((_, i) => (
                <div key={`empty-${i}`} style={{ aspectRatio: '1', backgroundColor: '#f0f0f0', borderRadius: '4px' }} />
              ))}
              
              {/* Days */}
              {Array.from({ length: calendar.days }).map((_, i) => {
                const dayNum = i + 1;
                
                // Determine styling based on game state
                let cellClass = "";
                let isClickable = gameState === 'playing';
                
                if (gameState === 'flashing' || gameState === 'answering') {
                  if (dayNum === correctDay) {
                    cellClass = "flash-correct"; // Always flash correct answer green
                  } else if (dayNum === selectedDay && selectedDay !== correctDay) {
                    cellClass = "flash-incorrect"; // Flash selected wrong answer red
                  }
                }

                return (
                  <div 
                    key={`day-${dayNum}`}
                    onClick={() => isClickable && handleDayClick(dayNum)}
                    className={`calendar-day ${cellClass}`}
                    style={{
                      aspectRatio: '1',
                      borderRadius: '4px',
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      fontWeight: 800,
                      fontSize: '18px',
                      cursor: isClickable ? 'pointer' : 'default',
                      transition: 'transform 0.1s',
                      transform: selectedDay === dayNum ? 'scale(0.9)' : 'scale(1)'
                    }}
                  >
                    {dayNum}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Kalendilly Bottom Logo */}
        <div className="animate-slide-up delay-300" style={{ 
          marginTop: 'auto', 
          marginBottom: '20px', 
          display: 'flex', 
          justifyContent: 'center', 
          width: '100%' 
        }}>
          <img src="/assets/static/kalendily.webp" alt="Kalendilly" style={{ width: '150px', objectFit: 'contain' }} />
        </div>

      </div>

      {/* Answer Overlay Screen */}
      {gameState === 'answering' && currentQ && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: themePrimaryColor,
          zIndex: 50,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          <div className="animate-slide-up" style={{ width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <div style={{
              width: '400px',
              height: '850px',
              transform: `scale(${scale})`,
              transformOrigin: 'center center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              padding: '40px 30px',
              boxSizing: 'border-box'
            }}>
              <h2 style={{ color: 'white', fontSize: '24px', fontWeight: 900, marginBottom: '5px', letterSpacing: '2px' }}>
                ANSWER
              </h2>
              <div style={{ 
                backgroundColor: 'white', 
                color: themePrimaryColor, 
                padding: '10px 20px', 
                borderRadius: '30px',
                fontSize: '24px',
                fontWeight: 900,
                whiteSpace: 'nowrap',
                marginBottom: '30px'
              }}>
                {currentQ.answerText}
              </div>

              <div style={{
                width: '200px',
                height: '200px',
                borderRadius: '50%',
                backgroundColor: 'white',
                overflow: 'hidden',
                border: `6px solid white`,
                boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
                marginBottom: '30px',
                flexShrink: 0,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center'
              }}>
                <img src={currentQ.imageUrl} alt="Answer Visual" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              </div>

              <p style={{
                color: 'white',
                fontSize: '18px',
                fontWeight: 600,
                textAlign: 'center',
                lineHeight: 1.5,
                marginBottom: '20px'
              }}>
                {currentQ.explanation}
              </p>

              <button 
                onClick={() => nextQuestion()}
                style={{
                  backgroundColor: 'white',
                  color: themePrimaryColor,
                  padding: '15px 60px',
                  borderRadius: '30px',
                  fontSize: '20px',
                  fontWeight: 900,
                  border: 'none',
                  cursor: 'pointer',
                  boxShadow: '0 10px 20px rgba(0,0,0,0.2)',
                  marginTop: 'auto',
                  marginBottom: '20px'
                }}
              >
                CONTINUE
              </button>

              <img src="/assets/dynamic/gameselectlogo.webp" alt="Kalendilly" style={{ width: '150px', objectFit: 'contain' }} />
            </div>
          </div>
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
          backgroundColor: score >= questions.length / 2 ? themePrimaryColor : themeSecondaryColor,
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          padding: '20px',
          textAlign: 'center'
        }}>
          <h1 style={{ fontSize: '36px', margin: 0, fontFamily: "'Orbitron', sans-serif" }}>
            {timeLeft > 0 ? 'COMPLETED!' : 'TIME UP!'}
          </h1>
          <h2 style={{ fontSize: '24px', fontWeight: 400, marginBottom: '20px' }}>
            You got {score} out of {questions.length} correct!
          </h2>
          
          <button 
            onClick={() => onGameEnd(score, questions.length, questions.length * 9 - timeLeft)}
            style={{
              backgroundColor: 'white',
              color: score >= questions.length / 2 ? themePrimaryColor : themeSecondaryColor,
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
