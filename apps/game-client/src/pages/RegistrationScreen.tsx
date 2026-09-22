import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useAudio } from '../context/AudioContext';
import { savePlayer, validateName, validatePhone } from '@celeplay/core-logic';

// Light blue accent used for the form outline, focus lines and primary button.
const ACCENT_BLUE = '#8AB4F8';
// Dark navy used for the primary button fill.
const ACCENT_BLUE_DARK = '#1A3A6B';

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
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation is shared with the rest of the app so the rules cannot drift.
    const nameCheck = validateName(name);
    if (!nameCheck.valid) {
      setError(nameCheck.message ?? 'Enter a valid name.');
      return;
    }
    if (!validatePhone(phone)) {
      setError('Phone number must be 11 digits starting with 0.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      // The phone number identifies the player, so signing in again with the
      // same number retrieves the existing record instead of duplicating it.
      await savePlayer(name, phone);
      localStorage.setItem('celeplay:phone', phone.trim());
      navigate('/games');
    } catch (err) {
      console.error('Registration failed', err);
      setError('Could not reach the server. Check your connection and try again.');
      setIsSubmitting(false);
    }
  };

  const inputStyle = (fieldName: string) => ({
    width: '100%',
    padding: '5px 0',
    fontSize: '16px',
    border: 'none',
    borderBottom: `2px solid ${focusedField === fieldName ? ACCENT_BLUE : '#e0e0e0'}`,
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
      backgroundImage: `url(${theme.stadium_bg_url})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
      display: 'flex', 
      justifyContent: 'center',
      alignItems: 'center',
      overflow: 'hidden',
      touchAction: 'none',
      fontFamily: "'Outfit', sans-serif"
    }}>
      {/* Placeholder styling has to be declared in CSS: pseudo-elements cannot be
          set from inline styles. A lighter grey keeps it clearly distinct from
          typed input while staying legible on the white card. */}
      <style>{`
        .celeplay-input::placeholder {
          color: #9aa0a6;
          opacity: 1;
        }
        .celeplay-input:-webkit-autofill {
          -webkit-text-fill-color: #333;
        }
      `}</style>
      
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
        
        {/* Top Logo.
            Back in the normal flow (rather than absolutely positioned) so the
            logo and the form card below it are centred together as one group.
            The card is what feels off-centre when the logo is pinned separately,
            because the two then have independent vertical positions. */}
        <div
          className="animate-slide-up"
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: '28px',
            width: '100%',
          }}
        >
          <img 
            src={theme.logo_url} 
            alt="Theme Logo" 
            style={{ width: '330px', objectFit: 'contain' }} 
          />
        </div>

        {/* Form Card */}
        <div 
          className="animate-slide-up delay-200"
          style={{
            backgroundColor: 'white',
            width: '320px',
            border: `6px solid ${ACCENT_BLUE}`,
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
              backgroundColor: ACCENT_BLUE_DARK,
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
                placeholder="First name and last name"
                className="celeplay-input"
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
                placeholder="08012345678"
                inputMode="numeric"
                maxLength={11}
                className="celeplay-input"
                onChange={(e) => setPhone(e.target.value)}
                onFocus={() => setFocusedField('phone')}
                onBlur={() => setFocusedField(null)}
                style={inputStyle('phone')}
              />
            </div>

            {error && (
              <div className="animate-slide-up" style={{ color: ACCENT_BLUE_DARK, fontSize: '15px', marginBottom: '20px', textAlign: 'center', fontWeight: 600 }}>
                {error}
              </div>
            )}
            
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '10px' }}>
              <button 
                type="submit" 
                disabled={isSubmitting}
                className="animate-slide-up delay-300"
                style={{ 
                  backgroundColor: ACCENT_BLUE_DARK, 
                  color: 'white', 
                  padding: '12px 40px', 
                  borderRadius: '30px', 
                  opacity: isSubmitting ? 0.6 : 1,
                  cursor: isSubmitting ? 'wait' : 'pointer',
                  fontWeight: 800,
                  fontSize: '18px',
                  boxShadow: `0 8px 25px ${ACCENT_BLUE_DARK}60`,
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = `0 12px 35px ${ACCENT_BLUE_DARK}80`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = `0 8px 25px ${ACCENT_BLUE_DARK}60`;
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
