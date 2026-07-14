// Versioned localStorage store. Everything lives on the device — nothing ever
// leaves it. Schema migrations keep future updates from wiping saved data.
// Mirrors the Gardenoosh state module (defaults / migrate / save / resetAll).

const KEY = 'mk.store';
const CURRENT_VERSION = 11;

function defaults() {
  return {
    version: CURRENT_VERSION,
    profile: {
      name: '',
      homeCurrency: 'USD',     // used to show an approximate home-currency hint later
      prefs: {
        interests: [],          // subset of ['food','culture','nature','nightlife']
        budget: 'flexible',     // 'low' | 'mid' | 'high' | 'flexible'
        // --- traveller profile (drives "For you" ranking + plan suggestions) ---
        party: '',              // '' | 'solo' | 'couple' | 'family'
        withBaby: false,        // travelling with a baby/toddler — surfaces nappies/formula/family help
        access: [],             // accessibility needs, subset of ['mobility','vision','hearing']
        // Dietary restrictions & allergies. Drives the food-identifier highlighting
        // (green = no flagged conflict, red = contains something to avoid) and the pinned
        // allergy card in the phrasebook. Subset of DIET_OPTIONS ids (see js/main.js).
        diet: [],               // e.g. ['peanut','shellfish','vegetarian','halal','gluten']
        tripLength: '',         // '' | 'short' (≤1wk) | 'medium' (2–3wk) | 'long' (1mo+)
        // Journey phase: shapes what Home leads with. '' = not chosen yet (Home prompts).
        phase: '',              // '' | 'planning' | 'arrived' | 'traveling' | 'post'
        // Network consent: the app must never use mobile data / Wi-Fi silently. 'ask' = do
        // not auto-fetch until the traveller chooses; 'online' = use data when available;
        // 'offline' = stay fully offline. Set in onboarding, changeable any time.
        netMode: 'ask',         // 'ask' | 'online' | 'offline'
        // --- v6: remembered offline-map layer visibility (the map-screen toggles) ---
        mapLayers: { go: true, eat: true, localeat: true, market: true, stay: true, pools: true, crossing: true, satellite: true, borders: true },
        // Phrasebook languages whose online-TTS audio has been downloaded for offline use.
        audioPacks: [],
        // Last known GPS fix { lat, lng, at } — cached so "distance from you" and the
        // near-me experience work across the whole app, offline, without re-locating.
        lastFix: null,
        // Remembered browse mode + ordering on the Places screen.
        placesView: 'list',   // 'list' | 'map'  — scroll a list, or see results on a map
        placesSort: 'best',   // 'best' | 'near' — order by fit/rating, or by distance from you
        streetView: 'list',   // 'list' | 'map'  — Street-food screen: rate-list or map of stalls
        geoAsked: false,      // have we offered the one-time "use my location" invite on Home?
        // --- personal phrasebook: the user's own pinned + hidden phrases, per language.
        // Keys are derived (lang|categoryId|slug-of-english) since phrases carry no id.
        phrasePins: {},       // { th: ['th|basics|hello', …] } — pin order IS the display order
        phraseHidden: {},     // { th: [key, …] } — phrases tucked away from the lists
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
      theme: 'auto',            // 'auto' | 'light' | 'dark' — auto = light by day, dark at night (Classic skin)
      skin: 'classic',          // 'classic' | 'night' | 'silk' | 'tropical' | 'psych' — visual theme
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
    // --- v8: backendless "travel circle" — user-to-user share/connect/message.
    // Nothing here is ever sent anywhere automatically; connections and messages
    // travel only inside links the user explicitly shares (see js/social.js).
    social: {
      me: { userId: '', name: '', avatar: '🧭', bio: '' },  // the user's own traveller card
      contacts: [],   // { userId, name, avatar, bio, addedAt } — people added from a shared card
      inbox: [],      // received shared items (Batch B) — { id, from, kind, data, ts, read }
      threads: {},    // async message threads (Batch C) — { contactUserId: [ { from, text, attach, ts } ] }
    },
    // --- v9: the user's own posts on city noticeboards (on-device; shareable via links) ---
    boardPosts: {},   // { '<cc>-<citySlug>': [ { id, topic, text, at } ] }
    // --- v11: private personal calendar (cycle/period, mood, symptoms, intimacy, pregnancy).
    // Deeply private, on-device only, opt-in (default OFF), optional PIN. Managed by
    // js/personal.js; kept here so it is carried through updates and the backup. NEVER
    // uploaded and never committed. { enabled, pinHash, partners[], days{}, layers{}, pregnancy }
    personal: { enabled: false, pinHash: null, partners: [], defaultPartnerId: null, showCycle: true, days: {}, layers: {}, pregnancy: null },
    // --- v11: photo album (pictures the user adds directly). Photo blobs live in
    // IndexedDB; this holds the ordered metadata. The scrapbook shows these + journal
    // photos together. On-device, backup-safe. { photos: [{ id, key, caption, date }] }
    album: { photos: [] },
  };
}

function migrate(data) {
  if (!data || typeof data !== 'object') return defaults();
  const base = defaults();
  const dv = Number(data.version) || 1;
  // NON-DESTRUCTIVE by design: user data (journal, budget, calendar, pins, reviews…) is
  // NEVER wiped, no matter the version. If the stored data is NEWER than this code (an
  // update mismatch / rollback), we still carry every field forward verbatim — older code
  // simply ignores keys it does not know, and `...data` preserves them for when newer code
  // loads again. If it is OLDER, missing fields self-default from `base`. The schema marker
  // is kept at the HIGHER of the two so a newer schema is never silently downgraded.
  const out = {
    ...base,
    ...data,
    version: Math.max(CURRENT_VERSION, dv),
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
    social: (() => {
      const s = (data.social && typeof data.social === 'object') ? data.social : {};
      const me = (s.me && typeof s.me === 'object') ? s.me : {};
      return {
        me: { userId: me.userId || '', name: me.name || '', avatar: me.avatar || '🧭', bio: me.bio || '' },
        contacts: Array.isArray(s.contacts) ? s.contacts : [],
        inbox: Array.isArray(s.inbox) ? s.inbox : [],
        threads: (s.threads && typeof s.threads === 'object' && !Array.isArray(s.threads)) ? s.threads : {},
      };
    })(),
    boardPosts: (data.boardPosts && typeof data.boardPosts === 'object' && !Array.isArray(data.boardPosts)) ? data.boardPosts : {},
    // Private personal calendar — carried forward verbatim (js/personal.js normalizes the
    // inner shape lazily); only reset to the empty default if it is missing or malformed.
    personal: (data.personal && typeof data.personal === 'object' && !Array.isArray(data.personal)) ? data.personal : base.personal,
    album: { photos: Array.isArray((data.album || {}).photos) ? data.album.photos : [] },
  };
  // v1 -> v2: collections[] and pins[]. v2 -> v3: placeData{}. v3 -> v4: journal{} +
  // calendar{} (nested objects, backfilled explicitly above). All guarded; favorites carries.
  // v9 -> v10: day/night auto becomes the default. Move anyone still on the old silent
  // 'light' default onto 'auto' (an explicit 'dark' choice is preserved).
  if (dv < 10 && out.profile.theme === 'light') out.profile.theme = 'auto';
  return out;
}

const BAK = KEY + '.bak';

function parseStore(k) {
  try { const raw = localStorage.getItem(k); return raw ? JSON.parse(raw) : null; } catch { return null; }
}

// Does this store hold anything the user created? Used to decide whether a recovery from
// the backup is warranted (we never overwrite real data with an empty default).
function hasUserData(s) {
  if (!s || typeof s !== 'object') return false;
  const j = s.journal && Array.isArray(s.journal.entries) && s.journal.entries.length;
  const b = s.trip && Array.isArray(s.trip.budgetLog) && s.trip.budgetLog.length;
  const c = s.calendar && Array.isArray(s.calendar.items) && s.calendar.items.length;
  const p = Array.isArray(s.pins) && s.pins.length;
  const col = Array.isArray(s.collections) && s.collections.length;
  const pd = s.placeData && typeof s.placeData === 'object' && Object.keys(s.placeData).length;
  const f = Array.isArray(s.favorites) && s.favorites.length;
  return !!(j || b || c || p || col || pd || f);
}

function load() {
  const out = migrate(parseStore(KEY));
  // Recovery net: if the primary store came back empty (corrupt/failed parse) but the
  // rolling backup still holds real entries, restore from the backup rather than start blank.
  if (!hasUserData(out)) {
    const bak = migrate(parseStore(BAK));
    if (hasUserData(bak)) return bak;
  }
  return out;
}

export const store = load();

export function save() {
  try {
    const next = JSON.stringify(store);
    // Keep the previous good copy as a one-step rollback backup BEFORE overwriting, so a
    // failed/partial write or a bad update can never leave the traveller with nothing.
    // Only mirror a prev that actually parses — never let a corrupt primary clobber a good
    // backup (that would defeat the whole recovery net).
    const prev = localStorage.getItem(KEY);
    if (prev && prev !== next && prev.length > 2) {
      let ok = false; try { JSON.parse(prev); ok = true; } catch { ok = false; }
      if (ok) { try { localStorage.setItem(BAK, prev); } catch { /* backup best-effort */ } }
    }
    localStorage.setItem(KEY, next);
  } catch {
    // storage full or private mode — the session still works, it just will not persist
  }
}

// Export the entire on-device store as a JSON string the user can save as a file.
export function exportData() {
  try { return JSON.stringify(store, null, 2); } catch { return '{}'; }
}

// Restore from a previously exported backup. Non-destructive to the file: the parsed
// data runs through the same migration, then replaces the live store in place (keeping the
// shared reference the rest of the app holds). Returns { ok, error?, counts? }.
export function importData(text) {
  let parsed;
  try { parsed = JSON.parse(text); } catch { return { ok: false, error: 'That file is not a valid backup.' }; }
  if (!parsed || typeof parsed !== 'object') return { ok: false, error: 'That backup could not be read.' };
  const migrated = migrate(parsed);
  Object.keys(store).forEach((k) => { delete store[k]; });
  Object.assign(store, migrated);
  save();
  return { ok: true, counts: {
    journal: (store.journal.entries || []).length,
    budget: (store.trip.budgetLog || []).length,
    calendar: (store.calendar.items || []).length,
  } };
}

export function resetAll() {
  try { localStorage.removeItem(KEY); } catch { /* ignore */ }
  try { localStorage.removeItem(BAK); } catch { /* ignore */ }
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
  store.social = fresh.social;
  store.boardPosts = fresh.boardPosts;
  store.personal = fresh.personal;
  store.album = fresh.album;
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
export function updateBudgetItem(id, patch = {}) {
  const b = store.trip.budgetLog.find((x) => x.id === id);
  if (!b) return null;
  if (patch.amount !== undefined) b.amount = patch.amount;
  if (patch.currency !== undefined) b.currency = patch.currency;
  if (patch.note !== undefined) b.note = patch.note;
  if (patch.date !== undefined) b.date = patch.date;
  store.trip.budgetLog.sort((a, c) => (a.date < c.date ? -1 : 1));
  save(); return b;
}

// --- travel journal ----------------------------------------------------------
export function addJournalEntry({ title, text, place = '', coords = null, ts = null, photoKey = null, photoKeys = null, weather = '' }) {
  const when = ts || new Date().toISOString();
  const keys = Array.isArray(photoKeys) ? photoKeys.filter(Boolean) : (photoKey ? [photoKey] : []);
  const e = { id: uid('jr'), ts: when, date: when.slice(0, 10),
    title: String(title || 'Untitled').slice(0, 120), text: String(text || ''), place, coords,
    photoKeys: keys, photoKey: keys[0] || null,   // photoKey kept = first photo, for older readers
    weather: String(weather || '').slice(0, 80) };
  store.journal.entries.push(e);
  store.journal.entries.sort((a, b) => (a.ts < b.ts ? -1 : 1));
  save(); return e;
}
export function updateJournalEntry(id, patch = {}) {
  const e = store.journal.entries.find((x) => x.id === id);
  if (!e) return null;
  if (patch.title !== undefined) e.title = String(patch.title || 'Untitled').slice(0, 120);
  if (patch.text !== undefined) e.text = String(patch.text || '');
  if (patch.place !== undefined) e.place = patch.place;
  if (patch.coords !== undefined) e.coords = patch.coords;
  if (patch.photoKeys !== undefined) { e.photoKeys = Array.isArray(patch.photoKeys) ? patch.photoKeys.filter(Boolean) : []; e.photoKey = e.photoKeys[0] || null; }
  else if (patch.photoKey !== undefined) { e.photoKey = patch.photoKey; e.photoKeys = patch.photoKey ? [patch.photoKey] : []; }
  if (patch.weather !== undefined) e.weather = String(patch.weather || '').slice(0, 80);
  e.editedAt = new Date().toISOString();
  save(); return e;
}
export function deleteJournalEntry(id) {
  const i = store.journal.entries.findIndex((x) => x.id === id);
  if (i >= 0) { store.journal.entries.splice(i, 1); save(); }
}
export function journalEntries() { return store.journal.entries.slice().sort((a, b) => (a.ts < b.ts ? -1 : 1)); }

// --- photo album (pictures the user adds directly; blobs live in IndexedDB) ------
export function getAlbum() {
  if (!store.album || typeof store.album !== 'object') store.album = { photos: [] };
  if (!Array.isArray(store.album.photos)) store.album.photos = [];
  return store.album.photos;
}
export function addAlbumPhoto({ key, caption = '', date = null }) {
  if (!key) return null;
  const ph = { id: uid('alb'), key, caption: String(caption || '').slice(0, 200), date: date || todayKey() };
  getAlbum().push(ph); save(); return ph;
}
export function updateAlbumPhoto(id, patch = {}) {
  const ph = getAlbum().find((x) => x.id === id);
  if (!ph) return null;
  if (patch.caption !== undefined) ph.caption = String(patch.caption || '').slice(0, 200);
  if (patch.date !== undefined) ph.date = patch.date;
  save(); return ph;
}
export function deleteAlbumPhoto(id) {
  const a = getAlbum(); const i = a.findIndex((x) => x.id === id);
  if (i >= 0) { a.splice(i, 1); save(); }
}

// --- travel calendar ---------------------------------------------------------
// Order by date then time; undated-time items sort to the end of their day.
function calKey(x) { return `${x.date} ${x.time || '99:99'}`; }
export function calCompare(a, b) { const ka = calKey(a), kb = calKey(b); return ka < kb ? -1 : (ka > kb ? 1 : 0); }
export function addCalendarItem(item) {
  // Clamp the rating to an integer 0–5 so star rendering (String.repeat) can never throw.
  const rating = Math.max(0, Math.min(5, Math.round(Number(item.rating) || 0)));
  const it = { id: uid('cal'), date: item.date, time: item.time || '', type: item.type || 'stay',
    title: String(item.title || '').slice(0, 120), place: item.place || '',
    cost: item.cost || '', currency: item.currency || '', rating, note: item.note || '',
    remind: (item.remind == null || item.remind === '') ? null : Number(item.remind) };
  store.calendar.items.push(it);
  store.calendar.items.sort(calCompare);
  save(); return it;
}
export function updateCalendarItem(id, patch = {}) {
  const it = store.calendar.items.find((x) => x.id === id);
  if (!it) return null;
  if (patch.date !== undefined) it.date = patch.date;
  if (patch.time !== undefined) it.time = patch.time || '';
  if (patch.type !== undefined) it.type = patch.type || 'stay';
  if (patch.title !== undefined) it.title = String(patch.title || '').slice(0, 120);
  if (patch.place !== undefined) it.place = patch.place || '';
  if (patch.cost !== undefined) it.cost = patch.cost || '';
  if (patch.currency !== undefined) it.currency = patch.currency || '';
  if (patch.rating !== undefined) it.rating = Math.max(0, Math.min(5, Math.round(Number(patch.rating) || 0)));
  if (patch.note !== undefined) it.note = patch.note || '';
  if (patch.remind !== undefined) it.remind = (patch.remind == null || patch.remind === '') ? null : Number(patch.remind);
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
export function updatePin(id, patch = {}) {
  const p = store.pins.find((x) => x.id === id);
  if (!p) return null;
  if (patch.name !== undefined) p.name = String(patch.name || 'My place').slice(0, 80);
  if (patch.note !== undefined) p.note = patch.note;
  if (patch.coords !== undefined) p.coords = patch.coords;
  save(); return p;
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

// The user's last GPS fix, cached on-device so distance/near-me work app-wide and
// offline. Never transmitted. `at` lets callers judge how stale the fix is.
export function getLastFix() {
  const f = store.profile.prefs.lastFix;
  return (f && f.lat != null && f.lng != null) ? f : null;
}
export function setLastFix(coords) {
  if (!coords || coords.lat == null || coords.lng == null) return null;
  store.profile.prefs.lastFix = { lat: coords.lat, lng: coords.lng, at: Date.now() };
  save();
  return store.profile.prefs.lastFix;
}

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

// --- travel circle (backendless contacts) ------------------------------------
// A local, random id identifies the user across the cards they share. It is not
// tied to any account or personal detail and never leaves the device except
// inside a card the user chooses to share.
function newUserId() {
  try { if (typeof crypto !== 'undefined' && crypto.randomUUID) return 'u-' + crypto.randomUUID().replace(/-/g, '').slice(0, 16); } catch { /* noop */ }
  try { const a = new Uint8Array(8); crypto.getRandomValues(a); return 'u-' + Array.from(a, (x) => x.toString(16).padStart(2, '0')).join(''); } catch { /* noop */ }
  return uid('u');
}
function trimEmoji(s) { return Array.from(String(s || '')).slice(0, 2).join('') || '🧭'; }
export function ensureMe() {
  if (!store.social.me.userId) { store.social.me.userId = newUserId(); save(); }
  return store.social.me;
}
export function setMe(patch = {}) {
  const me = store.social.me;
  if (patch.name != null) me.name = String(patch.name).slice(0, 40);
  if (patch.avatar != null) me.avatar = trimEmoji(patch.avatar);
  if (patch.bio != null) me.bio = String(patch.bio).slice(0, 160);
  ensureMe(); save(); return me;
}
export function getContacts() { return Array.isArray(store.social.contacts) ? store.social.contacts : (store.social.contacts = []); }
export function getContact(userId) { return getContacts().find((c) => c.userId === userId) || null; }
export function addContact(card) {
  if (!card || !card.userId) return { ok: false, reason: 'invalid' };
  ensureMe();
  if (card.userId === store.social.me.userId) return { ok: false, reason: 'self' };
  const list = getContacts();
  const rec = {
    userId: String(card.userId).slice(0, 64),
    name: String(card.name || 'Traveller').slice(0, 40),
    avatar: trimEmoji(card.avatar),
    bio: String(card.bio || '').slice(0, 160),
    addedAt: todayKey(),
  };
  const existing = list.find((c) => c.userId === rec.userId);
  if (existing) { existing.name = rec.name; existing.avatar = rec.avatar; existing.bio = rec.bio; save(); return { ok: true, reason: 'updated', contact: existing }; }
  list.push(rec); save(); return { ok: true, reason: 'added', contact: rec };
}
export function removeContact(userId) {
  const list = getContacts();
  const i = list.findIndex((c) => c.userId === userId);
  if (i >= 0) { list.splice(i, 1); save(); }
}

// --- travel circle: inbox (places / lists / trips others shared with you) ----
export function getInbox() { return Array.isArray(store.social.inbox) ? store.social.inbox : (store.social.inbox = []); }
export function addInboxItem({ from = null, kind, data, msg = '' }) {
  const item = {
    id: uid('inb'),
    from: from ? { userId: String(from.userId || '').slice(0, 64), name: String(from.name || 'A traveller').slice(0, 40), avatar: trimEmoji(from.avatar) } : null,
    kind: String(kind || '').slice(0, 16), data: data || {}, msg: String(msg || '').slice(0, 200),
    at: todayKey(), read: false,
  };
  getInbox().unshift(item); save(); return item;
}
export function markInboxRead(id) { const it = getInbox().find((x) => x.id === id); if (it && !it.read) { it.read = true; save(); } }
export function deleteInboxItem(id) { const list = getInbox(); const i = list.findIndex((x) => x.id === id); if (i >= 0) { list.splice(i, 1); save(); } }
export function unreadInboxCount() { return getInbox().filter((x) => !x.read).length; }

// --- travel circle: async message threads (backendless "postcards") ----------
// threads[contactUserId] = [ { from:'me'|'them', text, name, at } ], in send order.
export function getThread(userId) {
  // Defence in depth (see social.js cleanId): never let a reserved key touch the
  // threads object's prototype.
  if (['__proto__', 'constructor', 'prototype'].includes(userId)) return [];
  const t = store.social.threads || (store.social.threads = {});
  return Array.isArray(t[userId]) ? t[userId] : (t[userId] = []);
}
export function addMessage(userId, { from, text, name = '' }) {
  if (!userId || !text) return null;
  const msg = { from: from === 'me' ? 'me' : 'them', text: String(text).slice(0, 800), name: String(name || '').slice(0, 40), at: todayKey() };
  getThread(userId).push(msg); save(); return msg;
}
export function threadUserIds() { const t = store.social.threads || {}; return Object.keys(t).filter((k) => Array.isArray(t[k]) && t[k].length); }

// --- local noticeboard: the user's own posts per city --------------------------
export function getBoardPosts(key) {
  const b = store.boardPosts || (store.boardPosts = {});
  return Array.isArray(b[key]) ? b[key] : (b[key] = []);
}
export function addBoardPost(key, { topic = 'tip', text }) {
  if (!key || !text) return null;
  const p = { id: uid('post'), topic: String(topic).slice(0, 16), text: String(text).slice(0, 500), at: todayKey() };
  getBoardPosts(key).unshift(p); save(); return p;
}
export function deleteBoardPost(key, id) {
  const list = getBoardPosts(key);
  const i = list.findIndex((x) => x.id === id);
  if (i >= 0) { list.splice(i, 1); save(); }
}

// --- offline phrase-audio packs (downloaded per phrasebook language) ------------
export function getAudioPacks() {
  const p = store.profile.prefs;
  return Array.isArray(p.audioPacks) ? p.audioPacks : (p.audioPacks = []);
}
export function hasAudioPack(lang) { return getAudioPacks().includes(lang); }
export function addAudioPack(lang) {
  if (!lang) return;
  const list = getAudioPacks();
  if (!list.includes(lang)) { list.push(lang); save(); }
}
export function removeAudioPack(lang) {
  const list = getAudioPacks();
  const i = list.indexOf(lang);
  if (i >= 0) { list.splice(i, 1); save(); }
}
