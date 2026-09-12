import React from 'react';
import { FlipiziGame } from '@celeplay/game-flipizi';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';

export const FlipiziScreen: React.FC = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();

  return (
    <FlipiziGame 
      themeBannerUrl="/assets/dynamic/kalendilybanner.webp" // Based on the user screenshot it might be standard birthday banner
      themePrimaryColor={theme.primary_color}
      themeSecondaryColor={theme.secondary_color}
      onGameEnd={(score, maxScore, timeTaken) => {
        console.log(`Flipizi ended! Score: ${score}/${maxScore}, Time: ${timeTaken}s`);
        navigate('/leaderboard'); 
      }}
      onExit={() => {
        navigate('/games');
      }}
    />
  );
};
