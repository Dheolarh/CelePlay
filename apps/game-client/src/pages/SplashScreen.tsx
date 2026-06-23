import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export const SplashScreen: React.FC = () => {
  const navigate = useNavigate();

  // Proportional Scaling Logic (Aspect Ratio Lock)
  const [scale, setScale] = useState(1);
  useEffect(() => {
    const handleResize = () => {
      const baseWidth = 400;
      const baseHeight = 850;
      const scaleX = window.innerWidth / baseWidth;
      const scaleY = window.innerHeight / baseHeight;
      const newScale = Math.min(scaleX, scaleY);
      setScale(newScale); 
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    // Simulate loading for 2.5 seconds before going to code enter
    const timer = setTimeout(() => {
      navigate('/code-enter');
    }, 2500);
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <>
      <style>
        {`
          @keyframes pulse-slow {
            0%, 100% { transform: scale(1); opacity: 1; }
            50% { transform: scale(1.05); opacity: 0.8; }
          }
          .animate-pulse-slow {
            animation: pulse-slow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
          }
        `}
      </style>
      <div style={{ 
        width: '100vw',
        height: '100dvh',
        backgroundColor: '#111111', // Deep dark premium background
        backgroundImage: 'radial-gradient(circle at 50% 50%, #2a2a2a 0%, #111111 60%)',
        display: 'flex', 
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
        touchAction: 'none',
        fontFamily: "'Outfit', sans-serif"
      }}>
        <div style={{
          width: '400px',
          height: '850px',
          transform: `scale(${scale})`,
          transformOrigin: 'center center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative'
        }}>
          
          <img 
            className="animate-pulse-slow"
            src="/assets/static/splashscreenceleplay.webp"
            alt="Celeplay"
            style={{ width: '280px', objectFit: 'contain' }}
          />
          
          <div className="animate-slide-up delay-200" style={{
            position: 'absolute',
            bottom: '60px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center'
          }}>
            <p style={{ margin: 0, color: '#888', fontSize: '12px', fontWeight: 600, letterSpacing: '4px', textTransform: 'uppercase' }}>
              Powered By
            </p>
            <img 
              src="/assets/static/Gamoo logo.webp" 
              alt="Gamoo" 
              style={{ marginTop: '8px', height: '28px', objectFit: 'contain' }}
            />
          </div>

        </div>
      </div>
    </>
  );
};
