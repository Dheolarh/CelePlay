import React from 'react';
import { GuextaGame } from '@celeplay/game-guexta';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { submitGameScoreInBackground } from '../hooks/useScoreSubmit';

export const GuextaScreen: React.FC = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();

  return (
    <GuextaGame
      themeBannerUrl={theme.header_banner_url}
      themePrimaryColor={theme.primary_color}
      themeSecondaryColor={theme.secondary_color}
      howToPlayImageUrl="/assets/static/How to Play - Guexta.webp"
      onGameEnd={(score, solved, timeTaken) => {
        console.log(`Guexta ended! Score: ${score}, Solved: ${solved}, Time: ${timeTaken}s`);

        // Start the write, then leave immediately. The leaderboard re-fetches
        // on mount, so the player never waits on the network.
        submitGameScoreInBackground('guexta', score);

        navigate('/leaderboard', { replace: true });
      }}
      onExit={() => navigate('/games', { replace: true })}
    />
  );
};
