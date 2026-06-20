import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export const SplashScreen: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => {
      navigate('/code-enter');
    }, 2000);
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div style={{ height: '100dvh', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#123456', color: 'white' }}>
      <h1>Loading Celeplay...</h1>
    </div>
  );
};
