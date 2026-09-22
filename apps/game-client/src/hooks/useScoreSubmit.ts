import { submitScoreAndRefresh, type GameId } from '@celeplay/core-logic';

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

/**
 * Records a finished game's score against the current player.
 *
 * Submission is deliberately best-effort: if the database is unreachable the
 * player still moves on, because losing a leaderboard entry is far less bad
 * than trapping someone on a frozen screen. Failures are logged so they can be
 * diagnosed after the event.
 *
 * The promise RESOLVES once the write has finished, so callers can await it
 * before navigating. Navigating first is what previously made the leaderboard
 * look stale - it fetched before the score had been written.
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
    console.error(`[score] Failed to save "${game}" score of ${score}:`, err);
    return false;
  }
};

/**
 * Waits for a score write, but gives up after `timeoutMs`.
 *
 * A dead connection can leave a request hanging for a long time. Racing the
 * write against a timer means a slow network costs the player a brief pause
 * instead of an indefinite wait. The write itself is not cancelled, so it can
 * still land after the timeout.
 */
export const submitGameScoreWithTimeout = async (
  game: GameId,
  score: number,
  timeoutMs = 4000
): Promise<void> => {
  await Promise.race([
    submitGameScore(game, score),
    new Promise<void>((resolve) => setTimeout(resolve, timeoutMs)),
  ]);
};
