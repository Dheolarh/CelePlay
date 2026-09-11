import React, { useState } from 'react';
import './LoginPage.css';
import gamooLogo from '../assets/gamoo-logo.webp';
import engineerBg from '../assets/engineer-server.jpg';
import {
  EyeIcon,
  EyeOffIcon,
  UsersIcon,
  AlertTriangleIcon,
} from '../components/icons/Icons';

interface LoginPageProps {
  onLoginSuccess?: (user: { email: string; role: string; name: string }) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!username.trim()) {
      setErrorMessage('Please enter your username.');
      return;
    }
    if (!password) {
      setErrorMessage('Please enter your password.');
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      const authUser = {
        email: username.trim(),
        role: 'Super Administrator',
        name: 'Gamoo Lead Admin',
      };

      localStorage.setItem('gamoo_admin_session', JSON.stringify(authUser));

      if (onLoginSuccess) {
        onLoginSuccess(authUser);
      }
    }, 750);
  };

  return (
    <div className="login-split-container">
      {/* ================= LEFT HERO PANEL ================= */}
      {/* Pure image/video hero section with dark overlay - no text */}
      <div className="hero-panel">
        <img
          src={engineerBg}
          alt="Gamoo Datacenter & Infrastructure"
          className="hero-media"
        />
        <div className="hero-dark-overlay" />
      </div>

      {/* ================= RIGHT FORM PANEL ================= */}
      <div className="form-panel">
        <div className="form-inner">
          {/* Brand Logo */}
          <div className="logo-container">
            <img
              src={gamooLogo}
              alt="Gamoo Games"
              className="brand-logo-img"
            />
          </div>

          {/* Form Header */}
          <div className="form-header">
            <h2 className="form-title">Log In</h2>
            <p className="form-subtitle">Please Enter Your Credentials To Login</p>
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div className="error-box">
              <AlertTriangleIcon size={16} />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Login Form */}
          <form className="login-form" onSubmit={handleSubmit}>
            {/* Username */}
            <div className="form-group">
              <label className="form-label" htmlFor="username">
                Username
              </label>
              <div className="input-container">
                <input
                  id="username"
                  type="text"
                  className="form-input"
                  placeholder=""
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoComplete="username"
                  disabled={isLoading}
                />
                <span className="field-icon">
                  <UsersIcon size={19} />
                </span>
              </div>
            </div>

            {/* Password */}
            <div className="form-group">
              <label className="form-label" htmlFor="password">
                Password
              </label>
              <div className="input-container">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  className="form-input"
                  placeholder="••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOffIcon size={19} /> : <EyeIcon size={19} />}
                </button>
              </div>
            </div>

            {/* Actions: Red Login Button */}
            <div className="form-actions-row">
              <button type="submit" className="login-btn" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <div className="button-spinner" />
                    <span>Logging in...</span>
                  </>
                ) : (
                  <span>Login</span>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
