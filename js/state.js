// Versioned localStorage store. Everything lives on the device — nothing ever
// leaves it. Schema migrations keep future updates from wiping saved data.
// Mirrors the Gardenoosh state module (defaults / migrate / save / resetAll).

const KEY = 'mk.store';
const CURRENT_VERSION = 4;

function defaults() {
  return {
    version: CURRENT_VERSION,
    profile: {
      name: '',
      homeCurrency: 'USD',     // used to show an approximate home-currency hint later
      prefs: {
        interests: [],          // subset of ['food','culture','nature','nightlife']
        budget: 'flexible',     // 'low' | 'mid' | 'high' | 'flexible'
      },
      defaultLang: 'th',        // phrasebook language to open first
      // Optional, user-supplied live-translate endpoint + key. Stored ONLY on this
      // device, never transmitted except to the endpoint the user configures, and
      // never committed to source. Enabling also requires the endpoint origin in
      // the page CSP connect-src (see Settings copy).
      translateEndpoint: '',
      translateKey: '',
      theme: 'light',           // 'light' | 'dark'
      reducedMotion: 'auto',    // 'auto' | 'on' | 'off'
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
    // booked stays / meals / activities with cost + rating.
    calendar: { items: [] },    // { id, date, type:'stay'|'meal'|'activity', title, place, cost, currency, rating, note }
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
  save();
}

// --- travel journal ----------------------------------------------------------
export function addJournalEntry({ title, text, place = '', coords = null, ts = null }) {
  const when = ts || new Date().toISOString();
  const e = { id: uid('jr'), ts: when, date: when.slice(0, 10),
    title: String(title || 'Untitled').slice(0, 120), text: String(text || ''), place, coords };
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
export function addCalendarItem(item) {
  const it = { id: uid('cal'), date: item.date, type: item.type || 'stay',
    title: String(item.title || '').slice(0, 120), place: item.place || '',
    cost: item.cost || '', currency: item.currency || '', rating: item.rating || 0, note: item.note || '' };
  store.calendar.items.push(it);
  store.calendar.items.sort((a, b) => (a.date < b.date ? -1 : 1));
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
