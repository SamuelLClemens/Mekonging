// ---- WHERE THIS APP IS BEING USED FROM --------------------------------------
// A map of the places people open Mekonging from.
//
// READ THIS BEFORE CHANGING ANYTHING HERE. Mekonging is a static site: there is no
// server, no database and no account. Nothing can collect every user's location, because
// there is nothing to collect it. So this is built in two halves, and the screen says
// plainly which half is which:
//
//   YOUR OWN PINS  — kept on this device, always available, never transmitted. Every time
//     the app opens with a location fix, the point is COARSENED to a 0.5° grid cell (about
//     55 km) and merged into a per-cell counter. A 55 km cell cannot identify a house, a
//     hotel or a street, which is the entire reason for the rounding: the map is about
//     "which corner of the world", not "which building". Off until switched on.
//
//   EVERYONE'S PINS — only if the traveller points the app at a feed of their own. There
//     is no default endpoint and none is shipped, because shipping one would mean this
//     project collecting location data from its users, and it does not. Anyone who wants
//     the shared map runs their own collector and pastes its URL in Settings (the same
//     pattern as the custom translation endpoint), which also means the CSP connect-src in
//     index.html has to name that origin.
//
// Contributing your own pins to a shared feed is a SECOND, separate opt-in, and it posts
// only the coarsened cell, the country and a count. Never a track, never a timestamp
// precise enough to follow, never an identifier.
import { store, save } from './state.js';

// 0.5° ≈ 55 km at the equator. Deliberately coarse: fine enough that a country reads
// correctly on a world map, far too coarse to place anyone.
export const GRID = 0.5;
const MAX_CELLS = 500;   // a lifetime of travel is a few dozen cells; this is a runaway guard

function bucket() {
  const p = store.profile;
  if (!p.visits || typeof p.visits !== 'object') p.visits = { on: false, share: false, feed: '', cells: {} };
  if (!p.visits.cells || typeof p.visits.cells !== 'object') p.visits.cells = {};
  return p.visits;
}

export function visitsEnabled() { return !!bucket().on; }
export function setVisitsEnabled(on) { bucket().on = !!on; save(); }
export function visitsShareEnabled() { return !!bucket().share; }
export function setVisitsShareEnabled(on) { bucket().share = !!on; save(); }
export function visitsFeedUrl() { return bucket().feed || ''; }
export function setVisitsFeedUrl(url) { bucket().feed = (url || '').trim(); save(); }

export function snapCell(lat, lng) {
  const la = Math.round(lat / GRID) * GRID;
  const ln = Math.round(lng / GRID) * GRID;
  // Normalise -0 to 0 and clamp longitude into [-180, 180) so a cell key is stable.
  const nlng = ((ln + 180) % 360 + 360) % 360 - 180;
  return { lat: la + 0, lng: nlng + 0, key: `${(la + 0).toFixed(1)},${(nlng + 0).toFixed(1)}` };
}

// Called on every app open that has a fix. Idempotent within a day: the same cell on the
// same date does not inflate the count, so a traveller who reopens the app twenty times in
// one afternoon does not end up as twenty visits.
export function recordVisit(fix, cc, todayIso) {
  const b = bucket();
  if (!b.on || !fix || typeof fix.lat !== 'number' || typeof fix.lng !== 'number') return null;
  const cell = snapCell(fix.lat, fix.lng);
  const prev = b.cells[cell.key];
  if (prev && prev.last === todayIso) return prev;
  if (!prev && Object.keys(b.cells).length >= MAX_CELLS) return null;
  const rec = prev
    ? { ...prev, n: prev.n + 1, last: todayIso, cc: cc || prev.cc || '' }
    : { lat: cell.lat, lng: cell.lng, n: 1, first: todayIso, last: todayIso, cc: cc || '' };
  b.cells[cell.key] = rec;
  save();
  return rec;
}

export function myVisits() {
  const cells = bucket().cells;
  return Object.keys(cells).map((k) => cells[k]).filter((r) => r && typeof r.lat === 'number' && typeof r.lng === 'number');
}

export function clearVisits() { bucket().cells = {}; save(); }

// A shared feed is untrusted input from a URL the traveller supplied, so every row is
// validated and clamped before it is allowed near the map: coordinates in range, count a
// positive number, nothing else read at all. Anything malformed is dropped silently rather
// than failing the whole fetch — one bad row must not blank the map.
export function normaliseFeed(raw) {
  const rows = Array.isArray(raw) ? raw : (raw && Array.isArray(raw.points) ? raw.points : []);
  const out = [];
  for (const r of rows.slice(0, 20000)) {
    if (!r) continue;
    const lat = Number(r.lat), lng = Number(r.lng);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) continue;
    const n = Math.max(1, Math.min(1e6, Math.round(Number(r.n) || 1)));
    const cell = snapCell(lat, lng);
    out.push({ lat: cell.lat, lng: cell.lng, n, cc: typeof r.cc === 'string' ? r.cc.slice(0, 4) : '' });
  }
  // Merge duplicates that land in the same cell after snapping.
  const merged = new Map();
  for (const p of out) {
    const k = `${p.lat.toFixed(1)},${p.lng.toFixed(1)}`;
    const cur = merged.get(k);
    if (cur) cur.n += p.n; else merged.set(k, { ...p });
  }
  return [...merged.values()];
}

export async function loadSharedVisits(signal) {
  const url = visitsFeedUrl();
  if (!url) return { ok: false, reason: 'no-feed', points: [] };
  if (!/^https:\/\//i.test(url)) return { ok: false, reason: 'not-https', points: [] };
  try {
    const res = await fetch(url, { signal, credentials: 'omit', cache: 'no-store' });
    if (!res.ok) return { ok: false, reason: `http-${res.status}`, points: [] };
    return { ok: true, points: normaliseFeed(await res.json()) };
  } catch (err) {
    return { ok: false, reason: (err && err.name === 'AbortError') ? 'aborted' : 'unreachable', points: [] };
  }
}

// Contributing is its own opt-in and sends one coarsened cell, nothing else. Failure is
// silent by design: a collector being down is not the traveller's problem and must never
// surface as an error on a travel app.
export async function contributeVisit(cell, cc) {
  const url = visitsFeedUrl();
  if (!visitsShareEnabled() || !url || !/^https:\/\//i.test(url) || !cell) return false;
  try {
    await fetch(url, {
      method: 'POST', credentials: 'omit', mode: 'cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lat: cell.lat, lng: cell.lng, cc: cc || '' }),
    });
    return true;
  } catch { return false; }
}
