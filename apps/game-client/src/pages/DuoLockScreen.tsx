import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { DuoLockGame } from '@celeplay/game-duolock';
import { useTheme } from '../context/ThemeContext';
import { useAudio } from '../context/AudioContext';
import { submitGameScoreInBackground } from '../hooks/useScoreSubmit';

/** Every pair shipped in the DuoLock folder. */
const DUOLOCK_PAIR_COUNT = 12;

/** Pairs dealt onto the 4x4 board; the rest stay unused for this round. */
const DUOLOCK_PAIRS_PER_GAME = 8;

/** Fisher-Yates shuffle, returning a new array so the source stays a constant. */
const shuffle = <T,>(items: readonly T[]): T[] => {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
};

export const DuoLockScreen: React.FC = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const { setBgMusicVolume } = useAudio();

  React.useEffect(() => {
    setBgMusicVolume(0.2);
  }, [setBgMusicVolume]);

  /**
   * Picks 8 of the 12 pairs at random for this round.
   *
   * Memoised so the board is fixed when the round starts. Without this the
   * parent re-rendering would deal a fresh set mid-game and reset the cards.
   */
  const cardPairs = useMemo(() => {
    const pairIds = Array.from({ length: DUOLOCK_PAIR_COUNT }, (_, i) => i + 1);
    return shuffle(pairIds)
      .slice(0, DUOLOCK_PAIRS_PER_GAME)
      .map((pairId) => ({
        id: String(pairId),
        imageA: `/assets/dynamic/duolock/${pairId}a.webp`,
        imageB: `/assets/dynamic/duolock/${pairId}b.webp`,
      }));
  }, []);

  const handleGameEnd = (score: number, timeTaken: number) => {
    console.log(`Game Ended! Score: ${score}, Time: ${timeTaken}s`);

    // Start the write, then leave immediately.
    submitGameScoreInBackground('duolock', score);

    navigate('/leaderboard', { replace: true });
  };

  return (
    <DuoLockGame 
      themeLogoUrl={theme.logo_url}
      themeBannerUrl={theme.header_banner_url}
      themePrimaryColor={theme.primary_color}
      themeSecondaryColor={theme.secondary_color}
      howToPlayImageUrl="/assets/static/How to Play - DuoLock.webp"
      onGameEnd={handleGameEnd}
      onExit={() => navigate('/games', { replace: true })}
      cardPairs={cardPairs}
    />
  );
};
