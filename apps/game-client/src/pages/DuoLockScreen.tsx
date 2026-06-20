import React from 'react';
import { useNavigate } from 'react-router-dom';
import { DuoLockGame } from '@celeplay/game-duolock';
import { useTheme } from '../context/ThemeContext';

export const DuoLockScreen: React.FC = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();

  // Define pairs using the new fallback assets format (T for text, I for image)
  const cardPairs = [
    { id: 'acs', imageT: '/assets/acsT.webp', imageI: '/assets/acsI.webp' },
    { id: 'aeb', imageT: '/assets/aebT.webp', imageI: '/assets/aebI.webp' },
    { id: 'aef', imageT: '/assets/aefT.webp', imageI: '/assets/aefI.webp' },
    { id: 'aim', imageT: '/assets/aimT.webp', imageI: '/assets/aimI.webp' },
    { id: 'ajc', imageT: '/assets/ajcT.webp', imageI: '/assets/ajcI.webp' },
    { id: 'anu', imageT: '/assets/anuT.webp', imageI: '/assets/anuI.webp' },
    { id: 'avl', imageT: '/assets/avlT.webp', imageI: '/assets/avlI.webp' },
    { id: 'moc', imageT: '/assets/amcT.webp', imageI: '/assets/amcI.webp' },
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
