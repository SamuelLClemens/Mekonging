// The field guide, on the device, before it is needed.
//
// THE PROBLEM THIS FIXES. Every photo in this app — 527 of them — and every animal call was
// downloaded only when someone looked at it. That is precisely backwards for the way the
// pictures get used: a traveller identifies a snake, a mushroom or a dish while standing in
// front of it, in a forest or a night market, on the connection they have at that moment,
// which is often none. The app would show them the text and a grey box. Worse, the photos they
// HAD collected by browsing were stored in the release-scoped cache, so every deploy threw the
// lot away (see MEDIA_CACHE in sw.js). The most offline-critical content in an offline-first
// app was the only content with no offline story at all.
//
// WHAT IT DOES NOW. On the first launch with a connection the app downloads the field guide by
// itself, in the background, without asking. No opt-in, no settings trip, no "enable offline
// mode" — the traveller who most needs the pictures is the least likely to go looking for a
// download button, and a feature nobody finds is a feature nobody has.
//
// AND WHY IT IS STILL STAGED. The whole pack is 95 MB. Downloading that unannounced over a
// foreign SIM would be a real cost to a real person — roaming data is sold by the megabyte in
// this region — so the size decides the timing, not whether it happens:
//
//   * SAFETY (9 MB) goes immediately, on any connection. Photographs of the 59 species whose
//     records carry `dangerous: true`. If exactly one thing is on the device when the signal
//     goes, it is the pictures of what can hurt you.
//   * GUIDE (61 MB) — the rest of the wildlife, every dish, every market vegetable, and all 40
//     call recordings — waits for a connection that is not metered.
//   * PLACES (25 MB) is the scenery. Last, and unmetered only.
//
// An unknown connection type (Safari exposes no Network Information API, so this is every
// iPhone) counts as unmetered and downloads everything. That is the deliberate choice: the
// alternative — treating unknown as metered — would mean iPhone travellers, most of this app's
// users, silently never get the pack, which is the outcome the whole file exists to prevent.
// It is made safe by being visible and interruptible instead of guarded: `packStatusLine()`
// reports it on Home while it runs, with one tap to stop and wait for Wi-Fi. The OS-level
// "Data Saver" flag (`saveData`) IS honoured as a metered signal, because that one is the
// traveller having already answered this question for every app on the phone.
//
// Then it keeps itself current: every regained connection, every return to the foreground, and
// every launch re-checks and resumes exactly where it stopped. Nothing is re-downloaded — the
// worker skips what it already holds — so a resumed pack costs only what is missing.

import { store, save } from './state.js';
import { PHOTOS } from './data/photos.js';
import { loadData } from './lazy-data.js';
import { netMode } from './ui-widgets.js';

// ---- what a connection is worth --------------------------------------------
// navigator.connection is Chromium-only. `type: 'wifi'` is the strong signal; effectiveType
// describes SPEED, not cost, so it is used only to keep a bulk download off a connection too
// slow to finish one — 2g means minutes per photo, and the traveller is better served by the
// safety tier and a later retry than by a queue that never drains.
function conn() {
  return (typeof navigator !== 'undefined'
    && (navigator.connection || navigator.mozConnection || navigator.webkitConnection)) || null;
}

export function connectionKind() {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return 'offline';
  const c = conn();
  if (!c) return 'unknown';
  if (c.saveData) return 'metered';                       // the traveller's own standing answer
  if (c.type === 'wifi' || c.type === 'ethernet') return 'wifi';
  if (c.type === 'cellular') return 'metered';
  if (c.effectiveType === 'slow-2g' || c.effectiveType === '2g') return 'slow';
  return 'unknown';
}

// Unmetered = safe for the bulk tiers. See the header on why 'unknown' is included.
function unmetered() {
  const k = connectionKind();
  return k === 'wifi' || k === 'unknown';
}

