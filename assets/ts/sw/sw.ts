/// <reference lib="webworker" />

// ─── Service Worker ───────────────────────────────────────────────────────────
// Precaches every page so the installed app opens without network.
// Pages are self-contained (inline CSS/JS), so caching the HTML is enough.
// SW_VERSION and SW_URLS are injected by Hugo at build time (layouts/partials/pwa.html).

declare const SW_VERSION: string;
declare const SW_URLS: string[];

const sw = self as unknown as ServiceWorkerGlobalScope;
const CACHE_PREFIX = 'kassierer-';
const CACHE_NAME = `${CACHE_PREFIX}${SW_VERSION}`;

sw.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(SW_URLS))
      .then(() => sw.skipWaiting()),
  );
});

sw.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((key) => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME).map((key) => caches.delete(key)),
        ),
      )
      .then(() => sw.clients.claim()),
  );
});

sw.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET' || new URL(request.url).origin !== sw.location.origin) {
    return;
  }
  event.respondWith(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.match(request, { ignoreSearch: true }))
      .then((cached) => cached ?? fetch(request)),
  );
});
