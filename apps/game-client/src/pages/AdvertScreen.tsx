import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';

export const AdvertScreen: React.FC = () => {
  const navigate = useNavigate();
  return (
    <div style={{ height: '100dvh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', backgroundColor: '#f0f0f0' }}>
      <h1>Celeplay</h1>
      <p>Download our mobile app for the best experience!</p>
      <button onClick={() => navigate('/splash')}>Continue on Web</button>
    </div>
  );
};
