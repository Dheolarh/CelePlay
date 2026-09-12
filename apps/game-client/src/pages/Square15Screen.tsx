import React from 'react';
import { Square15Game } from '@celeplay/game-square15';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';

export const Square15Screen: React.FC = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();

  return (
    <Square15Game 
      themeBannerUrl="/assets/dynamic/kalendilybanner.webp" // Based on the user screenshot it might be standard birthday banner
      themePrimaryColor={theme.primary_color}
      themeSecondaryColor={theme.secondary_color}
      onGameEnd={(score, maxScore, timeTaken) => {
        console.log(`Square 15 ended! Score: ${score}/${maxScore}, Time: ${timeTaken}s`);
        navigate('/leaderboard'); 
      }}
      onExit={() => {
        navigate('/games');
      }}
    />
  );
};
