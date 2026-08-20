// Versioned localStorage store. Everything lives on the device — nothing ever
// leaves it. Schema migrations keep future updates from wiping saved data.
// Mirrors the Gardenoosh state module (defaults / migrate / save / resetAll).

import { putMeta, getMeta } from './idb.js';

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
        // 'arrived' used to be its own phase, merged into 'traveling' (see js/main.js PHASES).
        phase: '',              // '' | 'planning' | 'traveling' | 'post'
        // Home's dismissible "Just arrived" chip (arrival guide) — X'd out with a confirm,
        // then hidden until brought back from Settings. Not gone for good: rank-collapse-
        // never-remove — the arrival guide itself stays reachable via Explore either way.
        justArrivedHidden: false,
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
        phraseNotes: {},      // { 'th|basics|hello': 'wave when you say it' } — your notes, by phrase key
        // Live-translated ("Say it in X") phrases the traveller typed themselves, auto-saved
        // to the dictionary the same way searching the phrasebook auto-pins a match — these
        // have no static category to belong to, so they get their own per-language list
        // instead of phrasePins. { th: [{ key, en, script, ts }, …] } — order IS display order.
        customPhrases: {},
        // --- "things to do near me" suggestion rotation. Marking a suggestion Done or Not
        // interested removes it so a fresh one takes its place; suggestions never repeat the
        // same set. Both hold place ids. doneSpots is a light achievement log too.
        doneSpots: [],        // places the traveller has done — dropped from suggestions
        hiddenSpots: [],      // places dismissed as "not interested" — dropped from suggestions
        recentSearches: [],   // last few committed search terms (most-recent first, capped) — Search launchpad
        hintsSeen: {},        // { 'home-phase': true, … } — one-time contextual hints the user has dismissed
        readRate: 1,          // read-aloud playback speed (1 | 1.25 | 1.5 | 2) — remembered across reads
        showSetupRecap: false, // one-shot: after the value-first first run, Home shows a "here is what I set up" recap
        // --- personal identifier: things the traveller pinned from the identify tools
        // (dishes, market produce, wildlife). Flat list of "type:id" keys; pin order IS
        // display order. Self-defaults via the migrate spread — no store-version bump.
        idPins: [],           // ['dish:pad-thai', 'produce:mangosteen', 'species:tokay-gecko', …]
        // Per-pin organisation, keyed by the same "type:id" key. `tags` are the user's own
        // categories (free text); `note` is a short personal note. Both optional and
        // self-defaulting — a key only appears once the user tags or annotates that pin.
        idPinMeta: {},        // { 'dish:pad-thai': { tags: ['Want to try'], note: 'stall by the market' } }
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
      stops: [],                // { id, title, country, date:'YYYY-MM-DD'(arrive), endDate:'YYYY-MM-DD'(leave, optional) }
      budgetLog: [],            // { id, date:'YYYY-MM-DD', amount, currency, note, category, monthly:bool }
      // Cash withdrawn/drawn against the overall trip budget — tracked separately from the
      // itemised, per-category budgetLog above (see budgetWithdrawalsCard in main.js): a
      // coarser but often more honest second read on "how much of my budget is actually gone."
      withdrawals: [],          // { id, date:'YYYY-MM-DD', amount, currency, note }
      // v13: a place (curated or a user pin) tagged to a trip leg — a stop is a dated city-leg,
      // a place is a point of interest inside one, and they are not 1:1, so this is its own
      // list rather than a property on the stop. `stopId: null` means "not scheduled to a leg
      // yet" (e.g. added from Explore before that city has a stop) — never blocked, never forced.
      placeVisits: [],          // { id, placeId, stopId:string|null, note, addedAt }
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
      listings: [],   // v12: local P2P classifieds — currency swaps + gear/motorbike hand-offs.
                      // { id, cat:'swap'|'gear', ...fields, mine:true|false, from?, ts }. On-device;
                      // shared only inside links the user chooses to send. No server, no PII.
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
        listings: Array.isArray(s.listings) ? s.listings : [],
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
// the backup is warranted (we never overwrite real data with an empty default) — gates BOTH
// load()'s .bak fallback and ensureDurability()'s IndexedDB-mirror restore, so an under-
// counting bug here is a real data-loss risk, not just a display nit: if the live store's
// only real content lived in a field this function did not check, ensureDurability() would
// read `false` and could silently replace the live store with a stale mirror snapshot on
// the very next boot. Audited to cover every user-generated field in defaults() above —
// previously missed trip.stops/placeVisits/withdrawals, myStay, savedAreas, all of social,
// album photos, board posts, and the personal calendar, none of which are reproducible if
// wrongly discarded.
function hasUserData(s) {
  if (!s || typeof s !== 'object') return false;
  const trip = s.trip || {};
  const social = s.social || {};
  const personal = s.personal || {};
  const j = s.journal && Array.isArray(s.journal.entries) && s.journal.entries.length;
  const b = Array.isArray(trip.budgetLog) && trip.budgetLog.length;
  const stops = Array.isArray(trip.stops) && trip.stops.length;
  const visits = Array.isArray(trip.placeVisits) && trip.placeVisits.length;
  const wd = Array.isArray(trip.withdrawals) && trip.withdrawals.length;
  const c = s.calendar && Array.isArray(s.calendar.items) && s.calendar.items.length;
  const p = Array.isArray(s.pins) && s.pins.length;
  const col = Array.isArray(s.collections) && s.collections.length;
  const pd = s.placeData && typeof s.placeData === 'object' && Object.keys(s.placeData).length;
  const f = Array.isArray(s.favorites) && s.favorites.length;
  const stay = s.myStay && s.myStay.coords;
  const areas = Array.isArray(s.savedAreas) && s.savedAreas.length;
  const contacts = Array.isArray(social.contacts) && social.contacts.length;
  const threads = social.threads && typeof social.threads === 'object' && Object.keys(social.threads).length;
  const listings = Array.isArray(social.listings) && social.listings.length;
  const album = s.album && Array.isArray(s.album.photos) && s.album.photos.length;
  const board = s.boardPosts && typeof s.boardPosts === 'object'
    && Object.values(s.boardPosts).some((arr) => Array.isArray(arr) && arr.length);
  const per = (Array.isArray(personal.partners) && personal.partners.length)
    || (personal.days && typeof personal.days === 'object' && Object.keys(personal.days).length)
    || personal.pregnancy;
  return !!(j || b || stops || visits || wd || c || p || col || pd || f
    || stay || areas || contacts || threads || listings || album || board || per);
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

let _saveTimer = null;
let _lastWritten = null;   // the last JSON we wrote to KEY — known-good, so backups need no re-parse

function flushSave() {
  if (_saveTimer) { clearTimeout(_saveTimer); _saveTimer = null; }
  try {
    const next = JSON.stringify(store);
    // Roll the previous good copy into the backup slot BEFORE overwriting, so a failed/partial
    // write or a bad update can never leave the traveller with nothing. When the previous copy
    // came from THIS session it is already valid JSON (we serialised it), so we skip the
    // defensive parse; only the very first write validates the on-disk value it inherited.
    const prev = _lastWritten != null ? _lastWritten : localStorage.getItem(KEY);
    if (prev && prev !== next && prev.length > 2) {
      let ok = true;
      if (_lastWritten == null) { try { JSON.parse(prev); } catch { ok = false; } }
      if (ok) { try { localStorage.setItem(BAK, prev); } catch { /* backup best-effort */ } }
    }
    localStorage.setItem(KEY, next);
    _lastWritten = next;
  } catch {
    // storage full or private mode — the session still works, it just will not persist
  }
  // Third copy, in a SEPARATE storage bucket (IndexedDB): localStorage can be cleared as a
  // whole — taking the primary AND its .bak with it — whereas IndexedDB survives that. This
  // mirror is what makes "backed up after every addition" true on a server-less app. Async,
  // debounced and best-effort so it never blocks or breaks a save.
  try { mirrorStore(); } catch { /* mirror is best-effort */ }
}

// Public save: coalesce a burst of mutations into ONE localStorage write on a short timer.
// A pagehide / tab-hidden flush (installed below) guarantees the latest state is persisted the
// instant the tab goes away, so the debounce never risks data loss.
export function save() {
  if (typeof setTimeout !== 'function') { flushSave(); return; }
  if (_saveTimer) return;                 // a flush is already scheduled — it will read the latest store
  _saveTimer = setTimeout(flushSave, 200);
}
// Force any pending write out immediately (used on pagehide and by callers that must persist now).
export function flushSaveNow() { flushSave(); }
if (typeof window !== 'undefined' && window.addEventListener) {
  window.addEventListener('pagehide', flushSave);
  window.addEventListener('beforeunload', flushSave);
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') flushSave(); });
}

let _mirrorTimer = null;
function mirrorStore() {
  if (typeof putMeta !== 'function') return;
  if (typeof setTimeout !== 'function') { putMeta('store', JSON.stringify(store)).catch(() => {}); return; }
  if (_mirrorTimer) return;                       // coalesce bursts of saves into one write
  _mirrorTimer = setTimeout(() => {
    _mirrorTimer = null;
    try { putMeta('store', JSON.stringify(store)).catch(() => {}); } catch { /* ignore */ }
  }, 600);
}

// Called once on boot. (1) Requests durable storage so the browser will not silently evict
// the traveller's data under space pressure. (2) If localStorage came back empty (cleared or
// blocked) but the IndexedDB mirror still holds real entries, restores from it. Returns
// { recovered } so the caller can re-render. Best-effort throughout — never throws.
export async function ensureDurability() {
  try { if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.persist) await navigator.storage.persist(); } catch { /* not supported */ }
  try {
    if (!hasUserData(store)) {
      const mj = await getMeta('store');
      if (mj) {
        const rec = migrate(JSON.parse(mj));
        if (hasUserData(rec)) {
          Object.keys(store).forEach((k) => { delete store[k]; });
          Object.assign(store, rec);
          save();
          return { recovered: true };
        }
      }
    } else {
      mirrorStore();   // keep the mirror current with whatever loaded
    }
  } catch { /* recovery is best-effort */ }
  return { recovered: false };
}

