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
  addStop, removeStop, moveStop, updateStop, addBudgetItem, deleteBudgetItem, updateBudgetItem, addWithdrawal, deleteWithdrawal, updateWithdrawal,
  addPlaceVisit, removePlaceVisit, visitsForStop, unscheduledVisits,
  setMyStay, getMyStay, clearMyStay,
  getLastFix, setLastFix,
  getSavedAreas, addSavedArea, removeSavedArea,
  ensureMe, setMe, getContacts, getContact, addContact, removeContact,
  getInbox, addInboxItem, deleteInboxItem, unreadInboxCount,
  getListings, addListing, removeListing,
  getThread, addMessage, markThreadRead, unreadThreadCount, unreadMessagesCount,
  getBoardPosts, addBoardPost, deleteBoardPost,
  getAudioPacks, hasAudioPack, addAudioPack,
} from './state.js';
import {
  getActiveCountry, setActiveCountry,
  getLiveMapCtrl, setLiveMapCtrl, getLiveCleanup, setLiveCleanup, teardownLiveScreen,
} from './app-state.js';
// Home is the Great Split's proof case (OVERHAUL.md section 9, F2) — the first screen
// physically moved out of main.js. It reaches back in for shared helpers (a circular
// import, safe because every one of them is only read inside a function body, never at
// module-evaluation time — see js/data/regions.js's lazy-load fact 2 for the same reasoning).
import {
  LANGS, uiLang, uiLangMeta, setUiLang, applyDocLang, translateTree, autoTranslateTree,
  detectPreferredLang, mtEnabled, setMtEnabled, dateLocale, ensureUiStrings, uiStringsReady,
} from './i18n.js';
import { homeScreen } from './screens/home.js';
import { recordVisit, contributeVisit, visitsEnabled } from './visits.js';
import { hospitalScreen } from './screens/medical.js';
import { HOSP_TAG, EMERGENCIES, EMBASSY } from './data/medical.js';
import { loadHospitals, isHospitalsLoaded, nearestCare } from './data/hospitals.js';
import { phrasebookScreen, dictionaryScreen, scriptLang, showBigPhrase } from './screens/phrasebook.js';
// Places step 4 (task #205): placesScreen itself, plus placeCard/travelerChips/saveSheet/
// tripVisitSheet, which this file's own not-yet-extracted screens (signature sights strip,
// saved, collections, trip) still reach back in for — same circular-import reasoning as above.
// Places step 5: placeScreen (the #place router case), resolveItem (savedScreen,
// collectionScreen, tripScreen's itinerary x3, feedbackScreen — all still resident here),
// jellyInSeason (a beach-nearby suggestion card), formatMonths (the danger screen's
// mosquito-peak card), and SEV_LABEL/fmtReportDate/addPlaceSecret (the Travel Circle
// share-detail + inbox screens' jelly/secret previews) — every one confirmed by a fresh grep
// across main.js, not inherited from the original scoping pass's classification.
import {
  placesScreen, placeCard, travelerChips, saveSheet, tripVisitSheet, placeScreen, resolveItem,
  jellyInSeason, formatMonths, SEV_LABEL, fmtReportDate, addPlaceSecret,
} from './screens/places.js';
import { encodeCard, parseCard, shareUrl, encodeShare, parseShare, encodeMessage, parseMessage } from './social.js';
import { CHECKLIST, CHECKLIST_UNIVERSAL } from './data/checklist.js';
import { PHOTOS } from './data/photos.js';
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
import {
  haversineKm, distanceChip, driveLabel, estDriveMin, withinNear, withinDayTrip, DAYTRIP_MAX_MIN,
  attrClass, attrTag, starsStr, isMarket, placeBucket,
  CATEGORY_FAMILIES, FAMILY_COLOR, FAMILY_META, catFamily, catColor, placeCatColor, placeFamilyKey, tierColor, swatch,
  wxTempU, wxWindU, fmtTemp, fmtWind, fmtPrecip,
  citySlug, PRICE_TIER_LABEL, tierBadge, PLACE_BUCKETS, BUCKET_COLOR, bucketColor, catTag,
  marketOpenDays, marketOnToday, marketCovered, isBeach, seaAgo,
  aqiBand, airBlock, uvBand, uvLineNode, uvTodayBlock,
  photoBlock, extUrl, sourceHref, sourcesNote, personalScore, placeWhen,
  ratingColor, effectiveRating,
} from './render-utils.js';
// The pure verdict function shared by all three "when to go" tiers (region/city/place — see
// js/data/month-verdict.js), named `verdictFor` rather than `monthVerdict` on purpose: that
// name is reserved for zones.js's own export, the one scripts/check-lazy-data.py gates the
// 'zones' lazy module on — see the comment in month-verdict.js. Used here for the CITY tier,
// which has nothing to do with that module and must not gain an incidental dependency on it.
import { verdictFor } from './data/month-verdict.js';
import {
  field, selectEl, foldable, collapsibleCard, openModal, closeAllModals, confirmAction,
  readAloudBar, stopAllReaders, currencySelect, locationSelect, spotForKey,
  online, netMode, setNetMode, infoTip, screenHint,
} from './ui-widgets.js';
import { speak, stop as stopSpeak, hasVoiceFor, say, canSay, ttsUrl, setSavedPacks } from './tts.js';
import { translate, isConfigured as translateConfigured } from './translate.js';
import { routeNodes, planRoutes, isRouteNode } from './journey.js';
import { HISTORY } from './data/history.js';
import { getRates, refreshRates, convert } from './currency.js';
import { WEATHER_SPOTS, wmo, isWet, spotKey, spotsForCountry, defaultSpot, nearestSpot, getCachedWeather, refreshWeather, refreshMany, getCachedMany, refreshMarine, getCachedMarine, refreshAir, getCachedAir } from './weather.js';
import {
  COUNTRIES, LANGUAGES, INTERESTS, COLLECTION_PRESETS,
  getCountry, getLanguage, allPlaces, getPlace,
  boardsForCountry, getBoard,
  getEvents, allEvents, getEvent,
  getFood, allFood, getDish, FOOD_CATEGORIES, FOOD_ALLERGENS,
  loadCountry, isCountryLoaded, loadAllCountries,
} from './data/regions.js';
import { ALLERGENS } from './data/allergens.js';
// nature.js (~108 KB of species data) is NOT statically imported here — see the lazy
// loadNature() below (added right after the import block), which mirrors regions.js's
// loadCountry() idiom for the same reason: a traveller who never opens Identify/Sounds/
// Dangerous should never pay to parse it.
// Thirteen single-screen data modules are NOT imported here — they are fetched by the route
// that needs them, through js/lazy-data.js, which owns the loaders and the live bindings so
// that main.js, places.js and settings.js all read one copy. ROUTE_DATA below states which
// route needs which, and the router gate awaits them exactly as it awaits country data, so
// every read in this file stays synchronous and unchanged. See js/lazy-data.js for what is
// deliberately NOT deferred, and why.
import {
  POOLS, poolsForCountry,
  TRANSPORT_HUBS, TRANSIT_SOURCES, GET_AROUND,
  suggestPlans,
  PRODUCE, PRODUCE_CATEGORIES, produceByCategory, getProduce,
  VISA, getVisa,
  zonesFor, getZone, zoneForProvince, monthVerdict, zonesByMonth,
  CROSSINGS,
  bestForCountry, getBestList,
  ACCESSIBILITY, getAccessibility,
  scamsFor,
  ARRIVAL, getArrival,
  SOUNDS,
  SCHEDULES, SCHEDULES_VERIFIED, schedulesForCountry,
  DATA_MODULES, loadData, isDataLoaded,
} from './lazy-data.js';
import { ESSENTIALS, getEssentials } from './data/essentials.js';
import { REGION_PATHS, REGION_LABELS, REGION_VIEWBOX, REGION_RIVER, REGION_PROJ } from './data/geo.js';
// regions.<cc>.js (the ADM1 province-polygon files) are NOT statically imported here — they
// are large pure geometry (27-87 KB each) needed only by the region/zone drill-down, so they
// are loaded lazily, one country at a time, by loadRegionSet() near REGIONS_BY_CC below.
import { provinceInfo } from './data/regions.info.js';
import * as Diet from './data/diet.js';

// ---- Lazy nature/wildlife data loading --------------------------------------
// NATURE_GROUPS/allSpecies/getSpecies used to be a static top-of-file import of
// js/data/nature.js (~108 KB of species data), parsed on every launch even for a
// traveller who never opens Identify/Sounds/Dangerous. Loaded on first real need
// instead, mirroring js/data/regions.js's loadCountry()/isCountryLoaded() idiom:
// same in-flight/settled promise cache, same "delete on failure so a retry gets a
// fresh attempt" shape, same isNatureLoaded() synchronous flag. allSpecies()/
// getSpecies() below stay fully synchronous either way — they return a safe empty
// default before the module resolves — so no call site changes its own shape, only
// whether it triggers/awaits the load. NATURE_GROUPS itself is a plain mutable
// binding (not a function) reassigned once loaded, for the same reason: every
// existing reference to it (a plain array read, never a call) keeps working as-is.
let NATURE_GROUPS = [];
let _natureMod = null;
let _natureLoad = null;
function isNatureLoaded() { return !!_natureMod; }
function loadNature() {
  if (_natureMod) return Promise.resolve(_natureMod);
  if (_natureLoad) return _natureLoad;
  _natureLoad = import('./data/nature.js')
    .then((mod) => { _natureMod = mod; NATURE_GROUPS = mod.NATURE_GROUPS; return mod; })
    .catch((err) => { _natureLoad = null; throw err; });
  return _natureLoad;
}
function allSpecies(filter = {}) { return _natureMod ? _natureMod.allSpecies(filter) : []; }
function getSpecies(id) { return _natureMod ? _natureMod.getSpecies(id) : null; }

// ---- lazy screen modules ----------------------------------------------------
// Six screen modules are loaded on demand rather than statically imported. Every one of them
// is reached ONLY through the router (their exports are used nowhere else in this file — the
// one exception is familyCard, which the country/explore hub renders, so 'explore' and
// 'country' request the family module below). Together they were 184 KB of the eagerly-parsed
// cold-start graph — a settings screen and a journal parsed before the first screen could
// paint, on connections where that is seconds.
//
// The screens that are NOT here are deliberate: home.js is the first thing rendered, and
// medical.js is the #hospital emergency screen, which must never depend on a fetch. places.js,
// budget.js, weather.js and phrasebook.js each export helpers used throughout this file, so
// they are not route-scoped and are left alone.
// The `bust` argument exists because a FAILED dynamic import is permanent. The spec stores the
// failure in the page's module map against that exact specifier, so importing the same URL
// again never refetches — a Retry button that re-imported './screens/settings.js' would keep
// reporting failure forever, on a connection that had already come back. A different query
// string is a different module-map entry, so the retry genuinely re-requests. The service
// worker matches its cache with ignoreSearch, so the busted URL still hits the offline copy.
const SCREEN_LOADERS = {
  calendar: (b) => import('./screens/calendar.js' + b),
  journal: (b) => import('./screens/journal.js' + b),
  nextstop: (b) => import('./screens/nextstop.js' + b),
  settings: (b) => import('./screens/settings.js' + b),
  visitors: (b) => import('./screens/visitors.js' + b),
  family: (b) => import('./screens/family.js' + b),
};
// Which modules a route needs before it can render. The router gate below awaits these the
// same way it awaits country data, so by the time a case runs its module is guaranteed
// present and every call site stays synchronous.
const ROUTE_SCREENS = {
  calendar: ['calendar'],
  journal: ['journal'], scrapbook: ['journal'], journey: ['journal'],
  nextstop: ['nextstop'],
  settings: ['settings'],
  visitors: ['visitors'],
  family: ['family'], explore: ['family'], country: ['family'],
};
const _screenMods = Object.create(null);
const _screenPending = Object.create(null);
// Modules whose load FAILED — offline before the worker had cached them, or a dropped
// connection mid-fetch. This set is what stops the gate below from spinning: it re-renders on
// failure, and without a record of the failure it would ask for the same module again, fail
// again, and leave the traveller on a loading card forever.
const _screenFailed = Object.create(null);
function screenMod(name) { return _screenMods[name] || null; }
const _screenTries = Object.create(null);
function loadScreenMod(name) {
  if (_screenMods[name]) return Promise.resolve(_screenMods[name]);
  if (!_screenPending[name]) {
    const n = _screenTries[name] = (_screenTries[name] || 0) + 1;
    _screenPending[name] = SCREEN_LOADERS[name](n > 1 ? `?retry=${n}` : '')
      .then((m) => { _screenMods[name] = m; delete _screenPending[name]; return m; })
      .catch((err) => { delete _screenPending[name]; _screenFailed[name] = true; throw err; });
  }
  return _screenPending[name];
}

// ---- lazy data modules -------------------------------------------------------
// Which js/lazy-data.js modules a route must have before it can render. Same contract as
// ROUTE_SCREENS above: the gate awaits them, so by the time a case in the switch runs, every
// read below is of real data and stays synchronous.
//
// This map is NOT maintained by hand-reading the code. `scripts/check-lazy-data.py` walks the
// call graph from every router case and fails if a route can reach one of these reads without
// being listed here — which matters because the failure it prevents is silent: an ungated read
// returns the same empty value an unknown key returns, so the screen renders with the section
// simply absent. Run it after touching any consumer, and `--report` regenerates this map.
const ROUTE_DATA = {
  access: ['accessibility'],
  arrival: ['arrival', 'visa'],
  bestlist: ['bestof'],
  bestof: ['bestof'],
  country: ['accessibility', 'bestof', 'itineraries', 'visa', 'zones'],
  crossings: ['borders', 'visa'],
  explore: ['accessibility', 'bestof', 'itineraries', 'visa', 'zones'],
  foryou: ['itineraries'],
  place: ['accessibility', 'borders', 'transit'],
  plans: ['itineraries'],
  pools: ['pools'],
  produce: ['produce'],
  region: ['zones'],
  scams: ['scams', 'visa'],
  schedules: ['schedules'],
  settings: ['accessibility'],
  sounds: ['sounds'],
  species: ['sounds'],
  transport: ['transit'],
  visa: ['visa'],
};
// Same failure record, and for the same reason, as _screenFailed above: the gate re-renders on
// failure, so without this it would re-request forever and strand an offline traveller on a
// loading card.
const _dataFailed = Object.create(null);
function loadDataMod(name) {
  return loadData(name).catch((err) => { _dataFailed[name] = true; throw err; });
}

// Regaining a connection clears the failures so a screen or its data can be fetched again
// without a restart — the same trigger the service-worker update check already uses.
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    let any = false;
    for (const k of Object.keys(_screenFailed)) { delete _screenFailed[k]; any = true; }
    for (const k of Object.keys(_dataFailed)) { delete _dataFailed[k]; any = true; }
    const head = (location.hash || '#home').slice(1).split('-')[0];
    if (any && ((ROUTE_SCREENS[head] || []).length || (ROUTE_DATA[head] || []).length)) render();
  });
}

// ---- service worker + theme -------------------------------------------------
// Register the service worker only in a secure web context (https / http localhost).
// In the native iOS wrapper the app is served over a custom scheme where SW cannot
// run and is not needed (all assets are bundled on-device), so skip it there.
if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.protocol === 'http:')) {
  window.addEventListener('load', () => {
    // updateViaCache:'none' forces the browser to byte-check sw.js against the NETWORK on every
    // update check, never serving a cached service-worker script — so a deploy is noticed even
    // when the host sets cache headers on sw.js.
    navigator.serviceWorker.register('sw.js', { updateViaCache: 'none' }).then((reg) => {
      // When a new version installs while the app is already open, offer a one-tap refresh
      // instead of silently letting a fresh cache serve into the currently-loaded modules.
      reg.addEventListener('updatefound', () => {
        const nw = reg.installing;
        if (!nw) return;
        nw.addEventListener('statechange', () => {
          if (nw.state === 'installed' && navigator.serviceWorker.controller) showUpdateToast();
        });
      });
      // Proactively check for a new worker on launch, whenever the app returns to the foreground,
      // AND the moment the device regains connectivity. An installed PWA can stay open for days
      // without a navigation, so without this an already-open app would never notice a deploy;
      // reg.update() forces the check. The `online` trigger matters most for travellers: the app
      // often sits open while offline (plane, subway, remote area), so the instant signal returns
      // it fetches any new build and — with the controllerchange reload below — adopts it silently.
      const checkForUpdate = () => { try { reg.update(); } catch { /* offline or not ready */ } };
      checkForUpdate();
      document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') checkForUpdate(); });
      window.addEventListener('online', checkForUpdate);

      // Tell the worker it may now fill the offline copy. The worker no longer precaches at
      // install time, because those requests raced the page's own module loads on exactly the
      // weak connections this app is built for. Waiting for idle costs the offline copy a few
      // seconds and buys the traveller a first screen that is not competing with a 3 MB
      // background download. requestIdleCallback is not on Safari, hence the timeout fallback.
      const warm = () => navigator.serviceWorker.ready
        .then((r) => { if (r.active) r.active.postMessage({ type: 'warm-cache' }); })
        .catch(() => { /* worker never activated — nothing to warm */ });
      if ('requestIdleCallback' in window) requestIdleCallback(warm, { timeout: 8000 });
      else setTimeout(warm, 4000);
    }).catch(() => { /* SW unavailable — the app still works, just without offline caching */ });

    // A NEW worker taking control used to force an immediate window.location.reload() here, to
    // collapse the usual two-launch update (you SEE the new build online, but the worker only
    // swaps in for the NEXT launch) into one. Removed: controllerchange can fire at any moment,
    // including right after the native photo/file picker closes (closing it backgrounds then
    // re-foregrounds the page, which retriggers checkForUpdate() above) — an unconditional
    // reload there silently wiped whatever the traveller was mid-typing (a journal entry, a
    // staged photo pick, any open form), with no error shown at all. showUpdateToast() — already
    // triggered above, at the 'installed' state, before this worker ever takes control — is now
    // the ONLY user-facing update path: tapping Refresh reloads when the traveller chooses to,
    // never mid-input.
    if (navigator.serviceWorker.controller) {
      navigator.serviceWorker.addEventListener('controllerchange', () => showUpdateToast());
    }

    // The worker precaches best-effort: one unreachable file must never abort the whole
    // offline install. The cost of that choice is that a bad connection at install time can
    // leave the offline copy quietly incomplete — and this app's whole promise is that it
    // works with no signal, so the traveller would discover the hole in a Laos village
    // rather than on hotel wifi. The worker now reports what it could not store; surface it
    // while the user still has a connection to fix it.
    navigator.serviceWorker.addEventListener('message', (e) => {
      if (!e.data || e.data.type !== 'precache-incomplete') return;
      showOfflineIncompleteToast((e.data.missing || []).length);
    });
  });
}

// Shown only when the service worker could not store part of the offline copy. Retrying is
// a re-register, which re-runs install and re-attempts exactly the files that failed.
let offlineToastShown = false;
function showOfflineIncompleteToast(count) {
  if (offlineToastShown) return;
  offlineToastShown = true;
  const toast = h('div', { class: 'update-toast', role: 'status' }, [
    h('span', {}, `Offline copy incomplete — ${count} file${count === 1 ? '' : 's'} did not download.`),
    h('button', {
      class: 'update-toast-btn',
      onclick: () => { toast.remove(); offlineToastShown = false; navigator.serviceWorker.register('sw.js', { updateViaCache: 'none' }).catch(() => { /* still offline */ }); },
    }, 'Retry'),
    h('button', { class: 'update-toast-x', 'aria-label': 'Dismiss', onclick: () => toast.remove() }, '✕'),
  ]);
  document.body.append(toast);
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

// A reusable, non-blocking "undo" toast for REVERSIBLE actions (mark done / not interested):
// the tap acts immediately and an accidental tap is recoverable, so a repeated triage gesture
// no longer fires a blocking confirm. Only one shows at a time; it auto-dismisses after a few
// seconds. Pinned above the tab bar and appended to <body>, so it survives a subtree redraw.
let undoToastTimer = null;
function showUndoToast(message, undoFn) {
  document.querySelectorAll('.snack-toast').forEach((n) => n.remove());
  if (undoToastTimer) { clearTimeout(undoToastTimer); undoToastTimer = null; }
  const close = () => { if (undoToastTimer) { clearTimeout(undoToastTimer); undoToastTimer = null; } toast.remove(); };
  const toast = h('div', { class: 'snack-toast', role: 'status' }, [
    h('span', { class: 'grow' }, message),
    h('button', { class: 'update-toast-btn', onclick: () => { try { undoFn(); } catch { /* noop */ } close(); } }, 'Undo'),
    h('button', { class: 'update-toast-x', 'aria-label': 'Dismiss', onclick: close }, '✕'),
  ]);
  document.body.append(toast);
  undoToastTimer = setTimeout(close, 5000);
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
// Settings reads/clears the captured prompt through these rather than a reverse-imported
// binding — an ES module import cannot be reassigned from the importing side.
export function getDeferredInstallPrompt() { return deferredInstallPrompt; }
export function clearDeferredInstallPrompt() { deferredInstallPrompt = null; }

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

export function applyTheme() {
  const root = document.documentElement;
  // Named visual themes ("skins") each define their own palette; Night Market rides the
  // dark token set, the others the light one. Classic follows the day/night (or fixed) choice.
  const skin = store.profile.skin || 'classic';
  const SKIN_MODE = { night: 'dark', psychnight: 'dark', expedition: 'dark', silk: 'light', tropical: 'light', psych: 'light' };
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
export function langForCountry(id) { const c = getCountry(id); return c ? c.lang : 'th'; }
setActiveCountry(detectCountryId());   // current destination context (country id) — see js/app-state.js
let pendingPinCoords = null; // coords captured by tapping the map, consumed by #addpin

// Shown on the Help screen and stamped into feedback messages. Keep in sync with
// CACHE_VERSION in sw.js on each release.
const APP_VERSION = 'mk-v0.465.0';

// The personal-hub tab reads "YOU" until the traveller sets their own name — per direct
// request, once set it shows the FULL name regardless of length: the tab bar's own CSS
// (`.tabbar button > span:last-child`) already ellipsis-truncates long labels without ever
// wrapping or breaking the bar's layout, so a long name just truncates visually instead of
// silently falling back to "YOU".
function meTabLabel() {
  const name = (store.profile.name || '').trim();
  return name || 'YOU';
}

// Tabs are anchored to what a traveller reaches for most on the ground: where they
// are (Near me), what to browse (Places), how to speak (Talk) and the map. "Saved"
// moved out of the bar (it is empty for most sessions) to a ⭐ in the header, always
// one tap away without taking prime navigation real estate. The 5th tab is the
// personal hub ("M" — the app's initial); Settings folds into it and also stays on
// the header gear, so nothing was lost by giving the slot to "your space".
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
  me: '<circle cx="12" cy="8" r="3.6"/><path d="M5.5 20a6.5 6.5 0 0 1 13 0"/>',
};
export const ICON = Object.fromEntries(Object.entries(ICON_PATH).map(([k, v]) => [k, svgIcon(v)]));
// A leading line-icon for an action chip; inherits the chip's text colour (incl. the
// white of a pressed chip) via stroke:currentColor, so it recolours with every theme.
export const chipIcon = (name) => h('span', { class: 'chip-ic', html: ICON[name] || '' });

// Per-section identity: one colour per section, keyed by the route head so the SAME
// section shows the SAME accent everywhere it appears (personal hub, Home tools, country
// hub). Icons are already section-specific per tile; this adds the consistent colour the
// user asked for. Sections sharing a destination (swap/market/exchange = "Buy or sell";
// today/weather) deliberately share a hue. Unlisted heads fall back to the brand gradient.
const SECTION_ACCENT = {
  // explore = the geographic drill-down (its own identity, distinct from Places)
  explore: '#3E8E5A', region: '#3E8E5A',
  // where you are / browse — Places and the (now merged in) Map share ONE accent
  places: '#1FA98A', place: '#1FA98A', nearby: '#1FA98A', country: '#1FA98A', setcity: '#1FA98A',
  bestof: '#1FA98A', bestlist: '#1FA98A',
  map: '#1FA98A', addpin: '#1FA98A',
  // food & nature
  food: '#E0663A', dish: '#E0663A', streetfood: '#D2542E', produce: '#CE8A3A',
  nature: '#4E9A52', species: '#4E9A52', sounds: '#3E9A7A', pools: '#2E8FB0',
  // talk
  phrasebook: '#7A5FB0', dictionary: '#8A5FA8',
  // getting around & practicalities
  transport: '#6E7BC0', route: '#6E7BC0', schedules: '#6E7BC0', crossings: '#5E6FB0',
  visa: '#B0567F', info: '#6E8FA0', history: '#9C7A3A', weather: '#3FA0C0', today: '#3FA0C0',
  events: '#C86AA0', event: '#C86AA0', prices: '#C9902B', arrival: '#E08A2E',
  // people / profiles
  family: '#D06A8A', baby: '#D06A8A', access: '#4C8AA0', worship: '#8A6FB0',
  // money
  currency: '#4C9A6A', expenses: '#E0A100', bargain: '#C77D2E',
  // plan & memories
  plans: '#2FA0A0', foryou: '#E08A2E', trip: '#2FA0A0', checklist: '#6E8F3F',
  calendar: '#3E7CB1', journal: '#C25E3A', scrapbook: '#B0567F', contributions: '#C9902B',
  saved: '#D98A3D', collection: '#D98A3D', identified: '#C08A2A',
  // exchange / social / admin / safety
  exchange: '#9C5780', swap: '#9C5780', market: '#9C5780', board: '#C9902B',
  circle: '#4C79C0', vault: '#4C6B8A', donate: '#D64545', help: '#5B8CA0',
  settings: '#7A7F87', me: '#E0663A', sos: '#D64545', danger: '#D64545',
};
function accentFor(hash) {
  const head = String(hash || '').replace(/^#/, '').split('-')[0];
  return SECTION_ACCENT[head] || '';
}
// The one true tile: a section-coloured icon badge + title + hint, with an optional badge
// count. Every tile grid (Home tools, personal hub, country hub) uses this so a section's
// colour and icon are identical wherever it shows.
export function sectionTile(x) {
  const accent = accentFor(x.hash);
  const base = x.badge ? `${x.t} — ${x.badge} new` : x.t;
  // Fold the visible one-line hint into the accessible name so screen-reader users get the
  // same description sighted users see; the icon is decorative.
  const attrs = { class: 'tile', onclick: () => go(x.hash), 'aria-label': x.d ? `${base}. ${x.d}` : base };
  if (accent) attrs.style = `--tile-accent:${accent}`;
  return h('button', attrs, [
    x.badge ? h('span', { class: 'tile-badge', title: `${x.badge} new` }, x.badge > 99 ? '99+' : String(x.badge)) : null,
    h('span', { class: 'ic', html: x.ic, 'aria-hidden': 'true' }), h('span', { class: 't' }, x.t), h('span', { class: 'd' }, x.d),
  ]);
}

// Order is home, talk, you, places, explore — You sits in the centre slot, the easiest
// thumb reach on a phone. See UX_OVERHAUL_PROMPT.md §5 W5a.
const TABS = [
  { hash: '#home', label: 'Home', svg: ICON.home },
  { hash: '#phrasebook', label: 'Talk', svg: ICON.chat },
  { hash: '#me', label: null, svg: ICON.me }, // label is computed live — see meTabLabel(); Settings lives inside this hub
  { hash: '#places', label: 'Places', svg: ICON.map }, // Places + Map, merged into one section
  { hash: '#explore', label: 'Explore', svg: ICON.compass },
];

export function go(hash) {
  if (location.hash === hash) render();
  else location.hash = hash;
}

// In-app back stack so "‹ Back" returns to the screen you actually came FROM, not a
// hardcoded parent (fixes "I opened this from Search and Back sent me somewhere I never
// saw"). The per-screen backHash is kept as the FALLBACK for a fresh load / deep link —
// and it is the fallback, not the usual case: navStack is checked first and wins whenever
// it has anything, so the fallback is cosmetic during normal in-app browsing.
//
// Persisted to sessionStorage (per-tab, not per-device — this is navigation history, not
// data) so a reload, a shared link opened fresh, or iOS discarding a backgrounded tab no
// longer wipes it. That gap — not the per-screen fallback hashes — was the actual defect
// behind most real "Back sent me to the wrong place" reports: goBack() already preferred
// navStack over the fallback every time it had one, so the fallback only ever mattered once
// navStack was empty, which used to happen on every fresh load. Every access is defensive;
// sessionStorage can throw in some contexts (private browsing with storage disabled).
function loadNavState() {
  try {
    const stack = JSON.parse(sessionStorage.getItem('mk-navstack') || '[]');
    return { stack: Array.isArray(stack) ? stack : [], hash: sessionStorage.getItem('mk-lasthash') };
  } catch { return { stack: [], hash: null }; }
}
function saveNavState() {
  try {
    sessionStorage.setItem('mk-navstack', JSON.stringify(navStack));
    sessionStorage.setItem('mk-lasthash', lastHash);
  } catch { /* noop */ }
}
const _navInit = loadNavState();
let navStack = _navInit.stack;
let poppingBack = false;
let lastHash = _navInit.hash || (typeof location !== 'undefined' && location.hash) || '#home';
function goBack(fallback) {
  // Always return to the PREVIOUS page — never jump to Home (there is a Home tab for that).
  if (navStack.length) {
    poppingBack = true;
    const target = navStack.pop();
    saveNavState();
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
export function topbar(title, backHash) {
  const hash = location.hash || '';
  const onSaved = hash.startsWith('#saved') || hash.startsWith('#collection');
  const onSos = hash.startsWith('#sos');
  const onSettings = hash.startsWith('#settings');
  const iconBtn = (label, target, svg) =>
    h('button', { class: 'topbar-ic', 'aria-label': label, title: label, onclick: () => go(target), html: svg });
  // Online/offline: one tap flips it and re-renders in place, from every screen — moved here
  // (Home chip-merge follow-up) instead of living only inside Home's own Quick access row, so
  // it sits alongside the other always-available controls (Saved, Settings, Emergency) no
  // matter where in the app a traveller happens to be.
  const netOnline = netMode() === 'online';
  const lang = uiLangMeta();
  return h('header', { class: 'topbar' }, [
    backHash ? h('button', { class: 'back', onclick: () => goBack(backHash) }, '‹ Back') : null,
    h('h1', {}, title),
    // Interface language. The control is the flag of the ACTIVE language, so a traveller who
    // reads no English can still see at a glance which language they are in and that tapping
    // here changes it. `data-no-i18n` keeps the translation pass off the flag itself.
    h('button', {
      class: 'topbar-ic topbar-lang', 'data-no-i18n': '',
      'aria-label': `Language: ${lang.name} — tap to change`, title: `${lang.native} — change language`,
      onclick: () => languageSheet(),
    }, lang.flag),
    h('button', {
      class: 'topbar-ic topbar-net', 'aria-label': netOnline ? 'Online — tap to go offline' : 'Offline — tap to go online',
      title: netOnline ? 'Online' : 'Offline', onclick: () => { setNetMode(netOnline ? 'offline' : 'online'); render(); },
    }, netOnline ? '📶' : '✈️'),
    onSaved ? null : iconBtn('Saved & collections', '#saved', ICON.star),
    onSettings ? null : iconBtn('Settings', '#settings', ICON.gear),
    // Persistent safety anchor: emergency help one tap from every screen (kept as the
    // bold red marker so it stands out from the neutral menu icons).
    onSos ? null : h('button', { class: 'topbar-sos', 'aria-label': 'Emergency help', title: 'Emergency help', onclick: () => go('#sos') }, '🆘'),
  ]);
}

// The interface-language picker, opened from the topbar flag.
//
// Every row is labelled with the language's OWN name first (`native`), because the person who
// most needs this screen cannot read the English one. The English name follows in small text
// for anyone who is picking on someone else's behalf — a guesthouse owner setting the phone up
// for a guest, say.
//
// Two tiers, and the distinction is stated on the page rather than hidden: languages with a
// bundled dictionary translate the app's navigation, safety terms and emergency phrases with
// no network at all, which is the promise the rest of this offline-first app makes.
//
// WHAT THE BUNDLED DICTIONARY IS AND IS NOT. Measured across ten representative screens
// (August 2026) it covers about 9% of visible text nodes and 3% of the words. That is not a
// shortfall to be apologised for — it is the design. The dictionary holds the chrome and the
// wording where a wrong word is dangerous: navigation, section headings, safety labels, the
// emergency phrase set. The other 97% is editorial prose — place write-ups, first-aid steps,
// scam explainers — roughly ninety thousand words that no hand-authored dictionary across 29
// languages is going to hold. Machine translation is the only honest way to reach it, so the
// picker says exactly that rather than implying the app is fully translated.
//
// Picking a non-English language therefore switches machine translation ON as part of that
// choice — the moment of intent, with the consequence stated on the button — because the
// alternative was a traveller choosing Hebrew and getting an app that was 91% English with a
// second checkbox to find. It stays switchable, and English never sends anything.
export function languageSheet() {
  const cur = uiLang();
  let close = null;
  const backdrop = h('div', { class: 'sheet-backdrop center' });

  // Choosing any non-English language turns machine translation on. Choosing English turns
  // nothing on and sends nothing. `needsMt` (no bundled dictionary at all) is now a subset of
  // this rather than the only trigger.
  const pick = (code) => {
    if (code !== 'en' && !mtEnabled()) setMtEnabled(true);
    setUiLang(code);
    if (close) close();
    // Fetch the chosen language's dictionary before repainting. Dictionaries are per-language
    // files now, so without this the screen would render once in English and then flip.
    // ensureUiStrings never rejects — a language that cannot be fetched stays English.
    ensureUiStrings(code).then(render);
  };

  const row = (l, needsMt) => h('button', {
    class: 'lang-row' + (l.code === cur ? ' on' : ''),
    'data-no-i18n': '',
    lang: l.code,
    'aria-current': l.code === cur ? 'true' : null,
    onclick: () => pick(l.code),
  }, [
    h('span', { class: 'lang-flag', 'aria-hidden': 'true' }, l.flag),
    h('span', { class: 'lang-names' }, [
      h('span', { class: 'lang-native' }, l.native),
      h('span', { class: 'lang-en' }, l.name),
    ]),
    l.code === cur ? h('span', { class: 'lang-tick', 'aria-hidden': 'true' }, '✓') : null,
  ]);

  // NB: not named `online` — that is an imported helper (js/ui-widgets.js) and shadowing it
  // inside this function would be a trap for the next person to add a network check here.
  const bundled = LANGS.filter((l) => l.ui);
  const mtOnly = LANGS.filter((l) => !l.ui);

  // Every language currently ships a bundled dictionary, so the second section renders
  // nothing. It stays here rather than being deleted because the registry's `ui` flag is the
  // thing that decides: add a language without a dictionary and it lands in a labelled section
  // that explains itself, instead of silently appearing to work offline when it cannot.
  const list = h('div', { class: 'lang-list' }, [
    ...bundled.map((l) => row(l, false)),
    ...(mtOnly.length ? [
      h('p', { class: 'lang-section' }, 'Online translation only'),
      h('p', { class: 'tiny muted', style: 'margin:0 0 8px;padding:0 12px' },
        'No built-in dictionary yet. Picking one switches on machine translation: the app’s labels go to an online service, then stay saved on your device.'),
      ...mtOnly.map((l) => row(l, true)),
    ] : []),
  ]);

  // A 30-row list is faster to filter than to scroll on a phone. Matches the native name, the
  // English name, and the code, so "Deutsch", "German" and "de" all find German.
  const filter = h('input', {
    class: 'search', type: 'search', 'aria-label': 'Find a language',
    placeholder: 'Find a language…',
  });
  filter.addEventListener('input', () => {
    const q = filter.value.trim().toLowerCase();
    for (const el of list.querySelectorAll('.lang-row')) {
      const hay = (el.textContent + ' ' + (el.getAttribute('lang') || '')).toLowerCase();
      el.style.display = !q || hay.includes(q) ? '' : 'none';
    }
  });

  // The old copy read "Also machine-translate the rest", which implied the app was already
  // translated and this was a bonus. It is the other way round: the dictionary covers the
  // chrome and the safety wording, and this is what reaches the prose. Say which is which,
  // and say what happens if it is switched off, because switching it off is what leaves a
  // traveller reading English.
  const mtRow = h('label', { class: 'lang-mt' }, [
    h('input', {
      type: 'checkbox', checked: mtEnabled() ? '' : null,
      onchange: (e) => { setMtEnabled(e.target.checked); render(); },
    }),
    h('span', {}, [
      h('strong', {}, 'Translate the longer text too'),
      h('span', { class: 'tiny muted', style: 'display:block' },
        'Navigation, headings, safety labels and the emergency phrases are translated by hand and work with no signal. The longer writing — places, first aid, scams — is machine-translated online and then saved on your device, so it stays readable offline afterwards. Turn this off and that longer writing stays in English. Emergency numbers are never sent to any service, and machine wording is a guide, not checked text.'),
    ]),
  ]);

  const dialog = h('div', { class: 'sheet lang-sheet', role: 'dialog', 'aria-label': 'Choose your language' }, [
    h('h3', { style: 'margin:0 0 2px' }, 'Choose your language'),
    h('p', { class: 'tiny muted', style: 'margin:0 0 10px' }, 'Language · Sprache · Idioma · 语言 · ภาษา · ngôn ngữ'),
    filter,
    list,
    mtRow,
    h('div', { class: 'confirm-actions' }, [
      h('button', { class: 'btn ghost', onclick: () => close && close() }, 'Close'),
    ]),
  ]);
  backdrop.append(dialog);
  backdrop.addEventListener('click', (e) => { if (e.target === backdrop) close && close(); });
  close = openModal(backdrop);
}

// A one-time contextual hint: a small dismissible tip shown once at a surface, then never
// again. NOT a spotlight/tour engine — each caller decides where to place its own hint, and
// dismissing simply records the key. Returns null once the key has been seen (so callers can
// `const t = oneTimeHint(...); if (t) node.append(t);`). Additive pref, no store bump.
export function oneTimeHint(key, text) {
  const prefs = store.profile.prefs;
  const seen = prefs.hintsSeen || (prefs.hintsSeen = {});
  if (seen[key]) return null;
  const el = h('div', { class: 'one-hint', role: 'note' }, [
    h('span', { class: 'one-hint-ic' }, '💡'),
    h('span', { class: 'grow' }, text),
    h('button', { class: 'one-hint-x', 'aria-label': 'Got it — dismiss this tip', onclick: () => {
      (prefs.hintsSeen || (prefs.hintsSeen = {}))[key] = true; save(); el.remove();
    } }, '✕'),
  ]);
  return el;
}

// Point a read-only <img> at an on-device blob, then revoke the object URL as soon as the
// browser has decoded it (or failed): the decoded bitmap is retained independently, so the
// blob URL is no longer needed and would otherwise leak for the lifetime of the page. For
// EDITABLE thumbnails that must survive re-renders, keep the URL and revoke it via liveCleanup.
export function setBlobThumb(img, key) {
  getBlob(key).then((b) => {
    if (!b) return;
    const u = URL.createObjectURL(b);
    const done = () => URL.revokeObjectURL(u);
    img.addEventListener('load', done, { once: true });
    img.addEventListener('error', done, { once: true });
    img.src = u;
  }).catch(() => {});
}

// The guided "walk-me" tour overlay (TUT-1) was removed — first-run coach marks over
// the tab bar and SOS button, offered once from Home and replayable from Help. Removed
// per user request ("remove the help windows"); every destination it pointed at is
// still reachable via the tabs/Help & FAQ themselves.

// Which bottom tab owns each route head. Destination discovery + on-the-ground info group
// under Places; trip planning, memories, money, social, safety and admin group under Home;
// Settings now lives inside the YOU hub, so its route maps to #me. Anything unlisted → Home.
//
// S5 re-triage (2026-08-13): Places used to also claim 23 country-wide REFERENCE screens
// (visa rules, accessibility, food/dish guides, festival calendars, best-of lists…) even
// though placesScreen itself never links to any of them — read start to finish, it is only
// ever the living map, its filters, an individual place, adding a pin, and the full map.
// Every one of those 23 is already reachable from Explore's own "More for X" tile decks
// (tasks #58-60, #136-139), so this was purely a tab-highlight mislabel — a traveller who
// tapped into one of them from Explore saw Places light up as active instead. Re-triaged
// under the user's own definitions: Places = what is around you right now, Explore = where
// could I go / country-wide reference. No screen moved, no link changed — only which bottom
// tab claims it. See UX_OVERHAUL_PROMPT.md W5b, task #194.
const TAB_FOR_HEAD = {
  // Explore = the geographic drill-down: country → region → city, plus the country-wide
  // reading (history, culture, country guide) reached by tapping into a country, plus every
  // country-wide reference screen re-triaged out of Places below.
  explore: '#explore', country: '#explore', region: '#explore', history: '#explore', info: '#explore',
  bestof: '#explore', bestlist: '#explore', food: '#explore', dish: '#explore', produce: '#explore',
  nature: '#explore', sounds: '#explore', species: '#explore', pools: '#explore', events: '#explore',
  event: '#explore', prices: '#explore', transport: '#explore', route: '#explore', crossings: '#explore',
  schedules: '#explore', visa: '#explore', access: '#explore', baby: '#explore', family: '#explore',
  streetfood: '#explore', board: '#explore', scams: '#explore',
  // Places = what is around you right now: the living map and its filtered list, one place's
  // own page, adding your own pin, the full offline map, setting where you are when GPS can't,
  // and the two screens tied to this exact moment (today's weather, today's picks) rather than
  // the country at large.
  places: '#places', place: '#places', map: '#places', addpin: '#places', nearby: '#places',
  arrival: '#places', weather: '#places', today: '#places', setcity: '#places',
  phrasebook: '#phrasebook',
  // The personal hub ("YOU"/name) owns everything that is about the traveller themselves:
  // their calendar, memories, money, saved things, documents — and Settings.
  me: '#me', dictionary: '#me', settings: '#me', export: '#me', identified: '#me',
  saved: '#me', collection: '#me',
  journal: '#me', scrapbook: '#me', contributions: '#me', journey: '#me', calendar: '#me',
  trip: '#me', expenses: '#me', bargain: '#me', currency: '#me', foryou: '#me', vault: '#me',
  exchange: '#me', swap: '#me', market: '#me',
  // #nextstop (S3, task #190) never got a TAB_FOR_HEAD entry, so it fell through to the
  // #home default — caught while re-triaging this same table for S5. It belongs here, not
  // Home or Explore: like trip/journey/calendar, it commits directly to store.trip.stops,
  // the traveller's own data, not a suggestion to browse (that's #plans, which stays Home).
  nextstop: '#me',
  home: '#home', '': '#home', welcome: '#home', search: '#home', checklist: '#home',
  plans: '#home', help: '#home', feedback: '#home',
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
    }, [h('span', { class: 'ic', html: t.svg }), h('span', { title: t.hash === '#me' ? meTabLabel() : null }, t.hash === '#me' ? meTabLabel() : t.label)])));
}

export function mount(node, showTabbar) {
  const app = document.getElementById('app');
  app.innerHTML = '';
  app.append(node);
  if (showTabbar) app.append(tabbar());
  // Interface language: this is THE choke point every screen passes through, so translating
  // here covers all of them — including the forty-odd screens that know nothing about i18n.
  // It runs before the announce below deliberately, so a screen reader reads the translated
  // heading rather than the English one it was built with. See js/i18n.js for why the app
  // translates its finished DOM instead of threading a t() call through every label.
  try { translateTree(app); } catch { /* a translation miss must never block a render */ }
  // The optional machine-translation pass is async (network) and strictly additive: it fills
  // in what the bundled dictionary missed, so it is fired off without awaiting and the screen
  // paints immediately in English-plus-whatever-was-cached.
  try { autoTranslateTree(app).catch(() => {}); } catch { /* best-effort */ }
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
export function logoSVG() {
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

export function contextNow() {
  const gps = getLastFix();
  let near = gps ? nearestSpotGlobal(gps) : null;
  let fix = gps, approx = false, seeded = false;
  if (!near) {
    // No GPS: fall back to the city the traveller is focused on (last scoped or planned),
    // so "right now" reflects where they are actually looking — never a blank capital default.
    const fs = focusCitySpot();
    if (fs) { near = { spot: fs, km: 0 }; fix = { lat: fs.lat, lng: fs.lng }; approx = true; }
  }
  if (!near) {
    // Fresh profile — no GPS and nothing focused yet: seed the country's default city so the
    // home "right now" strip shows real picks immediately (honestly labelled "showing <city>")
    // instead of only a permission prompt. Turning on location upgrades it to where they are.
    const ds = defaultSpot(getActiveCountry() || 'th');
    if (ds) { near = { spot: ds, km: 0 }; fix = { lat: ds.lat, lng: ds.lng }; approx = true; seeded = true; }
  }
  const now = new Date();
  const hour = now.getHours();
  const dow = now.getDay();
  const part = partOfDay(hour);
  const country = near ? near.spot.country : getActiveCountry();
  let wx = null, raining = false;
  if (near) { const rec = getCachedWeather(spotKey(near.spot)); if (rec && rec.current) { wx = rec.current; raining = isWet(wx.code); } }
  const wet = (WET_MONTHS[country] || []).includes(now.getMonth());
  const dayName = now.toLocaleDateString(dateLocale(), { weekday: 'long' });
  return { fix, near, approx, seeded, hasGps: !!gps, now, hour, dow, dayName, isWeekend: dow === 0 || dow === 6, part, country, wx, raining, wet };
}

// A compact 12-hour clock label from an hour number (0–23): 2 → "2am", 12 → "noon", 14 → "2pm".
export function fmtClock(hr) {
  hr = ((Math.round(hr) % 24) + 24) % 24;
  if (hr === 0) return '12am';
  if (hr === 12) return 'noon';
  return hr < 12 ? `${hr}am` : `${hr - 12}pm`;
}

// Forward-looking read of the focus city's cached forecast (hourly + daily). Turns "raining
// now" into an honest, actionable line: when will it ease, when will it start, is it hot today?
// Returns null when there is no usable forecast (offline with no cache) so callers fall back to
// the time-of-day tip rather than inventing weather. `mode` is 'rainNow' | 'rainSoon' | 'hot' |
// 'clear'; `hot` flags a heat day so the caller can offer a cool-off shortcut.
function forecastOutlook(rec) {
  if (!rec || !rec.current) return null;
  const cur = rec.current;
  const hours = Array.isArray(rec.hourly) ? rec.hourly : [];
  const now = new Date();
  const nowFloor = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours());
  let i = hours.findIndex((hn) => { const d = new Date(hn.t); return !isNaN(d) && d >= nowFloor; });
  if (i < 0) i = 0;
  const ahead = hours.slice(i, i + 10);   // roughly the next ten hours
  const wetHour = (hn) => isWet(hn.code) || (hn.pp != null && hn.pp >= 55);
  const today = rec.daily && rec.daily[0];
  const tmax = today && today.tmax != null ? today.tmax : (cur.temp != null ? cur.temp : null);
  const hot = tmax != null && tmax >= 33;
  const rainNow = isWet(cur.code) || (cur.precip != null && cur.precip > 0.1) || (ahead[0] ? wetHour(ahead[0]) : false);
  if (rainNow) {
    const dryIdx = ahead.findIndex((hn, k) => k > 0 && !wetHour(hn));
    if (dryIdx > 0) {
      const hr = new Date(ahead[dryIdx].t).getHours();
      return { mode: 'rainNow', hot, line: `Raining now, easing around ${fmtClock(hr)} — do an indoor morning, then head out.` };
    }
    return { mode: 'rainNow', hot, line: 'Rain around for a while — lean into indoor picks: markets, museums, a long lunch.' };
  }
  const rainIdx = ahead.findIndex((hn, k) => k > 0 && wetHour(hn));
  if (rainIdx > 0) {
    const hr = new Date(ahead[rainIdx].t).getHours();
    return { mode: 'rainSoon', hot, line: `Dry now, but rain likely from around ${fmtClock(hr)} — get outdoor sights in first.` };
  }
  if (hot) return { mode: 'hot', hot: true, line: `Hot today (${fmtTemp(tmax)}) — do sights early, then cool off at a pool, waterfall or spring.` };
  return { mode: 'clear', hot: false, line: 'A clear stretch ahead — great for viewpoints, nature and being outside.' };
}

// Home is offline-first and does not otherwise fetch weather. When the traveller has allowed
// online use, pull the focus city's forecast once (skipped when a fresh copy is already cached,
// and de-duplicated so repeated renders never stack fetches), then re-render Home so the outlook
// and the "right now" forecast line fill in. Never fetches when offline or without consent.
let _homeWxKey = '', _homeWxAt = 0;
export function ensureHomeWeather(spot) {
  if (!spot || !online()) return;
  const key = spotKey(spot);
  const rec = getCachedWeather(key);
  if (rec && rec.fetchedAt && (Date.now() - rec.fetchedAt) < 30 * 60 * 1000) return;   // fresh enough
  if (_homeWxKey === key && (Date.now() - _homeWxAt) < 60 * 1000) return;               // recent / in-flight
  _homeWxKey = key; _homeWxAt = Date.now();
  refreshWeather(spot).then((r) => {
    const hash = location.hash || '';
    if (r && (hash === '' || hash === '#' || hash === '#home')) render();
  }).catch(() => {});
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
export function setFocusSpot(spot) {
  if (!spot) return;
  const k = spotKey(spot);
  if (store.profile.prefs.focusSpotKey === k && getActiveCountry() === spot.country) return;
  store.profile.prefs.focusSpotKey = k;
  if (spot.country) setActiveCountry(spot.country);
  save();
}
export function focusSpot(explicitCountry) {
  const gps = getLastFix();
  const near = gps ? nearestSpotGlobal(gps) : null;
  const focus = focusCitySpot();
  if (explicitCountry && getCountry(explicitCountry)) {
    // A country was explicitly requested (e.g. "Today in Vietnam"): a live GPS fix inside
    // that country wins first — the traveller is actually there right now, which always
    // outranks whatever city they last browsed/set (bug fix: this used to check `focus`
    // first, so once a traveller had ever browsed, say, Chiang Mai, a later live GPS fix in
    // Pai was silently ignored — the map kept showing Chiang Mai). Else the focused/located
    // city within it, else the capital.
    if (near && near.spot && near.spot.country === explicitCountry) return { spot: near.spot, source: 'gps', km: near.km };
    if (focus && focus.country === explicitCountry) return { spot: focus, source: 'focus' };
    return { spot: defaultSpot(explicitCountry), source: 'default' };
  }
  if (near && near.spot) return { spot: near.spot, source: 'gps', km: near.km };
  if (focus) return { spot: focus, source: 'focus' };
  return { spot: defaultSpot(getActiveCountry() || 'th'), source: 'default' };
}
// The one place every explicit "use my location" control should call — NOT raw
// geolocate()+setLastFix() — so a fresh fix always updates activeCountry/the remembered
// focus city immediately, not only once some later render happens to already agree with
// GPS. Before this existed, several buttons (Home's right-now invites, Places' own locate
// chip, the "#today" trigger) only cached the raw coordinate; a traveller who crossed a
// border and re-located still saw the OLD country everywhere, because nothing had told
// activeCountry the fix disagreed with it. Mirrors what nearbyScreen/the Settings location
// toggle already did by hand; this just gives every other call site the same fix.
export async function refreshLocation() {
  const pos = await geolocate();
  setLastFix(pos);
  const nb = nearestSpotGlobal(pos);
  if (nb) setFocusSpot(nb.spot);
  return { pos, nearest: nb };
}
// Map a scoped city (by display name) to its nearest listed weather city, so browsing a
// city page quietly makes that city the traveller's focus for weather + picks.
export function spotForCity(cc, cityName) {
  if (!cityName) return null;
  const slug = citySlug(cityName);
  const inCountry = WEATHER_SPOTS.filter((s) => s.country === cc);
  const exact = inCountry.find((s) => citySlug(s.city) === slug);
  if (exact) return exact;
  const rep = allPlaces({ country: cc }).find((p) => p.coords && citySlug(p.city) === slug);
  return rep ? nearestSpot(rep.coords, cc) : null;
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
// A single tap on ✓ (done) or ✕ (not interested) removes a place from the feed. Rather than
// gate a repeated triage gesture behind a blocking confirm, the tap acts immediately and an
// "Undo" toast makes an accidental tap recoverable (see showUndoToast). unmark*/unhide* are the
// inverse used by that Undo.
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
function unmarkSpotDone(id) { const p = store.profile.prefs; p.doneSpots = (p.doneSpots || []).filter((x) => x !== id); save(); }
function unhideSpot(id) { const p = store.profile.prefs; p.hiddenSpots = (p.hiddenSpots || []).filter((x) => x !== id); save(); }
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

// ---- Travelling as: the profile lens -------------------------------------------------
// One place decides what a place means for WHO the traveller is. Ranking still lives in
// profileFitAdj()/personalScore(); this is the DISPLAY truth, so every surface says the same
// thing about the same place.
//
// The hard rule: never invent a suitability or safety verdict. Measured across the 808 place
// records (August 2026), the data supports some dimensions and not others — kidFriendly is set
// on 436, afterDark on 187, access/stepFree on 192, scamWarnings on 691, but per-venue safety,
// women's-safety and baby-facility fields are effectively absent (access.babyChange is set on
// none). So an unrecorded field returns an `unknown` entry that the UI prints as "not
// recorded", which is more useful than silence and far safer than a false negative: a
// traveller must be able to tell "no step-free access" from "nobody has checked". Those gaps
// are being filled with sourced data, not inference — afterDark, for instance, is only ever
// derived where a record's OWN listed hours settle the question (see the field's contract in
// js/data/places.th.js); the ambiguous cases stay unrecorded on purpose.
//
// Recount these with scripts/check-place-fields.py rather than trusting the figures above.
//
// Returns { good: [], warn: [], unknown: [] } of short strings, already filtered to the
// dimensions this traveller actually asked about.
function profileFit(p, prefs = store.profile.prefs) {
  const cats = p.categories || [];
  const good = [], warn = [], unknown = [];
  const family = prefs.withBaby || prefs.kids || prefs.party === 'family';

  if (family) {
    if (p.kidFriendly === true) good.push('Kid-friendly');
    else if (p.kidFriendly === false) warn.push('May not suit kids');
    else unknown.push('Kid-suitability not recorded');
    if (cats.includes('nightlife')) warn.push('Bar / nightlife venue');
    if (prefs.withBaby) {
      if (cats.includes('hike') || cats.includes('waterfall')) warn.push('Hard going with a pram or infant');
      // A wheelchair-accessible toilet and a baby-change table are not the same fact — kept as
      // its own field (access.babyChange) rather than overloading access.toilet for both.
      if (p.access && p.access.babyChange) good.push('Baby-change facilities reported');
      else unknown.push('Baby-change facilities not recorded');
    }
  }

  if ((prefs.access || []).includes('mobility')) {
    const sf = p.access && p.access.stepFree;
    if (sf === 'yes') good.push('Step-free');
    else if (sf === 'partial') warn.push('Only partly step-free');
    else if (sf === 'no') warn.push('Not step-free');
    else unknown.push('Step-free access not recorded');
    if (!sf && (cats.includes('hike') || cats.includes('waterfall'))) warn.push('Rough ground or steps likely');
    if (p.access && p.access.toilet) good.push('Accessible toilet reported');
  }

  // Solo and solo-female. There is NO per-venue safety data in this app and none is invented
  // here. What is real: scamWarnings (a field on 691 of 808 places, non-empty on 350) and
  // opening hours (on 807 of 808). Those are surfaced as concrete, checkable facts; the
  // judgement stays with the traveller, and the country-level solo guidance is one tap away
  // from the same card.
  if (prefs.soloFemale || prefs.party === 'solo') {
    if ((p.scamWarnings || []).length) warn.push(`${p.scamWarnings.length} reported scam${p.scamWarnings.length > 1 ? 's' : ''} here`);
    if (cats.includes('nightlife')) warn.push('Night venue — plan how you get back');
    if (openStateNow(p) === false) warn.push('Closed right now');
    // afterDark is a CHECKABLE OPERATIONAL FACT (does the site/road stay open or lit past
    // dusk) sourced per-place — never a safety verdict. Surfaced as a plain fact; the
    // judgement (and the "no verified safety reporting" line below) stays unchanged.
    if (p.afterDark) {
      if (p.afterDark.openAfterDark === false) good.push('Closes before dark');
      else if (p.afterDark.openAfterDark === true) warn.push(p.afterDark.lit === true ? 'Open after dark — lit' : 'Open after dark — lighting not recorded');
    }
    unknown.push('No verified safety reporting for this place');
  }

  // Diet and allergies are recorded on DISHES, never on venues — a restaurant cannot honestly
  // be called peanut-safe from the data held here. Say so, and point at what does exist.
  if ((prefs.diet || []).length && (cats.includes('food') || cats.includes('market'))) {
    unknown.push('Per-venue allergen info not recorded — check dishes and use your allergy card');
  }

  return { good, warn, unknown };
}

// The one-line "Travelling as" summary that is also the edit control. Deliberately ONE line
// rather than a persistent chip row: the profile rarely changes once set, so a permanent row
// would cost space on every screen for a control almost nobody taps twice. It appears only
// where the profile is actively shaping what is shown, and always links to the same editor
// (#foryou), so there is never a second place to change the same setting.
export function travellingAsLine() {
  const p = store.profile.prefs;
  const bits = [];
  if (p.soloFemale) bits.push('solo female');
  else if (p.party) bits.push({ solo: 'solo', couple: 'a couple', family: 'a family', group: 'a group' }[p.party] || p.party);
  if (p.withBaby) bits.push('with a baby');
  else if (p.kids) bits.push('with kids');
  if ((p.access || []).includes('mobility')) bits.push('step-free needs');
  if ((p.diet || []).length) bits.push(`${p.diet.length} dietary need${p.diet.length > 1 ? 's' : ''}`);
  const set = bits.length > 0;
  return h('button', {
    class: 'travas' + (set ? '' : ' unset'),
    onclick: () => go('#foryou'),
    'aria-label': set ? `Travelling as ${bits.join(', ')} — change` : 'Set who you are travelling as',
  }, [
    h('span', { class: 'travas-txt' }, set ? `Travelling as ${bits.join(' · ')}` : 'Tell us who you’re travelling as — results adapt'),
    h('span', { class: 'travas-edit' }, set ? '✎' : '→'),
  ]);
}

// Profile fit on a place's own page: what suits, what does not, and — stated plainly — what
// nobody has recorded yet. Renders nothing when the traveller has set no profile at all.
export function profileFitCard(p) {
  const f = profileFit(p);
  if (!f.good.length && !f.warn.length && !f.unknown.length) return null;
  const card = h('div', { class: 'card fit-card' }, [h('h3', { style: 'margin-top:0' }, '🧭 For how you’re travelling')]);
  const ul = h('ul', { class: 'fit-list' });
  f.good.forEach((t) => ul.append(h('li', { class: 'fit-good' }, t)));
  f.warn.forEach((t) => ul.append(h('li', { class: 'fit-warn' }, t)));
  f.unknown.forEach((t) => ul.append(h('li', { class: 'fit-unknown' }, t)));
  card.append(ul);
  card.append(h('p', { class: 'tiny muted', style: 'margin:6px 0 0' }, 'Not recorded means nobody has checked it yet — not that the answer is no. Verify anything that matters on the day.'));
  card.append(travellingAsLine());
  return card;
}

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
  // Only real "go visit this" places count as a "right now" pick — not a stay, a rental/
  // transport hub, or one of the orientation/practical "info" cards (e.g. "Pai practical:
  // cash, health & road safety") that exist to be read on a place's own page, not suggested
  // as somewhere to go. Same whitelist daySuggestScreen already uses, so the two surfaces
  // that offer "what to do right now" never disagree about what counts as a thing to do.
  if (!todoDoable(p)) return -Infinity;
  const km = haversineKm(ctx.fix, p.coords);
  if (!withinNear(km, p.country)) return -Infinity;   // drive-time "near you" ceiling — see NEAR_MAX_MIN
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
    // 'market' is deliberately excluded from the blanket indoor treatment below: most
    // night/walking-street markets in the region are open-air stalls, not shelter from rain
    // (see marketCovered) — only a genuinely covered market should read as rain-friendly.
    if (cats.some((c) => INDOOR_CATS.includes(c) && c !== 'market')) s += 16;
    if (cats.some((c) => OUTDOOR_CATS.includes(c))) s -= 22;
    if (cats.includes('market')) s += marketCovered(p) ? 16 : -18;
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
  if (ctx.raining) {
    // A market only reads as rain-friendly when it is actually covered — an open-air night
    // market does not get "Good in the rain" just because it also happens to serve food.
    if (cats.includes('market')) { if (marketCovered(p)) return 'Covered market — good in the rain'; }
    else if (cats.some((c) => INDOOR_CATS.includes(c))) return 'Good in the rain';
  }
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

// H3 — merged "Right now" card: the live weather/time-of-day moment, a compact filter (what
// kind of place, and roughly what it costs), and the ranked picks list — one card, one fold,
// where two used to double the standing cost of a single idea. See UX_OVERHAUL_PROMPT.md W1.
//
// The filter defaults from the traveller's own travel profile (prefs.interests, prefs.budget)
// but is local to this card, not written back to it: tweaking it here is a "show me something
// else right now" moment, not a redecision of who they are as a traveller, so it re-derives
// from the profile fresh on every mount — exactly like the single category dropdown it
// replaces already did (that, too, reset to 'all' on every mount rather than persisting).
function homeRightNowCard(ctx) {
  const meta = PART_META[ctx.part];
  const card = h('div', { class: 'card right-now' });
  // Forward-looking forecast for this city (from the cached hourly + daily), so the card tells
  // the traveller what the weather is about to do — not just this minute — and plans accordingly.
  const wxRec = ctx.near ? getCachedWeather(spotKey(ctx.near.spot)) : null;
  const outlook = forecastOutlook(wxRec);
  const cityName = ctx.near ? ctx.near.spot.city : ((getCountry(ctx.country) || {}).name || 'you');
  // The temperature is a live link into the local forecast (nearest/focused city),
  // so "check the weather here" is one tap from the home hero instead of buried in a grid.
  card.append(h('div', { class: 'rn-head' }, [
    h('span', { class: 'rn-emoji' }, meta.emoji),
    h('div', {}, [
      h('div', { class: 'rn-title' }, ctx.seeded ? `${meta.label} in ${cityName}` : (ctx.near ? `${meta.label} near ${cityName}` : `${meta.label}, ${ctx.dayName}`)),
      h('div', { class: 'rn-sub muted' }, [
        ctx.dayName,
        ctx.wx ? h('button', { class: 'rn-wx-link', onclick: () => go('#weather'), 'aria-label': `Weather forecast for ${cityName}` },
          ` · ${fmtTemp(ctx.wx.temp)}${ctx.raining ? ', rain' : ''} →`) : null,
        ctx.wet ? ' · wet season' : '',
        ctx.seeded ? ` · showing ${cityName}` : (ctx.approx ? ' · where you’re looking' : ''),
      ]),
    ]),
  ]));

  // An honest, forward-looking weather line + a heat shortcut, shown whenever a forecast is
  // cached (works before GPS too). "Raining now, easing around 2pm", "rain likely from 4pm",
  // "hot today — cool off". Absent offline with no cache, so we never invent conditions.
  if (outlook) {
    card.append(h('div', { class: 'rn-forecast' }, [
      h('span', { class: 'rn-fc-emoji' }, wxRec && wxRec.current ? wmo(wxRec.current.code)[1] : '🌤'),
      h('span', {}, outlook.line),
    ]));
    if (outlook.hot) card.append(h('button', { class: 'btn ghost block rn-cooloff', style: 'margin:6px 0 0', onclick: () => go(`#pools-${ctx.country}`) }, '🏊 Cool off — pools, springs & waterfalls →'));
  }

  if (!ctx.fix) {
    // Nothing to rank yet — the location invite is the whole story. The privacy detail moves
    // behind ⓘ instead of standing as its own sentence (site-wide copy purge, W3).
    card.append(h('p', { style: 'margin:8px 0 2px' }, meta.tip));
    card.append(h('p', { class: 'muted', style: 'margin:0 0 8px' }, ['Turn on location for live picks nearby.', infoTip('Nothing is sent anywhere — this stays on your device.')]));
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      card.append(h('button', { class: 'btn block', onclick: async (e) => {
        store.profile.prefs.geoAsked = true; save();
        e.currentTarget.textContent = 'Locating…';
        try { await refreshLocation(); } catch { /* denied/unavailable */ }
        render();
      } }, '📍 Use my location'));
    }
    return card;   // nothing below this point applies until a fix resolves
  }

  // Rank every candidate once; drawPicks() then shows the top few MINUS anything marked
  // Done or Not-interested, so dismissing one instantly promotes the next-best in its place.
  const ranked = allPlaces({ country: ctx.country })
    .map((p) => ({ p, s: scoreForNow(p, ctx) }))
    .filter((x) => x.s > -Infinity)
    .sort((a, b) => b.s - a.s);
  // Category chips + a price select — both only offered when there is a real choice; options
  // are whichever this exact ranked pool actually contains (the same CATEGORY_FAMILIES/
  // catFamily vocabulary catTag() and daySuggestScreen already use), minus stay/transport/
  // practical/other which are not "things to do right now" categories.
  const famsPresent = CATEGORY_FAMILIES.filter((f) => !['stay', 'transport', 'practical', 'other'].includes(f.key))
    .filter((f) => ranked.some((x) => (x.p.categories || []).some((c) => catFamily(c) === f.key)));
  const tiersPresent = ['low', 'mid', 'high'].filter((t) => ranked.some((x) => x.p.budgetTier === t));
  // Smart default: which of these families the traveller already told us they like, in
  // Settings — "Food & markets" covers both the food and market families, matching the one
  // onboarding option that names both. Falls back to showing everything when no profile is
  // set yet, or when none of their interests are actually present in this exact pool — never
  // a filter that silently hides everything.
  const catSet = new Set();
  (store.profile.prefs.interests || []).forEach((i) => {
    if (famsPresent.some((f) => f.key === i)) catSet.add(i);
    if (i === 'food' && famsPresent.some((f) => f.key === 'market')) catSet.add('market');
  });
  let tierFilter = tiersPresent.includes(store.profile.prefs.budget) ? store.profile.prefs.budget : 'all';
  const tipEl = h('p', { class: 'muted', style: 'margin:4px 0 8px' }, meta.tip);
  const listWrap = h('div', { class: 'rn-list' });
  const footEl = h('div', {});
  if (famsPresent.length > 1 || tiersPresent.length > 1) {
    const allChip = h('button', { class: 'chip', 'aria-pressed': catSet.size ? 'false' : 'true', onclick: () => { catSet.clear(); refreshChips(); drawPicks(); } }, 'All');
    const famChips = famsPresent.map((f) => h('button', {
      class: 'chip', 'aria-pressed': catSet.has(f.key) ? 'true' : 'false',
      onclick: () => { if (catSet.has(f.key)) catSet.delete(f.key); else catSet.add(f.key); refreshChips(); drawPicks(); },
    }, [swatch(FAMILY_COLOR[f.key]), ` ${f.emoji} ${f.label}`]));
    function refreshChips() {
      allChip.setAttribute('aria-pressed', catSet.size ? 'false' : 'true');
      famChips.forEach((btn, i) => btn.setAttribute('aria-pressed', catSet.has(famsPresent[i].key) ? 'true' : 'false'));
    }
    card.append(h('div', { class: 'rn-filter-row' }, [
      h('div', { class: 'chips' }, [allChip, ...famChips]),
      tiersPresent.length > 1 ? selectEl(
        [['all', 'Any price'], ...tiersPresent.map((t) => [t, PRICE_TIER_LABEL[t]])], tierFilter,
        (v) => { tierFilter = v; drawPicks(); }, 'Filter nearby picks by price',
      ) : null,
    ]));
  }
  card.append(tipEl, listWrap, footEl);
  { const t = oneTimeHint('rightnow-picks', 'Picks match the time of day, weather and the filters above — tweak them anytime. ✓ done or ✕ skip swaps in a new one.'); if (t) card.append(t); }

  // When the picks are seeded from the country default (no GPS, nothing focused yet), keep a
  // gentle one-tap upgrade to real local picks — the invite is not lost just because we seeded.
  if (ctx.seeded && typeof navigator !== 'undefined' && navigator.geolocation) {
    card.append(h('button', { class: 'btn ghost block', style: 'margin-top:2px', onclick: async (e) => {
      store.profile.prefs.geoAsked = true; save();
      e.currentTarget.textContent = 'Locating…';
      try { await refreshLocation(); } catch { /* denied/unavailable */ }
      render();
    } }, '📍 Use my location for picks where you are'));
  }

  function drawPicks() {
    const ex = suggestExcluded();
    // A place with no tier at all (a free viewpoint, a public trail) or tagged 'any' always
    // passes the price filter — same convention scoreForNow's own profileFitAdj already uses,
    // so "fits your price range" means the same thing everywhere in the app.
    const pool = ranked.filter((x) => {
      if (catSet.size && !(x.p.categories || []).some((c) => catSet.has(catFamily(c)))) return false;
      if (tierFilter !== 'all' && x.p.budgetTier && x.p.budgetTier !== 'any' && x.p.budgetTier !== tierFilter) return false;
      return true;
    });
    const picks = pool.filter((x) => !ex.has(x.p.id)).slice(0, 5);
    listWrap.innerHTML = ''; footEl.innerHTML = '';
    const filtered = catSet.size > 0 || tierFilter !== 'all';
    if (!picks.length) {
      tipEl.textContent = pool.length
        ? `${meta.tip} That is everything matching for now — reset below to see them again.`
        : (filtered
          ? 'Nothing nearby matches this filter right now — try widening it.'
          : `${meta.tip} Nothing is mapped very close — try “What’s near me”.`);
    } else {
      tipEl.textContent = meta.tip;
      picks.forEach(({ p }) => {
        const reason = whyNow(p, ctx);
        const km = haversineKm(ctx.fix, p.coords);
        const cats = p.categories || [];
        const er = effectiveRating(p.id, p.rating || 0);
        const dl = driveLabel(km);
        // Category + budget-tier tags use the same catTag()/tierBadge() components as every
        // other list on the site (nearby, best-of, day-suggest) — one colour vocabulary
        // everywhere a category or price tier appears, not a Home-only look.
        listWrap.append(h('div', { class: 'rn-item', style: `--cat:${placeCatColor(p)}` }, [
          h('button', { class: 'rn-open has-thumb', onclick: () => go(`#place-${p.id}`) }, [
            rnThumb(p),
            h('div', { class: 'rn-textcol' }, [
              h('div', { class: 'rn-item-main' }, [
                h('span', { class: 'rn-name' }, p.name),
                er ? h('span', { class: 'stars-static', style: `color:${ratingColor(er)}` }, starsStr(er)) : null,
              ]),
              h('div', { class: 'row-between', style: 'margin:2px 0' }, [
                h('div', { class: 'cats' }, cats.slice(0, 3).map((c) => catTag(c))),
                (p.budgetTier && !p.isPin) ? tierBadge(p.budgetTier) : null,
              ]),
              h('div', { class: 'rn-item-main' }, [
                (() => { const fit = placeFitReason(p, store.profile.prefs); return fit ? attrTag('⚠️ ' + fit) : null; })(),
                reason ? attrTag(reason) : null,
              ]),
              h('div', { class: 'rn-meta muted' }, `${dl ? `${fmtDistance(km)} · ${dl}` : fmtDistance(km)} · ${p.city}`),
            ]),
          ]),
          h('div', { class: 'rn-actions' }, [
            h('button', { class: 'rn-act done', title: 'I did this — swap in something new', 'aria-label': `Mark ${p.name} as done`, onclick: () => { markSpotDone(p.id); drawPicks(); showUndoToast(`“${p.name}” marked done`, () => { unmarkSpotDone(p.id); drawPicks(); }); } }, '✓'),
            h('button', { class: 'rn-act', title: 'Not interested — show me something else', 'aria-label': `Not interested in ${p.name}`, onclick: () => { hideSpot(p.id); drawPicks(); showUndoToast(`Hidden “${p.name}”`, () => { unhideSpot(p.id); drawPicks(); }); } }, '✕'),
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
      try { await refreshLocation(); } catch { /* denied/unavailable */ }
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
  const histCard = h('div', { class: 'card history-card' }, [h('h2', { style: 'margin-top:0' }, 'The short history'), h('p', {}, hi.blurb)]);
  { const rd = readAloudBar(() => hi.blurb); if (rd) histCard.append(rd); }
  wrap.append(histCard);
  const kf = knownForRow(hi.knownFor); if (kf) wrap.append(h('div', { class: 'card' }, [h('h3', { style: 'margin-top:0' }, 'Known for'), kf]));
  if (hi.cultureTip) wrap.append(h('div', { class: 'card' }, [h('h3', { style: 'margin-top:0' }, '🙏 Cultural respect'), h('p', {}, hi.cultureTip)]));
  const cityKeys = Object.keys(HISTORY.cities || {}).filter((k) => k.startsWith(cc + '-'));
  if (cityKeys.length) {
    wrap.append(h('h2', { class: 'home-section' }, 'City by city'));
    cityKeys.forEach((k) => {
      const ci = HISTORY.cities[k]; if (!ci || !ci.blurb) return;
      wrap.append(foldable(ci.name || k,
        h('div', {}, [h('p', {}, ci.blurb), knownForRow(ci.knownFor), ci.bestTime ? h('p', { class: 'culture-tip' }, `🗓 Best time: ${ci.bestTime}`) : null])));
    });
  }
  if (hi.sources && hi.sources.length) wrap.append(h('p', { class: 'disclaimer' }, `Sources: ${hi.sources.join(', ')}`));
  mount(wrap, 'home');
}

export function cityAboutCard(cc, slug) {
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
export function cityEssentials(cc, cityName, slug) {
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
function freshnessLine(dateStr, noun = 'This data', staleDays = 365, label) {
  const age = dataAgeDays(dateStr);
  if (age == null) return null;
  const shown = label || dateStr;
  if (age <= staleDays) {
    return h('p', { class: 'muted', style: 'margin:2px 0 8px' }, `✓ ${noun} verified ${shown}; the app re-checks this date on every open and flags it here once it ages.`);
  }
  const months = Math.max(1, Math.round(age / 30));
  return h('div', { class: 'card', style: 'border:1px solid var(--orange); margin:6px 0' }, [
    h('strong', {}, `⚠ ${noun} may be out of date`),
    h('p', { class: 'muted', style: 'margin:4px 0 0' }, `Last verified ${shown} (about ${months} month${months === 1 ? '' : 's'} ago). Treat these as a guide and confirm current figures on the ground.`),
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

// ---- COMMON SCAMS (per country) ----------------------------------------------
// One place that gathers the scams travellers actually report, so they can be recognised
// before they happen. The curated top-list (data/scams.js, web-verified) leads; the visa/
// border scams already in VISA and the airport-transport scam already in ARRIVAL are folded
// in below so nothing is duplicated across the app. Reassuring, not alarmist — these are money
// tricks, not danger, and a calm "no, thank you" plus agreeing prices first avoids almost all.
function scamsScreen(cc) {
  // Snap to a sensible country: explicit arg wins, else the last GPS fix, else browsed country.
  const fix = getLastFix();
  const near = fix ? nearestSpotGlobal(fix) : null;
  if (cc && getCountry(cc)) setActiveCountry(cc);
  else if (near) setActiveCountry(near.spot.country);
  const c = getCountry(getActiveCountry());
  const wrap = h('div', { class: 'screen' });
  wrap.append(topbar('⚠️ Common scams', c ? `#country-${getActiveCountry()}` : '#home'));
  if (!c) { wrap.append(h('p', { class: 'empty' }, 'Pick a country first.')); mount(wrap, '#home'); return; }

  wrap.append(h('p', { class: 'muted' }, `The scams travellers report most in ${c.name}. Almost all are about money, not danger — recognise the setup, agree prices first, and a calm “no, thank you” ends most of them.`));
  wrap.append(countryChips((id) => go(`#scams-${id}`), getActiveCountry()));

  const s = scamsFor(getActiveCountry());
  if (s && s.hotline) {
    // data-no-mt: same reasoning as the SOS numbers — label and dialable digits share a text
    // node, so this one stays exactly as written. See js/i18n.js.
    wrap.append(h('a', { class: 'btn block', 'data-no-mt': '', style: 'margin:8px 0', href: `tel:${String(s.hotline.number).replace(/\s/g, '')}` }, `🚔 ${s.hotline.label}: ${s.hotline.number}`));
  }

  if (s && s.top && s.top.length) {
    s.top.forEach((x) => {
      wrap.append(h('div', { class: 'card scam-card' }, [
        h('h3', { style: 'margin-top:0' }, x.title),
        h('p', { class: 'scam-how', style: 'margin:4px 0' }, [h('strong', {}, '⚠ What happens: '), x.how]),
        h('p', { class: 'scam-avoid', style: 'margin:4px 0 0' }, [h('strong', {}, '✓ Avoid it: '), x.avoid]),
      ]));
    });
  } else {
    wrap.append(h('p', { class: 'empty' }, 'A scams guide for this country is on the way.'));
  }

  // Fold in the visa/border scams already carried in VISA, with a link to the full guide.
  const v = getVisa(getActiveCountry());
  if (v && v.scams && v.scams.length) {
    const vc = h('div', { class: 'card' }, [h('h3', { style: 'margin-top:0' }, '🛂 Visa & border scams')]);
    v.scams.forEach((x) => vc.append(h('div', { class: 'warn-note' }, x)));
    vc.append(h('button', { class: 'btn ghost block', style: 'margin-top:8px', onclick: () => go(`#visa-${getActiveCountry()}`) }, 'Open the entry & visa guide'));
    wrap.append(vc);
  }

  // Point to the airport-transport scam note, which lives on the arrival hub.
  wrap.append(h('div', { class: 'card' }, [
    h('h3', { style: 'margin-top:0' }, '🚕 Getting from the airport'),
    h('p', { class: 'muted', style: 'margin:4px 0 8px' }, 'The most common first-hour trick is an airport transport overcharge. The arrival guide lists the cheapest safe way into town for each gateway.'),
    h('button', { class: 'btn ghost block', onclick: () => go(`#arrival-${getActiveCountry()}`) }, '🛬 Open the arrival guide'),
  ]));

  if (s && s.sources && s.sources.length) wrap.append(sourcesNote(s.sources, s.asOf));
  wrap.append(h('p', { class: 'disclaimer' }, 'Guidance only — scams change and situations vary. When something feels off, walk away. If you are cheated or threatened, contact the tourist police.'));
  mount(wrap, '#home');
}

// ---- JOURNEY PHASES ---------------------------------------------------------
// The three stages of a trip. The chosen phase reshapes Home so the traveller
// leads with what matters right now, while everything else is one tap away
// (collapsed, never hidden). Phase is stored in prefs.phase and self-defaults.
// "Arrived" and "Travelling" used to be two separate stages that differed only in
// emphasis (both are just "on the ground"), so they are merged into one 'traveling'
// stage. What made "Just arrived" distinct — the first-hour arrival guide — is now its
// own dismissible chip on Home (justArrivedChip(), below) rather than a whole trip
// stage, so it can be dismissed once bearings are found without losing the rest of the
// on-the-ground Home layout.
export const PHASE_ORDER = ['planning', 'traveling', 'post'];
export const PHASES = {
  planning: { emoji: '🗺️', label: 'Planning a trip', stmt: 'planning a trip', tagline: 'Research routes, visas and what fits you' },
  traveling: { emoji: '🧭', label: 'Traveling', stmt: 'traveling', tagline: 'Arrival, day-to-day and everything in between' },
  post: { emoji: '📖', label: 'Post travel', stmt: 'back from your trip', tagline: 'Reflect and make something to keep' },
};

// The big, phase-specific "what now" actions shown above the menu.
function phaseLead(phase, cc) {
  const A = {
    planning: [
      { e: '🧭', t: 'Trip plans', h: '#plans', primary: true },
      { e: '🎯', t: 'Tune “For you”', h: '#foryou' },
      { e: '🛂', t: 'Entry & visa', h: `#visa-${cc}` },
      { e: '✅', t: 'Pre-trip checklist', h: '#checklist' },
    ],
    // Was two separate arrays (arrived / traveling) before the phase merge. Arrived's own
    // distinct entries (Arrival guide, Emergency, Offline map) all stay one tap away without
    // a lead slot here: Arrival guide is now Home's dismissible "Just arrived" chip (and an
    // Explore tile), Emergency lives in the topbar on every screen, and Offline map is an
    // Explore "Getting around" tile.
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

// One prominent, phase-aware "next best action" for the top of Home. Mirrors the primary
// action of each phase in phaseLead, so a traveller (especially a fresh one) has a single
// obvious next step above the collapsed tool decks instead of a wall of equal-weight tiles.
function phaseNextBest(phase, cc) {
  const primary = {
    planning: { e: '🧭', t: 'Plan your trip', h: '#plans' },
    traveling: { e: '🧭', t: 'Things to do right now', h: `#today-${cc}` },
    post: { e: '📖', t: 'Build your scrapbook', h: '#scrapbook' },
  }[phase];
  if (!primary) return null;
  return h('button', { class: 'btn block home-next-best', style: 'margin:8px 0 2px', onclick: () => go(primary.h) },
    `${primary.e} ${primary.t} →`);
}

// Best-guess journey stage when the traveller has NOT picked one, so Home opens on a sensible
// phase instead of an unanswered question. Reads existing signals only — the earliest dated
// trip stop and the last GPS fix — and never persists; tapping a phase button is what saves a
// choice. Falls back to 'planning', the safe pre-signal default.
const INFER_IN_REGION_KM = 300;   // within ~300 km of a Mekong-region city ⇒ on the ground
export function inferPhase() {
  const start = tripStartISO();
  if (start) {
    const d = daysUntilISO(start);
    if (d > 0) return 'planning';        // trip is still ahead
    if (d >= -30) return 'traveling';    // start day through the rest of being on the road
    return 'post';                        // trip finished a while ago
  }
  // No dates: a recent fix near a region city implies they are travelling right now.
  const gps = getLastFix();
  if (gps) {
    const near = nearestSpotGlobal(gps);
    if (near && near.km <= INFER_IN_REGION_KM) return 'traveling';
  }
  return 'planning';
}

// ---- Journey companion: countdown (before you leave) + recap (after return) ----
// Trip start = the earliest dated stop the traveller has planned (no separate date field).
export function tripStartISO() {
  const dates = (store.trip.stops || []).map((s) => s.date).filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d || ''));
  dates.sort();
  return dates[0] || null;
}
export function daysUntilISO(iso) {
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
  // Once the trip has started (days <= 0), the "which phase am I in" nudge collapses to one
  // tight chip — the exact shape AND dismiss behaviour of Home's "Just arrived" chip
  // (justArrivedChip, js/screens/home.js) — instead of a full card with its own heading,
  // paragraph and button underneath. Tapping the main button IS the action; X-ing it out asks
  // for confirmation (same reasoning as Just arrived: this hides a whole prompt, not a
  // one-line tip) and sets prefs.tripStartedHidden so it does not reappear on its own. Never
  // gone for good — Settings → Journey phase can always turn it back on.
  if (days <= 0) {
    if (store.profile.prefs.tripStartedHidden) return null;
    return h('div', { class: 'just-arrived-chip', style: 'margin-top:8px' }, [
      h('button', { class: 'ja-main', onclick: () => { store.profile.prefs.phase = 'traveling'; save(); render(); } }, [
        h('span', { class: 'status-ic' }, days === 0 ? '🎉' : '🛬'),
        h('span', { class: 'status-lbl' }, days === 0 ? 'Today’s the day — switch to Traveling' : 'Trip started — switch to Traveling'),
      ]),
      h('button', {
        class: 'ja-x', 'aria-label': 'Hide the trip-started chip',
        onclick: () => {
          confirmAction({
            title: 'Hide this chip?',
            body: 'It disappears from Home. Bring it back any time from Settings → Journey phase.',
            confirmLabel: 'Hide',
          }).then((ok) => { if (ok) { store.profile.prefs.tripStartedHidden = true; save(); render(); } });
        },
      }, '✕'),
    ]);
  }
  const card = h('div', { class: 'card companion-card', style: 'margin-top:8px' });
  card.append(h('div', { class: 'countdown-num' }, [h('b', {}, String(days)), ` day${days === 1 ? '' : 's'} to go`]));
  const todo = checklistFor(cc).filter((it) => !isChecked(it.id));
  if (todo.length) {
    card.append(h('p', { class: 'muted', style: 'margin:6px 0 4px' }, `${todo.length} thing${todo.length === 1 ? '' : 's'} still on your pre-trip checklist:`));
    todo.slice(0, 3).forEach((it) => card.append(h('div', { class: 'companion-todo' }, `☐ ${it.title}`)));
    card.append(h('button', { class: 'btn ghost block', style: 'margin-top:8px', onclick: () => go(`#checklist-${cc}`) }, 'Open pre-trip checklist'));
  } else {
    card.append(h('p', { class: 'muted', style: 'margin:6px 0 0' }, 'Your checklist is done — you are ready. Safe travels!'));
  }
  return card;
}
// Gamification level badge — the same on-device points/level system shown in full on
// #contributions (Your contributions). Exported (rather than nested in returnRecapCard)
// per direct request ("gamification level should move to before tools in home post
// section") — home.js now renders it as its own standalone element directly before the
// Tools group, not buried inside the middle of the Welcome-back recap card.
export function gamifyLevelBadge() {
  const pts = gamify.contributionPoints(store);
  const lvl = gamify.levelInfo(pts);
  return h('button', { class: 'recap-level', onclick: () => go('#contributions') }, [
    h('span', { class: 'recap-level-emoji' }, lvl.emoji),
    h('span', {}, [h('b', {}, lvl.title), ` · Level ${lvl.level} →`]),
  ]);
}
function returnRecapCard() {
  const jEntries = (store.journal.entries || []).length;
  const stops = (store.trip.stops || []).length;
  const loved = Object.entries(store.placeData || {}).filter(([, d]) => d && (d.rating || 0) >= 4).length;
  const ratedN = Object.values(store.placeData || {}).filter((d) => d && (d.rating || 0) > 0).length;
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
  if (ratedN) stats.push(stat(ratedN, ratedN === 1 ? 'place rated' : 'places rated'));
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

// A multi-day destination outlook for the PLANNING stage — the focus city's forecast (next few
// days: condition, temp range, rain chance), the days that best suit being outside, and a broad
// pack note. All from the real cached/refreshed forecast; offline with no cache it invites one
// connection rather than inventing conditions. ensureHomeWeather() re-renders Home when a fetch
// lands, so this card rebuilds from fresh cache without its own refresh loop.
function destinationOutlookCard(spot) {
  const card = h('div', { class: 'card home-outlook' });
  const cityName = spot ? spot.city : 'your destination';
  card.append(h('h2', { style: 'margin-top:0' }, `🌤 ${cityName} outlook`));
  const body = h('div', {});
  card.append(body);
  const dayName = (iso, k) => {
    if (k === 0) return 'Today';
    if (k === 1) return 'Tomorrow';
    const dt = new Date(iso + 'T00:00:00');
    return isNaN(dt) ? iso : dt.toLocaleDateString(dateLocale(), { weekday: 'short' });
  };
  const days = spot ? ((getCachedWeather(spotKey(spot)) || {}).daily || []).slice(0, 6) : [];
  if (!days.length) {
    body.append(h('p', { class: 'muted', style: 'margin:0' }, online()
      ? 'Loading the forecast…'
      : 'Connect once and this shows a multi-day forecast for where you are going — the best days to be outside and what to pack. It then works offline.'));
    return card;
  }
  const rows = h('div', { class: 'outlook-days' });
  days.forEach((d, k) => rows.append(h('div', { class: 'outlook-day' }, [
    h('span', { class: 'od-day' }, dayName(d.date, k)),
    h('span', { class: 'od-emoji' }, wmo(d.code)[1]),
    h('span', { class: 'od-temp' }, `${fmtTemp(d.tmin)}–${fmtTemp(d.tmax)}`),
    h('span', { class: 'od-rain muted' }, d.rainProb != null ? `☔ ${d.rainProb}%` : ''),
  ])));
  body.append(rows);
  const good = days.map((d, k) => ({ d, k })).filter(({ d }) => (d.rainProb == null || d.rainProb < 40) && (d.tmax == null || d.tmax < 36));
  if (good.length) body.append(h('p', { class: 'muted small', style: 'margin:8px 0 0' },
    `Best for being outside: ${good.slice(0, 3).map(({ d, k }) => dayName(d.date, k).toLowerCase()).join(', ')}.`));
  const anyWet = days.some((d) => (d.rainProb || 0) >= 50 || isWet(d.code));
  const anyHeat = days.some((d) => (d.tmax != null && d.tmax >= 34) || (d.uv != null && d.uv >= 8));
  const pack = [];
  if (anyWet) pack.push('a light rain layer');
  if (anyHeat) pack.push('sun protection and water');
  if (pack.length) body.append(h('p', { class: 'muted small', style: 'margin:4px 0 0' }, `Pack ${pack.join(' and ')}.`));
  card.append(h('button', { class: 'btn ghost block', style: 'margin-top:8px', onclick: () => go('#weather') }, 'Full forecast →'));
  return card;
}

// PLANNING stage Home block — a planning hub in place of "what's near you": the days-to-go
// countdown and remaining checklist, the plan / "For you" actions, then the multi-day
// destination weather outlook trailing at the end. Order per direct request: "Your trip has
// started" (inside the countdown card) → Search everything (spliced in by home.js, directly
// before the actions row below) → "Plan your trip"/"Tune 'For you'" → the weather outlook —
// the outlook used to sit between the countdown and the actions; it now trails both instead.
function planningStageBlock(cc) {
  const wrap = h('div', {});
  const tc = tripCountdownCard(cc);   // null once X'd out past trip-start — see tripCountdownCard
  if (tc) wrap.append(tc);
  wrap.append(h('div', { class: 'home-actions', style: 'margin-top:10px' }, [
    h('button', { class: 'btn', onclick: () => go('#plans') }, '🧭 Plan your trip'),
    h('button', { class: 'btn ghost', onclick: () => go('#foryou') }, '🎯 Tune “For you”'),
  ]));
  const spot = focusSpot(cc && getCountry(cc) ? cc : undefined).spot;
  wrap.append(destinationOutlookCard(spot));
  return wrap;
}

// One stage-appropriate situational block for Home, replacing the old one-size "right now" card
// that showed near-me picks in every stage. Planning gets the outlook/countdown hub; arrived and
// travelling get the live, now forecast-aware near-me card; post gets the return recap. This is
// the core of making Home relevant to the traveller's actual stage.
export function homeStageBlock(phase, cc) {
  if (phase === 'planning') return planningStageBlock(cc);
  if (phase === 'post') return returnRecapCard();
  return homeNowCard(phase, cc);   // arrived / traveling: live near-me, now forecast-aware
}

// A photo-forward "Signature sights" showcase for Home: iconic, highly-rated, photographed
// places across the four countries, interleaved so every country appears (≤3 each, one per
// city). Inspiration on open and a warm, premium first impression — offline, self-hosted
// images only, and every card taps through to the real place. Returns null if too few map.
function signatureSightsStrip(cc) {
  const list = cc ? [getCountry(cc)].filter(Boolean) : COUNTRIES;
  if (!list.length) return null;
  const cap = cc ? 8 : 3;              // sights per country (more when scoped to one)
  const perCountry = list.map((c) => {
    const seen = new Set();
    return allPlaces({ country: c.id })
      .filter((p) => placeBucket(p) !== 'stay' && (Number(p.rating) || 0) >= 4.5 && placePhotoSrc(p))
      .sort((a, b) => (Number(b.rating) || 0) - (Number(a.rating) || 0))
      .filter((p) => { const k = p.city || p.id; if (seen.has(k)) return false; seen.add(k); return true; })
      .slice(0, cap)
      .map((p) => ({ p, flag: c.flag }));
  });
  const picks = [];
  for (let i = 0; i < cap; i++) perCountry.forEach((arr) => { if (arr[i]) picks.push(arr[i]); });
  if (picks.length < (cc ? 3 : 4)) return null;
  const strip = h('div', { class: 'sights-strip' });
  picks.slice(0, cc ? 10 : 12).forEach(({ p, flag }) => {
    // The card itself stays a single tap-through <button> (native keyboard/AT support, no
    // change in behaviour); the save action is a sibling button in a plain wrapper div rather
    // than nested inside it, since a <button> may not contain another interactive control.
    const saveBtn = h('button', {
      class: 'sight-save', 'aria-label': isFavorite(p.id) ? `Remove ${p.name} from favourites` : `Save ${p.name}`, title: 'Save',
      onclick: () => saveSheet(p.id),
    }, isFavorite(p.id) ? '★' : '☆');
    strip.append(h('div', { class: 'sight-card-wrap' }, [
      h('button', { class: 'sight-card', 'aria-label': `${p.name}, ${p.city || ''}`, onclick: () => go(`#place-${p.id}`) }, [
        h('img', { class: 'sight-photo', src: placePhotoSrc(p), alt: '', loading: 'lazy', decoding: 'async' }),
        h('span', { class: 'sight-grad', 'aria-hidden': 'true' }),
        h('span', { class: 'sight-cap' }, [
          h('span', { class: 'sight-name' }, p.name),
          h('span', { class: 'sight-city' }, `${flag} ${p.city || ''}`.trim()),
        ]),
      ]),
      saveBtn,
    ]));
  });
  const c = cc ? getCountry(cc) : null;
  return h('section', {}, [
    h('h2', { class: 'home-section' }, c ? `✨ Signature sights in ${c.name}` : '✨ Signature sights'),
    strip,
  ]);
}

// The collapsing-hero mechanism (full wordmark banner that minimised on scroll) that used to
// live here was removed when Home's H1 rebuild replaced the hero with a permanent slim bar
// (topbar() — see js/screens/home.js). welcomeScreen's own hero never used this machinery (no
// is-collapsed class, no hero-toggle button, no scroll listener), so nothing else depended on it.

// ---- Home top: compact phase switch · at-a-glance status · one "Right now" card ----
// A slim one-line phase switcher — replaces the tall 2×2 selector, the persistent tip banner
// and the "Not right?" correction line, so actionable content leads instead of chrome.
export function phaseSwitchRow(active, stored, withLabel = true) {
  const short = { planning: 'Planning', traveling: 'Traveling', post: 'Post' };
  const seg = h('div', { class: 'phase-seg compact', role: 'group', 'aria-label': 'Your journey phase' },
    PHASE_ORDER.map((k) => h('button', {
      class: 'phase-btn', 'aria-pressed': active === k ? 'true' : 'false',
      onclick: () => { store.profile.prefs.phase = k; save(); render(); },
    }, [h('span', { class: 'phase-emoji' }, PHASES[k].emoji), h('span', { class: 'phase-lbl' }, short[k])])));
  // withLabel=false: just the segmented control, no "Looks like"/"Your stage" caption — used
  // inside the collapsed Trip status row on Home, where the summary line already names the
  // stage, so the caption would repeat it.
  if (!withLabel) return seg;
  return h('div', { class: 'phase-switch' }, [
    h('span', { class: 'phase-switch-lbl' }, stored ? 'Your stage' : 'Looks like'),
    seg,
  ]);
}

// Trip total spend expressed in the traveller's home currency (summing every logged currency).
export function tripSpendHome() {
  const home = homeCurrency();
  const totals = {};
  (store.trip.budgetLog || []).forEach((b) => { const c = b.currency || '?'; totals[c] = (totals[c] || 0) + (parseFloat(b.amount) || 0); });
  let sum = 0, any = false, allKnown = true;
  for (const [c, v] of Object.entries(totals)) {
    any = true;
    if (c === home) { sum += v; continue; }
    const conv = convert(v, c, home);
    if (conv == null || isNaN(conv)) allKnown = false; else sum += conv;
  }
  return { sum, any, allKnown, home };
}

// homeStatusBand (trip countdown/day · next plan · spend · offline) used to live here as its
// own card under a separate "Trip status" collapsible. Removed — Home chip merge follow-up:
// Trip status and Quick access were two boxes both full of "chips about your trip," which was
// itself a kind of duplication. Every one of its chips now lives in the single merged
// quickAccessRow() (js/screens/home.js): the day-count folds into the Calendar chip, the
// next-plan-item folds into Calendar's sub-label, and online/offline is its own chip there.

// One-tap "spend" logger for the merged Right-now card — the same shared "Log an expense"
// card used everywhere a spend can be logged (expenseAddCard; Budget & Expenses is the
// master), plus a slim "spent today" line beneath it. Used to be its own compact inline
// row (amount/note/category only, no date, no title chips) that looked and behaved
// differently from every other place an expense gets logged — unified per user request.
// Per a later request ("tighter, less space, but don't minimize text"), this Home instance
// of the card renders `compact` (see .exp-add-compact — tighter field spacing only, no
// text shortened or hidden) and gains one quiet reference line above the form: your home
// currency against the local one, so a figure in your head can be sanity-checked before
// typing an amount, without opening the full converter on #expenses.
function quickSpendRow(id) {
  const c = getCountry(id);
  const cur = (c && c.currency) || 'THB';
  const home = homeCurrency();
  const t = todayISO();
  const box = h('div', { class: 'now-spend' });
  const draw = () => {
    box.innerHTML = '';
    // Sum every expense logged today, converting anything not already in `cur` into `cur`
    // first — a same-day expense logged in a different currency (e.g. a booking paid in USD
    // while everything else today is in THB) used to be silently dropped by a strict
    // `(b.currency || cur) === cur` match, so "Spent today" could under-report with no
    // indication anything was left out. unknownToday flags the rare case where a logged
    // currency has no cached rate, so the figure stays honest rather than quietly wrong.
    let spent = 0, unknownToday = false;
    (store.trip.budgetLog || []).forEach((b) => {
      if (b.date !== t) return;
      const amt = parseFloat(b.amount) || 0; if (!amt) return;
      const bc = b.currency || cur;
      if (bc === cur) { spent += amt; return; }
      const conv = convert(amt, bc, cur);
      if (conv == null || isNaN(conv)) unknownToday = true; else spent += conv;
    });
    // A working mini-converter in place of the old one-way "1 USD ≈ 36 THB" caption: the same
    // shared fxConverterControl the Currency and Budget screens use, compact (no rates
    // footnote) so it costs barely more height than the static line it replaces. Always
    // rendered — per direct request it must be visible while Traveling — so on the rare
    // occasion the home and local currencies match, the target falls back to another major
    // rather than showing a currency converted into itself.
    box.append(fxConverterControl(home, home !== cur ? cur : (home === 'USD' ? 'EUR' : 'USD'), { compact: true }));
    box.append(expenseAddCard({ currency: cur, afterAdd: draw, compact: true }));
    box.append(h('p', { class: 'tiny muted', style: 'margin:6px 0 0' }, [
      spent > 0 ? `Spent today: ${spent.toLocaleString()} ${cur}${unknownToday ? ' (some unknown)' : ''} · ` : 'Log an expense above. ',
      h('button', { class: 'linklike', onclick: () => go('#expenses') }, 'See all expenses →'),
    ]));
  };
  draw();
  return box;
}

// The phase-aware "Right now" pieces: the live moment, filter and picks list (all one card,
// homeRightNowCard — merged from two separate collapsibles, W1) with the phase's primary
// action lifted on top, and a one-tap spend at the foot in its own fold — see homeNowCard/
// homeFold — so each idea is tucked away independently, with the duplicated empty-state
// prompts dropped (the status band already carries dates/plan/spend).
// On-the-ground only: the SAME rich weather widget as the Weather screen itself — wxVizCard
// (metric chips to switch "layers" — Temp/Rain/Humidity/UV/Feels/Wind, the 24h watch-face
// ring, the detailed hour-by-hour strip, and the upcoming-forecast calendar) — rather than a
// small compact ring fixed to one metric, per direct request ("the weather widget should look
// like the larger one in the weather section with layers"). Used to be arrived-phase-only;
// now shows for the whole (merged) on-the-ground phase. Used to render nested at the top of
// the "Right now" card; now rendered by home.js as its own standalone card, swapped in
// placement with "Search everything" per an earlier direct request — exported so home.js can
// call it directly. wxVizCard already returns a full `.card`, so this needs no extra wrapper;
// a trailing "Full forecast →" button is appended (wxVizCard itself has no built-in link out)
// so tapping through to the full Weather screen still works exactly as the old ring did.
export function homeWeatherCard() {
  const ctx = contextNow();
  const spot = ctx.near ? ctx.near.spot : null;
  if (!spot) return null;
  const rec = getCachedWeather(spotKey(spot));
  if (!rec || !Array.isArray(rec.hourly) || !rec.hourly.length) return null;
  const card = wxVizCard(rec, spot);
  card.append(h('button', { class: 'btn ghost block', style: 'margin-top:8px', onclick: () => go('#weather') }, 'Full forecast →'));
  return card;
}

// Shared collapsible wrapper for Home's stage-block pieces — same home-group-d visual
// language as Tools/Identify/Quick access/Where you are, so collapsibility reads as one
// consistent site-wide pattern rather than a one-off look for these three. Defaults OPEN
// (nothing here was hidden before this split existed); once a traveller actually toggles
// one, that choice persists under its own pref, exactly like Quick access/Where you are do.
function homeFold(label, inner, prefKey) {
  const open = store.profile.prefs[prefKey] !== false;
  const det = h('details', { class: 'home-group-d', open: open ? '' : null });
  det.addEventListener('toggle', () => { store.profile.prefs[prefKey] = det.open; save(); });
  det.append(h('summary', { class: 'home-group' }, label), inner);
  return det;
}

function homeNowCard(phase, cc) {
  const ctx = contextNow();
  const wrap = h('div', {});

  const card = homeRightNowCard(ctx);
  const head = card.firstChild;                  // .rn-head; the primary action slots in just below it
  // The weather ring used to insert itself here (top of this card) — now rendered by home.js
  // as its own standalone foldable, swapped in placement with "Search everything" instead.
  const nb = phaseNextBest(phase, cc);
  if (nb) { nb.style.margin = '10px 0 2px'; card.insertBefore(nb, head ? head.nextSibling : null); }
  // Planning only: one concise checklist nudge for a DATED trip. The "add your dates" empty
  // state is intentionally omitted here — the status band already shows "No dates yet".
  if (phase === 'planning') {
    const startISO = tripStartISO();
    if (startISO && daysUntilISO(startISO) > 0) {
      const todo = checklistFor(cc).filter((it) => !isChecked(it.id));
      if (todo.length) {
        card.insertBefore(h('button', { class: 'btn ghost block now-line', onclick: () => go(`#checklist-${cc}`) },
          `☐ ${todo[0].title} · ${todo.length} left on your checklist →`), nb ? nb.nextSibling : (head ? head.nextSibling : null));
      }
    }
  }
  // Migrate the two old independent fold prefs (from when "Right now" and "Nearby picks" were
  // separate collapsibles) into this merged card's single pref, once — an existing traveller's
  // choice is honoured (open if either was open), never silently reset. See W1.
  if (store.profile.prefs.homeRightNowOpen === undefined
      && (store.profile.prefs.rightNowHeadOpen !== undefined || store.profile.prefs.rightNowPicksOpen !== undefined)) {
    store.profile.prefs.homeRightNowOpen = (store.profile.prefs.rightNowHeadOpen !== false) || (store.profile.prefs.rightNowPicksOpen !== false);
    save();
  }
  wrap.append(homeFold('🕒 Right now', card, 'homeRightNowOpen'));
  wrap.append(homeFold('💰 Budget', quickSpendRow(cc), 'homeBudgetOpen'));   // one-tap spend (high-value daily action)
  return wrap;
}

// homeScreen() now lives in js/screens/home.js — the Great Split's proof case (OVERHAUL.md
// section 9, F2). Imported at the top of this file.

// ---- "M" — the personal hub ("your space") ---------------------------------
// Everything that is about the traveller themselves, gathered behind one tab so it is
// reachable in a single tap from anywhere. The screen stays calm: it leads with what is
// relevant right now, then offers large, few-word tiles into the mature screens that
// already do the work (calendar, journal, money, phrases, board, saved, documents,
// settings). Settings also remains on the header gear, so folding it in costs nothing.
function countSavedPhrases() {
  const pins = (store.profile.prefs && store.profile.prefs.phrasePins) || {};
  let n = 0;
  for (const code in pins) if (Array.isArray(pins[code])) n += pins[code].length;
  return n;
}

// The "trip in numbers" strip (days travelled, places explored, journal entries, phrases
// saved, total spend) that used to sit directly under the quick-access chip row was removed
// — it duplicated that row's own Calendar/Journal/Budget figures a second time. See
// meHubScreen() below.

// The one-tap "add your name" prompt that leads You until a name is set (meHubScreen, below).
// Saves as the traveller types (same as Settings' own name field) but only re-renders — which
// is what makes the tab label, the topbar title and this very prompt disappear — once they
// actually commit it (Enter, or moving on), never on every keystroke, so typing is never
// interrupted by a mid-word repaint. Re-typing the exact same (or still-empty) value is a
// no-op, so leaving the field without changing anything never re-renders for nothing.
function nameEntryCard() {
  const input = h('input', {
    type: 'text', placeholder: 'e.g. Sam, Alex, Nok…', 'aria-label': 'Your name', value: store.profile.name || '',
  });
  const commit = () => {
    const v = input.value.trim();
    if (v === (store.profile.name || '').trim()) return;
    store.profile.name = v;
    save();
    if (v) render();
  };
  input.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); input.blur(); } });
  input.addEventListener('blur', commit);
  return h('div', { class: 'card name-entry-card' }, [
    h('h2', { style: 'margin-top:0' }, '👋 What should we call you?'),
    h('p', { class: 'muted', style: 'margin-top:0' }, 'Personalises this section and your journal exports. Optional — skip any time; add it later from here or Settings.'),
    input,
  ]);
}

function meHubScreen() {
  const wrap = h('div', { class: 'screen' });
  const name = (store.profile.name || '').trim();
  wrap.append(topbar(name ? `${name}’s space` : 'Your space'));

  // Per direct request: the name (and the identity card's live stats, incl. phrase count) no
  // longer show as their own lead card here — the name now IDENTIFIES this whole section
  // instead (the tab label above, meTabLabel(), and the topbar title just above read the
  // name directly), and every stat that card used to summarise already shows live on one of
  // the chips below (Journal's entry count, "Saved places · N", My Dictionary's phrase count)
  // — rank-collapse-never-remove, nothing here is a lost destination, only a duplicated card.
  // Until a name is set, this is where the option to add one leads instead — one tap, right
  // at the top, rather than a trip to Settings — and it steps aside for good the moment a
  // name is saved, so the chips below become the true lead.
  if (!name) wrap.append(nameEntryCard());

  const jN = store.journal.entries.length;
  const svN = (store.favorites || []).length;     // saved places
  const svP = countSavedPhrases();
  const idN = idPinCount();

  // Quick access chips — Calendar, My Dictionary, Budget and Journal lead (the four asked
  // for), then Documents, My trip, Traveller board, For you and Travel circle promoted to
  // chips too, so the whole "Trip tools" set has an at-a-glance status here. Every one of
  // these is now ALSO a chip, so the "Trip tools" tile group that used to sit below is gone
  // entirely (rank-collapse-never-remove: nothing here loses a destination — it is now
  // reached exactly one tap away, from this row, instead of two). Calendar and Budget reuse
  // Home's exact live logic — a bare label until the trip actually starts / a target is
  // actually set, then a day count and a live percentage with the same green/on-track,
  // yellow/tight, red/over colour ring. "Buy or sell" is renamed "Traveller board" here to
  // match the name the destination screen itself already uses everywhere else (its own
  // topbar, and the "🤝 Traveller board" chip inside Explore) — one name for one place.
  const chip = (ic, label, sub, onclick, extraClass) => h('button', {
    class: 'status-chip' + (extraClass ? ' ' + extraClass : ''), onclick,
  }, [h('span', { class: 'status-ic' }, ic), h('span', { class: 'status-lbl' }, sub ? `${label} · ${sub}` : label)]);

  const startISO = tripStartISO();
  const calLabel = (startISO && daysUntilISO(startISO) <= 0) ? `Day ${1 - daysUntilISO(startISO)}` : 'Calendar';

  const sp = tripSpendHome();
  const target = budgetTarget();
  let budgetLabel = 'Budget';
  let budgetSub = (sp.any && sp.sum > 0) ? `${Math.round(sp.sum).toLocaleString()} ${sp.home}${sp.allKnown ? '' : '+'}` : null;
  let budgetClass = '';
  if (target && sp.sum > 0) {
    const span = tripSpanDays();
    const dailyRate = span && span.elapsed > 0 ? sp.sum / span.elapsed : sp.sum;
    if (target.per === 'trip') {
      const pct = Math.round(sp.sum / target.amount * 100);
      budgetLabel = `${pct}% spent`; budgetSub = null;
      if (sp.sum > target.amount) budgetClass = 'budget-red';
      else if (span && span.total) budgetClass = (dailyRate * span.total > target.amount) ? 'budget-yellow' : 'budget-green';
      else budgetClass = pct >= 90 ? 'budget-yellow' : 'budget-green';
    } else {
      const pct = Math.round(dailyRate / target.amount * 100);
      budgetLabel = `${pct}% of daily budget`; budgetSub = null;
      if (dailyRate > target.amount) budgetClass = 'budget-red';
      else budgetClass = dailyRate >= target.amount * 0.9 ? 'budget-yellow' : 'budget-green';
    }
  }

  // Shared-with-you items AND circle messages both count as "things waiting for you in
  // Travel circle" — one badge, so a new chat reply is just as visible as a new shared place.
  const unread = unreadInboxCount() + unreadMessagesCount();
  wrap.append(h('div', { class: 'card home-status you-chips', style: 'margin-top:10px', role: 'group', 'aria-label': 'Quick access' }, [
    chip('📅', calLabel, null, () => go('#calendar')),
    chip('💬', name ? `${name}’s dictionary` : 'My Dictionary', svP ? `${svP} saved` : null, () => go('#dictionary')),
    chip('💰', budgetLabel, budgetSub, () => go('#expenses'), budgetClass),
    chip('📔', 'Journal', jN ? `${jN} ${jN === 1 ? 'entry' : 'entries'}` : null, () => go('#journal')),
    chip('🔒', 'Documents', null, () => go('#vault')),
    chip('🧳', name ? `${name}’s trip` : 'My trip', null, () => go('#trip')),
    chip('🤝', 'Traveller board', null, () => go('#exchange')),
    chip('🎯', 'For you', null, () => go('#foryou')),
    chip('👥', 'Travel circle', unread ? `${unread} unread` : null, () => go('#circle'), unread ? 'budget-red' : ''),
  ]));

  // (The old "Trip in numbers" strip — a second, static status-chip row directly below this
  // one, duplicating its Calendar day-count/Journal-entries/Budget-spend figures a second
  // time — is gone. Removed as a duplicate CHIP ROW, not a duplicate destination: every
  // figure it showed still shows live on the one chip above that already owns it.)

  // Coming up: reminders set on calendar entries in the next week — one tap to open.
  const up = reminders.upcoming(7);
  if (up.length) {
    const rc = h('div', { class: 'card', style: 'margin-top:12px' }, [h('h3', { style: 'margin-top:0' }, '🔔 Coming up')]);
    up.slice(0, 4).forEach((u) => {
      const it = u.item;
      const when = u.eventAt.toLocaleDateString(dateLocale(), { weekday: 'short', month: 'short', day: 'numeric' }) + (it.time ? ` ${it.time}` : '');
      rc.append(h('button', { class: 'btn ghost block reminder-row', style: 'margin-top:6px', onclick: () => go('#calendar') },
        `${CAL_ICON[it.type] || '🗓'} ${it.title} · ${when}`));
    });
    wrap.append(rc);
  }

  // (You Y3 — the by-category spend donut used to render again here, identical to Home's own
  // copy of budgetSummaryCard(). Dropped as a duplicated CARD, not a duplicated destination:
  // spend still shows in the numbers strip above and stays one tap away via the Money tile
  // below; the donut itself still renders on Home.)

  // --- Everything else in You, as chips too: every group below is a `chips` row (the exact
  // same status-chip look as the quick-access row above), not a tile grid, per direct
  // request ("turn all the your stuff in you into chips ... so users can reach everything
  // from you"). A plain destination chip (no live sub-status) reuses the same chip() helper
  // from the quick-access row above, just without a sub-line.
  const flatChip = (ic, label, hash) => chip(ic, label, null, () => go(hash));
  const chipGrp = (emoji, label, chips, open) => h('details', { class: 'home-group-d', open: open ? '' : null }, [
    h('summary', {}, h('span', { class: 'home-section', style: 'margin:0' }, `${emoji} ${label}`)),
    h('div', { class: 'chips' }, chips),
  ]);

  // Your stuff — content the traveller made or curated themselves. Open by default: this is
  // what makes You worth a separate tab from Home, so it leads. Journal is not repeated here
  // (same reasoning that already dropped "My phrases" from this group) — the chip row above
  // already covers it. Journey map (previously only reachable from deep inside Journal
  // itself) is added here: it is exactly this kind of "content you made" feature.
  const cPts = gamify.contributionPoints(store);
  const cLvl = gamify.levelInfo(cPts);
  wrap.append(chipGrp('📔', 'Your stuff', [
    flatChip('⭐', svN ? `Saved places · ${svN}` : 'Saved places', '#saved'),
    flatChip('🔍', idN ? `My identifier · ${idN}` : 'My identifier', '#identified'),
    flatChip('🗺', 'Journey map', '#journey'),
    flatChip('📸', 'Trip scrapbook', '#scrapbook'),
    flatChip('🏅', `Your contributions · ${cLvl.emoji} ${cLvl.title}`, '#contributions'),
  ], true));

  // Everything — its own section, not one more chip lost inside "You & settings" (direct
  // request: "it should be in a section of its own where the user can reach anything on the
  // site from this section"). Placed right after "Your stuff" — the second thing on the
  // screen — so the one-tap doorway to every feature is never more than a glance away.
  // #everything (built for task #199) already IS the full site index; this section's only
  // job is to make sure the traveller can actually find the door to it.
  wrap.append(chipGrp('🗂️', 'Everything', [
    flatChip('🗂️', 'All features', '#everything'),
  ], true));

  // Plan & prepare — Home's own "Planning" tools, now also one tap from You: previously these
  // three lived on Home only, with no path to them from here at all.
  wrap.append(chipGrp('🧭', 'Plan & prepare', [
    flatChip('🧭', 'Trip plans', '#plans'),
    flatChip('✅', 'Pre-trip checklist', '#checklist'),
    flatChip('🏷️', 'Bargain helper', '#bargain'),
  ], true));

  // You & settings — identity, preferences, privacy, support, and one more global feature
  // that used to have no direct path from You: Search (already on Home, now here too).
  // Export & backup moved up from deep inside Settings to one tap; "All features" moved out
  // to its own section above rather than being duplicated in both places.
  wrap.append(chipGrp('⚙️', 'You & settings', [
    flatChip('⚙️', 'Settings', '#settings'),
    flatChip('🔎', 'Search everything', '#search'),
    flatChip('📤', 'Export', '#export'),
    flatChip('❤️', 'Give back', '#donate'),
    flatChip('❓', 'Help & FAQ', '#help'),
  ], true));

  // You Y4 — the backup nudge, demoted from a full-width card in second position to a single
  // quiet dismissible line near the foot. Same trigger (a single expense is still "something
  // worth protecting") and same dismiss behaviour; only the visual weight and position changed.
  if ((store.journal.entries.length || store.trip.budgetLog.length) && !store.profile.prefs.dataBackupDone) {
    wrap.append(h('div', { class: 'row-between backup-line', style: 'margin-top:14px' }, [
      h('button', { class: 'btn ghost', style: 'flex:1;text-align:left', onclick: () => go('#settings') }, '⬇️ Back up your journal & budget'),
      h('button', { class: 'btn ghost', onclick: () => { store.profile.prefs.dataBackupDone = true; save(); render(); } }, 'Dismiss'),
    ]));
  }

  wrap.append(h('p', { class: 'disclaimer' },
    'Everything here stays on your device — no account, no tracking. Back it up in Settings so an update or a lost phone never loses your story.'));
  mount(wrap, '#me');
}

// A full, browsable index of every feature on the site, organized into clean categories —
// per direct request ("the you section should have a chip to get to every feature in the
// site organized nicely and cleanly"). Two deliberate omissions, both because they are
// already never more than one tap away regardless: the five bottom tabs themselves (Home,
// Talk, You, Places, Explore), and Emergency/SOS (pinned in the topbar on every screen).
// Also omitted: pure detail/parameterised screens reached FROM a feature rather than
// browsed TO directly (a specific place, event, species, message thread, saved collection).
// Country-scoped destinations use the currently active country — the same convention
// Explore's own tile grid already uses for identical links.
function everythingScreen() {
  const wrap = h('div', { class: 'screen' });
  wrap.append(topbar('All features', '#me'));
  wrap.append(h('p', { class: 'muted', style: 'margin:0 0 10px' },
    'Every feature on the site in one place. The five tabs at the bottom — Home, Talk, You, Places, Explore — are always one tap away, so they are not repeated here.'));

  const cc = getActiveCountry();
  const name = (store.profile.name || '').trim();
  const chip = (ic, label, hash) => h('button', { class: 'status-chip', onclick: () => go(hash) },
    [h('span', { class: 'status-ic' }, ic), h('span', { class: 'status-lbl' }, label)]);
  const grp = (emoji, label, chips) => h('details', { class: 'home-group-d' }, [
    h('summary', {}, h('span', { class: 'home-section', style: 'margin:0' }, `${emoji} ${label}`)),
    h('div', { class: 'chips' }, chips),
  ]);

  wrap.append(grp('🧭', 'Trip & planning', [
    chip('🧭', 'Trip plans', '#plans'),
    chip('🧳', name ? `${name}’s trip` : 'My trip', '#trip'),
    chip('✅', 'Pre-trip checklist', '#checklist'),
    chip('🎯', 'Tune "For you"', '#foryou'),
    chip('👣', 'Plan your next stop', '#nextstop'),
    chip('🧭', 'Full journey planner', '#route'),
    chip('🏆', 'Best of', `#bestof-${cc}`),
  ]));
  wrap.append(grp('💰', 'Money', [
    chip('💱', 'Money & prices', `#prices-${cc}`),
    chip('💰', 'Budget & Expenses', '#expenses'),
    chip('💱', 'Currency converter', '#currency'),
    chip('🏷️', 'Bargain helper', '#bargain'),
    chip('🤝', 'Cash swap', '#swap'),
    chip('🎒', 'Gear market', '#market'),
  ]));
  wrap.append(grp('📍', 'Places & map', [
    chip('🗺️', 'Map', '#places'),
    chip('⭐', 'Saved places', '#saved'),
    chip('📍', 'Near me', '#nearby'),
    chip('🛂', 'Border crossings', '#crossings'),
    chip('🏊', 'Swimming spots', `#pools-${cc}`),
    chip('🍢', 'Street food', '#streetfood'),
    chip('🙏', 'Places of worship', `#worship-${cc}`),
  ]));
  wrap.append(grp('📔', 'Content you made', [
    chip('📔', 'Journal', '#journal'),
    chip('📸', 'Trip scrapbook', '#scrapbook'),
    chip('🗺', 'Journey map', '#journey'),
    chip('🔍', 'My identifier', '#identified'),
    chip('💬', name ? `${name}’s dictionary` : 'My Dictionary', '#dictionary'),
    chip('🏅', 'Your contributions', '#contributions'),
  ]));
  wrap.append(grp('🔎', 'Identify what’s around you', [
    chip('🍜', 'Food', '#food'),
    chip('🍈', 'Produce', '#produce'),
    chip('🌿', 'Nature', '#nature'),
    chip('🔊', 'Sounds', '#sounds'),
    chip('⚠️', 'Dangerous', '#danger'),
  ]));
  wrap.append(grp('☀️', 'Weather & dates', [
    chip('🌤', 'Weather', `#weather-${cc}`),
    chip('🕒', 'Things to do today', `#today-${cc}`),
    chip('📅', 'Travel calendar', '#calendar'),
    chip('🎉', 'Festivals & holidays', `#events-${cc}`),
  ]));
  wrap.append(grp('🛂', 'Country & safety info', [
    chip('🧭', 'Country guide', `#info-${cc}`),
    chip('🛂', 'Entry & visa', `#visa-${cc}`),
    chip('🛬', 'Just arrived', `#arrival-${cc}`),
    chip('⚠️', 'Scams to know', `#scams-${cc}`),
    chip('♿', 'Accessibility', `#access-${cc}`),
    chip('🍼', 'Traveling with a baby', `#baby-${cc}`),
    chip('👪', 'Traveling with kids', `#family-${cc}`),
    chip('📜', 'History & culture', `#history-${cc}`),
    chip('🚌', 'Getting around', `#transport-${cc}`),
    chip('📋', 'Transport schedules', `#schedules-${cc}`),
  ]));
  wrap.append(grp('👥', 'People & sharing', [
    chip('👥', 'Travel circle', '#circle'),
    chip('🤝', 'Traveller board', '#exchange'),
    chip('📌', 'Local noticeboard', `#board-${cc}`),
    chip('📥', 'Inbox', '#inbox'),
    chip('❤️', 'Give back', '#donate'),
  ]));
  wrap.append(grp('⚙️', 'You & settings', [
    chip('⚙️', 'Settings', '#settings'),
    chip('🔒', 'Documents', '#vault'),
    chip('📤', 'Export', '#export'),
    chip('🔎', 'Search everything', '#search'),
    chip('✉️', 'Send feedback', '#feedback'),
    chip('❓', 'Help & FAQ', '#help'),
  ]));

  mount(wrap, '#me');
}

// Explore tab: the geographic front door. A tap on a country opens that country's hub —
// country-wide history, culture, guide and cities — and (from Wave 2) its regions map.
// Explore E1/E2 (OVERHAUL.md section 11): a REAL signal, not just a stored default, that
// tells Explore which country to land on without asking. Home's inferPhase() established
// the same convention (INFER_IN_REGION_KM) — deliberately stricter than getActiveCountry(),
// which always holds a value (defaults to 'th' via detectCountryId()) and so would never
// correctly signal "no anchor, show the chooser". Checked in order: a GPS fix within the
// region, an explicitly chosen focus city, then a dated trip stop (soonest upcoming, else
// most recent past — either is a real trip signal). Returns null — the four-country
// chooser — only when none of these hold, e.g. planning from home with nothing set yet.
function anchorCountry() {
  const gps = getLastFix();
  if (gps) {
    const near = nearestSpotGlobal(gps);
    if (near && near.km <= INFER_IN_REGION_KM) return near.spot.country;
  }
  const fs = focusSpot();
  if (fs && fs.source === 'focus' && fs.spot) return fs.spot.country;
  const dated = (store.trip.stops || []).filter((s) => s.date && s.country);
  if (dated.length) {
    const t = todayISO();
    const upcoming = dated.filter((s) => s.date >= t).sort((a, b) => (a.date < b.date ? -1 : 1))[0];
    if (upcoming) return upcoming.country;
    const past = dated.slice().sort((a, b) => (a.date < b.date ? 1 : -1))[0];
    if (past) return past.country;
  }
  return null;
}

// Explore E4 ("Fits your trip"): the traveller's own real prefs (party/budget/tripLength),
// nothing invented. Best-of lists whose forWho tag actually matches, plus the top itinerary
// from suggestPlans() (already scores by these exact prefs — reused rather than
// re-implemented). Universal lists ('everyone'/'firsttimers') always show; 'families'/
// 'budget' lists only show when the traveller's own profile actually matches, so this never
// claims relevance it cannot back up. Omits itself entirely if nothing qualifies.
function fitsYourTripSection(cc) {
  const prefs = store.profile.prefs;
  const lists = bestForCountry(cc).filter((l) => l.forWho === 'everyone' || l.forWho === 'firsttimers'
    || (l.forWho === 'families' && prefs.party === 'family')
    || (l.forWho === 'budget' && prefs.budget === 'low'));
  const plans = suggestPlans({ country: cc, tripLength: prefs.tripLength, party: prefs.party, budget: prefs.budget });
  if (!lists.length && !plans.length) return null;
  const body = h('div', {});
  if (lists.length) {
    body.append(h('div', { class: 'grid' }, lists.slice(0, 4).map((l) => h('button', { class: 'card bestof-card', onclick: () => go(`#bestlist-${l.id}`) }, [
      h('strong', {}, l.title),
      h('p', { class: 'muted tiny', style: 'margin:2px 0 0' }, l.blurb),
    ]))));
  }
  if (plans.length) {
    const top = plans[0];
    body.append(h('div', { class: 'card', style: 'margin-top:8px' }, [
      h('div', { class: 'row-between' }, [h('strong', {}, top.title), h('span', { class: 'muted tiny' }, `~${top.days}d`)]),
      h('p', { class: 'muted tiny', style: 'margin:4px 0 8px' }, top.summary),
      h('button', { class: 'btn ghost block', onclick: () => go('#plans') }, plans.length > 1 ? `See all ${plans.length} matching trip plans →` : 'See this trip plan →'),
    ]));
  }
  return h('section', {}, [h('h2', { class: 'home-section' }, '🎯 Fits your trip'), body]);
}

// Explore E5 (seasonal fit): the wet/dry read from WET_MONTHS (already used by contextNow())
// plus any real, dated festival within the next ~45 days from events.*.js, and the current
// city's own bestTime line from history.js when one exists, now led by that city's verdict for
// THIS month (Priority 10.1 gave every city bestM/avoidM alongside its bestTime prose — same
// shared monthVerdict() the region tier uses). 'shoulder' keeps the original neutral phrasing
// on purpose: it means "not specifically flagged either way", not "no data", so it earns no
// badge. Omits itself if there is nothing dated or sourced to say.
function seasonalFitSection(cc, cityName, slug) {
  const now = new Date();
  const wet = (WET_MONTHS[cc] || []).includes(now.getMonth());
  const lines = [];
  lines.push(wet ? '🌧 Wet season — expect afternoon showers; mornings are usually clear.' : '☀️ Dry season — generally reliable weather for sightseeing.');
  const soon = getEvents(cc).filter((e) => {
    if (!e.start) return false;
    const d = Math.round((new Date(e.start + 'T00:00:00') - now) / 86400000);
    return d >= 0 && d <= 45;
  }).sort((a, b) => (a.start < b.start ? -1 : 1)).slice(0, 2);
  soon.forEach((e) => lines.push(`🎉 ${e.name} — ${evShort(e.start)}${e.lunar ? ' (movable date)' : ''}.`));
  const hi = slug ? cityHistory(cc, slug) : null;
  if (hi && hi.bestTime && cityName) {
    const verdict = verdictFor(hi, now.getMonth() + 1);
    const mark = { best: '✓ Good time for', avoid: '✗ Poor time for', mixed: '± Depends where in' }[verdict];
    lines.push(mark ? `${mark} ${cityName}: ${hi.bestTime}` : `🗓 Best time for ${cityName}: ${hi.bestTime}`);
  }
  // The wet/dry line alone is still real, sourced content (not a guess) and directly answers
  // "best for this season" — one of the traveller's own explicit asks — so it is enough to
  // show on its own; this only ever omits if WET_MONTHS somehow held nothing for cc, which
  // cannot happen for any of the four countries this app covers.
  if (!lines.length) return null;
  return h('section', {}, [
    h('h2', { class: 'home-section' }, '📅 Right now, seasonally'),
    h('div', { class: 'card' }, lines.map((t) => h('p', { style: 'margin:4px 0' }, t))),
    soon.length ? h('button', { class: 'btn ghost block', style: 'margin-top:6px', onclick: () => go(`#events-${cc}`) }, 'All festivals & holidays →') : null,
  ]);
}

// Explore E6 ("Where next"): a mini itinerary builder, not just a static list — tap a real,
// reachable next city and it becomes the new tail, so up to 3 taps chains a genuine mini
// route (e.g. Chiang Mai → Pai → Luang Prabang), with the running travel time the actual sum
// of planRoutes() legs, never invented. Capped at 3 added stops on purpose: this is "what's
// next", not a whole-trip build — for that, see the curated Trip plans (#plans) or the Full
// journey planner (#route) linked at the foot of this section for any two specific points.
// journey.js's route graph memoises PERMANENTLY on first build, so isRouteNode()/planRoutes()
// must never run before all four countries are loaded (the same constraint documented in
// Home's next-stop card, F1) — gated on _routeGraphLoaded below, set once, never inline.
let _routeGraphLoaded = false;
function ensureRouteGraph(onReady) {
  if (_routeGraphLoaded) { onReady(); return; }
  loadAllCountries().then(() => { _routeGraphLoaded = true; onReady(); })
    .catch(() => { /* offline with nothing cached yet — this session stays without it */ });
}
// Binary floating-point noise (e.g. 1.2 + 1.2 = 2.4000000000000004) surfaces the moment two
// legs' hour ranges are summed — harmless as a number, but an unrounded string this long has
// no natural break point and forces its grid track wider than the card, overflowing the
// viewport. Round to one decimal at display time everywhere a summed range is shown.
function round1(n) { return Math.round(n * 10) / 10; }
function computeWhereNext(fromCity, exclude) {
  if (!isRouteNode(fromCity)) return [];
  const skip = new Set([fromCity, ...(exclude || [])]);
  const scored = routeNodes().filter((n) => !skip.has(n)).map((n) => {
    const plans = planRoutes(fromCity, n);
    return plans.length ? { name: n, hrs: [round1(plans[0].totalHrs[0]), round1(plans[0].totalHrs[1])], changes: plans[0].changes } : null;
  }).filter(Boolean);
  scored.sort((a, b) => (a.hrs[0] || 99) - (b.hrs[0] || 99));
  return scored.slice(0, 5);
}
// Which loaded country actually has a place tagged with this city — needed to hand addStop()
// the right country when a chained mini-itinerary crosses a border.
function countryForCityName(name) {
  const slug = citySlug(name);
  for (const x of COUNTRIES) {
    if (isCountryLoaded(x.id) && allPlaces({ country: x.id }).some((p) => citySlug(p.city || '') === slug)) return x.id;
  }
  return '';
}
// The chain itself, and the anchor city it was built from — module state (same idiom as
// planRouteScreen's planFrom/planTo) so it survives this section re-rendering as the
// traveller keeps tapping, and resets the moment the anchor city changes.
let _nextChain = [];
let _nextChainFrom = '';
// Read-only accessor for whichever screen wants to know "what has the traveller picked in
// the Where-next builder for this city" without reaching into its private chain array — used
// by #nextstop (screens/nextstop.js) to key its Getting there / What is there / Commit
// sections off the same selection whereNextSection itself renders.
export function nextChainTail(fromCity) {
  if (_nextChainFrom !== fromCity || !_nextChain.length) return null;
  const name = _nextChain[_nextChain.length - 1];
  // The immediately preceding city on this chain — the original fromCity for a single hop,
  // the second-to-last chained city once the traveller has chained more than one. #nextstop's
  // Getting there section routes from here, not from fromCity, so a 2-3 hop chain shows the
  // actual last leg rather than a direct-from-origin route that ignores the stops between.
  const from = _nextChain.length > 1 ? _nextChain[_nextChain.length - 2] : fromCity;
  return { name, country: countryForCityName(name), from };
}
export function whereNextSection(argCc, fromCity, onChange) {
  if (!fromCity) return null;
  if (_nextChainFrom !== fromCity) { _nextChainFrom = fromCity; _nextChain = []; }
  // A caller may supply its own re-render (#nextstop re-rendering itself instead of
  // Explore) — defaults to the original Explore-scroll-preserving behaviour, unchanged.
  const rerender = onChange || (() => {
    const y = window.scrollY;
    exploreScreen(argCc);
    requestAnimationFrame(() => window.scrollTo(0, y));
  });
  if (!_routeGraphLoaded) {
    ensureRouteGraph(() => {
      const headRoute = (location.hash || '').slice(1).split('-')[0];
      if (headRoute === 'explore' || headRoute === 'country' || headRoute === 'nextstop') rerender();
    });
    return null;   // nothing to show until the graph above resolves — never a placeholder
  }
  if (!isRouteNode(fromCity)) return null;

  const tail = _nextChain.length ? _nextChain[_nextChain.length - 1] : fromCity;
  // Exclude the trip's own starting point too, not just the chain built so far — otherwise
  // once you've chained one hop away, "back to where you started" reappears as a "next stop".
  const candidates = computeWhereNext(tail, [fromCity, ..._nextChain]);
  if (!candidates.length && !_nextChain.length) return null;   // nothing reachable at all

  const body = h('div', {});

  if (_nextChain.length) {
    let totLo = 0, totHi = 0, changes = 0, prev = fromCity;
    for (const city of _nextChain) {
      const p = planRoutes(prev, city)[0];
      if (p) { totLo += p.totalHrs[0] || 0; totHi += p.totalHrs[1] || p.totalHrs[0] || 0; changes += p.changes; }
      prev = city;
    }
    body.append(h('p', { style: 'margin:0 0 4px' }, `${fromCity} → ${_nextChain.join(' → ')}`));
    body.append(h('p', { class: 'muted tiny', style: 'margin:0 0 8px' },
      `~${round1(totLo)}–${round1(totHi)}h of travel across ${_nextChain.length} stop${_nextChain.length > 1 ? 's' : ''} · ${changes} change${changes === 1 ? '' : 's'}`));
    body.append(h('div', { class: 'chips', style: 'margin-bottom:8px' }, [
      h('button', { class: 'chip', onclick: () => { _nextChain.pop(); rerender(); } }, '↶ Remove last'),
      h('button', { class: 'chip', onclick: () => { _nextChain = []; rerender(); } }, 'Clear'),
    ]));
  }

  if (_nextChain.length < 3 && candidates.length) {
    body.append(h('p', { class: 'muted', style: 'margin:2px 0 6px' },
      _nextChain.length ? `Next, from ${tail}:` : 'Tap a city to start building your next few stops:'));
    body.append(h('div', { class: 'grid' }, candidates.map((r) => h('button', {
      class: 'card', style: 'text-align:left', onclick: () => { _nextChain.push(r.name); rerender(); },
    }, [
      h('strong', {}, r.name),
      h('p', { class: 'muted tiny', style: 'margin:2px 0 0' },
        `${r.hrs[1] ? `~${r.hrs[0]}–${r.hrs[1]}h` : ''} · ${r.changes === 0 ? 'Direct' : `${r.changes} change${r.changes > 1 ? 's' : ''}`}`),
    ]))));
  }

  if (_nextChain.length) {
    const tripName = (store.profile.name || '').trim();
    const tripLabel = tripName ? `${tripName}’s trip` : 'My Trip';
    body.append(h('button', {
      class: 'btn block', style: 'margin-top:4px',
      onclick: (e) => {
        _nextChain.forEach((city) => addStop({ title: city, country: countryForCityName(city) }));
        e.currentTarget.textContent = `✓ Added — open ${tripLabel} to edit`;
        e.currentTarget.disabled = true;
        e.currentTarget.onclick = null;
      },
    }, `＋ Add ${_nextChain.length === 1 ? 'this stop' : `these ${_nextChain.length} stops`} to ${tripLabel}`));
  }

  body.append(h('button', { class: 'btn ghost block', style: 'margin-top:6px', onclick: () => go('#route') }, 'Full journey planner →'));

  return h('section', {}, [h('h2', { class: 'home-section' }, `🚌 Where next, from ${fromCity}`), body]);
}

// Explore E7 ("You might not know"): highly-rated places in cities the traveller has no
// saved place in yet — real serendipity from the actual data, not a random pick. Only
// SAVED PLACES are used as the "already knows about" signal (a reliable, structured field);
// journal entries are free-text city names and too unreliable to match safely. Omits itself
// if nothing qualifies.
function mightNotKnowSection(cc) {
  const known = new Set();
  (store.favorites || []).forEach((id) => { const p = getPlace(id); if (p && p.city) known.add(p.city); });
  const candidates = allPlaces({ country: cc })
    .filter((p) => placeBucket(p) !== 'stay' && (Number(p.rating) || 0) >= 4.3 && p.city && !known.has(p.city))
    .sort((a, b) => (Number(b.rating) || 0) - (Number(a.rating) || 0));
  const seenCities = new Set(); const picks = [];
  for (const p of candidates) {
    if (seenCities.has(p.city)) continue;
    seenCities.add(p.city); picks.push(p);
    if (picks.length >= 4) break;
  }
  if (!picks.length) return null;
  return h('section', {}, [
    h('h2', { class: 'home-section' }, '✨ You might not know'),
    h('div', { class: 'grid' }, picks.map((p) => h('button', { class: 'card', onclick: () => go(`#place-${p.id}`) }, [
      h('strong', {}, p.name),
      h('p', { class: 'muted tiny', style: 'margin:2px 0 0' }, `${p.city} · ${p.rating}★`),
    ]))),
  ]);
}

// Region/province drill-down. The full implementation — an outlined, clickable province
// map plus per-region content — lands in Wave 2. Until then the route falls back to the
// country hub so it never dead-ends.
// ---- Region / province drill-down (ADM1) -------------------------------------------
// Lazy per-country region-set loading — mirrors js/data/regions.js's loadCountry()/
// isCountryLoaded() idiom exactly, but as a second, independent axis: THAT loader fetches a
// country's places/food/prices/etc.; THIS one fetches only its ADM1 province polygons, used
// solely by the region/zone maps and lookups below. A traveller who only ever visits Thailand
// never downloads or parses Vietnam/Cambodia/Laos borders. Every regions.<cc>.js file is
// already precached by the service worker like any other app-code file (sw.js PRECACHE), so
// offline availability is unchanged — this only defers the parse/download to first real need.
const REGIONS_BY_CC = { th: null, vi: null, kh: null, la: null };
const REGION_SET_LOADERS = {
  th: () => import('./data/regions.th.js').then((m) => m.REGIONS_TH),
  vi: () => import('./data/regions.vi.js').then((m) => m.REGIONS_VI),
  kh: () => import('./data/regions.kh.js').then((m) => m.REGIONS_KH),
  la: () => import('./data/regions.la.js').then((m) => m.REGIONS_LA),
};
// In-flight/settled load promises, keyed by country id. Deleted on failure so a later retry
// (e.g. the connection comes back) gets a fresh attempt rather than a stuck rejection.
const _regionSetLoads = {};
function regionSetFor(cc) { return REGIONS_BY_CC[cc] || null; }
function isRegionSetLoaded(cc) { return !!REGIONS_BY_CC[cc]; }
// Fetches and caches one country's province polygons. Safe to call repeatedly and from
// several call sites at once — concurrent calls for the same country share one in-flight
// load, same idiom as loadCountry(). Every reader below (regionsMap/zonesMap/zoneAssignment/
// findProvince, and whereAmI's cross-country scan) already treats regionSetFor() returning
// null as "not loaded yet" and degrades gracefully rather than assuming synchronous data; the
// router's region-data gate (see render() below) is what actually triggers this loader for
// the two routes that render a province/zone map.
function loadRegionSet(cc) {
  if (REGIONS_BY_CC[cc]) return Promise.resolve(REGIONS_BY_CC[cc]);
  if (_regionSetLoads[cc]) return _regionSetLoads[cc];
  const loader = REGION_SET_LOADERS[cc];
  if (!loader) return Promise.resolve(null);
  const p = loader()
    .then((set) => {
      REGIONS_BY_CC[cc] = set;
      // A newly available province set changes what whereAmI() should return for the
      // current fix, and whereAmI memoises. Drop the memo or the re-render below repaints
      // the same pre-province answer it already had.
      _waiCache = { key: '', val: null };
      return set;
    })
    .catch((err) => { delete _regionSetLoads[cc]; throw err; });
  _regionSetLoads[cc] = p;
  return p;
}
// Non-blocking province-polygon load for a screen that must paint immediately but reads
// better once it can name the traveller's province. Deliberately NOT part of the router's
// NEEDS_REGION_DATA gate: gating the emergency screens on a download would trade a fact
// that is merely useful for a delay that is actively harmful. Re-renders once, only if the
// traveller is still on the route that asked.
export function ensureRegionSet(cc) {
  if (!cc || isRegionSetLoaded(cc)) return;
  const at = location.hash;
  loadRegionSet(cc).then(() => { if (location.hash === at) render(); }).catch(() => { /* degrades to no province name */ });
}
function findProvince(cc, code) {
  const set = regionSetFor(cc);
  return set ? set.provinces.find((p) => p.code === code) || null : null;
}
// Project a lng/lat to the country region map's SVG space (same maths as build_regions.py).
function projRegionPt(proj, lng, lat) {
  return [
    +(proj.pad + (lng - proj.minlng) * proj.kx * proj.scale).toFixed(1),
    +(proj.pad + (proj.maxlat - lat) * proj.scale).toFixed(1),
  ];
}
// SVG path 'd' for a province: one subpath per ring of every polygon.
function provincePathD(prov, proj) {
  const subs = [];
  for (const poly of prov.polys) {
    for (const ring of poly) {
      const pts = ring.map(([lng, lat]) => projRegionPt(proj, lng, lat));
      subs.push('M' + pts.map((p) => `${p[0]},${p[1]}`).join(' L') + ' Z');
    }
  }
  return subs.join(' ');
}
function pointInRing(lng, lat, ring) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i][0], yi = ring[i][1], xj = ring[j][0], yj = ring[j][1];
    if (((yi > lat) !== (yj > lat)) && (lng < (xj - xi) * (lat - yi) / (yj - yi) + xi)) inside = !inside;
  }
  return inside;
}
function pointInProvince(prov, lng, lat) {
  for (const poly of prov.polys) {
    if (pointInRing(lng, lat, poly[0]) && !poly.slice(1).some((hole) => pointInRing(lng, lat, hole))) return true;
  }
  return false;
}
function placesInProvince(cc, code) {
  const prov = findProvince(cc, code);
  if (!prov) return [];
  return allPlaces({ country: cc }).filter((p) => p.coords
    && typeof p.coords.lng === 'number' && typeof p.coords.lat === 'number'
    && pointInProvince(prov, p.coords.lng, p.coords.lat));
}
// A stable, spread-out fill per province so neighbours differ (a political-map look).
const REGION_PALETTE = ['#E0663A', '#3E8E5A', '#3E7CB1', '#C9902B', '#9C5780', '#4C9A6A', '#B0567F', '#2E8FB0', '#C77D2E', '#6E7BC0', '#4E9A52', '#8A5FA8'];

// A clickable, coloured SVG map of one country's provinces. opts.activeCode highlights one;
// opts.onPick(code) fires on tap/Enter. Pure SVG + offline — no tiles, no network.
function regionsMap(cc, opts = {}) {
  const set = regionSetFor(cc);
  if (!set) return null;
  const proj = set.proj;
  const shapes = set.provinces.map((p, i) => {
    const active = opts.activeCode && p.code === opts.activeCode;
    // When one province is highlighted, the rest go a muted slate so the active one — in
    // its own bright colour — clearly pops while neighbours stay visible and tappable.
    const fill = active ? REGION_PALETTE[i % REGION_PALETTE.length]
      : (opts.activeCode ? '#8A94A6' : REGION_PALETTE[i % REGION_PALETTE.length]);
    const op = active ? 0.98 : (opts.activeCode ? 0.55 : 0.62);
    return `<g class="prov-group${active ? ' active' : ''}" data-code="${esc(p.code)}" role="button" tabindex="0" aria-label="${esc(p.name)}">`
      + `<path class="prov" d="${provincePathD(p, proj)}" fill="${fill}" fill-opacity="${op}"/></g>`;
  }).join('');
  const cName = (getCountry(cc) || {}).name || '';
  const svg = `<svg viewBox="${set.viewBox}" class="regions-svg" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Provinces of ${esc(cName)}" xmlns="http://www.w3.org/2000/svg">${shapes}</svg>`;
  const box = h('div', { class: 'regions-map', html: svg });
  box.querySelectorAll('.prov-group').forEach((g) => {
    const code = g.getAttribute('data-code');
    const pick = () => { if (opts.onPick) opts.onPick(code); };
    g.addEventListener('click', pick);
    g.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick(); } });
  });
  return box;
}

// ---- Travel regions (zones): the browse layer above provinces --------------------
// A "region" a traveller navigates is a GROUP of provinces (js/data/zones.js) — 4-6 per
// country instead of 184 ADM1 units, most of which hold no places at all. Nothing new is
// drawn: a zone reuses its provinces' existing polygons and is filled as one shape, and its
// places/towns are derived live from placesInProvince(), so adding a place cannot make this
// stale. Provinces remain the geometry; they are no longer a browse step.

// Place -> zone assignment for one country, computed ONCE and cached.
//
// Two reasons this is a single cached pass rather than a per-zone scan. First cost: testing
// every place against every province, repeated for each of 4-6 zones, is O(provinces x places)
// per zone and Explore asks for all of them just to print the counts. Second correctness:
// point-in-polygon alone loses islands and headlands. The province outlines are simplified,
// so 11 of Thailand's 214 places — Railay, the Similans, Koh Kradan, Freedom Beach and other
// coastal or marine-park points — land in NO province and would silently disappear from
// region browse. Anything unmatched therefore falls back to its NEAREST province by centroid,
// which for a coastal point is always the mainland province it belongs to.
const _zoneAssign = {};      // cc -> { byPlace: Map(placeId -> zoneId), n }
function provinceCentroids(set) {
  if (set._centroids) return set._centroids;
  set._centroids = set.provinces.map((pr) => {
    let sx = 0, sy = 0, n = 0;
    pr.polys.forEach((poly) => poly[0].forEach(([lng, lat]) => { sx += lng; sy += lat; n++; }));
    return { code: pr.code, lng: n ? sx / n : 0, lat: n ? sy / n : 0 };
  });
  return set._centroids;
}
function zoneAssignment(cc) {
  const cached = _zoneAssign[cc];
  const places = allPlaces({ country: cc });
  if (cached && cached.n === places.length) return cached.byPlace;   // invalidates if data grows
  const set = regionSetFor(cc);
  const byPlace = new Map();
  if (set) {
    const provZone = {};
    zonesFor(cc).forEach((z) => z.provinces.forEach((code) => { provZone[code] = z.id; }));
    const cents = provinceCentroids(set);
    places.forEach((pl) => {
      if (!pl.coords || typeof pl.coords.lng !== 'number' || typeof pl.coords.lat !== 'number') return;
      const hit = set.provinces.find((pr) => pointInProvince(pr, pl.coords.lng, pl.coords.lat));
      if (hit) { if (provZone[hit.code]) byPlace.set(pl.id, provZone[hit.code]); return; }
      // Unmatched (island / simplified coastline): nearest province centroid wins.
      let best = null, bestD = Infinity;
      cents.forEach((ct) => {
        const dx = ct.lng - pl.coords.lng, dy = ct.lat - pl.coords.lat;
        const d = dx * dx + dy * dy;
        if (d < bestD) { bestD = d; best = ct.code; }
      });
      if (best && provZone[best]) byPlace.set(pl.id, provZone[best]);
    });
    // Cache ONLY once a real region set backed this pass. The region set now loads lazily
    // (see loadRegionSet above), so `set` can be null on early calls; caching an empty
    // byPlace keyed just on place count would poison it forever once the set does land
    // (place count alone would look unchanged, so the stale empty map would never be
    // recomputed). Skipping the cache while unset is cheap — the loop above never runs.
    _zoneAssign[cc] = { byPlace, n: places.length };
  }
  return byPlace;
}

// Every place in a zone. One map lookup per place, no polygon maths at call time.
function placesInZone(cc, zoneId) {
  const byPlace = zoneAssignment(cc);
  return allPlaces({ country: cc }).filter((pl) => byPlace.get(pl.id) === zoneId);
}

// Towns in a zone, ranked by how many places each holds. Returns [{ city, n }].
function townsInZone(cc, zoneId) {
  const counts = {};
  placesInZone(cc, zoneId).forEach((pl) => { if (pl.city) counts[pl.city] = (counts[pl.city] || 0) + 1; });
  return Object.keys(counts).sort((a, b) => counts[b] - counts[a]).map((city) => ({ city, n: counts[city] }));
}

// The zone map: same SVG projection and province paths as regionsMap, but every province of
// a zone shares one fill and one hit target, so the country reads as 4-6 tappable areas.
// opts.activeId highlights one; opts.onPick(zoneId) fires on tap/Enter.
function zonesMap(cc, opts = {}) {
  const set = regionSetFor(cc);
  const zones = zonesFor(cc);
  if (!set || !zones.length) return null;
  const proj = set.proj;
  const byCode = {};
  set.provinces.forEach((pr) => { byCode[pr.code] = pr; });
  const shapes = zones.map((z, i) => {
    const active = opts.activeId && z.id === opts.activeId;
    const fill = (opts.activeId && !active) ? '#8A94A6' : REGION_PALETTE[i % REGION_PALETTE.length];
    const op = active ? 0.98 : (opts.activeId ? 0.5 : 0.68);
    const d = z.provinces.map((code) => (byCode[code] ? provincePathD(byCode[code], proj) : '')).filter(Boolean).join(' ');
    if (!d) return '';
    return `<g class="zone-group${active ? ' active' : ''}" data-zone="${esc(z.id)}" role="button" tabindex="0" aria-label="${esc(z.name)}">`
      + `<path class="zone" d="${d}" fill="${fill}" fill-opacity="${op}"/></g>`;
  }).join('');
  const cName = (getCountry(cc) || {}).name || '';
  const svg = `<svg viewBox="${set.viewBox}" class="regions-svg" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Regions of ${esc(cName)}" xmlns="http://www.w3.org/2000/svg">${shapes}</svg>`;
  const box = h('div', { class: 'regions-map', html: svg });
  box.querySelectorAll('.zone-group').forEach((g) => {
    const id = g.getAttribute('data-zone');
    const pick = () => { if (opts.onPick) opts.onPick(id); };
    g.addEventListener('click', pick);
    g.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick(); } });
  });
  return box;
}

// The month a traveller is asking about on the region chooser. 0 means "follow today", which
// is the state a fresh load starts in; picking a month pins it for the session only, because
// this is a browsing filter and not a preference worth persisting.
let zoneMonth = 0;

// The verdict as a traveller reads it, plus the sentence that justifies it. The sentence is
// not optional: js/data/zones.js only puts a month in bestM/avoidM when its prose recommends
// or warns, so "mixed" and "shoulder" BOTH mean "read the sentence" — a bare badge would be
// the one thing worse than no badge, because Vietnam's Central Coast in September is a
// typhoon shoreline and a perfectly pleasant highland in the same breath.
function zoneWhenLine(z, verdict, monthName) {
  if (verdict === 'best') return { label: `✓ Good in ${monthName}`, cls: 'is-best', why: z.bestMonths };
  if (verdict === 'avoid') return { label: `✗ Poor in ${monthName}`, cls: 'is-avoid', why: z.avoidMonths };
  if (verdict === 'mixed') {
    return { label: `± Depends where in ${monthName}`, cls: 'is-mixed', why: `${z.bestMonths} · Avoid: ${z.avoidMonths}` };
  }
  return { label: '· Shoulder month', cls: 'is-shoulder', why: `Best months: ${z.bestMonths}` };
}

// The region chooser used on Explore: one row per region with its own facts, live town and
// place counts, so a traveller can see where the depth actually is before tapping in.
//
// It also answers the question travellers actually ask first — not "when is the Northern
// Highlands good?" but "it is September, where should I go?". The month strip re-sorts the
// regions by that month's verdict (see monthVerdict() in js/data/zones.js) and prints the
// region's own season sentence under each one, so the ordering is always shown its working.
function zonePickList(cc) {
  const zones = zonesFor(cc);
  if (!zones.length) return null;
  const nowM = new Date().getMonth() + 1;
  const m = zoneMonth || nowM;
  const monthName = (n) => new Date(2020, n - 1, 1).toLocaleDateString(dateLocale(), { month: 'long' });
  const monthShort = (n) => new Date(2020, n - 1, 1).toLocaleDateString(dateLocale(), { month: 'short' });

  const wrap = h('div', { class: 'zone-when-wrap' });
  wrap.append(h('h3', { class: 'zone-when-head' },
    zoneMonth ? `Where to go in ${monthName(m)}` : `Where to go this month · ${monthName(m)}`));
  const strip = h('div', { class: 'chips month-strip', role: 'group', 'aria-label': 'Choose a month' });
  for (let i = 1; i <= 12; i++) {
    strip.append(h('button', {
      // aria-pressed carries BOTH the state and the styling here: .chip[aria-pressed="true"]
      // is the app's existing selected-chip rule, so there is no second visual convention.
      class: 'chip',
      'aria-pressed': String(i === m),
      onclick: () => { zoneMonth = (zoneMonth === i) ? 0 : i; render(); },
    }, monthShort(i) + (i === nowM ? ' •' : '')));
  }
  wrap.append(strip);
  if (zoneMonth) {
    wrap.append(h('button', { class: 'chip ghost', style: 'margin-top:6px', onclick: () => { zoneMonth = 0; render(); } }, '↺ Back to this month'));
  }

  const list = h('div', { class: 'zone-list' });
  zonesByMonth(cc, m).forEach(({ zone: z, verdict }) => {
    const n = placesInZone(cc, z.id).length;
    const towns = townsInZone(cc, z.id).length;
    const when = zoneWhenLine(z, verdict, monthName(m));
    list.append(h('button', { class: 'zone-row', onclick: () => go(`#region-${cc}-${z.id}`) }, [
      h('span', { class: 'zone-emoji' }, z.emoji || '📍'),
      h('span', { class: 'zone-text' }, [
        h('span', { class: 'zone-name' }, z.name),
        h('span', { class: `zone-when ${when.cls}` }, when.label),
        h('span', { class: 'zone-tag' }, z.tagline),
        when.why ? h('span', { class: 'zone-why muted' }, when.why) : null,
        h('span', { class: 'zone-count muted' }, `${towns} town${towns === 1 ? '' : 's'} · ${n} place${n === 1 ? '' : 's'}`),
      ]),
      h('span', { class: 'zone-go' }, '›'),
    ]));
  });
  wrap.append(list);
  return wrap;
}

// The region's facts as a compact definition grid — deliberately terse rows, not prose, so
// the whole orientation reads in one glance. `notFor` is the honest counterweight: what this
// region is NOT good for, which is usually the fastest way to rule a place in or out.
function zoneFactsCard(z) {
  const rows = [
    ['Good for', z.suits],
    ['Not for', z.notFor],
    ['Best months', z.bestMonths],
    ['Avoid', z.avoidMonths],
    ['How long', z.howLong],
    ['Getting around', z.gettingAround],
    ['Arrive at', z.gateway],
  ].filter(([, v]) => v);
  const card = h('div', { class: 'card zone-facts' }, [h('h2', { style: 'margin-top:0' }, `${z.emoji || '📍'} ${z.name}`)]);
  card.append(h('p', { class: 'zone-lead' }, z.tagline));
  // Lead with the verdict for the month in hand. The two prose rows are still in the grid
  // below, which is what makes this honest: "Depends where" is a pointer to the sentence, not
  // a substitute for it. Follows the same pinned month as the region chooser, so a traveller
  // planning September does not have to re-pick it on every region they open.
  const vm = zoneMonth || (new Date().getMonth() + 1);
  const verdict = monthVerdict(z, vm);
  const vName = new Date(2020, vm - 1, 1).toLocaleDateString(dateLocale(), { month: 'long' });
  const vLine = zoneWhenLine(z, verdict, vName);
  card.append(h('p', { class: `zone-when ${vLine.cls}`, style: 'margin:0 0 6px' }, vLine.label));
  const dl = h('dl', { class: 'zone-dl' });
  rows.forEach(([k, v]) => { dl.append(h('dt', {}, k), h('dd', {}, v)); });
  card.append(dl);
  return card;
}

// Region detail: arg is "<cc>-<CODE>" (the ISO code itself contains a hyphen, e.g.
// "th-TH-50"), so split on the FIRST hyphen only. Lists the region's cities and mapped
// places, keeps the province map one tap from its neighbours, and links up to the country.
function regionScreen(arg) {
  const raw = String(arg || '');
  const dash = raw.indexOf('-');
  const cc = dash >= 0 ? raw.slice(0, dash) : (raw || getActiveCountry());
  let id = dash >= 0 ? raw.slice(dash + 1) : '';
  const c = getCountry(cc);
  // Back-compatibility: links minted before regions replaced provinces carry an ISO province
  // code (e.g. "#region-th-TH-50"). Resolve those to the region that now contains them so an
  // old bookmark, a saved link or a stale cache still lands somewhere true.
  if (c && id && !getZone(cc, id)) {
    const owner = zoneForProvince(cc, id);
    if (owner) id = owner.id;
  }
  const z = getZone(cc, id);
  const wrap = h('div', { class: 'screen' });
  if (!c || !z) {
    wrap.append(topbar('Region', `#country-${cc}`));
    wrap.append(h('p', { class: 'empty' }, 'That region could not be found.'));
    mount(wrap, '#explore');
    return;
  }
  setActiveCountry(cc);
  wrap.append(topbar(z.name, `#country-${cc}`));

  // Facts first — what this region is, who it suits, who it does not, when to come. Every
  // row is one line; the whole orientation is meant to be read in a glance, not studied.
  wrap.append(zoneFactsCard(z));

  const mini = zonesMap(cc, { activeId: z.id, onPick: (nid) => go(`#region-${cc}-${nid}`) });
  if (mini) {
    const mapFold = foldable(h('span', { class: 'home-section', style: 'margin:0' }, `🗺 ${c.name} by region`),
      h('div', { style: 'padding:6px 0 0' }, [mini]), { open: store.profile.prefs.regionMapOpen !== false, cls: 'home-group-d' });
    mapFold.addEventListener('toggle', () => { store.profile.prefs.regionMapOpen = mapFold.open; save(); });
    wrap.append(mapFold);
  }

  const inZone = placesInZone(cc, z.id);
  const towns = townsInZone(cc, z.id);
  if (towns.length) {
    const counts = {}; towns.forEach((t) => { counts[t.city] = t.n; });
    const cityCard = h('div', { class: 'card' }, [h('h2', { style: 'margin-top:0' }, `🏙 ${towns.length} town${towns.length === 1 ? '' : 's'} in ${z.name}`)]);
    cityCard.append(cityPickGrid(cc, towns.map((t) => t.city), counts));
    wrap.append(collapsibleCard(cityCard, 'regionCitiesOpen'));
  }

  if (inZone.length) {
    const pc = h('div', { class: 'card' }, [h('h2', { style: 'margin-top:0' }, `📍 ${inZone.length} place${inZone.length > 1 ? 's' : ''} in ${z.name}`)]);
    inZone.slice(0, 40).forEach((pl) => pc.append(placeCard(pl)));
    if (inZone.length > 40) {
      pc.append(h('button', { class: 'btn ghost block', style: 'margin-top:8px', onclick: () => go(`#places-${cc}`) }, `See all ${inZone.length} on the map →`));
    }
    wrap.append(collapsibleCard(pc, 'regionPlacesOpen', false));
  } else {
    wrap.append(h('div', { class: 'card' }, [
      h('p', { class: 'muted', style: 'margin:0' }, `No places are mapped in ${z.name} yet. Tap another region on the map above, or browse all of ${c.name}.`),
      h('button', { class: 'btn block', style: 'margin-top:8px', onclick: () => go(`#places-${cc}`) }, `All places in ${c.name}`),
    ]));
  }

  if (cc === 'vi') {
    wrap.append(h('p', { class: 'muted tiny', style: 'margin:2px 2px 10px' },
      'Note: Vietnam reorganised its provinces in 2025. The region outlines reflect the earlier boundaries until open map data is updated.'));
  }

  wrap.append(h('div', { class: 'chips', style: 'margin-top:6px' }, [
    h('button', { class: 'chip', onclick: () => go(`#country-${cc}`) }, [chipIcon('compass'), `About ${c.name}`]),
    h('button', { class: 'chip', onclick: () => go(`#history-${cc}`) }, [chipIcon('book'), 'History & culture']),
    h('button', { class: 'chip', onclick: () => go(`#info-${cc}`) }, [chipIcon('compass'), 'Country guide']),
  ]));
  mount(wrap, '#explore');
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
    const enter = () => { setActiveCountry(id); go(`#country-${id}`); };
    g.addEventListener('click', enter);
    g.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); enter(); } });
  });
  box.append(h('span', { class: 'region-cap' }, 'Tap a country to explore · the Mekong runs through all four'));
  return box;
}

// Per-country hub reached after picking a country.
// (The "chapter opener" hero photo band that used to sit here — countryHeroBand() — was
// removed: Explore now leads with the map, not a photo, so it had zero call sites left.)

// Explore E1 (OVERHAUL.md section 11): Explore and the country hub were the same section
// split across two screens — the old bare #explore was a thin chooser (73 lines, no
// photography, no curated content) while everything a traveller actually wants (hero photo,
// signature sights, regions, cities, the full toolkit) lived one tap deeper, only reachable
// via #country-<cc>. Merged into one renderer. #explore and #country-<cc> BOTH route here —
// 21 existing links point at #country-<cc> and must keep working unchanged.
//
// argCc: an explicit country id from #country-<cc> (always wins), 'all' from #explore-all
// (forces the four-country view even when anchored), or undefined from a bare #explore
// (falls through to anchorCountry() — E2's landing logic).
//
// Root-tab note: unlike the old countryHubScreen, this never shows a "‹ Back" button —
// Explore is a bottom-tab screen like Home/Places, not a sub-screen you navigate into, and
// the four-country view is one tap away via the "🌏 All" chip in the switcher below,
// consistent with rank-collapse-never-remove.
function exploreScreen(argCc) {
  const forceAll = argCc === 'all';
  const cc = (!forceAll && argCc && getCountry(argCc)) ? argCc : (forceAll ? null : anchorCountry());
  const c = cc ? getCountry(cc) : null;

  const wrap = h('div', { class: 'screen' });
  wrap.append(topbar(c ? `${c.flag} ${c.name}` : 'Explore'));

  // Country select — a single dropdown covering every country plus "All". The one
  // consistent way to pick a country from Explore now, in both branches below —
  // replaces the old scoped-only chip switcher and the unscoped grid-of-cards as two
  // parallel, inconsistent pickers (and, before that, a horizontally-scrolling chip row).
  const countrySelect = selectEl(
    [['all', '🌏 All countries']].concat(COUNTRIES.map((x) => [x.id, `${x.flag} ${x.name}`])),
    cc || 'all',
    (v) => { if (v === 'all') { go('#explore-all'); } else { setActiveCountry(v); go(`#country-${v}`); } },
    'Country',
  );
  wrap.append(h('div', { class: 'country-select-row' }, [countrySelect]));

  if (!c) {
    // No explicit country and no real anchor — the four-country comparison view. Reached by
    // tapping the Explore tab with nothing yet to land on, or explicitly via #explore-all.
    // Lead with the map: plain and always visible (no anchor to default to yet, so "choose
    // on the map" IS the default view here) — not a collapsible fold, the map is the focus.
    wrap.append(h('div', { class: 'home-section', style: 'margin:8px 0 4px' }, '🗺 Choose on the map'));
    wrap.append(regionPicker());

    // "At a glance": each country's real figures (mapped-place count, language, currency) and
    // its top sourced "known for" tags — a comparison that helps a traveller CHOOSE. Explore
    // itself must never block on all four countries loading (that would defeat lazy loading
    // for the common case of one country); a country not yet loaded briefly reads 0 here, so
    // kick each missing one off in the background and quietly repaint in place as each lands.
    const unloaded = COUNTRIES.filter((x) => !isCountryLoaded(x.id));
    if (unloaded.length) {
      unloaded.forEach((x) => {
        loadCountry(x.id).then(() => {
          const headRoute = (location.hash || '').slice(1).split('-')[0];
          if (headRoute === 'explore' && isCountryLoaded(x.id)) {
            const y = window.scrollY;
            exploreScreen(argCc);
            requestAnimationFrame(() => window.scrollTo(0, y));
          }
        }).catch(() => { /* offline with nothing cached yet — leave today's 0 up */ });
      });
    }
    const grid = h('div', { class: 'explore-grid' });
    COUNTRIES.forEach((x) => {
      const n = allPlaces({ country: x.id }).length;
      const lang = getLanguage(x.lang);
      const tags = ((countryHistory(x.id) || {}).knownFor || []).slice(0, 3);
      grid.append(h('button', {
        class: 'explore-card', style: `--ec:${REGION_COLORS[x.id] || 'var(--teal)'}`,
        onclick: () => { setActiveCountry(x.id); go(`#country-${x.id}`); },
        'aria-label': `Explore ${x.name}`,
      }, [
        h('span', { class: 'explore-flag' }, x.flag),
        h('span', { class: 'explore-name' }, x.name),
        h('span', { class: 'explore-facts' }, `${n} place${n === 1 ? '' : 's'} · ${lang ? lang.label : x.lang} · ${x.currency}`),
        tags.length ? h('span', { class: 'explore-tags' }, tags.map((t) => h('span', { class: 'explore-tag' }, t))) : null,
      ]));
    });
    const glanceFold = foldable(h('span', { class: 'home-section', style: 'margin:0' }, '🌏 Four countries at a glance'),
      grid, { open: store.profile.prefs.exploreGlanceOpen !== false, cls: 'home-group-d' });
    glanceFold.addEventListener('toggle', () => { store.profile.prefs.exploreGlanceOpen = glanceFold.open; save(); });
    wrap.append(glanceFold);

    mount(wrap, '#explore');
    return;
  }

  // Scoped to a country — an explicit choice (#country-<cc>, a switcher tap, a flag on the
  // map/glance view above) or a real anchor from anchorCountry(). Either way this is now the
  // traveller's active country.
  setActiveCountry(cc);

  // Bare #explore / anchor-driven landing is NOT gated by the router (only #country-<cc> is —
  // see NEEDS_COUNTRY_DATA in render()), so an anchor pointing at a country nothing has loaded
  // yet (e.g. a dated stop set for a country never opened this session) would otherwise render
  // sparse forever. Background-load + quietly repaint, same idiom as the chooser above and as
  // Home's own country-load block — never block first paint, never silently stay empty.
  // Same non-blocking "load then quietly repaint if still here" idiom, run once per loader
  // so either landing independently of the other — the region set gates only the "by
  // region" map further down, not the whole screen.
  const repaintExploreIfStillHere = () => {
    const headRoute = (location.hash || '').slice(1).split('-')[0];
    if (headRoute === 'explore' || headRoute === 'country') {
      const y = window.scrollY;
      exploreScreen(argCc);
      requestAnimationFrame(() => window.scrollTo(0, y));
    }
  };
  if (!isCountryLoaded(cc)) {
    loadCountry(cc).then(repaintExploreIfStillHere)
      .catch(() => { /* offline with nothing cached yet — sparse view stays up */ });
  }
  if (!isRegionSetLoaded(cc)) {
    loadRegionSet(cc).then(repaintExploreIfStillHere)
      .catch(() => { /* offline with nothing cached yet — region map stays hidden */ });
  }

  // Lead with the map: this country's regions, right after country select — plain and
  // always visible, not a collapsible fold, the same "map is the focus" treatment as the
  // unscoped branch above (and as Places' own living map). Country defaulting is already
  // handled above (cc = the traveller's anchored country, or null → the "All" branch), so
  // this alone satisfies "default to the country the traveller is in, or all if not yet in
  // one." The old hero photo and the phrasebook/currency/places/map/emergency quick-link
  // row that used to sit here are gone — every one of those destinations is still reachable
  // via its own bottom tab or another existing link, never removed, just no longer a
  // redundant row competing with the map for the lead position.
  // Explore's spine: 4-6 travel REGIONS, not 184 provinces. Each row carries what the
  // region is and how much is actually mapped there, so a traveller can judge where the
  // depth is before tapping. The map and the list drive the same route — the map for people
  // who think geographically, the list for people who read.
  if (zonesFor(cc).length) {
    wrap.append(h('div', { class: 'home-section', style: 'margin:8px 0 4px' }, `🗺 ${c.name} by region`));
    const zm = zonesMap(cc, { onPick: (zid) => go(`#region-${cc}-${zid}`) });
    if (zm) wrap.append(zm);
    const zl = zonePickList(cc);
    if (zl) wrap.append(zl);
  }

  // Lead with WHERE THE TRAVELLER IS: if their location or focus resolves to a city in
  // this country, surface that city first and let them widen to the whole country. Only
  // when it is a real signal (GPS or a chosen focus), never the capital default.
  const fs = focusSpot(cc);
  const fcity = (fs && (fs.source === 'gps' || fs.source === 'focus') && fs.spot) ? fs.spot.city : null;
  const fslug = fcity ? citySlug(fcity) : null;
  if (fcity) {
    const here = allPlaces({ country: cc }).filter((p) => citySlug(p.city || '') === fslug).length;
    wrap.append(h('div', { class: 'card access-focus' }, [
      h('h2', { style: 'margin-top:0' }, `📍 You’re around ${fcity}`),
      h('p', { class: 'muted', style: 'margin:4px 0 8px' },
        here ? `${here} place${here > 1 ? 's' : ''} here — start local, then widen out when you want.` : 'Start with what’s around you, then widen out.'),
      here ? h('button', { class: 'btn block', onclick: () => go(`#places-${cc}-${fslug}`) }, `Places in ${fcity}`) : null,
      // Weather dropped from this row — it duplicated the "Get oriented" deck's own Weather
      // tile just below, same label, same destination, both visible on this screen at once
      // (found in the sitewide duplicate-chip audit). "Get oriented" is the fuller reference
      // list, so it keeps Weather; this row stays focused on the two truly location-specific
      // actions (what's near THIS spot, is this even the right city).
      h('div', { class: 'chips', style: 'margin-top:6px' }, [
        h('button', { class: 'chip', onclick: () => go('#nearby') }, [chipIcon('pin'), 'Near me now']),
        h('button', { class: 'chip', onclick: () => go(`#setcity-${cc}`) }, [chipIcon('pin'), 'Not here? Change city']),
      ]),
    ]));
  } else {
    // No location signal (offline / GPS off): let them SET where they are so distances,
    // weather and "near me" all match. Fully offline — no GPS required.
    wrap.append(whereAmICard(cc));
  }

  // "More for {country}" (the full toolkit, as chip decks) moved to directly after the
  // location card and above Signature sights, per direct request. Regrouped from one
  // 26-tile wall into four labelled, collapsible sub-clusters so a traveller scans four
  // intents, not a flat grid; the "identify what's around me" tools sit together under See
  // & do. Rendered as chip rows (icon + label), not tiles, per an earlier direct request
  // ("explore all the tools should be made chips like the home section") — same
  // .status-chip/.chips classes and home-group-d collapsible as Home's own Tools/Identify
  // groups, not a look-alike, the SAME components. Each tile's one-line hint (d) still
  // reaches screen readers via aria-label even though a chip has no room to show it, same
  // "fold the hint into the accessible name" idiom sectionTile itself already used.
  const lang = getLanguage(c.lang);
  const tileGroups = [
    { label: 'Get oriented', tiles: [
      { ic: '🛬', t: 'Just arrived', d: 'First hour: cash, SIM, airport → town', hash: `#arrival-${cc}` },
      { ic: '🧭', t: 'Country guide', d: 'Money, SIM, visa, safety', hash: `#info-${cc}` },
      { ic: '💬', t: 'Phrasebook', d: lang ? lang.label : 'Language', hash: `#phrasebook-${c.lang}` },
      { ic: '💱', t: 'Money & prices', d: `Convert to ${c.currency}, avoid overcharging`, hash: `#prices-${cc}` },
      { ic: '🌤', t: 'Weather', d: '7-day forecast', hash: `#weather-${cc}` },
      { ic: '🆘', t: 'Emergency', d: 'Numbers, hospitals, first aid', hash: '#sos' },
    ] },
    { label: 'Getting around', tiles: [
      { ic: '🚌', t: 'Getting around', d: 'Best way to next place', hash: `#transport-${cc}` },
      { ic: '🛂', t: 'Between countries', d: 'Border crossings, hours & visas', hash: '#crossings' },
      { ic: '📋', t: 'Schedules', d: 'Train/bus times', hash: `#schedules-${cc}` },
      { ic: '🧭', t: 'Journey planner', d: 'Chain buses/trains/boats', hash: '#route' },
      { ic: '🗺️', t: 'Map', d: 'Offline + GPS', hash: '#places' },
    ] },
    { label: 'Eat & drink', tiles: [
      { ic: '🍜', t: 'Food', d: 'Dishes & ingredients', hash: `#food-${cc}` },
      { ic: '🍢', t: 'Street food', d: 'Find, rate & review stalls', hash: '#streetfood' },
      { ic: '📌', t: 'Local noticeboard', d: 'Markets, family supplies', hash: `#board-${cc}` },
      { ic: '🍈', t: 'Market produce', d: 'Fruit, veg & herbs', hash: '#produce' },
    ] },
    { label: 'See & do', tiles: [
      { ic: '📍', t: 'Places', d: 'For your taste & price', hash: `#places-${cc}` },
      { ic: '🏆', t: 'Best of', d: 'Top picks, families & more', hash: `#bestof-${cc}` },
      { ic: '🕒', t: 'Things to do', d: 'Picks for right now', hash: `#today-${cc}` },
      { ic: '👪', t: 'With kids', d: 'Schools, childcare, things to do', hash: `#family-${cc}` },
      { ic: '🎉', t: 'Festivals', d: 'Dates & holidays', hash: `#events-${cc}` },
      { ic: '🏊', t: 'Pools', d: 'Swims & day passes', hash: `#pools-${cc}` },
      { ic: '🙏', t: 'Places of worship', d: 'Temples, churches, mosques', hash: `#worship-${cc}` },
      { ic: '🌿', t: 'Identify nature', d: 'Birds, fish, plants', hash: '#nature' },
      { ic: '🔊', t: 'Sounds around you', d: 'Animal & bird calls', hash: '#sounds' },
      { ic: '⭐', t: 'Saved', d: 'Your collections', hash: '#saved' },
    ] },
  ];
  // E3: "Get oriented" / "Getting around" / "Eat & drink" default EXPANDED always, per direct
  // request — these are the day-to-day decks a traveller reaches for regardless of trip phase.
  // "See & do" alone stays phase-ranked (opens while 'traveling', the phase it fits best);
  // planning/post no longer force a single deck open since three of the four are already open.
  // Nothing persisted per-deck: like Home, this always recomputes on render, not a sticky
  // manual override — a traveller can still collapse one for the moment by tapping it.
  const explorePhase = store.profile.prefs.phase || inferPhase();
  const ALWAYS_OPEN_DECKS = new Set(['Get oriented', 'Getting around', 'Eat & drink']);
  const openDeck = explorePhase === 'traveling' ? 'See & do' : null;
  const toolChip = (x) => h('button', {
    class: 'status-chip', onclick: () => go(x.hash), 'aria-label': x.d ? `${x.t}. ${x.d}` : x.t,
  }, [h('span', { class: 'status-ic' }, x.ic), h('span', { class: 'status-lbl' }, x.t)]);
  wrap.append(h('h2', { class: 'home-section', style: 'margin-top:14px' }, `More for ${c.name}`));
  tileGroups.forEach((g) => {
    const shouldOpen = ALWAYS_OPEN_DECKS.has(g.label) || g.label === openDeck;
    const details = h('details', { class: 'home-group-d', open: shouldOpen ? '' : null }, [
      h('summary', { class: 'home-group' }, g.label),
      h('div', { class: 'chips' }, g.tiles.map(toolChip)),
    ]);
    wrap.append(details);
  });

  // Explore E4–E7: discovery leads, then the reference/admin cards — Signature sights leads
  // ("What's here"), then Where next ("What's after this"), then the more occasional reads
  // (Fits your trip / seasonal / You might not know / solo note / Explore by city), then
  // History & culture last of the discovery run before the reference cards. Each section
  // independently omits itself when it has nothing real to show.
  const hubSights = signatureSightsStrip(cc);
  if (hubSights) wrap.append(hubSights);
  const whereNext = whereNextSection(argCc, fcity); if (whereNext) wrap.append(whereNext);
  const fits = fitsYourTripSection(cc); if (fits) wrap.append(fits);
  const seasonal = seasonalFitSection(cc, fcity, fslug); if (seasonal) wrap.append(seasonal);
  const notKnow = mightNotKnowSection(cc); if (notKnow) wrap.append(notKnow);
  if (store.profile.prefs.soloFemale || store.profile.prefs.party === 'solo') {
    wrap.append(h('div', { class: 'card', style: 'border:1px solid var(--magenta)' }, [
      h('strong', {}, '🧭 Travelling solo'),
      h('p', { class: 'muted', style: 'margin:4px 0 8px' }, 'Practical, non-alarmist safety notes for solo and women travellers here.'),
      h('button', { class: 'btn block', onclick: () => go(`#sos-${cc}`) }, 'See solo & women’s safety'),
    ]));
  }

  // The flat "Explore {country} by city" fold used to sit here: a 12-city grid plus a link
  // to the Places map. Both jobs moved — towns are now reached through the region that
  // contains them (above), which gives each one context instead of a bare name, and the
  // same city grid was already being rendered a second time by Places' own city picker.
  // History & culture is collapsed by default (minimise/maximise) with an in-depth read —
  // it is not something a traveller reads every day, so it should not be the first thing.
  const hi = countryHistory(cc);
  if (hi && hi.blurb) {
    wrap.append(foldable('History & culture', h('div', {}, [
      h('p', {}, hi.blurb),
      knownForRow(hi.knownFor),
      hi.cultureTip ? h('p', { class: 'culture-tip' }, `🙏 ${hi.cultureTip}`) : null,
      h('button', { class: 'btn ghost block', style: 'margin-top:6px', onclick: () => go(`#history-${cc}`) }, '📖 In-depth history & culture'),
    ])));
  }
  // Accessibility / Entry & visa / Travelling with kids default MINIMISED (defaultOpen=false)
  // per direct request — reference material a traveller dips into, not something to read
  // every visit; still one tap away, never removed.
  const acc = accessCard(cc); if (acc) wrap.append(collapsibleCard(acc, 'hubAccessOpen', false));
  const vc = visaCard(cc); if (vc) wrap.append(collapsibleCard(vc, 'hubVisaOpen', false));
  // The family module is requested for 'explore'/'country' in ROUTE_SCREENS, so it is loaded
  // by the time this runs; the guard is for any future caller that is not route-gated.
  const famMod = screenMod('family');
  const famc = famMod ? famMod.familyCard(cc) : null;
  if (famc) wrap.append(collapsibleCard(famc, 'hubFamilyOpen', false));

  mount(wrap, '#explore');
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
      h('button', { class: 'btn ghost block', onclick: () => go('#places') }, 'Set my accommodation on the map')),
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
  doCard.append(h('button', { class: 'btn ghost block', onclick: () => go('#places') }, '🏠 Save where I am staying on the map'));
  if (c && c.lang) doCard.append(h('button', { class: 'btn ghost block', style: 'margin-top:6px', onclick: () => go(`#phrasebook-${c.lang}`) }, '💬 First words — hello, thanks, numbers'));
  doCard.append(h('button', { class: 'btn ghost block', style: 'margin-top:6px', onclick: () => go(`#sos-${cc}`) }, '🆘 Emergency numbers here'));
  doCard.append(h('button', { class: 'btn ghost block', style: 'margin-top:6px', onclick: () => go(`#scams-${cc}`) }, '⚠️ Common scams — and how to avoid them'));
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
  const bcc = beaches.length && beaches[0].p ? beaches[0].p.country : undefined;
  if (beaches.length && estDriveMin(beaches[0].km, bcc) != null && estDriveMin(beaches[0].km, bcc) <= DAYTRIP_MAX_MIN) {
    const b = beaches[0].p;
    const inSeason = jellyInSeason(b, m);
    const near = withinNear(beaches[0].km, bcc);
    const dl = driveLabel(beaches[0].km, bcc);
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
    const w = whereAmI(f);
    if (w) return { city: w.name, country: w.country, km: w.km != null ? w.km : 0, near: !!w.approx };
    return null;
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
    const country = info ? info.country : getActiveCountry();
    setActiveCountry(country);
    const nb = nearestSpotGlobal(f); if (nb) setFocusSpot(nb.spot);   // remember where they are for weather/today
    const cName = getCountry(country) ? getCountry(country).name : '';
    status.innerHTML = '';
    status.append(
      h('strong', {}, info ? `You are ${info.near ? 'near' : 'in'} ${info.city}` : 'You are here'),
      (info && cName) ? h('span', { class: 'muted' }, ` · ${cName}${info.km > 60 ? ` (${fmtDistance(info.km)} away)` : ''}`) : null,
    );

    // Rank ALL nearby places once; drawList() filters "not interested" ones out on each draw
    // (using the live set), so a reset — which clears the marks — restores them immediately
    // without needing to leave and re-open the screen. "Done" places stay findable here (this
    // is a directory, not the rotating suggestion feed) and only drop out of the Home picks.
    const ranked = allPlaces({ country }).filter((p) => p.coords)
      .map((p) => ({ p, km: haversineKm(f, p.coords) })).sort((a, b) => a.km - b.km);

    body.innerHTML = '';
    // Featured (open by default) while still "fresh off the plane": on the ground and the
    // Just arrived chip has not been dismissed. Used to check the now-removed 'arrived'
    // phase value directly; the dismissible chip (justArrivedChip, js/screens/home.js) is
    // the new, narrower signal for "just landed" now that the phase itself only has one
    // merged on-the-ground stage.
    body.append(arrivalEssentials(country, (store.profile.prefs.phase || '') === 'traveling' && !store.profile.prefs.justArrivedHidden));
    body.append(h('button', { class: 'btn ghost block', style: 'margin-top:6px', onclick: () => go(`#arrival-${country}`) }, '🛬 Full arrival guide — airport→town, cash, SIM'));
    body.append(h('div', { class: 'chips', style: 'margin:10px 0' }, [
      h('button', { class: 'chip', onclick: () => go(`#places-${country}`) }, [chipIcon('map'), 'See on the map']),
      h('button', { class: 'chip', onclick: () => go('#places') }, [chipIcon('pin'), 'Set my stay']),
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
    body.append(
      h('h3', { style: 'margin:14px 2px 4px' }, 'Closest to you'),
      catRow,
      h('p', { class: 'tiny muted', style: 'margin:6px 2px 8px' },
        'Distances are straight-line and drive times are rough estimates — mountain roads (for example around Pai, Sapa or the Bolaven Plateau) take considerably longer.'),
      listEl,
    );

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
      const near = ranked.filter(({ p, km }) => withinNear(km, p.country) && !hid.has(p.id) && catOk(p)).sort(bySort).slice(0, 40);
      const afield = ranked.filter(({ p, km }) => withinDayTrip(km, p.country) && !hid.has(p.id) && catOk(p)).sort(bySort).slice(0, 20);

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
              h('span', { class: 'dist-chip' }, `${fmtDistance(km)} · ${driveLabel(km, p.country)} · ${compass(bearing(f, p.coords))}`),
              tags.length ? h('div', { class: 'near-tags' }, tags) : null,
            ]),
          ]),
          h('div', { class: 'rn-actions' }, [
            h('button', { class: 'rn-act done' + (done ? ' on' : ''), title: done ? 'Done — tap to undo' : 'Mark as done', 'aria-label': `Mark ${p.name} as done`, onclick: () => { const wasDone = done; toggleSpotDone(p.id); drawList(); if (!wasDone) showUndoToast(`“${p.name}” marked done`, () => { toggleSpotDone(p.id); drawList(); }); } }, '✓'),
            h('button', { class: 'rn-act', title: 'Not interested — hide this', 'aria-label': `Hide ${p.name}`, onclick: () => { hideSpot(p.id); drawList(); showUndoToast(`Hidden “${p.name}”`, () => { unhideSpot(p.id); drawList(); }); } }, '✕'),
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
// Shared amount/currency <-> amount/currency control: "[1][USD▾] = [x][THB▾]", the middle "="
// doubling as the swap button so direction flips in one tap without a second control eating
// space. Both the standalone Currency screen and the compact card inside Budget build on this
// so the shape, the maths and the live/offline note never drift apart between them — only the
// two starting currencies are the caller's job.
// `opts.compact` drops the live/offline rates footnote — Home's budget fold is the tightest
// surface in the app and already carries its own status line, so the note would be a third
// stacked caption in one small card. The Currency and Budget screens keep it.
export function fxConverterControl(fromDefault, toDefault, opts = {}) {
  const amount = h('input', { type: 'number', value: '1', inputmode: 'decimal', 'aria-label': 'Amount' });
  const fromSel = currencySelect(fromDefault);
  const toSel = currencySelect(toDefault);
  const out = h('input', { type: 'text', readonly: '', tabindex: '-1', class: 'fx-out', 'aria-label': 'Converted amount', 'aria-live': 'polite' });
  const rates = getRates();
  function recompute() {
    const v = parseFloat(amount.value) || 0;
    const r = convert(v, fromSel.value, toSel.value);
    out.value = r == null ? '—' : r.toLocaleString(dateLocale(), { maximumFractionDigits: r >= 100 ? 0 : 2 });
  }
  amount.addEventListener('input', recompute);
  fromSel.addEventListener('change', recompute);
  toSel.addEventListener('change', recompute);
  const wrap = h('div', { class: 'fx-widget' }, [
    h('div', { class: 'fx-row' }, [
      h('div', { class: 'fx-side' }, [amount, fromSel]),
      h('button', { type: 'button', class: 'fx-eq', title: 'Swap currencies', 'aria-label': 'Swap currencies', onclick: () => { const t = fromSel.value; fromSel.value = toSel.value; toSel.value = t; recompute(); } }, '='),
      h('div', { class: 'fx-side' }, [out, toSel]),
    ]),
    opts.compact ? null : h('p', { class: 'tiny muted', style: 'margin:6px 0 0' }, rates.live ? `Live mid-market rates as of ${rates.date}.` : 'Approximate rates (offline baseline) — connect and refresh to update.'),
  ]);
  recompute();
  return wrap;
}

function currencyScreen() {
  // focusSpot(), not the last-viewed Explore tab — "the country the traveller is in or headed
  // to," same resolver Places/Weather/Budget already anchor on, so this default is right even
  // if the last country tab they browsed was a different one.
  const fc = focusSpot().spot.country || getActiveCountry();
  const c = getCountry(fc);
  const local = c ? c.currency : 'THB';
  const home = homeCurrency();
  const wrap = h('div', { class: 'screen' });
  wrap.append(topbar('Currency', '#home'));
  wrap.append(h('div', { class: 'card' }, [fxConverterControl(home, local)]));

  const quick = h('div', { class: 'card' }, [h('h2', {}, `Quick guide: ${home} → ${local}`)]);
  [1, 5, 10, 20, 50, 100].forEach((n) => {
    const r = convert(n, home, local);
    quick.append(h('div', { class: 'price-item row-between' }, [
      h('span', {}, `${n} ${home}`),
      h('strong', { class: 'fair' }, r == null ? '—' : `${r.toLocaleString(dateLocale(), { maximumFractionDigits: 0 })} ${local}`),
    ]));
  });
  wrap.append(quick);

  wrap.append(h('button', { class: 'btn ghost block', onclick: () => go('#exchange-swap') }, '🤝 Swap cash with a traveller (no fees)'));
  wrap.append(h('button', { class: 'btn block', onclick: async () => { await refreshRates(); go('#currency'); } }, 'Refresh rates (needs internet)'));
  wrap.append(h('p', { class: 'disclaimer' }, 'Indicative mid-market values for guidance; money changers and cards apply their own spread.'));
  mount(wrap, '#home');
}

// The traveller's home currency (set in Settings; defaults to USD).
export function homeCurrency() { return (store.profile && store.profile.homeCurrency) || 'USD'; }

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
function fmtMoney(n, cur) { return `${Number(n).toLocaleString(dateLocale(), { maximumFractionDigits: n >= 100 ? 0 : 2 })} ${cur || ''}`.trim(); }

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
  if (fix) { try { const w = whereAmI(fix); if (w && w.name) return w.name; } catch { /* noop */ } }
  const c = getCountry(getActiveCountry()); return c ? c.name : '';
}

// A "paste a shared link" importer: opens the payload exactly as tapping the link would.
function pasteLinkBox(hint) {
  // aria-label, not just the placeholder: a placeholder is announced as a value and vanishes
  // as soon as the field has content, leaving the box unnamed.
  const label = hint || 'Paste a link a traveller sent you';
  const inp = h('input', { type: 'text', placeholder: label, 'aria-label': label, style: 'width:100%' });
  return h('div', { class: 'card' }, [
    // h2, not h3: this is a card heading and the card beside it on the same screen uses h2, so
    // an h3 here skipped a level in the outline for no reason.
    h('h2', { style: 'margin-top:0' }, '📥 Got a link?'),
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
  const c = getCountry(getActiveCountry());
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
  wrap.append(h('p', { class: 'lead' }, 'Swap cash, split a ride, pass on a room, hand off a car seat, a bike or camping kit — post it, share the link, meet in person. No account, no server; nothing leaves your phone on its own.'));
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
export function priceLine(low, high, currency) {
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
export function approxHome(amount, currency) {
  if (amount == null || amount === '') return '';
  const home = homeCurrency();
  if (!currency || currency === home) return '';
  const v = convert(Number(amount), currency, home);
  if (v == null || !isFinite(v)) return '';
  return `≈ ${money(v, home)}`;
}

export function countryChips(onPick, selected = getActiveCountry()) {
  return h('div', { class: 'country-row' }, COUNTRIES.map((c) =>
    h('button', {
      class: 'country-chip', 'aria-pressed': c.id === selected ? 'true' : 'false',
      onclick: () => onPick(c.id),
    }, [h('span', { class: 'flag' }, c.flag), h('span', {}, c.name)])));
}

// ---- PLACES -----------------------------------------------------------------
// A representative self-hosted photo for a city: the highest-rated place in that city
// that carries a photo. Lets the city picker show a recognisable image, not just a name.
function cityRepPhoto(cc, slug) {
  const inCity = allPlaces({ country: cc })
    .filter((p) => citySlug(p.city || '') === slug)
    .sort((a, b) => (Number(b.rating) || 0) - (Number(a.rating) || 0));
  for (const p of inCity) { const src = placePhotoSrc(p); if (src) return src; }
  return null;
}

// A photo grid of cities: each a tappable card with a representative photo (emoji fallback)
// and a place count, scoping to that city. Shared by the Places-for-you city picker and the
// country hub's "Explore" card so both drill down the same, recognisable way.
function cityPickGrid(cc, cities, counts) {
  const grid = h('div', { class: 'city-pick-grid' });
  cities.forEach((city) => {
    const slug = citySlug(city);
    const src = cityRepPhoto(cc, slug);
    const thumb = src
      ? h('img', { class: 'city-pick-thumb', src, alt: '', loading: 'lazy', decoding: 'async' })
      : h('span', { class: 'city-pick-thumb ph' }, '🏙');
    grid.append(h('button', { class: 'city-pick', onclick: () => go(`#places-${cc}-${slug}`) }, [
      thumb,
      h('span', { class: 'city-pick-name' }, city),
      h('span', { class: 'city-pick-count' }, `${counts[city]} place${counts[city] > 1 ? 's' : ''}`),
    ]));
  });
  return grid;
}

// ---- "For you" personalisation ------------------------------------------------
// Once the traveller sets a profile (#foryou), lists rank what fits them first:
// budget tier, kids, long-stay fit and interests all add to a place's base rating.
function profileIsSet() {
  const p = store.profile.prefs;
  return !!(p.party || p.tripLength || (p.budget && p.budget !== 'flexible') || (p.interests || []).length);
}

// placeScreen() (the place-detail page) and its detail-only helper cluster (ratingBlock,
// resolveItem, the market/beach clusters, external ratings, orientation+access, transit,
// local secrets, photos, yourLayer) moved to js/screens/places.js — task #205 step 5.
// cityRepPhoto/cityPickGrid above and profileIsSet above THAT stayed here: physically inside
// the old Places section but not actually Places logic (regionScreen and onboarding are their
// only real callers) — confirmed against a fresh call graph, not the section's own old label.

// ---- PRICES -----------------------------------------------------------------
function pricesScreen(countryId) {
  if (countryId) setActiveCountry(countryId);
  const wrap = h('div', { class: 'screen' });
  // Heading stays "Fair prices" (proven single-line at 375px) even though the Explore tile now
  // reads "Money & prices" — "Money & prices" measured 3 lines here (task #176's regression
  // threshold), and the converter card immediately below already makes the currency half obvious.
  wrap.append(topbar('Fair prices', getCountry(getActiveCountry()) ? `#country-${getActiveCountry()}` : '#home'));
  wrap.append(countryChips((id) => go(`#prices-${id}`)));

  const country = getCountry(getActiveCountry());
  // Live converter — merged in from the old standalone "Currency" Explore tile (now one
  // combined destination). The fuller currency screen (#currency: quick-reference table,
  // cash-swap link, manual refresh) stays reachable from here and from Home Tools.
  if (country) {
    wrap.append(h('div', { class: 'card' }, [
      h('h2', { style: 'margin:0 0 8px' }, `💱 ${homeCurrency()} → ${country.currency}`),
      fxConverterControl(homeCurrency(), country.currency, { compact: true }),
      h('button', { class: 'btn ghost block', style: 'margin-top:8px', onclick: () => go('#currency') }, 'More currency tools →'),
    ]));
  }
  wrap.append(h('h2', { class: 'cat-title', style: 'margin-top:14px' }, '🏷 Fair prices'));

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
  if (countryId) setActiveCountry(countryId);
  const wrap = h('div', { class: 'screen' });
  wrap.append(topbar('Getting around', '#home'));
  wrap.append(countryChips((id) => go(`#transport-${id}`)));
  wrap.append(h('button', { class: 'btn block', style: 'margin-bottom:12px', onclick: () => go('#route') }, '🧭 Plan a whole journey A → B (incl. borders)'));
  // Rent & ride, tickets and schedules — always shown, even where intercity routes are sparse.
  const ga = getAroundSection(getActiveCountry());
  if (ga) wrap.append(ga);

  const country = getCountry(getActiveCountry());
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
  const fs = focusSpot(getActiveCountry());
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

export function twelveGoUrl(from, to) {
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

export function planCard(pl, primary) {
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
  if (!planFrom) { const cap = CAPITAL[getActiveCountry()]; if (cap && nodes.includes(cap)) planFrom = cap; }

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
  if (countryId) setActiveCountry(countryId);
  const wrap = h('div', { class: 'screen' });
  const country = getCountry(getActiveCountry());
  wrap.append(topbar(country ? `${country.name} guide` : 'Country guide', country ? `#country-${getActiveCountry()}` : '#home'));
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
      // Cap the shared item count — the payload travels base64-encoded inside the URL hash
      // (MAX_PAYLOAD_URL, social.js) with no truncation-safe fallback if it runs over, so an
      // uncapped map() over a very large collection could silently produce a link too long
      // for some share targets (SMS, certain in-app browsers) to carry intact. 80 is well
      // above any realistic saved-places list while staying comfortably inside the budget.
      shareButton('📤 Share this list', `${title} — places to check out`, () => shareUrl('in', encodeShare('collection', { name: title, items: items.slice(0, 80).map((p) => ({ id: p.id, n: p.name })) }, ensureMe()))),
    ]));
  }
  if (coll) {
    wrap.append(h('div', { class: 'card' }, [
      h('button', { class: 'btn ghost block', style: 'color:var(--warn); border-color:var(--warn)',
        onclick: () => { confirmAction({ title: 'Delete collection?', body: `Delete the “${coll.name}” collection? Your places stay; only the grouping is removed.`, confirmLabel: 'Delete', danger: true }).then((ok) => { if (ok) { deleteCollection(coll.id); go('#saved'); } }); } }, 'Delete collection'),
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
  wrap.append(screenHint('Public swimming pools, hotel & resort day passes, water parks and managed natural swimming spots. Prices are ranges in local currency and change often — guidance only, confirm locally.'));
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
  wrap.append(topbar('Border crossings', '#places'));
  wrap.append(screenHint('Open land, bridge and river crossings used by foreign travellers. Hours and visa rules change often and vary by nationality — treat these as guidance and confirm with official sources before you travel.'));
  // Freshness badge: the oldest "verified" date across all crossings, so the whole set is
  // judged by its weakest link. Quiet ✓ while under ~6 months old, a prominent ⚠ nudge once
  // it ages. Re-checked on every open (self-updating age, server-free).
  {
    const dates = CROSSINGS.map((x) => x.verified).filter(Boolean).sort();
    const oldest = dates[0];
    if (oldest) {
      const d = new Date(oldest + '-01T00:00:00');
      const label = isNaN(d.getTime()) ? oldest : d.toLocaleDateString(dateLocale(), { month: 'long', year: 'numeric' });
      const fresh = freshnessLine(oldest, 'Border crossing details', 183, label);
      if (fresh) wrap.append(fresh);
    }
  }
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
  mount(wrap, true);
}

function addPinScreen(editId) {
  const existing = editId ? getPin(editId) : null;
  const editing = !!existing;
  const wrap = h('div', { class: 'screen' });
  wrap.append(topbar(editing ? 'Edit place' : 'Add a place', editing ? `#place-${editId}` : '#places'));
  if (editId && !existing) { wrap.append(h('p', { class: 'empty' }, 'Place not found.')); mount(wrap, '#places'); return; }
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
  mount(wrap, true);
}

function toggleSet(set, v) { if (set.has(v)) set.delete(v); else set.add(v); }
function collToggleChip(name, emoji, onToggle) {
  return h('button', { class: 'chip', 'aria-pressed': 'false', onclick: (e) => {
    const c = e.currentTarget; const on = c.getAttribute('aria-pressed') === 'true';
    c.setAttribute('aria-pressed', on ? 'false' : 'true'); onToggle(c);
  } }, `${emoji} ${name}`);
}

// ---- TRAVEL JOURNAL (antique book) ------------------------------------------
// journalDispatch/journalCover/journalTOC/journalEntryScreen/journalFormScreen, the
// post-travel scrapbook, and the journey map all moved to js/screens/journal.js (module
// split, task #211 slice 4). entryPhotoKeys stays here instead — its definition sits right
// in the middle of the moved region, but two callers below (this file's own
// exportJournalHtml and a second full-trip HTML exporter, ~200 lines on) are outside it,
// caught by grepping every call site rather than assuming from how often the NEW file
// calls it. Now exported for js/screens/journal.js to reverse-import.
//
// A journal entry's photo blob keys — the multi-photo photoKeys[] if present, else the
// legacy single photoKey. Tolerates a null entry (new entry).
export function entryPhotoKeys(e) {
  if (!e) return [];
  if (Array.isArray(e.photoKeys) && e.photoKeys.length) return e.photoKeys.filter(Boolean);
  return e.photoKey ? [e.photoKey] : [];
}

// ---- TRAVEL CALENDAR + DAY PLANNER ------------------------------------------
// calendarDispatch/calendarScreen/calendarFormScreen and the private personal-calendar
// cards moved to js/screens/calendar.js (module split, task #211 slice 3). CAL_ICON stays
// here, exported, because the You-hub "Coming up" reminders card (below) reads it directly;
// calItems stays here too, unexported, because its only caller, nextPlanItem() below,
// already lives in this file — confirmed by grep rather than assumed from the two functions
// sitting next to calendarDispatch in the original file.
export const CAL_ICON = { stay: '🛏', meal: '🍽', activity: '🎟', plan: '🗓', laundry: '🧺', appointment: '📌', festival: '🎉' };

// Order items by date, then by time-of-day (untimed entries fall to the end of the day).
function calItems() {
  return store.calendar.items.slice().sort((a, b) => {
    const ka = `${a.date} ${a.time || '99:99'}`, kb = `${b.date} ${b.time || '99:99'}`;
    return ka < kb ? -1 : (ka > kb ? 1 : 0);
  });
}

// ---- DIETARY PROFILE (allergies + diet) -------------------------------------
// Powers the food-identifier highlighting and the pinned phrasebook allergy card. The pure,
// DOM-free verdict logic and all tables now live in js/data/diet.js (so scripts/validate.mjs
// can behaviourally test them); the wrappers below inject the saved profile.
//
// SAFETY: the highlighting is guidance drawn from each dish's LISTED allergens/ingredients,
// never a guarantee. A green border means "nothing you avoid is listed", not "confirmed
// safe"; recipes and shared woks vary. The real safety tool is showing the cook the
// translated allergy phrase (phrasebook). Belief flags vegetarian/vegan/pescatarian/halal/
// kosher/no-pork/no-beef/no-alcohol DO drive the verdict via structured ingredient
// inspection (land-meat and alcohol matching); no-chili (spice guidance) and no-msg
// (undetectable from listed data) intentionally never colour a dish — both are phrasebook /
// spice-note only.
const { DIET_OPTIONS, DIET_LABEL, joinList, dishMeatHits } = Diet;
// Thin wrappers injecting the saved profile (store.profile.prefs.diet) into the pure diet.js
// functions, so every existing call site keeps working unchanged.
function dietAvoidAllergens(diet) { return Diet.dietAvoidAllergens(diet || store.profile.prefs.diet || []); }
function dietEvaluable(dietArr, av) { return Diet.dietEvaluable(dietArr || store.profile.prefs.diet || [], av); }
function dishDietReasons(d, avoid, diet) { return Diet.dishDietReasons(d, avoid, diet || store.profile.prefs.diet || []); }
function dishDietVerdict(d, avoid, diet) { return Diet.dishDietVerdict(d, avoid, diet || store.profile.prefs.diet || []); }

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
// A reusable chip picker for the dietary profile. onChange() fires after each toggle.
export function dietPicker(onChange) {
  const sel = new Set(store.profile.prefs.diet || []);
  const box = h('div', {});
  DIET_OPTIONS.forEach((grp) => {
    box.append(h('p', { class: 'tiny muted', style: 'margin:8px 0 4px' }, grp.group));
    box.append(h('div', { class: 'chips', role: 'group', 'aria-label': grp.group }, grp.items.map((it) =>
      h('button', {
        class: 'chip', 'aria-pressed': sel.has(it.id) ? 'true' : 'false',
        onclick: (e) => {
          if (sel.has(it.id)) sel.delete(it.id); else sel.add(it.id);
          store.profile.prefs.diet = [...sel]; save();
          e.currentTarget.setAttribute('aria-pressed', sel.has(it.id) ? 'true' : 'false');
          if (onChange) onChange();
        },
      }, [h('span', { 'aria-hidden': 'true' }, `${it.emoji} `), it.label]))));
  });
  return box;
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

// A small recognition thumbnail for list rows whose item keys into the PHOTOS registry
// (dishes, produce, wildlife). Shows the self-hosted photo when one exists (offline,
// lazy-loaded); otherwise the same calm emoji placeholder as before, so a row with no photo
// is visually unchanged. Helps a traveller match a dish / fruit / creature by sight.
function recogThumb(item, emoji, extra) {
  const src = placePhotoSrc(item);
  const cls = extra ? ` ${extra}` : '';
  if (src) return h('img', { class: `species-photo${cls}`, src, alt: '', loading: 'lazy', decoding: 'async' });
  return h('span', { class: `species-emoji${cls}`, 'aria-hidden': 'true' }, emoji);
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
  // Bad state: the visible .food-warn line below already names the flagged allergen, so hide
  // the badge from the accessible name to avoid announcing it twice (keep the title for hover).
  // Ok state: the badge has no accompanying visible text, so it keeps role=img + aria-label.
  const badge = verdict === 'bad'
    ? h('span', { class: 'food-flag bad', 'aria-hidden': 'true', title: badLabel }, '✕')
    : verdict === 'ok'
      ? h('span', { class: 'food-flag ok', role: 'img', 'aria-label': okLabel, title: okLabel }, '✓')
      : null;
  const main = h('button', { class: 'id-cardmain', onclick: () => go(`#dish-${d.id}`) }, [
    recogThumb(d, cat ? cat.emoji : '🍽'),
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
  return h('div', { class: cls + ' id-cardrow' }, [main, idPinStar('dish', d.id)]);
}

// ---- PERSONAL IDENTIFIER ----------------------------------------------------
// Things the traveller pinned from the identify tools (dishes, market produce and
// wildlife), gathered in the YOU hub the same way the personal phrasebook gathers
// pinned phrases. Keys are "type:id"; the stored order IS the display order.
const ID_TYPES = {
  dish:    { label: 'Dishes',   emoji: '🍜', get: getDish,    name: (o) => o.name,       hash: (id) => `#dish-${id}` },
  produce: { label: 'Produce',  emoji: '🍈', get: getProduce, name: (o) => o.name,       hash: (id) => `#produce-${id}` },
  species: { label: 'Wildlife', emoji: '🦎', get: getSpecies, name: (o) => o.commonName, hash: (id) => `#species-${id}` },
};
function idPinList() { const p = store.profile.prefs; if (!Array.isArray(p.idPins)) p.idPins = []; return p.idPins; }
function idPinKey(type, id) { return `${type}:${id}`; }
function isIdPinned(type, id) { return idPinList().includes(idPinKey(type, id)); }
function toggleIdPin(type, id) {
  const list = idPinList();
  const key = idPinKey(type, id);
  const i = list.indexOf(key);
  if (i >= 0) { list.splice(i, 1); delete idPinMetaMap()[key]; } else list.push(key);
  save();
  return i < 0;   // true when it is now pinned
}
export function idPinCount() { return idPinList().length; }

// ---- pin organisation: tags (the user's own categories) + notes + reorder --------
function idPinMetaMap() { const p = store.profile.prefs; if (!p.idPinMeta || typeof p.idPinMeta !== 'object') p.idPinMeta = {}; return p.idPinMeta; }
function idMetaGet(key) { const m = idPinMetaMap()[key]; return { tags: (m && Array.isArray(m.tags)) ? m.tags : [], note: (m && m.note) || '' }; }
function idMetaEnsure(key) { const map = idPinMetaMap(); if (!map[key] || typeof map[key] !== 'object') map[key] = { tags: [], note: '' }; if (!Array.isArray(map[key].tags)) map[key].tags = []; if (typeof map[key].note !== 'string') map[key].note = ''; return map[key]; }
function idPruneMeta(key) { const map = idPinMetaMap(); const m = map[key]; if (m && (!m.tags || !m.tags.length) && !m.note) delete map[key]; }
// Every tag currently in use across pinned items, de-duplicated (case-insensitive), in
// first-seen (idPins) order — these are the user's custom categories.
function idAllTags() {
  const seen = new Map();
  idPinList().forEach((key) => idMetaGet(key).tags.forEach((t) => { const k = t.toLowerCase(); if (!seen.has(k)) seen.set(k, t); }));
  return [...seen.values()];
}
function idAddTag(key, raw) {
  const tag = String(raw || '').trim().slice(0, 24);
  if (!tag) return false;
  const m = idMetaEnsure(key);
  if (m.tags.some((t) => t.toLowerCase() === tag.toLowerCase())) return false;
  if (m.tags.length >= 8) return false;   // keep it tidy
  m.tags.push(tag); save(); return true;
}
function idRemoveTag(key, tag) {
  const m = idMetaEnsure(key);
  const i = m.tags.findIndex((t) => t.toLowerCase() === String(tag).toLowerCase());
  if (i >= 0) { m.tags.splice(i, 1); save(); idPruneMeta(key); }
}
function idSetNote(key, raw) {
  const note = String(raw || '').trim().slice(0, 160);
  const m = idMetaEnsure(key); m.note = note; save(); idPruneMeta(key);
}
// Reorder within a display group: swap `key` with its neighbour among `groupKeys`
// (the ordered keys shown in that group), writing the swap back into idPins so the
// order persists. dir is -1 (up) or +1 (down).
function idMovePin(key, dir, groupKeys) {
  const gi = groupKeys.indexOf(key);
  const gj = gi + dir;
  if (gi < 0 || gj < 0 || gj >= groupKeys.length) return;
  const list = idPinList();
  const a = list.indexOf(key);
  const b = list.indexOf(groupKeys[gj]);
  if (a < 0 || b < 0) return;
  list[a] = groupKeys[gj]; list[b] = key;
  save();
}
// A compact save/remove star for the identify browse lists — quick-pin without opening
// the detail page. Stops propagation so it never triggers the row's navigation.
function idPinStar(type, id) {
  const pinned = isIdPinned(type, id);
  return h('button', {
    class: 'id-star' + (pinned ? ' on' : ''),
    'aria-pressed': pinned ? 'true' : 'false',
    'aria-label': pinned ? 'Saved to my identifier — tap to remove' : 'Save to my identifier',
    title: pinned ? 'Saved — tap to remove' : 'Save to my identifier',
    onclick: (e) => { e.stopPropagation(); toggleIdPin(type, id); render(); },
  }, pinned ? '★' : '☆');
}
// A full-width save/remove toggle for an identify detail screen. Re-renders the current
// screen on tap so the label flips immediately and the count stays honest.
function idPinButton(type, id) {
  const pinned = isIdPinned(type, id);
  return h('button', {
    class: 'btn block id-pin-btn' + (pinned ? ' on' : ''),
    'aria-pressed': pinned ? 'true' : 'false',
    onclick: () => { toggleIdPin(type, id); render(); },
  }, pinned ? '★ Saved to your identifier — tap to remove' : '☆ Save to my identifier');
}

function foodScreen(country) {
  if (country) foodCountry = country;
  const wrap = h('div', { class: 'screen' });
  wrap.append(topbar('Identify food', '#home'));
  wrap.append(screenHint('Search dishes by name or ingredient. Tap one for ingredients, allergens, vegetarian notes and a fair price. Set your allergies and diet below and dishes are highlighted for you — green fits, red to avoid. Use “Avoid” to hide dishes with an allergen.'));

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
  const foodLangCC = getCountry(foodCountry) ? foodCountry : (getActiveCountry() || 'th');
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
  // Persistent visually-hidden status so screen readers hear the result count and safety
  // summary when a filter, the search box, or an "Avoid" chip re-runs renderList (WCAG 4.1.3).
  // It lives outside listEl (which is wiped each render) so its updates are announced, and it
  // summarises rather than re-reading every card.
  const listStatus = h('p', { class: 'sr-only', role: 'status', 'aria-live': 'polite' });
  wrap.append(listStatus);
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
    if (!dishes.length) { listEl.append(h('p', { class: 'empty' }, 'No dishes match. Try clearing a filter.')); listStatus.textContent = 'No dishes match. Try clearing a filter.'; return; }
    dishes.forEach((d) => listEl.append(foodCard(d)));
    const bad = evaluable ? dishes.filter((d) => dishDietVerdict(d, avoid) === 'bad').length : 0;
    listStatus.textContent = `${dishes.length} dish${dishes.length === 1 ? '' : 'es'}${bad ? `, ${bad} to avoid` : ''}`;
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
    card.append(h('div', { class: 'diet-banner bad', role: 'status' }, flagged.length
      ? `⚠️ Typically contains ${joinList(flagged)} — you flagged ${flagged.length > 1 ? 'these' : 'this'}. Recipes vary, so check the allergens below and confirm with the cook.`
      : '✕ This lists something you avoid — check the allergens below and confirm with the cook.'));
  } else if (dv === 'ok') {
    // Belief flags the data cannot fully verify (halal/kosher slaughter status): if the dish
    // contains meat, do not present the green state as an endorsement — qualify it.
    const beliefSet = new Set(store.profile.prefs.diet || []);
    const beliefMeat = (beliefSet.has('halal') || beliefSet.has('kosher')) && dishMeatHits(d).length;
    card.append(h('div', { class: 'diet-banner ok', role: 'status' }, beliefMeat
      ? '✓ No pork or alcohol is listed, but this dish contains meat — confirm it is prepared halal/kosher.'
      : '✓ Nothing you avoid is listed for this dish. Recipes vary, so still confirm with the cook.'));
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
  wrap.append(idPinButton('dish', d.id));
  wrap.append(h('a', { class: 'btn block', href: imageSearch(`${d.name} ${d.localName || ''} food`), target: '_blank', rel: 'noopener' }, 'See photos ↗'));
  mount(wrap, '#home');
  // Proactively announce the safety verdict through the persistent route announcer — a live
  // region born inside this just-mounted subtree would not reliably speak. Sequenced after
  // mount()'s own 60 ms heading write so it is not overwritten.
  if (dv === 'bad' || dv === 'ok') {
    const live = document.getElementById('route-announce');
    if (live) {
      const msg = dv === 'bad'
        ? `Warning: ${d.name} typically contains ${joinList(dishDietReasons(d))} that you flagged. Check the allergens and confirm with the cook.`
        : `${d.name}: nothing you avoid is listed. Still confirm with the cook.`;
      setTimeout(() => { live.textContent = msg; }, 120);
    }
  }
}

// ---- MARKET PRODUCE GUIDE (fruit / vegetable / herb) ------------------------
let produceQuery = '';
let produceCat = '';
function produceCard(p) {
  const cat = PRODUCE_CATEGORIES.find((c) => c.id === p.category);
  const main = h('button', { class: 'id-cardmain', onclick: () => go(`#produce-${p.id}`) }, [
    recogThumb(p, p.emoji || (cat ? cat.emoji : '🍈')),
    h('span', { class: 'grow' }, [
      h('div', { class: 'en' }, p.name),
      h('div', { class: 'sci' }, `${(p.names && p.names.th) || ''}${p.season ? ' · ' + p.season : ''}`),
    ]),
  ]);
  return h('div', { class: 'card species-card id-cardrow' }, [main, idPinStar('produce', p.id)]);
}
function produceScreen() {
  const wrap = h('div', { class: 'screen' });
  wrap.append(topbar('Market produce', '#home'));
  wrap.append(screenHint('Fruits, vegetables and herbs you will see at the market — names in every local language, when they are in season, how to eat and pick them, and a fair price.'));
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
  wrap.append(idPinButton('produce', p.id));
  wrap.append(h('a', { class: 'btn block', href: imageSearch(`${p.name} fruit vegetable`), target: '_blank', rel: 'noopener' }, 'See photos ↗'));
  mount(wrap, '#home');
}

import { weatherScreen, wxVizCard, seedWeatherKey, wxDiffDays } from './screens/weather.js';


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
  if (country && getCountry(country)) { setActiveCountry(country); schedCountry = country; }
  const wrap = h('div', { class: 'screen' });
  wrap.append(topbar('Transport schedules', '#home'));
  wrap.append(screenHint('Reference departure times for popular routes — guidance only; always reconfirm with the operator or the booking links below.'));

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
function moodLine(m) {
  return m === 'wet' ? 'a good day for indoor culture, markets and cafes.'
    : m === 'hot' ? 'do outdoor sights early, then escape the midday heat indoors.'
    : 'great for outdoor sights and nature.';
}

// ---- Next plan item -----------------------------------------------------------
// The next thing on the traveller's own calendar — today or later — i.e. their plan.
// (Its old sibling, dailyStripCard — the full "Your day" card this fed — had zero
// callers left anywhere in the app after Home's own rebuild; removed as dead code
// during the full-site audit rather than left to bit-rot. This getter is still very
// much alive: js/screens/home.js's own next-stop card calls it directly.)
export function nextPlanItem() {
  const t = todayISO();
  return calItems().find((it) => it.date && it.date >= t) || null;
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
  // hr < 5 must read as 'night', not fall through to the general "hr < 11 → morning" bucket —
  // 1am/2am is deep night (bars/nightlife are the fit, TODO_NIGHT), not the cool sightseeing
  // "morning" that 6am-10am actually means. Getting this wrong used to boost temples/museums/
  // nature (TODO_CLOSED_AT_NIGHT would have applied instead) as "morning" picks at 2am while
  // ranking genuinely-open bars below them — the opposite of what "right now" should suggest.
  const daypart = hr < 5 ? 'night' : hr < 11 ? 'morning' : hr < 15 ? 'midday' : hr < 18 ? 'afternoon' : hr < 22 ? 'evening' : 'night';
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
  // Weather. Markets are judged on their own (covered vs open-air) rather than lumped in with
  // TODO_RAIN_BAD/generic-good-in-the-rain — most night/walking-street/floating markets here
  // are open-air stalls, not shelter (see marketCovered).
  if (ctx.weather === 'wet') {
    if (isMarket(p)) {
      if (marketCovered(p)) { s += 0.5; reasons.push('☔ Covered market — good in the rain'); }
      else s -= 1.8;
    } else if (todoHasCat(p, TODO_RAIN_BAD)) s -= 1.8;
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
  if (prefs.budget && prefs.budget !== 'flexible' && (p.budgetTier === prefs.budget || p.budgetTier === 'any')) { s += 0.3; reasons.push('💰 Fits your price range'); }
  // Distance
  const dist = (anchor && p.coords) ? haversineKm(anchor, p.coords) : null;
  if (dist != null) s -= Math.min(dist, 200) / 90;
  return { p, er, s, dist, reasons, cats };
}
// The place's single most-identifying category family (beach beats nature, culture beats
// park, …) — used for the accent colour and the placeholder emoji when no photo exists.
// Now a thin alias over render-utils' placeFamilyKey(), which placeCatColor() also uses, so
// the colour and the emoji share one precedence list instead of two hand-synced copies.
export function placeFamily(p) { return placeFamilyKey(p); }
// The self-hosted, openly-licensed photo path for a place, or null. Same lookup as
// photoBlock, exposed so list cards can show a small recognition thumbnail offline.
export function placePhotoSrc(p) {
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
      h('div', { class: 'row-between', style: 'margin:2px 0' }, [
        h('div', { class: 'cats' }, cats.slice(0, 3).map((c) => catTag(c))),
        (p.budgetTier && !p.isPin) ? tierBadge(p.budgetTier) : null,
      ]),
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
  if (explicit) setActiveCountry(explicit);
  const fs = focusSpot(explicit || undefined);
  const spot = fs.spot;
  const id = getCountry(spot.country) ? spot.country : (getCountry(getActiveCountry()) ? getActiveCountry() : 'th');
  setActiveCountry(id);
  todoFamily = 'all';   // fresh filter each visit, so a stale category never hides a new city's picks
  todoPlan = 'now';     // always open on "now"; planning ahead is an explicit, per-visit choice
  const wrap = h('div', { class: 'screen' });
  wrap.append(topbar('Things to do', `#country-${id}`));

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
        try { await refreshLocation(); go('#today'); return; } catch { /* denied/offline */ }
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
    // Always show WHO these picks are ranked for — not just a prompt when unset. One line,
    // doubling as the edit control, so the traveller can always see and correct the app's
    // assumption about them from the surface that assumption is shaping.
    header.append(travellingAsLine());

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
    const famsPresent = CATEGORY_FAMILIES.filter((f) => !['stay', 'transport', 'practical', 'other'].includes(f.key))
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
      // Annotate each pick with fit + open status, then DROP known-closed places outright when
      // planning for NOW — a shut restaurant is a dead end, not a suggestion, so it no longer
      // just sinks to the bottom tagged; it is hidden, with a one-line note so nothing feels
      // silently removed. "Closed now" only applies to the NOW plan — a place shut this minute
      // is irrelevant when planning for tonight or tomorrow, and unknown hours are never treated
      // as closed (we only ever act on what the data actually says).
      const nowPlan = todoPlan === 'now';
      pool.forEach((x) => { x._fit = placeFitReason(x.p, prefs); x._closed = nowPlan && openStateNow(x.p) === false; });
      const closedNow = nowPlan ? pool.filter((x) => x._closed).length : 0;
      if (nowPlan) pool = pool.filter((x) => !x._closed);
      // Good fits lead; poor fits sink (but stay, tagged) — then score.
      const fitKey = (x) => (x._fit ? 1 : 0);
      pool.sort((a, b) => fitKey(a) - fitKey(b) || b.s - a.s);
      let rendered = 0;
      TIERS.forEach((t) => {
        const items = pool.filter((x) => tierOf(x) === t.key);
        if (items.length) { renderTier(t.label, items); rendered += items.length; }
      });
      if (closedNow) {
        listBody.append(h('p', { class: 'muted small', style: 'margin:8px 0 0' },
          `${closedNow} more ${closedNow === 1 ? 'is' : 'are'} closed right now, so ${closedNow === 1 ? "it's" : "they're"} hidden — see “Plan for a different time” above.`));
      }
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
// Local calendar date as YYYY-MM-DD via the local Y/M/D getters — NEVER via toISOString(),
// which always serialises in UTC. This app's own supported countries (Thailand, Vietnam,
// Cambodia, Laos) all sit at UTC+7, so a UTC-based "today" silently returns YESTERDAY's
// date for roughly the first 7 hours of every local day — and the same mistake inside
// addDaysISO cancelled out its own +1-day advance for exactly that reason, so a plan due
// tomorrow could never show "Tomorrow" (see nextPlanItem's caller in js/screens/home.js).
// Confirmed via the full-site audit; every call site of todayISO()/addDaysISO() reads
// through these two functions, so fixing them here fixes every caller with no other
// changes needed. Mirrors the already-correct local-date pattern this codebase already
// uses in js/screens/calendar.js's own calYmd().
function localYMD(d) { return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; }
export function todayISO() { try { return localYMD(new Date()); } catch { return '2026-01-01'; } }
export function addDaysISO(iso, n) {
  try { const d = new Date(iso + 'T00:00:00'); d.setDate(d.getDate() + n); return localYMD(d); }
  catch { return iso; }
}
export function evShort(d) {
  try { return new Date(d + 'T00:00:00').toLocaleDateString(dateLocale(), { day: 'numeric', month: 'short' }); }
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
// Exported: besides eventCard/festival screens below, js/screens/calendar.js's own
// calendarScreen reverse-imports this for its event day-cards' "Add to my plans" button.
export function addEventToCalendar(e, btn) {
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
  // "Festivals" alone — matches the "🎉 N festivals" link that points here, and fits on one
  // line; the full "Festivals & events" phrase 3-line-wrapped on mobile.
  wrap.append(topbar('Festivals', getCountry(eventsCountry) ? `#country-${eventsCountry}` : '#home'));
  wrap.append(screenHint('Major festivals and public holidays with 2026 dates. Movable (lunar) dates shift each year — confirm locally. Tap “Add to plan” to place one on your calendar.'));

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

// ---- ANIMAL SOUNDS (bundled offline; falls back to iNaturalist online) -----
// Every species with `call: true` has a self-hosted recording in the SOUNDS registry
// (js/data/sounds.js) — sourced from Xeno-canto (birds) or iNaturalist (everything else),
// Creative-Commons licensed, credited in-app. Bundled calls play instantly offline. A
// species added to nature.js with `call: true` before a recording is sourced for it
// falls back to a live iNaturalist lookup by scientific name (needs a connection); if
// neither has a recording we say so in-app rather than navigating away. A species may
// optionally carry sound:{ xcQuery } to override the sciName-derived live-lookup query.
//
// A species is listed in the sounds tool only when it carries `call: true` — i.e. it
// makes a distinctive sound worth identifying by ear (birds, frogs, cicadas, gibbons,
// geckos…). Silent species (turtles, snakes, monitors, butterflies, beetles) are
// deliberately excluded so the list never offers something that cannot play.
function hasCall(s) { return !!(s && s.call === true); }
function xcQuery(s) { return (s && s.sound && s.sound.xcQuery) || (s && s.sciName) || (s && s.commonName) || ''; }
function inatSoundUrl(s) {
  return `https://api.inaturalist.org/v1/observations?taxon_name=${encodeURIComponent(xcQuery(s))}`
    + '&sounds=true&order_by=votes&per_page=12&license=cc-by,cc-by-nc,cc-by-sa,cc-by-nc-sa,cc0';
}
let callAudio = null;   // one shared element so starting a call stops the previous one
async function playCall(s, btn, statusEl) {
  const bundled = s && s.id && SOUNDS[s.id];
  const original = btn.textContent;
  if (bundled) {
    btn.disabled = true; btn.textContent = 'Loading call…'; statusEl.textContent = '';
    try {
      if (callAudio) { try { callAudio.pause(); } catch { /* ignore */ } }
      callAudio = new Audio(bundled.src);
      callAudio.addEventListener('error', () => { statusEl.textContent = 'Could not play the recording here.'; });
      await callAudio.play();
      statusEl.textContent = `♪ ${s.commonName} — ${bundled.credit}`;
    } catch (e) {
      statusEl.textContent = 'Could not play the recording here.';
    } finally {
      btn.disabled = false; btn.textContent = original;
    }
    return;
  }
  if (typeof navigator !== 'undefined' && navigator.onLine === false) { statusEl.textContent = 'Connect to the internet to hear calls.'; return; }
  btn.disabled = true; btn.textContent = 'Loading call…'; statusEl.textContent = '';
  try {
    const res = await fetch(inatSoundUrl(s));
    const d = await res.json();
    let snd = null;
    for (const r of (d.results || [])) { const a = (r.sounds || []).find((x) => x && x.file_url); if (a) { snd = a; break; } }
    if (!snd) throw new Error('no recording');
    if (callAudio) { try { callAudio.pause(); } catch { /* ignore */ } }
    callAudio = new Audio(snd.file_url);
    callAudio.addEventListener('error', () => { statusEl.textContent = 'Could not play the recording here — check your connection and try again.'; });
    await callAudio.play();
    const credit = (snd.attribution || '').replace(/^\(c\)\s*/, '').replace(/,\s*some rights reserved.*$/i, '') || 'an iNaturalist contributor';
    statusEl.textContent = `♪ ${s.commonName} — ${credit} · via iNaturalist (CC)`;
  } catch (e) {
    statusEl.textContent = 'No recording is available for this one yet.';
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
  wrap.append(screenHint('Heard something? Tap ▶ to play the call — works offline once loaded — or tap a name for the full field guide. Only animals with a distinctive call are listed. Recordings are Creative Commons, from Xeno-canto and iNaturalist.'));

  let group = '';
  let query = '';

  const search = h('input', { class: 'search', type: 'search', 'aria-label': 'Search sounds', placeholder: 'Search by name…',
    oninput: debounce((e) => { query = e.target.value; renderList(); }, 120) });
  wrap.append(search);

  // Chips live in their own wrapper, rebuilt by renderChips() rather than computed once,
  // so the group counts pick up nature.js once it lands (see loadNature() near the top of
  // this file) instead of freezing at the empty pre-load default.
  const chipsWrap = h('div', {});
  wrap.append(chipsWrap);
  const listEl = h('div', {});
  wrap.append(listEl);

  function renderChips() {
    // Every callable species, recomputed each call so the group chips show live counts.
    const callable = allSpecies().filter(hasCall);
    const GROUPS = [
      { id: '', label: 'All', emoji: '✶' },
      { id: 'bird', label: 'Birds', emoji: '🐦' },
      { id: 'mammal', label: 'Mammals', emoji: '🐘' },
      { id: 'insect', label: 'Insects', emoji: '🦗' },
      { id: 'reptile', label: 'Frogs & geckos', emoji: '🐸' },
    ].map((g) => ({ ...g, n: g.id ? callable.filter((s) => s.group === g.id).length : callable.length }))
      .filter((g) => g.n > 0);
    chipsWrap.innerHTML = '';
    const chips = h('div', { class: 'chips' }, GROUPS.map((g) =>
      h('button', { class: 'chip', 'aria-pressed': group === g.id ? 'true' : 'false', dataset: { g: g.id },
        onclick: () => { group = g.id; chips.querySelectorAll('.chip').forEach((c) => c.setAttribute('aria-pressed', c.dataset.g === group ? 'true' : 'false')); renderList(); } },
        `${g.emoji} ${g.label} (${g.n})`)));
    chipsWrap.append(chips);
  }
  function renderList() {
    listEl.innerHTML = '';
    if (!isNatureLoaded()) { listEl.append(h('p', { class: 'empty' }, 'Loading the sounds library…')); return; }
    const results = allSpecies({ group: group || undefined, q: query.trim() || undefined }).filter(hasCall);
    if (!results.length) { listEl.append(h('p', { class: 'empty' }, query.trim() ? 'No calls match your search.' : 'No calls in this group yet.')); return; }
    results.forEach((s) => {
      const status = h('div', { class: 'muted', style: 'font-size:13px' });
      const play = h('button', { class: 'btn ghost', 'aria-label': `Play ${s.commonName} call`, onclick: (e) => { e.stopPropagation(); playCall(s, play, status); } }, '▶');
      listEl.append(h('div', { class: 'card', style: 'display:flex;align-items:center;gap:10px' }, [
        recogThumb(s, s.emoji || '🔎'),
        h('button', { class: 'grow', style: 'background:none;border:none;text-align:left;cursor:pointer;font:inherit;color:inherit', onclick: () => go(`#species-${s.id}`) }, [
          h('div', { class: 'en' }, s.commonName), h('div', { class: 'sci' }, s.sciName || ''), status,
        ]),
        play,
      ]));
    });
  }
  renderChips();
  renderList();
  if (!isNatureLoaded()) { loadNature().then(() => { renderChips(); renderList(); }, () => { renderChips(); renderList(); }); }
  mount(wrap, '#home');
}

function natureScreen() {
  const wrap = h('div', { class: 'screen' });
  wrap.append(topbar('Identify nature', '#home'));
  wrap.append(screenHint('Browse or search the region’s wildlife and plants. Tap a species for field marks and a photo search.'));

  const search = h('input', { class: 'search', type: 'search', 'aria-label': 'Search', placeholder: 'Search by name…', value: natureQuery,
    oninput: debounce((e) => { natureQuery = e.target.value; renderList(); }, 120) });
  wrap.append(search);

  // Group chips live in their own wrapper, rebuilt by renderChips() rather than computed
  // once, so they pick up NATURE_GROUPS once nature.js lands (see loadNature() near the
  // top of this file) instead of freezing at the empty pre-load default (just "All").
  const chipsWrap = h('div', {});
  wrap.append(chipsWrap);
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
  function renderChips() {
    const groups = [{ id: '', label: 'All', emoji: '✶' }].concat(NATURE_GROUPS);
    chipsWrap.innerHTML = '';
    const groupChips = h('div', { class: 'chips' }, groups.map((g) =>
      h('button', { class: 'chip', 'aria-pressed': natureGroup === g.id ? 'true' : 'false', dataset: { g: g.id },
        onclick: () => { natureGroup = g.id; groupChips.querySelectorAll('.chip').forEach((c) => c.setAttribute('aria-pressed', c.dataset.g === g.id ? 'true' : 'false')); renderList(); } },
        `${g.emoji} ${g.label}`)));
    chipsWrap.append(groupChips);
  }
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
  renderChips();
  renderList();
  if (!isNatureLoaded()) { loadNature().then(() => { renderChips(); renderList(); }, () => { renderChips(); renderList(); }); }
  mount(wrap, '#home');
}

function speciesCard(s) {
  const g = NATURE_GROUPS.find((x) => x.id === s.group);
  const main = h('button', { class: 'id-cardmain', onclick: () => go(`#species-${s.id}`) }, [
    recogThumb(s, s.emoji || (g && g.emoji) || '🔎'),
    h('span', { class: 'grow' }, [h('div', { class: 'en' }, s.commonName), h('div', { class: 'sci' }, s.sciName || '')]),
    s.dangerous ? h('span', { class: 'tier high' }, 'Caution') : null,
  ]);
  return h('div', { class: 'card species-card id-cardrow' }, [main, idPinStar('species', s.id)]);
}

function speciesScreen(id) {
  // A direct deep link (a pinned item, a shared hash) can reach this screen before the
  // traveller has ever opened Identify/Sounds/Dangerous this session — getSpecies(id)
  // would otherwise return null exactly as it would for a genuinely unknown id, wrongly
  // reporting "Not found." while nature.js is still loading. Distinguish the two and
  // redraw (via the router, safe even if the traveller has since navigated elsewhere)
  // once the module resolves — see loadNature() near the top of this file.
  if (!isNatureLoaded()) {
    loadNature().then(render, render);
    const wrap = h('div', { class: 'screen' });
    wrap.append(topbar('Species', '#nature'));
    wrap.append(h('p', { class: 'empty' }, 'Loading the wildlife guide…'));
    mount(wrap, '#home');
    return;
  }
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
  wrap.append(idPinButton('species', s.id));
  wrap.append(h('a', { class: 'btn block', href: imageSearch(`${s.commonName} ${s.sciName || ''}`), target: '_blank', rel: 'noopener' }, 'Search photos to confirm ↗'));
  mount(wrap, '#home');
}

// The traveller's own collection of identified things — reached from the YOU hub, built
// the same way the personal phrasebook gathers pinned phrases. Groups pins by type,
// preserves each type's pin order, and offers one-tap removal + links back to the tools.
function idSavedSub(type, o) {
  if (type === 'species') return o.sciName || '';
  if (type === 'dish') return o.countryName || '';
  return o.season || (o.names && o.names.th) || '';
}
let idViewMode = 'type';   // 'type' (auto groups) | 'tag' (the user's own categories)
let idEditKey = null;      // "type:id" of the saved row whose edit panel is open, or null

// One saved row: reopen (tap the name), reorder within its group (↑/↓), edit (✎ →
// tags + note), and remove (✕). `groupKeys` is the ordered list of keys shown in this
// group, so the move buttons know the row's position and where the swap lands.
function idSavedRow(type, spec, o, groupKeys) {
  const key = idPinKey(type, o.id);
  const meta = idMetaGet(key);
  const sub = idSavedSub(type, o);
  const gi = groupKeys.indexOf(key);
  const editing = idEditKey === key;

  const main = h('button', { class: 'id-saved-main', onclick: () => go(spec.hash(o.id)) }, [
    h('span', { class: 'id-saved-emoji' }, o.emoji || spec.emoji),
    h('span', { class: 'id-saved-txt' }, [
      h('span', { class: 'id-saved-name' }, spec.name(o)),
      sub ? h('span', { class: 'id-saved-sub' }, sub) : null,
      meta.tags.length ? h('span', { class: 'id-saved-tags' }, meta.tags.map((t) => h('span', { class: 'id-tag' }, t))) : null,
      meta.note ? h('span', { class: 'id-saved-note' }, `📝 ${meta.note}`) : null,
    ]),
  ]);
  const ctrls = h('div', { class: 'id-row-ctrls' }, [
    h('button', { class: 'chip id-move', 'aria-label': `Move ${spec.name(o)} up`, disabled: gi <= 0 ? '' : null,
      onclick: () => { idMovePin(key, -1, groupKeys); render(); } }, '↑'),
    h('button', { class: 'chip id-move', 'aria-label': `Move ${spec.name(o)} down`, disabled: gi >= groupKeys.length - 1 ? '' : null,
      onclick: () => { idMovePin(key, 1, groupKeys); render(); } }, '↓'),
    h('button', { class: 'chip id-editbtn' + (editing ? ' on' : ''), 'aria-pressed': editing ? 'true' : 'false', 'aria-label': `Edit ${spec.name(o)}`,
      onclick: () => { idEditKey = editing ? null : key; render(); } }, '✎'),
    h('button', { class: 'chip id-remove', 'aria-label': `Remove ${spec.name(o)}`,
      onclick: () => { if (idEditKey === key) idEditKey = null; toggleIdPin(type, o.id); render(); } }, '✕'),
  ]);
  const rowTop = h('div', { class: 'id-saved-row' }, [main, ctrls]);
  if (!editing) return rowTop;

  const tagChips = meta.tags.map((t) =>
    h('button', { class: 'id-tag removable', 'aria-label': `Remove tag ${t}`, onclick: () => { idRemoveTag(key, t); render(); } }, [t, h('span', { class: 'x' }, '✕')]));
  const tagInput = h('input', { class: 'id-tag-input', type: 'text', list: 'id-tags-datalist', placeholder: 'Add a category / tag…', maxlength: '24',
    onkeydown: (e) => { if (e.key === 'Enter') { e.preventDefault(); if (idAddTag(key, e.target.value)) render(); } } });
  const addBtn = h('button', { class: 'btn ghost id-tag-addbtn', onclick: () => { if (idAddTag(key, tagInput.value)) render(); } }, 'Add');
  const noteInput = h('input', { class: 'id-note-input', type: 'text', value: meta.note, placeholder: 'Add a note (e.g. tried in Pai, loved it)…', maxlength: '160',
    onchange: (e) => { idSetNote(key, e.target.value); } });
  const panel = h('div', { class: 'id-edit-panel' }, [
    h('div', { class: 'id-edit-label' }, 'Categories / tags'),
    tagChips.length ? h('div', { class: 'id-edit-tags' }, tagChips) : h('div', { class: 'muted', style: 'font-size:13px;margin:2px 0' }, 'No tags yet — add one to file this into a category.'),
    h('div', { class: 'id-tag-add' }, [tagInput, addBtn]),
    h('div', { class: 'id-edit-label' }, 'Note'),
    noteInput,
  ]);
  return h('div', { class: 'id-saved-block' }, [rowTop, panel]);
}

function myIdentifierScreen() {
  const wrap = h('div', { class: 'screen' });
  wrap.append(topbar('My identifier', '#me'));
  const list = idPinList();
  const exploreTiles = [
    { ic: ICON.bowl, t: 'Food', d: 'Street dishes', hash: '#food' },
    { ic: ICON.fruit, t: 'Produce', d: 'Fruit, veg & herbs', hash: '#produce' },
    { ic: ICON.leaf, t: 'Nature', d: 'Birds, fish, plants', hash: '#nature' },
    { ic: ICON.volume, t: 'Sounds', d: 'Animal calls', hash: '#sounds' },
    { ic: ICON.alert, t: 'Dangerous', d: 'Know the risks', hash: '#danger' },
  ];
  if (!list.length) {
    wrap.append(h('div', { class: 'card' }, [
      h('strong', {}, '🔎 Your personal identifier'),
      h('p', { class: 'muted', style: 'margin:6px 0 10px' },
        'Save any dish, fruit, or animal you identify and it collects here — offline, on your device. Tap ☆ on any item in the identify tools, or ★ Save on its page. Nothing saved yet — start with a tool below.'),
      h('div', { class: 'grid' }, exploreTiles.map(sectionTile)),
    ]));
    mount(wrap, '#me');
    return;
  }
  wrap.append(screenHint(
    'Everything you saved from the identify tools, kept on your device. Tap to reopen; use ✎ to file items into your own categories and add notes, and ↑ ↓ to reorder.'));

  // Datalist of the categories already in use, so adding a tag can reuse them.
  wrap.append(h('datalist', { id: 'id-tags-datalist' }, idAllTags().map((t) => h('option', { value: t }))));

  const modes = [{ id: 'type', label: 'By type' }, { id: 'tag', label: 'By category' }];
  wrap.append(h('div', { class: 'chips id-viewtoggle' }, modes.map((m) =>
    h('button', { class: 'chip', 'aria-pressed': idViewMode === m.id ? 'true' : 'false',
      onclick: () => { if (idViewMode !== m.id) { idViewMode = m.id; idEditKey = null; render(); } } }, m.label))));

  if (idViewMode === 'type') {
    Object.keys(ID_TYPES).forEach((type) => {
      const spec = ID_TYPES[type];
      const items = list
        .filter((k) => k.slice(0, type.length + 1) === type + ':')
        .map((k) => spec.get(k.slice(type.length + 1)))
        .filter(Boolean);
      if (!items.length) return;
      const groupKeys = items.map((o) => idPinKey(type, o.id));
      const card = h('div', { class: 'card', style: 'margin-bottom:10px' }, [
        h('h3', { style: 'margin-top:0' }, `${spec.emoji} ${spec.label} · ${items.length}`),
      ]);
      items.forEach((o) => card.append(idSavedRow(type, spec, o, groupKeys)));
      wrap.append(card);
    });
  } else {
    const cats = idAllTags();
    if (!cats.length) {
      wrap.append(h('div', { class: 'card' }, [
        h('p', { class: 'muted', style: 'margin:0' }, 'No categories yet. Switch to “By type”, tap ✎ on any item, and add a tag — your categories appear here.'),
      ]));
    }
    const resolve = (k) => { const type = k.slice(0, k.indexOf(':')); const spec = ID_TYPES[type]; const o = spec && spec.get(k.slice(type.length + 1)); return o ? { type, spec, o, key: k } : null; };
    const groups = cats.map((tag) => ({ tag, keys: list.filter((k) => idMetaGet(k).tags.some((t) => t.toLowerCase() === tag.toLowerCase())) }));
    const untagged = list.filter((k) => !idMetaGet(k).tags.length);
    if (untagged.length) groups.push({ tag: null, keys: untagged });
    groups.forEach(({ tag, keys }) => {
      const resolved = keys.map(resolve).filter(Boolean);
      if (!resolved.length) return;
      const groupKeys = resolved.map((r) => r.key);
      const header = tag ? `🏷 ${tag} · ${resolved.length}` : `• Untagged · ${resolved.length}`;
      const card = h('div', { class: 'card', style: 'margin-bottom:10px' }, [h('h3', { style: 'margin-top:0' }, header)]);
      resolved.forEach((r) => card.append(idSavedRow(r.type, r.spec, r.o, groupKeys)));
      wrap.append(card);
    });
  }

  wrap.append(h('h2', { class: 'home-section' }, 'Identify more'));
  wrap.append(h('div', { class: 'grid' }, exploreTiles.map(sectionTile)));
  mount(wrap, '#me');
}

// ---- BEST OF / RECOMMENDATIONS ----------------------------------------------
const FORWHO_EMOJI = { families: '👨‍👩‍👧', couples: '💑', everyone: '⭐', budget: '🪙', foodies: '🍜', adventure: '🧗', nightlife: '🍸', firsttimers: '🧭' };
function bestofScreen(countryId) {
  if (countryId) setActiveCountry(countryId);
  const wrap = h('div', { class: 'screen' });
  wrap.append(topbar('Best of', '#home'));
  wrap.append(countryChips((id) => go(`#bestof-${id}`)));
  const lists = bestForCountry(getActiveCountry());
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
  wrap.append(topbar(l ? l.title : 'List', l ? `#bestof-${l.country}` : '#bestof'));
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
let placePickerOpenFor = null;  // stop id currently showing its "+ Add a place" saved-places picker, or null
// A stop's date line: a single arrival day, or an arrive→leave range with an inclusive day count
// (so "10 days in Chiang Mai" reads as one entry). Tolerates old stops that carry only `date`.
export function stopDateLabel(s) {
  if (!s) return '';
  const from = s.date || '';
  const to = (s.endDate && s.endDate >= from) ? s.endDate : '';
  if (from && to && to !== from) return `${from} → ${to} · ${wxDiffDays(from, to) + 1} days`;
  return from || to || '';
}
function tripScreen() {
  const wrap = h('div', { class: 'screen' });
  const name = (store.profile.name || '').trim();
  wrap.append(topbar(name ? `${name}’s trip` : 'Your trip', '#me'));

  // itinerary
  const itin = h('div', { class: 'card' }, [h('h2', {}, 'Itinerary')]);
  const stops = store.trip.stops;
  // Hoisted above the loop: reused both for the existing "quick-add a stop" chips further down
  // and for each stop's own "+ Add a place" picker (S4 — place-linked trip stops) below.
  const saved = store.favorites.map(resolveItem).filter(Boolean);
  if (!stops.length) itin.append(h('p', { class: 'muted' }, 'Add the places or cities you plan to visit, in order.'));
  stops.forEach((s, i) => {
    // Inline editor when this stop is open for correction — fix a typo'd name or a wrong date.
    if (editStopId === s.id) {
      const t = h('input', { 'aria-label': 'Stop name', type: 'text', value: s.title });
      const dt = h('input', { 'aria-label': 'Arrive date', type: 'date', value: s.date || '' });
      const dt2 = h('input', { 'aria-label': 'Leave date', type: 'date', value: s.endDate || '' });
      itin.append(h('div', { class: 'trip-stop', style: 'display:block' }, [
        h('div', { class: 'field' }, [h('label', {}, `Edit stop ${i + 1}`), t,
          h('div', { class: 'trip-dates' }, [
            h('label', { class: 'trip-date-lbl' }, ['Arrive', dt]),
            h('label', { class: 'trip-date-lbl' }, ['Leave (optional)', dt2]),
          ])]),
        h('div', { class: 'chips' }, [
          h('button', { class: 'btn', onclick: () => { updateStop(s.id, { title: t.value.trim() || s.title, date: dt.value, endDate: dt2.value }); editStopId = null; go('#trip'); } }, 'Save'),
          h('button', { class: 'btn ghost', onclick: () => { editStopId = null; render(); } }, 'Cancel'),
        ]),
      ]));
      return;
    }
    itin.append(h('div', { class: 'row-between trip-stop' }, [
      h('div', {}, [h('strong', {}, `${i + 1}. ${s.title}`), stopDateLabel(s) ? h('div', { class: 'muted' }, stopDateLabel(s)) : null]),
      h('div', { class: 'cats' }, [
        h('button', { class: 'chip', 'aria-label': 'Edit', onclick: () => { editStopId = s.id; render(); } }, '✎'),
        h('button', { class: 'chip', 'aria-label': 'Move up', disabled: i === 0 ? '' : null, onclick: () => { moveStop(s.id, -1); go('#trip'); } }, '↑'),
        h('button', { class: 'chip', 'aria-label': 'Move down', disabled: i === stops.length - 1 ? '' : null, onclick: () => { moveStop(s.id, 1); go('#trip'); } }, '↓'),
        h('button', { class: 'chip', 'aria-label': 'Remove', onclick: () => { confirmAction({ title: 'Remove this stop?', confirmLabel: 'Remove', danger: true }).then((ok) => { if (ok) { removeStop(s.id); go('#trip'); } }); } }, '✕'),
      ]),
    ]));
    // S4 — places tagged to this leg (a stop and a place are not 1:1, so this is its own list;
    // see addPlaceVisit in state.js). Tagged from placeScreen / Explore / Places cards.
    const visits = visitsForStop(s.id).map((v) => ({ visit: v, place: resolveItem(v.placeId) })).filter((x) => x.place);
    if (visits.length) {
      itin.append(h('p', { class: 'muted', style: 'margin:6px 0 2px 22px;font-size:12px' }, 'Things to see here:'));
      itin.append(h('div', { class: 'trip-visits' }, visits.map(({ visit, place }) => h('div', { class: 'row-between trip-visit' }, [
        h('button', { class: 'linklike', onclick: () => go(`#place-${place.id}`) }, `📍 ${place.name}`),
        h('button', { class: 'chip', 'aria-label': `Remove ${place.name} from this stop`, onclick: () => { removePlaceVisit(visit.id); go('#trip'); } }, '✕'),
      ]))));
    }
    if (placePickerOpenFor === s.id) {
      const pickable = saved.filter((sp) => !visits.some((x) => x.place.id === sp.id));
      itin.append(h('div', { class: 'trip-visit' }, pickable.length
        ? h('div', { class: 'chips' }, pickable.map((sp) => h('button', {
            class: 'chip', onclick: () => { addPlaceVisit({ placeId: sp.id, stopId: s.id }); placePickerOpenFor = null; go('#trip'); },
          }, sp.name)))
        : h('p', { class: 'muted', style: 'font-size:12px;margin:2px 0' }, 'Nothing saved yet — save places from Explore or Places, then add them here.')));
    } else {
      itin.append(h('button', { class: 'chip', style: 'margin:4px 0 4px 22px', onclick: () => { placePickerOpenFor = s.id; render(); } }, '+ Add a place'));
    }
  });
  // S4 — places added from Explore/a place page before this trip has a matching leg yet
  // (or left unscheduled on purpose). Nothing is ever blocked on a leg existing first.
  const unscheduled = unscheduledVisits().map((v) => ({ visit: v, place: resolveItem(v.placeId) })).filter((x) => x.place);
  if (unscheduled.length) {
    itin.append(h('div', { class: 'trip-stop' }, [
      h('strong', {}, '📍 Not scheduled yet'),
      h('div', { class: 'trip-visits' }, unscheduled.map(({ visit, place }) => h('div', { class: 'row-between trip-visit' }, [
        h('button', { class: 'linklike', onclick: () => go(`#place-${place.id}`) }, place.name),
        h('div', { class: 'chips' }, [
          stops.length ? h('button', { class: 'chip', onclick: () => tripVisitSheet(place.id) }, '→ Assign') : null,
          h('button', { class: 'chip', 'aria-label': `Remove ${place.name}`, onclick: () => { removePlaceVisit(visit.id); go('#trip'); } }, '✕'),
        ]),
      ]))),
    ]));
  }
  const stopName = h('input', { 'aria-label': 'Stop name', type: 'text', placeholder: 'Place or city' });
  const stopDate = h('input', { 'aria-label': 'Arrive date', type: 'date' });
  const stopEnd = h('input', { 'aria-label': 'Leave date', type: 'date' });
  itin.append(h('div', { class: 'field', style: 'margin-top:10px' }, [h('label', {}, 'Add a stop'), stopName,
    h('div', { class: 'trip-dates' }, [
      h('label', { class: 'trip-date-lbl' }, ['Arrive', stopDate]),
      h('label', { class: 'trip-date-lbl' }, ['Leave (optional)', stopEnd]),
    ]),
    h('p', { class: 'muted', style: 'font-size:12px;margin:6px 0 0' }, 'Set arrive and leave to cover several days in one stop — e.g. ten days in Chiang Mai, without adding each day.'),
    h('button', { class: 'btn', style: 'margin-top:8px', onclick: () => { if (stopName.value.trim()) { addStop({ title: stopName.value.trim(), country: getActiveCountry(), date: stopDate.value, endDate: stopEnd.value }); go('#trip'); } } }, 'Add stop')]));
  // quick add from saved (`saved` is hoisted above the stops loop — see comment there)
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
      shareButton('📤 Share my trip', 'My Mekong trip', () => shareUrl('in', encodeShare('trip', { stops: store.trip.stops.map((s) => ({ t: s.title, c: s.country, d: s.date, e: s.endDate })), notes: store.trip.notes || '' }, ensureMe()))),
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
  wrap.append(bud);
  // Same "Log an expense" card as Budget & Expenses (#expenses) — that screen is the master;
  // this used to be its own, slightly different inline form (no date, no smart title chips).
  const c = getCountry(getActiveCountry());
  wrap.append(expenseAddCard({ currency: c ? c.currency : 'THB', afterAdd: () => go('#trip') }));
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
  const c = getCountry(getActiveCountry());
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
    out.append(h('button', { class: 'btn ghost', onclick: () => go(`#prices-${getActiveCountry()}`) }, 'Check fair prices'));
  }
  price.addEventListener('input', debounce(recompute, 120));
  cur.addEventListener('change', recompute); ctx.addEventListener('change', recompute);
  wrap.append(h('div', { class: 'card' }, [field('Asking price', price), field('Currency', cur), field('What are you buying?', ctx)]));
  wrap.append(out);
  recompute();

  // Where to buy the everyday essentials cheapest, anchored to where the traveller is.
  const fc = focusSpot().spot.country || getActiveCountry();
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
      it.esim ? h('div', { class: 'tiny muted', style: 'margin-top:3px' }, it.esim) : null,
    ])));
    const slug = citySlug(focusSpot().spot.city || '');
    if (getBoard(fc, slug)) card.append(h('button', { class: 'btn ghost block', style: 'margin-top:8px', onclick: () => go(`#board-${fc}-${slug}`) }, '📍 Local finds & markets near you'));
    card.append(h('button', { class: 'btn ghost block', style: 'margin-top:6px', onclick: () => go(`#prices-${fc}`) }, 'See fair prices'));
    wrap.append(card);
  }
  mount(wrap, '#home');
}

// Budget & Expenses — extracted to js/screens/budget.js (module split; see
// js/screens/budget.js's own header comment for the extraction rationale).
import {
  expensesScreen, expenseAddCard, budgetLogRow, budgetTarget, tripSpanDays, expCatLookup, expCatOf,
} from './screens/budget.js';

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
  if (countryId) setActiveCountry(countryId);
  const wrap = h('div', { class: 'screen' });
  wrap.append(topbar('Pre-trip checklist', '#home'));
  wrap.append(countryChips((id) => go(`#checklist-${id}`)));
  const items = checklistFor(getActiveCountry());
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
// A handful of useful example searches for the empty state — each reliably hits a real
// index (place names/blurbs, phrases and price labels), so a first-time user learns what
// Search covers by tapping rather than guessing.
const SEARCH_EXAMPLES = ['Market', 'Temple', 'Waterfall', 'Beach', 'Coffee', 'Massage', 'Hello', 'Thank you'];
// Remember a committed search term (the user acted on a result). Most-recent first,
// de-duplicated case-insensitively, capped at five. Self-defaulting pref, no store bump.
function rememberSearch(q) {
  q = (q || '').trim();
  if (q.length < 2) return;
  const prefs = store.profile.prefs;
  const list = Array.isArray(prefs.recentSearches) ? prefs.recentSearches : [];
  const next = [q, ...list.filter((s) => s.toLowerCase() !== q.toLowerCase())].slice(0, 5);
  prefs.recentSearches = next;
  save();
}

function searchScreen() {
  const wrap = h('div', { class: 'screen' });
  wrap.append(topbar('Search everything', '#home'));
  const input = h('input', { class: 'search', type: 'search', 'aria-label': 'Search', autofocus: '', value: searchQuery,
    placeholder: 'Find places, phrases, wildlife, prices…',
    oninput: debounce((e) => { searchQuery = e.target.value; renderResults(); }, 150) });
  wrap.append(input);
  // Set the query from a tapped chip (recent or example) and refresh, keeping the box in sync.
  const setQuery = (q) => { searchQuery = q; input.value = q; renderResults(); input.focus(); };

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
  const link = (label, hash, extra) => h('button', { class: 'btn ghost block srch', onclick: () => { rememberSearch(searchQuery); if (extra) extra(); go(hash); } }, label);

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
      // Place hits get a recognition thumbnail (photo when one exists, family emoji otherwise)
      // so a search reads like a guide, not a text index. Other sections stay as text links.
      const placeRow = (p) => {
        const dist = (fix && p.coords) ? ` · ${fmtDistance(haversineKm(fix, p.coords))}` : '';
        return h('button', { class: 'btn ghost block srch srch-place', onclick: () => { rememberSearch(searchQuery); go(`#place-${p.id}`); } }, [
          recogThumb(p, (FAMILY_META[placeFamily(p)] || FAMILY_META.other).emoji),
          h('span', { class: 'srch-place-text' }, [
            h('span', { class: 'srch-place-name' }, p.name),
            h('span', { class: 'srch-place-sub muted' }, `${p.city || ''}${dist}`),
          ]),
        ]);
      };
      section(title, places.map(placeRow));
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
        .map((c) => link(`${c.flag} ${c.name}`, `#country-${c.id}`, () => { setActiveCountry(c.id); })));
    }
    if (!out.children.length) {
      if (q.length < 2 && cat === 'all') {
        // Zero-state launchpad: recent searches (if any) then example queries, so the
        // screen teaches what Search covers instead of showing a bare instruction line.
        const prefs = store.profile.prefs;
        const recent = (Array.isArray(prefs.recentSearches) ? prefs.recentSearches : []).filter((s) => s && s.trim());
        if (recent.length) {
          out.append(h('h2', { class: 'cat-title' }, 'Recent'));
          out.append(h('div', { class: 'chips search-launch' }, [
            ...recent.map((s) => h('button', { class: 'chip', onclick: () => setQuery(s) }, `🕘 ${s}`)),
            h('button', { class: 'chip ghost', 'aria-label': 'Clear recent searches',
              onclick: () => { prefs.recentSearches = []; save(); renderResults(); } }, 'Clear'),
          ]));
        }
        out.append(h('h2', { class: 'cat-title' }, 'Try searching for'));
        out.append(h('div', { class: 'chips search-launch' },
          SEARCH_EXAMPLES.map((s) => h('button', { class: 'chip', onclick: () => setQuery(s) }, s))));
        out.append(h('p', { class: 'muted tiny', style: 'margin:8px 2px 0' }, 'Or type any word — places, phrases, wildlife and prices are all searchable. Pick a category above to browse the nearest places to you.'));
      } else {
        out.append(h('p', { class: 'muted' }, 'Nothing found. Try another word or category.'));
      }
    }
  }
  renderResults();
  // Wildlife results depend on nature.js — kick off its load as soon as Search opens
  // (see loadNature() near the top of this file) rather than waiting for a keystroke, and
  // refresh just the results (never the input above, so an in-progress query is never
  // interrupted) once it resolves. Until then, section() already omits an empty "Wildlife
  // & plants" heading entirely — a matching-text query simply surfaces those results a
  // little later rather than showing anything misleading in the meantime.
  if (!isNatureLoaded()) { loadNature().then(renderResults, renderResults); }
  mount(wrap, '#home');
}

// ---- SAFETY, MEDICAL, KOSHER & WORSHIP DATA --------------------------------
// Curated and self-hosted so every card renders fully offline. External links
// (maps, official sites) are enhancements that degrade gracefully with no signal.
// No phone numbers are hard-coded — an out-of-date emergency number is dangerous,
// so the national number (below) and the maps link (which resolves the exact
// venue live) are the source of truth. City-centre coordinates drive "nearest
// first"; they are for ordering and a map query, not a claim of a precise door.
export function mapsSearch(q) { return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`; }
function nearestFirst(list, fix) {
  if (!fix || fix.lat == null) return list.slice();
  return list.slice().sort((a, b) => haversineKm(fix, { lat: a.lat, lng: a.lng }) - haversineKm(fix, { lat: b.lat, lng: b.lng }));
}
export function kmLabel(km) { return km == null ? '' : (km < 1 ? '<1 km' : `${Math.round(km)} km`); }

// The hospital dataset moved to js/data/medical.js when the nineteen-entry big-city list
// grew into region-wide coverage plus the province-level fallback that answers "how do I
// reach a hospital" from a village this app has never heard of. HOSPITALS/HOSP_TAG are
// imported at the top of this file; the full flow lives in js/screens/medical.js.

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
  { t: '🐕 Animal bite or scratch (rabies risk)', do: [
      'Wash the wound at once with soap and running water for at least 15 minutes — thorough washing alone removes much of the virus and is the single most important step. If there is no soap, flush with plenty of water.',
      'After washing, apply an antiseptic such as povidone-iodine or 70% alcohol if you have it, and cover the wound loosely.',
      'Get to a clinic or hospital the same day for rabies post-exposure vaccination — do not wait for symptoms. Dog, cat, monkey and bat bites or scratches across this region can carry rabies, which is almost always fatal once symptoms begin but is nearly always preventable when treatment starts promptly.',
      'Tell the clinic if the skin was broken, if a bat was involved, or if saliva reached your eyes, mouth or an open cut — these also need rabies immunoglobulin, not the vaccine alone.',
      'If you were vaccinated against rabies before the trip, you still need booster doses after a bite — say so at the clinic.',
    ], dont: [
      'Do not scrub hard enough to bruise the tissue, and do not have the wound stitched closed straight away unless a doctor decides it is necessary — leave it open after washing.',
      'Do not wait to “see if the animal was sick”, and do not assume a calm or healthy-looking animal is safe.',
      'Do not dismiss a minor scratch or a lick on broken skin — these can pass on rabies too.',
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
  { org: 'World Health Organization — rabies', url: 'https://www.who.int/news-room/fact-sheets/detail/rabies' },
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
// the traveller is actually in (rather than the last one they browsed). Exported so
// places.js's own embedded-map locate control can resolve+apply a fix the same way.
export function nearestSpotGlobal(fix) {
  let best = null, bestD = Infinity;
  for (const s of WEATHER_SPOTS) {
    const d = haversineKm(fix, { lat: s.lat, lng: s.lng });
    if (d < bestD) { bestD = d; best = s; }
  }
  return best ? { spot: best, km: bestD } : null;
}

// ---- WHERE AM I (place naming, distinct from weather-hub snapping) -----------
// Names the traveller's ACTUAL locality — the nearest listed town within ~15 km, or
// the containing province (authoritative ADM1), refined to a nearby curated town when
// one sits within a few km. Weather deliberately snaps to the nearest hub (nearestSpot);
// naming must NOT, or a traveller in Mae Hong Son is wrongly told they are in Pai (the
// closest listed hub). Memoised per ~100 m cell so per-render calls stay cheap.
let _waiCache = { key: '', val: null };
// Exported so the medical screen can name the traveller's province authoritatively — the
// province is what decides which hospital is actually reachable, not the nearest hub town.
export function whereAmI(fix) {
  if (!fix || fix.lat == null || fix.lng == null) return null;
  const key = fix.lat.toFixed(3) + ',' + fix.lng.toFixed(3);
  if (_waiCache.key === key) return _waiCache.val;
  let best = null, bestKm = Infinity;
  for (const p of allPlaces()) {
    if (!p.coords || typeof p.coords.lat !== 'number' || typeof p.coords.lng !== 'number') continue;
    const km = haversineKm(fix, p.coords);
    if (km != null && km < bestKm) { bestKm = km; best = p; }
  }
  const hub = nearestSpotGlobal(fix);
  let province = null, provCc = null;
  for (const cc of ['th', 'vi', 'kh', 'la']) {
    const set = regionSetFor(cc);
    if (!set || !Array.isArray(set.provinces)) continue;
    const pr = set.provinces.find((p) => pointInProvince(p, fix.lng, fix.lat));
    if (pr) { province = pr.name; provCc = cc; break; }
  }
  let val;
  if (best && bestKm <= 6 && best.city) val = { name: best.city, province, country: best.country || provCc, km: bestKm, source: 'town', approx: false };
  else if (hub && hub.km <= 15) val = { name: hub.spot.city, province, country: hub.spot.country, km: hub.km, source: 'hub-town', approx: false };
  else if (province) val = { name: province, province, country: provCc, km: null, source: 'province', approx: false };
  else if (best) val = { name: best.city || best.name, country: best.country, km: bestKm, source: 'place-far', approx: true };
  else val = hub ? { name: hub.spot.city, country: hub.spot.country, km: hub.km, source: 'hub', approx: true } : null;
  _waiCache = { key, val };
  return val;
}

// ---- Location on from the start --------------------------------------------
// Request a live fix as the app opens (the browser permission prompt still gates it)
// and keep it current with watchPosition, so "where you are", near-me and distances
// track the traveller. Denial degrades silently to the manual city picker. The fix
// never leaves the device.
let _geoWatchId = null;
function startLocationWatch() {
  if (typeof navigator === 'undefined' || !navigator.geolocation || _geoWatchId != null) return;
  try {
    _geoWatchId = navigator.geolocation.watchPosition(
      (pos) => {
        const prev = getLastFix();
        const next = { lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy };
        setLastFix(next);
        const moved = !prev || (haversineKm(prev, next) || 0) > 0.4;
        // Bug fix: this used to only cache the coordinate — activeCountry/the remembered
        // focus city never followed a real move, so a traveller who crossed into a new
        // country kept seeing the old one everywhere (dictionary language, places, map)
        // until they happened to hit an explicit "use my location" button that itself
        // re-derived the country. Resolving+applying the nearest spot here means the whole
        // app's notion of "where I am" now actually tracks GPS continuously, in the background.
        if (moved) { const nb = nearestSpotGlobal(next); if (nb) setFocusSpot(nb.spot); }
        // First fix of the session is the one that means "opened here" — see logOpenLocation.
        logOpenLocation();
        const hash = location.hash || '';
        if (moved && (hash === '' || hash === '#' || hash === '#home' || hash === '#nearby' || hash === '#explore' || hash.startsWith('#places'))) render();
      },
      () => { /* denied / unavailable — the manual picker path remains */ },
      { enableHighAccuracy: true, maximumAge: 60000, timeout: 15000 },
    );
  } catch { /* noop */ }
}
// One coarsened pin per place per day, and only when the traveller has switched it on.
// Hangs off the app-open path rather than the location watch: a pin is meant to record
// "I opened the app here", not to trace a route through the day.
let _visitLogged = false;
function logOpenLocation() {
  if (_visitLogged || !visitsEnabled()) return;
  try {
    const fix = getLastFix();
    if (!fix) return;
    _visitLogged = true;
    const wai = whereAmI(fix);
    const cell = recordVisit(fix, (wai && wai.country) || getActiveCountry(), todayISO());
    if (cell) contributeVisit(cell, (wai && wai.country) || getActiveCountry());
  } catch { /* a pin is never worth breaking a launch over */ }
}

function initLocation() {
  if (typeof navigator === 'undefined' || !navigator.geolocation) return;
  const begin = () => { if (!store.profile.prefs.geoAsked) { store.profile.prefs.geoAsked = true; save(); } startLocationWatch(); };
  if (navigator.permissions && navigator.permissions.query) {
    navigator.permissions.query({ name: 'geolocation' })
      .then((st) => { if (st.state !== 'denied') begin(); try { st.onchange = () => { if (st.state === 'granted') startLocationWatch(); }; } catch { /* noop */ } })
      .catch(() => begin());
  } else { begin(); }
}

function sosScreen(cc) {
  const wrap = h('div', { class: 'screen' });
  wrap.append(topbar('Emergency', '#home'));

  // Snap to where the traveller actually is: an explicit chip pick (cc) wins; otherwise
  // infer the country from the last GPS fix. Falls back to the browsed country with no fix.
  const fix = getLastFix();
  const near = fix ? nearestSpotGlobal(fix) : null;
  if (cc) setActiveCountry(cc);
  else if (near) setActiveCountry(near.spot.country);

  const c = getCountry(getActiveCountry());
  if (!c) { wrap.append(h('p', { class: 'empty' }, 'Pick a country first.')); mount(wrap, '#home'); return; }
  if (!cc && near) { const wai = whereAmI(fix); wrap.append(h('p', { class: 'sos-loc' }, `📍 You appear to be near ${(wai && wai.name) || near.spot.city}. Showing ${c.name} — not right? Pick your country:`)); }
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
  // `data-no-mt` exempts these from the optional machine-translation pass (js/i18n.js). The
  // label and the DIGITS share one text node ("Tourist Police: 1155"), so handing that string
  // to a translation service risks it rewriting, regrouping or dropping the number itself —
  // and this is the one screen in the app where a mangled string could get somebody hurt. The
  // bundled dictionary still translates the labels, because those are checked by hand.
  if (em.length) em.forEach((e) => nums.append(h('a', { class: 'btn block sos-num', 'data-no-mt': '', href: `tel:${String(e.number).replace(/\s/g, '')}` }, `${e.label}: ${e.number}`)));
  else nums.append(h('p', { class: 'muted' }, 'Emergency numbers are being added for this country.'));

  // (2) Where to go. The full answer — province-level fallback, evacuation chains, the
  // local word for "hospital", the medical card — is its own screen (js/screens/medical.js),
  // because it outgrew a card the moment it had to work somewhere without a listed hospital.
  // What stays here is the decision a person in trouble makes in three seconds: the three
  // nearest options, and one button to everything else.
  const hosp = h('div', { class: 'card' }, [h('div', { class: 'row-between' }, [
    h('h2', { style: 'margin:0' }, 'Get to a hospital'),
    infoTip('Ordered by straight-line distance from your location. Open the full screen for the rest of the country, what to do where no hospital is listed, how people actually reach one here, and your medical card.'),
  ])]);
  hosp.append(h('button', { class: 'btn block', onclick: () => go(`#hospital-${getActiveCountry()}`) }, '🏥 Get to a hospital — full guide'));
  const hospPhrase = emCat && (emCat.phrases.find((p) => /hospital/i.test(p.en)) || emCat.phrases.find((p) => /doctor/i.test(p.en)));
  if (hospPhrase) hosp.append(h('button', { class: 'btn ghost block', style: 'margin-top:8px', onclick: () => showBigPhrase(hospPhrase, book.locale) }, '🪧 Show “I need a hospital” to a local (works offline)'));
  // Three nearest, from the merged curated + OpenStreetMap layer, so this is the real nearest
  // and not merely the nearest place somebody wrote about. Paints from curated data at once
  // and re-paints when the full country layer lands — see js/data/hospitals.js.
  const hospSlot = h('div', {});
  hosp.append(hospSlot);
  const paintSosHosp = () => {
    const cc = getActiveCountry();
    const list = nearestCare(fix, cc, { hospitalsOnly: true, limit: 3 });
    hospSlot.replaceChildren();
    if (!list.length) return;
    hospSlot.append(h('p', { class: 'muted', style: 'margin:12px 0 4px' }, fix && fix.lat != null ? 'Nearest to you:' : `In ${c.name}:`));
    list.forEach((x) => hospSlot.append(h('div', { class: 'card sos-hosp', style: 'margin:6px 0' }, [
      h('div', { class: 'row-between' }, [h('strong', {}, x.name), x.km != null ? h('span', { class: 'fair' }, kmLabel(x.km)) : null]),
      h('div', { class: 'muted tiny', style: 'margin:2px 0 4px' }, x.city || x.en || ''),
      x.curated ? h('div', { class: 'chips' }, (x.tags || []).map((t) => h('span', { class: 'cat-tag' }, HOSP_TAG[t] || t))) : null,
      h('a', { class: 'btn ghost block', style: 'margin-top:6px', href: mapsSearch(`${x.name} ${x.city || ''}`.trim()), target: '_blank', rel: 'noopener' }, 'Open in maps ↗'),
    ])));
    hospSlot.append(h('button', { class: 'btn ghost block', onclick: () => go(`#hospital-${cc}`) }, `Every hospital in ${c.name} →`));
  };
  paintSosHosp();
  if (!isHospitalsLoaded(getActiveCountry())) {
    const at = location.hash;
    loadHospitals(getActiveCountry()).then(() => { if (location.hash === at) paintSosHosp(); }).catch(() => { /* curated view stands */ });
  }

  // (3) What to do while getting there — bites/stings first aid, then life-saving basics.
  const danger = h('div', { class: 'card allergy-card' }, [h('div', { class: 'row-between' }, [
    h('h2', { style: 'margin:0' }, '🐍 Bites, stings & dangerous wildlife'),
    infoTip('What to do first — then get to a hospital. General first aid, not a substitute for a doctor.'),
  ])]);
  FIRST_AID.forEach((fa) => {
    const dd = h('details', { class: 'filters-collapse' }, [h('summary', {}, fa.t)]);
    const inner = h('div', {});
    inner.append(h('p', { class: 'tiny', style: 'margin:6px 0 0' }, [h('strong', {}, 'Do')]));
    inner.append(h('ul', { class: 'sos-aid' }, fa.do.map((li) => h('li', {}, li))));
    if (fa.dont && fa.dont.length) {
      inner.append(h('p', { class: 'tiny', style: 'margin:6px 0 0' }, [h('strong', {}, 'Do not')]));
      inner.append(h('ul', { class: 'sos-aid dont' }, fa.dont.map((li) => h('li', {}, li))));
    }
    // Read the steps aloud — hands are often busy in a bite/sting emergency.
    { const rd = readAloudBar(() => [`${fa.t}.`, 'Do:', fa.do.join('. ') + '.', (fa.dont && fa.dont.length) ? 'Do not: ' + fa.dont.join('. ') + '.' : ''].filter(Boolean).join(' ')); if (rd) inner.append(rd); }
    dd.append(inner);
    danger.append(dd);
  });
  danger.append(h('button', { class: 'btn block', style: 'margin-top:8px', onclick: () => go('#danger') }, '⚠️ Dangerous animals — photos & how to spot them'));

  // Life-saving essentials: honest guidance on EpiPens and defibrillators (neither is
  // reliably bought on the street here) plus hands-only CPR.
  const life = h('div', { class: 'card' }, [h('div', { class: 'row-between' }, [
    h('h2', { style: 'margin:0' }, '💉 Life-saving essentials'),
    infoTip('Honest guidance on adrenaline auto-injectors and defibrillators — neither is reliably bought on the street in this region — plus hands-only CPR.'),
  ])]);
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
    phraseCard = h('div', { class: 'card' }, [h('div', { class: 'row-between' }, [
      h('h2', { style: 'margin:0' }, `At the hospital: say it in ${book.label}`),
      infoTip('Show or speak these to hospital staff or anyone helping you. Works offline.'),
    ])]);
    const voiceOk = hasVoiceFor(book.locale);
    emCat.phrases.forEach((p) => phraseCard.append(h('div', { class: 'phrase' }, [
      h('div', { class: 'grow' }, [h('div', { class: 'en' }, p.en), h('div', { class: 'native', lang: book.locale }, p.script), h('div', { class: 'roman' }, [h('span', { class: 'lbl' }, 'say:'), p.roman])]),
      h('button', { class: 'speak', disabled: voiceOk ? null : '', 'aria-label': `Speak ${p.en}`, onclick: () => speak(p.script, book.locale) }, '🔊'),
    ])));
  }

  // Preventive / background info — kept below the live emergency flow.
  const safe = SAFETY[getActiveCountry()];
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
  const cSolo = SOLO_SAFETY[getActiveCountry()];
  if (cSolo) {
    sInner.append(h('p', { class: 'tiny', style: 'margin:8px 0 0' }, [h('strong', {}, `In ${c.name}`)]));
    sInner.append(h('ul', { class: 'sos-aid' }, cSolo.map((li) => h('li', {}, li))));
  }
  sInner.append(sourcesNote(SOLO_SOURCES, 'July 2026'));
  sd.append(sInner);
  solo.append(sd);

  // Everything that is an emergency but is not a bite. Road traffic injury is the leading
  // cause of traveller death in this region and had no entry on this screen at all; nor did
  // a stolen passport, an arrest, a spiked drink or a missing companion. Each situation is a
  // closed <details> so thirteen of them cost one card of vertical space, and the screen's
  // first fold stays what it should be: the phone number.
  const sit = h('div', { class: 'card' }, [h('div', { class: 'row-between' }, [
    h('h2', { style: 'margin:0' }, '🚨 If something happens'),
    infoTip('Tap the one that fits. Each opens what to do in the next minute, what to do in the next few hours, and the mistake people reliably make. Works offline.'),
  ])]);
  EMERGENCIES.forEach((e) => {
    const d = h('details', { class: 'filters-collapse' }, [h('summary', {}, `${e.ic} ${e.t}`)]);
    const inner = h('div', {});
    if (e.lead) inner.append(h('p', { class: 'tiny muted', style: 'margin:6px 0 0' }, e.lead));
    inner.append(h('p', { class: 'tiny', style: 'margin:8px 0 0' }, [h('strong', {}, 'Right now')]));
    inner.append(h('ul', { class: 'sos-aid' }, e.now.map((li) => h('li', {}, li))));
    if (e.then && e.then.length) {
      inner.append(h('p', { class: 'tiny', style: 'margin:8px 0 0' }, [h('strong', {}, 'Then')]));
      inner.append(h('ul', { class: 'sos-aid' }, e.then.map((li) => h('li', {}, li))));
    }
    if (e.avoid && e.avoid.length) {
      inner.append(h('p', { class: 'tiny', style: 'margin:8px 0 0' }, [h('strong', {}, 'Do not')]));
      inner.append(h('ul', { class: 'sos-aid dont' }, e.avoid.map((li) => h('li', {}, li))));
    }
    { const rd = readAloudBar(() => [`${e.t}.`, 'Right now:', e.now.join(' '), (e.then || []).length ? 'Then: ' + e.then.join(' ') : '', (e.avoid || []).length ? 'Do not: ' + e.avoid.join(' ') : ''].filter(Boolean).join(' ')); if (rd) inner.append(rd); }
    d.append(inner);
    sit.append(d);
  });

  // Consular help, and the limits of it. Travellers routinely expect the wrong things from
  // an embassy, which wastes exactly the hours in which it could have helped.
  const emb = h('div', { class: 'card' }, [h('div', { class: 'row-between' }, [
    h('h2', { style: 'margin:0' }, '🏛 Your embassy'),
    infoTip('Consular help is free and is the right first call for a lost passport, an arrest, a death or a large-scale emergency. Find yours and save the address now — searching for it during the emergency is the part that goes wrong.'),
  ])]);
  const embD = h('details', { class: 'filters-collapse' }, [h('summary', {}, 'What an embassy can and cannot do')]);
  const embInner = h('div', {});
  embInner.append(h('p', { class: 'tiny', style: 'margin:6px 0 0' }, [h('strong', {}, 'It can')]));
  embInner.append(h('ul', { class: 'sos-aid' }, EMBASSY.can.map((li) => h('li', {}, li))));
  embInner.append(h('p', { class: 'tiny', style: 'margin:8px 0 0' }, [h('strong', {}, 'It cannot')]));
  embInner.append(h('ul', { class: 'sos-aid dont' }, EMBASSY.cannot.map((li) => h('li', {}, li))));
  embInner.append(h('p', { class: 'tiny muted', style: 'margin:8px 0 0' }, EMBASSY.note));
  embD.append(embInner);
  emb.append(embD);
  emb.append(h('a', { class: 'btn ghost block', style: 'margin-top:8px', href: mapsSearch(`embassy consulate ${c.name}`), target: '_blank', rel: 'noopener' }, `🔎 Find your embassy in ${c.name} ↗`));

  // Ordered append — the true order of operations in an emergency.
  wrap.append(nums);
  wrap.append(hosp);
  wrap.append(danger);
  wrap.append(life);
  wrap.append(sit);
  wrap.append(emb);
  if (phraseCard) wrap.append(phraseCard);
  if (safeCard) wrap.append(safeCard);
  wrap.append(solo);
  wrap.append(h('button', { class: 'btn ghost block', style: 'margin-top:8px', onclick: () => go(`#scams-${getActiveCountry()}`) }, '⚠️ Common scams here — and how to avoid them'));

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
  // "Dangerous" matches what every chip/link pointing here already calls this screen
  // (Home/Explore's "⚠️ Dangerous" chip, the "🩹 Health & hazards" and "Sting & marine first
  // aid" buttons elsewhere) — the old title was the only place still saying something else,
  // and at 25 characters it was also the worst of the topbar 3-line-wrap family (4 lines here).
  wrap.append(topbar('Dangerous', '#sos'));
  wrap.append(screenHint('Know what to avoid and what to do. Tap any animal for a photo, how to identify it, and first aid if you are bitten or stung. If in doubt, keep your distance and get to a hospital.'));
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
  // Mosquitoes & dengue — moved to the end of this screen per direct request (was the
  // lead card). It carries its own sources note and disclaimer already, so it reads as a
  // self-contained closing section rather than needing to borrow the wildlife groups'.
  // Not gated on nature.js at all (it needs none of that data), so this safety content
  // renders immediately regardless of whether the wildlife list below it is still loading.
  wrap.append(mosquitoCard());
  // The wildlife-danger list above depends on nature.js — trigger the load (see
  // loadNature() near the top of this file) and redraw via the router once it resolves
  // (safe even if the traveller has since navigated elsewhere) so the "still downloading"
  // message above never lingers once the data actually lands.
  if (!isNatureLoaded()) { loadNature().then(render, render); }
  mount(wrap, '#sos');
}

// Places of worship across faiths — notable landmarks in the main cities, nearest
// first, plus a "find one near me" search for anywhere not listed.
function worshipScreen(cc) {
  const wrap = h('div', { class: 'screen' });
  wrap.append(topbar('Places of worship', '#home'));
  const fix = getLastFix();
  const near = fix ? nearestSpotGlobal(fix) : null;
  if (cc) setActiveCountry(cc);
  else if (near) setActiveCountry(near.spot.country);
  const c = getCountry(getActiveCountry());
  wrap.append(countryChips((id) => go(`#worship-${id}`)));
  wrap.append(screenHint('Notable temples, churches, mosques, synagogues and Hindu temples — tap to open in maps and confirm prayer or service times. Not a full directory; use the search below for anywhere not listed.'));

  wrap.append(h('div', { class: 'card' }, [
    h('h2', { style: 'margin-top:0' }, 'Find a place of worship near me'),
    h('p', { class: 'muted tiny', style: 'margin:2px 0 6px' }, 'Opens a live map search (needs internet).'),
    h('div', { class: 'chips' }, Object.keys(WORSHIP_FAITH).map((f) =>
      h('a', { class: 'chip', href: mapsSearch(`${WORSHIP_SEARCH[f]} near me`), target: '_blank', rel: 'noopener' }, `${WORSHIP_FAITH[f]} ↗`))),
  ]));

  const local = nearestFirst(WORSHIP.filter((w) => !c || w.cc === getActiveCountry()), fix);
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
      h('p', { class: 'muted', style: 'margin:4px 0 8px' }, 'Protects these from an update, reset, or lost phone.'),
      h('div', { class: 'row-between' }, [
        h('button', { class: 'btn', onclick: async () => { await vaultDownload(); renderVault(body); } }, 'Download backup'),
        h('button', { class: 'btn ghost', onclick: () => { store.profile.prefs.vaultBackupDone = true; save(); renderVault(body); } }, 'Dismiss'),
      ]),
    ]));
  }

  const fileInput = h('input', { type: 'file', accept: 'image/*,application/pdf' });
  body.append(h('div', { class: 'card' }, [
    h('h2', {}, 'Add a document'),
    h('p', { class: 'muted' }, 'Photograph your passport, ID, visa, insurance or vaccination records.'),
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
    h('p', { class: 'muted' }, 'For card numbers, PINs or booking references.'),
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
        h('button', { class: 'chip', 'aria-label': `Delete ${d.name || 'document'} from the vault`, onclick: async () => { if (await confirmAction({ title: 'Delete document?', body: `Delete “${d.name}” from the vault?`, confirmLabel: 'Delete', danger: true })) { await vaultDelete(d.id); renderVault(body); } } }, '✕'),
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
    h('p', { class: 'muted' }, 'Protects these from an update, reset, or new device.'),
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
      ? h('p', { class: 'muted' }, 'Set. Keep it somewhere safe and private, apart from your phone.')
      : h('p', { class: 'muted' }, 'Not set — create one so a forgotten passcode can’t lock you out for good.'),
    h('button', { class: 'btn ghost block', onclick: async () => {
      if (hasRec && !(await confirmAction({ title: 'Generate a new recovery code?', body: 'Your current recovery code will stop working immediately.', confirmLabel: 'Replace code', danger: true }))) return;
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
      h('p', { class: 'disclaimer' }, 'No server or email reset. Use your recovery code or restore a backup to get back in — never gone for good.'),
    ]),
  ]));

  body.append(h('div', { class: 'card' }, [
    h('button', { class: 'btn ghost block', onclick: () => { vaultLock(); renderVault(body); } }, '🔒 Lock vault'),
    h('button', { class: 'btn ghost block', style: 'margin-top:8px; color:var(--warn); border-color:var(--warn)',
      onclick: async () => { if (await confirmAction({ title: 'Erase the entire vault?', body: 'This permanently deletes every document in it and cannot be undone. Download a backup first if you want to keep them.', confirmLabel: 'Erase vault', danger: true })) { try { await vaultWipe(); } catch { /* ignore */ } renderVault(body); } } }, 'Erase vault'),
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
      if (!(await confirmAction({ title: 'Restore this vault backup?', body: 'It replaces any vault currently on this device, and you unlock it with the backup’s passcode.', confirmLabel: 'Restore', danger: true }))) return;
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
    h('p', { class: 'disclaimer', style: 'margin-top:0' }, 'You’ll get a one-time recovery code next — save it. The reminder below is just a hint, not your passcode.'),
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
  wrap.append(screenHint('How Mekonging works, what needs internet, and how your data is kept. This page works offline.'));
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
  wrap.append(faq('Can I travel my way — with kids, a tent, or for a long stay?', 'On the Places screen you can filter by interests, price, “Good for kids”, stay type (from a tent to a resort) and short- or long-stay. On the map, local (non-tourist) restaurants have their own red pin, and the map key explains every colour.'));
  wrap.append(faq('Where is my data kept? Is it private?', 'Everything you create — saved places, notes, reviews, pins, journal, trip and calendar — stays on this device only. There are no accounts and nothing is uploaded. The document vault (passports, tickets) is encrypted on-device; if you forget the passcode you can still get back in with the one-time recovery code shown at setup, or by restoring an encrypted backup. The only data that leaves your device is what you actively use online, such as a weather refresh, a translation, or tapping through to a booking site.'));
  wrap.append(faq('Finding your way around', 'The bottom tabs are Home, Talk (phrasebook), You, Places and Explore. Search on the Home screen looks across places, food, wildlife, phrases and prices at once. Save any place with the ⭐ and organise saves into Collections. On the map (inside Places) you can drop a pin, set “my stay”, measure distances, and save an area for offline satellite imagery.'));

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
  wrap.append(screenHint(place
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
// Own-card render mode: false = the saved card as a read-only summary (matches how
// every OTHER contact's card renders via contactRow), true = the editable form.
// Module state, not a route — Save/Edit/Cancel just flip this and re-render #circle
// in place, same pattern as editWithdrawalId. Fixes a real bug: this used to always
// render the raw inputs, pre-filled from the just-saved values, so tapping "Save
// card" appeared to do nothing (the form you were still looking at never changed).
let editingMyCard = false;
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

  // --- your card: read-only summary once saved, editable form on request ---
  const cardBox = h('div', { class: 'card' });
  if (editingMyCard || !me.name) {
    const nameIn = h('input', { type: 'text', maxlength: '40', placeholder: 'Display name (e.g. Sam)', 'aria-label': 'Your display name', value: me.name || '' });
    const avIn = h('input', { type: 'text', maxlength: '4', 'aria-label': 'Your emoji', value: me.avatar || '🧭', style: 'width:64px; text-align:center' });
    const bioIn = h('textarea', { class: 'ta', maxlength: '160', rows: '2', placeholder: 'One line about you (optional)' }, me.bio || '');
    cardBox.append(
      h('h2', {}, 'Your traveller card'),
      h('div', { class: 'field' }, [h('label', {}, 'Emoji & name'), h('div', { style: 'display:flex; gap:8px' }, [avIn, nameIn])]),
      field('Short bio', bioIn),
      h('div', { class: 'row-between', style: 'margin-top:6px' }, [
        me.name ? h('button', { class: 'btn ghost', onclick: () => { editingMyCard = false; go('#circle'); } }, 'Cancel') : h('span', {}),
        h('button', { class: 'btn', onclick: () => { setMe({ name: nameIn.value, avatar: avIn.value, bio: bioIn.value }); editingMyCard = false; go('#circle'); } }, 'Save card'),
      ]),
    );
  } else {
    cardBox.append(
      h('h2', { style: 'margin-top:0' }, 'Your traveller card'),
      contactRow(me, h('button', { class: 'chip', 'aria-label': 'Edit your traveller card', onclick: () => { editingMyCard = true; go('#circle'); } }, '✎ Edit')),
    );
  }
  wrap.append(cardBox);

  // --- invite a friend (share your card) ---
  // Every path here hands off to an app the traveller already has (WhatsApp, Messages, or
  // the OS share sheet) with the invite link pre-filled — never sent automatically, the
  // traveller still taps send themselves. No account, no server: the link IS the invite.
  const status = h('p', { class: 'muted' });
  const buildUrl = () => shareUrl('add', encodeCard(ensureMe()));
  const inviteMsg = () => `Join me on Mekonging — a free, offline travel app for Thailand, Vietnam, Cambodia & Laos. Add me: ${buildUrl()}`;
  const shareCard = h('div', { class: 'card' });
  shareCard.append(h('h2', { style: 'margin-top:0' }, '➕ Invite a friend'));
  shareCard.append(h('p', { class: 'muted' }, 'Send this to another traveller. When they open it, you are added to each other’s circle. On a phone, “Share” can send it over AirDrop or Nearby Share with no internet at all.'));

  // WhatsApp — wa.me with no number opens WhatsApp's OWN "choose a chat" picker (exactly
  // like tapping New chat inside WhatsApp), so picking who to invite is entirely WhatsApp's
  // native contact list, not anything this app can or does see.
  shareCard.append(h('button', { class: 'btn block', onclick: () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(inviteMsg())}`, '_blank', 'noopener');
  } }, '💬 Invite via WhatsApp'));

  // Phone contacts — Contact Picker API (Chrome/Android; feature-detected, most other
  // browsers simply never show this button). Each tap is a one-off native picker the
  // traveller explicitly opens and chooses from — no standing access, nothing auto-read.
  const contactPickerOk = typeof navigator !== 'undefined' && 'contacts' in navigator
    && typeof window !== 'undefined' && 'ContactsManager' in window;
  if (contactPickerOk) {
    const pickedBox = h('div', {});
    shareCard.append(h('button', { class: 'btn ghost block', style: 'margin-top:8px', onclick: async () => {
      let picked;
      try { picked = await navigator.contacts.select(['name', 'tel'], { multiple: true }); }
      catch { return; } // cancelled, or the browser/user denied the picker
      pickedBox.replaceChildren();
      const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent || '');
      (picked || []).forEach((p) => {
        const nm = (p.name && p.name[0]) || 'Contact';
        const tel = (p.tel && p.tel[0]) || '';
        if (!tel) return;
        const digits = tel.replace(/[^\d]/g, '');
        const smsUrl = `sms:+${digits}${isIOS ? '&' : '?'}body=${encodeURIComponent(inviteMsg())}`;
        pickedBox.append(h('div', { class: 'row-between', style: 'margin-top:6px' }, [
          h('span', {}, nm),
          h('div', { class: 'cats' }, [
            h('button', { class: 'chip', onclick: () => window.open(`https://wa.me/${digits}?text=${encodeURIComponent(inviteMsg())}`, '_blank', 'noopener') }, '💬 WhatsApp'),
            h('button', { class: 'chip', onclick: () => { window.location.href = smsUrl; } }, '✉️ SMS'),
          ]),
        ]));
      });
      if (!pickedBox.children.length) pickedBox.append(h('p', { class: 'tiny muted' }, 'No phone number on that contact.'));
    } }, '📇 Invite from phone contacts'));
    shareCard.append(pickedBox);
  }

  if (typeof navigator !== 'undefined' && navigator.share) {
    shareCard.append(h('button', { class: 'btn ghost block', style: 'margin-top:8px', onclick: async () => {
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
      const cUnread = unreadThreadCount(c.userId);
      listCard.append(contactRow(c, h('div', { class: 'cats' }, [
        h('button', { class: 'chip' + (cUnread ? ' budget-red' : ''), onclick: () => go('#thread-' + c.userId) }, cUnread ? `💬 ${cUnread} new` : '💬 Message'),
        h('button', { class: 'chip', 'aria-label': `Remove ${c.name || 'this contact'} from your circle`, onclick: () => { confirmAction({ title: 'Remove contact?', body: `Remove ${c.name || 'this contact'} from your circle?`, confirmLabel: 'Remove', danger: true }).then((ok) => { if (ok) { removeContact(c.userId); go('#circle'); } }); } }, '✕'),
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
export function shareButton(label, title, buildUrl, cls = 'btn ghost block') {
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
    box.append(h('button', { class: 'btn block', onclick: (e) => { s.data.stops.forEach((st) => addStop({ title: st.title, country: st.country, date: st.date, endDate: st.endDate })); e.currentTarget.textContent = '✓ Added to my trip'; } }, '＋ Add these stops to my trip'));
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
      (it.kind === 'trip') ? h('button', { class: 'btn ghost block', style: 'margin-top:6px', onclick: (e) => { (it.data.stops || []).forEach((st) => addStop({ title: st.title, country: st.country, date: st.date, endDate: st.endDate })); e.currentTarget.textContent = '✓ Added to my trip'; } }, 'Add stops to my trip') : null,
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
// justImported=true only for the one render importMessageScreen does immediately after
// adding a brand-new incoming message: without it, that single call would both create the
// unread message AND instantly clear it in the same synchronous pass (this screen is the
// only place a message ever gets viewed, so "just added it" and "about to mark it read"
// would otherwise always happen together and the badge could never show anything). Every
// other way of reaching this screen — the circle list's "💬 Message" chip, a direct
// #thread- reload — is a deliberate, separate visit and marks read as normal.
function threadScreen(userId, fallbackCard, justImported = false) {
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
  if (!justImported) markThreadRead(userId);   // opening the thread IS reading it — clears this contact's badge
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
  return threadScreen(uid, m.from, true);
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
// NAV-1: a value-first stepped first run. Rather than a single wall of six cards, the
// traveller answers three focused, high-leverage questions — one per step — then lands on
// Home with a "here is what I set up for you" recap that proves the payoff. The richer,
// lower-urgency fields (accessibility, budget, interests, location) live behind an optional
// "Fine-tune" foldable on the last step, so nothing is lost but nothing is front-loaded.
// welcomeStep is module state so Next/Back re-render the same focused flow without a route.
let welcomeStep = 0;
function welcomeScreen() {
  const prefs = store.profile.prefs;
  const step = Math.min(Math.max(welcomeStep | 0, 0), 2);
  const wrap = h('div', { class: 'screen welcome' });

  // Finishing = leave onboarding for a personalised Home. Show the recap only when the
  // traveller actually personalised something, so a pure "just explore" skip lands clean.
  const somethingSet = () => !!(prefs.party || prefs.withBaby || prefs.soloFemale
    || (prefs.diet || []).length || (prefs.access || []).length || prefs.tripLength
    || (prefs.interests || []).length || (prefs.budget && prefs.budget !== 'flexible'));
  const finish = () => {
    store.profile.seenWelcome = true;
    prefs.geoAsked = true;
    if (netMode() === 'ask') setNetMode('offline');
    prefs.showSetupRecap = somethingSet();
    welcomeStep = 0;
    save();
    go('#home');
  };
  const goStep = (n) => { welcomeStep = Math.min(Math.max(n, 0), 2); welcomeScreen(); };

  // Compact header: small logo + a progress indicator so the traveller always knows where
  // they are and that the flow is short (three steps).
  wrap.append(h('section', { class: 'hero welcome-hero' }, [
    h('div', { class: 'logo-wrap', html: logoSVG() }),
    h('p', { style: 'margin:0' }, 'A few quick taps and Home fits you — or skip and explore. Everything stays on your device.'),
  ]));
  wrap.append(h('div', { class: 'welcome-progress', role: 'group', 'aria-label': `Step ${step + 1} of 3` },
    [0, 1, 2].map((n) => h('span', { class: 'wp-dot' + (n === step ? ' on' : (n < step ? ' done' : '')) }))));

  // ---- Step 1 — Network choice (the gate: no data touched without it) ----
  if (step === 0) {
    const netCard = h('div', { class: 'card' });
    netCard.append(h('h2', { style: 'margin-top:0' }, 'Data, or fully offline?'));
    netCard.append(h('p', { class: 'muted' }, 'This app works fully offline. It will not use mobile data or Wi-Fi unless you allow it — handy when you have no SIM. You can change this any time.'));
    const netRow = h('div', { class: 'chips' });
    [['online', '📶 Use data when I have it'], ['offline', '✈️ Stay fully offline']].forEach(([id, lbl]) =>
      netRow.append(h('button', { class: 'chip', dataset: { n: id }, 'aria-pressed': netMode() === id ? 'true' : 'false',
        onclick: () => { setNetMode(id); netRow.querySelectorAll('.chip').forEach((c) => c.setAttribute('aria-pressed', c.dataset.n === netMode() ? 'true' : 'false')); } }, lbl)));
    netCard.append(netRow);
    wrap.append(netCard);
    wrap.append(h('div', { class: 'welcome-nav' }, [
      h('button', { class: 'btn block', onclick: () => goStep(1) }, 'Next →'),
    ]));
    // A first-timer can bail out of setup entirely and personalise later (Settings, "For you").
    wrap.append(h('button', { class: 'btn ghost block welcome-skip', onclick: finish }, 'Skip — just explore'));
  }

  // ---- Step 2 — Who is travelling (+ baby, solo female) ----
  if (step === 1) {
    const whoCard = h('div', { class: 'card' });
    whoCard.append(h('h2', { style: 'margin-top:0' }, 'Who is travelling?'));
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
    wrap.append(h('div', { class: 'welcome-nav' }, [
      h('button', { class: 'btn ghost', onclick: () => goStep(0) }, '← Back'),
      h('button', { class: 'btn', style: 'margin-left:auto', onclick: () => goStep(2) }, 'Next →'),
    ]));
  }

  // ---- Step 3 — Food allergies / diet (the most visibly personalised surface) ----
  if (step === 2) {
    const dietCard = h('div', { class: 'card' });
    dietCard.append(h('h2', { style: 'margin-top:0' }, 'Any food allergies or diet?'));
    dietCard.append(h('p', { class: 'muted' }, 'Pick any that apply. The app will highlight dishes that fit you when identifying food, and pin your exact phrases at the top of the phrasebook to show a cook. Guidance only — always confirm in person for a serious allergy.'));
    dietCard.append(dietPicker());
    wrap.append(dietCard);

    // Everything else is optional and tucked away — reachable now for keen setters, invisible
    // to travellers who just want to get moving. All fields also live in Settings.
    wrap.append(foldable('⚙️ Fine-tune (optional): accessibility, price, interests, location', () => {
      const box = [];
      // Accessibility + text size
      const accCard = h('div', { class: 'card' });
      accCard.append(h('h3', { style: 'margin-top:0' }, 'Accessibility needs'));
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
      box.push(accCard);
      // How you like to travel
      const fitCard = h('div', { class: 'card' });
      fitCard.append(h('h3', { style: 'margin-top:0' }, 'How you like to travel'));
      fitCard.append(h('p', { class: 'muted' }, 'Price'));
      fitCard.append(prefChips([['low', PRICE_TIER_LABEL.low], ['mid', PRICE_TIER_LABEL.mid], ['high', PRICE_TIER_LABEL.high], ['flexible', PRICE_TIER_LABEL.flexible]], prefs.budget, (v) => { prefs.budget = v; save(); }));
      fitCard.append(h('p', { class: 'muted', style: 'margin-top:10px' }, 'Trip length'));
      fitCard.append(prefChips([['short', '≤ 1 week'], ['medium', '2–3 weeks'], ['long', '1 month +']], prefs.tripLength, (v) => { prefs.tripLength = prefs.tripLength === v ? '' : v; save(); }));
      fitCard.append(h('p', { class: 'muted', style: 'margin-top:10px' }, 'Interests'));
      const intRow = h('div', { class: 'chips' });
      INTERESTS.forEach((it) => { const on = () => (prefs.interests || []).includes(it.id);
        intRow.append(h('button', { class: 'chip', 'aria-pressed': on() ? 'true' : 'false',
          onclick: (e) => { prefs.interests = prefs.interests || []; const i = prefs.interests.indexOf(it.id); if (i >= 0) prefs.interests.splice(i, 1); else prefs.interests.push(it.id); save(); e.currentTarget.setAttribute('aria-pressed', on() ? 'true' : 'false'); } }, `${it.emoji} ${it.label}`)); });
      fitCard.append(intRow);
      box.push(fitCard);
      // Location (sensors, not data)
      const locCard = h('div', { class: 'card' });
      locCard.append(h('h3', { style: 'margin-top:0' }, 'Use your location? (optional)'));
      locCard.append(h('p', { class: 'muted' }, 'Allow it and the app leads with what is good right where you are — distances, near-me, the closest help. It stays on your device and works offline; GPS uses your phone’s sensors, not data.'));
      if (typeof navigator !== 'undefined' && navigator.geolocation) {
        const lb = h('button', { class: 'btn ghost block' }, getLastFix() ? '📍 Location is on' : '📍 Use my location');
        lb.onclick = async () => { lb.textContent = 'Locating…'; lb.disabled = true; try { await refreshLocation(); lb.textContent = '📍 Location is on'; } catch { lb.textContent = '📍 Location unavailable'; } lb.disabled = false; };
        locCard.append(lb);
      } else {
        locCard.append(h('p', { class: 'muted' }, 'Location is not available on this device — you can still browse by country and city.'));
      }
      box.push(locCard);
      return box;
    }, { cls: 'welcome-more' }));

    wrap.append(h('div', { class: 'welcome-nav' }, [
      h('button', { class: 'btn ghost', onclick: () => goStep(1) }, '← Back'),
      h('button', { class: 'btn', style: 'margin-left:auto', onclick: finish }, 'See what I set up →'),
    ]));
  }

  // No tab bar during first-run setup: onboarding is a focused flow with its own
  // Next / Back / Skip exits, not something to wander out of mid-step.
  mount(wrap);
}

// NAV-1: the "here is what I set up for you" recap, shown once on the first Home render after
// the value-first setup. It names each active personalisation and what it does, then points to
// Settings for the rest. Dismissed (or "add more") clears the one-shot flag.
export function setupRecapCard() {
  const p = store.profile.prefs;
  const rows = [];
  rows.push([netMode() === 'offline' ? '✈️' : '📶',
    netMode() === 'offline' ? 'Fully offline' : 'Data when you have it',
    netMode() === 'offline' ? 'The app will not use mobile data or Wi-Fi until you allow it.' : 'The app uses data only when a connection is available.']);
  const partyLbl = { solo: 'Solo', couple: 'Couple', family: 'Family', group: 'Group' }[p.party];
  if (partyLbl || p.withBaby || p.soloFemale) {
    const who = [partyLbl, p.withBaby && 'with a baby', p.soloFemale && 'solo female'].filter(Boolean).join(', ');
    rows.push(['🧭', who, 'Safety notes and picks are tuned to who is travelling.']);
  }
  if ((p.diet || []).length) rows.push(['🍽️', p.diet.join(', '), 'Dishes are flagged for you, and your phrases are pinned at the top of Talk.']);
  if ((p.access || []).length) rows.push(['♿', 'Accessibility: ' + p.access.join(', '), 'Honest, practical access guidance is surfaced for you.']);
  const fit = [{ short: '≤1 week', medium: '2–3 weeks', long: '1 month+' }[p.tripLength], PRICE_TIER_LABEL[p.budget], (p.interests || []).length ? `${p.interests.length} ${p.interests.length > 1 ? 'interests' : 'interest'}` : ''].filter(Boolean).join(' · ');
  if (fit) rows.push(['🎯', fit, 'Trip plans and the “For you” ranking match how you travel.']);

  const dismiss = () => { p.showSetupRecap = false; save(); render(); };
  const card = h('div', { class: 'card setup-recap' });
  card.append(h('strong', {}, '✨ Here is what I set up for you'));
  card.append(h('ul', { class: 'recap-list' }, rows.map(([ic, t, d]) =>
    h('li', {}, [h('span', { class: 'recap-ic' }, ic), h('span', {}, [h('b', {}, t), h('span', { class: 'muted' }, ' — ' + d)])]))));
  card.append(h('div', { class: 'row-between', style: 'margin-top:8px' }, [
    h('button', { class: 'btn', onclick: () => { p.showSetupRecap = false; save(); go('#settings'); } }, 'Add more in Settings'),
    h('button', { class: 'btn ghost', onclick: dismiss }, 'Got it'),
  ]));
  return card;
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
    prefs.budget && PRICE_TIER_LABEL[prefs.budget],
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
    (!prefs.budget || prefs.budget === 'flexible') && 'Price',
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
    const picks = allPlaces({ country: getActiveCountry() }).slice().sort((a, b) => personalScore(b) - personalScore(a)).slice(0, 5);
    const c = getCountry(getActiveCountry());
    if (picks.length) {
      const pk = h('div', { class: 'card' });
      pk.append(h('h2', {}, `Top picks for you${c ? ' — ' + c.name : ''}`));
      picks.forEach((p) => pk.append(h('button', { class: 'btn ghost block', style: 'margin-top:6px; justify-content:flex-start', onclick: () => go(`#place-${p.id}`) },
        `${starsStr(Math.round(effectiveRating(p.id, p.rating)))} ${p.name}`)));
      pk.append(h('button', { class: 'btn ghost block', style: 'margin-top:8px', onclick: () => go(`#places-${getActiveCountry()}`) }, 'See all places, ranked for you'));
      wrap.append(pk);
    }
    // the best-matching plan
    const plans = suggestPlans({ country: getActiveCountry(), tripLength: prefs.tripLength, party: prefs.party, budget: prefs.budget });
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
  const tripName = (store.profile.name || '').trim();
  const tripLabel = tripName ? `${tripName}’s trip` : 'My Trip';
  const wrap = h('div', { class: 'screen' });
  wrap.append(topbar('Trip plans', '#home'));
  wrap.append(h('p', { class: 'muted' }, `Suggested routes, matched to how you travel. Nights are guidance — stretch or compress freely. Add a plan to ${tripLabel} and edit it there.`));
  if (!profileIsSet()) {
    wrap.append(h('div', { class: 'card' }, [
      h('p', { class: 'muted' }, 'Set your price range, party and trip length first and these plans sort themselves to fit you.'),
      h('button', { class: 'btn block', onclick: () => go('#foryou') }, '🎯 Set up "For you"'),
    ]));
  }
  wrap.append(countryChips((id) => { setActiveCountry(id); go('#plans'); }));
  const plans = suggestPlans({ country: getActiveCountry(), tripLength: prefs.tripLength, party: prefs.party, budget: prefs.budget });
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
      e.currentTarget.textContent = `✓ Added — open ${tripLabel} to edit`;
    } }, `＋ Add this plan to ${tripLabel}`));
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
    const selected = cc || getActiveCountry();
    wrap.append(countryChips((id) => { setActiveCountry(id); go(`#board-${id}`); }, selected));
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
  wrap.append(countryChips((id) => { setActiveCountry(id); go('#streetfood'); }));

  // rateable street-food places (curated local eats) — as a rate-list or on a map.
  const prefs = store.profile.prefs;
  const sview = prefs.streetView === 'map' ? 'map' : 'list';
  const places = allPlaces({ country: getActiveCountry() }).filter((p) => p.isLocal === true || (p.categories || []).includes('streetfood'));
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
      import('./map.js').then((m) => m.initMap(canvas, {
        places: mappable,
        onOpen: (id) => go(`#place-${id}`), onLocate: (f) => setLastFix(f),
      })).then((c) => { setLiveCleanup(() => { try { c.dispose(); } catch { /* noop */ } }); }).catch(() => { /* list still below */ });
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
  const boards = boardsForCountry(getActiveCountry()).filter((b) => (b.streetFood || []).length);
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

// Converts a blob to a base64 data URL. Shared by Settings' full-device backup builder
// (moved to js/screens/settings.js) and this section's own journal/review/photo-album
// HTML exporters below, so it stays here rather than moving into either one.
export function blobToDataURL(blob) {
  return new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = () => rej(r.error); r.readAsDataURL(blob); });
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
export async function exportOnePlaceReviewHtml(id, name) {
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
  return { headers: ['Date', 'Amount', 'Currency', 'Category', 'On what'], rows: log.map((b) => [b.date || '', parseFloat(b.amount) || 0, b.currency || '', expCatLookup(expCatOf(b)).label, b.note || '']) };
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
    const dates = stops.flatMap((s) => [s.date, s.endDate]).filter(Boolean).sort();
    if (dates.length) summaryBits.push(`Dates: ${dates[0]}${dates.length > 1 && dates[dates.length - 1] !== dates[0] ? ` – ${dates[dates.length - 1]}` : ''}`);
    summaryBits.push(`${stops.length} stop${stops.length === 1 ? '' : 's'}`);
  }
  if (log.length && spend > 0) summaryBits.push(`Total spent: ${money(Math.round(spend), home)}${spendKnown ? '' : ' (partial — some currencies not converted)'}`);
  if (summaryBits.length) {
    parts.push(`<h2 class="book-section">My trip</h2><p class="lead">${summaryBits.map(esc).join(' · ')}</p>`);
    if (stops.length) {
      parts.push('<article>' + stops.map((s) =>
        `<div>${esc(s.title || 'Stop')}${s.country ? ` · ${esc((getCountry(s.country) || {}).name || s.country)}` : ''}${stopDateLabel(s) ? ` · ${esc(stopDateLabel(s))}` : ''}</div>`).join('') + '</article>');
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

  if (!parts.length) parts.push('<p>Your travel book is empty for now. Add a journal entry, rate a place, or log an expense and it will appear here.</p>');
  return htmlDoc('My travel book', parts.join('\n'));
}

function exportScreen() {
  const wrap = h('div', { class: 'screen' });
  // "Export" alone (was "Export & share") — matches the two chips below once they're renamed
  // to match, and fits on one line; the full phrase 3-line-wrapped on mobile.
  wrap.append(topbar('Export', '#settings'));
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
    h('p', { class: 'tiny muted', style: 'margin:0 0 8px' }, `${bCount} logged ${bCount === 1 ? 'expense' : 'expenses'} — as a spreadsheet.`),
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
  wrap.append(screenHint('Established non-profits working directly with people across Thailand, Vietnam, Cambodia and Laos. Each opens the organisation’s own official website, where you donate directly and securely.'));
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

// A brief, honest, one-time-per-country loading state — shown only the first time a
// route needs data that has not been fetched yet this session (see the lazy country
// data gate in render() below). Never a blank screen, never a silent hang.
function countryLoadingScreen(ccs) {
  const names = ccs.map((id) => { const c = getCountry(id); return c ? `${c.flag} ${c.name}` : id; }).join(', ');
  return h('div', { class: 'screen' }, [
    h('div', { class: 'card', role: 'status', style: 'text-align:center;margin-top:15vh' }, [
      h('div', { 'aria-hidden': 'true', style: 'font-size:2.4rem;margin-bottom:8px' }, '🧭'),
      h('h2', { style: 'margin:0 0 4px' }, `Loading ${names}…`),
      h('p', { class: 'muted' }, 'One-time — this stays on your device after.'),
    ]),
  ]);
}

// Shown for the fraction of a second a route's own screen module takes to arrive. Separate
// from countryLoadingScreen because it is not naming a country — and because it is almost
// always instant: the service worker has these cached after the first visit.
function screenLoadingScreen() {
  return h('div', { class: 'screen' }, [
    h('div', { class: 'card', role: 'status', style: 'text-align:center;margin-top:15vh' }, [
      h('div', { 'aria-hidden': 'true', style: 'font-size:2.4rem;margin-bottom:8px' }, '🧭'),
      h('h2', { style: 'margin:0 0 4px' }, 'Opening…'),
      h('p', { class: 'muted' }, 'One moment.'),
    ]),
  ]);
}

// Shown when a route's own screen module could not be fetched — offline before the service
// worker had stored it. Honest about the cause, and a retry rather than a dead end. Emergency
// screens are deliberately not lazy, so this can never stand between a traveller and
// #sos or #hospital.
function screenUnavailableScreen(names) {
  return h('div', { class: 'screen' }, [
    topbar('Not downloaded yet', '#home'),
    h('div', { class: 'card' }, [
      h('h2', { style: 'margin:0 0 6px' }, 'This screen is not on your device yet'),
      h('p', { class: 'muted' }, online()
        ? 'It could not be fetched just now. Tap retry.'
        : 'It needs a connection the first time you open it. Emergency numbers, phrases and the hospital finder all work offline.'),
      h('button', {
        class: 'btn block',
        onclick: () => {
          (names || []).forEach((n) => { delete _screenFailed[n]; delete _dataFailed[n]; });
          render();
        },
      }, 'Retry'),
    ]),
  ]);
}

// ---- router -----------------------------------------------------------------
export function render() {
  applyTheme();
  applyDocLang();   // keep <html lang>/<html dir> in step with the chosen interface language
  // Tear down any live map before rendering the next screen (frees the WebGL context
  // and stops the GPS watcher — prevents the map dying after repeated visits). See
  // js/app-state.js for the liveMapCtrl/liveCleanup protocol itself.
  teardownLiveScreen();
  stopAllReaders();   // cancel any in-progress read-aloud before the screen changes
  // Close any open modal/confirm/bottom-sheet before rebuilding the screen underneath it.
  // This used to live only in the hashchange listener below, which two real paths skip
  // entirely: go() short-circuits straight to render() when the hash is unchanged, and the
  // background GPS watcher calls render() directly on movement while on Home/Nearby/Explore/
  // Places. Either one, with a modal open, used to rebuild the screen while the modal stayed
  // up as a stale, disconnected overlay — closing it here instead covers every render(), not
  // just hash-navigation ones. Harmless to also still run in the hashchange listener (closing
  // an already-empty modal set is a no-op).
  closeAllModals();
  const hash = location.hash || '#home';
  const [head, ...rest] = hash.slice(1).split('-');
  const arg = rest.join('-');

  // ---- Lazy country data gate --------------------------------------------------
  // See js/data/regions.js: COUNTRIES ships as metadata only; loadCountry(cc) fetches
  // one country's places/food/prices/routes/info/guide/events + local boards on first
  // real need, so a traveller's first paint never parses the other three countries'
  // data (~1.5 MB combined). This is the ONE choke point — every screen below reads
  // that data fully synchronously and UNCHANGED, because by the time a gated screen
  // runs, its country is guaranteed loaded. Falls straight through at zero added cost
  // once loaded (isCountryLoaded is a plain property read); fires at most once per
  // country per session. If you add a screen that reads allPlaces/getFood/getEvents/
  // c.prices/c.routes/c.info/c.guide/boardsForCountry, add its route below.
  const ALL_CC = ['th', 'vi', 'kh', 'la'];
  const NEEDS_COUNTRY_DATA = new Set([
    'country', 'region', 'nearby', 'places', 'place', 'prices', 'transport',
    'calendar', 'events', 'event', 'today', 'food', 'dish', 'board', 'streetfood',
    'sos', 'hospital', 'foryou',
  ]);
  // Read across every country at once: universal search; the full multi-country map
  // (NOT the small embedded per-country Places map, which is caller-scoped via a
  // supplied list and unaffected); the cross-border route/journey planner (its route
  // graph memoises forever on first build, so it must never run while only partly
  // loaded); and a traveller's own saved places/collections, which may span any
  // country they have visited.
  const NEEDS_ALL_COUNTRIES = new Set(['search', 'route', 'journey', 'saved', 'collection', 'nextstop']);
  // The two routes that render a province/zone map or read placesInZone/townsInZone
  // (zoneAssignment) — all backed by the ADM1 region-set loader (loadRegionSet/
  // isRegionSetLoaded, defined above with REGIONS_BY_CC). This is a second, independent
  // lazy axis from the country CONTENT gated below: nothing else in NEEDS_COUNTRY_DATA
  // touches regionSetFor(), so gating them on region data too would re-introduce eager
  // loading for the three routes that never render a region/zone map.
  const NEEDS_REGION_DATA = new Set(['country', 'region']);
  if (NEEDS_COUNTRY_DATA.has(head) || NEEDS_ALL_COUNTRIES.has(head)) {
    const wantAll = NEEDS_ALL_COUNTRIES.has(head);
    const prefix = arg ? arg.split('-')[0] : null;
    const argCc = ALL_CC.includes(arg) ? arg : (ALL_CC.includes(prefix) ? prefix : null);
    const neededCcs = wantAll ? ALL_CC : [argCc || getActiveCountry()];
    const pendingCountry = neededCcs.filter((cc) => !isCountryLoaded(cc));
    const pendingRegion = NEEDS_REGION_DATA.has(head) ? neededCcs.filter((cc) => !isRegionSetLoaded(cc)) : [];
    if (pendingCountry.length || pendingRegion.length) {
      pendingCountry.forEach((cc) => { loadCountry(cc).then(render, render); });
      pendingRegion.forEach((cc) => { loadRegionSet(cc).then(render, render); });
      mount(countryLoadingScreen(neededCcs), true);
      return;
    }
  }

  // ---- Lazy screen-module and data gate ----------------------------------------
  // Same shape as the country-data gate above, and for the same reason: hold the render for
  // one module rather than make every screen in the app carry a not-loaded-yet branch. By the
  // time a case in the switch runs, screenMod(name) is guaranteed non-null and every
  // js/lazy-data.js binding a route reads is guaranteed populated. The two kinds share one
  // loading card, one unavailable card and one retry, because to the traveller they are the
  // same event: this screen is not on the device yet.
  const needScreens = ROUTE_SCREENS[head] || [];
  const needData = ROUTE_DATA[head] || [];
  const wantScreens = needScreens.filter((n) => !screenMod(n) && !_screenFailed[n]);
  const wantData = needData.filter((n) => !isDataLoaded(n) && !_dataFailed[n]);
  if (wantScreens.length || wantData.length) {
    wantScreens.forEach((n) => { loadScreenMod(n).then(render, render); });
    wantData.forEach((n) => { loadDataMod(n).then(render, render); });
    mount(screenLoadingScreen(), true);
    return;
  }
  // Asked for, attempted, and not available: say so plainly and offer a retry, rather than
  // calling a screen function on a module that is not there — or rendering a screen whose data
  // silently came back empty.
  const absent = needScreens.filter((n) => !screenMod(n)).concat(needData.filter((n) => !isDataLoaded(n)));
  if (absent.length) {
    mount(screenUnavailableScreen(absent), true);
    return;
  }

  try {
    // First run: learn the traveller before dropping them on the menu. Only intercepts the
    // home route, so any deep link (a shared place/board) still opens directly.
    if (!store.profile.seenWelcome && (head === '' || head === 'home')) return welcomeScreen();
    switch (head) {
      case '': case 'home': return homeScreen();
      case 'me': return meHubScreen();
      case 'everything': return everythingScreen();
      case 'welcome': return welcomeScreen();
      case 'explore': return exploreScreen(arg);   // arg is usually undefined; 'all' forces the four-country view
      case 'country': return exploreScreen(arg);   // arg is always a valid country id — 21 existing links
      case 'region': return regionScreen(arg);
      case 'nearby': return nearbyScreen();
      case 'currency': return currencyScreen();
      case 'exchange': return bulletinScreen(arg);
      case 'swap': return bulletinScreen('swap');
      case 'market': return bulletinScreen('gear');
      case 'phrasebook': return phrasebookScreen(arg);
      case 'dictionary': return dictionaryScreen();
      case 'places': return placesScreen(arg);
      case 'place': return placeScreen(arg);
      case 'prices': return pricesScreen(arg);
      case 'transport': return transportScreen(arg);
      case 'route': return planRouteScreen();
      case 'nextstop': return screenMod('nextstop').nextStopScreen(arg);
      case 'info': return infoScreen(arg);
      case 'saved': return savedScreen();
      case 'collection': return collectionScreen(arg);
      case 'crossings': return crossingsScreen();
      case 'pools': return poolsScreen(arg);
      case 'addpin': return addPinScreen(arg);
      case 'journal': return screenMod('journal').journalDispatch(arg);
      case 'scrapbook': return screenMod('journal').scrapbookScreen();
      case 'contributions': return contributionsScreen();
      case 'journey': return screenMod('journal').journeyScreen();
      case 'calendar': return screenMod('calendar').calendarDispatch(arg);
      case 'events': return eventsScreen(arg);
      case 'event': return eventScreen(arg);
      case 'weather': return weatherScreen(arg);
      case 'today': return daySuggestScreen(arg);
      case 'access': return accessScreen(arg);
      case 'baby': return babyScreen(arg);
      case 'family': return screenMod('family').familyScreen(arg);
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
      case 'identified': return myIdentifierScreen();
      case 'search': return searchScreen();
      case 'sos': return sosScreen(arg);
      case 'hospital': return hospitalScreen(arg);
      case 'scams': return scamsScreen(arg);
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
      case 'visitors': return screenMod('visitors').visitorsScreen();
      case 'settings': return screenMod('settings').settingsScreen();
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
  closeAllModals();
  stopSpeak();
  // Record where we came from for history-aware Back, unless this change WAS a Back.
  if (poppingBack) { poppingBack = false; }
  else if (lastHash && lastHash !== location.hash) { navStack.push(lastHash); if (navStack.length > 60) navStack.shift(); }
  lastHash = location.hash;
  saveNavState();
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
// First run only: open in the language the traveller's own device is already set to, so a
// phone configured in Spanish or Korean does not present an English wall before they have
// found the flag. Recorded as an explicit preference from then on, which means a later manual
// choice is never second-guessed by the browser's setting — and `!== undefined` (rather than a
// truthiness test) is what makes a deliberate switch BACK to English stick.
if (store.profile.prefs.uiLang === undefined) {
  const guess = detectPreferredLang();
  store.profile.prefs.uiLang = guess;
  save();
}
applyDocLang();

// First paint waits for the active language's interface dictionary — one ~5 KB file, or
// nothing at all for English. It used to be free because all 29 languages were bundled into
// the eagerly-imported module graph; that cost every traveller 162 KB before anything could
// appear. Awaiting one file here is what keeps a Thai or Arabic launch from painting an
// English screen and then flipping. ensureUiStrings never rejects, so a failed fetch still
// renders — in English, which is the documented fallback for a missing dictionary anyway.
if (uiStringsReady()) render();
else ensureUiStrings().then(render, render);

// Location on from the start: request a live fix immediately (browser permission still
// gates it) and keep it current; denial degrades to the manual city picker.
try { initLocation(); } catch { /* best-effort */ }

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

// Warm the wildlife/plant data (js/data/nature.js) once the browser is idle, so Identify/
// Sounds/Species/Dangerous/Search often already have it by the time a traveller taps in —
// see loadNature() near the top of this file. Purely best-effort: every call site above
// that actually needs this data triggers (and gracefully awaits) its own load regardless,
// so a slow, starved, or unsupported idle callback never leaves anything stuck.
if ('requestIdleCallback' in window) requestIdleCallback(() => { loadNature().catch(() => {}); }, { timeout: 4000 });
else setTimeout(() => { loadNature().catch(() => {}); }, 2000);

// Warm the route-scoped data modules (js/lazy-data.js) the same way, and for the reason that
// makes deferring them a clear win rather than a trade: taking them off the critical path
// speeds up the first paint, but it would otherwise put a round trip in front of the first
// visit to Visa, Pools, Transport and the rest. Warmed on idle, that round trip is normally
// already paid before the traveller taps, and the gate simply falls through.
//
// Deliberately AFTER nature and one at a time: this is background work and must never compete
// with the screen the traveller is actually looking at. Failures are ignored — the gate will
// fetch on demand, and offline the worker serves them from cache anyway.
function warmLazyData() {
  const queue = DATA_MODULES.slice();
  const step = () => {
    const name = queue.shift();
    if (!name) return;
    if (isDataLoaded(name)) { step(); return; }
    loadData(name).catch(() => {}).then(() => {
      if ('requestIdleCallback' in window) requestIdleCallback(step, { timeout: 3000 });
      else setTimeout(step, 250);
    });
  };
  step();
}
if ('requestIdleCallback' in window) requestIdleCallback(warmLazyData, { timeout: 12000 });
else setTimeout(warmLazyData, 6000);
