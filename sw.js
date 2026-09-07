// Offline support: precache the app shell, then serve app CODE network-first (newest deploy
// when online, last-cached copy when offline) and heavy/immutable assets cache-first. Bump
// CACHE_VERSION per release. The map engine (lib/maplibre-gl.*) and the self-hosted GeoJSON
// basemap ARE precached so the offline map works from first launch with no connection.
//
// TILE_CACHE holds the raster satellite-tile byte ranges from the external tile source so the
// map works offline once an area has been downloaded/viewed. The Cache API refuses
// to store 206 (Partial Content), so each range is stored as a 200 with the original
// status + Content-Range preserved in custom headers, and rebuilt into a 206 on read.

const CACHE_VERSION = 'mk-v0.529.0';
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
  'js/app-state.js',
  'js/nav-groups.js',
  'js/trail.js',
  'js/screens/home.js',
  'js/screens/weather.js',
  'js/screens/nextstop.js',
  'js/screens/budget.js',
  'js/screens/places.js',
  'js/place-ui.js',
  'js/budget-ui.js',
  'js/weather-ui.js',
  'js/screens/family.js',
  'js/screens/country-info.js',
  'js/screens/settings.js',
  'js/screens/calendar.js',
  'js/screens/journal.js',
  'js/screens/phrasebook.js',
  // The emergency screens and their data. main.js imports all four EAGERLY, so a miss here
  // is not a degraded feature — it is a module-evaluation failure that takes the whole app
  // down offline. They are also, of everything in this list, the files most likely to be
  // opened with no signal.
  'js/screens/medical.js',
  'js/data/emergency.js',
  'js/data/hospitals.curated.js',
  'js/data/medical.js',
  'js/screens/visitors.js',
  'js/screens/share-journey.js',
  'js/journey-share.js',
  'js/visits.js',
  // The full hospital layer: every named hospital, clinic and surgery in the four countries.
  // ~146 KB gzipped for all four, and precached rather than lazily fetched because "nearest
  // hospital" is the one query that has to answer with no signal — including the morning
  // after crossing a border, when the next country's file has never been touched.
  'js/data/drivetimes.js',
  'js/data/hospitals.js',
  'js/data/hospitals.th.js',
  'js/data/hospitals.vi.js',
  'js/data/hospitals.kh.js',
  'js/data/hospitals.la.js',
  'js/render-utils.js',
  'js/lazy-data.js',
  'js/ui-widgets.js',
  'js/state.js',
  'js/social.js',
  'js/tts.js',
  'js/phrase-ui.js',
  'js/translate.js',
  // Interface language. i18n.js and the dictionary MANIFEST are shell. The 29 per-language
  // dictionaries below are not shell — i18n.js now imports only the active one — but they are
  // all still stored offline on purpose: a traveller with no signal must be able to switch the
  // app into a language they can read, which is exactly the moment they cannot download it.
  // ~5 KB each, warmed on idle, so this costs nothing at launch.
  'js/i18n.js',
  'js/data/ui-strings.js',
  'js/data/ui-strings.th.js',
  'js/data/ui-strings.vi.js',
  'js/data/ui-strings.km.js',
  'js/data/ui-strings.lo.js',
  'js/data/ui-strings.zh-CN.js',
  'js/data/ui-strings.zh-TW.js',
  'js/data/ui-strings.ms.js',
  'js/data/ui-strings.id.js',
  'js/data/ui-strings.ko.js',
  'js/data/ui-strings.ja.js',
  'js/data/ui-strings.hi.js',
  'js/data/ui-strings.ru.js',
  'js/data/ui-strings.fr.js',
  'js/data/ui-strings.es.js',
  'js/data/ui-strings.de.js',
  'js/data/ui-strings.he.js',
  'js/data/ui-strings.ar.js',
  'js/data/ui-strings.pt.js',
  'js/data/ui-strings.it.js',
  'js/data/ui-strings.nl.js',
  'js/data/ui-strings.fa.js',
  'js/data/ui-strings.ur.js',
  'js/data/ui-strings.pl.js',
  'js/data/ui-strings.tr.js',
  'js/data/ui-strings.uk.js',
  'js/data/ui-strings.cs.js',
  'js/data/ui-strings.sv.js',
  'js/data/ui-strings.bn.js',
  'js/data/ui-strings.tl.js',
  'js/journey.js',
  'js/util.js',
  'js/map.js',
  'js/currency.js',
  'js/weather.js',
  'js/idb.js',
  'js/exporter.js',
  'js/vault.js',
  'js/personal.js',
  'js/gamify.js',
  'js/reminders.js',
  'js/data/regions.js',
  'js/data/regions.th.js',
  'js/data/regions.vi.js',
  'js/data/regions.kh.js',
  'js/data/regions.la.js',
  'js/data/regions.info.js',
  'js/data/zones.js',
  'js/data/history.js',
  'js/data/geo.js',
  'js/data/place-merges.js',
  'js/data/allergens.js',
  'js/data/diet.js',
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
  'js/data/history.cities.th.js',
  'js/data/local.vi.js',
  'js/data/history.cities.vi.js',
  'js/data/local.kh.js',
  'js/data/history.cities.kh.js',
  'js/data/local.la.js',
  'js/data/history.cities.la.js',
  'js/data/itineraries.js',
  'js/data/produce.js',
  'js/data/essentials.js',
  'js/data/accessibility.js',
  'js/data/arrival.js',
  'js/data/visa.js',
  'js/data/scams.js',
  'js/data/family.js',
  'js/data/pools.js',
  'js/data/photos.js',
  'js/data/sounds.js',
  'js/data/borders.js',
  'js/data/borders_lines.js',
  'js/data/transit.js',
  'js/data/schedules.js',
  'js/data/basemap.js',
  'lib/maplibre-gl.js',
  'lib/maplibre-gl.css',
  // The display face. The vietnamese subsets are listed even though a Latin-only screen
  // never requests them — unicode-range means the browser skips a subset until a character
  // needs it, and offline is exactly when a Vietnamese place name must still render.
  'lib/fonts/bevietnampro-700-latin.woff2',
  'lib/fonts/bevietnampro-700-vietnamese.woff2',
  'lib/fonts/bevietnampro-800-latin.woff2',
  'lib/fonts/bevietnampro-800-vietnamese.woff2',
];

