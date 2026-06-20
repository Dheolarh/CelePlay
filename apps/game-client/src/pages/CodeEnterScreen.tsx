import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme, fallbackTheme } from '../context/ThemeContext';

export const CodeEnterScreen: React.FC = () => {
  const navigate = useNavigate();
  const { setTheme } = useTheme();
  const [code, setCode] = useState('');

  const handleEnterCode = async () => {
    // In the future, this will fetch from Supabase
    // If no code is provided or it's invalid, we fallback
    if (!code) {
      setTheme(fallbackTheme);
    } else {
      // Mock validation logic
      setTheme(fallbackTheme); // Just using fallback for now
    }
    navigate('/register');
  };

  return (
    <div style={{ height: '100dvh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
      <h2>Enter Event Code</h2>
      <input 
        type="text" 
        value={code} 
        onChange={(e) => setCode(e.target.value)} 
        placeholder="E.g. ALIKO70" 
      />
      <button onClick={handleEnterCode}>Proceed</button>
      <button onClick={() => { setTheme(fallbackTheme); navigate('/register'); }}>Skip (Use Fallback Theme)</button>
    </div>
  );
};
