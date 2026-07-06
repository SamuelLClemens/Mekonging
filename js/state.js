// Versioned localStorage store. Everything lives on the device — nothing ever
// leaves it. Schema migrations keep future updates from wiping saved data.
// Mirrors the Gardenoosh state module (defaults / migrate / save / resetAll).

const KEY = 'mk.store';
const CURRENT_VERSION = 7;

function defaults() {
  return {
    version: CURRENT_VERSION,
    profile: {
      name: '',
      homeCurrency: 'USD',     // used to show an approximate home-currency hint later
      prefs: {
        interests: [],          // subset of ['food','culture','nature','nightlife']
        budget: 'flexible',     // 'low' | 'mid' | 'high' | 'flexible'
        // --- v6: remembered offline-map layer visibility (the map-screen toggles) ---
        mapLayers: { go: true, eat: true, localeat: true, market: true, stay: true, pools: true, crossing: true, satellite: true, borders: true },
      },
      defaultLang: '',          // phrasebook language to open first ('' = auto, match the user's location)
      // Optional, user-supplied live-translate endpoint + key. Stored ONLY on this
      // device, never transmitted except to the endpoint the user configures, and
      // never committed to source. Enabling also requires the endpoint origin in
      // the page CSP connect-src (see Settings copy).
      translateEndpoint: '',
      translateKey: '',
      // Feedback: optional destination for the "Email feedback" action (set by the
      // owner in Settings) + the user's own reply-to. Both on-device; never committed.
      feedbackTo: '',
      contactEmail: '',
      theme: 'light',           // 'light' | 'dark'
      reducedMotion: 'auto',    // 'auto' | 'on' | 'off'
      textScale: 'm',           // 's' | 'm' | 'l' — accessibility text size
      seenWelcome: false,
    },
    favorites: [],              // item ids (curated place or pin) saved as a quick shortlist
    // --- v2: organise-and-find-again ---
    collections: [],            // { id, name, emoji, itemIds:[], createdAt } — named themes/tags
    pins: [],                   // { id:'pin-…', name, note, tags:[], coords:{lat,lng}|null, createdAt } — user-marked places
    // --- v3: the user's own layer on any place (private, on-device) ---
    // placeData[itemId] = { note, rating(1-5|0), review, updatedAt }. The curated
    // guidebook text stays in the data modules (the "original"); review is the
    // user's own take, shown alongside it colour-coded.
    placeData: {},
    trip: {
      stops: [],                // { id, city, country, fromDate, toDate }
      budgetLog: [],            // { id, date:'YYYY-MM-DD', amount, currency, note }
      notes: '',
    },
    // --- v4: travel journal + travel calendar (all on-device) ---
    // journal entries get a date+time+location stamp and feed the journey-map animation.
    journal: { entries: [] },   // { id, ts(ISO), date, title, text, place, coords:{lat,lng}|null }
    // booked stays / meals / activities / day-plans with cost + rating. `time` (HH:MM)
    // is optional and powers the time-ordered day planner.
    calendar: { items: [] },    // { id, date, time, type:'stay'|'meal'|'activity'|'plan', title, place, cost, currency, rating, note }
    // --- v5: pre-trip checklist progress (per item id) ---
    checklist: { checked: {} },
    // --- v6: the user's accommodation, so the map can always point the way back ---
    myStay: null,               // { name, coords:{lat,lng}, setAt } | null
    // --- v7: named offline map packs the user has downloaded, listed + deletable ---
    // The tiles themselves live in the service-worker TILE_CACHE; this records the
    // metadata (and the exact bounds/zoom) so each pack can be sized and deleted alone.
    savedAreas: [],             // { id, name, center:{lng,lat}, bounds:{w,s,e,n}, z, count, savedAt }
  };
}

function migrate(data) {
  if (!data || typeof data !== 'object') return defaults();
  if (!data.version || data.version > CURRENT_VERSION) return defaults();
  const base = defaults();
  // Additive, lossless: new fields self-default via the spread; existing
  // favorites[] and trip carry forward verbatim. Future versions add
  // `if ((data.version||1) < N) { ... }` blocks here, like Gardenoosh.
  const out = {
    version: CURRENT_VERSION,
    profile: { ...base.profile, ...(data.profile || {}),
               prefs: { ...base.profile.prefs, ...((data.profile || {}).prefs || {}) } },
    favorites: Array.isArray(data.favorites) ? data.favorites : base.favorites,
    collections: Array.isArray(data.collections) ? data.collections : base.collections,
    pins: Array.isArray(data.pins) ? data.pins : base.pins,
    placeData: (data.placeData && typeof data.placeData === 'object' && !Array.isArray(data.placeData)) ? data.placeData : base.placeData,
    trip: { ...base.trip, ...(data.trip || {}) },
    journal: { entries: Array.isArray((data.journal || {}).entries) ? data.journal.entries : [] },
    calendar: { items: Array.isArray((data.calendar || {}).items) ? data.calendar.items : [] },
    checklist: { checked: ((data.checklist || {}).checked && typeof data.checklist.checked === 'object') ? data.checklist.checked : {} },
    myStay: (data.myStay && data.myStay.coords) ? data.myStay : base.myStay,
    savedAreas: Array.isArray(data.savedAreas) ? data.savedAreas : base.savedAreas,
  };
  // v1 -> v2: collections[] and pins[]. v2 -> v3: placeData{}. v3 -> v4: journal{} +
  // calendar{} (nested objects, backfilled explicitly above). All guarded; favorites carries.
  return out;
}

