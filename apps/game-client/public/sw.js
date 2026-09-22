/**
 * Service Worker: image cache.
 *
 * Purpose is twofold:
 *   1. Serve images from cache so a repeat visit needs no network at all.
 *   2. Prefetch every image in priority order after install, so the first
 *      screens are ready before the player reaches them.
 *
 * This file is plain JavaScript, NOT TypeScript: Service Workers are loaded
 * directly by the browser without any build step, so type annotations would be
 * a syntax error. Keep it untyped.
 *
 * Only GET requests for images are handled. Everything else (JS, CSS, HTML)
 * is left alone, so a code change is never masked by a stale cache - which is
 * the usual way a service worker causes confusing bugs during development.
 */

// Bump this string to invalidate every cached image. Changing it creates a new
// cache and the old one is deleted on activate.
const CACHE_NAME = 'celeplay-images-v1';

/**
 * The request destinations that count as images. Matched by destination rather
 * than by file suffix so query strings do not defeat the lookup.
 */
const IMAGE_DESTINATIONS = ['image'];

/** Files that are images but may be served with a non-image destination. */
const IMAGE_EXTENSIONS = ['.webp', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.avif'];

const isImageRequest = (request) => {
  if (request.method !== 'GET') return false;

  if (IMAGE_DESTINATIONS.includes(request.destination)) return true;

  const url = new URL(request.url);
  return IMAGE_EXTENSIONS.some((ext) => url.pathname.toLowerCase().endsWith(ext));
};

/**
 * Same-origin only.
 *
 * Third-party images (a theme could point at an external URL) are left to the
 * network: we cannot reliably cache them, and caching opaque cross-origin
 * responses adds complexity for little gain.
 */
const isSameOrigin = (request) => {
  try {
    return new URL(request.url).origin === self.location.origin;
  } catch {
    return false;
  }
};

self.addEventListener('install', () => {
  // Take over as soon as possible rather than waiting for existing tabs to close.
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      // Drop caches from previous versions so storage does not grow forever.
      const names = await caches.keys();
      await Promise.all(
        names
          .filter((n) => n !== CACHE_NAME && n.startsWith('celeplay-images-'))
          .map((n) => caches.delete(n))
      );
      await self.clients.claim();
    })()
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  if (!isImageRequest(request) || !isSameOrigin(request)) return;

  // Cache-first: a hit is served immediately with no network access, which is
  // what makes a repeat visit instant.
  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      const cached = await cache.match(request);
      if (cached) return cached;

      try {
        const response = await fetch(request);
        // Only cache complete, successful responses. Caching a 404 or a partial
        // response would make the failure permanent until the cache is cleared.
        if (response.ok && response.status === 200 && response.type === 'basic') {
          cache.put(request, response.clone());
        }
        return response;
      } catch {
        // Offline and not cached: surface a clear failure rather than hanging.
        return new Response('', { status: 504, statusText: 'Offline and not cached' });
      }
    })()
  );
});

/**
 * Prefetch in priority order, driven by the page rather than this worker.
 *
 * The tier list lives in the app so there is a single source of truth. The page
 * posts { type: 'PREFETCH', tiers } once it is idle, and we walk the tiers
 * sequentially, fetching each tier's images in parallel and reporting progress
 * back so the UI can show a loading indicator if it wants to.
 */
self.addEventListener('message', (event) => {
  const data = event.data;
  if (!data || data.type !== 'PREFETCH' || !Array.isArray(data.tiers)) return;

  const port = event.ports && event.ports[0];

  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      let done = 0;
      const total = data.tiers.reduce((n, tier) => n + tier.length, 0);

      for (const tier of data.tiers) {
        // Parallel within a tier, sequential between tiers, so an early tier is
        // never waiting on a later one.
        await Promise.all(
          tier.map(async (url) => {
            try {
              const existing = await cache.match(url);
              if (existing) return;
              const response = await fetch(url);
              if (response.ok && response.status === 200 && response.type === 'basic') {
                await cache.put(url, response);
              }
            } catch {
              // A single missing asset must not abort the whole prefetch.
            } finally {
              done++;
              if (port) port.postMessage({ type: 'PROGRESS', done, total });
            }
          })
        );
      }

      if (port) port.postMessage({ type: 'COMPLETE', done, total });
    })()
  );
});
