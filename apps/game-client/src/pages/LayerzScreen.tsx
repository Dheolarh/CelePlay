import React, { useEffect } from 'react';
import { LayerzGame } from '@celeplay/game-layerz';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';

const generateMockPieces = () => {
  return Array.from({ length: 10 }, (_, i) => ({
    id: i + 1,
    imageUrl: `/assets/dynamic/${i + 1}.webp`
  }));
};

export const LayerzScreen: React.FC = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();

  // Reset audio context if using one, or just stop background music
  useEffect(() => {
    // Usually pause bgm here if it was playing, but our store handles its own effects
  }, []);

  return (
    <LayerzGame 
      themeBannerUrl="/assets/dynamic/banner.webp"
      themePrimaryColor={theme.primary_color}
      themeSecondaryColor={theme.secondary_color}
      pieces={generateMockPieces()}
      onGameEnd={(score, maxScore, timeTaken) => {
        // Typically you'd send this to an API, then navigate to Leaderboard
        console.log(`Layerz ended! Score: ${score}/${maxScore}, Time: ${timeTaken}s`);
        navigate('/leaderboard'); // Or leaderboard
      }}
      onExit={() => {
        navigate('/games');
      }}
    />
  );
};
