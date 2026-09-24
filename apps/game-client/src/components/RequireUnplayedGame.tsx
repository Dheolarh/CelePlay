import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { fetchPlayedGames, type GameId } from '@celeplay/core-logic';
import { getStoredPhone } from '../hooks/useScoreSubmit';

interface Props {
  game: GameId;
  children: React.ReactNode;
}

/**
 * Blocks a game route the player has already finished.
 *
 * The game selection screen already greys out played games, but that is only a
 * UI affordance - typing the path directly, or landing on a stale bookmark,
 * would still start a fresh round. This guard closes that gap.
 *
 * It is a convenience check, not a security boundary. The real enforcement is
 * the `!data.exists()` rule on the `played` node, which rejects a second score
 * server-side no matter how the player got here.
 *
 * While the check is in flight the game is not rendered, so a restart can never
 * flash on screen before the redirect happens.
 */
export const RequireUnplayedGame: React.FC<Props> = ({ game, children }) => {
  const [state, setState] = useState<'checking' | 'allowed' | 'blocked'>('checking');

  useEffect(() => {
    const phone = getStoredPhone();

    // No registered player: let the game render as before. There is no score to
    // attribute and the finish handler already reports the missing phone.
    if (!phone) {
      setState('allowed');
      return;
    }

    let cancelled = false;
    fetchPlayedGames(phone)
      .then((played) => {
        if (!cancelled) setState(played.includes(game) ? 'blocked' : 'allowed');
      })
      .catch((err) => {
        // A failed lookup must not lock anyone out mid-event, so fail open.
        console.error(`[games] could not verify play status for "${game}":`, err);
        if (!cancelled) setState('allowed');
      });

    return () => {
      cancelled = true;
    };
  }, [game]);

  if (state === 'checking') {
    // Matches the app background so the pause is not visible as a flash.
    return <div style={{ width: '100vw', height: '100dvh', backgroundColor: '#111' }} />;
  }

  if (state === 'blocked') {
    return <Navigate to="/leaderboard" replace />;
  }

  return <>{children}</>;
};
