/**
 * Firebase Realtime Database access over plain REST.
 *
 * Deliberately uses the REST API rather than the Firebase SDK - the same
 * approach as the Unity project. No SDK, no API key, no web-app config and no
 * authentication are involved. Every call is just HTTP against the database URL
 * with a `.json` suffix.
 *
 * Data shape:
 *
 *   players_public/{key}      -> { name, createdAt }        (world readable)
 *   players_private/{key}     -> { phone }                  (NOT readable)
 *   scores/{key}/{game}       -> { score, updatedAt }       (world readable)
 *   leaderboard/{key}         -> { name, total, games }     (world readable)
 *
 * Phone numbers live in a separate node whose read rule is false, so they can
 * never be fetched over HTTP. The owner can still see and export them from the
 * Firebase console, which ignores rules.
 *
 * `key` is the phone number reduced to digits. That means the key itself hints
 * at the phone number, but the full list is not retrievable.
 */

const DATABASE_URL =
  (import.meta.env?.VITE_FIREBASE_DATABASE_URL as string | undefined) ??
  'https://celeplay-69096-default-rtdb.firebaseio.com';

/** Builds a REST URL for a database path, e.g. DbURL('players_public') */
export const dbUrl = (path: string): string =>
  `${DATABASE_URL.replace(/\/$/, '')}/${path}.json`;

export interface PublicPlayer {
  name: string;
  createdAt: number;
}

export interface LeaderboardEntry {
  playerKey: string;
  name: string;
  total: number;
  games: number;
  updatedAt: number;
}

export interface PlayerScore {
  score: number;
  updatedAt: number;
}

/**
 * Games that are actually reachable in the app.
 *
 * Only games with a tile on the game-selection screen belong here. Kalendily,
 * Layerz and Flipizi still have screens and routes but no tile, so nobody can
 * play them - listing them would let a phantom score create a leaderboard entry.
 */
export const GAMES = ['duolock', 'square15', 'wordmesh', 'guexta'] as const;

export type GameId = (typeof GAMES)[number];

/**
 * Normalises a phone number into a stable database key.
 *
 * Nigerian numbers are written two ways: locally with a leading zero
 * ("08012345678") and internationally without it ("+2348031234567"). Stripping
 * non-digits alone leaves these as DIFFERENT keys, which would let one person
 * register twice and split their scores across two leaderboard rows. So we
 * canonicalise to the international form.
 */
export const playerKeyFor = (phone: string): string => {
  const digits = phone.replace(/\D/g, '');

  if (digits.length === 11 && digits.startsWith('0')) return `234${digits.slice(1)}`;
  if (digits.length === 10) return `234${digits}`;
  return digits;
};

