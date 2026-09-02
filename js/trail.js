// ---- YOUR JOURNEY, RECORDED FOR YOU -----------------------------------------
// The trail is the list of places this app has actually been opened in, kept so the
// traveller gets a map of their trip without ever having to add a pin by hand.
//
// WHY THIS IS NOT js/visits.js. The two look similar and answer different questions, and
// conflating them would break a promise. visits.js exists to feed a SHARED map: its points
// are rounded to a 0.5° grid (~55 km) precisely so they cannot place anyone, and it is off
// until switched on because its whole purpose is contribution to a feed. This file is the
// opposite: it is the traveller's OWN record, it is never transmitted anywhere, no code
// path offers it to a feed, and so it can afford to be precise and to be on by default.
//
// Nothing here leaves the device. There is no endpoint, no upload, no import into
// journey-share.js's opt-in scopes unless the traveller ticks the box there themselves.
//
// ON BY DEFAULT, and honestly so. The flag is stored as `off`, not `on`, so a profile that
// has never seen this feature is already recording without a migration having to write to
// it — and one tap in Settings stops it and clears what is held. The GPS permission itself
// is untouched: this records only fixes the traveller's own browser has already granted, so
// "automatic" never means "asked for more access than before".
import { store, save } from './state.js';

// ~110 m. Fine enough to tell one temple from the next one along the road, coarse enough
// that the stored file is not a precise track of somebody's movements. A journey map does
// not need more than this, so it does not keep more than this.
const PRECISION = 3;
// A new point has to be this far from the last one to be worth keeping. Under it, the
// traveller has not gone anywhere the map could draw — they have walked down the street.
const MIN_KM = 2;
// A lifetime of travel is a few hundred points. This is a runaway guard, and it drops the
// OLDEST point when full, so the recent trip always survives.
const MAX_PTS = 1500;

function bucket() {
  const p = store.profile;
  if (!p.trail || typeof p.trail !== 'object') p.trail = { off: false, pts: [] };
  if (!Array.isArray(p.trail.pts)) p.trail.pts = [];
  return p.trail;
}

export function trailEnabled() { return !bucket().off; }
export function setTrailEnabled(on) { bucket().off = !on; save(); }
export function clearTrail() { bucket().pts = []; save(); }

function km(a, b) {
  const R = 6371, dLat = (b.lat - a.lat) * Math.PI / 180, dLng = (b.lng - a.lng) * Math.PI / 180;
  const la1 = a.lat * Math.PI / 180, la2 = b.lat * Math.PI / 180;
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(x)));
}

// Record one point. Called wherever the app already has a fix — the app-open path and the
// location watch — and cheap enough to call on every one of them: a fix within MIN_KM of
// the last point only ever updates that point's `last` date, so a week in one town is one
// pin that knows it was a week, not seven pins on top of each other.
//
// Returns the point it created or touched, or null when it did nothing.
export function noteTrail(fix, cc, city, todayIso) {
  const b = bucket();
  if (b.off || !fix || typeof fix.lat !== 'number' || typeof fix.lng !== 'number') return null;
  if (!Number.isFinite(fix.lat) || !Number.isFinite(fix.lng)) return null;
  if (Math.abs(fix.lat) > 90 || Math.abs(fix.lng) > 180) return null;
  const lat = +fix.lat.toFixed(PRECISION), lng = +fix.lng.toFixed(PRECISION);
  const day = todayIso || '';

  // Nearest existing point first, not just the last one: a traveller who loops back to a
  // town they have already pinned should thicken that pin rather than add a second one
  // beside it. That is what makes the map read as places visited instead of a GPS log.
  let near = null, nearKm = Infinity;
  for (const p of b.pts) {
    const d = km({ lat, lng }, p);
    if (d < nearKm) { nearKm = d; near = p; }
  }
  if (near && nearKm < MIN_KM) {
    if (near.last !== day) { near.last = day; near.n = (near.n || 1) + 1; save(); }
    if (city && !near.city) { near.city = city; save(); }
    return near;
  }
  if (b.pts.length >= MAX_PTS) b.pts.shift();
  const rec = { lat, lng, first: day, last: day, n: 1, cc: cc || '', city: city || '' };
  b.pts.push(rec);
  save();
  return rec;
}

// Points in the order they were first reached, which is the order a journey happened in.
export function trailPoints() {
  return bucket().pts.slice()
    .filter((p) => p && typeof p.lat === 'number' && typeof p.lng === 'number')
    .sort((a, b) => (a.first || '') < (b.first || '') ? -1 : (a.first || '') > (b.first || '') ? 1 : 0);
}

// Headline figures for the journey screen: how many places, how many countries, and the
// span the trail covers. Dates come from the points themselves, so a trail recorded before
// any trip was entered still reads correctly.
export function trailStats() {
  const pts = trailPoints();
  const days = pts.flatMap((p) => [p.first, p.last]).filter(Boolean).sort();
  return {
    places: pts.length,
    countries: new Set(pts.map((p) => p.cc).filter(Boolean)).size,
    from: days[0] || '',
    to: days[days.length - 1] || '',
  };
}
