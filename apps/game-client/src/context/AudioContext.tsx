import React, { createContext, useContext, useEffect, useRef } from 'react';
import { useTheme } from './ThemeContext';

interface AudioContextType {
  setBgMusicVolume: (vol: number) => void;
}

const AudioContext = createContext<AudioContextType | undefined>(undefined);

export const AudioProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { theme } = useTheme();
  
  const bgMusicRef = useRef<HTMLAudioElement | null>(null);
  const clickSoundRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Initialize audio elements
    bgMusicRef.current = new Audio(theme.bg_music_url);
    bgMusicRef.current.loop = true;
    
    clickSoundRef.current = new Audio('/assets/sounds/click.mp3');

    // Global listener to automatically play click sound for all interactive elements
    const handleGlobalClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const isButton = target.closest('button');
      const isAnchor = target.closest('a');
      const computedCursor = window.getComputedStyle(target).cursor;
      
      if (isButton || isAnchor || computedCursor === 'pointer') {
        if (clickSoundRef.current) {
          // Clone the node to allow rapid overlapping clicks
          const soundClone = clickSoundRef.current.cloneNode() as HTMLAudioElement;
          soundClone.volume = 0.6;
          soundClone.play().catch(() => {});
        }
      }
    };

    document.addEventListener('click', handleGlobalClick);

    return () => {
      bgMusicRef.current?.pause();
      bgMusicRef.current = null;
      clickSoundRef.current = null;
      document.removeEventListener('click', handleGlobalClick);
    };
  }, [theme.bg_music_url]);

  const setBgMusicVolume = (vol: number) => {
    if (bgMusicRef.current) {
      bgMusicRef.current.volume = vol;
      if (bgMusicRef.current.paused && vol > 0) {
        bgMusicRef.current.play().catch(e => console.log("BG music autoplay pending interaction:", e));
      }
    }
  };

  return (
    <AudioContext.Provider value={{ setBgMusicVolume }}>
      {children}
    </AudioContext.Provider>
  );
};

export const useAudio = () => {
  const context = useContext(AudioContext);
  if (!context) throw new Error('useAudio must be used within AudioProvider');
  return context;
};