/** Minimal JSON PUT, mirroring the Unity UnityWebRequest "PUT" calls. */
const put = async (path: string, body: unknown): Promise<void> => {
  const res = await fetch(dbUrl(path), {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error(`PUT ${path} failed: ${res.status} ${await res.text()}`);
  }
};

/** Minimal JSON GET. Returns null for a missing path, like Firebase does. */
const getJson = async <T>(path: string): Promise<T | null> => {
  const res = await fetch(dbUrl(path));
  if (!res.ok) {
    throw new Error(`GET ${path} failed: ${res.status} ${await res.text()}`);
  }
  const data = (await res.json()) as T | null;
  return data ?? null;
};

/**
 * Saves a player, splitting personal data across two nodes.
 *
 * The name goes to the world-readable node so the leaderboard can show it. The
 * phone number goes to the private node that no client can read.
 */
export const savePlayer = async (name: string, phone: string): Promise<string> => {
  const playerKey = playerKeyFor(phone);
  if (!playerKey) throw new Error('A phone number is required.');

  const existing = await getJson<PublicPlayer>(`players_public/${playerKey}`);

  const [publicResult, privateResult] = await Promise.allSettled([
    put(`players_public/${playerKey}`, {
      name: name.trim(),
      // Preserve the original registration time on repeat sign-ins.
      createdAt: existing?.createdAt ?? Date.now(),
    }),
    put(`players_private/${playerKey}`, { phone: phone.trim() }),
  ]);

  // The public write is what matters for gameplay, so surface that failure.
  if (publicResult.status === 'rejected') throw publicResult.reason;

  // A failed private write only means the number cannot be exported later.
  if (privateResult.status === 'rejected') {
    console.error('[player] phone number could not be stored:', privateResult.reason);
  }

  return playerKey;
};

/** Reads the public half of a player record. */
export const getPublicPlayer = async (playerKey: string): Promise<PublicPlayer | null> =>
  getJson<PublicPlayer>(`players_public/${playerKey}`);

/**
 * Records a score, keeping only the player's best result per game.
 *
 * Read-then-write rather than a transaction, because the REST API would need
 * extra plumbing for that. Two simultaneous finishes from the SAME player could
 * race, so the write re-checks: it only overwrites when the new score is higher.
 */
export const submitScore = async (
  phone: string,
  game: GameId,
  score: number
): Promise<number> => {
  const playerKey = playerKeyFor(phone);
  if (!playerKey) throw new Error('A phone number is required.');

  const current = await getJson<PlayerScore>(`scores/${playerKey}/${game}`);
  if (current && current.score >= score) return current.score;

  await put(`scores/${playerKey}/${game}`, { score, updatedAt: Date.now() });
  return score;
};

/** Reads every score for one player, keyed by game. */
export const getPlayerScores = async (phone: string): Promise<Record<string, number>> => {
  const playerKey = playerKeyFor(phone);
  if (!playerKey) return {};

  const raw = (await getJson<Record<string, PlayerScore>>(`scores/${playerKey}`)) ?? {};
  const scores: Record<string, number> = {};
  for (const [game, entry] of Object.entries(raw)) scores[game] = entry.score;
  return scores;
};

/**
 * Recomputes and stores a player's leaderboard total.
 *
 * Total is the sum of that player's best score in each game, which is the agreed
 * scoring rule. Called after every successful score submission so the mirror
 * node never drifts from the underlying scores.
 */
export const refreshLeaderboardEntry = async (phone: string): Promise<void> => {
  const playerKey = playerKeyFor(phone);
  if (!playerKey) return;

  const [rawScores, player] = await Promise.all([
    getJson<Record<string, PlayerScore>>(`scores/${playerKey}`),
    getJson<PublicPlayer>(`players_public/${playerKey}`),
  ]);

  let total = 0;
  let games = 0;
  for (const [game, entry] of Object.entries(rawScores ?? {})) {
    // Ignore anything not in GAMES so a stray key cannot inflate a total.
    if (!(GAMES as readonly string[]).includes(game)) continue;
    total += entry.score;
    games += 1;
  }

  await put(`leaderboard/${playerKey}`, {
    name: player?.name ?? 'Player',
    total,
    games,
    updatedAt: Date.now(),
  });
};

/** Records a score and refreshes the derived leaderboard row in one call. */
export const submitScoreAndRefresh = async (
  phone: string,
  game: GameId,
  score: number
): Promise<number> => {
  const best = await submitScore(phone, game, score);
  await refreshLeaderboardEntry(phone);
  return best;
};

/**
 * Fetches the whole leaderboard, sorted by total descending.
 *
 * REST has no query syntax for ordering, so the full node is fetched and sorted
 * client-side. That is the same tradeoff the Unity project makes, and it is fine
 * at event scale - but it does mean traffic grows with the number of players.
 */
export const fetchLeaderboard = async (top = 50): Promise<LeaderboardEntry[]> => {
  const raw =
    (await getJson<Record<string, Omit<LeaderboardEntry, 'playerKey'>>>('leaderboard')) ?? {};

  return Object.entries(raw)
    .map(([playerKey, entry]) => ({ playerKey, ...entry }))
    .sort((a, b) => b.total - a.total)
    .slice(0, top);
};
