import React from 'react';
import { WordMeshGame } from '@celeplay/game-wordmesh';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { submitGameScoreInBackground } from '../hooks/useScoreSubmit';

export const WordMeshScreen: React.FC = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();

  return (
    <WordMeshGame
      themeLogoUrl={theme.logo_url}
      themeBannerUrl={theme.header_banner_url}
      themePrimaryColor={theme.primary_color}
      themeSecondaryColor={theme.secondary_color}
      howToPlayImageUrl="/assets/static/How to Play - Wordmesh.webp"
      onGameEnd={(score, timeTaken) => {
        console.log(`WordMesh ended! Score: ${score}, Time: ${timeTaken}s`);

        // Start the write, then leave immediately.
        submitGameScoreInBackground('wordmesh', score);

        navigate('/leaderboard', { replace: true });
      }}
      onExit={() => {
        navigate('/games', { replace: true });
      }}
    />
  );
};
