// Offline support: precache the app shell, serve cache-first. Bump CACHE_VERSION
// per release. The map engine (lib/maplibre-gl.*) and the self-hosted GeoJSON basemap
// ARE precached so the offline map works from first launch with no connection.
//
// TILE_CACHE holds the raster satellite-tile byte ranges from the external tile source so the
// map works offline once an area has been downloaded/viewed. The Cache API refuses
// to store 206 (Partial Content), so each range is stored as a 200 with the original
// status + Content-Range preserved in custom headers, and rebuilt into a 206 on read.

const CACHE_VERSION = 'mk-v0.140.0';
const TILE_CACHE = 'mk-tiles-v1';
const TILE_HOSTS = ['server.arcgisonline.com'];
const TILE_CACHE_MAX = 3000;   // cap stored satellite tiles; evict oldest when exceeded
// Offline phrase-audio packs: online-TTS clips (translate.google.com) the user chooses
// to download per language, so Khmer/Lao (no device voice) still speak with no signal.
const TTS_CACHE = 'mk-tts-v1';
const TTS_HOST = 'translate.google.com';
const TTS_CACHE_MAX = 4000;

// `index.html` is the navigation fallback and so must cache for offline install to
// be meaningful; it is listed in CRITICAL. Everything else is best-effort: a single
// 404 must not abort the whole install (see the resilient addAll below).
const CRITICAL = ['index.html'];
const PRECACHE = [
  'index.html',
  'manifest.webmanifest',
  'css/style.css',
  'icons/icon.svg',
  'icons/apple-touch-icon.png',
  'js/main.js',
  'js/state.js',
  'js/social.js',
  'js/tts.js',
  'js/translate.js',
  'js/journey.js',
  'js/util.js',
  'js/map.js',
  'js/currency.js',
  'js/weather.js',
  'js/idb.js',
  'js/vault.js',
  'js/data/regions.js',
  'js/data/history.js',
  'js/data/geo.js',
  'js/data/allergens.js',
  'js/data/nature.js',
  'js/data/checklist.js',
  'js/data/bestof.js',
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
  'js/data/places.vi.js',
  'js/data/prices.vi.js',
  'js/data/routes.vi.js',
  'js/data/info.vi.js',
  'js/data/places.kh.js',
  'js/data/prices.kh.js',
  'js/data/routes.kh.js',
  'js/data/info.kh.js',
  'js/data/places.la.js',
  'js/data/prices.la.js',
  'js/data/routes.la.js',
  'js/data/info.la.js',
  'js/data/places.th.ext.js',
  'js/data/places.vi.ext.js',
  'js/data/places.kh.ext.js',
  'js/data/places.la.ext.js',
  'js/data/guide.th.js',
  'js/data/guide.vi.js',
  'js/data/guide.kh.js',
  'js/data/guide.la.js',
  'js/data/events.th.js',
  'js/data/events.vi.js',
  'js/data/events.kh.js',
  'js/data/events.la.js',
  'js/data/food.th.js',
  'js/data/food.vi.js',
  'js/data/food.kh.js',
  'js/data/food.la.js',
  'js/data/food.th.ext.js',
  'js/data/food.vi.ext.js',
  'js/data/food.kh.ext.js',
  'js/data/food.la.ext.js',
  'js/data/local.th.js',
  'js/data/local.vi.js',
  'js/data/local.kh.js',
  'js/data/local.la.js',
  'js/data/itineraries.js',
  'js/data/produce.js',
  'js/data/essentials.js',
  'js/data/accessibility.js',
  'js/data/arrival.js',
  'js/data/visa.js',
  'js/data/pools.js',
  'js/data/photos.js',
  'js/data/borders.js',
  'js/data/borders_lines.js',
  'js/data/schedules.js',
  'js/data/basemap.js',
  'lib/maplibre-gl.js',
  'lib/maplibre-gl.css',
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_VERSION).then(async (c) => {
      // Critical shell must cache for the install to be useful; fail the install if it cannot.
      await c.addAll(CRITICAL);
      // The rest is best-effort: cache each file independently so one missing/renamed
      // asset cannot abort the entire offline install (the old atomic addAll did).
      await Promise.all(PRECACHE.map((u) => c.add(u).catch(() => { /* skip this asset */ })));
      await self.skipWaiting();
    }),
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      // keep the current app-shell cache AND the tile cache (offline map packs)
      // AND the TTS pack cache (offline phrase audio) across version bumps
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_VERSION && k !== TILE_CACHE && k !== TTS_CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (TILE_HOSTS.includes(url.hostname)) { e.respondWith(handleTile(req)); return; }
  // Offline phrase audio: serve downloaded TTS clips cache-first (opaque cross-origin
  // responses are fine to store and replay through an <audio> element).
  if (url.hostname === TTS_HOST) { e.respondWith(handleTTS(req)); return; }
  if (url.origin !== self.location.origin) return;
  // same-origin app shell: cache-first, then network (runtime-caches map libs too)
  e.respondWith(
    caches.match(req, { ignoreSearch: true }).then((hit) => {
      if (hit) return hit;
      return fetch(req).then((res) => {
        if (res.ok) { const copy = res.clone(); caches.open(CACHE_VERSION).then((c) => c.put(req, copy)); }
        return res;
      }).catch(() => {
        if (req.mode === 'navigate') return caches.match('index.html');
        throw new Error('offline and uncached: ' + req.url);
      });
    }),
  );
});

