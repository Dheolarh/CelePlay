/**
 * Asset manifest for the client.
 *
 * Kept in one place so the Service Worker prefetch list and any in-app
 * preloading stay in sync. Paths are absolute from the site root, matching how
 * they are referenced in the components.
 *
 * PREFETCH_TIERS is ordered by how soon the player needs each group. The Service
 * Worker walks the tiers in order, loading everything within a tier in parallel,
 * so the first screens are never waiting behind game artwork.
 */

const DYNAMIC = '/assets/dynamic';
const STATIC = '/assets/static';

/**
 * Grouped by first-need. Tier order is the priority order:
 *   advert -> registration -> game select -> games -> leaderboard -> splash.
 * Game artwork (DuoLock pairs, Square15 tiles) is last.
 */
export const PREFETCH_TIERS: string[][] = [
  // 1. Advert + registration
  [
    `${STATIC}/codescreenceleplay.webp`,
    `${STATIC}/appstore.webp`,
    `${STATIC}/playstore.webp`,
    `${DYNAMIC}/regLogo.webp`,
    `${DYNAMIC}/banner.webp`,
  ],
  // 2. Game select, including the how-to-play cards shown on tapping a game
  [
    `${DYNAMIC}/gameselectlogo.webp`,
    `${STATIC}/duolock.webp`,
    `${STATIC}/square15.webp`,
    `${DYNAMIC}/Wordmesh white logo.webp`,
    `${DYNAMIC}/GUEXTA WHITE LOGO.webp`,
    `${STATIC}/How to Play - DuoLock.webp`,
    `${STATIC}/How to Play - Square15.webp`,
    `${STATIC}/How to Play - Wordmesh.webp`,
    `${STATIC}/How to Play - Guexta.webp`,
  ],
  // 3. Games (shared chrome)
  [
    `${DYNAMIC}/gameBackground.webp`,
    `${DYNAMIC}/guextaframe.webp`,
    `${DYNAMIC}/lifeline.webp`,
    `${DYNAMIC}/puzzlemaker1.webp`,
    `${STATIC}/S15BG.webp`,
    `${STATIC}/kalendily.webp`,
    `${STATIC}/layerz.webp`,
    `${STATIC}/flipizi.webp`,
  ],
  // 4. Leaderboard, including the promotional flier that appears over it
  [
    `${DYNAMIC}/leaderboard ribbon.webp`,
    `${STATIC}/Call to action Flier.webp`,
  ],
  // 5. Splash
  [
    `${STATIC}/splashscreenceleplay.webp`,
    `${STATIC}/Gamoo logo.webp`,
  ],
  // 6. DuoLock card pairs.
  // All 12 pairs are listed even though a round deals 8: the selection is
  // random, so any of the 12 can be needed and caching only some of them would
  // leave a first-play stutter on whichever pairs happened to be picked.
  [
    ...Array.from({ length: 12 }, (_, i) => `${DYNAMIC}/duolock/${i + 1}a.webp`),
    ...Array.from({ length: 12 }, (_, i) => `${DYNAMIC}/duolock/${i + 1}b.webp`),
  ],
  // 7. Large artwork used by the remaining games
  [
    `${DYNAMIC}/Background 2.webp`,
    `${DYNAMIC}/kalendilybanner.webp`,
    ...Array.from({ length: 10 }, (_, i) => `${DYNAMIC}/${i + 1}.webp`),
    // Square15 has three artwork batches and picks one at random per session,
    // so every batch's full image and tiles are needed. Batch 1 names its tiles
    // `sq0..sq15`; batches 2 and 3 use zero-padded `sq_00..sq_15`.
    `${DYNAMIC}/square15/batch 1/fullimage.webp`,
    ...Array.from({ length: 16 }, (_, i) => `${DYNAMIC}/square15/batch 1/sq${i}.webp`),
    ...['batch 2', 'batch 3'].flatMap((batch) => [
      `${DYNAMIC}/square15/${batch}/fullimage.webp`,
      ...Array.from(
        { length: 16 },
        (_, i) => `${DYNAMIC}/square15/${batch}/sq_${String(i).padStart(2, '0')}.webp`
      ),
    ]),
    `${DYNAMIC}/flipizi/a.webp`,
    `${DYNAMIC}/flipizi/chances.webp`,
    `${DYNAMIC}/flipizi/i.webp`,
    `${DYNAMIC}/flipizi/k.webp`,
    `${DYNAMIC}/flipizi/l.webp`,
    `${DYNAMIC}/flipizi/o.webp`,
    `${DYNAMIC}/flipizi/flipiziwhite logo.webp`,
  ],
];

/** Flat list, useful for a simple "preload everything" loop. */
export const ALL_ASSETS: string[] = PREFETCH_TIERS.flat();
