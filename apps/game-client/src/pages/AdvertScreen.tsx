import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export const AdvertScreen: React.FC = () => {
  const navigate = useNavigate();

  // Responsive Scaling Logic
  const [scale, setScale] = useState(1);
  useEffect(() => {
    const updateScale = () => {
      const widthScale = window.innerWidth / 400;
      const heightScale = window.innerHeight / 850;
      setScale(Math.min(widthScale, heightScale));
    };
    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, []);

  return (
    <div style={{ 
      width: '100vw',
      height: '100dvh',
      backgroundColor: '#FFFFFF',
      display: 'flex', 
      justifyContent: 'center',
      alignItems: 'center',
      overflow: 'hidden',
      touchAction: 'none',
      fontFamily: "'Outfit', sans-serif",
      position: 'relative'
    }}>
      {/* Scaled Container (No animations here to prevent transform overrides!) */}
      <div style={{
        width: '400px',
        height: '850px',
        transform: `scale(${scale})`,
        transformOrigin: 'center center',
        position: 'relative',
        zIndex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '50px 30px',
        boxSizing: 'border-box'
      }}>
        
        {/* Top Logo */}
        <img className="animate-slide-up" src="/assets/static/codescreenceleplay.webp" alt="Logo" style={{ width: '100%', height: '60px', objectFit: 'contain', marginBottom: '40px', filter: 'brightness(0)' }} />

        {/* Promo Image / Text */}
        <div className="animate-slide-up delay-100" style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h1 style={{ color: '#111', fontSize: '30px', fontWeight: 900, marginBottom: '15px' }}>Get The Full Experience</h1>
          <p style={{ color: '#666', fontSize: '17px', lineHeight: '1.4' }}>
            Download the official app to play games faster, join live tournaments, and climb the leaderboard!
          </p>
        </div>

        {/* App Store Buttons */}
        <div className="animate-slide-up delay-200" style={{ display: 'flex', flexDirection: 'column', gap: '15px', width: '100%', alignItems: 'center', marginBottom: '40px' }}>
          <img src="/assets/static/appstore.webp" alt="Download on App Store" style={{ height: '60px', width: 'auto', cursor: 'pointer', transition: 'transform 0.2s ease' }} onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'} onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'} />
          <img src="/assets/static/playstore.webp" alt="Get it on Google Play" style={{ height: '50px', width: 'auto', cursor: 'pointer', transition: 'transform 0.2s ease' }} onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'} onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'} />
        </div>

        {/* Continue on Web */}
        <div 
          className="animate-slide-up delay-300"
          onClick={() => navigate('/splash')}
          style={{
            marginTop: 'auto',
            padding: '15px 40px',
            backgroundColor: 'transparent',
            color: '#111',
            border: '2px solid #111',
            borderRadius: '30px',
            fontWeight: 800,
            fontSize: '18px',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#111';
            e.currentTarget.style.color = 'white';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = '#111';
          }}
        >
          Continue to Mobile Web
        </div>

      </div>
    </div>
  );
};
