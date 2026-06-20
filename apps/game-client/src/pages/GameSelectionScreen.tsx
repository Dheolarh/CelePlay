import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';

export const GameSelectionScreen: React.FC = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();

  return (
    <div style={{ height: '100dvh', backgroundColor: '#ffffff', display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: '2rem' }}>
      <img src={theme.logo_url} alt="Logo" style={{ height: '80px', marginBottom: '1rem' }} />
      <h2 style={{ color: 'black' }}>PICK A GAME</h2>
      
      {/* Down arrow with dynamic color */}
      <div style={{ color: 'var(--theme-secondary)', fontSize: '2rem', marginBottom: '2rem' }}>
        ↓
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '80%', alignItems: 'center' }}>
        <button onClick={() => navigate('/duolock')} style={{ padding: '1rem', width: '100%', fontSize: '1.2rem', fontWeight: 'bold' }}>DuoLock</button>
        <button style={{ padding: '1rem', width: '100%', fontSize: '1.2rem', fontWeight: 'bold', opacity: 0.5 }}>Flipizi (Coming Soon)</button>
        <button style={{ padding: '1rem', width: '100%', fontSize: '1.2rem', fontWeight: 'bold', opacity: 0.5 }}>Layerz (Coming Soon)</button>
        <button style={{ padding: '1rem', width: '100%', fontSize: '1.2rem', fontWeight: 'bold', opacity: 0.5 }}>Kalendily (Coming Soon)</button>
        <button style={{ padding: '1rem', width: '100%', fontSize: '1.2rem', fontWeight: 'bold', opacity: 0.5 }}>Square15 (Coming Soon)</button>
      </div>
    </div>
  );
};
