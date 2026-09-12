import React from 'react';
import { useNavigate } from 'react-router-dom';
import { DuoLockGame } from '@celeplay/game-duolock';
import { useTheme } from '../context/ThemeContext';
import { useAudio } from '../context/AudioContext';

export const DuoLockScreen: React.FC = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const { setBgMusicVolume } = useAudio();

  React.useEffect(() => {
    setBgMusicVolume(0.2);
  }, [setBgMusicVolume]);

  // Define the eight DuoLock pairs using the a/b asset naming convention.
  const cardPairs = [
    { id: '1', imageA: '/assets/dynamic/1a.webp', imageB: '/assets/dynamic/1b.webp' },
    { id: '2', imageA: '/assets/dynamic/2a.webp', imageB: '/assets/dynamic/2b.webp' },
    { id: '3', imageA: '/assets/dynamic/3a.webp', imageB: '/assets/dynamic/3b.webp' },
    { id: '4', imageA: '/assets/dynamic/4a.webp', imageB: '/assets/dynamic/4b.webp' },
    { id: '5', imageA: '/assets/dynamic/5a.webp', imageB: '/assets/dynamic/5b.webp' },
    { id: '6', imageA: '/assets/dynamic/6a.webp', imageB: '/assets/dynamic/6b.webp' },
    { id: '7', imageA: '/assets/dynamic/7a.webp', imageB: '/assets/dynamic/7b.webp' },
    { id: '8', imageA: '/assets/dynamic/8a.webp', imageB: '/assets/dynamic/8b.webp' },
  ];

  const handleGameEnd = (score: number, timeTaken: number) => {
    console.log(`Game Ended! Score: ${score}, Time: ${timeTaken}s`);
    navigate('/leaderboard');
  };

  return (
    <DuoLockGame 
      themeLogoUrl={theme.logo_url}
      themeBannerUrl={theme.header_banner_url}
      themePrimaryColor={theme.primary_color}
      themeSecondaryColor={theme.secondary_color}
      onGameEnd={handleGameEnd}
      onExit={() => navigate('/games')}
      cardPairs={cardPairs}
    />
  );
};
