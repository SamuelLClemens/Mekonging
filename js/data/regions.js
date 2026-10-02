// Region registry — the single source of truth for countries, their languages, and
// the data modules wired to each. Screens read everything from here, so no screen
// hard-codes a destination. Mirrors the Gardenoosh tracks.js registry pattern.
//
// Lazy per-country loading: each COUNTRIES entry ships as metadata only (id, name,
// flag, currency, lang, cities). Its places/food/prices/routes/info/guide/events and
// local boards arrive via loadCountry(cc), called once per country by the router
// (js/main.js render()) before dispatching any screen that reads them — see the
// NEEDS_COUNTRY_DATA / NEEDS_ALL_COUNTRIES tables there. This keeps a traveller's
// first paint from parsing all four countries' data (~2 MB) for the one they are in.
// allPlaces()/getCountry()/getPlace() stay fully synchronous either way: no module-
// evaluation-time code anywhere reads place data, only function bodies, so the data
// may arrive after this module finishes loading without any call site changing.

import { canonicalPlaceId } from './place-merges.js';
import { HISTORY } from './history.js';
// The phrasebooks used to be imported here, which put all 107.6 KB of them on the launch
// path via screens/home.js. They now live in js/data/phrasebooks.js and load on demand —
// import { LANGUAGES, getLanguage } from '../lazy-data.js' instead of from here.

export const COUNTRIES = [
  {
    id: 'th', name: 'Thailand', flag: '🇹🇭', currency: 'THB', lang: 'th',
    cities: ['Bangkok', 'Chiang Mai', 'Krabi', 'Koh Lanta', 'Pai'],
    places: [], prices: null, routes: null, info: null, guide: null, events: [], food: [], _localBoards: [], _loaded: false,
  },
  {
    id: 'vi', name: 'Vietnam', flag: '🇻🇳', currency: 'VND', lang: 'vi',
    cities: ['Hanoi', 'Ho Chi Minh City', 'Hoi An', 'Da Nang'],
    places: [], prices: null, routes: null, info: null, guide: null, events: [], food: [], _localBoards: [], _loaded: false,
  },
  {
    id: 'kh', name: 'Cambodia', flag: '🇰🇭', currency: 'KHR', lang: 'km',
    cities: ['Phnom Penh', 'Siem Reap'],
    places: [], prices: null, routes: null, info: null, guide: null, events: [], food: [], _localBoards: [], _loaded: false,
  },
  {
    id: 'la', name: 'Laos', flag: '🇱🇦', currency: 'LAK', lang: 'lo',
    cities: ['Vientiane', 'Luang Prabang'],
    places: [], prices: null, routes: null, info: null, guide: null, events: [], food: [], _localBoards: [], _loaded: false,
  },
];

export function getCountry(id) { return COUNTRIES.find((c) => c.id === id) || null; }