// ---- the manifest ----------------------------------------------------------
// Built from the two registries the screens themselves render from (js/data/photos.js and
// js/data/sounds.js), never from a hand-kept list, so a photo added to the app is in the pack
// by construction and one removed cannot linger as a 404 in a download queue.
//
// The safety tier needs to know which species are dangerous, which lives in js/data/nature.js —
// 400 KB, deliberately kept out of the launch graph (see loadNature() in main.js). So it is
// imported HERE, dynamically, inside a function that only ever runs on idle. Nothing in this
// file is on the critical path.
let _manifest = null;

export async function packManifest() {
  if (_manifest) return _manifest;
  let danger = new Set();
  try {
    const nat = await import('./data/nature.js');
    danger = new Set(nat.allSpecies({ group: 'danger' }).map((s) => s.id));
  } catch { /* offline before nature.js was ever cached; tiers still work, safety is empty */ }
  // Read SOUNDS off the resolved module rather than importing the live binding from
  // lazy-data.js. The binding would work — it is reassigned on load and this awaits that load
  // first — but a static `import { SOUNDS }` here is indistinguishable, to
  // scripts/check-lazy-data.py, from a screen reading route-scoped data without gating it, and
  // it would demand every route in the app gate 'sounds' to satisfy a read that is already
  // gated three lines up. The module object is the honest expression of "I loaded this myself".
  let sounds = {};
  let haveSounds = true;
  try { sounds = (await loadData('sounds')).SOUNDS || {}; } catch { haveSounds = false; }

  const safety = [], nature = [], food = [], produce = [], places = [];
  Object.keys(PHOTOS).forEach((id) => {
    const src = PHOTOS[id] && PHOTOS[id].src;
    if (!src) return;
    if (danger.has(id)) { safety.push(src); return; }
    if (src.startsWith('img/nature/')) nature.push(src);
    else if (src.startsWith('img/food/')) food.push(src);
    else if (src.startsWith('img/produce/')) produce.push(src);
    else if (src.startsWith('img/places/')) places.push(src);
  });
  const calls = Object.keys(sounds).map((id) => sounds[id] && sounds[id].src).filter(Boolean);

  const m = {
    safety,                                   // ~56 files, 9 MB — any connection
    guide: nature.concat(food, produce, calls), // ~371 files, 61 MB — unmetered
    places,                                   // ~140 files, 25 MB — unmetered, last
  };
  m.all = m.safety.concat(m.guide, m.places);
  // Only memoise a COMPLETE manifest. Either dynamic import above can fail on a launch with no
  // signal, and a manifest cached with an empty safety tier or no calls would then mark those
  // tiers complete for the rest of the session — recording a pack that was never downloaded,
  // which is the one outcome worse than not having one.
  if (danger.size && haveSounds) _manifest = m;
  return m;
}

// ---- talking to the worker -------------------------------------------------
// Every byte is fetched and stored by the service worker, not here, for two reasons: it
// survives the page being closed mid-download, and MEDIA_CACHE is the worker's own store, so
// the same code path serves a stored photo back to an <img> later.
function worker() {
  if (typeof navigator === 'undefined' || !navigator.serviceWorker) return null;
  return navigator.serviceWorker.controller;
}

const listeners = new Set();
export function onPackChange(fn) { listeners.add(fn); return () => listeners.delete(fn); }
function emit() { listeners.forEach((fn) => { try { fn(packState()); } catch { /* a repaint failed; the download did not */ } }); }

// Live progress is module state, not stored state: it describes THIS run. What persists is the
// far smaller question of which tiers have completed, so a later launch can skip them without
// re-counting 567 cache entries.
let live = { running: false, tier: '', done: 0, total: 0, bytes: 0 };
let stopped = false;

function packPrefs() {
  const p = store.profile.prefs;
  if (!p.pack) p.pack = { tiers: {}, bytes: 0, deferred: false, quotaHit: false };
  return p.pack;
}

