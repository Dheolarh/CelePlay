import {
  submitScoreAndRefresh,
  AlreadyPlayedError,
  type GameId,
} from '@celeplay/core-logic';

/** localStorage key holding the phone number of the signed-in player. */
export const PLAYER_PHONE_KEY = 'celeplay:phone';

/** Reads the stored phone number, or null when nobody has registered. */
export const getStoredPhone = (): string | null => {
  try {
    return localStorage.getItem(PLAYER_PHONE_KEY);
  } catch {
    // Private browsing modes can throw on localStorage access.
    return null;
  }
};

/** Builds the URL of a game's screen from its id. */
export const gamePath = (game: GameId): string => `/${game}`;

/**
 * Records a finished game's score against the current player.
 *
 * Submission is deliberately best-effort: if the database is unreachable the
 * player still moves on, because losing a leaderboard entry is far less bad
 * than trapping someone on a frozen screen. Failures are logged so they can be
 * diagnosed after the event.
 *
 * A rejected attempt (the player already finished this game) is treated as a
 * normal outcome rather than an error - the first score is the one that counts,
 * so there is nothing to overwrite and nothing to report.
 */
export const submitGameScore = async (game: GameId, score: number): Promise<boolean> => {
  const phone = getStoredPhone();
  if (!phone) {
    console.warn(`[score] No registered player; "${game}" score of ${score} was not saved.`);
    return false;
  }

  try {
    await submitScoreAndRefresh(phone, game, score);
    return true;
  } catch (err) {
    if (err instanceof AlreadyPlayedError) {
      // Expected when a game is somehow replayed. Not worth surfacing.
      console.info(`[score] "${game}" was already played; keeping the first result.`);
      return false;
    }
    console.error(`[score] Failed to save "${game}" score of ${score}:`, err);
    return false;
  }
};

/**
 * Fires a score submission without waiting for it.
 *
 * The write and the screen transition used to be sequential, which meant every
 * finish sat on the results screen for as long as the network took. The score
 * write is independent of what the player sees next, so it is started and then
 * left to settle in the background. The leaderboard re-fetches when it mounts,
 * which covers the brief moment where the write is still in flight.
 *
 * The returned promise is intentionally not awaited by callers; it resolves to
 * the submission result and rejects only if something unforeseen is thrown.
 */
export const submitGameScoreInBackground = (game: GameId, score: number): void => {
  void submitGameScore(game, score);
};