// ---- Lazy per-country data loading ------------------------------------------
// City history rides along here too. It used to be 99 KB of js/data/history.js parsed on
// every launch; it is now this country's share of it, arriving with that country's places,
// food and prices. HISTORY.cities is MUTATED rather than reassigned, so every existing
// `HISTORY.cities[key]` read sees the new entries without a single call-site change — the
// live-binding technique js/lazy-data.js documents. A read before the country lands gets
// undefined, which is what an unknown city already returned.
// One loader per country, each a straight dynamic-import mirror of what used to be
// static top-of-file imports + the COUNTRIES literal spread. Every module imported
// here is precached by the service worker (sw.js PRECACHE), so this fetches from the
// Cache Storage offline exactly as it would from the network online — the only way
// this fails offline is if the file was never precached in the first place, same as
// any other asset in this app.
// Each loader takes `bust` — '' on the first attempt, '?retry=N' on every attempt after a
// failure (see loadCountry below). A FAILED dynamic import() is permanent: the spec records
// the rejection against that exact specifier in the page's module map, so importing
// './places.kh.js' again after it has failed once resolves the cached rejection instantly
// rather than genuinely refetching. A different query string is a different module-map
// entry, so the retry actually re-requests. The service worker matches its cache with
// ignoreSearch (sw.js), so the busted URL still hits the offline copy once cached. Mirrors
// js/main.js's SCREEN_LOADERS/loadScreenMod bust-token pattern exactly.
async function loadTH(c, bust = '') {
  const [
    { PLACES_TH }, { PLACES_TH_EXT }, { PRICES_TH }, { ROUTES_TH }, { INFO_TH },
    { GUIDE_TH }, { EVENTS_TH }, { FOOD_TH }, { FOOD_TH_EXT }, { LOCAL_TH },
    { HISTORY_CITIES_TH },
  ] = await Promise.all([
    import('./places.th.js' + bust), import('./places.th.ext.js' + bust), import('./prices.th.js' + bust),
    import('./routes.th.js' + bust), import('./info.th.js' + bust), import('./guide.th.js' + bust),
    import('./events.th.js' + bust), import('./food.th.js' + bust), import('./food.th.ext.js' + bust), import('./local.th.js' + bust),
    import('./history.cities.th.js' + bust),
  ]);
  c.places = [...PLACES_TH, ...PLACES_TH_EXT];
  c.prices = PRICES_TH; c.routes = ROUTES_TH; c.info = INFO_TH; c.guide = GUIDE_TH;
  c.events = EVENTS_TH.events; c.food = [...FOOD_TH.dishes, ...FOOD_TH_EXT];
  c._localBoards = LOCAL_TH;
  Object.assign(HISTORY.cities, HISTORY_CITIES_TH);
}
async function loadVI(c, bust = '') {
  const [
    { PLACES_VI }, { PLACES_VI_EXT }, { PRICES_VI }, { ROUTES_VI }, { INFO_VI },
    { GUIDE_VI }, { EVENTS_VI }, { FOOD_VI }, { FOOD_VI_EXT }, { LOCAL_VI },
    { HISTORY_CITIES_VI },
  ] = await Promise.all([
    import('./places.vi.js' + bust), import('./places.vi.ext.js' + bust), import('./prices.vi.js' + bust),
    import('./routes.vi.js' + bust), import('./info.vi.js' + bust), import('./guide.vi.js' + bust),
    import('./events.vi.js' + bust), import('./food.vi.js' + bust), import('./food.vi.ext.js' + bust), import('./local.vi.js' + bust),
    import('./history.cities.vi.js' + bust),
  ]);
  c.places = [...PLACES_VI, ...PLACES_VI_EXT];
  c.prices = PRICES_VI; c.routes = ROUTES_VI; c.info = INFO_VI; c.guide = GUIDE_VI;
  c.events = EVENTS_VI.events; c.food = [...FOOD_VI.dishes, ...FOOD_VI_EXT];
  c._localBoards = LOCAL_VI;
  Object.assign(HISTORY.cities, HISTORY_CITIES_VI);
}
async function loadKH(c, bust = '') {
  const [
    { PLACES_KH }, { PLACES_KH_EXT }, { PRICES_KH }, { ROUTES_KH }, { INFO_KH },
    { GUIDE_KH }, { EVENTS_KH }, { FOOD_KH }, { FOOD_KH_EXT }, { LOCAL_KH },
    { HISTORY_CITIES_KH },
  ] = await Promise.all([
    import('./places.kh.js' + bust), import('./places.kh.ext.js' + bust), import('./prices.kh.js' + bust),
    import('./routes.kh.js' + bust), import('./info.kh.js' + bust), import('./guide.kh.js' + bust),
    import('./events.kh.js' + bust), import('./food.kh.js' + bust), import('./food.kh.ext.js' + bust), import('./local.kh.js' + bust),
    import('./history.cities.kh.js' + bust),
  ]);
  c.places = [...PLACES_KH, ...PLACES_KH_EXT];
  c.prices = PRICES_KH; c.routes = ROUTES_KH; c.info = INFO_KH; c.guide = GUIDE_KH;
  c.events = EVENTS_KH.events; c.food = [...FOOD_KH.dishes, ...FOOD_KH_EXT];
  c._localBoards = LOCAL_KH;
  Object.assign(HISTORY.cities, HISTORY_CITIES_KH);
}
async function loadLA(c, bust = '') {
  const [
    { PLACES_LA }, { PLACES_LA_EXT }, { PRICES_LA }, { ROUTES_LA }, { INFO_LA },
    { GUIDE_LA }, { EVENTS_LA }, { FOOD_LA }, { FOOD_LA_EXT }, { LOCAL_LA },
    { HISTORY_CITIES_LA },
  ] = await Promise.all([
    import('./places.la.js' + bust), import('./places.la.ext.js' + bust), import('./prices.la.js' + bust),
    import('./routes.la.js' + bust), import('./info.la.js' + bust), import('./guide.la.js' + bust),
    import('./events.la.js' + bust), import('./food.la.js' + bust), import('./food.la.ext.js' + bust), import('./local.la.js' + bust),
    import('./history.cities.la.js' + bust),
  ]);
  c.places = [...PLACES_LA, ...PLACES_LA_EXT];
  c.prices = PRICES_LA; c.routes = ROUTES_LA; c.info = INFO_LA; c.guide = GUIDE_LA;
  c.events = EVENTS_LA.events; c.food = [...FOOD_LA.dishes, ...FOOD_LA_EXT];
  c._localBoards = LOCAL_LA;
  Object.assign(HISTORY.cities, HISTORY_CITIES_LA);
}
const COUNTRY_LOADERS = { th: loadTH, vi: loadVI, kh: loadKH, la: loadLA };

