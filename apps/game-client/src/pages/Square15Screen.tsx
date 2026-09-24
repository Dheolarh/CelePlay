import React from 'react';
import { Square15Game } from '@celeplay/game-square15';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { submitGameScoreInBackground } from '../hooks/useScoreSubmit';

export const Square15Screen: React.FC = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();

  return (
    <Square15Game 
      themeBannerUrl="/assets/dynamic/kalendilybanner.webp" // Based on the user screenshot it might be standard birthday banner
      themePrimaryColor={theme.primary_color}
      themeSecondaryColor={theme.secondary_color}
      howToPlayImageUrl="/assets/static/How to Play - Square15.webp"
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