// Range-aware tile caching. Key by URL + range so each tile range is its own entry.
async function handleTile(req) {
  const range = req.headers.get('range') || 'full';
  const cache = await caches.open(TILE_CACHE);
  const keyUrl = req.url + (req.url.includes('?') ? '&' : '?') + '__r=' + encodeURIComponent(range);
  const hit = await cache.match(keyUrl);
  if (hit) return rebuildRanged(hit);
  try {
    const res = await fetch(req);
    if (res.status === 200 || res.status === 206) {
      const buf = await res.clone().arrayBuffer();
      const stored = new Response(buf, { status: 200, headers: {
        'Content-Type': res.headers.get('Content-Type') || 'application/octet-stream',
        'x-orig-status': String(res.status),
        'x-content-range': res.headers.get('Content-Range') || '',
      } });
      await cache.put(keyUrl, stored);
    }
    return res;
  } catch (err) {
    return new Response('', { status: 504, statusText: 'offline: tile not downloaded' });
  }
}

async function rebuildRanged(stored) {
  const buf = await stored.arrayBuffer();
  const origStatus = Number(stored.headers.get('x-orig-status')) || 200;
  const cr = stored.headers.get('x-content-range') || '';
  const headers = { 'Content-Type': stored.headers.get('Content-Type') || 'application/octet-stream', 'Accept-Ranges': 'bytes' };
  if (cr) headers['Content-Range'] = cr;
  return new Response(buf, { status: origStatus === 206 ? 206 : 200, headers });
}

// Phrase-audio: serve a downloaded clip cache-first; otherwise fetch (opaque) and, when
// online, cache a copy so the next play works offline too. Never throws — a failed fetch
// while offline+uncached surfaces as an <audio> error the caller already handles.
async function handleTTS(req) {
  const cache = await caches.open(TTS_CACHE);
  const hit = await cache.match(req, { ignoreVary: true });
  if (hit) return hit;
  try {
    const res = await fetch(req);
    if (res && (res.ok || res.type === 'opaque')) { cache.put(req, res.clone()).catch(() => {}); }
    return res;
  } catch {
    return new Response('', { status: 504, statusText: 'offline: audio not downloaded' });
  }
}

// "Download this area for offline": the page posts the satellite-tile URLs covering the
// current view; we fetch each FULL tile and store it under the same '__r=full' key that
// handleTile() reads for non-ranged requests, so the area then renders with no signal.
self.addEventListener('message', (e) => {
  const d = e.data || {};
  if (d.type === 'PREFETCH_TILES' && Array.isArray(d.urls)) {
    // `protect` = tile URLs of already-saved packs; the cap must never evict them.
    e.waitUntil(prefetchTiles(d.urls.slice(0, 1200), e.source, Array.isArray(d.protect) ? d.protect : []));
  } else if (d.type === 'DELETE_TILES' && Array.isArray(d.urls)) {
    e.waitUntil(deleteTiles(d.urls.slice(0, 1200), e.source));
  } else if (d.type === 'PREFETCH_TTS' && Array.isArray(d.urls)) {
    e.waitUntil(prefetchTTS(d.urls.slice(0, 2000), e.source, d.lang || ''));
  }
});

