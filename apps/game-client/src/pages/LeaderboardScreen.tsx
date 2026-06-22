import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';

export const LeaderboardScreen: React.FC = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();

  const [scale, setScale] = useState(1);
  useEffect(() => {
    const updateScale = () => {
      const widthScale = window.innerWidth / 400;
      const heightScale = window.innerHeight / 850;
      setScale(Math.min(widthScale, heightScale));
    };
    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, []);

  // Mock leaderboard data
  const leaderboardData = [
    { pos: '1st', name: 'Usman Danjuma', score: 459 },
    { pos: '2nd', name: 'Cynthia Victor', score: 400 },
    { pos: '3rd', name: 'Tunde Smith', score: 380 },
    { pos: '4th', name: 'Julius Dan', score: 375 },
    { pos: '5th', name: 'Nkem Diri', score: 366 },
    { pos: '6th', name: 'Panshak Alli', score: 350 },
    { pos: '7th', name: 'Yusuf James', score: 333 },
    { pos: '8th', name: 'Ola Brown', score: 325 },
    { pos: '9th', name: 'Tamuno Toro', score: 318 },
    { pos: '10th', name: 'Alex Efobi', score: 307 },
    { pos: '33rd', name: 'Kunle Usman Obi', score: 285, isCurrentUser: true },
  ];

  const getMedal = (pos: string) => {
    if (pos === '1st') return '🥇';
    if (pos === '2nd') return '🥈';
    if (pos === '3rd') return '🥉';
    return <span style={{ fontSize: '10px' }}>{pos}</span>;
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
      fontFamily: "'Outfit', sans-serif",
      position: 'relative'
    }}>
      {/* Grayscale Background Layer */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundImage: `url(${theme.stadium_bg_url})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        filter: 'grayscale(100%) brightness(0.4)',
        zIndex: 0
      }} />

      {/* Animation Wrapper */}
      <div className="animate-slide-up" style={{ width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        {/* Scaled Virtual Container */}
        <div style={{
          width: '400px',
          height: '850px',
          transform: `scale(${scale})`,
          transformOrigin: 'center center',
          position: 'relative',
          zIndex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: '50px 20px 40px',
          boxSizing: 'border-box'
        }}>
        
        {/* Top Logo */}
        <img src={theme.logo_url} alt="Logo" style={{ height: '70px', marginBottom: '15px', filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.5))' }} />
        
        {/* Leaderboard Title Ribbon Container */}
        <div style={{ position: 'relative', marginBottom: '25px', display: 'flex', justifyContent: 'center', width: '100%' }}>
          <img src={theme.leaderboard_title_url} alt="Leaderboard" style={{ height: '85px', filter: 'drop-shadow(0 5px 10px rgba(0,0,0,0.6))', zIndex: 10 }} />
          <span style={{ 
            position: 'absolute', 
            top: '22px', 
            color: 'white', 
            fontWeight: 900, 
            fontSize: '16px', 
            fontFamily: "'Outfit', sans-serif",
            zIndex: 11
          }}>
            LEADERBOARD
          </span>
        </div>

        <style>{`
          .custom-scrollbar-red::-webkit-scrollbar {
            width: 6px;
          }
          .custom-scrollbar-red::-webkit-scrollbar-track {
            background: transparent;
          }
          .custom-scrollbar-red::-webkit-scrollbar-thumb {
            background: ${theme.secondary_color};
            border-radius: 10px;
          }
        `}</style>

        {/* Leaderboard Table Container */}
        <div style={{ 
          width: '100%', 
          flex: 1, 
          display: 'flex',
          flexDirection: 'column',
          padding: '10px 0',
          overflow: 'hidden'
        }}>
          {/* Header (Sticky, not scrollable) */}
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 20px', fontWeight: 800, borderBottom: `4px solid ${theme.primary_color}`, fontSize: '15px', color: 'white' }}>
            <span style={{ width: '25%', textAlign: 'center' }}>Position</span>
            <span style={{ width: '50%', textAlign: 'center' }}>Name</span>
            <span style={{ width: '25%', textAlign: 'center' }}>Score</span>
          </div>
          
          {/* Scrollable Rows */}
          <div className="custom-scrollbar-red" style={{ flex: 1, overflowY: 'auto' }}>
            {leaderboardData.map((entry, index) => (
              <div 
                key={index} 
                style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  padding: '14px 20px', 
                  borderBottom: `4px solid ${theme.primary_color}`,
                  color: entry.isCurrentUser ? theme.secondary_color : 'white',
                  fontWeight: 800,
                  fontSize: '14px',
                  backgroundColor: entry.isCurrentUser ? 'rgba(255,255,255,0.03)' : 'transparent'
                }}
              >
                <span style={{ width: '25%', textAlign: 'center', fontSize: entry.pos.includes('st') || entry.pos.includes('nd') || entry.pos.includes('rd') && !entry.isCurrentUser ? '24px' : '14px' }}>
                  {getMedal(entry.pos)}
                </span>
                <span style={{ width: '50%', textAlign: 'center' }}>{entry.name}</span>
                <span style={{ width: '25%', textAlign: 'center' }}>{entry.score}</span>
              </div>
            ))}
          </div>

          {/* Sticky Current Player Row */}
          {leaderboardData.find(p => p.isCurrentUser) && (
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              padding: '14px 20px', 
              borderTop: `4px solid ${theme.primary_color}`,
              color: theme.secondary_color,
              fontWeight: 800,
              fontSize: '14px',
              zIndex: 20
            }}>
              <span style={{ width: '25%', textAlign: 'center' }}>
                {leaderboardData.find(p => p.isCurrentUser)?.pos}
              </span>
              <span style={{ width: '50%', textAlign: 'center' }}>{leaderboardData.find(p => p.isCurrentUser)?.name}</span>
              <span style={{ width: '25%', textAlign: 'center' }}>{leaderboardData.find(p => p.isCurrentUser)?.score}</span>
            </div>
          )}
        </div>

        {/* Exit Button */}
        <button 
          onClick={() => navigate('/games')}
          style={{
            marginTop: '35px',
            padding: '10px 45px',
            backgroundColor: theme.secondary_color,
            color: 'white',
            border: '3px solid white',
            borderRadius: '35px',
            fontWeight: 900,
            fontSize: '26px',
            cursor: 'pointer',
            boxShadow: '0 8px 20px rgba(0,0,0,0.6)',
            transition: 'transform 0.2s ease',
            letterSpacing: '2px',
            fontFamily: "'Outfit', sans-serif"
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          EXIT
        </button>

      </div>
      </div>
    </div>
  );
};
