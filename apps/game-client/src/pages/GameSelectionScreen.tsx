import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useAudio } from '../context/AudioContext';

export const GameSelectionScreen: React.FC = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const { setBgMusicVolume } = useAudio();

  useEffect(() => {
    setBgMusicVolume(0.5);
  }, [setBgMusicVolume]);

  // Proportional Scaling Logic
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

  const games = [
    { id: 'duolock', name: 'DuoLock', logo: '/assets/static/duolock.webp', path: '/duolock', customHeight: '65px' },
    { id: 'flipizi', name: 'Flipizi', logo: '/assets/static/flipizi.webp', path: '/flipizi', customHeight: '45px' },
    { id: 'layerz', name: 'Layerz', logo: '/assets/static/layerz.webp', path: '/layerz', customHeight: '45px' },
    { id: 'square15', name: 'Square 15', logo: '/assets/static/square15.webp', path: '/square15', customHeight: '65px' },
    { id: 'kalendily', name: 'Kalendilly', logo: '/assets/static/kalendily.webp', path: '/kalendily', customHeight: '65px' },
  ];

  return (
    <div style={{ 
      width: '100vw',
      height: '100dvh',
      backgroundColor: '#ffffff', 
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
        paddingTop: '60px',
        position: 'relative'
      }}>

        {/* Top Logo */}
        <div className="animate-slide-up" style={{ marginBottom: '20px', width: '100%', display: 'flex', justifyContent: 'center' }}>
          <img 
            src="/assets/dynamic/gameselectlogo.webp" 
            alt="Event Logo" 
            style={{ maxWidth: '280px', objectFit: 'contain' }}
            onError={(e) => { e.currentTarget.src = theme.logo_url; }}
          />
        </div>

        <h2 className="animate-slide-up delay-100" style={{
          color: '#111',
          fontSize: '28px',
          fontWeight: 900,
          margin: 0,
          letterSpacing: '-0.5px'
        }}>
          PICK A GAME
        </h2>

        {/* Thick Red Arrow */}
        <div className="animate-slide-up delay-200" style={{ marginTop: '5px', marginBottom: '25px' }}>
          <svg width="45" height="45" viewBox="0 0 24 24" fill={theme.secondary_color} xmlns="http://www.w3.org/2000/svg">
            <path d="M12 21L20 12H15V3H9V12H4L12 21Z" />
          </svg>
        </div>

        {/* Static Game List */}
        <div className="animate-slide-up delay-300" style={{
          width: '100%',
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '20px',
          paddingBottom: '80px',
          paddingTop: '10px'
        }}>
          {games.map((game) => (
            <div 
              key={game.id}
              onClick={() => game.path !== '#' && navigate(game.path)}
              style={{
                width: '80%',
                display: 'flex',
                justifyContent: 'center',
                cursor: game.path !== '#' ? 'pointer' : 'default',
                transition: 'transform 0.2s ease',
                opacity: game.path !== '#' ? 1 : 0.8
              }}
              onMouseEnter={(e) => {
                if (game.path !== '#') e.currentTarget.style.transform = 'scale(1.05)';
              }}
              onMouseLeave={(e) => {
                if (game.path !== '#') e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              <img 
                src={game.logo} 
                alt={game.name} 
                style={{ 
                  maxWidth: '85%', 
                  height: 'auto',
                  maxHeight: game.customHeight,
                  objectFit: 'contain' 
                }} 
              />
            </div>
          ))}
        </div>
        
      </div>
    </div>
  );
};
