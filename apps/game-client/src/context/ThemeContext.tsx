import React, { createContext, useContext, useState, useEffect } from 'react';

// Define the Theme structure matching our database schema
export interface Theme {
  id: string;
  code: string;
  name: string;
  primary_color: string;
  secondary_color: string;
  header_banner_url: string;
  logo_url: string;
  leaderboard_title_url: string;
  stadium_bg_url: string;
  bg_music_url: string;
}

// Fallback theme used before a theme is loaded from the backend.
export const fallbackTheme: Theme = {
  id: 'fallback',
  code: 'ALLEN',
  name: '70th Great Aliko',
  primary_color: '#000001',
  secondary_color: '#686767',
  header_banner_url: '/assets/dynamic/banner.webp',
  logo_url: '/assets/dynamic/regLogo.webp',
  leaderboard_title_url: '/assets/dynamic/leaderboard ribbon.webp',
  stadium_bg_url: '/assets/dynamic/gameBackground.webp',
  bg_music_url: '/assets/sounds/bg.mp3',
};

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>(fallbackTheme);

  // Apply CSS variables to the document root whenever the theme changes
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--theme-primary', theme.primary_color);
    root.style.setProperty('--theme-secondary', theme.secondary_color);
    root.style.setProperty('--theme-bg-image', `url(${theme.stadium_bg_url})`);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
