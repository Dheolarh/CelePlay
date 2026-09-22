import React, { createContext, useContext, useEffect, useRef, useCallback } from 'react';
import { useTheme } from './ThemeContext';

interface AudioContextType {
  setBgMusicVolume: (vol: number) => void;
}

const AudioContext = createContext<AudioContextType | undefined>(undefined);

/**
 * Background music element, held outside React.
 *
 * It must survive re-renders AND the provider's effect re-running when the theme
 * resolves. Previously the element was recreated whenever the music URL changed,
 * which briefly left it null - any volume change in that window was silently
 * dropped, which is why sound sometimes did not start after a reload.
 */
let bgMusic: HTMLAudioElement | null = null;
let bgMusicUrl: string | null = null;

/**
 * A small pool of reusable elements for the click sound.
 *
 * Overlapping clicks need more than one element, because replaying an element
 * that is still playing restarts it rather than layering. A pool also replaces
 * the old clone-per-click approach, which created a brand new Audio object on
 * every tap - a new element has never been "unlocked" by a gesture, so those
 * clones were the most likely to be refused by the browser.
 */
const CLICK_POOL_SIZE = 3;
let clickPool: HTMLAudioElement[] = [];
let clickPoolIndex = 0;

/**
 * Whether playback has been unlocked by a real user gesture.
 *
 * Mobile browsers refuse to start audio before the user interacts with the
 * page. Latching this avoids repeated rejected promises and lets a start that
 * was blocked be retried once the gesture arrives.
 */
let audioUnlocked = false;
let pendingBgMusicStart = false;

const createClickPool = () => {
  clickPool = Array.from({ length: CLICK_POOL_SIZE }, () => {
    const el = new Audio('/assets/sounds/click.mp3');
    el.preload = 'auto';
    return el;
  });
  clickPoolIndex = 0;
};

const playClick = () => {
  if (!audioUnlocked || clickPool.length === 0) return;
  // Round-robin so a rapid series of clicks does not cut itself off.
  const el = clickPool[clickPoolIndex];
  clickPoolIndex = (clickPoolIndex + 1) % clickPool.length;
  el.currentTime = 0;
  el.play().catch(() => {});
};

export const AudioProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { theme } = useTheme();

  // Latest requested volume, so music can start later at the right level once
  // the unlock gesture arrives.
  const desiredVolumeRef = useRef(0.5);

  const ensureBgMusic = useCallback((url: string) => {
    if (url) {
      // Reuse the existing element unless the track itself changed.
      if (bgMusic && bgMusicUrl === url) return bgMusic;

      bgMusic?.pause();
      bgMusic = new Audio(url);
      bgMusic.loop = true;
      bgMusic.preload = 'auto';
      bgMusic.volume = desiredVolumeRef.current;
      bgMusicUrl = url;
      return bgMusic;
    }

    // No URL yet (theme still loading): create a silent placeholder so callers
    // always get an element and volume changes are not lost.
    if (!bgMusic) {
      bgMusic = new Audio();
      bgMusic.loop = true;
      bgMusic.volume = desiredVolumeRef.current;
    }
    return bgMusic;
  }, []);

  /**
   * Unlock audio on the first real user gesture.
   *
   * Bound to several event types because which one arrives first varies by
   * browser. Once unlocked, a music start that was previously blocked is retried.
   */
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const unlock = () => {
      if (audioUnlocked) return;
      audioUnlocked = true;

      if (bgMusic && (pendingBgMusicStart || desiredVolumeRef.current > 0)) {
        bgMusic.volume = desiredVolumeRef.current;
        bgMusic
          .play()
          .then(() => {
            pendingBgMusicStart = false;
          })
          .catch(() => {
            // Still refused; keep the flag so a later gesture retries.
            pendingBgMusicStart = true;
          });
      }
    };

    window.addEventListener('pointerdown', unlock);
    window.addEventListener('touchstart', unlock);
    window.addEventListener('keydown', unlock);

    return () => {
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('touchstart', unlock);
      window.removeEventListener('keydown', unlock);
    };
  }, []);

  // Build the click pool once for the lifetime of the app.
  useEffect(() => {
    if (clickPool.length === 0) createClickPool();
  }, []);

  // Global click sound for interactive elements.
  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;

      const isButton = target.closest('button');
      const isAnchor = target.closest('a');
      const cursor = target instanceof Element
        ? window.getComputedStyle(target).cursor
        : '';

      if (isButton || isAnchor || cursor === 'pointer') playClick();
    };

    document.addEventListener('click', handleGlobalClick);
    return () => document.removeEventListener('click', handleGlobalClick);
  }, []);

  // Swap the music track when the theme changes, without tearing down state.
  useEffect(() => {
    if (!theme.bg_music_url) return;
    ensureBgMusic(theme.bg_music_url);

    if (audioUnlocked) {
      bgMusic?.play().catch(() => {
        pendingBgMusicStart = true;
      });
    } else {
      pendingBgMusicStart = true;
    }
  }, [theme.bg_music_url, ensureBgMusic]);

  // Pause when the provider goes away, but keep the shared elements: destroying
  // them would lose the unlocked state on a remount.
  useEffect(() => {
    return () => {
      bgMusic?.pause();
    };
  }, []);

  const setBgMusicVolume = useCallback(
    (vol: number) => {
      desiredVolumeRef.current = vol;

      const el = ensureBgMusic(bgMusicUrl ?? theme.bg_music_url ?? '');
      el.volume = vol;

      if (vol <= 0) return;

      if (audioUnlocked) {
        el.play().catch(() => {
          pendingBgMusicStart = true;
        });
      } else {
        // Defer until the first gesture rather than failing now.
        pendingBgMusicStart = true;
      }
    },
    [ensureBgMusic, theme.bg_music_url]
  );

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