self.addEventListener('install', (e) => {
  // Install now caches ONLY the navigation fallback, and nothing else.
  //
  // It used to precache all 126 PRECACHE entries here (6.7 MB) with {cache:'reload'}, which
  // forced a full second download of every file the PAGE was fetching at that same moment —
  // on a 0.65 Mbps mobile link that is minutes of contention against the traveller's own
  // first navigations. The offline promise is unchanged: warmCache() below stores the same
  // set, but only once the page reports it is idle, and it SKIPS anything the page already
  // pulled through the fetch handler, so nothing is ever downloaded twice.
  e.waitUntil((async () => {
    const c = await caches.open(CACHE_VERSION);
    for (const u of CRITICAL) { await c.add(new Request(u, { cache: 'reload' })); }
    await self.skipWaiting();
  })());
});

// Fill the offline copy in the background, on the page's signal (see 'warm-cache' below).
// Deliberately gentle: 4 concurrent requests, skip what is already stored, and give anything
// that failed one retry before reporting it — a phone radio or a captive portal drops part of
// a wide burst, and every failure here is caught, so a silent hole would only surface later
// as an empty screen with no signal.
let warming = false;
async function warmCache() {
  if (warming) return;
  warming = true;
  try {
    const c = await caches.open(CACHE_VERSION);
    const todo = [];
    for (const u of PRECACHE) {
      if (!(await c.match(u, { ignoreSearch: true }))) todo.push(u);
    }
    const BATCH = 4;
    const failed = [];
    for (let i = 0; i < todo.length; i += BATCH) {
      await Promise.all(todo.slice(i, i + BATCH).map(
        // 'no-cache' revalidates rather than re-downloading: for a file this session already
        // has it is a cheap 304, and it still cannot serve a stale copy from a previous
        // deploy's HTTP cache into this version's cache.
        (u) => c.add(new Request(u, { cache: 'no-cache' })).catch(() => { failed.push(u); }),
      ));
    }
    const stillMissing = [];
    for (const u of failed) { await c.add(u).catch(() => { stillMissing.push(u); }); }
    if (stillMissing.length) {
      self.__mkPrecacheMissing = stillMissing;
      const clients = await self.clients.matchAll({ includeUncontrolled: true });
      for (const client of clients) {
        client.postMessage({ type: 'precache-incomplete', missing: stillMissing });
      }
    }
  } finally {
    warming = false;
  }
}

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      // keep the current app-shell cache AND the tile cache (offline map packs)
      // AND the TTS pack cache (offline phrase audio) across version bumps
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_VERSION && k !== TILE_CACHE && k !== TTS_CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

