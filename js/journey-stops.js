// Where the traveller has been, derived from what the app holds: one list of stops (trail pins, journal entries, dated trip
// stops and the places saved in them) and one leg between each pair, with a transport mode per leg. Pure derivation, no DOM.
// Moved out of js/screens/journal.js (F4; the only change is `set: true` on a leg whose mode the traveller chose) so the journey screen, the trip recap (js/recap-data.js) and anything
// later read ONE list, and so neither the recap nor Home has to load the journal screen to get at it.
import { store, journalEntries } from './state.js';
import { trailPoints, journeyOverride } from './trail.js';
import { WEATHER_SPOTS } from './weather.js';
import { getPlace } from './data/regions.js';
import { isRouteNode, directLeg } from './journey.js';
import { entryPhotoKeys } from './main.js';

// One "place" on this map. 10 km rather than a tighter figure because a stop is a town and
// the things around it — a journal entry stamped at Tam Coc is 7 km from a trail pin in Ninh
// Binh city and belongs on the same pin, not on a second one with the same name. Labels are
// checked as well as distance, so two records that call themselves the same place merge even
// when the coordinates disagree by more than that.
export const NEAR_KM = 10;

export function jkm(a, b) {
  const R = 6371, dLat = (b.lat - a.lat) * Math.PI / 180, dLng = (b.lng - a.lng) * Math.PI / 180;
  const la1 = a.lat * Math.PI / 180, la2 = b.lat * Math.PI / 180;
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(x)));
}

// One list of stops, each carrying everything the traveller has at that place. The trail
// leads because it is the only source that exists without the traveller doing anything;
// journal entries and dated trip stops then either land on an existing stop or add one of
// their own, so a journey is complete whether it was recorded by walking around with the
// app open, by writing entries, or by planning stops in advance.
export function journeyStops() {
  const stops = [];
  const add = (coords, seed) => {
    const label = ((seed && seed.label) || '').trim().toLowerCase();
    if (label) { const named = stops.find((s) => (s.label || '').trim().toLowerCase() === label); if (named) return named; }
    let best = null, bestKm = Infinity;
    for (const s of stops) { const d = jkm(coords, s); if (d < bestKm) { bestKm = d; best = s; } }
    if (best && bestKm < NEAR_KM) return best;
    const st = { lat: coords.lat, lng: coords.lng, label: '', first: '', last: '', cc: '',
      entries: [], places: [], auto: false, manual: false, arriveMode: '', _trailIds: [], _srcKeys: [], ...seed };
    stops.push(st);
    return st;
  };
  const stamp = (st, date) => {
    if (!date) return;
    if (!st.first || date < st.first) st.first = date;
    if (!st.last || date > st.last) st.last = date;
  };
  // Where a source sits once the traveller has moved it on this screen (js/trail.js, journeyOverride).
  const placed = (ov, c) => ({ lat: ov.lat !== undefined ? ov.lat : c.lat, lng: ov.lng !== undefined ? ov.lng : c.lng });

  trailPoints().forEach((p) => {
    const st = add(p, { label: p.city || '', cc: p.cc || '', auto: true });
    if (p.city && !st.label) st.label = p.city;
    if (p.cc && !st.cc) st.cc = p.cc;
    st.auto = true;
    if (p.manual) st.manual = true;
    if (p.arriveMode) st.arriveMode = p.arriveMode;
    if (p.id) st._trailIds.push(p.id);
    stamp(st, p.first); stamp(st, p.last);
  });

  // A journal entry and a trip stop are read, never rewritten: a rename, a new date, a move or a removal made
  // on this screen is a journey override keyed by the source, and the entry or stop reads as written.
  journalEntries().forEach((e) => {
    if (!e.coords || typeof e.coords.lat !== 'number') return;
    const key = `entry:${e.id}`, ov = journeyOverride(key);
    if (ov.hidden) return;
    const name = ov.city || e.place || e.title || '';
    const st = add(placed(ov, e.coords), { label: name });
    if (!st.label) st.label = name;
    st._srcKeys.push(key);
    st.entries.push(e);
    stamp(st, ov.first || e.date);
    if (ov.last) stamp(st, ov.last);
  });

  // A trip stop has a free-text title and no coordinates, so it can only reach the map when
  // its title names a city the app knows. One that does not still shows in the list below —
  // absent from the map is honest; inventing a coordinate for it would not be.
  (store.trip.stops || []).forEach((s) => {
    const sp = (s.title || '').trim().toLowerCase();
    if (!sp) return;
    const hit = WEATHER_SPOTS.find((w) => (w.city || '').toLowerCase() === sp);
    if (!hit) return;
    const key = `trip:${s.id}`, ov = s.id ? journeyOverride(key) : {};
    if (ov.hidden) return;
    const name = ov.city || s.title;
    const st = add(placed(ov, hit), { label: name, cc: hit.country });
    if (!st.label) st.label = name;
    if (s.id) st._srcKeys.push(key);
    st.planned = true;
    stamp(st, ov.first || s.date);
    if (ov.last) stamp(st, ov.last);
  });

  // Saved and rated places attach to whichever stop they sit in, so a pin also leads back to
  // the places the traveller starred while they were there.
  const ids = new Set([...(store.favorites || []), ...Object.keys(store.placeData || {})]);
  ids.forEach((id) => {
    const pl = getPlace(id);
    if (!pl || !pl.coords || typeof pl.coords.lat !== 'number') return;
    let best = null, bestKm = Infinity;
    for (const s of stops) { const d = jkm(pl.coords, s); if (d < bestKm) { bestKm = d; best = s; } }
    if (best && bestKm < NEAR_KM) best.places.push(pl);
  });

  stops.forEach((s) => {
    s.entries.sort((a, b) => (a.date || '') < (b.date || '') ? -1 : 1);
    s.photos = s.entries.flatMap((e) => entryPhotoKeys(e));
  });
  stops.sort((a, b) => (a.first || '9999') < (b.first || '9999') ? -1 : (a.first || '9999') > (b.first || '9999') ? 1 : 0);
  return stops;
}

