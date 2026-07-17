// Mekong app shell + hash router. Vanilla ES6, offline-first. Screens read all
// content from js/data/regions.js so no destination is hard-coded here.

import {
  store, save, resetAll, exportData, importData, isFavorite, toggleFavorite, prefersReducedMotion,
  ensureDurability, storageStatus, requestPersistence,
  createCollection, deleteCollection, togglePlaceInCollection, collectionsForItem,
  addPin, updatePin, deletePin, getPin, getPlaceData, setPlaceField, getJellyReports, addJellyReport, todayKey,
  addJournalEntry, updateJournalEntry, deleteJournalEntry, journalEntries,
  getAlbum, addAlbumPhoto, updateAlbumPhoto, deleteAlbumPhoto,
  addCalendarItem, updateCalendarItem, deleteCalendarItem,
  isChecked, toggleChecklistItem,
  addStop, removeStop, moveStop, updateStop, addBudgetItem, deleteBudgetItem, updateBudgetItem,
  setMyStay, getMyStay, clearMyStay,
  getLastFix, setLastFix,
  getSavedAreas, addSavedArea, removeSavedArea,
  ensureMe, setMe, getContacts, getContact, addContact, removeContact,
  getInbox, addInboxItem, deleteInboxItem, unreadInboxCount,
  getListings, addListing, removeListing,
  getThread, addMessage,
  getBoardPosts, addBoardPost, deleteBoardPost,
  getAudioPacks, hasAudioPack, addAudioPack,
} from './state.js';
import { suggestPlans } from './data/itineraries.js';
import { encodeCard, parseCard, shareUrl, encodeShare, parseShare, encodeMessage, parseMessage } from './social.js';
import { CHECKLIST, CHECKLIST_UNIVERSAL } from './data/checklist.js';
import { bestForCountry, getBestList } from './data/bestof.js';
import { PHOTOS } from './data/photos.js';
import { CROSSINGS } from './data/borders.js';
import { TRANSPORT_HUBS, TRANSIT_SOURCES, GET_AROUND } from './data/transit.js';
import { putBlob, getBlob, delBlob, getAllBlobs } from './idb.js';
import { zipStore, toCsv, buildXlsx, downloadBlob, shareOrDownload } from './exporter.js';
import {
  available as vaultAvailable, isInitialised as vaultInitialised, isUnlocked as vaultUnlocked,
  lock as vaultLock, setup as vaultSetup, unlock as vaultUnlock, addDocument as vaultAdd,
  listDocuments as vaultList, getDocument as vaultGet, deleteDocument as vaultDelete, wipeVault as vaultWipe,
  addSecureNote as vaultAddNote, getNoteText as vaultGetNote, exportVault, importVault,
  changePasscode as vaultChangePasscode, getHint as vaultGetHint, setHint as vaultSetHint,
  hasRecoveryCode as vaultHasRecovery, createRecoveryCode as vaultCreateRecovery,
  unlockWithRecovery as vaultUnlockRecovery, resetPasscodeWithRecovery as vaultResetWithRecovery,
} from './vault.js';
// Private personal calendar (cycle/period, mood, symptoms, intimacy, pregnancy). On-device,
// opt-in, optional PIN. See js/personal.js. Namespaced to keep the many helpers clear.
import * as personal from './personal.js';
// On-device contribution points + levels (Google Maps Local Guides-style, no accounts).
import * as gamify from './gamify.js';
// Server-free reminders (per-entry lead time + daily journal nudge; in-app + best-effort notifications).
import * as reminders from './reminders.js';
import { h, esc, money, range, mapsUrl, mapsDirUrl, debounce, geolocate, bearing, compass, fmtDistance, titleCase } from './util.js';
import { speak, stop as stopSpeak, hasVoiceFor, say, canSay, ttsUrl, setSavedPacks } from './tts.js';
import { translate, isConfigured as translateConfigured } from './translate.js';
import { routeNodes, planRoutes, isRouteNode } from './journey.js';
import { HISTORY } from './data/history.js';
import { getRates, refreshRates, convert } from './currency.js';
import { WEATHER_SPOTS, wmo, isWet, spotKey, spotsForCountry, defaultSpot, nearestSpot, getCachedWeather, refreshWeather, refreshMany, getCachedMany, refreshMarine, getCachedMarine, refreshAir, getCachedAir } from './weather.js';
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
import { FAMILY, getFamily } from './data/family.js';
import { POOLS, poolsForCountry } from './data/pools.js';
import { REGION_PATHS, REGION_LABELS, REGION_VIEWBOX, REGION_RIVER, REGION_PROJ } from './data/geo.js';

// ---- service worker + theme -------------------------------------------------
// Register the service worker only in a secure web context (https / http localhost).
// In the native iOS wrapper the app is served over a custom scheme where SW cannot
// run and is not needed (all assets are bundled on-device), so skip it there.
if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.protocol === 'http:')) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').then((reg) => {
      // When a new version installs while the app is already open, offer a one-tap refresh
      // instead of silently letting a fresh cache serve into the currently-loaded modules.
      reg.addEventListener('updatefound', () => {
        const nw = reg.installing;
        if (!nw) return;
        nw.addEventListener('statechange', () => {
          if (nw.state === 'installed' && navigator.serviceWorker.controller) showUpdateToast();
        });
      });
    }).catch(() => { /* SW unavailable — the app still works, just without offline caching */ });
  });
}

// A small, non-blocking "update ready" toast pinned above the tab bar. Tapping it reloads
// so the newly-cached version takes over cleanly.
let updateToastShown = false;
function showUpdateToast() {
  if (updateToastShown) return;
  updateToastShown = true;
  const toast = h('div', { class: 'update-toast', role: 'status' }, [
    h('span', {}, 'A new version is ready.'),
    h('button', { class: 'update-toast-btn', onclick: () => location.reload() }, 'Refresh'),
    h('button', { class: 'update-toast-x', 'aria-label': 'Dismiss', onclick: () => toast.remove() }, '✕'),
  ]);
  document.body.append(toast);
}

// Capture the Android/Chrome install prompt so the app can offer an "Install" button in
// Settings (browsers only fire this once, and only when the PWA is installable). Cleared
// once installed. iOS Safari never fires it, so Settings shows a Share-sheet hint instead.
let deferredInstallPrompt = null;
if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredInstallPrompt = e;
    if ((location.hash || '').startsWith('#settings')) render();
  });
  window.addEventListener('appinstalled', () => {
    deferredInstallPrompt = null;
    if ((location.hash || '').startsWith('#settings')) render();
  });
}

// Classic light/dark. 'auto' first honours the DEVICE dark-mode setting (so a phone kept
// in dark mode is respected all day, matching platform convention); when the device
// expresses no dark preference it falls back to the local clock (06:00–18:00 = light),
// which tracks near-equatorial SE-Asia daylight and needs no network, so it works offline.
function systemPrefersDark() {
  try { return !!(window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches); }
  catch { return false; }
}
function classicMode() {
  const t = store.profile.theme || 'auto';
  if (t === 'light' || t === 'dark') return t;
  if (systemPrefersDark()) return 'dark';
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
  // Keep the browser/OS chrome (address bar, iOS status bar) in step with the active
  // theme or skin, so a dark night theme does not sit under a bright orange bar. Reads
  // the resolved surface token so every skin tints the chrome for free.
  try {
    const cs = getComputedStyle(root);
    const surface = (cs.getPropertyValue('--bg') || cs.getPropertyValue('--cream') || '').trim();
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta && surface) meta.setAttribute('content', surface);
  } catch { /* getComputedStyle unavailable */ }
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
const APP_VERSION = 'mk-v0.246.0';

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
  heart: '<path d="M12 20s-6.5-4.3-9-8.2C1.1 8.5 2.8 5 6.2 5c2 0 3.3 1.1 3.8 2.2C10.5 6.1 11.8 5 13.8 5c3.4 0 5.1 3.5 3.2 6.8C18.5 15.7 12 20 12 20z"/>',
  temple: '<path d="M12 3 4 7v2h16V7z"/><path d="M6 9v8M10 9v8M14 9v8M18 9v8"/><path d="M3 17h18v3H3z"/>',
};
const ICON = Object.fromEntries(Object.entries(ICON_PATH).map(([k, v]) => [k, svgIcon(v)]));
// A leading line-icon for an action chip; inherits the chip's text colour (incl. the
// white of a pressed chip) via stroke:currentColor, so it recolours with every theme.
const chipIcon = (name) => h('span', { class: 'chip-ic', html: ICON[name] || '' });

const TABS = [
  { hash: '#home', label: 'Home', svg: ICON.home },
  { hash: '#places', label: 'Places', svg: ICON.compass },
  { hash: '#map', label: 'Map', svg: ICON.map },
  { hash: '#phrasebook', label: 'Talk', svg: ICON.chat },
  { hash: '#settings', label: 'Settings', svg: ICON.gear },
];

function go(hash) {
  if (location.hash === hash) render();
  else location.hash = hash;
}

// In-app back stack so "‹ Back" returns to the screen you actually came FROM, not a
// hardcoded parent (fixes "I opened this from Search and Back sent me somewhere I never
// saw"). The per-screen backHash is kept as the FALLBACK for a fresh load / deep link.
let navStack = [];
let poppingBack = false;
let lastHash = (typeof location !== 'undefined' && location.hash) || '#home';
function goBack(fallback) {
  // Always return to the PREVIOUS page — never jump to Home (there is a Home tab for that).
  if (navStack.length) {
    poppingBack = true;
    const target = navStack.pop();
    if (location.hash === target) { poppingBack = false; render(); }
    else location.hash = target;
    return;
  }
  // No in-app history yet (fresh load / deep link): use the browser's history if we can,
  // otherwise fall back to this screen's semantic parent.
  if (typeof window !== 'undefined' && window.history && window.history.length > 1) { poppingBack = true; window.history.back(); return; }
  go(fallback || '#home');
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
    backHash ? h('button', { class: 'back', onclick: () => goBack(backHash) }, '‹ Back') : null,
    h('h1', {}, title),
    onSaved ? null : iconBtn('Saved & collections', '#saved', ICON.star),
    onSettings ? null : iconBtn('Settings', '#settings', ICON.gear),
    // Persistent safety anchor: emergency help one tap from every screen (kept as the
    // bold red marker so it stands out from the neutral menu icons).
    onSos ? null : h('button', { class: 'topbar-sos', 'aria-label': 'Emergency help', title: 'Emergency help', onclick: () => go('#sos') }, '🆘'),
  ]);
}

// Which bottom tab owns each route head. Destination discovery + on-the-ground info group
// under Places; trip planning, memories, money, social, safety and admin group under Home;
// Map/Talk/Settings own their own routes. Anything unlisted falls back to Home.
const TAB_FOR_HEAD = {
  places: '#places', place: '#places', country: '#places', nearby: '#places', arrival: '#places',
  bestof: '#places', bestlist: '#places', food: '#places', dish: '#places', produce: '#places',
  nature: '#places', sounds: '#places', species: '#places', pools: '#places', events: '#places',
  event: '#places', weather: '#places', today: '#places', prices: '#places', transport: '#places',
  route: '#places', crossings: '#places', schedules: '#places', visa: '#places', info: '#places',
  history: '#places', access: '#places', baby: '#places', family: '#places', streetfood: '#places',
  board: '#places', setcity: '#places',
  map: '#map', addpin: '#map',
  phrasebook: '#phrasebook',
  settings: '#settings',
  home: '#home', '': '#home', welcome: '#home', search: '#home', saved: '#home', collection: '#home',
  journal: '#home', scrapbook: '#home', contributions: '#home', journey: '#home', calendar: '#home',
  trip: '#home', expenses: '#home', bargain: '#home', currency: '#home', checklist: '#home',
  plans: '#home', foryou: '#home', vault: '#home', help: '#home', feedback: '#home',
  circle: '#home', add: '#home', in: '#home', inbox: '#home', thread: '#home', msg: '#home', sos: '#home',
  donate: '#home', danger: '#home', worship: '#home',
};
function activeTabForHash() {
  const head = (location.hash || '#home').replace(/^#/, '').split('-')[0];
  return TAB_FOR_HEAD[head] || '#home';
}

// The active tab is derived from the current route (not a per-screen arg), so every screen —
// including deep detail pages — highlights the correct tab instead of defaulting to Home.
function tabbar() {
  const active = activeTabForHash();
  return h('nav', { class: 'tabbar' }, TABS.map((t) =>
    h('button', {
      'aria-current': active === t.hash ? 'page' : null,
      onclick: () => go(t.hash),
    }, [h('span', { class: 'ic', html: t.svg }), h('span', {}, t.label)])));
}

function mount(node, showTabbar) {
  const app = document.getElementById('app');
  app.innerHTML = '';
  app.append(node);
  if (showTabbar) app.append(tabbar());
  window.scrollTo(0, 0);
  // Single-page accessibility: a full page load moves focus to the top and lets a screen
  // reader announce the new page. An SPA must do that itself, or keyboard and screen-reader
  // users are stranded on the old, now-removed element. Move focus to the main region and
  // announce the new screen's heading via the persistent live region.
  try {
    app.focus({ preventScroll: true });
    const heading = node.querySelector('.topbar h1, h1, h2');
    const live = document.getElementById('route-announce');
    if (live && heading) { const t = (heading.textContent || '').trim(); live.textContent = ''; setTimeout(() => { live.textContent = t; }, 60); }
  } catch { /* focus/announce is best-effort — never block a render */ }
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

// --- Suggestion rotation --------------------------------------------------
// Places the traveller marks Done or Not-interested drop out of "near me" suggestions so a
// fresh pick always takes their place — the list never shows the same set every time.
function suggestExcluded() {
  const p = store.profile.prefs;
  return new Set([...(p.doneSpots || []), ...(p.hiddenSpots || [])]);
}
// A single tap on ✓ (done) or ✕ (not interested) removes a place from the feed, so an
// accidental tap silently loses a suggestion. Confirm the intent first. Undoing a mark
// (tapping ✓ on an already-done row) never prompts — reversing is always safe.
function confirmSpotDone(name) { return confirm(`Mark “${name}” as done? It will drop out of your suggestions.`); }
function confirmSpotHide(name) { return confirm(`Not interested in “${name}”? It will stop appearing in your suggestions.`); }
function markSpotDone(id) {
  const p = store.profile.prefs;
  p.doneSpots = p.doneSpots || [];
  if (!p.doneSpots.includes(id)) p.doneSpots.push(id);
  p.hiddenSpots = (p.hiddenSpots || []).filter((x) => x !== id);
  save();
}
function hideSpot(id) {
  const p = store.profile.prefs;
  p.hiddenSpots = p.hiddenSpots || [];
  if (!p.hiddenSpots.includes(id)) p.hiddenSpots.push(id);
  save();
}
function isSpotDone(id) { return (store.profile.prefs.doneSpots || []).includes(id); }
function toggleSpotDone(id) {
  const p = store.profile.prefs;
  p.doneSpots = p.doneSpots || [];
  if (p.doneSpots.includes(id)) p.doneSpots = p.doneSpots.filter((x) => x !== id);
  else { p.doneSpots.push(id); p.hiddenSpots = (p.hiddenSpots || []).filter((x) => x !== id); }
  save();
}
function clearSuggestionMarks() { const p = store.profile.prefs; p.doneSpots = []; p.hiddenSpots = []; save(); }

// Bend a place's "right now" score toward the traveller's SITUATION, so a family with a
// baby is steered to calm, kid-friendly, accessible spots and away from nightlife, while
// other travellers are unaffected. Returns a signed adjustment added to the base score.
function profileFitAdj(p, prefs) {
  let s = 0;
  const cats = p.categories || [];
  const family = prefs.withBaby || prefs.kids || prefs.party === 'family';
  if (family) {
    if (p.kidFriendly === true) s += 24;
    if (cats.includes('nightlife')) s -= 60;                                   // not with a baby/kids
    if (prefs.withBaby && (cats.includes('hike') || cats.includes('waterfall'))) s -= 14; // hard with a pram/infant
    if (cats.some((c) => ['park', 'beach', 'zoo', 'nature'].includes(c))) s += 8;
  }
  if ((prefs.access || []).includes('mobility')) {
    if (cats.includes('hike') || cats.includes('waterfall')) s -= 40;          // step-heavy / rough ground
    if (cats.includes('viewpoint')) s -= 8;
  }
  const interests = prefs.interests || [];
  if (interests.length && cats.some((c) => interests.includes(c))) s += 10;     // a gentle nudge, never a filter
  return s;
}

// "Near me" is a DRIVE-TIME ceiling, not a straight-line radius. A haversine distance badly
// understates real travel on the region's winding roads — Pai to Chiang Mai is ~55 km as the
// crow flies but a 3-hour mountain drive — so a flat km cap would still call Chiang Mai "near
// Pai". We convert straight-line km to an estimated road drive (a winding-road multiplier and a
// realistic effective speed) and cap "near you" at about an hour give or take. Places just
// beyond that, up to a ~3-hour day trip, surface separately as "Further afield".
const ROAD_FACTOR = 1.35;       // straight-line km -> likely road km (curves, terrain, towns)
const DRIVE_KMH = 50;           // effective road speed incl. towns, stops, slow sections
const NEAR_MAX_MIN = 75;        // "within an hour give or take" — the near-me ceiling (~46 km)
const DAYTRIP_MAX_MIN = 180;    // "further afield / next destinations" — up to a ~3-hour trip
function estDriveMin(km) { return km == null ? null : Math.round((km * ROAD_FACTOR) / DRIVE_KMH * 60); }
function withinNear(km) { const m = estDriveMin(km); return m != null && m <= NEAR_MAX_MIN; }
function withinDayTrip(km) { const m = estDriveMin(km); return m != null && m > NEAR_MAX_MIN && m <= DAYTRIP_MAX_MIN; }
// Human label: a walk time under ~2.5 km, otherwise an estimated drive ("~40 min drive", "~2h drive").
function driveLabel(km) {
  if (km == null) return null;
  if (km <= 2.5) return `~${Math.max(1, Math.round((km / 4.8) * 60))} min walk`;
  // Round to 5-minute steps — an honest granularity for an estimate, and enough to keep a
  // just-near place (e.g. ~70 min) visually distinct from a just-further one (e.g. ~80 min).
  const m = Math.max(5, Math.round(estDriveMin(km) / 5) * 5);
  if (m < 60) return `~${m} min drive`;
  const hrs = Math.floor(m / 60), rem = m % 60;
  return rem ? `~${hrs}h ${rem}m drive` : `~${hrs}h drive`;
}

// ---- Colour-coded attribute/status chips ------------------------------------
// Category tags are already family-coloured (catTag). These are the OTHER little tags —
// "Good with kids", "Good in the rain", "Open now", stay type, "may not suit you" — which
// used to be one flat colour. attrClass() maps a chip's text/emoji to a semantic colour
// class so every kind of tag on the site reads at a glance. attrTag() builds the pill.
function attrClass(text) {
  const t = String(text).toLowerCase();
  if (/may not suit|not a good fit|⚠/.test(t)) return 'at-warn';
  if (/closed/.test(t)) return 'at-closed';
  if (/open now/.test(t)) return 'at-open';
  if (/kids|family|👨‍👩‍👧/.test(t)) return 'at-kids';
  if (/rain|☔|indoor/.test(t)) return 'at-rain';
  if (/cool off|🏊|heat|❄/.test(t)) return 'at-heat';
  if (/market|🛍|🧺/.test(t)) return 'at-market';
  if (/step[- ]free|wheelchair|accessible|♿|walking|steps|mobility/.test(t)) return 'at-access';
  if (/veg|vegan|kosher|halal/.test(t)) return 'at-veg';
  if (/morning|cool-hours|🌅|clear weather|☀/.test(t)) return 'at-cool';
  if (/sunset|evening|🌇|rooftop|buzzing|street-food|night|🌙/.test(t)) return 'at-evening';
  if (/hostel|hotel|guesthouse|homestay|resort|apartment|short stay|long stay|stay/.test(t)) return 'at-stay';
  return 'at-info';
}
function attrTag(text, base) { return h('span', { class: `${base || 'attr-tag'} ${attrClass(text)}` }, text); }

// Best-effort open/closed at the current local hour (null when hours are unknown/unparseable,
// so we never wrongly call an unknown place "closed").
function openStateNow(p) { return isOpenNow(p.hours, new Date().getHours()); }

// Whether a place is a POOR fit for who the traveller is travelling as, with a short reason.
// Only flags what the data actually supports (kid-suitability, mobility) — it never invents a
// diet verdict for an eatery, since places carry no per-venue diet data (dishes do). Poor fits
// are sorted after good fits and tagged, never hidden.
function placeFitReason(p, prefs) {
  const cats = p.categories || [];
  const family = prefs.withBaby || prefs.kids || prefs.party === 'family';
  if (family && p.kidFriendly === false) return 'May not suit kids';
  if ((prefs.access || []).includes('mobility') && (cats.includes('hike') || cats.includes('waterfall'))) return 'Lots of walking / steps';
  return null;
}

function scoreForNow(p, ctx) {
  if (!p.coords) return -Infinity;
  const km = haversineKm(ctx.fix, p.coords);
  if (!withinNear(km)) return -Infinity;         // ~1-hour-drive "near you" ceiling — see NEAR_MAX_MIN
  const cats = p.categories || [];
  const meta = PART_META[ctx.part];
  let s = 30 - km * 0.9;                          // proximity
  if (cats.some((c) => meta.cats.includes(c))) s += 30;
  if (cats.includes('market')) {
    // Day-specific markets (walking streets, Fri–Sun floating markets) are closed on
    // off-days, so penalise them hard for "now"; boost any market that is on today.
    if (marketOnToday(p, ctx.dow)) s += marketOpenDays(p) ? 14 : (ctx.isWeekend ? 8 : 0);
    else s -= 30;
  }
  if (ctx.raining) {
    if (cats.some((c) => INDOOR_CATS.includes(c))) s += 16;
    if (cats.some((c) => OUTDOOR_CATS.includes(c))) s -= 22;
  }
  if (ctx.part === 'midday' && !ctx.raining) {
    if (cats.includes('hike')) s -= 10;
    if (cats.includes('hotspring') || cats.includes('beach')) s += 6;
    if (cats.some((c) => INDOOR_CATS.includes(c))) s += 6;
  }
  // Suggestions default to OPEN: a place we know is shut right now is not offered as a
  // "go now" pick (unknown hours are still fine — we do not punish what we cannot parse).
  const open = isOpenNow(p.hours, ctx.hour);
  if (open === false) return -Infinity;
  if (open === true) s += 12;
  s += (Number(p.rating) || 0) * 1.2;            // gentle quality tiebreak
  s += profileFitAdj(p, store.profile.prefs);    // fit to who they are travelling as
  return s;
}

function whyNow(p, ctx) {
  const cats = p.categories || [];
  const morning = ctx.part === 'earlyMorning' || ctx.part === 'morning';
  const evening = ctx.part === 'evening' || ctx.part === 'night' || ctx.part === 'lateNight';
  // Make the situation-fit visible: when a family/with-a-baby traveller is shown a
  // kid-friendly place (which profileFitAdj boosted), say so — the "made for you" reason.
  const prefs = store.profile.prefs;
  if ((prefs.withBaby || prefs.kids || prefs.party === 'family') && p.kidFriendly === true) return 'Good with kids';
  if (ctx.raining && cats.some((c) => INDOOR_CATS.includes(c))) return 'Good in the rain';
  if (cats.includes('market') && marketOpenDays(p) && marketOnToday(p, ctx.dow)) return 'Market on today';
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

  // Rank every candidate once; drawPicks() then shows the top few MINUS anything marked
  // Done or Not-interested, so dismissing one instantly promotes the next-best in its place.
  const ranked = allPlaces({ country: ctx.country })
    .map((p) => ({ p, s: scoreForNow(p, ctx) }))
    .filter((x) => x.s > -Infinity)
    .sort((a, b) => b.s - a.s);
  const tipEl = h('p', { class: 'muted', style: 'margin:6px 0 10px' }, meta.tip);
  const listWrap = h('div', { class: 'rn-list' });
  const footEl = h('div', {});
  card.append(tipEl, listWrap, footEl);

  function drawPicks() {
    const ex = suggestExcluded();
    const picks = ranked.filter((x) => !ex.has(x.p.id)).slice(0, 5);
    listWrap.innerHTML = ''; footEl.innerHTML = '';
    if (!picks.length) {
      tipEl.textContent = ranked.length
        ? `${meta.tip} That is everything nearby for now — reset below to see them again.`
        : `${meta.tip} Nothing is mapped very close — try “What’s near me”.`;
    } else {
      tipEl.textContent = meta.tip;
      picks.forEach(({ p }) => {
        const reason = whyNow(p, ctx);
        const km = haversineKm(ctx.fix, p.coords);
        listWrap.append(h('div', { class: 'rn-item' }, [
          h('button', { class: 'rn-open has-thumb', onclick: () => go(`#place-${p.id}`) }, [
            rnThumb(p),
            h('div', { class: 'rn-textcol' }, [
              h('div', { class: 'rn-item-main' }, [
                h('span', { class: 'rn-name' }, p.name),
                (() => { const fit = placeFitReason(p, store.profile.prefs); return fit ? attrTag('⚠️ ' + fit) : null; })(),
                reason ? attrTag(reason) : null,
              ]),
              h('div', { class: 'rn-meta muted' }, `${titleCase((p.categories || [])[0] || 'Place')} · ${fmtDistance(km)} · ${p.city}`),
            ]),
          ]),
          h('div', { class: 'rn-actions' }, [
            h('button', { class: 'rn-act done', title: 'I did this — swap in something new', 'aria-label': `Mark ${p.name} as done`, onclick: () => { if (confirmSpotDone(p.name)) { markSpotDone(p.id); drawPicks(); } } }, '✓'),
            h('button', { class: 'rn-act', title: 'Not interested — show me something else', 'aria-label': `Not interested in ${p.name}`, onclick: () => { if (confirmSpotHide(p.name)) { hideSpot(p.id); drawPicks(); } } }, '✕'),
          ]),
        ]));
      });
    }
    const pf = store.profile.prefs;
    const nDone = (pf.doneSpots || []).length, nHid = (pf.hiddenSpots || []).length;
    if (nDone || nHid) {
      footEl.append(h('button', { class: 'rn-reset', onclick: () => { clearSuggestionMarks(); drawPicks(); } },
        `↺ ${[nDone ? `${nDone} done` : '', nHid ? `${nHid} skipped` : ''].filter(Boolean).join(' · ')} — reset`));
    }
  }
  drawPicks();
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

// Offline manual location: pick your city so distances, weather, "near me" and local
// prices all match — no GPS required. Used inline on the hub and full-screen at #setcity.
function whereAmICard(cc) {
  const c = getCountry(cc);
  const cur = focusSpot(cc && getCountry(cc) ? cc : undefined).spot;
  return h('div', { class: 'card' }, [
    h('h2', { style: 'margin-top:0' }, '📍 Where are you?'),
    h('p', { class: 'muted', style: 'margin:4px 0 8px' }, `Set your city so distances, weather and “near me” match where you are${c ? ' in ' + c.name : ''}. Works offline — no GPS needed.`),
    field('Your location', locationSelect(spotKey(cur), (key) => { const s = spotForKey(key); if (s) { setFocusSpot(s); render(); } })),
  ]);
}

function setCityScreen(cc) {
  const wrap = h('div', { class: 'screen' });
  wrap.append(topbar('Set your location', cc && getCountry(cc) ? `#country-${cc}` : '#home'));
  wrap.append(h('p', { class: 'muted' }, 'Choose where you are so distances, weather, “near me” and local prices all match — even with no signal or GPS off.'));
  // One dropdown, defaulting to your current (or last-set) location, grouped by country.
  const cur = focusSpot(cc && getCountry(cc) ? cc : undefined).spot;
  wrap.append(h('div', { class: 'card' }, [
    field('Your location', locationSelect(spotKey(cur), (key) => { const s = spotForKey(key); if (s) { setFocusSpot(s); go(`#country-${s.country}`); } })),
    h('p', { class: 'tiny muted', style: 'margin:6px 0 0' }, `Currently: ${cur.city}. Works offline — no GPS needed.`),
  ]));
  mount(wrap, '#home');
}

// In-depth history & culture: the full country read PLUS every city history we hold, so
// there is somewhere to go deeper than the collapsed hub card.
function historyScreen(cc) {
  const c = getCountry(cc);
  const hi = countryHistory(cc);
  const wrap = h('div', { class: 'screen' });
  wrap.append(topbar(c ? `${c.name} — history` : 'History & culture', c ? `#country-${cc}` : '#home'));
  if (!hi) { wrap.append(h('p', { class: 'empty' }, 'History for this country is on the way.')); mount(wrap, 'home'); return; }
  wrap.append(h('div', { class: 'card history-card' }, [h('h2', { style: 'margin-top:0' }, 'The short history'), h('p', {}, hi.blurb)]));
  const kf = knownForRow(hi.knownFor); if (kf) wrap.append(h('div', { class: 'card' }, [h('h3', { style: 'margin-top:0' }, 'Known for'), kf]));
  if (hi.cultureTip) wrap.append(h('div', { class: 'card' }, [h('h3', { style: 'margin-top:0' }, '🙏 Cultural respect'), h('p', {}, hi.cultureTip)]));
  const cityKeys = Object.keys(HISTORY.cities || {}).filter((k) => k.startsWith(cc + '-'));
  if (cityKeys.length) {
    wrap.append(h('h2', { class: 'home-section' }, 'City by city'));
    cityKeys.forEach((k) => {
      const ci = HISTORY.cities[k]; if (!ci || !ci.blurb) return;
      wrap.append(h('details', { class: 'filters-collapse' }, [
        h('summary', {}, ci.name || k),
        h('div', {}, [h('p', {}, ci.blurb), knownForRow(ci.knownFor), ci.bestTime ? h('p', { class: 'culture-tip' }, `🗓 Best time: ${ci.bestTime}`) : null]),
      ]));
    });
  }
  if (hi.sources && hi.sources.length) wrap.append(h('p', { class: 'disclaimer' }, `Sources: ${hi.sources.join(', ')}`));
  mount(wrap, 'home');
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
    isRouteNode(cityName) ? h('button', { class: 'chip', onclick: () => { planTo = cityName; go('#route'); } }, [chipIcon('route'), 'Get here']) : null,
    getBoard(cc, slug) ? h('button', { class: 'chip', onclick: () => go(`#board-${cc}-${slug}`) }, [chipIcon('board'), 'Local finds']) : null,
    h('button', { class: 'chip', onclick: () => go(`#weather-${cc}`) }, [chipIcon('cloud'), 'Weather']),
    (c && c.lang) ? h('button', { class: 'chip', onclick: () => go(`#phrasebook-${c.lang}`) }, [chipIcon('chat'), 'Phrasebook']) : null,
    h('button', { class: 'chip', onclick: () => go('#sos') }, [chipIcon('alert'), 'Emergency']),
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

// Long-stay & remote-work routes, verified July 2026 by WebSearch. These are nationality-
// and policy-dependent and change often, so every entry defers to the official portal.
// This is NOT tourist entry (that is VISA above) — it is for staying longer or working
// remotely, the part digital nomads and retirees ask about.
const LONG_STAY = {
  th: {
    note: 'Thailand has genuine long-stay routes for remote workers and retirees.',
    options: [
      { name: 'DTV — Destination Thailand Visa', who: 'Remote workers for foreign employers or clients, freelancers, and “soft-power” activities (Muay Thai, courses, medical stays)', duration: '5-year, multiple-entry; 180 days per stay, extendable once by +180', note: 'Proof of funds around 500,000 THB; you may work only for foreign clients, not Thai employers. Application fee about 10,000 THB.' },
      { name: 'LTR — Long-Term Resident', who: 'Wealthy pensioners (50+, roughly USD 80k/yr income), work-from-Thailand professionals, high earners and investors', duration: '10-year, issued as 5+5, run by the Board of Investment', note: 'Higher income and asset thresholds with more documentation; includes tax benefits on foreign income and simpler re-entry.' },
    ],
    nomad: 'Chiang Mai is the region’s biggest nomad hub, with many cafés and coworking spaces (for example Punspace and CAMP); Bangkok, Phuket and Koh Lanta also have coworking. Spending 180+ days in a tax year can make you a Thai tax resident — take advice.',
    official: { name: 'Thailand BOI — LTR visa', url: 'https://ltr.boi.go.th/' },
    sources: [ { org: 'Thailand E-Visa (MFA)', url: 'https://www.thaievisa.go.th/' }, { org: 'Thailand BOI — LTR visa', url: 'https://ltr.boi.go.th/' } ],
    asOf: '2026-07',
  },
  vi: {
    note: 'Vietnam has no dedicated digital-nomad or retirement visa (a Golden Visa was proposed in 2025 but is not yet in force).',
    options: [
      { name: '90-day e-Visa (multiple entry)', who: 'All nationalities; what most remote workers use', duration: '90 days, multiple entry; cannot be extended or renewed from inside Vietnam', note: 'When it expires you must leave and apply again from abroad (a “visa run”). Apply only on the official portal. Fee about USD 50.' },
    ],
    nomad: 'Da Nang and Ho Chi Minh City are the main nomad bases, with coworking (for example Toong and Dreamplex) and strong, inexpensive internet. Spending 183+ days in a calendar year can make you a tax resident — take advice.',
    official: { name: 'Vietnam Immigration — official e-Visa', url: 'https://evisa.gov.vn/' },
    sources: [ { org: 'Vietnam Immigration (official e-Visa)', url: 'https://evisa.gov.vn/' } ],
    asOf: '2026-07',
  },
  kh: {
    note: 'Cambodia has no digital-nomad visa, but its long-stay business route is unusually simple.',
    options: [
      { name: 'E-class visa + EB extension', who: 'Long-stayers and those working or running a business', duration: 'Extendable indefinitely (1/3/6/12-month); about USD 285 for the 12-month extension', note: 'A work permit is now enforced — EB renewals are refused without one. Enter on the ordinary (E) visa, then extend as EB.' },
      { name: 'ER retirement extension', who: 'Retirees aged 55+', duration: '12-month, renewable; about USD 275–300/year via an agent', note: 'Requires proof of retirement or means; usually arranged through a visa agent.' },
    ],
    nomad: 'Phnom Penh and Siem Reap have coworking spaces and reliable internet, and the E→EB route makes long stays straightforward compared with neighbours.',
    official: { name: 'Cambodia e-Visa (official)', url: 'https://www.evisa.gov.kh/' },
    sources: [ { org: 'Cambodia e-Visa (official)', url: 'https://www.evisa.gov.kh/' } ],
    asOf: '2026-07',
  },
  la: {
    note: 'Laos has no digital-nomad or retirement visa; long stays are built from tourist extensions or a sponsored business visa.',
    options: [
      { name: 'Tourist visa + extensions', who: 'Most long-stayers', duration: 'Tourist e-Visa or visa on arrival, extendable at immigration (about USD 2/day), then a border run', note: 'For anything longer you generally need a business (NI-B) visa arranged by a local sponsor or employer.' },
    ],
    nomad: 'Vientiane and Luang Prabang have some cafés and limited coworking, but internet and the nomad scene are smaller than in Thailand or Vietnam. Confirm current rules with immigration.',
    official: { name: 'Laos eVisa (official)', url: 'https://laoevisa.gov.la/' },
    sources: [ { org: 'Laos eVisa (official)', url: 'https://laoevisa.gov.la/' } ],
    asOf: '2026-07',
  },
};
// How old is a YYYY-MM or YYYY-MM-DD stamp, in days? Recomputed live on every open, so
// freshness "keeps itself up to date" without any server or manual bump.
function dataAgeDays(dateStr) {
  if (!dateStr) return null;
  const d = new Date((String(dateStr).length === 7 ? dateStr + '-01' : dateStr) + 'T00:00:00');
  if (isNaN(d.getTime())) return null;
  return Math.floor((Date.now() - d.getTime()) / 86400000);
}
// A freshness notice for time-sensitive data (e.g. visa rules). Fresh -> a quiet "checked"
// line; stale -> a prominent warning + a live link to the authoritative official source.
// This is the honest, server-free "self-update": the app can't rewrite the rules, but it
// re-checks their age every open and pushes you to the official portal the moment they age.
function freshnessNotice(dateStr, officialUrl, officialName, staleDays = 150) {
  const age = dataAgeDays(dateStr);
  if (age == null) return null;
  if (age <= staleDays) {
    return h('p', { class: 'muted', style: 'margin:2px 0 10px' }, `✓ Verified ${dateStr}. The app re-checks this date automatically and flags it here once it ages; always reconfirm on the official portal for your nationality.`);
  }
  const months = Math.max(1, Math.round(age / 30));
  return h('div', { class: 'card', style: 'border:1px solid var(--orange)' }, [
    h('strong', {}, '⚠ This may be out of date'),
    h('p', { class: 'muted', style: 'margin:4px 0 8px' }, `Last verified ${dateStr} (about ${months} month${months === 1 ? '' : 's'} ago). Visa and entry rules change often — reconfirm on the official government portal for your nationality before you rely on this.`),
    officialUrl ? h('a', { class: 'btn block', href: officialUrl, target: '_blank', rel: 'noopener' }, `🔄 Check ${officialName || 'the official portal'} now ↗`) : null,
  ]);
}

// A lighter freshness line for slower-moving reference data (prices, schedules) that has no
// single authoritative portal to deep-link. Same self-checking age logic as visa: quiet
// "verified" note while fresh, a plain "may be out of date — confirm locally" card once it
// ages past staleDays. Keeps the honest self-update promise consistent across the app.
function freshnessLine(dateStr, noun = 'This data', staleDays = 365) {
  const age = dataAgeDays(dateStr);
  if (age == null) return null;
  if (age <= staleDays) {
    return h('p', { class: 'muted', style: 'margin:2px 0 8px' }, `✓ ${noun} verified ${dateStr}; the app re-checks this date on every open and flags it here once it ages.`);
  }
  const months = Math.max(1, Math.round(age / 30));
  return h('div', { class: 'card', style: 'border:1px solid var(--orange); margin:6px 0' }, [
    h('strong', {}, `⚠ ${noun} may be out of date`),
    h('p', { class: 'muted', style: 'margin:4px 0 0' }, `Last verified ${dateStr} (about ${months} month${months === 1 ? '' : 's'} ago). Treat these as a guide and confirm current figures on the ground.`),
  ]);
}

function visaScreen(cc) {
  const v = getVisa(cc);
  const c = getCountry(cc);
  const wrap = h('div', { class: 'screen' });
  wrap.append(topbar('Entry & visa', c ? `#country-${cc}` : '#home'));
  if (!v) { wrap.append(h('p', { class: 'empty' }, 'Entry guidance for this country is on the way.')); mount(wrap, 'home'); return; }
  wrap.append(h('div', { class: 'banner' }, 'Visa rules depend on your nationality and change often. Treat this as orientation, then confirm on the official site for your passport before you travel.'));
  const fresh = freshnessNotice(v.asOf, v.officialEvisa && v.officialEvisa.url, v.officialEvisa && v.officialEvisa.name);
  if (fresh) wrap.append(fresh);
  wrap.append(h('p', {}, v.summary));
  (v.options || []).forEach((o) => {
    const card = h('div', { class: 'card' });
    card.append(h('div', { class: 'row-between' }, [h('h3', { style: 'margin:0' }, VISA_TYPE[o.type] || o.type), o.fee ? h('span', { class: 'cat-tag' }, o.fee) : null]));
    if (o.who) card.append(h('p', { class: 'tiny muted', style: 'margin:4px 0' }, o.who));
    if (o.duration) card.append(h('p', { style: 'margin:2px 0' }, `🕒 ${o.duration}`));
    if (o.howApply) card.append(h('div', { class: 'list-note' }, o.howApply));
    wrap.append(card);
  });
  // Long stay & remote work (digital nomads, retirees) — separate from tourist entry.
  const ls = LONG_STAY[cc];
  if (ls) {
    const lc = h('div', { class: 'card' }, [h('h3', { style: 'margin-top:0' }, '🧳 Long stay & remote work')]);
    if (ls.note) lc.append(h('p', { class: 'tiny muted', style: 'margin:2px 0 8px' }, ls.note));
    ls.options.forEach((o) => lc.append(h('div', { style: 'margin:6px 0' }, [
      h('strong', {}, o.name),
      o.who ? h('div', { class: 'tiny muted', style: 'margin:2px 0' }, o.who) : null,
      o.duration ? h('div', { style: 'margin:2px 0' }, `🕒 ${o.duration}`) : null,
      o.note ? h('div', { class: 'list-note' }, o.note) : null,
    ])));
    if (ls.nomad) lc.append(h('p', { class: 'tiny', style: 'margin:8px 0 0' }, [h('strong', {}, '💻 Nomad tip: '), ls.nomad]));
    if (ls.official && ls.official.url) lc.append(h('a', { class: 'btn ghost block', style: 'margin-top:8px', href: ls.official.url, target: '_blank', rel: 'noopener' }, `${ls.official.name} ↗`));
    lc.append(sourcesNote(ls.sources, ls.asOf));
    wrap.append(lc);
  }
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

// ---- TRAVELLING WITH KIDS (schools, childcare, what to do with the kids) -----
// For family travellers: things to do with children, drop-in and enrolment childcare,
// and international schools for a term abroad or relocation. Everything is orientation
// only — the screen makes that explicit and links to official sites where confirmed.
const CARE_KIND = { daycare: 'Daycare', nursery: 'Nursery', preschool: 'Preschool', 'kids-club': 'Kids’ club', babysitting: 'Babysitting', playcentre: 'Play centre' };
// The activity kinds are free-text and rich (e.g. "children's museum", "waterfall
// swimming"); pick an emoji by keyword and show the kind as a readable label rather than
// flattening everything into a dozen buckets.
function kidKindLabel(kind) {
  const k = (kind || '').toLowerCase();
  const emoji = /aquar/.test(k) ? '🐠'
    : /sanctuary|wildlife|ethical|elephant|\banimal\b/.test(k) ? '🐘'
    : /zoo|safari/.test(k) ? '🦁'
    : /water\s*-?\s*park|waterpark/.test(k) ? '💦'
    : /waterfall|swim/.test(k) ? '🏞'
    : /beach|island/.test(k) ? '🏖'
    : /museum|discovery|science|edutain/.test(k) ? '🏛'
    : /play/.test(k) ? '🧩'
    : /farm/.test(k) ? '🌾'
    : /circus|craft|workshop|show/.test(k) ? '🎨'
    : /theme|amusement/.test(k) ? '🎢'
    : /garden|nature|\bpark\b/.test(k) ? '🌳'
    : /temple|culture/.test(k) ? '🛕'
    : /view/.test(k) ? '🌄'
    : /market/.test(k) ? '🏮'
    : /flight/.test(k) ? '✈️'
    : /boat|river/.test(k) ? '🚣'
    : /landmark/.test(k) ? '📸'
    : '📍';
  const label = k ? k.replace(/[-_]/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase()) : 'Family outing';
  return `${emoji} ${label}`;
}

// One institution / venue card, shared across the three family lists.
function famCard(e, meta) {
  const card = h('div', { class: 'card fam-card' });
  card.append(h('div', { class: 'row-between' }, [
    h('h3', { style: 'margin:0' }, e.name),
    e.city ? h('span', { class: 'cat-tag' }, e.city) : null,
  ]));
  if (meta) card.append(h('p', { class: 'tiny muted', style: 'margin:4px 0' }, meta));
  if (e.note) card.append(h('p', { style: 'margin:4px 0' }, e.note));
  if (e.url) card.append(h('a', { class: 'btn ghost block', href: e.url, target: '_blank', rel: 'noopener' }, 'Official site ↗'));
  return card;
}

// Collapsible section so families can minimise what they do not need and focus.
function familySection(title, count, openDefault, nodes) {
  return h('details', { class: 'filters-collapse fam-section', open: openDefault ? '' : null }, [
    h('summary', {}, count != null ? `${title} · ${count}` : title),
    h('div', {}, nodes),
  ]);
}

function familyScreen(cc) {
  const f = getFamily(cc);
  const c = getCountry(cc);
  const wrap = h('div', { class: 'screen' });
  wrap.append(topbar('Travelling with kids', c ? `#country-${cc}` : '#home'));
  if (!f) { wrap.append(h('p', { class: 'empty' }, 'Family guidance for this country is on the way.')); mount(wrap, 'home'); return; }
  wrap.append(h('div', { class: 'banner' }, 'Orientation for families. Schools, childcare and venues change their fees, hours and enrolment — confirm directly before you rely on any of it.'));
  if (f.intro) wrap.append(h('p', {}, f.intro));

  // 1 — What to do with the kids: the guide's own kid-friendly places for this country
  // PLUS curated family venues. Leads because it serves every family, short stay or long.
  const kidPlaces = allPlaces({ country: cc }).filter((p) => p.kidFriendly === true).slice(0, 8);
  const acts = f.kidActivities || [];
  const doNodes = [];
  if (kidPlaces.length) {
    doNodes.push(h('p', { class: 'tiny muted', style: 'margin:0 0 6px' }, 'Kid-friendly places from your guide:'));
    doNodes.push(h('div', { class: 'chips', style: 'margin-bottom:8px' }, kidPlaces.map((p) =>
      h('button', { class: 'chip', onclick: () => go(`#place-${p.id}`) }, p.name))));
  }
  acts.forEach((a) => doNodes.push(famCard(a, [kidKindLabel(a.kind), a.ages ? `Ages ${a.ages}` : null].filter(Boolean).join(' · '))));
  if (doNodes.length) wrap.append(familySection('🎡 What to do with the kids', acts.length || null, true, doNodes));

  // 2 — Childcare & daycare (drop-in and enrolment)
  const care = f.childcare || [];
  if (care.length) {
    wrap.append(familySection('🧸 Childcare & daycare', care.length, false,
      care.map((x) => famCard(x, [CARE_KIND[x.kind] || x.kind, x.ages ? `Ages ${x.ages}` : null].filter(Boolean).join(' · ')))));
  }

  // 3 — International schools (families staying a term or relocating)
  const schools = f.intlSchools || [];
  if (schools.length) {
    wrap.append(familySection('🎓 International schools', schools.length, false,
      schools.map((s) => famCard({ name: s.name, city: s.city, note: s.feesNote, url: s.url },
        [s.curriculum, s.ages ? `Ages ${s.ages}` : null].filter(Boolean).join(' · ')))));
  }

  // 4 — Family tips
  if (f.tips && f.tips.length) {
    wrap.append(familySection('💡 Family tips', null, false,
      [h('div', { class: 'card' }, f.tips.map((t) => h('div', { class: 'list-note' }, t)))]));
  }

  // Baby-supplies help is one tap away for anyone travelling with a little one.
  wrap.append(h('button', { class: 'btn ghost block', style: 'margin-top:8px', onclick: () => go(`#baby-${cc}`) }, '🍼 Nappies, formula & baby basics'));

  if (f.sources && f.sources.length) wrap.append(sourcesNote(f.sources, f.asOf));
  mount(wrap, 'home');
}

function familyCard(cc) {
  if (!getFamily(cc)) return null;
  const card = h('div', { class: 'card' });
  card.append(h('h2', { style: 'margin-top:0' }, '👨‍👩‍👧 Travelling with kids'));
  card.append(h('p', { class: 'muted', style: 'margin:6px 0' }, 'What to do with the kids, childcare & daycare, and international schools for longer stays.'));
  card.append(h('button', { class: 'btn ghost block', onclick: () => go(`#family-${cc}`) }, 'Open the family guide'));
  return card;
}

// ---- JOURNEY PHASES ---------------------------------------------------------
// The four stages of a trip. The chosen phase reshapes Home so the traveller
// leads with what matters right now, while everything else is one tap away
// (collapsed, never hidden). Phase is stored in prefs.phase and self-defaults.
const PHASE_ORDER = ['planning', 'arrived', 'traveling', 'post'];
const PHASES = {
  planning: { emoji: '🗺️', label: 'Planning a trip', tagline: 'Research routes, visas and what fits you',
    groups: ['Plan & remember', 'Get your bearings', 'Money & practical', 'Eat & do', 'Get around'] },
  arrived: { emoji: '🛬', label: 'Just arrived', tagline: 'Get your bearings for the first hours',
    groups: ['Get your bearings', 'Get around', 'Money & practical', 'Eat & do', 'Plan & remember'] },
  traveling: { emoji: '🧭', label: 'While travelling', tagline: 'Day-to-day on the road',
    groups: ['Eat & do', 'Get around', 'Get your bearings', 'Plan & remember', 'Money & practical'] },
  post: { emoji: '📖', label: 'Post travel', tagline: 'Reflect and make something to keep',
    groups: ['Plan & remember', 'Money & practical', 'Eat & do', 'Get around', 'Get your bearings'] },
};

function phaseSelector() {
  const cur = store.profile.prefs.phase || '';
  return h('div', { class: 'phase-seg', role: 'group', 'aria-label': 'Your journey phase' },
    PHASE_ORDER.map((k) => {
      const p = PHASES[k];
      return h('button', {
        class: 'phase-btn', 'aria-pressed': cur === k ? 'true' : 'false',
        onclick: () => { store.profile.prefs.phase = k; save(); render(); },
      }, [h('span', { class: 'phase-emoji' }, p.emoji), h('span', { class: 'phase-lbl' }, p.label)]);
    }));
}

// The big, phase-specific "what now" actions shown above the menu.
function phaseLead(phase, cc) {
  const A = {
    planning: [
      { e: '🧭', t: 'Trip plans', h: '#plans', primary: true },
      { e: '🎯', t: 'Tune “For you”', h: '#foryou' },
      { e: '🛂', t: 'Entry & visa', h: `#visa-${cc}` },
      { e: '✅', t: 'Pre-trip checklist', h: '#checklist' },
    ],
    arrived: [
      { e: '📍', t: 'What’s near me', h: '#nearby', primary: true },
      { e: '🛬', t: 'Arrival guide', h: '#arrival' },
      { e: '🗺', t: 'Offline map', h: '#map' },
      { e: '🆘', t: 'Emergency', h: '#sos', danger: true },
    ],
    traveling: [
      { e: '🧭', t: 'Things to do', h: `#today-${cc}`, primary: true },
      { e: '📍', t: 'Near me', h: '#nearby' },
      { e: '💱', t: 'Currency', h: '#currency' },
      { e: '✍️', t: 'Journal this', h: '#journal-add' },
    ],
    post: [
      { e: '📖', t: 'Build scrapbook', h: '#scrapbook', primary: true },
      { e: '🗒', t: 'Travel journal', h: '#journal' },
      { e: '💰', t: 'Trip & budget', h: '#trip' },
      { e: '📤', t: 'Share with your circle', h: '#circle' },
    ],
  }[phase];
  if (!A) return null;
  return h('div', { class: 'home-actions phase-lead' }, A.map((x) =>
    h('button', {
      class: `btn ${x.primary ? '' : 'ghost'}`.trim(),
      style: x.danger ? 'background:var(--magenta)' : null,
      onclick: () => go(x.h),
    }, `${x.e} ${x.t}`)));
}

// ---- Journey companion: countdown (before you leave) + recap (after return) ----
// Trip start = the earliest dated stop the traveller has planned (no separate date field).
function tripStartISO() {
  const dates = (store.trip.stops || []).map((s) => s.date).filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d || ''));
  dates.sort();
  return dates[0] || null;
}
function daysUntilISO(iso) {
  const target = new Date(iso + 'T00:00:00');
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((target - today) / 86400000);
}
// One stage-aware card for Home: a countdown in the planning phase, a recap in the post phase.
function journeyCompanionCard(phase, cc) {
  if (phase === 'planning') return tripCountdownCard(cc);
  if (phase === 'post') return returnRecapCard();
  return null;
}
function tripCountdownCard(cc) {
  const start = tripStartISO();
  if (!start) {
    return h('div', { class: 'card companion-card', style: 'margin-top:8px' }, [
      h('strong', {}, '📅 Add your travel dates'),
      h('p', { class: 'muted', style: 'margin:4px 0 8px' }, 'Add your first stop with a date and Home counts down the days and surfaces what is still on your checklist.'),
      h('button', { class: 'btn', onclick: () => go('#trip') }, 'Plan your trip'),
    ]);
  }
  const days = daysUntilISO(start);
  const card = h('div', { class: 'card companion-card', style: 'margin-top:8px' });
  if (days > 0) {
    card.append(h('div', { class: 'countdown-num' }, [h('b', {}, String(days)), ` day${days === 1 ? '' : 's'} to go`]));
    const todo = checklistFor(cc).filter((it) => !isChecked(it.id));
    if (todo.length) {
      card.append(h('p', { class: 'muted', style: 'margin:6px 0 4px' }, `${todo.length} thing${todo.length === 1 ? '' : 's'} still on your pre-trip checklist:`));
      todo.slice(0, 3).forEach((it) => card.append(h('div', { class: 'companion-todo' }, `☐ ${it.title}`)));
      card.append(h('button', { class: 'btn ghost block', style: 'margin-top:8px', onclick: () => go(`#checklist-${cc}`) }, 'Open pre-trip checklist'));
    } else {
      card.append(h('p', { class: 'muted', style: 'margin:6px 0 0' }, 'Your checklist is done — you are ready. Safe travels!'));
    }
  } else {
    card.append(h('div', { class: 'countdown-num' }, days === 0 ? '🎉 Today’s the day!' : '🛬 Your trip has started'));
    card.append(h('p', { class: 'muted', style: 'margin:6px 0 8px' }, 'Switch Home to “Just arrived” for near-me help, arrival tips and emergency info.'));
    card.append(h('button', { class: 'btn', onclick: () => { store.profile.prefs.phase = 'arrived'; save(); render(); } }, 'I have arrived →'));
  }
  return card;
}
function returnRecapCard() {
  const jEntries = (store.journal.entries || []).length;
  const stops = (store.trip.stops || []).length;
  const loved = Object.entries(store.placeData || {}).filter(([, d]) => d && (d.rating || 0) >= 4).length;
  const home = homeCurrency();
  const totals = {};
  (store.trip.budgetLog || []).forEach((b) => { const c = b.currency || '?'; totals[c] = (totals[c] || 0) + (parseFloat(b.amount) || 0); });
  let homeSum = 0, allKnown = true, any = false;
  for (const [c, v] of Object.entries(totals)) {
    any = true;
    if (c === home) { homeSum += v; continue; }
    const conv = convert(v, c, home);
    if (conv == null || isNaN(conv)) allKnown = false; else homeSum += conv;
  }
  if (!jEntries && !stops && !loved && !any) {
    return h('div', { class: 'card companion-card', style: 'margin-top:8px' }, [
      h('strong', {}, '📖 Welcome back'),
      h('p', { class: 'muted', style: 'margin:4px 0 8px' }, 'Turn your trip into a keepsake — a scrapbook of your journal, photos, places and spending.'),
      h('button', { class: 'btn', onclick: () => go('#scrapbook') }, 'Build your scrapbook'),
    ]);
  }
  const card = h('div', { class: 'card companion-card', style: 'margin-top:8px' });
  card.append(h('strong', {}, '📖 Welcome back'));
  const stat = (n, label) => h('span', { class: 'recap-stat' }, [h('b', {}, String(n)), ' ' + label]);
  const stats = [];
  if (jEntries) stats.push(stat(jEntries, jEntries === 1 ? 'journal entry' : 'journal entries'));
  if (loved) stats.push(stat(loved, loved === 1 ? 'place loved' : 'places loved'));
  if (stops) stats.push(stat(stops, stops === 1 ? 'stop' : 'stops'));
  if (stats.length) card.append(h('div', { class: 'recap-stats' }, stats));
  if (any && homeSum > 0) card.append(h('p', { class: 'muted', style: 'margin:6px 0 0' }, `Spent ≈ ${Math.round(homeSum).toLocaleString()} ${home}${allKnown ? '' : ' (some rates unknown)'}`));
  const unrated = (store.favorites || []).filter((id) => (getPlaceData(id).rating || 0) === 0);
  if (unrated.length) {
    const first = getPlace(unrated[0]);
    if (first) card.append(h('button', { class: 'btn ghost block', style: 'margin-top:8px', onclick: () => go(`#place-${first.id}`) },
      unrated.length === 1 ? `⭐ Rate ${first.name}` : `⭐ Rate ${unrated.length} places you saved`));
  }
  card.append(h('button', { class: 'btn block', style: 'margin-top:8px', onclick: () => go('#scrapbook') }, 'Build your scrapbook →'));
  card.append(h('button', { class: 'btn ghost block', style: 'margin-top:6px', onclick: () => go('#export') }, '📤 Save & share your trip (journal, reviews, photos, expenses)'));
  return card;
}

function homeScreen() {
  const wrap = h('div', { class: 'screen' });
  wrap.append(h('section', { class: 'hero' }, [
    h('div', { class: 'logo-wrap', html: logoSVG() }),
    h('p', {}, 'Travel Thailand, Vietnam, Cambodia & Laos like an expert.'),
    h('div', { class: 'hero-badges' }, [
      h('span', { class: 'hero-badge' }, '✓ Works offline'),
      h('span', { class: 'hero-badge' }, '✓ No account'),
      h('span', { class: 'hero-badge' }, '✓ Free & private'),
    ]),
  ]));

  // Journey phase shapes Home. FIRST run (unset) prompts the choice; once chosen we do
  // NOT bring the traveller back to the picker — Home just leads with that stage's
  // content, with a subtle current-stage line. The phase is switched in Settings.
  const phase = store.profile.prefs.phase || '';
  const leadCC = focusSpot().spot.country;
  if (!phase) {
    wrap.append(h('h2', { class: 'home-section phase-prompt' }, 'Where are you in your journey?'));
    wrap.append(phaseSelector());
    wrap.append(h('div', { class: 'home-actions' }, [
      h('button', { class: 'btn', onclick: () => go('#nearby') }, '📍 What’s near me'),
      h('button', { class: 'btn', style: 'background:var(--magenta)', onclick: () => go('#sos') }, '🆘 Emergency'),
    ]));
  } else {
    wrap.append(h('div', { class: 'phase-current' }, [
      h('span', { class: 'phase-current-lbl' }, `${PHASES[phase].emoji} ${PHASES[phase].label}`),
      h('button', { class: 'linklike phase-change', onclick: () => go('#settings') }, 'Change in Settings'),
    ]));
    wrap.append(h('p', { class: 'phase-tagline muted' }, PHASES[phase].tagline));
    wrap.append(phaseLead(phase, leadCC));
    const companion = journeyCompanionCard(phase, leadCC);
    if (companion) wrap.append(companion);
    // While travelling, the day-at-a-glance strip (next plan item, phrase of the day,
    // one-tap spend) lives on Home — Things-to-do now holds only things to do.
    if (phase === 'traveling') wrap.append(dailyStripCard(leadCC));
  }
  wrap.append(h('button', { class: 'btn ghost block home-search', style: 'margin:8px 0 2px', onclick: () => go('#search') }, '🔎 Search everything'));

  wrap.append(netStatusRow());
  // Lead with what fits the user's place and moment, before the generic menu.
  wrap.append(rightNowSection());
  // "Coming up" — reminders you set on calendar entries, in the next week. Always in-app
  // (works with no notification permission and offline); tap to open the calendar.
  const up = reminders.upcoming(7);
  if (up.length) {
    const rc = h('div', { class: 'card', style: 'margin-top:8px' }, [h('h3', { style: 'margin-top:0' }, '🔔 Coming up')]);
    up.slice(0, 5).forEach((u) => {
      const it = u.item;
      const when = u.eventAt.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }) + (it.time ? ` ${it.time}` : '');
      rc.append(h('button', { class: 'btn ghost block reminder-row', style: 'margin-top:6px', onclick: () => go('#calendar') },
        `${CAL_ICON[it.type] || '🗓'} ${it.title} · ${when} · ⏰ ${reminders.leadLabel(it.remind)}`));
    });
    wrap.append(rc);
  }
  // One-time nudge: once there is a journal or budget worth keeping, offer a backup so an
  // update, reset or lost phone can never take it. Dismissible; shown once.
  if ((store.journal.entries.length || store.trip.budgetLog.length) && !store.profile.prefs.dataBackupDone) {
    wrap.append(h('div', { class: 'card', style: 'border:1px solid var(--orange); margin-top:8px' }, [
      h('strong', {}, '⬇️ Back up your journal & budget'),
      h('p', { class: 'muted', style: 'margin:4px 0 8px' }, 'Save a copy to your phone so you never lose your entries — updates keep them safe, and a backup protects you if the device is lost.'),
      h('div', { class: 'row-between' }, [
        h('button', { class: 'btn', onclick: () => go('#settings') }, 'Back up now'),
        h('button', { class: 'btn ghost', onclick: () => { store.profile.prefs.dataBackupDone = true; save(); render(); } }, 'Dismiss'),
      ]),
    ]));
  }
  // Profile-driven shortcuts (accessibility, baby, family) are NOT surfaced here any
  // more — they live in Settings → Who's travelling and on the focused country's hub,
  // so Home stays calm and every context has ONE menu, not several overlapping ones.

  wrap.append(h('h2', { class: 'home-section' }, 'Where are you headed?'));
  wrap.append(regionPicker());
  // The focused country's hub is THE place for everything about where you are (places,
  // food, transport, weather, kids, visa…). One clear gateway avoids the old problem of
  // Home duplicating the whole country toolkit.
  const hubFs = focusSpot();
  const hubCC = hubFs.spot.country;
  const hubC = getCountry(hubCC);
  if (hubC) wrap.append(h('button', { class: 'btn block home-explore', style: 'margin:10px 0 2px', onclick: () => { activeCountry = hubCC; go(`#country-${hubCC}`); } }, `${hubC.flag} Explore ${hubC.name} — places, food, transport & more`));
  // Offline / GPS off: let the traveller set where they are so everything matches.
  if (hubFs.source === 'default') wrap.append(h('button', { class: 'btn ghost block', style: 'margin:6px 0 2px', onclick: () => go(`#setcity-${hubCC}`) }, '📍 Set where you are (works offline)'));

  wrap.append(h('h2', { class: 'home-section' }, 'Plan & tools'));

  // Home now carries only TRIP-WIDE tools (planning, memories, money, admin). Everything
  // tied to a place — food, transport, weather, pools, kids, visa, nature… — lives on the
  // focused country's hub (the "Explore" button above), so there is one menu per context
  // instead of Home and the hub duplicating each other.
  const cPts = gamify.contributionPoints(store);
  const cLvl = gamify.levelInfo(cPts);
  const groups = [
    { label: 'Plan your trip', items: [
      { ic: ICON.route, t: 'Trip plans', d: 'Routes that fit you', hash: '#plans' },
      { ic: ICON.target, t: 'For you', d: 'Your personalised picks', hash: '#foryou' },
      { ic: ICON.suitcase, t: 'My trip', d: 'Itinerary + budget log', hash: '#trip' },
      { ic: ICON.checklist, t: 'Pre-trip checklist', d: 'Visa, health, packing', hash: '#checklist' },
      { ic: ICON.book, t: 'Travel journal', d: 'Stamped entries + map', hash: '#journal' },
      { ic: ICON.trophy, t: 'Trip scrapbook', d: 'Photo album of your trip', hash: '#scrapbook' },
      { ic: ICON.badge, t: 'Your contributions', d: `${cLvl.emoji} ${cLvl.title} · ${cPts} pts`, hash: '#contributions' },
      { ic: ICON.calendar, t: 'Travel calendar', d: 'Stays, meals & ratings', hash: '#calendar' },
      { ic: ICON.star, t: 'Saved & collections', d: 'Organise by theme', hash: '#saved' },
    ] },
    { label: 'Money & tools', items: [
      { ic: ICON.coins, t: 'Currency converter', d: 'Live rates, works offline', hash: '#currency' },
      { ic: ICON.suitcase, t: 'Log expenses', d: 'Track spend vs your budget', hash: '#expenses' },
      { ic: ICON.tag, t: 'Bargain helper', d: 'Counter-offers + cheapest essentials', hash: '#bargain' },
      { ic: ICON.users, t: 'Travel circle', d: 'Share, connect & message', hash: '#circle', badge: unreadInboxCount() },
      { ic: ICON.tag, t: 'Traveller board', d: 'Swap cash, rides, rooms & gear', hash: '#exchange' },
      { ic: ICON.heart, t: 'Give back', d: 'Support local causes', hash: '#donate' },
      { ic: ICON.lock, t: 'Secure documents', d: 'Encrypted on-device', hash: '#vault' },
      { ic: ICON.help, t: 'Help & FAQ', d: 'Offline vs online, how to use', hash: '#help' },
      { ic: ICON.gear, t: 'Settings', d: 'Who’s travelling, theme, phase', hash: '#settings' },
    ] },
  ];
  const tileBtn = (x) => h('button', { class: 'tile', onclick: () => go(x.hash), 'aria-label': x.badge ? `${x.t} — ${x.badge} new` : x.t }, [
    x.badge ? h('span', { class: 'tile-badge', title: `${x.badge} new` }, x.badge > 99 ? '99+' : String(x.badge)) : null,
    h('span', { class: 'ic', html: x.ic }), h('span', { class: 't' }, x.t), h('span', { class: 'd' }, x.d),
  ]);
  // Both clusters render as minimise/maximise disclosures; both open by default since
  // there are only two short groups now.
  groups.forEach((g) => {
    wrap.append(h('details', { class: 'home-group-d', open: '' }, [
      h('summary', { class: 'home-group' }, g.label),
      h('div', { class: 'grid' }, g.items.map(tileBtn)),
    ]));
  });

  // Give back — a calm, opt-in prompt to support the people of the region you are visiting.
  wrap.append(h('div', { class: 'card give-back', style: 'margin-top:10px' }, [
    h('strong', {}, '❤️ Give back to the region'),
    h('p', { class: 'muted', style: 'margin:4px 0 8px' }, 'Support trusted non-profits helping people across Thailand, Vietnam, Cambodia and Laos. The app handles no money — you give directly on each charity’s own site.'),
    h('button', { class: 'btn block', onclick: () => go('#donate') }, 'See causes to support'),
  ]));

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
  // Most-used tools first: language, money, places, map, help — reached every day.
  // Reference reading (history, guides) is collapsed lower down, not the first thing.
  wrap.append(h('div', { class: 'chips', style: 'margin:2px 0 8px' }, [
    lang ? h('button', { class: 'chip', onclick: () => go(`#phrasebook-${c.lang}`) }, [chipIcon('chat'), 'Phrasebook']) : null,
    h('button', { class: 'chip', onclick: () => go('#currency') }, [chipIcon('coins'), 'Currency']),
    h('button', { class: 'chip', onclick: () => go(`#places-${id}`) }, [chipIcon('pin'), 'Places']),
    h('button', { class: 'chip', onclick: () => go('#map') }, [chipIcon('map'), 'Map']),
    h('button', { class: 'chip', onclick: () => go('#sos') }, [chipIcon('alert'), 'Emergency']),
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
        h('button', { class: 'chip', onclick: () => go('#nearby') }, [chipIcon('pin'), 'Near me now']),
        h('button', { class: 'chip', onclick: () => go(`#weather-${id}`) }, [chipIcon('cloud'), 'Weather']),
        h('button', { class: 'chip', onclick: () => go(`#setcity-${id}`) }, [chipIcon('pin'), 'Not here? Change city']),
      ]),
    ]));
  } else {
    // No location signal (offline / GPS off): let them SET where they are so distances,
    // weather and "near me" all match. Fully offline — no GPS required.
    wrap.append(whereAmICard(id));
  }

  // History & culture is collapsed by default (minimise/maximise) with an in-depth read —
  // it is not something a traveller reads every day, so it should not be the first thing.
  const hi = countryHistory(id);
  if (hi && hi.blurb) {
    wrap.append(h('details', { class: 'filters-collapse' }, [
      h('summary', {}, 'History & culture'),
      h('div', {}, [
        h('p', {}, hi.blurb),
        knownForRow(hi.knownFor),
        hi.cultureTip ? h('p', { class: 'culture-tip' }, `🙏 ${hi.cultureTip}`) : null,
        h('button', { class: 'btn ghost block', style: 'margin-top:6px', onclick: () => go(`#history-${id}`) }, '📖 In-depth history & culture'),
      ]),
    ]));
  }
  const acc = accessCard(id); if (acc) wrap.append(acc);
  const vc = visaCard(id); if (vc) wrap.append(vc);
  const famc = familyCard(id); if (famc) wrap.append(famc);
  if (store.profile.prefs.soloFemale || store.profile.prefs.party === 'solo') {
    wrap.append(h('div', { class: 'card', style: 'border:1px solid var(--magenta)' }, [
      h('strong', {}, '🧭 Travelling solo'),
      h('p', { class: 'muted', style: 'margin:4px 0 8px' }, 'Practical, non-alarmist safety notes for solo and women travellers here.'),
      h('button', { class: 'btn block', onclick: () => go(`#sos-${id}`) }, 'See solo & women’s safety'),
    ]));
  }

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
    { ic: ICON.arrive, t: 'Just arrived', d: 'First hour: cash, SIM, airport → town', hash: `#arrival-${c.id}` },
    { ic: ICON.chat, t: 'Phrasebook', d: lang ? lang.label : 'Language', hash: `#phrasebook-${c.lang}` },
    { ic: ICON.pin, t: 'Places', d: 'For your taste & budget', hash: `#places-${c.id}` },
    { ic: ICON.tag, t: 'Fair prices', d: 'Avoid overcharging', hash: `#prices-${c.id}` },
    { ic: ICON.route, t: 'Getting around', d: 'Best way to next place', hash: `#transport-${c.id}` },
    { ic: ICON.navarrow, t: 'Between countries', d: 'Border crossings, hours & visas', hash: '#crossings' },
    { ic: ICON.compass, t: 'Country guide', d: 'Money, SIM, visa, safety', hash: `#info-${c.id}` },
    { ic: ICON.trophy, t: 'Best of', d: 'Top picks, families & more', hash: `#bestof-${c.id}` },
    { ic: ICON.users, t: 'With kids', d: 'Schools, childcare, things to do', hash: `#family-${c.id}` },
    { ic: ICON.ticket, t: 'Festivals', d: 'Dates & holidays', hash: `#events-${c.id}` },
    { ic: ICON.cloud, t: 'Weather', d: '7-day forecast', hash: `#weather-${c.id}` },
    { ic: ICON.sun, t: 'Things to do', d: 'Picks for right now', hash: `#today-${c.id}` },
    { ic: ICON.clock, t: 'Schedules', d: 'Train/bus times', hash: `#schedules-${c.id}` },
    { ic: ICON.navarrow, t: 'Journey planner', d: 'Chain buses/trains/boats', hash: '#route' },
    { ic: ICON.bowl, t: 'Food', d: 'Dishes & ingredients', hash: `#food-${c.id}` },
    { ic: ICON.bowl, t: 'Street food', d: 'Find, rate & review stalls', hash: '#streetfood' },
    { ic: ICON.board, t: 'Local noticeboard', d: 'Markets, family supplies', hash: `#board-${c.id}` },
    { ic: ICON.fruit, t: 'Market produce', d: 'Fruit, veg & herbs', hash: '#produce' },
    { ic: ICON.waves, t: 'Pools', d: 'Swims & day passes', hash: `#pools-${c.id}` },
    { ic: ICON.leaf, t: 'Identify nature', d: 'Birds, fish, plants', hash: '#nature' },
    { ic: ICON.volume, t: 'Sounds around you', d: 'Animal & bird calls', hash: '#sounds' },
    { ic: ICON.coins, t: 'Currency', d: `Convert to ${c.currency}`, hash: '#currency' },
    { ic: ICON.map, t: 'Map', d: 'Offline + GPS', hash: '#map' },
    { ic: ICON.alert, t: 'Emergency', d: 'Numbers, hospitals, first aid', hash: '#sos' },
    { ic: ICON.temple, t: 'Places of worship', d: 'Temples, churches, mosques', hash: `#worship-${c.id}` },
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

// First-hour essentials, lightly tailored to the traveller's party/budget. The first hour
// happens once, so this is FEATURED (open) only while the traveller is in the "arrived"
// phase; afterwards it stays one tap away as a collapsed dropdown rather than always sitting
// at the top of every "near me" visit.
function arrivalEssentials(country, featured) {
  const c = getCountry(country);
  const lang = c ? c.lang : 'th';
  const party = store.profile.prefs.party;
  const budget = store.profile.prefs.budget;
  const item = (summary, ...kids) => h('details', { class: 'arrival-item' }, [h('summary', {}, summary), ...kids]);
  const items = [
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
  ];
  if (featured) return h('div', { class: 'card' }, [h('h2', {}, '🧭 Your first hour'), ...items]);
  // Past the first hour: accessible, not featured.
  return h('details', { class: 'card arrival-fold' }, [h('summary', {}, '🧭 Your first hour — arrival basics'), ...items]);
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

// Arrival-hub "conditions & safety now" strip — surfaces the app's live health/safety
// readouts at the moment of arrival, where they matter most: air quality and sun (UV)
// for the nearest city, a dengue-season flag for the country, and a one-tap hop to the
// nearest beach (flagged when jellyfish are in season) and to the full Health screen.
function nearbySafetyStrip(country, fix) {
  const spot = nearestSpot(fix, country);
  const card = h('div', { class: 'card' }, [h('h3', { style: 'margin-top:0' }, '🩺 Conditions & safety now')]);
  card.append(airBlock(spot, { compact: true }));
  card.append(uvTodayBlock(fix, country));
  const m = new Date().getMonth() + 1;
  if (MOSQUITO_PEAK[country] && MOSQUITO_PEAK[country].includes(m)) {
    card.append(h('p', { class: 'aqi-line usg' }, '🦟 Dengue risk is elevated this month — use day-time repellent.'));
  }
  const beaches = allPlaces({ country }).filter((p) => p.coords && isBeach(p))
    .map((p) => ({ p, km: haversineKm(fix, p.coords) })).filter((x) => x.km != null).sort((a, b) => a.km - b.km);
  if (beaches.length && estDriveMin(beaches[0].km) != null && estDriveMin(beaches[0].km) <= DAYTRIP_MAX_MIN) {
    const b = beaches[0].p;
    const inSeason = jellyInSeason(b, m);
    const near = withinNear(beaches[0].km);
    const dl = driveLabel(beaches[0].km);
    card.append(h('button', { class: 'btn ghost block', style: 'margin-top:8px', onclick: () => go(`#place-${b.id}`) },
      `${inSeason ? '🪼' : '🏖️'} ${near ? 'Nearest beach' : 'Closest beach'}: ${b.name} (${dl})${inSeason ? ' — jellyfish season, check first' : ' — swim & sea info'}`));
  }
  card.append(h('button', { class: 'btn ghost block', style: 'margin-top:6px', onclick: () => go('#danger') }, '🩹 Health & hazards'));
  return card;
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

    // Rank ALL nearby places once; drawList() filters "not interested" ones out on each draw
    // (using the live set), so a reset — which clears the marks — restores them immediately
    // without needing to leave and re-open the screen. "Done" places stay findable here (this
    // is a directory, not the rotating suggestion feed) and only drop out of the Home picks.
    const ranked = allPlaces({ country }).filter((p) => p.coords)
      .map((p) => ({ p, km: haversineKm(f, p.coords) })).sort((a, b) => a.km - b.km);

    body.innerHTML = '';
    body.append(arrivalEssentials(country, (store.profile.prefs.phase || '') === 'arrived'));
    body.append(h('button', { class: 'btn ghost block', style: 'margin-top:6px', onclick: () => go(`#arrival-${country}`) }, '🛬 Full arrival guide — airport→town, cash, SIM'));
    body.append(h('div', { class: 'chips', style: 'margin:10px 0' }, [
      h('button', { class: 'chip', onclick: () => { store.profile.prefs.placesView = 'map'; store.profile.prefs.placesSort = 'near'; save(); go(`#places-${country}`); } }, [chipIcon('map'), 'See on the map']),
      h('button', { class: 'chip', onclick: () => go('#map') }, [chipIcon('pin'), 'Set my stay']),
      h('button', { class: 'chip', onclick: () => go('#exchange') }, '🤝 Traveller board'),
      h('button', { class: 'chip', onclick: () => go('#sos') }, [chipIcon('alert'), 'Emergency']),
    ]));
    body.append(nearbySafetyStrip(country, f));
    // Diet-aware "where you can eat": for a kosher / vegan / vegetarian / halal traveller,
    // point them straight at the verified places they can actually eat, nearest-first.
    const dietCard = dietEatCard(country, f);
    if (dietCard) body.append(dietCard);

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
      // Re-read the marks each draw so hiding one instantly promotes the next place into view,
      // and "done" places show a tick but stay findable in this directory.
      const hid = new Set(store.profile.prefs.hiddenSpots || []);
      const prefs = store.profile.prefs;
      const catOk = (p) => cat === 'all' || nearCat(p) === cat;
      // Good fits that are open lead; poor fits (kids/mobility) and places closed right now
      // sink to the bottom — kept and tagged, never hidden — then order by distance.
      const fitKey = ({ p }) => (placeFitReason(p, prefs) ? 2 : 0) + (openStateNow(p) === false ? 1 : 0);
      const bySort = (a, b) => fitKey(a) - fitKey(b) || a.km - b.km;
      // "Near me" = within about an hour's DRIVE (road-time, not straight-line). Comprehensive
      // within that reach (up to 40) rather than padded with far picks, so every row is truly
      // reachable. A separate, collapsed tier holds real "further afield" next-destinations.
      const near = ranked.filter(({ p, km }) => withinNear(km) && !hid.has(p.id) && catOk(p)).sort(bySort).slice(0, 40);
      const afield = ranked.filter(({ p, km }) => withinDayTrip(km) && !hid.has(p.id) && catOk(p)).sort(bySort).slice(0, 20);

      function renderRow(container, p, km) {
        const done = isSpotDone(p.id);
        const closed = openStateNow(p) === false;
        const fit = placeFitReason(p, prefs);
        const tags = [];
        if (closed) tags.push(attrTag('🔒 Closed now'));
        if (fit) tags.push(attrTag('⚠️ ' + fit));
        container.append(h('div', { class: 'rn-item near-item' + (done ? ' is-done' : '') }, [
          h('button', { class: 'rn-open near-open', onclick: () => go(`#place-${p.id}`) }, [
            rnThumb(p),
            h('div', { class: 'near-text' }, [
              h('span', { class: 'near-name' }, `${catEmoji(nearCat(p))} ${p.name}${done ? ' ✓' : ''}`),
              h('span', { class: 'dist-chip' }, `${fmtDistance(km)} · ${driveLabel(km)} · ${compass(bearing(f, p.coords))}`),
              tags.length ? h('div', { class: 'near-tags' }, tags) : null,
            ]),
          ]),
          h('div', { class: 'rn-actions' }, [
            h('button', { class: 'rn-act done' + (done ? ' on' : ''), title: done ? 'Done — tap to undo' : 'Mark as done', 'aria-label': `Mark ${p.name} as done`, onclick: () => { if (done || confirmSpotDone(p.name)) { toggleSpotDone(p.id); drawList(); } } }, '✓'),
            h('button', { class: 'rn-act', title: 'Not interested — hide this', 'aria-label': `Hide ${p.name}`, onclick: () => { if (confirmSpotHide(p.name)) { hideSpot(p.id); drawList(); } } }, '✕'),
          ]),
        ]));
      }

      if (!near.length && !afield.length) {
        listEl.append(h('p', { class: 'empty' }, 'Nothing within about an hour’s drive in this category yet — try “Everything”, the map, or open a nearby city.'));
        return;
      }
      if (near.length) near.forEach(({ p, km }) => renderRow(listEl, p, km));
      else listEl.append(h('p', { class: 'muted small', style: 'margin:2px 2px 8px' }, 'Nothing within about an hour’s drive in this category — the nearest are further afield, below.'));
      if (afield.length) {
        const afBody = h('div', { class: 'near-afield-body' });
        afield.forEach(({ p, km }) => renderRow(afBody, p, km));
        listEl.append(h('details', { class: 'card near-afield', open: near.length ? null : '' }, [
          h('summary', {}, `🚌 Further afield · next destinations (${afield.length})`),
          h('p', { class: 'muted small', style: 'margin:2px 0 8px' }, 'Beyond an hour’s drive — worth a day trip or your next stop.'),
          afBody,
        ]));
      }
      const nHid = (store.profile.prefs.hiddenSpots || []).length;
      const nDone = (store.profile.prefs.doneSpots || []).length;
      if (nHid || nDone) {
        listEl.append(h('button', { class: 'rn-reset', onclick: () => { clearSuggestionMarks(); drawList(); } },
          `↺ ${[nDone ? `${nDone} done` : '', nHid ? `${nHid} hidden` : ''].filter(Boolean).join(' · ')} — reset`));
      }
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

  wrap.append(h('button', { class: 'btn ghost block', onclick: () => go('#exchange-swap') }, '🤝 Swap cash with a traveller (no fees)'));
  wrap.append(h('button', { class: 'btn block', onclick: async () => { await refreshRates(); go('#currency'); } }, 'Refresh rates (needs internet)'));
  wrap.append(h('p', { class: 'disclaimer' }, 'Indicative mid-market values for guidance; money changers and cards apply their own spread.'));
  mount(wrap, '#home');
  recompute();
}

function currencySelect(current) {
  return selectEl(['USD', 'EUR', 'GBP', 'AUD', 'CAD', 'SGD', 'CNY', 'MYR', 'ILS', 'THB', 'VND', 'KHR', 'LAK'], current, () => {}, 'Currency');
}

// The traveller's home currency (set in Settings; defaults to USD).
function homeCurrency() { return (store.profile && store.profile.homeCurrency) || 'USD'; }

// ---- TRAVELLER BOARD (backendless bulletin board) ---------------------------
// One peer board that fits the app's no-server, no-PII model: swap leftover cash,
// split a ride, pass on a room, hand off a car seat / stroller / bike / camping
// kit / SIM, or post anything else. A listing lives on THIS device and travels
// only inside a link the user chooses to share (same mechanism as the travel
// circle — AirDrop / chat / etc). Cash-swap values use the offline mid-market
// rate table, so both sides agree on a fair number.

const BB_CATS = [
  { id: 'swap', emoji: '💱', label: 'Cash swap', color: '#16a34a', blurb: 'Swap leftover cash at the fair mid-market rate — no booth, no fees.' },
  { id: 'ride', emoji: '🚗', label: 'Ride share', color: '#2563eb', blurb: 'Share a car, taxi or minibus and split the cost.' },
  { id: 'house', emoji: '🏠', label: 'Stay share', color: '#4f46e5', blurb: 'A spare room, a place to crash, or split a rental.' },
  { id: 'kids', emoji: '🧸', label: 'Kids & baby', color: '#d97706', blurb: 'Car seats, strollers, carriers, toys, kids clothing.' },
  { id: 'gear', emoji: '🎒', label: 'Gear & bikes', color: '#0891b2', blurb: 'Motorbikes, bicycles, camping kit, a leftover SIM.' },
  { id: 'other', emoji: '📦', label: 'Other', color: '#6b7280', blurb: 'Free giveaways, wanted, or anything else.' },
];
function bbCat(id) { return BB_CATS.find((c) => c.id === id) || { id: 'other', emoji: '📦', label: 'Listing', color: '#6b7280', blurb: '' }; }
// Sub-kind options per category (value + labelled option), for the item picker.
function bbSubKinds(cat) {
  if (cat === 'kids') return [['carseat', '🚼 Car seat'], ['stroller', '🍼 Stroller / pram'], ['carrier', '👶 Baby carrier'], ['toys', '🧸 Toys'], ['clothing', '🧥 Kids clothing'], ['other', '📦 Other kids item']];
  if (cat === 'gear') return [['motorbike', '🏍 Motorbike / scooter'], ['bicycle', '🚲 Bicycle'], ['camping', '⛺ Camping / trekking'], ['sim', '📶 SIM / e-SIM'], ['clothing', '🧥 Clothing / boots'], ['other', '🎒 Other gear']];
  return [['free', '🎁 Free / giveaway'], ['sale', '🏷 For sale'], ['wanted', '🙋 Wanted'], ['other', '📦 Other']];
}
const HOUSE_KIND = { room: 'Room / bed', place: 'Whole place', looking: 'Looking for a place' };
function fmtMoney(n, cur) { return `${Number(n).toLocaleString(undefined, { maximumFractionDigits: n >= 100 ? 0 : 2 })} ${cur || ''}`.trim(); }

// A listing's one-line headline and a short subline, shared by the card + import views.
function bbHeadline(cat, d) {
  if (cat === 'swap') return `${fmtMoney((d.have && d.have.a) || 0, (d.have && d.have.c) || '?')} → ${(d.want && d.want.c) || '?'}`;
  if (cat === 'ride') return `${d.from || '?'} → ${d.to || '?'}`;
  if (cat === 'house') return d.title || HOUSE_KIND[d.g] || 'Stay share';
  return d.title || 'Item';
}
function bbSubline(cat, d) {
  if (cat === 'ride') return [d.when, d.seats ? `${d.seats} seat${d.seats === 1 ? '' : 's'}` : '', (d.price && d.price.a) ? `${fmtMoney(d.price.a, d.price.c)} share` : ''].filter(Boolean).join(' · ');
  if (cat === 'house') return [HOUSE_KIND[d.g] || '', d.when, (d.price && d.price.a) ? fmtMoney(d.price.a, d.price.c) : ''].filter(Boolean).join(' · ');
  if (cat !== 'swap' && d.price && d.price.a) return fmtMoney(d.price.a, d.price.c);
  return '';
}
// A category-appropriate safety line (shown under each post form).
function bbSafety(cat) {
  if (cat === 'swap') return 'Never type card or bank details; exchange cash in person in a safe, public place.';
  if (cat === 'ride') return 'Agree the cost up front and share your live location with a friend. You travel at your own risk.';
  if (cat === 'house') return 'See the place before you pay. Never wire a deposit to someone you have not met.';
  if (cat === 'kids') return 'Check safety items — car seats, helmets, carriers — for damage and expiry before use.';
  return 'Meet in a safe, public place. For a motorbike, check the papers and never leave your passport as a deposit.';
}

// Fair mid-market value + an honest "what a booth would keep" range, as text nodes.
function swapCalcNodes(a, have, want) {
  if (have === want) return [document.createTextNode('Pick two different currencies.')];
  if (!a) return [document.createTextNode('Enter an amount to see the fair mid-market value.')];
  const got = convert(a, have, want);
  if (got == null) return [document.createTextNode('No offline rate for this pair yet — open Currency with internet once to refresh.')];
  return [
    h('strong', { class: 'fair' }, `${fmtMoney(a, have)} ≈ ${fmtMoney(got, want)}`),
    document.createTextNode(` at mid-market. A money changer usually keeps ~3–7%, so roughly ${fmtMoney(got * 0.03, want)}–${fmtMoney(got * 0.07, want)} stays between you two.`),
  ];
}

// Best-effort nearest town name (for pre-filling a listing's "where"), else the country.
function guessCityName() {
  const fix = getLastFix();
  if (fix) { try { const s = nearestSpot(fix, activeCountry); if (s && s.city) return s.city; } catch { /* noop */ } }
  const c = getCountry(activeCountry); return c ? c.name : '';
}

// A "paste a shared link" importer: opens the payload exactly as tapping the link would.
function pasteLinkBox(hint) {
  const inp = h('input', { type: 'text', placeholder: hint || 'Paste a link a traveller sent you', style: 'width:100%' });
  return h('div', { class: 'card' }, [
    h('h3', { style: 'margin-top:0' }, '📥 Got a link?'),
    inp,
    h('button', { class: 'btn ghost block', style: 'margin-top:6px', onclick: () => {
      const m = String(inp.value || '').match(/#(.+)$/);
      if (m && m[1]) location.hash = '#' + m[1].trim();
    } }, 'Open the link'),
  ]);
}

// A listing's "posted N ago" line. Time-sensitive categories (a shared ride, a cash
// swap) are flagged "may be past" once they age, so a board that lives on a device and
// travels by link over days or weeks stays honest instead of accumulating dead posts.
const BB_STALE_DAYS = { ride: 3, swap: 7 };
function listingIsStale(it) {
  const lim = BB_STALE_DAYS[it && it.cat];
  return !!(lim && it && it.ts && (Date.now() - it.ts) > lim * 86400000);
}

// One listing card (any category) with a share link and a remove control.
function listingCard(it) {
  const d = it.data || {};
  const cat = it.cat || 'other';
  const meta = bbCat(cat);
  const card = h('div', { class: 'card listing-card', style: `--cat:${meta.color}` });
  card.append(h('h3', { style: 'margin-top:0' }, `${meta.emoji} ${bbHeadline(cat, d)}`));
  if (cat === 'swap') {
    card.append(h('p', { class: 'muted small' }, swapCalcNodes((d.have && d.have.a) || 0, d.have && d.have.c, d.want && d.want.c)));
  } else {
    const sub = bbSubline(cat, d);
    if (sub) card.append(h('p', { class: 'small', style: 'font-weight:700' }, sub));
  }
  const metaLine = [meta.label, d.city, it.mine ? 'Your post' : (it.from ? `From ${it.from.name}` : 'Saved')].filter(Boolean).join(' · ');
  if (metaLine) card.append(h('p', { class: 'tiny muted' }, metaLine));
  if (it.ts) {
    const stale = listingIsStale(it);
    card.append(h('p', { class: stale ? 'tiny listing-stale' : 'tiny muted' }, `Posted ${seaAgo(it.ts)}${stale ? ' · may be past' : ''}`));
  }
  if (d.note) card.append(h('p', {}, d.note));
  if (d.contact) card.append(h('p', { class: 'small' }, `Reach: ${d.contact}`));
  card.append(h('div', { class: 'listing-actions' }, [
    shareButton('🔗 Share this', meta.label, () => shareUrl('in', encodeShare('bb', Object.assign({ cat }, d), ensureMe(), '')), 'btn ghost'),
    h('button', { class: 'btn ghost', onclick: () => { removeListing(it.id); go('#exchange-' + cat); } }, '🗑 Remove'),
  ]));
  return card;
}

// A category-adaptive "post to the board" form. Re-created when the category changes.
function buildBBForm(cat) {
  const c = getCountry(activeCountry);
  const meta = bbCat(cat);
  const card = h('div', { class: 'card' });
  card.append(h('h2', { style: 'margin-top:0' }, `${meta.emoji} Post: ${meta.label}`));

  const cityIn = h('input', { type: 'text', value: guessCityName(), placeholder: 'Where (town / area)', maxLength: 40 });
  const noteIn = h('input', { type: 'text', placeholder: 'Notes (optional)', maxLength: 400 });
  const contactIn = h('input', { type: 'text', placeholder: 'How to reach you — your choice', maxLength: 80 });

  let collect, valid, firstEl;
  if (cat === 'swap') {
    const haveSel = currencySelect(c ? c.currency : 'THB');
    const haveAmt = h('input', { type: 'number', inputmode: 'decimal', placeholder: 'Amount', min: '0' });
    const wantSel = currencySelect(homeCurrency());
    const calc = h('p', { class: 'muted small swap-calc' });
    const upd = () => calc.replaceChildren(...swapCalcNodes(parseFloat(haveAmt.value) || 0, haveSel.value, wantSel.value));
    haveAmt.addEventListener('input', upd); haveSel.addEventListener('change', upd); wantSel.addEventListener('change', upd);
    card.append(field('I have', haveSel), field('Amount', haveAmt), field('I want', wantSel), calc);
    upd(); firstEl = haveAmt;
    valid = () => (parseFloat(haveAmt.value) || 0) > 0;
    collect = () => ({ have: { c: haveSel.value, a: parseFloat(haveAmt.value) || 0 }, want: { c: wantSel.value } });
  } else if (cat === 'ride') {
    const fromIn = h('input', { type: 'text', value: guessCityName(), placeholder: 'From (e.g. Pai)', maxLength: 40 });
    const toIn = h('input', { type: 'text', placeholder: 'To (e.g. Chiang Mai)', maxLength: 40 });
    const whenIn = h('input', { type: 'text', placeholder: 'When (e.g. Sat 9am)', maxLength: 40 });
    const seatsIn = h('input', { type: 'number', placeholder: 'Seats', min: '0' });
    const priceAmt = h('input', { type: 'number', placeholder: 'Cost share (optional)', min: '0' });
    const priceCur = currencySelect(c ? c.currency : 'THB');
    card.append(field('From', fromIn), field('To', toIn), field('When', whenIn), field('Seats', seatsIn), field('Cost share', priceAmt), field('Currency', priceCur));
    firstEl = toIn;
    valid = () => fromIn.value.trim() && toIn.value.trim();
    collect = () => ({ from: fromIn.value.trim(), to: toIn.value.trim(), when: whenIn.value.trim(), seats: parseFloat(seatsIn.value) || 0, price: { a: parseFloat(priceAmt.value) || 0, c: priceCur.value } });
  } else if (cat === 'house') {
    const kindSel = h('select', { 'aria-label': 'Kind' }, Object.entries(HOUSE_KIND).map(([v, l]) => h('option', { value: v }, l)));
    const titleIn = h('input', { type: 'text', placeholder: 'Short title (e.g. Spare room, 2 nights)', maxLength: 80 });
    const whenIn = h('input', { type: 'text', placeholder: 'Dates (optional)', maxLength: 40 });
    const priceAmt = h('input', { type: 'number', placeholder: 'Price / split (optional)', min: '0' });
    const priceCur = currencySelect(c ? c.currency : 'THB');
    card.append(field('Type', kindSel), field('Title', titleIn), field('Dates', whenIn), field('Price', priceAmt), field('Currency', priceCur));
    firstEl = titleIn;
    valid = () => titleIn.value.trim();
    collect = () => ({ g: kindSel.value, title: titleIn.value.trim(), when: whenIn.value.trim(), price: { a: parseFloat(priceAmt.value) || 0, c: priceCur.value } });
  } else {
    const subSel = h('select', { 'aria-label': 'What is it' }, bbSubKinds(cat).map(([v, l]) => h('option', { value: v }, l)));
    const titleIn = h('input', { type: 'text', placeholder: 'What is it', maxLength: 80 });
    const priceAmt = h('input', { type: 'number', inputmode: 'decimal', placeholder: 'Price (blank = free / offers)', min: '0' });
    const priceCur = currencySelect(c ? c.currency : 'THB');
    card.append(field('Item', subSel), field('Title', titleIn), field('Price', priceAmt), field('Currency', priceCur));
    firstEl = titleIn;
    valid = () => titleIn.value.trim();
    collect = () => ({ g: subSel.value, title: titleIn.value.trim(), price: { a: parseFloat(priceAmt.value) || 0, c: priceCur.value } });
  }

  card.append(field('Where', cityIn), field('Note', noteIn), field('Contact', contactIn));
  card.append(h('button', { class: 'btn block', onclick: () => {
    if (valid && !valid()) { if (firstEl) firstEl.focus(); return; }
    const data = Object.assign(collect(), { city: cityIn.value.trim(), note: noteIn.value.trim(), contact: contactIn.value.trim() });
    addListing({ cat, mine: true, data });
    go('#exchange-' + cat);
  } }, '＋ Post to the board'));
  card.append(h('p', { class: 'tiny muted' }, `Stays on your device until you share its link. ${bbSafety(cat)}`));
  return card;
}

// The Traveller Board: a backendless bulletin board with category tabs. Cash swap,
// ride share, stay/room share, kids & baby gear, bikes & gear, and a general bucket.
function bulletinScreen(arg) {
  let cat = BB_CATS.some((c) => c.id === arg) ? arg : 'all';
  const wrap = h('div', { class: 'screen' });
  wrap.append(topbar('Traveller board', '#home'));
  wrap.append(h('p', { class: 'lead' }, 'A traveller-to-traveller board you share by link — swap cash, split a ride, pass on a room, hand off a car seat, a bike or camping kit. Post it, share the link, meet in person. No account, no server; nothing leaves your phone on its own.'));
  const rates = getRates();
  if (!rates.live) wrap.append(h('p', { class: 'tiny muted' }, 'Cash-swap values use offline baseline rates. Open Currency with internet once to refresh them.'));

  // Invite a fellow traveller so the board actually has two sides. Shares the app link to
  // the board itself — no server, no account; they open it and can post their own listings.
  wrap.append(shareButton('📣 Invite a traveller to this board', 'Mekonging Traveller Board', () => `${location.origin}${location.pathname}#exchange`, 'btn ghost block'));

  const chips = h('div', { class: 'chips bb-chips' });
  const formWrap = h('div', {});
  const listWrap = h('div', {});
  wrap.append(chips, formWrap, pasteLinkBox('Paste a board link a traveller sent'), listWrap);

  function repaint() {
    chips.innerHTML = '';
    const mk = (id, label, color) => h('button', { class: 'chip bb-chip', dataset: { c: id }, style: color ? `--chip:${color}` : '', 'aria-pressed': cat === id ? 'true' : 'false', onclick: () => { cat = id; repaint(); } }, label);
    chips.append(mk('all', '📋 All'));
    BB_CATS.forEach((c) => chips.append(mk(c.id, `${c.emoji} ${c.label}`, c.color)));

    formWrap.innerHTML = '';
    if (cat === 'all') {
      formWrap.append(h('p', { class: 'muted small', style: 'margin:2px 2px 8px' }, 'Pick a category above to post, or browse everything below.'));
    } else {
      formWrap.append(h('p', { class: 'muted small', style: 'margin:2px 2px 6px' }, bbCat(cat).blurb));
      formWrap.append(buildBBForm(cat));
    }

    listWrap.innerHTML = '';
    const all = getListings();
    const items = cat === 'all' ? all : all.filter((x) => x.cat === cat);
    listWrap.append(h('h2', { class: 'home-section' }, `${cat === 'all' ? 'On your board' : bbCat(cat).label} · ${items.length}`));
    if (!items.length) listWrap.append(h('p', { class: 'empty' }, 'Nothing here yet. Pick a category to post, or open a link a traveller sends you.'));
    // Let the traveller sweep away their own long-past posts in one tap (backendless tidy).
    const old = items.filter((x) => x.mine && x.ts && (Date.now() - x.ts) > 14 * 86400000);
    if (old.length) {
      listWrap.append(h('button', { class: 'btn ghost block tiny', onclick: () => { old.forEach((s) => removeListing(s.id)); repaint(); } },
        `🧹 Clear ${old.length} old post${old.length > 1 ? 's' : ''} of yours (over 2 weeks)`));
    }
    items.forEach((it) => listWrap.append(listingCard(it)));
  }
  repaint();
  mount(wrap, '#home');
}

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

// ---- personal phrasebook: derived keys + pin / hide -------------------------
// Phrases carry no id, so derive a stable key from lang + category + english text.
function phraseSlug(en) { return String(en).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''); }
function phraseKey(code, catId, p) { return `${code}|${catId}|${phraseSlug(p.en)}`; }
function phrasePinsFor(code) { const m = store.profile.prefs.phrasePins || (store.profile.prefs.phrasePins = {}); return m[code] || (m[code] = []); }
function phraseHiddenFor(code) { const m = store.profile.prefs.phraseHidden || (store.profile.prefs.phraseHidden = {}); return m[code] || (m[code] = []); }
function isPhrasePinned(code, key) { return phrasePinsFor(code).includes(key); }
function isPhraseHidden(code, key) { return phraseHiddenFor(code).includes(key); }
function togglePhrasePin(code, key) { const a = phrasePinsFor(code); const i = a.indexOf(key); if (i >= 0) a.splice(i, 1); else a.push(key); save(); }
// Hiding a phrase also drops it from the pins so the two lists never disagree.
function togglePhraseHide(code, key) {
  const a = phraseHiddenFor(code); const i = a.indexOf(key);
  if (i >= 0) { a.splice(i, 1); } else { a.push(key); const p = phrasePinsFor(code); const j = p.indexOf(key); if (j >= 0) p.splice(j, 1); }
  save();
}
function movePhrasePin(code, key, dir) { const a = phrasePinsFor(code); const i = a.indexOf(key); const j = i + dir; if (i < 0 || j < 0 || j >= a.length) return; const t = a[i]; a[i] = a[j]; a[j] = t; save(); }
// Map every phrase (incl. the allergens category) to its derived key, so pinned/hidden
// keys can be resolved back to the phrase object regardless of which category it lives in.
function phraseIndexFor(categories, code) {
  const idx = new Map();
  for (const cat of categories) for (const p of cat.phrases) idx.set(phraseKey(code, cat.id, p), { p, catId: cat.id });
  return idx;
}

// The "Essentials" card: the traveller's most-needed phrases, first — Hello, Thank you,
// then their allergy/diet phrases automatically, then Sorry, How much, question words and
// numbers. Allergy phrases come from the ALLERGENS module (never fabricated) and re-derive
// from the saved profile every render. onChange() repaints after a pin/hide toggle.
function essentialsCard(code, book, onChange) {
  const cats = book.categories;
  const flat = cats.flatMap((c) => c.phrases.map((p) => ({ p, catId: c.id })));
  const find = (rx) => flat.find((x) => rx.test(x.p.en));
  const card = h('div', { class: 'card essentials-card' });
  card.append(h('h2', { style: 'margin-top:0' }, '⭐ Essentials'));
  card.append(h('p', { class: 'tiny muted', style: 'margin:2px 0 8px' },
    'Your most-needed phrases, first. Tap a line to show it large · 📌 pin · ✕ hide.'));
  const addRow = (x) => {
    if (!x || isPhraseHidden(code, phraseKey(code, x.catId, x.p))) return;
    card.append(phraseRow(x.p, book.locale, { code, catId: x.catId, onChange, essential: true }));
  };
  addRow(find(/^hello/i));
  addRow(find(/^thank you/i));
  // allergy / diet — automatic, safety-critical (not hideable)
  const diet = store.profile.prefs.diet || [];
  const allergy = allergyPhrasesForProfile(code);
  if (allergy.length) {
    card.append(h('p', { class: 'tiny', style: 'margin:8px 0 2px;font-weight:600' },
      '⚠️ ' + (diet.length ? 'Your allergies & diet — show the cook' : 'Food allergy — show the cook')));
    allergy.forEach((p) => card.append(phraseRow(p, book.locale, { code, catId: 'allergies', onChange, noHide: true, essential: true })));
    if (!diet.length) card.append(h('button', { class: 'btn ghost block', style: 'margin:4px 0 2px', onclick: () => go('#settings') }, '➕ Set my allergies & diet'));
  } else if (!diet.length) {
    card.append(h('p', { class: 'tiny muted', style: 'margin:8px 0 2px' },
      'Have an allergy? Set it in Settings and your exact phrase appears here automatically.'));
  }
  addRow(find(/excuse me|^sorry/i));
  addRow(find(/how much/i));
  // question words
  const qCat = cats.find((c) => c.id === 'questions');
  if (qCat) qCat.phrases.forEach((p) => { if (!isPhraseHidden(code, phraseKey(code, 'questions', p))) card.append(phraseRow(p, book.locale, { code, catId: 'questions', onChange, essential: true })); });
  // numbers — compact tappable chips (tap to show large)
  const nCat = cats.find((c) => c.id === 'numbers');
  if (nCat) {
    card.append(h('p', { class: 'tiny', style: 'margin:8px 0 2px;font-weight:600' }, '🔢 Numbers'));
    card.append(h('div', { class: 'chips num-chips' }, nCat.phrases.map((p) =>
      h('button', { class: 'chip', title: 'Show large', onclick: () => showBigPhrase(p, book.locale) },
        [h('b', {}, p.en), ' ', h('span', { lang: book.locale }, p.script)]))));
  }
  return card;
}

// The "Your pins" card: the phrases the traveller pinned, in their own order (↑ ↓ · 📌 removes).
function phrasePinsCard(code, book, idx, onChange) {
  const keys = phrasePinsFor(code).filter((k) => idx.has(k) && !isPhraseHidden(code, k));
  if (!keys.length) return null;
  const card = h('div', { class: 'card pins-card' });
  card.append(h('h2', { style: 'margin-top:0' }, '📌 Your pins'));
  card.append(h('p', { class: 'tiny muted', style: 'margin:2px 0 8px' }, 'Your saved phrases, in your order. Use ↑ ↓ to reorder · 📌 to remove.'));
  keys.forEach((k, i) => {
    const { p, catId } = idx.get(k);
    const row = phraseRow(p, book.locale, { code, catId, onChange, noHide: true });
    const up = h('button', { class: 'speak', 'aria-label': `Move ${p.en} up`, title: 'Move up', disabled: i === 0 ? '' : null, onclick: () => { movePhrasePin(code, k, -1); if (onChange) onChange(); } }, '↑');
    const down = h('button', { class: 'speak', 'aria-label': `Move ${p.en} down`, title: 'Move down', disabled: i === keys.length - 1 ? '' : null, onclick: () => { movePhrasePin(code, k, 1); if (onChange) onChange(); } }, '↓');
    const ctrls = row.querySelector('.phrase-ctrls');
    if (ctrls) ctrls.prepend(down, up);
    card.append(row);
  });
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

  const repaint = () => phrasebookScreen(code);

  // Full category set incl. the allergens-module category (used by the pin index + list).
  const allergyCat = (ALLERGENS[code] && ALLERGENS[code].length)
    ? { id: 'allergies', name: 'Allergies & dietary', phrases: ALLERGENS[code] } : null;
  const categories = allergyCat ? book.categories.concat([allergyCat]) : book.categories;
  const idx = phraseIndexFor(categories, code);

  // Most-needed phrases first (allergy/diet auto-injected), then the traveller's own pins.
  wrap.append(essentialsCard(code, book, repaint));
  const pinsCard = phrasePinsCard(code, book, idx, repaint);
  if (pinsCard) wrap.append(pinsCard);

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
  wrap.append(h('h2', { class: 'cat-title' }, 'All phrases'));
  const search = h('input', {
    class: 'search', type: 'search', 'aria-label': 'Search', placeholder: `Search ${book.label} phrases…`, value: phraseQuery,
    oninput: debounce((e) => { phraseQuery = e.target.value; renderPhrases(); }, 120),
  });
  wrap.append(search);

  const listEl = h('div', {});
  wrap.append(listEl);

  function renderPhrases() {
    listEl.innerHTML = '';
    const q = phraseQuery.trim().toLowerCase();
    for (const cat of categories) {
      // A query matches the whole category when its name matches (so "taxi"
      // surfaces the Taxi & directions phrases), else it matches per phrase.
      const catNameMatch = !q || cat.name.toLowerCase().includes(q);
      const matches = cat.phrases.filter((p) => {
        if (isPhraseHidden(code, phraseKey(code, cat.id, p))) return false;
        return catNameMatch || p.en.toLowerCase().includes(q) || (p.roman || '').toLowerCase().includes(q) || (p.script || '').includes(phraseQuery);
      });
      if (!matches.length) continue;
      listEl.append(h('h2', { class: 'cat-title' }, cat.name));
      for (const p of matches) listEl.append(phraseRow(p, book.locale, { code, catId: cat.id, onChange: repaint }));
    }
    if (!listEl.children.length) listEl.append(h('p', { class: 'empty' }, 'No phrases match your search.'));
    // Hidden phrases: a collapsible reveal so nothing is lost, only tucked away.
    const hiddenKeys = phraseHiddenFor(code).filter((k) => idx.has(k));
    if (hiddenKeys.length && !q) {
      const det = h('details', { class: 'hidden-reveal' });
      det.append(h('summary', {}, `Hidden phrases (${hiddenKeys.length})`));
      hiddenKeys.forEach((k) => {
        const { p, catId } = idx.get(k);
        const row = phraseRow(p, book.locale, { code, catId, onChange: repaint, noHide: true });
        const restore = h('button', { class: 'speak', 'aria-label': `Restore ${p.en}`, title: 'Restore', onclick: () => { togglePhraseHide(code, k); repaint(); } }, '↩');
        const ctrls = row.querySelector('.phrase-ctrls');
        if (ctrls) ctrls.prepend(restore);
        det.append(row);
      });
      listEl.append(det);
    }
  }
  renderPhrases();
  mount(wrap, '#phrasebook');
}

// One phrasebook row: tap the text to show it LARGE to a local; copy and speak controls.
// opts (optional): { code, catId, onChange, noHide, essential } enable pin / hide controls.
function phraseRow(p, locale, opts) {
  opts = opts || {};
  const { code, catId, onChange, noHide, essential } = opts;
  const key = (code && catId) ? phraseKey(code, catId, p) : null;
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
  const ctrls = [copyBtn, speakBtn];
  if (key) {
    const pinned = isPhrasePinned(code, key);
    const pinBtn = h('button', { class: 'speak pin' + (pinned ? ' on' : ''), 'aria-pressed': pinned ? 'true' : 'false', 'aria-label': (pinned ? 'Unpin ' : 'Pin ') + p.en, title: pinned ? 'Unpin' : 'Pin to top', onclick: () => { togglePhrasePin(code, key); if (onChange) onChange(); } }, '📌');
    ctrls.push(pinBtn);
    if (!noHide) {
      const hideBtn = h('button', { class: 'speak hide', 'aria-label': `Hide ${p.en}`, title: 'Hide from lists', onclick: () => { togglePhraseHide(code, key); if (onChange) onChange(); } }, '✕');
      ctrls.push(hideBtn);
    }
  }
  return h('div', { class: 'phrase' + (essential ? ' essential' : '') }, [grow, h('div', { class: 'phrase-ctrls' }, ctrls)]);
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
  srcSel.setAttribute('aria-label', 'Language you are translating from');
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

  // Your own places live alongside the curated ones: add a location, then rate, review and
  // photograph it from its page. Kept on-device; a collapsible list keeps the screen tidy.
  wrap.append(h('button', { class: 'btn ghost block', style: 'margin:4px 0', onclick: () => go('#addpin') }, '➕ Add a place of your own'));
  if ((store.pins || []).length) {
    const yp = h('details', { class: 'filters-collapse' }, [h('summary', {}, `📌 Your places · ${store.pins.length}`)]);
    store.pins.forEach((pin) => {
      const pd = getPlaceData(pin.id);
      const kind = (pin.tags && pin.tags[0]) ? titleCase(pin.tags[0]) : 'Place';
      const meta = [kind, pd.rating ? starsStr(pd.rating) : null, (placePhotoKeys(pin.id).length ? `📷 ${placePhotoKeys(pin.id).length}` : null)].filter(Boolean).join(' · ');
      yp.append(h('button', { class: 'btn ghost block', style: 'margin-top:6px; justify-content:flex-start', onclick: () => go(`#place-${pin.id}`) },
        `📌 ${pin.name} — ${meta}`));
    });
    wrap.append(yp);
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
    }, [swatch(catColor(it.id)), ` ${it.emoji} ${it.label}`])));

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
    }, [swatch(tierColor(id)), ` ${lbl}`])));

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
    h('div', { class: 'chips', style: 'margin:0' }, [viewBtn('list', [chipIcon('checklist'), 'List']), viewBtn('map', [chipIcon('map'), 'Map'])]),
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
  wrap.append(h('details', { class: 'filters-collapse' }, [
    h('summary', {}, '🎨 Colour key'),
    colorKeyCard(),
  ]));

  const listEl = h('div', {});
  const mapWrap = h('div', {});
  const cap = h('p', { class: 'muted', style: 'margin:2px 2px 8px' }, '');
  wrap.append(viewMode === 'map' ? mapWrap : listEl);

  let placesCtrl = null;
  let currentResults = [];
  // The map shows the filtered curated results PLUS the traveller's own places that have
  // coordinates, so contributions appear spatially alongside the guide — like a map app.
  const userMapPins = () => (store.pins || []).filter((p) => p.coords).map((p) => resolveItem(p.id)).filter(Boolean);
  const mapPlaces = () => currentResults.concat(userMapPins());

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
      const ml = mapPlaces();
      const mine = userMapPins().length;
      cap.textContent = ml.length
        ? `${ml.filter((p) => p.coords).length} places on the map${mine ? ` (incl. ${mine} of yours)` : ''}${sortMode === 'near' && getLastFix() ? ' · nearest first' : ''} — tap a pin`
        : '';
      if (placesCtrl) placesCtrl.setPlaces(ml);
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
        listEl.append(h('h3', { class: 'cat-title cat-title-bar', style: `--cat:${BUCKET_COLOR[key] || BUCKET_COLOR.other}` }, `${label} · ${arr.length}`));
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
    const mapList = mapPlaces();
    if (!mapList.length) {
      mapWrap.append(h('p', { class: 'empty' }, 'No mapped places for these filters yet — switch to List or widen the filters.'));
    } else {
      // Colour-by toggle: rating (default) or the site-wide category colours, with a matching
      // legend so the map obeys the same colour language as the rest of the app when chosen.
      const colorModeOf = () => (prefs.placesColor === 'category' ? 'category' : 'rating');
      const RATING_KEY = [['#1E9E5A', 'Excellent'], ['#7DB23A', 'Great'], ['#F2A93B', 'Good'], ['#E8632A', 'Mixed'], ['#E0A100', 'Market'], ['#D62828', 'Local eat']];
      const legendBox = h('div', {});
      const renderMapLegend = () => {
        legendBox.innerHTML = '';
        const items = colorModeOf() === 'category'
          ? CATEGORY_FAMILIES.filter((f) => f.key !== 'other').map((f) => [f.color, `${f.emoji} ${f.label}`])
          : RATING_KEY;
        legendBox.append(h('div', { class: 'cats', style: 'margin:2px 0 6px' },
          items.map(([c, l]) => h('span', { class: 'cat-tag', style: `background:${c}` }, l))));
      };
      const colorToggle = h('div', { class: 'chips', style: 'margin:2px 0 4px' }, [
        h('span', { class: 'muted small', style: 'align-self:center;margin-right:4px' }, 'Colour by:'),
        ...[['rating', '⭐ Rating'], ['category', '🎨 Category']].map(([m, l]) =>
          h('button', {
            class: 'chip', 'aria-pressed': colorModeOf() === m ? 'true' : 'false', dataset: { cm: m },
            onclick: () => {
              prefs.placesColor = m; save();
              colorToggle.querySelectorAll('.chip').forEach((c) => c.setAttribute('aria-pressed', c.dataset.cm === m ? 'true' : 'false'));
              if (placesCtrl) placesCtrl.setColorMode(m);
              renderMapLegend();
            },
          }, l)),
      ]);
      const canvas = h('div', { class: 'places-map', style: 'height:360px;border-radius:16px;overflow:hidden;position:relative' });
      mapWrap.append(colorToggle, legendBox, cap, canvas);
      renderMapLegend();
      import('./map.js').then((m) => m.initPlacesMap(canvas, mapList, {
        onOpen: (id) => go(`#place-${id}`),
        onLocate: (fix) => setLastFix(fix),
        colorMode: colorModeOf(),
        categoryColor: placeCatColor,
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
  if (p.kidFriendly === true) chips.push(attrTag('👨‍👩‍👧 Kids OK'));
  if (p.stayType) chips.push(attrTag(STAY_LABEL[p.stayType] || p.stayType));
  if (p.stayDuration === 'long') chips.push(attrTag('Long stay'));
  else if (p.stayDuration === 'short') chips.push(attrTag('Short stay'));
  else if (p.stayDuration === 'both') chips.push(attrTag('Short or long stay'));
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
  const r = Number(p.rating) || 0;
  let s = r || 3;
  if (prefs.budget && prefs.budget !== 'flexible' && (p.budgetTier === prefs.budget || p.budgetTier === 'any')) s += 0.7;
  // Party shape — modest nudges using fields that always exist (rating/stayType/kidFriendly),
  // so choosing Solo / Couple / Group / Family actually reorders picks instead of being inert.
  if (prefs.party === 'family') { if (p.kidFriendly === true) s += 0.8; if (p.kidFriendly === false) s -= 0.5; }
  // Travelling with a baby leans even harder on kid-friendly places, and away from
  // ones explicitly flagged not-for-kids — regardless of the party shape chosen.
  if (prefs.withBaby) { if (p.kidFriendly === true) s += 0.6; if (p.kidFriendly === false) s -= 0.6; }
  if (prefs.party === 'solo' && p.stayType === 'hostel') s += 0.4;                 // sociable, budget-friendly bases
  if (prefs.party === 'couple') { if (r >= 4.4) s += 0.3; if (p.stayType === 'hostel') s -= 0.3; }  // quality over dorms
  if (prefs.party === 'group' && (p.stayType === 'hostel' || p.stayType === 'apartment')) s += 0.3; // space for several
  // Trip length — long stays prefer long-stay lodging; short trips want the highlights first.
  if (prefs.tripLength === 'long' && (p.stayDuration === 'long' || p.stayDuration === 'both')) s += 0.5;
  if (prefs.tripLength === 'short' && r >= 4.5) s += 0.5;
  if (prefs.tripLength === 'medium' && r >= 4.3) s += 0.25;
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
    h('span', { class: 'muted' }, ` ${Number(p.rating).toFixed(1)} · editorial estimate from ${(p.reviewSources || []).join(', ') || 'multiple public sources'}, not a live score`),
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
  ['rental', '🛵 Getting around & rentals'],
  ['other', '📌 More to see'],
];
// One semantic colour per category bucket so the eye can tell a place to STAY (blue)
// from a place to EAT (orange), see (violet), a nature spot (green) or nightlife (pink)
// at a glance — on cards, list section headers and chips. Fixed hues (like the map
// legend) read as an accent on both light and dark themes.
const BUCKET_COLOR = {
  food: '#E8632A', stay: '#2C7DA0', culture: '#8A5CC0',
  nature: '#2E8B57', nightlife: '#D6336C', rental: '#0F9D8C', other: '#8A8F98',
};
function bucketColor(p) { return BUCKET_COLOR[placeBucket(p)] || BUCKET_COLOR.other; }
function placeBucket(p) {
  const cats = Array.isArray(p.categories) ? p.categories : [];
  if (p.stayType || cats.some((c) => ['hotel', 'stay', 'accommodation', 'guesthouse', 'homestay', 'resort', 'hostel', 'apartment'].includes(c))) return 'stay';
  if (cats.includes('rental')) return 'rental';
  for (const it of ['food', 'culture', 'nature', 'nightlife']) if (cats.includes(it)) return it;
  return 'other';
}

// ---- CANONICAL CATEGORY COLOUR SYSTEM ---------------------------------------
// One fixed hue per category "family", used EVERYWHERE a category appears (tags on
// cards and detail, filters, the colour key) so the colour means the same thing all
// over the app. Every one of the ~30 fine categories in the data maps to a family.
// Fixed hues (not CSS vars) so they read as an accent on both light and dark themes.
const CATEGORY_FAMILIES = [
  { key: 'culture',   label: 'Culture & history',   emoji: '🏛', color: '#8A5CC0' },
  { key: 'nature',    label: 'Nature & outdoors',   emoji: '🌿', color: '#2E8B57' },
  { key: 'beach',     label: 'Beaches & water',     emoji: '🏖', color: '#0EA5C4' },
  { key: 'food',      label: 'Food & drink',        emoji: '🍜', color: '#E8632A' },
  { key: 'market',    label: 'Markets & shopping',  emoji: '🛍', color: '#E0A100' },
  { key: 'stay',      label: 'Places to stay',      emoji: '🛏', color: '#2C7DA0' },
  { key: 'nightlife', label: 'Nightlife & social',  emoji: '🌃', color: '#D6336C' },
  { key: 'transport', label: 'Getting around',      emoji: '🛵', color: '#0F9D8C' },
  { key: 'wellness',  label: 'Wellness & spa',      emoji: '💆', color: '#7048E8' },
  { key: 'other',     label: 'More to see',         emoji: '📌', color: '#8A8F98' },
];
const FAMILY_COLOR = Object.fromEntries(CATEGORY_FAMILIES.map((f) => [f.key, f.color]));
const FAMILY_META = Object.fromEntries(CATEGORY_FAMILIES.map((f) => [f.key, f]));
const CAT_FAMILY = {
  culture: 'culture', temple: 'culture', museum: 'culture', spectacle: 'culture', history: 'culture', wat: 'culture', heritage: 'culture',
  nature: 'nature', hike: 'nature', waterfall: 'nature', viewpoint: 'nature', park: 'nature', wildlife: 'nature', hotspring: 'nature', sunset: 'nature', riverside: 'nature', garden: 'nature', cave: 'nature', outdoors: 'nature',
  beach: 'beach', island: 'beach', water: 'beach', dive: 'beach', snorkel: 'beach',
  food: 'food', streetfood: 'food', seafood: 'food', restaurant: 'food', cafe: 'food',
  market: 'market', shopping: 'market',
  stay: 'stay', hotel: 'stay', guesthouse: 'stay', homestay: 'stay', hostel: 'stay', resort: 'stay', apartment: 'stay', camping: 'stay', backpacker: 'stay', accommodation: 'stay',
  nightlife: 'nightlife', bars: 'nightlife', clubs: 'nightlife', cocktail: 'nightlife', rooftop: 'nightlife',
  transport: 'transport', rental: 'transport',
  wellness: 'wellness', spa: 'wellness',
};
function catFamily(cat) { return CAT_FAMILY[cat] || 'other'; }
function catColor(cat) { return FAMILY_COLOR[catFamily(cat)] || FAMILY_COLOR.other; }
// The single most identifying category colour for a whole place (beach beats nature,
// culture beats park, etc.) — used to colour map pins by category.
function placeCatColor(p) {
  const cats = p.categories || [];
  const order = ['beach', 'culture', 'nature', 'market', 'nightlife', 'wellness', 'food', 'stay', 'transport'];
  for (const fam of order) if (cats.some((c) => catFamily(c) === fam)) return FAMILY_COLOR[fam];
  return FAMILY_COLOR.other;
}
// A category chip coloured by its family, with the family name as a tooltip.
function catTag(cat, label) {
  const fam = catFamily(cat);
  return h('span', { class: 'cat-tag', style: `background:${FAMILY_COLOR[fam]}`, title: FAMILY_META[fam].label }, label || cat);
}

// Budget-tier colours — one source of truth shared by badges, chips and the key.
const TIER_COLOR = { low: 'var(--tier-low)', mid: 'var(--tier-mid)', high: 'var(--tier-high)', any: 'var(--grape)', flexible: 'var(--grape)' };
function tierColor(tier) { return TIER_COLOR[tier] || 'var(--grape)'; }
// A small round colour swatch (used to colour filter chips consistently with the key).
function swatch(color) { return h('span', { class: 'swatch', 'aria-hidden': 'true', style: `background:${color}` }); }

// The site-wide colour key: what each category colour and budget colour means. Shown
// (collapsed) on Places and the Map so the colour language is always explained.
function colorKeyCard() {
  const wrap = h('div', { class: 'color-key' });
  wrap.append(h('div', { class: 'muted', style: 'margin:2px 0 4px' }, 'Category colours'));
  wrap.append(h('div', { class: 'cats' }, CATEGORY_FAMILIES.filter((f) => f.key !== 'other').map((f) =>
    h('span', { class: 'cat-tag', style: `background:${f.color}`, title: f.label }, `${f.emoji} ${f.label}`))));
  wrap.append(h('div', { class: 'muted', style: 'margin:10px 0 4px' }, 'Budget'));
  wrap.append(h('div', { class: 'cats' }, [['low', 'Budget'], ['mid', 'Mid-range'], ['high', 'Higher-end'], ['any', 'Any']].map(([t, l]) =>
    h('span', { class: `tier ${t}` }, l))));
  return wrap;
}

// ---- MARKETS: day-of-week awareness -----------------------------------------
// Many markets run only on certain days (weekend walking streets, Fri–Sun floating
// markets). marketDays is an array of weekday indices (0=Sun … 6=Sat); absent/empty
// means daily. These helpers drive the "on today?" line, card chip and ranking so a
// Sunday-only market is not surfaced as "near you now" on a Tuesday.
const DOW_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
function isMarket(p) {
  return !!(p && (p.marketType || (Array.isArray(p.marketDays) && p.marketDays.length)
    || (Array.isArray(p.categories) && p.categories.includes('market'))));
}
// Returns the sorted unique open-days array, or null when the market runs daily.
function marketOpenDays(p) {
  const d = Array.isArray(p.marketDays) ? p.marketDays.filter((n) => Number.isInteger(n) && n >= 0 && n <= 6) : [];
  if (!d.length || d.length >= 7) return null;
  return [...new Set(d)].sort((a, b) => a - b);
}
function marketOnToday(p, dow) { const d = marketOpenDays(p); return !d || d.includes(dow); }
function formatMarketDays(p) {
  const d = marketOpenDays(p);
  if (!d) return 'Daily';
  if (d.length === 2 && d.includes(0) && d.includes(6)) return 'Weekends (Sat & Sun)';
  if (d.join(',') === '0,5,6') return 'Fri–Sun';                 // Fri, Sat, Sun (Sun wraps to index 0)
  let contig = true;
  for (let i = 1; i < d.length; i++) if (d[i] !== d[i - 1] + 1) contig = false;
  if (contig && d.length > 2) return `${DOW_SHORT[d[0]]}–${DOW_SHORT[d[d.length - 1]]}`;
  return d.map((n) => DOW_SHORT[n]).join(d.length > 2 ? ', ' : ' & ');
}
// Human "next open" hint from today: 'tomorrow' or the weekday name; null when daily.
function nextMarketDay(p, dow) {
  const d = marketOpenDays(p);
  if (!d) return null;
  for (let i = 1; i <= 7; i++) { const nd = (dow + i) % 7; if (d.includes(nd)) return i === 1 ? 'tomorrow' : DOW_SHORT[nd]; }
  return null;
}
// Small chip for cards/lists: green "On today" when open now, else the day pattern.
function marketChip(p) {
  if (!isMarket(p)) return null;
  const d = marketOpenDays(p);
  if (!d) return h('span', { class: 'mkt-chip daily' }, `🛍️ ${p.marketType || 'Market'} · daily`);
  const on = d.includes(new Date().getDay());
  return h('span', { class: `mkt-chip ${on ? 'on' : 'off'}`, title: `Runs ${formatMarketDays(p)}` },
    on ? '🛍️ On today' : `🛍️ ${formatMarketDays(p)}`);
}
// Detail-screen block: market type, what they sell, the days/hours and a live on-today line.
function marketInfoCard(p) {
  if (!isMarket(p)) return null;
  const card = h('div', { class: 'card market-info' }, [h('h2', {}, '🛍️ Market')]);
  if (p.marketType) card.append(h('p', { class: 'market-type' }, h('strong', {}, p.marketType)));
  if (p.sells) card.append(h('p', {}, [h('strong', {}, 'What they sell: '), h('span', {}, p.sells)]));
  card.append(h('p', {}, [h('strong', {}, 'Runs: '), h('span', {}, formatMarketDays(p) + (p.hours ? ` · ${p.hours}` : ''))]));
  const d = marketOpenDays(p);
  if (!d) { card.append(h('p', { class: 'mkt-status on' }, '✅ Open daily')); return card; }
  const on = d.includes(new Date().getDay());
  const nxt = nextMarketDay(p, new Date().getDay());
  card.append(h('p', { class: `mkt-status ${on ? 'on' : 'off'}` },
    on ? '✅ On today' : `⏳ Not on today${nxt ? ` — next on ${titleCase(nxt)}` : ''}`));
  return card;
}

// --- Beaches, lifeguards & jellyfish safety ----------------------------------
// Beaches are ordinary map places (editable review, save, share) that additionally
// carry optional safety fields: lifeguard status, a swimming-conditions note, and a
// seasonal jellyfish window. No real-time jellyfish feed exists for the region, so the
// month window is HONEST SEASONAL GUIDANCE — the card says so and points to the flags.
const MONTH_SHORT = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
function isBeach(p) {
  return !!(p && (p.lifeguard || p.swim || (Array.isArray(p.jellyfishMonths) && p.jellyfishMonths.length)
    || (Array.isArray(p.categories) && p.categories.includes('beach'))));
}
// Sorted unique 1-12 month list of elevated jellyfish risk, or null when none is set.
function jellyMonths(p) {
  const m = Array.isArray(p.jellyfishMonths) ? p.jellyfishMonths.filter((n) => Number.isInteger(n) && n >= 1 && n <= 12) : [];
  return m.length ? [...new Set(m)].sort((a, b) => a - b) : null;
}
function jellyInSeason(p, month) { const m = jellyMonths(p); return !!(m && m.includes(month)); }
// Compact "Jul–Oct" / "Apr, Jun & Aug" from a sorted month array.
function formatMonths(m) {
  if (!m || !m.length) return '';
  let contig = true;
  for (let i = 1; i < m.length; i++) if (m[i] !== m[i - 1] + 1) contig = false;
  if (contig && m.length > 2) return `${MONTH_SHORT[m[0]]}–${MONTH_SHORT[m[m.length - 1]]}`;
  return m.map((n) => MONTH_SHORT[n]).join(m.length > 2 ? ', ' : ' & ');
}
const LIFEGUARD_LABEL = {
  yes: ['✅', 'Lifeguards patrol this beach', 'on'],
  seasonal: ['⚠️', 'Lifeguards / flags in season — check for a red flag before you swim', 'off'],
  no: ['❌', 'No lifeguards — swim with extra care and never alone', 'off'],
  unknown: ['ℹ️', 'No patrol information — treat as unpatrolled', 'muted'],
};
// Small card/list chip: warns first about jellyfish season, else shows lifeguard status.
// Returns null for a bare beach with no structured info and no active warning (no clutter).
function beachChip(p) {
  if (!isBeach(p)) return null;
  const nowM = new Date().getMonth() + 1;
  if (jellyInSeason(p, nowM)) return h('span', { class: 'beach-chip jelly', title: 'Elevated jellyfish season — check the flags' }, '🪼 Jellyfish season');
  if (p.lifeguard === 'yes') return h('span', { class: 'beach-chip on' }, '🏖️ Lifeguards');
  if (p.lifeguard === 'no') return h('span', { class: 'beach-chip off' }, '🏖️ No lifeguards');
  return null;
}
// Wave-height descriptor for swimming: [label, severity class].
function waveDesc(m) {
  if (m == null) return null;
  if (m < 0.3) return ['glassy calm', 'on'];
  if (m < 0.6) return ['calm', 'on'];
  if (m < 1.25) return ['moderate — take care', 'off'];
  if (m < 2.5) return ['rough — strong swimmers only', 'off'];
  return ['very rough — stay out of the water', 'off'];
}
function seaAgo(ts) {
  const min = Math.max(1, Math.round((Date.now() - ts) / 60000));
  if (min < 60) return `${min} min ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr}h ago`;
  return `${Math.round(hr / 24)}d ago`;
}
// Live sea-state sub-block for a beach: significant wave height + water temperature from
// the Open-Meteo Marine API, painted from cache immediately and refreshed when online.
// Honest offline fallback so the beach card never blocks on the network.
function beachSeaBlock(coords) {
  const box = h('div', { class: 'beach-sea' });
  function paint(rec, loading) {
    box.innerHTML = '';
    if (rec && rec.waveHeight != null) {
      const wd = waveDesc(rec.waveHeight);
      const bits = [`🌊 Sea now: waves ${rec.waveHeight.toFixed(1)} m`];
      if (wd) bits.push(`(${wd[0]})`);
      if (rec.seaTemp != null) bits.push(`· water ${Math.round(rec.seaTemp)}°C`);
      box.append(h('p', { class: `beach-sea-line ${wd ? wd[1] : ''}` }, bits.join(' ')));
      box.append(h('p', { class: 'muted small' }, `Live sea state · updated ${seaAgo(rec.fetchedAt)}${online() ? '' : ' · offline'}`));
    } else {
      box.append(h('p', { class: 'muted small' }, loading ? '🌊 Checking sea conditions…' : '🌊 Live sea conditions load when you are online.'));
    }
  }
  const cached = getCachedMarine(coords);
  paint(cached, !cached && online());
  if (online()) {
    refreshMarine(coords).then((r) => { if ((location.hash || '').startsWith('#place') && r) paint(r, false); });
  }
  return box;
}
// Community jellyfish sightings — the honest "updated on wifi" layer: no real-time feed
// exists, but travellers can record and SHARE sightings through the backendless Travel
// Circle, and received ones pin to the beach. Reports live on placeData[id].jellyReports.
const SEV_LABEL = { seen: 'Jellyfish seen', lots: 'Lots of jellyfish', stung: 'Someone was stung' };
function daysSinceISO(iso) { const n = -daysUntilISO(iso); return Number.isFinite(n) ? n : 9999; }
function fmtReportDate(iso) {
  const ds = daysSinceISO(iso);
  if (ds <= 0) return 'today';
  if (ds === 1) return 'yesterday';
  if (ds < 30) return `${ds} days ago`;
  return iso;
}
function jellyReportsBlock(p) {
  const wrap = h('div', { class: 'jelly-reports' });
  const list = h('div', {});
  wrap.append(list);
  function render() {
    list.innerHTML = '';
    const reps = getJellyReports(p.id);
    const recent = reps.filter((r) => daysSinceISO(r.d) <= 60).sort((a, b) => daysSinceISO(a.d) - daysSinceISO(b.d));
    if (recent.length) {
      list.append(h('p', { class: 'jelly-head' }, `🪼 Traveller sightings — ${recent.length} in the last 60 days`));
      recent.slice(0, 4).forEach((r) => {
        const who = r.by === 'You' ? 'you' : (r.by || 'a traveller');
        const when = fmtReportDate(r.d);
        list.append(h('div', { class: 'list-note' },
          `${when.charAt(0).toUpperCase()}${when.slice(1)} · ${SEV_LABEL[r.sev] || SEV_LABEL.seen}${r.note ? ` — ${r.note}` : ''} · ${who}`));
      });
    } else {
      list.append(h('p', { class: 'muted small' }, reps.length
        ? 'No sightings in the last 60 days (older reports are kept in your records).'
        : 'No traveller sightings reported here yet. If you see jellyfish, add a report to warn others.'));
    }
    let sev = 'seen';
    const note = h('input', { type: 'text', maxlength: '160', class: 'jelly-note-input', placeholder: 'Optional: where / how many (e.g. north end, small stingers)' });
    const sevRow = h('div', { class: 'sev-row' });
    [['seen', 'Seen'], ['lots', 'Lots'], ['stung', 'Stung']].forEach(([k, lbl]) => {
      sevRow.append(h('button', {
        class: 'chip', dataset: { k }, 'aria-pressed': k === sev ? 'true' : 'false',
        onclick: () => { sev = k; sevRow.querySelectorAll('.chip').forEach((c) => c.setAttribute('aria-pressed', c.dataset.k === sev ? 'true' : 'false')); },
      }, lbl));
    });
    list.append(h('details', { class: 'jelly-form' }, [
      h('summary', {}, '＋ Report a jellyfish sighting'),
      h('p', { class: 'muted small' }, 'Saved on your device and dated today. Share it below so other travellers see it — nothing is sent to any server.'),
      sevRow, note,
      h('button', { class: 'btn block', style: 'margin-top:8px', onclick: () => {
        addJellyReport(p.id, { d: todayKey(), sev, note: (note.value || '').trim().slice(0, 160), by: 'You' });
        render();
      } }, 'Save sighting'),
    ]));
    if (reps.length) {
      list.append(shareButton('📤 Share the latest sighting', `Jellyfish sighting — ${p.name}`,
        () => { const r = getJellyReports(p.id).slice().sort((a, b) => daysSinceISO(a.d) - daysSinceISO(b.d))[0]; return shareUrl('in', encodeShare('jelly', { id: p.id, n: p.name, d: r.d, sev: r.sev, note: r.note }, ensureMe())); }));
    }
  }
  render();
  return wrap;
}

// One-line "can I swim here today?" synthesis from everything the app knows: seasonal
// jellyfish risk, recent traveller sightings, lifeguard status and the cached sea state.
// A summary only — the detailed blocks below (and the live sea state) always carry the
// full picture. Red = take real care; amber = caution; green = no specific warning now.
function swimVerdict(p) {
  if (!isBeach(p)) return null;
  const nowM = new Date().getMonth() + 1;
  const reasons = [];
  let sev = 0;
  if (jellyInSeason(p, nowM)) { reasons.push('jellyfish season'); sev = Math.max(sev, 1); }
  const reps = getJellyReports(p.id) || [];
  if (reps.some((r) => r.sev === 'stung' && daysSinceISO(r.d) <= 14)) { reasons.push('a sting reported in the last two weeks'); sev = 2; }
  else if (reps.some((r) => daysSinceISO(r.d) <= 14)) { reasons.push('recent traveller sightings'); sev = Math.max(sev, 1); }
  if (p.lifeguard === 'no') { reasons.push('no lifeguards'); sev = Math.max(sev, 1); }
  const sea = p.coords ? getCachedMarine(p.coords) : null;
  if (sea && sea.waveHeight != null) {
    if (sea.waveHeight >= 2.5) { reasons.push('very rough water now'); sev = 2; }
    else if (sea.waveHeight >= 1.25) { reasons.push('choppy water now'); sev = Math.max(sev, 1); }
  }
  const label = sev === 2 ? ['🔴', 'Take real care in the water today', 'off']
    : sev === 1 ? ['🟠', 'Swim with caution today', 'off']
    : ['🟢', 'No specific warnings right now — always obey the beach flags', 'on'];
  const box = h('div', {});
  box.append(h('p', { class: `swim-verdict ${label[2]}` }, `${label[0]} ${label[1]}`));
  if (reasons.length) box.append(h('p', { class: 'muted small' }, `Because: ${reasons.join('; ')}.`));
  return box;
}

// Detail-screen block: lifeguard status, swimming conditions, live sea state (waves /
// water temperature), seasonal jellyfish risk ("in season this month?"), and first aid.
function beachInfoCard(p) {
  if (!isBeach(p)) return null;
  const card = h('div', { class: 'card beach-info' }, [h('h2', {}, '🏖️ Beach & swimming')]);
  const sv = swimVerdict(p); if (sv) card.append(sv);
  if (p.lifeguard) {
    const lg = LIFEGUARD_LABEL[p.lifeguard] || LIFEGUARD_LABEL.unknown;
    card.append(h('p', { class: `beach-lg ${lg[2]}` }, `${lg[0]} ${lg[1]}`));
  } else {
    card.append(h('p', { class: 'muted' }, 'Check on arrival for a lifeguard flag system.'));
  }
  if (p.swim) card.append(h('p', {}, [h('strong', {}, 'Conditions: '), h('span', {}, p.swim)]));
  if (p.coords && p.coords.lat != null && p.coords.lng != null) card.append(beachSeaBlock(p.coords));
  const m = jellyMonths(p);
  if (m) {
    const on = m.includes(new Date().getMonth() + 1);
    card.append(h('p', { class: `beach-jelly ${on ? 'on' : 'off'}` },
      on ? `🪼 Jellyfish: elevated risk this month (peak season ${formatMonths(m)})`
         : `🪼 Jellyfish: lower risk now — peak season is ${formatMonths(m)}`));
  }
  if (p.jellyfish) card.append(h('p', { class: 'muted' }, p.jellyfish));
  card.append(jellyReportsBlock(p));
  card.append(h('p', { class: 'muted small' }, 'No real-time jellyfish warning exists anywhere in the region. Always obey the beach flags — a red flag means do not swim — and ask lifeguards or locals about recent sightings.'));
  card.append(h('button', { class: 'btn ghost block', style: 'margin-top:8px', onclick: () => go('#danger') }, '🩹 Sting & marine first aid'));
  return card;
}

// "1.2 km · ~15 min walk away" from the user's last GPS fix, when known. Offline,
// pure maths (haversine + ~4.8 km/h walking pace); walk time only for close spots.
// Returns a chip node or null. Reused on cards, detail and the near-me experiences.
function distanceChip(p) {
  const fix = getLastFix();
  if (!fix || !p || !p.coords) return null;
  const km = haversineKm(fix, p.coords);
  const parts = [fmtDistance(km)];
  const t = driveLabel(km);            // walk time if close, else estimated road-drive time
  if (t) parts.push(t);
  parts.push(`${compass(bearing(fix, p.coords))}`);
  return h('span', { class: 'dist-chip', title: 'From your last location' }, `📍 ${parts.join(' · ')}`);
}

function placeCard(p) {
  const cats = Array.isArray(p.categories) ? p.categories : [];
  const hasPrice = p.priceRange && p.priceRange.currency;
  const priceStr = hasPrice ? (priceLine(p.priceRange.low, p.priceRange.high, p.priceRange.currency) || 'Free') : '';
  const colls = collectionsForItem(p.id);
  const dchip = distanceChip(p);
  const accent = bucketColor(p);
  const fam = placeFamily(p);
  const src = placePhotoSrc(p);
  // A recognition thumbnail on the left: a self-hosted photo when one exists (offline,
  // lazy-loaded), else a calm family-emoji placeholder. The category colour still reads
  // from the left accent bar and the coloured tags, so the placeholder stays quiet.
  const thumb = src
    ? h('img', { class: 'pc-thumb', src, alt: '', loading: 'lazy', decoding: 'async' })
    : h('span', { class: 'pc-thumb ph' }, (FAMILY_META[fam] || FAMILY_META.other).emoji);
  return h('div', { class: 'card place-card', style: `--cat:${accent}` }, [
    h('div', { class: 'pc-row' }, [
      thumb,
      h('div', { class: 'pc-body' }, [
        h('div', { class: 'place-head' }, [
          h('h2', {}, `${p.isPin ? '📌 ' : ''}${p.name}`),
          h('button', {
            class: 'save-star', 'aria-label': 'Quick save to favourites', title: 'Quick save',
            onclick: (e) => { const on = toggleFavorite(p.id); e.currentTarget.textContent = on ? '★' : '☆'; },
          }, isFavorite(p.id) ? '★' : '☆'),
        ]),
        (cats.length || (p.budgetTier && !p.isPin)) ? h('div', { class: 'row-between' }, [
          h('div', { class: 'cats' }, cats.map((c) => catTag(c))),
          (p.budgetTier && !p.isPin) ? tierBadge(p.budgetTier) : null,
        ]) : null,
        travelerChips(p),
        isMarket(p) ? h('div', { style: 'margin:2px 0' }, marketChip(p)) : null,
        (() => { const bc = beachChip(p); return bc ? h('div', { style: 'margin:2px 0' }, bc) : null; })(),
        p.blurb ? h('p', {}, p.blurb) : null,
        h('p', { class: 'muted' }, [p.city, priceStr].filter(Boolean).join(' · ')),
        dchip ? h('div', { style: 'margin:2px 0' }, dchip) : null,
        p.rating ? h('div', { class: 'stars-static' }, `${starsStr(p.rating)} ${Number(p.rating).toFixed(1)}`) : null,
        colls.length ? h('div', { class: 'cats' }, colls.map((c) =>
          h('span', { class: 'cat-tag', style: 'background:var(--grape)' }, `${c.emoji} ${c.name}`))) : null,
      ]),
    ]),
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
    // Blend the sites' scores weighted by review volume, so a site with 50,000 reviews
    // outweighs one with 86; fall back to a simple mean when no counts are present.
    const scored = ext.map((e) => ({ star: extStars(e.score, e.scale), w: Number(e.count) || 0 })).filter((x) => !isNaN(x.star));
    const totalW = scored.reduce((a, x) => a + x.w, 0);
    const blended = !scored.length ? 0
      : totalW > 0
        ? scored.reduce((a, x) => a + x.star * (x.w || 1), 0) / scored.reduce((a, x) => a + (x.w || 1), 0)
        : scored.reduce((a, x) => a + x.star, 0) / scored.length;
    const overall = own > 0 ? own : blended;
    if (overall > 0) {
      const how = own > 0 ? ' · your rating counts first'
        : scored.length > 1 ? (totalW > 0 ? ' · weighted by review volume' : ' · averaged across sites') : '';
      card.append(h('div', { class: 'rating-block' }, [
        h('span', { class: 'stars-static' }, starsStr(overall)),
        h('span', { class: 'muted' }, ` ${overall.toFixed(1)} overall${how}`),
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
// --- Air quality -------------------------------------------------------------
// US AQI band -> [label, css class, health advice]. Standard US EPA breakpoints.
function aqiBand(aqi) {
  if (aqi == null) return null;
  if (aqi <= 50) return ['Good', 'good', 'Air is clean — enjoy the outdoors.'];
  if (aqi <= 100) return ['Moderate', 'mod', 'Fine for most; unusually sensitive people may take it easier.'];
  if (aqi <= 150) return ['Unhealthy for sensitive groups', 'usg', 'Asthma, heart or lung conditions, children and the elderly should limit long or intense time outdoors.'];
  if (aqi <= 200) return ['Unhealthy', 'unhealthy', 'Everyone may feel effects — limit prolonged exertion outdoors and consider a mask.'];
  if (aqi <= 300) return ['Very unhealthy', 'vunhealthy', 'Health warning — avoid outdoor exertion and wear an N95/KN95 mask outside.'];
  return ['Hazardous', 'hazard', 'Emergency conditions — stay indoors with air filtered where possible; wear an N95/KN95 outdoors.'];
}
// Air-quality sub-block for a city spot: US AQI + PM2.5, painted from cache immediately
// and refreshed when online (repaints only if still attached). Honest offline fallback.
function airBlock(spot, opts) {
  const compact = opts && opts.compact;
  const box = h('div', { class: 'air-block' });
  const key = spotKey(spot);
  function paint(rec, loading) {
    box.innerHTML = '';
    if (rec && rec.aqi != null) {
      const b = aqiBand(rec.aqi);
      const pm = rec.pm25 != null ? ` · PM2.5 ${Math.round(rec.pm25)} µg/m³` : '';
      box.append(h('p', { class: `aqi-line ${b[1]}` }, `🌫️ Air quality: ${Math.round(rec.aqi)} US AQI — ${b[0]}${pm}`));
      if (!compact) box.append(h('p', { class: 'muted small' }, b[2]));
      box.append(h('p', { class: 'muted small' }, `Updated ${seaAgo(rec.fetchedAt)}${online() ? '' : ' · offline'}`));
    } else {
      box.append(h('p', { class: 'muted small' }, loading ? '🌫️ Checking air quality…' : '🌫️ Air quality loads when you are online.'));
    }
  }
  const cached = getCachedAir(key);
  paint(cached, !cached && online());
  if (online()) refreshAir(spot).then((r) => { if (r && box.isConnected) paint(r, false); });
  return box;
}

// --- Sun / UV index ----------------------------------------------------------
// WHO UV Index band -> [label, css band class, sun-safety advice]. Reuses the AQI
// colour bands so no new palette is needed. UV comes free with the 7-day forecast
// (Open-Meteo daily uv_index_max), so it is cache-first and works offline.
function uvBand(uv) {
  if (uv == null) return null;
  if (uv < 3) return ['Low', 'good', 'Minimal sun protection needed for most people.'];
  if (uv < 6) return ['Moderate', 'mod', 'Wear sunscreen, a hat and sunglasses; seek shade near midday.'];
  if (uv < 8) return ['High', 'usg', 'Protection needed — SPF 30+, a hat, and shade between 11am and 3pm.'];
  if (uv < 11) return ['Very high', 'unhealthy', 'Extra care — avoid the sun 11am–4pm, use SPF 50+, cover up and re-apply often.'];
  return ['Extreme', 'hazard', 'Avoid being outside in the middle of the day; full protection is essential.'];
}
// A coloured UV line node (optionally with the advice line). Returns null when unknown.
function uvLineNode(uv, opts) {
  const b = uvBand(uv);
  if (!b) return null;
  const box = h('div', {});
  box.append(h('p', { class: `aqi-line ${b[1]}` }, `☀️ Sun index (UV): ${Math.round(uv)} — ${b[0]}`));
  if (opts && opts.advice) box.append(h('p', { class: 'muted small' }, b[2]));
  return box;
}
// Today's UV for a place's location, taken from the nearest forecast city (cache-first,
// refreshed once when online). Mirrors airBlock so the card never blocks on the network.
function uvTodayBlock(coords, country) {
  const spot = nearestSpot(coords, country);
  const box = h('div', { class: 'air-block' });
  function paint(rec) {
    box.innerHTML = '';
    const uv = rec && rec.daily && rec.daily[0] ? rec.daily[0].uv : null;
    const node = uvLineNode(uv, { advice: true });
    if (node) box.append(node);
    else box.append(h('p', { class: 'muted small' }, online() ? '☀️ Checking the sun index…' : '☀️ Sun (UV) index loads with the forecast when you are online.'));
  }
  const cached = getCachedWeather(spotKey(spot));
  paint(cached);
  if (online() && !(cached && cached.daily && cached.daily.length)) {
    refreshWeather(spot).then((r) => { if (r && box.isConnected) paint(r); });
  }
  return box;
}

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

  card.append(airBlock(spot, { compact: true }));
  card.append(uvTodayBlock(p.coords, p.country));
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
    card.append(h('a', { class: 'btn ghost block', style: 'margin-top:8px', href: mapsDirUrl(p), target: '_blank', rel: 'noopener' }, 'Get directions in Maps ↗'));
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

// ---- TRANSPORT: getting to & from a place ----------------------------------
// Per-place connections computed from coordinates: the nearest airport, train, bus and
// ferry hub (from TRANSPORT_HUBS) plus the nearest cross-border crossing (from CROSSINGS).
// Distances are great-circle from the place; the map links resolve each hub by NAME, so
// door-to-door directions stay accurate even where a hub coordinate is only approximate.
const HUB_TYPES = [
  { type: 'airport', emoji: '🛫', label: 'airport', max: Infinity },
  { type: 'train', emoji: '🚆', label: 'train station', max: 130 },
  { type: 'bus', emoji: '🚌', label: 'bus terminal', max: 90 },
  { type: 'ferry', emoji: '⛴️', label: 'pier / ferry', max: 110 },
];

function nearestHub(coords, type, cc) {
  let best = null, bestSec = null;
  for (const hub of TRANSPORT_HUBS) {
    if (hub.type !== type || !hub.coords) continue;
    if (cc && hub.cc !== cc) continue;
    const km = haversineKm(coords, hub.coords);
    if (hub.secondary) { if (!bestSec || km < bestSec.km) bestSec = { hub, km }; }
    else if (!best || km < best.km) best = { hub, km };
  }
  // Prefer a primary (long-distance) hub. Only fall back to a secondary/commuter one when
  // it is substantially closer (>20 km) — so a central place shows the main terminal, not
  // a nearer commuter stop, but a remote place still gets whatever is actually near.
  if (best && bestSec) return (best.km <= bestSec.km + 20) ? best : bestSec;
  return best || bestSec;
}

function nearestCrossing(coords, maxKm) {
  let best = null;
  for (const x of CROSSINGS) {
    if (!x.coords) continue;
    const km = haversineKm(coords, x.coords);
    if (!best || km < best.km) best = { x, km };
  }
  return best && best.km <= maxKm ? best : null;
}

// Google Maps directions from a place to a named hub. Origin is the place's coordinates;
// destination is the hub NAME + city (resolved by Maps), so it stays accurate regardless
// of the stored hub coordinate. Opening needs internet; the distances above work offline.
function hubDirUrl(from, hub) {
  const dest = encodeURIComponent(`${hub.name}, ${hub.city}`);
  return `https://www.google.com/maps/dir/?api=1&origin=${from.lat},${from.lng}&destination=${dest}`;
}

function transitCard(p) {
  if (!p || !p.coords || p.isPin) return null;
  const cc = p.country || (p.id || '').split('-')[0];
  const card = h('div', { class: 'card' }, [
    h('h2', {}, '🚉 Getting here & away'),
    h('p', { class: 'muted tiny', style: 'margin:2px 0 8px' },
      'Nearest airport, train, bus and boat connections. Distances are straight-line from this spot; tap for door-to-door directions (needs internet).'),
  ]);
  HUB_TYPES.forEach((t) => {
    const found = nearestHub(p.coords, t.type, cc);
    if (!found || found.km > t.max) return;
    const { hub, km } = found;
    const dir = compass(bearing(p.coords, hub.coords));
    card.append(h('div', { class: 'transit-row' }, [
      h('div', { class: 'row-between' }, [
        h('strong', {}, `${t.emoji} ${hub.name}${hub.code ? ` (${hub.code})` : ''}`),
        h('span', { class: 'fair' }, `${kmLabel(km)} · ${dir}`),
      ]),
      h('div', { class: 'muted tiny', style: 'margin:2px 0 4px' }, (hub.city && hub.city !== p.city) ? `${titleCase(t.label)} · ${hub.city}` : titleCase(t.label)),
      hub.into ? h('div', { class: 'list-note' }, hub.into) : null,
      hub.note ? h('div', { class: 'muted tiny' }, hub.note) : null,
      h('a', { class: 'btn ghost block', style: 'margin-top:4px', href: hubDirUrl(p.coords, hub), target: '_blank', rel: 'noopener' }, 'Directions ↗'),
    ]));
  });
  // Nearest open cross-border crossing (from the borders dataset) — useful when a place
  // sits near a frontier and the traveller is continuing into the next country.
  const bx = nearestCrossing(p.coords, 100);
  if (bx) {
    card.append(h('div', { class: 'transit-row' }, [
      h('div', { class: 'row-between' }, [
        h('strong', {}, `🛂 ${bx.x.name}`),
        h('span', { class: 'fair' }, kmLabel(bx.km)),
      ]),
      h('div', { class: 'muted tiny', style: 'margin:2px 0 4px' }, `Border crossing · ${bx.x.pair}`),
      h('button', { class: 'btn ghost block', onclick: () => go('#crossings') }, 'Crossing details, hours & visa ↗'),
    ]));
  }
  // Always-on helpers: a live "transport near here" search, the country's intercity routes
  // and its arrival guide (airport → town, cash, SIM). These keep every place useful even
  // where no listed hub sits within range.
  card.append(h('div', { class: 'chips', style: 'margin-top:8px' }, [
    h('a', { class: 'chip', href: mapsSearch(`bus station OR train station near ${p.coords.lat},${p.coords.lng}`), target: '_blank', rel: 'noopener' }, '🔎 Transport near here ↗'),
    h('button', { class: 'chip', onclick: () => go(`#transport-${cc}`) }, '🧭 Routes, rentals & tickets'),
    h('button', { class: 'chip', onclick: () => go(`#arrival-${cc}`) }, '🛬 Arrival guide'),
  ]));
  card.append(sourcesNote(TRANSIT_SOURCES, 'July 2026'));
  return card;
}

// ---- LOCAL SECRETS (per-place crowdsourced tips; on-device, shared by link) --
// Insider tips for a place: curated guide tips + the user's own secrets + secrets
// other travellers shared with a link. Stored in placeData[id].secrets (rides along
// in the backup). A progressive-disclosure drawer keeps the place page calm.
function getPlaceSecrets(id) { const s = getPlaceData(id).secrets; return Array.isArray(s) ? s : []; }
function addPlaceSecret(id, { text, by }) {
  const list = getPlaceSecrets(id).slice();
  list.unshift({ text: String(text || '').slice(0, 400), by: String(by || '').slice(0, 40), at: todayKey() });
  setPlaceField(id, 'secrets', list);
}
function removePlaceSecret(id, idx) { const list = getPlaceSecrets(id).slice(); list.splice(idx, 1); setPlaceField(id, 'secrets', list); }

function localSecretsCard(p) {
  if (p.isPin) return null;
  const guideTips = Array.isArray(p.tips) ? p.tips : [];
  const card = h('details', { class: 'card local-secrets' });
  const summary = h('summary', {}, '');
  card.append(summary);
  card.append(h('p', { class: 'muted small', style: 'margin:2px 0 8px' }, 'Insider tips for this place — from the guide, from you, and from travellers who shared a link. Kept on your device.'));
  if (guideTips.length) {
    card.append(h('h3', { style: 'margin:6px 0 2px' }, '📖 From the guide'));
    guideTips.forEach((t) => card.append(h('div', { class: 'list-note' }, t)));
  }
  const listEl = h('div', {});
  card.append(listEl);
  function drawSecrets() {
    listEl.innerHTML = '';
    const s = getPlaceSecrets(p.id);
    summary.textContent = `🔑 Local secrets & tips${s.length ? ` (${s.length})` : ''}`;
    if (s.length) listEl.append(h('h3', { style: 'margin:10px 0 2px' }, '🔑 Traveller secrets'));
    s.forEach((sec, i) => {
      listEl.append(h('div', { class: 'secret-item' }, [
        h('p', { style: 'margin:0' }, sec.text),
        h('div', { class: 'tiny muted' }, [sec.by, sec.at].filter(Boolean).join(' · ')),
        h('div', { class: 'listing-actions' }, [
          shareButton('🔗 Share', `A tip for ${p.name}`, () => shareUrl('in', encodeShare('secret', { id: p.id, n: p.name, text: sec.text, by: sec.by || (ensureMe().name || '') }, ensureMe())), 'btn ghost'),
          h('button', { class: 'btn ghost', 'aria-label': 'Remove this secret', onclick: () => { removePlaceSecret(p.id, i); drawSecrets(); } }, '🗑'),
        ]),
      ]));
    });
  }
  drawSecrets();
  const ta = h('textarea', { class: 'ta', rows: '2', maxlength: '400', placeholder: 'A hidden gem, a shortcut, a heads-up…' });
  card.append(h('div', { class: 'secret-add' }, [
    h('label', { class: 'secret-cta' }, '✨ Spotted something new? Add to the collective wisdom'),
    ta,
    h('button', { class: 'btn block', style: 'margin-top:6px', onclick: () => {
      const t = ta.value.trim(); if (!t) { ta.focus(); return; }
      addPlaceSecret(p.id, { text: t, by: ensureMe().name || '' });
      ta.value = ''; drawSecrets();
    } }, '＋ Add this secret'),
    h('button', { class: 'btn ghost block', style: 'margin-top:6px', onclick: () => go(`#feedback-${p.id}`) }, '✍️ Suggest a bigger correction to the guide'),
  ]));
  return card;
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
      h('div', { class: 'cats' }, cats.map((c) => catTag(c))),
      (p.budgetTier && !p.isPin) ? tierBadge(p.budgetTier) : null,
    ]) : null,
    travelerChips(p),
    photoBlock(p, p.name),
    p.blurb ? h('p', {}, p.blurb) : null,
  ]);
  // Show the synthesised rating only when there is no real external-ratings snapshot; when
  // externalRatings exists it is the single source of truth (rendered lower down), so the two
  // can no longer sit side by side showing slightly different numbers.
  if (p.rating && !(Array.isArray(p.externalRatings) && p.externalRatings.length)) card.append(ratingBlock(p));
  if (p.history) { card.append(h('h3', {}, 'A little history'), h('p', {}, p.history)); }
  if (p.whyItFits) { card.append(h('h3', {}, 'Why it fits you'), h('p', {}, p.whyItFits)); }
  if (hasPrice) {
    card.append(h('h3', {}, 'Price'));
    card.append(h('p', {}, `${priceLine(p.priceRange.low, p.priceRange.high, p.priceRange.currency) || 'Free'}${p.priceRange.note ? ' · ' + p.priceRange.note : ''}`));
  }
  if (p.hours && !isMarket(p)) card.append(h('p', { class: 'muted' }, `Hours: ${p.hours}`));
  if (p.bookHint) card.append(h('p', { class: 'muted' }, `Booking: ${p.bookHint}`));
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
    p.isPin ? h('button', { class: 'btn ghost block', style: 'margin-top:8px', onclick: () => go(`#addpin-${p.id}`) }, '✎ Edit this place') : null,
    p.isPin ? h('button', {
      class: 'btn ghost block', style: 'margin-top:8px; color:var(--warn); border-color:var(--warn)',
      onclick: () => { if (confirm('Delete this pin?')) { deletePin(p.id); go('#saved'); } },
    }, 'Delete pin') : null,
  ]);

  wrap.append(card);
  const accBlock = placeAccessBlock(p);
  if (accBlock) wrap.append(accBlock);
  const mkt = marketInfoCard(p);
  if (mkt) wrap.append(mkt);
  const beach = beachInfoCard(p);
  if (beach) wrap.append(beach);
  const orient = orientationCard(p);
  if (orient) wrap.append(orient);
  const transit = transitCard(p);
  if (transit) wrap.append(transit);
  const extCard = externalRatingsCard(p);
  if (extCard) wrap.append(extCard);
  const wxCard = weatherNearbyCard(p);
  if (wxCard) wrap.append(wxCard);
  const secretsCard = localSecretsCard(p);
  if (secretsCard) wrap.append(secretsCard);
  wrap.append(actions, yourLayer(p));
  if (p.sources && p.sources.length) wrap.append(sourcesNote(p.sources, p.verified, p));
  mount(wrap, backHash);
}

// Photos the traveller attached to a place, stored on-device: blobs in IndexedDB keyed by
// the place, with the ordered key list kept in placeData[id].photos (so they ride along in
// the full backup). Autosaves immediately, like the rating/note/review on the same card.
function placePhotoKeys(id) { const d = getPlaceData(id); return Array.isArray(d.photos) ? d.photos : []; }
async function addPlacePhotos(id, files) {
  const keys = placePhotoKeys(id).slice();
  let n = 0;
  for (const f of files) {
    const nk = `placephoto-${id}-${Date.now()}-${n++}-${Math.floor(Math.random() * 1e6)}`;
    try { await putBlob(nk, f); keys.push(nk); } catch { /* skip a photo that will not store */ }
  }
  setPlaceField(id, 'photos', keys);
  return keys;
}
function removePlacePhoto(id, key) {
  setPlaceField(id, 'photos', placePhotoKeys(id).filter((k) => k !== key));
  delBlob(key);
}
// A reusable "add photos" block (camera + library) that writes straight to a place and
// repaints the given thumbs container. Shared by the place card and the pin editor.
function placePhotoControls(id, thumbs, renderThumbs) {
  const camIn = h('input', { type: 'file', accept: 'image/*', capture: 'environment', style: 'display:none' });
  const libIn = h('input', { type: 'file', accept: 'image/*', multiple: '', style: 'display:none' });
  const onPick = async (inp) => {
    const files = inp.files ? [...inp.files] : []; inp.value = '';
    if (files.length) { await addPlacePhotos(id, files); renderThumbs(); }
  };
  camIn.onchange = () => onPick(camIn);
  libIn.onchange = () => onPick(libIn);
  return h('div', {}, [
    thumbs,
    h('div', { class: 'chips' }, [
      h('button', { class: 'chip', onclick: () => camIn.click() }, '📷 Take a photo'),
      h('button', { class: 'chip', onclick: () => libIn.click() }, '🖼 Add pictures'),
    ]),
    camIn, libIn,
  ]);
}
function placePhotoThumbs(id) {
  const thumbs = h('div', { class: 'photo-thumbs' });
  const renderThumbs = () => {
    thumbs.innerHTML = '';
    const keys = placePhotoKeys(id);
    if (!keys.length) { thumbs.append(h('p', { class: 'muted', style: 'margin:0' }, 'No photos yet — add your own.')); return; }
    keys.forEach((k) => {
      const img = h('img', { alt: 'Your photo of this place', loading: 'lazy' });
      getBlob(k).then((b) => { if (b) img.src = URL.createObjectURL(b); }).catch(() => {});
      thumbs.append(h('div', { class: 'photo-thumb' }, [
        img,
        h('button', { class: 'photo-thumb-x', 'aria-label': 'Remove photo', onclick: () => { removePlacePhoto(id, k); renderThumbs(); } }, '✕'),
      ]));
    });
  };
  renderThumbs();
  return { thumbs, renderThumbs };
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

  // Your photos — take or add pictures of this place (kept on-device, in the backup).
  const { thumbs, renderThumbs } = placePhotoThumbs(p.id);
  card.append(h('div', { class: 'field' }, [h('label', {}, 'Your photos'), placePhotoControls(p.id, thumbs, renderThumbs)]));

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

  // Share just this place's review — your stars, words and photos — as a small web page.
  const shareBtn = h('button', { class: 'btn ghost block', style: 'margin-top:10px' }, '📤 Share my review');
  shareBtn.onclick = async () => {
    const dd = getPlaceData(p.id);
    if (!(dd.rating || (dd.review || '').trim() || (dd.note || '').trim() || (dd.photos || []).length)) {
      alert('Add a star rating, a review or a photo first, then share.'); return;
    }
    const lbl = shareBtn.textContent; shareBtn.disabled = true; shareBtn.textContent = 'Preparing…';
    try {
      const html = await exportOnePlaceReviewHtml(p.id, p.name);
      await shareOrDownload([{ blob: new Blob([html], { type: 'text/html' }), name: `my-review-${phraseSlug(p.name || 'place')}.html` }], `My review of ${p.name || 'this place'}`);
    } catch { alert('Could not build the review to share.'); }
    shareBtn.disabled = false; shareBtn.textContent = lbl;
  };
  card.append(shareBtn);

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
  const priceFresh = freshnessLine(data.verified, 'Prices', 365);
  if (priceFresh) wrap.append(priceFresh);
  wrap.append(sourcesNote(data.sources, data.verified));
  mount(wrap, '#prices');
}

// ---- TRANSPORT --------------------------------------------------------------
// Rent & ride, buy tickets (flights, trains, buses, boats) and find live schedules for a
// country. Guidance text is bundled and works offline; booking/timetable links open the
// authoritative source (needs internet) — we never bundle fabricated times or fares.
function getAroundSection(cc) {
  const g = GET_AROUND[cc];
  if (!g) return null;
  const chip = (b) => h('a', { class: 'chip', href: b.url, target: '_blank', rel: 'noopener' }, `${b.name} ↗`);
  const wrap = h('div', {});

  if (g.hail && g.hail.length) {
    const card = h('div', { class: 'card' }, [h('h2', { style: 'margin-top:0' }, '🚕 Ride-hailing apps')]);
    g.hail.forEach((a) => card.append(h('div', { class: 'transit-row' }, [h('strong', {}, a.name), h('div', { class: 'muted tiny' }, a.what)])));
    wrap.append(card);
  }

  const rentDet = h('details', { class: 'filters-collapse' }, [h('summary', {}, '🛵 Rent a scooter or car')]);
  if (g.scooter) {
    rentDet.append(h('h3', {}, '🛵 Scooter / motorbike'));
    rentDet.append(h('p', { class: 'muted' }, g.scooter.note));
    (g.scooter.tips || []).forEach((t) => rentDet.append(h('div', { class: 'list-note' }, t)));
    if (g.scooter.book) rentDet.append(h('div', { class: 'chips', style: 'margin-top:6px' }, g.scooter.book.map(chip)));
  }
  if (g.car) {
    rentDet.append(h('h3', {}, '🚗 Car'));
    rentDet.append(h('p', { class: 'muted' }, g.car.note));
    if (g.car.book) rentDet.append(h('div', { class: 'chips', style: 'margin-top:6px' }, g.car.book.map(chip)));
  }
  // Per-city price ranges so a traveller can budget before tapping out to a booking site.
  if (g.rentalPrices && g.rentalPrices.rows && g.rentalPrices.rows.length) {
    rentDet.append(h('h3', {}, '💰 What it costs (per day)'));
    const tbl = h('table', { class: 'rent-price' }, [
      h('thead', {}, h('tr', {}, [h('th', {}, 'City'), h('th', {}, '🛵 Scooter'), h('th', {}, '🚗 Car')])),
      h('tbody', {}, g.rentalPrices.rows.map((r) => h('tr', {}, [h('td', {}, r.city), h('td', {}, r.scooter || '—'), h('td', {}, r.car || '—')]))),
    ]);
    rentDet.append(tbl);
    if (g.rentalPrices.note) rentDet.append(h('p', { class: 'tiny muted', style: 'margin:4px 0 0' }, g.rentalPrices.note));
  }
  rentDet.append(h('p', { class: 'tiny muted', style: 'margin-top:8px' }, `Reminder: ${g.name} drives on the ${g.drivesOn}. An International Driving Permit plus your home licence keeps you legal and insured.`));
  wrap.append(rentDet);

  // City transit — a stored, offline line list for the metro cities (plus an honest note
  // where there is no rail). No live times bundled; the schedule links below cover those.
  if (g.cityTransit && g.cityTransit.length) {
    const ctDet = h('details', { class: 'filters-collapse' }, [h('summary', {}, '🚈 City transit (works offline)')]);
    g.cityTransit.forEach((c) => {
      ctDet.append(h('div', { class: 'transit-row' }, [
        h('strong', {}, c.city),
        (c.lines && c.lines.length) ? h('ul', { class: 'transit-lines' }, c.lines.map((ln) => h('li', {}, ln))) : null,
        c.note ? h('div', { class: 'muted tiny', style: 'margin-top:2px' }, c.note) : null,
      ]));
    });
    wrap.append(ctDet);
  }

  const t = g.tickets || {};
  const tkDet = h('details', { class: 'filters-collapse' }, [h('summary', {}, '🎫 Buy tickets — flights, trains, buses & boats')]);
  const tkRow = (label, arr) => { if (arr && arr.length) tkDet.append(h('div', { class: 'transit-row' }, [h('strong', {}, label), h('div', { class: 'chips', style: 'margin-top:4px' }, arr.map(chip))])); };
  tkRow('✈️ Flights', t.flight);
  tkRow('🚆 Trains', t.train);
  tkRow('🚌 Buses', t.bus);
  tkRow('⛴️ Boats & ferries', t.ferry);
  tkDet.append(h('p', { class: 'tiny muted', style: 'margin-top:6px' }, 'Prices and seats are live on these sites. For trains and the fast Laos railway, book a day or two ahead.'));
  wrap.append(tkDet);

  if (g.schedules && g.schedules.length) {
    const scDet = h('details', { class: 'filters-collapse' }, [h('summary', {}, '🕘 Timetables & live schedules')]);
    g.schedules.forEach((s) => scDet.append(h('div', { class: 'transit-row' }, [
      h('div', { class: 'row-between' }, [h('strong', {}, s.what), h('span', { class: 'muted tiny' }, s.org)]),
      s.note ? h('div', { class: 'muted tiny', style: 'margin:2px 0 4px' }, s.note) : null,
      h('a', { class: 'btn ghost block', style: 'margin-top:2px', href: s.url, target: '_blank', rel: 'noopener' }, `Open ${s.org} ↗`),
    ])));
    scDet.append(h('p', { class: 'tiny muted', style: 'margin-top:4px' }, 'Live times need internet; the guidance above works offline. Schedules shift with season and demand — always confirm on the day.'));
    wrap.append(scDet);
  }
  return wrap;
}

function transportScreen(countryId) {
  if (countryId) activeCountry = countryId;
  const wrap = h('div', { class: 'screen' });
  wrap.append(topbar('Getting around', '#home'));
  wrap.append(countryChips((id) => go(`#transport-${id}`)));
  wrap.append(h('button', { class: 'btn block', style: 'margin-bottom:12px', onclick: () => go('#route') }, '🧭 Plan a whole journey A → B (incl. borders)'));
  // Rent & ride, tickets and schedules — always shown, even where intercity routes are sparse.
  const ga = getAroundSection(activeCountry);
  if (ga) wrap.append(ga);

  const country = getCountry(activeCountry);
  const routes = country && country.routes;
  if (!routes) {
    wrap.append(h('p', { class: 'empty' }, `Intercity routes for ${country ? country.name : 'this country'} are not listed yet — use “Plan a whole journey” above, or open any place to see its nearest transport connections.`));
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

  // Places you have ticked off. This gives the near-me "done" control a home: the reset there
  // clears them all at once, whereas here you can open a place or un-mark just one.
  const doneIds = store.profile.prefs.doneSpots || [];
  if (doneIds.length) {
    const doneCard = h('div', { class: 'card' }, [h('h2', {}, `✓ Done · ${doneIds.length}`)]);
    doneCard.append(h('p', { class: 'muted', style: 'margin:2px 0 8px' }, 'Places you have ticked off — they no longer show in your near-me suggestions. Tap ↩ to put one back.'));
    doneIds.slice().reverse().forEach((id) => {
      const p = resolveItem(id);
      const name = p ? p.name : id;
      doneCard.append(h('div', { class: 'rn-item', style: 'margin-top:8px' }, [
        h('button', { class: 'rn-open', onclick: () => go(`#place-${id}`) }, h('span', { class: 'near-name' }, `✓ ${name}`)),
        h('div', { class: 'rn-actions' }, [
          h('button', { class: 'rn-act', title: 'Undo — show it in suggestions again', 'aria-label': `Un-mark ${name} as done`, onclick: () => { toggleSpotDone(id); render(); } }, '↩'),
        ]),
      ]));
    });
    wrap.append(doneCard);
  }

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
function poolCard(p, ref) {
  const km = (ref && p.coords) ? haversineKm(ref, p.coords) : null;
  const card = h('div', { class: 'card' }, [
    h('div', { class: 'row-between' }, [h('strong', {}, p.name), h('span', { class: 'cat-tag' }, POOL_TYPE_LABEL[p.type] || p.type)]),
    h('p', { class: 'tiny muted', style: 'margin:2px 0' }, km != null
      ? `📍 ${p.city} · ${fmtDistance(km)}${km <= 6 ? ` · ~${Math.max(1, Math.round((km / 4.8) * 60))} min walk` : ''} · ${compass(bearing(ref, p.coords))}`
      : p.city),
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
  return card;
}

function poolsScreen(arg) {
  let cc = arg || '';
  const wrap = h('div', { class: 'screen' });
  // No explicit country? Anchor to where the traveller is, not a global dump.
  if (!cc) { const f = focusSpot(); cc = (f.spot && f.spot.country) || ''; }
  const country = cc ? getCountry(cc) : null;
  const list = cc ? poolsForCountry(cc) : POOLS.slice();
  wrap.append(topbar(country ? `${country.name} pools` : 'Public pools', cc ? `#country-${cc}` : '#home'));
  wrap.append(h('p', { class: 'map-hint' }, 'Public swimming pools, hotel & resort day passes, water parks and managed natural swimming spots. Prices are ranges in local currency and change often — guidance only, confirm locally.'));
  if (!list.length) { wrap.append(h('p', { class: 'muted' }, 'No pools listed for this area yet.')); mount(wrap, '#home'); return; }

  // Lead with what is NEAR the traveller (GPS, else their focused city), so a pool
  // hundreds of km away never sits at the top. Only reorder on a real location signal;
  // otherwise keep the plain city grouping.
  const fix = getLastFix();
  const fs = focusSpot(cc || undefined);
  const spot = fs && fs.spot;
  const spotCoords = spot ? (spot.coords || (spot.lat != null ? { lat: spot.lat, lng: spot.lng } : null)) : null;
  const ref = fix || spotCoords;
  const refCity = spot ? spot.city : null;
  const hereFirst = !!ref && (!!fix || fs.source === 'gps' || fs.source === 'focus');

  if (hereFirst) {
    const withKm = list.filter((p) => p.coords).map((p) => ({ p, km: haversineKm(ref, p.coords) })).sort((a, b) => a.km - b.km);
    const near = withKm.slice(0, 6);
    const rest = withKm.slice(6).map((x) => x.p).concat(list.filter((p) => !p.coords));
    wrap.append(h('h2', { class: 'cat-title', style: 'margin:12px 2px 6px' }, refCity ? `🏊 Nearest to ${refCity}` : '🏊 Nearest to you'));
    near.forEach((x) => wrap.append(poolCard(x.p, ref)));
    if (rest.length) {
      wrap.append(h('details', { class: 'filters-collapse' }, [
        h('summary', {}, `More pools across ${country ? country.name : 'the region'} · ${rest.length}`),
        h('div', {}, rest.map((p) => poolCard(p, ref))),
      ]));
    }
  } else {
    const groups = {};
    list.forEach((p) => { (groups[p.city] = groups[p.city] || []).push(p); });
    Object.keys(groups).forEach((city) => {
      wrap.append(h('h2', { style: 'margin:16px 0 6px' }, city));
      groups[city].forEach((p) => wrap.append(poolCard(p, null)));
    });
  }
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

function addPinScreen(editId) {
  const existing = editId ? getPin(editId) : null;
  const editing = !!existing;
  const wrap = h('div', { class: 'screen' });
  wrap.append(topbar(editing ? 'Edit place' : 'Add a place', editing ? `#place-${editId}` : '#map'));
  if (editId && !existing) { wrap.append(h('p', { class: 'empty' }, 'Place not found.')); mount(wrap, '#map'); return; }
  const state = { coords: existing ? existing.coords : (pendingPinCoords || null), colls: new Set() };
  pendingPinCoords = null; // consume the tapped coordinate

  const card = h('div', { class: 'card' });
  const name = h('input', { type: 'text', placeholder: 'Place name (e.g. “Great noodle stall”)', value: existing ? existing.name : '' });
  const note = h('input', { type: 'text', placeholder: 'A note (optional)', value: existing ? (existing.note || '') : '' });
  card.append(field('Name', name), field('Note', note));

  // What kind of place — single-select, stored as the pin's first tag so it reads as a type
  // (like a category on a map) and can colour/group it later.
  const PLACE_KINDS = [['food', '🍜 Food & drink'], ['stay', '🛏 Place to stay'], ['culture', '🏛 Culture'], ['nature', '🌿 Nature'], ['nightlife', '🌃 Nightlife'], ['shopping', '🛍 Shopping'], ['other', '📌 Other']];
  let selKind = (existing && existing.tags && existing.tags[0]) || 'other';
  const kindChips = h('div', { class: 'chips' }, PLACE_KINDS.map(([id, lbl]) =>
    h('button', { class: 'chip', 'aria-pressed': selKind === id ? 'true' : 'false', dataset: { k: id },
      onclick: (e) => { selKind = id; kindChips.querySelectorAll('.chip').forEach((c) => c.setAttribute('aria-pressed', c.dataset.k === id ? 'true' : 'false')); } }, lbl)));
  card.append(field('What kind of place?', kindChips));

  const coordOut = h('p', { class: 'muted' }, state.coords
    ? `Location: ${state.coords.lat.toFixed(5)}, ${state.coords.lng.toFixed(5)}`
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

  // Collections + "my stay" are creation-time extras; when editing, name/note/location
  // are the editable fields (collections stay managed from the Save sheet).
  const stayChk = h('input', { type: 'checkbox' });
  if (!editing) {
    if (store.collections.length) {
      card.append(field('Add to collections', h('div', { class: 'chips' },
        store.collections.map((c) => collToggleChip(c.name, c.emoji, () => toggleSet(state.colls, c.id))))));
    } else {
      card.append(field('Add to collections', h('p', { class: 'muted' }, 'You have no collections yet. Save the pin, then tap “＋ Save” on it to file it under a theme.')));
    }
    card.append(h('label', { style: 'display:flex;align-items:center;gap:8px;cursor:pointer;margin-top:8px' },
      [stayChk, h('span', {}, '🏠 Also set this as my accommodation (My stay)')]));
  }
  wrap.append(card);

  wrap.append(h('button', { class: 'btn block', onclick: () => {
    if (!name.value.trim()) { alert('Give the place a name.'); return; }
    if (editing) {
      updatePin(editId, { name: name.value.trim(), note: note.value.trim(), coords: state.coords, tags: [selKind] });
      go(`#place-${editId}`);
      return;
    }
    const pin = addPin({ name: name.value.trim(), note: note.value.trim(), tags: [selKind], coords: state.coords });
    state.colls.forEach((cid) => togglePlaceInCollection(cid, pin.id));
    if (stayChk.checked && state.coords) setMyStay({ name: name.value.trim(), coords: state.coords });
    go(`#place-${pin.id}`);   // open the new place so photos, a rating and a review are one tap away
  } }, editing ? 'Save changes' : 'Save place'));
  wrap.append(h('p', { class: 'tiny muted', style: 'margin:8px 2px' }, 'After saving, open the place to add your photos, a star rating and a review — everything stays on your device.'));
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
  if (arg === 'add') return journalFormScreen();
  if (arg.startsWith('edit-')) return journalFormScreen(arg.slice(5));
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
    h('div', { class: 'stamp' }, [h('span', {}, stamp), loc ? h('span', { class: 'stamp-loc' }, `📍 ${loc}`) : null, e.weather ? h('span', { class: 'stamp-loc' }, e.weather) : null]),
    h('h2', { class: 'entry-title' }, e.title),
    h('div', { class: 'entry-body' }, (e.text || '').split('\n').map((p) => h('p', {}, p))),
  ]);
  // All photos on this entry, newest additions after older, just below the stamp.
  entryPhotoKeys(e).forEach((k, i) => {
    const img = h('img', { class: 'entry-photo', alt: 'Journal photo' });
    page.insertBefore(img, page.children[1 + i]);
    getBlob(k).then((b) => { if (b) img.src = URL.createObjectURL(b); }).catch(() => {});
  });
  wrap.append(page);
  wrap.append(h('button', { class: 'btn block', style: 'margin-top:14px', onclick: () => go(`#journal-edit-${e.id}`) }, '✎ Edit this entry'));
  wrap.append(h('div', { class: 'row-between', style: 'margin-top:10px' }, [
    h('button', { class: 'btn ghost', disabled: idx <= 0 ? '' : null, onclick: () => idx > 0 && go(`#journal-entry-${entries[idx - 1].id}`) }, '‹ Prev'),
    h('button', { class: 'btn ghost', onclick: () => { if (confirm('Delete this entry?')) { entryPhotoKeys(e).forEach((k) => delBlob(k)); deleteJournalEntry(e.id); go('#journal-open'); } } }, 'Delete'),
    h('button', { class: 'btn ghost', disabled: idx >= entries.length - 1 ? '' : null, onclick: () => idx < entries.length - 1 && go(`#journal-entry-${entries[idx + 1].id}`) }, 'Next ›'),
  ]));
  mount(wrap, '#home');
}

// ---- POST-TRAVEL SCRAPBOOK --------------------------------------------------
// A keepsake assembled automatically from what the traveller recorded on the road:
// journal entries + photos, places they rated highly, the itinerary and the budget.
// Nothing new is stored — it is a printable/shareable VIEW over the existing data,
// which is exactly the "documentation carries over to post-travel" the trip needs.
function sbFmtDate(d) {
  if (!d) return '';
  const dt = new Date(d);
  if (isNaN(dt)) return d;
  return dt.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}
function sbDateRange(a, b) {
  if (!a && !b) return '';
  if (a && b && a !== b) return `${sbFmtDate(a)} – ${sbFmtDate(b)}`;
  return sbFmtDate(a || b);
}
function sbStatPill(n, label) {
  return h('span', { class: 'scrap-stat' }, [h('b', {}, String(n)), ` ${label}`]);
}
function scrapbookText(entries, loved, stops, budget, range) {
  const L = [];
  L.push(`${store.profile.name ? store.profile.name + '’s' : 'My'} journey${range ? ' · ' + range : ''}`);
  if (stops.length) L.push('\nWhere I went: ' + stops.map((s) => s.city).filter(Boolean).join(', '));
  if (loved.length) L.push('\nPlaces I loved:\n' + loved.slice(0, 20).map(({ p, d }) => `  • ${p.name} ${'★'.repeat(Math.round(d.rating || 0))}`).join('\n'));
  if (entries.length) L.push('\nJournal:\n' + entries.map((e) => `  ${sbFmtDate(e.date || String(e.ts || '').slice(0, 10))} — ${e.title || 'Untitled'}`).join('\n'));
  if (budget.length) {
    const t = {}; budget.forEach((b) => { const c = b.currency || '?'; t[c] = (t[c] || 0) + (parseFloat(b.amount) || 0); });
    L.push('\nSpent: ' + Object.entries(t).map(([c, v]) => `${Math.round(v).toLocaleString()} ${c}`).join(', '));
  }
  L.push('\n— made with Mekonging (www.mekonging.com)');
  return L.join('\n');
}

// The scrapbook's photo album: the pictures the user adds directly + every journal photo,
// in one editable gallery. Album photos are tappable to caption or remove; journal photos
// open their entry. Blobs live in IndexedDB; metadata + captions in the store (backup-safe).
function scrapAlbumSection() {
  const album = getAlbum();
  const journalPhotos = [];
  (store.journal.entries || []).forEach((e) => entryPhotoKeys(e).forEach((k) => journalPhotos.push({ key: k, entry: e })));
  const placePhotos = [];
  Object.keys(store.placeData || {}).forEach((id) => (store.placeData[id].photos || []).forEach((k) => placePhotos.push({ key: k, placeId: id })));
  const card = h('div', { class: 'card' }, [h('h3', { class: 'scrap-h' }, '📸 Photo album')]);
  const inp = h('input', { type: 'file', accept: 'image/*', multiple: '', style: 'display:none', onchange: async (ev) => {
    const files = ev.target.files ? [...ev.target.files] : [];
    let n = 0;
    for (const f of files) { const nk = `album-${Date.now()}-${n++}-${Math.floor(Math.random() * 1e6)}`; try { await putBlob(nk, f); addAlbumPhoto({ key: nk }); } catch { /* skip */ } }
    ev.target.value = ''; render();
  } });
  card.append(h('div', { class: 'chips' }, [h('button', { class: 'chip', onclick: () => inp.click() }, '＋ Add pictures to album'), inp]));
  if (!album.length && !journalPhotos.length && !placePhotos.length) {
    card.append(h('p', { class: 'muted', style: 'margin:6px 0 0' }, 'Add pictures here, or add photos to your journal entries and the places you rate — they all gather in this album.'));
    return card;
  }
  const grid = h('div', { class: 'photo-gallery' });
  // Album photos first (most recent first), each editable.
  album.slice().reverse().forEach((ph) => {
    const img = h('img', { alt: ph.caption || '', loading: 'lazy' });
    getBlob(ph.key).then((b) => { if (b) img.src = URL.createObjectURL(b); }).catch(() => {});
    grid.append(h('button', { class: 'gallery-cell', onclick: () => {
      const cap = prompt('Caption for this photo (leave blank to keep). Type DELETE to remove it.', ph.caption || '');
      if (cap === null) return;
      if (cap.trim().toUpperCase() === 'DELETE') { delBlob(ph.key); deleteAlbumPhoto(ph.id); render(); return; }
      updateAlbumPhoto(ph.id, { caption: cap }); render();
    } }, [img, ph.caption ? h('span', { class: 'gallery-cap' }, ph.caption) : null]));
  });
  // Journal photos (most recent first) — tap opens the entry.
  journalPhotos.slice().reverse().forEach((jp) => {
    const img = h('img', { alt: '', loading: 'lazy' });
    getBlob(jp.key).then((b) => { if (b) img.src = URL.createObjectURL(b); }).catch(() => {});
    grid.append(h('button', { class: 'gallery-cell', onclick: () => go(`#journal-entry-${jp.entry.id}`) }, [img, h('span', { class: 'gallery-cap' }, `📔 ${jp.entry.title || 'Journal'}`)]));
  });
  // Place photos (most recent first) — tap opens the place they belong to.
  placePhotos.slice().reverse().forEach((pp) => {
    const img = h('img', { alt: '', loading: 'lazy' });
    getBlob(pp.key).then((b) => { if (b) img.src = URL.createObjectURL(b); }).catch(() => {});
    const pl = getPlace(pp.placeId) || getPin(pp.placeId);
    grid.append(h('button', { class: 'gallery-cell', onclick: () => go(`#place-${pp.placeId}`) }, [img, h('span', { class: 'gallery-cap' }, `📍 ${pl ? pl.name : 'Place'}`)]));
  });
  card.append(grid);
  return card;
}

function scrapbookScreen() {
  const wrap = h('div', { class: 'screen scrapbook' });
  wrap.append(topbar('Trip scrapbook', '#home'));

  const entries = (store.journal.entries || []).slice()
    .sort((a, b) => String(a.ts || a.date || '').localeCompare(String(b.ts || b.date || '')));
  const stops = store.trip.stops || [];
  const budget = store.trip.budgetLog || [];
  const loved = Object.entries(store.placeData || {})
    .filter(([, d]) => d && d.rating >= 4)
    .map(([id, d]) => ({ p: getPlace(id) || getPin(id), d }))
    .filter((x) => x.p);

  if (!entries.length && !stops.length && !budget.length && !loved.length && !getAlbum().length) {
    wrap.append(h('div', { class: 'card empty-state' }, [
      h('h2', { style: 'margin-top:0' }, 'Your scrapbook builds itself'),
      h('p', { class: 'muted' }, 'It is a photo album of your trip — the pictures you add here plus every photo in your journal — alongside the places you rate, your itinerary and budget. Add pictures below, or start a journal entry.'),
      h('div', { class: 'chips' }, [
        h('button', { class: 'chip', onclick: () => go('#journal-add') }, [chipIcon('book'), 'Write a journal entry']),
        h('button', { class: 'chip', onclick: () => go('#trip') }, [chipIcon('suitcase'), 'Plan your trip']),
      ]),
    ]));
    wrap.append(scrapAlbumSection()); // still let them add pictures straight away
    mount(wrap, '#home'); return;
  }

  const allDates = entries.map((e) => e.date || String(e.ts || '').slice(0, 10)).filter(Boolean)
    .concat(stops.map((s) => s.fromDate).filter(Boolean)).sort();
  const range = allDates.length ? sbDateRange(allDates[0], allDates[allDates.length - 1]) : '';

  wrap.append(h('div', { class: 'card scrap-cover' }, [
    h('h2', { style: 'margin:0' }, store.profile.name ? `${store.profile.name}’s journey` : 'My journey'),
    range ? h('p', { class: 'muted', style: 'margin:4px 0 8px' }, range) : null,
    h('div', { class: 'scrap-stats' }, [
      sbStatPill(entries.length, entries.length === 1 ? 'journal entry' : 'journal entries'),
      sbStatPill(loved.length, 'places loved'),
      sbStatPill(stops.length, stops.length === 1 ? 'stop' : 'stops'),
    ]),
  ]));

  const copyBtn = h('button', { class: 'chip', onclick: async () => {
    try { await navigator.clipboard.writeText(scrapbookText(entries, loved, stops, budget, range)); copyBtn.replaceChildren(document.createTextNode('✓ Copied')); }
    catch { copyBtn.replaceChildren(document.createTextNode('Copy failed')); }
    setTimeout(() => copyBtn.replaceChildren(chipIcon('users'), document.createTextNode('Copy summary')), 1600);
  } }, [chipIcon('users'), 'Copy summary']);
  wrap.append(h('div', { class: 'chips scrap-actions' }, [
    h('button', { class: 'chip', onclick: () => window.print() }, [chipIcon('book'), 'Print / Save as PDF']),
    copyBtn,
  ]));

  // The album — the pictures the user adds here + every journal photo, in one gallery.
  wrap.append(scrapAlbumSection());

  if (stops.length) {
    const s = h('div', { class: 'card' }, [h('h3', { class: 'scrap-h' }, '🧳 Where you went')]);
    stops.forEach((st) => s.append(h('div', { class: 'scrap-row' }, [
      h('strong', {}, st.city || 'Stop'),
      h('span', { class: 'muted' }, [st.country ? (getCountry(st.country) || {}).name : '', sbDateRange(st.fromDate, st.toDate)].filter(Boolean).join(' · ')),
    ])));
    wrap.append(s);
  }

  if (entries.length) {
    wrap.append(h('h3', { class: 'scrap-section' }, '📖 Your journal'));
    entries.forEach((e) => {
      const card = h('div', { class: 'card scrap-entry' }, [
        h('div', { class: 'scrap-date' }, [sbFmtDate(e.date || String(e.ts || '').slice(0, 10)), e.place ? '📍 ' + e.place : ''].filter(Boolean).join(' · ')),
        h('h3', { style: 'margin:2px 0' }, e.title || 'Untitled'),
        e.text ? h('div', { class: 'scrap-text' }, (e.text || '').split('\n').map((p) => h('p', {}, p))) : null,
      ]);
      entryPhotoKeys(e).forEach((k, i) => {
        const img = h('img', { class: 'scrap-photo', alt: 'Journal photo', loading: 'lazy' });
        card.insertBefore(img, card.children[1 + i]);
        getBlob(k).then((b) => { if (b) img.src = URL.createObjectURL(b); }).catch(() => {});
      });
      wrap.append(card);
    });
  }

  if (loved.length) {
    loved.sort((a, b) => (b.d.rating || 0) - (a.d.rating || 0));
    const pv = h('div', { class: 'card' }, [h('h3', { class: 'scrap-h' }, '⭐ Places you loved')]);
    loved.slice(0, 30).forEach(({ p, d }) => pv.append(h('button', { class: 'scrap-row scrap-link', onclick: () => go(`#place-${p.id}`) }, [
      h('strong', {}, p.name),
      h('span', { class: 'muted' }, `${'★'.repeat(Math.round(d.rating))}${d.review ? ' · “' + d.review.slice(0, 60) + '”' : ''}`),
    ])));
    wrap.append(pv);
  }

  if (budget.length) {
    const t = {}; budget.forEach((b) => { const c = b.currency || '?'; t[c] = (t[c] || 0) + (parseFloat(b.amount) || 0); });
    wrap.append(h('div', { class: 'card' }, [
      h('h3', { class: 'scrap-h' }, '💰 What you spent'),
      ...Object.entries(t).map(([c, v]) => h('div', { class: 'scrap-row' }, [h('strong', {}, c), h('span', {}, Math.round(v).toLocaleString())])),
    ]));
  }

  wrap.append(h('p', { class: 'disclaimer' }, 'Built from your journal, ratings, trip and budget — all stored on this device. Print to keep or save as PDF; nothing is uploaded.'));
  mount(wrap, '#home');
}

// New OR edit an entry. editId set => editing an existing entry (prefilled, saved back).
// A short weather snapshot string from the cached forecast nearest to `coords` (or the
// user's focus), stamped onto a journal entry at write time. Empty if nothing is cached
// (offline with no prior refresh) — the entry still saves.
function journalWeatherString(coords) {
  try {
    const fix = coords || getLastFix();
    const near = fix ? nearestSpotGlobal(fix) : null;
    const spot = near ? near.spot : focusSpot().spot;
    if (!spot) return '';
    const rec = getCachedWeather(spotKey(spot));
    if (!rec) return '';
    const cur = rec.current || {};
    const today = (rec.daily && rec.daily[0]) || {};
    const code = cur.code != null ? cur.code : today.code;
    const [lbl, emo] = wmo(code != null ? code : 0);
    const t = cur.temp != null ? cur.temp : today.tmax;
    const hum = cur.humidity != null ? cur.humidity : null;
    const parts = [];
    if (emo) parts.push(emo);
    if (lbl) parts.push(lbl);
    if (t != null) parts.push(fmtTemp(t));
    if (hum != null) parts.push(`humidity ${hum}%`);
    let s = parts.join(' · ');
    if (spot.city) s += ` (${spot.city})`;
    return s.slice(0, 80);
  } catch { return ''; }
}

// A journal entry's photo blob keys — the multi-photo photoKeys[] if present, else the
// legacy single photoKey. Tolerates a null entry (new entry).
function entryPhotoKeys(e) {
  if (!e) return [];
  if (Array.isArray(e.photoKeys) && e.photoKeys.length) return e.photoKeys.filter(Boolean);
  return e.photoKey ? [e.photoKey] : [];
}

function journalFormScreen(editId) {
  const existing = editId ? journalEntries().find((e) => e.id === editId) : null;
  const editing = !!existing;
  const wrap = h('div', { class: 'screen' });
  wrap.append(topbar(editing ? 'Edit entry' : 'New entry', editing ? `#journal-entry-${editId}` : '#journal-open'));
  if (editId && !existing) { wrap.append(h('p', { class: 'empty' }, 'Entry not found.')); mount(wrap, '#home'); return; }

  // New entries auto-stamp the current location (last GPS fix) and weather; both stay
  // editable. Existing entries keep whatever was saved.
  const st = { coords: existing ? existing.coords : (getLastFix() || null) };
  const title = h('input', { 'aria-label': 'Memory title', type: 'text', placeholder: 'A title for this memory' });
  const text = h('textarea', { 'aria-label': 'What happened', class: 'ta', placeholder: 'What happened? What did you see, eat, feel?' });
  const place = h('input', { 'aria-label': 'Place', type: 'text', placeholder: 'Place (e.g. Hoi An old town)' });
  const weather = h('input', { 'aria-label': 'Weather', type: 'text', placeholder: 'Weather (auto — editable)' });
  if (existing) {
    title.value = existing.title || ''; text.value = existing.text || ''; place.value = existing.place || '';
    weather.value = existing.weather || '';
  } else {
    // Prefill the place with where the traveller is, and the weather from the cache.
    try { const fs = focusSpot(); if (fs && fs.spot && fs.spot.city) place.value = fs.spot.city; } catch { /* none */ }
    weather.value = journalWeatherString(st.coords);
  }

  // Photos: MULTIPLE per entry. Take new ones and/or upload several; each is removable.
  // st.photos = [{ key?, file?, url }] — key = an already-saved blob, file = a new pick.
  st.photos = [];
  const thumbs = h('div', { class: 'photo-thumbs' });
  const renderThumbs = () => {
    thumbs.innerHTML = '';
    if (!st.photos.length) { thumbs.append(h('p', { class: 'muted', style: 'margin:0' }, 'No photos yet.')); return; }
    st.photos.forEach((p, i) => {
      const img = h('img', { alt: '', loading: 'lazy' });
      if (p.url) img.src = p.url;
      thumbs.append(h('div', { class: 'photo-thumb' }, [
        img,
        h('button', { class: 'photo-thumb-x', 'aria-label': 'Remove photo', onclick: () => { st.photos.splice(i, 1); renderThumbs(); } }, '✕'),
      ]));
    });
  };
  entryPhotoKeys(existing).forEach((k) => { const o = { key: k, url: null }; st.photos.push(o); getBlob(k).then((b) => { if (b) { o.url = URL.createObjectURL(b); renderThumbs(); } }).catch(() => {}); });
  const camIn = h('input', { type: 'file', accept: 'image/*', capture: 'environment', style: 'display:none' });
  const libIn = h('input', { type: 'file', accept: 'image/*', multiple: '', style: 'display:none' });
  const addFiles = (inp) => { (inp.files ? [...inp.files] : []).forEach((f) => st.photos.push({ file: f, url: URL.createObjectURL(f) })); inp.value = ''; renderThumbs(); };
  camIn.onchange = () => addFiles(camIn);
  libIn.onchange = () => addFiles(libIn);
  renderThumbs();

  const locOut = h('p', { class: 'muted' }, st.coords
    ? `Stamped at ${st.coords.lat.toFixed(4)}, ${st.coords.lng.toFixed(4)}`
    : 'Entry is stamped with the current date and time automatically.');
  const card = h('div', { class: 'card' }, [
    field('Title', title), field('Your entry', text),
    field('Place (editable)', place),
    field('Weather (auto — editable)', weather),
    field('Location', h('div', {}, [
      h('button', { class: 'btn ghost', onclick: () => {
        locOut.textContent = 'Locating…';
        if (!navigator.geolocation) { locOut.textContent = 'Geolocation unavailable.'; return; }
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            st.coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
            locOut.textContent = `Stamped at ${st.coords.lat.toFixed(4)}, ${st.coords.lng.toFixed(4)}`;
            const w = journalWeatherString(st.coords); if (w) weather.value = w; // refresh the snapshot
          },
          (err) => { locOut.textContent = `No location: ${err.message}`; }, { enableHighAccuracy: true, timeout: 10000 });
      } }, st.coords ? '📍 Update location' : '📍 Stamp my location'),
      locOut,
    ])),
    field('Photos', h('div', {}, [
      thumbs,
      h('div', { class: 'chips' }, [
        h('button', { class: 'chip', onclick: () => camIn.click() }, '📷 Take a photo'),
        h('button', { class: 'chip', onclick: () => libIn.click() }, '🖼 Add pictures'),
      ]),
      camIn, libIn,
    ])),
  ]);
  wrap.append(card);
  wrap.append(h('button', { class: 'btn block', onclick: async () => {
    if (!title.value.trim() && !text.value.trim()) { alert('Write something first.'); return; }
    const origKeys = entryPhotoKeys(existing);
    const finalKeys = [];
    let n = 0;
    for (const p of st.photos) {
      if (p.key) { finalKeys.push(p.key); continue; }
      if (p.file) { const nk = `jrphoto-${Date.now()}-${n++}-${Math.floor(Math.random() * 1e6)}`; try { await putBlob(nk, p.file); finalKeys.push(nk); } catch { /* skip this one */ } }
    }
    origKeys.filter((k) => !finalKeys.includes(k)).forEach((k) => delBlob(k)); // free removed blobs
    const fields = { title: title.value.trim() || 'Untitled', text: text.value, place: place.value.trim(), coords: st.coords, photoKeys: finalKeys, weather: weather.value.trim() };
    if (editing) { updateJournalEntry(editId, fields); go(`#journal-entry-${editId}`); }
    else { addJournalEntry(fields); go('#journal-open'); }
  } }, editing ? 'Save changes' : 'Save to journal'));
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
const CAL_ICON = { stay: '🛏', meal: '🍽', activity: '🎟', plan: '🗓', laundry: '🧺', appointment: '📌', festival: '🎉' };
function calendarDispatch(arg) {
  if (arg === 'add') return calendarFormScreen();
  if (arg && arg.startsWith('edit-')) return calendarFormScreen(arg.slice(5));
  // #calendar-add-YYYY-MM-DD or #calendar-add-YYYY-MM-DD-<type> — open the editable form
  // prefilled to that day (and type, e.g. laundry / appointment) from the quick-add row.
  if (arg && arg.startsWith('add-')) {
    const r = arg.slice(4);
    const date = /^\d{4}-\d{2}-\d{2}/.test(r) ? r.slice(0, 10) : '';
    const type = r.length > 11 ? r.slice(11) : '';
    return calendarFormScreen(null, { date, type });
  }
  return calendarScreen();
}

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

// ---- Month-grid calendar with toggleable layers ----------------------------
let calView = null;      // { y, m } month being viewed
let calSelDate = null;   // 'YYYY-MM-DD' selected day
const CAL_LAYERS = [
  { key: 'holidays', label: 'Holidays & festivals', color: '#E0A526' },
  { key: 'religious', label: 'Religious', color: '#8A5CC0' },
  { key: 'other', label: 'Other countries', color: '#2C7DA0' },
  { key: 'journal', label: 'Journal & photos', color: '#2E8B57' },
  { key: 'mine', label: 'My plans', color: '#C25E3A' },
];
function calLayerState() {
  return { holidays: true, religious: true, other: false, journal: true, mine: true, ...(store.profile.prefs.calLayers || {}) };
}
function isReligiousEvent(e) {
  const s = `${e.name || ''} ${e.blurb || ''} ${e.localName || ''}`.toLowerCase();
  return /buddh|monk|temple|vesak|visakh|makha|asalha|asanha|lent|phansa|christmas|easter|eid|ramadan|hari raya|diwali|hindu|catholic|christ|islam|muslim|vu lan|pchum ben|kathin|\bboun\b/.test(s);
}
function calYmd(dt) { return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`; }
function calEachDate(start, end, fn) {
  const s = new Date(start + 'T00:00:00'); const e = new Date((end || start) + 'T00:00:00');
  if (isNaN(s.getTime())) return;
  for (let d = new Date(s); d <= e; d.setDate(d.getDate() + 1)) fn(calYmd(d));
}
function calDot(color) { return h('span', { class: 'cal-dot-inline', style: `background:${color}` }); }
function calMonthGrid(y, m, byDate, sel, onSelect) {
  const first = new Date(y, m, 1);
  const startDow = (first.getDay() + 6) % 7;   // Monday = 0
  const days = new Date(y, m + 1, 0).getDate();
  const today = calYmd(new Date());
  const cells = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((w) => h('div', { class: 'cal-wk' }, w));
  for (let i = 0; i < startDow; i++) cells.push(h('div', { class: 'cal-cell cal-empty' }));
  for (let d = 1; d <= days; d++) {
    const ds = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const marks = byDate[ds] || [];
    const colors = [...new Set(marks.map((mk) => mk.color))].slice(0, 4);
    cells.push(h('button', {
      class: 'cal-cell' + (ds === today ? ' cal-today' : '') + (ds === sel ? ' cal-sel' : '') + (marks.length ? ' cal-has' : ''),
      onclick: () => onSelect(ds),
    }, [
      h('span', { class: 'cal-day' }, String(d)),
      h('div', { class: 'cal-dots' }, colors.map((c) => h('span', { class: 'cal-dot', style: `background:${c}` }))),
    ]));
  }
  return h('div', { class: 'cal-grid' }, cells);
}

function calendarScreen() {
  const wrap = h('div', { class: 'screen' });
  wrap.append(topbar('Travel calendar', '#home'));
  const L = calLayerState();
  const now = new Date();
  if (!calView) calView = { y: now.getFullYear(), m: now.getMonth() };
  const focusCC = focusSpot().spot.country;

  // Private personal layers (cycle/mood/intimacy/pregnancy) only merge onto the calendar
  // when the user has turned them on AND (if a PIN is set) unlocked — so nothing private
  // ever shows on a shared screen by default.
  const pOn = personal.isEnabled();
  const pUnlocked = pOn && personal.isUnlocked();
  const PL = pUnlocked ? personal.getLayers() : {};

  // Build day-markers from every enabled layer.
  const byDate = {};
  const push = (ds, mk) => { (byDate[ds] = byDate[ds] || []).push(mk); };
  const ccList = L.other ? COUNTRIES.map((c) => c.id) : [focusCC];
  ccList.forEach((cc) => (getEvents(cc) || []).forEach((e) => {
    if (!e.start) return;
    const other = cc !== focusCC;
    const rel = isReligiousEvent(e);
    let show, color;
    if (other) { show = L.other; color = '#2C7DA0'; }
    else if (rel) { show = L.religious; color = '#8A5CC0'; }
    else { show = L.holidays; color = '#E0A526'; }
    if (!show) return;
    calEachDate(e.start, e.end, (ds) => push(ds, { color, kind: 'event', ref: e, cc }));
  }));
  if (L.journal) (store.journal.entries || []).forEach((j) => { if (j.date) push(j.date, { color: '#2E8B57', kind: 'journal', ref: j }); });
  if (L.mine) (store.calendar.items || []).forEach((it) => { if (it.date) push(it.date, { color: '#C25E3A', kind: 'item', ref: it }); });
  // Private health dots (grid only — details/logging live in the private day card below).
  if (pUnlocked) {
    const y = calView.y, m = calView.m, dim = new Date(y, m + 1, 0).getDate();
    for (let d = 1; d <= dim; d++) {
      const ds = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const g = personal.dayGlyphs(ds);
      if (PL.period && g.period) push(ds, { color: '#C0405B', kind: 'health' });
      if (PL.intimacy && g.encounters) push(ds, { color: '#D6336C', kind: 'health' });
      if (PL.mood && g.mood != null) push(ds, { color: '#3AA0A0', kind: 'health' });
    }
    const preg = personal.getPregnancy();
    if (PL.pregnancy && preg && preg.active && preg.edd && preg.edd.startsWith(`${y}-${String(m + 1).padStart(2, '0')}`)) {
      push(preg.edd, { color: '#B5179E', kind: 'health' });
    }
  }

  // Pregnancy banner (private) — an at-a-glance week/trimester read-out.
  if (pUnlocked && PL.pregnancy) {
    const ps = personal.pregnancyStatus();
    if (ps) wrap.append(h('div', { class: 'card preg-banner' }, [
      h('strong', {}, `🤰 Week ${ps.weeks}${ps.days ? ' +' + ps.days + 'd' : ''} · trimester ${ps.trimester}`),
      h('p', { class: 'muted', style: 'margin:4px 0 0' }, `${ps.dueInDays != null && ps.dueInDays >= 0 ? `~${ps.dueInDays} day${ps.dueInDays === 1 ? '' : 's'} to your due date (${ps.edd}). ` : `Due date ${ps.edd}. `}${ps.milestone}`),
      h('p', { class: 'disclaimer', style: 'margin:6px 0 0' }, 'Informational estimate from your dates — not medical advice. Every pregnancy differs; follow your midwife or doctor.'),
    ]));
  }

  // Month header + navigation.
  const monthName = new Date(calView.y, calView.m, 1).toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
  const shift = (delta) => { let m = calView.m + delta, y = calView.y; if (m < 0) { m = 11; y--; } if (m > 11) { m = 0; y++; } calView = { y, m }; render(); };
  wrap.append(h('div', { class: 'cal-head' }, [
    h('button', { class: 'chip', 'aria-label': 'Previous month', onclick: () => shift(-1) }, '‹'),
    h('strong', {}, monthName),
    h('button', { class: 'chip', 'aria-label': 'Next month', onclick: () => shift(1) }, '›'),
    h('button', { class: 'chip', onclick: () => { calView = { y: now.getFullYear(), m: now.getMonth() }; calSelDate = calYmd(now); render(); } }, 'Today'),
  ]));

  // Keep the selected day within the viewed month.
  const monthPrefix = `${calView.y}-${String(calView.m + 1).padStart(2, '0')}`;
  if (!calSelDate || !calSelDate.startsWith(monthPrefix)) {
    calSelDate = (calView.y === now.getFullYear() && calView.m === now.getMonth()) ? calYmd(now) : `${monthPrefix}-01`;
  }
  wrap.append(calMonthGrid(calView.y, calView.m, byDate, calSelDate, (ds) => { calSelDate = ds; render(); }));

  // Quick-add row: the common entries in one tap (all open the editable form, prefilled to
  // the selected day + type, so every entry stays fully editable afterwards).
  wrap.append(h('div', { class: 'chips', style: 'margin:8px 0 2px' }, [
    h('button', { class: 'chip', onclick: () => go(`#calendar-add-${calSelDate}`) }, '＋ Plan / booking'),
    h('button', { class: 'chip', onclick: () => go(`#calendar-add-${calSelDate}-laundry`) }, '🧺 Laundry day'),
    h('button', { class: 'chip', onclick: () => go(`#calendar-add-${calSelDate}-appointment`) }, '📌 Appointment'),
  ]));

  // Selected day panel.
  wrap.append(h('h2', { class: 'cat-title', style: 'margin-top:14px' }, calDateLabel(calSelDate)));
  const dayMarks = (byDate[calSelDate] || []).filter((m) => ['event', 'journal', 'item'].includes(m.kind));
  if (!dayMarks.length) wrap.append(h('p', { class: 'muted' }, 'Nothing planned on this day. Use the quick-add above, or “Add” below.'));
  dayMarks.forEach((mk) => {
    if (mk.kind === 'event') {
      const e = mk.ref; const ec = getCountry(mk.cc);
      wrap.append(h('div', { class: 'card' }, [
        h('div', { class: 'row-between' }, [h('strong', {}, [calDot(mk.color), ' ' + e.name]), ec ? h('span', { class: 'cat-tag' }, ec.flag) : null]),
        e.blurb ? h('p', { class: 'muted', style: 'margin:4px 0' }, e.blurb) : null,
        h('div', { class: 'row-between', style: 'margin-top:6px' }, [
          h('button', { class: 'btn ghost', onclick: () => go(`#event-${e.id}`) }, 'Details'),
          h('button', { class: 'btn ghost', onclick: (ev) => addEventToCalendar(e, ev.currentTarget) }, 'Add to my plans'),
        ]),
      ]));
    } else if (mk.kind === 'journal') {
      const j = mk.ref;
      const card = h('div', { class: 'card' }, [
        h('strong', {}, [calDot(mk.color), ` ${j.photoKey ? '📷 ' : ''}${j.title || 'Journal entry'}`]),
        j.text ? h('p', { class: 'muted', style: 'margin:4px 0' }, j.text.slice(0, 140) + (j.text.length > 140 ? '…' : '')) : null,
        h('button', { class: 'btn ghost', style: 'margin-top:4px', onclick: () => go(`#journal-entry-${j.id}`) }, 'Open entry'),
      ]);
      // Show the entry's photo inline, loaded from IndexedDB, so the day reads like a diary.
      if (j.photoKey) {
        const img = h('img', { class: 'cal-thumb', alt: '', loading: 'lazy', onclick: () => go(`#journal-entry-${j.id}`) });
        card.insertBefore(img, card.children[1]);
        getBlob(j.photoKey).then((b) => { if (b) img.src = URL.createObjectURL(b); }).catch(() => {});
      }
      wrap.append(card);
    } else {
      const it = mk.ref;
      wrap.append(h('div', { class: 'card' }, [
        h('div', { class: 'row-between' }, [
          h('strong', {}, [calDot(mk.color), ` ${it.time ? it.time + ' · ' : ''}${CAL_ICON[it.type] || '•'} ${it.title}`]),
          h('span', { class: 'fair' }, it.cost ? `${it.cost} ${it.currency}` : ''),
        ]),
        it.place ? h('p', { class: 'muted' }, it.place) : null,
        it.rating ? h('div', { class: 'stars-static' }, starsStr(it.rating)) : null,
        it.note ? h('p', {}, it.note) : null,
        h('div', { class: 'row-between', style: 'margin-top:8px' }, [
          h('button', { class: 'btn ghost', onclick: () => go(`#calendar-edit-${it.id}`) }, '✎ Edit'),
          h('button', { class: 'btn ghost', onclick: () => { if (confirm('Delete this entry?')) { deleteCalendarItem(it.id); render(); } } }, 'Delete'),
        ]),
      ]));
    }
  });

  // Private day log (cycle/mood/symptoms/intimacy/pregnancy) — only when the personal
  // calendar is on; it renders its own locked state when a PIN is set.
  if (pOn) wrap.append(personalDayCard(calSelDate));

  // Full editable add form for the selected day.
  wrap.append(h('button', { class: 'btn block', style: 'margin-top:12px', onclick: () => go(`#calendar-add-${calSelDate}`) }, '＋ Add to this day'));

  // ===== Layer toggles — placed AFTER the calendar display, as requested. =====
  wrap.append(h('h3', { class: 'cat-title', style: 'margin-top:18px' }, 'Show on the calendar'));
  wrap.append(h('p', { class: 'muted', style: 'margin:0 0 6px' }, 'Turn any layer on or off — your choices are remembered.'));
  wrap.append(h('div', { class: 'chips' }, CAL_LAYERS.map((ly) =>
    h('button', { class: 'chip', 'aria-pressed': L[ly.key] ? 'true' : 'false',
      onclick: () => { const cur = calLayerState(); store.profile.prefs.calLayers = { ...cur, [ly.key]: !cur[ly.key] }; save(); render(); } },
      [calDot(ly.color), ' ' + ly.label]))));
  if (pUnlocked) {
    wrap.append(h('div', { class: 'chips', style: 'margin-top:6px' }, personal.PERSONAL_LAYERS.map((ly) =>
      h('button', { class: 'chip', 'aria-pressed': PL[ly.key] ? 'true' : 'false',
        onclick: () => { personal.setLayer(ly.key, !PL[ly.key]); render(); } },
        [calDot(ly.color), ` ${ly.emoji} ${ly.label}`]))));
  }

  // Private-calendar control card (enable / PIN / pregnancy / disclaimer + sources).
  wrap.append(personalControlCard());

  mount(wrap, '#home');
}

// ---- Private personal calendar UI (cycle/mood/symptoms/intimacy/pregnancy) ---
// All on-device; see js/personal.js. Everything here is editable and removable.
function personalDayCard(date) {
  if (personal.hasPin() && !personal.isUnlocked()) {
    return h('div', { class: 'card' }, [h('p', { class: 'muted' }, '🔒 Your private log is locked. Enter your PIN in “Private calendar” below to view and edit it.')]);
  }
  const g = personal.dayGlyphs(date);
  const day = personal.getDay(date);
  const card = h('div', { class: 'card personal-card' }, [
    h('div', { class: 'row-between' }, [
      h('strong', {}, '🔒 Private log'),
      h('span', { class: 'muted', style: 'font-size:.8rem' }, 'On this device only'),
    ]),
  ]);
  card.append(h('button', { class: 'btn ghost block', style: 'margin-top:6px', 'aria-pressed': g.period ? 'true' : 'false',
    onclick: () => { personal.setPeriod(date, !personal.isPeriodDay(date)); render(); } },
    g.period ? '🩸 Period day ✓ (tap to clear)' : '🩸 Mark period day'));
  card.append(h('div', { class: 'field-lbl', style: 'margin-top:8px' }, 'Mood'));
  card.append(h('div', { class: 'chips' }, [1, 2, 3, 4, 5].map((n) =>
    h('button', { class: 'chip', 'aria-pressed': (day.mood === n) ? 'true' : 'false',
      onclick: () => { personal.setMood(date, day.mood === n ? '' : n); render(); } }, personal.MOODS[n]))));
  card.append(h('div', { class: 'field-lbl', style: 'margin-top:8px' }, 'Energy'));
  card.append(h('div', { class: 'chips' }, [1, 2, 3, 4, 5].map((n) =>
    h('button', { class: 'chip', 'aria-pressed': (day.energy === n) ? 'true' : 'false',
      onclick: () => { personal.setEnergy(date, day.energy === n ? '' : n); render(); } }, '▁▂▃▅▇'.charAt(n - 1) || String(n)))));
  card.append(h('div', { class: 'field-lbl', style: 'margin-top:8px' }, 'How you feel'));
  card.append(h('div', { class: 'chips' }, personal.SYMPTOMS.map((s) =>
    h('button', { class: 'chip', 'aria-pressed': personal.hasSymptom(date, s.id) ? 'true' : 'false',
      onclick: () => { personal.toggleSymptom(date, s.id); render(); } }, s.label))));
  card.append(h('div', { class: 'field-lbl', style: 'margin-top:10px' }, 'Intimacy (optional, private)'));
  (day.encounters || []).forEach((e) => {
    const who = e.solo ? '🌙 Solo' : (e.partnerId ? `💞 ${personal.partnerName(e.partnerId) || 'Partner'}` : '💞 Partnered');
    card.append(h('div', { class: 'row-between price-item' }, [
      h('div', { class: 'grow' }, [h('strong', {}, who), h('div', { class: 'muted', style: 'font-size:.82rem' },
        `${e.time ? e.time + ' · ' : ''}${e.orgasms ? e.orgasms + ' orgasm' + (e.orgasms === 1 ? '' : 's') : ''}${e.satisfaction ? ' · ' + personal.moodFor(e.satisfaction) : ''}${e.protection ? ' · protected' : ''}`)]),
      h('button', { class: 'chip', 'aria-label': 'Remove', onclick: () => { personal.removeEncounter(date, e.id); render(); } }, '✕'),
    ]));
  });
  card.append(personalEncounterForm(date));
  const ps = personal.pregnancyStatus(date);
  if (ps) card.append(h('p', { class: 'muted', style: 'margin-top:10px' }, `🤰 On this day: week ${ps.weeks}${ps.days ? ' +' + ps.days + 'd' : ''} · trimester ${ps.trimester}.`));
  return card;
}

function personalEncounterForm(date) {
  const det = h('details', { class: 'filters-collapse', style: 'margin-top:6px' });
  det.append(h('summary', {}, '＋ Add intimacy'));
  const solo = h('input', { type: 'checkbox' });
  const partners = personal.listPartners();
  const partnerSel = selectEl([['', 'Partner (optional)']].concat(partners.map((p) => [p.id, p.name])), '', () => {});
  const newPartner = h('input', { type: 'text', placeholder: 'Or a new partner name' });
  const time = h('input', { type: 'time' });
  const orgasms = h('input', { type: 'number', min: '0', max: '99', inputmode: 'numeric', placeholder: 'Orgasms' });
  const sat = selectEl([['', 'Satisfaction'], ['1', '1'], ['2', '2'], ['3', '3'], ['4', '4'], ['5', '5']], '', () => {});
  const prot = h('input', { type: 'checkbox' });
  const note = h('input', { type: 'text', placeholder: 'Note (optional)' });
  det.append(h('div', {}, [
    field('Solo', solo), field('Time', time), field('Partner', partnerSel), field('New partner', newPartner),
    field('Orgasms', orgasms), field('Satisfaction', sat), field('Protection used', prot), field('Note', note),
    h('button', { class: 'btn block', onclick: () => {
      let partnerId = partnerSel.value || null;
      if (!solo.checked && newPartner.value.trim()) { const npar = personal.addPartner(newPartner.value.trim()); partnerId = npar ? npar.id : partnerId; }
      personal.addEncounter(date, { solo: solo.checked, partnerId, time: time.value, orgasms: orgasms.value, satisfaction: sat.value, protection: prot.checked, note: note.value });
      render();
    } }, 'Save'),
  ]));
  return det;
}

function personalControlCard() {
  const card = h('div', { class: 'card', style: 'margin-top:14px' });
  if (!personal.isEnabled()) {
    card.append(
      h('h3', {}, '🔒 Private calendar (optional)'),
      h('p', { class: 'muted' }, 'A private space for your body and personal life while you travel: your period & cycle, mood and symptoms, intimacy and partners, and a pregnancy tracker. It stays on this device only, is never uploaded, never judges, and can be locked with a PIN. Turning it on adds its layers to the calendar above.'),
      h('button', { class: 'btn block', onclick: () => { personal.setEnabled(true); render(); } }, 'Turn on private calendar'),
    );
    return card;
  }
  if (personal.hasPin() && !personal.isUnlocked()) {
    const pin = h('input', { type: 'password', inputmode: 'numeric', placeholder: 'PIN' });
    const err = h('p', { class: 'warn-note', style: 'display:none' });
    const submit = async () => { if (await personal.verifyPin(pin.value)) render(); else { err.textContent = 'Incorrect PIN.'; err.style.display = ''; } };
    pin.addEventListener('keydown', (e) => { if (e.key === 'Enter') submit(); });
    card.append(h('h3', {}, '🔒 Private calendar'), h('p', { class: 'muted' }, 'Enter your PIN to view and edit your private log.'), field('PIN', pin), err,
      h('button', { class: 'btn block', onclick: submit }, 'Unlock'));
    return card;
  }
  card.append(h('h3', {}, '🔒 Private calendar'));
  const preg = personal.getPregnancy();
  if (preg && preg.active) {
    const ps = personal.pregnancyStatus();
    card.append(h('p', { class: 'muted' }, `🤰 Pregnancy on: week ${ps ? ps.weeks : '–'} · due ${preg.edd}.`));
    card.append(h('div', { class: 'row-between' }, [
      h('button', { class: 'btn ghost', onclick: () => { if (confirm('Turn off the pregnancy tracker? Your dates are kept.')) { personal.endPregnancy(); render(); } } }, 'Turn off'),
      h('button', { class: 'btn ghost', onclick: () => { if (confirm('Clear the pregnancy dates?')) { personal.clearPregnancy(); render(); } } }, 'Clear dates'),
    ]));
  } else {
    const det = h('details', { class: 'filters-collapse' });
    det.append(h('summary', {}, '🤰 Add a pregnancy'));
    const mode = selectEl([['edd', 'I know my due date'], ['lmp', 'First day of my last period']], 'edd', () => {});
    const dateIn = h('input', { type: 'date' });
    det.append(h('div', {}, [
      field('Based on', mode), field('Date', dateIn),
      h('button', { class: 'btn block', onclick: () => { if (!dateIn.value) { alert('Pick a date.'); return; } personal.setPregnancy({ mode: mode.value, value: dateIn.value }); render(); } }, 'Start tracking'),
      h('p', { class: 'disclaimer' }, 'Estimates use the standard 40-week (280-day) convention (Naegele’s rule). Informational only — not medical advice.'),
    ]));
    card.append(det);
  }
  const pinDet = h('details', { class: 'filters-collapse' });
  pinDet.append(h('summary', {}, personal.hasPin() ? 'Change or remove PIN' : 'Add a PIN lock'));
  const np = h('input', { type: 'password', inputmode: 'numeric', placeholder: '4–8 digit PIN' });
  pinDet.append(h('div', {}, [
    field('PIN', np),
    h('button', { class: 'btn block', onclick: async () => { if (await personal.setPin(np.value)) { alert('PIN set.'); render(); } else alert('Use 4–8 digits.'); } }, 'Set PIN'),
    personal.hasPin() ? h('button', { class: 'btn ghost block', style: 'margin-top:6px', onclick: () => { personal.clearPin(); render(); } }, 'Remove PIN') : null,
    h('p', { class: 'disclaimer' }, 'A PIN hides this section from a casual glance. It is not encryption — the data is stored on this device like your journal. For documents you need encrypted, use the vault.'),
  ]));
  card.append(pinDet);
  card.append(h('button', { class: 'btn ghost block', style: 'margin-top:8px', onclick: () => { if (confirm('Turn off the private calendar? Your entries are kept and return when you turn it back on.')) { personal.setEnabled(false); personal.lock(); render(); } } }, 'Turn off private calendar'));
  card.append(h('p', { class: 'disclaimer', style: 'margin-top:8px' }, 'This calendar is descriptive and informational, not medical advice or contraception guidance. In this region, pregnant and trying-to-conceive travellers should note dengue and Zika risk and discuss travel, vaccines and insurance with a health professional. Sources: ACOG, NHS, WHO, US CDC Travelers’ Health.'));
  return card;
}

// New OR edit a calendar item. editId set => editing (prefilled, saved back). `prefill`
// (from the quick-add row) seeds the date + type of a NEW entry; it stays fully editable.
function calendarFormScreen(editId, prefill) {
  const existing = editId ? store.calendar.items.find((x) => x.id === editId) : null;
  const editing = !!existing;
  const pf = prefill || {};
  const wrap = h('div', { class: 'screen' });
  wrap.append(topbar(editing ? 'Edit calendar entry' : 'Add to calendar', '#calendar'));
  if (editId && !existing) { wrap.append(h('p', { class: 'empty' }, 'Entry not found.')); mount(wrap, '#home'); return; }
  const c = getCountry(activeCountry);
  const st = { rating: existing ? (existing.rating || 0) : 0 };
  const date = h('input', { 'aria-label': 'Date', type: 'date', value: existing ? existing.date : (pf.date || '') });
  const time = h('input', { 'aria-label': 'Time', type: 'time', value: existing ? (existing.time || '') : '' });
  const TYPES = [['plan', '🗓 Day plan'], ['stay', '🛏 Accommodation'], ['meal', '🍽 Meal'], ['activity', '🎟 Activity'], ['laundry', '🧺 Laundry day'], ['appointment', '📌 Appointment']];
  const type = selectEl(TYPES, existing ? existing.type : (pf.type || 'plan'), () => {}, 'Entry type');
  const title = h('input', { 'aria-label': 'Title', type: 'text', placeholder: 'e.g. Grand Palace visit / Bun cha lunch', value: existing ? existing.title : '' });
  const place = h('input', { 'aria-label': 'Where', type: 'text', placeholder: 'Where', value: existing ? (existing.place || '') : '' });
  const cost = h('input', { 'aria-label': 'Cost', type: 'number', inputmode: 'decimal', placeholder: 'Cost', value: existing ? (existing.cost || '') : '' });
  const cur = selectEl(['THB', 'VND', 'KHR', 'LAK', 'USD', 'EUR', 'GBP', 'ILS'], existing ? (existing.currency || (c ? c.currency : 'THB')) : (c ? c.currency : 'THB'), () => {}, 'Currency');
  const note = h('textarea', { 'aria-label': 'Details', class: 'ta', placeholder: 'Plan details, or a review once you have been' });
  if (existing) note.value = existing.note || '';
  // Reminder: a per-entry lead time (defaults to the user's chosen default for new entries).
  const remindDefault = existing ? (existing.remind == null ? -1 : existing.remind) : reminders.defaultLead();
  const remind = selectEl(reminders.LEADS.map((l) => [String(l[0]), l[1]]), String(remindDefault), () => {});
  const stars = h('div', { class: 'stars' });
  const paint = (n) => [...stars.children].forEach((s, i) => { s.textContent = i < n ? '★' : '☆'; });
  for (let i = 1; i <= 5; i++) stars.append(h('button', { class: 'star', 'aria-label': `${i} star${i > 1 ? 's' : ''}`, onclick: () => { st.rating = st.rating === i ? 0 : i; paint(st.rating); } }, '☆'));
  paint(st.rating);
  wrap.append(h('div', { class: 'card' }, [
    field('Date', date), field('Time (optional)', time), field('Type', type), field('Title', title), field('Place', place),
    field('Cost (optional)', h('div', { class: 'row-between' }, [cost, cur])),
    field('Reminder', remind),
    field('Rating (optional)', stars), field('Plan / review', note),
  ]));
  wrap.append(h('button', { class: 'btn block', onclick: () => {
    if (!date.value) { alert('Pick a date.'); return; }
    if (!title.value.trim()) { alert('Add a title.'); return; }
    const fields = { date: date.value, time: time.value, type: type.value, title: title.value.trim(), place: place.value.trim(), cost: cost.value, currency: cur.value, rating: st.rating, note: note.value.trim(), remind: Number(remind.value) };
    if (editing) updateCalendarItem(editId, fields); else addCalendarItem(fields);
    reminders.tick();
    go('#calendar');
  } }, editing ? 'Save changes' : 'Save'));
  wrap.append(h('p', { class: 'disclaimer', style: 'margin-top:8px' }, 'Reminders show on the “Coming up” card on Home, and — if you allow notifications in Settings — as a device alert while the app is open or when you next open it. Background alerts when the app is fully closed are not available (there is no server), so the Home card is the reliable reminder.'));
  mount(wrap, '#home');
}

// ---- DIETARY PROFILE (allergies + diet) -------------------------------------
// Powers the food-identifier highlighting and the pinned phrasebook allergy card.
// SAFETY: the highlighting is guidance drawn from each dish's LISTED allergens, never a
// guarantee. A green border means "nothing you avoid is listed", not "confirmed safe";
// recipes and shared woks vary. The real safety tool is showing the cook the translated
// allergy phrase (phrasebook). Diet choices the data cannot verify (halal, kosher,
// no-pork/beef/alcohol) never colour a dish — they only pin the right phrases + guidance.
const DIET_OPTIONS = [
  { group: 'Allergies — flagged on dishes', items: [
    { id: 'peanut', label: 'Peanuts', emoji: '🥜' },
    { id: 'tree nut', label: 'Tree nuts', emoji: '🌰' },
    { id: 'shellfish', label: 'Shellfish', emoji: '🦐' },
    { id: 'fish', label: 'Fish', emoji: '🐟' },
    { id: 'egg', label: 'Egg', emoji: '🥚' },
    { id: 'dairy', label: 'Dairy / milk', emoji: '🥛' },
    { id: 'soy', label: 'Soy', emoji: '🫘' },
    { id: 'gluten', label: 'Gluten / wheat (celiac)', emoji: '🌾' },
    { id: 'sesame', label: 'Sesame', emoji: '🫓' },
  ] },
  { group: 'Diet & beliefs', items: [
    { id: 'vegetarian', label: 'Vegetarian', emoji: '🥗' },
    { id: 'vegan', label: 'Vegan', emoji: '🌱' },
    { id: 'pescatarian', label: 'Pescatarian', emoji: '🐠' },
    { id: 'halal', label: 'Halal', emoji: '🕌' },
    { id: 'kosher', label: 'Kosher', emoji: '✡️' },
    { id: 'no-pork', label: 'No pork', emoji: '🐖' },
    { id: 'no-beef', label: 'No beef', emoji: '🐄' },
    { id: 'no-alcohol', label: 'No alcohol', emoji: '🚫' },
    { id: 'no-msg', label: 'No MSG', emoji: '🧂' },
    { id: 'no-chili', label: 'Not spicy at all', emoji: '🌶' },
  ] },
];
const DIET_LABEL = Object.fromEntries(DIET_OPTIONS.flatMap((g) => g.items).map((it) => [it.id, it]));

// The allergen keys (matching FOOD_ALLERGENS) a profile means to avoid — including the
// ones implied by a vegetarian/vegan choice. Only these can colour a dish red.
function dietAvoidAllergens(diet) {
  const set = new Set();
  for (const key of (diet || store.profile.prefs.diet || [])) {
    if (FOOD_ALLERGENS.includes(key)) set.add(key);
    if (key === 'vegetarian') { set.add('fish'); set.add('shellfish'); }
    if (key === 'vegan') { set.add('fish'); set.add('shellfish'); set.add('egg'); set.add('dairy'); }
  }
  return set;
}

// Verdict for one dish vs. the saved profile: 'bad' (lists something to avoid), 'ok'
// (nothing flagged — still confirm), or '' (no profile set → no border).
function dishDietVerdict(d, avoid, diet) {
  const dietArr = diet || store.profile.prefs.diet || [];
  const av = avoid || dietAvoidAllergens(dietArr);
  if (!dietEvaluable(dietArr, av)) return '';
  return dishDietReasons(d, av, dietArr).length ? 'bad' : 'ok';
}

// --- Belief / preference diet flags (NOT allergens) --------------------------
// Fish sauce, egg and dairy are caught via dietAvoidAllergens, but land meat, pork, beef and
// alcohol carry no allergen tag. These helpers read the structured ingredients so the whole
// "Diet & beliefs" group (vegetarian, vegan, pescatarian, halal, kosher, no-pork, no-beef,
// no-alcohol) actually drives the red/green verdict — conservatively, using only unambiguous
// signals so a dish is never misrepresented.
function dietIsVeg(diet) {
  const d = diet || store.profile.prefs.diet || [];
  return d.includes('vegan') ? 'vegan' : d.includes('vegetarian') ? 'vegetarian' : '';
}
// Does this profile carry any flag we can actually evaluate against a dish?
function dietEvaluable(dietArr, av) {
  if (av && av.size) return true;
  return (dietArr || []).some((f) => ['vegetarian', 'vegan', 'pescatarian', 'no-pork', 'no-beef', 'halal', 'kosher', 'no-alcohol'].includes(f));
}
const MEAT_TERMS = ['pork', 'beef', 'chicken', 'duck', 'buffalo', 'goat', 'lamb', 'bacon', 'ham', 'sausage', 'offal', 'liver'];
const ALCOHOL_TERMS = ['beer', 'wine', 'sake', 'rum', 'whisky', 'whiskey', 'vodka', 'brandy', 'liquor', 'lao-lao', 'lao khao', 'rượu', 'shaoxing'];
// Guard against mock/plant meats ("mock duck", "vegetarian chicken", "soy beef", "chicken free").
function isMockMeat(s, t) {
  return new RegExp(`(mock|vegan|vegetarian|plant|soy|imitation|faux)[ -]?(\\w+ )?${t}`).test(s)
    || new RegExp(`${t}[ -](substitute|alternative|free)`).test(s);
}
// The land meats / poultry named in this dish's ingredients (deduped, human-readable).
function dishMeatHits(d) {
  const ings = (d.ingredients || []).map((i) => i.toLowerCase());
  const hits = [];
  for (const t of MEAT_TERMS) {
    if (ings.some((s) => s.includes(t) && !isMockMeat(s, t)) && !hits.includes(t)) hits.push(t);
  }
  if (!hits.length && ings.some((s) => /\bmeat\b/.test(s) && !isMockMeat(s, 'meat'))) hits.push('meat');
  return hits;
}
// True alcohol — excludes "rice wine vinegar" / "wine vinegar", which are non-alcoholic.
function dishHasAlcohol(d) {
  const ings = (d.ingredients || []).map((i) => i.toLowerCase());
  return ings.some((s) => ALCOHOL_TERMS.some((t) => s.includes(t)) && !/vinegar/.test(s));
}
// The full, human-readable list of why a dish conflicts with the traveller's diet profile:
// flagged allergens + meats + alcohol, according to which beliefs/preferences are set. Powers
// the visible warning line and the badge label.
function dishDietReasons(d, avoid, diet) {
  const dietArr = diet || store.profile.prefs.diet || [];
  const set = new Set(dietArr);
  const av = avoid || dietAvoidAllergens(dietArr);
  const reasons = [];
  const add = (r) => { if (r && !reasons.includes(r)) reasons.push(r); };
  (d.allergens || []).forEach((a) => { if (av.has(a)) add(a); });
  const meat = dishMeatHits(d);
  const pork = meat.filter((m) => ['pork', 'bacon', 'ham'].includes(m));
  if (set.has('vegetarian') || set.has('vegan') || set.has('pescatarian')) meat.forEach(add);
  if (set.has('no-pork') || set.has('halal') || set.has('kosher')) pork.forEach(add);
  if (set.has('no-beef') && meat.includes('beef')) add('beef');
  if (set.has('kosher') && (d.allergens || []).includes('shellfish')) add('shellfish');
  if ((set.has('halal') || set.has('no-alcohol')) && dishHasAlcohol(d)) add('alcohol');
  return reasons;
}

// A gentle, non-safety spice note for travellers who said they are with a baby/kids or dislike
// heat ("Not spicy at all"). This is guidance, NOT the red allergen verdict — Thai/Lao/Isan heat
// is a real surprise for little ones, and most dishes can be ordered milder.
function dishSpiceCaution(d, prefs) {
  const family = prefs.withBaby || prefs.kids || prefs.party === 'family';
  const noChili = (prefs.diet || []).includes('no-chili');
  if (!family && !noChili) return '';
  if (d.spice === 'hot') return family ? 'Very spicy — often too hot for young children' : 'Very spicy — you can ask for it milder';
  if (d.spice === 'medium' && (prefs.withBaby || noChili)) return 'Can be spicy — you can ask for it milder';
  return '';
}
// "peanut", "peanut and shellfish", "peanut, shellfish and egg" — a natural inline list.
function joinList(arr) {
  if (arr.length <= 1) return arr[0] || '';
  if (arr.length === 2) return `${arr[0]} and ${arr[1]}`;
  return `${arr.slice(0, -1).join(', ')} and ${arr[arr.length - 1]}`;
}

// A reusable chip picker for the dietary profile. onChange() fires after each toggle.
function dietPicker(onChange) {
  const sel = new Set(store.profile.prefs.diet || []);
  const box = h('div', {});
  DIET_OPTIONS.forEach((grp) => {
    box.append(h('p', { class: 'tiny muted', style: 'margin:8px 0 4px' }, grp.group));
    box.append(h('div', { class: 'chips' }, grp.items.map((it) =>
      h('button', {
        class: 'chip', 'aria-pressed': sel.has(it.id) ? 'true' : 'false',
        onclick: (e) => {
          if (sel.has(it.id)) sel.delete(it.id); else sel.add(it.id);
          store.profile.prefs.diet = [...sel]; save();
          e.currentTarget.setAttribute('aria-pressed', sel.has(it.id) ? 'true' : 'false');
          if (onChange) onChange();
        },
      }, `${it.emoji} ${it.label}`))));
  });
  return box;
}

// Map the saved profile to the EXISTING translated allergy phrases (never fabricate a
// safety-critical translation). Returns an ordered, de-duplicated phrase list for `code`,
// always led by the general "I have a food allergy" phrase.
function allergyPhrasesForProfile(code, diet) {
  const list = (ALLERGENS[code] && ALLERGENS[code].length) ? ALLERGENS[code] : [];
  if (!list.length) return [];
  const RX = {
    general: /food allergy/i, egg: /\begg/i, peanut: /peanut/i, treenut: /tree nut/i,
    shellfish: /shellfish|seafood/i, fish: /^no fish/i, dairy: /dairy|milk/i, soy: /\bsoy/i,
    gluten: /gluten|wheat/i, msg: /msg/i, chili: /chili|spicy/i,
  };
  const KEYS = {
    egg: ['egg'], peanut: ['peanut'], 'tree nut': ['treenut'], shellfish: ['shellfish'],
    fish: ['fish'], dairy: ['dairy'], soy: ['soy'], gluten: ['gluten'], sesame: [],
    vegetarian: ['fish', 'shellfish'], vegan: ['fish', 'shellfish', 'egg', 'dairy'],
    'no-msg': ['msg'], 'no-chili': ['chili'],
  };
  const wanted = ['general'];
  for (const id of (diet || store.profile.prefs.diet || [])) (KEYS[id] || []).forEach((k) => wanted.push(k));
  const out = []; const seen = new Set();
  for (const k of wanted) {
    const rx = RX[k]; if (!rx) continue;
    const found = list.find((p) => rx.test(p.en));
    if (found && !seen.has(found.en)) { seen.add(found.en); out.push(found); }
  }
  return out;
}

// ---- FOOD / DISH IDENTIFIER -------------------------------------------------
let foodCountry = '';
let foodQuery = '';
let foodCat = '';
let foodFitOnly = false;
const foodAvoid = new Set();
function spiceLabel(s) {
  return s === 'hot' ? '🌶🌶🌶 Hot' : s === 'medium' ? '🌶🌶 Medium'
    : s === 'mild' ? '🌶 Mild' : s === 'varies' ? '🌶 Varies' : 'Not spicy';
}

function foodCard(d) {
  const cat = FOOD_CATEGORIES.find((c) => c.id === d.category);
  const verdict = dishDietVerdict(d);
  const flagged = verdict === 'bad' ? dishDietReasons(d) : [];
  const cls = 'card species-card' + (verdict === 'bad' ? ' food-bad' : verdict === 'ok' ? ' food-ok' : '');
  // Accessible name for the badge: `title` alone never appears on touch and is an
  // unreliable accessible name, so the specific flagged allergen also renders as visible
  // text on the card (below) and the badge carries an explicit aria-label + role.
  const badLabel = flagged.length
    ? `Contains ${joinList(flagged)} — you flagged ${flagged.length > 1 ? 'these' : 'this'}`
    : 'Contains something you avoid';
  const okLabel = 'Nothing you avoid is listed — still confirm';
  const spiceNote = dishSpiceCaution(d, store.profile.prefs);
  const badge = verdict === 'bad'
    ? h('span', { class: 'food-flag bad', role: 'img', 'aria-label': badLabel, title: badLabel }, '✕')
    : verdict === 'ok'
      ? h('span', { class: 'food-flag ok', role: 'img', 'aria-label': okLabel, title: okLabel }, '✓')
      : null;
  return h('button', { class: cls, onclick: () => go(`#dish-${d.id}`) }, [
    h('span', { class: 'species-emoji', 'aria-hidden': 'true' }, cat ? cat.emoji : '🍽'),
    h('span', { class: 'grow' }, [
      h('div', { class: 'en' }, `${d.flag ? d.flag + ' ' : ''}${d.name}`),
      h('div', { class: 'sci' }, `${d.localName || ''}${d.roman ? ` · ${d.roman}` : ''}`),
      verdict === 'bad'
        ? h('div', { class: 'food-warn' }, `⚠️ ${flagged.length ? `Contains ${joinList(flagged)}` : 'Contains something you avoid'}`)
        : null,
      spiceNote ? h('div', { class: 'food-spice' }, `🌶 ${spiceNote}`) : null,
    ]),
    badge,
    h('span', { class: 'fair' }, d.price ? range(d.price.low, d.price.high, d.price.currency) : ''),
  ]);
}

function foodScreen(country) {
  if (country) foodCountry = country;
  const wrap = h('div', { class: 'screen' });
  wrap.append(topbar('Identify food', '#home'));
  wrap.append(h('p', { class: 'map-hint' }, 'Search dishes by name or ingredient. Tap one for ingredients, allergens, vegetarian notes and a fair price. Set your allergies and diet below and dishes are highlighted for you — green fits, red to avoid. Use “Avoid” to hide dishes with an allergen.'));

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

  // Your dietary profile: highlight dishes that fit you + one tap to your allergy phrases.
  const diet = store.profile.prefs.diet || [];
  const profBox = h('div', { class: 'card diet-legend', style: 'margin:12px 0' });
  if (diet.length) {
    profBox.append(h('p', { style: 'margin:0 0 6px' }, [
      h('strong', {}, '🍽 Highlighting for: '),
      diet.map((id) => (DIET_LABEL[id] ? `${DIET_LABEL[id].emoji} ${DIET_LABEL[id].label}` : id)).join(', '),
    ]));
    profBox.append(h('p', { class: 'tiny muted', style: 'margin:0 0 8px' }, [
      h('span', { class: 'food-flag ok' }, '✓'), ' green = nothing you avoid is listed · ',
      h('span', { class: 'food-flag bad' }, '✕'), ' red = contains something you avoid. Guidance from listed allergens only — always confirm with the cook.',
    ]));
    profBox.append(h('div', { class: 'chips' }, [
      h('button', { class: 'chip', 'aria-pressed': foodFitOnly ? 'true' : 'false',
        onclick: (e) => { foodFitOnly = !foodFitOnly; e.currentTarget.setAttribute('aria-pressed', foodFitOnly ? 'true' : 'false'); renderList(); } }, '✓ Only dishes that fit me'),
      h('button', { class: 'chip', onclick: () => go('#settings') }, '✎ Edit restrictions'),
    ]));
  } else {
    profBox.append(h('p', { style: 'margin:0 0 8px' }, 'Tell the app your allergies and diet and it highlights dishes that fit — green for safe, red to avoid.'));
    profBox.append(h('button', { class: 'btn ghost block', onclick: () => go('#settings') }, '➕ Set my allergies & diet'));
  }
  const foodLangCC = getCountry(foodCountry) ? foodCountry : (activeCountry || 'th');
  const foodLang = (getCountry(foodLangCC) && getCountry(foodLangCC).lang) || 'th';
  profBox.append(h('button', { class: 'btn ghost block', style: 'margin-top:8px', onclick: () => go(`#phrasebook-${foodLang}`) }, '🗣 Show my allergy phrases to the cook'));
  wrap.append(profBox);

  // Vegetarian / vegan travellers get the verified veg kitchens up front (kosher has its own
  // card just below); general eateries are never assumed to be veg.
  const vegCard = dietEatCard(foodCountry, getLastFix(), { only: 'veg' });
  if (vegCard) wrap.append(vegCard);

  // Kosher: reliably kosher food in this region is served by Chabad houses (supervised).
  // Anything advertised only as "kosher-style" is not certified — never suggest it.
  if ((store.profile.prefs.diet || []).includes('kosher')) {
    const fix = getLastFix();
    const kv = nearestFirst(KOSHER, fix);
    const kc = h('div', { class: 'card allergy-card', style: 'margin:12px 0' }, [h('h2', { style: 'margin-top:0' }, '✡️ Kosher food & Chabad houses')]);
    kc.append(h('p', { class: 'muted tiny', style: 'margin:2px 0 8px' }, 'In Thailand, Vietnam, Cambodia and Laos, reliably kosher food is served by Chabad houses. Anything sold only as “kosher-style” is not certified kosher — always confirm supervision with the venue.'));
    kv.slice(0, 8).forEach((k) => {
      const km = (fix && fix.lat != null) ? haversineKm(fix, { lat: k.lat, lng: k.lng }) : null;
      kc.append(h('div', { style: 'margin:6px 0' }, [
        h('div', { class: 'row-between' }, [h('strong', {}, k.name), km != null ? h('span', { class: 'fair' }, kmLabel(km)) : null]),
        h('div', { class: 'muted tiny', style: 'margin:2px 0 4px' }, `${k.city} · ${k.offer}`),
        h('div', { class: 'chips' }, [
          h('a', { class: 'chip', href: mapsSearch(`${k.name} ${k.city}`), target: '_blank', rel: 'noopener' }, 'Map ↗'),
          h('a', { class: 'chip', href: k.url, target: '_blank', rel: 'noopener' }, 'Official site ↗'),
        ]),
      ]));
    });
    // A pork-free phrase for the current country's language — helpful when eating
    // outside a Chabad house. Keeping fully kosher still means the Chabad houses above;
    // this only asks to leave pork out, so it is framed that way.
    const pk = DIET_PHRASES['no-pork'];
    const pkLang = pk.langs[foodLang];
    const kLang = getLanguage(foodLang);
    kc.append(h('p', { class: 'tiny muted', style: 'margin:10px 0 2px' }, 'Eating outside a Chabad house? Ask the cook to leave pork out:'));
    if (pkLang && kLang) {
      kc.append(h('div', { class: 'phrase' }, [
        h('div', { class: 'grow' }, [
          h('div', { class: 'en' }, pk.en),
          h('div', { class: 'native', lang: kLang.locale }, pkLang.script),
          h('div', { class: 'roman' }, [h('span', { class: 'lbl' }, 'say:'), pkLang.roman]),
        ]),
        h('button', { class: 'speak', disabled: hasVoiceFor(kLang.locale) ? null : '', 'aria-label': `Speak ${pk.en}`, onclick: () => speak(pkLang.script, kLang.locale) }, '🔊'),
      ]));
    } else {
      kc.append(h('p', { class: 'tiny' }, `“${pk.en}” — show this to the cook. A verified ${kLang ? kLang.label : 'local'} phrase is not offered here yet, so the Chabad houses above remain the reliable source of kosher food.`));
    }
    kc.append(sourcesNote(KOSHER_SOURCES, 'July 2026'));
    wrap.append(kc);
  }

  // Halal & pork-free: a pork-free phrase in the current language + a live halal search.
  // Halal-certified food is widespread here, especially near mosques and Muslim quarters.
  const dietSet = store.profile.prefs.diet || [];
  if (dietSet.includes('halal') || dietSet.includes('no-pork') || dietSet.includes('no-beef')) {
    const hc = h('div', { class: 'card allergy-card', style: 'margin:12px 0' }, [h('h2', { style: 'margin-top:0' }, '🕌 Halal & pork-free')]);
    hc.append(h('p', { class: 'muted tiny', style: 'margin:2px 0 8px' }, 'Halal-certified food is widely available in the region, especially near mosques and Muslim quarters. Look for a halal-certification logo and confirm with the cook.'));
    hc.append(h('a', { class: 'btn ghost block', href: mapsSearch('halal restaurant near me'), target: '_blank', rel: 'noopener' }, 'Find halal food near me ↗'));
    const hpk = DIET_PHRASES['no-pork'];
    const hpkLang = hpk.langs[foodLang];
    const hLang = getLanguage(foodLang);
    hc.append(h('p', { class: 'tiny muted', style: 'margin:8px 0 2px' }, 'Ask the cook to leave pork out:'));
    if (hpkLang && hLang) {
      hc.append(h('div', { class: 'phrase' }, [
        h('div', { class: 'grow' }, [
          h('div', { class: 'en' }, hpk.en),
          h('div', { class: 'native', lang: hLang.locale }, hpkLang.script),
          h('div', { class: 'roman' }, [h('span', { class: 'lbl' }, 'say:'), hpkLang.roman]),
        ]),
        h('button', { class: 'speak', disabled: hasVoiceFor(hLang.locale) ? null : '', 'aria-label': `Speak ${hpk.en}`, onclick: () => speak(hpkLang.script, hLang.locale) }, '🔊'),
      ]));
    } else {
      hc.append(h('p', { class: 'tiny' }, `“${hpk.en}” — show this to the cook (a verified ${hLang ? hLang.label : 'local'} phrase is coming soon).`));
    }
    hc.append(h('button', { class: 'btn ghost block', style: 'margin-top:6px', onclick: () => go('#worship') }, 'Mosques & Muslim quarters — Places of worship'));
    wrap.append(hc);
  }

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
    // Dietary profile: optionally drop dishes that conflict, and float the fitting ones up.
    // `evaluable` (not avoid.size) so belief-only profiles — halal, no-beef, pescatarian — also
    // filter and sort even when no allergen is ticked.
    const avoid = dietAvoidAllergens();
    const evaluable = dietEvaluable(store.profile.prefs.diet || [], avoid);
    if (foodFitOnly && evaluable) dishes = dishes.filter((d) => dishDietVerdict(d, avoid) !== 'bad');
    if (evaluable) dishes = dishes.slice().sort((a, b) =>
      (dishDietVerdict(a, avoid) === 'bad' ? 1 : 0) - (dishDietVerdict(b, avoid) === 'bad' ? 1 : 0));
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
  const spiceNote = dishSpiceCaution(d, store.profile.prefs);
  const card = h('div', { class: 'card' }, [
    h('div', { class: 'row-between' }, [
      h('strong', {}, `${d.flag ? d.flag + ' ' : ''}${d.name}`),
      cat ? h('span', { class: 'cat-tag' }, `${cat.emoji} ${cat.label}`) : null,
    ]),
    d.localName ? h('div', { class: 'native', lang: scriptLang(d.country) }, d.localName) : null,
    d.roman ? h('div', { class: 'roman' }, [h('span', { class: 'lbl' }, 'say:'), d.roman]) : null,
    (d.localName && canSay(dLocale)) ? h('button', { class: 'btn ghost', style: 'margin:4px 0', onclick: () => say(d.localName, dLocale) }, '🔊 Hear the name (show a local)') : null,
    h('div', { class: 'muted', style: 'margin:6px 0' }, `${spiceLabel(d.spice)}${d.countryName ? ' · ' + d.countryName : ''}`),
    spiceNote ? h('div', { class: 'food-spice', style: 'margin:0 0 6px' }, `🌶 ${spiceNote}`) : null,
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
  // Your dietary profile: an at-a-glance verdict for this dish (guidance, not a guarantee).
  const dv = dishDietVerdict(d);
  if (dv === 'bad') {
    const flagged = dishDietReasons(d);
    card.append(h('div', { class: 'diet-banner bad' }, flagged.length
      ? `⚠️ Typically contains ${joinList(flagged)} — you flagged ${flagged.length > 1 ? 'these' : 'this'}. Recipes vary, so check the allergens below and confirm with the cook.`
      : '✕ This lists something you avoid — check the allergens below and confirm with the cook.'));
  } else if (dv === 'ok') {
    card.append(h('div', { class: 'diet-banner ok' },
      '✓ Nothing you avoid is listed for this dish. Recipes vary, so still confirm with the cook.'));
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
    h('span', { class: 'species-emoji', 'aria-hidden': 'true' }, p.emoji || (cat ? cat.emoji : '🍈')),
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
let weatherSeededHash = null;   // route we last seeded weatherKey for (so city clicks stick)
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
  // Seed the city from the country arg ONLY when first arriving at this route — otherwise
  // every render (e.g. a city-chip click, which calls render()) would overwrite the user's
  // choice back to the focus city. That was the "weather buttons do nothing" bug.
  const curHash = location.hash || '#weather';
  if (country && weatherSeededHash !== curHash) { weatherKey = spotKey(focusSpot(country).spot); weatherSeededHash = curHash; }
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

  const curCountry = spot.country;

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
      body.append(h('div', { class: 'card' }, [airBlock(spot)]));
      if (rec.daily && rec.daily[0]) { const uvn = uvLineNode(rec.daily[0].uv, { advice: true }); if (uvn) body.append(h('div', { class: 'card' }, [uvn])); }
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

  // City switcher lives BELOW the map + forecast: tap the map, or pick from this dropdown
  // (defaults to the city currently shown, which starts at where the traveller is).
  wrap.append(h('div', { class: 'card' }, [
    field('See another city', locationSelect(weatherKey, (key) => { weatherKey = key; render(); })),
  ]));

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

  const schedFresh = freshnessLine(SCHEDULES_VERIFIED, 'Reference timetable', 365);
  if (schedFresh) wrap.append(schedFresh);

  const listEl = h('div', {});
  wrap.append(listEl);
  function renderList() {
    listEl.innerHTML = '';
    const rows = schedCountry ? schedulesForCountry(schedCountry) : SCHEDULES;
    if (!rows.length) { listEl.append(h('p', { class: 'empty' }, 'No reference schedules for this country yet.')); return; }
    // Lead with departures from where the traveller actually is (GPS or focused city), so a
    // route on the far side of the country never sits on top. The rest collapses behind a tap.
    const fs = focusSpot(schedCountry || undefined);
    const focusCity = (fs.source === 'gps' || fs.source === 'focus') ? fs.spot.city : '';
    const here = focusCity ? rows.filter((s) => citySlug(s.from) === citySlug(focusCity)) : [];
    const rest = rows.filter((s) => !here.includes(s));
    if (here.length) {
      listEl.append(h('h3', { class: 'cat-title' }, `🚌 Departing ${focusCity} · ${here.length}`));
      here.forEach((s) => listEl.append(scheduleCard(s)));
      if (rest.length) {
        listEl.append(h('details', { class: 'filters-collapse' }, [
          h('summary', {}, `More schedules${getCountry(schedCountry) ? ' across ' + getCountry(schedCountry).name : ''} · ${rest.length}`),
          h('div', {}, rest.map((s) => scheduleCard(s))),
        ]));
      }
    } else {
      rows.forEach((s) => listEl.append(scheduleCard(s)));
    }
  }
  renderList();
  mount(wrap, '#home');
}

// ---- DAY SUGGESTIONS (weather + nearby highly-rated) ------------------------
let dayUserLoc = null;   // GPS captured this session, for "near me" sorting
let todoFamily = 'all';  // active category filter on the Things-to-do screen
let todoPlan = 'now';    // "plan ahead" scenario for the Things-to-do ranking
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

// ---- Daily-habit morning strip (the traveller's day, at a glance) ------------
// A day-of-year index so the "phrase of the day" rotates once per day yet stays
// stable within a day. (Browser Date is fine here — this is runtime, not a build.)
function dayIndex() {
  const now = new Date();
  return Math.floor((now - new Date(now.getFullYear(), 0, 0)) / 86400000);
}
// The next thing on the traveller's own calendar — today or later — i.e. their plan.
function nextPlanItem() {
  const t = todayISO();
  return calItems().find((it) => it.date && it.date >= t) || null;
}
// One phrase to have ready today: rotates through the traveller's pins if they have
// any, otherwise through the Essentials concepts — always in the local language.
function phraseOfTheDay(code) {
  const book = getLanguage(code);
  if (!book || !book.categories) return null;
  const cats = book.categories;
  const notHidden = (x) => !!x && !isPhraseHidden(code, phraseKey(code, x.catId, x.p));
  const idx = phraseIndexFor(cats, code);
  const pinned = phrasePinsFor(code).map((k) => idx.get(k)).filter(Boolean)
    .map((x) => ({ p: x.p, catId: x.catId })).filter(notHidden);
  const flat = cats.flatMap((c) => c.phrases.map((p) => ({ p, catId: c.id })));
  const find = (rx) => flat.find((x) => rx.test(x.p.en));
  const essentials = [find(/^hello/i), find(/^thank you/i), find(/excuse me|^sorry/i), find(/how much/i)].filter(Boolean);
  const qCat = cats.find((c) => c.id === 'questions');
  if (qCat) qCat.phrases.forEach((p) => essentials.push({ p, catId: 'questions' }));
  const cands = (pinned.length ? pinned : essentials).filter(notHidden);
  if (!cands.length) return null;
  const pick = cands[dayIndex() % cands.length];
  return { p: pick.p, catId: pick.catId, locale: book.locale };
}
// The compact "Your day" card: next plan item · phrase of the day · one-tap spend.
// Weather-independent, so it is rendered once (outside the weather repaint) and a
// half-typed budget amount never gets wiped by a live-weather refresh.
function dailyStripCard(id) {
  const code = store.profile.defaultLang || langForCountry(id);
  const c = getCountry(id);
  const card = h('div', { class: 'card daily-strip' });
  card.append(h('h2', { style: 'margin-top:0' }, '🎒 Your day'));

  // 1) Next plan item — or a gentle nudge to add one.
  const item = nextPlanItem();
  const t = todayISO();
  const when = item ? (item.date === t ? 'Today' : item.date === addDaysISO(t, 1) ? 'Tomorrow' : evShort(item.date)) : '';
  card.append(h('button', { class: 'btn ghost block strip-row', onclick: () => go('#calendar') }, [
    h('span', { class: 'strip-ic' }, '📅'),
    h('span', { class: 'grow strip-txt' }, item ? [
      h('div', { class: 'en' }, item.title || 'Planned'),
      h('div', { class: 'sci' }, `${when}${item.time ? ' · ' + item.time : ''}${item.place ? ' · ' + item.place : ''}`),
    ] : [
      h('div', { class: 'en' }, 'Plan your day'),
      h('div', { class: 'sci' }, 'Add what you want to do to your calendar'),
    ]),
  ]));

  // 2) Phrase of the day.
  const pod = phraseOfTheDay(code);
  if (pod) {
    card.append(h('button', { class: 'btn ghost block strip-row', onclick: () => showBigPhrase(pod.p, pod.locale) }, [
      h('span', { class: 'strip-ic' }, '💬'),
      h('span', { class: 'grow strip-txt' }, [
        h('div', { class: 'en' }, [h('span', { class: 'tiny muted' }, 'Phrase of the day · '), pod.p.en]),
        h('div', { class: 'sci', lang: pod.locale }, `${pod.p.script || ''}${pod.p.roman ? ' · ' + pod.p.roman : ''}`),
      ]),
    ]));
    card.append(h('button', { class: 'linklike', style: 'margin:2px 0 0', onclick: () => go(`#phrasebook-${code}`) }, 'More phrases →'));
  }

  // 3) Budget quick-add — logs in one tap and shows today's running spend.
  const budBox = h('div', { style: 'margin-top:10px' });
  const cur = (c && c.currency) || 'THB';
  const renderBud = () => {
    budBox.innerHTML = '';
    let spent = 0;
    (store.trip.budgetLog || []).forEach((b) => { if (b.date === t && (b.currency || cur) === cur) spent += parseFloat(b.amount) || 0; });
    const amt = h('input', { type: 'number', inputmode: 'decimal', placeholder: 'Amount', class: 'strip-amt', 'aria-label': 'Amount spent' });
    const note = h('input', { type: 'text', placeholder: 'On what? (optional)', class: 'strip-note', 'aria-label': 'What the spend was on' });
    const add = () => { if (!amt.value) return; addBudgetItem({ amount: amt.value, currency: cur, note: note.value.trim() }); renderBud(); };
    amt.addEventListener('keydown', (e) => { if (e.key === 'Enter') add(); });
    budBox.append(h('div', { class: 'strip-budget' }, [
      h('span', { class: 'strip-ic' }, '💸'), amt, h('span', { class: 'strip-cur' }, cur), note,
      h('button', { class: 'btn strip-add', 'aria-label': 'Add spend', onclick: add }, '＋'),
    ]));
    budBox.append(h('p', { class: 'tiny muted', style: 'margin:6px 0 0' }, [
      spent > 0 ? `Spent today: ${spent.toLocaleString()} ${cur} · ` : 'Log a spend in one tap. ',
      h('button', { class: 'linklike', onclick: () => go('#expenses') }, 'See all expenses →'),
    ]));
  };
  renderBud();
  card.append(budBox);
  return card;
}

// ---- "Things to do" ranking: weather + time of day + day of week + profile ------
// A place counts as a "thing to do" when it is somewhere you go (not a stay, rental or
// transport hub). We rank the whole pool by how well it fits RIGHT NOW and attach short
// human reasons ("Good in the rain", "Best in the cool morning", "Matches your interests")
// shown as chips, so the "many options" always feel picked for this person, place and moment.
const TODO_RAIN_BAD = ['beach', 'hike', 'waterfall', 'viewpoint', 'park', 'nature', 'island', 'outdoors', 'dive', 'snorkel', 'garden', 'riverside'];
const TODO_NIGHT = ['nightlife', 'bars', 'clubs', 'cocktail', 'rooftop', 'streetfood'];
const TODO_CLOSED_AT_NIGHT = ['temple', 'museum', 'nature', 'hike', 'waterfall', 'park', 'viewpoint', 'wildlife', 'cave', 'garden'];
const TODO_DOABLE = ['culture', 'temple', 'museum', 'spectacle', 'heritage', 'nature', 'waterfall', 'hike', 'viewpoint', 'park', 'wildlife', 'hotspring', 'cave', 'garden', 'sunset', 'riverside', 'beach', 'island', 'market', 'shopping', 'streetfood', 'food', 'seafood', 'cafe', 'nightlife', 'bars', 'clubs', 'cocktail', 'rooftop', 'wellness', 'spa', 'dive', 'snorkel'];
function todoDoable(p) {
  const c = p.categories || [];
  if (p.stayType) return false;
  if (c.includes('rental') || c.includes('transport')) return false;
  return c.some((x) => TODO_DOABLE.includes(x));
}
function todoHasCat(p, list) { return (p.categories || []).some((c) => list.includes(c)); }
function todoContext(rec, spot) {
  const now = new Date();
  const hr = now.getHours();
  const daypart = hr < 11 ? 'morning' : hr < 15 ? 'midday' : hr < 18 ? 'afternoon' : hr < 22 ? 'evening' : 'night';
  const dow = now.getDay();
  const today = rec && rec.daily && rec.daily[0];
  let weather = 'clear';
  if (today) { if (isWet(today.code) || (today.rainProb || 0) >= 60) weather = 'wet'; else if (today.tmax != null && today.tmax >= 34) weather = 'hot'; }
  const uv = today && today.uv != null ? today.uv : null;
  const air = getCachedAir(spotKey(spot));
  const aqi = air && air.aqi != null ? air.aqi : null;
  return { hr, daypart, dow, weekend: dow === 0 || dow === 6, weather, uv, aqi };
}
// Score a place for RIGHT NOW and collect human reasons. Higher = better fit.
function todoScore(p, ctx, prefs, anchor) {
  const cats = p.categories || [];
  const er = effectiveRating(p.id, p.rating || 0);
  let s = er || 3;
  const reasons = [];
  // Weather
  if (ctx.weather === 'wet') {
    if (todoHasCat(p, TODO_RAIN_BAD)) s -= 1.8;
    else { s += 0.5; reasons.push('☔ Good in the rain'); }
  } else if (ctx.weather === 'hot') {
    if (todoHasCat(p, ['beach', 'island', 'water', 'waterfall', 'hotspring'])) { s += 0.7; reasons.push('🏊 Cool off from the heat'); }
    else if (todoHasCat(p, ['museum', 'wellness', 'spa']) || (cats.includes('culture') && !todoHasCat(p, ['temple', 'park']))) { s += 0.4; reasons.push('❄️ Out of the midday heat'); }
  } else if (todoHasCat(p, ['nature', 'viewpoint', 'hike', 'park', 'beach', 'waterfall', 'island'])) { s += 0.4; reasons.push('☀️ Great in clear weather'); }
  // Poor air discourages strenuous outdoor picks
  if (ctx.aqi != null && ctx.aqi > 150 && todoHasCat(p, TODO_RAIN_BAD)) s -= 0.8;
  // Time of day
  if (ctx.daypart === 'night') {
    if (todoHasCat(p, TODO_NIGHT)) { s += 0.9; reasons.push('🌙 Good tonight'); }
    else if (todoHasCat(p, TODO_CLOSED_AT_NIGHT)) s -= 1.4;   // likely shut / dark after hours
  } else if (ctx.daypart === 'evening') {
    if (todoHasCat(p, ['viewpoint', 'sunset', 'nightlife', 'food', 'streetfood', 'bars', 'rooftop', 'market'])) { s += 0.5; reasons.push('🌇 Nice this evening'); }
  } else if (ctx.daypart === 'morning') {
    if (todoHasCat(p, ['temple', 'culture', 'market', 'nature', 'hike', 'viewpoint'])) { s += 0.4; reasons.push('🌅 Best in the cool morning'); }
  } else if (ctx.daypart === 'midday') {
    if (todoHasCat(p, ['beach', 'museum', 'food', 'wellness', 'spa'])) s += 0.3;
  }
  // Markets only surface when they are open today
  if (isMarket(p)) {
    if (marketOnToday(p, ctx.dow)) { s += 0.6; reasons.push('🛍 Market on today'); }
    else s -= 1.0;
  }
  // Profile
  if ((prefs.interests || []).some((i) => cats.includes(i))) { s += 0.6; reasons.push('❤️ Matches your interests'); }
  if ((prefs.party === 'family' || prefs.withBaby) && p.kidFriendly === true) { s += 0.6; reasons.push('👨‍👩‍👧 Good with kids'); }
  if (prefs.budget && prefs.budget !== 'flexible' && (p.budgetTier === prefs.budget || p.budgetTier === 'any')) { s += 0.3; reasons.push('💰 Fits your budget'); }
  // Distance
  const dist = (anchor && p.coords) ? haversineKm(anchor, p.coords) : null;
  if (dist != null) s -= Math.min(dist, 200) / 90;
  return { p, er, s, dist, reasons, cats };
}
// The place's single most-identifying category family (beach beats nature, culture beats
// park, …) — used for the accent colour and the placeholder emoji when no photo exists.
function placeFamily(p) {
  const cats = p.categories || [];
  const order = ['beach', 'culture', 'nature', 'market', 'nightlife', 'wellness', 'food', 'stay', 'transport'];
  for (const fam of order) if (cats.some((c) => catFamily(c) === fam)) return fam;
  return 'other';
}
// The self-hosted, openly-licensed photo path for a place, or null. Same lookup as
// photoBlock, exposed so list cards can show a small recognition thumbnail offline.
function placePhotoSrc(p) {
  const reg = (p && p.id && PHOTOS[p.id]) || null;
  return (p && p.photo) || (reg && reg.src) || null;
}
// A small (44px) recognition thumbnail for compact "near me" rows: a self-hosted photo when
// one exists, else a calm family-emoji placeholder. Helps a disoriented traveller confirm a
// place by sight. Hoisted, so the near-me rows above can call it.
function rnThumb(p) {
  const src = placePhotoSrc(p);
  if (src) return h('img', { class: 'rn-thumb', src, alt: '', loading: 'lazy', decoding: 'async' });
  const fam = placeFamily(p);
  return h('span', { class: 'rn-thumb ph' }, (FAMILY_META[fam] || FAMILY_META.other).emoji);
}
// A "thing to do" result card: a recognition thumbnail, coloured category tags, rating,
// distance and "why now" reason chips. Tapping opens the full detail page (with a photo).
function todoCard(x, maxReasons) {
  const { p, er, dist, reasons, cats } = x;
  const rc = [];
  // Status/fit first (colour-coded): closed-now and "may not suit you" lead the chip row so
  // they are not lost behind the "why now" reasons; both are set by the list that renders us.
  if (x._closed) rc.push(attrTag('🔒 Closed now'));
  if (x._fit) rc.push(attrTag('⚠️ ' + x._fit));
  (reasons || []).slice(0, maxReasons || 2).forEach((r) => rc.push(attrTag(r)));
  const fam = placeFamily(p);
  const src = placePhotoSrc(p);
  const thumb = src
    ? h('img', { class: 'todo-thumb', src, alt: '', loading: 'lazy', decoding: 'async' })
    : h('span', { class: 'todo-thumb todo-thumb-ph', style: `background:${FAMILY_COLOR[fam] || FAMILY_COLOR.other}` }, (FAMILY_META[fam] || FAMILY_META.other).emoji);
  return h('button', { class: 'card place-card todo-card', style: `--cat:${FAMILY_COLOR[fam] || bucketColor(p)}`, onclick: () => go(`#place-${p.id}`) }, [
    h('div', { class: 'todo-body' }, [
      h('div', { class: 'place-head' }, [
        h('h2', {}, p.name),
        er ? h('span', { class: 'stars-static', style: `color:${ratingColor(er)}` }, starsStr(er)) : null,
      ]),
      h('div', { class: 'cats', style: 'margin:2px 0' }, cats.slice(0, 3).map((c) => catTag(c))),
      rc.length ? h('div', { class: 'todo-reasons' }, rc) : null,
      h('p', { class: 'muted small', style: 'margin:2px 0 0' }, [p.city, todoDistLabel(dist)].filter(Boolean).join(' · ')),
    ]),
    thumb,
  ]);
}
// Distance label that answers "how long to get there?": a walk time for close picks and an
// estimated road-drive time beyond that (see driveLabel), so every tier reads as time, not just
// straight-line km — the honest measure on the region's winding roads.
function todoDistLabel(dist) {
  if (dist == null) return null;
  const km = dist < 10 ? dist.toFixed(1) : String(Math.round(dist));
  const lbl = driveLabel(dist);
  return lbl ? `${km} km · ${lbl}` : `${km} km away`;
}

function daySuggestScreen(country) {
  const explicit = country && getCountry(country) ? country : null;
  if (explicit) activeCountry = explicit;
  const fs = focusSpot(explicit || undefined);
  const spot = fs.spot;
  const id = getCountry(spot.country) ? spot.country : (getCountry(activeCountry) ? activeCountry : 'th');
  activeCountry = id;
  todoFamily = 'all';   // fresh filter each visit, so a stale category never hides a new city's picks
  todoPlan = 'now';     // always open on "now"; planning ahead is an explicit, per-visit choice
  const wrap = h('div', { class: 'screen' });
  wrap.append(topbar('Things to do', '#home'));

  // A compact header (scope + conditions + filters) sits above the list, but the list itself
  // starts near the top so the traveller never scrolls past chrome to reach what they can do now.
  const header = h('div', { class: 'todo-header' });
  const listWrap = h('div', {});
  wrap.append(header, listWrap);

  function paint(rec) {
    header.innerHTML = ''; listWrap.innerHTML = '';
    const today = rec && rec.daily && rec.daily[0];
    const ctx = todoContext(rec, spot);
    const prefs = store.profile.prefs;
    const DAYPART_LBL = { morning: 'Morning', midday: 'Midday', afternoon: 'Afternoon', evening: 'Evening', night: 'Tonight' };

    // --- Scope row: where the picks are for, plus a one-tap location control. ---
    const gps = fs.source === 'gps';
    header.append(h('div', { class: 'todo-scope' }, [
      h('span', { class: 'todo-scope-city' }, `📍 ${gps ? 'Near ' : ''}${spot.city}`),
      h('button', { class: 'chip', onclick: async (e) => {
        const b = e.currentTarget; b.textContent = 'Locating…'; b.disabled = true;
        try { setLastFix(await geolocate()); go('#today'); return; } catch { /* denied/offline */ }
        b.textContent = 'Location off'; b.disabled = false;
      } }, gps ? 'Update' : '📍 Use my location'),
    ]));

    // --- Conditions now: one glanceable chip row (weather · time · UV · air). ---
    const cond = [];
    if (today) {
      const emo = wmo(today.code)[1];
      cond.push(`${emo} ${fmtTemp(today.tmin)}–${fmtTemp(today.tmax)}`);
      if (today.rainProb != null) cond.push(`☔ ${today.rainProb}%`);
    }
    cond.push(`🕑 ${DAYPART_LBL[ctx.daypart]}`);
    if (ctx.uv != null) { const ub = uvBand(ctx.uv); if (ub) cond.push(`UV ${Math.round(ctx.uv)} ${ub[0]}`); }
    if (ctx.aqi != null) { const ab = aqiBand(ctx.aqi); if (ab) cond.push(`AQI ${Math.round(ctx.aqi)}`); }
    header.append(h('div', { class: 'todo-cond' }, cond.map((b) => h('span', { class: 'todo-cond-chip' }, b))));
    header.append(h('p', { class: 'muted small', style: 'margin:4px 0 0' }, today ? moodLine(ctx.weather) : 'Connect once for weather-aware picks; meanwhile these are ranked by rating and distance.'));
    if (!profileIsSet()) header.append(h('button', { class: 'linklike', style: 'display:block;margin:6px 0 0', onclick: () => go('#foryou') }, '⚙ Personalise these picks →'));

    // --- Rank the doable pool for RIGHT NOW, then keep only what is actually reachable. ---
    const anchor = dayUserLoc || ((gps && getLastFix()) ? getLastFix() : { lat: spot.lat, lng: spot.lng });
    const doable = allPlaces({ country: id }).filter(todoDoable);
    // "Plan ahead" re-ranks the SAME reachable places for a hypothetical time or weather,
    // without touching the live conditions shown above. Reachability (distance) is unchanged;
    // only the score and the "why now" reasons shift, so the tiers stay stable.
    const ctxForPlan = (base, plan) =>
      plan === 'heat' ? { ...base, weather: 'hot' }
        : plan === 'rain' ? { ...base, weather: 'wet' }
          : plan === 'morning' ? { ...base, daypart: 'morning' }
            : plan === 'evening' ? { ...base, daypart: 'evening' }
              : plan === 'night' ? { ...base, daypart: 'night' }
                : base;
    let scored = doable.map((p) => todoScore(p, ctxForPlan(ctx, todoPlan), prefs, anchor));
    const rescore = () => { scored = doable.map((p) => todoScore(p, ctxForPlan(ctx, todoPlan), prefs, anchor)); };
    const sameCity = (x) => citySlug(x.p.city || '') === citySlug(spot.city || '');
    // In scope only if reachability is trustworthy, tiered by estimated DRIVE time: walkable,
    // within about an hour's drive ("near"), or up to a ~3-hour day trip ("trip"). When a place
    // has no coordinates we fall back to same-city as "near". Anything further is hidden.
    const tierOf = (x) => {
      if (x.dist != null) return x.dist <= 2.5 ? 'walk' : withinNear(x.dist) ? 'near' : withinDayTrip(x.dist) ? 'trip' : null;
      return sameCity(x) ? 'near' : null;
    };
    const inScope = scored.filter((x) => tierOf(x));

    // --- Category filter chips (only the families that exist nearby). ---
    const famsPresent = CATEGORY_FAMILIES.filter((f) => !['stay', 'transport', 'other'].includes(f.key))
      .filter((f) => inScope.some((x) => x.cats.some((c) => catFamily(c) === f.key)));
    const chipRow = h('div', { class: 'chips todo-filter' });
    const mkChip = (key, label) => h('button', { class: 'chip', dataset: { f: key }, 'aria-pressed': todoFamily === key ? 'true' : 'false', onclick: () => { todoFamily = key; drawList(); } }, label);
    chipRow.append(mkChip('all', 'All'));
    famsPresent.forEach((f) => chipRow.append(mkChip(f.key, [swatch(f.color), ` ${f.emoji} ${f.label}`])));
    header.append(chipRow);

    // --- Plan ahead (progressive disclosure): re-rank for a different time or weather. ---
    const PLANS = [['now', 'Now'], ['heat', '☀️ Beat the heat'], ['rain', '🌧 If it rains'], ['morning', '🌅 Morning'], ['evening', '🌇 Evening'], ['night', '🌙 Tonight']];
    const PLAN_NOTE = { heat: 'to beat the midday heat', rain: 'for if it rains', morning: 'for the morning', evening: 'for the evening', night: 'for tonight' };
    const planNote = h('p', { class: 'muted small', style: 'margin:6px 0 0' });
    const updatePlanNote = () => { planNote.textContent = todoPlan === 'now' ? '' : `Re-ranked ${PLAN_NOTE[todoPlan]}. The live conditions above are unchanged.`; };
    const planChips = h('div', { class: 'chips todo-plan' }, PLANS.map(([k, lbl]) =>
      h('button', {
        class: 'chip', dataset: { p: k }, 'aria-pressed': todoPlan === k ? 'true' : 'false',
        onclick: () => {
          todoPlan = k;
          planChips.querySelectorAll('.chip').forEach((el) => el.setAttribute('aria-pressed', el.dataset.p === k ? 'true' : 'false'));
          rescore(); drawList(); updatePlanNote();
        },
      }, lbl)));
    updatePlanNote();
    header.append(h('details', { class: 'todo-plan-d', open: todoPlan !== 'now' ? '' : null }, [
      h('summary', {}, '🗓 Plan for a different time or weather'),
      planChips, planNote,
    ]));

    const listBody = h('div', {});
    listWrap.append(listBody);
    const TIERS = [
      { key: 'walk', label: '🚶 Right here' },
      { key: 'near', label: '📍 Nearby' },
      { key: 'trip', label: '🚌 Worth a day trip' },
    ];
    function renderTier(label, items) {
      listBody.append(h('h2', { class: 'home-section todo-tier' }, `${label} · ${items.length}`));
      const CAP = 8;
      items.slice(0, CAP).forEach((x) => listBody.append(todoCard(x, 2)));
      if (items.length > CAP) {
        const more = h('div', {});
        const btn = h('button', { class: 'btn ghost block', onclick: () => { items.slice(CAP).forEach((x) => more.append(todoCard(x, 2))); btn.remove(); } }, `Show all ${items.length}`);
        listBody.append(btn, more);
      }
    }
    function drawList() {
      chipRow.querySelectorAll('.chip').forEach((el) => el.setAttribute('aria-pressed', el.dataset.f === todoFamily ? 'true' : 'false'));
      listBody.innerHTML = '';
      let pool = scored.filter((x) => tierOf(x));
      if (todoFamily !== 'all') pool = pool.filter((x) => x.cats.some((c) => catFamily(c) === todoFamily));
      // Annotate each pick with fit + open status. "Closed now" only applies when planning for
      // NOW (a place shut this minute is irrelevant when you are planning tonight/tomorrow).
      const nowPlan = todoPlan === 'now';
      pool.forEach((x) => { x._fit = placeFitReason(x.p, prefs); x._closed = nowPlan && openStateNow(x.p) === false; });
      // Good fits that are open lead; poor fits and closed sink (but stay, tagged) — then score.
      const fitKey = (x) => (x._fit ? 2 : 0) + (x._closed ? 1 : 0);
      pool.sort((a, b) => fitKey(a) - fitKey(b) || b.s - a.s);
      let rendered = 0;
      TIERS.forEach((t) => {
        const items = pool.filter((x) => tierOf(x) === t.key);
        if (items.length) { renderTier(t.label, items); rendered += items.length; }
      });
      if (!rendered) {
        // Nothing trustworthy nearby: fall back to the nearest we can measure — but still only
        // within about an hour's drive, so we never pad a "near you" list with a 3-hour trip.
        const far = scored.filter((x) => withinNear(x.dist) && (todoFamily === 'all' || x.cats.some((c) => catFamily(c) === todoFamily)))
          .sort((a, b) => a.dist - b.dist).slice(0, 12);
        if (far.length) {
          listBody.append(h('p', { class: 'muted small', style: 'margin:8px 0 0' }, `Nothing mapped close to ${spot.city} yet — here are the nearest.`));
          renderTier('Nearest to you', far);
        } else {
          listBody.append(h('p', { class: 'empty' }, `Nothing to do mapped within about an hour’s drive of ${spot.city} yet. Open a nearby city, or browse all places.`));
        }
      }
    }
    drawList();

    // Festivals have their own screen; surface only a single quiet link when any fall in the trip window.
    const fests = festivalsInWindow().filter((e) => e.country === id);
    if (fests.length) listWrap.append(h('button', { class: 'linklike', style: 'display:block;margin:14px 0 0', onclick: () => go('#events') }, `🎉 ${fests.length} festival${fests.length === 1 ? '' : 's'} during your trip →`));
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
  // First visit with no explicit country: anchor to where the traveller is, so festivals
  // in their country lead instead of a four-country pile (they can still tap "All").
  else if (!eventsCountry) { const f = focusSpot(); if (f.spot && getCountry(f.spot.country)) eventsCountry = f.spot.country; }
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
    // Lead with festivals that touch where the traveller is — their city or nationwide ones
    // (which happen everywhere) — so city-specific events elsewhere in the country drop into
    // a collapse instead of pushing the relevant ones down the page.
    const fs = focusSpot(eventsCountry || undefined);
    const focusCity = (fs.source === 'gps' || fs.source === 'focus') ? fs.spot.city : '';
    const isHere = (e) => (e.regions || []).some((r) => /nation|countrywide|throughout|national/i.test(r))
      || (!!focusCity && (e.regions || []).some((r) => r.toLowerCase().includes(focusCity.toLowerCase())));
    if (focusCity && eventsCountry && upcoming.length) {
      const hereUp = upcoming.filter(isHere);
      const restUp = upcoming.filter((e) => !hereUp.includes(e));
      if (hereUp.length) {
        listEl.append(h('h2', { class: 'cat-title' }, `📍 Around ${focusCity} & nationwide`));
        hereUp.forEach((e) => listEl.append(eventCard(e)));
        if (restUp.length) {
          listEl.append(h('details', { class: 'filters-collapse' }, [
            h('summary', {}, `More upcoming across ${getCountry(eventsCountry).name} · ${restUp.length}`),
            h('div', {}, restUp.map((e) => eventCard(e))),
          ]));
        }
      } else {
        listEl.append(h('h2', { class: 'cat-title' }, 'Upcoming'));
        upcoming.forEach((e) => listEl.append(eventCard(e)));
      }
    } else if (upcoming.length) {
      listEl.append(h('h2', { class: 'cat-title' }, 'Upcoming'));
      upcoming.forEach((e) => listEl.append(eventCard(e)));
    }
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
        h('span', { class: 'species-emoji', 'aria-hidden': 'true' }, s.emoji || '🔎'),
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
    h('span', { class: 'species-emoji', 'aria-hidden': 'true' }, s.emoji || (g && g.emoji) || '🔎'),
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
    card.append(h('a', { class: 'btn ghost', href: mapsUrl({ coords: it.coords, mapQuery: it.mapQuery || `${it.name} ${it.city || ''}` }), target: '_blank', rel: 'noopener' }, 'Open in Maps ↗'));
    wrap.append(card);
  });
  wrap.append(h('p', { class: 'disclaimer' }, 'Curated from multiple public sources; tap through for live reviews. Verify hours and prices locally.'));
  mount(wrap, '#home');
}

// ---- TRIP PLANNER (itinerary + budget) --------------------------------------
let editStopId = null;   // trip stop currently open for inline editing (correct a mistake)
function tripScreen() {
  const wrap = h('div', { class: 'screen' });
  wrap.append(topbar('My Trip', '#home'));

  // itinerary
  const itin = h('div', { class: 'card' }, [h('h2', {}, 'Itinerary')]);
  const stops = store.trip.stops;
  if (!stops.length) itin.append(h('p', { class: 'muted' }, 'Add the places or cities you plan to visit, in order.'));
  stops.forEach((s, i) => {
    // Inline editor when this stop is open for correction — fix a typo'd name or a wrong date.
    if (editStopId === s.id) {
      const t = h('input', { 'aria-label': 'Stop name', type: 'text', value: s.title });
      const dt = h('input', { 'aria-label': 'Stop date', type: 'date', value: s.date || '' });
      itin.append(h('div', { class: 'trip-stop', style: 'display:block' }, [
        h('div', { class: 'field' }, [h('label', {}, `Edit stop ${i + 1}`), t, dt]),
        h('div', { class: 'chips' }, [
          h('button', { class: 'btn', onclick: () => { updateStop(s.id, { title: t.value.trim() || s.title, date: dt.value }); editStopId = null; go('#trip'); } }, 'Save'),
          h('button', { class: 'btn ghost', onclick: () => { editStopId = null; render(); } }, 'Cancel'),
        ]),
      ]));
      return;
    }
    itin.append(h('div', { class: 'row-between trip-stop' }, [
      h('div', {}, [h('strong', {}, `${i + 1}. ${s.title}`), s.date ? h('div', { class: 'muted' }, s.date) : null]),
      h('div', { class: 'cats' }, [
        h('button', { class: 'chip', 'aria-label': 'Edit', onclick: () => { editStopId = s.id; render(); } }, '✎'),
        h('button', { class: 'chip', 'aria-label': 'Move up', disabled: i === 0 ? '' : null, onclick: () => { moveStop(s.id, -1); go('#trip'); } }, '↑'),
        h('button', { class: 'chip', 'aria-label': 'Move down', disabled: i === stops.length - 1 ? '' : null, onclick: () => { moveStop(s.id, 1); go('#trip'); } }, '↓'),
        h('button', { class: 'chip', 'aria-label': 'Remove', onclick: () => { if (confirm('Remove this stop?')) { removeStop(s.id); go('#trip'); } } }, '✕'),
      ]),
    ]));
  });
  const stopName = h('input', { 'aria-label': 'Stop name', type: 'text', placeholder: 'Place or city' });
  const stopDate = h('input', { 'aria-label': 'Stop date', type: 'date' });
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
  store.trip.budgetLog.forEach((b) => bud.append(budgetLogRow(b)));
  const bAmt = h('input', { 'aria-label': 'Amount', type: 'number', inputmode: 'decimal', placeholder: 'Amount' });
  const c = getCountry(activeCountry);
  const bCur = currencySelect(c ? c.currency : 'THB');
  const bNote = h('input', { 'aria-label': 'What the spend was on', type: 'text', placeholder: 'On what?' });
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
  const price = h('input', { 'aria-label': 'Asking price', type: 'number', inputmode: 'decimal', placeholder: 'Asking price' });
  const cur = currencySelect(c ? c.currency : 'THB');
  const ctx = selectEl(Object.entries(BARGAIN).map(([k, v]) => [k, v.label]), 'market', () => {}, 'What you are bargaining for');
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

  // Where to buy the everyday essentials cheapest, anchored to where the traveller is.
  const fc = focusSpot().spot.country || activeCountry;
  const fcName = (getCountry(fc) || {}).name || '';
  const ess = getEssentials(fc);
  if (ess && ess.items && ess.items.length) {
    const card = h('div', { class: 'card' }, [
      h('h2', { style: 'margin-top:0' }, `🛒 Cheapest essentials${fcName ? ' in ' + fcName : ''}`),
      ess.note ? h('p', { class: 'muted', style: 'margin:4px 0 8px' }, ess.note) : null,
    ]);
    ess.items.forEach((it) => card.append(h('div', { class: 'list-note' }, [
      h('strong', {}, `${it.icon || ''} ${it.item}: `), it.cheapest,
      it.price && it.price !== '—' ? h('span', { class: 'muted' }, ` (${it.price})`) : null,
    ])));
    const slug = citySlug(focusSpot().spot.city || '');
    if (getBoard(fc, slug)) card.append(h('button', { class: 'btn ghost block', style: 'margin-top:8px', onclick: () => go(`#board-${fc}-${slug}`) }, '📍 Local finds & markets near you'));
    card.append(h('button', { class: 'btn ghost block', style: 'margin-top:6px', onclick: () => go(`#prices-${fc}`) }, 'See fair prices'));
    wrap.append(card);
  }
  mount(wrap, '#home');
}

// A budget-log row that flips to an inline editor — used on both Expenses and My Trip so
// every logged spend can be corrected (amount, currency, note), not only deleted.
let editExpenseId = null;
function budgetLogRow(b) {
  if (editExpenseId === b.id) {
    const amt = h('input', { type: 'number', inputmode: 'decimal', value: b.amount });
    const cur = currencySelect(b.currency || 'THB');
    const note = h('input', { type: 'text', value: b.note || '', placeholder: 'On what?' });
    return h('div', { class: 'card', style: 'margin:6px 0' }, [
      field('Amount', amt), field('Currency', cur), field('On what?', note),
      h('div', { class: 'row-between', style: 'margin-top:6px' }, [
        h('button', { class: 'btn ghost', onclick: () => { editExpenseId = null; render(); } }, 'Cancel'),
        h('button', { class: 'btn', onclick: () => { updateBudgetItem(b.id, { amount: amt.value, currency: cur.value, note: note.value.trim() }); editExpenseId = null; render(); } }, 'Save'),
      ]),
    ]);
  }
  const approx = approxHome(b.amount, b.currency);
  return h('div', { class: 'row-between price-item' }, [
    h('span', {}, `${b.date} · ${b.note || 'spend'}`),
    h('span', {}, [
      h('strong', {}, `${b.amount} ${b.currency}`),
      approx ? h('span', { class: 'muted', style: 'font-size:12px' }, ` ${approx}`) : null, ' ',
      h('button', { class: 'chip', 'aria-label': 'Edit', onclick: () => { editExpenseId = b.id; render(); } }, '✎'), ' ',
      h('button', { class: 'chip', 'aria-label': 'Delete', onclick: () => { if (confirm('Delete this spend?')) { deleteBudgetItem(b.id); render(); } } }, '✕'),
    ]),
  ]);
}

// Quick expense logger for money-on-the-road — shares the same budget log as My Trip, so
// spends logged here show up there and roll into the home-currency total.
function expensesScreen() {
  const wrap = h('div', { class: 'screen' });
  wrap.append(topbar('Expenses & budget', '#home'));
  wrap.append(h('p', { class: 'muted' }, 'Log what you spend as you go — it converts to your home currency and feeds your trip budget.'));
  const home = homeCurrency();
  const fc = focusSpot().spot.country || activeCountry;
  const c = getCountry(fc);

  const bAmt = h('input', { 'aria-label': 'Amount', type: 'number', inputmode: 'decimal', placeholder: 'Amount' });
  const bCur = currencySelect(c ? c.currency : 'THB');
  const bNote = h('input', { 'aria-label': 'What the spend was on', type: 'text', placeholder: 'On what? (e.g. lunch, taxi, room)' });
  wrap.append(h('div', { class: 'card' }, [
    h('h2', { style: 'margin-top:0' }, 'Log a spend'),
    field('Amount', bAmt), field('Currency', bCur), field('On what?', bNote),
    h('button', { class: 'btn block', style: 'margin-top:8px', onclick: () => { if (bAmt.value) { addBudgetItem({ amount: bAmt.value, currency: bCur.value, note: bNote.value.trim() }); go('#expenses'); } } }, '＋ Add expense'),
  ]));

  const totals = {};
  store.trip.budgetLog.forEach((b) => { const cc = b.currency || '?'; totals[cc] = (totals[cc] || 0) + (parseFloat(b.amount) || 0); });
  if (Object.keys(totals).length) {
    const tot = h('div', { class: 'card' }, [h('h3', { style: 'margin-top:0' }, 'Total so far')]);
    tot.append(h('p', { class: 'fair' }, Object.entries(totals).map(([cc, v]) => `${v.toLocaleString()} ${cc}`).join(' · ')));
    let homeSum = 0, allKnown = true;
    for (const [cc, v] of Object.entries(totals)) { if (cc === home) { homeSum += v; continue; } const conv = convert(v, cc, home); if (conv == null || isNaN(conv)) allKnown = false; else homeSum += conv; }
    if (homeSum > 0 && Object.keys(totals).some((cc) => cc !== home)) tot.append(h('p', { class: 'muted', style: 'margin:-4px 0 0' }, `≈ ${Math.round(homeSum).toLocaleString()} ${home} total${allKnown ? '' : ' (some rates unknown — refresh in Currency)'}`));
    wrap.append(tot);
  }

  const log = store.trip.budgetLog.slice().reverse();
  if (log.length) {
    const list = h('div', { class: 'card' }, [h('h3', { style: 'margin-top:0' }, 'Recent')]);
    log.slice(0, 50).forEach((b) => list.append(budgetLogRow(b)));
    wrap.append(list);
  } else {
    wrap.append(h('p', { class: 'empty' }, 'No expenses logged yet — add your first above.'));
  }
  wrap.append(h('button', { class: 'btn ghost block', onclick: () => go('#trip') }, 'See full trip & budget'));
  mount(wrap, '#home');
}

// ---- PRE-TRIP CHECKLIST -----------------------------------------------------
const CK_CAT = { documents: '🛂 Documents', health: '💊 Health', money: '💳 Money', connectivity: '📶 Connectivity', packing: '🎒 Packing', safety: '🛡 Safety & laws' };

// Does the saved profile match a checklist item's `iff` descriptor? `true` means "set /
// non-empty"; a scalar matches by equality or, when the pref is an array, by membership.
function matchesProfile(iff, prefs) {
  if (!iff) return true;
  prefs = prefs || {};
  for (const [k, want] of Object.entries(iff)) {
    const have = prefs[k];
    if (want === true) {
      if (Array.isArray(have) ? have.length === 0 : !have) return false;
    } else if (Array.isArray(have)) {
      if (!have.includes(want)) return false;
    } else if (have !== want) {
      return false;
    }
  }
  return true;
}

// The full checklist for a country: its own items plus any profile-matched universal items.
function checklistFor(cc) {
  const prefs = store.profile.prefs || {};
  const base = CHECKLIST[cc] || [];
  const extra = (CHECKLIST_UNIVERSAL || []).filter((it) => matchesProfile(it.iff, prefs));
  return base.concat(extra).filter((it) => matchesProfile(it.iff, prefs));
}
function checklistScreen(countryId) {
  if (countryId) activeCountry = countryId;
  const wrap = h('div', { class: 'screen' });
  wrap.append(topbar('Pre-trip checklist', '#home'));
  wrap.append(countryChips((id) => go(`#checklist-${id}`)));
  const items = checklistFor(activeCountry);
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
        h('div', { class: 'grow' }, [
          h('strong', {}, [it.title, it.iff ? h('span', { class: 'for-you-tag' }, 'for you') : null]),
          it.detail ? h('div', { class: 'muted' }, it.detail) : null,
          it.link ? (it.link.startsWith('#')
            ? h('button', { class: 'linklike', onclick: (e) => { e.preventDefault(); go(it.link); } }, 'Open in app →')
            : h('a', { href: it.link, target: '_blank', rel: 'noopener' }, 'Official link ↗')) : null]),
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

// ---- SAFETY, MEDICAL, KOSHER & WORSHIP DATA --------------------------------
// Curated and self-hosted so every card renders fully offline. External links
// (maps, official sites) are enhancements that degrade gracefully with no signal.
// No phone numbers are hard-coded — an out-of-date emergency number is dangerous,
// so the national number (below) and the maps link (which resolves the exact
// venue live) are the source of truth. City-centre coordinates drive "nearest
// first"; they are for ordering and a map query, not a claim of a precise door.
function mapsSearch(q) { return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`; }
function nearestFirst(list, fix) {
  if (!fix || fix.lat == null) return list.slice();
  return list.slice().sort((a, b) => haversineKm(fix, { lat: a.lat, lng: a.lng }) - haversineKm(fix, { lat: b.lat, lng: b.lng }));
}
function kmLabel(km) { return km == null ? '' : (km < 1 ? '<1 km' : `${Math.round(km)} km`); }

// Reputable hospitals travellers and expats commonly use, tagged by capability so a
// family can find an ER, a children's ward or maternity care fast. Not exhaustive.
const HOSP_TAG = { er: '🚑 24h ER', peds: '🧒 Children', maternity: '🤰 Maternity', intl: '🌐 English / international' };
const HOSPITALS = [
  // Thailand
  { cc: 'th', city: 'Bangkok', lat: 13.7437, lng: 100.5548, name: 'Bumrungrad International Hospital', tags: ['er', 'peds', 'maternity', 'intl'] },
  { cc: 'th', city: 'Bangkok', lat: 13.7305, lng: 100.5690, name: 'Samitivej Sukhumvit Hospital', tags: ['er', 'peds', 'maternity', 'intl'], note: 'Has a dedicated children’s hospital.' },
  { cc: 'th', city: 'Bangkok', lat: 13.7247, lng: 100.5389, name: 'BNH Hospital', tags: ['er', 'maternity', 'intl'] },
  { cc: 'th', city: 'Chiang Mai', lat: 18.7965, lng: 98.9720, name: 'Chiang Mai Ram Hospital', tags: ['er', 'peds', 'maternity', 'intl'] },
  { cc: 'th', city: 'Phuket', lat: 7.8927, lng: 98.3699, name: 'Bangkok Hospital Phuket', tags: ['er', 'peds', 'maternity', 'intl'] },
  { cc: 'th', city: 'Koh Samui', lat: 9.5350, lng: 100.0620, name: 'Bangkok Hospital Samui', tags: ['er', 'intl'] },
  { cc: 'th', city: 'Krabi', lat: 8.0800, lng: 98.9060, name: 'Krabi Nakharin International Hospital', tags: ['er', 'intl'] },
  // Vietnam
  { cc: 'vi', city: 'Ho Chi Minh City', lat: 10.7290, lng: 106.7220, name: 'FV Hospital (Franco-Vietnamese)', tags: ['er', 'peds', 'maternity', 'intl'] },
  { cc: 'vi', city: 'Ho Chi Minh City', lat: 10.7846, lng: 106.6960, name: 'Family Medical Practice HCMC', tags: ['er', 'intl'], note: '24/7 international clinic with evacuation support.' },
  { cc: 'vi', city: 'Hanoi', lat: 20.9950, lng: 105.8680, name: 'Vinmec International Hospital (Times City)', tags: ['er', 'peds', 'maternity', 'intl'] },
  { cc: 'vi', city: 'Hanoi', lat: 21.0300, lng: 105.8130, name: 'Family Medical Practice Hanoi', tags: ['intl'] },
  { cc: 'vi', city: 'Da Nang', lat: 16.0600, lng: 108.2200, name: 'Vinmec Da Nang International Hospital', tags: ['er', 'peds', 'maternity', 'intl'] },
  // Cambodia
  { cc: 'kh', city: 'Phnom Penh', lat: 11.5800, lng: 104.8990, name: 'Royal Phnom Penh Hospital', tags: ['er', 'peds', 'maternity', 'intl'] },
  { cc: 'kh', city: 'Phnom Penh', lat: 11.5560, lng: 104.9280, name: 'Raffles Medical Phnom Penh', tags: ['er', 'intl'] },
  { cc: 'kh', city: 'Siem Reap', lat: 13.3670, lng: 103.8560, name: 'Royal Angkor International Hospital', tags: ['er', 'intl'] },
  { cc: 'kh', city: 'Siem Reap', lat: 13.3560, lng: 103.8590, name: 'Angkor Hospital for Children', tags: ['peds'], note: 'Renowned charitable children’s hospital.' },
  // Laos
  { cc: 'la', city: 'Vientiane', lat: 17.9660, lng: 102.6110, name: 'Alliance International Medical Centre', tags: ['er', 'intl'] },
  { cc: 'la', city: 'Vientiane', lat: 17.9610, lng: 102.6030, name: 'Mahosot Hospital', tags: ['er'], note: 'Public hospital. Serious cases are often stabilised then evacuated to Thailand (Udon Thani or Bangkok).' },
  { cc: 'la', city: 'Luang Prabang', lat: 19.8790, lng: 102.1470, name: 'Luang Prabang Provincial Hospital', tags: ['er'], note: 'Basic care. Serious cases are commonly evacuated to Vientiane or Thailand.' },
];

// Actually kosher — in this region that means Chabad houses (supervised), never
// "kosher-style". Each runs meals and/or a food shop for travellers.
const KOSHER = [
  { cc: 'th', city: 'Bangkok', lat: 13.7590, lng: 100.4970, name: 'Chabad House (Ohr Menachem), Khao San', offer: 'Kosher meat & dairy restaurants + food store', url: 'https://www.jewishthailand.com' },
  { cc: 'th', city: 'Bangkok', lat: 13.7380, lng: 100.5720, name: 'JCafe, Sukhumvit (Mille Malle)', offer: 'Kosher café', url: 'https://www.jewishthailand.com' },
  { cc: 'th', city: 'Chiang Mai', lat: 18.7900, lng: 98.9960, name: 'Chabad House Chiang Mai', offer: 'Kosher meat restaurant', url: 'https://www.jewishthailand.com' },
  { cc: 'th', city: 'Phuket', lat: 7.8280, lng: 98.3360, name: 'Chabad House Phuket', offer: 'Kosher meat & dairy + food store', url: 'https://www.jewishthailand.com' },
  { cc: 'th', city: 'Koh Samui', lat: 9.5350, lng: 100.0620, name: 'Chabad House Koh Samui', offer: 'Kosher meat & dairy restaurants', url: 'https://www.jewishthailand.com' },
  { cc: 'th', city: 'Koh Phangan', lat: 9.7320, lng: 100.0130, name: 'Chabad Koh Phangan', offer: 'Kosher meat restaurant', url: 'https://www.jewishthailand.com' },
  { cc: 'th', city: 'Pai', lat: 19.3590, lng: 98.4410, name: 'Chabad Pai', offer: 'Kosher meat restaurant (seasonal)', url: 'https://www.jewishthailand.com' },
  { cc: 'vi', city: 'Ho Chi Minh City', lat: 10.7880, lng: 106.6960, name: 'Chabad Jewish Center of Vietnam', offer: 'Kosher restaurant + meals for travellers', url: 'https://www.chabad.org/centers' },
  { cc: 'vi', city: 'Hanoi', lat: 21.0330, lng: 105.8500, name: 'Chabad of Hanoi', offer: 'Kosher meals for travellers', url: 'https://www.chabad.org/centers' },
  { cc: 'kh', city: 'Phnom Penh', lat: 11.5720, lng: 104.9300, name: 'Chabad Cambodia', offer: 'Kosher restaurant + food store (nationwide delivery)', url: 'https://www.jewishcambodia.com' },
  { cc: 'la', city: 'Luang Prabang', lat: 19.8900, lng: 102.1370, name: 'Chabad House Luang Prabang', offer: 'Kosher meat restaurant', url: 'https://www.chabad.org/centers' },
];

// Long-established, web-verified dedicated vegetarian / vegan kitchens (July 2026). Coordinates
// are neighbourhood-level (the Map link resolves the exact venue), so nearest-first ordering
// works without over-claiming precision. Only venues confirmed still operating and genuinely
// veg/vegan are listed — general eateries are never assumed to be vegetarian.
const VEG_SPOTS = [
  { cc: 'th', city: 'Bangkok', lat: 13.7597, lng: 100.4972, name: 'May Kaidee (Khao San)', offer: 'Thai vegan, since 1988', tags: ['vegan'] },
  { cc: 'th', city: 'Bangkok', lat: 13.7365, lng: 100.5805, name: 'Broccoli Revolution', offer: 'Plant-based, Sukhumvit / Thong Lo', tags: ['vegan'] },
  { cc: 'th', city: 'Bangkok', lat: 13.7585, lng: 100.4965, name: 'Ethos', offer: 'Vegetarian & raw, off Khao San', tags: ['vegetarian'] },
  { cc: 'th', city: 'Chiang Mai', lat: 18.7880, lng: 98.9930, name: 'May Kaidee Chiang Mai', offer: 'Thai vegan + cooking school', tags: ['vegan'] },
  { cc: 'vi', city: 'Ho Chi Minh City', lat: 10.7860, lng: 106.6990, name: 'Hum Vegetarian', offer: 'Vegetarian fine dining, District 1/3', tags: ['vegetarian'] },
  { cc: 'vi', city: 'Hanoi', lat: 21.0208, lng: 105.8490, name: 'Ưu Đàm Chay', offer: 'Vegetarian, Hoàn Kiếm (55 Nguyễn Du)', tags: ['vegetarian'] },
  { cc: 'kh', city: 'Siem Reap', lat: 13.3540, lng: 103.8560, name: 'Chamkar', offer: 'Khmer vegetarian, Old Market', tags: ['vegetarian'] },
];

// Diet-aware "where you can actually eat" card for the traveller's declared diet: verified
// kosher (Chabad) and/or vegetarian/vegan venues, nearest-first, plus an honest halal note.
// Returns null when the profile needs none. opts.only = 'veg' | 'kosher' to show one section.
function dietEatCard(cc, fix, opts) {
  opts = opts || {};
  const diet = store.profile.prefs.diet || [];
  const wantKosher = diet.includes('kosher') && opts.only !== 'veg';
  const wantVeg = (diet.includes('vegan') || diet.includes('vegetarian')) && opts.only !== 'kosher';
  const wantHalal = diet.includes('halal') && !opts.only;
  if (!wantKosher && !wantVeg && !wantHalal) return null;
  const card = h('div', { class: 'card allergy-card', style: 'margin:12px 0' }, [h('h2', { style: 'margin-top:0' }, '🍽 Where you can eat')]);
  const kmOf = (v) => (fix && fix.lat != null && v.lat != null) ? haversineKm(fix, { lat: v.lat, lng: v.lng }) : null;
  const venueRow = (name, city, offer, km, tag) => h('div', { style: 'margin:6px 0' }, [
    h('div', { class: 'row-between' }, [h('strong', {}, name), km != null ? h('span', { class: 'fair' }, kmLabel(km)) : null]),
    h('div', { class: 'muted tiny', style: 'margin:2px 0 4px' }, `${city}${offer ? ' · ' + offer : ''}`),
    h('div', { class: 'chips' }, [tag ? attrTag(tag) : null, h('a', { class: 'chip', href: mapsSearch(`${name} ${city}`), target: '_blank', rel: 'noopener' }, 'Map ↗')]),
  ]);
  if (wantVeg) {
    card.append(h('h3', { style: 'margin:6px 0 2px' }, '🌱 Vegetarian & vegan'));
    const vs = nearestFirst(VEG_SPOTS.filter((v) => v.cc === cc), fix);
    if (vs.length) {
      vs.slice(0, 8).forEach((v) => card.append(venueRow(v.name, v.city, v.offer, kmOf(v), (v.tags || []).includes('vegan') ? '🌱 Vegan' : '🥗 Vegetarian')));
    } else {
      card.append(h('p', { class: 'muted tiny', style: 'margin:2px 0' }, 'No dedicated veg kitchen is listed for this country yet. Many local kitchens cook to order — ask for the vegetarian version and use the dish guide’s green/red verdicts.'));
    }
    card.append(h('p', { class: 'muted tiny', style: 'margin:6px 0 0' }, 'These are verified vegetarian/vegan kitchens. General eateries are not checked — confirm on arrival, especially fish sauce, oyster sauce and egg.'));
  }
  if (wantKosher) {
    card.append(h('h3', { style: 'margin:10px 0 2px' }, '✡️ Kosher (Chabad houses)'));
    const kv = nearestFirst(KOSHER.filter((k) => k.cc === cc), fix);
    (kv.length ? kv : nearestFirst(KOSHER, fix)).slice(0, 6).forEach((k) => card.append(venueRow(k.name, k.city, k.offer, kmOf(k), null)));
    card.append(h('p', { class: 'muted tiny', style: 'margin:6px 0 0' }, 'Reliably kosher food is served by Chabad houses. Anything sold only as “kosher-style” is not certified — always confirm supervision.'));
  }
  if (wantHalal) {
    card.append(h('h3', { style: 'margin:10px 0 2px' }, '🕌 Halal'));
    card.append(h('p', { class: 'muted tiny', style: 'margin:2px 0 0' }, 'Halal food is widely available near mosques and in Muslim quarters. Look for the green halal sign, and ask “halal?” — the app’s pork-free phrase is in the phrasebook.'));
  }
  return card;
}

// Verified pork-free phrase (kosher, halal and no-pork travellers). Only languages whose
// script is verified against a reliable source are included (Thai, Vietnamese, Lao — Lao
// from Wikivoyage); Khmer falls back to English because no reliable source confirmed the
// phrase, so nothing wrong is ever shown. Shellfish avoidance is covered by ALLERGENS.
const DIET_PHRASES = {
  'no-pork': {
    en: 'No pork, please',
    langs: {
      th: { script: 'ไม่กินหมู', roman: 'mâi gin mŭu' },
      vi: { script: 'Không ăn thịt heo', roman: 'khong an thit heo' },
      lo: { script: 'ຂ້ອຍບໍ່ກິນເນື້ອໝູ', roman: 'khoi baw kin neua moo' },
    },
  },
};

// Notable houses of worship across faiths in the main cities. A starting point,
// not a full directory; the worship screen also offers a "find one near me" search
// for anywhere not listed.
const WORSHIP_FAITH = { buddhist: '☸️ Buddhist', christian: '✝️ Christian', muslim: '☪️ Muslim', hindu: '🕉️ Hindu', jewish: '✡️ Jewish' };
const WORSHIP_SEARCH = { buddhist: 'Buddhist temple', christian: 'church', muslim: 'mosque', hindu: 'Hindu temple', jewish: 'synagogue' };
const WORSHIP = [
  // Bangkok
  { cc: 'th', city: 'Bangkok', lat: 13.7465, lng: 100.4931, faith: 'buddhist', name: 'Wat Pho (Temple of the Reclining Buddha)' },
  { cc: 'th', city: 'Bangkok', lat: 13.7269, lng: 100.5140, faith: 'christian', name: 'Assumption Cathedral (Catholic)' },
  { cc: 'th', city: 'Bangkok', lat: 13.7218, lng: 100.5140, faith: 'muslim', name: 'Haroon Mosque, Bang Rak' },
  { cc: 'th', city: 'Bangkok', lat: 13.7248, lng: 100.5163, faith: 'hindu', name: 'Sri Maha Mariamman Temple (Wat Khaek), Silom' },
  { cc: 'th', city: 'Bangkok', lat: 13.7590, lng: 100.4970, faith: 'jewish', name: 'Chabad Ohr Menachem / synagogue, Khao San' },
  // Chiang Mai
  { cc: 'th', city: 'Chiang Mai', lat: 18.8048, lng: 98.9217, faith: 'buddhist', name: 'Wat Phra That Doi Suthep' },
  { cc: 'th', city: 'Chiang Mai', lat: 18.7877, lng: 98.9967, faith: 'muslim', name: 'Ban Haw Mosque (Matsayit Chiang Mai)' },
  { cc: 'th', city: 'Chiang Mai', lat: 18.7900, lng: 98.9960, faith: 'jewish', name: 'Chabad House Chiang Mai' },
  // Phuket
  { cc: 'th', city: 'Phuket', lat: 7.8464, lng: 98.3381, faith: 'buddhist', name: 'Wat Chalong' },
  { cc: 'th', city: 'Phuket', lat: 7.8830, lng: 98.3870, faith: 'muslim', name: 'Phuket Central Mosque (Masjid Mukaram)' },
  // Ho Chi Minh City
  { cc: 'vi', city: 'Ho Chi Minh City', lat: 10.7797, lng: 106.6990, faith: 'christian', name: 'Notre-Dame Cathedral Basilica of Saigon' },
  { cc: 'vi', city: 'Ho Chi Minh City', lat: 10.7900, lng: 106.6810, faith: 'buddhist', name: 'Vinh Nghiem Pagoda' },
  { cc: 'vi', city: 'Ho Chi Minh City', lat: 10.7690, lng: 106.6940, faith: 'hindu', name: 'Mariamman Hindu Temple' },
  { cc: 'vi', city: 'Ho Chi Minh City', lat: 10.7710, lng: 106.6960, faith: 'muslim', name: 'Saigon Central Mosque (Jamia Al-Musulman)' },
  // Da Nang
  { cc: 'vi', city: 'Da Nang', lat: 16.1000, lng: 108.2790, faith: 'buddhist', name: 'Linh Ung Pagoda (Son Tra)' },
  { cc: 'vi', city: 'Da Nang', lat: 16.0670, lng: 108.2220, faith: 'christian', name: 'Da Nang Cathedral (Con Ga Church)' },
  // Hanoi
  { cc: 'vi', city: 'Hanoi', lat: 21.0450, lng: 105.8350, faith: 'buddhist', name: 'Tran Quoc Pagoda' },
  { cc: 'vi', city: 'Hanoi', lat: 21.0288, lng: 105.8490, faith: 'christian', name: 'St Joseph’s Cathedral' },
  { cc: 'vi', city: 'Hanoi', lat: 21.0300, lng: 105.8500, faith: 'muslim', name: 'Al-Noor Mosque, Hang Luoc' },
  // Phnom Penh
  { cc: 'kh', city: 'Phnom Penh', lat: 11.5764, lng: 104.9282, faith: 'buddhist', name: 'Wat Phnom' },
  { cc: 'kh', city: 'Phnom Penh', lat: 11.5620, lng: 104.9190, faith: 'muslim', name: 'Al-Serkal Mosque (Central Mosque)' },
  { cc: 'kh', city: 'Phnom Penh', lat: 11.5720, lng: 104.9300, faith: 'jewish', name: 'Chabad Cambodia (synagogue), Sisowath Quay' },
  // Siem Reap
  { cc: 'kh', city: 'Siem Reap', lat: 13.3540, lng: 103.8560, faith: 'buddhist', name: 'Wat Preah Prom Rath' },
  // Vientiane
  { cc: 'la', city: 'Vientiane', lat: 17.9660, lng: 102.6120, faith: 'buddhist', name: 'Wat Si Saket' },
  { cc: 'la', city: 'Vientiane', lat: 17.9560, lng: 102.6100, faith: 'muslim', name: 'Azhar Mosque, Vientiane' },
  // Luang Prabang
  { cc: 'la', city: 'Luang Prabang', lat: 19.8945, lng: 102.1400, faith: 'buddhist', name: 'Wat Xieng Thong' },
  { cc: 'la', city: 'Luang Prabang', lat: 19.8900, lng: 102.1370, faith: 'jewish', name: 'Chabad House Luang Prabang' },
];

// General first aid for the region's real hazards, aligned with mainstream medical
// advice (WHO / Red Cross / St John). Guidance only — not a substitute for a doctor.
// In a serious emergency, call the national number above and get to a hospital.
const FIRST_AID = [
  { t: '🐍 Snake bite', do: [
      'Move out of the snake’s reach; keep the person calm and as still as possible — panic and movement speed venom through the body.',
      'Keep the bitten limb still and roughly at heart level; splint it if you can.',
      'Remove rings, watches and tight clothing before swelling starts.',
      'Note the snake’s colour, size and shape, or photograph it from a safe distance — it helps doctors choose the antivenom.',
      'Get to a hospital immediately and call the emergency number. Hospitals across the region stock antivenom; reaching one fast is what saves lives.',
    ], dont: [
      'Do not cut the wound or try to suck out the venom.',
      'Do not apply a tight tourniquet, ice, alcohol or an electric shock.',
      'Do not chase or try to kill the snake, and do not wait to “see if it was venomous”.',
    ] },
  { t: '🪼 Jellyfish & marine stings', do: [
      'Get out of the water. Douse the sting with vinegar for at least 30 seconds — many beaches keep a bottle for this.',
      'Lift off any tentacles with the edge of a card or a gloved hand.',
      'For a stonefish, stingray or sea-urchin wound, soak the area in water as hot as can be comfortably tolerated.',
      'Treat any difficulty breathing, chest pain or collapse as life-threatening, start CPR if needed, and call for help — box jellyfish stings can kill within minutes.',
    ], dont: [
      'Do not rub the area or rinse with fresh water — it can fire more stinging cells.',
      'Do not use urine.',
    ] },
  { t: '🐝 Severe allergic reaction (anaphylaxis)', do: [
      'Signs: swelling of the lips, tongue or throat, trouble breathing, widespread hives, or dizziness or collapse after a sting, food or medicine.',
      'If an adrenaline auto-injector (EpiPen) is available, use it at once into the outer thigh, then call emergency services.',
      'Lay the person flat and raise their legs; if breathing is hard, let them sit up. A second dose may be needed after 5–15 minutes.',
      'Get to a hospital even if they improve — symptoms can return hours later.',
    ], dont: [
      'Do not make them stand up or walk around.',
      'Do not wait for symptoms to worsen before using adrenaline.',
    ] },
];

// Honest guidance on the two life-saving needs travellers ask about most. Neither is
// reliably purchasable on the street here, so the advice is about preparation and where
// the real help is — not a fabricated "nearest shop".
const LIFESAVING = [
  { t: '💉 Adrenaline auto-injectors (EpiPen)', body: [
      'Auto-injectors are hard to buy in Thailand, Vietnam, Cambodia and Laos and are often unavailable outside major private hospitals.',
      'If you are at risk of anaphylaxis, bring at least two from home, carry them on your person (not in checked luggage) and keep them out of extreme heat.',
      'In an emergency, hospital emergency rooms and ambulances carry injectable adrenaline given by staff — reaching one fast matters more than finding a pharmacy.',
      'To try to buy one locally, ask the pharmacy of a large international hospital (for example Bumrungrad or Samitivej in Bangkok). Availability is not guaranteed — telephone ahead.',
    ] },
  { t: '❤️ Defibrillators (AED) & CPR', body: [
      'Public AEDs are not widely mapped in the region. You are most likely to find one at international airports, large shopping malls, five-star hotels and hospitals — ask staff or security.',
      'If someone collapses and is not breathing normally, send someone to call the emergency number and fetch an AED, then start hands-only CPR: push hard and fast in the centre of the chest, about twice a second, until help arrives.',
    ] },
];

// Authorities behind the safety, medical, kosher and worship data. Cited in-app with
// the shared sourcesNote() renderer so a traveller can check the primary source.
const FIRSTAID_SOURCES = [
  { org: 'World Health Organization — snakebite envenoming', url: 'https://www.who.int/news-room/fact-sheets/detail/snakebite-envenoming' },
  { org: 'IFRC / Red Cross first aid', url: 'https://www.ifrc.org/our-work/health-and-care/first-aid' },
];
const HOSP_SOURCES = [
  { org: 'Joint Commission International (hospital accreditation)', url: 'https://www.jointcommissioninternational.org' },
];
const DANGER_SOURCES = [
  { org: 'World Health Organization — snakebite envenoming', url: 'https://www.who.int/news-room/fact-sheets/detail/snakebite-envenoming' },
  { org: 'Species photos: Wikimedia Commons (CC BY-SA, credited per image)', url: 'https://commons.wikimedia.org' },
];
const KOSHER_SOURCES = [
  { org: 'Chabad of Thailand (JewishThailand.com)', url: 'https://www.jewishthailand.com' },
  { org: 'Chabad of Cambodia (JewishCambodia.com)', url: 'https://www.jewishcambodia.com' },
  { org: 'Chabad center directory', url: 'https://www.chabad.org/centers' },
];
const WORSHIP_SOURCES = [
  { org: 'OpenStreetMap contributors', url: 'https://www.openstreetmap.org/copyright' },
];

// Solo & women travellers — practical, non-alarmist guidance. General advice reflects
// mainstream travel-safety consensus; per-country notes cover the region's real risks
// (traffic, snatch-theft, nightlife) rather than stoking fear. Useful to everyone.
const SOLO_SAFETY = {
  general: [
    'Thailand, Vietnam, Cambodia and Laos are, by global standards, among the safer places to travel solo — including for women. Ordinary city precautions apply; violent crime against tourists is rare and opportunistic theft is the main risk.',
    'Use booked ride apps (Grab, Bolt) or metered taxis rather than unmarked cars, especially at night, and check the plate before getting in. Share your live trip with someone you trust.',
    'Choose accommodation with strong recent reviews and 24-hour reception; a door that locks from the inside, and a padlock for hostel lockers, are worth it.',
    'Watch your drink at bars and parties — drink-spiking happens at some nightlife spots. Keep enough phone charge and a little cash for a ride home.',
    'Dress modestly at temples (shoulders and knees covered) and more conservatively in rural and Muslim-majority areas; it draws less attention and respects local custom.',
    'Trust your instincts — it is always fine to be firm, say no, or walk away. Save the tourist-police and your embassy numbers offline before you need them.',
  ],
  th: [
    'Bangkok’s BTS and MRT and the inter-city VIP buses and trains are reliable; on overnight trains you can request a lower berth when booking.',
    'On the islands, take care at Full Moon-style parties: go with people you trust, mind your drink, and arrange your return boat or taxi in advance.',
    'Rent a scooter only with the correct licence and a helmet — road injuries are the single biggest real risk to travellers here.',
  ],
  vi: [
    'Use Grab (car or bike) in cities and insist on a helmet on bike taxis. Traffic is the main hazard — cross slowly and steadily so riders can flow around you.',
    'Carry bags on the pavement side and keep phones away from the kerb; snatch-thefts from passing motorbikes happen in Ho Chi Minh City and Hanoi.',
  ],
  kh: [
    'In Phnom Penh, bag-snatching from passing motorbikes is the main risk: wear bags across the body on the side away from the road, and keep your phone out of sight near traffic.',
    'Use Grab or the PassApp for tuk-tuks and cars, so the fare and route are logged.',
  ],
  la: [
    'Laos is very relaxed and low-crime, but towns wind down early — plan transport before dark, especially in rural areas where lighting and taxis are scarce.',
    'On tubing or river days around Vang Vieng, be careful with alcohol near fast water; this is the main cause of traveller injuries.',
  ],
};
const SOLO_SOURCES = [
  { org: 'National tourist police & government travel advisories', url: 'https://www.gov.uk/foreign-travel-advice' },
];

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

  // ORDER OF OPERATIONS. If something happens the traveller needs, in this order:
  //   (1) call for help, (2) where to go — the nearest hospital, (3) what to do while
  //   getting there — first aid and life-saving basics, and only THEN (4) how to
  //   communicate once at the hospital. Each card is BUILT here; the ordered append is at
  //   the end so the sequence on screen matches the real emergency flow. Preventive
  //   background (water/food, solo safety) sits below all of that.
  const book = getLanguage(c.lang);
  const emCat = book && book.categories.find((cat) => cat.id === 'emergency');

  // (1) Call for help — emergency numbers.
  const nums = h('div', { class: 'card sos-card' }, [h('h2', {}, `${c.flag} ${c.name} — call for help`)]);
  const em = (c.info && c.info.emergency) || [];
  if (em.length) em.forEach((e) => nums.append(h('a', { class: 'btn block sos-num', href: `tel:${String(e.number).replace(/\s/g, '')}` }, `${e.label}: ${e.number}`)));
  else nums.append(h('p', { class: 'muted' }, 'Emergency numbers are being added for this country.'));

  // (2) Where to go — the nearest hospital first. The maps deep link needs internet, so
  // pair it with an offline fallback: show a big "I need a hospital" phrase to a local.
  const hosp = h('div', { class: 'card' }, [h('h2', {}, 'Get to a hospital — nearest you')]);
  const mapHref = (fix && fix.lat != null)
    ? `https://www.google.com/maps/search/hospital/@${fix.lat},${fix.lng},14z`
    : 'https://www.google.com/maps/search/?api=1&query=hospital%20near%20me';
  hosp.append(h('a', { class: 'btn block', href: mapHref, target: '_blank', rel: 'noopener' }, 'Find nearest hospital (needs internet) ↗'));
  const hospPhrase = emCat && (emCat.phrases.find((p) => /hospital/i.test(p.en)) || emCat.phrases.find((p) => /doctor/i.test(p.en)));
  if (hospPhrase) hosp.append(h('button', { class: 'btn ghost block', style: 'margin-top:8px', onclick: () => showBigPhrase(hospPhrase, book.locale) }, '🪧 Show “I need a hospital” to a local (works offline)'));

  // Reputable hospitals in the country, nearest first, tagged so a family can find an ER,
  // a children's ward or maternity care fast. The map link routes to the exact door; call
  // ahead — in a life-threatening emergency use the number above.
  const localHosp = nearestFirst(HOSPITALS.filter((x) => x.cc === activeCountry), fix);
  if (localHosp.length) {
    hosp.append(h('p', { class: 'muted', style: 'margin:12px 0 4px' }, `Trusted hospitals in ${c.name}, nearest first — for adults, children, babies and pregnancy. Most have English-speaking staff.`));
    localHosp.forEach((x) => {
      const km = (fix && fix.lat != null) ? haversineKm(fix, { lat: x.lat, lng: x.lng }) : null;
      hosp.append(h('div', { class: 'card sos-hosp', style: 'margin:6px 0' }, [
        h('div', { class: 'row-between' }, [h('strong', {}, x.name), km != null ? h('span', { class: 'fair' }, kmLabel(km)) : null]),
        h('div', { class: 'muted tiny', style: 'margin:2px 0 4px' }, x.city + (x.note ? ` · ${x.note}` : '')),
        h('div', { class: 'chips' }, (x.tags || []).map((t) => h('span', { class: 'cat-tag' }, HOSP_TAG[t] || t))),
        h('a', { class: 'btn ghost block', style: 'margin-top:6px', href: mapsSearch(`${x.name} ${x.city}`), target: '_blank', rel: 'noopener' }, 'Open in maps ↗'),
      ]));
    });
    hosp.append(h('p', { class: 'tiny muted', style: 'margin-top:4px' }, 'A starting list, not exhaustive. For a young child, pregnancy or complex needs, telephone ahead to confirm the right department is open.'));
  }

  // (3) What to do while getting there — bites/stings first aid, then life-saving basics.
  const danger = h('div', { class: 'card allergy-card' }, [h('h2', {}, '🐍 Bites, stings & dangerous wildlife')]);
  danger.append(h('p', { class: 'muted tiny', style: 'margin:2px 0 6px' }, 'What to do first — then get to a hospital. General first aid, not a substitute for a doctor.'));
  FIRST_AID.forEach((fa) => {
    const dd = h('details', { class: 'filters-collapse' }, [h('summary', {}, fa.t)]);
    const inner = h('div', {});
    inner.append(h('p', { class: 'tiny', style: 'margin:6px 0 0' }, [h('strong', {}, 'Do')]));
    inner.append(h('ul', { class: 'sos-aid' }, fa.do.map((li) => h('li', {}, li))));
    if (fa.dont && fa.dont.length) {
      inner.append(h('p', { class: 'tiny', style: 'margin:6px 0 0' }, [h('strong', {}, 'Do not')]));
      inner.append(h('ul', { class: 'sos-aid dont' }, fa.dont.map((li) => h('li', {}, li))));
    }
    dd.append(inner);
    danger.append(dd);
  });
  danger.append(h('button', { class: 'btn block', style: 'margin-top:8px', onclick: () => go('#danger') }, '⚠️ Dangerous animals — photos & how to spot them'));

  // Life-saving essentials: honest guidance on EpiPens and defibrillators (neither is
  // reliably bought on the street here) plus hands-only CPR.
  const life = h('div', { class: 'card' }, [h('h2', {}, '💉 Life-saving essentials')]);
  LIFESAVING.forEach((ls) => {
    const dd = h('details', { class: 'filters-collapse' }, [h('summary', {}, ls.t)]);
    const inner = h('div', {});
    ls.body.forEach((p) => inner.append(h('p', { class: 'tiny', style: 'margin:6px 0' }, p)));
    dd.append(inner);
    life.append(dd);
  });

  // (4) How to communicate once you are there — emergency phrases in the local language.
  let phraseCard = null;
  if (emCat) {
    phraseCard = h('div', { class: 'card' }, [
      h('h2', {}, `At the hospital: say it in ${book.label}`),
      h('p', { class: 'muted tiny', style: 'margin:2px 0 6px' }, 'Show or speak these to hospital staff or anyone helping you.'),
    ]);
    const voiceOk = hasVoiceFor(book.locale);
    emCat.phrases.forEach((p) => phraseCard.append(h('div', { class: 'phrase' }, [
      h('div', { class: 'grow' }, [h('div', { class: 'en' }, p.en), h('div', { class: 'native', lang: book.locale }, p.script), h('div', { class: 'roman' }, [h('span', { class: 'lbl' }, 'say:'), p.roman])]),
      h('button', { class: 'speak', disabled: voiceOk ? null : '', 'aria-label': `Speak ${p.en}`, onclick: () => speak(p.script, book.locale) }, '🔊'),
    ])));
  }

  // Preventive / background info — kept below the live emergency flow.
  const safe = SAFETY[activeCountry];
  const safeCard = safe ? h('div', { class: 'card' }, [
    h('h2', {}, 'Water & food safety'),
    h('p', { style: 'margin:6px 0' }, [h('strong', {}, '💧 Water: '), safe.water]),
    h('p', { style: 'margin:6px 0 0' }, [h('strong', {}, '🍢 Food: '), safe.food]),
  ]) : null;

  // Solo & women travellers — practical, non-alarmist safety, opened by default when the
  // profile says solo/solo-female. Shown to everyone; the region's real risks are traffic,
  // snatch-theft and nightlife, not stranger violence.
  const soloOn = store.profile.prefs.soloFemale || store.profile.prefs.party === 'solo';
  const solo = h('div', { class: 'card' }, [h('h2', {}, '🧭 Solo & women travellers')]);
  const sd = h('details', { class: 'filters-collapse', open: soloOn ? '' : null }, [
    h('summary', {}, soloOn ? 'Staying safe on your own — tailored for you' : 'Staying safe on your own'),
  ]);
  const sInner = h('div', {});
  sInner.append(h('ul', { class: 'sos-aid' }, SOLO_SAFETY.general.map((li) => h('li', {}, li))));
  const cSolo = SOLO_SAFETY[activeCountry];
  if (cSolo) {
    sInner.append(h('p', { class: 'tiny', style: 'margin:8px 0 0' }, [h('strong', {}, `In ${c.name}`)]));
    sInner.append(h('ul', { class: 'sos-aid' }, cSolo.map((li) => h('li', {}, li))));
  }
  sInner.append(sourcesNote(SOLO_SOURCES, 'July 2026'));
  sd.append(sInner);
  solo.append(sd);

  // Ordered append — the true order of operations in an emergency.
  wrap.append(nums);
  wrap.append(hosp);
  wrap.append(danger);
  wrap.append(life);
  if (phraseCard) wrap.append(phraseCard);
  if (safeCard) wrap.append(safeCard);
  wrap.append(solo);

  wrap.append(sourcesNote([...HOSP_SOURCES, ...FIRSTAID_SOURCES], 'July 2026'));
  wrap.append(h('p', { class: 'disclaimer' }, 'In a serious emergency, call the number above. Show this screen to a local to ask for help. Tourist police often speak English. First-aid guidance here is general and does not replace professional medical care.'));
  mount(wrap, '#home');
}

// The region's dangerous animals, drawn from the wildlife library — each entry already
// carries a photo, how to identify it, and what to do if bitten or stung. Grouped so a
// traveller can scan snakes, marine hazards and the rest at a glance.
// Mosquito-borne illness — dengue is the biggest real health risk to travellers here.
// SEASONAL guidance only (verified peak months per country); there is no reliable free
// real-time case feed, so the card says so and points to official advisories.
const MOSQUITO_PEAK = { th: [6, 7, 8, 9, 10], vi: [6, 7, 8, 9, 10, 11], kh: [5, 6, 7, 8, 9, 10], la: [5, 6, 7, 8, 9, 10] };
const MOSQUITO_NAME = { th: 'Thailand', vi: 'Vietnam', kh: 'Cambodia', la: 'Laos' };
const MOSQUITO_PREVENT = [
  'Use a repellent with DEET (20-30%) or picaridin on exposed skin and reapply — the Aedes mosquitoes that carry dengue bite by DAY, peaking in early morning and late afternoon.',
  'Cover up at dawn and dusk with loose long sleeves and trousers, and sleep with air-conditioning, window screens or a net.',
  'Tip out or cover any standing water where you are staying (buckets, plant saucers, old tyres) — that is where these mosquitoes breed.',
  'See a doctor for any high fever, severe headache or aching joints during or after your trip. Dengue needs rest, fluids and monitoring; avoid aspirin and ibuprofen, and get urgent care for warning signs such as bleeding, severe abdominal pain or persistent vomiting.',
];
const MOSQUITO_SOURCES = [
  { org: 'WHO — Dengue and severe dengue', url: 'https://www.who.int/health-topics/dengue-and-severe-dengue' },
  { org: 'CDC Travelers’ Health', url: 'https://wwwnc.cdc.gov/travel' },
];
function mosquitoCard() {
  const m = new Date().getMonth() + 1;
  const hot = Object.keys(MOSQUITO_PEAK).filter((cc) => MOSQUITO_PEAK[cc].includes(m)).map((cc) => MOSQUITO_NAME[cc]);
  const card = h('div', { class: 'card mosquito-card' }, [h('h2', { style: 'margin-top:0' }, '🦟 Mosquitoes & dengue')]);
  card.append(h('p', {}, 'Dengue fever is the most common serious mosquito-borne illness across all four countries. It is spread by day-biting Aedes mosquitoes and rises sharply in the rainy season.'));
  card.append(h('p', { class: hot.length ? 'mkt-status off' : 'mkt-status on' },
    hot.length ? `⚠️ Dengue risk is elevated this month in: ${hot.join(', ')}` : 'Lower-risk month across the region — but dengue occurs year-round, so keep up prevention.'));
  card.append(h('h3', {}, 'When it peaks'));
  Object.keys(MOSQUITO_PEAK).forEach((cc) => {
    const on = MOSQUITO_PEAK[cc].includes(m);
    card.append(h('div', { class: 'list-note' }, `${MOSQUITO_NAME[cc]}: peak ${formatMonths(MOSQUITO_PEAK[cc])}${on ? ' · elevated now' : ''}`));
  });
  card.append(h('h3', {}, 'Protect yourself'));
  MOSQUITO_PREVENT.forEach((t) => card.append(h('div', { class: 'list-note' }, t)));
  card.append(h('h3', {}, 'Other mosquito-borne illness'));
  card.append(h('div', { class: 'list-note' }, 'Malaria is a risk mainly in rural, forested and some border areas (not the big cities), spread by night-biting mosquitoes — ask a travel clinic about prophylaxis for those regions.'));
  card.append(h('div', { class: 'list-note' }, 'Japanese encephalitis (rural rice-farming areas in the wet season) and Zika are also present; consider vaccination for long or rural stays, and pregnant travellers should seek specific advice.'));
  card.append(sourcesNote(MOSQUITO_SOURCES, 'July 2026'));
  card.append(h('p', { class: 'muted small' }, 'Seasonal guidance only — there is no reliable real-time case feed here. Check your government travel-health advisory and a travel clinic before you go.'));
  return card;
}

function dangerScreen() {
  const wrap = h('div', { class: 'screen' });
  wrap.append(topbar('Health & wildlife hazards', '#sos'));
  wrap.append(mosquitoCard());
  wrap.append(h('p', { class: 'map-hint' }, 'Know what to avoid and what to do. Tap any animal for a photo, how to identify it, and first aid if you are bitten or stung. If in doubt, keep your distance and get to a hospital.'));
  const list = allSpecies().filter((s) => s.dangerous);
  const groups = [
    { label: '🐍 Snakes', match: (s) => /cobra|krait|viper|python|snake/i.test(s.commonName) },
    { label: '🌊 In the sea', match: (s) => /jellyfish|stonefish|lionfish|ray|triggerfish|urchin/i.test(s.commonName) },
    { label: '🦂 Scorpions & centipedes', match: (s) => /scorpion|centipede/i.test(s.commonName) },
    { label: '🐒 Larger animals', match: (s) => /macaque|elephant|boar|dog|buffalo/i.test(s.commonName) },
  ];
  const shown = new Set();
  groups.forEach((g) => {
    const items = list.filter((s) => g.match(s) && !shown.has(s.id));
    if (!items.length) return;
    items.forEach((s) => shown.add(s.id));
    wrap.append(h('h2', { class: 'home-section' }, g.label));
    items.forEach((s) => wrap.append(speciesCard(s)));
  });
  const rest = list.filter((s) => !shown.has(s.id));
  if (rest.length) { wrap.append(h('h2', { class: 'home-section' }, '⚠️ Other hazards')); rest.forEach((s) => wrap.append(speciesCard(s))); }
  if (!list.length) wrap.append(h('p', { class: 'empty' }, 'The wildlife library is still downloading — reconnect once to fetch it.'));
  wrap.append(sourcesNote(DANGER_SOURCES, 'July 2026'));
  wrap.append(h('p', { class: 'disclaimer' }, 'Most animals leave you alone if you leave them alone. Wear shoes at night, do not reach into holes or thick leaf litter, and never handle or corner wildlife.'));
  mount(wrap, '#sos');
}

// Places of worship across faiths — notable landmarks in the main cities, nearest
// first, plus a "find one near me" search for anywhere not listed.
function worshipScreen(cc) {
  const wrap = h('div', { class: 'screen' });
  wrap.append(topbar('Places of worship', '#home'));
  const fix = getLastFix();
  const near = fix ? nearestSpotGlobal(fix) : null;
  if (cc) activeCountry = cc;
  else if (near) activeCountry = near.spot.country;
  const c = getCountry(activeCountry);
  wrap.append(countryChips((id) => go(`#worship-${id}`)));
  wrap.append(h('p', { class: 'map-hint' }, 'Notable temples, churches, mosques, synagogues and Hindu temples — tap to open in maps and confirm prayer or service times. Not a full directory; use the search below for anywhere not listed.'));

  wrap.append(h('div', { class: 'card' }, [
    h('h2', { style: 'margin-top:0' }, 'Find a place of worship near me'),
    h('p', { class: 'muted tiny', style: 'margin:2px 0 6px' }, 'Opens a live map search (needs internet).'),
    h('div', { class: 'chips' }, Object.keys(WORSHIP_FAITH).map((f) =>
      h('a', { class: 'chip', href: mapsSearch(`${WORSHIP_SEARCH[f]} near me`), target: '_blank', rel: 'noopener' }, `${WORSHIP_FAITH[f]} ↗`))),
  ]));

  const local = nearestFirst(WORSHIP.filter((w) => !c || w.cc === activeCountry), fix);
  if (!local.length) { wrap.append(h('p', { class: 'empty' }, 'No landmarks listed for this country yet — use the search above to find one near you.')); mount(wrap, '#home'); return; }
  const byCity = {};
  local.forEach((w) => { (byCity[w.city] = byCity[w.city] || []).push(w); });
  Object.keys(byCity).forEach((city) => {
    const card = h('div', { class: 'card' }, [h('h2', { style: 'margin-top:0' }, city)]);
    byCity[city].forEach((w) => card.append(h('div', { class: 'row-between', style: 'margin:4px 0' }, [
      h('div', { class: 'grow' }, [h('strong', {}, w.name), h('div', { class: 'muted tiny' }, WORSHIP_FAITH[w.faith] || '')]),
      h('a', { class: 'chip', href: mapsSearch(`${w.name} ${w.city}`), target: '_blank', rel: 'noopener' }, 'Map ↗'),
    ])));
    wrap.append(card);
  });
  wrap.append(sourcesNote(WORSHIP_SOURCES, 'July 2026'));
  wrap.append(h('p', { class: 'disclaimer' }, 'Dress modestly at religious sites: cover shoulders and knees, remove shoes where asked, and follow local custom. Service times change — confirm before you travel across town.'));
  mount(wrap, '#home');
}

// ---- SECURE DOCUMENT VAULT --------------------------------------------------
// Passports and other documents, encrypted on-device (see js/vault.js). The UI
// re-renders into `body` after every state change so it always reflects the vault.
function vaultWarning() {
  return h('div', { class: 'banner' },
    'Documents are encrypted with your passcode and stored only on this device — never uploaded. Save your recovery code and an encrypted backup, and a forgotten passcode need never lock you out.');
}
function docKind(type) {
  if (!type) return 'File';
  if (type === 'note') return 'Secure note';
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
  if (!vaultUnlocked()) { let hint = ''; try { hint = await vaultGetHint(); } catch { /* none */ } body.append(vaultUnlockCard(body, hint)); return; }

  body.append(vaultWarning());

  // Fetch the item list once (reused for the nudge and the list below).
  let docs = [];
  try { docs = await vaultList(); } catch (e) { body.append(h('div', { class: 'card' }, [h('p', { class: 'muted' }, e.message)])); return; }

  // One-time nudge: once there is something worth protecting, encourage an encrypted backup.
  if (docs.length && !store.profile.prefs.vaultBackupDone) {
    body.append(h('div', { class: 'card', style: 'border:1px solid var(--orange)' }, [
      h('strong', {}, '⬇️ Keep a backup of your vault'),
      h('p', { class: 'muted', style: 'margin:4px 0 8px' }, 'Save an encrypted copy to your phone now, so an update, a reset or a lost phone can never take these. The file stays private — it needs your passcode to open.'),
      h('div', { class: 'row-between' }, [
        h('button', { class: 'btn', onclick: async () => { await vaultDownload(); renderVault(body); } }, 'Download backup'),
        h('button', { class: 'btn ghost', onclick: () => { store.profile.prefs.vaultBackupDone = true; save(); renderVault(body); } }, 'Dismiss'),
      ]),
    ]));
  }

  const fileInput = h('input', { type: 'file', accept: 'image/*,application/pdf' });
  body.append(h('div', { class: 'card' }, [
    h('h2', {}, 'Add a document'),
    h('p', { class: 'muted' }, 'Photograph or scan your passport, ID, visa, insurance, tickets or vaccination records (including a yellow-fever certificate), then add the file. It is encrypted before it is saved.'),
    field('File', fileInput),
    h('button', { class: 'btn block', onclick: async () => {
      const f = fileInput.files && fileInput.files[0];
      if (!f) { alert('Choose a file first.'); return; }
      try { await vaultAdd(f); renderVault(body); } catch (e) { alert(e.message); }
    } }, 'Encrypt & save'),
  ]));

  // Secure typed notes — for card numbers, PINs, booking references, anything you would
  // never put in plain notes. Encrypted exactly like a document.
  const noteTitle = h('input', { type: 'text', placeholder: 'Label (e.g. Visa card, Travel insurance)' });
  const noteText = h('textarea', { rows: '3', placeholder: 'The number, PIN or details — encrypted before it is saved', style: 'width:100%' });
  body.append(h('div', { class: 'card' }, [
    h('h2', {}, 'Add a secure note'),
    h('p', { class: 'muted' }, 'For card numbers, PINs or booking references. Stored encrypted; reveal it only when you need it.'),
    field('Label', noteTitle), field('Details', noteText),
    h('button', { class: 'btn block', onclick: async () => {
      if (!noteText.value.trim()) { alert('Enter something to save.'); return; }
      try { await vaultAddNote(noteTitle.value.trim(), noteText.value); renderVault(body); } catch (e) { alert(e.message); }
    } }, 'Encrypt & save'),
  ]));

  const listCard = h('div', { class: 'card' }, [h('h2', {}, 'Your documents & notes')]);
  body.append(listCard);
  if (!docs.length) listCard.append(h('p', { class: 'muted' }, 'Nothing saved yet — add a document or a secure note above.'));
  docs.forEach((d) => {
    const row = h('div', { class: 'row-between price-item', style: 'flex-wrap:wrap' });
    const reveal = h('div', { style: 'flex-basis:100%;margin-top:6px;display:none' });
    const openBtn = d.type === 'note'
      ? h('button', { class: 'chip', onclick: async () => {
          if (reveal.style.display !== 'none') { reveal.style.display = 'none'; reveal.innerHTML = ''; return; }
          try {
            const text = await vaultGetNote(d.id);
            reveal.innerHTML = '';
            const box = h('div', { class: 'card', style: 'margin:0' }, [
              h('pre', { style: 'white-space:pre-wrap;word-break:break-word;margin:0;font:inherit' }, text),
              h('button', { class: 'chip', style: 'margin-top:6px', onclick: () => { try { navigator.clipboard.writeText(text); } catch { /* no clipboard */ } } }, 'Copy'),
            ]);
            reveal.append(box); reveal.style.display = '';
          } catch (e) { alert(e.message); }
        } }, 'Reveal')
      : h('button', { class: 'chip', onclick: async () => {
          try { const doc = await vaultGet(d.id); const u = URL.createObjectURL(doc.blob); window.open(u, '_blank', 'noopener'); setTimeout(() => URL.revokeObjectURL(u), 60000); }
          catch (e) { alert(e.message); }
        } }, 'View');
    row.append(
      h('div', { class: 'grow' }, [h('strong', {}, d.name || 'Document'), h('div', { class: 'muted' }, `${docKind(d.type)} · added ${d.createdAt}`)]),
      h('div', { class: 'cats' }, [
        openBtn,
        h('button', { class: 'chip', 'aria-label': `Delete ${d.name || 'document'} from the vault`, onclick: async () => { if (confirm(`Delete “${d.name}” from the vault?`)) { await vaultDelete(d.id); renderVault(body); } } }, '✕'),
      ]),
      reveal,
    );
    listCard.append(row);
  });

  // Encrypted backup — so passports, cards and notes are never lost to an update, a reset,
  // or a new phone. The file holds only ciphertext + salt, so it stays private: useless
  // without the passcode.
  body.append(h('div', { class: 'card' }, [
    h('h2', {}, 'Backup'),
    h('p', { class: 'muted' }, 'Save an encrypted copy to your phone so you never lose these — even after an update, a reset, or moving to a new device. The file can only be opened with your passcode.'),
    vaultDownloadBtn(body),
    vaultShareBtn(),
    vaultRestoreControl(body),
  ]));

  // Recovery code — the primary way back in if the passcode is ever forgotten. Every new
  // vault mints one at setup; this lets the user check it is set or mint a fresh one.
  let hasRec = false; try { hasRec = await vaultHasRecovery(); } catch { /* treat as none */ }
  body.append(h('div', { class: 'card', style: hasRec ? '' : 'border:1px solid var(--orange)' }, [
    h('h2', {}, '🔑 Recovery code'),
    hasRec
      ? h('p', { class: 'muted' }, 'A recovery code is set. If you ever forget your passcode, you can use it on the unlock screen to get back in and choose a new passcode. Keep it somewhere safe and private, apart from your phone.')
      : h('p', { class: 'muted' }, 'No recovery code is set. Create one now so a forgotten passcode can never lock you out of your passports and cards for good.'),
    h('button', { class: 'btn ghost block', onclick: async () => {
      if (hasRec && !confirm('Generate a new recovery code? Your current recovery code will stop working immediately.')) return;
      try { const code = await vaultCreateRecovery(); body.innerHTML = ''; body.append(recoveryCodeCard(body, code)); }
      catch (e) { alert(e.message); }
    } }, hasRec ? 'Replace recovery code' : 'Create a recovery code'),
  ]));

  // Change passcode + reminder. An instant re-wrap of the master key — documents are untouched.
  let curHint = ''; try { curHint = await vaultGetHint(); } catch { /* none */ }
  const np1 = h('input', { type: 'password', placeholder: 'New passcode (min 4)' });
  const np2 = h('input', { type: 'password', placeholder: 'Confirm new passcode' });
  const hintIn = h('input', { type: 'text', value: curHint, placeholder: 'e.g. my usual PIN + birth year' });
  body.append(h('details', { class: 'filters-collapse' }, [
    h('summary', {}, 'Change passcode / reminder'),
    h('div', {}, [
      field('New passcode', np1), field('Confirm', np2),
      h('button', { class: 'btn block', onclick: async () => {
        if (!np1.value) { alert('Enter a new passcode.'); return; }
        if (np1.value !== np2.value) { alert('The new passcodes do not match.'); return; }
        try { await vaultChangePasscode(np1.value); await vaultSetHint(hintIn.value.trim()); alert('Passcode changed. Your recovery code still works.'); renderVault(body); }
        catch (e) { alert(e.message); }
      } }, 'Change passcode'),
      field('Passcode reminder (optional)', hintIn),
      h('button', { class: 'btn ghost block', onclick: async () => { try { await vaultSetHint(hintIn.value.trim()); alert('Reminder saved.'); } catch (e) { alert(e.message); } } }, 'Save reminder only'),
      h('p', { class: 'disclaimer' }, 'There is no server or email reset — that is what keeps the vault private, with no key held anywhere off your device. To get back in without your passcode, use your recovery code (above) or restore an encrypted backup. The reminder is just a hint shown on the unlock screen.'),
    ]),
  ]));

  body.append(h('div', { class: 'card' }, [
    h('button', { class: 'btn ghost block', onclick: () => { vaultLock(); renderVault(body); } }, '🔒 Lock vault'),
    h('button', { class: 'btn ghost block', style: 'margin-top:8px; color:var(--warn); border-color:var(--warn)',
      onclick: async () => { if (confirm('Permanently erase the vault and every document in it? This cannot be undone. Download a backup first if you want to keep them.')) { try { await vaultWipe(); } catch { /* ignore */ } renderVault(body); } } }, 'Erase vault'),
  ]));
}
function vaultStamp() { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; }
// Shown exactly ONCE, right after a code is minted (setup / replace / reset). The code is
// never stored where it can be read, so this is the only chance to save it.
function recoveryCodeCard(body, code, opts) {
  opts = opts || {};
  const download = () => {
    const txt = `Mekonging — vault recovery code\n\nKeep this somewhere safe and private, apart from your phone.\nIt can unlock your vault and reset a forgotten passcode.\n\n    ${code}\n\nAnyone who has this code can open your vault, so store it like a password.\nThis code is shown only once and is not saved anywhere it can be read.\n`;
    const blob = new Blob([txt], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `mekonging-recovery-code-${vaultStamp()}.txt`;
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 2000);
  };
  return h('div', { class: 'card', style: 'border:2px solid var(--orange)' }, [
    h('h2', {}, '🔑 Save your recovery code'),
    h('p', {}, opts.isReset
      ? 'Your passcode has been reset. Here is a NEW recovery code — your old one no longer works. Save this one now.'
      : 'This is the one way back in if you ever forget your passcode. Save it somewhere safe and private now — it is shown only once and is never stored where it can be read.'),
    h('div', { style: 'margin:10px 0;padding:14px;text-align:center;font-size:1.15rem;letter-spacing:1px;font-family:monospace;user-select:all;word-break:break-all;background:var(--card-2, rgba(0,0,0,.06));border-radius:10px' }, code),
    h('div', { class: 'row-between' }, [
      h('button', { class: 'btn', onclick: () => { try { navigator.clipboard.writeText(code); } catch { /* no clipboard */ } } }, 'Copy'),
      h('button', { class: 'btn', onclick: download }, 'Download as file'),
    ]),
    h('p', { class: 'disclaimer', style: 'margin-top:10px' }, 'Keep it private and separate from your device — a password manager, a note at home, or written down. Anyone with this code can open your vault.'),
    h('button', { class: 'btn block', style: 'margin-top:8px', onclick: () => renderVault(body) }, 'I have saved it — continue'),
  ]);
}
async function vaultDownload() {
  const json = await exportVault();
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = `mekonging-vault-${vaultStamp()}.json`;
  document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 2000);
  store.profile.prefs.vaultBackupDone = true; save();
}
function vaultDownloadBtn(body) {
  return h('button', { class: 'btn ghost block', onclick: async () => {
    try { await vaultDownload(); if (body) renderVault(body); } catch (e) { alert(e.message); }
  } }, '⬇️ Download encrypted backup');
}
// The safe "email for recovery": share the ENCRYPTED backup file to your own inbox / cloud.
// It is ciphertext, so it stays private; you restore it later and unlock with your passcode.
function vaultShareBtn() {
  return h('button', { class: 'btn ghost block', style: 'margin-top:6px', onclick: async () => {
    try {
      const json = await exportVault();
      const file = new File([json], `mekonging-vault-${vaultStamp()}.json`, { type: 'application/json' });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: 'Mekonging vault backup', text: 'Encrypted vault backup — needs your passcode to open.' });
        store.profile.prefs.vaultBackupDone = true; save();
      } else {
        alert('Sharing files is not supported on this device. Use “Download encrypted backup”, then email that file to yourself — it is encrypted and safe to store.');
      }
    } catch (e) { if (e && e.name !== 'AbortError') alert(e.message || 'Could not share the backup.'); }
  } }, '📧 Email / share encrypted backup');
}
function vaultRestoreControl(body) {
  const inp = h('input', { type: 'file', accept: 'application/json,.json', style: 'display:none', onchange: (e) => {
    const f = e.target.files && e.target.files[0]; if (!f) return;
    const reader = new FileReader();
    reader.onload = async () => {
      if (!confirm('Restore this vault backup? It replaces any vault currently on this device, and you unlock it with the backup’s passcode.')) return;
      try { const res = await importVault(String(reader.result || '')); alert(`Restored ${res.docs} item${res.docs === 1 ? '' : 's'}. Unlock with your passcode.`); renderVault(body); }
      catch (e) { alert(e.message); }
    };
    reader.readAsText(f);
  } });
  return h('div', {}, [inp, h('button', { class: 'btn ghost block', style: 'margin-top:6px', onclick: () => inp.click() }, '⬆️ Restore from a backup file')]);
}
function vaultSetupCard(body) {
  const p1 = h('input', { type: 'password', placeholder: 'Choose a passcode (min 4 characters)' });
  const p2 = h('input', { type: 'password', placeholder: 'Confirm passcode' });
  const hint = h('input', { type: 'text', placeholder: 'e.g. my usual PIN + birth year' });
  return h('div', { class: 'card' }, [
    h('h2', {}, 'Set up your vault'),
    vaultWarning(),
    field('Passcode', p1), field('Confirm', p2),
    field('Passcode reminder (optional)', hint),
    h('p', { class: 'disclaimer', style: 'margin-top:0' }, 'When you create the vault you will be shown a one-time recovery code — save it, and a forgotten passcode need never lock you out. The reminder is a separate, vaguer hint shown on the unlock screen; it is stored on this device and is not your passcode.'),
    h('button', { class: 'btn block', onclick: async () => {
      if (p1.value !== p2.value) { alert('The passcodes do not match.'); return; }
      try { const { recoveryCode } = await vaultSetup(p1.value, hint.value.trim()); body.innerHTML = ''; body.append(recoveryCodeCard(body, recoveryCode)); }
      catch (e) { alert(e.message); }
    } }, 'Create vault'),
    h('p', { class: 'muted', style: 'margin:12px 0 4px' }, 'Moving from another device? Restore your encrypted backup, then unlock it with the same passcode.'),
    vaultRestoreControl(body),
  ]);
}
function vaultUnlockCard(body, hintText) {
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
    hintText ? h('p', { class: 'muted', style: 'margin:4px 0 0' }, `💡 Reminder: ${hintText}`) : null,
    h('button', { class: 'btn block', style: 'margin-top:8px', onclick: submit }, 'Unlock'),
    forgottenPasscodeDetails(body),
  ]);
}
// The recovery paths, in order: recovery code (resets the passcode), then an encrypted
// backup. There is deliberately no server/email reset — that is what keeps the vault private.
function forgottenPasscodeDetails(body) {
  const rc = h('input', { type: 'text', placeholder: 'XXXXX-XXXXX-XXXXX-XXXXX-XXXXX', autocapitalize: 'characters', spellcheck: 'false' });
  const rnp1 = h('input', { type: 'password', placeholder: 'New passcode (min 4)' });
  const rnp2 = h('input', { type: 'password', placeholder: 'Confirm new passcode' });
  const rerr = h('p', { class: 'warn-note', style: 'display:none' });
  return h('details', { class: 'filters-collapse', style: 'margin-top:10px' }, [
    h('summary', {}, 'Forgotten your passcode?'),
    h('div', {}, [
      h('p', { class: 'muted' }, 'Have your recovery code? Enter it with a new passcode to get back in.'),
      field('Recovery code', rc), field('New passcode', rnp1), field('Confirm', rnp2), rerr,
      h('button', { class: 'btn block', onclick: async () => {
        rerr.style.display = 'none';
        if (!rc.value.trim()) { rerr.textContent = 'Enter your recovery code.'; rerr.style.display = ''; return; }
        if (!rnp1.value || rnp1.value !== rnp2.value) { rerr.textContent = 'Enter a new passcode in both fields — they must match.'; rerr.style.display = ''; return; }
        try {
          const { recoveryCode } = await vaultResetWithRecovery(rc.value.trim(), rnp1.value);
          body.innerHTML = ''; body.append(recoveryCodeCard(body, recoveryCode, { isReset: true }));
        } catch (e) { rerr.textContent = e.message; rerr.style.display = ''; }
      } }, 'Reset passcode with recovery code'),
      h('p', { class: 'muted', style: 'margin-top:14px' }, 'No recovery code? If you saved an encrypted backup, restore it and unlock with that backup’s passcode.'),
      vaultRestoreControl(body),
      h('p', { class: 'disclaimer' }, 'For your privacy there is no server or email reset. Without your passcode, your recovery code, or an encrypted backup, the contents cannot be recovered.'),
    ]),
  ]);
}

// ---- YOUR CONTRIBUTIONS (on-device points + levels, Local Guides-style) ------
function contributionsScreen() {
  const wrap = h('div', { class: 'screen' });
  wrap.append(topbar('Your contributions', '#home'));
  const pts = gamify.contributionPoints(store);
  const lvl = gamify.levelInfo(pts);
  const rows = gamify.contributionBreakdown(store);
  const suggestions = gamify.contributionSuggestions(store);

  // Level card with a progress bar to the next level.
  wrap.append(h('div', { class: 'card contrib-hero' }, [
    h('div', { class: 'contrib-badge' }, lvl.emoji),
    h('h2', { style: 'margin:0' }, `${lvl.title}`),
    h('p', { class: 'muted', style: 'margin:2px 0 10px' }, `Level ${lvl.level} · ${pts} point${pts === 1 ? '' : 's'}`),
    h('div', { class: 'contrib-bar' }, [h('span', { style: `width:${Math.round(lvl.pct * 100)}%` })]),
    h('p', { class: 'muted', style: 'margin:8px 0 0' },
      lvl.nextTitle ? `${lvl.ptsToNext} point${lvl.ptsToNext === 1 ? '' : 's'} to ${lvl.nextTitle}` : 'You have reached the top level — thank you!'),
  ]));
  wrap.append(h('p', { class: 'muted', style: 'margin:0 0 10px' }, 'Points come from what you add to your own guide. Everything stays on this device — there are no accounts and no leaderboard, just your own progress.'));

  // Ways to earn more (encouragement).
  if (suggestions.length) {
    const card = h('div', { class: 'card' }, [h('h3', { style: 'margin-top:0' }, 'Ways to earn more')]);
    suggestions.forEach((s) => card.append(h('button', { class: 'btn ghost block contrib-suggest', style: 'margin-top:6px', onclick: () => go(s.hash) },
      `${s.emoji} ${s.text}  ·  +${s.pts}`)));
    wrap.append(card);
  }

  // Full breakdown of what counts.
  const bd = h('div', { class: 'card' }, [h('h3', { style: 'margin-top:0' }, 'What you have added')]);
  rows.forEach((r) => bd.append(h('div', { class: 'row-between contrib-row' }, [
    h('span', {}, `${r.emoji} ${r.label}`),
    h('span', { class: 'muted' }, `${r.count} · ${r.points} pt${r.points === 1 ? '' : 's'}`),
  ])));
  wrap.append(bd);
  wrap.append(h('p', { class: 'disclaimer' }, 'Scoring: review +10, photo +5, journal entry +5, tip +5, pin +3, rating +1, collection +2, calendar entry +1.'));
  mount(wrap, '#home');
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
  wrap.append(faq('Where is my data kept? Is it private?', 'Everything you create — saved places, notes, reviews, pins, journal, trip and calendar — stays on this device only. There are no accounts and nothing is uploaded. The document vault (passports, tickets) is encrypted on-device; if you forget the passcode you can still get back in with the one-time recovery code shown at setup, or by restoring an encrypted backup. The only data that leaves your device is what you actively use online, such as a weather refresh, a translation, or tapping through to a booking site.'));
  wrap.append(faq('Finding your way around', 'The bottom tabs are Home, Talk (phrasebook), Places, Map and Saved. Search on the Home screen looks across places, food, wildlife, phrases and prices at once. Save any place with the ⭐ and organise saves into Collections. On the map you can drop a pin, set “my stay”, measure distances, and save an area for offline satellite imagery.'));

  // Site-wide source register. Individual screens also cite their own sources inline
  // (via the same "Sources:" line), so every claim is traceable to a primary source.
  wrap.append(faq('Where does the information come from? (Sources)', h('div', {}, [
    h('p', {}, 'Guidance is compiled from public, authoritative sources, and each screen also cites its own inline. The main sources across the app:'),
    h('ul', { class: 'sos-aid' }, [
      h('li', {}, [h('strong', {}, 'Health & first aid: '), 'World Health Organization and the IFRC / Red Cross; hospitals reflect Joint Commission International accreditation and facilities travellers commonly use.']),
      h('li', {}, [h('strong', {}, 'Kosher: '), 'Chabad of Thailand, Chabad of Cambodia and the Chabad center directory — only certified-kosher venues, never “kosher-style”.']),
      h('li', {}, [h('strong', {}, 'Places, worship & maps: '), 'OpenStreetMap contributors and national tourism boards; satellite imagery from Esri / ArcGIS.']),
      h('li', {}, [h('strong', {}, 'Weather: '), 'Open-Meteo. Exchange rates: open.er-api.com. Live translation: MyMemory.']),
      h('li', {}, [h('strong', {}, 'Wildlife: '), 'photographs from Wikimedia Commons (Creative Commons, credited on each species); animal calls streamed from Xeno-canto and iNaturalist.']),
      h('li', {}, [h('strong', {}, 'Ratings: '), 'public snapshots from sites such as TripAdvisor, each stamped with the month it was checked, with live links to the source.']),
    ]),
    h('p', { class: 'muted' }, 'Everything here is guidance — always confirm prices, hours, service times and safety with the primary source or locally before you rely on them.'),
  ])));

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

  // --- traveller board (peer bulletin board; on-device, shared by link) ---
  const nListings = getListings().length;
  wrap.append(h('div', { class: 'card' }, [
    h('h2', { style: 'margin-top:0' }, 'Traveller board'),
    h('p', { class: 'muted' }, 'Swap cash, split a ride, pass on a room, hand off a car seat, a bike or camping kit. On-device; a listing travels only inside a link you share.'),
    h('button', { class: 'btn ghost block', onclick: () => go('#exchange') }, `🧭 Open the board${nListings ? ` (${nListings})` : ''}`),
  ]));

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
        h('button', { class: 'chip', 'aria-label': `Remove ${c.name || 'this contact'} from your circle`, onclick: () => { if (confirm(`Remove ${c.name || 'this contact'} from your circle?`)) { removeContact(c.userId); go('#circle'); } } }, '✕'),
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
  } else if (s.kind === 'jelly') {
    const exists = getPlace(s.data.id);
    box.append(h('h2', { style: 'margin-top:8px' }, `🪼 Jellyfish sighting — ${s.data.name}`));
    box.append(h('p', {}, `${SEV_LABEL[s.data.sev] || SEV_LABEL.seen}${s.data.note ? ` — ${s.data.note}` : ''}${s.data.d ? ` · ${fmtReportDate(s.data.d)}` : ''}`));
    box.append(h('button', { class: 'btn block', onclick: (e) => {
      addJellyReport(s.data.id, { d: s.data.d || todayKey(), sev: s.data.sev || 'seen', note: s.data.note || '', by: s.from ? s.from.name : 'a traveller' });
      e.currentTarget.textContent = '✓ Added to this beach';
    } }, '＋ Add this sighting to the beach'));
    if (exists) box.append(h('button', { class: 'btn ghost block', style: 'margin-top:8px', onclick: () => go(`#place-${s.data.id}`) }, 'Open this beach'));
    else box.append(h('p', { class: 'muted', style: 'margin-top:6px' }, 'This beach is not in your guide, so the sighting cannot be pinned to it.'));
  } else if (s.kind === 'secret') {
    const exists = getPlace(s.data.id);
    box.append(h('h2', { style: 'margin-top:8px' }, `🔑 Local secret — ${s.data.name}`));
    box.append(h('p', {}, s.data.text));
    if (s.data.by) box.append(h('p', { class: 'tiny muted' }, `Shared by ${s.data.by}`));
    if (exists) {
      box.append(h('button', { class: 'btn block', onclick: (e) => { addPlaceSecret(s.data.id, { text: s.data.text, by: s.data.by || (s.from ? s.from.name : 'a traveller') }); e.currentTarget.textContent = '✓ Saved to this place'; } }, '＋ Save this secret to the place'));
      box.append(h('button', { class: 'btn ghost block', style: 'margin-top:8px', onclick: () => go(`#place-${s.data.id}`) }, 'Open this place'));
    } else {
      box.append(h('p', { class: 'muted', style: 'margin-top:6px' }, 'This place is not in your guide, so the secret cannot be pinned to it.'));
    }
  } else if (s.kind === 'bb') {
    const d = s.data; const cat = d.cat || 'other'; const meta = bbCat(cat);
    box.append(h('h2', { style: 'margin-top:8px' }, `${meta.emoji} ${bbHeadline(cat, d)}`));
    if (cat === 'swap') box.append(h('p', { class: 'muted small' }, swapCalcNodes((d.have && d.have.a) || 0, d.have && d.have.c, d.want && d.want.c)));
    else { const sub = bbSubline(cat, d); if (sub) box.append(h('p', { class: 'small', style: 'font-weight:700' }, sub)); }
    const line = [meta.label, d.city].filter(Boolean).join(' · ');
    if (line) box.append(h('p', { class: 'tiny muted' }, line));
    if (d.note) box.append(h('p', { style: 'margin-top:6px' }, d.note));
    if (d.contact) box.append(h('p', { class: 'small' }, `Reach: ${d.contact}`));
    box.append(h('button', { class: 'btn block', style: 'margin-top:8px', onclick: (e) => { addListing({ cat, mine: false, from: s.from, data: d }); e.currentTarget.textContent = '✓ Saved to your board'; } }, '＋ Save to my board'));
    box.append(h('button', { class: 'btn ghost block', style: 'margin-top:8px', onclick: () => go('#exchange-' + cat) }, 'Open the traveller board'));
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
  const KIND = { place: '📍 Place', collection: '⭐ List', trip: '🧳 Trip', tip: '💡 Local tip', jelly: '🪼 Sighting', secret: '🔑 Secret', bb: '🧭 Board' };
  items.forEach((it) => {
    const title = it.kind === 'place' ? (it.data.name || 'A place')
      : it.kind === 'collection' ? (it.data.name || 'A list')
      : it.kind === 'tip' ? `Tip — ${it.data.city || 'a city'}`
      : it.kind === 'jelly' ? `🪼 Jellyfish — ${it.data.name || 'a beach'}`
      : it.kind === 'secret' ? `🔑 ${it.data.name || 'a place'}`
      : it.kind === 'bb' ? `${bbCat(it.data.cat).emoji} ${bbHeadline(it.data.cat || 'other', it.data)}`
      : 'A trip';
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
      (it.kind === 'jelly') ? h('p', { style: 'margin-top:6px' }, `${SEV_LABEL[it.data.sev] || SEV_LABEL.seen}${it.data.note ? ` — ${it.data.note}` : ''}${it.data.d ? ` · ${fmtReportDate(it.data.d)}` : ''}`) : null,
      (it.kind === 'jelly' && getPlace(it.data.id)) ? h('button', { class: 'btn ghost block', style: 'margin-top:6px', onclick: (e) => {
        addJellyReport(it.data.id, { d: it.data.d || todayKey(), sev: it.data.sev || 'seen', note: it.data.note || '', by: it.from ? it.from.name : 'a traveller' });
        e.currentTarget.textContent = '✓ Added to the beach';
      } }, '＋ Add to the beach') : null,
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
    h('p', {}, 'Set the app up in a few taps — or dive straight in and personalise as you go. Everything stays on your device.'),
  ]));

  const finish = () => { store.profile.seenWelcome = true; store.profile.prefs.geoAsked = true; if (netMode() === 'ask') setNetMode('offline'); save(); go('#home'); };
  // Straight into the app: a first-timer can skip the whole setup and personalise later (Settings,
  // the For-you screen, the on-Home location invite). Setup is optional, never a gate.
  wrap.append(h('button', { class: 'btn block', style: 'margin-bottom:4px', onclick: finish }, '✨ Skip setup — just explore'));
  wrap.append(h('p', { class: 'muted small', style: 'margin:0 2px 10px' }, 'Or set a few things up below. You can change all of it any time in Settings.'));

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
  whoCard.append(h('p', { class: 'muted', style: 'margin-top:10px' }, 'Travelling alone? We will surface tailored, non-alarmist safety notes.'));
  const soloFemChip = h('button', { class: 'chip', 'aria-pressed': prefs.soloFemale ? 'true' : 'false',
    onclick: (e) => { prefs.soloFemale = !prefs.soloFemale; save(); e.currentTarget.setAttribute('aria-pressed', prefs.soloFemale ? 'true' : 'false'); } }, '🧭 Solo female traveller');
  whoCard.append(h('div', { class: 'chips' }, [soloFemChip]));
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

  // 4 — Allergies & diet (drives food highlighting + pinned phrasebook phrases)
  const dietCard = h('div', { class: 'card' });
  dietCard.append(h('h2', {}, '4 · Any food allergies or diet?'));
  dietCard.append(h('p', { class: 'muted' }, 'Pick any that apply. The app will highlight dishes that fit you when identifying food, and pin your exact phrases at the top of the phrasebook to show a cook. Guidance only — always confirm in person for a serious allergy.'));
  dietCard.append(dietPicker());
  wrap.append(dietCard);

  // 5 — How you like to travel (budget / length / interests)
  const fitCard = h('div', { class: 'card' });
  fitCard.append(h('h2', {}, '5 · How you like to travel'));
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
  locCard.append(h('h2', {}, '6 · Use your location? (optional)'));
  locCard.append(h('p', { class: 'muted' }, 'Allow it and the app leads with what is good right where you are — distances, near-me, the closest help. It stays on your device and works offline; GPS uses your phone’s sensors, not data.'));
  if (typeof navigator !== 'undefined' && navigator.geolocation) {
    const lb = h('button', { class: 'btn ghost block' }, getLastFix() ? '📍 Location is on' : '📍 Use my location');
    lb.onclick = async () => { lb.textContent = 'Locating…'; lb.disabled = true; try { const p = await geolocate(); setLastFix(p); const nb = nearestSpotGlobal(p); if (nb) setFocusSpot(nb.spot); lb.textContent = '📍 Location is on'; } catch { lb.textContent = '📍 Location unavailable'; } lb.disabled = false; };
    locCard.append(lb);
  } else {
    locCard.append(h('p', { class: 'muted' }, 'Location is not available on this device — you can still browse by country and city.'));
  }
  wrap.append(locCard);

  wrap.append(h('button', { class: 'btn block', style: 'margin-top:8px', onclick: finish }, 'Start exploring →'));
  // No tab bar during first-run setup: onboarding is a focused flow with its own
  // "Start exploring" / "Skip for now" exits, not something to wander out of mid-step.
  mount(wrap);
}

function foryouScreen() {
  const prefs = store.profile.prefs;
  const wrap = h('div', { class: 'screen' });
  wrap.append(topbar('For you', '#home'));

  // "For you" now shows your personalised RESULTS. The traveller profile that drives them
  // (who's travelling, baby, accessibility, trip length, budget, interests) is set in ONE
  // place — Settings — so preferences are not scattered across the app.
  if (!profileIsSet()) {
    wrap.append(h('p', { class: 'muted' }, 'Set who you are and how you travel, and every list ranks what fits you first — and the trip plans match your situation. It all stays on your device.'));
    wrap.append(h('button', { class: 'btn block', style: 'margin-top:8px', onclick: () => go('#settings') }, '⚙️ Set up your travel profile in Settings'));
    mount(wrap, '#home');
    return;
  }
  const profSummary = [
    prefs.party && ({ solo: 'Solo', couple: 'Couple', family: 'Family', group: 'Group' }[prefs.party]),
    prefs.withBaby && 'with a baby',
    prefs.tripLength && ({ short: '≤1 week', medium: '2–3 weeks', long: '1 month+' }[prefs.tripLength]),
    prefs.budget && ({ low: 'budget', mid: 'mid', high: 'higher-end', flexible: 'flexible budget' }[prefs.budget]),
    (prefs.diet && prefs.diet.length) && `${prefs.diet.length} diet ${prefs.diet.length > 1 ? 'flags' : 'flag'}`,
  ].filter(Boolean).join(' · ');
  wrap.append(h('div', { class: 'row-between', style: 'align-items:center;gap:8px' }, [
    h('p', { class: 'muted', style: 'margin:0' }, profSummary ? `Ranked for: ${profSummary}` : 'Ranked to how you travel.'),
    h('button', { class: 'chip', onclick: () => go('#settings') }, '✎ Edit profile'),
  ]));

  // Inline "finish your profile" nudges — one quiet chip per unset field, each opening the
  // one place profiles live (Settings). More you fill, more the ranking is truly yours.
  const missing = [
    !prefs.party && "Who's travelling",
    !prefs.tripLength && 'Trip length',
    (!prefs.budget || prefs.budget === 'flexible') && 'Budget',
    !(prefs.interests || []).length && 'Interests',
    !(prefs.diet || []).length && 'Diet & allergies',
  ].filter(Boolean);
  if (missing.length) {
    wrap.append(h('p', { class: 'tiny muted', style: 'margin:8px 0 4px' }, 'Add these and your picks fit you even better:'));
    wrap.append(h('div', { class: 'chips' }, missing.map((m) =>
      h('button', { class: 'chip', onclick: () => go('#settings') }, `＋ ${m}`))));
  }

  {
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
  const PARTY_LBL = { solo: '🎒 solo', couple: '👫 couples', family: '👨‍👩‍👧 families', group: '👥 groups' };
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
          h('button', { class: 'sf-row', onclick: () => go(`#place-${p.id}`) }, [
            rnThumb(p),
            h('div', { class: 'sf-text' }, [
              h('div', { class: 'sf-name' }, p.name),
              h('div', { class: 'tiny muted' }, p.city),
            ]),
          ]),
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

// Full on-device backup: the store JSON PLUS every photo blob (base64), so "everything" —
// journal, ratings, reviews, trip, calendar, saved places AND the pictures — travels in one
// file. It stays on the device; nothing is uploaded. Older plain-store backups still restore
// (detected by the absence of the bundle marker).
function blobToDataURL(blob) {
  return new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = () => rej(r.error); r.readAsDataURL(blob); });
}
function dataURLToBlob(dataUrl) {
  const comma = dataUrl.indexOf(',');
  const mime = (dataUrl.slice(0, comma).match(/data:([^;]+)/) || [])[1] || 'application/octet-stream';
  const bin = atob(dataUrl.slice(comma + 1));
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return new Blob([arr], { type: mime });
}
async function buildBackupBundle() {
  const bundle = { format: 'mekonging-backup', v: 1, store: JSON.parse(exportData()), photos: [] };
  const blobs = await getAllBlobs();
  for (const { key, blob } of blobs) {
    if (!blob) continue;
    try { bundle.photos.push({ key, data: await blobToDataURL(blob) }); } catch { /* skip a bad blob */ }
  }
  return bundle;
}
async function restoreBackupFile(text) {
  let parsed;
  try { parsed = JSON.parse(text); } catch { return { ok: false, error: 'That file is not a valid backup.' }; }
  if (parsed && parsed.format === 'mekonging-backup' && parsed.store) {
    // Photos first, so restored entries that reference them render immediately.
    for (const ph of (parsed.photos || [])) {
      if (ph && ph.key && ph.data) { try { await putBlob(ph.key, dataURLToBlob(ph.data)); } catch { /* skip a bad blob */ } }
    }
    const res = importData(JSON.stringify(parsed.store));
    if (res.ok && res.counts) res.counts.photos = (parsed.photos || []).length;
    return res;
  }
  return importData(text); // legacy plain store-JSON backup (no photos bundled)
}

// ---- EXPORT the traveller's own contributions, per type, human-viewable ------
// Everything is built on-device from the store + IndexedDB photos. Journal and reviews
// come out as self-contained HTML (photos inline), photos as an album + a JPEG ZIP, and
// spending as a true .xlsx and a .csv. Shareable via the device share sheet, else saved.
function exportStamp() { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; }
function htmlDoc(title, bodyHtml) {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)} · Mekonging</title>
<style>
 body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;max-width:820px;margin:0 auto;padding:20px;color:#20143a;background:#faf7f0;line-height:1.5}
 h1{font-size:1.7rem}h2{font-size:1.2rem;margin:0 0 4px}
 article{border:1px solid #e3dccb;border-radius:12px;padding:14px 16px;margin:14px 0;background:#fff}
 .meta{color:#7a7264;font-size:.85rem;margin:0 0 8px}.stars{color:#E0A21A;font-size:1.1rem;margin:2px 0}
 .note{color:#4a7a5a}img{max-width:100%;border-radius:8px;margin:6px 6px 0 0;max-height:360px}
 .album{display:flex;flex-wrap:wrap;gap:8px}.album img{width:180px;height:180px;object-fit:cover;max-height:none}
 .book-section{font-size:1.4rem;margin:30px 0 8px;padding-bottom:5px;border-bottom:2px solid #E8632A}
 .lead{color:#7a7264;margin:0 0 10px}
 table{border-collapse:collapse;width:100%;margin:8px 0;font-size:.92rem}
 th,td{border:1px solid #e3dccb;padding:6px 9px;text-align:left}th{background:#f3ede0}
 tr.total td{font-weight:800;background:#faf3e6}
 footer{color:#9a927f;font-size:.8rem;margin-top:24px;text-align:center}
</style></head><body>
<h1>${esc(title)}</h1>
${bodyHtml}
<footer>Exported from Mekonging on ${exportStamp()} · your data, kept on your device.</footer>
</body></html>`;
}
async function blobsToDataURLs(keys) {
  const out = [];
  for (const k of keys) { try { const b = await getBlob(k); if (b) out.push(await blobToDataURL(b)); } catch { /* skip a missing photo */ } }
  return out;
}
async function exportJournalHtml() {
  const entries = (store.journal.entries || []).slice().sort((a, b) => (a.ts || 0) - (b.ts || 0));
  const parts = [];
  for (const e of entries) {
    const imgs = await blobsToDataURLs(entryPhotoKeys(e));
    const when = e.ts ? new Date(e.ts).toLocaleString() : '';
    parts.push(`<article><h2>${esc(e.title || 'Untitled')}</h2>
<p class="meta">${[when, e.place, e.weather].filter(Boolean).map(esc).join(' · ')}</p>
<p>${esc(e.text || '').replace(/\n/g, '<br>')}</p>
${imgs.map((u) => `<img src="${u}" alt="">`).join('')}</article>`);
  }
  return htmlDoc('My travel journal', parts.join('\n') || '<p>No journal entries yet.</p>');
}
async function exportReviewsHtml() {
  const parts = [];
  for (const id of Object.keys(store.placeData || {})) {
    const d = store.placeData[id];
    if (!d || !(d.rating || d.review || d.note || (d.photos || []).length)) continue;
    const pl = getPlace(id) || getPin(id);
    const imgs = await blobsToDataURLs(d.photos || []);
    parts.push(`<article><h2>${esc(pl ? pl.name : id)}</h2>
${d.rating ? `<p class="stars">${'★'.repeat(d.rating)}${'☆'.repeat(5 - d.rating)}</p>` : ''}
${d.review ? `<p>${esc(d.review).replace(/\n/g, '<br>')}</p>` : ''}
${d.note ? `<p class="note"><em>My note:</em> ${esc(d.note).replace(/\n/g, '<br>')}</p>` : ''}
${imgs.map((u) => `<img src="${u}" alt="">`).join('')}</article>`);
  }
  return htmlDoc('My ratings & reviews', parts.join('\n') || '<p>No ratings or reviews yet.</p>');
}
async function exportOnePlaceReviewHtml(id, name) {
  const d = store.placeData[id] || {};
  const imgs = await blobsToDataURLs(d.photos || []);
  const body = `<article><h2>${esc(name || id)}</h2>
${d.rating ? `<p class="stars">${'★'.repeat(d.rating)}${'☆'.repeat(5 - d.rating)}</p>` : ''}
${d.review ? `<p>${esc(d.review).replace(/\n/g, '<br>')}</p>` : ''}
${d.note ? `<p class="note"><em>My note:</em> ${esc(d.note).replace(/\n/g, '<br>')}</p>` : ''}
${imgs.map((u) => `<img src="${u}" alt="">`).join('')}</article>`;
  return htmlDoc(`My review — ${name || 'a place'}`, body);
}
async function exportPhotosAlbumHtml() {
  const blobs = await getAllBlobs().catch(() => []);
  const imgs = [];
  for (const { blob } of blobs) { if (blob) { try { imgs.push(await blobToDataURL(blob)); } catch { /* skip */ } } }
  return htmlDoc('My photo album', imgs.length ? `<div class="album">${imgs.map((u) => `<img src="${u}" alt="">`).join('')}</div>` : '<p>No photos yet.</p>');
}
async function exportPhotosZip() {
  const blobs = await getAllBlobs().catch(() => []);
  const files = [];
  let n = 1;
  for (const { blob } of blobs) {
    if (!blob) continue;
    const ext = (blob.type && blob.type.includes('png')) ? 'png' : 'jpg';
    try { files.push({ name: `photo-${String(n++).padStart(3, '0')}.${ext}`, bytes: new Uint8Array(await blob.arrayBuffer()) }); } catch { /* skip */ }
  }
  return files.length ? zipStore(files) : null;
}
function expenseTable() {
  const log = (store.trip.budgetLog || []).slice().sort((a, b) => (a.date < b.date ? -1 : 1));
  return { headers: ['Date', 'Amount', 'Currency', 'On what'], rows: log.map((b) => [b.date || '', parseFloat(b.amount) || 0, b.currency || '', b.note || '']) };
}

// The headline export: ONE beautiful, self-contained web page a traveller can open on any
// phone or computer, or print, or share — journal, ratings & reviews, spending and a trip
// summary, with every photo embedded inline. This is what "download my trip" should feel
// like: a keepsake to read, not a data file. (The raw JSON in Settings remains, clearly
// labelled as a device-to-device restore file — not something to read.)
async function exportTravelBookHtml() {
  const home = homeCurrency();
  const parts = [];

  // Trip summary — where and when, and the total spent in the home currency.
  const stops = (store.trip.stops || []).slice();
  const log = store.trip.budgetLog || [];
  let spend = 0, spendKnown = true;
  log.forEach((b) => {
    const cur = b.currency || home, amt = parseFloat(b.amount) || 0;
    if (cur === home) { spend += amt; return; }
    const c = convert(amt, cur, home);
    if (c == null || isNaN(c)) spendKnown = false; else spend += c;
  });
  const summaryBits = [];
  if (stops.length) {
    const countries = [...new Set(stops.map((s) => (getCountry(s.country) || {}).name).filter(Boolean))];
    if (countries.length) summaryBits.push(`Countries: ${countries.join(', ')}`);
    const dates = stops.map((s) => s.date).filter(Boolean).sort();
    if (dates.length) summaryBits.push(`Dates: ${dates[0]}${dates.length > 1 ? ` – ${dates[dates.length - 1]}` : ''}`);
    summaryBits.push(`${stops.length} stop${stops.length === 1 ? '' : 's'}`);
  }
  if (log.length && spend > 0) summaryBits.push(`Total spent: ${money(Math.round(spend), home)}${spendKnown ? '' : ' (partial — some currencies not converted)'}`);
  if (summaryBits.length) {
    parts.push(`<h2 class="book-section">My trip</h2><p class="lead">${summaryBits.map(esc).join(' · ')}</p>`);
    if (stops.length) {
      parts.push('<article>' + stops.map((s) =>
        `<div>${esc(s.title || 'Stop')}${s.country ? ` · ${esc((getCountry(s.country) || {}).name || s.country)}` : ''}${s.date ? ` · ${esc(s.date)}` : ''}</div>`).join('') + '</article>');
    }
  }

  // Journal
  const entries = (store.journal.entries || []).slice().sort((a, b) => (a.ts || 0) - (b.ts || 0));
  if (entries.length) {
    parts.push('<h2 class="book-section">Journal</h2>');
    for (const e of entries) {
      const imgs = await blobsToDataURLs(entryPhotoKeys(e));
      const when = e.ts ? new Date(e.ts).toLocaleString() : '';
      parts.push(`<article><h2>${esc(e.title || 'Untitled')}</h2>
<p class="meta">${[when, e.place, e.weather].filter(Boolean).map(esc).join(' · ')}</p>
<p>${esc(e.text || '').replace(/\n/g, '<br>')}</p>
${imgs.map((u) => `<img src="${u}" alt="">`).join('')}</article>`);
    }
  }

  // Ratings & reviews (with their photos inline)
  const revIds = Object.keys(store.placeData || {}).filter((id) => {
    const d = store.placeData[id]; return d && (d.rating || d.review || d.note || (d.photos || []).length);
  });
  if (revIds.length) {
    parts.push('<h2 class="book-section">Places I rated</h2>');
    for (const id of revIds) {
      const d = store.placeData[id];
      const pl = getPlace(id) || getPin(id);
      const imgs = await blobsToDataURLs(d.photos || []);
      parts.push(`<article><h2>${esc(pl ? pl.name : id)}</h2>
${d.rating ? `<p class="stars">${'★'.repeat(d.rating)}${'☆'.repeat(5 - d.rating)}</p>` : ''}
${d.review ? `<p>${esc(d.review).replace(/\n/g, '<br>')}</p>` : ''}
${d.note ? `<p class="note"><em>My note:</em> ${esc(d.note).replace(/\n/g, '<br>')}</p>` : ''}
${imgs.map((u) => `<img src="${u}" alt="">`).join('')}</article>`);
    }
  }

  // Expenses table
  if (log.length) {
    const t = expenseTable();
    const body = t.rows.map((r) => `<tr>${r.map((c, i) => `<td>${esc(i === 1 ? String(c) : c)}</td>`).join('')}</tr>`).join('');
    parts.push(`<h2 class="book-section">Spending</h2>
<table><thead><tr>${t.headers.map((hd) => `<th>${esc(hd)}</th>`).join('')}</tr></thead>
<tbody>${body}${spend > 0 ? `<tr class="total"><td>Total</td><td>${esc(String(Math.round(spend)))}</td><td>${esc(home)}</td><td>in your home currency${spendKnown ? '' : ' (partial)'}</td></tr>` : ''}</tbody></table>`);
  }

  if (!parts.length) parts.push('<p>Your travel book is empty for now. Add a journal entry, rate a place, or log a spend and it will appear here.</p>');
  return htmlDoc('My travel book', parts.join('\n'));
}

function exportScreen() {
  const wrap = h('div', { class: 'screen' });
  wrap.append(topbar('Export & share', '#settings'));
  wrap.append(h('p', { class: 'muted' }, 'Save your own contributions as files you can read on any phone or computer, and share them however you like. Each type comes out in a fitting format. Everything is made on your device — nothing is uploaded.'));

  const jCount = (store.journal.entries || []).length;
  const rCount = Object.values(store.placeData || {}).filter((d) => d && (d.rating || d.review || d.note || (d.photos || []).length)).length;
  const bCount = (store.trip.budgetLog || []).length;

  const saver = (btn, build, filename, mime) => { btn.onclick = async () => {
    const lbl = btn.textContent; btn.disabled = true; btn.textContent = 'Preparing…';
    try { const content = await build(); const blob = (content instanceof Blob) ? content : new Blob([content], { type: mime }); if (!blob || (blob.size === 0)) { alert('Nothing to export yet.'); } else downloadBlob(blob, filename); }
    catch { alert('Could not build that file on this device.'); }
    btn.disabled = false; btn.textContent = lbl;
  }; return btn; };
  const sharer = (btn, build, filename, mime) => { btn.onclick = async () => {
    const lbl = btn.textContent; btn.disabled = true; btn.textContent = 'Preparing…';
    try { const content = await build(); const blob = (content instanceof Blob) ? content : new Blob([content], { type: mime }); if (!blob || blob.size === 0) alert('Nothing to share yet.'); else await shareOrDownload([{ blob, name: filename }], filename); }
    catch { alert('Could not build that file on this device.'); }
    btn.disabled = false; btn.textContent = lbl;
  }; return btn; };

  // Headline: the whole trip as one beautiful, readable web page (everything, photos inline).
  wrap.append(h('div', { class: 'card', style: 'border:2px solid var(--orange)' }, [
    h('h2', { style: 'margin-top:0' }, '📖 My travel book'),
    h('p', { class: 'tiny muted', style: 'margin:0 0 8px' }, 'Everything together — trip, journal, reviews, photos and spending — as one page you can read, print or share. Opens in any browser. This is the nice, readable one.'),
    saver(h('button', { class: 'btn block' }, '⬇️ Save my travel book (.html)'), exportTravelBookHtml, `mekonging-travel-book-${exportStamp()}.html`, 'text/html'),
    sharer(h('button', { class: 'btn ghost block', style: 'margin-top:6px' }, '📤 Share my travel book'), exportTravelBookHtml, `mekonging-travel-book-${exportStamp()}.html`, 'text/html'),
  ]));
  wrap.append(h('p', { class: 'lbl', style: 'margin:12px 2px 2px' }, 'Or export one type at a time'));

  // Journal
  wrap.append(h('div', { class: 'card' }, [
    h('h2', { style: 'margin-top:0' }, '📖 Journal'),
    h('p', { class: 'tiny muted', style: 'margin:0 0 8px' }, `${jCount} ${jCount === 1 ? 'entry' : 'entries'} — a web page with your writing and photos.`),
    saver(h('button', { class: 'btn ghost block' }, '⬇️ Save journal (.html)'), exportJournalHtml, `mekonging-journal-${exportStamp()}.html`, 'text/html'),
    sharer(h('button', { class: 'btn ghost block', style: 'margin-top:6px' }, '📤 Share journal'), exportJournalHtml, `mekonging-journal-${exportStamp()}.html`, 'text/html'),
  ]));
  // Reviews & ratings
  wrap.append(h('div', { class: 'card' }, [
    h('h2', { style: 'margin-top:0' }, '⭐ Ratings & reviews'),
    h('p', { class: 'tiny muted', style: 'margin:0 0 8px' }, `${rCount} ${rCount === 1 ? 'place' : 'places'} — your stars, reviews, notes and photos.`),
    saver(h('button', { class: 'btn ghost block' }, '⬇️ Save reviews (.html)'), exportReviewsHtml, `mekonging-reviews-${exportStamp()}.html`, 'text/html'),
    sharer(h('button', { class: 'btn ghost block', style: 'margin-top:6px' }, '📤 Share reviews'), exportReviewsHtml, `mekonging-reviews-${exportStamp()}.html`, 'text/html'),
  ]));
  // Photos
  wrap.append(h('div', { class: 'card' }, [
    h('h2', { style: 'margin-top:0' }, '📷 Photos'),
    h('p', { class: 'tiny muted', style: 'margin:0 0 8px' }, 'A viewable album, or every picture as individual JPEGs in a zip.'),
    saver(h('button', { class: 'btn ghost block' }, '⬇️ Photo album (.html)'), exportPhotosAlbumHtml, `mekonging-photos-${exportStamp()}.html`, 'text/html'),
    saver(h('button', { class: 'btn ghost block', style: 'margin-top:6px' }, '⬇️ All photos (.zip of JPEGs)'), exportPhotosZip, `mekonging-photos-${exportStamp()}.zip`, 'application/zip'),
    sharer(h('button', { class: 'btn ghost block', style: 'margin-top:6px' }, '📤 Share photos (.zip)'), exportPhotosZip, `mekonging-photos-${exportStamp()}.zip`, 'application/zip'),
  ]));
  // Expenses — both a true Excel workbook and a CSV, as requested.
  wrap.append(h('div', { class: 'card' }, [
    h('h2', { style: 'margin-top:0' }, '💸 Expenses'),
    h('p', { class: 'tiny muted', style: 'margin:0 0 8px' }, `${bCount} logged ${bCount === 1 ? 'spend' : 'spends'} — as a spreadsheet.`),
    saver(h('button', { class: 'btn ghost block' }, '⬇️ Excel (.xlsx)'), () => { const t = expenseTable(); return buildXlsx(t.headers, t.rows, 'Expenses'); }, `mekonging-expenses-${exportStamp()}.xlsx`, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'),
    saver(h('button', { class: 'btn ghost block', style: 'margin-top:6px' }, '⬇️ CSV (.csv)'), () => { const t = expenseTable(); return toCsv(t.headers, t.rows); }, `mekonging-expenses-${exportStamp()}.csv`, 'text/csv'),
    sharer(h('button', { class: 'btn ghost block', style: 'margin-top:6px' }, '📤 Share expenses (.xlsx)'), () => { const t = expenseTable(); return buildXlsx(t.headers, t.rows, 'Expenses'); }, `mekonging-expenses-${exportStamp()}.xlsx`, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'),
  ]));

  wrap.append(h('p', { class: 'disclaimer' }, 'These files are for you — to keep, print or share. For moving everything to a new phone, use the full backup in Settings instead (it restores directly into the app).'));
  mount(wrap, '#settings');
}

// ---- GIVE BACK (donate to causes that help people in the region) ------------
// Established non-profits, each verified to an official site (2026-07). The app never
// processes money — every entry is a plain outbound link to the organisation's own site,
// exactly like the booking deep links. People-focused, spanning all four countries.
const DONATE_ORGS = [
  { scope: 'Across the region', flag: '🌏', items: [
    { name: 'MAG (Mines Advisory Group)', what: 'Finds and clears landmines and unexploded bombs left by war in Cambodia, Laos and Vietnam, so families can farm and children can play safely.', url: 'https://www.maginternational.org/' },
    { name: 'Friends-International', what: 'Protects urban children and marginalised young people and trains them for work, across Cambodia, Laos and Thailand.', url: 'https://friends-international.org/' },
  ] },
  { scope: 'Thailand', flag: '🇹🇭', items: [
    { name: 'The Mercy Centre (HDF)', what: 'Kindergartens, shelter and daily care for children of Bangkok’s Klong Toey community, serving the city’s poorest families since 1972.', url: 'https://mercycentre.org/' },
  ] },
  { scope: 'Vietnam', flag: '🇻🇳', items: [
    { name: 'Blue Dragon Children’s Foundation', what: 'Rescues children from trafficking and slavery and helps street kids rebuild their lives, based in Hanoi.', url: 'https://www.bluedragon.org/donate/' },
  ] },
  { scope: 'Cambodia', flag: '🇰🇭', items: [
    { name: 'Cambodian Children’s Fund', what: 'Education, healthcare, childcare and family support in one of Phnom Penh’s poorest areas, Steung Meanchey.', url: 'https://www.cambodianchildrensfund.org/donate' },
  ] },
  { scope: 'Laos', flag: '🇱🇦', items: [
    { name: 'COPE', what: 'Free prosthetic limbs and rehabilitation for survivors of unexploded bombs, run from the visitor centre in Vientiane.', url: 'https://copelaos.org/' },
    { name: 'Big Brother Mouse', what: 'A Lao-owned literacy project publishing books and running reading parties for village children, from Luang Prabang.', url: 'https://www.bigbrothermouse.com/' },
  ] },
];

// Recognised giving-effectiveness references, cited in-app for the "how much to give"
// tool. Not financial advice — a suggestion the traveller is free to ignore.
const GIVING_SOURCES = [
  { org: 'Giving What We Can (10% pledge)', url: 'https://www.givingwhatwecan.org/' },
  { org: 'The Life You Can Save', url: 'https://www.thelifeyoucansave.org/' },
];

// Total logged trip spend converted to the home currency, or null if nothing is logged
// or a rate is unknown — lets the giving tool prefill "% of trip spend" from real data.
function loggedTripSpendHome() {
  const home = homeCurrency();
  let sum = 0, known = true;
  (store.trip.budgetLog || []).forEach((b) => {
    const cur = b.currency || home;
    const amt = parseFloat(b.amount) || 0;
    if (cur === home) { sum += amt; return; }
    const c = convert(amt, cur, home);
    if (c == null || isNaN(c)) known = false; else sum += c;
  });
  return known && sum > 0 ? Math.round(sum) : null;
}

// A private, opt-in "how much to give?" calculator. Three framings (a % of trip spend,
// a per-day amount over the length of stay, or a % of income). Everything typed stays on
// the device and is NEVER saved or sent — only the non-sensitive preset (method + %) is
// remembered. The app processes no money; the amount is a suggestion to give on the
// charity's own site.
function givingCalculator() {
  const home = homeCurrency();
  const g = store.profile.prefs.giving = store.profile.prefs.giving || { method: 'trip', pct: 1, perDay: 2, incPct: 1, days: '' };
  const card = h('div', { class: 'card give-back' }, [h('h2', { style: 'margin-top:0' }, '🧮 How much to give?')]);
  card.append(h('p', { class: 'muted tiny', style: 'margin:2px 0 8px' }, 'Giving is personal and entirely optional. Pick an amount whichever way suits you. Anything you type stays on this device and is never saved or sent — only the amount you choose to give, on the charity’s own site.'));

  const methods = [['trip', '💸 % of trip spend'], ['day', '📅 Per day here'], ['income', '💰 % of income']];
  const methodRow = h('div', { class: 'chips' });
  const body = h('div', {});
  const result = h('p', { style: 'font-weight:800;font-size:1.25rem;margin:12px 0 2px' });
  const note = h('p', { class: 'tiny muted', style: 'margin:0' });
  const fmt = (v) => money(Math.max(0, Math.round(v || 0)), home);
  const setResult = (v, sub) => { result.textContent = `Suggested: ${fmt(v)}`; note.textContent = sub || ''; };
  const press = (row, el) => { row.querySelectorAll('.chip').forEach((x) => x.setAttribute('aria-pressed', 'false')); el.setAttribute('aria-pressed', 'true'); };

  function renderBody() {
    body.innerHTML = '';
    if (g.method === 'trip') {
      const logged = loggedTripSpendHome();
      const amt = h('input', { type: 'number', inputmode: 'decimal', min: '0', placeholder: `Your trip spend in ${home}`, value: logged != null ? logged : '' });
      body.append(field(`Trip spend (${home})${logged != null ? ' — from your logged budget' : ''}`, amt));
      const pctRow = h('div', { class: 'chips', style: 'margin-top:6px' }, [0.5, 1, 2, 5].map((p) =>
        h('button', { class: 'chip', 'aria-pressed': g.pct === p ? 'true' : 'false', onclick: (e) => { g.pct = p; save(); press(pctRow, e.currentTarget); calc(); } }, `${p}%`)));
      body.append(pctRow);
      const calc = () => { const n = parseFloat(amt.value) || 0; setResult(n * (g.pct / 100), `${g.pct}% of ${fmt(n)}. Many travellers give around 1% of their trip budget to local causes.`); };
      amt.addEventListener('input', calc); calc();
    } else if (g.method === 'day') {
      const days = h('input', { type: 'number', inputmode: 'numeric', min: '0', placeholder: 'Days in the region', value: g.days || '' });
      body.append(field('Days in the region', days));
      const perRow = h('div', { class: 'chips', style: 'margin-top:6px' }, [1, 2, 5, 10].map((p) =>
        h('button', { class: 'chip', 'aria-pressed': g.perDay === p ? 'true' : 'false', onclick: (e) => { g.perDay = p; save(); press(perRow, e.currentTarget); calc(); } }, `${money(p, home)}/day`)));
      body.append(h('p', { class: 'tiny muted', style: 'margin:8px 0 2px' }, 'Amount per day'), perRow);
      const calc = () => { const d = parseFloat(days.value) || 0; g.days = days.value; setResult(d * g.perDay, `${money(g.perDay, home)} × ${d || 0} day${d === 1 ? '' : 's'}. A small daily amount adds up over a trip.`); };
      days.addEventListener('input', () => { save(); calc(); }); calc();
    } else {
      const inc = h('input', { type: 'number', inputmode: 'decimal', min: '0', placeholder: `Your monthly income in ${home}` });
      body.append(field(`Monthly income (${home}) — not saved`, inc));
      const pctRow = h('div', { class: 'chips', style: 'margin-top:6px' }, [0.5, 1, 2].map((p) =>
        h('button', { class: 'chip', 'aria-pressed': g.incPct === p ? 'true' : 'false', onclick: (e) => { g.incPct = p; save(); press(pctRow, e.currentTarget); calc(); } }, `${p}% of a month`)));
      body.append(pctRow);
      body.append(h('p', { class: 'tiny muted', style: 'margin:8px 0 0' }, 'Giving What We Can suggests pledging 10% of annual income to effective charities — a trip gift can be a first step.'));
      const calc = () => { const n = parseFloat(inc.value) || 0; const pct = g.incPct || 1; setResult(n * (pct / 100), `${pct}% of one month’s income (${fmt(n)}).`); };
      inc.addEventListener('input', calc); calc();
    }
  }
  methods.forEach(([id, label]) => methodRow.append(h('button', { class: 'chip', 'aria-pressed': g.method === id ? 'true' : 'false',
    onclick: (e) => { g.method = id; save(); press(methodRow, e.currentTarget); renderBody(); } }, label)));
  card.append(methodRow, body, result, note);
  card.append(h('p', { class: 'tiny muted', style: 'margin:8px 0 0' }, 'A suggestion, not a rule — give what feels right, or give your time instead. Choose a cause below to give on its official site.'));
  card.append(sourcesNote(GIVING_SOURCES, '2026-07'));
  renderBody();
  return card;
}

function donateScreen() {
  const wrap = h('div', { class: 'screen' });
  wrap.append(topbar('Give back', '#home'));
  wrap.append(h('p', { class: 'map-hint' }, 'Established non-profits working directly with people across Thailand, Vietnam, Cambodia and Laos. Each opens the organisation’s own official website, where you donate directly and securely.'));
  wrap.append(h('div', { class: 'banner' }, 'Mekonging takes no money and no cut, and never processes a payment. These links open external sites and need internet. Please do your own checks before giving.'));
  wrap.append(givingCalculator());
  DONATE_ORGS.forEach((grp) => {
    wrap.append(h('h2', { class: 'cat-title' }, `${grp.flag} ${grp.scope}`));
    grp.items.forEach((o) => wrap.append(h('div', { class: 'card donate-card' }, [
      h('strong', {}, o.name),
      h('p', { class: 'muted', style: 'margin:4px 0 8px' }, o.what),
      h('a', { class: 'btn ghost block', href: o.url, target: '_blank', rel: 'noopener noreferrer' }, 'Visit official site ↗'),
    ])));
  });
  wrap.append(h('p', { class: 'muted', style: 'margin-top:12px' }, 'Prefer to help in person? Eating at their training restaurants, buying their books, or volunteering supports the same work — ask at each organisation’s visitor centre.'));
  wrap.append(h('p', { class: 'disclaimer' }, 'Mekonging is not affiliated with these organisations and receives nothing from them. This is a starting point, not vetting or financial advice — confirm each charity independently before donating.'));
  mount(wrap, '#home');
}

function settingsScreen() {
  const p = store.profile;
  const wrap = h('div', { class: 'screen' });
  wrap.append(topbar('Settings'));

  // Install (Add to Home Screen) — keep the offline companion one tap away. Android/Chrome
  // expose a captured prompt; iOS Safari needs the Share sheet; hidden once already installed.
  const standalone = (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) || window.navigator.standalone === true;
  if (!standalone) {
    const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent || '');
    const ic = h('div', { class: 'card' }, [h('h2', { style: 'margin-top:0' }, '📲 Install the app')]);
    if (deferredInstallPrompt) {
      ic.append(h('p', { class: 'muted', style: 'margin-top:0' }, 'Add Mekonging to your home screen so it opens like an app and stays available offline.'));
      ic.append(h('button', { class: 'btn', onclick: async () => {
        const dp = deferredInstallPrompt; if (!dp) return;
        dp.prompt(); try { await dp.userChoice; } catch { /* dismissed */ }
        deferredInstallPrompt = null; render();
      } }, '➕ Install app'));
    } else if (isIOS) {
      ic.append(h('p', { class: 'muted', style: 'margin-top:0' }, 'On iPhone or iPad: tap the Share button in Safari, then “Add to Home Screen”, to keep Mekonging one tap away and fully offline.'));
    } else {
      ic.append(h('p', { class: 'muted', style: 'margin-top:0' }, 'Use your browser menu → “Install app” or “Add to Home Screen” to keep Mekonging on your home screen and available offline.'));
    }
    wrap.append(ic);
  }

  // Journey phase — always switchable here, so Home never has to drag the traveller
  // back to the picker once they have chosen a stage.
  wrap.append(h('div', { class: 'card' }, [
    h('h2', { style: 'margin-top:0' }, 'Journey phase'),
    h('p', { class: 'muted', style: 'margin-top:0' }, 'Switch any time — this reshapes Home for the stage you are in.'),
    phaseSelector(),
  ]));

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
      } }, `${it.emoji} ${it.label}`)));
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

  card.append(field('Day / night (Classic only)', selectEl([['auto', 'Auto — match your device, else light by day'], ['light', 'Always light'], ['dark', 'Always dark']], p.theme || 'auto',
    (v) => { p.theme = v; save(); applyTheme(); })));

  card.append(field('Reduce motion', selectEl([['auto', 'Auto (system)'], ['on', 'On'], ['off', 'Off']], p.reducedMotion,
    (v) => { p.reducedMotion = v; save(); applyTheme(); })));

  card.append(field('Text size', selectEl([['s', 'Small'], ['m', 'Medium'], ['l', 'Large']], p.textScale || 'm',
    (v) => { p.textScale = v; save(); applyTheme(); })));
  wrap.append(card);

  // Who's travelling — the party/baby/accessibility/trip-length preferences that shape
  // ranking and surface the right help. Kept here (not scattered) so a traveller sets
  // them once. These also drive "For you" and the baby / accessibility shortcuts.
  const who = h('div', { class: 'card' }, [
    h('h2', {}, 'Who’s travelling'),
    h('p', { class: 'muted', style: 'margin-top:0' }, 'Set once — this tailors picks, plans and the help the app surfaces for you.'),
  ]);
  who.append(field('Travelling as', selectEl([['', 'Not set'], ['solo', 'Solo'], ['couple', 'Couple'], ['family', 'Family'], ['group', 'Group']],
    p.prefs.party || '', (v) => { p.prefs.party = v; save(); })));
  who.append(field('Travelling with a baby or toddler', selectEl([['no', 'No'], ['yes', 'Yes — show nappies, formula & family help']],
    p.prefs.withBaby ? 'yes' : 'no', (v) => { p.prefs.withBaby = (v === 'yes'); save(); })));
  const selAcc = new Set(p.prefs.access || []);
  const accChips = h('div', { class: 'chips' }, [['mobility', '♿ Mobility'], ['vision', '👁 Vision'], ['hearing', '👂 Hearing']].map(([id, lbl]) =>
    h('button', { class: 'chip', 'aria-pressed': selAcc.has(id) ? 'true' : 'false',
      onclick: (e) => {
        if (selAcc.has(id)) selAcc.delete(id); else selAcc.add(id);
        p.prefs.access = [...selAcc]; save();
        e.currentTarget.setAttribute('aria-pressed', selAcc.has(id) ? 'true' : 'false');
      } }, lbl)));
  who.append(field('Accessibility needs', accChips));
  who.append(h('p', { class: 'muted', style: 'margin:14px 0 0' }, 'Allergies & dietary restrictions'));
  who.append(h('p', { class: 'tiny muted', style: 'margin:2px 0 0' }, 'Highlights dishes that fit you in “Identify food”, and pins your exact phrases at the top of the phrasebook to show a cook. Guidance only — always confirm in person.'));
  who.append(dietPicker());
  who.append(field('Trip length', selectEl([['', 'Not set'], ['short', 'Short (≤1 week)'], ['medium', '2–3 weeks'], ['long', '1 month+']],
    p.prefs.tripLength || '', (v) => { p.prefs.tripLength = v; save(); })));
  who.append(h('p', { class: 'tiny muted', style: 'margin:8px 0 0' }, 'Budget and interests are set in the profile card above.'));
  // The guides that go WITH this profile (family/kids, baby supplies, accessibility) live
  // right here in Settings too, resolved to where the traveller is focused — so "travelling
  // with baby and kids and all that" is set AND opened from one place.
  const whoCC = focusSpot().spot.country;
  const guideLinks = [];
  if ((p.prefs.party === 'family' || p.prefs.withBaby) && getFamily(whoCC))
    guideLinks.push(h('button', { class: 'btn ghost block', style: 'margin-top:6px', onclick: () => go(`#family-${whoCC}`) }, '👨‍👩‍👧 Travelling with kids — schools, childcare & things to do'));
  if (p.prefs.withBaby)
    guideLinks.push(h('button', { class: 'btn ghost block', style: 'margin-top:6px', onclick: () => go(`#baby-${whoCC}`) }, '🍼 Baby: nappies, formula & family help'));
  if ((p.prefs.access || []).length && getAccessibility(whoCC))
    guideLinks.push(h('button', { class: 'btn ghost block', style: 'margin-top:6px', onclick: () => go(`#access-${whoCC}`) }, '♿ Accessibility where you are'));
  if (guideLinks.length) { who.append(h('p', { class: 'muted', style: 'margin:12px 0 2px' }, 'Guides for your situation')); guideLinks.forEach((b) => who.append(b)); }
  wrap.append(who);

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

  // Reminders — server-free: per-entry lead time on the calendar + an optional daily
  // journal nudge. Always in-app on Home; device notifications are opt-in + best-effort.
  const rset = reminders.settings();
  const remCard = h('div', { class: 'card' }, [
    h('h2', { style: 'margin-top:0' }, 'Reminders'),
    h('p', { class: 'muted', style: 'margin:4px 0 8px' }, 'Set a reminder on any calendar entry, with its own lead time. Reminders always appear on the “Coming up” card on Home. Allow notifications for a device alert while the app is open or when you next open it — background alerts when the app is fully closed are not available, because there is no server.'),
  ]);
  remCard.append(h('button', { class: 'btn ghost block',
    onclick: async () => { const ok = await reminders.requestNotify(); reminders.tick(); alert(ok ? 'Device notifications are on.' : 'Notifications are off — you can enable them for this site in your browser settings.'); render(); } },
    (reminders.notifyGranted() && rset.notify) ? '🔔 Device notifications: on' : '🔔 Allow device notifications'));
  remCard.append(field('Default reminder for new entries', selectEl(reminders.LEADS.map((l) => [String(l[0]), l[1]]), String(rset.defaultLead), (v) => { reminders.setDefaultLead(v); })));
  remCard.append(h('button', { class: 'btn ghost block', style: 'margin-top:6px', 'aria-pressed': rset.journalDaily ? 'true' : 'false',
    onclick: () => { reminders.setJournalDaily(!reminders.settings().journalDaily); reminders.tick(); render(); } },
    rset.journalDaily ? '📔 Daily journal reminder: on' : '📔 Remind me to journal each day'));
  if (rset.journalDaily) remCard.append(field('Journal reminder time', h('input', { type: 'time', value: rset.journalTime, onchange: (e) => { reminders.setJournalTime(e.target.value); reminders.tick(); } })));
  wrap.append(remCard);

  // Your data — protected across updates, and yours to back up / move between devices.
  const dataCard = h('div', { class: 'card' }, [
    h('h2', { style: 'margin-top:0' }, 'Your data'),
    h('p', { class: 'muted', style: 'margin:4px 0 8px' }, 'Everything you create — journal entries and photos, ratings and reviews, trip, budget, calendar, saved places and collections — stays on this device and is kept safe across app updates. It is written to three places on your device after every change (two in app storage, one in a separate database), so a single glitch can never wipe it. The one thing this app cannot do on its own is survive losing or wiping the device — so download a copy to keep somewhere safe. Nothing is ever uploaded.'),
  ]);
  // On-device durability status — filled in asynchronously (persisted flag + space used).
  const statusP = h('p', { class: 'tiny muted', style: 'margin:0 0 8px' }, 'Checking on-device storage…');
  dataCard.append(statusP);
  // A gentle reminder to keep an off-device copy when none exists or it has gone stale.
  const anyData = (store.journal.entries.length || store.trip.budgetLog.length || store.calendar.items.length
    || (store.pins || []).length || Object.keys(store.placeData || {}).length);
  const lastBak = store.profile.prefs.lastBackupAt || '';
  const staleBak = anyData && (!lastBak || daysUntilISO(lastBak) <= -14);
  if (staleBak) {
    dataCard.append(h('p', { class: 'nudge-line', style: 'margin:0 0 8px' },
      lastBak ? '⏳ It has been a while since you saved a copy — a fresh one keeps your latest entries safe.'
        : '⭐ Save your first copy now so nothing can ever be lost.'));
  }
  // The readable, shareable deliverable comes first — this is what most people want when
  // they "download their trip". The raw JSON below it is a technical restore file, relabelled
  // so no one mistakes it for something to read.
  dataCard.append(h('button', { class: 'btn block', style: 'margin-bottom:6px', onclick: () => go('#export') },
    '📖 Save or share my trip — readable book, photos & spreadsheet'));
  dataCard.append(h('p', { class: 'tiny muted', style: 'margin:0 0 10px' },
    'Your journal, reviews, photos and spending as files you can open, read and share on any device — beautifully laid out, not raw data.'));
  const dlBtn = h('button', { class: 'btn ' + (staleBak ? 'block' : 'ghost block') }, '💾 Download a safety copy (to move to a new device)');
  dlBtn.onclick = async () => {
    dlBtn.disabled = true; const label = dlBtn.textContent; dlBtn.textContent = 'Preparing backup…';
    try {
      const bundle = await buildBackupBundle();
      const blob = new Blob([JSON.stringify(bundle)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const d = new Date();
      const stamp = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const a = document.createElement('a'); a.href = url; a.download = `mekonging-backup-${stamp}.json`;
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 2000);
      store.profile.prefs.dataBackupDone = true;
      store.profile.prefs.lastBackupAt = todayISO(); save();
    } catch { alert('Could not create the backup file on this device.'); }
    dlBtn.disabled = false; dlBtn.textContent = label;
  };
  dataCard.append(dlBtn);
  dataCard.append(h('p', { class: 'tiny muted', style: 'margin:4px 0 0' },
    'A complete data file for restoring everything onto a new phone. It is not meant to be read — for something nice to look at, use the travel book above.'));
  // "Extra protection" — the app's own safety (a triple on-device write + IndexedDB mirror)
  // is ALWAYS active, so this control never reports a failure or a browser limitation. It
  // additionally asks the browser to mark storage evict-resistant; whether or not the browser
  // grants that flag, the result is framed positively and truthfully — and always points the
  // traveller to the one guaranteed safeguard: a downloaded copy.
  const persistBtn = h('button', { class: 'btn ghost block', style: 'margin-top:6px; display:none' }, '🔒 Turn on maximum protection');
  const protectMsg = h('p', { class: 'tiny', style: 'margin:6px 0 0; display:none' });
  persistBtn.onclick = async () => {
    persistBtn.disabled = true; const lbl = persistBtn.textContent; persistBtn.textContent = 'Turning on…';
    let granted = false;
    try { granted = await requestPersistence(); } catch { granted = false; }
    store.profile.prefs.protectionOn = true; save();
    persistBtn.style.display = 'none';
    protectMsg.style.display = '';
    protectMsg.style.color = 'var(--green, #4a7a5a)';
    protectMsg.textContent = granted
      ? '✅ Maximum protection is on. Your data is saved in three places on this device, and your browser has locked it against low-storage cleanups. For a copy you keep forever, download a backup above.'
      : '✅ Protection is on. Your data is saved in three separate places on this device after every change, so nothing here is lost to an app update or a glitch. The one thing no app can survive is losing the device itself — so download a backup above to keep a copy that is truly yours.';
  };
  dataCard.append(persistBtn, protectMsg);
  storageStatus().then((st) => {
    const bits = [];
    // Always lead with what is guaranteed (the app's own triple write), never with a browser
    // shortcoming — so no traveller is ever told "your browser does not offer this".
    if (st.persisted === true) bits.push('🔒 Fully protected — saved in three places on this device and locked against low-storage cleanups.');
    else { bits.push('🛡️ Protected — your data is saved in three separate places on this device after every change.'); if (!store.profile.prefs.protectionOn) persistBtn.style.display = ''; }
    if (st.usageMB != null) bits.push(`Using about ${st.usageMB < 1 ? 'under 1' : Math.round(st.usageMB)} MB.`);
    bits.push(store.profile.prefs.lastBackupAt ? `Last copy saved ${store.profile.prefs.lastBackupAt}.` : 'No off-device copy saved yet.');
    statusP.textContent = bits.join(' ');
  }).catch(() => { statusP.textContent = '🛡️ Protected — your data is saved in three separate places on this device.'; });
  const restoreInput = h('input', { type: 'file', accept: 'application/json,.json', style: 'display:none', 'aria-label': 'Choose a backup file to restore',
    onchange: (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = async () => {
        if (!confirm('Restore this backup? It replaces the journal, photos, budget and other data currently on this device.')) { e.target.value = ''; return; }
        const res = await restoreBackupFile(String(reader.result || ''));
        if (res.ok) {
          applyTheme();
          const c = res.counts || {};
          alert(`Restored ${c.journal || 0} journal, ${c.budget || 0} budget, ${c.calendar || 0} calendar entries${c.photos ? ` and ${c.photos} photos` : ''}.`);
          go('#home');
        } else alert(res.error || 'Could not restore that file.');
        e.target.value = '';
      };
      reader.readAsText(file);
    } });
  dataCard.append(restoreInput);
  dataCard.append(h('button', { class: 'btn ghost block', style: 'margin-top:6px', onclick: () => restoreInput.click() }, '⬆️ Restore from a backup file'));
  wrap.append(dataCard);

  // reset
  wrap.append(h('div', { class: 'card' }, [
    h('button', { class: 'btn ghost block', onclick: () => {
      if (confirm('Reset EVERYTHING on this device — including your journal and budget? This cannot be undone. Consider downloading a backup first.')) { resetAll(); applyTheme(); go('#home'); }
    } }, 'Reset everything'),
    h('p', { class: 'disclaimer' }, 'Your data is kept safe across app updates — an update never erases your journal, budget or saved places. This button is the only in-app way to wipe them, and clearing your browser storage would also remove them.'),
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
function selectEl(options, current, onchange, ariaLabel) {
  const opts = options.map((o) => Array.isArray(o) ? o : [o, o]);
  const attrs = { onchange: (e) => onchange(e.target.value) };
  if (ariaLabel) attrs['aria-label'] = ariaLabel;
  return h('select', attrs,
    opts.map(([val, lbl]) => h('option', { value: val, selected: val === current ? '' : null }, lbl)));
}

function spotForKey(key) { return WEATHER_SPOTS.find((s) => spotKey(s) === key) || null; }

// A single location dropdown (cities grouped by country) that defaults to the given
// spotKey — used everywhere a traveller picks "where they are" instead of a wall of
// chips. Pass the resolved focus/weather key so it always opens on the current location.
function locationSelect(currentKey, onChange) {
  const sel = h('select', { class: 'loc-select', 'aria-label': 'Choose your location', onchange: (e) => onChange(e.target.value) });
  COUNTRIES.forEach((c) => {
    const spots = spotsForCountry(c.id);
    if (!spots.length) return;
    sel.append(h('optgroup', { label: `${c.flag} ${c.name}` },
      spots.map((s) => h('option', { value: spotKey(s), selected: spotKey(s) === currentKey ? '' : null }, s.city))));
  });
  return sel;
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
      case 'exchange': return bulletinScreen(arg);
      case 'swap': return bulletinScreen('swap');
      case 'market': return bulletinScreen('gear');
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
      case 'addpin': return addPinScreen(arg);
      case 'journal': return journalDispatch(arg);
      case 'scrapbook': return scrapbookScreen();
      case 'contributions': return contributionsScreen();
      case 'journey': return journeyScreen();
      case 'calendar': return calendarDispatch(arg);
      case 'events': return eventsScreen(arg);
      case 'event': return eventScreen(arg);
      case 'weather': return weatherScreen(arg);
      case 'today': return daySuggestScreen(arg);
      case 'access': return accessScreen(arg);
      case 'baby': return babyScreen(arg);
      case 'family': return familyScreen(arg);
      case 'history': return historyScreen(arg);
      case 'setcity': return setCityScreen(arg);
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
      case 'danger': return dangerScreen();
      case 'worship': return worshipScreen(arg);
      case 'trip': return tripScreen();
      case 'expenses': return expensesScreen();
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
      case 'donate': return donateScreen();
      case 'settings': return settingsScreen();
      case 'export': return exportScreen();
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

window.addEventListener('hashchange', () => {
  stopSpeak();
  // Record where we came from for history-aware Back, unless this change WAS a Back.
  if (poppingBack) { poppingBack = false; }
  else if (lastHash && lastHash !== location.hash) { navStack.push(lastHash); if (navStack.length > 60) navStack.shift(); }
  lastHash = location.hash;
  render();
});
// Auto day/night flips as the user navigates (applyTheme runs each render); this keeps a
// left-open app in step with dawn/dusk too. Only re-applies while on the auto Classic theme.
setInterval(() => {
  if ((store.profile.skin || 'classic') === 'classic' && (store.profile.theme || 'auto') === 'auto') applyTheme();
}, 10 * 60 * 1000);
// React immediately when the traveller flips their device between light and dark while on
// the auto Classic theme, so the app tracks the OS setting without waiting for a navigation.
try {
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    if ((store.profile.skin || 'classic') === 'classic' && (store.profile.theme || 'auto') === 'auto') applyTheme();
  });
} catch { /* older browsers: the interval + per-render applyTheme still cover it */ }
// Re-render when device voices finish loading so speak buttons enable on the phrasebook.
if (typeof window !== 'undefined' && window.speechSynthesis) {
  try { window.speechSynthesis.addEventListener('voiceschanged', () => {
    if ((location.hash || '').startsWith('#phrasebook')) render();
  }); } catch { /* older API */ }
}
render();

// Durability, best-effort: request evict-resistant storage, and if localStorage came back
// empty (cleared/blocked) recover the whole store from the IndexedDB mirror, then re-render.
try {
  ensureDurability().then((r) => { if (r && r.recovered) render(); }).catch(() => {});
} catch { /* durability is best-effort */ }

// Fire any due reminders (missed while away) + schedule this session's near-future ones,
// and the optional daily journaling nudge. Best-effort + in-app; see js/reminders.js.
try { reminders.tick(); } catch { /* reminders are best-effort */ }

// Refresh exchange rates in the background when online; update the converter if open.
if (online()) refreshRates().then(() => { if ((location.hash || '').startsWith('#currency')) render(); }).catch(() => {});
