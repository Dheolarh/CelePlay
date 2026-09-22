
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AudioProvider } from './context/AudioContext';
import { AdvertScreen } from './pages/AdvertScreen';
import { SplashScreen } from './pages/SplashScreen';
import { CodeEnterScreen } from './pages/CodeEnterScreen';
import { RegistrationScreen } from './pages/RegistrationScreen';
import { GameSelectionScreen } from './pages/GameSelectionScreen';
import { DuoLockScreen } from './pages/DuoLockScreen';
import { KalendilyScreen } from './pages/KalendilyScreen';
import { LayerzScreen } from './pages/LayerzScreen';
import { Square15Screen } from './pages/Square15Screen';
import { FlipiziScreen } from './pages/FlipiziScreen';
import { WordMeshScreen } from './pages/WordMeshScreen';
import { GuextaScreen } from './pages/GuextaScreen';
import { LeaderboardScreen } from './pages/LeaderboardScreen';
import { useImagePreload } from './hooks/useImagePreload';

function App() {
  // Kicks off image caching immediately on mount, in priority order. The work
  // is scheduled off the critical path inside the hook, so it does not delay
  // the first render.
  useImagePreload();

  return (
    <ThemeProvider>
      <AudioProvider>
        <BrowserRouter>
          <Routes>
            {/* `replace` so the bare "/" is not left on the history stack as an
                extra Back step before the first real screen. */}
            <Route path="/" element={<Navigate to="/advert" replace />} />
            <Route path="/advert" element={<AdvertScreen />} />
            <Route path="/splash" element={<SplashScreen />} />
            <Route path="/code-enter" element={<CodeEnterScreen />} />
            <Route path="/register" element={<RegistrationScreen />} />
            <Route path="/games" element={<GameSelectionScreen />} />
            <Route path="/duolock" element={<DuoLockScreen />} />
            <Route path="/kalendily" element={<KalendilyScreen />} />
            <Route path="/layerz" element={<LayerzScreen />} />
            <Route path="/square15" element={<Square15Screen />} />
            <Route path="/flipizi" element={<FlipiziScreen />} />
            <Route path="/wordmesh" element={<WordMeshScreen />} />
            <Route path="/guexta" element={<GuextaScreen />} />
            <Route path="/leaderboard" element={<LeaderboardScreen />} />
          </Routes>
        </BrowserRouter>
      </AudioProvider>
    </ThemeProvider>
  );
}

export default App;