// In-flight/settled load promises, keyed by country id. Deleted on failure so a later
// retry (e.g. the connection comes back) gets a fresh attempt rather than a
// permanently-rejected cache entry.
const _countryLoads = {};
// Countries whose load failed this session. A failed import() stays failed in the module map,
// so a bare retry of the same specifier cannot succeed; the emergency routes read this to
// render without the data rather than spin on "Loading…", and every OTHER route reads it
// (js/main.js render()) to stop re-requesting forever and show a retry card instead — see
// countryUnavailableScreen there. _countryTries/clearCountryFailure below are what give a
// genuine retry (a fresh URL) a real chance to succeed instead of replaying the same failure.
const _countryFailed = new Set();
export function countryLoadFailed(cc) { return _countryFailed.has(cc); }
// Lets a Retry button (or the 'online' event) give this country another real attempt: clears
// the permanent-failure flag so the router's gate treats it as pending again, and loadCountry
// below picks a fresh bust token so the import() genuinely re-requests rather than replaying
// the browser's cached rejection for the old specifier.
export function clearCountryFailure(cc) { _countryFailed.delete(cc); }

export function isCountryLoaded(cc) {
  const c = getCountry(cc);
  return !!(c && c._loaded);
}

// How many times loadCountry has been asked to fetch each country, successful or not — the
// bust-token counter, same idiom as js/main.js's _screenTries.
const _countryTries = {};

// Fetches and wires in one country's data. Safe to call repeatedly and from several
// screens at once — concurrent calls for the same country share one in-flight load.
export function loadCountry(cc) {
  const c = getCountry(cc);
  if (!c) return Promise.resolve(null);
  if (c._loaded) return Promise.resolve(c);
  if (_countryLoads[cc]) return _countryLoads[cc];
  const loader = COUNTRY_LOADERS[cc];
  if (!loader) return Promise.resolve(c);
  const n = _countryTries[cc] = (_countryTries[cc] || 0) + 1;
  const p = loader(c, n > 1 ? `?retry=${n}` : '')
    .then(() => { c._loaded = true; _countryFailed.delete(cc); return c; })
    .catch((err) => { delete _countryLoads[cc]; _countryFailed.add(cc); throw err; });
  _countryLoads[cc] = p;
  return p;
}

// For the handful of screens that read across every country at once (universal
// search, the full multi-country map, the cross-border route/journey planner, and a
// traveller's own saved places — which may span countries they have already visited).
export function loadAllCountries() {
  return Promise.all(COUNTRIES.map((c) => loadCountry(c.id)));
}

// All places across every country that has them, optionally filtered.
// filter: { country?, interests?: string[], budget?: 'low'|'mid'|'high'|'flexible' }
export function allPlaces(filter = {}) {
  let out = COUNTRIES.flatMap((c) => Array.isArray(c.places) ? c.places : []);
  if (filter.country) out = out.filter((p) => p.country === filter.country);
  if (Array.isArray(filter.interests) && filter.interests.length) {
    out = out.filter((p) => Array.isArray(p.categories) && p.categories.some((cat) => filter.interests.includes(cat)));
  }
  if (filter.budget && filter.budget !== 'flexible') {
    out = out.filter((p) => p.budgetTier === filter.budget || p.budgetTier === 'any');
  }
  return out;
}

export function getPlace(id) {
  const all = allPlaces();
  const hit = all.find((p) => p.id === id);
  if (hit) return hit;
  // An id that no longer exists may be one half of a merged pair — a bookmarked route, a
  // shared link, or an inbox item from before the merge. See js/data/place-merges.js.
  const canon = canonicalPlaceId(id);
  return canon === id ? null : (all.find((p) => p.id === canon) || null);
}

