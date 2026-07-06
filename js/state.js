// Versioned localStorage store. Everything lives on the device — nothing ever
// leaves it. Schema migrations keep future updates from wiping saved data.
// Mirrors the Gardenoosh state module (defaults / migrate / save / resetAll).

const KEY = 'mk.store';
const CURRENT_VERSION = 9;

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
        tripLength: '',         // '' | 'short' (≤1wk) | 'medium' (2–3wk) | 'long' (1mo+)
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
  store.social = fresh.social;
  store.boardPosts = fresh.boardPosts;
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
