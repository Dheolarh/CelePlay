import React from 'react';
import { FlipiziGame } from '@celeplay/game-flipizi';
import { useNavigate } from 'react-router-dom';

export const FlipiziScreen: React.FC = () => {
  const navigate = useNavigate();

  return (
    <FlipiziGame 
      themeBannerUrl="/assets/dynamic/kalendilybanner.webp" // Based on the user screenshot it might be standard birthday banner
      themePrimaryColor="#21235b" // Dark blue for background and theme
      themeSecondaryColor="#ef4444" // Red for score
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
