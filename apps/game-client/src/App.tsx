import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AdvertScreen } from './pages/AdvertScreen';
import { SplashScreen } from './pages/SplashScreen';
import { CodeEnterScreen } from './pages/CodeEnterScreen';
import { RegistrationScreen } from './pages/RegistrationScreen';
import { GameSelectionScreen } from './pages/GameSelectionScreen';
import { DuoLockScreen } from './pages/DuoLockScreen';
import { LeaderboardScreen } from './pages/LeaderboardScreen';

function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/advert" />} />
          <Route path="/advert" element={<AdvertScreen />} />
          <Route path="/splash" element={<SplashScreen />} />
          <Route path="/code-enter" element={<CodeEnterScreen />} />
          <Route path="/register" element={<RegistrationScreen />} />
          <Route path="/games" element={<GameSelectionScreen />} />
          <Route path="/duolock" element={<DuoLockScreen />} />
          <Route path="/leaderboard" element={<LeaderboardScreen />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
