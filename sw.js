// Offline support: precache the whole app on install, serve cache-first.
// Bump CACHE_VERSION with every release so updates roll out cleanly.
// Mirrors the Gardenoosh service worker; no large binaries here, so there is
// no separate runtime cache for immutable assets.

const CACHE_VERSION = 'mk-v0.3.0';

const PRECACHE = [
  './',
  'index.html',
  'manifest.webmanifest',
  'css/style.css',
  'icons/icon.svg',
  'js/main.js',
  'js/state.js',
  'js/tts.js',
  'js/translate.js',
  'js/util.js',
  'js/data/regions.js',
  'js/data/phrasebook.th.js',
  'js/data/phrasebook.vi.js',
  'js/data/phrasebook.km.js',
  'js/data/phrasebook.lo.js',
  'js/data/phrasebook.zh.js',
  'js/data/phrasebook.my.js',
  'js/data/phrasebook.ms.js',
  'js/data/phrasebook.hmn.js',
  'js/data/places.th.js',
  'js/data/prices.th.js',
  'js/data/routes.th.js',
  'js/data/info.th.js',
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    // Atomic: every PRECACHE path must resolve or the whole install fails.
    caches.open(CACHE_VERSION).then((c) => c.addAll(PRECACHE)).then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  e.respondWith(
    caches.match(req, { ignoreSearch: true }).then((hit) => {
      if (hit) return hit;
      return fetch(req).then((res) => {
        if (res.ok) {
          const copy = res.clone();
          caches.open(CACHE_VERSION).then((c) => c.put(req, copy));
        }
        return res;
      }).catch(() => {
        if (req.mode === 'navigate') return caches.match('index.html');
        throw new Error('offline and uncached: ' + req.url);
      });
    }),
  );
});
