import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';

export const LeaderboardScreen: React.FC = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();

  // Mock leaderboard data
  const leaderboardData = [
    { pos: '1st', name: 'Usman Danjuma', score: 450 },
    { pos: '2nd', name: 'Cynthia Victor', score: 400 },
    { pos: '3rd', name: 'Tunde Smith', score: 380 },
    { pos: '4th', name: 'Julius Dan', score: 375 },
    { pos: '5th', name: 'Nkem Diri', score: 366 },
    { pos: '6th', name: 'Panchak Ali', score: 350 },
    { pos: '7th', name: 'Yusuf James', score: 333 },
    { pos: '8th', name: 'Ola Brown', score: 325 },
    { pos: '9th', name: 'Tamuno Toro', score: 318 },
    { pos: '10th', name: 'Alex Efobi', score: 307 },
    { pos: '11th', name: 'Kunle Usman Obi', score: 285, isCurrentUser: true }, // Current player
  ];

  return (
    <div style={{ 
      height: '100dvh', 
      backgroundColor: '#111', 
      color: 'white', 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      paddingTop: '2rem',
      backgroundImage: `url(${theme.stadium_bg_url})`,
      backgroundSize: 'cover',
      backgroundBlendMode: 'overlay'
    }}>
      
      {/* Top Logo */}
      <img src={theme.logo_url} alt="Logo" style={{ height: '60px', marginBottom: '1rem' }} />
      
      {/* Leaderboard Title Image */}
      <img src={theme.leaderboard_title_url} alt="Leaderboard" style={{ height: '50px', marginBottom: '2rem' }} />

      {/* Leaderboard Table */}
      <div style={{ width: '90%', maxWidth: '400px', flex: 1, overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem', fontWeight: 'bold', borderBottom: '2px solid white' }}>
          <span style={{ width: '20%' }}>Position</span>
          <span style={{ width: '60%', textAlign: 'left' }}>Name</span>
          <span style={{ width: '20%', textAlign: 'right' }}>Score</span>
        </div>
        
        {leaderboardData.map((entry, index) => (
          <div 
            key={index} 
            style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              padding: '0.8rem 0.5rem', 
              borderBottom: `1px solid ${theme.primary_color}`, // Dynamic separation lines
              color: entry.isCurrentUser ? theme.secondary_color : 'white', // Logged in player color
              fontWeight: entry.isCurrentUser ? 'bold' : 'normal'
            }}
          >
            <span style={{ width: '20%' }}>{entry.pos}</span>
            <span style={{ width: '60%', textAlign: 'left' }}>{entry.name}</span>
            <span style={{ width: '20%', textAlign: 'right' }}>{entry.score}</span>
          </div>
        ))}
      </div>

      {/* Exit Button */}
      <button 
        onClick={() => navigate('/games')}
        style={{
          margin: '2rem',
          padding: '0.8rem 3rem',
          backgroundColor: theme.secondary_color, // Dynamic exit button color
          color: 'white',
          border: 'none',
          borderRadius: '20px',
          fontWeight: 'bold',
          fontSize: '1.2rem'
        }}
      >
        EXIT
      </button>

    </div>
  );
};
