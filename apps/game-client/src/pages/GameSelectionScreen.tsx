import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useAudio } from '../context/AudioContext';
import { fetchPlayedGames, type GameId } from '@celeplay/core-logic';
import { getStoredPhone } from '../hooks/useScoreSubmit';

// Seamless wavy horizontal lines pattern (light blue on white) used as the
// page background. Inlined as a data URI so it needs no extra network request.
const WAVE_PATTERN_BG = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='60' viewBox='0 0 120 60'%3E%3Cg fill='none' stroke='%23A8C8E8' stroke-width='1.5' stroke-linecap='round'%3E%3Cpath d='M0 15 C 20 5, 40 25, 60 15 S 100 5, 120 15'/%3E%3Cpath d='M0 30 C 20 20, 40 40, 60 30 S 100 20, 120 30'/%3E%3Cpath d='M0 45 C 20 35, 40 55, 60 45 S 100 35, 120 45'/%3E%3Cpath d='M0 0 C 20 -10, 40 10, 60 0 S 100 -10, 120 0'/%3E%3Cpath d='M0 60 C 20 50, 40 70, 60 60 S 100 50, 120 60'/%3E%3C/g%3E%3C/svg%3E")`;

export const GameSelectionScreen: React.FC = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const { setBgMusicVolume } = useAudio();

  useEffect(() => {
    setBgMusicVolume(0.5);
  }, [setBgMusicVolume]);

  /**
   * Games the signed-in player has already finished.
   *
   * Read from the `played` node, which the database only ever lets be written
   * once per game. A failed read leaves the list empty, so an unreachable
   * database degrades to "everything is playable" rather than locking the
   * player out of the whole event.
   */
  const [playedGames, setPlayedGames] = useState<GameId[]>([]);

  useEffect(() => {
    const phone = getStoredPhone();
    if (!phone) return;

    let cancelled = false;
    fetchPlayedGames(phone)
      .then((games) => {
        if (!cancelled) setPlayedGames(games);
      })
      .catch((err) => {
        console.error('[games] could not load played games:', err);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // Every game finished means the event is done for this player.
  const allGamesPlayed = playedGames.length > 0 && playedGames.length === 4;

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
    { id: 'square15', name: 'Square 15', logo: '/assets/static/square15.webp', path: '/square15', customHeight: '65px' },
    { id: 'wordmesh', name: 'WordMesh', logo: '/assets/dynamic/Wordmesh white logo.webp', path: '/wordmesh', customHeight: '65px', logoFilter: 'brightness(0)' },
    { id: 'guexta', name: 'Guexta', logo: '/assets/dynamic/GUEXTA WHITE LOGO.webp', path: '/guexta', customHeight: '65px', logoFilter: 'brightness(0)' },
  ];

  return (
    <div style={{ 
      width: '100vw',
      height: '100dvh',
      backgroundColor: '#ffffff',
      backgroundImage: WAVE_PATTERN_BG,
      backgroundSize: '120px 60px',
      backgroundRepeat: 'repeat',
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
        paddingTop: '110px',
        position: 'relative'
      }}>

        {/* Top bar: register another player (left) and view the leaderboard
            (right). Absolutely positioned so they sit at the top corners
            without pushing the logo down, and sized for touch input. */}
        <div style={{
          position: 'absolute',
          top: '14px',
          left: '14px',
          right: '14px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          zIndex: 20,
        }}>
          <button
            onClick={() => navigate('/register')}
            aria-label="Register another player"
            title="Register another player"
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              border: `3px solid #000`,
              backgroundColor: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              padding: 0,
              boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
            }}
          >
            {/* Arrow pointing left, i.e. back to registration. */}
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
              stroke="#000" strokeWidth="3"
              strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5" />
              <path d="M12 19l-7-7 7-7" />
            </svg>
          </button>

          <button
            onClick={() => navigate('/leaderboard')}
            aria-label="View leaderboard"
            title="View leaderboard"
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              border: `3px solid #000`,
              backgroundColor: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              padding: 0,
              boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
            }}
          >
            {/* Podium bars, reading as a ranking. */}
            <svg width="24" height="24" viewBox="0 0 24 24" fill="#000">
              <rect x="3" y="12" width="5" height="9" rx="1" />
              <rect x="9.5" y="7" width="5" height="14" rx="1" />
              <rect x="16" y="14" width="5" height="7" rx="1" />
            </svg>
          </button>
        </div>

        {/* Top Logo */}
        <div className="animate-slide-up" style={{ marginBottom: '20px', width: '100%', display: 'flex', justifyContent: 'center' }}>
          <img 
            src="/assets/dynamic/gameselectlogo.webp" 
            alt="Event Logo" 
            style={{ maxWidth: '340px', width: '100%', objectFit: 'contain' }}
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
          {allGamesPlayed ? 'ALL GAMES PLAYED' : 'PICK A GAME'}
        </h2>

        {/* Once every game is done there is nothing left to pick, so the prompt
            is replaced with the only action still worth taking. */}
        {allGamesPlayed ? (
          <button
            className="animate-slide-up delay-200"
            onClick={() => navigate('/leaderboard')}
            style={{
              marginTop: '12px',
              padding: '10px 30px',
              backgroundColor: '#E53935',
              color: 'white',
              border: '3px solid #111',
              borderRadius: '35px',
              fontWeight: 900,
              fontSize: '18px',
              letterSpacing: '1px',
              cursor: 'pointer',
              fontFamily: "'Outfit', sans-serif",
              boxShadow: '0 6px 16px rgba(0,0,0,0.3)',
            }}
          >
            VIEW LEADERBOARD
          </button>
        ) : (
          /* Thick Red Arrow */
          <div className="animate-slide-up delay-200" style={{ marginTop: '5px', marginBottom: '25px' }}>
            <svg width="45" height="45" viewBox="0 0 24 24" fill={theme.secondary_color} xmlns="http://www.w3.org/2000/svg">
              <path d="M12 21L20 12H15V3H9V12H4L12 21Z" />
            </svg>
          </div>
        )}

        {/* Static Game List */}
        <div className="animate-slide-up delay-300" style={{
          width: '100%',
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '45px',
          paddingBottom: '80px',
          paddingTop: '10px'
        }}>
          {games.map((game) => {
            const isPlayed = playedGames.includes(game.id as GameId);
            const isEnabled = game.path !== '#' && !isPlayed;

            return (
              <div 
                key={game.id}
                onClick={() => isEnabled && navigate(game.path)}
                aria-disabled={!isEnabled}
                style={{
                  width: '80%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  cursor: isEnabled ? 'pointer' : 'default',
                  transition: 'transform 0.2s ease',
                  opacity: isEnabled ? 1 : 0.45,
                  position: 'relative',
                }}
                onMouseEnter={(e) => {
                  if (isEnabled) e.currentTarget.style.transform = 'scale(1.05)';
                }}
                onMouseLeave={(e) => {
                  if (isEnabled) e.currentTarget.style.transform = 'scale(1)';
                }}
              >
                <img 
                  src={game.logo} 
                  alt={game.name} 
                  style={{ 
                    maxWidth: '85%', 
                    height: 'auto',
                    maxHeight: game.customHeight,
                    objectFit: 'contain',
                    filter: game.logoFilter
                  }} 
                />

                {/* Sits over the logo once the game has been finished, so the
                    tile reads as unavailable without the logo vanishing. */}
                {isPlayed && (
                  <span style={{
                    position: 'absolute',
                    top: '50%',
                    transform: 'translateY(-50%) rotate(-8deg)',
                    backgroundColor: '#111',
                    color: 'white',
                    fontWeight: 900,
                    fontSize: '13px',
                    letterSpacing: '2px',
                    padding: '5px 14px',
                    borderRadius: '20px',
                    border: '2px solid white',
                    boxShadow: '0 4px 10px rgba(0,0,0,0.35)',
                    pointerEvents: 'none',
                  }}>
                    PLAYED
                  </span>
                )}
              </div>
            );
          })}
        </div>
        
      </div>
    </div>
  );
};