// Navigation timeout. The navigation no longer blocks the launch (see the isNav branch: the
// cached shell is served immediately and this fetch runs behind it), so this is now just the
// deadline on that BACKGROUND refresh — the point at which a stalled connection stops holding
// the worker alive for a copy of index.html it is never going to deliver.
const NAV_TIMEOUT_MS = 3000;

// Deadlines for everything else the worker fetches. Navigation was the only request kind
// that could ever give up: every other branch below awaited a bare fetch(), which on a
// captive portal or a half-connected VPN neither resolves nor rejects. The consequences
// were not cosmetic — a hung SUB-RESOURCE fetch is a lazily-loaded screen module that
// never arrives, so the app sits on its loading card indefinitely with no error and no
// retry, and a hung fetch inside the offline-pack loops stalls the whole download at
// whatever percentage it had reached.
//
// Longer than NAV_TIMEOUT_MS because these are not racing a cached shell that is already
// on the device — timing one out costs the traveller the thing they asked for, so it is
// worth waiting out a genuinely slow link first. Timing out returns the same 504 the
// offline path returns, which every caller already handles.
const SUB_TIMEOUT_MS = 10000;    // js/css/json — a screen module the app is waiting on
const ASSET_TIMEOUT_MS = 20000;  // map engine, fonts, geojson — large but rarely needed
const MEDIA_TIMEOUT_MS = 12000;  // map tiles and phrase audio — degrade quietly

