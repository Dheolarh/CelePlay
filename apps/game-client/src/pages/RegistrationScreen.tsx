import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
// import { validateName, validatePhone, validateEmail } from '@celeplay/core-logic/src/validation';

export const RegistrationScreen: React.FC = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();
  
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [focusedField, setFocusedField] = useState<string | null>(null);

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
    padding: '0.5rem 0',
    fontSize: '1rem',
    border: 'none',
    borderBottom: `2px solid ${focusedField === fieldName ? theme.primary_color : '#e0e0e0'}`,
    backgroundColor: 'transparent',
    color: '#333',
    transition: 'border-color 0.3s ease',
    marginBottom: '1.5rem',
  });

  const labelStyle = {
    display: 'block',
    fontSize: '0.9rem',
    fontWeight: 600,
    color: '#333',
    marginBottom: '0.2rem',
    opacity: 0.8
  };

  return (
    <div style={{ 
      flex: 1,
      minHeight: '100dvh', 
      backgroundColor: theme.primary_color, 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center',
      paddingTop: '2rem',
      paddingBottom: '2rem',
      fontFamily: "'Outfit', sans-serif"
    }}>
      
      {/* Top Logo Container */}
      <div className="animate-slide-up" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '2rem' }}>
        <img 
          src={theme.logo_url} 
          alt="Theme Logo" 
          style={{ width: '90%', maxWidth: '200px', maxHeight: '20vh', objectFit: 'contain' }} 
        />
      </div>

      {/* Form Card */}
      <div 
        className="animate-slide-up delay-200"
        style={{
          backgroundColor: 'white',
          width: '80%',
          maxWidth: '320px',
          border: `6px solid ${theme.secondary_color}`,
          borderRadius: '40px',
          padding: '2.5rem 1.5rem',
          boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
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
          marginBottom: '2rem',
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
            borderRadius: '20px',
            transition: 'left 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
          }} />
          <button 
            type="button"
            onClick={() => setIsLogin(true)} 
            style={{ flex: 1, padding: '0.8rem', background: 'transparent', border: 'none', color: isLogin ? 'white' : '#666', fontWeight: 'bold', zIndex: 1, cursor: 'pointer', transition: 'color 0.3s ease' }}
          >
            Login
          </button>
          <button 
            type="button"
            onClick={() => setIsLogin(false)} 
            style={{ flex: 1, padding: '0.8rem', background: 'transparent', border: 'none', color: !isLogin ? 'white' : '#666', fontWeight: 'bold', zIndex: 1, cursor: 'pointer', transition: 'color 0.3s ease' }}
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
            <div className="animate-slide-up" style={{ color: theme.secondary_color, fontSize: '0.85rem', marginBottom: '1rem', textAlign: 'center', fontWeight: 600 }}>
              {error}
            </div>
          )}
          
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1rem' }}>
            <button 
              type="submit" 
              className="animate-slide-up delay-300"
              style={{ 
                backgroundColor: theme.primary_color, 
                color: 'white', 
                padding: '0.8rem 2.5rem', 
                borderRadius: '25px', 
                border: 'none',
                fontWeight: 800,
                fontSize: '1.1rem',
                cursor: 'pointer',
                boxShadow: `0 4px 14px ${theme.primary_color}40`,
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = `0 6px 20px ${theme.primary_color}60`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = `0 4px 14px ${theme.primary_color}40`;
              }}
            >
              Enter
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
