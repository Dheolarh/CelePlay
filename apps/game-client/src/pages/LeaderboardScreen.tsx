import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { fetchLeaderboard, playerKeyFor, type LeaderboardEntry } from '@celeplay/core-logic';
import { getStoredPhone } from '../hooks/useScoreSubmit';
import { CallToActionOverlay } from '../components/CallToActionOverlay';

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

  /**
   * Call-to-action flow.
   *
   * 'hidden'  - not shown (before the 3s delay, or once dismissed from EXIT)
   * 'initial' - the automatic popup 3 seconds after the board appears
   * 'exit'    - shown when EXIT is pressed; leads to the game selection screen
   */
  const [ctaMode, setCtaMode] = useState<'hidden' | 'initial' | 'exit'>('hidden');

  /** Drives the spin animation on the refresh button while a fetch is running. */
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Reveal the flier shortly after the board appears, so it does not cover the
  // scores before the player has had a chance to read them.
  useEffect(() => {
    const timer = setTimeout(() => setCtaMode('initial'), 3000);
    return () => clearTimeout(timer);
  }, []);

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

  /**
   * Fetches the board into state.
   *
   * Exposed through a `useCallback` so both the initial mount effect and the
   * refresh button share one implementation. `cancelledRef` is threaded in
   * rather than captured, because the effect's cleanup needs to invalidate a
   * fetch that the button may have started later.
   */
  const loadEntries = React.useCallback(async (isCancelled: () => boolean) => {
    try {
      const rows = await fetchLeaderboard(50);
      // Guard against setting state after unmount, which React warns about.
      if (!isCancelled()) {
        setEntries(rows);
        setLoadError('');
      }
    } catch (err) {
      console.error('[leaderboard] load failed:', err);
      if (!isCancelled()) setLoadError('Could not load scores.');
    } finally {
      if (!isCancelled()) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    const isCancelled = () => cancelled;

    void loadEntries(isCancelled);

    // Finish screens navigate here without waiting for the score write, so the
    // first fetch can land a moment before the new score is stored. A single
    // follow-up fetch covers that gap without polling.
    const settle = setTimeout(() => {
      void loadEntries(isCancelled);
    }, 1200);

    return () => {
      cancelled = true;
      clearTimeout(settle);
    };
  }, [loadEntries]);

  /** Manual refresh, for when a player finishes on another phone. */
  const handleRefresh = async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    await loadEntries(() => false);
    setIsRefreshing(false);
  };

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
          @keyframes lb-spin {
            from { transform: rotate(0deg); }
            to   { transform: rotate(360deg); }
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

        {/* Bottom controls. The refresh sits beside EXIT rather than in the
            table header so it cannot be mistaken for a sort control. */}
        <div style={{
          marginTop: '35px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '14px',
        }}>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            aria-label="Refresh leaderboard"
            title="Refresh leaderboard"
            style={{
              width: '52px',
              height: '52px',
              flexShrink: 0,
              borderRadius: '50%',
              backgroundColor: 'white',
              border: '3px solid #E53935',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: isRefreshing ? 'default' : 'pointer',
              padding: 0,
              boxShadow: '0 8px 20px rgba(0,0,0,0.6)',
            }}
          >
            {/* Circular arrow, rotated continuously while a fetch is in flight. */}
            <svg
              width="26"
              height="26"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#E53935"
              strokeWidth="2.6"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{
                animation: isRefreshing ? 'lb-spin 0.9s linear infinite' : 'none',
                display: 'block',
              }}
            >
              <path d="M20 11a8 8 0 1 0-2.3 5.7" />
              <path d="M20 5v6h-6" />
            </svg>
          </button>

          <button 
            onClick={() => setCtaMode('exit')}
            style={{
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

      {/* Promotional flier. Shown automatically after a short delay so the
          player can read the board first, then again on EXIT. Both offer the
          same choice: come back to the board, or leave for game selection. */}
      {ctaMode !== 'hidden' && (
        <CallToActionOverlay
          imageUrl="/assets/static/Call to action Flier.webp"
          mode={ctaMode === 'initial' ? 'auto' : 'exit'}
          onViewLeaderboard={() => setCtaMode('hidden')}
          onQuit={() => navigate('/games', { replace: true })}
        />
      )}
    </div>
  );
};
