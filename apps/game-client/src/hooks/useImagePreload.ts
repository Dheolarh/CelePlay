import { useEffect, useState } from 'react';
import { PREFETCH_TIERS, ALL_ASSETS } from '../assets-manifest';

export interface PreloadState {
  /** True once the browser reports all assets are cached. */
  isComplete: boolean;
  /** Assets confirmed cached, for a progress indicator. */
  done: number;
  total: number;
  /** False when Service Workers are unavailable (e.g. non-HTTPS origin). */
  isSupported: boolean;
}

/**
 * Warms the image cache in priority order.
 *
 * The work is split so nothing competes with the first paint:
 *
 *   1. Registration happens immediately, so the worker is active before the
 *      first screen finishes animating in.
 *   2. The small tier-1/2 images (advert, registration, game select) are
 *      preloaded with plain <link rel="preload"> tags, which the browser
 *      prioritises highly.
 *   3. The rest is handed to the Service Worker on requestIdleCallback, so the
 *      bulk download never blocks the UI thread or the critical path.
 */
export const useImagePreload = (): PreloadState => {
  const [state, setState] = useState<PreloadState>({
    isComplete: false,
    done: 0,
    total: ALL_ASSETS.length,
    isSupported: typeof navigator !== 'undefined' && 'serviceWorker' in navigator,
  });

  useEffect(() => {
    // --- Step 2: priority preloads for the first screens ---------------------
    const criticalImages = PREFETCH_TIERS[0].concat(PREFETCH_TIERS[1] ?? []);
    const linkTags: HTMLLinkElement[] = [];
    for (const href of criticalImages) {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = href;
      document.head.appendChild(link);
      linkTags.push(link);
    }

    // --- Step 3: hand the bulk to the Service Worker -------------------------
    let cancelled = false;

    const startBulkPrefetch = async () => {
      if (!('serviceWorker' in navigator)) return;

      try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        // Wait until the worker controls this page, otherwise the message below
        // may be delivered to a worker that is not yet in charge.
        await navigator.serviceWorker.ready;

        const worker = registration.active ?? navigator.serviceWorker.controller;
        if (!worker) return;

        const channel = new MessageChannel();

        channel.port1.onmessage = (event) => {
          if (cancelled) return;
          const data = event.data;
          if (data?.type === 'PROGRESS') {
            setState((prev) => ({ ...prev, done: data.done, total: data.total }));
          } else if (data?.type === 'COMPLETE') {
            setState((prev) => ({ ...prev, isComplete: true, done: data.done, total: data.total }));
          }
        };

        worker.postMessage({ type: 'PREFETCH', tiers: PREFETCH_TIERS }, [channel.port2]);
      } catch (err) {
        // Registration fails on insecure origins. Not fatal: images still load
        // normally, just without the cache benefit.
        console.warn('[preload] Service Worker unavailable:', err);
      }
    };

    // requestIdleCallback keeps the bulk download off the critical path. Safari
    // lacks it, so fall back to a short timeout.
    const idle = (window as unknown as {
      requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
    }).requestIdleCallback;

    let idleHandle: number | undefined;
    let timeoutHandle: ReturnType<typeof setTimeout> | undefined;

    if (typeof idle === 'function') {
      idleHandle = idle(() => { void startBulkPrefetch(); }, { timeout: 2000 });
    } else {
      timeoutHandle = setTimeout(() => { void startBulkPrefetch(); }, 1000);
    }

    return () => {
      cancelled = true;
      linkTags.forEach((tag) => tag.remove());
      if (idleHandle !== undefined && 'cancelIdleCallback' in window) {
        (window as unknown as { cancelIdleCallback: (h: number) => void })
          .cancelIdleCallback(idleHandle);
      }
      if (timeoutHandle !== undefined) clearTimeout(timeoutHandle);
    };
  }, []);

  return state;
};