export function packState() {
  const pk = packPrefs();
  return {
    running: live.running, tier: live.tier, done: live.done, total: live.total,
    bytes: live.bytes, storedBytes: pk.bytes || 0, tiers: pk.tiers || {},
    deferred: !!pk.deferred, quotaHit: !!pk.quotaHit, kind: connectionKind(),
  };
}

if (typeof navigator !== 'undefined' && navigator.serviceWorker) {
  navigator.serviceWorker.addEventListener('message', (e) => {
    const d = e.data || {};
    if (d.type === 'MEDIA_PROGRESS') {
      live = { running: true, tier: d.tier, done: d.done, total: d.total, bytes: d.bytes };
      emit();
    } else if (d.type === 'MEDIA_DONE') {
      const pk = packPrefs();
      // A tier counts as done only when every file in it is stored. Anything short of that
      // stays incomplete so the next connection retries the remainder, rather than recording
      // a pack that a captive portal half-delivered as finished.
      if (d.ok >= d.total && d.total > 0) pk.tiers[d.tier] = { at: Date.now(), files: d.ok };
      if (d.quotaHit) pk.quotaHit = true;
      pk.bytes = (pk.bytes || 0) + (d.bytes || 0);
      save();
      live = { running: false, tier: '', done: 0, total: 0, bytes: 0 };
      emit();
      if (!d.quotaHit && !stopped) next();      // straight on to the following tier
    } else if (d.type === 'MEDIA_STATUS') {
      // Reconcile what the app RECORDED against what the cache actually holds, and believe the
      // cache. A Cache Storage bucket without persistent-storage permission can be evicted
      // whole under disk pressure — iOS does this readily — and the driver skips any tier it
      // has recorded as complete. Left unreconciled, one eviction would cost the traveller the
      // entire field guide permanently, with the app still reporting it as downloaded. A tier
      // is kept only if the cache still has every file in it.
      const pk = packPrefs();
      pk.bytes = d.bytes || 0;
      let lost = 0;
      Object.keys(d.stored || {}).forEach((t) => {
        const s = d.stored[t];
        if (pk.tiers[t] && s && s.total > 0 && s.have < s.total) { delete pk.tiers[t]; lost++; }
      });
      save();
      emit();
      if (lost) next();                        // evicted — fetch it again
    }
  });
}

// ---- the driver ------------------------------------------------------------
// Which tier to ask for now, or nothing. Order is fixed and the reason is the point of the
// staging: safety first on any connection, then the guide, then the scenery.
async function nextTier() {
  if (netMode() === 'offline') return null;                     // the traveller turned data off
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return null;
  const pk = packPrefs();
  if (pk.quotaHit) return null;                                 // no room; saying so beats retrying
  const m = await packManifest();
  const need = (t) => !pk.tiers[t] && m[t] && m[t].length;
  if (need('safety')) return 'safety';
  if (pk.deferred || !unmetered()) return null;                 // the rest waits for Wi-Fi
  if (connectionKind() === 'slow') return null;
  if (need('guide')) return 'guide';
  if (need('places')) return 'places';
  return null;
}

let scheduled = false;
async function next() {
  if (live.running || scheduled) return;
  const w = worker();
  if (!w) return;                                  // no worker yet; the launch hook retries
  const tier = await nextTier();
  if (!tier) return;
  const m = await packManifest();
  scheduled = true;
  // A beat between tiers so a 400-file run does not start the next one inside the message
  // handler of the last, and so the first screen paints before any of this begins.
  setTimeout(() => {
    scheduled = false;
    const cur = worker();
    if (!cur || live.running) return;
    live = { running: true, tier, done: 0, total: m[tier].length, bytes: 0 };
    emit();
    cur.postMessage({ type: 'PREFETCH_MEDIA', urls: m[tier], tier });
  }, 400);
}

