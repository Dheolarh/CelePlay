import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { fetchLeaderboard, playerKeyFor, type LeaderboardEntry } from '@celeplay/core-logic';
import { getStoredPhone } from '../hooks/useScoreSubmit';

/** Turns a 1-based rank into the ordinal label the table displays. */
const ordinal = (rank: number): string => {
  const mod100 = rank % 100;
  // 11th/12th/13th are the exceptions to the 1st/2nd/3rd pattern.
  if (mod100 >= 11 && mod100 <= 13) return `${rank}th`;
  switch (rank % 10) {
    case 1: return `${rank}st`;
    case 2: return `${rank}nd`;
    case 3: return `${rank}rd`;
    default: return `${rank}th`;
  }
};

export const LeaderboardScreen: React.FC = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();

  const [scale, setScale] = useState(1);
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

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

  useEffect(() => {
    let cancelled = false;

    fetchLeaderboard(50)
      .then((rows) => {
        // Guard against setting state after unmount, which React warns about.
        if (cancelled) return;
        setEntries(rows);
      })
      .catch((err) => {
        console.error('[leaderboard] load failed:', err);
        if (!cancelled) setLoadError('Could not load scores.');
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // Identify the current player by the phone number saved at registration.
  const myKey = (() => {
    const phone = getStoredPhone();
    return phone ? playerKeyFor(phone) : null;
  })();

  const myRank = myKey ? entries.findIndex((e) => e.playerKey === myKey) + 1 : 0;
  const myEntry = myRank > 0 ? entries[myRank - 1] : undefined;

  const getMedal = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return <span style={{ fontSize: '10px' }}>{ordinal(rank)}</span>;
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
      {/* Background Layer */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundImage: `url(${theme.stadium_bg_url})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
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
            background: white;
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
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 20px', fontWeight: 800, borderBottom: '4px solid white', fontSize: '15px', color: 'white' }}>
            <span style={{ width: '25%', textAlign: 'center' }}>Position</span>
            <span style={{ width: '50%', textAlign: 'center' }}>Name</span>
            <span style={{ width: '25%', textAlign: 'center' }}>Score</span>
          </div>
          
          {/* Scrollable Rows */}
          <div className="custom-scrollbar-red" style={{ flex: 1, overflowY: 'auto' }}>
            {isLoading && (
              <div style={{ color: 'white', textAlign: 'center', padding: '40px 20px', fontWeight: 600, opacity: 0.7 }}>
                Loading scores…
              </div>
            )}

            {!isLoading && loadError && (
              <div style={{ color: '#FFB300', textAlign: 'center', padding: '40px 20px', fontWeight: 700 }}>
                {loadError}
              </div>
            )}

            {!isLoading && !loadError && entries.length === 0 && (
              <div style={{ color: 'white', textAlign: 'center', padding: '40px 20px', fontWeight: 600, opacity: 0.7 }}>
                No scores yet. Play a game to get on the board!
              </div>
            )}

            {!isLoading && entries.map((entry, index) => {
              const rank = index + 1;
              const isMe = myKey !== null && entry.playerKey === myKey;
              return (
                <div
                  key={entry.playerKey}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '14px 20px',
                    borderBottom: '4px solid white',
                    color: isMe ? '#8AB4F8' : 'white',
                    fontWeight: 800,
                    fontSize: '14px',
                    backgroundColor: isMe ? 'rgba(138,180,248,0.12)' : 'transparent'
                  }}
                >
                  <span style={{ width: '25%', textAlign: 'center', fontSize: rank <= 3 ? '24px' : '14px' }}>
                    {getMedal(rank)}
                  </span>
                  <span style={{ width: '50%', textAlign: 'center' }}>{entry.name}</span>
                  <span style={{ width: '25%', textAlign: 'center' }}>{entry.total}</span>
                </div>
              );
            })}
          </div>

          {/* Sticky row for the current player.
              Only shown when they rank outside the fetched list, otherwise it
              would duplicate the row already highlighted above. */}
          {myEntry && (
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '14px 20px',
              borderTop: '4px solid white',
              color: '#8AB4F8',
              fontWeight: 800,
              fontSize: '14px',
              zIndex: 20
            }}>
              <span style={{ width: '25%', textAlign: 'center' }}>{ordinal(myRank)}</span>
              <span style={{ width: '50%', textAlign: 'center' }}>{myEntry.name}</span>
              <span style={{ width: '25%', textAlign: 'center' }}>{myEntry.total}</span>
            </div>
          )}
        </div>

        {/* Exit Button */}
        <button 
          onClick={() => navigate('/games', { replace: true })}
          style={{
            marginTop: '35px',
            padding: '10px 45px',
            backgroundColor: '#E53935',
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
