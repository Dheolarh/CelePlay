import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme, fallbackTheme } from '../context/ThemeContext';

export const CodeEnterScreen: React.FC = () => {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const [code, setCode] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Proportional Scaling Logic (Aspect Ratio Lock)
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

  const handleEnterCode = () => {
    if (!code) {
      setError('Please enter an event code');
      return;
    }
    
    setIsLoading(true);
    setError('');

    // Simulate network validation
    setTimeout(() => {
      if (code.toUpperCase() === 'ALLEN') {
        setTheme(fallbackTheme);
        navigate('/register');
      } else {
        setIsLoading(false);
        setError('Invalid event code. Try ALLEN');
      }
    }, 1500);
  };

  const notificationContent = "Welcome to Celeplay! System is running optimally. We have exciting new features coming up in the next patch. Did you know that we are also launching three brand new games next month? You will be able to play them instantly from your dashboard! Also, make sure to check out the global leaderboard where you can see how you stack up against top players. If you experience any issues, please reach out to support. We hope you enjoy the custom event experience we've set up for you. Good luck and have fun! ... [Additional Content to test scrolling:] The developers have been working day and night to bring you the smoothest, most visually stunning mini-games possible. Our new physics engine will make puzzles feel incredibly tactile, while our upgraded networking layer ensures that your leaderboard scores sync faster than ever before. We've completely redesigned the UI to feature sleek glassmorphism and crisp, high-framerate animations. We are continually partnering with events to bring custom themes directly to your mobile device without any App Store downloads. Expect weekly drops of new customizable assets, ranging from shiny confetti effects to entirely new game modes like Trivia and Word Searches. Your feedback is instrumental in shaping the future of Celeplay, so never hesitate to drop us a line on our community channels. Thanks again for being a part of this journey, and get ready for the biggest update of the year!";

  return (
    <>
      <style>
        {`
          .custom-scrollbar::-webkit-scrollbar {
            width: 5px;
          }
          .custom-scrollbar::-webkit-scrollbar-track {
            background: transparent;
            margin: 4px 0;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background-color: #111111;
            border-radius: 9999px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background-color: #9ca3af;
          }
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          .spin-icon {
            animation: spin 1s linear infinite;
          }
        `}
      </style>
      <div style={{ 
        width: '100vw',
        height: '100dvh',
        backgroundColor: '#fdfdfd', // Super clean white base
        backgroundImage: 'radial-gradient(circle at 50% 0%, #f0f4f8 0%, #fdfdfd 60%)', // Subtle premium gradient
        display: 'flex', 
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
        touchAction: 'none',
        fontFamily: "'Outfit', sans-serif"
      }}>
      
      {/* Fixed Resolution Container */}
      <div style={{
        width: '400px',
        height: '850px',
        transform: `scale(${scale})`,
        transformOrigin: 'center center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative'
      }}>
        
        {/* Decorative background blob */}
        <div className="animate-slide-up" style={{
          position: 'absolute',
          top: '150px',
          width: '300px',
          height: '300px',
          background: `radial-gradient(circle, ${theme.primary_color}0d 0%, rgba(255,255,255,0) 70%)`,
          borderRadius: '50%',
          zIndex: 0
        }} />

        <div style={{ zIndex: 1, width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          
          <img 
            className="animate-slide-up" 
            src="/assets/static/codescreenceleplay.webp" 
            alt="Celeplay" 
            style={{ width: '220px', objectFit: 'contain', marginBottom: '15px' }}
          />
          
          <p className="animate-slide-up delay-100" style={{
            fontSize: '16px',
            color: '#666',
            marginBottom: '50px',
            textAlign: 'center',
            fontWeight: 400
          }}>
            Enter your event code to join the fun.
          </p>

          <div className="animate-slide-up delay-200" style={{
            width: '320px',
            backgroundColor: 'white',
            borderRadius: '30px',
            padding: '40px 30px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.04)',
            border: '1px solid #f0f0f0',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center'
          }}>
            
            <input 
              type="text" 
              value={code} 
              onChange={(e) => setCode(e.target.value.toUpperCase())} 
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder="e.g. ALLEN" 
              style={{
                width: '100%',
                padding: '15px 20px',
                fontSize: '22px',
                fontWeight: 600,
                textAlign: 'center',
                letterSpacing: '2px',
                color: '#111',
                backgroundColor: '#f9f9f9',
                border: `2px solid ${isFocused ? '#111' : 'transparent'}`,
                borderRadius: '15px',
                outline: 'none',
                transition: 'all 0.3s ease',
                marginBottom: '30px'
              }}
            />

            {error && (
              <p className="animate-slide-up" style={{ color: theme.secondary_color, fontSize: '14px', margin: '0 0 15px 0', fontWeight: 600 }}>
                {error}
              </p>
            )}

            <button 
              onClick={handleEnterCode}
              disabled={isLoading}
              style={{
                width: '100%',
                padding: '16px 0',
                backgroundColor: isLoading ? '#333' : '#111',
                color: 'white',
                fontSize: '18px',
                fontWeight: 600,
                borderRadius: '15px',
                border: 'none',
                cursor: isLoading ? 'wait' : 'pointer',
                boxShadow: '0 10px 20px rgba(0,0,0,0.1)',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                marginBottom: '15px',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '10px'
              }}
              onMouseEnter={(e) => {
                if(!isLoading) {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 15px 25px rgba(0,0,0,0.15)';
                }
              }}
              onMouseLeave={(e) => {
                if(!isLoading) {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 10px 20px rgba(0,0,0,0.1)';
                }
              }}
            >
              {isLoading ? (
                <>
                  <svg className="spin-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="30 30" strokeLinecap="round" opacity="0.3" />
                    <path d="M12 2C6.48 2 2 6.48 2 12" stroke="white" strokeWidth="3" strokeLinecap="round" />
                  </svg>
                  Verifying...
                </>
              ) : 'Proceed'}
            </button>

          </div>
        </div>

        {/* Admin Broadcast Notification Box */}
        <div className="animate-slide-up delay-300" style={{
          position: 'absolute',
          bottom: '40px',
          width: '320px',
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          padding: '16px 20px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
          border: '1px solid #f0f0f0',
          display: 'flex',
          flexDirection: 'column',
          cursor: 'pointer',
          maxHeight: isModalOpen ? '650px' : '96px',
          transition: 'max-height 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
          overflow: 'hidden',
          zIndex: 10
        }} onClick={() => setIsModalOpen(!isModalOpen)}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
            <p style={{ margin: 0, fontSize: '12px', fontWeight: 800, color: '#111', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Notification
            </p>
            <span style={{ fontSize: '12px', color: '#888', fontWeight: 600 }}>
              {isModalOpen ? 'Close ↙' : 'Expand ↗'}
            </span>
          </div>
          
          <div className="custom-scrollbar" 
            style={{ 
              marginTop: '8px',
              width: '100%',
              overflowY: isModalOpen ? 'auto' : 'hidden',
              maxHeight: isModalOpen ? '580px' : '44px',
              transition: 'max-height 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
              scrollbarWidth: 'thin',
              scrollbarColor: '#111111 transparent'
            }}
            onClick={(e) => {
              // If it's already open, stop clicks here from bubbling up to the parent so it doesn't close when scrolling/tapping text
              if (isModalOpen) {
                e.stopPropagation();
              }
            }}
          >
            <p style={{ 
              margin: 0, 
              paddingRight: isModalOpen ? '16px' : '0px',
              fontSize: '13.5px', 
              color: '#666', 
              lineHeight: 1.55,
              display: isModalOpen ? 'block' : '-webkit-box',
              WebkitLineClamp: isModalOpen ? 'unset' : 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              userSelect: 'none',
              WebkitUserSelect: 'none'
            }}>
              {notificationContent}
            </p>
          </div>
        </div>

      </div>
    </div>
    </>
  );
};
