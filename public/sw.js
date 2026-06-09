// DP Work App — Service Worker v2
// Strategy:
//   • App shell & static assets → Cache First (long-lived)
//   • API calls (/api/*)        → Network Only (never cache)
//   • Pages (navigation)        → Network First, fallback to cache, then offline.html

const CACHE_STATIC = 'dp-static-v2';
const CACHE_PAGES  = 'dp-pages-v2';
const OFFLINE_URL  = '/offline.html';

const APP_SHELL = [
  '/',
  '/index.html',
  '/offline.html',
];

// ── Install: pre-cache app shell ──────────────────────────────────────────────
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_STATIC).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting(); // activate immediately
});

// ── Activate: purge old caches ────────────────────────────────────────────────
self.addEventListener('activate', (e) => {
  const current = [CACHE_STATIC, CACHE_PAGES];
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => !current.includes(k)).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// ── Fetch ─────────────────────────────────────────────────────────────────────
self.addEventListener('fetch', (e) => {
  const { request } = e;
  const url = new URL(request.url);

  // Only handle same-origin GET requests
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;

  // 1. API calls — always go to network, never cache
  if (url.pathname.startsWith('/api/')) {
    return; // let browser handle it natively
  }

  // 2. Static assets (Vite hashes filenames) — cache first
  if (url.pathname.startsWith('/assets/')) {
    e.respondWith(
      caches.open(CACHE_STATIC).then(async (cache) => {
        const cached = await cache.match(request);
        if (cached) return cached;
        const res = await fetch(request);
        if (res.ok) cache.put(request, res.clone());
        return res;
      })
    );
    return;
  }

  // 3. Navigation requests — network first, fallback to cache, then offline page
  if (request.mode === 'navigate') {
    e.respondWith(
      fetch(request)
        .then((res) => {
          if (res.ok) {
            caches.open(CACHE_PAGES).then((c) => c.put(request, res.clone()));
          }
          return res;
        })
        .catch(async () => {
          const cached = await caches.match(request);
          return cached || caches.match(OFFLINE_URL);
        })
    );
    return;
  }

  // 4. Everything else — network first, fallback to cache
  e.respondWith(
    fetch(request)
      .then((res) => {
        if (res.ok) {
          caches.open(CACHE_STATIC).then((c) => c.put(request, res.clone()));
        }
        return res;
      })
      .catch(() => caches.match(request))
  );
});

// ── Update notification — tell clients a new SW is waiting ───────────────────
self.addEventListener('message', (e) => {
  if (e.data === 'SKIP_WAITING') self.skipWaiting();
});
