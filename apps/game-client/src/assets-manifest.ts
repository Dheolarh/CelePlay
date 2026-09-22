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
  // 2. Game select
  [
    `${DYNAMIC}/gameselectlogo.webp`,
    `${STATIC}/duolock.webp`,
    `${STATIC}/square15.webp`,
    `${DYNAMIC}/Wordmesh white logo.webp`,
    `${DYNAMIC}/GUEXTA WHITE LOGO.webp`,
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
  // 4. Leaderboard
  [
    `${DYNAMIC}/leaderboard ribbon.webp`,
  ],
  // 5. Splash
  [
    `${STATIC}/splashscreenceleplay.webp`,
    `${STATIC}/Gamoo logo.webp`,
  ],
  // 6. DuoLock card pairs
  [
    ...Array.from({ length: 8 }, (_, i) => `${DYNAMIC}/${i + 1}a.webp`),
    ...Array.from({ length: 8 }, (_, i) => `${DYNAMIC}/${i + 1}b.webp`),
  ],
  // 7. Large artwork used by the remaining games
  [
    `${DYNAMIC}/fullimage.webp`,
    `${DYNAMIC}/Background 2.webp`,
    `${DYNAMIC}/kalendilybanner.webp`,
    ...Array.from({ length: 10 }, (_, i) => `${DYNAMIC}/${i + 1}.webp`),
    ...Array.from({ length: 16 }, (_, i) => `${DYNAMIC}/sq${i}.webp`),
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
