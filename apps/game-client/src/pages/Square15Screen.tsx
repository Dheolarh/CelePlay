import React, { useEffect } from 'react';
import { Square15Game } from '@celeplay/game-square15';
import { useNavigate } from 'react-router-dom';

export const Square15Screen: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Square15Game 
      themeBannerUrl="/assets/dynamic/kalendilybanner.webp" // Based on the user screenshot it might be standard birthday banner
      themePrimaryColor="#1d4ed8" // Dark blue for timer
      themeSecondaryColor="#ef4444" // Red for score
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
