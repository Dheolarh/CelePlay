import React, { useMemo } from 'react';
import { Square15Game } from '@celeplay/game-square15';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { submitGameScoreInBackground } from '../hooks/useScoreSubmit';

/**
 * Artwork batches shipped under `public/assets/dynamic/square15`.
 *
 * Each batch holds one full image plus its 16 tiles, but the tiles are named
 * inconsistently - batch 1 uses `sq0..sq15` while batches 2 and 3 use
 * `sq_00..sq_15`. The zero-padded flag records which scheme a batch follows so
 * the URL builder stays a one-liner.
 */
const SQUARE15_BATCHES = [
  { folder: 'batch 1', zeroPadded: false },
  { folder: 'batch 2', zeroPadded: true },
  { folder: 'batch 3', zeroPadded: true },
] as const;

export const Square15Screen: React.FC = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();

  // Locked in once per mount, so re-renders cannot swap the picture mid-solve.
  const batch = useMemo(
    () => SQUARE15_BATCHES[Math.floor(Math.random() * SQUARE15_BATCHES.length)],
    []
  );

  const basePath = `/assets/dynamic/square15/${batch.folder}`;

  const tileUrl = (id: number) =>
    `${basePath}/${batch.zeroPadded ? `sq_${String(id).padStart(2, '0')}` : `sq${id}`}.webp`;

  return (
    <Square15Game 
      themeBannerUrl="/assets/dynamic/kalendilybanner.webp" // Based on the user screenshot it might be standard birthday banner
      themePrimaryColor={theme.primary_color}
      themeSecondaryColor={theme.secondary_color}
      howToPlayImageUrl="/assets/static/How to Play - Square15.webp"
      tileUrl={tileUrl}
      fullImageUrl={`${basePath}/fullimage.webp`}
      onGameEnd={(score, maxScore, timeTaken) => {
        console.log(`Square 15 ended! Score: ${score}/${maxScore}, Time: ${timeTaken}s`);

        // Start the write, then leave immediately.
        submitGameScoreInBackground('square15', score);

        navigate('/leaderboard', { replace: true }); 
      }}
      onExit={() => {
        navigate('/games', { replace: true });
      }}
    />
  );
};
