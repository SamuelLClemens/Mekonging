// The place a live fix is in (traveller fix F3, 2026-10-27).
//
// A fix is snapped to the nearest curated city (WEATHER_SPOTS, 165 anchors) for weather, Nearby and
// the city guide. That is right in a city and wrong in the countryside: a village in Siem Reap
// province, 56 km from the nearest anchor, read "Pursat". The offline place list (F1,
// js/data/gazetteer.<cc>.js) holds the village. This module finds the list entry nearest to the
// fix, once per move, and keeps the answer in prefs.fixPlace so focusSpot() can read it
// synchronously on every render, with no list loaded and no signal.
//
// The list is never added to WEATHER_SPOTS (CLAUDE.md): the entry rides beside its anchor as
// focusSpot().place, the same shape setFocusSpot() stores for a place the traveller picked.
import { store, save } from './state.js';
import { haversineKm } from './util.js';

// A fix farther than this from every curated city is outside the four countries. Measured
// 2026-10-27: 99.9% of the 36,131 list places are within 186 km of an anchor; Singapore, Kuala
// Lumpur, Hong Kong and Kunming are 322 to 751 km away. Penang (165 km) and Yangon (238 km) stay
// labelled by their nearest anchor: no distance separates them from the in-region remote sites.
// The 10 km outline band (countriesNearFix) cannot be the test: it calls 625 islands outside.
export const OUTSIDE_KM = 250;
// Within this of a curated city, the city names the spot, so Bangkok stays "Bangkok" and not the
// subdistrict the phone happens to be in. The same threshold whereAmI() uses for a hub town.
export const ANCHOR_KM = 15;
// A list place farther than this from the fix is not "where you are".
const PLACE_KM = 25;
// A stored answer serves any fix this close to the one it was resolved for.
const SAME_KM = 1;
// The four list files can be slow to arrive on a first launch, while the service worker is still
// installing (seen once in five fresh-profile runs: the imports sat unrequested for 9 s). Each
// attempt waits LOAD_MS, and the whole resolution tries TRIES times, so one stalled attempt neither
// hangs the app on the anchor's name nor blocks the next.
const TRIES = 3, LOAD_MS = 12000, RETRY_MS = 4000;

// One explicit loader per country so the import guards can see each file.
const LOADERS = [
  () => import('./data/gazetteer.th.js'),
  () => import('./data/gazetteer.vi.js'),
  () => import('./data/gazetteer.kh.js'),
  () => import('./data/gazetteer.la.js'),
];
const CC = ['th', 'vi', 'kh', 'la'];

// The stored place for this fix, or null: a fix not resolved yet, resolved to nothing within
// PLACE_KM, or too far from the one that was.
export function fixPlaceFor(fix) {
  const p = store.profile.prefs.fixPlace;
  if (!fix || !p || !p.city) return null;
  return haversineKm(fix, { lat: p.fixLat, lng: p.fixLng }) <= SAME_KM ? p : null;
}

const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const inflight = new Map();   // one resolution per fix, so a tick that repeats the fix does not start another

// Resolves { place, changed } for this fix. Loads the four lists only when the stored answer does
// not cover the fix, and scans their rows without building the search index (about 36,000 splits).
export function resolveFixPlace(fix) {
  if (!fix || fix.lat == null) return Promise.resolve({ place: null, changed: false });
  const old = store.profile.prefs.fixPlace;
  if (old && haversineKm(fix, { lat: old.fixLat, lng: old.fixLng }) <= SAME_KM) return Promise.resolve({ place: fixPlaceFor(fix), changed: false });
  const key = fix.lat.toFixed(2) + ',' + fix.lng.toFixed(2);
  if (inflight.has(key)) return inflight.get(key);
  const run = (async () => {
    for (let n = 0; n < TRIES; n++) {
      const mods = await Promise.all(LOADERS.map((load) => Promise.race([load().catch(() => null), wait(LOAD_MS).then(() => null)])));
      if (mods.some(Boolean)) return remember(fix, nearest(fix, mods));
      // Nothing loaded (offline before the lists were ever cached): store nothing, so a later fix tries again.
      if (n < TRIES - 1) await wait(RETRY_MS);
    }
    return { place: null, changed: false };
  })().finally(() => inflight.delete(key));
  inflight.set(key, run);
  return run;
}

function nearest(fix, mods) {
  let best = null, bestKm = Infinity;
  mods.forEach((g, i) => {
    if (!g) return;
    // Walk the rows in place and read only the latitude field (the third) of each: splitting every
    // line into seven strings cost about 65 ms of CPU a call, nearly all of it on rows that are far away.
    const s = g.ROWS;
    for (let p = 0; p < s.length;) {
      let e = s.indexOf('\n', p);
      if (e < 0) e = s.length;
      const t2 = s.indexOf('\t', s.indexOf('\t', p) + 1);
      const lat = +s.slice(t2 + 1, s.indexOf('\t', t2 + 1));
      if (Math.abs(lat - fix.lat) <= 0.25) {   // about 28 km: cheap reject before the haversine
        const f = s.slice(p, e).split('\t');
        const km = haversineKm(fix, { lat, lng: +f[3] });
        if (km < bestKm) { bestKm = km; best = { g, cc: CC[i], f }; }
      }
      p = e + 1;
    }
  });
  return best && bestKm <= PLACE_KM ? best : null;
}

// Writes the answer through the live store (read now, not before the wait) and says whether it changed.
function remember(fix, best) {
  const prefs = store.profile.prefs;
  const old = prefs.fixPlace;
  const rec = best ? {
    gz: true, country: best.cc, city: best.f[0], lat: +best.f[2], lng: +best.f[3], local: best.f[1] || '',
    prov: best.f[4] ? (best.g.PROVINCES[Number(best.f[4])] || '') : '', kind: best.f[5] || 'v', fixLat: fix.lat, fixLng: fix.lng,
  } : { city: '', fixLat: fix.lat, fixLng: fix.lng };
  prefs.fixPlace = rec;
  save();
  return { place: rec.city ? rec : null, changed: (old && old.city) !== rec.city };
}