// A snapshot of on-device durability for the Settings screen: whether storage is marked
// persistent (evict-resistant) and roughly how much space the app is using.
export async function storageStatus() {
  const out = { persisted: null, usageMB: null, quotaMB: null };
  try { if (navigator.storage && navigator.storage.persisted) out.persisted = await navigator.storage.persisted(); } catch { /* ignore */ }
  try { if (navigator.storage && navigator.storage.estimate) { const e = await navigator.storage.estimate(); if (e.usage != null) out.usageMB = e.usage / 1048576; if (e.quota != null) out.quotaMB = e.quota / 1048576; } } catch { /* ignore */ }
  return out;
}
export async function requestPersistence() {
  try { if (navigator.storage && navigator.storage.persist) return await navigator.storage.persist(); } catch { /* ignore */ }
  return false;
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
export function addStop({ title, country = '', date = '', endDate = '' }) {
  // `date` is the arrival day; `endDate` is an optional departure day so one stop can cover a
  // range (e.g. ten days in one city) instead of a stop per day. Old stored stops have no endDate.
  const s = { id: uid('stop'), title: String(title || '').slice(0, 80), country, date, endDate: endDate || '' };
  store.trip.stops.push(s); save(); return s;
}
export function removeStop(id) {
  const i = store.trip.stops.findIndex((x) => x.id === id);
  if (i >= 0) {
    store.trip.stops.splice(i, 1);
    // Places tagged to this leg fall back to "unscheduled" rather than vanishing with it —
    // consistent with this file's non-destructive-by-design data philosophy (see migrate()).
    store.trip.placeVisits.forEach((v) => { if (v.stopId === id) v.stopId = null; });
    save();
  }
}
export function moveStop(id, dir) {
  const a = store.trip.stops; const i = a.findIndex((x) => x.id === id);
  const j = i + dir;
  if (i < 0 || j < 0 || j >= a.length) return;
  [a[i], a[j]] = [a[j], a[i]]; save();
}
export function updateStop(id, patch = {}) {
  const s = store.trip.stops.find((x) => x.id === id);
  if (!s) return null;
  if (patch.title !== undefined) s.title = String(patch.title || s.title).slice(0, 80);
  if (patch.date !== undefined) s.date = patch.date;
  if (patch.endDate !== undefined) s.endDate = patch.endDate || '';
  if (patch.country !== undefined) s.country = patch.country;
  save(); return s;
}

// --- trip planner: place visits (S4 — a place tagged to a leg, or left unscheduled) --------
// A stop is a dated city-leg; a place is a point of interest inside one, and the two are not
// 1:1 (a leg can hold many places; a place can be of interest before any matching leg exists) —
// so a visit is its own small record rather than a property folded onto the stop.
export function addPlaceVisit({ placeId, stopId = null, note = '' }) {
  if (!placeId) return null;
  // Already tagged to this exact leg (or already unscheduled, if stopId is null) — no duplicate.
  const dupe = store.trip.placeVisits.find((v) => v.placeId === placeId && v.stopId === (stopId || null));
  if (dupe) return dupe;
  const v = { id: uid('visit'), placeId, stopId: stopId || null, note: String(note || '').slice(0, 160), addedAt: todayKey() };
  store.trip.placeVisits.push(v); save(); return v;
}
export function removePlaceVisit(id) {
  const i = store.trip.placeVisits.findIndex((x) => x.id === id);
  if (i >= 0) { store.trip.placeVisits.splice(i, 1); save(); }
}
export function updatePlaceVisit(id, patch = {}) {
  const v = store.trip.placeVisits.find((x) => x.id === id);
  if (!v) return null;
  if (patch.stopId !== undefined) v.stopId = patch.stopId || null;
  if (patch.note !== undefined) v.note = String(patch.note || '').slice(0, 160);
  save(); return v;
}
export function visitsForStop(stopId) {
  return store.trip.placeVisits.filter((v) => v.stopId === stopId);
}
export function unscheduledVisits() {
  return store.trip.placeVisits.filter((v) => !v.stopId);
}
export function addBudgetItem({ date, amount, currency, note, category, monthly }) {
  const b = { id: uid('bud'), date: date || todayKey(), amount: amount || '', currency: currency || '', note: note || '', category: category || 'other', monthly: !!monthly };
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
  if (patch.category !== undefined) b.category = patch.category;
  if (patch.monthly !== undefined) b.monthly = !!patch.monthly;
  store.trip.budgetLog.sort((a, c) => (a.date < c.date ? -1 : 1));
  save(); return b;
}

// Cash withdrawn/drawn against the overall trip budget — see the withdrawals note on the trip
// schema above. Deliberately simpler than a budget-log item (no category): mirrors
// addBudgetItem/deleteBudgetItem exactly otherwise.
export function addWithdrawal({ date, amount, currency, note }) {
  const w = { id: uid('wd'), date: date || todayKey(), amount: amount || '', currency: currency || '', note: note || '' };
  store.trip.withdrawals = store.trip.withdrawals || [];
  store.trip.withdrawals.push(w);
  store.trip.withdrawals.sort((a, c) => (a.date < c.date ? -1 : 1));
  save(); return w;
}
export function deleteWithdrawal(id) {
  const list = store.trip.withdrawals || [];
  const i = list.findIndex((x) => x.id === id);
  if (i >= 0) { list.splice(i, 1); save(); }
}
export function updateWithdrawal(id, patch = {}) {
  const list = store.trip.withdrawals || [];
  const w = list.find((x) => x.id === id);
  if (!w) return null;
  if (patch.amount !== undefined) w.amount = patch.amount;
  if (patch.currency !== undefined) w.currency = patch.currency;
  if (patch.note !== undefined) w.note = patch.note;
  if (patch.date !== undefined) w.date = patch.date;
  list.sort((a, c) => (a.date < c.date ? -1 : 1));
  save(); return w;
}

// --- travel journal ----------------------------------------------------------
export function addJournalEntry({ title, text, place = '', coords = null, ts = null, photoKey = null, photoKeys = null, weather = '', audioKey = null }) {
  const when = ts || new Date().toISOString();
  const keys = Array.isArray(photoKeys) ? photoKeys.filter(Boolean) : (photoKey ? [photoKey] : []);
  const e = { id: uid('jr'), ts: when, date: when.slice(0, 10),
    title: String(title || 'Untitled').slice(0, 120), text: String(text || ''), place, coords,
    photoKeys: keys, photoKey: keys[0] || null,   // photoKey kept = first photo, for older readers
    audioKey: audioKey || null,                   // IndexedDB key of the original voice recording
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
  if (patch.audioKey !== undefined) e.audioKey = patch.audioKey || null;
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

// Community jellyfish sightings on a beach place. An additive array on placeData[id],
// so reports ride along in the full backup. Each report = { d:'YYYY-MM-DD', sev, note, by }.
// Newest first, capped, and de-duplicated so re-opening a shared link never piles up copies.
export function getJellyReports(id) {
  const d = store.placeData[id];
  return (d && Array.isArray(d.jellyReports)) ? d.jellyReports : [];
}
export function addJellyReport(id, report) {
  const d = store.placeData[id] || { note: '', rating: 0, review: '' };
  if (!Array.isArray(d.jellyReports)) d.jellyReports = [];
  const key = (r) => `${r.d}|${r.sev}|${r.note || ''}|${r.by || ''}`;
  if (!d.jellyReports.some((r) => key(r) === key(report))) {
    d.jellyReports.unshift(report);
    d.jellyReports = d.jellyReports.slice(0, 50);
    d.updatedAt = todayKey();
    store.placeData[id] = d; save();
  }
  return d.jellyReports;
}

// --- unique-id helper --------------------------------------------------------
// Prefers crypto.randomUUID() for a collision-proof id; always keeps a monotonically
// increasing `-<seq>` suffix so ids stay unique even if the random source is unavailable or a
// test pins it. Tests can inject a deterministic source via setIdSource(fn); fn receives the
// running sequence number. Ids are opaque lookup keys, never parsed, so the format is free to
// change and existing stored ids are unaffected.
let _seq = 0;
let _idSource = null;
export function setIdSource(fn) { _idSource = (typeof fn === 'function') ? fn : null; }
function uid(prefix) {
  _seq += 1;
  if (_idSource) return `${prefix}-${_idSource(_seq)}`;
  try {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return `${prefix}-${crypto.randomUUID().replace(/-/g, '').slice(0, 12)}-${_seq}`;
    }
  } catch { /* fall through to the deterministic path */ }
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
  if (patch.tags !== undefined) p.tags = Array.isArray(patch.tags) ? patch.tags : p.tags;
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
// Drops every saved-area RECORD (name/bounds/tile count) in one go. Callers are responsible
// for also clearing the actual cached tiles behind them (js/map.js's clearTileCache()) — this
// only clears the list places.js renders, so the two stay in sync rather than leaving stale
// "saved area" entries pointing at tiles that no longer exist in Cache Storage.
export function clearSavedAreas() { store.savedAreas = []; save(); }

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

// --- travel circle: local classifieds (currency swaps + gear hand-offs) --------
// On-device listings the user posts or saves from a shared link. Nothing is sent
// anywhere automatically; a listing travels only inside a link the user shares.
export function getListings() { return Array.isArray(store.social.listings) ? store.social.listings : (store.social.listings = []); }
export function addListing(rec) {
  const item = {
    id: uid('lst'),
    cat: (String(rec.cat || 'other').replace(/[^a-z]/g, '').slice(0, 12)) || 'other',
    mine: rec.mine !== false,
    from: rec.from ? { userId: String(rec.from.userId || '').slice(0, 64), name: String(rec.from.name || 'A traveller').slice(0, 40), avatar: trimEmoji(rec.from.avatar) } : null,
    data: rec.data || {},
    at: todayKey(), ts: Date.now(),
  };
  getListings().unshift(item); save(); return item;
}
export function removeListing(id) { const list = getListings(); const i = list.findIndex((x) => x.id === id); if (i >= 0) { list.splice(i, 1); save(); } }

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
  const mine = from === 'me';
  // Your own messages start read (you just wrote them); theirs start unread so the circle
  // badge below can surface "you have a message you haven't opened" without a server.
  const msg = { from: mine ? 'me' : 'them', text: String(text).slice(0, 800), name: String(name || '').slice(0, 40), at: todayKey(), read: mine };
  getThread(userId).push(msg); save(); return msg;
}
export function threadUserIds() { const t = store.social.threads || {}; return Object.keys(t).filter((k) => Array.isArray(t[k]) && t[k].length); }
export function markThreadRead(userId) {
  const th = getThread(userId);
  let changed = false;
  th.forEach((m) => { if (!m.read) { m.read = true; changed = true; } });
  if (changed) save();
}
// from !== 'me' guards threads saved before this field existed: an old sent-by-you message
// has no `read` flag at all, and should never count as an unread notification for yourself.
export function unreadThreadCount(userId) { return getThread(userId).filter((m) => m.from !== 'me' && !m.read).length; }
export function unreadMessagesCount() { return threadUserIds().reduce((n, id) => n + unreadThreadCount(id), 0); }

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