// Ask the worker what is actually stored, rather than trusting the running total. A cache the
// browser has evicted under storage pressure is the case that matters, and it is invisible
// from here otherwise.
export async function refreshPackStatus() {
  const w = worker();
  if (!w) return;
  const m = await packManifest();
  w.postMessage({ type: 'MEDIA_STATUS', tiers: { safety: m.safety, guide: m.guide, places: m.places } });
}

// "Not now" on the Home status line. Keeps the safety tier — that one is 9 MB and the reason
// the feature exists — and holds the bulk until a Wi-Fi connection appears.
export function deferPack() {
  const pk = packPrefs();
  pk.deferred = true;
  save();
  stopped = true;
  live = { running: false, tier: '', done: 0, total: 0, bytes: 0 };
  emit();
}

export function resumePack() {
  const pk = packPrefs();
  pk.deferred = false;
  pk.quotaHit = false;
  save();
  stopped = false;
  next();
  emit();
}

export function clearPack() {
  const w = worker();
  const pk = packPrefs();
  pk.tiers = {};
  pk.bytes = 0;
  pk.quotaHit = false;
  // Deferred, deliberately. Someone who has just chosen to free 95 MB does not want the app to
  // start downloading it again a second later, and every other trigger in this file — launch, a
  // regained connection, returning to the foreground — would otherwise do exactly that. It
  // comes back on request, or on the next Wi-Fi connection, which is what the confirmation says.
  pk.deferred = true;
  stopped = true;
  save();
  if (w) w.postMessage({ type: 'CLEAR_MEDIA' });
  emit();
}

// Drop photos this build no longer references. Cheap, and it runs once per launch well after
// everything else, so a replaced image cannot accumulate across releases.
async function prune() {
  const w = worker();
  if (!w) return;
  const m = await packManifest();
  w.postMessage({ type: 'PRUNE_MEDIA', urls: m.all });
}

// ---- when it runs ----------------------------------------------------------
// Deliberately last in the launch sequence and behind requestIdleCallback: this is a 95 MB
// background download and it must never compete with the screen the traveller is looking at,
// which is the same reason sw.js stopped precaching at install time.
export function startPack() {
  if (typeof window === 'undefined') return;
  const kick = () => { next().catch(() => {}); };
  const idle = (fn, timeout) => {
    if ('requestIdleCallback' in window) requestIdleCallback(fn, { timeout });
    else setTimeout(fn, Math.min(timeout, 8000));
  };
  // Reconcile the record against the cache BEFORE deciding what to download, so a tier the
  // browser evicted is known to be missing rather than skipped as done (see the MEDIA_STATUS
  // handler). The status reply itself restarts the driver when it finds a gap; this kick covers
  // the ordinary case where nothing was lost and there is simply more to fetch.
  const start = () => { refreshPackStatus().then(kick, kick); };
  // The worker may not control the page on a first-ever load (it activates behind the first
  // paint), and there is nothing to post a message to until it does.
  if (navigator.serviceWorker) {
    navigator.serviceWorker.ready.then(() => idle(start, 15000)).catch(() => {});
    navigator.serviceWorker.addEventListener('controllerchange', kick);
  }
  idle(start, 20000);
  // Regaining a connection is the moment this is worth trying, and the one the old
  // browse-to-cache behaviour could never take advantage of.
  window.addEventListener('online', kick);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) kick(); });
  // Wi-Fi appearing where there was cellular is the trigger for the deferred tiers, and it
  // fires no other event.
  const c = conn();
  if (c && c.addEventListener) c.addEventListener('change', kick);
  idle(() => { prune().catch(() => {}); }, 30000);
  // Persistent storage matters more here than anywhere else in the app: without it the
  // browser may evict the entire field guide under pressure, which is exactly the pack the
  // traveller cannot re-download in the place they need it. Granted silently for an installed
  // PWA, refused silently otherwise — either way it is one call and never blocks anything.
  if (navigator.storage && navigator.storage.persist) {
    navigator.storage.persisted().then((has) => { if (!has) return navigator.storage.persist(); })
      .catch(() => {});
  }
}