// Local noticeboards (per-city local knowledge: markets & schedules, where locals
// shop, family supplies, cheap eats, street food). Keyed '<country>-<slug>'. Lives on
// each country's own _localBoards (populated by loadCountry) rather than one eagerly-
// built global array, so reading another country's boards before it loads returns [].
export function boardsForCountry(cc) {
  const c = getCountry(cc);
  return (c && Array.isArray(c._localBoards)) ? c._localBoards : [];
}
export function getBoard(cc, slug) { return boardsForCountry(cc).find((b) => b.country === cc && b.slug === slug) || null; }

// Festivals / public holidays. getEvents(country) returns one country's list;
// allEvents() flattens every country and tags each event with its country id,
// name and flag so the calendar and festivals screen can show provenance.
export function getEvents(id) {
  const c = getCountry(id);
  return c && Array.isArray(c.events) ? c.events : [];
}
export function allEvents() {
  return COUNTRIES.flatMap((c) => (Array.isArray(c.events) ? c.events : [])
    .map((e) => ({ ...e, country: c.id, countryName: c.name, flag: c.flag })));
}
export function getEvent(id) {
  return allEvents().find((e) => e.id === id) || null;
}

// Dishes. getFood(country) returns one country's list; allFood() flattens every
// country and tags each dish with its country id, name and flag.
export function getFood(id) {
  const c = getCountry(id);
  return c && Array.isArray(c.food) ? c.food : [];
}
export function allFood() {
  return COUNTRIES.flatMap((c) => (Array.isArray(c.food) ? c.food : [])
    .map((d) => ({ ...d, country: c.id, countryName: c.name, flag: c.flag })));
}
export function getDish(id) {
  return allFood().find((d) => d.id === id) || null;
}

export const FOOD_CATEGORIES = [
  { id: 'noodle', label: 'Noodles', emoji: '🍜' },
  { id: 'rice', label: 'Rice dishes', emoji: '🍚' },
  { id: 'soup', label: 'Soups', emoji: '🥣' },
  { id: 'curry', label: 'Curries', emoji: '🍛' },
  { id: 'grill', label: 'Grilled & BBQ', emoji: '🔥' },
  { id: 'salad', label: 'Salads', emoji: '🥗' },
  { id: 'snack', label: 'Snacks & rolls', emoji: '🥟' },
  { id: 'street', label: 'Street food', emoji: '🥪' },
  { id: 'breakfast', label: 'Breakfast', emoji: '🍳' },
  { id: 'sweet', label: 'Sweets', emoji: '🍮' },
  { id: 'drink', label: 'Drinks', emoji: '🥤' },
];
// Allergens used across the dish data, for the "hide dishes with…" filter.
export const FOOD_ALLERGENS = ['peanut', 'tree nut', 'shellfish', 'fish', 'egg', 'soy', 'gluten', 'dairy', 'sesame'];

export const INTERESTS = [
  { id: 'food', emoji: '🍜', label: 'Food & markets' },
  { id: 'culture', emoji: '🏛', label: 'Culture & history' },
  { id: 'nature', emoji: '🌿', label: 'Nature & outdoors' },
  { id: 'nightlife', emoji: '🌃', label: 'Nightlife & social' },
];

// Suggested collections (themes/tags) the user can create with one tap. They can
// also create their own with a custom name + emoji. Keep this list broad — the
// point is the easiest possible way to organise places and find them again.
export const COLLECTION_PRESETS = [
  { name: 'Food', emoji: '🍜' },
  { name: 'Street food', emoji: '🥢' },
  { name: 'Restaurants', emoji: '🍽️' },
  { name: 'Cafes', emoji: '☕' },
  { name: 'Night markets', emoji: '🌙' },
  { name: 'Street markets', emoji: '🛍️' },
  { name: 'Nightlife', emoji: '🍸' },
  { name: 'Temples', emoji: '🛕' },
  { name: 'Museums', emoji: '🏛️' },
  { name: 'Nature', emoji: '🌿' },
  { name: 'Beaches', emoji: '🏖️' },
  { name: 'Parks', emoji: '🌳' },
  { name: 'Playgrounds', emoji: '🛝' },
  { name: 'Viewpoints', emoji: '🌄' },
  { name: 'Shopping', emoji: '🛒' },
  { name: 'Wellness', emoji: '💆' },
  { name: 'Fun & activities', emoji: '🎉' },
];