function withTimeout(promise, ms) {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('timeout')), ms);
    promise.then((v) => { clearTimeout(t); resolve(v); }, (err) => { clearTimeout(t); reject(err); });
  });
}

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (TILE_HOSTS.includes(url.hostname)) { e.respondWith(handleTile(req)); return; }
  // Offline phrase audio: serve downloaded TTS clips cache-first (opaque cross-origin
  // responses are fine to store and replay through an <audio> element).
  if (url.hostname === TTS_HOST) { e.respondWith(handleTTS(req)); return; }
  if (url.origin !== self.location.origin) return;

  // App CODE. Split by request kind, because navigations and sub-resources want opposite
  // strategies on a weak connection.
  //
  // This used to be NETWORK-FIRST for everything, to stop a deploy showing stale code. The
  // cost of that was paid on EVERY launch: the app statically loads dozens of modules, and
  // network-first revalidated all of them before rendering. Against a ~600 ms RTT mobile link
  // that is tens of seconds of waiting for bytes the device already had, and fetch() does not
  // reject on a slow network — only on a failed one — so there was no fallback to the cache
  // while the user watched a splash screen.
  //
  //   • NAVIGATION  → network-first, but RACED AGAINST A TIMEOUT, then the cached shell. Keeps
  //     a fresh deploy visible on the launch it lands, without letting a crawling connection
  //     hold a blank screen.
  //   • SUB-RESOURCE (js/css/json) → CACHE-FIRST. The cache is scoped to CACHE_VERSION and
  //     activate() drops every other cache, so a hit is by construction the code of THIS
  //     build: there is nothing to revalidate against. A new release bumps CACHE_VERSION,
  //     which empties the cache and refetches, and main.js shows the update toast.
  // Heavy, rarely-changing assets (map engine, images, fonts) stay cache-first below.
  const p = url.pathname;
  const isNav = req.mode === 'navigate';
  const heavy = p.startsWith('/lib/') || /\.(png|jpe?g|webp|gif|svg|ico|woff2?|ttf|otf|geojson)$/.test(p);
  const isSub = /\.(js|css|json|webmanifest|html)$/.test(p);

  if (isNav) {
    // STALE-WHILE-REVALIDATE, not network-first-with-a-timeout.
    //
    // Every sub-resource is already served cache-first from this version's own cache, so by
    // the time a returning traveller launches the app, the entire application is on the
    // device. The navigation was the one request still going to the network first, and it
    // held the whole launch: on a slow link that is up to NAV_TIMEOUT_MS of blank screen
    // before falling back to a shell that was sitting in the cache the entire time. On a
    // hotel connection that accepts the request and stalls, it was that wait on every single
    // launch, to end up exactly where it started.
    //
    // So the cached shell is served immediately when there is one — the app opens at local
    // speed on any network, including none — and the network copy is fetched behind it and
    // written back for next time. A deploy is therefore not lost, only deferred by one
    // launch, and it does not even wait that long in practice: the service worker's own
    // update check runs on load and main.js raises the "new version is ready" toast in the
    // same session. That is a better answer than making everyone wait to find out.
    e.respondWith((async () => {
      const cache = await caches.open(CACHE_VERSION);
      const cached = await cache.match('index.html');
      const fresh = withTimeout(fetch(req, { cache: 'no-cache' }), NAV_TIMEOUT_MS)
        .then((res) => {
          if (res && res.ok) cache.put('index.html', res.clone()).catch(() => { /* storage full */ });
          return res;
        })
        .catch(() => null);
      if (cached) {
        // Keep the worker alive for the background refresh; the traveller is not waiting on it.
        e.waitUntil(fresh);
        return cached;
      }
      // First ever launch: there is nothing cached to be fast with, so the network it is.
      return (await fresh) || Response.error();
    })());
    return;
  }

  if (isSub && !heavy) {
    e.respondWith((async () => {
      const cache = await caches.open(CACHE_VERSION);
      const hit = await cache.match(req, { ignoreSearch: true });
      if (hit) return hit;
      try {
        const res = await withTimeout(fetch(req, { cache: 'no-cache' }), SUB_TIMEOUT_MS);
        if (res && res.ok) cache.put(req, res.clone()).catch(() => { /* storage full */ });
        return res;
      } catch {
        return new Response('offline and uncached: ' + req.url, { status: 504 });
      }
    })());
    return;
  }

  // Heavy / immutable same-origin assets (map engine, images, fonts): cache-first, then network.
  e.respondWith(
    caches.match(req, { ignoreSearch: true }).then((hit) => {
      if (hit) return hit;
      return withTimeout(fetch(req), ASSET_TIMEOUT_MS).then((res) => {
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
    const res = await withTimeout(fetch(req), MEDIA_TIMEOUT_MS);
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
    const res = await withTimeout(fetch(req), MEDIA_TIMEOUT_MS);
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
  } else if (d.type === 'warm-cache') {
    // The page has finished loading and gone idle, so filling the offline copy can no longer
    // steal bandwidth from what the traveller is actually looking at.
    e.waitUntil(warmCache());
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
        const res = await withTimeout(fetch(url, { mode: 'no-cors' }), MEDIA_TIMEOUT_MS);
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
        const res = await withTimeout(fetch(url), MEDIA_TIMEOUT_MS);
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
