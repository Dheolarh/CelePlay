import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useAudio } from '../context/AudioContext';

export const RegistrationScreen: React.FC = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const { setBgMusicVolume } = useAudio();
  
  useEffect(() => {
    setBgMusicVolume(0.5);
  }, [setBgMusicVolume]);

  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [focusedField, setFocusedField] = useState<string | null>(null);

  // Proportional Scaling Logic (Aspect Ratio Lock)
  const [scale, setScale] = useState(1);
  useEffect(() => {
    const handleResize = () => {
      const baseWidth = 400;
      const baseHeight = 850;
      const scaleX = window.innerWidth / baseWidth;
      const scaleY = window.innerHeight / baseHeight;
      // Fit to screen perfectly
      const newScale = Math.min(scaleX, scaleY);
      setScale(newScale); 
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.length < 3) {
      setError('Name must be at least 3 characters.');
      return;
    }
    if (!phone) {
      setError('Valid phone number required.');
      return;
    }
    navigate('/games');
  };

  const inputStyle = (fieldName: string) => ({
    width: '100%',
    padding: '5px 0',
    fontSize: '16px',
    border: 'none',
    borderBottom: `2px solid ${focusedField === fieldName ? theme.primary_color : '#e0e0e0'}`,
    backgroundColor: 'transparent',
    color: '#333',
    transition: 'border-color 0.3s ease',
    marginBottom: '15px',
  });

  const labelStyle = {
    display: 'block',
    fontSize: '16px',
    fontWeight: 600,
    color: '#333',
    marginBottom: '5px',
    opacity: 0.8
  };

  return (
    <div style={{ 
      width: '100vw',
      height: '100dvh',
      backgroundColor: theme.primary_color, 
      display: 'flex', 
      justifyContent: 'center',
      alignItems: 'center',
      overflow: 'hidden',
      touchAction: 'none',
      fontFamily: "'Outfit', sans-serif"
    }}>
      
      {/* Fixed Resolution Container that scales proportionally */}
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
        
        {/* Top Logo Container */}
        <div className="animate-slide-up" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '25px' }}>
          <img 
            src={theme.logo_url} 
            alt="Theme Logo" 
            style={{ width: '220px', objectFit: 'contain' }} 
          />
        </div>

        {/* Form Card */}
        <div 
          className="animate-slide-up delay-200"
          style={{
            backgroundColor: 'white',
            width: '320px',
            border: `6px solid ${theme.secondary_color}`,
            borderRadius: '40px',
            padding: '30px 25px',
            boxShadow: '0 25px 50px rgba(0,0,0,0.3)',
            display: 'flex',
            flexDirection: 'column',
            position: 'relative'
          }}
        >
          {/* Sleek Toggle Switch for Login/Signup */}
          <div style={{ 
            display: 'flex', 
            backgroundColor: '#f5f5f5', 
            borderRadius: '20px', 
            marginBottom: '25px',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{
              position: 'absolute',
              top: 0,
              left: isLogin ? 0 : '50%',
              width: '50%',
              height: '100%',
              backgroundColor: theme.primary_color,
              borderRadius: '25px',
              transition: 'left 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
            }} />
            <button 
              type="button"
              onClick={() => setIsLogin(true)} 
              style={{ flex: 1, padding: '15px', background: 'transparent', border: 'none', color: isLogin ? 'white' : '#666', fontWeight: 'bold', fontSize: '18px', zIndex: 1, cursor: 'pointer', transition: 'color 0.3s ease' }}
            >
              Login
            </button>
            <button 
              type="button"
              onClick={() => setIsLogin(false)} 
              style={{ flex: 1, padding: '15px', background: 'transparent', border: 'none', color: !isLogin ? 'white' : '#666', fontWeight: 'bold', fontSize: '18px', zIndex: 1, cursor: 'pointer', transition: 'color 0.3s ease' }}
            >
              Sign Up
            </button>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column' }}>
            
            <div className="animate-slide-up delay-300">
              <label style={labelStyle}>Name</label>
              <input 
                type="text" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                onFocus={() => setFocusedField('name')}
                onBlur={() => setFocusedField(null)}
                style={inputStyle('name')}
              />
            </div>
            
            <div className="animate-slide-up delay-300">
              <label style={labelStyle}>Phone No.</label>
              <input 
                type="tel" 
                value={phone} 
                onChange={(e) => setPhone(e.target.value)} 
                onFocus={() => setFocusedField('phone')}
                onBlur={() => setFocusedField(null)}
                style={inputStyle('phone')}
              />
            </div>

            {!isLogin && (
              <div className="animate-slide-up delay-300">
                <label style={labelStyle}>Email</label>
                <input 
                  type="email" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField(null)}
                  style={inputStyle('email')}
                />
              </div>
            )}
            
            {error && (
              <div className="animate-slide-up" style={{ color: theme.secondary_color, fontSize: '15px', marginBottom: '20px', textAlign: 'center', fontWeight: 600 }}>
                {error}
              </div>
            )}
            
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '10px' }}>
              <button 
                type="submit" 
                className="animate-slide-up delay-300"
                style={{ 
                  backgroundColor: theme.primary_color, 
                  color: 'white', 
                  padding: '12px 40px', 
                  borderRadius: '30px', 
                  border: 'none',
                  fontWeight: 800,
                  fontSize: '18px',
                  cursor: 'pointer',
                  boxShadow: `0 8px 25px ${theme.primary_color}60`,
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = `0 12px 35px ${theme.primary_color}80`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = `0 8px 25px ${theme.primary_color}60`;
                }}
              >
                Enter
              </button>
            </div>
          </form>

        </div>
      </div>
    </div>
  );
};
