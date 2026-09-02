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

import { HISTORY } from './history.js';
import { PHRASEBOOK_TH } from './phrasebook.th.js';
import { PHRASEBOOK_VI } from './phrasebook.vi.js';
import { PHRASEBOOK_KM } from './phrasebook.km.js';
import { PHRASEBOOK_LO } from './phrasebook.lo.js';
import { PHRASEBOOK_ZH } from './phrasebook.zh.js';
import { PHRASEBOOK_MY } from './phrasebook.my.js';
import { PHRASEBOOK_MS } from './phrasebook.ms.js';
import { PHRASEBOOK_HMN } from './phrasebook.hmn.js';

export const LANGUAGES = {
  th: PHRASEBOOK_TH,
  vi: PHRASEBOOK_VI,
  km: PHRASEBOOK_KM,
  lo: PHRASEBOOK_LO,
  zh: PHRASEBOOK_ZH,
  my: PHRASEBOOK_MY,
  ms: PHRASEBOOK_MS,
  hmn: PHRASEBOOK_HMN,
};

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
export function getLanguage(code) { return LANGUAGES[code] || null; }

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
async function loadTH(c) {
  const [
    { PLACES_TH }, { PLACES_TH_EXT }, { PRICES_TH }, { ROUTES_TH }, { INFO_TH },
    { GUIDE_TH }, { EVENTS_TH }, { FOOD_TH }, { FOOD_TH_EXT }, { LOCAL_TH },
    { HISTORY_CITIES_TH },
  ] = await Promise.all([
    import('./places.th.js'), import('./places.th.ext.js'), import('./prices.th.js'),
    import('./routes.th.js'), import('./info.th.js'), import('./guide.th.js'),
    import('./events.th.js'), import('./food.th.js'), import('./food.th.ext.js'), import('./local.th.js'),
    import('./history.cities.th.js'),
  ]);
  c.places = [...PLACES_TH, ...PLACES_TH_EXT];
  c.prices = PRICES_TH; c.routes = ROUTES_TH; c.info = INFO_TH; c.guide = GUIDE_TH;
  c.events = EVENTS_TH.events; c.food = [...FOOD_TH.dishes, ...FOOD_TH_EXT];
  c._localBoards = LOCAL_TH;
  Object.assign(HISTORY.cities, HISTORY_CITIES_TH);
}
async function loadVI(c) {
  const [
    { PLACES_VI }, { PLACES_VI_EXT }, { PRICES_VI }, { ROUTES_VI }, { INFO_VI },
    { GUIDE_VI }, { EVENTS_VI }, { FOOD_VI }, { FOOD_VI_EXT }, { LOCAL_VI },
    { HISTORY_CITIES_VI },
  ] = await Promise.all([
    import('./places.vi.js'), import('./places.vi.ext.js'), import('./prices.vi.js'),
    import('./routes.vi.js'), import('./info.vi.js'), import('./guide.vi.js'),
    import('./events.vi.js'), import('./food.vi.js'), import('./food.vi.ext.js'), import('./local.vi.js'),
    import('./history.cities.vi.js'),
  ]);
  c.places = [...PLACES_VI, ...PLACES_VI_EXT];
  c.prices = PRICES_VI; c.routes = ROUTES_VI; c.info = INFO_VI; c.guide = GUIDE_VI;
  c.events = EVENTS_VI.events; c.food = [...FOOD_VI.dishes, ...FOOD_VI_EXT];
  c._localBoards = LOCAL_VI;
  Object.assign(HISTORY.cities, HISTORY_CITIES_VI);
}
async function loadKH(c) {
  const [
    { PLACES_KH }, { PLACES_KH_EXT }, { PRICES_KH }, { ROUTES_KH }, { INFO_KH },
    { GUIDE_KH }, { EVENTS_KH }, { FOOD_KH }, { FOOD_KH_EXT }, { LOCAL_KH },
    { HISTORY_CITIES_KH },
  ] = await Promise.all([
    import('./places.kh.js'), import('./places.kh.ext.js'), import('./prices.kh.js'),
    import('./routes.kh.js'), import('./info.kh.js'), import('./guide.kh.js'),
    import('./events.kh.js'), import('./food.kh.js'), import('./food.kh.ext.js'), import('./local.kh.js'),
    import('./history.cities.kh.js'),
  ]);
  c.places = [...PLACES_KH, ...PLACES_KH_EXT];
  c.prices = PRICES_KH; c.routes = ROUTES_KH; c.info = INFO_KH; c.guide = GUIDE_KH;
  c.events = EVENTS_KH.events; c.food = [...FOOD_KH.dishes, ...FOOD_KH_EXT];
  c._localBoards = LOCAL_KH;
  Object.assign(HISTORY.cities, HISTORY_CITIES_KH);
}
async function loadLA(c) {
  const [
    { PLACES_LA }, { PLACES_LA_EXT }, { PRICES_LA }, { ROUTES_LA }, { INFO_LA },
    { GUIDE_LA }, { EVENTS_LA }, { FOOD_LA }, { FOOD_LA_EXT }, { LOCAL_LA },
    { HISTORY_CITIES_LA },
  ] = await Promise.all([
    import('./places.la.js'), import('./places.la.ext.js'), import('./prices.la.js'),
    import('./routes.la.js'), import('./info.la.js'), import('./guide.la.js'),
    import('./events.la.js'), import('./food.la.js'), import('./food.la.ext.js'), import('./local.la.js'),
    import('./history.cities.la.js'),
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

export function isCountryLoaded(cc) {
  const c = getCountry(cc);
  return !!(c && c._loaded);
}

// Fetches and wires in one country's data. Safe to call repeatedly and from several
// screens at once — concurrent calls for the same country share one in-flight load.
export function loadCountry(cc) {
  const c = getCountry(cc);
  if (!c) return Promise.resolve(null);
  if (c._loaded) return Promise.resolve(c);
  if (_countryLoads[cc]) return _countryLoads[cc];
  const loader = COUNTRY_LOADERS[cc];
  if (!loader) return Promise.resolve(c);
  const p = loader(c)
    .then(() => { c._loaded = true; return c; })
    .catch((err) => { delete _countryLoads[cc]; throw err; });
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
  return allPlaces().find((p) => p.id === id) || null;
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