// ---- TRANSPORT MODE, per leg between two consecutive stops -------------------
// Six modes the traveller asked for, plus boat/ferry — genuinely common in this region (the
// Mekong itself, island-hopping) and, without it, every ferry leg would show a flatly wrong
// bus glyph rather than a merely-generic one.
export const MODE_GLYPHS = { flight: '✈️', train: '🚂', bus: '🚌', boat: '⛴️', walk: '🚶', bike: '🚲', moto: '🛵' };
export const MODE_LABELS = { flight: 'Flight', train: 'Train', bus: 'Bus / van / car', boat: 'Boat / ferry', walk: 'Walking', bike: 'Bicycle', moto: 'Motorbike' };

// Bucket one of the route graph's ~90 free-text mode strings ("Direct sleeper bus (via Nam
// Phao/Cau Treo)", "Bus to Phnom Penh + flight") into one of the glyphs above. Checked in
// this order because in a composite description the most distinctive leg is usually the one
// worth telling the two cities apart by: a bus ride that ends in a flight is still, on this
// map, a flight.
function modeFromRouteText(mode) {
  const m = (mode || '').toLowerCase();
  if (m.includes('flight')) return 'flight';
  if (m.includes('train') || m.includes('railway')) return 'train';
  if (m.includes('ferry') || m.includes('boat') || m.includes('catamaran') || m.includes('cruise')) return 'boat';
  if (m.includes('bus') || m.includes('van') || m.includes('car') || m.includes('taxi') || m.includes('tuk-tuk')) return 'bus';
  return null;
}

function daysBetween(fromIso, toIso) {
  if (!fromIso || !toIso) return null;
  try { return Math.round((new Date(toIso + 'T00:00') - new Date(fromIso + 'T00:00')) / 86400000); } catch { return null; }
}

// No route-graph match (a village too small to be a node, or the graph not loaded yet) — a
// guess from how far apart the two stops are and how long the gap between them was. Rough on
// purpose: it is one tap to correct (pickModeSheet below), so a wrong guess costs the
// traveller far less than an unlabelled leg costs the map's readability.
function heuristicMode(km, days) {
  if (km < 3) return 'walk';
  if (km < 20) return 'moto';
  if (km > 500 && days !== null && days <= 2) return 'flight';
  return 'bus';
}

// One glyph per leg: an explicit correction first, then the route graph's direct edge (via
// directLeg — deliberately not planRoutes, which optimises for total time and will route a
// "suggested" itinerary through a third city even when a direct leg exists), then the
// distance/time guess. `graphReady` is false until ensureRouteGraph's callback has actually
// fired; journeyScreen computes this twice for exactly that reason; see there.
// A stop with no trail.js record of its own (written from a journal entry, a planned stop or a saved
// place) has nowhere to keep a correction, so it lives here, keyed by where the leg arrives.
export const legKey = (s) => `${s.lat.toFixed(3)},${s.lng.toFixed(3)}`;
export function journeyLegs(stops, graphReady) {
  const legs = [];
  for (let i = 0; i < stops.length - 1; i++) {
    const a = stops[i], b = stops[i + 1];
    const midLat = (a.lat + b.lat) / 2, midLng = (a.lng + b.lng) / 2;
    const ov = (store.profile.prefs.legModes || {})[legKey(b)];
    if (ov && MODE_GLYPHS[ov]) { legs.push({ i, midLat, midLng, mode: ov, set: true }); continue; }
    if (b.arriveMode && MODE_GLYPHS[b.arriveMode]) { legs.push({ i, midLat, midLng, mode: b.arriveMode, set: true }); continue; }
    let mode = null;
    if (graphReady && a.label && b.label && isRouteNode(a.label) && isRouteNode(b.label)) {
      const opt = directLeg(a.label, b.label);
      if (opt) mode = modeFromRouteText(opt.mode);
    }
    legs.push({ i, midLat, midLng, mode: mode || heuristicMode(jkm(a, b), daysBetween(a.last, b.first)) });
  }
  return legs;
}