// Download an audio pack: fetch each TTS clip no-cors and store the opaque response.
// Runs inside the service worker, so the page's meta-CSP connect-src does not apply.
async function prefetchTTS(urls, client, lang) {
  const cache = await caches.open(TTS_CACHE);
  let done = 0, ok = 0, quotaHit = false;
  for (const url of urls) {
    try {
      if (await cache.match(url, { ignoreVary: true })) { ok++; }
      else {
        const res = await fetch(url, { mode: 'no-cors' });
        if (res && (res.ok || res.type === 'opaque')) { await cache.put(url, res.clone()); ok++; }
      }
    } catch (err) {
      if (err && err.name === 'QuotaExceededError') { quotaHit = true; break; }
      /* skip this clip */
    }
    done++;
    if (client && done % 10 === 0) client.postMessage({ type: 'TTS_PROGRESS', done, total: urls.length, ok, lang });
  }
  await enforceTTSCap(cache);
  if (client) client.postMessage({ type: 'TTS_DONE', done, total: urls.length, ok, quotaHit, lang });
}

async function enforceTTSCap(cache) {
  try {
    const keys = await cache.keys();
    let over = keys.length - TTS_CACHE_MAX;
    for (let i = 0; i < keys.length && over > 0; i++) { await cache.delete(keys[i]); over--; }
  } catch { /* best-effort */ }
}

// Delete a single saved area's tiles (the page recomputes the same tile URLs the
// area was saved with, so only that pack is removed — other saved areas are kept).
async function deleteTiles(urls, client) {
  const cache = await caches.open(TILE_CACHE);
  let removed = 0;
  for (const url of urls) {
    const keyUrl = url + (url.includes('?') ? '&' : '?') + '__r=' + encodeURIComponent('full');
    try { if (await cache.delete(keyUrl)) removed++; } catch { /* skip */ }
  }
  if (client) client.postMessage({ type: 'DELETE_DONE', removed, total: urls.length });
}

async function prefetchTiles(urls, client, protect = []) {
  const cache = await caches.open(TILE_CACHE);
  let done = 0, ok = 0, quotaHit = false;
  for (const url of urls) {
    const keyUrl = url + (url.includes('?') ? '&' : '?') + '__r=' + encodeURIComponent('full');
    try {
      if (await cache.match(keyUrl)) { ok++; }
      else {
        const res = await fetch(url);
        if (res.ok) {
          const buf = await res.arrayBuffer();
          await cache.put(keyUrl, new Response(buf, { status: 200, headers: {
            'Content-Type': res.headers.get('Content-Type') || 'image/jpeg',
            'x-orig-status': '200', 'x-content-range': '',
          } }));
          ok++;
        }
      }
    } catch (err) {
      if (err && err.name === 'QuotaExceededError') { quotaHit = true; break; } // storage full — stop
      /* otherwise skip this tile */
    }
    done++;
    if (client && done % 25 === 0) client.postMessage({ type: 'PREFETCH_PROGRESS', done, total: urls.length, ok });
  }
  // Protect the tiles of every saved pack (this download's own URLs plus the packs
  // the page recomputed) so the cap only evicts loose browsing tiles.
  const protectedKeys = new Set([...urls, ...protect].map((u) => u + (u.includes('?') ? '&' : '?') + '__r=' + encodeURIComponent('full')));
  await enforceTileCap(cache, protectedKeys);
  if (client) client.postMessage({ type: 'PREFETCH_DONE', done, total: urls.length, ok, quotaHit });
}

// Keep TILE_CACHE bounded: cache.keys() is insertion-ordered, so deleting from the
// front evicts the oldest tiles first (approximate LRU) — but never a tile that
// belongs to a saved offline pack. The cap runs on the prefetch path; tiles cached
// incidentally while browsing are additionally bounded by the browser's own quota.
async function enforceTileCap(cache, protectedKeys = new Set()) {
  try {
    const keys = await cache.keys();
    let over = keys.length - TILE_CACHE_MAX;
    for (let i = 0; i < keys.length && over > 0; i++) {
      if (protectedKeys.has(keys[i].url)) continue;   // saved-pack tile — skip
      await cache.delete(keys[i]);
      over--;
    }
  } catch { /* best-effort */ }
}
