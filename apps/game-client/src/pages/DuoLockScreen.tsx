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

  // Define pairs using the new fallback assets format (T for text, I for image)
  const cardPairs = [
    { id: 'acs', imageT: '/assets/dynamic/acsT.webp', imageI: '/assets/dynamic/acsI.webp' },
    { id: 'aeb', imageT: '/assets/dynamic/aebT.webp', imageI: '/assets/dynamic/aebI.webp' },
    { id: 'aef', imageT: '/assets/dynamic/aefT.webp', imageI: '/assets/dynamic/aefI.webp' },
    { id: 'aim', imageT: '/assets/dynamic/aimT.webp', imageI: '/assets/dynamic/aimI.webp' },
    { id: 'ajc', imageT: '/assets/dynamic/ajcT.webp', imageI: '/assets/dynamic/ajcI.webp' },
    { id: 'anu', imageT: '/assets/dynamic/anuT.webp', imageI: '/assets/dynamic/anuI.webp' },
    { id: 'avl', imageT: '/assets/dynamic/avlT.webp', imageI: '/assets/dynamic/avlI.webp' },
    { id: 'moc', imageT: '/assets/dynamic/amcT.webp', imageI: '/assets/dynamic/amcI.webp' },
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
