import React from 'react';
import { WordMeshGame } from '@celeplay/game-wordmesh';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { submitGameScoreWithTimeout } from '../hooks/useScoreSubmit';

export const WordMeshScreen: React.FC = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();

  return (
    <WordMeshGame
      themeLogoUrl={theme.logo_url}
      themeBannerUrl={theme.header_banner_url}
      themePrimaryColor={theme.primary_color}
      themeSecondaryColor={theme.secondary_color}
      onGameEnd={async (score, timeTaken) => {
        console.log(`WordMesh ended! Score: ${score}, Time: ${timeTaken}s`);

        // Wait for the write before navigating. The leaderboard fetches on
        // mount, so leaving first would show a stale board without this score.
        await submitGameScoreWithTimeout('wordmesh', score);

        navigate('/leaderboard', { replace: true });
      }}
      onExit={() => {
        navigate('/games', { replace: true });
      }}
    />
  );
};