function load() {
  try {
    return migrate(JSON.parse(localStorage.getItem(KEY)));
  } catch {
    return defaults();
  }
}

export const store = load();

export function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(store));
  } catch {
    // storage full or private mode — the session still works, it just will not persist
  }
}

export function resetAll() {
  try { localStorage.removeItem(KEY); } catch { /* ignore */ }
  const fresh = defaults();
  store.version = fresh.version;
  store.profile = fresh.profile;
  store.favorites = fresh.favorites;
  store.collections = fresh.collections;
  store.pins = fresh.pins;
  store.placeData = fresh.placeData;
  store.trip = fresh.trip;
  store.journal = fresh.journal;
  store.calendar = fresh.calendar;
  store.checklist = fresh.checklist;
  store.myStay = fresh.myStay;
  store.savedAreas = fresh.savedAreas;
  save();
}

// --- pre-trip checklist ------------------------------------------------------
export function isChecked(id) { return !!store.checklist.checked[id]; }
export function toggleChecklistItem(id) {
  if (store.checklist.checked[id]) delete store.checklist.checked[id];
  else store.checklist.checked[id] = true;
  save();
  return !!store.checklist.checked[id];
}

// --- trip planner (itinerary stops + budget log) -----------------------------
export function addStop({ title, country = '', date = '' }) {
  const s = { id: uid('stop'), title: String(title || '').slice(0, 80), country, date };
  store.trip.stops.push(s); save(); return s;
}
export function removeStop(id) {
  const i = store.trip.stops.findIndex((x) => x.id === id);
  if (i >= 0) { store.trip.stops.splice(i, 1); save(); }
}
export function moveStop(id, dir) {
  const a = store.trip.stops; const i = a.findIndex((x) => x.id === id);
  const j = i + dir;
  if (i < 0 || j < 0 || j >= a.length) return;
  [a[i], a[j]] = [a[j], a[i]]; save();
}
export function addBudgetItem({ date, amount, currency, note }) {
  const b = { id: uid('bud'), date: date || todayKey(), amount: amount || '', currency: currency || '', note: note || '' };
  store.trip.budgetLog.push(b);
  store.trip.budgetLog.sort((a, c) => (a.date < c.date ? -1 : 1));
  save(); return b;
}
export function deleteBudgetItem(id) {
  const i = store.trip.budgetLog.findIndex((x) => x.id === id);
  if (i >= 0) { store.trip.budgetLog.splice(i, 1); save(); }
}

// --- travel journal ----------------------------------------------------------
export function addJournalEntry({ title, text, place = '', coords = null, ts = null, photoKey = null }) {
  const when = ts || new Date().toISOString();
  const e = { id: uid('jr'), ts: when, date: when.slice(0, 10),
    title: String(title || 'Untitled').slice(0, 120), text: String(text || ''), place, coords, photoKey };
  store.journal.entries.push(e);
  store.journal.entries.sort((a, b) => (a.ts < b.ts ? -1 : 1));
  save(); return e;
}
export function deleteJournalEntry(id) {
  const i = store.journal.entries.findIndex((x) => x.id === id);
  if (i >= 0) { store.journal.entries.splice(i, 1); save(); }
}
export function journalEntries() { return store.journal.entries.slice().sort((a, b) => (a.ts < b.ts ? -1 : 1)); }

// --- travel calendar ---------------------------------------------------------
// Order by date then time; undated-time items sort to the end of their day.
function calKey(x) { return `${x.date} ${x.time || '99:99'}`; }
export function calCompare(a, b) { const ka = calKey(a), kb = calKey(b); return ka < kb ? -1 : (ka > kb ? 1 : 0); }
export function addCalendarItem(item) {
  // Clamp the rating to an integer 0–5 so star rendering (String.repeat) can never throw.
  const rating = Math.max(0, Math.min(5, Math.round(Number(item.rating) || 0)));
  const it = { id: uid('cal'), date: item.date, time: item.time || '', type: item.type || 'stay',
    title: String(item.title || '').slice(0, 120), place: item.place || '',
    cost: item.cost || '', currency: item.currency || '', rating, note: item.note || '' };
  store.calendar.items.push(it);
  store.calendar.items.sort(calCompare);
  save(); return it;
}
export function deleteCalendarItem(id) {
  const i = store.calendar.items.findIndex((x) => x.id === id);
  if (i >= 0) { store.calendar.items.splice(i, 1); save(); }
}

