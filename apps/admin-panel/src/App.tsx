import React, { useState, useEffect } from 'react';
import './App.css';
import { LoginPage } from './pages/LoginPage';
import { ShieldCheckIcon, GamepadIcon } from './components/icons/Icons';

interface AdminUser {
  email: string;
  role: string;
  name: string;
}

export const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<AdminUser | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('gamoo_admin_session');
    if (saved) {
      try {
        setCurrentUser(JSON.parse(saved));
      } catch {
        localStorage.removeItem('gamoo_admin_session');
      }
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('gamoo_admin_session');
    setCurrentUser(null);
  };

  return (
    <div className="app-container">
      {!currentUser ? (
        <LoginPage onLoginSuccess={(user) => setCurrentUser(user)} />
      ) : (
        <div className="auth-stage">
          <div className="auth-hero-badge">
            <ShieldCheckIcon size={16} />
            <span>AUTHENTICATED • GAMOO GAMES CONTROL</span>
          </div>

          <div className="auth-card">
            <div className="user-avatar-wrap">
              <GamepadIcon size={32} />
            </div>

            <h2>{currentUser.name}</h2>
            <p className="auth-user-role">{currentUser.role}</p>

            <div className="auth-meta-box">
              <div className="meta-item">
                <span className="meta-label">Admin Username</span>
                <span className="meta-value">{currentUser.email}</span>
              </div>
              <div className="meta-item">
                <span className="meta-label">Admin Cluster</span>
                <span className="meta-value">Gamoo Mainframe Node-01</span>
              </div>
              <div className="meta-item">
                <span className="meta-label">Platform URL</span>
                <span className="meta-value">admin.gamoogames.com</span>
              </div>
              <div className="meta-item">
                <span className="meta-label">Security Tier</span>
                <span className="meta-value">Super Admin Full Access</span>
              </div>
            </div>

            <button type="button" className="signout-btn" onClick={handleLogout}>
              Lock Console & Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
