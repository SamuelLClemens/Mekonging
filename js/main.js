// Mekong app shell + hash router. Vanilla ES6, offline-first. Screens read all
// content from js/data/regions.js so no destination is hard-coded here.

import {
  store, save, resetAll, isFavorite, toggleFavorite, prefersReducedMotion,
  createCollection, deleteCollection, togglePlaceInCollection, collectionsForItem,
  addPin, deletePin, getPin, getPlaceData, setPlaceField,
  addJournalEntry, deleteJournalEntry, journalEntries,
  addCalendarItem, deleteCalendarItem,
  isChecked, toggleChecklistItem,
  addStop, removeStop, moveStop, addBudgetItem, deleteBudgetItem,
  setMyStay, getMyStay, clearMyStay,
  getLastFix, setLastFix,
  getSavedAreas, addSavedArea, removeSavedArea,
  ensureMe, setMe, getContacts, getContact, addContact, removeContact,
  getInbox, addInboxItem, deleteInboxItem, unreadInboxCount,
  getThread, addMessage,
  getBoardPosts, addBoardPost, deleteBoardPost,
  getAudioPacks, hasAudioPack, addAudioPack,
} from './state.js';
import { suggestPlans } from './data/itineraries.js';
import { encodeCard, parseCard, shareUrl, encodeShare, parseShare, encodeMessage, parseMessage } from './social.js';
import { CHECKLIST } from './data/checklist.js';
import { bestForCountry, getBestList } from './data/bestof.js';
import { PHOTOS } from './data/photos.js';
import { CROSSINGS } from './data/borders.js';
import { putBlob, getBlob, delBlob } from './idb.js';
import {
  available as vaultAvailable, isInitialised as vaultInitialised, isUnlocked as vaultUnlocked,
  lock as vaultLock, setup as vaultSetup, unlock as vaultUnlock, addDocument as vaultAdd,
  listDocuments as vaultList, getDocument as vaultGet, deleteDocument as vaultDelete, wipeVault as vaultWipe,
} from './vault.js';
import { h, esc, money, range, mapsUrl, debounce, geolocate, bearing, compass, fmtDistance, titleCase } from './util.js';
import { speak, stop as stopSpeak, hasVoiceFor, say, canSay, ttsUrl, setSavedPacks } from './tts.js';
import { translate, isConfigured as translateConfigured } from './translate.js';
import { routeNodes, planRoutes, isRouteNode } from './journey.js';
import { HISTORY } from './data/history.js';
import { getRates, refreshRates, convert } from './currency.js';
import { WEATHER_SPOTS, wmo, isWet, spotKey, spotsForCountry, defaultSpot, nearestSpot, getCachedWeather, refreshWeather, refreshMany, getCachedMany } from './weather.js';
import { RATING_BANDS, ROUTE_LEGEND, ratingColor, effectiveRating } from './map.js';
import {
  COUNTRIES, LANGUAGES, INTERESTS, COLLECTION_PRESETS,
  getCountry, getLanguage, allPlaces, getPlace,
  boardsForCountry, getBoard,
  getEvents, allEvents, getEvent,
  getFood, allFood, getDish, FOOD_CATEGORIES, FOOD_ALLERGENS,
} from './data/regions.js';
import { ALLERGENS } from './data/allergens.js';
import { NATURE_GROUPS, allSpecies, getSpecies } from './data/nature.js';
import { SCHEDULES, SCHEDULES_VERIFIED, schedulesForCountry } from './data/schedules.js';
import { PRODUCE, PRODUCE_CATEGORIES, produceByCategory, getProduce } from './data/produce.js';
import { ESSENTIALS, getEssentials } from './data/essentials.js';
import { ACCESSIBILITY, getAccessibility } from './data/accessibility.js';
import { ARRIVAL, getArrival } from './data/arrival.js';
import { VISA, getVisa } from './data/visa.js';
import { POOLS, poolsForCountry } from './data/pools.js';
import { REGION_PATHS, REGION_LABELS, REGION_VIEWBOX, REGION_RIVER, REGION_PROJ } from './data/geo.js';

// ---- service worker + theme -------------------------------------------------
// Register the service worker only in a secure web context (https / http localhost).
// In the native iOS wrapper the app is served over a custom scheme where SW cannot
// run and is not needed (all assets are bundled on-device), so skip it there.
if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.protocol === 'http:')) {
  window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
}

// Classic light/dark, honouring 'auto' = light by day, dark after dark. Uses the local
// clock (06:00–18:00 = day), which tracks near-equatorial SE-Asia daylight well and needs
// no network, so it works offline.
function classicMode() {
  const t = store.profile.theme || 'auto';
  if (t === 'light' || t === 'dark') return t;
  const hr = new Date().getHours();
  return (hr >= 6 && hr < 18) ? 'light' : 'dark';
}

function applyTheme() {
  const root = document.documentElement;
  // Named visual themes ("skins") each define their own palette; Night Market rides the
  // dark token set, the others the light one. Classic follows the day/night (or fixed) choice.
  const skin = store.profile.skin || 'classic';
  const SKIN_MODE = { night: 'dark', psychnight: 'dark', silk: 'light', tropical: 'light', psych: 'light' };
  if (skin !== 'classic' && SKIN_MODE[skin]) {
    root.setAttribute('data-skin', skin);
    root.setAttribute('data-theme', SKIN_MODE[skin]);
  } else {
    root.removeAttribute('data-skin');
    root.setAttribute('data-theme', classicMode());
  }
  root.setAttribute('data-reduced-motion', prefersReducedMotion() ? 'on' : 'off');
  root.setAttribute('data-text', store.profile.textScale || 'm');
}
// Tell the TTS layer which languages have a downloaded audio pack, so canSay()
// reports audio as available offline for them (e.g. Khmer/Lao with no device voice).
setSavedPacks(getAudioPacks());

// ---- UI state ---------------------------------------------------------------
// Default the destination to where the user actually is, using the device time
// zone (works offline, no permission prompt). Falls back to Thailand outside the
// region. The four countries share UTC+7 but have distinct IANA zone names.
function detectCountryId() {
  try {
    const tz = (Intl.DateTimeFormat().resolvedOptions().timeZone || '');
    const map = {
      'Asia/Bangkok': 'th', 'Asia/Ho_Chi_Minh': 'vi', 'Asia/Saigon': 'vi',
      'Asia/Phnom_Penh': 'kh', 'Asia/Vientiane': 'la',
    };
    if (map[tz]) return map[tz];
  } catch { /* ignore */ }
  return 'th';
}
function langForCountry(id) { const c = getCountry(id); return c ? c.lang : 'th'; }
let activeCountry = detectCountryId();   // current destination context (country id)
let pendingPinCoords = null; // coords captured by tapping the map, consumed by #addpin

// Shown on the Help screen and stamped into feedback messages. Keep in sync with
// CACHE_VERSION in sw.js on each release.
const APP_VERSION = 'mk-v0.138.0';

// Tabs are anchored to what a traveller reaches for most on the ground: where they
// are (Near me), what to browse (Places), how to speak (Talk) and the map. "Saved"
// moved out of the bar (it is empty for most sessions) to a ⭐ in the header, always
// one tap away without taking prime navigation real estate.
// Inline line icons (stroke: currentColor) so the menu and tiles recolour with the active
// theme — an emoji can't. One wrapper; each entry is just the inner shapes. viewBox 24.
const svgIcon = (inner) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${inner}</svg>`;
const ICON_PATH = {
  home: '<path d="M3 11l9-8 9 8"/><path d="M5 9.5V20h14V9.5"/>',
  pin: '<path d="M12 21s7-5.5 7-11a7 7 0 0 0-14 0c0 5.5 7 11 7 11z"/><circle cx="12" cy="10" r="2.5"/>',
  compass: '<circle cx="12" cy="12" r="9"/><path d="M15.6 8.4l-2.3 4.9-4.9 2.3 2.3-4.9z"/>',
  chat: '<path d="M20 15a2 2 0 0 1-2 2H8l-4 4V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2z"/>',
  map: '<path d="M9 4L3 6v14l6-2 6 2 6-2V4l-6 2-6-2z"/><path d="M9 4v14M15 6v14"/>',
  star: '<path d="M12 3l2.6 5.6 6 .7-4.5 4.1 1.2 6L12 16.9 6.7 19.5l1.2-6L3.4 9.3l6-.7z"/>',
  gear: '<circle cx="12" cy="12" r="3.5"/><path d="M12 2.5v3M12 18.5v3M21.5 12h-3M5.5 12h-3M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1M18.4 18.4l-2.1-2.1M7.7 7.7L5.6 5.6"/>',
  arrive: '<path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><path d="M10 17l5-5-5-5"/><path d="M15 12H3"/>',
  passport: '<rect x="5" y="3" width="14" height="18" rx="2"/><circle cx="12" cy="10" r="2.5"/><path d="M9 16h6"/>',
  target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r="1"/>',
  route: '<circle cx="6" cy="19" r="2"/><circle cx="18" cy="5" r="2"/><path d="M8 19h6a4 4 0 0 0 0-8h-4a4 4 0 0 1 0-8h6"/>',
  navarrow: '<path d="M3 11l18-8-8 18-2-8z"/>',
  trophy: '<path d="M8 21h8M12 17v4M6 4h12v5a6 6 0 0 1-12 0zM6 6H4a2 2 0 0 0 0 4h2M18 6h2a2 2 0 0 1 0 4h-2"/>',
  bowl: '<path d="M3 11h18a9 9 0 0 1-18 0z"/><path d="M12 3v3M9 5v1.5M15 5v1.5"/>',
  board: '<rect x="3" y="4" width="18" height="15" rx="2"/><path d="M7 9h10M7 13h6"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5L19 19M19 5l-1.5 1.5M6.5 17.5L5 19"/>',
  cloud: '<path d="M7 18a4 4 0 0 1 .5-8 5.5 5.5 0 0 1 10.5 1.5A3.5 3.5 0 0 1 17 18z"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/>',
  fruit: '<path d="M12 8c-1.2-2.5-4.5-2.3-5.5.2C5 11.5 8 20 12 20s7-8.5 5.5-11.8C16.5 5.7 13.2 5.5 12 8z"/><path d="M12 8V4M12 5c.8-1 2.5-1.2 3.2-.2"/>',
  leaf: '<path d="M11 20A7 7 0 0 1 4 13C4 8 7 4 20 4c0 10-5 16-9 16z"/><path d="M4 20c4-6 8-8 12-9"/>',
  volume: '<path d="M4 9v6h4l5 4V5L8 9z"/><path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a9 9 0 0 1 0 12"/>',
  waves: '<path d="M2 12c2-2 4-2 6 0s4 2 6 0 4-2 6 0M2 17c2-2 4-2 6 0s4 2 6 0 4-2 6 0M2 7c2-2 4-2 6 0s4 2 6 0 4-2 6 0"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/>',
  suitcase: '<rect x="5" y="8" width="14" height="12" rx="1.5"/><path d="M9 8V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3M9.5 12v4M14.5 12v4"/>',
  checklist: '<path d="M10 6h10M10 12h10M10 18h10"/><path d="M3.5 6l1.2 1.2L7 5M3.5 12l1.2 1.2L7 11M3.5 18l1.2 1.2L7 17"/>',
  book: '<path d="M5 4a1 1 0 0 1 1-1h13v18H6a1 1 0 0 1-1-1z"/><path d="M5 4v16M9 7h6M9 11h6"/>',
  calendar: '<rect x="4" y="5" width="16" height="16" rx="2"/><path d="M4 9.5h16M9 3v4M15 3v4"/>',
  ticket: '<path d="M4 8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2 2 2 0 0 0 0 4 2 2 0 0 1-2 2H6a2 2 0 0 1-2-2 2 2 0 0 0 0-4z"/><path d="M13 6v12"/>',
  coins: '<circle cx="9" cy="9" r="6"/><path d="M21 15a6 6 0 0 1-9.7 4.7"/>',
  tag: '<path d="M20.6 13.4 12 22l-9-9V4h9z"/><circle cx="7.5" cy="7.5" r="1.2"/>',
  users: '<path d="M16 20v-1a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v1"/><circle cx="9.5" cy="8" r="3.5"/><path d="M17 20v-1a4 4 0 0 0-3-3.9M15 4.2a4 4 0 0 1 0 7.6"/>',
  lock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
  help: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9.2a2.5 2.5 0 0 1 4.6 1.3c0 1.6-2.1 2-2.1 3.5"/><path d="M12 17h.01"/>',
  alert: '<path d="M12 3 2 20h20z"/><path d="M12 9v5M12 17h.01"/>',
};
const ICON = Object.fromEntries(Object.entries(ICON_PATH).map(([k, v]) => [k, svgIcon(v)]));

const TABS = [
  { hash: '#home', label: 'Home', svg: ICON.home },
  { hash: '#nearby', label: 'Near me', svg: ICON.pin },
  { hash: '#places', label: 'Places', svg: ICON.compass },
  { hash: '#phrasebook', label: 'Talk', svg: ICON.chat },
  { hash: '#map', label: 'Map', svg: ICON.map },
];

function go(hash) {
  if (location.hash === hash) render();
  else location.hash = hash;
}

// ---- shell ------------------------------------------------------------------
function topbar(title, backHash) {
  const hash = location.hash || '';
  const onSaved = hash.startsWith('#saved') || hash.startsWith('#collection');
  const onSos = hash.startsWith('#sos');
  const onSettings = hash.startsWith('#settings');
  const iconBtn = (label, target, svg) =>
    h('button', { class: 'topbar-ic', 'aria-label': label, title: label, onclick: () => go(target), html: svg });
  return h('header', { class: 'topbar' }, [
    backHash ? h('button', { class: 'back', onclick: () => go(backHash) }, '‹ Back') : null,
    h('h1', {}, title),
    onSaved ? null : iconBtn('Saved & collections', '#saved', ICON.star),
    onSettings ? null : iconBtn('Settings', '#settings', ICON.gear),
    // Persistent safety anchor: emergency help one tap from every screen (kept as the
    // bold red marker so it stands out from the neutral menu icons).
    onSos ? null : h('button', { class: 'topbar-sos', 'aria-label': 'Emergency help', title: 'Emergency help', onclick: () => go('#sos') }, '🆘'),
  ]);
}

function tabbar(activeHashPrefix) {
  return h('nav', { class: 'tabbar' }, TABS.map((t) =>
    h('button', {
      'aria-current': activeHashPrefix === t.hash ? 'page' : null,
      onclick: () => go(t.hash),
    }, [h('span', { class: 'ic', html: t.svg }), h('span', {}, t.label)])));
}

function mount(node, activeTab) {
  const app = document.getElementById('app');
  app.innerHTML = '';
  app.append(node);
  if (activeTab) app.append(tabbar(activeTab));
  window.scrollTo(0, 0);
}

// ---- HOME (open with a country-picker map) ----------------------------------
function logoSVG() {
  return `<svg class="logo" viewBox="0 0 360 122" role="img" aria-label="Mekonging" xmlns="http://www.w3.org/2000/svg">
    <defs><linearGradient id="mkgh" x1="0" y1="0" x2="1" y2="1"><stop offset="0" style="stop-color:var(--sun)"/><stop offset="0.5" style="stop-color:var(--sun-deep)"/><stop offset="1" style="stop-color:var(--magenta)"/></linearGradient></defs>
    <g transform="translate(150 6)"><circle cx="30" cy="30" r="18" fill="url(#mkgh)"/>
      <g style="stroke:var(--sun)" stroke-width="3" stroke-linecap="round"><line x1="30" y1="2" x2="30" y2="9"/><line x1="30" y1="51" x2="30" y2="58"/><line x1="2" y1="30" x2="9" y2="30"/><line x1="51" y1="30" x2="58" y2="30"/><line x1="10" y1="10" x2="15" y2="15"/><line x1="45" y1="45" x2="50" y2="50"/><line x1="50" y1="10" x2="45" y2="15"/><line x1="15" y1="45" x2="10" y2="50"/></g></g>
    <text x="180" y="94" text-anchor="middle" font-family="'Avenir Next','Trebuchet MS',system-ui,sans-serif" font-weight="800" font-size="40" fill="url(#mkgh)" letter-spacing="0.5">Mekonging</text>
    <path d="M40 110 q40 -12 80 0 t80 0 t80 0 t40 0" fill="none" style="stroke:var(--teal)" stroke-width="4" stroke-linecap="round"/></svg>`;
}
// ---- CONTEXT-AWARE "RIGHT NOW" ---------------------------------------------
// The home screen leads with what fits the user's place and moment: we read the last GPS
// fix, the local clock (hour + weekend), cached weather and the wet season, then rank
// nearby places by how well they suit right now. Fully offline; degrades to a time-aware
// tip when there is no location yet.
const PART_META = {
  earlyMorning: { emoji: '🌅', label: 'Early morning', cats: ['market', 'culture', 'viewpoint', 'food', 'nature'], tip: 'Beat the heat — markets, temples and sunrise viewpoints are at their best now.' },
  morning: { emoji: '☀️', label: 'Morning', cats: ['culture', 'nature', 'park', 'viewpoint', 'market'], tip: 'Cooler hours for sightseeing, temples and nature before midday.' },
  midday: { emoji: '🥵', label: 'Midday', cats: ['culture', 'food', 'market', 'wellness', 'hotspring'], tip: 'Hottest part of the day — lean indoors: museums, a long lunch or a swim.' },
  afternoon: { emoji: '⛅', label: 'Afternoon', cats: ['nature', 'viewpoint', 'beach', 'food', 'culture'], tip: 'Good for cafés, easy walks, beaches and viewpoints as the sun drops.' },
  evening: { emoji: '🌆', label: 'Evening', cats: ['nightlife', 'food', 'market', 'viewpoint'], tip: 'Prime time for sunsets, night markets and street food.' },
  night: { emoji: '🌙', label: 'Night', cats: ['nightlife', 'food', 'market'], tip: 'Night markets, street food and bars are in full swing.' },
  lateNight: { emoji: '🌌', label: 'Late night', cats: ['nightlife', 'food'], tip: 'Late-night eats and bars — most sights are closed now.' },
};
const INDOOR_CATS = ['culture', 'food', 'market', 'wellness'];
const OUTDOOR_CATS = ['nature', 'viewpoint', 'beach', 'park', 'hike', 'waterfall', 'island'];
const WET_MONTHS = { th: [4, 5, 6, 7, 8, 9], kh: [4, 5, 6, 7, 8, 9], la: [4, 5, 6, 7, 8, 9], vi: [4, 5, 6, 7, 8, 9, 10] };

function partOfDay(hour) {
  if (hour < 5) return 'lateNight';
  if (hour < 8) return 'earlyMorning';
  if (hour < 11) return 'morning';
  if (hour < 15) return 'midday';
  if (hour < 17) return 'afternoon';
  if (hour < 21) return 'evening';
  return 'night';
}

// Best-effort "open now" from a free-form hours string. Returns true/false, or null when it
// cannot be parsed (so an unparseable place is neither rewarded nor punished).
function isOpenNow(hours, hour) {
  if (!hours) return null;
  if (/24\s*h|24\/7|round the clock/i.test(hours)) return true;
  const m = /(\d{1,2})(?:[:.](\d{2}))?\s*[-–—]\s*(\d{1,2})(?:[:.](\d{2}))?/.exec(hours);
  if (!m) return null;
  const open = parseInt(m[1], 10), close = parseInt(m[3], 10);
  if (isNaN(open) || isNaN(close) || open === close) return null;
  return close < open ? (hour >= open || hour < close) : (hour >= open && hour < close);
}

function contextNow() {
  const gps = getLastFix();
  let near = gps ? nearestSpotGlobal(gps) : null;
  let fix = gps, approx = false;
  if (!near) {
    // No GPS: fall back to the city the traveller is focused on (last scoped or planned),
    // so "right now" reflects where they are actually looking — never a blank capital default.
    const fs = focusCitySpot();
    if (fs) { near = { spot: fs, km: 0 }; fix = { lat: fs.lat, lng: fs.lng }; approx = true; }
  }
  const now = new Date();
  const hour = now.getHours();
  const dow = now.getDay();
  const part = partOfDay(hour);
  const country = near ? near.spot.country : activeCountry;
  let wx = null, raining = false;
  if (near) { const rec = getCachedWeather(spotKey(near.spot)); if (rec && rec.current) { wx = rec.current; raining = isWet(wx.code); } }
  const wet = (WET_MONTHS[country] || []).includes(now.getMonth());
  const dayName = now.toLocaleDateString(undefined, { weekday: 'long' });
  return { fix, near, approx, hasGps: !!gps, now, hour, dow, dayName, isWeekend: dow === 0 || dow === 6, part, country, wx, raining, wet };
}

// ---- "WHERE AM I NOW" RESOLVER ---------------------------------------------
// One source of truth for the traveller's effective location, so weather and
// recommendations follow WHERE THEY ARE — a live/last GPS fix wins; else the city
// they are focused on (last scoped or planned); else the country default. We never
// silently assume the capital when a better signal exists: a traveller in Chiang Mai
// must not be shown Bangkok picks.
function focusCitySpot() {
  const fk = store.profile.prefs.focusSpotKey;
  return fk ? (WEATHER_SPOTS.find((s) => spotKey(s) === fk) || null) : null;
}
function setFocusSpot(spot) {
  if (!spot) return;
  const k = spotKey(spot);
  if (store.profile.prefs.focusSpotKey === k && activeCountry === spot.country) return;
  store.profile.prefs.focusSpotKey = k;
  if (spot.country) activeCountry = spot.country;
  save();
}
function focusSpot(explicitCountry) {
  const gps = getLastFix();
  const near = gps ? nearestSpotGlobal(gps) : null;
  const focus = focusCitySpot();
  if (explicitCountry && getCountry(explicitCountry)) {
    // A country was explicitly requested (e.g. "Today in Vietnam"): stay in that country,
    // but still prefer the focused/located city within it over the capital.
    if (focus && focus.country === explicitCountry) return { spot: focus, source: 'focus' };
    if (near && near.spot && near.spot.country === explicitCountry) return { spot: near.spot, source: 'gps', km: near.km };
    return { spot: defaultSpot(explicitCountry), source: 'default' };
  }
  if (near && near.spot) return { spot: near.spot, source: 'gps', km: near.km };
  if (focus) return { spot: focus, source: 'focus' };
  return { spot: defaultSpot(activeCountry || 'th'), source: 'default' };
}
// Map a scoped city (by display name) to its nearest listed weather city, so browsing a
// city page quietly makes that city the traveller's focus for weather + picks.
function spotForCity(cc, cityName) {
  if (!cityName) return null;
  const slug = citySlug(cityName);
  const inCountry = WEATHER_SPOTS.filter((s) => s.country === cc);
  const exact = inCountry.find((s) => citySlug(s.city) === slug);
  if (exact) return exact;
  const rep = allPlaces({ country: cc }).find((p) => p.coords && citySlug(p.city) === slug);
  return rep ? nearestSpot(rep.coords, cc) : null;
}

// ---- NETWORK CONSENT -------------------------------------------------------
// The app must never touch mobile data or Wi-Fi without the traveller choosing to.
// online() is the SINGLE gate for every AUTOMATIC fetch (weather, exchange rates); a
// user-initiated action (tapping "refresh", "play a call", a deep link) is its own
// consent and is allowed regardless. 'ask' means we have not asked yet — treat as
// offline until the traveller decides in onboarding or the Home toggle.
function netMode() { return store.profile.prefs.netMode || 'ask'; }
function setNetMode(m) { store.profile.prefs.netMode = m; save(); }
function online() { return netMode() === 'online' && (typeof navigator === 'undefined' || navigator.onLine !== false); }
// A compact, always-available control so the traveller can switch data on/off any time
// and always see which mode they are in.
function netStatusRow() {
  const m = netMode();
  const label = m === 'online' ? '📶 Online — using data when available'
    : (m === 'offline' ? '✈️ Offline — no data used' : '✈️ Offline until you choose');
  const other = m === 'online' ? 'offline' : 'online';
  return h('div', { class: 'net-status' }, [
    h('span', { class: 'tiny muted' }, label),
    h('button', { class: 'chip', onclick: () => { setNetMode(other); render(); } }, other === 'online' ? 'Use data' : 'Go offline'),
  ]);
}

// Festivals happening now, or starting within the next few weeks, in the user's country —
// the strongest "when" signal for a traveller (Songkran, Loy Krathong, Tet, Pchum Ben...).
function eventsNow(country, now, soonDays = 21) {
  const day = 86400000;
  const t0 = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const out = [];
  for (const e of getEvents(country)) {
    if (!e.start) continue;
    const s = new Date(e.start + 'T00:00:00').getTime();
    const en = new Date((e.end || e.start) + 'T23:59:59').getTime();
    if (isNaN(s)) continue;
    if (t0 >= s && t0 <= en) out.push({ e, state: 'on', days: 0 });
    else if (s > t0 && (s - t0) / day <= soonDays) out.push({ e, state: 'soon', days: Math.round((s - t0) / day) });
  }
  out.sort((a, b) => (a.state === 'on' ? -1 : 1) - (b.state === 'on' ? -1 : 1) || a.days - b.days);
  return out.slice(0, 2);
}

function scoreForNow(p, ctx) {
  if (!p.coords) return -Infinity;
  const km = haversineKm(ctx.fix, p.coords);
  if (km > 130) return -Infinity;               // "near you" ceiling (still allows day trips)
  const cats = p.categories || [];
  const meta = PART_META[ctx.part];
  let s = 30 - km * 0.9;                          // proximity
  if (cats.some((c) => meta.cats.includes(c))) s += 30;
  if (ctx.isWeekend && cats.includes('market')) s += 8;
  if (ctx.raining) {
    if (cats.some((c) => INDOOR_CATS.includes(c))) s += 16;
    if (cats.some((c) => OUTDOOR_CATS.includes(c))) s -= 22;
  }
  if (ctx.part === 'midday' && !ctx.raining) {
    if (cats.includes('hike')) s -= 10;
    if (cats.includes('hotspring') || cats.includes('beach')) s += 6;
    if (cats.some((c) => INDOOR_CATS.includes(c))) s += 6;
  }
  const open = isOpenNow(p.hours, ctx.hour);
  if (open === true) s += 12; else if (open === false) s -= 26;
  s += (Number(p.rating) || 0) * 1.2;            // gentle quality tiebreak
  return s;
}

function whyNow(p, ctx) {
  const cats = p.categories || [];
  const morning = ctx.part === 'earlyMorning' || ctx.part === 'morning';
  const evening = ctx.part === 'evening' || ctx.part === 'night' || ctx.part === 'lateNight';
  if (ctx.raining && cats.some((c) => INDOOR_CATS.includes(c))) return 'Good in the rain';
  if (ctx.isWeekend && cats.includes('market')) return 'Weekend market';
  if (evening && cats.includes('nightlife')) return 'Buzzing now';
  if ((ctx.part === 'evening' || ctx.part === 'afternoon') && cats.includes('viewpoint')) return 'Sunset spot';
  if (evening && (cats.includes('food') || cats.includes('market'))) return 'Street-food time';
  if (morning && cats.includes('market')) return 'Morning market';
  if (morning && cats.includes('culture') && !cats.includes('food')) return 'Cool-hours temple';
  if (isOpenNow(p.hours, ctx.hour) === true) return 'Open now';
  return null;
}

function rightNowSection() {
  const ctx = contextNow();
  const meta = PART_META[ctx.part];
  const card = h('div', { class: 'card right-now' });
  const cityName = ctx.near ? ctx.near.spot.city : ((getCountry(ctx.country) || {}).name || 'you');
  // The temperature is a live link into the local forecast (nearest/focused city),
  // so "check the weather here" is one tap from the home hero instead of buried in a grid.
  card.append(h('div', { class: 'rn-head' }, [
    h('span', { class: 'rn-emoji' }, meta.emoji),
    h('div', {}, [
      h('div', { class: 'rn-title' }, ctx.near ? `${meta.label} near ${cityName}` : `${meta.label}, ${ctx.dayName}`),
      h('div', { class: 'rn-sub muted' }, [
        ctx.dayName,
        ctx.wx ? h('button', { class: 'rn-wx-link', onclick: () => go('#weather'), 'aria-label': `Weather forecast for ${cityName}` },
          ` · ${fmtTemp(ctx.wx.temp)}${ctx.raining ? ', rain' : ''} →`) : null,
        ctx.wet ? ' · wet season' : '',
        ctx.approx ? ' · where you’re looking' : '',
      ]),
    ]),
  ]));

  if (!ctx.fix) {
    card.append(h('p', { style: 'margin:8px 0 6px' }, meta.tip));
    card.append(h('p', { class: 'muted', style: 'margin:0 0 10px' }, 'Turn on location and this becomes live picks for right where you are. It stays on your device — nothing is sent anywhere.'));
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      card.append(h('button', { class: 'btn block', onclick: async (e) => {
        store.profile.prefs.geoAsked = true; save();
        e.currentTarget.textContent = 'Locating…';
        try { setLastFix(await geolocate()); } catch { /* denied/unavailable */ }
        render();
      } }, '📍 Use my location'));
    }
    return card;
  }

  const picks = allPlaces({ country: ctx.country })
    .map((p) => ({ p, s: scoreForNow(p, ctx) }))
    .filter((x) => x.s > -Infinity)
    .sort((a, b) => b.s - a.s)
    .slice(0, 5);

  if (!picks.length) {
    card.append(h('p', { style: 'margin:8px 0 0' }, `${meta.tip} Nothing is mapped very close — try “What’s near me”.`));
  } else {
    card.append(h('p', { class: 'muted', style: 'margin:6px 0 10px' }, meta.tip));
    const list = h('div', { class: 'rn-list' });
    picks.forEach(({ p }) => {
      const reason = whyNow(p, ctx);
      const km = haversineKm(ctx.fix, p.coords);
      list.append(h('button', { class: 'rn-item', onclick: () => go(`#place-${p.id}`) }, [
        h('div', { class: 'rn-item-main' }, [
          h('span', { class: 'rn-name' }, p.name),
          reason ? h('span', { class: 'rn-tag' }, reason) : null,
        ]),
        h('div', { class: 'rn-meta muted' }, `${titleCase((p.categories || [])[0] || 'Place')} · ${fmtDistance(km)} · ${p.city}`),
      ]));
    });
    card.append(list);
  }
  if (ctx.approx && typeof navigator !== 'undefined' && navigator.geolocation) {
    card.append(h('button', { class: 'btn ghost block', style: 'margin-top:2px', onclick: async (e) => {
      e.currentTarget.textContent = 'Locating…';
      try { setLastFix(await geolocate()); } catch { /* denied/unavailable */ }
      render();
    } }, '📍 Use my exact location'));
  }
  const evs = eventsNow(ctx.country, ctx.now);
  if (evs.length) {
    const strip = h('div', { class: 'rn-events' });
    evs.forEach(({ e, state, days }) => {
      const when = state === 'on' ? 'On now' : (days <= 1 ? 'Tomorrow' : `In ${days} days`);
      strip.append(h('button', { class: 'rn-event', onclick: () => go('#events') }, [
        h('span', { class: 'rn-event-when' }, `🎉 ${when}`),
        ` ${e.name}`,
      ]));
    });
    card.append(strip);
  }
  card.append(h('button', { class: 'btn ghost block', style: 'margin-top:6px', onclick: () => go('#nearby') }, 'See more near me →'));
  return card;
}

// ---- HISTORY & ORIENTATION -------------------------------------------------
// "Where you are / where you're going" always leads with a short, sourced sense of the
// place: its history, what it is known for, and when to come.
function countryHistory(cc) { return (HISTORY.countries || {})[cc] || null; }
function cityHistory(cc, slug) { return (HISTORY.cities || {})[`${cc}-${slug}`] || null; }

function knownForRow(tags) {
  if (!tags || !tags.length) return null;
  return h('div', { class: 'knownfor' }, tags.map((t) => h('span', { class: 'kf-tag' }, t)));
}

function countryHistoryCard(cc) {
  const hi = countryHistory(cc);
  if (!hi || !hi.blurb) return null;
  const card = h('div', { class: 'card history-card' }, [h('h2', { style: 'margin-top:0' }, 'History & culture')]);
  card.append(h('p', {}, hi.blurb));
  const kf = knownForRow(hi.knownFor); if (kf) card.append(kf);
  if (hi.cultureTip) card.append(h('p', { class: 'culture-tip' }, `🙏 ${hi.cultureTip}`));
  if (hi.sources && hi.sources.length) card.append(h('p', { class: 'disclaimer', style: 'margin-bottom:0' }, `Sources: ${hi.sources.join(', ')}`));
  return card;
}

function cityAboutCard(cc, slug) {
  const hi = cityHistory(cc, slug);
  if (!hi || !hi.blurb) return null;
  const card = h('div', { class: 'card history-card' }, [h('h2', { style: 'margin-top:0' }, `About ${hi.name}`)]);
  card.append(h('p', {}, hi.blurb));
  const kf = knownForRow(hi.knownFor); if (kf) card.append(kf);
  if (hi.bestTime) card.append(h('p', { class: 'culture-tip', style: 'margin-bottom:0' }, `🗓 Best time: ${hi.bestTime}`));
  return card;
}

// A city's one-stop essentials: what's good at this time of day, and one-tap access to the
// info a traveller needs to BE in or GET to this place — directions, weather, language, help.
function cityEssentials(cc, cityName, slug) {
  const c = getCountry(cc);
  const meta = PART_META[partOfDay(new Date().getHours())];
  const card = h('div', { class: 'card' }, [
    h('p', { class: 'muted', style: 'margin:0 0 8px' }, `🕒 Right now: ${meta.tip}`),
  ]);
  card.append(h('div', { class: 'chips' }, [
    isRouteNode(cityName) ? h('button', { class: 'chip', onclick: () => { planTo = cityName; go('#route'); } }, '🧭 Get here') : null,
    getBoard(cc, slug) ? h('button', { class: 'chip', onclick: () => go(`#board-${cc}-${slug}`) }, '🛒 Local finds') : null,
    h('button', { class: 'chip', onclick: () => go(`#weather-${cc}`) }, '⛅ Weather'),
    (c && c.lang) ? h('button', { class: 'chip', onclick: () => go(`#phrasebook-${c.lang}`) }, '💬 Phrasebook') : null,
    h('button', { class: 'chip', onclick: () => go('#sos') }, '🆘 Emergency'),
  ]));
  return card;
}

// ---- ACCESSIBILITY (honest disability guidance per country) -----------------
function accessScreen(cc) {
  const a = getAccessibility(cc);
  const c = getCountry(cc);
  const wrap = h('div', { class: 'screen' });
  wrap.append(topbar('Accessibility', c ? `#country-${cc}` : '#home'));
  if (!a) { wrap.append(h('p', { class: 'empty' }, 'Accessibility guidance for this country is on the way.')); mount(wrap, 'home'); return; }
  wrap.append(h('p', { class: 'muted' }, `How ${c ? c.name : 'this country'} works for travellers with disabilities — honestly. ${a.overview}`));
  const needs = store.profile.prefs.access || [];
  const SEC = [['mobility', '♿ Wheelchair / limited mobility'], ['vision', '🦯 Blind / low vision'], ['hearing', '🦻 Deaf / hard of hearing']];
  // Surface the traveller's own needs first.
  SEC.slice().sort((x, y) => (needs.includes(y[0]) ? 1 : 0) - (needs.includes(x[0]) ? 1 : 0)).forEach(([key, label]) => {
    if (!a[key]) return;
    const card = h('div', { class: 'card' + (needs.includes(key) ? ' access-focus' : '') });
    card.append(h('h2', {}, label + (needs.includes(key) ? ' · for you' : '')));
    card.append(h('p', {}, a[key]));
    wrap.append(card);
  });
  if (a.tips && a.tips.length) {
    const t = h('div', { class: 'card' }, [h('h2', {}, 'Practical tips')]);
    a.tips.forEach((x) => t.append(h('div', { class: 'list-note' }, x)));
    wrap.append(t);
  }
  wrap.append(sourcesNote(a.sources, a.verified));
  mount(wrap, 'home');
}
// Country-hub entry to the accessibility guide (prominent when the traveller has a need).
function accessCard(cc) {
  if (!getAccessibility(cc)) return null;
  const hasNeed = (store.profile.prefs.access || []).length > 0;
  const card = h('div', { class: 'card' + (hasNeed ? ' access-focus' : '') });
  card.append(h('h2', { style: 'margin-top:0' }, '♿ Accessibility'));
  card.append(h('p', { class: 'muted', style: 'margin:6px 0' }, hasNeed
    ? 'Honest, practical guidance tailored to the needs you set — your groups come first.'
    : 'How this country works for travellers with limited mobility, low vision or hearing.'));
  card.append(h('button', { class: 'btn ghost block', onclick: () => go(`#access-${cc}`) }, 'Open the accessibility guide'));
  return card;
}

// ---- TRAVELLING WITH A BABY (nappies, formula, family help) -----------------
const DIAPER_WHERE = {
  th: 'Cheapest at the big supercentres — Makro, Big C and Lotus’s (house brands plus MamyPoko / Huggies), far cheaper per nappy than 7-Eleven singles. Boots and Watsons pharmacies stock them too but cost more; Villa Market carries imported brands.',
  vi: 'Cheapest at Bách Hóa Xanh and WinMart+, and at Con Cưng / Bibo Mart baby stores; markets and pharmacies also stock them. Bring your usual brand if your baby is fussy.',
  kh: 'Minimarts and pharmacies in Phnom Penh and Siem Reap carry Huggies / MamyPoko; local markets are cheapest. Stock up in the cities before heading rural.',
  la: 'Minimarts and pharmacies in Vientiane, Luang Prabang and larger towns; choice is limited and pricier, so stock up in the city before remote travel.',
};
function babyScreen(cc) {
  const c = getCountry(cc);
  const wrap = h('div', { class: 'screen' });
  wrap.append(topbar('Travelling with a baby', c ? `#country-${cc}` : '#home'));
  wrap.append(h('p', { class: 'muted' }, `Where to find nappies, formula and baby basics in ${c ? c.name : 'this country'} — cheapest first — plus family tips. Guidance; verify locally.`));
  const dc = h('div', { class: 'card' }, [h('h2', { style: 'margin-top:0' }, '🧷 Where to buy nappies (diapers)')]);
  dc.append(h('p', {}, DIAPER_WHERE[cc] || 'Look for the largest supermarket or pharmacy in town and buy larger packs for the best price per nappy.'));
  wrap.append(dc);
  const boards = boardsForCountry(cc).filter((b) => b.family && b.family.length);
  if (boards.length) {
    wrap.append(h('h3', { style: 'margin:14px 2px 4px' }, 'City by city'));
    boards.forEach((b) => {
      const card = h('div', { class: 'card' });
      card.append(h('div', { class: 'row-between' }, [h('h2', { style: 'margin:0' }, b.city), h('button', { class: 'chip', onclick: () => go(`#board-${cc}-${b.slug}`) }, 'Board')]));
      b.family.forEach((f) => card.append(boardRow(f.item, [f.where, f.price].filter(Boolean).join(' · '), f.tip)));
      wrap.append(card);
    });
  }
  wrap.append(h('div', { class: 'card' }, [h('h2', {}, 'Handy to know'),
    h('div', { class: 'list-note' }, 'Pharmacies (Boots / Watsons in Thailand, local pharmacies elsewhere) are reliable for formula, wipes and baby medicine.'),
    h('div', { class: 'list-note' }, 'In bigger cities, Grab and delivery apps can bring supermarket nappies to your hotel.'),
    h('div', { class: 'list-note' }, 'Changing tables are rare outside malls and airports — a portable changing mat helps.'),
    h('div', { class: 'list-note' }, 'Heat and dehydration hit little ones fast: bottled water, shade and slow mornings.'),
  ]));
  mount(wrap, 'home');
}

// ---- ENTRY & VISA (per country; nationality-dependent, always confirm officially) ----
const VISA_TYPE = { 'visa-free': '✅ Visa-free', 'e-visa': '💻 e-Visa', 'visa-on-arrival': '🛬 Visa on arrival', 'visa-required': '📋 Visa required' };
function visaScreen(cc) {
  const v = getVisa(cc);
  const c = getCountry(cc);
  const wrap = h('div', { class: 'screen' });
  wrap.append(topbar('Entry & visa', c ? `#country-${cc}` : '#home'));
  if (!v) { wrap.append(h('p', { class: 'empty' }, 'Entry guidance for this country is on the way.')); mount(wrap, 'home'); return; }
  wrap.append(h('div', { class: 'banner' }, 'Visa rules depend on your nationality and change often. Treat this as orientation, then confirm on the official site for your passport before you travel.'));
  wrap.append(h('p', {}, v.summary));
  (v.options || []).forEach((o) => {
    const card = h('div', { class: 'card' });
    card.append(h('div', { class: 'row-between' }, [h('h3', { style: 'margin:0' }, VISA_TYPE[o.type] || o.type), o.fee ? h('span', { class: 'cat-tag' }, o.fee) : null]));
    if (o.who) card.append(h('p', { class: 'tiny muted', style: 'margin:4px 0' }, o.who));
    if (o.duration) card.append(h('p', { style: 'margin:2px 0' }, `🕒 ${o.duration}`));
    if (o.howApply) card.append(h('div', { class: 'list-note' }, o.howApply));
    wrap.append(card);
  });
  if (v.officialEvisa && v.officialEvisa.url) {
    wrap.append(h('div', { class: 'card' }, [
      h('h3', { style: 'margin-top:0' }, 'Official e-visa portal'),
      h('p', { class: 'tiny muted' }, 'Use only the official government site — look-alike reseller sites overcharge and harvest data.'),
      h('a', { class: 'btn block', href: v.officialEvisa.url, target: '_blank', rel: 'noopener' }, `${v.officialEvisa.name} ↗`),
    ]));
  }
  if (v.landBorderNotes) wrap.append(h('div', { class: 'card' }, [h('h3', { style: 'margin-top:0' }, 'At land borders'), h('p', {}, v.landBorderNotes)]));
  if (v.overstay) wrap.append(h('div', { class: 'card' }, [h('h3', { style: 'margin-top:0' }, 'Overstay'), h('p', {}, v.overstay)]));
  if (v.scams && v.scams.length) { const s = h('div', { class: 'card' }, [h('h3', { style: 'margin-top:0' }, '⚠️ Common visa scams')]); v.scams.forEach((x) => s.append(h('div', { class: 'warn-note' }, x))); wrap.append(s); }
  wrap.append(sourcesNote(v.sources, v.asOf));
  mount(wrap, 'home');
}
function visaCard(cc) {
  if (!getVisa(cc)) return null;
  const card = h('div', { class: 'card' });
  card.append(h('h2', { style: 'margin-top:0' }, '🛂 Entry & visa'));
  card.append(h('p', { class: 'muted', style: 'margin:6px 0' }, 'Visa-free, e-visa or visa-on-arrival, the official portal, land-border tips and overstay rules — depends on your nationality.'));
  card.append(h('button', { class: 'btn ghost block', onclick: () => go(`#visa-${cc}`) }, 'Open the entry guide'));
  return card;
}

function homeScreen() {
  const wrap = h('div', { class: 'screen' });
  wrap.append(h('section', { class: 'hero' }, [
    h('div', { class: 'logo-wrap', html: logoSVG() }),
    h('p', {}, 'Travel Thailand, Vietnam, Cambodia & Laos like an expert.'),
  ]));
  wrap.append(h('div', { class: 'home-actions' }, [
    h('button', { class: 'btn', onclick: () => go('#nearby') }, '📍 What’s near me'),
    h('button', { class: 'btn ghost', onclick: () => go('#search') }, '🔎 Search everything'),
    h('button', { class: 'btn', style: 'background:var(--magenta)', onclick: () => go('#sos') }, '🆘 Emergency'),
  ]));

  wrap.append(netStatusRow());
  // Lead with what fits the user's place and moment, before the generic menu.
  wrap.append(rightNowSection());
  // If the traveller set an accessibility need, surface the guide for where they are.
  if ((store.profile.prefs.access || []).length) {
    const fc = focusSpot().spot.country;
    if (getAccessibility(fc)) wrap.append(h('button', { class: 'btn ghost block access-focus', style: 'margin-top:8px', onclick: () => go(`#access-${fc}`) }, '♿ Accessibility where you are'));
  }
  // Travelling with a baby: one tap to the local baby-supply help for where they are.
  if (store.profile.prefs.withBaby) {
    const fc = focusSpot().spot.country;
    wrap.append(h('button', { class: 'btn ghost block', style: 'margin-top:8px', onclick: () => go(`#baby-${fc}`) }, '🍼 Travelling with a baby — local help'));
  }

  wrap.append(h('h2', { class: 'home-section' }, 'Where are you headed?'));
  wrap.append(regionPicker());
  wrap.append(h('h2', { class: 'home-section' }, 'Everything you need'));

  // Grouped into labeled task clusters (not a flat 28-tile wall) so the screen is
  // scannable: the eye lands on a heading, not an undifferentiated grid. Every
  // destination is still present — nothing is hidden, just chunked by intent.
  // Entry & visa had no top-level home; resolve it to where the traveller is focused so
  // it is one tap from Home (not buried in a country hub) — a high-intent task.
  const visaCC = focusSpot().spot.country;
  const groups = [
    { label: 'Get your bearings', items: [
      { ic: ICON.arrive, t: 'Just arrived', d: 'First hour: cash, SIM, airport → town', hash: '#arrival' },
      { ic: ICON.passport, t: 'Entry & visa', d: 'Visa-free, e-visa or on arrival', hash: `#visa-${visaCC}` },
      { ic: ICON.target, t: 'For you', d: 'Budget, party & trip length', hash: '#foryou' },
      { ic: ICON.route, t: 'Trip plans', d: 'Suggested routes that fit you', hash: '#plans' },
      { ic: ICON.trophy, t: 'Best of / top picks', d: 'Best for families & more', hash: '#bestof' },
    ] },
    { label: 'Eat & do', items: [
      { ic: ICON.bowl, t: 'Street food', d: 'Find, rate & review stalls', hash: '#streetfood' },
      { ic: ICON.board, t: 'Local noticeboard', d: 'Markets, family supplies, cheap eats', hash: '#board' },
      { ic: ICON.sun, t: 'Today’s plan', d: 'Weather-aware top picks', hash: '#today' },
      { ic: ICON.search, t: 'Identify food', d: 'Dishes, ingredients, allergens', hash: '#food' },
      { ic: ICON.fruit, t: 'Market produce', d: 'Fruit, veg & herbs guide', hash: '#produce' },
      { ic: ICON.leaf, t: 'Identify nature', d: 'Birds, animals, fish, plants', hash: '#nature' },
      { ic: ICON.volume, t: 'Sounds around you', d: 'Hear animal & bird calls', hash: '#sounds' },
      { ic: ICON.waves, t: 'Public pools', d: 'Swims, day passes, prices', hash: '#pools' },
    ] },
    { label: 'Get around', items: [
      { ic: ICON.navarrow, t: 'Journey planner', d: 'Chain buses/trains/boats A → B', hash: '#route' },
      { ic: ICON.map, t: 'Offline map', d: 'See yourself, drop pins', hash: '#map' },
      { ic: ICON.clock, t: 'Transport schedules', d: 'Train/bus times, sync on wifi', hash: '#schedules' },
      { ic: ICON.cloud, t: 'Weather & forecast', d: '7-day, updates on wifi', hash: '#weather' },
    ] },
    { label: 'Plan & remember', items: [
      { ic: ICON.suitcase, t: 'My trip', d: 'Itinerary + budget log', hash: '#trip' },
      { ic: ICON.checklist, t: 'Pre-trip checklist', d: 'Visa, health, packing', hash: '#checklist' },
      { ic: ICON.book, t: 'Travel journal', d: 'Stamped entries + journey map', hash: '#journal' },
      { ic: ICON.calendar, t: 'Travel calendar', d: 'Stays, meals & ratings', hash: '#calendar' },
      { ic: ICON.ticket, t: 'Festivals & events', d: 'Dates, on your calendar', hash: '#events' },
      { ic: ICON.star, t: 'Saved & collections', d: 'Organise places by theme', hash: '#saved' },
    ] },
    { label: 'Money & practical', items: [
      { ic: ICON.coins, t: 'Currency converter', d: 'Live rates, works offline', hash: '#currency' },
      { ic: ICON.tag, t: 'Bargain helper', d: 'Fair counter-offers', hash: '#bargain' },
      { ic: ICON.users, t: 'Travel circle', d: 'Share your card, connect & message', hash: '#circle', badge: unreadInboxCount() },
      { ic: ICON.lock, t: 'Secure documents', d: 'Passports, encrypted on-device', hash: '#vault' },
      { ic: ICON.help, t: 'Help & FAQ', d: 'How to use, offline vs online', hash: '#help' },
      { ic: ICON.gear, t: 'Settings', d: 'Languages, theme, translate', hash: '#settings' },
    ] },
  ];
  const tileBtn = (x) => h('button', { class: 'tile', onclick: () => go(x.hash), 'aria-label': x.badge ? `${x.t} — ${x.badge} new` : x.t }, [
    x.badge ? h('span', { class: 'tile-badge', title: `${x.badge} new` }, x.badge > 99 ? '99+' : String(x.badge)) : null,
    h('span', { class: 'ic', html: x.ic }), h('span', { class: 't' }, x.t), h('span', { class: 'd' }, x.d),
  ]);
  groups.forEach((g) => {
    wrap.append(h('h3', { class: 'home-group' }, g.label));
    wrap.append(h('div', { class: 'grid' }, g.items.map(tileBtn)));
  });

  wrap.append(h('p', { class: 'disclaimer' },
    'Works offline. Everything stays on your device — no accounts, no tracking. Prices and rules are guidance with sources; verify locally.'));
  mount(wrap, '#home');
}

// The front door: a stylised, offline SVG map of mainland Southeast Asia. Each of the
// four countries is a distinct colour and is tappable to enter its hub. No tiles, no
// network — this always works. (The pannable street map with GPS lives on #map.)
// Retro-modern palette: terracotta, plum, marigold, sage — distinct from the teal sea
// and from each other; white labels read on all four.
const REGION_COLORS = { th: '#C25E3A', vi: '#9C5780', kh: '#E0A526', la: '#6E9A52' };

function regionPicker() {
  // Z-order: country fills (clickable) → the Mekong → labels on top (so a name is
  // never hidden by the river).
  const shapes = COUNTRIES.map((c) => {
    if (!REGION_PATHS[c.id]) return '';
    return `<g class="ctry-group" data-country="${c.id}" role="button" tabindex="0" aria-label="${esc(c.name)}">
         <path class="ctry" fill-rule="evenodd" d="${REGION_PATHS[c.id]}" fill="${REGION_COLORS[c.id]}"/>
       </g>`;
  }).join('');
  const river = REGION_RIVER ? `<g class="mekong-group" aria-hidden="true">
         <path class="mekong-casing" d="${REGION_RIVER}"/>
         <path id="mk-river-path" class="mekong" d="${REGION_RIVER}"/>
         <text class="mekong-name" dy="-7"><textPath href="#mk-river-path" startOffset="38%">~ Mekong ~</textPath></text>
       </g>` : '';
  const labels = COUNTRIES.map((c) => {
    if (!REGION_PATHS[c.id]) return '';
    // REGION_LABELS is each country's pole of inaccessibility — its true visual centre.
    const [lx, ly] = REGION_LABELS[c.id];
    return `<g class="ctry-label" aria-hidden="true">
         <text class="ctry-flag" x="${lx}" y="${ly - 8}" text-anchor="middle">${c.flag}</text>
         <text class="ctry-name" x="${lx}" y="${ly + 26}" text-anchor="middle">${esc(c.name)}</text>
       </g>`;
  }).join('');
  const svg = `<svg viewBox="${REGION_VIEWBOX}" class="region-svg" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Map of Thailand, Laos, Cambodia and Vietnam, with the Mekong River" xmlns="http://www.w3.org/2000/svg">
      ${shapes}${river}${labels}
    </svg>`;
  const box = h('div', { class: 'region-map', html: svg });
  box.querySelectorAll('.ctry-group').forEach((g) => {
    const id = g.getAttribute('data-country');
    const enter = () => { activeCountry = id; go(`#country-${id}`); };
    g.addEventListener('click', enter);
    g.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); enter(); } });
  });
  box.append(h('span', { class: 'region-cap' }, 'Tap a country to explore · the Mekong runs through all four'));
  return box;
}

// Per-country hub reached after picking a country.
function countryHubScreen(id) {
  const c = getCountry(id);
  if (c) activeCountry = id;
  const wrap = h('div', { class: 'screen' });
  wrap.append(topbar(c ? `${c.flag} ${c.name}` : 'Country', '#home'));
  if (!c) { wrap.append(h('p', { class: 'empty' }, 'Unknown country.')); mount(wrap, '#home'); return; }
  const lang = getLanguage(c.lang);
  wrap.append(h('div', { class: 'card' }, [
    h('p', {}, `Your companion for ${c.name}. Local currency: ${c.currency}.`),
    c.info ? null : h('p', { class: 'muted' }, 'Detailed guide expanding.'),
  ]));

  // Lead with WHERE THE TRAVELLER IS: if their location or focus resolves to a city in
  // this country, surface that city first and let them widen to the whole country. Only
  // when it is a real signal (GPS or a chosen focus), never the capital default.
  const fs = focusSpot(id);
  const fcity = (fs && (fs.source === 'gps' || fs.source === 'focus') && fs.spot) ? fs.spot.city : null;
  if (fcity) {
    const slug = citySlug(fcity);
    const here = allPlaces({ country: id }).filter((p) => citySlug(p.city || '') === slug).length;
    wrap.append(h('div', { class: 'card access-focus' }, [
      h('h2', { style: 'margin-top:0' }, `📍 You’re around ${fcity}`),
      h('p', { class: 'muted', style: 'margin:4px 0 8px' },
        here ? `${here} place${here > 1 ? 's' : ''} here — start local, then widen out when you want.` : 'Start with what’s around you, then widen out.'),
      here ? h('button', { class: 'btn block', onclick: () => go(`#places-${id}-${slug}`) }, `Places in ${fcity}`) : null,
      h('div', { class: 'chips', style: 'margin-top:6px' }, [
        h('button', { class: 'chip', onclick: () => go('#nearby') }, '📍 Near me now'),
        h('button', { class: 'chip', onclick: () => go(`#weather-${id}`) }, '⛅ Weather'),
      ]),
    ]));
  }

  const chc = countryHistoryCard(id); if (chc) wrap.append(chc);
  const acc = accessCard(id); if (acc) wrap.append(acc);
  const vc = visaCard(id); if (vc) wrap.append(vc);

  // Explore by city: a spatial overview of the whole country's places plus a city
  // picker, so a traveller sees WHERE things are and can scope straight to one city
  // (which then browses as a short list or a map).
  const cityPlaces = allPlaces({ country: id });
  if (cityPlaces.length) {
    const withCoords = cityPlaces.filter((p) => p.coords);
    const counts = {};
    cityPlaces.forEach((p) => { if (p.city) counts[p.city] = (counts[p.city] || 0) + 1; });
    const cities = Object.keys(counts).sort((a, b) => counts[b] - counts[a]);
    const explore = h('div', { class: 'card' }, [h('h2', {}, `🗺 Explore ${c.name}`)]);
    if (withCoords.length) {
      const mini = h('div', { class: 'mini-map', style: 'height:220px;border-radius:14px;overflow:hidden;position:relative;margin-bottom:8px' });
      explore.append(mini);
      import('./map.js').then((m) => m.initPlacesMap(mini, withCoords, {
        onOpen: (pid) => go(`#place-${pid}`),
        onLocate: (f) => setLastFix(f),
      })).then((ctrl) => { liveCleanup = () => { try { ctrl.dispose(); } catch { /* noop */ } }; }).catch(() => mini.remove());
    }
    if (cities.length) {
      explore.append(h('p', { class: 'muted', style: 'margin:2px 0 6px' }, 'Tap a city to see just its places — as a short list or on the map:'));
      explore.append(h('div', { class: 'chips' }, cities.slice(0, 16).map((city) =>
        h('button', { class: 'chip', onclick: () => go(`#places-${id}-${citySlug(city)}`) }, `${city} (${counts[city]})`))));
    }
    wrap.append(explore);
  }

  const tiles = [
    { ic: ICON.chat, t: 'Phrasebook', d: lang ? lang.label : 'Language', hash: `#phrasebook-${c.lang}` },
    { ic: ICON.pin, t: 'Places', d: 'For your taste & budget', hash: `#places-${c.id}` },
    { ic: ICON.tag, t: 'Fair prices', d: 'Avoid overcharging', hash: `#prices-${c.id}` },
    { ic: ICON.route, t: 'Getting around', d: 'Best way to next place', hash: `#transport-${c.id}` },
    { ic: ICON.compass, t: 'Country guide', d: 'Money, SIM, visa, safety', hash: `#info-${c.id}` },
    { ic: ICON.trophy, t: 'Best of', d: 'Top picks, families & more', hash: `#bestof-${c.id}` },
    { ic: ICON.ticket, t: 'Festivals', d: 'Dates & holidays', hash: `#events-${c.id}` },
    { ic: ICON.cloud, t: 'Weather', d: '7-day forecast', hash: `#weather-${c.id}` },
    { ic: ICON.sun, t: 'Today’s plan', d: 'Weather-aware picks', hash: `#today-${c.id}` },
    { ic: ICON.clock, t: 'Schedules', d: 'Train/bus times', hash: `#schedules-${c.id}` },
    { ic: ICON.bowl, t: 'Food', d: 'Dishes & ingredients', hash: `#food-${c.id}` },
    { ic: ICON.waves, t: 'Pools', d: 'Swims & day passes', hash: `#pools-${c.id}` },
    { ic: ICON.coins, t: 'Currency', d: `Convert to ${c.currency}`, hash: '#currency' },
    { ic: ICON.leaf, t: 'Identify nature', d: 'Birds, fish, plants', hash: '#nature' },
    { ic: ICON.map, t: 'Map', d: 'Offline + GPS', hash: '#map' },
    { ic: ICON.alert, t: 'Emergency', d: 'Numbers + key phrases', hash: '#sos' },
    { ic: ICON.star, t: 'Saved', d: 'Your collections', hash: '#saved' },
  ];
  // Collapsed by default: the city-first card, guide cards and Explore map cover the
  // primary needs; the full country toolkit is one tap away, not a wall of tiles.
  wrap.append(h('details', { class: 'filters-collapse' }, [
    h('summary', {}, `More for ${c.name}`),
    h('div', { class: 'grid' }, tiles.map((x) =>
      h('button', { class: 'tile', onclick: () => go(x.hash) }, [
        h('span', { class: 'ic', html: x.ic }), h('span', { class: 't' }, x.t), h('span', { class: 'd' }, x.d),
      ]))),
  ]));
  mount(wrap, '#home');
}

// ---- "NEAR ME" / JUST-ARRIVED HUB -------------------------------------------
// The just-stepped-off-the-plane front door. Uses the device GPS (offline; last fix
// cached) to name where you are, order the closest places by distance, and lay out the
// first-hour essentials — shaped by your profile. Every distance is pure offline maths.
function nearCat(p) {
  const c = p.categories || [];
  if (p.stayType || c.some((x) => ['hotel', 'stay', 'accommodation', 'guesthouse', 'homestay', 'resort', 'hostel', 'apartment'].includes(x))) return 'stay';
  if (p.isLocal || c.some((x) => ['food', 'restaurant', 'streetfood', 'market', 'cafe'].includes(x))) return 'eat';
  return 'do';
}
function catEmoji(c) { return c === 'eat' ? '🍜' : c === 'stay' ? '🛏' : '🎫'; }

// First-hour essentials, lightly tailored to the traveller's party/budget.
function arrivalEssentials(country) {
  const c = getCountry(country);
  const lang = c ? c.lang : 'th';
  const party = store.profile.prefs.party;
  const budget = store.profile.prefs.budget;
  const card = h('div', { class: 'card' }, [h('h2', {}, '🧭 Your first hour')]);
  const item = (summary, ...kids) => h('details', { class: 'arrival-item' }, [h('summary', {}, summary), ...kids]);
  card.append(
    item('💵 Cash & ATMs',
      h('p', { class: 'muted' }, `Use a bank ATM rather than an airport counter for a better rate${budget === 'low' ? '; withdraw a larger amount at once to spread the per-use fee' : ''}. Carry small notes for stalls, tuk-tuks and markets.`),
      h('button', { class: 'btn ghost block', onclick: () => go('#currency') }, 'Open the currency converter')),
    item('📶 SIM & data',
      h('p', { class: 'muted' }, 'Pick up a tourist SIM or eSIM at the airport or a phone shop. You rarely need much — this whole app works offline once loaded.')),
    item('🚰 Safe food & water',
      h('p', { class: 'muted' }, party === 'family'
        ? 'Choose busy stalls where food is hot and fresh, and stick to bottled or filtered water. For young children, start with plain rice and noodle dishes.'
        : 'Bottled or filtered water only. Busy stalls with high turnover are usually the safest — the food is cooked to order and does not sit around.')),
    item('🏠 Get to your stay',
      h('p', { class: 'muted' }, 'Save where you are staying and the map will always show the distance and direction back — even with no signal.'),
      h('button', { class: 'btn ghost block', onclick: () => go('#map') }, 'Set my accommodation on the map')),
    item('💬 First words',
      h('p', { class: 'muted' }, 'Hello, thank you and the numbers go a long way with drivers and vendors.'),
      h('button', { class: 'btn ghost block', onclick: () => go(`#phrasebook-${lang}`) }, 'Open the phrasebook')),
  );
  return card;
}

// The full "just arrived / first hour" assistant, keyed to where the traveller lands:
// airport→town transport for that gateway, cash without fees, a SIM/eSIM, safe water,
// and profile-aware links (baby, accessibility). Fully offline.
const GW_NAME = { bangkok: 'Bangkok', 'chiang-mai': 'Chiang Mai', phuket: 'Phuket', krabi: 'Krabi', 'koh-samui': 'Koh Samui', hanoi: 'Hanoi', hcmc: 'Ho Chi Minh City', 'da-nang': 'Da Nang', 'siem-reap': 'Siem Reap', 'phnom-penh': 'Phnom Penh', vientiane: 'Vientiane', 'luang-prabang': 'Luang Prabang' };
let arrivalPick = '';
function arrivalScreen(arg) {
  const fs = focusSpot(arg && getCountry(arg) ? arg : undefined);
  const spot = fs.spot;
  const cc = spot.country;
  const c = getCountry(cc);
  const prefs = store.profile.prefs;
  const GATEWAYS = { th: ['bangkok', 'chiang-mai', 'phuket', 'krabi', 'koh-samui'], vi: ['hanoi', 'hcmc', 'da-nang'], kh: ['siem-reap', 'phnom-penh'], la: ['vientiane', 'luang-prabang'] };
  const gws = GATEWAYS[cc] || [];
  if (arrivalPick && !gws.includes(arrivalPick)) arrivalPick = '';
  const focusSlug = citySlug(spot.city);
  const activeGw = arrivalPick || (gws.includes(focusSlug) ? focusSlug : (gws[0] || ''));
  const arr = getArrival(activeGw);

  const wrap = h('div', { class: 'screen' });
  wrap.append(topbar('🛬 Just arrived', '#home'));
  wrap.append(h('p', { class: 'muted' }, `Your first hour in ${c ? c.name : 'the country'} — cash, a SIM, and the cheapest safe way from the airport into town. It all works offline.`));
  wrap.append(countryChips((id) => { arrivalPick = ''; go(`#arrival-${id}`); }, cc));
  if (gws.length > 1) {
    const gwRow = h('div', { class: 'chips' });
    gws.forEach((s) => gwRow.append(h('button', { class: 'chip', 'aria-pressed': s === activeGw ? 'true' : 'false', onclick: () => { arrivalPick = s; render(); } }, `🛫 ${GW_NAME[s] || titleCase(s.replace(/-/g, ' '))}`)));
    wrap.append(gwRow);
  }

  if (arr) {
    const t = h('div', { class: 'card' }, [h('h2', { style: 'margin-top:0' }, `🚕 ${arr.airport}`)]);
    arr.options.forEach((o) => t.append(h('div', { class: 'board-row' }, [
      h('strong', {}, o.mode),
      h('div', { class: 'tiny muted' }, `${o.detail}${o.fare ? ` · 💰 ${o.fare}` : ''}`),
      o.tip ? h('div', { class: 'list-note' }, o.tip) : null,
    ])));
    if (arr.scam) t.append(h('p', { class: 'disclaimer', style: 'margin-bottom:0' }, `⚠️ ${arr.scam}`));
    wrap.append(t);
  }

  const ess = getEssentials(cc);
  const cash = ess && (ess.items || []).find((i) => /cash/i.test(i.item));
  const sim = ess && (ess.items || []).find((i) => /sim/i.test(i.item));

  const cashCard = h('div', { class: 'card' }, [h('h2', {}, '💵 Cash without the fees')]);
  cashCard.append(h('p', {}, cash ? cash.cheapest : 'Use a bank ATM rather than an airport counter, and withdraw a larger amount to spread the per-use fee.'));
  if (cash && cash.price && cash.price !== '—') cashCard.append(h('p', { class: 'tiny muted' }, `💰 ${cash.price}`));
  if (cash && cash.tip) cashCard.append(h('div', { class: 'list-note' }, cash.tip));
  cashCard.append(h('button', { class: 'btn ghost block', style: 'margin-top:6px', onclick: () => go('#currency') }, 'Open the currency converter'));
  wrap.append(cashCard);

  const simCard = h('div', { class: 'card' }, [h('h2', {}, '📶 Get online (SIM / eSIM)')]);
  simCard.append(h('p', {}, sim ? sim.cheapest : 'Pick up a tourist SIM at a phone shop in town rather than the airport counter.'));
  if (sim && sim.price) simCard.append(h('p', { class: 'tiny muted' }, `💰 ${sim.price}`));
  simCard.append(h('div', { class: 'list-note' }, 'Want data the moment you land? Buy a travel eSIM (e.g. Airalo, Holafly) before you fly and activate on arrival — a local SIM in town is usually cheaper for a longer stay.'));
  simCard.append(h('div', { class: 'list-note' }, `You may not need much data: this whole app works offline once loaded. ${netMode() === 'online' ? 'You are set to use data.' : 'You are in offline mode — switch data on from Home when you want it.'}`));
  wrap.append(simCard);

  const foodCard = h('div', { class: 'card' }, [h('h2', {}, '🚰 Water & your first meal')]);
  foodCard.append(h('p', {}, prefs.withBaby
    ? 'Bottled or filtered water only, for everyone. The busiest stalls — food hot and cooked to order — are safest; for little ones start with plain rice and noodle dishes.'
    : 'Bottled or filtered water only. The busiest stalls with high turnover are usually safest: food is cooked to order, not left sitting.'));
  wrap.append(foodCard);

  const doCard = h('div', { class: 'card' }, [h('h2', {}, '🧭 Settle in')]);
  doCard.append(h('button', { class: 'btn ghost block', onclick: () => go('#map') }, '🏠 Save where I am staying on the map'));
  if (c && c.lang) doCard.append(h('button', { class: 'btn ghost block', style: 'margin-top:6px', onclick: () => go(`#phrasebook-${c.lang}`) }, '💬 First words — hello, thanks, numbers'));
  doCard.append(h('button', { class: 'btn ghost block', style: 'margin-top:6px', onclick: () => go(`#sos-${cc}`) }, '🆘 Emergency numbers here'));
  if (getVisa(cc)) doCard.append(h('button', { class: 'btn ghost block', style: 'margin-top:6px', onclick: () => go(`#visa-${cc}`) }, '🛂 Entry & visa rules'));
  doCard.append(h('button', { class: 'btn ghost block', style: 'margin-top:6px', onclick: () => go('#nearby') }, '📍 What’s near me right now'));
  wrap.append(doCard);

  if (prefs.withBaby || (prefs.access || []).length) {
    const you = h('div', { class: 'card' }, [h('h2', {}, 'For your trip')]);
    if (prefs.withBaby) you.append(h('button', { class: 'btn ghost block', onclick: () => go(`#baby-${cc}`) }, '🍼 Baby: nappies, formula & family help'));
    if ((prefs.access || []).length) you.append(h('button', { class: 'btn ghost block', style: 'margin-top:6px', onclick: () => go(`#access-${cc}`) }, '♿ Accessibility guidance here'));
    wrap.append(you);
  }

  mount(wrap, 'home');
}

function nearbyScreen() {
  const wrap = h('div', { class: 'screen' });
  wrap.append(topbar('📍 Near me', '#home'));
  const status = h('p', { class: 'muted' }, [h('span', { class: 'spinner' }), 'Finding your location…']);
  const body = h('div', {});
  wrap.append(status, body);
  mount(wrap, '#nearby');

  // Cached fix paints instantly; a live fix then refines it. Offline-safe throughout.
  let fix = getLastFix();
  if (fix) paint(fix);
  geolocate()
    .then((pos) => { fix = setLastFix(pos); paint(fix); })
    .catch(() => { if (!fix) noLocation(); });

  function nearestCityInfo(f) {
    let best = null; let bestKm = Infinity;
    for (const s of WEATHER_SPOTS) {
      const km = haversineKm(f, { lat: s.lat, lng: s.lng });
      if (km < bestKm) { bestKm = km; best = s; }
    }
    return best ? { city: best.city, country: best.country, km: bestKm } : null;
  }

  function noLocation() {
    status.textContent = 'Location is off';
    body.innerHTML = '';
    body.append(h('div', { class: 'card' }, [
      h('p', {}, 'Turn on location to see what is around you — distances, walking times and the closest places, all offline once you have a fix.'),
      h('button', { class: 'btn block', onclick: () => go('#nearby') }, 'Try again'),
      h('button', { class: 'btn ghost block', style: 'margin-top:8px', onclick: () => go('#home') }, 'Or browse by country'),
    ]));
  }

  function paint(f) {
    const info = nearestCityInfo(f);
    const country = info ? info.country : activeCountry;
    activeCountry = country;
    const nb = nearestSpotGlobal(f); if (nb) setFocusSpot(nb.spot);   // remember where they are for weather/today
    const cName = getCountry(country) ? getCountry(country).name : '';
    status.innerHTML = '';
    status.append(
      h('strong', {}, info ? `You are near ${info.city}` : 'You are here'),
      (info && cName) ? h('span', { class: 'muted' }, ` · ${cName}${info.km > 60 ? ` (${fmtDistance(info.km)} away)` : ''}`) : null,
    );

    const ranked = allPlaces({ country }).filter((p) => p.coords)
      .map((p) => ({ p, km: haversineKm(f, p.coords) })).sort((a, b) => a.km - b.km);

    body.innerHTML = '';
    body.append(arrivalEssentials(country));
    body.append(h('button', { class: 'btn ghost block', style: 'margin-top:6px', onclick: () => go(`#arrival-${country}`) }, '🛬 Full arrival guide — airport→town, cash, SIM'));
    body.append(h('div', { class: 'chips', style: 'margin:10px 0' }, [
      h('button', { class: 'chip', onclick: () => { store.profile.prefs.placesView = 'map'; store.profile.prefs.placesSort = 'near'; save(); go(`#places-${country}`); } }, '🗺 See on the map'),
      h('button', { class: 'chip', onclick: () => go('#map') }, '📍 Set my stay'),
      h('button', { class: 'chip', onclick: () => go('#sos') }, '🆘 Emergency'),
    ]));

    let cat = 'all';
    const cats = [['all', 'Everything'], ['eat', '🍜 Eat'], ['stay', '🛏 Stay'], ['do', '🎫 Do']];
    const catRow = h('div', { class: 'chips' }, cats.map(([id, lbl]) =>
      h('button', {
        class: 'chip', 'aria-pressed': id === 'all' ? 'true' : 'false', dataset: { c: id },
        onclick: () => { cat = id; catRow.querySelectorAll('.chip').forEach((ch) => ch.setAttribute('aria-pressed', ch.dataset.c === id ? 'true' : 'false')); drawList(); },
      }, lbl)));
    const listEl = h('div', {});
    body.append(h('h3', { style: 'margin:14px 2px 4px' }, 'Closest to you'), catRow, listEl);

    function drawList() {
      listEl.innerHTML = '';
      const rows = ranked.filter(({ p }) => cat === 'all' || nearCat(p) === cat).slice(0, 12);
      if (!rows.length) { listEl.append(h('p', { class: 'empty' }, 'Nothing tagged nearby in this category yet — try “Everything” or the map.')); return; }
      rows.forEach(({ p, km }) => listEl.append(h('button', { class: 'btn ghost block near-row', onclick: () => go(`#place-${p.id}`) }, [
        h('span', { class: 'near-name' }, `${catEmoji(nearCat(p))} ${p.name}`),
        h('span', { class: 'dist-chip' }, `${fmtDistance(km)}${km <= 6 ? ` · ~${Math.max(1, Math.round((km / 4.8) * 60))} min` : ''} · ${compass(bearing(f, p.coords))}`),
      ])));
    }
    drawList();
  }
}

// ---- CURRENCY CONVERTER -----------------------------------------------------
function currencyScreen() {
  const c = getCountry(activeCountry);
  const local = c ? c.currency : 'THB';
  const home = store.profile.homeCurrency || 'USD';
  const wrap = h('div', { class: 'screen' });
  wrap.append(topbar('Currency', '#home'));
  const rates = getRates();
  wrap.append(h('div', { class: 'banner' }, rates.live
    ? `Live mid-market rates as of ${rates.date}.`
    : 'Approximate rates (offline baseline). Connect to the internet and refresh to update.'));

  const amount = h('input', { type: 'number', value: '1', inputmode: 'decimal' });
  const fromSel = currencySelect(home);
  const toSel = currencySelect(local);
  const out = h('p', { class: 'fx-result' }, '');
  function recompute() {
    const v = parseFloat(amount.value) || 0;
    const r = convert(v, fromSel.value, toSel.value);
    out.textContent = r == null ? 'Rate unavailable for this pair'
      : `${v.toLocaleString()} ${fromSel.value} = ${r.toLocaleString(undefined, { maximumFractionDigits: r >= 100 ? 0 : 2 })} ${toSel.value}`;
  }
  amount.addEventListener('input', recompute);
  fromSel.addEventListener('change', recompute);
  toSel.addEventListener('change', recompute);
  wrap.append(h('div', { class: 'card' }, [
    field('Amount', amount), field('From', fromSel),
    h('button', { class: 'btn ghost', onclick: () => { const t = fromSel.value; fromSel.value = toSel.value; toSel.value = t; recompute(); } }, '⇅ Swap'),
    field('To', toSel), out,
  ]));

  const quick = h('div', { class: 'card' }, [h('h2', {}, `Quick guide: ${home} → ${local}`)]);
  [1, 5, 10, 20, 50, 100].forEach((n) => {
    const r = convert(n, home, local);
    quick.append(h('div', { class: 'price-item row-between' }, [
      h('span', {}, `${n} ${home}`),
      h('strong', { class: 'fair' }, r == null ? '—' : `${r.toLocaleString(undefined, { maximumFractionDigits: 0 })} ${local}`),
    ]));
  });
  wrap.append(quick);

  wrap.append(h('button', { class: 'btn block', onclick: async () => { await refreshRates(); go('#currency'); } }, 'Refresh rates (needs internet)'));
  wrap.append(h('p', { class: 'disclaimer' }, 'Indicative mid-market values for guidance; money changers and cards apply their own spread.'));
  mount(wrap, '#home');
  recompute();
}

function currencySelect(current) {
  return selectEl(['USD', 'EUR', 'GBP', 'AUD', 'CAD', 'SGD', 'CNY', 'MYR', 'ILS', 'THB', 'VND', 'KHR', 'LAK'], current, () => {});
}

// The traveller's home currency (set in Settings; defaults to USD).
function homeCurrency() { return (store.profile && store.profile.homeCurrency) || 'USD'; }

// A local price range followed by an approximate home-currency conversion, e.g.
// "฿40–120 (≈ $1.10–3.30)". Uses live rates when available, the offline fallback
// otherwise (the ≈ signals it is approximate). Returns just the local range when
// the price is already in the home currency or no rate is known.
function priceLine(low, high, currency) {
  const local = range(low, high, currency);
  if (!local) return '';
  const home = homeCurrency();
  if (!currency || currency === home) return local;
  const lo = low != null ? convert(Number(low), currency, home) : null;
  const hi = high != null ? convert(Number(high), currency, home) : null;
  if ((lo == null || !isFinite(lo)) && (hi == null || !isFinite(hi))) return local;
  let approx;
  if (lo != null && hi != null && low !== high) approx = `${money(lo, home)}–${money(hi, home)}`;
  else approx = money(lo != null ? lo : hi, home);
  return `${local} (≈ ${approx})`;
}

// Single-amount variant: returns "≈ $3.30" (or '' if same currency / unknown rate).
function approxHome(amount, currency) {
  if (amount == null || amount === '') return '';
  const home = homeCurrency();
  if (!currency || currency === home) return '';
  const v = convert(Number(amount), currency, home);
  if (v == null || !isFinite(v)) return '';
  return `≈ ${money(v, home)}`;
}

function countryChips(onPick, selected = activeCountry) {
  return h('div', { class: 'country-row' }, COUNTRIES.map((c) =>
    h('button', {
      class: 'country-chip', 'aria-pressed': c.id === selected ? 'true' : 'false',
      onclick: () => onPick(c.id),
    }, [h('span', { class: 'flag' }, c.flag), h('span', {}, c.name)])));
}

// ---- PHRASEBOOK -------------------------------------------------------------
let phraseQuery = '';
// A "Save audio for offline" card for one phrasebook language. The service worker
// prefetches every phrase's online-TTS clip into a dedicated cache, so playback then
// works with no connection. Returns null when there is nothing to save (e.g. Hmong,
// which has no online voice) or when no SW is available (native wrapper / insecure ctx).
function audioPackControl(code, book) {
  const swOk = ('serviceWorker' in navigator) && !!navigator.serviceWorker.controller;
  const allergy = (ALLERGENS[code] && ALLERGENS[code].length) ? ALLERGENS[code] : [];
  const phrases = book.categories.flatMap((c) => c.phrases).concat(allergy);
  const urls = [...new Set(phrases.map((p) => ttsUrl(p.script, book.locale)).filter(Boolean))];
  if (!urls.length) return null;
  const saved = hasAudioPack(code);
  const mb = (urls.length * 10 / 1024).toFixed(1); // clips average ~10 KB
  const card = h('div', { class: 'card' });
  card.append(h('h3', {}, '🔊 Offline audio'));
  const status = h('p', { class: 'tiny muted' }, saved
    ? `${book.label} pronunciations are saved on this device — 🔊 works with no signal.`
    : `Save ${book.label} pronunciations (${urls.length} clips, ~${mb} MB) so 🔊 works offline — best done on wifi.`);
  card.append(status);
  if (!swOk) {
    card.append(h('p', { class: 'tiny muted' }, 'Add this app to your home screen to save audio for offline use.'));
    return card;
  }
  const btn = h('button', { class: 'btn block', style: 'margin-top:8px' }, saved ? '↻ Re-download audio' : `⤓ Save ${book.label} audio`);
  btn.onclick = () => {
    if (!navigator.serviceWorker.controller) return;
    btn.disabled = true;
    status.textContent = `Downloading ${urls.length} clips…`;
    const onMsg = (e) => {
      const d = e.data || {};
      if (d.lang !== code) return;
      if (d.type === 'TTS_PROGRESS') { status.textContent = `Downloading… ${d.done}/${d.total}`; }
      else if (d.type === 'TTS_DONE') {
        navigator.serviceWorker.removeEventListener('message', onMsg);
        btn.disabled = false;
        if (!d.ok) { status.textContent = 'Could not download audio — check your connection and try again.'; return; }
        addAudioPack(code); setSavedPacks(getAudioPacks());
        status.textContent = d.quotaHit
          ? `Saved ${d.ok} clips before hitting the storage limit — most phrases will play offline.`
          : `Saved ${d.ok} clips — ${book.label} audio now works offline.`;
        if (location.hash.replace(/^#/, '').startsWith('phrasebook')) go(`#phrasebook-${code}`);
      }
    };
    navigator.serviceWorker.addEventListener('message', onMsg);
    navigator.serviceWorker.controller.postMessage({ type: 'PREFETCH_TTS', urls, lang: code });
  };
  card.append(btn);
  return card;
}

function phrasebookScreen(lang) {
  const code = lang || store.profile.defaultLang || langForCountry(activeCountry);
  const book = getLanguage(code);
  const wrap = h('div', { class: 'screen' });
  wrap.append(topbar('Phrasebook'));

  // language tabs
  wrap.append(h('div', { class: 'lang-tabs' }, Object.values(LANGUAGES).map((b) =>
    h('button', {
      class: 'chip', 'aria-pressed': b.lang === code ? 'true' : 'false',
      onclick: () => { phraseQuery = ''; go(`#phrasebook-${b.lang}`); },
    }, b.label))));

  if (!book) { wrap.append(h('p', { class: 'empty' }, 'Language not available.')); mount(wrap, '#phrasebook'); return; }

  const voiceOk = hasVoiceFor(book.locale);
  if (!voiceOk) {
    wrap.append(h('div', { class: 'banner' },
      `No ${book.label} voice is installed on this device — tap 🔊 to hear it spoken online (needs internet), or use the romanised pronunciation.`));
  }
  if (book.politenessNote) wrap.append(h('div', { class: 'banner' }, book.politenessNote));

  // Offline audio pack: download every phrase's online pronunciation so 🔊 works with
  // no signal — essential for Khmer/Lao, which have no device voice on most phones.
  const audioCard = audioPackControl(code, book);
  if (audioCard) wrap.append(audioCard);

  // Say-it tool: type or speak English, get the local text + spoken pronunciation.
  wrap.append(liveTranslateBox(code, book.label, book.locale));

  // search
  wrap.append(h('h2', { class: 'cat-title' }, 'Phrasebook'));
  const search = h('input', {
    class: 'search', type: 'search', 'aria-label': 'Search', placeholder: `Search ${book.label} phrases…`, value: phraseQuery,
    oninput: debounce((e) => { phraseQuery = e.target.value; renderPhrases(); }, 120),
  });
  wrap.append(search);

  const listEl = h('div', {});
  wrap.append(listEl);

  // append an Allergies & dietary category from the allergens module (if present)
  const allergyCat = (ALLERGENS[code] && ALLERGENS[code].length)
    ? { id: 'allergies', name: 'Allergies & dietary', phrases: ALLERGENS[code] } : null;
  const categories = allergyCat ? book.categories.concat([allergyCat]) : book.categories;

  function renderPhrases() {
    listEl.innerHTML = '';
    const q = phraseQuery.trim().toLowerCase();
    for (const cat of categories) {
      // A query matches the whole category when its name matches (so "taxi"
      // surfaces the Taxi & directions phrases), else it matches per phrase.
      const catNameMatch = !q || cat.name.toLowerCase().includes(q);
      const matches = cat.phrases.filter((p) =>
        catNameMatch || p.en.toLowerCase().includes(q) || (p.roman || '').toLowerCase().includes(q) || (p.script || '').includes(phraseQuery));
      if (!matches.length) continue;
      listEl.append(h('h2', { class: 'cat-title' }, cat.name));
      for (const p of matches) listEl.append(phraseRow(p, book.locale));
    }
    if (!listEl.children.length) listEl.append(h('p', { class: 'empty' }, 'No phrases match your search.'));
  }
  renderPhrases();
  mount(wrap, '#phrasebook');
}

// One phrasebook row: tap the text to show it LARGE to a local; copy and speak controls.
function phraseRow(p, locale) {
  const able = canSay(locale);
  const grow = h('div', { class: 'grow tappable', role: 'button', tabindex: '0', 'aria-label': `Show large: ${p.en}`, title: 'Tap to show large to a local' }, [
    h('div', { class: 'en' }, p.en),
    h('div', { class: 'native', lang: locale }, p.script),
    h('div', { class: 'roman' }, [h('span', { class: 'lbl' }, 'say:'), p.roman]),
    p.note ? h('div', { class: 'note' }, p.note) : null,
  ]);
  grow.addEventListener('click', () => showBigPhrase(p, locale));
  grow.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); showBigPhrase(p, locale); } });
  const copyBtn = h('button', { class: 'speak', 'aria-label': `Copy ${p.en}`, title: 'Copy the local text', onclick: () => copyText(p.script, copyBtn) }, '⧉');
  const speakBtn = h('button', { class: 'speak', 'aria-label': `Speak: ${p.en}`, disabled: able ? null : '' }, '🔊');
  speakBtn.addEventListener('click', async () => {
    const ok = await say(p.script, locale);
    if (!ok) { speakBtn.textContent = '🔇'; speakBtn.title = 'Audio unavailable'; setTimeout(() => { speakBtn.textContent = '🔊'; }, 1500); }
  });
  return h('div', { class: 'phrase' }, [grow, h('div', { class: 'phrase-ctrls' }, [copyBtn, speakBtn])]);
}

// Map a place/dish/event country to the BCP-47 lang subtag of its script, so screen
// readers announce native text in the right voice instead of the page's English default.
const SCRIPT_LANG = { th: 'th', vi: 'vi', kh: 'km', la: 'lo' };
function scriptLang(country) { return SCRIPT_LANG[country] || null; }

// Shared modal behaviour for overlay dialogs: close on Escape, keep Tab focus inside the
// dialog, and restore focus to whatever was focused before it opened. `rootEl` is the
// backdrop appended to <body>; the element carrying role="dialog" (rootEl itself or a
// descendant) gets aria-modal and receives initial focus. Returns an idempotent close().
function openModal(rootEl, onClose) {
  const dialog = rootEl.matches('[role="dialog"]') ? rootEl : (rootEl.querySelector('[role="dialog"]') || rootEl);
  dialog.setAttribute('aria-modal', 'true');
  if (!dialog.hasAttribute('tabindex')) dialog.setAttribute('tabindex', '-1');
  const prev = document.activeElement;
  const focusables = () => [...dialog.querySelectorAll('a[href],button:not([disabled]),input:not([disabled]),select,textarea,[tabindex]:not([tabindex="-1"])')].filter((el) => el.offsetParent !== null);
  let closed = false;
  function close() {
    if (closed) return; closed = true;
    document.removeEventListener('keydown', onKey, true);
    rootEl.remove();
    try { if (prev && prev.focus) prev.focus(); } catch { /* noop */ }
    if (onClose) onClose();
  }
  function onKey(e) {
    if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); close(); return; }
    if (e.key === 'Tab') {
      const f = focusables();
      if (!f.length) { e.preventDefault(); dialog.focus(); return; }
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && (document.activeElement === first || document.activeElement === dialog)) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  }
  document.addEventListener('keydown', onKey, true);
  document.body.append(rootEl);
  setTimeout(() => { const f = focusables(); (f[0] || dialog).focus(); }, 0);
  return close;
}

// Full-screen, very large native script to point at a taxi driver / pharmacist / local.
function showBigPhrase(p, locale) {
  const able = canSay(locale);
  const overlay = h('div', { class: 'bigphrase', role: 'dialog', 'aria-label': 'Show to a local' });
  let close = () => overlay.remove();
  overlay.addEventListener('click', () => close());
  const inner = h('div', { class: 'bigphrase-inner' }, [
    h('div', { class: 'bp-en' }, p.en),
    h('div', { class: 'bp-script', lang: locale }, p.script),
    h('div', { class: 'bp-roman' }, p.roman),
    p.note ? h('div', { class: 'bp-note' }, p.note) : null,
    h('div', { class: 'bp-actions' }, [
      able ? h('button', { class: 'btn', onclick: (e) => { e.stopPropagation(); say(p.script, locale); } }, '🔊 Speak') : null,
      h('button', { class: 'btn ghost', onclick: () => close() }, 'Close'),
    ]),
    h('p', { class: 'muted', style: 'margin:8px 0 0' }, 'Show this screen to a local · tap anywhere to close'),
  ]);
  inner.addEventListener('click', (e) => e.stopPropagation());
  overlay.append(inner);
  close = openModal(overlay);
}

// Copy text to the clipboard with graceful fallback; flashes a tick on the button.
function copyText(text, btn) {
  const flash = () => { if (btn) { btn.textContent = '✓'; setTimeout(() => { btn.textContent = '⧉'; }, 1200); } };
  if (navigator.clipboard && navigator.clipboard.writeText) { navigator.clipboard.writeText(text).then(flash, () => {}); return; }
  try { const ta = h('textarea', {}); ta.value = text; document.body.append(ta); ta.select(); document.execCommand('copy'); ta.remove(); flash(); } catch { /* noop */ }
}

// Speak/type-in-English → local-language text + spoken audio. Works with no setup
// (free online service); the offline phrasebook below covers the essentials.
function liveTranslateBox(code, label, locale) {
  const box = h('div', { class: 'card translate-card' }, [
    h('h2', { style: 'margin-top:0' }, `Say it in ${label}`),
    h('p', { class: 'muted', style: 'margin-top:0' }, `Type or speak in your language; get the ${label} text and hear it spoken. Needs internet.`),
  ]);
  const srcSel = selectEl([['en', 'From English'], ['he', 'From Hebrew (עברית)']], 'en', () => {});
  const input = h('input', { class: 'search', type: 'text', 'aria-label': 'Search', placeholder: 'e.g. Where is the bus station?' });
  const out = h('div', { class: 'tr-out', style: 'margin-top:10px' });

  const doTranslate = async () => {
    const text = input.value.trim();
    if (!text) return;
    out.innerHTML = ''; out.append(h('p', { class: 'muted' }, 'Translating…'));
    try {
      const res = await translate(text, code, srcSel.value);
      out.innerHTML = '';
      out.append(h('div', { class: 'native', lang: locale, style: 'font-size:23px;line-height:1.35' }, res));
      const able = canSay(locale);
      const speakBtn = h('button', { class: 'btn', disabled: able ? null : '', onclick: () => say(res, locale) },
        able ? '🔊 Hear it' : '🔇 Voice needs internet');
      out.append(speakBtn);
      if (!able) out.append(h('p', { class: 'muted', style: 'margin-bottom:0' }, `No ${label} voice on this device and you are offline — the text above is correct to show.`));
      else say(res, locale);   // best-effort auto-play; the button always works (direct tap)
    } catch (err) { out.innerHTML = ''; out.append(h('p', { class: 'muted', style: 'margin-bottom:0' }, err.message)); }
  };
  input.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); doTranslate(); } });

  const btn = h('button', { class: 'btn', onclick: doTranslate }, 'Translate');
  // Optional voice input via the Web Speech API (Chrome/Edge; hidden where absent).
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  let micBtn = null;
  if (SR) {
    micBtn = h('button', { class: 'btn ghost', title: 'Speak instead of typing' }, '🎤 Speak');
    micBtn.addEventListener('click', () => {
      try {
        const rec = new SR();
        rec.lang = srcSel.value === 'he' ? 'he-IL' : 'en-US';
        rec.interimResults = false; rec.maxAlternatives = 1;
        micBtn.textContent = '🎙 Listening…'; micBtn.disabled = true;
        rec.onresult = (e) => { input.value = e.results[0][0].transcript; doTranslate(); };
        rec.onerror = () => { micBtn.textContent = '🎤 Speak'; micBtn.disabled = false; };
        rec.onend = () => { micBtn.textContent = '🎤 Speak'; micBtn.disabled = false; };
        rec.start();
      } catch { micBtn.textContent = '🎤 Speak'; micBtn.disabled = false; }
    });
  }
  box.append(srcSel, input, h('div', { class: 'row-between', style: 'gap:8px;margin-top:8px' }, [btn, micBtn].filter(Boolean)), out);
  return box;
}

// ---- PLACES -----------------------------------------------------------------
// "Chiang Mai" -> "chiang-mai" for city-scoped Places routes (#places-<cc>-<slug>).
function citySlug(name) {
  return String(name || '').toLowerCase().replace(/\(.*?\)/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

function placesScreen(arg) {
  // arg is "<cc>" or "<cc>-<citySlug>" (e.g. "th" or "th-chiang-mai").
  const parts = String(arg || '').split('-');
  const cc = parts.shift() || activeCountry;
  const scopeSlug = parts.join('-');
  if (cc) activeCountry = cc;
  const wrap = h('div', { class: 'screen' });
  // Resolve the scoped city's display name from the data (fall back to the slug).
  const scopeCity = scopeSlug
    ? (allPlaces({ country: activeCountry }).map((p) => p.city).find((c) => citySlug(c) === scopeSlug) || titleCase(scopeSlug.replace(/-/g, ' ')))
    : '';
  wrap.append(topbar(scopeCity ? `Places in ${scopeCity}` : 'Places for you'));
  wrap.append(countryChips((id) => go(`#places-${id}`)));
  if (scopeCity) {
    wrap.append(h('div', { class: 'chips', style: 'margin:2px 0 4px' }, [
      h('button', { class: 'chip', 'aria-pressed': 'true' }, `📍 ${scopeCity}`),
      h('button', { class: 'chip', onclick: () => go(`#places-${activeCountry}`) }, `Show all of ${getCountry(activeCountry) ? getCountry(activeCountry).name : 'country'}`),
    ]));
    // Browsing a city makes it the traveller's focus, so weather + "today" + "right now"
    // follow this city (not the capital) until GPS or another city overrides it.
    const cSpot = spotForCity(activeCountry, scopeCity); if (cSpot) setFocusSpot(cSpot);
    const ac = cityAboutCard(activeCountry, scopeSlug); if (ac) wrap.append(ac);
    wrap.append(cityEssentials(activeCountry, scopeCity, scopeSlug));
  }

  // interest filters (seeded from saved prefs the first time)
  const prefs = store.profile.prefs;
  const selInterests = new Set(prefs.interests || []);
  let selBudget = prefs.budget || 'flexible';
  let selKids = !!prefs.kids;
  let selStayType = prefs.stayType || 'any';
  let selStayDur = prefs.stayDuration || 'any';

  const interestChips = h('div', { class: 'chips' }, INTERESTS.map((it) =>
    h('button', {
      class: 'chip', 'aria-pressed': selInterests.has(it.id) ? 'true' : 'false',
      onclick: (e) => {
        if (selInterests.has(it.id)) selInterests.delete(it.id); else selInterests.add(it.id);
        e.currentTarget.setAttribute('aria-pressed', selInterests.has(it.id) ? 'true' : 'false');
        renderList();
      },
    }, it.label)));

  const budgets = [['flexible', 'Any budget'], ['low', 'Budget'], ['mid', 'Mid'], ['high', 'Higher-end']];
  const budgetChips = h('div', { class: 'chips' }, budgets.map(([id, lbl]) =>
    h('button', {
      class: 'chip', 'aria-pressed': selBudget === id ? 'true' : 'false', dataset: { b: id },
      onclick: (e) => {
        selBudget = id;
        budgetChips.querySelectorAll('.chip').forEach((c) =>
          c.setAttribute('aria-pressed', c.dataset.b === id ? 'true' : 'false'));
        renderList();
      },
    }, lbl)));

  // Good-for-kids toggle (remembered in prefs).
  const kidsChip = h('button', {
    class: 'chip', 'aria-pressed': selKids ? 'true' : 'false',
    onclick: (e) => { selKids = !selKids; e.currentTarget.setAttribute('aria-pressed', selKids ? 'true' : 'false'); prefs.kids = selKids; save(); renderList(); },
  }, '👨‍👩‍👧 Good for kids');

  // Step-free filter appears when the traveller has a mobility need or the country has any
  // place tagged step-free — so the option is there for those who need it, unobtrusive otherwise.
  let selStepFree = false;
  const showStepFree = (store.profile.prefs.access || []).includes('mobility') || allPlaces({ country: activeCountry }).some((p) => p.access && p.access.stepFree);
  const stepFreeChip = showStepFree ? h('button', {
    class: 'chip', 'aria-pressed': 'false',
    onclick: (e) => { selStepFree = !selStepFree; e.currentTarget.setAttribute('aria-pressed', selStepFree ? 'true' : 'false'); renderList(); },
  }, '♿ Step-free') : null;

  const filterCard = h('div', {}, [
    h('div', { class: 'muted' }, 'Interests'), interestChips,
    h('div', { class: 'muted' }, 'Budget'), budgetChips,
    h('div', { class: 'muted' }, 'Travelling with'), h('div', { class: 'chips' }, [kidsChip, stepFreeChip]),
  ]);

  // Stay filters appear only when this country has accommodation tagged, so the UI
  // stays clean until stays exist for a country (remembered in prefs).
  const hasStays = allPlaces({ country: activeCountry }).some((p) => p.stayType);
  if (hasStays) {
    const stayTypes = [['any', 'Any'], ['tent', '⛺ Camp'], ['hostel', 'Hostel'], ['guesthouse', 'Guesthouse'], ['homestay', 'Homestay'], ['hotel', 'Hotel'], ['resort', 'Resort'], ['apartment', 'Apartment']];
    const stayTypeChips = h('div', { class: 'chips' }, stayTypes.map(([id, lbl]) =>
      h('button', { class: 'chip', 'aria-pressed': selStayType === id ? 'true' : 'false', dataset: { s: id },
        onclick: (e) => { selStayType = id; stayTypeChips.querySelectorAll('.chip').forEach((c) => c.setAttribute('aria-pressed', c.dataset.s === id ? 'true' : 'false')); prefs.stayType = id; save(); renderList(); } }, lbl)));
    const stayDurs = [['any', 'Any length'], ['short', 'Short stay'], ['long', 'Long stay']];
    const stayDurChips = h('div', { class: 'chips' }, stayDurs.map(([id, lbl]) =>
      h('button', { class: 'chip', 'aria-pressed': selStayDur === id ? 'true' : 'false', dataset: { d: id },
        onclick: (e) => { selStayDur = id; stayDurChips.querySelectorAll('.chip').forEach((c) => c.setAttribute('aria-pressed', c.dataset.d === id ? 'true' : 'false')); prefs.stayDuration = id; save(); renderList(); } }, lbl)));
    filterCard.append(h('div', { class: 'muted' }, 'Where to stay'), stayTypeChips, stayDurChips);
  }

  // View + sort controls. The same filtered results can be scrolled as a list OR seen
  // spatially on an offline map, and optionally ordered by distance from you. Both are
  // remembered. This is the "put location things on a map + less scrolling" fix.
  let viewMode = prefs.placesView === 'map' ? 'map' : 'list';
  let sortMode = prefs.placesSort === 'near' ? 'near' : 'best';

  const viewBtn = (mode, label) => h('button', {
    class: 'chip', 'aria-pressed': viewMode === mode ? 'true' : 'false',
    onclick: () => { if (viewMode === mode) return; prefs.placesView = mode; save(); render(); },
  }, label);
  const nearChip = h('button', {
    class: 'chip', 'aria-pressed': sortMode === 'near' ? 'true' : 'false',
    onclick: async (e) => {
      const btn = e.currentTarget;
      if (sortMode === 'near') { sortMode = 'best'; prefs.placesSort = 'best'; save(); btn.setAttribute('aria-pressed', 'false'); btn.textContent = '📍 Nearest first'; renderList(); return; }
      if (!getLastFix()) {
        btn.textContent = 'Locating…';
        try { setLastFix(await geolocate()); }
        catch { btn.textContent = '📍 Turn on location'; setTimeout(() => { btn.textContent = '📍 Nearest first'; }, 1800); return; }
      }
      sortMode = 'near'; prefs.placesSort = 'near'; save();
      btn.setAttribute('aria-pressed', 'true'); btn.textContent = '📍 Nearest first'; renderList();
    },
  }, '📍 Nearest first');
  wrap.append(h('div', { class: 'view-toggle', style: 'display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin:6px 0' }, [
    h('div', { class: 'chips', style: 'margin:0' }, [viewBtn('list', '📋 List'), viewBtn('map', '🗺 Map')]),
    h('span', { style: 'flex:1' }), nearChip,
  ]));

  // Results-first: the filter rows collapse into one tap so places show immediately
  // instead of being pushed below ~5 rows of chips. The summary shows how many filters
  // are active, so a returning traveller still sees their choices are applied.
  const activeFilterCount = selInterests.size + (selBudget !== 'flexible' ? 1 : 0)
    + (selKids ? 1 : 0) + (selStepFree ? 1 : 0)
    + (selStayType !== 'any' ? 1 : 0) + (selStayDur !== 'any' ? 1 : 0);
  wrap.append(h('details', { class: 'filters-collapse' }, [
    h('summary', {}, activeFilterCount ? `⚙ Filters · ${activeFilterCount} on` : '⚙ Filters'),
    filterCard,
  ]));

  const listEl = h('div', {});
  const mapWrap = h('div', {});
  const cap = h('p', { class: 'muted', style: 'margin:2px 2px 8px' }, '');
  wrap.append(viewMode === 'map' ? mapWrap : listEl);

  let placesCtrl = null;
  let currentResults = [];

  // Filtered + sorted results, or null when this country has no places yet.
  function computeResults() {
    const country = getCountry(activeCountry);
    if (!country || !Array.isArray(country.places)) return null;
    let results = allPlaces({ country: activeCountry, interests: [...selInterests], budget: selBudget });
    if (scopeSlug) results = results.filter((p) => citySlug(p.city) === scopeSlug);
    if (selKids) results = results.filter((p) => p.kidFriendly === true);
    if (selStayType !== 'any') results = results.filter((p) => p.stayType === selStayType);
    if (selStayDur !== 'any') results = results.filter((p) => p.stayDuration === selStayDur || p.stayDuration === 'both');
    if (selStepFree) results = results.filter((p) => p.access && (p.access.stepFree === 'yes' || p.access.stepFree === 'partial'));
    const fix = getLastFix();
    if (sortMode === 'near' && fix) {
      const d = (p) => (p.coords ? haversineKm(fix, p.coords) : Infinity);
      results = results.slice().sort((a, b) => d(a) - d(b));
    } else if (profileIsSet()) {
      results = results.slice().sort((a, b) => personalScore(b) - personalScore(a));
    }
    return results;
  }

  function renderList() {
    const country = getCountry(activeCountry);
    const computed = computeResults();
    currentResults = computed || [];
    if (viewMode === 'map') {
      const withCoords = currentResults.filter((p) => p.coords).length;
      cap.textContent = currentResults.length
        ? `${withCoords} of ${currentResults.length} places on the map${sortMode === 'near' && getLastFix() ? ' · nearest first' : ''} — tap a pin`
        : '';
      if (placesCtrl) placesCtrl.setPlaces(currentResults);
      return;
    }
    listEl.innerHTML = '';
    if (computed === null) {
      listEl.append(h('p', { class: 'empty' }, `${country ? country.name : 'This country'} places are coming soon. Thailand is fully covered in this build.`));
      return;
    }
    if (!currentResults.length) { listEl.append(h('p', { class: 'empty' }, 'No places match these filters. Try widening them.')); return; }
    // "Show more" expander: reveal the rest inline (no full re-render) to cut scrolling.
    const expander = (rest, label) => {
      if (!rest.length) return null;
      const btn = h('button', { class: 'btn ghost block', style: 'margin:2px 0 10px' }, label);
      btn.onclick = () => { rest.forEach((p) => btn.before(placeCard(p))); btn.remove(); };
      return btn;
    };
    if (sortMode === 'near') {
      // proximity order matters — keep one flat list, capped, with a reveal.
      const CAP = 12;
      currentResults.slice(0, CAP).forEach((p) => listEl.append(placeCard(p)));
      const more = expander(currentResults.slice(CAP), `Show ${currentResults.length - CAP} more`);
      if (more) listEl.append(more);
    } else {
      // group by category so a long list scans as a few short sections.
      const groups = {};
      currentResults.forEach((p) => { const b = placeBucket(p); (groups[b] = groups[b] || []).push(p); });
      const CAP = 5;
      PLACE_BUCKETS.forEach(([key, label]) => {
        const arr = groups[key];
        if (!arr || !arr.length) return;
        listEl.append(h('h3', { class: 'cat-title' }, `${label} · ${arr.length}`));
        arr.slice(0, CAP).forEach((p) => listEl.append(placeCard(p)));
        const more = expander(arr.slice(CAP), `Show all ${arr.length} · ${label.replace(/^\S+\s/, '')}`);
        if (more) listEl.append(more);
      });
    }
  }

  renderList();
  mount(wrap, '#places');

  // In map mode, boot the embedded offline map with the current results. Filter changes
  // call placesCtrl.setPlaces() (no WebGL rebuild); leaving the screen disposes it via
  // liveCleanup so contexts don't leak.
  if (viewMode === 'map') {
    if (!currentResults.length) {
      mapWrap.append(h('p', { class: 'empty' }, 'No mapped places for these filters yet — switch to List or widen the filters.'));
    } else {
      const canvas = h('div', { class: 'places-map', style: 'height:360px;border-radius:16px;overflow:hidden;position:relative' });
      mapWrap.append(cap, canvas);
      import('./map.js').then((m) => m.initPlacesMap(canvas, currentResults, {
        onOpen: (id) => go(`#place-${id}`),
        onLocate: (fix) => setLastFix(fix),
      })).then((c) => { placesCtrl = c; liveCleanup = () => { try { c.dispose(); } catch { /* noop */ } }; })
        .catch(() => { cap.textContent = ''; mapWrap.append(h('p', { class: 'muted' }, 'The map could not start here — switch to List view.')); });
    }
  }
}

function tierBadge(tier) {
  const lbl = { low: 'Budget', mid: 'Mid', high: 'Higher-end', any: 'Any' }[tier] || tier;
  return h('span', { class: `tier ${tier}` }, lbl);
}

// Traveller-fit chips (kid-friendly, stay type, stay length) shown on cards + detail.
const STAY_LABEL = { tent: '⛺ Camping', hostel: '🛏️ Hostel', guesthouse: '🏠 Guesthouse', homestay: '🏡 Homestay', hotel: '🏨 Hotel', resort: '🌴 Resort', apartment: '🏢 Apartment' };
function travelerChips(p) {
  const chips = [];
  if (p.kidFriendly === true) chips.push(h('span', { class: 'cat-tag' }, '👨‍👩‍👧 Kids OK'));
  if (p.stayType) chips.push(h('span', { class: 'cat-tag' }, STAY_LABEL[p.stayType] || p.stayType));
  if (p.stayDuration === 'long') chips.push(h('span', { class: 'cat-tag' }, 'Long stay'));
  else if (p.stayDuration === 'short') chips.push(h('span', { class: 'cat-tag' }, 'Short stay'));
  else if (p.stayDuration === 'both') chips.push(h('span', { class: 'cat-tag' }, 'Short or long stay'));
  return chips.length ? h('div', { class: 'cats', style: 'margin-top:4px' }, chips) : null;
}

// ---- "For you" personalisation ------------------------------------------------
// Once the traveller sets a profile (#foryou), lists rank what fits them first:
// budget tier, kids, long-stay fit and interests all add to a place's base rating.
function profileIsSet() {
  const p = store.profile.prefs;
  return !!(p.party || p.tripLength || (p.budget && p.budget !== 'flexible') || (p.interests || []).length);
}
function personalScore(p) {
  const prefs = store.profile.prefs;
  let s = Number(p.rating) || 3;
  if (prefs.budget && prefs.budget !== 'flexible' && (p.budgetTier === prefs.budget || p.budgetTier === 'any')) s += 0.7;
  if (prefs.party === 'family' && p.kidFriendly === true) s += 0.8;
  if (prefs.party === 'family' && p.kidFriendly === false) s -= 0.5;
  if (prefs.tripLength === 'long' && (p.stayDuration === 'long' || p.stayDuration === 'both')) s += 0.5;
  if ((prefs.interests || []).some((i) => (p.categories || []).includes(i))) s += 0.4;
  return s;
}

function starsStr(n) { const r = Math.max(0, Math.min(5, Math.round(Number(n) || 0))); return '★'.repeat(r) + '☆'.repeat(5 - r); }

// A unified, LAWFUL rating: a synthesised score from multiple cited public sources
// (no scraping), plus a deep link to live Google reviews. The user's own rating
// lives separately in yourLayer().
function ratingBlock(p) {
  return h('div', { class: 'rating-block' }, [
    h('span', { class: 'stars-static' }, starsStr(p.rating)),
    h('span', { class: 'muted' }, ` ${Number(p.rating).toFixed(1)} · synthesised from ${(p.reviewSources || []).join(', ') || 'multiple sources'}`),
    h('a', { class: 'rev-link', href: mapsUrl(p), target: '_blank', rel: 'noopener' }, 'See live reviews'),
  ]);
}

// Resolve a saved item id to a renderable place-like object: a curated place, or a
// user pin normalised into the same shape.
function resolveItem(id) {
  if (typeof id === 'string' && id.startsWith('pin-')) {
    const pin = getPin(id);
    if (!pin) return null;
    return {
      id: pin.id, name: pin.name, city: 'Your pin', country: '', isPin: true,
      categories: pin.tags || [], budgetTier: 'any', blurb: pin.note || 'A place you marked.',
      priceRange: { low: null, high: null, currency: '' }, coords: pin.coords || null, mapQuery: pin.name,
    };
  }
  return getPlace(id);
}

// Category buckets for grouping the Places list and filtering Search. A place falls in
// the FIRST matching bucket (stays are distinct; then the four interest categories).
const PLACE_BUCKETS = [
  ['food', '🍜 Food & markets'],
  ['stay', '🛏 Places to stay'],
  ['culture', '🏛 Culture & history'],
  ['nature', '🌿 Nature & outdoors'],
  ['nightlife', '🌃 Nightlife & social'],
  ['other', '📌 More to see'],
];
function placeBucket(p) {
  const cats = Array.isArray(p.categories) ? p.categories : [];
  if (p.stayType || cats.some((c) => ['hotel', 'stay', 'accommodation', 'guesthouse', 'homestay', 'resort', 'hostel', 'apartment'].includes(c))) return 'stay';
  for (const it of ['food', 'culture', 'nature', 'nightlife']) if (cats.includes(it)) return it;
  return 'other';
}

// "1.2 km · ~15 min walk away" from the user's last GPS fix, when known. Offline,
// pure maths (haversine + ~4.8 km/h walking pace); walk time only for close spots.
// Returns a chip node or null. Reused on cards, detail and the near-me experiences.
function distanceChip(p) {
  const fix = getLastFix();
  if (!fix || !p || !p.coords) return null;
  const km = haversineKm(fix, p.coords);
  const parts = [fmtDistance(km)];
  if (km <= 6) parts.push(`~${Math.max(1, Math.round((km / 4.8) * 60))} min walk`);
  parts.push(`${compass(bearing(fix, p.coords))}`);
  return h('span', { class: 'dist-chip', title: 'From your last location' }, `📍 ${parts.join(' · ')}`);
}

function placeCard(p) {
  const cats = Array.isArray(p.categories) ? p.categories : [];
  const hasPrice = p.priceRange && p.priceRange.currency;
  const priceStr = hasPrice ? (priceLine(p.priceRange.low, p.priceRange.high, p.priceRange.currency) || 'Free') : '';
  const colls = collectionsForItem(p.id);
  const dchip = distanceChip(p);
  return h('div', { class: 'card' }, [
    h('div', { class: 'place-head' }, [
      h('h2', {}, `${p.isPin ? '📌 ' : ''}${p.name}`),
      h('button', {
        class: 'save-star', 'aria-label': 'Quick save to favourites', title: 'Quick save',
        onclick: (e) => { const on = toggleFavorite(p.id); e.currentTarget.textContent = on ? '★' : '☆'; },
      }, isFavorite(p.id) ? '★' : '☆'),
    ]),
    (cats.length || (p.budgetTier && !p.isPin)) ? h('div', { class: 'row-between' }, [
      h('div', { class: 'cats' }, cats.map((c) => h('span', { class: 'cat-tag' }, c))),
      (p.budgetTier && !p.isPin) ? tierBadge(p.budgetTier) : null,
    ]) : null,
    travelerChips(p),
    p.blurb ? h('p', {}, p.blurb) : null,
    h('p', { class: 'muted' }, [p.city, priceStr].filter(Boolean).join(' · ')),
    dchip ? h('div', { style: 'margin:2px 0' }, dchip) : null,
    p.rating ? h('div', { class: 'stars-static' }, `${starsStr(p.rating)} ${Number(p.rating).toFixed(1)}`) : null,
    colls.length ? h('div', { class: 'cats' }, colls.map((c) =>
      h('span', { class: 'cat-tag', style: 'background:var(--grape)' }, `${c.emoji} ${c.name}`))) : null,
    h('div', { class: 'row-between' }, [
      h('button', { class: 'btn ghost', onclick: () => go(`#place-${p.id}`) }, 'Details'),
      h('button', { class: 'btn ghost', onclick: () => saveSheet(p.id) }, '＋ Save'),
    ]),
  ]);
}

// Modal sheet: add an item to collections (and toggle favourite / create new).
function saveSheet(itemId) {
  const backdrop = h('div', { class: 'sheet-backdrop' });
  const sheet = h('div', { class: 'sheet', role: 'dialog', 'aria-label': 'Save to collections' });
  let close = () => backdrop.remove();
  backdrop.addEventListener('click', (e) => { if (e.target === backdrop) close(); });

  const body = h('div', {});
  function rebuild() {
    body.innerHTML = '';
    body.append(h('h3', {}, 'Save to'));
    // favourite quick toggle
    body.append(collRow('⭐', 'Favourites', store.favorites.includes(itemId),
      () => { toggleFavorite(itemId); rebuild(); }));
    // existing collections
    for (const c of store.collections) {
      body.append(collRow(c.emoji, `${c.name} (${c.itemIds.length})`, c.itemIds.includes(itemId),
        () => { togglePlaceInCollection(c.id, itemId); rebuild(); }));
    }
    // create new
    const input = h('input', { class: 'search', type: 'text', 'aria-label': 'Search', placeholder: 'New collection name…', style: 'margin-top:8px' });
    const add = h('button', { class: 'btn', onclick: () => {
      if (!input.value.trim()) return;
      const c = createCollection(input.value.trim(), '⭐');
      togglePlaceInCollection(c.id, itemId);
      rebuild();
    } }, 'Create & add');
    body.append(input, add);
    // preset quick-create
    body.append(h('p', { class: 'muted', style: 'margin:12px 0 4px' }, 'Quick themes'));
    body.append(h('div', { class: 'chips presets' }, COLLECTION_PRESETS
      .filter((pr) => !store.collections.some((c) => c.name.toLowerCase() === pr.name.toLowerCase()))
      .map((pr) => h('button', { class: 'chip', onclick: () => {
        const c = createCollection(pr.name, pr.emoji);
        togglePlaceInCollection(c.id, itemId);
        rebuild();
      } }, `${pr.emoji} ${pr.name}`))));
    body.append(h('button', { class: 'btn ghost block', style: 'margin-top:12px', onclick: close }, 'Done'));
  }
  rebuild();
  sheet.append(body);
  backdrop.append(sheet);
  close = openModal(backdrop);
}

function collRow(emoji, label, checked, onToggle) {
  return h('label', { class: 'coll-row' }, [
    h('input', { type: 'checkbox', checked: checked ? '' : null, onchange: onToggle }),
    h('span', {}, `${emoji} ${label}`),
  ]);
}

// Self-hosted, openly-licensed identify photo. `item.photo` is a repo-relative
// path (e.g. 'img/nature/king-cobra.jpg') so it works fully offline once bundled;
// `item.photoAttribution` credits the source and licence. Until an image is added
// a placeholder slot makes the gap explicit (photos are filled in a dedicated
// pass). Images lazy-load so slow/offline connections degrade gracefully.
function photoBlock(item, alt) {
  const reg = (item && item.id && PHOTOS[item.id]) || null;
  const src = (item && item.photo) || (reg && reg.src);
  const credit = (item && item.photoAttribution) || (reg && reg.credit);
  if (src) {
    return h('figure', { class: 'id-photo' }, [
      h('img', { src, alt: alt || '', loading: 'lazy', decoding: 'async' }),
      credit ? h('figcaption', { class: 'muted' }, credit) : null,
    ]);
  }
  return h('div', { class: 'id-photo placeholder' }, [
    h('span', { class: 'id-photo-emoji' }, (item && item.emoji) || '📷'),
    h('span', { class: 'muted' }, 'Photo coming soon'),
  ]);
}

// Ratings + prices from across the web. Snapshots are curated (each stamped with the
// month it was checked) so they work offline; every row and the compare buttons
// deep-link out to the live site. No reviews are scraped.
function extUrl(ext, p) {
  if (ext && ext.url) return ext.url;
  const q = encodeURIComponent(`${p.name} ${p.city || ''}`.trim());
  const site = ((ext && ext.site) || '').toLowerCase();
  if (site.includes('booking')) return `https://www.booking.com/searchresults.html?ss=${q}`;
  if (site.includes('agoda')) return `https://www.agoda.com/search?q=${q}`;
  if (site.includes('tripadvisor')) return `https://www.tripadvisor.com/Search?q=${q}`;
  if (site.includes('trip.com') || site === 'trip') return `https://www.trip.com/hotels/list?searchword=${q}`;
  if (site.includes('google')) return mapsUrl(p);
  return `https://www.google.com/search?q=${q}%20${encodeURIComponent((ext && ext.site) || '')}`;
}
function extStars(score, scale) { const s = (Number(score) / (Number(scale) || 5)) * 5; return isNaN(s) ? NaN : Math.round(s * 10) / 10; }
function extRow(label, right, href) {
  return h('div', { class: 'row-between', style: 'padding:5px 0;border-top:1px solid rgba(0,0,0,0.06)' }, [
    h('span', { style: 'font-weight:600' }, label),
    href ? h('a', { class: 'rev-link', href, target: '_blank', rel: 'noopener' }, right) : h('span', { class: 'muted' }, right),
  ]);
}
function externalRatingsCard(p) {
  const ext = Array.isArray(p.externalRatings) ? p.externalRatings : [];
  const prices = Array.isArray(p.externalPrices) ? p.externalPrices : [];
  const own = (getPlaceData(p.id).rating) || 0;
  const isStay = !!p.stayType;
  if (!ext.length && !prices.length && !isStay) return null;

  const card = h('div', { class: 'card' }, [h('h2', {}, 'Across the web')]);

  if (ext.length || own > 0) {
    const stars = ext.map((e) => extStars(e.score, e.scale)).filter((n) => !isNaN(n));
    const blended = stars.length ? stars.reduce((a, b) => a + b, 0) / stars.length : 0;
    const overall = own > 0 ? own : blended;
    if (overall > 0) {
      card.append(h('div', { class: 'rating-block' }, [
        h('span', { class: 'stars-static' }, starsStr(overall)),
        h('span', { class: 'muted' }, ` ${overall.toFixed(1)} overall${own > 0 ? ' · your rating counts first' : (stars.length > 1 ? ' · averaged across sites' : '')}`),
      ]));
    }
    if (own > 0) card.append(extRow('You', `${starsStr(own)} ${own.toFixed(1)}`));
    ext.forEach((e) => {
      const st = extStars(e.score, e.scale);
      const cnt = e.count ? ` · ${Number(e.count).toLocaleString()} reviews` : '';
      const as = e.asOf ? ` · ${e.asOf}` : '';
      card.append(extRow(e.site, `${e.score}/${e.scale || 5}${isNaN(st) ? '' : ` (${st.toFixed(1)}★)`}${cnt}${as} ›`, extUrl(e, p)));
    });
  }

  if (prices.length) {
    card.append(h('h3', {}, 'Prices'));
    prices.forEach((pr) => {
      const from = pr.from != null ? `from ${money(pr.from, pr.currency) || (pr.from + ' ' + (pr.currency || ''))}` : 'Check price';
      card.append(extRow(pr.site, `${from}${pr.asOf ? ` · ${pr.asOf}` : ''} ›`, extUrl(pr, p)));
    });
  }

  const sites = isStay ? ['Booking', 'Agoda', 'Trip.com', 'Google'] : ['TripAdvisor', 'Google'];
  card.append(h('h3', {}, isStay ? 'Compare & book' : 'Compare live'));
  card.append(h('div', { class: 'chips' }, sites.map((site) =>
    h('a', { class: 'chip', href: extUrl({ site }, p), target: '_blank', rel: 'noopener' }, site))));
  card.append(h('p', { class: 'disclaimer' }, 'Scores and prices are snapshots from the dates shown — tap a site for live numbers and to book. Aggregated from public sources; no reviews are scraped.'));
  return card;
}

// Compact current-conditions card for a place, read from the NEAREST listed weather
// city (weather here is regional, not pinpoint — the distance is shown). Cached-first
// so it works offline; refreshes once in the background when online.
function weatherNearbyCard(p) {
  if (!p.coords || p.coords.lat == null || p.coords.lng == null) return null;
  const spot = nearestSpot(p.coords, p.country);
  if (!spot) return null;
  const km = haversineKm(p.coords, { lat: spot.lat, lng: spot.lng });
  const key = spotKey(spot);

  const card = h('div', { class: 'card' }, [h('h3', { style: 'margin-top:0' }, 'Weather nearby')]);
  const body = h('div', {});
  card.append(body);

  function paintWx(rec, loading) {
    body.innerHTML = '';
    if (rec && rec.current) {
      const [clabel, cemoji] = wmo(rec.current.code);
      body.append(h('div', { class: 'row-between' }, [
        h('span', { style: 'font-size:34px;line-height:1' }, cemoji),
        h('div', { style: 'text-align:right' }, [
          h('div', { style: 'font-size:26px;font-weight:800' }, fmtTemp(rec.current.temp)),
          h('div', { class: 'muted' }, clabel),
        ]),
      ]));
      body.append(h('div', { class: 'muted', style: 'margin-top:6px' },
        `Feels ${fmtTemp(rec.current.apparent)} · Humidity ${rec.current.humidity}% · Wind ${fmtWind(rec.current.wind)}`));
    } else {
      body.append(h('p', { class: 'muted', style: 'margin:0' },
        loading ? 'Fetching the latest forecast…' : 'No saved forecast yet — tap below, then Refresh while online.'));
    }
  }

  const cached = getCachedWeather(key);
  paintWx(cached, !cached && online());
  if (!cached && online()) {
    refreshWeather(spot).then((r) => { if ((location.hash || '').startsWith('#place') && r) paintWx(r, false); });
  }

  card.append(
    h('p', { class: 'muted', style: 'margin:6px 0 0' },
      `Nearest listed city: ${spot.city}${km != null ? ` · ${fmtDistance(km)} away` : ''} · regional guide, not pinpoint.`),
    h('button', { class: 'btn ghost block', style: 'margin-top:8px', onclick: () => { weatherKey = key; go('#weather'); } }, 'See full forecast'),
  );
  return card;
}

// "Find it" orientation block for place detail — the fix for "a name alone does not tell
// me I am in the right place." Shows the local name/script, a one-line "how you will know
// you are there" recognition cue, distance + direction from the traveller, and an inline
// offline mini-map with the pin (tap the ⊕ to see yourself relative to it), plus a direct
// "directions" hand-off. Every part is optional and appears only when data exists.
function orientationCard(p) {
  if (!p || (!p.coords && !p.recognition && !p.localName)) return null;
  const card = h('div', { class: 'card' }, [h('h2', {}, '📍 Find it')]);
  if (p.localName) card.append(h('p', { class: 'local-name', lang: scriptLang(p.country) }, p.localName));
  if (p.recognition) card.append(h('div', { class: 'recognition' }, [
    h('strong', {}, 'How you will know you are there — '), h('span', {}, p.recognition),
  ]));
  const areaBits = [p.city ? `In ${p.city}` : null].filter(Boolean);
  if (areaBits.length) card.append(h('p', { class: 'muted', style: 'margin:6px 0 2px' }, areaBits.join(' · ')));
  const dchip = distanceChip(p);
  if (dchip) card.append(h('div', { style: 'margin:2px 0 8px' }, dchip));
  if (p.coords) {
    const mini = h('div', { class: 'mini-map', style: 'height:210px;border-radius:14px;overflow:hidden;position:relative' });
    card.append(mini);
    import('./map.js').then((m) => m.initPlacesMap(mini, [p], {
      onOpen: () => { /* already on this place */ },
      onLocate: (f) => setLastFix(f),
    })).then((c) => {
      // dispose the mini-map when leaving the screen (chain with any existing cleanup).
      const prev = liveCleanup;
      liveCleanup = () => { try { if (prev) prev(); } catch { /* noop */ } try { c.dispose(); } catch { /* noop */ } };
    }).catch(() => { mini.remove(); });
    card.append(h('a', { class: 'btn ghost block', style: 'margin-top:8px', href: mapsUrl(p), target: '_blank', rel: 'noopener' }, 'Get directions in Maps ↗'));
  }
  return card;
}

// Per-place accessibility: shows the recorded step-free/toilet tag if present; otherwise,
// for a traveller with a mobility need, points honestly to the country guide.
function placeAccessBlock(p) {
  const a = p.access;
  if (a && (a.stepFree || a.note)) {
    const LBL = { yes: '♿ Step-free access', partial: '♿ Partly step-free', no: '⚠️ Not step-free' };
    const box = h('div', { class: 'card access-focus' });
    box.append(h('h3', { style: 'margin-top:0' }, LBL[a.stepFree] || '♿ Accessibility'));
    if (a.note) box.append(h('p', { class: 'muted', style: 'margin:4px 0' }, a.note));
    if (a.toilet) box.append(h('div', { class: 'list-note' }, 'Accessible toilet reported on site.'));
    box.append(h('p', { class: 'tiny muted', style: 'margin-bottom:0' }, 'Reported accessibility — always verify on the day.'));
    return box;
  }
  const needMobility = (store.profile.prefs.access || []).includes('mobility');
  if (needMobility && !p.isPin) {
    const cc = p.country || (p.id || '').split('-')[0];
    if (getAccessibility(cc)) {
      const box = h('div', { class: 'card' });
      box.append(h('p', { class: 'tiny muted', style: 'margin:0 0 6px' }, 'Step-free access here is not recorded yet.'));
      box.append(h('button', { class: 'btn ghost block', onclick: () => go(`#access-${cc}`) }, '♿ See the country accessibility guide'));
      return box;
    }
  }
  return null;
}

function placeScreen(id) {
  const p = resolveItem(id);
  const backHash = p && p.isPin ? '#saved' : '#places';
  const wrap = h('div', { class: 'screen' });
  wrap.append(topbar(p ? p.name : 'Place', backHash));
  if (!p) { wrap.append(h('p', { class: 'empty' }, 'Place not found.')); mount(wrap, backHash); return; }

  const cats = Array.isArray(p.categories) ? p.categories : [];
  const hasPrice = p.priceRange && p.priceRange.currency;
  const card = h('div', { class: 'card' }, [
    (cats.length || (p.budgetTier && !p.isPin)) ? h('div', { class: 'row-between' }, [
      h('div', { class: 'cats' }, cats.map((c) => h('span', { class: 'cat-tag' }, c))),
      (p.budgetTier && !p.isPin) ? tierBadge(p.budgetTier) : null,
    ]) : null,
    travelerChips(p),
    photoBlock(p, p.name),
    p.blurb ? h('p', {}, p.blurb) : null,
  ]);
  if (p.rating) card.append(ratingBlock(p));
  if (p.history) { card.append(h('h3', {}, 'A little history'), h('p', {}, p.history)); }
  if (p.whyItFits) { card.append(h('h3', {}, 'Why it fits you'), h('p', {}, p.whyItFits)); }
  if (hasPrice) {
    card.append(h('h3', {}, 'Price'));
    card.append(h('p', {}, `${priceLine(p.priceRange.low, p.priceRange.high, p.priceRange.currency) || 'Free'}${p.priceRange.note ? ' · ' + p.priceRange.note : ''}`));
  }
  if (p.hours) card.append(h('p', { class: 'muted' }, `Hours: ${p.hours}`));
  if (p.bookHint) card.append(h('p', { class: 'muted' }, `Booking: ${p.bookHint}`));
  if (p.tips && p.tips.length) { card.append(h('h3', {}, 'Tips')); p.tips.forEach((t) => card.append(h('div', { class: 'list-note' }, t))); }
  if (p.scamWarnings && p.scamWarnings.length) { card.append(h('h3', {}, 'Watch out')); p.scamWarnings.forEach((t) => card.append(h('div', { class: 'warn-note' }, t))); }
  if (p.activities && p.activities.length) { card.append(h('h3', {}, 'Things to do here')); card.append(h('div', { class: 'cats' }, p.activities.map((a) => h('span', { class: 'cat-tag' }, titleCase(a))))); }
  if (p.amenities && p.amenities.length) { card.append(h('h3', {}, 'Amenities')); card.append(h('div', { class: 'cats' }, p.amenities.map((a) => h('span', { class: 'cat-tag' }, titleCase(a))))); }

  const colls = collectionsForItem(p.id);
  const collStrip = colls.length
    ? h('div', { class: 'cats', style: 'margin-top:8px' }, colls.map((c) => h('span', { class: 'cat-tag', style: 'background:var(--grape)' }, `${c.emoji} ${c.name}`)))
    : null;

  const actions = h('div', { class: 'card' }, [
    (p.coords || p.mapQuery) ? h('a', { class: 'btn block', href: mapsUrl(p), target: '_blank', rel: 'noopener' }, 'Open in Maps') : null,
    h('button', { class: 'btn ghost block', style: 'margin-top:8px', onclick: () => saveSheet(p.id) }, '＋ Save to collections'),
    !p.isPin ? shareButton('📤 Recommend to a friend', `Check out ${p.name}`, () => shareUrl('in', encodeShare('place', { id: p.id, n: p.name }, ensureMe()))) : null,
    !p.isPin ? h('button', { class: 'btn ghost block', style: 'margin-top:8px', onclick: () => go(`#feedback-${p.id}`) }, '✍️ Suggest an edit') : null,
    collStrip,
    p.isPin ? h('button', {
      class: 'btn ghost block', style: 'margin-top:8px; color:var(--warn); border-color:var(--warn)',
      onclick: () => { if (confirm('Delete this pin?')) { deletePin(p.id); go('#saved'); } },
    }, 'Delete pin') : null,
  ]);

  wrap.append(card);
  const accBlock = placeAccessBlock(p);
  if (accBlock) wrap.append(accBlock);
  const orient = orientationCard(p);
  if (orient) wrap.append(orient);
  const extCard = externalRatingsCard(p);
  if (extCard) wrap.append(extCard);
  const wxCard = weatherNearbyCard(p);
  if (wxCard) wrap.append(wxCard);
  wrap.append(actions, yourLayer(p));
  if (p.sources && p.sources.length) wrap.append(sourcesNote(p.sources, p.verified, p));
  mount(wrap, backHash);
}

// The user's own layer on a place: rating, private note, and their own review kept
// alongside the guidebook original (colour-coded). All on-device.
function yourLayer(p) {
  const d = getPlaceData(p.id);
  const card = h('div', { class: 'card' }, [h('h2', {}, 'Your notes & review')]);

  const stars = h('div', { class: 'stars' });
  const paint = (n) => [...stars.children].forEach((s, i) => { s.textContent = i < n ? '★' : '☆'; });
  for (let i = 1; i <= 5; i++) {
    stars.append(h('button', { class: 'star', 'aria-label': `${i} star${i > 1 ? 's' : ''}`, onclick: () => {
      const nv = getPlaceData(p.id).rating === i ? 0 : i; setPlaceField(p.id, 'rating', nv); paint(nv);
    } }, '☆'));
  }
  paint(d.rating || 0);
  card.append(h('div', { class: 'field' }, [h('label', {}, 'Your rating'), stars]));

  const note = h('textarea', { class: 'ta', placeholder: 'Private notes — directions, what to order, who you met…' });
  note.value = d.note || '';
  note.addEventListener('change', () => setPlaceField(p.id, 'note', note.value));
  card.append(h('div', { class: 'field' }, [h('label', {}, 'Private note'), note]));

  if (!p.isPin && (p.blurb || p.whyItFits)) {
    card.append(h('div', { class: 'review-orig' }, [
      h('span', { class: 'rlabel' }, 'Guidebook'),
      h('p', {}, [p.blurb, p.whyItFits].filter(Boolean).join(' ')),
    ]));
  }
  const yourRev = h('textarea', { class: 'ta', placeholder: 'Your own take — kept separately from the guidebook…' });
  yourRev.value = d.review || '';
  yourRev.addEventListener('change', () => setPlaceField(p.id, 'review', yourRev.value));
  card.append(h('div', { class: 'review-yours' }, [h('span', { class: 'rlabel' }, 'Your take'), yourRev]));

  return card;
}

// A citation is only worth linking when it points somewhere specific. A bare review-site
// homepage (tripadvisor.com with no path) dumps the traveller on the front page, so when we
// know the place we turn it into a search for that place; otherwise we show the name as plain
// text rather than a useless link. Deep links (UNESCO listings, official sites) stay clickable.
function sourceHref(s, place) {
  const url = s && s.url;
  if (!url) return null;
  const m = /^https?:\/\/[^/]+(\/[^?#]*)?/i.exec(url);
  const path = (m && m[1] ? m[1] : '').replace(/\/+$/, '');
  const isReviewSite = /tripadvisor|booking|agoda|trip\.com|google/i.test(url);
  if (isReviewSite && !path) return place ? extUrl({ site: s.org }, place) : null;
  return url;
}
function sourcesNote(sources, verified, place) {
  const kids = ['Sources: '];
  sources.forEach((s, i) => {
    if (i) kids.push(', ');
    const href = sourceHref(s, place);
    kids.push(href
      ? h('a', { class: 'src-link', href, target: '_blank', rel: 'noopener' }, s.org)
      : s.org);
  });
  kids.push(`${verified ? ` · verified ${verified}` : ''}. Guidance only — verify locally.`);
  return h('p', { class: 'disclaimer' }, kids);
}

// ---- PRICES -----------------------------------------------------------------
function pricesScreen(countryId) {
  if (countryId) activeCountry = countryId;
  const wrap = h('div', { class: 'screen' });
  wrap.append(topbar('Fair prices'));
  wrap.append(countryChips((id) => go(`#prices-${id}`)));

  const country = getCountry(activeCountry);
  const data = country && country.prices;
  if (!data) {
    wrap.append(h('p', { class: 'empty' }, `${country ? country.name : 'This country'} prices are coming soon. Thailand is fully covered in this build.`));
    mount(wrap, '#prices'); return;
  }
  wrap.append(h('div', { class: 'banner' }, data.disclaimer));
  const priceRow = (it) => h('div', { class: 'price-item' }, [
    h('div', { class: 'row-between' }, [
      h('strong', {}, it.label),
      h('span', { class: 'fair' }, `${priceLine(it.fair.low, it.fair.high, data.currency)}`),
    ]),
    h('div', { class: 'muted' }, `${it.unit}${it.notes ? ' · ' + it.notes : ''}`),
    it.scamNote ? h('div', { class: 'scam' }, `⚠ ${it.scamNote}`) : null,
    it.betterOption ? h('div', { class: 'better' }, `✓ Better: ${it.betterOption}`) : null,
  ]);
  // Everyday costs first; the full price sheet is one tap away rather than a long scroll.
  const ESSENTIALS = 8;
  const lead = data.items.slice(0, ESSENTIALS), extra = data.items.slice(ESSENTIALS);
  const card = h('div', { class: 'card' });
  lead.forEach((it) => card.append(priceRow(it)));
  wrap.append(card);
  if (extra.length) {
    const moreCard = h('div', { class: 'card' });
    extra.forEach((it) => moreCard.append(priceRow(it)));
    wrap.append(h('details', { class: 'filters-collapse' }, [
      h('summary', {}, `All ${data.items.length} everyday prices · ${extra.length} more`),
      moreCard,
    ]));
  }
  wrap.append(sourcesNote(data.sources, data.verified));
  mount(wrap, '#prices');
}

// ---- TRANSPORT --------------------------------------------------------------
function transportScreen(countryId) {
  if (countryId) activeCountry = countryId;
  const wrap = h('div', { class: 'screen' });
  wrap.append(topbar('Getting around', '#home'));
  wrap.append(countryChips((id) => go(`#transport-${id}`)));
  wrap.append(h('button', { class: 'btn block', style: 'margin-bottom:12px', onclick: () => go('#route') }, '🧭 Plan a whole journey A → B (incl. borders)'));

  const country = getCountry(activeCountry);
  const routes = country && country.routes;
  if (!routes) {
    wrap.append(h('p', { class: 'empty' }, `${country ? country.name : 'This country'} routes are coming soon. Thailand is fully covered in this build.`));
    mount(wrap, '#home'); return;
  }
  const routeCard = (r) => {
    const card = h('div', { class: 'card' }, [
      h('h2', {}, `${r.from} → ${r.to}`),
      r.crossBorder ? h('p', { class: 'border-flag' }, `Border crossing: ${r.border}`) : null,
      r.visa ? h('p', { class: 'muted' }, `Visa: ${r.visa.note}`) : null,
    ]);
    if (r.scamWarnings && r.scamWarnings.length) r.scamWarnings.forEach((w) => card.append(h('div', { class: 'warn-note' }, w)));
    for (const o of r.options) {
      const dur = o.durationHrs ? `${o.durationHrs[0]}–${o.durationHrs[1]} h` : '';
      card.append(h('div', { class: `route-opt ${o.recommended ? 'best' : ''}` }, [
        h('div', { class: 'row-between' }, [
          h('span', { class: 'mode' }, o.mode),
          o.recommended ? h('span', { class: 'pill-best' }, 'Best') : null,
        ]),
        h('div', { class: 'muted' }, `${dur} · ${priceLine(o.price.low, o.price.high, o.price.currency)} · ${o.freq}`),
        o.comfort ? h('div', {}, o.comfort) : null,
        o.notes ? h('div', { class: 'muted' }, o.notes) : null,
        o.bookVia ? h('div', { class: 'muted' }, `Book via: ${o.bookVia}`) : null,
      ]));
    }
    card.append(h('a', { class: 'btn ghost block', style: 'margin-top:10px', href: 'https://12go.asia', target: '_blank', rel: 'noopener' }, 'Check live times & book (12Go) ↗'));
    return card;
  };

  // Context-first: lead with journeys leaving the city you are in (or focused on); the
  // rest of the country network collapses behind one tap instead of a long scroll.
  const fs = focusSpot(activeCountry);
  const focusCity = (fs.source === 'gps' || fs.source === 'focus') ? fs.spot.city : '';
  const here = focusCity ? routes.filter((r) => citySlug(r.from) === citySlug(focusCity)) : [];
  const rest = routes.filter((r) => !here.includes(r));
  const collapse = (list, label) => {
    const det = h('details', { class: 'filters-collapse' }, [h('summary', {}, label)]);
    list.forEach((r) => det.append(routeCard(r)));
    wrap.append(det);
  };

  if (here.length) {
    wrap.append(h('h3', { class: 'cat-title' }, `Leaving ${focusCity} · ${here.length}`));
    here.forEach((r) => wrap.append(routeCard(r)));
    if (rest.length) collapse(rest, `More routes across ${country.name} · ${rest.length}`);
  } else {
    // No known city context: show the first few (hub routes lead the data), collapse the tail.
    const lead = rest.slice(0, 5), tail = rest.slice(5);
    lead.forEach((r) => wrap.append(routeCard(r)));
    if (tail.length) collapse(tail, `More routes across ${country.name} · ${tail.length}`);
  }
  wrap.append(h('p', { class: 'disclaimer' }, 'Times and prices are guidance and change with season and operator. Confirm before travel.'));
  mount(wrap, '#home');
}

// ---- JOURNEY PLANNER --------------------------------------------------------
// Point-to-point trip planning that chains the bundled route legs across towns and
// borders (see js/journey.js). Fully offline; the only online part is the optional
// "book on 12Go" deep link.
const CAPITAL = { th: 'Bangkok', vi: 'Hanoi', kh: 'Phnom Penh', la: 'Vientiane' };
let planFrom = '', planTo = '';

function twelveGoUrl(from, to) {
  const slug = (s) => encodeURIComponent(String(s).toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''));
  return `https://12go.asia/en/travel/${slug(from)}/${slug(to)}`;
}

function planLegRow(l, i) {
  const o = l.option || {};
  const dur = Array.isArray(o.durationHrs) ? `${o.durationHrs[0]}–${o.durationHrs[1]} h` : '';
  const box = h('div', { class: 'plan-leg' }, [
    h('div', { class: 'plan-leg-head' }, `${i + 1}. ${l.from} → ${l.to}`),
    l.edge.crossBorder ? h('div', { class: 'border-flag' }, `🛂 Border crossing: ${l.edge.border || ''}`) : null,
    (l.edge.crossBorder && l.edge.visa) ? h('div', { class: 'muted' }, `Visa: ${l.edge.visa.note}`) : null,
    h('div', { class: `route-opt ${o.recommended ? 'best' : ''}` }, [
      h('div', { class: 'row-between' }, [
        h('span', { class: 'mode' }, o.mode || 'Transport'),
        o.recommended ? h('span', { class: 'pill-best' }, 'Best') : null,
      ]),
      h('div', { class: 'muted' }, [dur, o.price ? priceLine(o.price.low, o.price.high, o.price.currency) : '', o.freq].filter(Boolean).join(' · ')),
      o.bookVia ? h('div', { class: 'muted' }, `Book via: ${o.bookVia}`) : null,
    ]),
  ]);
  if (l.edge.crossBorder && Array.isArray(l.edge.scamWarnings)) l.edge.scamWarnings.forEach((w) => box.append(h('div', { class: 'warn-note' }, w)));
  return box;
}

function planCard(pl, primary) {
  const chain = [pl.legs[0].from, ...pl.legs.map((l) => l.to)];
  const priceStr = Object.entries(pl.priceByCcy).map(([c, v]) => priceLine(v.low, v.high, c)).filter(Boolean).join(' + ');
  const timeStr = pl.totalHrs[1] ? `~${pl.totalHrs[0]}–${pl.totalHrs[1]} h moving` : '';
  const changes = pl.changes === 0 ? 'Direct' : `${pl.changes} change${pl.changes > 1 ? 's' : ''}`;
  const card = h('div', { class: 'card plan-card' }, [
    h('div', { class: 'row-between' }, [
      h('h2', { style: 'margin:0' }, pl.label),
      primary ? h('span', { class: 'pill-best' }, 'Suggested') : null,
    ]),
    h('div', { class: 'plan-chain' }, chain.join('  →  ')),
    h('p', { class: 'muted', style: 'margin:2px 0 10px' }, [changes, timeStr, priceStr].filter(Boolean).join(' · ')),
  ]);
  pl.legs.forEach((l, i) => card.append(planLegRow(l, i)));
  if (pl.borders.length) card.append(h('p', { class: 'muted', style: 'margin-top:8px' }, `Carry your passport — ${pl.borders.length} border crossing${pl.borders.length > 1 ? 's' : ''} on this route.`));
  card.append(h('a', { class: 'btn ghost block', style: 'margin-top:10px', href: twelveGoUrl(chain[0], chain[chain.length - 1]), target: '_blank', rel: 'noopener' }, 'Check live times & book (12Go) ↗'));
  return card;
}

function planRouteScreen() {
  const wrap = h('div', { class: 'screen' });
  wrap.append(topbar('Journey planner', '#home'));
  wrap.append(h('p', { class: 'muted', style: 'margin-top:0' }, 'Chain buses, trains, boats and flights across Thailand, Laos, Cambodia and Vietnam — including overland border crossings. Times and fares are guidance and work offline.'));

  const nodes = routeNodes();
  const opts = [['', 'Choose…'], ...nodes.map((n) => [n, n])];
  if (!planFrom) { const cap = CAPITAL[activeCountry]; if (cap && nodes.includes(cap)) planFrom = cap; }

  const results = h('div', { class: 'plan-results' });
  const fromSel = selectEl(opts, planFrom, (v) => { planFrom = v; renderResults(); });
  const toSel = selectEl(opts, planTo, (v) => { planTo = v; renderResults(); });
  const swap = h('button', { class: 'btn ghost swap-btn', 'aria-label': 'Swap start and destination', title: 'Swap', onclick: () => {
    const t = planFrom; planFrom = planTo; planTo = t;
    fromSel.value = planFrom; toSel.value = planTo; renderResults();
  } }, '⇅ Swap');

  wrap.append(h('div', { class: 'card plan-picker' }, [
    h('label', { class: 'plan-field' }, [h('span', { class: 'lbl' }, 'From'), fromSel]),
    h('div', { style: 'text-align:center' }, swap),
    h('label', { class: 'plan-field' }, [h('span', { class: 'lbl' }, 'To'), toSel]),
  ]));
  wrap.append(results);

  function renderResults() {
    results.innerHTML = '';
    if (!planFrom || !planTo) { results.append(h('p', { class: 'muted' }, 'Choose where you are and where you want to go.')); return; }
    if (planFrom === planTo) { results.append(h('p', { class: 'muted' }, 'Choose two different places.')); return; }
    const plans = planRoutes(planFrom, planTo);
    if (!plans.length) {
      results.append(h('div', { class: 'card' }, [
        h('p', { style: 'margin-top:0' }, `No bundled overland route between ${planFrom} and ${planTo} yet.`),
        h('p', { class: 'muted' }, 'Try planning via a major hub (Bangkok, Vientiane, Phnom Penh or Hanoi), or check live options:'),
        h('a', { class: 'btn ghost block', href: twelveGoUrl(planFrom, planTo), target: '_blank', rel: 'noopener' }, 'Search 12Go for this trip ↗'),
      ]));
      return;
    }
    plans.forEach((pl, i) => results.append(planCard(pl, i === 0)));
    results.append(h('p', { class: 'disclaimer' }, 'Routes are chained from guidance data and change with season and operator. Confirm each leg before travelling.'));
  }
  renderResults();
  mount(wrap, '#home');
}

// ---- COUNTRY INFO -----------------------------------------------------------
function infoScreen(countryId) {
  if (countryId) activeCountry = countryId;
  const wrap = h('div', { class: 'screen' });
  const country = getCountry(activeCountry);
  wrap.append(topbar(country ? `${country.name} guide` : 'Country guide', '#home'));
  wrap.append(countryChips((id) => go(`#info-${id}`)));

  const info = country && country.info;
  if (!info) {
    wrap.append(h('p', { class: 'empty' }, `${country ? country.name : 'This country'} guide is coming soon. Thailand is fully covered in this build.`));
    mount(wrap, '#home'); return;
  }
  // emergency numbers
  const em = h('div', { class: 'card' }, [h('h2', {}, 'Emergency numbers')]);
  info.emergency.forEach((e) => em.append(h('div', { class: 'row-between' }, [h('span', {}, e.label), h('strong', {}, e.number)])));
  wrap.append(em);

  // sections accordion
  const acc = h('div', { class: 'card' });
  info.sections.forEach((s) => {
    const det = h('details', { class: 'acc' }, [h('summary', {}, s.title)]);
    s.body.forEach((para) => det.append(h('p', {}, para)));
    if (s.verifyAt) det.append(h('p', { class: 'muted' }, [
      'Verify at: ', h('a', { href: s.verifyAt.url, target: '_blank', rel: 'noopener' }, s.verifyAt.org),
    ]));
    acc.append(det);
  });
  // deep history (from the side-car guide module, when present)
  const g = country.guide;
  if (g && Array.isArray(g.history) && g.history.length) {
    const hist = h('details', { class: 'acc' }, [h('summary', {}, `History of ${country.name}`)]);
    g.history.forEach((par) => hist.append(h('p', {}, par)));
    acc.append(hist);
  }
  wrap.append(acc);
  // laws & safety the traveller must know (current-year facts)
  if (g && Array.isArray(g.laws) && g.laws.length) {
    const laws = h('div', { class: 'card' }, [h('h2', {}, 'Laws & safety you must know')]);
    g.laws.forEach((l) => laws.append(h('div', { class: 'warn-note' }, typeof l === 'string' ? l : `${l.title}: ${l.body}`)));
    wrap.append(laws);
  }
  const allSources = (g && Array.isArray(g.sources) && g.sources.length) ? g.sources : info.sources;
  wrap.append(sourcesNote(allSources, info.verified));
  mount(wrap, '#home');
}

// ---- SAVED / COLLECTIONS ----------------------------------------------------
function savedScreen() {
  const wrap = h('div', { class: 'screen' });
  wrap.append(topbar('Saved & collections'));

  // favourites + every collection as a tappable row
  const hub = h('div', { class: 'card' });
  hub.append(collectionLinkRow('⭐', 'Favourites', store.favorites.length, () => go('#collection-favorites')));
  for (const c of store.collections) {
    hub.append(collectionLinkRow(c.emoji, c.name, c.itemIds.length, () => go(`#collection-${c.id}`)));
  }
  if (!store.collections.length && !store.favorites.length) {
    hub.append(h('p', { class: 'muted' }, 'No collections yet. Create one below, then tap “＋ Save” on any place.'));
  }
  wrap.append(hub);

  // create new + presets
  const create = h('div', { class: 'card' }, [h('h2', {}, 'New collection')]);
  const input = h('input', { class: 'search', type: 'text', 'aria-label': 'Search', placeholder: 'Name your theme…' });
  create.append(input, h('button', { class: 'btn', onclick: () => {
    if (input.value.trim()) { createCollection(input.value.trim(), '⭐'); render(); }
  } }, 'Create'));
  create.append(h('p', { class: 'muted', style: 'margin:12px 0 4px' }, 'Or pick a quick theme'));
  create.append(h('div', { class: 'chips' }, COLLECTION_PRESETS
    .filter((pr) => !store.collections.some((c) => c.name.toLowerCase() === pr.name.toLowerCase()))
    .map((pr) => h('button', { class: 'chip', onclick: () => { createCollection(pr.name, pr.emoji); render(); } }, `${pr.emoji} ${pr.name}`))));
  wrap.append(create);

  // your pins
  const pinsCard = h('div', { class: 'card' }, [
    h('div', { class: 'row-between' }, [h('h2', {}, 'Your pins'), h('button', { class: 'btn ghost', onclick: () => go('#addpin') }, '＋ Add a place')]),
  ]);
  if (!store.pins.length) pinsCard.append(h('p', { class: 'muted' }, 'Mark places you find — from the map or by hand — and organise them into collections.'));
  else store.pins.forEach((pin) => pinsCard.append(
    h('button', { class: 'btn ghost block', style: 'margin-top:8px; justify-content:flex-start', onclick: () => go(`#place-${pin.id}`) }, `📌 ${pin.name}`)));
  wrap.append(pinsCard);

  mount(wrap, '#saved');
}

function collectionLinkRow(emoji, name, count, onClick) {
  return h('button', { class: 'btn ghost block', style: 'margin-bottom:8px; justify-content:space-between', onclick: onClick }, [
    h('span', {}, `${emoji} ${name}`), h('span', { class: 'muted' }, `${count}`),
  ]);
}

function collectionScreen(id) {
  const wrap = h('div', { class: 'screen' });
  let title, emoji, itemIds, coll = null;
  if (id === 'favorites') { title = 'Favourites'; emoji = '⭐'; itemIds = store.favorites; }
  else {
    coll = store.collections.find((c) => c.id === id);
    if (!coll) { wrap.append(topbar('Collection', '#saved')); wrap.append(h('p', { class: 'empty' }, 'Collection not found.')); mount(wrap, '#saved'); return; }
    title = coll.name; emoji = coll.emoji; itemIds = coll.itemIds;
  }
  wrap.append(topbar(`${emoji} ${title}`, '#saved'));
  const items = itemIds.map(resolveItem).filter(Boolean);
  if (!items.length) wrap.append(h('p', { class: 'empty' }, 'Nothing here yet. Tap “＋ Save” on a place to add it.'));
  else items.forEach((p) => wrap.append(placeCard(p)));
  if (items.length) {
    wrap.append(h('div', { class: 'card' }, [
      h('h3', {}, 'Share this list'),
      h('p', { class: 'muted' }, 'Send this list of places to a friend — they can save it as a collection in their own app.'),
      shareButton('📤 Share this list', `${title} — places to check out`, () => shareUrl('in', encodeShare('collection', { name: title, items: items.map((p) => ({ id: p.id, n: p.name })) }, ensureMe()))),
    ]));
  }
  if (coll) {
    wrap.append(h('div', { class: 'card' }, [
      h('button', { class: 'btn ghost block', style: 'color:var(--warn); border-color:var(--warn)',
        onclick: () => { if (confirm(`Delete the “${coll.name}” collection? Your places stay; only the grouping is removed.`)) { deleteCollection(coll.id); go('#saved'); } } }, 'Delete collection'),
    ]));
  }
  mount(wrap, '#saved');
}

// ---- MAP (offline vector map + GPS + drop-a-pin) ----------------------------
// Border crossings: open land/bridge/river crossings, grouped by country pair,
// with guidance hours and visa notes. Reached from the Map screen and its markers.
const POOL_TYPE_LABEL = { 'public': 'Public', 'hotel-daypass': 'Day pass', 'waterpark': 'Water park', 'natural': 'Natural' };
function poolsScreen(arg) {
  const cc = arg || '';
  const country = cc ? getCountry(cc) : null;
  const list = cc ? poolsForCountry(cc) : POOLS.slice();
  const wrap = h('div', { class: 'screen' });
  wrap.append(topbar(country ? `${country.name} pools` : 'Public pools', cc ? `#country-${cc}` : '#home'));
  wrap.append(h('p', { class: 'map-hint' }, 'Public swimming pools, hotel & resort day passes, water parks and managed natural swimming spots. Prices are ranges in local currency and change often — guidance only, confirm locally.'));
  if (!list.length) { wrap.append(h('p', { class: 'muted' }, 'No pools listed for this area yet.')); mount(wrap, '#home'); return; }
  const groups = {};
  list.forEach((p) => { (groups[p.city] = groups[p.city] || []).push(p); });
  Object.keys(groups).forEach((city) => {
    wrap.append(h('h2', { style: 'margin:16px 0 6px' }, city));
    groups[city].forEach((p) => {
      const card = h('div', { class: 'card' }, [
        h('div', { class: 'row-between' }, [h('strong', {}, p.name), h('span', { class: 'cat-tag' }, POOL_TYPE_LABEL[p.type] || p.type)]),
        h('p', { class: 'price-line' }, [
          h('strong', {}, priceLine(p.price.low, p.price.high, p.price.currency)),
          p.confidence === 'low' ? h('span', { class: 'muted' }, ' · approx.') : null,
        ]),
        p.price.note ? h('p', { class: 'muted', style: 'font-size:13px' }, p.price.note) : null,
        h('p', {}, [h('strong', {}, 'Cleanliness: '), p.cleanliness]),
        p.hours ? h('p', {}, [h('strong', {}, 'Hours: '), p.hours]) : null,
        p.facilities && p.facilities.length ? h('p', { class: 'muted' }, p.facilities.join(' · ')) : null,
        ...((p.tips || []).map((t) => h('div', { class: 'list-note' }, t))),
        (p.coords || p.mapQuery) ? h('a', { class: 'btn ghost block', style: 'margin-top:6px',
          href: p.coords ? `https://www.google.com/maps/search/?api=1&query=${p.coords.lat},${p.coords.lng}`
                          : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(p.mapQuery)}`,
          target: '_blank', rel: 'noopener' }, 'Open in Maps') : null,
      ]);
      if (p.sources && p.sources.length) card.append(h('p', { class: 'muted', style: 'font-size:12px;margin-top:6px' }, `Source: ${p.sources.map((s) => s.org).join(', ')} · verified ${p.verified}`));
      wrap.append(card);
    });
  });
  mount(wrap, '#home');
}

function crossingsScreen() {
  const wrap = h('div', { class: 'screen' });
  wrap.append(topbar('Border crossings', '#map'));
  wrap.append(h('p', { class: 'map-hint' }, 'Open land, bridge and river crossings used by foreign travellers. Hours and visa rules change often and vary by nationality — treat these as guidance and confirm with official sources before you travel.'));
  // Per-country entry/visa guides (visa type, official portal, land-border tips, overstay).
  wrap.append(h('div', { class: 'chips', style: 'margin:2px 0 4px' }, COUNTRIES.filter((c) => getVisa(c.id)).map((c) =>
    h('button', { class: 'chip', onclick: () => go(`#visa-${c.id}`) }, `🛂 ${c.flag} ${c.name} entry`))));
  const groups = {};
  CROSSINGS.forEach((x) => { (groups[x.pair] = groups[x.pair] || []).push(x); });
  Object.keys(groups).forEach((pair) => {
    wrap.append(h('h2', { style: 'margin:16px 0 6px' }, pair));
    groups[pair].forEach((x) => {
      const card = h('div', { class: 'card' }, [
        h('div', { class: 'row-between' }, [h('strong', {}, x.name), h('span', { class: 'cat-tag' }, x.type)]),
        h('p', { class: 'muted', style: 'margin:4px 0' }, `${x.a.town} ↔ ${x.b.town}`),
        h('p', {}, [h('strong', {}, 'Hours: '), x.hours]),
        x.visa ? h('p', {}, [h('strong', {}, 'Visa: '), x.visa]) : null,
        x.notes ? h('p', { class: 'muted' }, x.notes) : null,
        x.scam ? h('div', { class: 'warn-note' }, `⚠ ${x.scam}`) : null,
        x.coords ? h('a', { class: 'btn ghost block', style: 'margin-top:6px', href: `https://www.google.com/maps/search/?api=1&query=${x.coords.lat},${x.coords.lng}`, target: '_blank', rel: 'noopener' }, 'Open in Maps') : null,
      ]);
      if (x.sources && x.sources.length) card.append(h('p', { class: 'muted', style: 'font-size:12px;margin-top:6px' }, `Source: ${x.sources.map((s) => s.org).join(', ')} · verified ${x.verified}`));
      wrap.append(card);
    });
  });
  mount(wrap, '#map');
}

function mapScreen() {
  const wrap = h('div', { class: 'screen' });
  wrap.append(topbar('Map'));
  wrap.append(h('p', { class: 'map-hint' }, 'Offline-first — the region map, your GPS location, search, places, pools, pins and your saved accommodation all work with no connection. Tap ⊕ to find yourself, search to jump to any place, tap the map to drop a pin, and set your accommodation to see a guide line and the distance and direction back. Use “Save this area” to keep the satellite imagery offline.'));

  const storeBtn = h('button', { class: 'btn ghost', onclick: showStorage }, 'Storage');
  const addBtn = h('button', { class: 'btn ghost', onclick: () => go('#addpin') }, '＋ Add a place');
  const crossBtn = h('button', { class: 'btn ghost', onclick: () => go('#crossings') }, '🛂 Crossings');
  const toolbar = h('div', { class: 'map-toolbar' }, [addBtn, crossBtn, storeBtn]);

  // Keep-screen-awake while navigating on foot (Screen Wake Lock API). The OS releases
  // the lock when the app is backgrounded, so re-acquire it when we return to foreground.
  let wakeLock = null, wantWake = false;
  const wakeBtn = h('button', { class: 'btn ghost', onclick: toggleWake }, '🔆 Keep screen on');
  if (!('wakeLock' in navigator)) wakeBtn.style.display = 'none';
  async function acquireWake() {
    wakeLock = await navigator.wakeLock.request('screen');
    wakeLock.addEventListener('release', () => { wakeLock = null; });
  }
  async function toggleWake() {
    if (wantWake) {
      wantWake = false;
      try { if (wakeLock) await wakeLock.release(); } catch { /* already gone */ }
      wakeLock = null; wakeBtn.textContent = '🔆 Keep screen on'; wakeBtn.classList.remove('toggle-on');
    } else {
      try { await acquireWake(); wantWake = true; wakeBtn.textContent = '🔆 Screen stays on'; wakeBtn.classList.add('toggle-on'); }
      catch (e) { storageOut.textContent = 'Could not keep the screen on: ' + ((e && e.message) || e); }
    }
  }
  const onVis = () => { if (wantWake && wakeLock === null && document.visibilityState === 'visible') acquireWake().catch(() => { /* denied */ }); };
  document.addEventListener('visibilitychange', onVis);
  // release the lock + detach the listener when the user leaves the map screen
  liveCleanup = () => { wantWake = false; document.removeEventListener('visibilitychange', onVis); if (wakeLock) { try { wakeLock.release(); } catch { /* noop */ } wakeLock = null; } };
  const storageOut = h('p', { class: 'map-hint' }, '');
  async function showStorage() {
    const m = await import('./map.js'); const e = await m.storageEstimate();
    storageOut.innerHTML = '';
    storageOut.append(e ? `Stored on device: about ${e.usageMB.toFixed(1)} MB. ` : '');
    const clearBtn = h('button', { class: 'linklike', onclick: async () => {
      storageOut.textContent = 'Clearing all saved areas…';
      try { await m.clearTileCache(); } catch { /* noop */ }
      getSavedAreas().length = 0; save();
      renderAreas();
      showStorage();
    } }, 'Clear all saved areas');
    storageOut.append(clearBtn);
  }

  const canvas = h('div', { id: 'map-canvas' });
  // Layer toggles: show/hide marker groups (all on by default). Wired to the map
  // controller once it initialises (mapCtrl). Markets are their own gold layer.
  let mapCtrl = null;
  // Layer visibility is remembered (store.profile.prefs.mapLayers).
  const ML = store.profile.prefs.mapLayers || (store.profile.prefs.mapLayers = { go: true, eat: true, localeat: true, market: true, stay: true, pools: true, crossing: true, satellite: true, borders: true });
  const TOGGLES = [
    ['satellite', '🛰️ Satellite imagery'], ['borders', '🗺️ Country borders'],
    ['go', '📍 Things to do'], ['eat', '🍜 Places to eat'], ['localeat', '🍲 Local restaurants'], ['market', '🛍️ Markets'],
    ['stay', '🛏️ Places to stay'], ['pools', '🏊 Pools'], ['crossing', '🛂 Border crossings'],
  ];
  function applyLayer(key, on) {
    if (!mapCtrl) return;
    if (key === 'satellite') mapCtrl.setSatellite(on);
    else if (key === 'borders') mapCtrl.setBorders(on);
    else mapCtrl.setLayer(key, on);
  }
  const layerLabel = (key, label) => h('label', { style: 'display:flex;align-items:center;gap:6px;font-size:14px;cursor:pointer' }, [
    h('input', { type: 'checkbox', checked: ML[key] !== false ? '' : null, 'aria-label': label,
      onchange: (e) => { ML[key] = e.target.checked; save(); applyLayer(key, e.target.checked); } }),
    h('span', {}, label),
  ]);
  const layersCard = h('div', { class: 'card', style: 'padding:10px 12px' }, [
    h('div', { class: 'muted', style: 'font-weight:700;margin-bottom:6px' }, 'Map layers (tap to show or hide — remembered)'),
    h('div', { style: 'display:flex;flex-wrap:wrap;gap:8px 16px' }, TOGGLES.map(([k, l]) => layerLabel(k, l))),
    h('p', { class: 'muted', style: 'font-size:12px;margin:8px 0 0' }, 'Place, pool and crossing pins appear as you zoom into an area, so the wide view stays clear. The plain map (coastlines, rivers, borders, your places) is always offline; satellite imagery streams when online — use “Save this area” to keep it offline.'),
  ]);

  // --- My accommodation: save it, then always see the way back -----------------
  const stayBanner = h('p', { class: 'stay-banner', style: 'margin:4px 0;font-weight:700' }, '');
  const stayCard = h('div', { class: 'card' });
  let lastFix = null;
  function updateStayBanner() {
    const stay = getMyStay();
    if (!stay || !stay.coords) return;
    if (!lastFix) { stayBanner.textContent = 'Tap the ⊕ locate button to see distance and direction back.'; return; }
    stayBanner.textContent = `${fmtDistance(haversineKm(lastFix, stay.coords))} · ${compass(bearing(lastFix, stay.coords))} to your stay`;
  }
  async function setStayHere() {
    stayBanner.textContent = 'Getting your location…';
    try {
      const pos = await geolocate();
      const s = setMyStay({ name: (getMyStay() || {}).name || 'My stay', coords: { lat: pos.lat, lng: pos.lng } });
      if (mapCtrl) { mapCtrl.setMyStay(s.coords); if (lastFix) mapCtrl.setWayback(lastFix, s.coords); }
      renderStay();
    } catch (err) { stayBanner.textContent = 'Could not get your location: ' + err.message; }
  }
  function renderStay() {
    stayCard.textContent = '';
    stayCard.append(h('h2', {}, '🏠 My accommodation'));
    const stay = getMyStay();
    if (stay && stay.coords) {
      stayCard.append(
        h('p', {}, [h('strong', {}, stay.name || 'My stay'), h('span', { class: 'muted' }, ` · ${stay.coords.lat.toFixed(4)}, ${stay.coords.lng.toFixed(4)}`)]),
        stayBanner,
        h('div', { style: 'display:flex;flex-wrap:wrap;gap:8px;margin-top:6px' }, [
          h('button', { class: 'btn', onclick: () => {
            if (mapCtrl && lastFix) { mapCtrl.setWayback(lastFix, stay.coords); mapCtrl.frameBoth(lastFix, stay.coords); }
            else if (mapCtrl) { mapCtrl.goToStay(stay.coords); }
          } }, '🧭 Show the way back'),
          h('a', { class: 'btn ghost', href: `https://www.google.com/maps/dir/?api=1&destination=${stay.coords.lat},${stay.coords.lng}`, target: '_blank', rel: 'noopener' }, 'Open in Maps ↗'),
          h('button', { class: 'btn ghost', onclick: () => { if (mapCtrl) mapCtrl.goToStay(stay.coords); } }, 'Show on map'),
          h('button', { class: 'btn ghost', onclick: setStayHere }, 'Move to here'),
          h('button', { class: 'btn ghost', onclick: () => { clearMyStay(); if (mapCtrl) { mapCtrl.setMyStay(null); mapCtrl.setWayback(null, null); } renderStay(); } }, 'Clear'),
        ]),
      );
      updateStayBanner();
    } else {
      stayCard.append(
        h('p', { class: 'muted' }, 'Save where you are staying and the map will always show the distance and direction back to it — even offline.'),
        h('button', { class: 'btn block', onclick: setStayHere }, '📍 Set my stay to my current location'),
        h('p', { class: 'muted', style: 'font-size:12px;margin-top:6px' }, 'Tip: stand at your hotel and tap this, or tap the map and choose “Set as my accommodation”.'),
      );
    }
  }
  renderStay();

  // --- Save this area offline (satellite tiles -> service-worker cache) ---------
  // Two-step so a save can never silently fill the device: first show how many tiles
  // and roughly how much space THIS view needs, then download only on confirm.
  const swAvailable = ('serviceWorker' in navigator) && !!navigator.serviceWorker.controller;
  const dlBtn = h('button', { class: 'btn ghost', onclick: estimateArea }, '⬇ Save this area');
  if (!swAvailable) dlBtn.style.display = 'none';
  function estimateArea() {
    if (!mapCtrl || !swAvailable) { storageOut.textContent = 'Offline area saving runs in the web app.'; return; }
    const urls = mapCtrl.getDownloadTiles(1000);
    if (!urls.length) { storageOut.textContent = 'Nothing to save at this view — zoom in to an area first.'; return; }
    const viewInfo = mapCtrl.getViewInfo();             // recorded with the saved area
    const mbNum = urls.length * 0.018;                  // Esri imagery tiles average ~18 KB
    const mb = mbNum < 10 ? mbNum.toFixed(1) : String(Math.round(mbNum));
    storageOut.textContent = '';
    storageOut.append(
      `This area is about ${urls.length} satellite tiles (~${mb} MB). Zoom in for more street detail, or out to cover more ground. `,
      h('button', { class: 'linklike', onclick: () => downloadArea(urls, viewInfo) }, 'Download now'),
      ' · ',
      h('button', { class: 'linklike', onclick: showStorage }, 'Cancel'),
    );
  }
  async function downloadArea(urls, viewInfo) {
    storageOut.textContent = `Saving ${urls.length} map tiles for offline…`;
    const onMsg = (e) => {
      const d = e.data || {};
      if (d.type === 'PREFETCH_PROGRESS') { storageOut.textContent = `Saving map tiles… ${d.done}/${d.total}`; return; }
      if (d.type !== 'PREFETCH_DONE') return;
      navigator.serviceWorker.removeEventListener('message', onMsg);
      if (d.quotaHit) {
        storageOut.textContent = `Storage is full — saved ${d.ok} tiles before stopping. Remove a saved area below, then try a smaller area.`;
        return;
      }
      if (d.ok > 0 && viewInfo) {
        const def = (mapCtrl && mapCtrl.nearestCityName && mapCtrl.nearestCityName()) || 'Saved area';
        const name = (prompt('Name this offline area:', def) || def).trim() || def;
        // floor (not round): tileUrlsForBounds downloads at Math.floor(zoom), so the
        // recorded z must match or per-area delete would target the wrong zoom level.
        addSavedArea({ name, center: viewInfo.center, bounds: viewInfo.bounds, z: Math.floor(viewInfo.zoom), count: d.ok });
        renderAreas();
      }
      showStorage();
    };
    navigator.serviceWorker.addEventListener('message', onMsg);
    // Protect existing saved packs from FIFO eviction: recompute their exact tile
    // URLs (bounds+z are recorded per area) and pass them so the cap skips them.
    let protect = [];
    try {
      protect = getSavedAreas().flatMap((a) => (mapCtrl && mapCtrl.tileUrlsForArea) ? mapCtrl.tileUrlsForArea(a.bounds, a.z) : []);
    } catch { /* best-effort */ }
    navigator.serviceWorker.controller.postMessage({ type: 'PREFETCH_TILES', urls, protect });
  }

  // --- Saved offline areas: named tile packs, each sized and individually removable -
  const areasCard = h('div', { class: 'card' });
  function renderAreas() {
    areasCard.textContent = '';
    areasCard.append(h('h2', {}, '🗂️ Saved offline areas'));
    const areas = getSavedAreas();
    if (!areas.length) {
      areasCard.append(h('p', { class: 'muted' }, 'Save an area above to use the satellite map with no signal. Each area you save is listed here and can be removed on its own.'));
      return;
    }
    areas.forEach((a) => {
      const mbNum = (a.count || 0) * 0.018;
      const mb = mbNum < 10 ? mbNum.toFixed(1) : String(Math.round(mbNum));
      areasCard.append(h('div', { class: 'row-between price-item' }, [
        h('div', {}, [h('strong', {}, a.name), h('div', { class: 'muted', style: 'font-size:12px' }, `${a.count || 0} tiles · ~${mb} MB · saved ${a.savedAt}`)]),
        h('div', { class: 'cats' }, [
          h('button', { class: 'chip', title: 'Show on map', 'aria-label': `Show ${a.name} on map`, onclick: () => { if (mapCtrl && a.center) mapCtrl.flyTo(a.center.lng, a.center.lat, a.z || 12); } }, '◎'),
          h('button', { class: 'chip', 'aria-label': `Delete ${a.name}`, onclick: () => deleteArea(a) }, '✕'),
        ]),
      ]));
    });
  }
  function deleteArea(a) {
    removeSavedArea(a.id); renderAreas();
    if (mapCtrl && swAvailable && a.bounds && navigator.serviceWorker.controller) {
      const urls = mapCtrl.tileUrlsForArea(a.bounds, a.z || 12, 1000);
      const onMsg = (e) => { if ((e.data || {}).type === 'DELETE_DONE') { navigator.serviceWorker.removeEventListener('message', onMsg); showStorage(); } };
      navigator.serviceWorker.addEventListener('message', onMsg);
      navigator.serviceWorker.controller.postMessage({ type: 'DELETE_TILES', urls });
    }
  }
  // --- Measure tool: tap points to read distances, fully offline ----------------
  let measuring = false;
  const measureOut = h('p', { class: 'map-hint', style: 'margin:2px 0;display:none' }, '');
  const measureBtn = h('button', { class: 'btn ghost', onclick: toggleMeasure }, '📏 Measure');
  function fmtKm(km) { return km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(km < 10 ? 2 : 1)} km`; }
  function toggleMeasure() {
    if (!mapCtrl) return;
    measuring = !measuring;
    if (measuring) {
      measureBtn.textContent = '📏 Measuring — tap points'; measureBtn.classList.add('toggle-on');
      measureOut.style.display = ''; measureOut.textContent = 'Tap two or more points on the map to measure the distance.';
      mapCtrl.toggleMeasure(true, (km, n) => {
        measureOut.textContent = n < 2 ? 'Tap another point to measure…'
          : `Distance: ${fmtKm(km)} over ${n} points. Tap to extend, or tap “Measure” again to finish.`;
      });
    } else {
      measureBtn.textContent = '📏 Measure'; measureBtn.classList.remove('toggle-on');
      measureOut.style.display = 'none';
      mapCtrl.toggleMeasure(false);
    }
  }
  toolbar.append(dlBtn, wakeBtn, measureBtn);

  // --- Offline search: find a place / city / pool / your pin and fly to it -------
  const searchInput = h('input', { type: 'search', class: 'map-search', placeholder: 'Search places, cities, pools, your pins…', 'aria-label': 'Search the map', autocomplete: 'off' });
  const searchResults = h('div', { class: 'map-search-results' });
  const SEARCH_ICON = { City: '🏙️', Place: '📍', Pool: '🏊', Pin: '📌' };
  function runSearch() {
    searchResults.textContent = '';
    const q = searchInput.value.trim();
    if (!mapCtrl || q.length < 2) return;
    const matches = mapCtrl.search(q);
    if (!matches.length) { searchResults.append(h('p', { class: 'muted', style: 'padding:6px 4px;font-size:13px' }, 'No matches in the offline data.')); return; }
    matches.forEach((m) => searchResults.append(
      h('button', { class: 'btn ghost block', style: 'justify-content:flex-start;margin-top:4px', onclick: () => {
        mapCtrl.flyTo(m.lng, m.lat, m.z);
        searchResults.textContent = ''; searchInput.value = '';
      } }, `${SEARCH_ICON[m.type] || '•'}  ${m.name}  ·  ${m.type}`)));
  }
  searchInput.addEventListener('input', runSearch);
  const searchWrap = h('div', { class: 'map-search-wrap' }, [searchInput, searchResults]);

  wrap.append(toolbar, searchWrap, storageOut, measureOut, canvas, layersCard, stayCard, areasCard);
  renderAreas();

  // ---- Map key: every pin and EVERY line on the map, grouped + swatched --------
  // Each pin dot carries a faint ring so its edge stays visible on the cream/dark card.
  const dot = (c) => h('span', { style: `display:inline-block;width:13px;height:13px;border-radius:50%;background:${c};box-shadow:0 0 0 1px var(--key-dot-ring);flex:0 0 auto` });
  // A small line sample mirroring the real on-map style. `dash`: false = solid, true =
  // "5 3", or a custom dash string. `point`: overlay a white dot (the measure vertices).
  const lineSwatch = ({ color, dash = false, casing = null, width = 3, point = false }) => {
    const da = dash === true ? '5 3' : (typeof dash === 'string' ? dash : null);
    return h('span', { class: 'line-swatch', html:
      '<svg width="34" height="12" viewBox="0 0 34 12" role="img" aria-hidden="true">'
      + (casing ? `<line x1="2" y1="6" x2="32" y2="6" stroke="${casing}" stroke-width="${width + 3}" stroke-linecap="round"/>` : '')
      + `<line x1="2" y1="6" x2="32" y2="6" stroke="${color}" stroke-width="${width}" stroke-linecap="round"${da ? ` stroke-dasharray="${da}"` : ''}/>`
      + (point ? '<circle cx="17" cy="6" r="3" fill="#FFFFFF" stroke="#1E1E1E" stroke-width="1.5"/>' : '')
      + '</svg>' });
  };
  const keyRow = (swatch, label, sub) => h('div', { class: 'key-row' }, [
    swatch, h('span', {}, [h('span', { class: 'key-label' }, label), sub ? h('span', { class: 'key-sub' }, ` — ${sub}`) : null]),
  ]);
  const subhead = (t) => h('div', { class: 'key-subhead' }, t);

  const keyCard = h('details', { class: 'card map-key', open: '' }, [
    h('summary', {}, 'Map key — what every pin and line means'),

    subhead('Pins'),
    h('div', { class: 'key-grid' }, RATING_BANDS.map((b) => keyRow(dot(b.color), b.label))),
    h('div', { class: 'key-grid', style: 'margin-top:6px' }, [
      keyRow(dot('#D62828'), 'Local restaurant', 'a local, non-tourist eatery'),
      keyRow(dot('#E0A100'), 'Market'),
      keyRow(dot('#0EA5C4'), 'Pool'),
      keyRow(dot('#3B5BDB'), 'Border crossing', 'a place you can cross between countries'),
      keyRow(dot('#6A4C93'), 'Your dropped pin'),
      keyRow(h('span', { style: 'flex:0 0 auto' }, '🏠'), 'Your accommodation'),
    ]),
    h('p', { class: 'key-note' }, 'Place pins are coloured by rating (your own rating wins over the guidebook score) — except markets (gold) and local restaurants (red), which have their own colour.'),

    subhead('Base map'),
    h('div', { class: 'key-grid' }, [
      keyRow(lineSwatch({ color: '#2C7DA0', width: 4 }), 'Mekong River'),
      keyRow(lineSwatch({ color: '#A9824A', width: 3 }), 'Land / country outline'),
      keyRow(lineSwatch({ color: '#FF3B30', dash: '3 2.5', width: 3 }), 'Country border', 'the line between two countries'),
    ]),
    h('p', { class: 'key-note' }, 'The tan line outlines all land. Along national land borders it runs together with the red dashed Country border line (when that layer is on); only the tan line follows the sea coast.'),

    subhead('Transport routes (between cities)'),
    h('div', { class: 'key-grid' },
      ROUTE_LEGEND.map((b) => keyRow(lineSwatch({ color: b.color, dash: b.swatchDash, casing: '#FFFBF0', width: 3 }), b.label))),
    h('p', { class: 'key-note' }, 'A dashed line is the recommended way to travel between two cities. Each mode has its own colour AND dash pattern, so they stay distinct even when colours are hard to tell apart.'),

    subhead('Your navigation (shown only while you use a tool)'),
    h('div', { class: 'key-grid' }, [
      keyRow(lineSwatch({ color: '#D6336C', dash: true, casing: '#FFFFFF', width: 3 }), 'Way back to your stay', 'a direct line from your GPS location'),
      keyRow(lineSwatch({ color: '#1E1E1E', dash: true, casing: '#FFFFFF', width: 3, point: true }), 'Measuring line', 'from the 📏 Measure tool, with a dot at each tap'),
    ]),
  ]);
  // Place the key directly under the map so it is reachable without scrolling past
  // the layers/stay/areas cards (expert map-UX finding).
  layersCard.before(keyCard);

  // pins list (handy when offline / no GPS)
  const pinsCard = h('div', { class: 'card' }, [
    h('h2', {}, 'Your pins'),
    ...(store.pins.length
      ? store.pins.map((pin) => h('button', { class: 'btn ghost block', style: 'margin-top:8px; justify-content:flex-start', onclick: () => go(`#place-${pin.id}`) }, `📌 ${pin.name}`))
      : [h('p', { class: 'muted' }, 'No pins yet. Tap the map or use “＋ Add a place”.')]),
  ]);
  wrap.append(pinsCard);
  mount(wrap, '#map');

  // lazy-init the map engine (vendored); fall back to a simple GPS panel if it fails.
  import('./map.js').then((m) => m.initMap(canvas, {
    onMapClick: (coords) => { pendingPinCoords = coords; go('#addpin'); },
    onOpen: (id) => go(`#place-${id}`),
    onOpenCrossing: () => go('#crossings'),
    onOpenPool: () => go('#pools'),
    onShowKey: () => { keyCard.open = true; keyCard.scrollIntoView({ behavior: 'smooth', block: 'start' }); },
  })).then((ctrl) => {
    mapCtrl = ctrl; liveMapCtrl = ctrl; showStorage();
    const applyAll = () => Object.keys(ML).forEach((k) => applyLayer(k, ML[k] !== false));
    applyAll();
    ctrl.map.once('idle', applyAll);            // re-apply once markers (added on style.load) exist
    ctrl.onLocate((fix) => {
      lastFix = fix; updateStayBanner();
      const st = getMyStay();
      if (st && st.coords) ctrl.setWayback(fix, st.coords);   // live guide line, redrawn as you move
    });
    ctrl.triggerLocate();                        // auto-start GPS: blue dot + live distance to your stay
  }).catch(() => {
    canvas.replaceWith(mapFallback());
    storeBtn.remove();
  });
}

// Shown only if the map engine itself fails to load (rare; it is precached).
function mapFallback() {
  const card = h('div', { class: 'card' }, [
    h('h2', {}, 'Map engine could not start'),
    h('p', { class: 'muted' }, 'The map could not start on this device. You can still capture your GPS location below and manage your pins; the home-screen country map also works.'),
  ]);
  const out = h('p', {});
  card.append(h('button', { class: 'btn', onclick: () => {
    out.textContent = 'Locating…';
    if (!navigator.geolocation) { out.textContent = 'Geolocation unavailable.'; return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => { out.textContent = `Latitude ${pos.coords.latitude.toFixed(5)}, longitude ${pos.coords.longitude.toFixed(5)}.`; },
      (err) => { out.textContent = `No location: ${err.message}`; },
      { enableHighAccuracy: true, timeout: 10000 });
  } }, 'Find me'), out);
  return card;
}

function addPinScreen() {
  const wrap = h('div', { class: 'screen' });
  wrap.append(topbar('Add a place', '#map'));
  const state = { coords: pendingPinCoords || null, colls: new Set() };
  pendingPinCoords = null; // consume the tapped coordinate

  const card = h('div', { class: 'card' });
  const name = h('input', { type: 'text', placeholder: 'Place name (e.g. “Great noodle stall”)' });
  const note = h('input', { type: 'text', placeholder: 'A note (optional)' });
  card.append(field('Name', name), field('Note', note));

  const coordOut = h('p', { class: 'muted' }, state.coords
    ? `Attached from map tap: ${state.coords.lat.toFixed(5)}, ${state.coords.lng.toFixed(5)}`
    : 'No location attached.');
  card.append(field('Location', h('div', {}, [
    h('button', { class: 'btn ghost', onclick: () => {
      coordOut.textContent = 'Locating…';
      if (!navigator.geolocation) { coordOut.textContent = 'Geolocation unavailable.'; return; }
      navigator.geolocation.getCurrentPosition(
        (pos) => { state.coords = { lat: pos.coords.latitude, lng: pos.coords.longitude }; coordOut.textContent = `Attached: ${state.coords.lat.toFixed(5)}, ${state.coords.lng.toFixed(5)}`; },
        (err) => { coordOut.textContent = `No location: ${err.message}`; },
        { enableHighAccuracy: true, timeout: 10000 });
    } }, 'Use my current location'),
    coordOut,
  ])));

  // file it under any existing collections (create new themes from Saved or the Save sheet)
  if (store.collections.length) {
    card.append(field('Add to collections', h('div', { class: 'chips' },
      store.collections.map((c) => collToggleChip(c.name, c.emoji, () => toggleSet(state.colls, c.id))))));
  } else {
    card.append(field('Add to collections', h('p', { class: 'muted' }, 'You have no collections yet. Save the pin, then tap “＋ Save” on it to file it under a theme.')));
  }
  const stayChk = h('input', { type: 'checkbox' });
  card.append(h('label', { style: 'display:flex;align-items:center;gap:8px;cursor:pointer;margin-top:8px' },
    [stayChk, h('span', {}, '🏠 Also set this as my accommodation (My stay)')]));
  wrap.append(card);

  wrap.append(h('button', { class: 'btn block', onclick: () => {
    if (!name.value.trim()) { alert('Give the place a name.'); return; }
    const pin = addPin({ name: name.value.trim(), note: note.value.trim(), coords: state.coords });
    state.colls.forEach((cid) => togglePlaceInCollection(cid, pin.id));
    if (stayChk.checked && state.coords) setMyStay({ name: name.value.trim(), coords: state.coords });
    go('#saved');
  } }, 'Save place'));
  mount(wrap, '#map');
}

function toggleSet(set, v) { if (set.has(v)) set.delete(v); else set.add(v); }
function collToggleChip(name, emoji, onToggle) {
  return h('button', { class: 'chip', 'aria-pressed': 'false', onclick: (e) => {
    const c = e.currentTarget; const on = c.getAttribute('aria-pressed') === 'true';
    c.setAttribute('aria-pressed', on ? 'false' : 'true'); onToggle(c);
  } }, `${emoji} ${name}`);
}

// ---- TRAVEL JOURNAL (antique book) ------------------------------------------
function journalDispatch(arg) {
  if (!arg) return journalCover();
  if (arg === 'open') return journalTOC();
  if (arg === 'add') return addJournalScreen();
  if (arg.startsWith('entry-')) return journalEntryScreen(arg.slice(6));
  return journalCover();
}

function regionTitle() {
  const c = getCountry(activeCountry);
  return c ? c.name : 'Southeast Asia';
}

function journalCover() {
  const wrap = h('div', { class: 'screen' });
  wrap.append(topbar('Journal', '#home'));
  const n = journalEntries().length;
  const book = h('button', { class: 'book closed', 'aria-label': 'Open journal', onclick: () => go('#journal-open') }, [
    h('div', { class: 'book-spine' }),
    h('div', { class: 'book-cover' }, [
      h('div', { class: 'book-emboss' }, 'ADVENTURES IN'),
      h('div', { class: 'book-title' }, regionTitle()),
      h('div', { class: 'book-flour' }, '✦ ❧ ✦'),
      h('div', { class: 'book-count' }, n ? `${n} ${n === 1 ? 'entry' : 'entries'}` : 'open me'),
    ]),
  ]);
  wrap.append(book);
  wrap.append(h('button', { class: 'btn block', style: 'margin-top:16px', onclick: () => go('#journal-add') }, '✒ New entry'));
  mount(wrap, '#home');
}

function journalTOC() {
  const wrap = h('div', { class: 'screen' });
  wrap.append(topbar('Adventures', '#journal'));
  const entries = journalEntries();
  const spread = h('div', { class: 'book-open page-enter' }, [
    h('div', { class: 'page page-left' }, [
      h('div', { class: 'page-head' }, 'Adventures in'),
      h('div', { class: 'page-title' }, regionTitle()),
      h('div', { class: 'book-flour' }, '✦ ❧ ✦'),
      h('p', { class: 'muted' }, `${entries.length} ${entries.length === 1 ? 'entry' : 'entries'}`),
    ]),
    h('div', { class: 'page page-right' }, [
      h('div', { class: 'page-head' }, 'Contents'),
      entries.length
        ? h('ol', { class: 'toc' }, entries.map((e) => h('li', {}, [
            h('button', { class: 'toc-link', onclick: () => go(`#journal-entry-${e.id}`) },
              [h('span', { class: 'toc-date' }, e.date), ' ', e.title]),
          ])))
        : h('p', { class: 'muted' }, 'Your story starts here. Add your first entry.'),
    ]),
  ]);
  wrap.append(spread);
  wrap.append(h('div', { class: 'row-between', style: 'margin-top:16px' }, [
    h('button', { class: 'btn', onclick: () => go('#journal-add') }, '✒ New entry'),
    h('button', { class: 'btn ghost', onclick: () => go('#journey') }, '🗺 Journey map'),
  ]));
  mount(wrap, '#home');
}

function journalEntryScreen(id) {
  const entries = journalEntries();
  const idx = entries.findIndex((e) => e.id === id);
  const e = entries[idx];
  const wrap = h('div', { class: 'screen' });
  wrap.append(topbar('Journal', '#journal-open'));
  if (!e) { wrap.append(h('p', { class: 'empty' }, 'Entry not found.')); mount(wrap, '#home'); return; }
  const when = new Date(e.ts);
  const stamp = `${when.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })} · ${when.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}`;
  const loc = e.place || (e.coords ? `${e.coords.lat.toFixed(3)}, ${e.coords.lng.toFixed(3)}` : '');
  const page = h('div', { class: 'page page-single page-enter' }, [
    h('div', { class: 'stamp' }, [h('span', {}, stamp), loc ? h('span', { class: 'stamp-loc' }, `📍 ${loc}`) : null]),
    h('h2', { class: 'entry-title' }, e.title),
    h('div', { class: 'entry-body' }, (e.text || '').split('\n').map((p) => h('p', {}, p))),
  ]);
  if (e.photoKey) {
    const img = h('img', { class: 'entry-photo', alt: 'Journal photo' });
    page.insertBefore(img, page.children[1]); // just below the stamp
    getBlob(e.photoKey).then((b) => { if (b) img.src = URL.createObjectURL(b); }).catch(() => {});
  }
  wrap.append(page);
  wrap.append(h('div', { class: 'row-between', style: 'margin-top:14px' }, [
    h('button', { class: 'btn ghost', disabled: idx <= 0 ? '' : null, onclick: () => idx > 0 && go(`#journal-entry-${entries[idx - 1].id}`) }, '‹ Prev'),
    h('button', { class: 'btn ghost', onclick: () => { if (confirm('Delete this entry?')) { if (e.photoKey) delBlob(e.photoKey); deleteJournalEntry(e.id); go('#journal-open'); } } }, 'Delete'),
    h('button', { class: 'btn ghost', disabled: idx >= entries.length - 1 ? '' : null, onclick: () => idx < entries.length - 1 && go(`#journal-entry-${entries[idx + 1].id}`) }, 'Next ›'),
  ]));
  mount(wrap, '#home');
}

function addJournalScreen() {
  const wrap = h('div', { class: 'screen' });
  wrap.append(topbar('New entry', '#journal-open'));
  const st = { coords: null };
  const title = h('input', { type: 'text', placeholder: 'A title for this memory' });
  const text = h('textarea', { class: 'ta', placeholder: 'What happened? What did you see, eat, feel?' });
  const place = h('input', { type: 'text', placeholder: 'Place (e.g. Hoi An old town)' });
  const photoInput = h('input', { type: 'file', accept: 'image/*', capture: 'environment' });
  const locOut = h('p', { class: 'muted' }, 'Entry is stamped with the current date and time automatically.');
  const card = h('div', { class: 'card' }, [
    field('Title', title), field('Your entry', text), field('Place', place),
    field('Location', h('div', {}, [
      h('button', { class: 'btn ghost', onclick: () => {
        locOut.textContent = 'Locating…';
        if (!navigator.geolocation) { locOut.textContent = 'Geolocation unavailable.'; return; }
        navigator.geolocation.getCurrentPosition(
          (pos) => { st.coords = { lat: pos.coords.latitude, lng: pos.coords.longitude }; locOut.textContent = `Stamped at ${st.coords.lat.toFixed(4)}, ${st.coords.lng.toFixed(4)}`; },
          (err) => { locOut.textContent = `No location: ${err.message}`; }, { enableHighAccuracy: true, timeout: 10000 });
      } }, '📍 Stamp my location'),
      locOut,
    ])),
    field('Photo (optional)', photoInput),
  ]);
  wrap.append(card);
  wrap.append(h('button', { class: 'btn block', onclick: async () => {
    if (!title.value.trim() && !text.value.trim()) { alert('Write something first.'); return; }
    let photoKey = null;
    const f = photoInput.files && photoInput.files[0];
    if (f) { photoKey = `jrphoto-${Date.now()}-${Math.floor(Math.random() * 1e6)}`; try { await putBlob(photoKey, f); } catch { photoKey = null; } }
    addJournalEntry({ title: title.value.trim() || 'Untitled', text: text.value, place: place.value.trim(), coords: st.coords, photoKey });
    go('#journal-open');
  } }, 'Save to journal'));
  mount(wrap, '#home');
}

// ---- JOURNEY MAP (Indiana-Jones dotted line + moving vehicle) ----------------
function journeyScreen() {
  const wrap = h('div', { class: 'screen' });
  wrap.append(topbar('Your journey', '#journal-open'));
  const pts = journalEntries().filter((e) => e.coords);
  if (pts.length < 2) {
    wrap.append(h('p', { class: 'empty' }, 'Add at least two journal entries with a stamped location to draw your journey line.'));
    mount(wrap, '#home'); return;
  }
  const holder = h('div', { class: 'journey-wrap' });
  holder.innerHTML = journeySVG(pts);
  wrap.append(holder);
  const list = h('div', { class: 'card' }, [h('h2', {}, 'Stops')]);
  pts.forEach((e, i) => list.append(h('div', { class: 'list-note' }, `${i + 1}. ${e.place || e.title} — ${e.date}`)));
  wrap.append(list);
  mount(wrap, '#home');
}

function journeySVG(pts) {
  const W = 320, H = 340, pad = 38;
  const lats = pts.map((p) => p.coords.lat), lngs = pts.map((p) => p.coords.lng);
  const minLat = Math.min(...lats), maxLat = Math.max(...lats), minLng = Math.min(...lngs), maxLng = Math.max(...lngs);
  const sx = (lng) => pad + (maxLng === minLng ? 0.5 : (lng - minLng) / (maxLng - minLng)) * (W - 2 * pad);
  const sy = (lat) => (H - pad) - (maxLat === minLat ? 0.5 : (lat - minLat) / (maxLat - minLat)) * (H - 2 * pad);
  const coords = pts.map((p) => [sx(p.coords.lng), sy(p.coords.lat)]);
  const d = 'M' + coords.map((c) => `${c[0].toFixed(1)},${c[1].toFixed(1)}`).join(' L');
  const dots = coords.map((c) => `<circle cx="${c[0].toFixed(1)}" cy="${c[1].toFixed(1)}" r="5" fill="#E8632A" stroke="#FFF6E2" stroke-width="2"/>`).join('');
  const last = coords[coords.length - 1];
  // Indiana-Jones style: dashed (not dotted) red line, plane moving slowly along it.
  const dur = Math.max(18, pts.length * 7).toFixed(0);
  const vehicle = prefersReducedMotion()
    ? `<text x="${last[0].toFixed(1)}" y="${last[1].toFixed(1)}" font-size="22" text-anchor="middle" dominant-baseline="middle">✈️</text>`
    : `<text font-size="22" text-anchor="middle" dominant-baseline="middle">✈️<animateMotion dur="${dur}s" repeatCount="indefinite" rotate="auto" path="${d}"/></text>`;
  return `<svg viewBox="0 0 ${W} ${H}" class="journey-svg" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Your journey route">
    <rect x="2" y="2" width="${W - 4}" height="${H - 4}" rx="16" fill="none" stroke="#E7CFA6" stroke-width="2"/>
    <path d="${d}" fill="none" stroke="#C0431A" stroke-width="3.5" stroke-dasharray="12 9" stroke-linecap="round"/>
    ${dots}${vehicle}</svg>`;
}

// ---- TRAVEL CALENDAR + DAY PLANNER ------------------------------------------
const CAL_ICON = { stay: '🛏', meal: '🍽', activity: '🎟', plan: '🗓', festival: '🎉' };
function calendarDispatch(arg) { return arg === 'add' ? calendarAddScreen() : calendarScreen(); }

// Order items by date, then by time-of-day (untimed entries fall to the end of the day).
function calItems() {
  return store.calendar.items.slice().sort((a, b) => {
    const ka = `${a.date} ${a.time || '99:99'}`, kb = `${b.date} ${b.time || '99:99'}`;
    return ka < kb ? -1 : (ka > kb ? 1 : 0);
  });
}
function calDateLabel(d) {
  try { return new Date(d + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'long', day: 'numeric' }); }
  catch { return d; }
}

function calendarScreen() {
  const wrap = h('div', { class: 'screen' });
  wrap.append(topbar('Calendar & day planner', '#home'));
  wrap.append(h('button', { class: 'btn block', onclick: () => go('#calendar-add') }, '＋ Add plan, booking or meal'));

  // Festivals & public holidays that fall within the trip window (or the next ~90
  // days if nothing is planned yet) surface here automatically, so the calendar
  // shows what is happening around your dates. "Add to my plan" copies one in.
  const fests = festivalsInWindow();
  if (fests.length) {
    const sec = h('div', { class: 'card fest-card' }, [
      h('div', { class: 'row-between' }, [
        h('strong', {}, '🎉 Festivals & public holidays'),
        h('button', { class: 'btn ghost', onclick: () => go('#events') }, 'See all'),
      ]),
      h('p', { class: 'muted', style: 'margin:6px 0 0' },
        store.calendar.items.length ? 'Falling within your planned dates:' : 'Coming up in the next few months:'),
    ]);
    fests.forEach((e) => {
      const addBtn = h('button', { class: 'btn ghost' }, 'Add to my plan');
      addBtn.addEventListener('click', () => addEventToCalendar(e, addBtn));
      sec.append(h('div', { class: 'card', style: 'margin:8px 0 0' }, [
        h('strong', {}, `${e.flag || ''} ${e.name}`),
        h('div', { class: 'muted', style: 'margin:2px 0 8px' }, `${evRange(e)} · ${e.countryName}`),
        h('div', { class: 'row-between' }, [
          h('button', { class: 'btn ghost', onclick: () => go(`#event-${e.id}`) }, 'Details'),
          addBtn,
        ]),
      ]));
    });
    wrap.append(sec);
  }

  const items = calItems();
  if (!items.length) { wrap.append(h('p', { class: 'empty' }, 'Plan your days and log your stays, meals and activities — add a time and they line up into a timeline for each day.')); mount(wrap, '#home'); return; }
  let lastDate = '';
  items.forEach((it) => {
    if (it.date !== lastDate) { wrap.append(h('h2', { class: 'cat-title' }, calDateLabel(it.date))); lastDate = it.date; }
    const card = h('div', { class: 'card' }, [
      h('div', { class: 'row-between' }, [
        h('strong', {}, `${it.time ? it.time + ' · ' : ''}${CAL_ICON[it.type] || '•'} ${it.title}`),
        h('span', { class: 'fair' }, it.cost ? `${it.cost} ${it.currency}` : ''),
      ]),
      it.place ? h('p', { class: 'muted' }, it.place) : null,
      it.rating ? h('div', { class: 'stars-static' }, starsStr(it.rating)) : null,
      it.note ? h('p', {}, it.note) : null,
      h('button', { class: 'btn ghost', onclick: () => { if (confirm('Delete this entry?')) { deleteCalendarItem(it.id); go('#calendar'); } } }, 'Delete'),
    ]);
    wrap.append(card);
  });
  mount(wrap, '#home');
}

function calendarAddScreen() {
  const wrap = h('div', { class: 'screen' });
  wrap.append(topbar('Add to calendar', '#calendar'));
  const c = getCountry(activeCountry);
  const st = { rating: 0 };
  const date = h('input', { type: 'date' });
  const time = h('input', { type: 'time' });
  const type = selectEl([['plan', '🗓 Day plan'], ['stay', '🛏 Accommodation'], ['meal', '🍽 Meal'], ['activity', '🎟 Activity']], 'plan', () => {});
  const title = h('input', { type: 'text', placeholder: 'e.g. Grand Palace visit / Bun cha lunch' });
  const place = h('input', { type: 'text', placeholder: 'Where' });
  const cost = h('input', { type: 'number', inputmode: 'decimal', placeholder: 'Cost' });
  const cur = selectEl(['THB', 'VND', 'KHR', 'LAK', 'USD', 'EUR', 'GBP', 'ILS'], c ? c.currency : 'THB', () => {});
  const note = h('textarea', { class: 'ta', placeholder: 'Plan details, or a review once you have been' });
  const stars = h('div', { class: 'stars' });
  const paint = (n) => [...stars.children].forEach((s, i) => { s.textContent = i < n ? '★' : '☆'; });
  for (let i = 1; i <= 5; i++) stars.append(h('button', { class: 'star', 'aria-label': `${i} star${i > 1 ? 's' : ''}`, onclick: () => { st.rating = st.rating === i ? 0 : i; paint(st.rating); } }, '☆'));
  wrap.append(h('div', { class: 'card' }, [
    field('Date', date), field('Time (optional)', time), field('Type', type), field('Title', title), field('Place', place),
    field('Cost (optional)', h('div', { class: 'row-between' }, [cost, cur])),
    field('Rating (optional)', stars), field('Plan / review', note),
  ]));
  wrap.append(h('button', { class: 'btn block', onclick: () => {
    if (!date.value) { alert('Pick a date.'); return; }
    if (!title.value.trim()) { alert('Add a title.'); return; }
    addCalendarItem({ date: date.value, time: time.value, type: type.value, title: title.value.trim(), place: place.value.trim(), cost: cost.value, currency: cur.value, rating: st.rating, note: note.value.trim() });
    go('#calendar');
  } }, 'Save'));
  mount(wrap, '#home');
}

// ---- FOOD / DISH IDENTIFIER -------------------------------------------------
let foodCountry = '';
let foodQuery = '';
let foodCat = '';
const foodAvoid = new Set();
function spiceLabel(s) {
  return s === 'hot' ? '🌶🌶🌶 Hot' : s === 'medium' ? '🌶🌶 Medium'
    : s === 'mild' ? '🌶 Mild' : s === 'varies' ? '🌶 Varies' : 'Not spicy';
}

function foodCard(d) {
  const cat = FOOD_CATEGORIES.find((c) => c.id === d.category);
  return h('button', { class: 'card species-card', onclick: () => go(`#dish-${d.id}`) }, [
    h('span', { class: 'species-emoji' }, cat ? cat.emoji : '🍽'),
    h('span', { class: 'grow' }, [
      h('div', { class: 'en' }, `${d.flag ? d.flag + ' ' : ''}${d.name}`),
      h('div', { class: 'sci' }, `${d.localName || ''}${d.roman ? ` · ${d.roman}` : ''}`),
    ]),
    h('span', { class: 'fair' }, d.price ? range(d.price.low, d.price.high, d.price.currency) : ''),
  ]);
}

function foodScreen(country) {
  if (country) foodCountry = country;
  const wrap = h('div', { class: 'screen' });
  wrap.append(topbar('Identify food', '#home'));
  wrap.append(h('p', { class: 'map-hint' }, 'Search dishes by name or ingredient. Tap one for ingredients, allergens, vegetarian notes and a fair price. Use “Avoid” to hide dishes that contain an allergen.'));

  const cFilters = [{ id: '', name: 'All', flag: '🌏' }].concat(COUNTRIES.map((c) => ({ id: c.id, name: c.name, flag: c.flag })));
  const cChips = h('div', { class: 'chips' }, cFilters.map((f) =>
    h('button', { class: 'chip', 'aria-pressed': foodCountry === f.id ? 'true' : 'false', dataset: { c: f.id },
      onclick: () => { foodCountry = f.id; cChips.querySelectorAll('.chip').forEach((x) => x.setAttribute('aria-pressed', x.dataset.c === f.id ? 'true' : 'false')); renderList(); } },
      `${f.flag} ${f.name}`)));
  wrap.append(cChips);

  const search = h('input', { class: 'search', type: 'search', 'aria-label': 'Search', placeholder: 'Search dishes or ingredients…', value: foodQuery,
    oninput: debounce((e) => { foodQuery = e.target.value; renderList(); }, 120) });
  wrap.append(search);

  const cats = [{ id: '', label: 'All', emoji: '✶' }].concat(FOOD_CATEGORIES);
  const catChips = h('div', { class: 'chips' }, cats.map((g) =>
    h('button', { class: 'chip', 'aria-pressed': foodCat === g.id ? 'true' : 'false', dataset: { g: g.id },
      onclick: () => { foodCat = g.id; catChips.querySelectorAll('.chip').forEach((x) => x.setAttribute('aria-pressed', x.dataset.g === g.id ? 'true' : 'false')); renderList(); } },
      `${g.emoji} ${g.label}`)));
  wrap.append(catChips);

  wrap.append(h('p', { class: 'muted', style: 'margin:10px 0 4px' }, 'Avoid (hides dishes that contain):'));
  const avoidChips = h('div', { class: 'chips' }, FOOD_ALLERGENS.map((a) =>
    h('button', { class: 'chip', 'aria-pressed': foodAvoid.has(a) ? 'true' : 'false',
      onclick: (e) => { if (foodAvoid.has(a)) foodAvoid.delete(a); else foodAvoid.add(a); e.currentTarget.setAttribute('aria-pressed', foodAvoid.has(a) ? 'true' : 'false'); renderList(); } },
      `🚫 ${a}`)));
  wrap.append(avoidChips);

  const listEl = h('div', {});
  wrap.append(listEl);
  function renderList() {
    listEl.innerHTML = '';
    let dishes = foodCountry
      ? getFood(foodCountry).map((d) => { const c = getCountry(foodCountry); return { ...d, country: c.id, countryName: c.name, flag: c.flag }; })
      : allFood();
    const q = foodQuery.trim().toLowerCase();
    if (q) dishes = dishes.filter((d) => d.name.toLowerCase().includes(q) || (d.roman || '').toLowerCase().includes(q)
      || (d.localName || '').includes(foodQuery.trim()) || (d.ingredients || []).some((i) => i.toLowerCase().includes(q)));
    if (foodCat) dishes = dishes.filter((d) => d.category === foodCat);
    if (foodAvoid.size) dishes = dishes.filter((d) => !(d.allergens || []).some((a) => foodAvoid.has(a)));
    if (!dishes.length) { listEl.append(h('p', { class: 'empty' }, 'No dishes match. Try clearing a filter.')); return; }
    dishes.forEach((d) => listEl.append(foodCard(d)));
  }
  renderList();
  mount(wrap, '#home');
}

function dishScreen(id) {
  const d = getDish(id);
  const wrap = h('div', { class: 'screen' });
  wrap.append(topbar(d ? d.name : 'Dish', '#food'));
  if (!d) { wrap.append(h('p', { class: 'empty' }, 'Not found.')); mount(wrap, '#home'); return; }
  const cat = FOOD_CATEGORIES.find((c) => c.id === d.category);
  const dc = getCountry(d.country);
  const dLocale = (dc && getLanguage(dc.lang)) ? getLanguage(dc.lang).locale : '';
  const tagRow = 'display:flex;flex-wrap:wrap;gap:6px;margin:6px 0';
  const card = h('div', { class: 'card' }, [
    h('div', { class: 'row-between' }, [
      h('strong', {}, `${d.flag ? d.flag + ' ' : ''}${d.name}`),
      cat ? h('span', { class: 'cat-tag' }, `${cat.emoji} ${cat.label}`) : null,
    ]),
    d.localName ? h('div', { class: 'native', lang: scriptLang(d.country) }, d.localName) : null,
    d.roman ? h('div', { class: 'roman' }, [h('span', { class: 'lbl' }, 'say:'), d.roman]) : null,
    (d.localName && canSay(dLocale)) ? h('button', { class: 'btn ghost', style: 'margin:4px 0', onclick: () => say(d.localName, dLocale) }, '🔊 Hear the name (show a local)') : null,
    h('div', { class: 'muted', style: 'margin:6px 0' }, `${spiceLabel(d.spice)}${d.countryName ? ' · ' + d.countryName : ''}`),
    d.description ? h('p', {}, d.description) : null,
  ]);
  card.append(photoBlock(d, d.name));
  if (d.price && (d.price.low != null || d.price.high != null)) {
    card.append(h('p', {}, [h('strong', {}, 'Typical price: '), priceLine(d.price.low, d.price.high, d.price.currency)]));
  }
  if (d.ingredients && d.ingredients.length) {
    card.append(h('h3', {}, 'Ingredients'));
    card.append(h('div', { style: tagRow }, d.ingredients.map((i) => h('span', { class: 'cat-tag' }, i))));
  }
  card.append(h('h3', {}, 'Allergens'));
  if (d.allergens && d.allergens.length) {
    card.append(h('div', { style: tagRow }, d.allergens.map((a) => h('span', { class: 'tier high' }, a))));
  } else {
    card.append(h('p', { class: 'muted' }, 'No common allergens typically — always confirm at the stall.'));
  }
  if (d.veg) { card.append(h('h3', {}, 'Vegetarian / vegan')); card.append(h('p', {}, d.veg)); }
  if (d.whereToFind) { card.append(h('h3', {}, 'Where to find it')); card.append(h('p', {}, d.whereToFind)); }
  if (d.sources && d.sources.length) card.append(h('p', { class: 'muted', style: 'margin-top:10px' }, `Sources: ${d.sources.join('; ')}`));
  wrap.append(card);
  wrap.append(h('a', { class: 'btn block', href: imageSearch(`${d.name} ${d.localName || ''} food`), target: '_blank', rel: 'noopener' }, 'See photos ↗'));
  mount(wrap, '#home');
}

// ---- MARKET PRODUCE GUIDE (fruit / vegetable / herb) ------------------------
let produceQuery = '';
let produceCat = '';
function produceCard(p) {
  const cat = PRODUCE_CATEGORIES.find((c) => c.id === p.category);
  return h('button', { class: 'card species-card', onclick: () => go(`#produce-${p.id}`) }, [
    h('span', { class: 'species-emoji' }, p.emoji || (cat ? cat.emoji : '🍈')),
    h('span', { class: 'grow' }, [
      h('div', { class: 'en' }, p.name),
      h('div', { class: 'sci' }, `${(p.names && p.names.th) || ''}${p.season ? ' · ' + p.season : ''}`),
    ]),
  ]);
}
function produceScreen() {
  const wrap = h('div', { class: 'screen' });
  wrap.append(topbar('Market produce', '#home'));
  wrap.append(h('p', { class: 'map-hint' }, 'Fruits, vegetables and herbs you will see at the market — names in every local language, when they are in season, how to eat and pick them, and a fair price.'));
  const cats = [{ id: '', label: 'All', emoji: '✶' }].concat(PRODUCE_CATEGORIES);
  const chips = h('div', { class: 'chips' }, cats.map((g) =>
    h('button', { class: 'chip', 'aria-pressed': produceCat === g.id ? 'true' : 'false', dataset: { g: g.id },
      onclick: () => { produceCat = g.id; chips.querySelectorAll('.chip').forEach((x) => x.setAttribute('aria-pressed', x.dataset.g === g.id ? 'true' : 'false')); renderList(); } },
      `${g.emoji} ${g.label}`)));
  wrap.append(chips);
  const search = h('input', { class: 'search', type: 'search', 'aria-label': 'Search', placeholder: 'Search produce…', value: produceQuery,
    oninput: debounce((e) => { produceQuery = e.target.value; renderList(); }, 120) });
  wrap.append(search);
  const listEl = h('div', {});
  wrap.append(listEl);
  function renderList() {
    listEl.innerHTML = '';
    let items = produceByCategory(produceCat);
    const q = produceQuery.trim().toLowerCase();
    if (q) items = items.filter((p) => p.name.toLowerCase().includes(q)
      || Object.values(p.names || {}).some((n) => (n || '').toLowerCase().includes(q) || (n || '').includes(produceQuery.trim())));
    if (!items.length) { listEl.append(h('p', { class: 'empty' }, 'No produce matches.')); return; }
    items.forEach((p) => listEl.append(produceCard(p)));
  }
  renderList();
  mount(wrap, '#home');
}
function produceDetail(id) {
  const p = getProduce(id);
  const wrap = h('div', { class: 'screen' });
  wrap.append(topbar(p ? p.name : 'Produce', '#produce'));
  if (!p) { wrap.append(h('p', { class: 'empty' }, 'Not found.')); mount(wrap, '#home'); return; }
  const cat = PRODUCE_CATEGORIES.find((c) => c.id === p.category);
  const langs = [['th', '🇹🇭', 'th-TH'], ['vi', '🇻🇳', 'vi-VN'], ['km', '🇰🇭', 'km-KH'], ['lo', '🇱🇦', 'lo-LA']];
  const card = h('div', { class: 'card' }, [
    h('div', { class: 'row-between' }, [
      h('strong', {}, `${p.emoji || ''} ${p.name}`),
      cat ? h('span', { class: 'cat-tag' }, `${cat.emoji} ${cat.label}`) : null,
    ]),
    h('p', { class: 'muted', style: 'margin:6px 0 2px' }, 'Local names (tap 🔊 to hear):'),
    h('div', { style: 'display:flex;flex-wrap:wrap;gap:6px;margin:4px 0 8px' },
      langs.filter(([k]) => p.names && p.names[k]).map(([k, flag, loc]) => (canSay(loc)
        ? h('button', { class: 'cat-tag', style: 'cursor:pointer;border:none', onclick: () => say(p.names[k], loc) }, `${flag} ${p.names[k]} 🔊`)
        : h('span', { class: 'cat-tag' }, `${flag} ${p.names[k]}`)))),
  ]);
  card.append(photoBlock(p, p.name));
  if (p.season) card.append(h('h3', {}, 'In season'), h('p', {}, p.season));
  if (p.taste) card.append(h('h3', {}, 'Taste'), h('p', {}, p.taste));
  if (p.howToEat) card.append(h('h3', {}, 'How to eat'), h('p', {}, p.howToEat));
  if (p.selectTip) card.append(h('h3', {}, 'Picking a good one'), h('p', {}, p.selectTip));
  if (p.caution) card.append(h('div', { class: 'warn-note', style: 'margin-top:8px' }, `⚠ ${p.caution}`));
  if (p.price) card.append(h('p', { style: 'margin-top:10px' }, [h('strong', {}, 'Typical price: '), `${priceLine(p.price.low, p.price.high, p.price.currency)}${p.price.unit ? ' ' + p.price.unit : ''}`]));
  if (p.sources && p.sources.length) card.append(h('p', { class: 'muted', style: 'margin-top:8px' }, `Sources: ${p.sources.join('; ')}`));
  wrap.append(card);
  wrap.append(h('a', { class: 'btn block', href: imageSearch(`${p.name} fruit vegetable`), target: '_blank', rel: 'noopener' }, 'See photos ↗'));
  mount(wrap, '#home');
}

// ---- WEATHER + FORECAST -----------------------------------------------------
let weatherKey = '';   // remembered city selection across renders
function wxAgo(ts) {
  if (!ts) return 'never';
  const m = Math.round((Date.now() - ts) / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m} min ago`;
  const hr = Math.round(m / 60);
  if (hr < 24) return `${hr} h ago`;
  return `${Math.round(hr / 24)} d ago`;
}
function wxDay(d) { try { return new Date(d + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'short' }); } catch { return d; } }
function wxDayDate(d) { try { return new Date(d + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' }); } catch { return d; } }
function wxTime(iso) { try { return new Date(iso).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }); } catch { return iso ? iso.slice(11, 16) : '–'; } }
// Project lng/lat onto the same map as the landing-page country outlines.
function projLL(lng, lat) { const P = REGION_PROJ; return [P.pad + (lng - P.minlng) * P.kx * P.scale, P.pad + (P.maxlat - lat) * P.scale]; }
function wxTempVal(c) { return wxTempU() === 'F' ? Math.round(c * 9 / 5 + 32) : Math.round(c); }

// Unit preferences persist in the profile (default metric). Data is always stored
// metric, so toggling converts on display without any re-fetch.
function wxTempU() { return (store.profile && store.profile.wxTempUnit) || 'C'; }
function wxWindU() { return (store.profile && store.profile.wxWindUnit) || 'kmh'; }
function fmtTemp(c) { if (c == null) return '–'; const v = wxTempU() === 'F' ? c * 9 / 5 + 32 : c; return `${Math.round(v)}°${wxTempU()}`; }
function fmtWind(kmh) { if (kmh == null) return '–'; const mph = wxWindU() === 'mph'; const v = mph ? kmh * 0.621371 : kmh; return `${Math.round(v)} ${mph ? 'mph' : 'km/h'}`; }
function fmtPrecip(mm) { if (mm == null) return '–'; if (wxTempU() === 'F') return `${(mm / 25.4).toFixed(2)} in`; return `${mm % 1 === 0 ? mm : mm.toFixed(1)} mm`; }

// Split a day's hourly readings into parts of the day so the forecast can say, e.g.,
// "rain in the afternoon". Code = the most significant (max WMO) hour in the window.
const WX_SEGMENTS = [
  { label: 'Morning', from: 6, to: 12 },
  { label: 'Afternoon', from: 12, to: 18 },
  { label: 'Evening', from: 18, to: 24 },
  { label: 'Night', from: 0, to: 6 },
];
function daySegments(hourly, date) {
  if (!Array.isArray(hourly)) return [];
  const hrs = hourly.filter((h) => (h.t || '').slice(0, 10) === date);
  return WX_SEGMENTS.map((seg) => {
    const inSeg = hrs.filter((h) => { const hr = +(h.t || '').slice(11, 13); return hr >= seg.from && hr < seg.to; });
    if (!inSeg.length) return null;
    const hums = inSeg.map((h) => h.hum).filter((v) => v != null);
    return {
      label: seg.label,
      code: Math.max(...inSeg.map((h) => h.code || 0)),
      pp: Math.max(...inSeg.map((h) => (h.pp == null ? 0 : h.pp))),
      tmin: Math.min(...inSeg.map((h) => h.temp)),
      tmax: Math.max(...inSeg.map((h) => h.temp)),
      hum: hums.length ? Math.round(hums.reduce((a, b) => a + b, 0) / hums.length) : null,
    };
  }).filter(Boolean);
}

function weatherScreen(country) {
  const wrap = h('div', { class: 'screen' });
  wrap.append(topbar('Weather & forecast', '#home'));
  if (country) weatherKey = spotKey(focusSpot(country).spot);
  if (!weatherKey) weatherKey = spotKey(focusSpot().spot);
  const spot = WEATHER_SPOTS.find((s) => spotKey(s) === weatherKey) || defaultSpot('th');

  // Unit toggles (°C/°F, km/h/mph) — persist in the profile and re-render.
  const setTemp = (u) => { store.profile.wxTempUnit = u; save(); render(); };
  const setWind = (u) => { store.profile.wxWindUnit = u; save(); render(); };
  const unitChip = (label, active, onclick) => h('button', { class: 'chip', 'aria-pressed': active ? 'true' : 'false', onclick }, label);
  wrap.append(h('div', { class: 'chips', style: 'margin-bottom:6px' }, [
    unitChip('°C', wxTempU() === 'C', () => setTemp('C')),
    unitChip('°F', wxTempU() === 'F', () => setTemp('F')),
    unitChip('km/h', wxWindU() === 'kmh', () => setWind('kmh')),
    unitChip('mph', wxWindU() === 'mph', () => setWind('mph')),
  ]));

  // Pick a country first, then a city.
  const curCountry = spot.country;
  wrap.append(h('div', { class: 'chips' }, COUNTRIES.map((c) =>
    h('button', { class: 'chip', 'aria-pressed': c.id === curCountry ? 'true' : 'false',
      onclick: () => { weatherKey = spotKey(defaultSpot(c.id)); render(); } }, `${c.flag} ${c.name}`))));
  wrap.append(h('div', { class: 'chips' }, spotsForCountry(curCountry).map((s) =>
    h('button', { class: 'chip', 'aria-pressed': spotKey(s) === weatherKey ? 'true' : 'false',
      onclick: () => { weatherKey = spotKey(s); render(); } }, s.city))));

  // Forecast map: the region with this country's cities plotted, each showing its
  // current temperature (one batched fetch), tappable to switch city.
  const mapBox = h('div', {});
  wrap.append(mapBox);
  function renderMap(many) {
    const cities = spotsForCountry(curCountry);
    const paths = COUNTRIES.map((c) => REGION_PATHS[c.id]
      ? `<path d="${REGION_PATHS[c.id]}" fill="${c.id === curCountry ? '#F1E3C6' : '#E9DCC2'}" stroke="#D8C39A" stroke-width="1.5" opacity="${c.id === curCountry ? 1 : 0.45}"/>` : '').join('');
    const dots = cities.map((s) => {
      const [x, y] = projLL(s.lng, s.lat);
      const w = many && many[spotKey(s)];
      const sel = spotKey(s) === weatherKey;
      const temp = w ? `${wxTempVal(w.temp)}°` : '';
      const emo = w ? wmo(w.code)[1] : '';
      return `<g class="wx-dot" data-key="${spotKey(s)}" style="cursor:pointer">
          <text x="${x}" y="${y - 14}" text-anchor="middle" style="font-size:24px">${emo}</text>
          <circle cx="${x}" cy="${y}" r="${sel ? 9 : 6}" fill="${sel ? '#C0431A' : '#2C7DA0'}" stroke="#FFFDF5" stroke-width="2.5"/>
          <text x="${x}" y="${y + 26}" text-anchor="middle" style="font-size:21px;font-weight:800;fill:#2A2118;paint-order:stroke;stroke:rgba(255,253,245,0.9);stroke-width:5px">${esc(s.city)} ${temp}</text>
        </g>`;
    }).join('');
    const svg = `<svg viewBox="${REGION_VIEWBOX}" class="region-svg" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Weather map" xmlns="http://www.w3.org/2000/svg">${paths}${dots}</svg>`;
    mapBox.innerHTML = '';
    const box = h('div', { class: 'region-map', html: svg });
    box.querySelectorAll('.wx-dot').forEach((g) => g.addEventListener('click', () => { weatherKey = g.getAttribute('data-key'); render(); }));
    box.append(h('span', { class: 'region-cap' }, many ? 'Tap a city for its full forecast' : 'Connect once to load city temperatures'));
    mapBox.append(box);
  }
  renderMap(getCachedMany() && getCachedMany().data);
  if (online()) refreshMany(spotsForCountry(curCountry)).then((r) => { if (r && (location.hash || '').startsWith('#weather')) renderMap(r.data); });

  const body = h('div', {});
  wrap.append(body);

  function paint(rec, loading) {
    body.innerHTML = '';
    if (!rec) {
      body.append(h('div', { class: 'card' }, [
        h('p', {}, loading ? 'Fetching the latest forecast…' : 'No saved forecast yet for this city.'),
        h('p', { class: 'muted' }, 'Connect to the internet once and tap Refresh to download it. The forecast is then stored on your device for offline viewing.'),
      ]));
    } else {
      const [clabel, cemoji] = wmo(rec.current.code);
      body.append(h('div', { class: 'card' }, [
        h('div', { class: 'row-between' }, [
          h('span', { style: 'font-size:44px;line-height:1' }, cemoji),
          h('div', { style: 'text-align:right' }, [
            h('div', { style: 'font-size:34px;font-weight:800' }, fmtTemp(rec.current.temp)),
            h('div', { class: 'muted' }, clabel),
          ]),
        ]),
        h('div', { class: 'muted', style: 'margin-top:8px' },
          `${spot.city}${rec.daily && rec.daily[0] ? ' · ' + wxDayDate(rec.daily[0].date) : ''} · Feels ${fmtTemp(rec.current.apparent)} · Humidity ${rec.current.humidity}% · Wind ${fmtWind(rec.current.wind)}`),
      ]));
      const fc = h('div', { class: 'card' }, [
        h('h3', { style: 'margin-top:0' }, '7-day forecast'),
        h('p', { class: 'muted', style: 'margin:0 0 4px' }, 'Tap a day for the morning / afternoon / evening / night breakdown.'),
      ]);
      rec.daily.forEach((d) => {
        const [dl, de] = wmo(d.code);
        const detail = h('div', { style: 'display:none;margin-top:6px' });
        const segs = daySegments(rec.hourly, d.date);
        const dayHums = segs.map((s) => s.hum).filter((v) => v != null);
        const dayHum = dayHums.length ? Math.round(dayHums.reduce((a, b) => a + b, 0) / dayHums.length) : null;
        detail.append(h('div', { class: 'muted', style: 'margin:4px 0 6px' },
          `Feels ${fmtTemp(d.appMin)}–${fmtTemp(d.appMax)} · Rain ${d.precip != null ? fmtPrecip(d.precip) : '–'}${dayHum != null ? ` · Humidity ${dayHum}%` : ''} · UV ${d.uv != null ? Math.round(d.uv) : '–'} · Wind to ${fmtWind(d.windMax)} · ☀ ${wxTime(d.sunrise)}–${wxTime(d.sunset)}`));
        if (segs.length) {
          segs.forEach((s) => {
            const [sl, se] = wmo(s.code);
            detail.append(h('div', { class: 'row-between', style: 'padding:5px 0;border-top:1px solid rgba(0,0,0,0.06)' }, [
              h('span', { style: 'min-width:78px;font-weight:600' }, s.label),
              h('span', { style: 'font-size:18px' }, se),
              h('span', { class: 'muted grow', style: 'margin:0 8px;text-align:left' }, `${sl} · 💧${s.pp}%${s.hum != null ? ` · Humidity ${s.hum}%` : ''}`),
              h('span', {}, `${fmtTemp(s.tmin)}/${fmtTemp(s.tmax)}`),
            ]));
          });
        } else {
          detail.append(h('p', { class: 'muted' }, 'Hourly breakdown unavailable — tap Refresh while online.'));
        }
        const head = h('button', {
          style: 'display:block;width:100%;background:none;border:none;padding:6px 0;text-align:left;cursor:pointer;font:inherit;color:inherit;border-top:1px solid rgba(0,0,0,0.07)',
          onclick: () => { detail.style.display = detail.style.display === 'none' ? 'block' : 'none'; },
        }, [
          h('div', { class: 'row-between' }, [
            h('span', { style: 'min-width:104px;font-weight:700' }, wxDayDate(d.date)),
            h('span', { style: 'font-size:20px' }, de),
            h('span', { class: 'muted grow', style: 'margin:0 8px' }, `${dl}${d.rainProb != null ? ` · 💧${d.rainProb}%` : ''}`),
            h('span', { style: 'font-weight:700' }, `${fmtTemp(d.tmin)} / ${fmtTemp(d.tmax)}`),
            h('span', { class: 'muted', style: 'margin-left:6px' }, '⌄'),
          ]),
        ]);
        fc.append(head, detail);
      });
      body.append(fc);
      body.append(h('p', { class: 'muted', style: 'text-align:center' }, `Last updated ${wxAgo(rec.fetchedAt)}${navigator.onLine ? '' : ' · offline'}`));
    }
    const refreshBtn = h('button', { class: 'btn block' }, 'Refresh (needs internet)');
    refreshBtn.addEventListener('click', async () => {
      refreshBtn.textContent = 'Refreshing…'; refreshBtn.disabled = true;
      const r = await refreshWeather(spot); paint(r, false);
    });
    body.append(refreshBtn);
  }

  const cached = getCachedWeather(weatherKey);
  paint(cached, !cached && online());
  // Background refresh only if the traveller has opted online; repaint if still here.
  if (online()) {
    refreshWeather(spot).then((r) => {
      if ((location.hash || '').startsWith('#weather') && spotKey(spot) === weatherKey && r) paint(r, false);
    });
  }
  mount(wrap, '#home');
}

// ---- TRANSPORT SCHEDULES (curated reference, ships with the app) -------------
// The timetable is data built into the app bundle — it updates when the app
// updates. (An in-page "re-sync" fetch would be answered cache-first by the
// service worker and silently discarded, so we do not pretend to sync.)
let schedCountry = '';
function scheduleCard(s) {
  const c = getCountry(s.country);
  return h('div', { class: 'card' }, [
    h('div', { class: 'row-between' }, [
      h('strong', {}, `${c ? c.flag + ' ' : ''}${s.from} → ${s.to}`),
      h('span', { class: 'cat-tag' }, s.mode),
    ]),
    h('div', { class: 'muted', style: 'margin:2px 0' }, `${s.operator} · ~${s.durationHrs[0]}–${s.durationHrs[1]} h · verified ${s.verified}`),
    h('div', { style: 'display:flex;flex-wrap:wrap;gap:6px;margin:8px 0' }, s.departures.map((t) => h('span', { class: 'cat-tag' }, t))),
    s.note ? h('p', { class: 'muted', style: 'margin:4px 0' }, s.note) : null,
    s.book ? h('a', { class: 'btn ghost', href: s.book, target: '_blank', rel: 'noopener' }, 'Check / book ↗') : null,
  ]);
}
function schedulesScreen(country) {
  if (country && getCountry(country)) { activeCountry = country; schedCountry = country; }
  const wrap = h('div', { class: 'screen' });
  wrap.append(topbar('Transport schedules', '#home'));
  wrap.append(h('p', { class: 'map-hint' }, 'Reference departure times for popular routes — guidance only; always reconfirm with the operator or the booking links below.'));

  const filters = [{ id: '', name: 'All', flag: '🌏' }].concat(COUNTRIES.map((c) => ({ id: c.id, name: c.name, flag: c.flag })));
  const chips = h('div', { class: 'chips' }, filters.map((f) =>
    h('button', { class: 'chip', 'aria-pressed': schedCountry === f.id ? 'true' : 'false', dataset: { c: f.id },
      onclick: () => { schedCountry = f.id; chips.querySelectorAll('.chip').forEach((x) => x.setAttribute('aria-pressed', x.dataset.c === f.id ? 'true' : 'false')); renderList(); } },
      `${f.flag} ${f.name}`)));
  wrap.append(chips);

  wrap.append(h('p', { class: 'muted', style: 'text-align:center;margin:6px 0' },
    `Reference timetable, verified ${SCHEDULES_VERIFIED} · built into the app and updated with app updates`));

  const listEl = h('div', {});
  wrap.append(listEl);
  function renderList() {
    listEl.innerHTML = '';
    const rows = schedCountry ? schedulesForCountry(schedCountry) : SCHEDULES;
    if (!rows.length) { listEl.append(h('p', { class: 'empty' }, 'No reference schedules for this country yet.')); return; }
    rows.forEach((s) => listEl.append(scheduleCard(s)));
  }
  renderList();
  mount(wrap, '#home');
}

// ---- DAY SUGGESTIONS (weather + nearby highly-rated) ------------------------
let dayUserLoc = null;   // GPS captured this session, for "near me" sorting
function haversineKm(a, b) {
  const R = 6371, dLat = (b.lat - a.lat) * Math.PI / 180, dLng = (b.lng - a.lng) * Math.PI / 180;
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * Math.PI / 180) * Math.cos(b.lat * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}
function moodLine(m) {
  return m === 'wet' ? 'a good day for indoor culture, markets and cafes.'
    : m === 'hot' ? 'do outdoor sights early, then escape the midday heat indoors.'
    : 'great for outdoor sights and nature.';
}

function daySuggestScreen(country) {
  const explicit = country && getCountry(country) ? country : null;
  if (explicit) activeCountry = explicit;
  const fs = focusSpot(explicit || undefined);
  const spot = fs.spot;
  const id = getCountry(spot.country) ? spot.country : (getCountry(activeCountry) ? activeCountry : 'th');
  activeCountry = id;
  const c = getCountry(id);
  const wrap = h('div', { class: 'screen' });
  wrap.append(topbar('Today’s plan', '#home'));
  // Be explicit about WHERE these picks are for, so someone in Chiang Mai never silently
  // gets Bangkok: GPS wins, else the city they are looking at, else the country default.
  const scopeMsg = fs.source === 'gps' ? `📍 Near ${spot.city} — from your location`
    : fs.source === 'focus' ? `📍 ${spot.city} — the place you’re looking at`
    : `📍 ${spot.city} — turn on location or open a city for local picks`;
  wrap.append(h('p', { class: 'map-hint' }, `${scopeMsg}. Weighing today’s weather and the highest-rated places (your own ratings count first).`));
  const locBtn = h('button', { class: 'btn ghost block', onclick: async () => {
    locBtn.textContent = 'Locating…'; locBtn.disabled = true;
    try { setLastFix(await geolocate()); go('#today'); return; } catch { /* denied/offline */ }
    locBtn.textContent = '📍 Location unavailable'; locBtn.disabled = false;
  } }, fs.source === 'gps' ? '📍 Update my location' : '📍 Use my location');
  wrap.append(locBtn);
  const body = h('div', {});
  wrap.append(body);

  function paint(rec) {
    body.innerHTML = '';
    const today = rec && rec.daily && rec.daily[0];
    let mood = 'clear';
    if (today) { if (isWet(today.code) || (today.rainProb || 0) >= 60) mood = 'wet'; else if (today.tmax != null && today.tmax >= 34) mood = 'hot'; }
    if (today) {
      const [lbl, emo] = wmo(today.code);
      const hum = rec.current && rec.current.humidity != null ? rec.current.humidity : null;
      const muggy = hum != null && hum >= 75 && mood !== 'wet';
      body.append(h('div', { class: 'card' }, [
        h('div', { class: 'row-between' }, [
          h('strong', {}, `${emo} ${c.flag} ${spot.city} today`),
          h('span', { style: 'font-weight:700' }, `${fmtTemp(today.tmin)} / ${fmtTemp(today.tmax)}`),
        ]),
        h('p', { class: 'muted', style: 'margin:6px 0 0' }, `${lbl} · rain ${today.rainProb != null ? today.rainProb + '%' : '–'}${hum != null ? ` · humidity ${hum}%` : ''} — ${moodLine(mood)}${muggy ? ' Humid — hydrate and pace yourself.' : ''}`),
      ]));
    } else {
      body.append(h('div', { class: 'card' }, [h('p', { class: 'muted' }, 'Connect once to load today’s weather for weather-aware picks; meanwhile, here are the top-rated places.')]));
    }
    const OUTDOOR = ['nature', 'waterfall', 'hike', 'park', 'beach', 'viewpoint', 'outdoors', 'island', 'dive', 'snorkel', 'garden'];
    const isOutdoor = (p) => (p.categories || []).some((cat) => OUTDOOR.includes(cat));
    const prefer = mood === 'wet' ? ['culture', 'food', 'market', 'museum', 'temple', 'cafe', 'nightlife', 'shopping', 'wellness']
      : mood === 'hot' ? ['culture', 'food', 'nature', 'nightlife'] : ['nature', 'culture', 'food', 'nightlife'];
    // Anchor distance to where the traveller actually is: their GPS fix if that is the
    // active source, otherwise the focused city's coordinates. This is what stops a
    // Chiang Mai traveller from being ranked into Bangkok's (higher-rated) places.
    const gf = getLastFix();
    const anchor = dayUserLoc || ((fs.source === 'gps' && gf) ? gf : { lat: spot.lat, lng: spot.lng });
    let scored = allPlaces({ country: id }).map((p) => {
      const er = effectiveRating(p.id, p.rating || 0);
      const catBonus = (p.categories || []).some((cat) => prefer.includes(cat)) ? 0.3 : 0;
      const outdoorPenalty = (mood === 'wet' && isOutdoor(p)) ? 1.6 : 0;
      const dist = (anchor && p.coords) ? haversineKm(anchor, p.coords) : null;
      return { p, er, dist, catBonus, outdoorPenalty, outdoor: isOutdoor(p) };
    }).filter((x) => x.er > 0 || x.p.coords);
    // Keep it to what is actually reachable from here; widen only if the area is sparse.
    const NEAR_KM = 150;
    let pool = scored.filter((x) => x.dist != null && x.dist <= NEAR_KM);
    const widened = pool.length < 6;
    if (widened) pool = scored;
    if (mood === 'wet') {
      const indoor = pool.filter((x) => !x.outdoor);
      if (indoor.length >= 4) pool = indoor;   // hide outdoor picks entirely when enough indoor options exist
    }
    pool.forEach((x) => { x.score = x.er + x.catBonus - x.outdoorPenalty - (x.dist != null ? Math.min(x.dist, 200) / 90 : 1.4); });
    pool.sort((a, b) => b.score - a.score);
    const top = pool.slice(0, 8);
    const nearCity = !widened ? ` near ${spot.city}` : '';
    const secLabel = mood === 'wet' ? `Indoor-friendly for the rain${nearCity}` : `Highly rated${nearCity}`;
    body.append(h('h2', { class: 'home-section' }, secLabel));
    if (!top.length) { body.append(h('p', { class: 'empty' }, 'No places to suggest yet for this country.')); return; }
    top.forEach(({ p, er, dist }) => {
      body.append(h('button', { class: 'card species-card', onclick: () => go(`#place-${p.id}`) }, [
        h('span', { class: 'species-emoji', style: `color:${ratingColor(er)}` }, '●'),
        h('span', { class: 'grow' }, [
          h('div', { class: 'en' }, p.name),
          h('div', { class: 'sci' }, `${(p.categories || []).join(', ')}${dist != null ? ' · ' + (dist < 10 ? dist.toFixed(1) : Math.round(dist)) + ' km' : ''}`),
        ]),
        er ? h('span', { class: 'stars-static' }, starsStr(er)) : null,
      ]));
    });
  }

  let lastRec = getCachedWeather(spotKey(spot));
  paint(lastRec);
  if (online()) {
    refreshWeather(spot).then((r) => { if (r && (location.hash || '').startsWith('#today')) { lastRec = r; paint(r); } });
  }
  mount(wrap, '#home');
}

// ---- FESTIVALS & EVENTS -----------------------------------------------------
function todayISO() { try { return new Date().toISOString().slice(0, 10); } catch { return '2026-01-01'; } }
function addDaysISO(iso, n) {
  try { const d = new Date(iso + 'T00:00:00'); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); }
  catch { return iso; }
}
function evShort(d) {
  try { return new Date(d + 'T00:00:00').toLocaleDateString(undefined, { day: 'numeric', month: 'short' }); }
  catch { return d; }
}
// Compact festival date label: "13 Apr – 15 Apr 2026" or "24 Nov 2026".
function evRange(e) {
  const y = (e.start || '').slice(0, 4);
  if (e.end && e.end !== e.start) return `${evShort(e.start)} – ${evShort(e.end)} ${y}`;
  return `${evShort(e.start)} ${y}`;
}
function eventTypeLabel(t) { return t === 'holiday' ? 'Public holiday' : (t === 'observance' ? 'Observance' : 'Festival'); }

// The window festivals are matched against: the span of the user's own calendar
// entries if any exist, otherwise today through +90 days.
function tripWindow() {
  const dates = store.calendar.items.map((i) => i.date).filter(Boolean).sort();
  if (dates.length) return { start: dates[0], end: dates[dates.length - 1] };
  const t = todayISO();
  return { start: t, end: addDaysISO(t, 90) };
}
function festivalsInWindow() {
  const { start, end } = tripWindow();
  return allEvents().filter((e) => e.end >= start && e.start <= end)
    .sort((a, b) => (a.start < b.start ? -1 : a.start > b.start ? 1 : 0));
}
function addEventToCalendar(e, btn) {
  addCalendarItem({
    date: e.start, time: '', type: 'festival',
    title: `${e.flag || ''} ${e.name}`.trim(),
    place: (e.regions && e.regions[0]) || e.countryName || '',
    cost: '', currency: '', rating: 0, note: e.impact || '',
  });
  if (btn) { btn.textContent = 'Added ✓'; btn.disabled = true; }
}

function eventCard(e) {
  const addBtn = h('button', { class: 'btn ghost' }, 'Add to plan');
  addBtn.addEventListener('click', () => addEventToCalendar(e, addBtn));
  return h('div', { class: 'card' }, [
    h('div', { class: 'row-between' }, [
      h('strong', {}, `${e.flag || ''} ${e.name}`),
      h('span', { class: 'cat-tag' }, eventTypeLabel(e.type)),
    ]),
    e.localName ? h('div', { class: 'native', lang: scriptLang(e.country) }, e.localName) : null,
    h('div', { class: 'muted', style: 'margin:2px 0' }, `${evRange(e)}${e.lunar ? ' · date varies yearly' : ''} · ${(e.regions && e.regions[0]) || e.countryName}`),
    h('p', { style: 'margin:8px 0 6px' }, e.blurb),
    h('div', { class: 'row-between' }, [
      h('button', { class: 'btn ghost', onclick: () => go(`#event-${e.id}`) }, 'Details'),
      addBtn,
    ]),
  ]);
}

let eventsCountry = '';
function eventsScreen(country) {
  if (country) eventsCountry = country;
  const wrap = h('div', { class: 'screen' });
  wrap.append(topbar('Festivals & events', '#home'));
  wrap.append(h('p', { class: 'map-hint' }, 'Major festivals and public holidays with 2026 dates. Movable (lunar) dates shift each year — confirm locally. Tap “Add to plan” to place one on your calendar.'));

  const filters = [{ id: '', name: 'All', flag: '🌏' }].concat(COUNTRIES.map((c) => ({ id: c.id, name: c.name, flag: c.flag })));
  const chips = h('div', { class: 'chips' }, filters.map((f) =>
    h('button', { class: 'chip', 'aria-pressed': eventsCountry === f.id ? 'true' : 'false', dataset: { c: f.id },
      onclick: () => { eventsCountry = f.id; chips.querySelectorAll('.chip').forEach((x) => x.setAttribute('aria-pressed', x.dataset.c === f.id ? 'true' : 'false')); renderEvents(); } },
      `${f.flag} ${f.name}`)));
  wrap.append(chips);

  const listEl = h('div', {});
  wrap.append(listEl);
  function renderEvents() {
    listEl.innerHTML = '';
    const today = todayISO();
    let evs = eventsCountry
      ? getEvents(eventsCountry).map((e) => { const c = getCountry(eventsCountry); return { ...e, country: c.id, countryName: c.name, flag: c.flag }; })
      : allEvents();
    evs = evs.sort((a, b) => (a.start < b.start ? -1 : a.start > b.start ? 1 : 0));
    const upcoming = evs.filter((e) => e.end >= today);
    const past = evs.filter((e) => e.end < today);
    if (upcoming.length) { listEl.append(h('h2', { class: 'cat-title' }, 'Upcoming')); upcoming.forEach((e) => listEl.append(eventCard(e))); }
    if (past.length) { listEl.append(h('h2', { class: 'cat-title' }, 'Earlier in 2026')); past.forEach((e) => listEl.append(eventCard(e))); }
    if (!evs.length) listEl.append(h('p', { class: 'empty' }, 'No festivals listed.'));
  }
  renderEvents();
  mount(wrap, '#home');
}

function eventScreen(id) {
  const e = getEvent(id);
  const wrap = h('div', { class: 'screen' });
  wrap.append(topbar(e ? e.name : 'Festival', '#events'));
  if (!e) { wrap.append(h('p', { class: 'empty' }, 'Not found.')); mount(wrap, '#home'); return; }
  const card = h('div', { class: 'card' }, [
    h('div', { class: 'row-between' }, [
      h('strong', {}, `${e.flag || ''} ${e.name}`),
      h('span', { class: 'cat-tag' }, eventTypeLabel(e.type)),
    ]),
    e.localName ? h('div', { class: 'native', lang: scriptLang(e.country) }, e.localName) : null,
    h('div', { class: 'muted', style: 'margin:4px 0' }, `${evRange(e)} · ${e.countryName}`),
    e.lunar ? h('div', { class: 'muted' }, '↻ Movable date — shifts each year.') : null,
    h('p', {}, e.blurb),
  ]);
  card.append(h('h3', {}, 'When'), h('p', {}, e.rule));
  card.append(h('h3', {}, 'Where'), h('p', {}, (e.regions || []).join(' · ')));
  card.append(h('h3', {}, 'What it means for you'), h('p', {}, e.impact));
  if (e.sources && e.sources.length) card.append(h('p', { class: 'muted', style: 'margin-top:10px' }, `Sources: ${e.sources.join('; ')}`));
  wrap.append(card);
  const addBtn = h('button', { class: 'btn block' }, 'Add to my calendar');
  addBtn.addEventListener('click', () => addEventToCalendar(e, addBtn));
  wrap.append(addBtn);
  mount(wrap, '#home');
}

// ---- NATURE FIELD GUIDE -----------------------------------------------------
let natureQuery = '';
let natureGroup = '';
function imageSearch(q) { return 'https://www.google.com/search?tbm=isch&q=' + encodeURIComponent(q); }

// ---- ANIMAL SOUNDS (streamed online; iNaturalist — public, no key) ----------
// Calls stream from iNaturalist over an <audio> element (its audio hosts are in the
// page CSP media-src; the API host is in connect-src). We look up Creative-Commons
// recordings by scientific name and play the top-voted one in-app, crediting the
// recordist. If the network/API is unavailable or has no recording, we fall back to
// opening a Xeno-canto page so the call is still reachable (a plain new-tab
// navigation, not subject to CSP). No audio is bundled, so offline the control just
// says it needs a connection. A species may optionally carry sound:{ xcQuery, page }
// to override the sciName-derived lookup.
const CALL_GROUPS = ['bird', 'mammal', 'insect', 'reptile', 'danger'];
function hasCall(s) { return !!s && CALL_GROUPS.includes(s.group); }
function xcQuery(s) { return (s && s.sound && s.sound.xcQuery) || (s && s.sciName) || (s && s.commonName) || ''; }
function xcPageUrl(s) { return (s && s.sound && s.sound.page) || `https://xeno-canto.org/explore?query=${encodeURIComponent(xcQuery(s))}`; }
function inatSoundUrl(s) {
  return `https://api.inaturalist.org/v1/observations?taxon_name=${encodeURIComponent(xcQuery(s))}`
    + '&sounds=true&order_by=votes&per_page=12&license=cc-by,cc-by-nc,cc-by-sa,cc-by-nc-sa,cc0';
}
let callAudio = null;   // one shared element so starting a call stops the previous one
async function playCall(s, btn, statusEl) {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) { statusEl.textContent = 'Connect to the internet to hear calls.'; return; }
  const original = btn.textContent;
  btn.disabled = true; btn.textContent = 'Loading call…'; statusEl.textContent = '';
  try {
    const res = await fetch(inatSoundUrl(s));
    const d = await res.json();
    let snd = null;
    for (const r of (d.results || [])) { const a = (r.sounds || []).find((x) => x && x.file_url); if (a) { snd = a; break; } }
    if (!snd) throw new Error('no recording');
    if (callAudio) { try { callAudio.pause(); } catch { /* ignore */ } }
    callAudio = new Audio(snd.file_url);
    callAudio.addEventListener('error', () => { statusEl.textContent = 'Could not stream here — opening a recording online…'; window.open(xcPageUrl(s), '_blank', 'noopener'); });
    await callAudio.play();
    const credit = (snd.attribution || '').replace(/^\(c\)\s*/, '').replace(/,\s*some rights reserved.*$/i, '') || 'an iNaturalist contributor';
    statusEl.textContent = `♪ ${s.commonName} — ${credit} · via iNaturalist (CC)`;
  } catch (e) {
    statusEl.textContent = 'Opening a recording online…';
    window.open(xcPageUrl(s), '_blank', 'noopener');
  } finally {
    btn.disabled = false; btn.textContent = original;
  }
}
function callControl(s, label) {
  const status = h('div', { class: 'muted', style: 'font-size:13px;margin-top:4px' });
  const btn = h('button', { class: 'btn ghost', onclick: () => playCall(s, btn, status) }, label || '🔊 Hear its call');
  return h('div', {}, [btn, status]);
}

function soundsScreen() {
  const wrap = h('div', { class: 'screen' });
  wrap.append(topbar('Sounds around you', '#nature'));
  wrap.append(h('p', { class: 'map-hint' }, 'Hear a call and learn what makes it. Tap ▶ to play (streams online); tap a name for the full field guide. Calls stream from iNaturalist (Creative Commons); if none is found, a Xeno-canto page opens instead.'));
  const GROUPS = [{ id: 'bird', label: 'Birds', emoji: '🐦' }, { id: 'mammal', label: 'Mammals', emoji: '🐘' }, { id: 'insect', label: 'Insects', emoji: '🦗' }, { id: 'reptile', label: 'Frogs & reptiles', emoji: '🐸' }];
  let group = 'bird';
  const chips = h('div', { class: 'chips' }, GROUPS.map((g) =>
    h('button', { class: 'chip', 'aria-pressed': group === g.id ? 'true' : 'false', dataset: { g: g.id },
      onclick: () => { group = g.id; chips.querySelectorAll('.chip').forEach((c) => c.setAttribute('aria-pressed', c.dataset.g === group ? 'true' : 'false')); renderList(); } },
      `${g.emoji} ${g.label}`)));
  wrap.append(chips);
  if (typeof navigator !== 'undefined' && navigator.onLine === false) wrap.append(h('p', { class: 'muted' }, 'You are offline — playing a call needs a connection. The names and field guide still work.'));
  const listEl = h('div', {});
  wrap.append(listEl);
  function renderList() {
    listEl.innerHTML = '';
    const results = allSpecies({ group }).filter(hasCall);
    if (!results.length) { listEl.append(h('p', { class: 'empty' }, 'No species in this group yet.')); return; }
    results.forEach((s) => {
      const status = h('div', { class: 'muted', style: 'font-size:13px' });
      const play = h('button', { class: 'btn ghost', 'aria-label': `Play ${s.commonName} call`, onclick: (e) => { e.stopPropagation(); playCall(s, play, status); } }, '▶');
      listEl.append(h('div', { class: 'card', style: 'display:flex;align-items:center;gap:10px' }, [
        h('span', { class: 'species-emoji' }, s.emoji || '🔎'),
        h('button', { class: 'grow', style: 'background:none;border:none;text-align:left;cursor:pointer;font:inherit;color:inherit', onclick: () => go(`#species-${s.id}`) }, [
          h('div', { class: 'en' }, s.commonName), h('div', { class: 'sci' }, s.sciName || ''), status,
        ]),
        play,
      ]));
    });
  }
  renderList();
  mount(wrap, '#home');
}

function natureScreen() {
  const wrap = h('div', { class: 'screen' });
  wrap.append(topbar('Identify nature', '#home'));
  wrap.append(h('p', { class: 'map-hint' }, 'Browse or search the region’s wildlife and plants. Tap a species for field marks and a photo search.'));

  const search = h('input', { class: 'search', type: 'search', 'aria-label': 'Search', placeholder: 'Search by name…', value: natureQuery,
    oninput: debounce((e) => { natureQuery = e.target.value; renderList(); }, 120) });
  wrap.append(search);

  const groups = [{ id: '', label: 'All', emoji: '✶' }].concat(NATURE_GROUPS);
  const groupChips = h('div', { class: 'chips' }, groups.map((g) =>
    h('button', { class: 'chip', 'aria-pressed': natureGroup === g.id ? 'true' : 'false', dataset: { g: g.id },
      onclick: () => { natureGroup = g.id; groupChips.querySelectorAll('.chip').forEach((c) => c.setAttribute('aria-pressed', c.dataset.g === g.id ? 'true' : 'false')); renderList(); } },
      `${g.emoji} ${g.label}`)));
  wrap.append(groupChips);
  wrap.append(h('button', { class: 'btn ghost block', style: 'margin:6px 0', onclick: () => go('#sounds') }, '🔊 Sounds around you — hear calls'));

  wrap.append(h('div', { class: 'card' }, [
    h('p', { class: 'muted', style: 'margin:0 0 8px' }, 'Have a photo? Identify it online (needs internet):'),
    h('div', { class: 'row-between' }, [
      h('a', { class: 'btn ghost', href: 'https://lens.google.com/', target: '_blank', rel: 'noopener' }, 'Google Lens ↗'),
      h('a', { class: 'btn ghost', href: 'https://www.inaturalist.org/observations/identify', target: '_blank', rel: 'noopener' }, 'iNaturalist ↗'),
    ]),
  ]));

  const listEl = h('div', {});
  wrap.append(listEl);
  function renderList() {
    listEl.innerHTML = '';
    const results = allSpecies({ q: natureQuery.trim(), group: natureGroup });
    if (!results.length) {
      listEl.append(h('p', { class: 'empty' }, allSpecies().length === 0
        ? 'The nature guide is being prepared — reconnect once to download it.'
        : 'No species match. Try a different search or group.'));
      return;
    }
    results.forEach((s) => listEl.append(speciesCard(s)));
  }
  renderList();
  mount(wrap, '#home');
}

function speciesCard(s) {
  const g = NATURE_GROUPS.find((x) => x.id === s.group);
  return h('button', { class: 'card species-card', onclick: () => go(`#species-${s.id}`) }, [
    h('span', { class: 'species-emoji' }, s.emoji || (g && g.emoji) || '🔎'),
    h('span', { class: 'grow' }, [h('div', { class: 'en' }, s.commonName), h('div', { class: 'sci' }, s.sciName || '')]),
    s.dangerous ? h('span', { class: 'tier high' }, 'Caution') : null,
  ]);
}

function speciesScreen(id) {
  const s = getSpecies(id);
  const wrap = h('div', { class: 'screen' });
  wrap.append(topbar(s ? s.commonName : 'Species', '#nature'));
  if (!s) { wrap.append(h('p', { class: 'empty' }, 'Not found.')); mount(wrap, '#home'); return; }
  const g = NATURE_GROUPS.find((x) => x.id === s.group);
  const card = h('div', { class: 'card' }, [
    h('div', { class: 'species-head' }, [
      h('span', { class: 'species-emoji big' }, s.emoji || (g && g.emoji) || '🔎'),
      h('div', {}, [h('h2', {}, s.commonName), s.sciName ? h('div', { class: 'sci' }, s.sciName) : null,
        g ? h('span', { class: 'cat-tag' }, g.label) : null]),
    ]),
    s.dangerous ? h('div', { class: 'warn-note' }, s.dangerNote || 'Potentially dangerous — keep your distance.') : null,
    photoBlock(s, s.commonName),
    s.blurb ? h('p', {}, s.blurb) : null,
  ]);
  if (s.idTips) card.append(h('h3', {}, 'How to identify'), h('p', {}, s.idTips));
  if (s.habitat) card.append(h('h3', {}, 'Habitat'), h('p', {}, s.habitat));
  if (s.where) card.append(h('h3', {}, 'Where you might see it'), h('p', {}, s.where));
  const sLangs = [['th', '🇹🇭', 'th-TH'], ['vi', '🇻🇳', 'vi-VN'], ['km', '🇰🇭', 'km-KH'], ['lo', '🇱🇦', 'lo-LA']];
  if (s.names && sLangs.some(([k]) => s.names[k])) {
    card.append(h('h3', {}, 'Local names (tap 🔊 to hear)'));
    card.append(h('div', { style: 'display:flex;flex-wrap:wrap;gap:6px;margin:4px 0' },
      sLangs.filter(([k]) => s.names[k]).map(([k, flag, loc]) => (canSay(loc)
        ? h('button', { class: 'cat-tag', style: 'cursor:pointer;border:none', onclick: () => say(s.names[k], loc) }, `${flag} ${s.names[k]} 🔊`)
        : h('span', { class: 'cat-tag' }, `${flag} ${s.names[k]}`)))));
  } else if (s.localNames && s.localNames.length) {
    card.append(h('p', { class: 'muted' }, `Local names: ${s.localNames.join(', ')}`));
  }
  if (hasCall(s)) { card.append(h('h3', {}, 'Its call')); card.append(callControl(s)); }
  wrap.append(card);
  wrap.append(h('a', { class: 'btn block', href: imageSearch(`${s.commonName} ${s.sciName || ''}`), target: '_blank', rel: 'noopener' }, 'Search photos to confirm ↗'));
  mount(wrap, '#home');
}

// ---- BEST OF / RECOMMENDATIONS ----------------------------------------------
const FORWHO_EMOJI = { families: '👨‍👩‍👧', couples: '💑', everyone: '⭐', budget: '🪙', foodies: '🍜', adventure: '🧗', nightlife: '🍸', firsttimers: '🧭' };
function bestofScreen(countryId) {
  if (countryId) activeCountry = countryId;
  const wrap = h('div', { class: 'screen' });
  wrap.append(topbar('Best of', '#home'));
  wrap.append(countryChips((id) => go(`#bestof-${id}`)));
  const lists = bestForCountry(activeCountry);
  if (!lists.length) { wrap.append(h('p', { class: 'empty' }, 'Top picks are being prepared — reconnect once to download them.')); mount(wrap, '#home'); return; }
  // family lists first
  const ordered = lists.slice().sort((a, b) => (a.forWho === 'families' ? -1 : 0) - (b.forWho === 'families' ? -1 : 0));
  ordered.forEach((l) => wrap.append(h('button', { class: 'card bestof-card', onclick: () => go(`#bestlist-${l.id}`) }, [
    h('div', { class: 'place-head' }, [h('h2', {}, `${FORWHO_EMOJI[l.forWho] || '⭐'} ${l.title}`), h('span', { class: 'cat-tag' }, `${(l.items || []).length}`)]),
    l.blurb ? h('p', { class: 'muted' }, l.blurb) : null,
  ])));
  mount(wrap, '#home');
}

function bestListScreen(id) {
  const l = getBestList(id);
  const wrap = h('div', { class: 'screen' });
  wrap.append(topbar(l ? l.title : 'List', `#bestof-${l ? l.country : ''}`));
  if (!l) { wrap.append(h('p', { class: 'empty' }, 'List not found.')); mount(wrap, '#home'); return; }
  if (l.blurb) wrap.append(h('p', { class: 'map-hint' }, l.blurb));
  (l.items || []).forEach((it, i) => {
    const card = h('div', { class: 'card' }, [
      h('div', { class: 'place-head' }, [h('h2', {}, `${i + 1}. ${it.name}`), it.rating ? h('span', { class: 'stars-static' }, `${starsStr(it.rating)} ${Number(it.rating).toFixed(1)}`) : null]),
      it.city ? h('p', { class: 'muted' }, it.city) : null,
      it.why ? h('p', {}, it.why) : null,
    ]);
    if (it.sources && it.sources.length) card.append(h('p', { class: 'disclaimer' }, `Sources: ${it.sources.map((s) => s.org || s).join(', ')}`));
    card.append(h('a', { class: 'btn ghost', href: mapsUrl({ mapQuery: it.mapQuery || `${it.name} ${it.city || ''}` }), target: '_blank', rel: 'noopener' }, 'Open in Maps ↗'));
    wrap.append(card);
  });
  wrap.append(h('p', { class: 'disclaimer' }, 'Curated from multiple public sources; tap through for live reviews. Verify hours and prices locally.'));
  mount(wrap, '#home');
}

// ---- TRIP PLANNER (itinerary + budget) --------------------------------------
function tripScreen() {
  const wrap = h('div', { class: 'screen' });
  wrap.append(topbar('My Trip', '#home'));

  // itinerary
  const itin = h('div', { class: 'card' }, [h('h2', {}, 'Itinerary')]);
  const stops = store.trip.stops;
  if (!stops.length) itin.append(h('p', { class: 'muted' }, 'Add the places or cities you plan to visit, in order.'));
  stops.forEach((s, i) => itin.append(h('div', { class: 'row-between trip-stop' }, [
    h('div', {}, [h('strong', {}, `${i + 1}. ${s.title}`), s.date ? h('div', { class: 'muted' }, s.date) : null]),
    h('div', { class: 'cats' }, [
      h('button', { class: 'chip', 'aria-label': 'Move up', disabled: i === 0 ? '' : null, onclick: () => { moveStop(s.id, -1); go('#trip'); } }, '↑'),
      h('button', { class: 'chip', 'aria-label': 'Move down', disabled: i === stops.length - 1 ? '' : null, onclick: () => { moveStop(s.id, 1); go('#trip'); } }, '↓'),
      h('button', { class: 'chip', 'aria-label': 'Remove', onclick: () => { removeStop(s.id); go('#trip'); } }, '✕'),
    ]),
  ])));
  const stopName = h('input', { type: 'text', placeholder: 'Place or city' });
  const stopDate = h('input', { type: 'date' });
  itin.append(h('div', { class: 'field', style: 'margin-top:10px' }, [h('label', {}, 'Add a stop'), stopName, stopDate,
    h('button', { class: 'btn', style: 'margin-top:8px', onclick: () => { if (stopName.value.trim()) { addStop({ title: stopName.value.trim(), country: activeCountry, date: stopDate.value }); go('#trip'); } } }, 'Add stop')]));
  // quick add from saved
  const saved = store.favorites.map(resolveItem).filter(Boolean);
  if (saved.length) {
    itin.append(h('p', { class: 'muted', style: 'margin-top:10px' }, 'Quick-add from saved:'));
    itin.append(h('div', { class: 'chips' }, saved.slice(0, 12).map((p) => h('button', { class: 'chip', onclick: () => { addStop({ title: p.name, country: p.country }); go('#trip'); } }, p.name))));
  }
  wrap.append(itin);

  // share this trip with a travel companion (backendless — link carries the stops)
  if (store.trip.stops.length) {
    wrap.append(h('div', { class: 'card' }, [
      h('h3', {}, 'Share this trip'),
      h('p', { class: 'muted' }, 'Send your itinerary to a travel companion — they can copy the stops straight into their own trip.'),
      shareButton('📤 Share my trip', 'My Mekong trip', () => shareUrl('in', encodeShare('trip', { stops: store.trip.stops.map((s) => ({ t: s.title, c: s.country, d: s.date })), notes: store.trip.notes || '' }, ensureMe()))),
    ]));
  }

  // budget log
  const bud = h('div', { class: 'card' }, [h('h2', {}, 'Budget log')]);
  const home = homeCurrency();
  const totals = {};
  store.trip.budgetLog.forEach((b) => { const c = b.currency || '?'; totals[c] = (totals[c] || 0) + (parseFloat(b.amount) || 0); });
  if (Object.keys(totals).length) {
    bud.append(h('p', { class: 'fair' }, 'Total: ' + Object.entries(totals).map(([c, v]) => `${v.toLocaleString()} ${c}`).join(' · ')));
    // Single grand total converted to the traveller's home currency (live or cached
    // offline rates). Flag if any currency has no known rate so the figure is honest.
    let homeSum = 0, allKnown = true;
    for (const [c, v] of Object.entries(totals)) {
      if (c === home) { homeSum += v; continue; }
      const conv = convert(v, c, home);
      if (conv == null || isNaN(conv)) allKnown = false; else homeSum += conv;
    }
    if (homeSum > 0 && Object.keys(totals).some((c) => c !== home)) {
      bud.append(h('p', { class: 'muted', style: 'margin:-4px 0 0' },
        `≈ ${Math.round(homeSum).toLocaleString()} ${home} total${allKnown ? '' : ' (some rates unknown — refresh in Currency)'}`));
    }
  }
  store.trip.budgetLog.forEach((b) => {
    const approx = approxHome(b.amount, b.currency);   // "≈ $3.30" in the home currency, or ''
    bud.append(h('div', { class: 'row-between price-item' }, [
      h('span', {}, `${b.date} · ${b.note || 'spend'}`),
      h('span', {}, [h('strong', {}, `${b.amount} ${b.currency}`), approx ? h('span', { class: 'muted', style: 'font-size:12px' }, ` ${approx}`) : null, ' ',
        h('button', { class: 'chip', onclick: () => { deleteBudgetItem(b.id); go('#trip'); } }, '✕')]),
    ]));
  });
  const bAmt = h('input', { type: 'number', inputmode: 'decimal', placeholder: 'Amount' });
  const c = getCountry(activeCountry);
  const bCur = currencySelect(c ? c.currency : 'THB');
  const bNote = h('input', { type: 'text', placeholder: 'On what?' });
  bud.append(h('div', { class: 'field', style: 'margin-top:10px' }, [h('label', {}, 'Log a spend'), bAmt, bCur, bNote,
    h('button', { class: 'btn', style: 'margin-top:8px', onclick: () => { if (bAmt.value) { addBudgetItem({ amount: bAmt.value, currency: bCur.value, note: bNote.value.trim() }); go('#trip'); } } }, 'Add spend')]));
  wrap.append(bud);
  mount(wrap, '#home');
}

// ---- BARGAIN HELPER ---------------------------------------------------------
const BARGAIN = {
  market: { label: 'Market / souvenirs', open: 0.4, aim: 0.6, tip: 'Start around 40% of the asking price and settle near 60%. Smile, stay friendly, and be ready to walk away politely.' },
  clothing: { label: 'Clothing / tailor', open: 0.5, aim: 0.7, tip: 'Open near half; bundle several items for a better rate.' },
  tuktuk: { label: 'Tuk-tuk / taxi', open: 0.5, aim: 0.6, tip: 'Better still: insist on the meter or use Grab/Bolt for an upfront price.' },
  tour: { label: 'Tour / activity', open: 0.6, aim: 0.8, tip: 'Compare two or three operators; book direct rather than via a tout.' },
};
function bargainScreen() {
  const wrap = h('div', { class: 'screen' });
  wrap.append(topbar('Bargain helper', '#home'));
  const c = getCountry(activeCountry);
  const price = h('input', { type: 'number', inputmode: 'decimal', placeholder: 'Asking price' });
  const cur = currencySelect(c ? c.currency : 'THB');
  const ctx = selectEl(Object.entries(BARGAIN).map(([k, v]) => [k, v.label]), 'market', () => {});
  const out = h('div', { class: 'card' });
  function recompute() {
    out.innerHTML = '';
    const v = parseFloat(price.value) || 0;
    const b = BARGAIN[ctx.value];
    if (!v) { out.append(h('p', { class: 'muted' }, 'Enter the asking price to get a suggested counter-offer.')); return; }
    out.append(h('h3', {}, 'Suggested counter'));
    out.append(h('p', { class: 'fx-result' }, `Open at ${Math.round(v * b.open).toLocaleString()} ${cur.value}, aim for about ${Math.round(v * b.aim).toLocaleString()} ${cur.value}.`));
    out.append(h('p', {}, b.tip));
    out.append(h('button', { class: 'btn ghost', onclick: () => go(`#prices-${activeCountry}`) }, 'Check fair prices'));
  }
  price.addEventListener('input', debounce(recompute, 120));
  cur.addEventListener('change', recompute); ctx.addEventListener('change', recompute);
  wrap.append(h('div', { class: 'card' }, [field('Asking price', price), field('Currency', cur), field('What are you buying?', ctx)]));
  wrap.append(out);
  recompute();
  mount(wrap, '#home');
}

// ---- PRE-TRIP CHECKLIST -----------------------------------------------------
const CK_CAT = { documents: '🛂 Documents', health: '💊 Health', money: '💳 Money', connectivity: '📶 Connectivity', packing: '🎒 Packing', safety: '🛡 Safety & laws' };
function checklistScreen(countryId) {
  if (countryId) activeCountry = countryId;
  const wrap = h('div', { class: 'screen' });
  wrap.append(topbar('Pre-trip checklist', '#home'));
  wrap.append(countryChips((id) => go(`#checklist-${id}`)));
  const items = CHECKLIST[activeCountry] || [];
  if (!items.length) { wrap.append(h('p', { class: 'empty' }, 'The checklist is being prepared — reconnect once to download it.')); mount(wrap, '#home'); return; }
  const done = items.filter((it) => isChecked(it.id)).length;
  wrap.append(h('div', { class: 'banner' }, `${done} of ${items.length} done`));
  // group by category in CK_CAT order
  Object.keys(CK_CAT).forEach((cat) => {
    const group = items.filter((it) => it.cat === cat);
    if (!group.length) return;
    wrap.append(h('h2', { class: 'cat-title' }, CK_CAT[cat]));
    group.forEach((it) => {
      const row = h('label', { class: 'ck-row' }, [
        h('input', { type: 'checkbox', checked: isChecked(it.id) ? '' : null, onchange: () => { toggleChecklistItem(it.id); row.classList.toggle('done'); } }),
        h('div', { class: 'grow' }, [h('strong', {}, it.title), it.detail ? h('div', { class: 'muted' }, it.detail) : null,
          it.link ? h('a', { href: it.link, target: '_blank', rel: 'noopener' }, 'Official link ↗') : null]),
      ]);
      if (isChecked(it.id)) row.classList.add('done');
      wrap.append(row);
    });
  });
  mount(wrap, '#home');
}

// ---- GLOBAL SEARCH (find anything offline) ----------------------------------
let searchQuery = '';
function searchScreen() {
  const wrap = h('div', { class: 'screen' });
  wrap.append(topbar('Search everything', '#home'));
  wrap.append(h('input', { class: 'search', type: 'search', 'aria-label': 'Search', autofocus: '', value: searchQuery,
    placeholder: 'Find places, phrases, wildlife, prices…',
    oninput: debounce((e) => { searchQuery = e.target.value; renderResults(); }, 150) }));

  // Category filter for places. Picking one also lets you browse the nearest places of
  // that kind with no query typed (a "nearest food / nearest stay" tool when GPS is on).
  let cat = 'all';
  const CATS = [['all', 'All'], ['food', '🍜 Food'], ['stay', '🛏 Stay'], ['culture', '🏛 Culture'], ['nature', '🌿 Nature'], ['nightlife', '🌃 Nightlife']];
  const catRow = h('div', { class: 'chips', style: 'margin:6px 0' }, CATS.map(([id, lbl]) =>
    h('button', { class: 'chip', 'aria-pressed': id === 'all' ? 'true' : 'false', dataset: { c: id },
      onclick: () => { cat = id; catRow.querySelectorAll('.chip').forEach((ch) => ch.setAttribute('aria-pressed', ch.dataset.c === id ? 'true' : 'false')); renderResults(); } }, lbl)));
  wrap.append(catRow);

  const out = h('div', {});
  wrap.append(out);

  function section(title, nodes) {
    if (!nodes.length) return;
    out.append(h('h2', { class: 'cat-title' }, `${title} (${nodes.length})`));
    nodes.slice(0, 12).forEach((n) => out.append(n));
    if (nodes.length > 12) out.append(h('p', { class: 'muted' }, `…and ${nodes.length - 12} more — refine your search`));
  }
  const link = (label, hash, extra) => h('button', { class: 'btn ghost block srch', onclick: () => { if (extra) extra(); go(hash); } }, label);

  function renderResults() {
    out.innerHTML = '';
    const q = searchQuery.trim().toLowerCase();
    const fix = getLastFix();
    // Places: filter by category and/or text; when a location is known, order by distance.
    let places = allPlaces();
    if (cat !== 'all') places = places.filter((p) => placeBucket(p) === cat);
    if (q.length >= 2) places = places.filter((p) => `${p.name} ${p.blurb || ''} ${p.city || ''}`.toLowerCase().includes(q));
    if (q.length >= 2 || cat !== 'all') {
      if (fix) places = places.slice().sort((a, b) => (a.coords ? haversineKm(fix, a.coords) : Infinity) - (b.coords ? haversineKm(fix, b.coords) : Infinity));
      const catLbl = (CATS.find((x) => x[0] === cat) || [])[1] || 'Places';
      const title = cat === 'all' ? 'Places' : `${catLbl}${fix ? ' near you' : ''}`;
      section(title, places.map((p) => link(`📍 ${p.name} — ${p.city}${fix && p.coords ? ` · ${fmtDistance(haversineKm(fix, p.coords))}` : ''}`, `#place-${p.id}`)));
    }
    // The wider indexes only apply to a text query and only when not scoped to a category.
    if (q.length >= 2 && cat === 'all') {
      section('Wildlife & plants', allSpecies({ q }).map((s) => link(`${s.emoji || '🔎'} ${s.commonName}`, `#species-${s.id}`)));
      const phr = [];
      for (const b of Object.values(LANGUAGES)) for (const cate of b.categories) for (const p of cate.phrases) {
        if (`${p.en} ${p.roman || ''} ${p.script || ''}`.toLowerCase().includes(q)) phr.push(link(`💬 ${b.label}: ${p.en} — ${p.script}`, `#phrasebook-${b.lang}`));
      }
      section('Phrases', phr);
      const pr = [];
      for (const c of COUNTRIES) if (c.prices) for (const it of c.prices.items) {
        if (it.label.toLowerCase().includes(q)) pr.push(link(`💵 ${c.name}: ${it.label}`, `#prices-${c.id}`));
      }
      section('Fair prices', pr);
      section('Countries', COUNTRIES.filter((c) => c.name.toLowerCase().includes(q))
        .map((c) => link(`${c.flag} ${c.name}`, `#country-${c.id}`, () => { activeCountry = c.id; })));
    }
    if (!out.children.length) {
      out.append(h('p', { class: 'muted' }, (q.length < 2 && cat === 'all')
        ? 'Type at least two letters, or pick a category to see the nearest places to you.'
        : 'Nothing found. Try another word or category.'));
    }
  }
  renderResults();
  mount(wrap, '#home');
}

// ---- EMERGENCY / SOS --------------------------------------------------------
// Water/food safety keyed to the country you are actually in. General travel-health
// guidance for the region — tap water is not potable in any of the four, and busy,
// freshly-cooked street food is the safest bet.
const SAFETY = {
  th: {
    water: 'Do not drink the tap water. Bottled and filtered water is cheap and everywhere, with refill stations in most towns. Ice in cafés and restaurants is factory-made and generally safe.',
    food: 'Street food is a highlight and safe when the stall is busy and food is cooked fresh in front of you. Peel your own fruit, and be cautious with reheated buffet dishes left standing.',
  },
  vi: {
    water: 'Do not drink the tap water. Use bottled or filtered water; most hotels supply it free. Café and bia-hơi ice in cities is normally commercial ice and fine.',
    food: 'Busy stalls with high turnover are safest — choose freshly cooked, steaming dishes. Go easy on raw herbs you cannot wash yourself and on shellfish in hot weather.',
  },
  kh: {
    water: 'Tap water is not safe to drink. Stick to sealed bottled or filtered water and check the seal. Outside the cities, ask for drinks without ice unless you are sure it is commercial ice.',
    food: 'Eat where locals queue and food is cooked to order. Be extra careful with ice, salads and shellfish in rural areas and the hot season; peel your own fruit.',
  },
  la: {
    water: 'Do not drink the tap water. Bottled water is widely sold and refill stations exist in tourist towns. Outside the main towns, ask for no ice unless you know it is commercial.',
    food: 'Freshly grilled and boiled dishes from busy stalls are safest. Avoid raw or fermented meat/fish dishes such as laap dib — they carry a real parasite risk. Peel fruit yourself.',
  },
};

// Globally nearest listed city to a GPS fix, so the SOS screen can infer which country
// the traveller is actually in (rather than the last one they browsed).
function nearestSpotGlobal(fix) {
  let best = null, bestD = Infinity;
  for (const s of WEATHER_SPOTS) {
    const d = haversineKm(fix, { lat: s.lat, lng: s.lng });
    if (d < bestD) { bestD = d; best = s; }
  }
  return best ? { spot: best, km: bestD } : null;
}

function sosScreen(cc) {
  const wrap = h('div', { class: 'screen' });
  wrap.append(topbar('Emergency', '#home'));

  // Snap to where the traveller actually is: an explicit chip pick (cc) wins; otherwise
  // infer the country from the last GPS fix. Falls back to the browsed country with no fix.
  const fix = getLastFix();
  const near = fix ? nearestSpotGlobal(fix) : null;
  if (cc) activeCountry = cc;
  else if (near) activeCountry = near.spot.country;

  const c = getCountry(activeCountry);
  if (!c) { wrap.append(h('p', { class: 'empty' }, 'Pick a country first.')); mount(wrap, '#home'); return; }
  if (!cc && near) wrap.append(h('p', { class: 'sos-loc' }, `📍 You appear to be near ${near.spot.city}. Showing ${c.name} — not right? Pick your country:`));
  wrap.append(countryChips((id) => go(`#sos-${id}`)));

  const nums = h('div', { class: 'card sos-card' }, [h('h2', {}, `${c.flag} ${c.name} — call for help`)]);
  const em = (c.info && c.info.emergency) || [];
  if (em.length) em.forEach((e) => nums.append(h('a', { class: 'btn block sos-num', href: `tel:${String(e.number).replace(/\s/g, '')}` }, `${e.label}: ${e.number}`)));
  else nums.append(h('p', { class: 'muted' }, 'Emergency numbers are being added for this country.'));
  wrap.append(nums);

  const safe = SAFETY[activeCountry];
  if (safe) {
    wrap.append(h('div', { class: 'card' }, [
      h('h2', {}, 'Water & food safety'),
      h('p', { style: 'margin:6px 0' }, [h('strong', {}, '💧 Water: '), safe.water]),
      h('p', { style: 'margin:6px 0 0' }, [h('strong', {}, '🍢 Food: '), safe.food]),
    ]));
  }

  const book = getLanguage(c.lang);
  const emCat = book && book.categories.find((cat) => cat.id === 'emergency');
  if (emCat) {
    const pcard = h('div', { class: 'card' }, [h('h2', {}, `Say it in ${book.label}`)]);
    const voiceOk = hasVoiceFor(book.locale);
    emCat.phrases.forEach((p) => pcard.append(h('div', { class: 'phrase' }, [
      h('div', { class: 'grow' }, [h('div', { class: 'en' }, p.en), h('div', { class: 'native', lang: book.locale }, p.script), h('div', { class: 'roman' }, [h('span', { class: 'lbl' }, 'say:'), p.roman])]),
      h('button', { class: 'speak', disabled: voiceOk ? null : '', 'aria-label': `Speak ${p.en}`, onclick: () => speak(p.script, book.locale) }, '🔊'),
    ])));
    wrap.append(pcard);
  }

  // Hospital: the maps deep link needs internet, so pair it with an offline fallback —
  // show a big "I need a doctor / hospital" phrase to a local (works with no signal).
  const hosp = h('div', { class: 'card' }, [h('h2', {}, 'Get to a hospital')]);
  const mapHref = (fix && fix.lat != null)
    ? `https://www.google.com/maps/search/hospital/@${fix.lat},${fix.lng},14z`
    : 'https://www.google.com/maps/search/?api=1&query=hospital%20near%20me';
  hosp.append(h('a', { class: 'btn block', href: mapHref, target: '_blank', rel: 'noopener' }, 'Find nearest hospital (needs internet) ↗'));
  const hospPhrase = emCat && (emCat.phrases.find((p) => /hospital/i.test(p.en)) || emCat.phrases.find((p) => /doctor/i.test(p.en)));
  if (hospPhrase) hosp.append(h('button', { class: 'btn ghost block', style: 'margin-top:8px', onclick: () => showBigPhrase(hospPhrase, book.locale) }, '🪧 Show “I need a hospital” to a local (works offline)'));
  wrap.append(hosp);

  wrap.append(h('p', { class: 'disclaimer' }, 'In a serious emergency, call the number above. Show this screen to a local to ask for help. Tourist police often speak English.'));
  mount(wrap, '#home');
}

// ---- SECURE DOCUMENT VAULT --------------------------------------------------
// Passports and other documents, encrypted on-device (see js/vault.js). The UI
// re-renders into `body` after every state change so it always reflects the vault.
function vaultWarning() {
  return h('div', { class: 'banner' },
    'Documents are encrypted with your passcode and stored only on this device — never uploaded. If you forget the passcode they cannot be recovered, so keep a separate backup of anything critical.');
}
function docKind(type) {
  if (!type) return 'File';
  if (type.startsWith('image/')) return 'Image';
  if (type === 'application/pdf') return 'PDF';
  return type;
}
function vaultScreen() {
  const wrap = h('div', { class: 'screen' });
  wrap.append(topbar('Secure documents', '#home'));
  const body = h('div', {});
  wrap.append(body);
  mount(wrap, '#home');
  if (!vaultAvailable()) {
    body.append(h('div', { class: 'card' }, [
      h('h2', {}, 'Secure storage unavailable'),
      h('p', { class: 'muted' }, 'This browser does not expose the Web Crypto API in the current context. Open the app over HTTPS (or localhost) to use the encrypted vault.'),
    ]));
    return;
  }
  renderVault(body);
}
async function renderVault(body) {
  body.innerHTML = '';
  let inited = false;
  try { inited = await vaultInitialised(); } catch { /* treat as not initialised */ }
  if (!inited) { body.append(vaultSetupCard(body)); return; }
  if (!vaultUnlocked()) { body.append(vaultUnlockCard(body)); return; }

  body.append(vaultWarning());

  const fileInput = h('input', { type: 'file', accept: 'image/*,application/pdf' });
  body.append(h('div', { class: 'card' }, [
    h('h2', {}, 'Add a document'),
    h('p', { class: 'muted' }, 'Photograph or scan your passport, visa, insurance or tickets, then add the file. It is encrypted before it is saved.'),
    field('File', fileInput),
    h('button', { class: 'btn block', onclick: async () => {
      const f = fileInput.files && fileInput.files[0];
      if (!f) { alert('Choose a file first.'); return; }
      try { await vaultAdd(f); renderVault(body); } catch (e) { alert(e.message); }
    } }, 'Encrypt & save'),
  ]));

  const listCard = h('div', { class: 'card' }, [h('h2', {}, 'Your documents')]);
  body.append(listCard);
  let docs = [];
  try { docs = await vaultList(); } catch (e) { listCard.append(h('p', { class: 'muted' }, e.message)); return; }
  if (!docs.length) listCard.append(h('p', { class: 'muted' }, 'No documents yet.'));
  docs.forEach((d) => listCard.append(h('div', { class: 'row-between price-item' }, [
    h('div', { class: 'grow' }, [h('strong', {}, d.name || 'Document'), h('div', { class: 'muted' }, `${docKind(d.type)} · added ${d.createdAt}`)]),
    h('div', { class: 'cats' }, [
      h('button', { class: 'chip', onclick: async () => {
        try { const doc = await vaultGet(d.id); const u = URL.createObjectURL(doc.blob); window.open(u, '_blank', 'noopener'); setTimeout(() => URL.revokeObjectURL(u), 60000); }
        catch (e) { alert(e.message); }
      } }, 'View'),
      h('button', { class: 'chip', onclick: async () => { if (confirm(`Delete “${d.name}” from the vault?`)) { await vaultDelete(d.id); renderVault(body); } } }, '✕'),
    ]),
  ])));

  body.append(h('div', { class: 'card' }, [
    h('button', { class: 'btn ghost block', onclick: () => { vaultLock(); renderVault(body); } }, '🔒 Lock vault'),
    h('button', { class: 'btn ghost block', style: 'margin-top:8px; color:var(--warn); border-color:var(--warn)',
      onclick: async () => { if (confirm('Permanently erase the vault and every document in it? This cannot be undone.')) { try { await vaultWipe(); } catch { /* ignore */ } renderVault(body); } } }, 'Erase vault'),
  ]));
}
function vaultSetupCard(body) {
  const p1 = h('input', { type: 'password', placeholder: 'Choose a passcode (min 4 characters)' });
  const p2 = h('input', { type: 'password', placeholder: 'Confirm passcode' });
  return h('div', { class: 'card' }, [
    h('h2', {}, 'Set up your vault'),
    vaultWarning(),
    field('Passcode', p1), field('Confirm', p2),
    h('button', { class: 'btn block', onclick: async () => {
      if (p1.value !== p2.value) { alert('The passcodes do not match.'); return; }
      try { await vaultSetup(p1.value); renderVault(body); } catch (e) { alert(e.message); }
    } }, 'Create vault'),
  ]);
}
function vaultUnlockCard(body) {
  const pin = h('input', { type: 'password', placeholder: 'Passcode' });
  const err = h('p', { class: 'warn-note', style: 'display:none' });
  const submit = async () => {
    try { await vaultUnlock(pin.value); renderVault(body); }
    catch (e) { err.textContent = e.message; err.style.display = ''; }
  };
  pin.addEventListener('keydown', (e) => { if (e.key === 'Enter') submit(); });
  return h('div', { class: 'card' }, [
    h('h2', {}, 'Unlock your vault'),
    h('p', { class: 'muted' }, 'Enter your passcode to decrypt your documents on this device.'),
    field('Passcode', pin), err,
    h('button', { class: 'btn block', onclick: submit }, 'Unlock'),
  ]);
}

// ---- SETTINGS ---------------------------------------------------------------
// ---- HELP / FAQ (static, fully offline) -------------------------------------
function helpScreen() {
  const wrap = h('div', { class: 'screen' });
  wrap.append(topbar('Help & FAQ', '#home'));
  wrap.append(h('p', { class: 'map-hint' }, 'How Mekonging works, what needs internet, and how your data is kept. This page works offline.'));
  const faq = (q, a) => h('details', { class: 'card' }, [h('summary', {}, q), typeof a === 'string' ? h('p', {}, a) : a]);

  wrap.append(faq('What works offline, and what needs internet?', h('div', {}, [
    h('p', {}, 'Almost everything works with no signal, because the guide is stored on your device: the phrasebook, places, food and produce guides, the wildlife field guide, fair prices, transport routes and schedules, border crossings, pools, your journal, trip, calendar, saved places, the document vault, and the base map (coastlines, rivers, borders and your pins).'),
    h('p', {}, 'A few features need a connection, and each one says so: refreshing the weather, currency rates, live translation, the “Across the web” rating and “Compare & book” links, streamed animal calls, and satellite map imagery. Weather and rates are cached after one online refresh, so you can still read them offline.'),
  ])));
  wrap.append(faq('How do I build and log a trip?', h('div', {}, [
    h('p', {}, '“My trip” holds your itinerary (stops with dates) and a budget log that totals your spending in your home currency. “Travel calendar” schedules stays, meals and activities by day and surfaces festivals falling in your dates. “Travel journal” keeps dated, GPS-stamped entries with photos, and the “Journey map” animates the path between them.'),
    h('button', { class: 'btn ghost', onclick: () => go('#trip') }, 'Open My trip'),
  ])));
  wrap.append(faq('How do ratings work?', 'Each place shows a guidebook score synthesised from public sources, plus an “Across the web” card with snapshots from sites such as TripAdvisor — each stamped with the month it was checked — and live links to compare and book. Your own rating always counts first: rate a place and it becomes the headline score and colours its pin on the map.'));
  wrap.append(faq('Can I travel my way — with kids, a tent, or for a long stay?', 'On the Places screen you can filter by interests, budget, “Good for kids”, stay type (from a tent to a resort) and short- or long-stay. On the map, local (non-tourist) restaurants have their own red pin, and the map key explains every colour.'));
  wrap.append(faq('Where is my data kept? Is it private?', 'Everything you create — saved places, notes, reviews, pins, journal, trip and calendar — stays on this device only. There are no accounts and nothing is uploaded. The document vault (passports, tickets) is encrypted on-device and cannot be recovered if you forget its passcode. The only data that leaves your device is what you actively use online, such as a weather refresh, a translation, or tapping through to a booking site.'));
  wrap.append(faq('Finding your way around', 'The bottom tabs are Home, Talk (phrasebook), Places, Map and Saved. Search on the Home screen looks across places, food, wildlife, phrases and prices at once. Save any place with the ⭐ and organise saves into Collections. On the map you can drop a pin, set “my stay”, measure distances, and save an area for offline satellite imagery.'));

  wrap.append(h('div', { class: 'card' }, [
    h('h2', {}, 'Suggest a feature or a correction'),
    h('p', { class: 'muted' }, 'Spotted something out of date, or want a feature added? Send it over — it helps make the guide better for everyone.'),
    h('button', { class: 'btn block', onclick: () => go('#feedback') }, '✍️ Send feedback'),
  ]));
  wrap.append(h('p', { class: 'disclaimer' }, `Mekonging ${APP_VERSION}. Guidance only — always confirm prices, hours and safety locally.`));
  mount(wrap, '#home');
}

// ---- FEEDBACK / SUGGEST (no backend: share sheet, email, or copy) -----------
// Composes a message the user sends themselves via the OS share sheet, their email
// app (mailto — recipient is optional and set in Settings), or the clipboard. Nothing
// is transmitted automatically and no personal address is baked into the app.
function feedbackScreen(arg) {
  const wrap = h('div', { class: 'screen' });
  const place = arg ? resolveItem(arg) : null;
  wrap.append(topbar(place ? 'Suggest an edit' : 'Send feedback', place ? `#place-${place.id}` : '#help'));
  wrap.append(h('p', { class: 'map-hint' }, place
    ? `Suggest a correction or addition for “${place.name}”. Your message opens in your share sheet, email app, or clipboard — nothing is sent automatically.`
    : 'Tell us what to fix, add or improve. Your message opens in your share sheet, email app, or clipboard — nothing is sent automatically, and no account is needed.'));

  const card = h('div', { class: 'card' });
  let category = place ? 'correction' : 'feedback';
  card.append(field('Type', selectEl([['feedback', 'General feedback'], ['feature', 'Feature idea'], ['correction', 'Correct information']], category, (v) => { category = v; })));
  const subject = h('input', { type: 'text', placeholder: 'Short summary', value: place ? `Correction: ${place.name}` : '' });
  card.append(field('Subject', subject));
  const body = h('textarea', { class: 'ta', rows: '6', placeholder: place ? 'What should change, and what is correct?' : 'Your message…' });
  card.append(field('Message', body));
  const fromEmail = h('input', { type: 'email', placeholder: 'you@example.com', value: store.profile.contactEmail || '' });
  fromEmail.addEventListener('change', () => { store.profile.contactEmail = fromEmail.value.trim(); save(); });
  card.append(field('Your email (optional, so we can reply)', fromEmail));
  wrap.append(card);

  function compose() {
    const catLabel = { feedback: 'Feedback', feature: 'Feature idea', correction: 'Correction' }[category] || 'Feedback';
    const text = [
      body.value.trim(), '',
      '— sent from Mekonging —',
      `Type: ${catLabel}`,
      place ? `Place: ${place.name} (${place.id})` : null,
      fromEmail.value.trim() ? `Reply-to: ${fromEmail.value.trim()}` : null,
      `App: ${APP_VERSION}`,
    ].filter((x) => x != null).join('\n');
    return { subject: `[Mekonging] ${catLabel}${subject.value.trim() ? ': ' + subject.value.trim() : ''}`, text };
  }
  const status = h('p', { class: 'muted' });
  const actions = h('div', { class: 'card' });
  if (typeof navigator !== 'undefined' && navigator.share) {
    actions.append(h('button', { class: 'btn block', onclick: async () => {
      const m = compose();
      try { await navigator.share({ title: m.subject, text: m.text }); status.textContent = 'Shared — choose where to send it.'; }
      catch { /* user cancelled */ }
    } }, '📤 Share…'));
  }
  actions.append(h('button', { class: 'btn ghost block', style: 'margin-top:8px', onclick: () => {
    const m = compose();
    const to = (store.profile.feedbackTo || '').trim();
    window.location.href = `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(m.subject)}&body=${encodeURIComponent(m.text)}`;
    status.textContent = to ? 'Opening your email app…' : 'Opened your email app — add a recipient, or set a feedback address in Settings.';
  } }, '✉️ Email'));
  actions.append(h('button', { class: 'btn ghost block', style: 'margin-top:8px', onclick: async () => {
    const m = compose();
    try { await navigator.clipboard.writeText(`${m.subject}\n\n${m.text}`); status.textContent = 'Copied to clipboard — paste it wherever you like.'; }
    catch { status.textContent = 'Could not copy automatically — select your message and copy it.'; }
  } }, '📋 Copy'));
  actions.append(status);
  wrap.append(actions);
  mount(wrap, place ? `#place-${place.id}` : '#help');
}

// ---- TRAVEL CIRCLE (backendless share / connect / message) ------------------
// No account, no server: a user's traveller card and (later) messages travel
// only inside links they choose to share. Imported contact fields are UNTRUSTED
// and are rendered exclusively as text children (never innerHTML).
function avatarChip(av) { return h('span', { class: 'avatar', 'aria-hidden': 'true' }, av || '🧭'); }
function contactRow(c, actionEl) {
  return h('div', { class: 'row-between contact-row' }, [
    h('div', { class: 'contact-id' }, [
      avatarChip(c.avatar),
      h('div', {}, [h('strong', {}, c.name || 'Traveller'), c.bio ? h('div', { class: 'tiny muted' }, c.bio) : null]),
    ]),
    actionEl || null,
  ]);
}
function circleScreen() {
  const me = ensureMe();
  const wrap = h('div', { class: 'screen' });
  wrap.append(topbar('Travel circle', '#home'));
  wrap.append(h('p', { class: 'muted' },
    'Connect with other travellers — no account, no server. Your card and messages travel only inside links you choose to share; nothing is uploaded and nothing leaves this device on its own.'));
  wrap.append(h('button', { class: 'btn ghost block', onclick: () => go('#inbox') }, `📥 Shared with you (${getInbox().length})`));

  // --- your card (editable) ---
  const nameIn = h('input', { type: 'text', maxlength: '40', placeholder: 'Display name (e.g. Sam)', value: me.name || '' });
  const avIn = h('input', { type: 'text', maxlength: '4', 'aria-label': 'Your emoji', value: me.avatar || '🧭', style: 'width:64px; text-align:center' });
  const bioIn = h('textarea', { class: 'ta', maxlength: '160', rows: '2', placeholder: 'One line about you (optional)' }, me.bio || '');
  wrap.append(h('div', { class: 'card' }, [
    h('h2', {}, 'Your traveller card'),
    h('div', { class: 'field' }, [h('label', {}, 'Emoji & name'), h('div', { style: 'display:flex; gap:8px' }, [avIn, nameIn])]),
    field('Short bio', bioIn),
    h('button', { class: 'btn', onclick: () => { setMe({ name: nameIn.value, avatar: avIn.value, bio: bioIn.value }); go('#circle'); } }, 'Save card'),
  ]));

  // --- share your card ---
  const status = h('p', { class: 'muted' });
  const buildUrl = () => shareUrl('add', encodeCard(ensureMe()));
  const shareCard = h('div', { class: 'card' });
  shareCard.append(h('h2', {}, 'Share your card'));
  shareCard.append(h('p', { class: 'muted' }, 'Send this to another Mekonging traveller. When they open it, you are added to each other’s circle. On a phone, “Share” can send it over AirDrop or Nearby Share with no internet at all.'));
  if (typeof navigator !== 'undefined' && navigator.share) {
    shareCard.append(h('button', { class: 'btn block', onclick: async () => {
      try { await navigator.share({ title: 'Add me on Mekonging', text: `${ensureMe().name || 'A traveller'} on Mekonging`, url: buildUrl() }); status.textContent = 'Shared — they can open it to connect.'; }
      catch { /* cancelled */ }
    } }, '📤 Share my card…'));
  }
  shareCard.append(h('button', { class: 'btn ghost block', style: 'margin-top:8px', onclick: async () => {
    try { await navigator.clipboard.writeText(buildUrl()); status.textContent = 'Link copied — paste it to a friend.'; }
    catch { status.textContent = 'Could not copy automatically — select the link below to copy it.'; }
  } }, '🔗 Copy my link'));
  shareCard.append(h('p', { class: 'tiny muted', style: 'word-break:break-all; margin-top:8px' }, buildUrl()));
  shareCard.append(status);
  wrap.append(shareCard);

  // --- your circle ---
  const contacts = getContacts();
  const listCard = h('div', { class: 'card' });
  listCard.append(h('h2', {}, `Your circle (${contacts.length})`));
  if (!contacts.length) {
    listCard.append(h('p', { class: 'muted' }, 'No one yet. Share your card, or open a friend’s link to add them.'));
  } else {
    contacts.slice().sort((a, b) => (a.name || '').localeCompare(b.name || '')).forEach((c) => {
      listCard.append(contactRow(c, h('div', { class: 'cats' }, [
        h('button', { class: 'chip', onclick: () => go('#thread-' + c.userId) }, '💬 Message'),
        h('button', { class: 'chip', onclick: () => { if (confirm(`Remove ${c.name || 'this contact'} from your circle?`)) { removeContact(c.userId); go('#circle'); } } }, '✕'),
      ])));
    });
  }
  wrap.append(listCard);

  mount(wrap, '#circle');
}

function addContactScreen(arg) {
  const wrap = h('div', { class: 'screen' });
  wrap.append(topbar('Add to circle', '#circle'));
  const card = parseCard(arg);
  if (!card) {
    wrap.append(h('div', { class: 'card' }, [
      h('h2', {}, 'This link could not be read'),
      h('p', { class: 'muted' }, 'The traveller-card link looks invalid or was cut off in transit. Ask them to share it again.'),
      h('button', { class: 'btn', onclick: () => go('#circle') }, 'Back to your circle'),
    ]));
    mount(wrap, '#circle');
    return;
  }
  const me = ensureMe();
  const isSelf = card.userId === me.userId;
  const existing = getContact(card.userId);
  const box = h('div', { class: 'card' });
  box.append(contactRow(card));
  const status = h('p', { class: 'muted' });
  if (isSelf) {
    box.append(h('p', { class: 'muted', style: 'margin-top:8px' }, 'This is your own card.'));
    box.append(h('button', { class: 'btn', onclick: () => go('#circle') }, 'Back to your circle'));
  } else {
    box.append(h('p', { class: 'muted', style: 'margin-top:8px' }, existing ? `${card.name} is already in your circle — you can refresh their card.` : `Add ${card.name} to your travel circle?`));
    box.append(h('button', { class: 'btn block', onclick: () => { const r = addContact(card); if (r.ok) go('#circle'); else status.textContent = 'Could not add this contact.'; } }, existing ? 'Refresh their card' : `Add ${card.name}`));
    box.append(h('button', { class: 'btn ghost block', style: 'margin-top:8px', onclick: () => go('#circle') }, 'Not now'));
  }
  box.append(status);
  wrap.append(box);
  wrap.append(h('p', { class: 'tiny muted' }, 'Adding a contact only stores their card on your device. Nothing is sent anywhere.'));
  mount(wrap, '#circle');
}

// A share/copy button that flips its own label to confirm, then reverts. Uses the
// OS share sheet when available (which can send over AirDrop / Nearby Share with
// no internet), else copies the link to the clipboard.
function shareButton(label, title, buildUrl, cls = 'btn ghost block') {
  const btn = h('button', { class: cls, style: 'margin-top:8px', onclick: async () => {
    const url = buildUrl();
    let msg;
    try {
      if (typeof navigator !== 'undefined' && navigator.share) { await navigator.share({ title, url }); msg = '✓ Shared'; }
      else { await navigator.clipboard.writeText(url); msg = '✓ Link copied'; }
    } catch (e) {
      if (e && e.name === 'AbortError') return;   // user dismissed the share sheet
      try { await navigator.clipboard.writeText(url); msg = '✓ Link copied'; } catch { msg = 'Copy failed'; }
    }
    const old = btn.textContent; btn.textContent = msg; setTimeout(() => { btn.textContent = old; }, 1800);
  } }, label);
  return btn;
}

// Import screen for a shared place / list / trip (#in-<payload>). All decoded
// fields are UNTRUSTED and rendered only as text.
function importShareScreen(arg) {
  const wrap = h('div', { class: 'screen' });
  wrap.append(topbar('Shared with you', '#circle'));
  const s = parseShare(arg);
  if (!s) {
    wrap.append(h('div', { class: 'card' }, [
      h('h2', {}, 'This shared link could not be read'),
      h('p', { class: 'muted' }, 'It may be invalid or was cut off in transit. Ask the sender to share it again.'),
      h('button', { class: 'btn', onclick: () => go('#circle') }, 'Back to your circle'),
    ]));
    mount(wrap, '#circle'); return;
  }
  // Save to the inbox once (dedupe on identical content so re-opening the link
  // does not pile up duplicates).
  const sig = `${s.kind}|${s.from ? s.from.userId : ''}|${JSON.stringify(s.data)}`;
  if (!getInbox().some((x) => `${x.kind}|${x.from ? x.from.userId : ''}|${JSON.stringify(x.data)}` === sig)) {
    addInboxItem({ from: s.from, kind: s.kind, data: s.data, msg: s.msg });
  }

  const box = h('div', { class: 'card' });
  if (s.from) box.append(contactRow(s.from));
  if (s.msg) box.append(h('p', { style: 'margin-top:6px' }, s.msg));
  if (s.kind === 'place') {
    const exists = getPlace(s.data.id);
    box.append(h('h2', { style: 'margin-top:8px' }, s.data.name));
    box.append(h('p', { class: 'muted' }, exists ? 'A place they recommend.' : 'A place they recommend — not in your guide, so search for it by name.'));
    if (exists) box.append(h('button', { class: 'btn block', onclick: () => go(`#place-${s.data.id}`) }, 'Open this place'));
    box.append(h('button', { class: 'btn ghost block', style: 'margin-top:8px', onclick: (e) => { toggleFavorite(s.data.id); e.currentTarget.textContent = '✓ Saved to favourites'; } }, '⭐ Save to favourites'));
  } else if (s.kind === 'collection') {
    box.append(h('h2', { style: 'margin-top:8px' }, s.data.name));
    box.append(h('p', { class: 'muted' }, `${s.data.items.length} place${s.data.items.length === 1 ? '' : 's'} in this list.`));
    box.append(h('ul', {}, s.data.items.slice(0, 40).map((it) => h('li', {}, it.name || it.id))));
    box.append(h('button', { class: 'btn block', onclick: (e) => {
      const c = createCollection(s.data.name || 'Shared list', '📥');
      let n = 0; s.data.items.forEach((it) => { if (getPlace(it.id)) { togglePlaceInCollection(c.id, it.id); n++; } });
      e.currentTarget.textContent = `✓ Saved (${n} in your guide)`;
    } }, '＋ Save as a collection'));
  } else if (s.kind === 'trip') {
    box.append(h('h2', { style: 'margin-top:8px' }, 'A shared trip'));
    box.append(h('ol', {}, s.data.stops.slice(0, 40).map((st) => h('li', {}, st.title + (st.date ? ` — ${st.date}` : '')))));
    box.append(h('button', { class: 'btn block', onclick: (e) => { s.data.stops.forEach((st) => addStop({ title: st.title, country: st.country, date: st.date })); e.currentTarget.textContent = '✓ Added to my trip'; } }, '＋ Add these stops to my trip'));
  } else if (s.kind === 'tip') {
    box.append(h('h2', { style: 'margin-top:8px' }, `Local tip — ${s.data.city}`));
    box.append(h('p', {}, s.data.text));
    const board = getBoard(s.data.cc, s.data.city.toLowerCase().replace(/[^a-z0-9]+/g, '-'));
    box.append(h('button', { class: 'btn block', onclick: (e) => {
      const key = board ? `${board.country}-${board.slug}` : `${s.data.cc || 'xx'}-${s.data.city.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
      addBoardPost(key, { topic: s.data.topic, text: `${s.from ? s.from.name + ': ' : ''}${s.data.text}` });
      e.currentTarget.textContent = '✓ Pinned to your board';
    } }, '📌 Pin to my noticeboard'));
    if (board) box.append(h('button', { class: 'btn ghost block', style: 'margin-top:8px', onclick: () => go(`#board-${board.country}-${board.slug}`) }, `📋 Open the ${board.city} board`));
  }
  wrap.append(box);

  if (s.from) {
    const already = getContact(s.from.userId);
    wrap.append(h('div', { class: 'card' }, [
      h('p', { class: 'muted' }, already ? `${s.from.name} is in your circle.` : `Add ${s.from.name} to your circle so you can share back?`),
      already ? null : h('button', { class: 'btn ghost block', onclick: (e) => { addContact(s.from); e.currentTarget.textContent = '✓ Added to your circle'; } }, `Add ${s.from.name}`),
    ]));
  }
  wrap.append(h('button', { class: 'btn ghost block', style: 'margin-top:8px', onclick: () => go('#inbox') }, '📥 See everything shared with you'));
  mount(wrap, '#circle');
}

function inboxScreen() {
  const wrap = h('div', { class: 'screen' });
  wrap.append(topbar('Shared with you', '#circle'));
  const items = getInbox();
  if (!items.length) {
    wrap.append(h('div', { class: 'card' }, [h('p', { class: 'muted' }, 'Nothing yet. When a friend shares a place, list or trip with you, it lands here.')]));
    mount(wrap, '#circle'); return;
  }
  const KIND = { place: '📍 Place', collection: '⭐ List', trip: '🧳 Trip', tip: '💡 Local tip' };
  items.forEach((it) => {
    const title = it.kind === 'place' ? (it.data.name || 'A place')
      : it.kind === 'collection' ? (it.data.name || 'A list')
      : it.kind === 'tip' ? `Tip — ${it.data.city || 'a city'}` : 'A trip';
    wrap.append(h('div', { class: 'card' }, [
      h('div', { class: 'row-between' }, [
        h('div', {}, [h('strong', {}, title), h('div', { class: 'tiny muted' }, `${KIND[it.kind] || it.kind}${it.from ? ' · from ' + it.from.name : ''} · ${it.at}`)]),
        h('button', { class: 'chip', 'aria-label': 'Remove', onclick: () => { deleteInboxItem(it.id); go('#inbox'); } }, '✕'),
      ]),
      it.msg ? h('p', { style: 'margin-top:6px' }, it.msg) : null,
      (it.kind === 'place' && getPlace(it.data.id)) ? h('button', { class: 'btn ghost block', style: 'margin-top:6px', onclick: () => go(`#place-${it.data.id}`) }, 'Open place') : null,
      (it.kind === 'trip') ? h('button', { class: 'btn ghost block', style: 'margin-top:6px', onclick: (e) => { (it.data.stops || []).forEach((st) => addStop({ title: st.title, country: st.country, date: st.date })); e.currentTarget.textContent = '✓ Added to my trip'; } }, 'Add stops to my trip') : null,
      (it.kind === 'collection') ? h('button', { class: 'btn ghost block', style: 'margin-top:6px', onclick: (e) => { const c = createCollection(it.data.name || 'Shared list', '📥'); let n = 0; (it.data.items || []).forEach((x) => { if (getPlace(x.id)) { togglePlaceInCollection(c.id, x.id); n++; } }); e.currentTarget.textContent = `✓ Saved (${n})`; } }, 'Save as a collection') : null,
      (it.kind === 'tip') ? h('p', { style: 'margin-top:6px' }, it.data.text || '') : null,
      (it.kind === 'tip') ? h('button', { class: 'btn ghost block', style: 'margin-top:6px', onclick: (e) => {
        const slug = String(it.data.city || 'a-city').toLowerCase().replace(/[^a-z0-9]+/g, '-');
        addBoardPost(`${it.data.cc || 'xx'}-${slug}`, { topic: it.data.topic, text: `${it.from ? it.from.name + ': ' : ''}${it.data.text}` });
        e.currentTarget.textContent = '✓ Pinned';
      } }, '📌 Pin to my noticeboard') : null,
    ]));
  });
  mount(wrap, '#circle');
}

// Async message thread with one contact. "Sending" records the note locally and
// produces a link to hand over — the reply comes back as another #msg- link.
function threadScreen(userId, fallbackCard) {
  const wrap = h('div', { class: 'screen' });
  const contact = getContact(userId) || fallbackCard || null;
  const name = contact ? contact.name : 'Traveller';
  wrap.append(topbar('💬 ' + name, '#circle'));
  wrap.append(h('p', { class: 'muted' }, `Messages travel as links — no server. Write a note, then hand the link to ${name} (share sheet, AirDrop, any app). They open it to receive it and reply the same way.`));
  if (contact && !getContact(userId)) {
    wrap.append(h('div', { class: 'card' }, [
      h('p', { class: 'muted' }, `${name} is not in your circle yet.`),
      h('button', { class: 'btn ghost block', onclick: (e) => { addContact(contact); e.currentTarget.textContent = '✓ Added to your circle'; } }, `Add ${name} to your circle`),
    ]));
  }
  const th = getThread(userId);
  const list = h('div', { class: 'card thread' });
  if (!th.length) list.append(h('p', { class: 'muted' }, 'No messages yet — write the first note below.'));
  else th.forEach((m) => list.append(h('div', { class: 'bubble ' + (m.from === 'me' ? 'me' : 'them') }, [
    h('span', { class: 'who' }, m.from === 'me' ? 'You' : (m.name || name)),
    m.text,
  ])));
  wrap.append(list);
  const ta = h('textarea', { class: 'ta', rows: '3', maxlength: '800', placeholder: `Write a note to ${name}…` });
  const sendBtn = h('button', { class: 'btn block', onclick: async () => {
    const text = ta.value.trim(); if (!text) return;
    addMessage(userId, { from: 'me', text });                       // recorded first, so it survives even if sharing is cancelled
    const url = shareUrl('msg', encodeMessage(ensureMe(), text));
    let handed = false;
    try {
      if (typeof navigator !== 'undefined' && navigator.share) { await navigator.share({ title: `A note for ${name}`, url }); handed = true; }
      else if (navigator.clipboard && navigator.clipboard.writeText) { await navigator.clipboard.writeText(url); handed = true; }
    } catch (e) { if (e && e.name === 'AbortError') { go('#thread-' + userId); return; } }
    if (!handed) {
      // no Share or Clipboard API (older webviews): execCommand fallback, then
      // show the link as selectable text rather than failing silently.
      try { const t = h('textarea', {}); t.value = url; document.body.append(t); t.select(); handed = document.execCommand('copy'); t.remove(); } catch { /* noop */ }
    }
    if (!handed) { sendStatus.textContent = 'Could not copy automatically — select and copy this link: '; sendStatus.append(h('span', { style: 'word-break:break-all; user-select:all' }, url)); return; }
    go('#thread-' + userId);
  } }, '📤 Send (share the link)');
  const sendStatus = h('p', { class: 'tiny muted' });
  wrap.append(h('div', { class: 'card' }, [
    h('h3', {}, 'Reply'), ta, sendBtn, sendStatus,
    h('p', { class: 'tiny muted', style: 'margin-top:6px' }, 'Your note is saved to this thread and a link is created to hand to them.'),
  ]));
  mount(wrap, '#circle');
}

// Import a received message (#msg-<payload>) into its thread, then show it.
function importMessageScreen(arg) {
  const m = parseMessage(arg);
  if (!m) {
    const wrap = h('div', { class: 'screen' });
    wrap.append(topbar('Message', '#circle'));
    wrap.append(h('div', { class: 'card' }, [
      h('h2', {}, 'This message link could not be read'),
      h('p', { class: 'muted' }, 'It may be invalid or was cut off in transit. Ask them to send it again.'),
      h('button', { class: 'btn', onclick: () => go('#circle') }, 'Back to your circle'),
    ]));
    mount(wrap, '#circle'); return;
  }
  const uid = m.from.userId;
  const th = getThread(uid);
  const last = th[th.length - 1];
  if (!(last && last.from === 'them' && last.text === m.text)) addMessage(uid, { from: 'them', text: m.text, name: m.from.name });
  // rewrite the URL so a refresh does not re-import, then show the conversation
  try { history.replaceState(null, '', '#thread-' + uid); } catch { /* noop */ }
  return threadScreen(uid, m.from);
}

// ---- FOR YOU (traveller profile + personalised picks) -----------------------
function prefChips(pairs, current, onPick) {
  const box = h('div', { class: 'chips' });
  pairs.forEach(([val, lbl]) => box.append(h('button', {
    class: 'chip', 'aria-pressed': current === val ? 'true' : 'false', dataset: { v: val },
    onclick: () => { onPick(val); box.querySelectorAll('.chip').forEach((c) => c.setAttribute('aria-pressed', c.dataset.v === val ? 'true' : 'false')); },
  }, lbl)));
  return box;
}
// ---- ONBOARDING (learn the traveller first, then direct them) ---------------
// First run: understand who the traveller is, whether to use data, and (optionally)
// where they are — then the whole app leads with what fits their situation, place and
// moment. Short, skippable, editable later in "For you" and Settings. Fully offline.
function welcomeScreen() {
  const prefs = store.profile.prefs;
  const wrap = h('div', { class: 'screen welcome' });
  wrap.append(h('section', { class: 'hero' }, [
    h('div', { class: 'logo-wrap', html: logoSVG() }),
    h('p', {}, 'Let us set the app up for you — whether to use data, how you travel, and where you are. A few taps; everything stays on your device.'),
  ]));

  // 1 — Network choice FIRST: the app will not touch mobile data or Wi-Fi without it.
  const netCard = h('div', { class: 'card' });
  netCard.append(h('h2', { style: 'margin-top:0' }, '1 · Data, or fully offline?'));
  netCard.append(h('p', { class: 'muted' }, 'This app works fully offline. It will not use mobile data or Wi-Fi unless you allow it — handy when you have no SIM. You can change this any time.'));
  const netRow = h('div', { class: 'chips' });
  [['online', '📶 Use data when I have it'], ['offline', '✈️ Stay fully offline']].forEach(([id, lbl]) =>
    netRow.append(h('button', { class: 'chip', dataset: { n: id }, 'aria-pressed': netMode() === id ? 'true' : 'false',
      onclick: () => { setNetMode(id); netRow.querySelectorAll('.chip').forEach((c) => c.setAttribute('aria-pressed', c.dataset.n === netMode() ? 'true' : 'false')); } }, lbl)));
  netCard.append(netRow);
  wrap.append(netCard);

  // 2 — Who is travelling (+ baby)
  const whoCard = h('div', { class: 'card' });
  whoCard.append(h('h2', {}, '2 · Who is travelling?'));
  whoCard.append(prefChips([['solo', '🎒 Solo'], ['couple', '👫 Couple'], ['family', '👨‍👩‍👧 Family'], ['group', '👥 Group']], prefs.party, (v) => { prefs.party = prefs.party === v ? '' : v; save(); }));
  whoCard.append(h('p', { class: 'muted', style: 'margin-top:10px' }, 'Bringing little ones?'));
  const babyChip = h('button', { class: 'chip', 'aria-pressed': prefs.withBaby ? 'true' : 'false',
    onclick: (e) => { prefs.withBaby = !prefs.withBaby; save(); e.currentTarget.setAttribute('aria-pressed', prefs.withBaby ? 'true' : 'false'); } }, '🍼 Travelling with a baby or toddler');
  whoCard.append(h('div', { class: 'chips' }, [babyChip]));
  wrap.append(whoCard);

  // 3 — Accessibility needs
  const accCard = h('div', { class: 'card' });
  accCard.append(h('h2', {}, '3 · Any accessibility needs?'));
  accCard.append(h('p', { class: 'muted' }, 'We will surface honest, practical guidance for how these countries work for you. Pick any that apply, or none.'));
  const accRow = h('div', { class: 'chips' });
  [['mobility', '♿ Wheelchair / limited mobility'], ['vision', '🦯 Blind / low vision'], ['hearing', '🦻 Deaf / hard of hearing']].forEach(([id, lbl]) => {
    const on = () => (prefs.access || []).includes(id);
    accRow.append(h('button', { class: 'chip', 'aria-pressed': on() ? 'true' : 'false',
      onclick: (e) => { prefs.access = prefs.access || []; const i = prefs.access.indexOf(id); if (i >= 0) prefs.access.splice(i, 1); else prefs.access.push(id); save(); e.currentTarget.setAttribute('aria-pressed', on() ? 'true' : 'false'); } }, lbl));
  });
  accCard.append(accRow);
  accCard.append(h('p', { class: 'muted', style: 'margin-top:10px' }, 'Text size'));
  accCard.append(prefChips([['s', 'Small'], ['m', 'Medium'], ['l', 'Large']], store.profile.textScale || 'm', (v) => { store.profile.textScale = v; save(); applyTheme(); }));
  wrap.append(accCard);

  // 4 — How you like to travel (budget / length / interests)
  const fitCard = h('div', { class: 'card' });
  fitCard.append(h('h2', {}, '4 · How you like to travel'));
  fitCard.append(h('p', { class: 'muted' }, 'Budget'));
  fitCard.append(prefChips([['low', 'Budget'], ['mid', 'Mid'], ['high', 'Higher-end'], ['flexible', 'Flexible']], prefs.budget, (v) => { prefs.budget = v; save(); }));
  fitCard.append(h('p', { class: 'muted', style: 'margin-top:10px' }, 'Trip length'));
  fitCard.append(prefChips([['short', '≤ 1 week'], ['medium', '2–3 weeks'], ['long', '1 month +']], prefs.tripLength, (v) => { prefs.tripLength = prefs.tripLength === v ? '' : v; save(); }));
  fitCard.append(h('p', { class: 'muted', style: 'margin-top:10px' }, 'Interests'));
  const intRow = h('div', { class: 'chips' });
  INTERESTS.forEach((it) => { const on = () => (prefs.interests || []).includes(it.id);
    intRow.append(h('button', { class: 'chip', 'aria-pressed': on() ? 'true' : 'false',
      onclick: (e) => { prefs.interests = prefs.interests || []; const i = prefs.interests.indexOf(it.id); if (i >= 0) prefs.interests.splice(i, 1); else prefs.interests.push(it.id); save(); e.currentTarget.setAttribute('aria-pressed', on() ? 'true' : 'false'); } }, `${it.emoji} ${it.label}`)); });
  fitCard.append(intRow);
  wrap.append(fitCard);

  // 5 — Location (optional; sensors, not data)
  const locCard = h('div', { class: 'card' });
  locCard.append(h('h2', {}, '5 · Use your location? (optional)'));
  locCard.append(h('p', { class: 'muted' }, 'Allow it and the app leads with what is good right where you are — distances, near-me, the closest help. It stays on your device and works offline; GPS uses your phone’s sensors, not data.'));
  if (typeof navigator !== 'undefined' && navigator.geolocation) {
    const lb = h('button', { class: 'btn ghost block' }, getLastFix() ? '📍 Location is on' : '📍 Use my location');
    lb.onclick = async () => { lb.textContent = 'Locating…'; lb.disabled = true; try { const p = await geolocate(); setLastFix(p); const nb = nearestSpotGlobal(p); if (nb) setFocusSpot(nb.spot); lb.textContent = '📍 Location is on'; } catch { lb.textContent = '📍 Location unavailable'; } lb.disabled = false; };
    locCard.append(lb);
  } else {
    locCard.append(h('p', { class: 'muted' }, 'Location is not available on this device — you can still browse by country and city.'));
  }
  wrap.append(locCard);

  const finish = () => { store.profile.seenWelcome = true; store.profile.prefs.geoAsked = true; if (netMode() === 'ask') setNetMode('offline'); save(); go('#home'); };
  wrap.append(h('button', { class: 'btn block', style: 'margin-top:8px', onclick: finish }, 'Start exploring →'));
  wrap.append(h('button', { class: 'btn ghost block', style: 'margin-top:8px', onclick: finish }, 'Skip for now'));
  mount(wrap, 'home');
}

function foryouScreen() {
  const prefs = store.profile.prefs;
  const wrap = h('div', { class: 'screen' });
  wrap.append(topbar('For you', '#home'));
  wrap.append(h('p', { class: 'muted' }, 'Tell the app how you travel and every list ranks what fits you first — and the trip plans match your situation. All of this stays on your device.'));

  const card = h('div', { class: 'card' });
  card.append(h('h2', {}, 'How are you travelling?'));
  card.append(h('p', { class: 'muted' }, 'Who is coming?'));
  card.append(prefChips([['solo', '🎒 Solo'], ['couple', '👫 Couple'], ['family', '👨‍👩‍👧 Family'], ['group', '👥 Group']], prefs.party, (v) => { prefs.party = prefs.party === v ? '' : v; save(); }));
  const babyChip = h('button', { class: 'chip', 'aria-pressed': prefs.withBaby ? 'true' : 'false',
    onclick: (e) => { prefs.withBaby = !prefs.withBaby; save(); e.currentTarget.setAttribute('aria-pressed', prefs.withBaby ? 'true' : 'false'); } }, '🍼 With a baby or toddler');
  card.append(h('div', { class: 'chips' }, [babyChip]));
  card.append(h('p', { class: 'muted', style: 'margin-top:10px' }, 'Accessibility needs'));
  const accRow = h('div', { class: 'chips' });
  [['mobility', '♿ Mobility'], ['vision', '🦯 Low vision'], ['hearing', '🦻 Hearing']].forEach(([id, lbl]) => {
    const on = () => (prefs.access || []).includes(id);
    accRow.append(h('button', { class: 'chip', 'aria-pressed': on() ? 'true' : 'false',
      onclick: (e) => { prefs.access = prefs.access || []; const i = prefs.access.indexOf(id); if (i >= 0) prefs.access.splice(i, 1); else prefs.access.push(id); save(); e.currentTarget.setAttribute('aria-pressed', on() ? 'true' : 'false'); } }, lbl));
  });
  card.append(accRow);
  card.append(h('p', { class: 'muted', style: 'margin-top:10px' }, 'How long is the trip?'));
  card.append(prefChips([['short', '≤ 1 week'], ['medium', '2–3 weeks'], ['long', '1 month +']], prefs.tripLength, (v) => { prefs.tripLength = prefs.tripLength === v ? '' : v; save(); }));
  card.append(h('p', { class: 'muted', style: 'margin-top:10px' }, 'Budget'));
  card.append(prefChips([['low', 'Budget'], ['mid', 'Mid'], ['high', 'Higher-end'], ['flexible', 'Flexible']], prefs.budget, (v) => { prefs.budget = v; save(); }));
  card.append(h('p', { class: 'muted', style: 'margin-top:10px' }, 'Interests'));
  const intChips = h('div', { class: 'chips' });
  INTERESTS.forEach((it) => {
    const on = () => (prefs.interests || []).includes(it.id);
    intChips.append(h('button', { class: 'chip', 'aria-pressed': on() ? 'true' : 'false', onclick: (e) => {
      prefs.interests = prefs.interests || [];
      const i = prefs.interests.indexOf(it.id);
      if (i >= 0) prefs.interests.splice(i, 1); else prefs.interests.push(it.id);
      save(); e.currentTarget.setAttribute('aria-pressed', on() ? 'true' : 'false');
    } }, `${it.emoji} ${it.label}`));
  });
  card.append(intChips);
  card.append(h('button', { class: 'btn block', style: 'margin-top:12px', onclick: () => go('#foryou') }, 'Show my picks'));
  wrap.append(card);

  if (profileIsSet()) {
    // top personalised picks in the active country
    const picks = allPlaces({ country: activeCountry }).slice().sort((a, b) => personalScore(b) - personalScore(a)).slice(0, 5);
    const c = getCountry(activeCountry);
    if (picks.length) {
      const pk = h('div', { class: 'card' });
      pk.append(h('h2', {}, `Top picks for you${c ? ' — ' + c.name : ''}`));
      picks.forEach((p) => pk.append(h('button', { class: 'btn ghost block', style: 'margin-top:6px; justify-content:flex-start', onclick: () => go(`#place-${p.id}`) },
        `${starsStr(Math.round(effectiveRating(p.id, p.rating)))} ${p.name}`)));
      pk.append(h('button', { class: 'btn ghost block', style: 'margin-top:8px', onclick: () => go(`#places-${activeCountry}`) }, 'See all places, ranked for you'));
      wrap.append(pk);
    }
    // the best-matching plan
    const plans = suggestPlans({ country: activeCountry, tripLength: prefs.tripLength, party: prefs.party, budget: prefs.budget });
    if (plans.length) {
      const pl = plans[0];
      wrap.append(h('div', { class: 'card' }, [
        h('h2', {}, 'A plan that fits you'),
        h('p', {}, [h('strong', {}, pl.title), ` — ~${pl.days} days, ${pl.pace} pace.`]),
        h('p', { class: 'muted' }, pl.summary),
        h('button', { class: 'btn block', onclick: () => go('#plans') }, 'See matching trip plans'),
      ]));
    }
  }
  mount(wrap, '#home');
}

// ---- TRIP PLANS (suggested routes matched to the profile) --------------------
function plansScreen() {
  const prefs = store.profile.prefs;
  const wrap = h('div', { class: 'screen' });
  wrap.append(topbar('Trip plans', '#home'));
  wrap.append(h('p', { class: 'muted' }, 'Suggested routes, matched to how you travel. Nights are guidance — stretch or compress freely. Add a plan to My Trip and edit it there.'));
  if (!profileIsSet()) {
    wrap.append(h('div', { class: 'card' }, [
      h('p', { class: 'muted' }, 'Set your budget, party and trip length first and these plans sort themselves to fit you.'),
      h('button', { class: 'btn block', onclick: () => go('#foryou') }, '🎯 Set up "For you"'),
    ]));
  }
  wrap.append(countryChips((id) => { activeCountry = id; go('#plans'); }));
  const plans = suggestPlans({ country: activeCountry, tripLength: prefs.tripLength, party: prefs.party, budget: prefs.budget });
  const PARTY_LBL = { solo: '🎒 solo', couple: '👫 couples', family: '👨‍👩‍👧 families' };
  plans.forEach((pl, idx) => {
    const card = h('div', { class: 'card' });
    card.append(h('div', { class: 'row-between' }, [h('h2', {}, pl.title), idx === 0 && profileIsSet() ? h('span', { class: 'cat-tag' }, 'Best match') : null]));
    card.append(h('p', { class: 'muted' }, `~${pl.days} days · ${pl.pace} pace · suits ${pl.party.map((x) => PARTY_LBL[x] || x).join(', ')}`));
    card.append(h('p', {}, pl.summary));
    card.append(h('ol', {}, pl.stops.map((s) => h('li', {}, [h('strong', {}, s.title), ` — ${s.nights} night${s.nights === 1 ? '' : 's'}. `, h('span', { class: 'muted' }, s.why)]))));
    (pl.tips || []).forEach((t) => card.append(h('div', { class: 'list-note' }, t)));
    card.append(h('button', { class: 'btn block', style: 'margin-top:8px', onclick: (e) => {
      pl.stops.forEach((s) => addStop({ title: s.title, country: pl.country }));
      e.currentTarget.textContent = '✓ Added — open My Trip to edit';
    } }, '＋ Add this plan to My Trip'));
    card.append(sourcesNote(pl.sources, null));
    wrap.append(card);
  });
  mount(wrap, '#home');
}

// ---- LOCAL NOTICEBOARD (per-city local knowledge + your own posts) -----------
const BOARD_TOPICS = [['market', '🥬 Markets'], ['food', '🍜 Food'], ['family', '👶 Family'], ['tip', '💡 Tip']];
function boardRow(title, sub, tip) {
  return h('div', { class: 'board-row' }, [
    h('strong', {}, title),
    sub ? h('div', { class: 'tiny muted' }, sub) : null,
    tip ? h('div', { class: 'list-note' }, tip) : null,
  ]);
}
function boardScreen(arg) {
  const wrap = h('div', { class: 'screen' });
  const parts = (arg || '').split('-');
  const cc = parts.shift() || '';
  const slug = parts.join('-');
  const board = (cc && slug) ? getBoard(cc, slug) : null;

  if (!board) {
    // picker: country chips + city list
    wrap.append(topbar('Local noticeboard', '#home'));
    wrap.append(h('p', { class: 'muted' }, 'Local knowledge, city by city: where locals shop for fruit and veg, market schedules, family supplies like nappies, the cheapest genuinely local food and the street-food spots worth queueing for. Curated with sources; add your own notes and share them with your circle.'));
    const selected = cc || activeCountry;
    wrap.append(countryChips((id) => { activeCountry = id; go(`#board-${id}`); }, selected));
    const boards = boardsForCountry(selected);
    if (!boards.length) wrap.append(h('p', { class: 'empty' }, 'No boards for this country yet — more cities are being added.'));
    boards.forEach((b) => wrap.append(h('button', { class: 'btn ghost block', style: 'margin-top:8px; justify-content:flex-start', onclick: () => go(`#board-${b.country}-${b.slug}`) }, `📋 ${b.city}`)));
    mount(wrap, '#home');
    return;
  }

  wrap.append(topbar(`📋 ${board.city}`, `#board-${board.country}`));
  if (board.intro) wrap.append(h('p', { class: 'muted' }, board.intro));

  // Highest-recommended places in this city — your own ratings count first.
  const cityPlaces = allPlaces({ country: board.country })
    .filter((p) => citySlug(p.city) === board.slug)
    .map((p) => ({ p, er: effectiveRating(p.id, Number(p.rating) || 0) }))
    .filter((x) => x.er > 0)
    .sort((a, b) => b.er - a.er)
    .slice(0, 6);
  if (cityPlaces.length) {
    const tc = h('div', { class: 'card' }, [h('h2', {}, `🏆 Top-rated in ${board.city}`)]);
    cityPlaces.forEach(({ p, er }) => tc.append(h('button', { class: 'btn ghost block', style: 'justify-content:space-between;margin-top:6px', onclick: () => go(`#place-${p.id}`) }, [
      h('span', { class: 'near-name' }, `${catEmoji(nearCat(p))} ${p.name}`),
      h('span', { class: 'stars-static', style: `color:${ratingColor(er)}` }, starsStr(er)),
    ])));
    tc.append(h('p', { class: 'tiny muted', style: 'margin-top:6px' }, 'Blends the guide’s rating and yours — rate a place and it climbs your list.'));
    wrap.append(tc);
  }

  const section = (title, rows) => {
    if (!rows || !rows.length) return;
    const cardEl = h('div', { class: 'card' });
    cardEl.append(h('h2', {}, title));
    rows.forEach((r) => cardEl.append(r));
    wrap.append(cardEl);
  };
  section('🕑 Markets & schedules', (board.markets || []).map((m) =>
    boardRow(m.name, [m.when, m.where].filter(Boolean).join(' · ') + (m.what ? ` — ${m.what}` : ''), m.tip)));
  section('🥬 Shop like a local', (board.shopLocal || []).map((s) => boardRow(s.what, s.where, s.tip)));
  const ess = getEssentials(board.country);
  if (ess) {
    const ec = h('div', { class: 'card' });
    ec.append(h('h2', {}, '🛒 Cheapest essentials'));
    if (ess.note) ec.append(h('p', { class: 'muted', style: 'margin:0 0 8px' }, ess.note));
    ess.items.forEach((it) => ec.append(boardRow(
      `${it.icon} ${it.item}`,
      [it.cheapest, (it.price && it.price !== '—') ? `💰 ${it.price}` : null].filter(Boolean).join(' · '),
      it.tip)));
    ec.append(h('p', { class: 'tiny muted', style: 'margin-top:6px' }, 'Countrywide guidance — prices move; the cheapest option rarely does.'));
    wrap.append(ec);
  }
  section('👶 Family supplies', (board.family || []).map((f) =>
    boardRow(f.item, [f.where, f.price].filter(Boolean).join(' · '), f.tip)));
  section('🍜 Cheap local food', (board.cheapEats || []).map((e) =>
    boardRow(`${e.name} — ${e.dish}`, [e.price, e.where].filter(Boolean).join(' · '), e.tip)));
  section('🌶️ Street food', (board.streetFood || []).map((s) =>
    boardRow(`${s.name} — ${s.dish}`, [s.price, s.when, s.where].filter(Boolean).join(' · '), s.tip)));

  // Cannabis / dispensaries — only where they legally operate (Thailand), always led by
  // the current legal status and a cross-border warning. Data-gated: absent = not shown.
  if (board.dispensaries && board.dispensaries.length) {
    const dc = h('div', { class: 'card' });
    dc.append(h('h2', {}, '🌿 Cannabis & dispensaries'));
    if (board.dispensaryNote) dc.append(h('p', { class: 'disclaimer', style: 'margin:0 0 8px' }, board.dispensaryNote));
    board.dispensaries.forEach((d) => dc.append(boardRow(d.area, d.where || '', d.note)));
    if (board.dispensarySources && board.dispensarySources.length) dc.append(sourcesNote(board.dispensarySources, board.dispensaryVerified));
    wrap.append(dc);
  }

  // community notes: the user's own posts + share each to the circle
  const key = `${board.country}-${board.slug}`;
  const posts = getBoardPosts(key);
  const notes = h('div', { class: 'card' });
  notes.append(h('h2', {}, 'Your notes on this board'));
  notes.append(h('p', { class: 'tiny muted' }, 'Notes stay on your device. Share one and it travels as a link your circle can pin to their own board.'));
  const topicLbl = Object.fromEntries(BOARD_TOPICS);
  posts.forEach((p) => notes.append(h('div', { class: 'board-post' }, [
    h('div', { class: 'row-between' }, [
      h('span', { class: 'cat-tag' }, topicLbl[p.topic] || p.topic),
      h('div', { class: 'cats' }, [
        shareButton('📤', `Local tip — ${board.city}`, () => shareUrl('in', encodeShare('tip', { cc: board.country, city: board.city, topic: p.topic, text: p.text }, ensureMe())), 'chip'),
        h('button', { class: 'chip', 'aria-label': 'Delete note', onclick: () => { deleteBoardPost(key, p.id); go(`#board-${key}`); } }, '✕'),
      ]),
    ]),
    h('p', { style: 'margin-top:4px' }, p.text),
    h('div', { class: 'tiny muted' }, p.at),
  ])));
  let newTopic = 'tip';
  const topicChips = h('div', { class: 'chips' }, BOARD_TOPICS.map(([id, lbl]) =>
    h('button', { class: 'chip', 'aria-pressed': id === newTopic ? 'true' : 'false', dataset: { t: id }, onclick: (e) => {
      newTopic = id; topicChips.querySelectorAll('.chip').forEach((c) => c.setAttribute('aria-pressed', c.dataset.t === id ? 'true' : 'false'));
    } }, lbl)));
  const ta = h('textarea', { class: 'ta', rows: '2', maxlength: '500', placeholder: 'e.g. The mango lady at the north gate is the best deal in town…' });
  notes.append(h('div', { style: 'margin-top:8px' }, [topicChips, ta,
    h('button', { class: 'btn block', onclick: () => { if (ta.value.trim()) { addBoardPost(key, { topic: newTopic, text: ta.value.trim() }); go(`#board-${key}`); } } }, '＋ Post to my board')]));
  wrap.append(notes);

  wrap.append(sourcesNote(board.sources, board.verified));
  mount(wrap, '#home');
}

// ---- STREET FOOD (find, rate, review) ----------------------------------------
function starPicker(placeId, current) {
  const row = h('div', { class: 'chips' });
  for (let n = 1; n <= 5; n++) {
    row.append(h('button', { class: 'chip', 'aria-pressed': current === n ? 'true' : 'false', 'aria-label': `Rate ${n} star${n > 1 ? 's' : ''}`, onclick: () => { setPlaceField(placeId, 'rating', n); go('#streetfood'); } }, '★'.repeat(n)));
  }
  return row;
}
function streetfoodScreen() {
  const wrap = h('div', { class: 'screen' });
  wrap.append(topbar('Street food', '#home'));
  wrap.append(h('p', { class: 'muted' }, 'The local stalls and food streets worth queueing for — with your own ratings and takes, kept on-device and shown first. Rate a stall and your score drives its colour on the map too.'));
  wrap.append(countryChips((id) => { activeCountry = id; go('#streetfood'); }));

  // rateable street-food places (curated local eats) — as a rate-list or on a map.
  const prefs = store.profile.prefs;
  const sview = prefs.streetView === 'map' ? 'map' : 'list';
  const places = allPlaces({ country: activeCountry }).filter((p) => p.isLocal === true || (p.categories || []).includes('streetfood'));
  const mappable = places.filter((p) => p.coords);
  if (places.length) {
    if (mappable.length) {
      wrap.append(h('div', { class: 'view-toggle', style: 'display:flex;gap:8px;align-items:center;margin:6px 0' }, [
        h('div', { class: 'chips', style: 'margin:0' }, [
          h('button', { class: 'chip', 'aria-pressed': sview === 'list' ? 'true' : 'false', onclick: () => { prefs.streetView = 'list'; save(); go('#streetfood'); } }, '📋 List'),
          h('button', { class: 'chip', 'aria-pressed': sview === 'map' ? 'true' : 'false', onclick: () => { prefs.streetView = 'map'; save(); go('#streetfood'); } }, '🗺 Map'),
        ]),
      ]));
    }
    if (sview === 'map' && mappable.length) {
      wrap.append(h('p', { class: 'muted', style: 'margin:2px 2px 6px' }, `${mappable.length} stalls & food streets on the map — tap a pin`));
      const canvas = h('div', { class: 'places-map', style: 'height:340px;border-radius:16px;overflow:hidden;position:relative' });
      wrap.append(canvas);
      import('./map.js').then((m) => m.initPlacesMap(canvas, mappable, {
        onOpen: (id) => go(`#place-${id}`), onLocate: (f) => setLastFix(f),
      })).then((c) => { liveCleanup = () => { try { c.dispose(); } catch { /* noop */ } }; }).catch(() => { /* list still below */ });
    } else {
      const card = h('div', { class: 'card' });
      card.append(h('h2', {}, 'Rate the classics'));
      places.forEach((p) => {
        const mine = getPlaceData(p.id);
        card.append(h('div', { class: 'board-post' }, [
          h('button', { class: 'btn ghost block', style: 'justify-content:flex-start', onclick: () => go(`#place-${p.id}`) }, `${p.name} — ${p.city}`),
          h('div', { class: 'tiny muted' }, mine.rating ? `Your rating: ${starsStr(mine.rating)}` : `Guide rating ${Number(p.rating || 0).toFixed(1)} — tap to add yours`),
          starPicker(p.id, mine.rating || 0),
          mine.review ? h('p', { class: 'tiny', style: 'margin-top:4px' }, `“${mine.review}”`) : null,
        ]));
      });
      wrap.append(card);
    }
  }

  // street-food areas from the local boards (browse + jump to the board)
  const boards = boardsForCountry(activeCountry).filter((b) => (b.streetFood || []).length);
  if (boards.length) {
    const card = h('div', { class: 'card' });
    card.append(h('h2', {}, 'Where to graze, city by city'));
    boards.forEach((b) => {
      card.append(h('h3', { style: 'margin-top:8px' }, b.city));
      (b.streetFood || []).forEach((s) => card.append(boardRow(`${s.name} — ${s.dish}`, [s.price, s.when].filter(Boolean).join(' · '), s.tip)));
      card.append(h('button', { class: 'btn ghost block', style: 'margin-top:4px', onclick: () => go(`#board-${b.country}-${b.slug}`) }, `📋 ${b.city} noticeboard`));
    });
    wrap.append(card);
  }
  if (!places.length && !boards.length) wrap.append(h('p', { class: 'empty' }, 'No street-food entries for this country yet — more cities are being added.'));
  mount(wrap, '#home');
}

function settingsScreen() {
  const p = store.profile;
  const wrap = h('div', { class: 'screen' });
  wrap.append(topbar('Settings'));

  const card = h('div', { class: 'card' });

  card.append(field('Your name (optional)', h('input', {
    type: 'text', value: p.name, oninput: (e) => { p.name = e.target.value; save(); },
  })));

  card.append(field('Home currency', selectEl(['USD', 'EUR', 'GBP', 'AUD', 'CAD', 'SGD', 'ILS'], p.homeCurrency,
    (v) => { p.homeCurrency = v; save(); })));

  card.append(field('Default phrasebook language',
    selectEl([['', 'Auto — match where I am']].concat(Object.values(LANGUAGES).map((b) => [b.lang, b.label])), p.defaultLang,
      (v) => { p.defaultLang = v; save(); })));

  card.append(field('Budget', selectEl([['flexible', 'Any / flexible'], ['low', 'Budget'], ['mid', 'Mid'], ['high', 'Higher-end']],
    p.prefs.budget, (v) => { p.prefs.budget = v; save(); })));

  // interests
  const selInterests = new Set(p.prefs.interests || []);
  const intChips = h('div', { class: 'chips' }, INTERESTS.map((it) =>
    h('button', { class: 'chip', 'aria-pressed': selInterests.has(it.id) ? 'true' : 'false',
      onclick: (e) => {
        if (selInterests.has(it.id)) selInterests.delete(it.id); else selInterests.add(it.id);
        p.prefs.interests = [...selInterests]; save();
        e.currentTarget.setAttribute('aria-pressed', selInterests.has(it.id) ? 'true' : 'false');
      } }, it.label)));
  card.append(field('Interests', intChips));

  // Theme picker grouped Day / Night. Two dark themes (Night Market, Psych Night) and
  // three day themes; Classic follows the day/night (or fixed) light-dark setting below.
  const curSkin = p.skin || 'classic';
  const opt = (v, l) => h('option', { value: v, selected: v === curSkin ? '' : null }, l);
  card.append(field('Theme', h('select', {
    onchange: (e) => { p.skin = e.target.value; save(); applyTheme(); },
  }, [
    opt('classic', 'Classic sunset (day / night)'),
    h('optgroup', { label: '☀︎ Day' }, [
      opt('silk', 'Silk Route'), opt('tropical', 'Tropical Pop'), opt('psych', 'Cambodian Psych ’60s–’70s'),
    ]),
    h('optgroup', { label: '☾ Night' }, [
      opt('night', 'Night Market'), opt('psychnight', 'Psych Night'),
    ]),
  ])));

  card.append(field('Day / night (Classic only)', selectEl([['auto', 'Auto — light by day, dark at night'], ['light', 'Always light'], ['dark', 'Always dark']], p.theme || 'auto',
    (v) => { p.theme = v; save(); applyTheme(); })));

  card.append(field('Reduce motion', selectEl([['auto', 'Auto (system)'], ['on', 'On'], ['off', 'Off']], p.reducedMotion,
    (v) => { p.reducedMotion = v; save(); applyTheme(); })));

  card.append(field('Text size', selectEl([['s', 'Small'], ['m', 'Medium'], ['l', 'Large']], p.textScale || 'm',
    (v) => { p.textScale = v; save(); applyTheme(); })));
  wrap.append(card);

  // live translate
  const tcard = h('div', { class: 'card' }, [
    h('h2', {}, 'Live translate'),
    h('p', { class: 'muted' }, 'Translation already works with no setup, using a free online service — just type or speak English on the Talk screen. The phrasebook itself works fully offline. The advanced fields below are optional: point the app at your own LibreTranslate-compatible server for higher volume or full privacy. Your endpoint and key stay on this device, and the server origin must also be added to the page Content-Security-Policy (connect-src) in index.html.'),
  ]);
  tcard.append(field('Translate endpoint URL', h('input', {
    type: 'url', placeholder: 'https://your-endpoint/translate', value: p.translateEndpoint,
    oninput: (e) => { p.translateEndpoint = e.target.value.trim(); save(); },
  })));
  tcard.append(field('API key (optional)', h('input', {
    type: 'password', value: p.translateKey, oninput: (e) => { p.translateKey = e.target.value.trim(); save(); },
  })));
  wrap.append(tcard);

  // help & feedback
  wrap.append(h('div', { class: 'card' }, [
    h('h2', {}, 'Help & feedback'),
    h('button', { class: 'btn ghost block', onclick: () => go('#help') }, '❓ Help & FAQ'),
    field('Feedback address (optional)', h('input', {
      type: 'email', placeholder: 'where “Email feedback” is sent', value: p.feedbackTo || '',
      oninput: (e) => { p.feedbackTo = e.target.value.trim(); save(); },
    })),
    h('p', { class: 'disclaimer' }, 'Set an address to collect feedback by email; otherwise the feedback screen uses your device share sheet or clipboard. This stays on your device and is never committed to the app.'),
  ]));

  // reset
  wrap.append(h('div', { class: 'card' }, [
    h('button', { class: 'btn ghost block', onclick: () => {
      if (confirm('Reset all settings and saved places on this device?')) { resetAll(); applyTheme(); go('#home'); }
    } }, 'Reset everything'),
    h('p', { class: 'disclaimer' }, 'Mekong stores everything locally. Clearing your browser data also resets it.'),
  ]));
  mount(wrap, '#settings');
}

let _fieldSeq = 0;
function field(labelText, control) {
  // Associate the <label> with its control (programmatic label for screen readers):
  // give the labelable element an id and point the label's `for` at it.
  const target = control && (/^(INPUT|SELECT|TEXTAREA)$/.test(control.tagName || '')
    ? control
    : (control.querySelector && control.querySelector('input, select, textarea')));
  if (target && !target.id) target.id = 'fld-' + (++_fieldSeq);
  return h('div', { class: 'field' }, [h('label', target && target.id ? { for: target.id } : {}, labelText), control]);
}
function selectEl(options, current, onchange) {
  const opts = options.map((o) => Array.isArray(o) ? o : [o, o]);
  return h('select', { onchange: (e) => onchange(e.target.value) },
    opts.map(([val, lbl]) => h('option', { value: val, selected: val === current ? '' : null }, lbl)));
}

// ---- router -----------------------------------------------------------------
let liveMapCtrl = null;   // the map controller for the current #map view, if any
let liveCleanup = null;   // per-screen teardown (e.g. release the screen wake lock)
function render() {
  applyTheme();
  // Tear down any live map before rendering the next screen (frees the WebGL context
  // and stops the GPS watcher — prevents the map dying after repeated visits).
  if (liveMapCtrl) { try { liveMapCtrl.dispose(); } catch { /* noop */ } liveMapCtrl = null; }
  if (liveCleanup) { try { liveCleanup(); } catch { /* noop */ } liveCleanup = null; }
  const hash = location.hash || '#home';
  const [head, ...rest] = hash.slice(1).split('-');
  const arg = rest.join('-');
  try {
    // First run: learn the traveller before dropping them on the menu. Only intercepts the
    // home route, so any deep link (a shared place/board) still opens directly.
    if (!store.profile.seenWelcome && (head === '' || head === 'home')) return welcomeScreen();
    switch (head) {
      case '': case 'home': return homeScreen();
      case 'welcome': return welcomeScreen();
      case 'country': return countryHubScreen(arg);
      case 'nearby': return nearbyScreen();
      case 'currency': return currencyScreen();
      case 'phrasebook': return phrasebookScreen(arg);
      case 'places': return placesScreen(arg);
      case 'place': return placeScreen(arg);
      case 'prices': return pricesScreen(arg);
      case 'transport': return transportScreen(arg);
      case 'route': return planRouteScreen();
      case 'info': return infoScreen(arg);
      case 'saved': return savedScreen();
      case 'collection': return collectionScreen(arg);
      case 'map': return mapScreen();
      case 'crossings': return crossingsScreen();
      case 'pools': return poolsScreen(arg);
      case 'addpin': return addPinScreen();
      case 'journal': return journalDispatch(arg);
      case 'journey': return journeyScreen();
      case 'calendar': return calendarDispatch(arg);
      case 'events': return eventsScreen(arg);
      case 'event': return eventScreen(arg);
      case 'weather': return weatherScreen(arg);
      case 'today': return daySuggestScreen(arg);
      case 'access': return accessScreen(arg);
      case 'baby': return babyScreen(arg);
      case 'arrival': return arrivalScreen(arg);
      case 'visa': return visaScreen(arg);
      case 'schedules': return schedulesScreen(arg);
      case 'food': return foodScreen(arg);
      case 'dish': return dishScreen(arg);
      case 'produce': return arg ? produceDetail(arg) : produceScreen();
      case 'nature': return natureScreen();
      case 'sounds': return soundsScreen();
      case 'species': return speciesScreen(arg);
      case 'search': return searchScreen();
      case 'sos': return sosScreen(arg);
      case 'trip': return tripScreen();
      case 'bargain': return bargainScreen();
      case 'checklist': return checklistScreen(arg);
      case 'bestof': return bestofScreen(arg);
      case 'bestlist': return bestListScreen(arg);
      case 'vault': return vaultScreen();
      case 'help': return helpScreen();
      case 'feedback': return feedbackScreen(arg);
      case 'circle': return circleScreen();
      case 'add': return addContactScreen(arg);
      case 'in': return importShareScreen(arg);
      case 'inbox': return inboxScreen();
      case 'thread': return threadScreen(arg);
      case 'msg': return importMessageScreen(arg);
      case 'foryou': return foryouScreen();
      case 'plans': return plansScreen();
      case 'board': return boardScreen(arg);
      case 'streetfood': return streetfoodScreen();
      case 'settings': return settingsScreen();
      default: return homeScreen();
    }
  } catch (err) {
    const app = document.getElementById('app');
    app.innerHTML = '';
    app.append(h('div', { class: 'screen' }, [
      h('h1', {}, 'Something went wrong'),
      h('p', { class: 'muted' }, String(err && err.message || err)),
      h('button', { class: 'btn', onclick: () => go('#home') }, 'Back to home'),
    ]));
  }
}

window.addEventListener('hashchange', () => { stopSpeak(); render(); });
// Auto day/night flips as the user navigates (applyTheme runs each render); this keeps a
// left-open app in step with dawn/dusk too. Only re-applies while on the auto Classic theme.
setInterval(() => {
  if ((store.profile.skin || 'classic') === 'classic' && (store.profile.theme || 'auto') === 'auto') applyTheme();
}, 10 * 60 * 1000);
// Re-render when device voices finish loading so speak buttons enable on the phrasebook.
if (typeof window !== 'undefined' && window.speechSynthesis) {
  try { window.speechSynthesis.addEventListener('voiceschanged', () => {
    if ((location.hash || '').startsWith('#phrasebook')) render();
  }); } catch { /* older API */ }
}
render();

// Refresh exchange rates in the background when online; update the converter if open.
if (online()) refreshRates().then(() => { if ((location.hash || '').startsWith('#currency')) render(); }).catch(() => {});