// --- the user's own layer on a place (note, rating, review) ------------------
export function getPlaceData(id) { return store.placeData[id] || { note: '', rating: 0, review: '' }; }
export function setPlaceField(id, field, value) {
  const d = store.placeData[id] || { note: '', rating: 0, review: '' };
  d[field] = value; d.updatedAt = todayKey();
  store.placeData[id] = d; save();
  return d;
}

// --- unique-id helper (no Math.random/Date.now reliance for determinism in tests) -
let _seq = 0;
function uid(prefix) {
  _seq += 1;
  const t = (typeof performance !== 'undefined' && performance.now) ? Math.floor(performance.now()) : _seq;
  return `${prefix}-${t}-${_seq}`;
}

// --- collections (named themes / tags) ---------------------------------------
export function createCollection(name, emoji = '⭐') {
  const c = { id: uid('col'), name: String(name || 'Untitled').slice(0, 40), emoji, itemIds: [], createdAt: todayKey() };
  store.collections.push(c); save(); return c;
}
export function renameCollection(id, name) {
  const c = store.collections.find((x) => x.id === id);
  if (c) { c.name = String(name || c.name).slice(0, 40); save(); }
}
export function deleteCollection(id) {
  const i = store.collections.findIndex((x) => x.id === id);
  if (i >= 0) { store.collections.splice(i, 1); save(); }
}
export function togglePlaceInCollection(collId, itemId) {
  const c = store.collections.find((x) => x.id === collId);
  if (!c) return false;
  const i = c.itemIds.indexOf(itemId);
  if (i >= 0) c.itemIds.splice(i, 1); else c.itemIds.push(itemId);
  save();
  return c.itemIds.includes(itemId);
}
export function collectionsForItem(itemId) {
  return store.collections.filter((c) => c.itemIds.includes(itemId));
}

// --- pins (user-marked places, e.g. dropped on the map) ----------------------
export function addPin({ name, note = '', tags = [], coords = null } = {}) {
  const p = { id: uid('pin'), name: String(name || 'My place').slice(0, 80), note, tags, coords, createdAt: todayKey() };
  store.pins.push(p); save(); return p;
}
export function updatePin(id, patch) {
  const p = store.pins.find((x) => x.id === id);
  if (p) { Object.assign(p, patch); save(); }
  return p;
}
export function deletePin(id) {
  const i = store.pins.findIndex((x) => x.id === id);
  if (i >= 0) { store.pins.splice(i, 1); save(); }
  // also remove from any collections + favorites
  store.collections.forEach((c) => { const j = c.itemIds.indexOf(id); if (j >= 0) c.itemIds.splice(j, 1); });
  const f = store.favorites.indexOf(id); if (f >= 0) store.favorites.splice(f, 1);
  save();
}
export function getPin(id) { return store.pins.find((x) => x.id === id) || null; }

// --- my stay (accommodation home pin) ----------------------------------------
export function setMyStay({ name = 'My stay', coords } = {}) {
  if (!coords) return null;
  store.myStay = { name: String(name || 'My stay').slice(0, 80), coords, setAt: todayKey() };
  save(); return store.myStay;
}
export function getMyStay() { return store.myStay || null; }
export function clearMyStay() { store.myStay = null; save(); }

// --- saved offline map areas (named tile packs) ------------------------------
export function getSavedAreas() { return Array.isArray(store.savedAreas) ? store.savedAreas : (store.savedAreas = []); }
export function addSavedArea({ name, center, bounds, z, count }) {
  const a = { id: uid('area'), name: String(name || 'Saved area').slice(0, 60), center, bounds, z, count: count || 0, savedAt: todayKey() };
  getSavedAreas().push(a); save(); return a;
}
export function removeSavedArea(id) {
  const list = getSavedAreas();
  const i = list.findIndex((x) => x.id === id);
  if (i >= 0) { list.splice(i, 1); save(); }
}

// --- favorites helpers --------------------------------------------------------
export function isFavorite(id) { return store.favorites.includes(id); }
export function toggleFavorite(id) {
  const i = store.favorites.indexOf(id);
  if (i >= 0) store.favorites.splice(i, 1);
  else store.favorites.push(id);
  save();
  return store.favorites.includes(id);
}

export function prefersReducedMotion() {
  const pref = store.profile && store.profile.reducedMotion;
  if (pref === 'on') return true;
  if (pref === 'off') return false;
  return !!(typeof window !== 'undefined' && window.matchMedia
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
}

export function todayKey(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
