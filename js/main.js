// Mekong app shell + hash router. Vanilla ES6, offline-first. Screens read all
// content from js/data/regions.js so no destination is hard-coded here.

import {
  store, save, resetAll, exportData, importData, isFavorite, toggleFavorite, prefersReducedMotion,
  ensureDurability, storageStatus, requestPersistence,
  createCollection, renameCollection, deleteCollection, togglePlaceInCollection, collectionsForItem,
  addPin, updatePin, deletePin, getPin, getPlaceData, setPlaceField, getJellyReports, addJellyReport, todayKey,
  addJournalEntry, updateJournalEntry, deleteJournalEntry, journalEntries,
  getAlbum, addAlbumPhoto, updateAlbumPhoto, deleteAlbumPhoto,
  addCalendarItem, updateCalendarItem, deleteCalendarItem,
  isChecked, toggleChecklistItem,
  addStop, removeStop, moveStop, updateStop, addBudgetItem, deleteBudgetItem, updateBudgetItem, addWithdrawal, deleteWithdrawal, updateWithdrawal,
  addPlaceVisit, removePlaceVisit, updatePlaceVisit, visitsForStop, unscheduledVisits,
  setMyStay, getMyStay, clearMyStay,
  getLastFix, setLastFix,
  getSavedAreas, addSavedArea, removeSavedArea,
  ensureMe, setMe, getContacts, getContact, addContact, removeContact,
  getInbox, addInboxItem, markInboxRead, deleteInboxItem, unreadInboxCount,
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
  LANGS, uiLang, uiLangMeta, setUiLang, applyDocLang, translateTree, autoTranslateTree, retranslate,
  detectPreferredLang, mtEnabled, setMtEnabled, dateLocale, ensureUiStrings, uiStringsReady,
} from './i18n.js';
import { homeScreen } from './screens/home.js';
import { navGroup, groupHash, resolveHash, visibleItems, visibleGroups, navItems, itemLabel } from './nav-groups.js';
import { recordVisit, contributeVisit, visitsEnabled } from './visits.js';
import { noteTrail, trailEnabled, trailPoints, trailStats } from './trail.js';
import { HOSP_TAG, EMERGENCIES, EMBASSY } from './data/emergency.js';
import { loadHospitals, isHospitalsLoaded, nearestCare } from './data/hospitals.js';
import { scriptLang, showBigPhrase } from './phrase-ui.js';
// Places step 4 (task #205): placesScreen itself, plus placeCard/travelerChips/saveSheet/
// tripVisitSheet, which this file's own not-yet-extracted screens (signature sights strip,
// saved, collections, trip) still reach back in for — same circular-import reasoning as above.
// Places step 5: placeScreen (the #place router case), resolveItem (savedScreen,
// collectionScreen, tripScreen's itinerary x3, feedbackScreen — all still resident here),
// jellyInSeason (a beach-nearby suggestion card), formatMonths (the danger screen's
// mosquito-peak card), and SEV_LABEL/fmtReportDate/addPlaceSecret (the Travel Circle
// share-detail + inbox screens' jelly/secret previews) — every one confirmed by a fresh grep
// across main.js, not inherited from the original scoping pass's classification.
// placesScreen and placeScreen are NOT here any more: they are the #places and #place route
// handlers and nothing but the router calls them, so they load on demand via SCREEN_LOADERS
// below. The rest are the helpers that collections, the trip itinerary and feedback render
// without ever visiting #places, and they now live in the small eager module beside them.
import {
  placeCard, travelerChips, saveSheet, tripVisitSheet, resolveItem,
  jellyInSeason, formatMonths, SEV_LABEL, fmtReportDate, addPlaceSecret,
} from './place-ui.js';
import { encodeCard, parseCard, shareUrl, encodeShare, parseShare, encodeMessage, parseMessage } from './social.js';
import { CHECKLIST, CHECKLIST_UNIVERSAL } from './data/checklist.js';
import { PHOTOS } from './data/photos.js';
// Automatic offline download of the identify field guide (photos + animal calls). Adds nothing
// to the launch graph beyond itself: everything heavy it needs — nature.js for the dangerous-
// species list, sounds.js for the calls — it imports dynamically, on idle.
import { startPack } from './offline-pack.js';
import { putBlob, getBlob, delBlob } from './idb.js';
// Private personal calendar (cycle/period, mood, symptoms, intimacy, pregnancy). On-device,
// opt-in, optional PIN. See js/personal.js. Namespaced to keep the many helpers clear.
import * as personal from './personal.js';
// On-device contribution points + levels (Google Maps Local Guides-style, no accounts).
import * as gamify from './gamify.js';
// Server-free reminders (per-entry lead time + daily journal nudge; in-app + best-effort notifications).
import * as reminders from './reminders.js';
import { h, esc, money, range, mapsUrl, mapsDirUrl, debounce, geolocate, bearing, compass, fmtDistance, titleCase, fetchTimeout } from './util.js';
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
import { verdictFor, VERDICT_RANK } from './data/month-verdict.js';
// The place tier of "when to go" (52 hand-curated entries). Already in the eager graph via
// render-utils.js's placeWhen, so this import costs nothing; read here directly because the
// region chooser needs the raw bestM/avoidM to spot a PLACE that disagrees with its region,
// which is a different question from placeWhen's "what does this one place say".
import { PLACE_MONTHS } from './data/place-months.js';
import {
  field, selectEl, foldable, collapsibleCard, openModal, closeAllModals, confirmAction, promptAction,
  readAloudBar, stopAllReaders, currencySelect, locationSelect, spotForKey,
  online, infoTip, screenHint,
} from './ui-widgets.js';
import { speak, stop as stopSpeak, hasVoiceFor, say, canSay, ttsUrl, setSavedPacks } from './tts.js';
import { translate, isConfigured as translateConfigured } from './translate.js';
import { routeNodes, planRoutes, isRouteNode } from './journey.js';
import { HISTORY } from './data/history.js';
import { getRates, refreshRates, maybeRefreshRates, convert, currencyFlag, currencySymbol } from './currency.js';
import { WEATHER_SPOTS, wmo, isWet, spotKey, spotsForCountry, defaultSpot, nearestSpot, getCachedWeather, getCachedMany, getCachedMarine, getCachedAir, maybeRefreshWeather, maybeRefreshMany } from './weather.js';
import {
  COUNTRIES, LANGUAGES, INTERESTS, COLLECTION_PRESETS,
  getCountry, getLanguage, allPlaces, getPlace,
  boardsForCountry, getBoard,
  getEvents, allEvents, getEvent,
  getFood, allFood, getDish, FOOD_CATEGORIES, FOOD_ALLERGENS,
  loadCountry, isCountryLoaded, loadAllCountries,
} from './data/regions.js';
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
export function isNatureLoaded() { return !!_natureMod; }
export function loadNature() {
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
// Twenty-four screen modules are loaded on demand rather than statically imported. Every one of them
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
  sharejourney: (b) => import('./screens/share-journey.js' + b),
  medical: (b) => import('./screens/medical.js' + b),
  vault: (b) => import('./screens/vault.js' + b),
  export: (b) => import('./screens/export.js' + b),
  giveback: (b) => import('./screens/giveback.js' + b),
  circle: (b) => import('./screens/circle.js' + b),
  produce: (b) => import('./screens/produce.js' + b),
  schedules: (b) => import('./screens/schedules.js' + b),
  trip: (b) => import('./screens/trip.js' + b),
  bargain: (b) => import('./screens/bargain.js' + b),
  etiquette: (b) => import('./screens/etiquette.js' + b),
  help: (b) => import('./screens/help.js' + b),
  contributions: (b) => import('./screens/contributions.js' + b),
  board: (b) => import('./screens/board.js' + b),
  streetfood: (b) => import('./screens/streetfood.js' + b),
  phrasebook: (b) => import('./screens/phrasebook.js' + b),
  places: (b) => import('./screens/places.js' + b),
  budget: (b) => import('./screens/budget.js' + b),
  weather: (b) => import('./screens/weather.js' + b),
  countryinfo: (b) => import('./screens/country-info.js' + b),
  arrivalinfo: (b) => import('./screens/arrival-info.js' + b),
  food: (b) => import('./screens/food.js' + b),
  nearby: (b) => import('./screens/nearby.js' + b),
  explore: (b) => import('./screens/explore.js' + b),
  you: (b) => import('./screens/you.js' + b),
  today: (b) => import('./screens/today.js' + b),
  search: (b) => import('./screens/search.js' + b),
  welcome: (b) => import('./screens/welcome.js' + b),
  transport: (b) => import('./screens/transport.js' + b),
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
  family: ['family'],
  explore: ['family', 'explore'],
  country: ['family', 'explore'],
  sharejourney: ['sharejourney'], jr: ['sharejourney'],
  hospital: ['medical'],
  vault: ['vault'],
  export: ['export'],
  donate: ['giveback'],
  circle: ['circle'], add: ['circle'], in: ['circle'],
  inbox: ['circle'], thread: ['circle'], msg: ['circle'],
  produce: ['produce'], pantry: ['produce'], schedules: ['schedules'], bargain: ['bargain'],
  etiquette: ['etiquette'],
  trip: ['trip'], plans: ['trip'], checklist: ['trip'],
  help: ['help'], feedback: ['help'], contributions: ['contributions'],
  board: ['board'], streetfood: ['streetfood'],
  phrasebook: ['phrasebook'], dictionary: ['phrasebook'],
  places: ['places'], place: ['places'],
  expenses: ['budget'],
  weather: ['weather'],
  // One key per line: check-lazy-data.py's parse_map() reads ROUTE_SCREENS with re.match,
  // which only captures the FIRST `key: [...]` on a line and silently drops any others sharing
  // it — harmless for the pre-existing family/explore/country line above (those three routes'
  // own direct reads already cover their ROUTE_DATA regardless of the family-module rollup),
  // but it would have silently dropped five of these six from the rollup that DOES matter here.
  setcity: ['countryinfo'],
  history: ['countryinfo'],
  access: ['countryinfo'],
  baby: ['countryinfo'],
  visa: ['countryinfo'],
  scams: ['countryinfo'],
  arrival: ['arrivalinfo'],
  info: ['arrivalinfo'],
  // nearby.js statically imports food.js for dietEatCard, so requesting 'nearby' brings both.
  food: ['food'],
  dish: ['food'],
  nearby: ['nearby'],
  region: ['explore'],
  me: ['you'], foryou: ['you'], welcome: ['welcome'],
  today: ['today'],
  search: ['search'],
  transport: ['transport'], addpin: ['transport'],
};
const _screenMods = Object.create(null);
const _screenPending = Object.create(null);
// Modules whose load FAILED — offline before the worker had cached them, or a dropped
// connection mid-fetch. This set is what stops the gate below from spinning: it re-renders on
// failure, and without a record of the failure it would ask for the same module again, fail
// again, and leave the traveller on a loading card forever.
const _screenFailed = Object.create(null);
export function screenMod(name) { return _screenMods[name] || null; }
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
  // access/baby/history/setcity/scams/visa all load the same js/screens/country-info.js module
  // (six screens, one lazy chunk — see ROUTE_SCREENS above), and check-lazy-data.py's route ->
  // screen rollup is whole-module: any route that loads it is gated on everything ANY screen in
  // it reads, not just its own. So all six carry the identical union below rather than each
  // one's own narrower need — the same over-approximation explore/country below already accept
  // for js/screens/family.js. Safe (a route waits for data it may not use), not silent-missing.
  access: ['accessibility', 'scams', 'visa'],
  arrival: ['arrival', 'visa'],
  baby: ['accessibility', 'scams', 'visa'],
  bestlist: ['bestof'],
  bestof: ['bestof'],
  country: ['accessibility', 'bestof', 'itineraries', 'visa', 'zones'],
  crossings: ['borders', 'visa'],
  explore: ['accessibility', 'bestof', 'itineraries', 'visa', 'zones'],
  // #me and #foryou share js/screens/you.js (screen split, mk-v0.539.0), so the guard rolls
  // foryouScreen's data need up to both — the same over-approximation explore/country accept.
  // Only foryouScreen reads it; warmLazyData() has normally already fetched it on idle, so in
  // practice the YOU tab awaits nothing.
  foryou: ['itineraries'],
  me: ['itineraries'],
  history: ['accessibility', 'scams', 'visa'],
  // arrival/info share js/screens/arrival-info.js (see the country-info comment above for why
  // that means an identical union, not each route's own narrower need).
  info: ['arrival', 'visa'],
  place: ['accessibility', 'borders', 'transit'],
  // #places had no entry here before, and not because it needed none: js/screens/places.js was
  // statically imported, so it was outside check-lazy-data's scan set and the guard derived
  // NOTHING at all for this route — it was unchecked, not checked-and-clear. Making the module
  // route-scoped brought it into scope and showed placesScreen reaching TRANSPORT_HUBS,
  // TRANSIT_SOURCES, CROSSINGS and getAccessibility.
  //
  // Whether that ever rendered an empty section in practice: I could not reproduce one. A cold
  // load straight to #places on the previous build has all three modules present and renders
  // byte-identically to this one, so something (the idle prefetch is the likely candidate) was
  // winning the race. The gate is still right — it replaces a race that happens to be won with
  // a guarantee — but it is a correctness tidy-up, not a fix for an observed defect.
  places: ['accessibility', 'borders', 'transit'],
  plans: ['itineraries'],
  pools: ['pools'],
  produce: ['produce'],
  pantry: ['produce'],
  // #region now shares js/screens/explore.js with exploreScreen (screen split, mk-v0.539.0),
  // so it inherits that screen's data needs — the same over-approximation explore/country
  // above already accept, and it costs a #region visit nothing in practice: the route is only
  // reachable from Explore, which has already awaited all four, and warmLazyData() warms them
  // on idle regardless. 'zones' is the only one regionScreen reads itself.
  region: ['accessibility', 'bestof', 'itineraries', 'visa', 'zones'],
  scams: ['accessibility', 'scams', 'visa'],
  schedules: ['schedules'],
  setcity: ['accessibility', 'scams', 'visa'],
  settings: ['accessibility'],
  sounds: ['sounds'],
  species: ['sounds'],
  // #trip joins #plans here for the same reason #places did above: tripScreen used to live in
  // main.js, so it was outside check-lazy-data's route-scoped scan set and this route was
  // unchecked rather than checked-and-clear. Moving it to js/screens/trip.js brought it into
  // scope, and the guard immediately found the itineraries read that had never been gated.
  trip: ['itineraries'],
  transport: ['transit'],
  visa: ['accessibility', 'scams', 'visa'],
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
      // reg.update() returns a PROMISE, so the synchronous try/catch this used to carry never
      // caught anything: being offline — the single most likely outcome on this app, and the
      // exact case the `online` trigger below exists for — rejected into nowhere. It was
      // invisible until the global unhandledrejection handler added in this release started
      // reporting it, which is precisely what that handler is for. Being offline is not a
      // failure worth telling a traveller about, so it is swallowed HERE, deliberately,
      // rather than by widening the filter that catches real faults.
      const checkForUpdate = () => {
        try { const r = reg.update(); if (r && r.catch) r.catch(() => { /* offline, or no new worker */ }); }
        catch { /* not ready */ }
      };
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
export function showUndoToast(message, undoFn) {
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

// ---- NOTHING FAILS SILENTLY -------------------------------------------------
// render() has always wrapped the screen switch in a try/catch, so an error thrown while
// PAINTING a screen was caught and shown. Nothing covered anything else. An error thrown
// inside a click handler, a timer, or a rejected promise escaped to the console — which on a
// phone nobody can open — and the traveller was left with a control that simply did nothing.
// That is the worst failure this app can have, because it is indistinguishable from the app
// deciding to ignore them, and it produces the one bug report that cannot be acted on: "it
// stopped working".
//
// These listeners are the floor, not a fix. What they guarantee is that no failure is
// invisible: it is recorded on the device, it rides along with any feedback the traveller
// sends, and the first one in a session says so out loud instead of leaving a dead button.
const ERR_KEY = 'mk-errors';
const ERR_MAX = 20;

// Kept in localStorage rather than memory so the log survives the reload that a traveller
// will almost certainly perform before they think to report anything. Every access is
// defensive: storage can be full, disabled, or throw outright in private browsing, and an
// error recorder that throws while recording an error is worse than no recorder at all.
function recordError(kind, err) {
  try {
    const entry = {
      at: Date.now(),
      kind,
      hash: (typeof location !== 'undefined' && location.hash) || '',
      msg: String((err && (err.message || err.reason || err)) || 'unknown').slice(0, 300),
      v: APP_VERSION,
    };
    const log = recentErrors();
    log.unshift(entry);
    localStorage.setItem(ERR_KEY, JSON.stringify(log.slice(0, ERR_MAX)));
  } catch { /* the log is best-effort by definition */ }
}

export function recentErrors() {
  try {
    const raw = JSON.parse(localStorage.getItem(ERR_KEY) || '[]');
    return Array.isArray(raw) ? raw : [];
  } catch { return []; }
}

export function clearRecentErrors() {
  try { localStorage.removeItem(ERR_KEY); } catch { /* noop */ }
}

// One quiet toast per session. Repeating it would turn a bad moment into a worse one, and
// the log is the durable record — this exists only so the traveller knows the app heard the
// tap and something went wrong, rather than assuming the button is decorative.
let errToastShown = false;
function showErrorToast() {
  if (errToastShown) return;
  errToastShown = true;
  const toast = h('div', { class: 'update-toast', role: 'status' }, [
    h('span', {}, 'That did not work. The rest of the app is still fine.'),
    h('button', { class: 'update-toast-btn', onclick: () => { toast.remove(); go('#feedback'); } }, 'Report'),
    h('button', { class: 'update-toast-x', 'aria-label': 'Dismiss', onclick: () => toast.remove() }, '✕'),
  ]);
  document.body.append(toast);
}

if (typeof window !== 'undefined') {
  window.addEventListener('error', (e) => {
    // Resource load failures (a missing image) also raise this, and they are not the
    // traveller's problem — only script errors carry an `error` object worth surfacing.
    if (!e || !e.error) return;
    recordError('script', e.error);
    showErrorToast();
  });
  window.addEventListener('unhandledrejection', (e) => {
    // An aborted fetch is this app working AS DESIGNED — util.js fetchTimeout and the
    // service worker both abort deliberately, and every caller falls back to cached data.
    // Recording those would bury the real failures under routine offline behaviour.
    const r = e && e.reason;
    if (r && (r.name === 'AbortError' || String(r.message || r) === 'timeout')) return;
    recordError('promise', r);
    showErrorToast();
  });
}

// Recovery that actually recovers. A traveller told to "reload" cannot fix a bad build,
// because the service worker is cache-first for code and will serve the same broken files
// back on every reload until a new CACHE_VERSION lands. This clears the app-code caches and
// the worker, so the next load fetches the current release.
//
// It deliberately does NOT touch mk-tiles-* or mk-tts-*: those are offline map packs and
// phrase audio the traveller chose to download, possibly over an expensive connection they
// no longer have. Wiping someone's offline maps to clear a rendering bug would be a far
// worse failure than the one being recovered from.
export async function resetAndReload() {
  try {
    const regs = await navigator.serviceWorker.getRegistrations();
    await Promise.all(regs.map((r) => r.unregister()));
  } catch { /* no worker, or unsupported */ }
  try {
    const keys = await caches.keys();
    await Promise.all(keys.filter((k) => /^mk-v/.test(k)).map((k) => caches.delete(k)));
  } catch { /* storage unavailable */ }
  location.reload();
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
// pendingPinCoords moved to js/screens/transport.js with addPinScreen (screen split).

// Shown on the Help screen and stamped into feedback messages. Keep in sync with
// CACHE_VERSION in sw.js on each release.
export const APP_VERSION = 'mk-v0.542.0';

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
  // An explicit accent wins: the eight feature-hub doors all live under one route head
  // ('hub'), so accentFor() cannot tell Money from My stuff — the group carries its own.
  const accent = x.accent || accentFor(x.hash);
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
// Which country am I reading about? A screen whose entire content is one country's rules —
// visas, scams, prices, accessibility — carried a title identical to every other country's
// version of it, so a traveller who crossed a border last week and opened "Entry & visa" had
// nothing on screen telling them whose rules these were. On a trip through four countries
// that is not a small ambiguity.
//
// The flag goes here rather than into the topbar title, for two measured reasons. At 375px
// "🇹🇭 Entry & visa" wraps the title to two lines where "Entry & visa" fits on one — and the
// interface ships in 29 languages, most of which render these titles longer than English, so
// a title that only just fits here would wrap outright in German or Russian. This line also
// says the country's NAME, which a flag alone does not: flags are recognisable, not
// self-explanatory, and a traveller who cannot yet tell the Lao flag from the Thai one is
// exactly the traveller this is for.
export function countryContextLine(cc) {
  const c = getCountry(cc);
  if (!c) return null;
  return h('p', { class: 'country-context' }, `${c.flag} ${c.name}`);
}

// The traveller's own name, once they have given one on the You screen. Everything that
// belongs to them is named after them rather than addressed as "Your" — one helper so the
// phrasebook, the dictionary, the hubs, the chips and the search index cannot drift apart.
export function whoName() { return (store.profile.name || '').trim(); }

// A screen that holds the traveller's OWN content is titled with their name once they have
// given one — "Sam’s journey", not "Your journey" (direct request, applied to all of them, not
// just the map). The nav taxonomy already did this for its rows through itemLabel(); this is
// the same rule for the screen a row opens, so the door and the room behind it agree.
// `fallback` is what the screen is called before a name exists, which is not always "Your X"
// ("Journal", "My identifier", "Saved & collections"), so it stays the caller's to state.
export function ownTitle(noun, fallback) {
  const who = whoName();
  return who ? `${who}’s ${noun}` : fallback;
}

// "Sam’s dictionary" once a name is set, "my dictionary" before that — written to read
// correctly MID-SENTENCE, which is where it is mostly used ("Translate & save to …").
export function dictionaryName() {
  const who = whoName();
  return who ? `${who}’s dictionary` : 'my dictionary';
}

// The same thing as a heading or a button label, where it starts the phrase. Now the shared
// ownTitle() — this function was the pattern every other own-content screen was given.
export function dictionaryTitle() { return ownTitle('dictionary', 'My dictionary'); }

export function topbar(title, backHash) {
  const hash = location.hash || '';
  const onSaved = hash.startsWith('#saved') || hash.startsWith('#collection');
  const onSos = hash.startsWith('#sos');
  const onSearch = hash.startsWith('#search');
  const onSettings = hash.startsWith('#settings');
  const iconBtn = (label, target, svg) =>
    h('button', { class: 'topbar-ic', 'aria-label': label, title: label, onclick: () => go(target), html: svg });
  const lang = uiLangMeta();
  return h('header', { class: 'topbar' }, [
    // The word "Back" is dropped below 420px (css/style.css) so the screen title gets its
    // width back. The chevron alone is a universally understood affordance and it keeps the
    // button's tap target; aria-label carries the full name either way, so nothing is lost
    // to a screen reader when the visible word is hidden.
    backHash ? h('button', { class: 'back', 'aria-label': 'Back', onclick: () => goBack(backHash) },
      [h('span', { 'aria-hidden': 'true' }, '‹'), h('span', { class: 'back-label' }, 'Back')]) : null,
    h('h1', {}, title),
    // Interface language. The control is the flag of the ACTIVE language, so a traveller who
    // reads no English can still see at a glance which language they are in and that tapping
    // here changes it. `data-no-i18n` keeps the translation pass off the flag itself.
    h('button', {
      class: 'topbar-ic topbar-lang', 'data-no-i18n': '',
      'aria-label': `Language: ${lang.name} — tap to change`, title: `${lang.native} — change language`,
      onclick: () => languageSheet(),
    }, lang.flag),
    // Settings: takes the slot that used to hold the online/offline toggle, by request. That
    // icon carried real weight — onboarding no longer asks whether to use data, so it was the
    // only place a traveller could see which mode they were in and change it — so the flip
    // itself moved rather than disappearing: it is now a labelled, always-reversible switch
    // inside Settings' own "📥 Offline field guide" card (js/screens/settings.js), which
    // already claimed to be "the one place the network switch is a labelled setting rather
    // than an icon."
    onSettings ? null : iconBtn('Settings', '#settings', ICON.gear),
    onSaved ? null : iconBtn('Saved & collections', '#saved', ICON.star),
    // Find anything, from anywhere — a magnifying glass rather than the full-width
    // "🔎 Search everything" button that used to sit partway down Home. Search is the
    // fastest route to any of the 56 features, and it was reachable only from one screen,
    // below the fold, in two of three trip phases.
    //
    // Settings no longer costs this row a seventh slot — it moved into the one the
    // online/offline icon used to occupy (see above), so the control count here is unchanged
    // from when the 343px/102px truncation problem this comment used to describe was fixed.
    // Settings also still keeps its place in the YOU tab's "Settings & help" section; this is
    // a second, faster route to it, not the only one.
    onSearch ? null : iconBtn('Search everything', '#search', ICON.search),
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
      h('p', { class: 'tiny muted', style: 'margin: 0 0 var(--sp-2);padding: 0 var(--sp-3)' },
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
    h('h3', { style: 'margin: 0 0 var(--sp-0h)' }, 'Choose your language'),
    h('p', { class: 'tiny muted', style: 'margin: 0 0 var(--sp-3)' }, 'Language · Sprache · Idioma · 语言 · ภาษา · ngôn ngữ'),
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

// The location card: live GPS plus a manual fallback, side by side, so a traveller is never
// stuck with a wrong or missing location. Used in three places — onboarding's own step, the
// Home hint when the resolved city is not a live fix, and #nearby's "location is off" state —
// one component, one behaviour, everywhere "where am I" can go stale or wrong.
//
// `onChange` is optional and fires only once a location actually changes (a fresh GPS fix, or
// a manual pick); the GPS button otherwise updates its own label in place rather than forcing
// a full re-render, so callers that do not need one (onboarding) do not pay for one.
export function locationFixCard(opts = {}) {
  const { onChange } = opts;
  const card = h('div', { class: 'card' });
  card.append(h('h3', {}, '📍 Use your location?'));
  card.append(h('p', { class: 'muted' },
    'Allow it and the app leads with what is good right where you are — distances, near-me, the closest help, and weather for your actual spot. It stays on your device and works offline; GPS uses your phone’s sensors, not data.'));
  if (typeof navigator !== 'undefined' && navigator.geolocation) {
    const lb = h('button', { class: 'btn block' }, getLastFix() ? '📍 Location is on' : '📍 Use my location');
    lb.onclick = async () => {
      lb.textContent = 'Locating…'; lb.disabled = true;
      try { await refreshLocation(); lb.textContent = '📍 Location is on'; if (onChange) onChange(); }
      catch { lb.textContent = '📍 Location unavailable — set it manually below'; }
      lb.disabled = false;
    };
    card.append(lb);
  } else {
    card.append(h('p', { class: 'muted' }, 'Location is not available on this device — set it manually below.'));
  }
  card.append(h('p', { class: 'muted', style: 'margin-top: var(--sp-3)' },
    'Not right, or GPS unavailable? Set your city instead — used for weather and distances until GPS updates it:'));
  card.append(locationSelect(spotKey(focusSpot().spot), (key) => {
    const s = spotForKey(key);
    if (s) { setFocusSpot(s); if (onChange) onChange(); }
  }));
  return card;
}

// A quick modal wrapper around locationFixCard, for correcting location from anywhere outside
// onboarding — mirrors languageSheet()'s own modal wiring exactly, so the two "fix something
// about how the app sees me" entry points behave identically.
export function locationSheet() {
  let close = null;
  const backdrop = h('div', { class: 'sheet-backdrop center' });
  const dialog = h('div', { class: 'sheet loc-sheet', role: 'dialog', 'aria-label': 'Set your location' }, [
    locationFixCard({ onChange: () => { if (close) close(); render(); } }),
    h('div', { class: 'confirm-actions' }, [
      h('button', { class: 'btn ghost', onclick: () => close && close() }, 'Close'),
    ]),
  ]);
  backdrop.append(dialog);
  backdrop.addEventListener('click', (e) => { if (e.target === backdrop) close && close(); });
  close = openModal(backdrop);
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
  hub: '#home',
  everything: '#me',
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


// ---- Automatic section folding -----------------------------------------------------------
// Every screen's top-level cards become collapsible, here, once, instead of each screen
// remembering to do it. Home had a full folding system and a "Minimise all" control; the other
// forty screens did not, so "all the sections should minimise and maximise" was true on exactly
// one of them. Settings ran to nine stacked cards, Emergency nine, Border crossings eight —
// all of them a single unbroken scroll.
//
// Rules, deliberately conservative:
//  - only DIRECT children of the screen root that carry the .card class and contain an <h2>
//    (or, failing that, an <h3>), so nothing nested and nothing without a real heading is
//    touched. h3 counts because whole screens name their sections that way — the You hub is
//    built entirely of h3 cards, and every one of them was uncollapsible for that reason
//    alone. The heading LEVEL is a typographic choice; whether a card is a section is not;
//  - a screen with fewer than two of them is left alone — folding a lone card buys nothing and
//    costs a tap;
//  - `data-nofold` on a card opts it out;
//  - everything starts OPEN, so no traveller loses sight of anything they had before. The state
//    is per-screen-per-heading and remembered, so a section closed once stays closed.
//
// Where the heading shares a row with a control (Settings does this a lot — "Live translate"
// beside its switch) the whole row becomes the summary and the control keeps working: its
// clicks are stopped from reaching the <summary>, which would otherwise toggle the fold.
function sectionFoldPrefs() {
  const p = store.profile.prefs;
  const m = p.sectionFolds || (p.sectionFolds = {});
  // Only CLOSED sections are worth recording — open is the default. Early builds of this
  // wrote `true` for every section of every screen the traveller opened, because inserting a
  // <details open> into the document fires a toggle event: hundreds of entries all saying
  // "this is how it already was", and a localStorage write on every render to say it.
  for (const k in m) if (m[k] !== false) delete m[k];
  return m;
}

// Writes only a real change, and only a closure. Without the equality check every render
// would hit localStorage once per section for no reason at all.
function rememberFold(key, open) {
  const m = sectionFoldPrefs();
  if (open) { if (m[key] === undefined) return; delete m[key]; }
  else { if (m[key] === false) return; m[key] = false; }
  save();
}

// The OTHER long-screen shape: a bare <h2> at screen level followed by however many cards
// belong under it, then the next <h2>. Border crossings is eight of these back to back
// ("Thailand ↔ Laos", "Thailand ↔ Cambodia", …), which is one continuous scroll with no way
// to skip a country pair you are nowhere near. Each heading plus everything up to the next
// heading becomes one fold. Runs first, so the card pass below only ever sees what is left at
// screen level and nothing gets folded twice.
function foldHeadingRuns(root, routeKey) {
  const prefs = sectionFoldPrefs();
  // Turn `head` plus `body` into one remembered fold, replacing `replace` in the document.
  const foldInto = (head, body, replace) => {
    const label = (head.textContent || '').trim();
    if (!label || !body.length) return;
    const key = `${routeKey}:${label.slice(0, 40)}`;
    const det = h('details', { class: 'foldcard autofold autofold-run' });
    if (prefs[key] !== false) det.setAttribute('open', '');
    det.append(h('summary', { class: 'foldcard-sum' }, label));
    body.forEach((n) => det.append(n));
    det.addEventListener('toggle', () => rememberFold(key, det.open));
    replace.replaceWith(det);
  };

  // A screen that wraps a heading and its body in a <section> hides that heading from the
  // root-level pass below, which only looks at root's OWN children. Explore builds several of
  // its blocks that way — "Right now, seasonally" and "You might not know" among them — and
  // every one of them stood permanently expanded while the rest of the screen folded, with no
  // arrow to suggest otherwise. Same treatment, one level in: the <section> becomes the fold.
  // Runs before the root pass so a section is never also caught by it.
  for (const sec of [...root.children]) {
    if (sec.tagName !== 'SECTION' || sec.hasAttribute('data-nofold')) continue;
    const head = sec.firstElementChild;
    if (!head || head.tagName !== 'H2' || head.hasAttribute('data-nofold')) continue;
    foldInto(head, [...sec.children].slice(1), sec);
  }

  const kids = [...root.children];
  const heads = kids.filter((el) => el.tagName === 'H2' && !el.hasAttribute('data-nofold'));
  // Two or more headings are obviously a section list. ONE heading is usually a screen title
  // and folding it would be wrong — unless it carries .home-section, which this codebase puts
  // on section headings specifically and never on a screen title. That single case is why the
  // You hub's "🗂️ Everything else" (544px of doors) stayed uncollapsible while everything
  // around it folded.
  if (!heads.length) return;
  if (heads.length < 2 && !heads[0].classList.contains('home-section')) return;
  for (const head of heads) {
    // The run stops at the next heading — and also at anything that is plainly a page-level
    // trailer rather than part of this section. Without that, collapsing the You hub's last
    // heading would also hide the backup prompt and the on-device privacy line that follow it.
    const body = [];
    for (let n = head.nextElementSibling; n; n = n.nextElementSibling) {
      if (n.tagName === 'H2' || n.hasAttribute('data-nofold')
        || (n.classList && (n.classList.contains('disclaimer') || n.classList.contains('backup-line')))) break;
      body.push(n);
    }
    foldInto(head, body, head);
  }
}

function autoFoldSections(root) {
  if (!root || !root.children) return;
  const routeKey = (location.hash || '#home').replace(/^#/, '').split(/[-?]/)[0] || 'home';
  foldHeadingRuns(root, routeKey);
  // Screen level, plus one step into any UNSTYLED grouping div a screen used to bundle its
  // cards (Transport does this). A div with no class of its own is a pure container, so its
  // children are still screen-level sections as far as the traveller is concerned. Anything
  // with a class is a real component and is left alone.
  const level = [...root.children];
  for (const el of root.children) {
    if (el.tagName === 'DIV' && !el.className && !el.hasAttribute('data-nofold')) level.push(...el.children);
  }
  // First h2 if the card has one, else its first h3 — but never an h3 that is merely the
  // first sub-heading underneath an h2, which is why the h2 is looked for first and wins.
  const headingOf = (el) => el.querySelector('h2') || el.querySelector('h3');
  const cards = level.filter((el) => el.classList && el.classList.contains('card')
    && el.tagName !== 'DETAILS' && !el.hasAttribute('data-nofold') && headingOf(el));
  // "Fewer than two is left alone" is right on a screen with nothing else to compare against —
  // folding a lone card buys nothing and costs a tap. It is wrong once the screen ALREADY has
  // folds, which is what the heading pass above and the screens' own <details> produce: the
  // You hub ended up with two folded sections and one card that stubbornly would not, purely
  // because it was the only .card left by the time this pass ran. Count what is already
  // foldable, so a lone card joins a folding screen and still stays put on a flat one.
  const already = root.querySelectorAll(':scope > details.autofold, :scope > details.home-group-d').length;
  if (cards.length + already < 2) return;
  const prefs = sectionFoldPrefs();
  for (const card of cards) {
    const head = headingOf(card);
    if (!head || head.closest('details')) continue;
    const label = (head.textContent || '').trim();
    if (!label) continue;
    const key = `${routeKey}:${label.slice(0, 40)}`;
    // A card that lays ITS OWN children out — the You hub's quick-access grid is
    // `display: grid; grid-template-columns: 1fr 1fr` — cannot simply become the <details>,
    // because the <summary> then becomes a grid item too. That is exactly what happened: the
    // heading took the whole left column and all five chips stacked down the right one at five
    // different widths. Read the display BEFORE the card is detached, and when it lays out its
    // children, keep that layout on an inner body and leave <details> a plain block.
    let laidOut = '';
    try { laidOut = getComputedStyle(card).display; } catch { /* detached or no view */ }
    const ownLayout = laidOut === 'grid' || laidOut === 'flex'
      || laidOut === 'inline-grid' || laidOut === 'inline-flex';
    const det = h('details', { class: ownLayout ? 'card foldcard autofold' : `${card.className || ''} foldcard autofold`.trim() });
    if (prefs[key] !== false) det.setAttribute('open', '');
    // Carry over anything the screen set on the card itself (inline height, ids, data-*), or
    // folding would silently drop a screen's own styling.
    for (const a of card.attributes) if (a.name !== 'class') det.setAttribute(a.name, a.value);
    const parent = head.parentElement;
    // Lift the heading's whole row into the summary ONLY when that row is safe to put there:
    // it must sit directly in the card, and it must contain no <details> of its own. Settings
    // pairs most of its headings with an ⓘ tooltip, which IS a <details> — nesting one inside a
    // <summary> is invalid HTML, and in practice the tooltip's entire body text was being
    // concatenated onto the heading ("Live translateⓘTranslation already works with no…").
    const headRow = (parent !== card && parent.parentElement === card && !parent.querySelector('details'))
      ? parent : null;
    const sum = h('summary', { class: 'foldcard-sum' });
    if (headRow) {
      // Row moves whole, so its controls stay beside the heading. Their clicks must not reach
      // the <summary>, or operating a switch would also toggle the fold.
      headRow.remove();
      headRow.querySelectorAll('button, input, select, a, label').forEach((ctl) => {
        ctl.addEventListener('click', (e) => e.stopPropagation());
      });
      sum.append(headRow);
    } else {
      // Heading only. Anything else that shared its row stays in the body, where it is
      // reachable when the section is open and out of the way when it is not.
      head.remove();
      sum.textContent = label;
    }
    if (ownLayout) {
      // The card's own classes, minus `card` — the <details> is the box now, and two nested
      // .card boxes would draw two borders and double the padding.
      const inner = h('div', { class: (card.className || '').split(/\s+/).filter((c) => c && c !== 'card').join(' ') });
      while (card.firstChild) inner.append(card.firstChild);
      det.append(sum, inner);
    } else {
      while (card.firstChild) det.append(card.firstChild);
      det.insertBefore(sum, det.firstChild);
    }
    det.addEventListener('toggle', () => rememberFold(key, det.open));
    card.replaceWith(det);
  }
}

// One place's review, as a shareable HTML file. The builder lives in the lazy export screen
// module (js/screens/export.js); this wrapper exists so js/screens/places.js can keep asking
// main.js for it without pulling that module into its own graph. It goes through
// loadScreenMod rather than a bare `await import()` because a failed dynamic import is
// recorded PERMANENTLY in the module map against that specifier — the "Share my review"
// button would then keep failing on a connection that had already recovered. loadScreenMod
// retries with a fresh query string, which is a different module-map entry.
export async function exportOnePlaceReviewHtml(id, name) {
  const m = await loadScreenMod('export');
  return m.exportOnePlaceReviewHtml(id, name);
}

export function mount(node, showTabbar) {
  const app = document.getElementById('app');
  app.innerHTML = '';
  // Insert FIRST, then fold. This used to fold the detached node "so nothing is ever seen
  // jumping from flat to folded" — but a detached element has no layout at all, and the fold
  // needs to know whether a card lays its own children out (the You hub's quick-access grid
  // does) so it can keep the <summary> out of that layout. getComputedStyle on a node outside
  // the document reports the initial value for everything, so that check silently answered
  // "block" for every card and the summary became a grid item: the heading took a whole
  // column and the chips stacked down the other one.
  //
  // Nothing flashes. Both steps run in the same task, so the browser paints once, at the end.
  app.append(node);
  try { autoFoldSections(node); } catch { /* a folding miss must never block a render */ }
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
// The same, for every city the traveller has planned a stop in — so the planning screen's
// per-stop outlook shows a real forecast wherever one exists rather than falling back to the
// month's normals for want of a fetch. Without this, only the focus city was ever cached: a
// stop eight days away, comfortably inside the forecast window, still read "shoulder season".
// maybeRefreshMany carries the same staleness, retry-gap and de-duplication rules as the
// single-spot path, and one batched request covers all the stops.
export function ensurePlannedStopsWeather() {
  if (!online()) return;
  const spots = [];
  const seen = new Set();
  (store.trip.stops || []).forEach((st) => {
    if (!st.date) return;
    const s = spotForCity(st.country, st.title) || (getCountry(st.country) ? defaultSpot(st.country) : null);
    if (!s) return;
    const k = spotKey(s);
    if (seen.has(k)) return;
    seen.add(k);
    spots.push(s);
  });
  // maybeRefreshWeather PER SPOT, deliberately, and not maybeRefreshMany: the batched call
  // fetches only CURRENT conditions (temperature and a weather code) into one shared cache
  // key, while the per-stop outlook reads `.daily` from each spot's own cache. Batching here
  // looked cheaper and fetched nothing this screen could use — every stop stayed on its
  // seasonal fallback with the requests going out regardless.
  //
  // Four is the cap: this runs on every Home render in the planning phase, one request each,
  // and the stops are in date order — so it is the four soonest that get a real forecast,
  // which is also the only range a forecast reaches. maybeRefreshWeather's own staleness
  // window and in-flight de-duplication mean repeated renders do not stack fetches.
  if (!spots.length) return;
  let repainted = false;
  spots.slice(0, 4).forEach((s) => {
    maybeRefreshWeather(s).then((r) => {
      const hash = location.hash || '';
      if (!r || repainted || !(hash === '' || hash === '#' || hash === '#home')) return;
      repainted = true;         // one repaint for the batch, not one per stop
      render();
    }).catch(() => {});
  });
}

export function ensureHomeWeather(spot) {
  if (!spot || !online()) return;
  // The staleness window, the minimum retry gap and the in-flight de-duplication that used
  // to be hand-rolled here now live in js/weather.js, so every caller gets them and they
  // cannot drift apart — Home's 30-minute rule and the forecast screen's no rule at all
  // were the same fetch under two different policies.
  maybeRefreshWeather(spot).then((r) => {
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
  // Last resort only. Every city with place records now has its own entry in WEATHER_SPOTS
  // (see the header there), so the exact match above is the normal path. This snap-to-nearest
  // -hub branch used to run for 101 cities and is what made "Places in Ninh Binh" rank Hanoi
  // venues as Nearby; it now fires only for a city named by something other than the place
  // data, where the nearest hub genuinely is the best available guess.
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
export function hideSpot(id) {
  const p = store.profile.prefs;
  p.hiddenSpots = p.hiddenSpots || [];
  if (!p.hiddenSpots.includes(id)) p.hiddenSpots.push(id);
  save();
}
export function isSpotDone(id) { return (store.profile.prefs.doneSpots || []).includes(id); }
export function toggleSpotDone(id) {
  const p = store.profile.prefs;
  p.doneSpots = p.doneSpots || [];
  if (p.doneSpots.includes(id)) p.doneSpots = p.doneSpots.filter((x) => x !== id);
  else { p.doneSpots.push(id); p.hiddenSpots = (p.hiddenSpots || []).filter((x) => x !== id); }
  save();
}
function unmarkSpotDone(id) { const p = store.profile.prefs; p.doneSpots = (p.doneSpots || []).filter((x) => x !== id); save(); }
export function unhideSpot(id) { const p = store.profile.prefs; p.hiddenSpots = (p.hiddenSpots || []).filter((x) => x !== id); save(); }
export function clearSuggestionMarks() { const p = store.profile.prefs; p.doneSpots = []; p.hiddenSpots = []; save(); }

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
// The hard rule: never invent a suitability or safety verdict. Measured across the 883 place
// records (September 2026), the data supports some dimensions and not others — kidFriendly is set
// on 480, afterDark on 208, access/stepFree on 233, scamWarnings on 766 (374 of them
// non-empty), but per-venue safety,
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
  const card = h('div', { class: 'card fit-card' }, [h('h3', {}, '🧭 For how you’re travelling')]);
  const ul = h('ul', { class: 'fit-list' });
  f.good.forEach((t) => ul.append(h('li', { class: 'fit-good' }, t)));
  f.warn.forEach((t) => ul.append(h('li', { class: 'fit-warn' }, t)));
  f.unknown.forEach((t) => ul.append(h('li', { class: 'fit-unknown' }, t)));
  card.append(ul);
  card.append(h('p', { class: 'tiny muted', style: 'margin: var(--sp-1h) 0 0' }, 'Not recorded means nobody has checked it yet — not that the answer is no. Verify anything that matters on the day.'));
  card.append(travellingAsLine());
  return card;
}

// Best-effort open/closed at the current local hour (null when hours are unknown/unparseable,
// so we never wrongly call an unknown place "closed").
export function openStateNow(p) { return isOpenNow(p.hours, new Date().getHours()); }

// Whether a place is a POOR fit for who the traveller is travelling as, with a short reason.
// Only flags what the data actually supports (kid-suitability, mobility) — it never invents a
// diet verdict for an eatery, since places carry no per-venue diet data (dishes do). Poor fits
// are sorted after good fits and tagged, never hidden.
export function placeFitReason(p, prefs) {
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
    if (outlook.hot) card.append(h('button', { class: 'btn ghost block rn-cooloff', onclick: () => go(`#pools-${ctx.country}`) }, '🏊 Cool off — pools, springs & waterfalls →'));
  }

  if (!ctx.fix) {
    // Nothing to rank yet — the location invite is the whole story. The privacy detail moves
    // behind ⓘ instead of standing as its own sentence (site-wide copy purge, W3).
    card.append(h('p', { style: 'margin: var(--sp-2) 0 var(--sp-0h)' }, meta.tip));
    card.append(h('p', { class: 'muted', style: 'margin: 0 0 var(--sp-2)' }, ['Turn on location for live picks nearby.', infoTip('Nothing is sent anywhere — this stays on your device.')]));
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
  const tipEl = h('p', { class: 'muted', style: 'margin: var(--sp-1) 0 var(--sp-2)' }, meta.tip);
  const listWrap = h('div', { class: 'rn-list' });
  const footEl = h('div', {});
  // The filters used to stand permanently open: one chip per category family present
  // (Culture, History, Nature, Outdoors, Food, Market…) plus "All" plus a price select, which
  // on a 375px screen wrapped to two or three rows and pushed the actual picks below the
  // fold. They are now behind ONE row that folds closed and names its own state, so the
  // default Home shows suggestions rather than the controls for suggestions. Every option is
  // still there, one tap away, and the summary always says what is currently applied — a
  // collapsed filter that hid an active filter would be worse than the wall it replaces.
  // Same site-wide pass as expCatPicker and the weather metric picker.
  const filterSummary = h('span', { class: 'rn-filter-state' });
  if (famsPresent.length > 1 || tiersPresent.length > 1) {
    const allChip = h('button', { class: 'chip', 'aria-pressed': catSet.size ? 'false' : 'true', onclick: () => { catSet.clear(); refreshChips(); drawPicks(); } }, 'All');
    const famChips = famsPresent.map((f) => h('button', {
      class: 'chip', 'aria-pressed': catSet.has(f.key) ? 'true' : 'false',
      onclick: () => { if (catSet.has(f.key)) catSet.delete(f.key); else catSet.add(f.key); refreshChips(); drawPicks(); },
    }, [swatch(FAMILY_COLOR[f.key]), ` ${f.emoji} ${f.label}`]));
    // The control reads as a BUTTON, not a line of text (direct request: "so users know to
    // use it and that it is clickable"). Three things do that work: the summary is styled as
    // a filled pill; the wording is one word, "Filter", instead of the sentence it was; and
    // `is-on` takes the accent whenever a filter is actually applied, so an active filter
    // announces itself from the collapsed state rather than hiding inside it. Direct node
    // reference, not a querySelector through the card — mount()'s folding re-parents the
    // card's children and would strand a lookup made from a later handler.
    const filterFold = h('details', { class: 'rn-filter-fold', 'data-nofold': '' });
    function refreshChips() {
      allChip.setAttribute('aria-pressed', catSet.size ? 'false' : 'true');
      famChips.forEach((btn, i) => btn.setAttribute('aria-pressed', catSet.has(famsPresent[i].key) ? 'true' : 'false'));
      // Keep the collapsed control honest about what is applied, so a traveller who folded
      // the panel away can still see at a glance why they are being shown these five.
      const names = famsPresent.filter((f) => catSet.has(f.key)).map((f) => f.label);
      const price = tierFilter !== 'all' ? PRICE_TIER_LABEL[tierFilter] : null;
      const on = names.length > 0 || price != null;
      filterSummary.textContent = on ? [names.join(', '), price].filter(Boolean).join(' · ') : 'All';
      filterFold.classList.toggle('is-on', on);
    }
    const panel = h('div', { class: 'rn-filter-row' }, [
      h('div', { class: 'chips' }, [allChip, ...famChips]),
      tiersPresent.length > 1 ? selectEl(
        [['all', 'Any price'], ...tiersPresent.map((t) => [t, PRICE_TIER_LABEL[t]])], tierFilter,
        (v) => { tierFilter = v; refreshChips(); drawPicks(); }, 'Filter nearby picks by price',
      ) : null,
    ]);
    // data-nofold: mount()'s automatic section folding must not wrap this a second time —
    // this <details> IS the fold. Its open/closed state is deliberately not persisted: it is
    // a control panel, not a content section, and it should reopen closed every visit.
    filterFold.append(
      h('summary', {}, [h('span', { class: 'rn-filter-lbl' }, '⚙ Filter'), filterSummary]),
      panel,
    );
    refreshChips();
    card.append(filterFold);
  }
  card.append(tipEl, listWrap, footEl);
  card.append(screenHint('Picks match the time of day, weather and the filters above — tweak them anytime. ✓ done or ✕ skip swaps in a new one.', 'About these picks'));

  // ONE location upgrade, when the picks are not coming from a real fix — either seeded from
  // the country default (no GPS, nothing focused) or ranked from an approximate position.
  //
  // These used to be two separate blocks appended to the same card: `ctx.seeded` printed "Use
  // my location for picks where you are" here, and `ctx.approx` printed "Use my exact
  // location" further down after drawPicks(). The two conditions are not exclusive — in the
  // ordinary no-GPS state BOTH are true — so the card rendered two full-width buttons, one
  // above the other, that ran the same refreshLocation() call. Merged into one, worded for
  // whichever case applies, and it keeps the geoAsked side-effect the seeded branch had.
  if ((ctx.seeded || ctx.approx) && typeof navigator !== 'undefined' && navigator.geolocation) {
    card.append(h('button', { class: 'btn ghost block rn-geo-upgrade', onclick: async (e) => {
      store.profile.prefs.geoAsked = true; save();
      e.currentTarget.textContent = 'Locating…';
      try { await refreshLocation(); } catch { /* denied/unavailable */ }
      render();
    } }, ctx.seeded ? '📍 Use my location for picks where you are' : '📍 Use my exact location'));
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
              // Categories, price tier, the profile-fit warning and the why-now reason used to
              // occupy TWO stacked rows per pick. They are all short tags of the same shape, so
              // they now share one wrapping row — five picks, five fewer rows of height, with
              // nothing dropped. Two categories rather than three keeps that row to one line
              // at 375px once a tier badge and a reason are also in it.
              h('div', { class: 'rn-tagrow' }, [
                ...cats.slice(0, 2).map((c) => catTag(c)),
                (p.budgetTier && !p.isPin) ? tierBadge(p.budgetTier) : null,
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
  // The `ctx.approx` "📍 Use my exact location" button stood here. It is folded into the single
  // location-upgrade button above (see there) — both conditions are true at once in the
  // ordinary no-GPS state, so this rendered a second identical button in the same card.
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
  // ONE way onward, at the foot of the card. This card used to be bracketed by two buttons
  // that a traveller reads as the same offer: "🧭 Things to do right now →" lifted on top of
  // it by homeNowCard (phaseNextBest), and "See more near me →" here at the bottom. Both mean
  // "show me more of this". They are now a single primary action in the place a "more" link
  // belongs — after the five picks, not before them.
  //
  // It leads to Things to do (#today), the richer of the two screens and the one that shares
  // this card's time-of-day logic. #nearby is not lost: daySuggestScreen carries its own
  // "What's near me" button (see there), so the distance-sorted list is still one tap from
  // here — rank-collapse-never-remove.
  card.append(h('button', { class: 'btn block btn-spaced', onclick: () => go(`#today-${ctx.country}`) },
    '🧭 More things to do & places near me →'));
  return card;
}

// ---- HISTORY & ORIENTATION -------------------------------------------------
// "Where you are / where you're going" always leads with a short, sourced sense of the
// place: its history, what it is known for, and when to come.
// Exported: js/screens/country-info.js reaches back in for these three (historyScreen and
// countryHistoryCard both need them, and countryHistoryCard now lives there too) — same
// reverse-import pattern as boardRow below.
export function countryHistory(cc) { return (HISTORY.countries || {})[cc] || null; }
export function cityHistory(cc, slug) { return (HISTORY.cities || {})[`${cc}-${slug}`] || null; }

export function knownForRow(tags) {
  if (!tags || !tags.length) return null;
  return h('div', { class: 'knownfor' }, tags.map((t) => h('span', { class: 'kf-tag' }, t)));
}

// Offline manual location: pick your city so distances, weather, "near me" and local
// prices all match — no GPS required. Used inline on the hub and full-screen at #setcity.
export function whereAmICard(cc) {
  const c = getCountry(cc);
  const cur = focusSpot(cc && getCountry(cc) ? cc : undefined).spot;
  return h('div', { class: 'card' }, [
    h('h2', {}, '📍 Where are you?'),
    h('p', { class: 'muted', style: 'margin: var(--sp-1) 0 var(--sp-2)' }, `Set your city so distances, weather and “near me” match where you are${c ? ' in ' + c.name : ''}. Works offline — no GPS needed.`),
    field('Your location', locationSelect(spotKey(cur), (key) => { const s = spotForKey(key); if (s) { setFocusSpot(s); render(); } })),
  ]);
}

// setCityScreen, historyScreen (+ countryHistoryCard) moved to js/screens/country-info.js —
// see that file's header comment for what stayed here and why (module split, main.js
// size-reduction pass).

export function cityAboutCard(cc, slug) {
  const hi = cityHistory(cc, slug);
  if (!hi || !hi.blurb) return null;
  const card = h('div', { class: 'card history-card' }, [h('h2', {}, `About ${hi.name}`)]);
  card.append(h('p', {}, hi.blurb));
  const kf = knownForRow(hi.knownFor); if (kf) card.append(kf);
  if (hi.bestTime) card.append(h('p', { class: 'culture-tip', style: 'margin-bottom: 0' }, `🗓 Best time: ${hi.bestTime}`));
  return card;
}

// A city's one-stop essentials: what's good at this time of day, and one-tap access to the
// info a traveller needs to BE in or GET to this place — directions, weather, language, help.
export function cityEssentials(cc, cityName, slug) {
  const c = getCountry(cc);
  const meta = PART_META[partOfDay(new Date().getHours())];
  const card = h('div', { class: 'card' }, [
    h('p', { class: 'muted', style: 'margin: 0 0 var(--sp-2)' }, `🕒 Right now: ${meta.tip}`),
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

// accessScreen moved to js/screens/country-info.js.
// Country-hub entry to the accessibility guide (prominent when the traveller has a need).
export function accessCard(cc) {
  if (!getAccessibility(cc)) return null;
  const hasNeed = (store.profile.prefs.access || []).length > 0;
  const card = h('div', { class: 'card' + (hasNeed ? ' access-focus' : '') });
  card.append(h('h2', {}, '♿ Accessibility'));
  card.append(h('p', { class: 'muted', style: 'margin: var(--sp-1h) 0' }, hasNeed
    ? 'Honest, practical guidance tailored to the needs you set — your groups come first.'
    : 'How this country works for travellers with limited mobility, low vision or hearing.'));
  card.append(h('button', { class: 'btn ghost block', onclick: () => go(`#access-${cc}`) }, 'Open the accessibility guide'));
  return card;
}

// Stayed in main.js when the noticeboard screen moved to js/screens/board.js: the family/baby
// section below renders the same row shape for its city-by-city supplies list, and that is an
// eager render path. js/screens/board.js imports it back.
export function boardRow(title, sub, tip) {
  return h('div', { class: 'board-row' }, [
    h('strong', {}, title),
    sub ? h('div', { class: 'tiny muted' }, sub) : null,
    tip ? h('div', { class: 'list-note' }, tip) : null,
  ]);
}

// babyScreen (+ DIAPER_WHERE) moved to js/screens/country-info.js.

// VISA_TYPE, LONG_STAY, freshnessNotice and visaScreen moved to js/screens/country-info.js.
// How old is a YYYY-MM or YYYY-MM-DD stamp, in days? Recomputed live on every open, so
// freshness "keeps itself up to date" without any server or manual bump.
// Exported: js/screens/country-info.js's freshnessNotice reaches back in for this — same
// reverse-import pattern as boardRow/countryHistory above.
export function dataAgeDays(dateStr) {
  if (!dateStr) return null;
  const d = new Date((String(dateStr).length === 7 ? dateStr + '-01' : dateStr) + 'T00:00:00');
  if (isNaN(d.getTime())) return null;
  return Math.floor((Date.now() - d.getTime()) / 86400000);
}

// A lighter freshness line for slower-moving reference data (prices, schedules) that has no
// single authoritative portal to deep-link. Same self-checking age logic as visa: quiet
// "verified" note while fresh, a plain "may be out of date — confirm locally" card once it
// ages past staleDays. Keeps the honest self-update promise consistent across the app.
export function freshnessLine(dateStr, noun = 'This data', staleDays = 365, label) {
  const age = dataAgeDays(dateStr);
  if (age == null) return null;
  const shown = label || dateStr;
  if (age <= staleDays) {
    return h('p', { class: 'muted', style: 'margin: var(--sp-0h) 0 var(--sp-2)' }, `✓ ${noun} verified ${shown}; the app re-checks this date on every open and flags it here once it ages.`);
  }
  const months = Math.max(1, Math.round(age / 30));
  return h('div', { class: 'card', style: 'border:1px solid var(--orange); margin: var(--sp-1h) 0' }, [
    h('strong', {}, `⚠ ${noun} may be out of date`),
    h('p', { class: 'muted', style: 'margin: var(--sp-1) 0 0' }, `Last verified ${shown} (about ${months} month${months === 1 ? '' : 's'} ago). Treat these as a guide and confirm current figures on the ground.`),
  ]);
}

export function visaCard(cc) {
  if (!getVisa(cc)) return null;
  const card = h('div', { class: 'card' });
  card.append(h('h2', {}, '🛂 Entry & visa'));
  card.append(h('p', { class: 'muted', style: 'margin: var(--sp-1h) 0' }, 'Visa-free, e-visa or visa-on-arrival, the official portal, land-border tips and overstay rules — depends on your nationality.'));
  card.append(h('button', { class: 'btn ghost block', onclick: () => go(`#visa-${cc}`) }, 'Open the entry guide'));
  return card;
}

// scamsScreen moved to js/screens/country-info.js.

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

// phaseNextBest() used to live here: one prominent phase-aware "next best action" lifted to
// the top of Home's Right-now card. Removed with its only caller — on the ground it duplicated
// the "See more near me" button at the foot of the same card (both merged into the single
// "More things to do & places near me" action there), and the planning/post phases reach the
// same destinations through phaseLead's own primary tile. Nothing referenced it afterwards.
// The .home-next-best style it used is still applied by that merged button's siblings.

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

// Stayed in main.js for the same reason as checklistFor above, which is its only caller
// here: the pre-trip countdown is an eager render path. js/screens/trip.js imports it back.
// Does the saved profile match a checklist item's `iff` descriptor? `true` means "set /
// non-empty"; a scalar matches by equality or, when the pref is an array, by membership.
export function matchesProfile(iff, prefs) {
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

// Stayed in main.js when the checklist screen moved to js/screens/trip.js: the countdown card
// below counts the traveller's outstanding pre-trip items, and that is an eager render path.
// js/screens/trip.js imports it back.
// The full checklist for a country: its own items plus any profile-matched universal items.
export function checklistFor(cc) {
  const prefs = store.profile.prefs || {};
  const base = CHECKLIST[cc] || [];
  const extra = (CHECKLIST_UNIVERSAL || []).filter((it) => matchesProfile(it.iff, prefs));
  return base.concat(extra).filter((it) => matchesProfile(it.iff, prefs));
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
    return h('div', { class: 'card companion-card', style: 'margin-top: var(--sp-2)' }, [
      h('strong', {}, '📅 Add your travel dates'),
      h('p', { class: 'muted', style: 'margin: var(--sp-1) 0 var(--sp-2)' }, 'Add your first stop with a date and Home counts down the days and surfaces what is still on your checklist.'),
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
    return h('div', { class: 'just-arrived-chip', style: 'margin-top: var(--sp-2)' }, [
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
  const card = h('div', { class: 'card companion-card', style: 'margin-top: var(--sp-2)' });
  card.append(h('div', { class: 'countdown-num' }, [h('b', {}, String(days)), ` day${days === 1 ? '' : 's'} to go`]));
  const todo = checklistFor(cc).filter((it) => !isChecked(it.id));
  if (todo.length) {
    card.append(h('p', { class: 'muted', style: 'margin: var(--sp-1h) 0 var(--sp-1)' }, `${todo.length} thing${todo.length === 1 ? '' : 's'} still on your pre-trip checklist:`));
    todo.slice(0, 3).forEach((it) => card.append(h('div', { class: 'companion-todo' }, `☐ ${it.title}`)));
    card.append(h('button', { class: 'btn ghost block btn-spaced', onclick: () => go(`#checklist-${cc}`) }, 'Open pre-trip checklist'));
  } else {
    card.append(h('p', { class: 'muted', style: 'margin: var(--sp-1h) 0 0' }, 'Your checklist is done — you are ready. Safe travels!'));
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
    return h('div', { class: 'card companion-card', style: 'margin-top: var(--sp-2)' }, [
      h('strong', {}, '📖 Welcome back'),
      h('p', { class: 'muted', style: 'margin: var(--sp-1) 0 var(--sp-2)' }, 'Turn your trip into a keepsake — a scrapbook of your journal, photos, places and spending.'),
      h('button', { class: 'btn', onclick: () => go('#scrapbook') }, 'Build your scrapbook'),
    ]);
  }
  const card = h('div', { class: 'card companion-card', style: 'margin-top: var(--sp-2)' });
  card.append(h('strong', {}, '📖 Welcome back'));
  const stat = (n, label) => h('span', { class: 'recap-stat' }, [h('b', {}, String(n)), ' ' + label]);
  const stats = [];
  if (jEntries) stats.push(stat(jEntries, jEntries === 1 ? 'journal entry' : 'journal entries'));
  if (loved) stats.push(stat(loved, loved === 1 ? 'place loved' : 'places loved'));
  if (ratedN) stats.push(stat(ratedN, ratedN === 1 ? 'place rated' : 'places rated'));
  if (stops) stats.push(stat(stops, stops === 1 ? 'stop' : 'stops'));
  if (stats.length) card.append(h('div', { class: 'recap-stats' }, stats));
  if (any && homeSum > 0) card.append(h('p', { class: 'muted', style: 'margin: var(--sp-1h) 0 0' }, `Spent ≈ ${money(Math.round(homeSum), home)}${allKnown ? '' : ' (some rates unknown)'}`));
  const unrated = (store.favorites || []).filter((id) => (getPlaceData(id).rating || 0) === 0);
  if (unrated.length) {
    const first = getPlace(unrated[0]);
    if (first) card.append(h('button', { class: 'btn ghost block btn-spaced', onclick: () => go(`#place-${first.id}`) },
      unrated.length === 1 ? `⭐ Rate ${first.name}` : `⭐ Rate ${unrated.length} places you saved`));
  }
  card.append(h('button', { class: 'btn block btn-spaced', onclick: () => go('#scrapbook') }, 'Build your scrapbook →'));
  card.append(h('button', { class: 'btn ghost block btn-spaced', onclick: () => go('#export') }, '📤 Save & share your trip (journal, reviews, photos, expenses)'));
  return card;
}

// destinationOutlookCard() lived here: a six-day forecast for the focus city, rendered inside
// the planning block. It is gone rather than merely unused — it was the SECOND copy of that
// city's weather on the planning screen (Home's own "🌦 Weather" fold has carried the full
// widget for the same city since the fold pass), and plannedStopsOutlook() above answers the
// question a planner was actually asking: what is the weather at the places I am going. Its
// two genuinely distinct touches — "best days to be outside" and the pack note — are worth
// re-adding to plannedStopsOutlook per stop if they are missed; see git history for the code.

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
  wrap.append(h('div', { class: 'home-actions', style: 'margin-top: var(--sp-3)' }, [
    h('button', { class: 'btn', onclick: () => go('#plans') }, '🧭 Plan your trip'),
    // "Best for Sam", not "Tune 'For you'" (direct request). The old label named the control
    // and not the thing it produces; this one says whose recommendations these are, and it is
    // the same possessive convention the rest of the traveller's own screens now use.
    h('button', { class: 'btn ghost', onclick: () => go('#foryou') },
      `🎯 ${whoName() ? `Best for ${whoName()}` : 'Best for you'}`),
  ]));
  // The weather card that used to sit here is GONE (direct request: it was redundant). Home's
  // own "🌦 Weather" fold already carried the full forecast widget for the SAME city, so the
  // planning screen showed one place's weather twice, in two different formats, a section
  // apart. What is not redundant — and is what a planner actually wants — is the weather for
  // the places they are going, which is now what that fold shows in this phase. See
  // plannedStopsOutlook() and js/screens/home.js.
  return wrap;
}

// The forecast for every stop the traveller has actually planned, in trip order — replacing a
// second copy of the focus city's forecast. A planner is choosing between places and dates,
// so one line per stop that can be compared beats one city in detail.
//
// Two horizons, and the card says which it is using for each stop, because the difference
// matters: inside the forecast window these are real predictions, and beyond it they are the
// month's normals from the same sourced bestM/avoidM data Explore's "when to go" uses. A
// planner shown a "forecast" for a date four months out would be reading a fiction.
const shortDate = (iso) => {
  const d = new Date(iso + 'T00:00:00');
  return isNaN(d) ? iso : d.toLocaleDateString(dateLocale(), { day: 'numeric', month: 'short' });
};

export function plannedStopsOutlook() {
  const stops = (store.trip.stops || []).filter((s) => s.date).sort((a, b) => a.date.localeCompare(b.date));
  if (!stops.length) return null;
  const card = h('div', { class: 'card home-outlook' });
  card.append(h('h2', {}, '🧳 Weather where you are going'));
  const rows = h('div', { class: 'stopwx-list' });
  const today = todayISO();
  stops.forEach((st) => {
    const spot = spotForCity(st.country, st.title) || (getCountry(st.country) ? defaultSpot(st.country) : null);
    const rec = spot ? getCachedWeather(spotKey(spot)) : null;
    const days = (rec && rec.daily) || [];
    // The stop's own arrival date, matched against the forecast we actually hold.
    const hit = days.find((d) => d.date === st.date);
    // "Sep 12–15", not "Sep 12–Sep 15": the month repeated in a range is wasted width on a
    // 375px row, and the width was coming out of the city name — which was clipping to
    // "Bang…" and "Chian…", the two things the row exists to tell you apart.
    const sameMonth = st.endDate && st.endDate.slice(0, 7) === st.date.slice(0, 7);
    const dLabel = !st.endDate || st.endDate === st.date
      ? shortDate(st.date)
      : (sameMonth ? `${shortDate(st.date)}–${Number(st.endDate.slice(8, 10))}`
                   : `${shortDate(st.date)}–${shortDate(st.endDate)}`);
    const month = Number((st.date || '').slice(5, 7)) || 0;
    let detail = null;
    if (hit) {
      // The unit once, on the high end: "75–82°F", not "75°F–82°F".
      const lo = String(fmtTemp(hit.tmin)).replace(/°[CF]$/, '');
      detail = h('span', { class: 'stopwx-fc' }, [
        h('span', { class: 'od-emoji' }, wmo(hit.code)[1]),
        h('span', {}, `${lo}–${fmtTemp(hit.tmax)}`),
        hit.rainProb != null ? h('span', { class: 'muted' }, ` ☔${hit.rainProb}%`) : null,
      ]);
    } else if (month) {
      // Beyond the forecast: the month's own verdict for that city, from history.js's
      // bestM/avoidM — sourced, and honest about being a seasonal norm rather than a forecast.
      const hi = cityHistory(st.country, citySlug(st.title || ''));
      const v = hi ? verdictFor(hi, month) : 'shoulder';
      const mark = { best: '✓ good season', avoid: '✗ poor season', mixed: '± mixed' }[v] || '· shoulder season';
      const wet = (WET_MONTHS[st.country] || []).includes(month);
      detail = h('span', { class: `stopwx-season v-${v}` }, `${mark}${wet ? ' · wet' : ''}`);
    }
    rows.append(h('button', {
      class: 'stopwx-row', onclick: () => { setFocusSpot(spot || defaultSpot(st.country)); go('#weather'); },
    }, [
      h('span', { class: 'stopwx-name' }, [
        h('span', { class: 'stopwx-city' }, st.title || (getCountry(st.country) || {}).name || '—'),
        h('span', { class: 'stopwx-date muted' }, dLabel),
      ]),
      detail || h('span', { class: 'muted tiny' }, st.date < today ? 'past' : 'no data yet'),
    ]));
  });
  card.append(rows);
  card.append(h('p', { class: 'tiny muted', style: 'margin: var(--sp-2) 0 0' },
    'Dates inside the forecast window show a real forecast; the rest show that month’s usual season for that city. Tap a stop for its full forecast.'));
  card.append(h('button', { class: 'btn ghost block btn-spaced', onclick: () => go('#trip') }, '🧳 Edit your stops →'));
  return card;
}

// One stage-appropriate situational block for Home, replacing the old one-size "right now" card
// that showed near-me picks in every stage. Planning gets the outlook/countdown hub; arrived and
// travelling get the live, now forecast-aware near-me card; post gets the return recap. This is
// the core of making Home relevant to the traveller's actual stage.
export function homeStageBlock(phase, cc) {
  if (phase === 'planning') return planningStageBlock(cc);
  if (phase === 'post') return returnRecapCard();
  // The on-the-ground phase no longer has a single stage block: its two halves are ordered
  // independently by js/screens/home.js as homeBudgetFold() then homeRightNowFold(), so that
  // Weather can sit above both and Identify below them.
  return null;
}

// A photo-forward "Signature sights" showcase for Home: iconic, highly-rated, photographed
// places across the four countries, interleaved so every country appears (≤3 each, one per
// city). Inspiration on open and a warm, premium first impression — offline, self-hosted
// images only, and every card taps through to the real place. Returns null if too few map.
export function signatureSightsStrip(cc) {
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
    // "Log an expense" is a whole form — amount, currency, note, category, monthly toggle,
    // date, submit — and it stood permanently open inside Home's Budget section, which is
    // most of that section's height for an action taken a few times a day, not on every
    // launch. Folded CLOSED by default: the traveller taps when they have something to log.
    // data-nofold because this <details> is already the fold (mount() must not re-wrap it),
    // and the state is not persisted — it should greet you closed each time.
    const logDet = h('details', { class: 'now-spend-log', 'data-nofold': '' }, [
      h('summary', {}, '＋ Log an expense'),
      expenseAddCard({ currency: cur, afterAdd: draw, compact: true }),
    ]);
    box.append(logDet);
    box.append(h('p', { class: 'tiny muted', style: 'margin: var(--sp-1h) 0 0' }, [
      spent > 0 ? `Spent today: ${money(Math.round(spent), cur)}${unknownToday ? ' (some unknown)' : ''} · ` : '',
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
// `want` lets Home pass the SAME spot it handed ensureHomeWeather(), so the fetch and the
// display can never disagree about which city Home is showing. Omitted, it behaves as before
// (the resolved "where you are" city).
export function homeWeatherCard(want) {
  const ctx = contextNow();
  const spot = want || (ctx.near ? ctx.near.spot : null);
  if (!spot) return null;
  const rec = getCachedWeather(spotKey(spot));
  if (!rec || !Array.isArray(rec.hourly) || !rec.hourly.length) return null;
  const card = wxVizCard(rec, spot);
  card.append(h('button', { class: 'btn ghost block btn-spaced', onclick: () => go('#weather') }, 'Full forecast →'));
  return card;
}

// Shared collapsible wrapper for Home's sections — same home-group-d visual language
// everywhere, so collapsibility reads as one consistent site-wide pattern rather than a
// per-section one-off. Once a traveller actually toggles one, that choice persists under its
// own pref and survives relaunches; a fold that forgets itself on every launch saves nobody
// anything, which is the entire point of the feature.
//
// Now exported, because it was private here while Home carried eleven stacked sections and
// only four of them could be folded at all. Everything else was permanently expanded, so a
// traveller who never uses a given section scrolled past it on every single launch, forever.
//
// `defaultOpen: false` is for sections that are worth offering and not worth opening unasked.
// `action` is an optional control rendered inside the summary (Back to's "Clear"); its click
// is stopped from reaching the <summary> so pressing it does not also toggle the section.
export function homeFold(label, inner, prefKey, { defaultOpen = true, action = null } = {}) {
  if (!inner) return null;
  const pref = store.profile.prefs[prefKey];
  const open = pref === undefined ? defaultOpen : pref !== false;
  const det = h('details', { class: 'home-group-d', open: open ? '' : null });
  det.addEventListener('toggle', () => { store.profile.prefs[prefKey] = det.open; save(); });
  const sum = h('summary', { class: 'home-group' }, label);
  if (action) {
    action.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); });
    sum.append(action);
  }
  det.append(sum, inner);
  return det;
}

// "Right now" and "Budget" used to be returned together, in that order, as one block — which
// meant home.js could not place anything between them or put Budget first. Home's section
// order is now Back to / Weather / Budget / Right now / Identify / Where you are (per direct
// request), so each is its own exported fold and js/screens/home.js appends them in order.
// homeNowCard() is gone; homeStageBlock no longer covers the on-the-ground phase at all.
export function homeRightNowFold(phase, cc) {
  const ctx = contextNow();
  const card = homeRightNowCard(ctx);
  const head = card.firstChild;                  // .rn-head; the checklist nudge slots in just below it
  // The weather ring used to insert itself here (top of this card) — now rendered by home.js
  // as its own standalone foldable, swapped in placement with "Search everything" instead.
  // phaseNextBest's "🧭 Things to do right now →" used to be lifted in here too. It read as
  // the same offer as the "See more near me →" button at the card's foot, so the two merged
  // into one action at the foot — see the end of homeRightNowCard.
  //
  // A `phase === 'planning'` checklist nudge used to be inserted here as well. It was already
  // unreachable before this split and had never once rendered: homeStageBlock routed the
  // planning phase to planningStageBlock() and only ever passed 'traveling' down to this
  // code, so the branch could not run. Planning's checklist nudge is the one that does show,
  // from tripCountdownCard() inside planningStageBlock. `phase` is still taken as a parameter
  // because the fold is phase-labelled by its caller and may want it again.
  // Migrate the two old independent fold prefs (from when "Right now" and "Nearby picks" were
  // separate collapsibles) into this merged card's single pref, once — an existing traveller's
  // choice is honoured (open if either was open), never silently reset. See W1.
  if (store.profile.prefs.homeRightNowOpen === undefined
      && (store.profile.prefs.rightNowHeadOpen !== undefined || store.profile.prefs.rightNowPicksOpen !== undefined)) {
    store.profile.prefs.homeRightNowOpen = (store.profile.prefs.rightNowHeadOpen !== false) || (store.profile.prefs.rightNowPicksOpen !== false);
    save();
  }
  return homeFold('🕒 Right now', card, 'homeRightNowOpen');
}

export function homeBudgetFold(cc) {
  return homeFold('💰 Budget', quickSpendRow(cc), 'homeBudgetOpen');   // one-tap spend (high-value daily action)
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
export function nameEntryCard() {
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
    h('h2', {}, '👋 What should we call you?'),
    h('p', { class: 'muted', style: 'margin-top: 0' }, 'Personalises this section and your journal exports. Optional — skip any time; add it later from here or Settings.'),
    input,
  ]);
}


// ---- FEATURE HUBS (one door per group in js/nav-groups.js) -------------------
// Eight screens rendered from one manifest, instead of the same destinations hand-listed on
// Home, You, Explore and #everything under four sets of names. See js/nav-groups.js for why.
//
// A door earns more than a label when it can show a live figure, so the features that HAVE
// one show it on the row itself. These are the same numbers Home's Quick access row and
// You's chips already compute — read through this one table rather than re-derived per
// screen, which is what let "Budget" show a percentage in one place and a raw total in
// another. Anything absent from the table simply shows its blurb. Wrapped in try/catch as a
// whole: a status line is decoration, and must never be the reason a hub fails to render.
// ---- Home's Quick access chips: what MAY appear, and what does by default ----------
// Home shows exactly four chips out of the box — Calendar, Budget, Weather (Scrapbook in the
// post phase) and Journal. That is deliberate and it is the cap: a quick-access row is only
// quick while it is short, and an auto-growing row of everything with a number attached is
// just the feature list again. Anything beyond those four is opt-in, chosen by the traveller
// in Settings → Home screen, and nothing is added on their behalf.
//
// One table, read by both Home's row and the Settings editor, so the two can never drift.
// `live` is the liveStatus() key for the figure shown under the label, where there is one.
// `own` is the possessive noun for the chips that point at the traveller's OWN content, the
// same convention nav-groups.js uses (see itemLabel there). Without it these chips said
// "Journal" and "Budget" while the rows immediately below them on the You screen said
// "Sam's journal" and "Sam's budget" — the same destination under two names, on one screen.
// A chip with no `own` is not the traveller's (Weather, Travel circle, Shared with you).
export const QUICK_CHIPS = [
  { key: 'calendar', ic: '📅', label: 'Calendar', own: 'calendar', hash: '#calendar', live: 'calendar' },
  { key: 'budget', ic: '💰', label: 'Budget', own: 'budget', hash: '#expenses', live: 'budget' },
  { key: 'weather', ic: '🌤', label: 'Weather', hash: '#weather', live: 'weather' },
  { key: 'journal', ic: '📔', label: 'Journal', own: 'journal', hash: '#journal', live: 'journal' },
  { key: 'rate', ic: '💱', label: 'Currency converter', hash: '#currency', live: 'rate' },
  { key: 'saved', ic: '⭐', label: 'Saved places', own: 'saved places', hash: '#saved', live: 'saved' },
  { key: 'identified', ic: '🔍', label: 'My identifier', own: 'identifier', hash: '#identified', live: 'identified' },
  { key: 'phrases', ic: '💬', label: 'Your dictionary', own: 'dictionary', hash: '#dictionary', live: 'phrases' },
  { key: 'inbox', ic: '📥', label: 'Shared with you', hash: '#inbox', live: 'inbox' },
  { key: 'circle', ic: '👥', label: 'Travel circle', hash: '#circle', live: 'circle' },
];

// A chip's visible label: named after the traveller where the thing is theirs. Accepts a key
// or the table row itself.
//
// This is the PLAIN-NAME label only. Calendar and Budget replace it outright with a live
// figure once there is one — "Day 3", "18% spent" — and those must not be personalised, since
// "Sam’s 18% spent" is not a phrase. So callers use this for the fallback name and let the
// figure win where a figure exists, which is exactly the behaviour those two chips already had.
export function quickChipLabel(keyOrDef) {
  const def = typeof keyOrDef === 'string' ? QUICK_CHIPS.find((c) => c.key === keyOrDef) : keyOrDef;
  if (!def) return '';
  const who = whoName();
  return (who && def.own) ? `${who}’s ${def.own}` : def.label;
}
export const QUICK_CHIPS_DEFAULT = ['calendar', 'budget', 'weather', 'journal'];

// The traveller's chosen chips, or the default four. Unknown keys are dropped (so a renamed
// or removed feature degrades to absence rather than a dead chip), and an empty or malformed
// selection falls back to the default rather than leaving Home with no quick access at all.
export function quickChipKeys() {
  const sel = store.profile.prefs.quickChips;
  if (!Array.isArray(sel)) return QUICK_CHIPS_DEFAULT.slice();
  const valid = sel.filter((k) => QUICK_CHIPS.some((c) => c.key === k));
  return valid.length ? valid : QUICK_CHIPS_DEFAULT.slice();
}

// Exported: js/screens/home.js's Quick access row reads the same table for any chip beyond
// the four it computes richer figures for itself, so a figure can never disagree between
// Home's chip and the hub row for the same feature.
export function liveStatus(id) {
  try {
    switch (id) {
      case 'budget': {
        const sp = tripSpendHome();
        const target = budgetTarget();
        if (target && sp.sum > 0) {
          const span = tripSpanDays();
          const rate = span && span.elapsed > 0 ? sp.sum / span.elapsed : sp.sum;
          if (target.per === 'trip') {
            const pct = Math.round(sp.sum / target.amount * 100);
            const cls = sp.sum > target.amount ? 'budget-red'
              : (span && span.total && rate * span.total > target.amount) ? 'budget-yellow' : 'budget-green';
            return { sub: `${pct}% spent`, cls };
          }
          const pct = Math.round(rate / target.amount * 100);
          const cls = rate > target.amount ? 'budget-red' : rate >= target.amount * 0.9 ? 'budget-yellow' : 'budget-green';
          return { sub: `${pct}% of daily budget`, cls };
        }
        if (sp.any && sp.sum > 0) return { sub: `${Math.round(sp.sum).toLocaleString()} ${sp.home}${sp.allKnown ? '' : '+'}` };
        return null;
      }
      // The live rate for where you are, against your own home currency — the single figure
      // the converter exists to give. Silent when the two are the same currency, and when
      // the cached table is still the approximate fallback, so this never presents a
      // hardcoded guess as a rate (see js/currency.js on why that mattered).
      case 'rate': {
        const rates = getRates();
        if (!rates.live) return null;
        const home = homeCurrency();
        const c = getCountry(getActiveCountry());
        const local = c && c.currency;
        if (!local || !home || local === home) return null;
        const n = convert(1, home, local);
        if (!(n > 0)) return null;
        return { sub: `1 ${home} ≈ ${n >= 500 ? Math.round(n).toLocaleString() : n.toFixed(2)} ${local}` };
      }
      case 'calendar': {
        const startISO = tripStartISO();
        if (!startISO) return null;
        const d = daysUntilISO(startISO);
        return { sub: d <= 0 ? `Day ${1 - d}` : `${d} ${d === 1 ? 'day' : 'days'} to go` };
      }
      case 'weather': {
        const spot = focusSpot().spot;
        const wx = spot ? getCachedWeather(spotKey(spot)) : null;
        if (!wx || typeof wx.tempNow !== 'number') return null;
        return { sub: `${spot.city} ${fmtTemp(wx.tempNow)}` };
      }
      case 'journal': { const n = store.journal.entries.length; return n ? { sub: `${n} ${n === 1 ? 'entry' : 'entries'}` } : null; }
      case 'saved': { const n = (store.favorites || []).length; return n ? { sub: `${n} saved` } : null; }
      case 'phrases': { const n = countSavedPhrases(); return n ? { sub: `${n} saved` } : null; }
      case 'identified': { const n = idPinCount(); return n ? { sub: `${n} saved` } : null; }
      case 'contributions': { const l = gamify.levelInfo(gamify.contributionPoints(store)); return { sub: `${l.emoji} ${l.title}` }; }
      case 'circle': { const n = unreadMessagesCount(); return n ? { sub: `${n} unread`, cls: 'budget-red' } : null; }
      case 'inbox': { const n = unreadInboxCount(); return n ? { sub: `${n} new`, cls: 'budget-red' } : null; }
      default: return null;
    }
  } catch { return null; }
}

// A group's total badge count for its door: only the two things a traveller would want
// chased — someone waiting on a reply, and something shared with them.
function groupBadge(group) {
  if (group.id !== 'people') return 0;
  try { return unreadInboxCount() + unreadMessagesCount(); } catch { return 0; }
}

// One directory row: icon, the feature's ONE name, its live figure when it has one, and a
// line saying what you actually get. The blurb is folded into the accessible name, so a
// screen reader hears the same description a sighted traveller reads.
export function hubRow(item, cc, accent) {
  const live = item.live ? liveStatus(item.live) : null;
  const name = itemLabel(item, whoName());
  const label = live && live.sub ? `${name} · ${live.sub}` : name;
  const attrs = {
    class: 'hub-row' + (live && live.cls ? ' ' + live.cls : ''),
    onclick: () => go(resolveHash(item, cc)),
    'aria-label': item.blurb ? `${label}. ${item.blurb}` : label,
  };
  if (accent) attrs.style = `--tile-accent:${accent}`;
  return h('button', attrs, [
    h('span', { class: 'hub-ic', 'aria-hidden': 'true' }, item.ic),
    h('span', { class: 'hub-txt' }, [
      h('span', { class: 'hub-lbl' }, label),
      item.blurb ? h('span', { class: 'hub-sub' }, item.blurb) : null,
    ]),
    h('span', { class: 'hub-go', 'aria-hidden': 'true' }, '›'),
  ]);
}

// The nine doors, as one tile grid. Home, You and the all-features index all render this
// same block, so the groups read identically wherever a traveller meets them. `skip` drops
// a group the surrounding screen already covers in full (You is itself My stuff's home).
export function groupDoors(skip = []) {
  const phase = store.profile.prefs.phase || inferPhase();
  const groups = visibleGroups(phase).filter((g) => !skip.includes(g.id));
  return h('div', { class: 'grid door-grid' }, groups.map((g) => sectionTile({
    ic: g.ic, t: g.title, d: g.blurb, hash: groupHash(g.id), accent: g.accent, badge: groupBadge(g) || null,
  })));
}

// A row of features as chips: the icon and the feature's one name, nothing else. This is for
// LAUNCHING something rather than browsing it, and it is deliberately not hubRow(): six hub
// rows come to roughly 340px at 375px, which is more height than the whole consolidation
// saved on Home. The blurb still reaches a screen reader through aria-label.
export function featureChips(items, cc) {
  const who = whoName();
  return h('div', { class: 'chips' }, items.map((it) => {
    const label = itemLabel(it, who);
    return h('button', {
      class: 'status-chip', onclick: () => go(resolveHash(it, cc)),
      'aria-label': it.blurb ? `${label}. ${it.blurb}` : label,
    }, [
      h('span', { class: 'status-ic', 'aria-hidden': 'true' }, it.ic),
      h('span', { class: 'status-lbl' }, label),
    ]);
  }));
}

// Match a live hash against the manifest's hash TEMPLATES, so '#weather-vi' is recognised as
// the Weather feature whatever country the traveller happens to be in.
function routeItemFor(hash) {
  const items = navItems();
  const exact = items.find((it) => it.hash === hash);
  if (exact) return exact;
  return items.find((it) => {
    const pat = String(it.hash);
    if (!pat.includes('{cc}')) return false;
    const rx = pat.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace('\\{cc\\}', '[a-z]{2}');
    try { return new RegExp(`^${rx}$`).test(hash); } catch { return false; }
  }) || null;
}

// Record a feature the traveller actually opened, for the row below. Recorded in render()
// rather than in go() because render() is the one point EVERY arrival passes through: a tap,
// a deep link, a Back, and the GPS watcher's own direct repaint all land here, where go()
// catches only the first. A feature reached by Back is still a feature being used. Recording
// the route that is already at the front is a no-op, so the repaints cost nothing.
function rememberRoute(hash) {
  try {
    const item = routeItemFor(hash);
    if (!item) return;
    const prefs = store.profile.prefs;
    const list = Array.isArray(prefs.recentRoutes) ? prefs.recentRoutes : [];
    if (list[0] === item.hash) return;
    prefs.recentRoutes = [item.hash, ...list.filter((x) => x !== item.hash)].slice(0, 6);
    save();
  } catch { /* a convenience row is never worth breaking navigation over */ }
}

// Home's learned one-tap row. The consolidation into nine doors bought a Home a traveller can
// read at a glance, and it cost seventeen features an extra tap; the four features that kept
// one-tap access are Quick access's live chips, which are MY choice and fixed. A traveller who
// checks the phrasebook and the converter ten times a day should not pay two taps for both
// forever, so this row is theirs: the features they actually open, most recent first.
//
// Stored as the manifest's own hash TEMPLATE (with the {cc} placeholder intact), so a route
// recorded in Thailand opens the Vietnamese screen once the traveller crosses, and a feature
// that is renamed or retired simply stops resolving instead of leaving a dead chip.
export function recentRoutesRow() {
  const prefs = store.profile.prefs;
  const saved = Array.isArray(prefs.recentRoutes) ? prefs.recentRoutes : [];
  if (!saved.length) return null;
  const phase = prefs.phase || inferPhase();
  const live = new Set(visibleGroups(phase).flatMap((g) => g.items.map((it) => it.hash)));
  const all = navItems();
  const items = saved.map((hsh) => all.find((it) => it.hash === hsh))
    .filter((it) => it && live.has(it.hash)).slice(0, 4);
  if (!items.length) return null;
  const cc = getActiveCountry();
  const box = h('div', { class: 'home-recents' }, [featureChips(items, cc)]);
  // Clear rides in the summary rather than above the chips, so the whole row costs one line
  // when folded away instead of two.
  const clear = h('button', { class: 'chip ghost', 'aria-label': 'Clear recently used features',
    onclick: () => { prefs.recentRoutes = []; save(); render(); } }, 'Clear');
  // Collapsed by default (direct request). It is the first section on Home, and a shortcut
  // row is worth having available rather than standing open above today's content every
  // launch — a traveller who wants it opens it once and the choice persists.
  return homeFold('🕘 Back to', box, 'homeRecentsOpen', { defaultOpen: false, action: clear });
}

// Identify, inline, while the traveller is on the ground. Identifying a dish or a snake is a
// one-handed action performed standing in front of the thing, which is precisely when an extra
// tap costs most — and all six of these features gained one in the consolidation. Planning
// keeps the door instead: nobody identifies a bird from the sofa three months out.
export function identifyRow() {
  const group = navGroup('identify');
  if (!group) return null;
  const phase = store.profile.prefs.phase || inferPhase();
  const items = visibleItems(group, phase);
  if (!items.length) return null;
  const box = h('div', { class: 'home-identify' }, [featureChips(items, getActiveCountry())]);
  // A named way in to the whole section, at the foot of the chips (direct request: "a button
  // for identify what's around you ... that takes you to a choice of what you want to
  // identify"). The chips above ARE that choice, one tap each, and they stay — the button is
  // for the traveller who wants the section rather than one thing in it, and the hub is where
  // each entry also carries its blurb.
  box.append(h('button', { class: 'btn ghost block btn-spaced', onclick: () => go('#hub-identify') },
    '🔎 Identify what’s around you →'));
  // "Identify what's around you", not the group's bare title: the section is a question a
  // traveller asks while standing in front of something, and the heading now says so.
  // Not the group blurb either — the summary style uppercases, and "WHAT IS THIS DISH, FRUIT
  // OR BIRD?" wrapped to two shouted lines at 375px.
  return homeFold(`${group.ic} Identify what’s around you`, box, 'homeIdentifyOpen');
}

// The hub itself. Unknown id falls through to the full index rather than an error screen:
// a stale bookmark to a group that has been renamed should still land somewhere useful.
function hubScreen(id) {
  const group = navGroup(id);
  if (!group) return everythingScreen();
  const cc = getActiveCountry();
  const phase = store.profile.prefs.phase || inferPhase();
  const items = visibleItems(group, phase);
  const wrap = h('div', { class: 'screen' });
  // Title without the group emoji, unlike the doors and chips that lead here: the topbar
  // holds "‹ Back", the title, and five pinned controls, and at 375px an emoji plus an
  // uppercased "KNOW THIS COUNTRY" pushes it to three lines. The accent stripe down every
  // row below already carries the section's identity.
  wrap.append(topbar(group.title, '#home'));
  wrap.append(h('p', { class: 'muted', style: 'margin: 0 0 var(--sp-3)' }, group.intro || group.blurb));

  // Sub-headings only where a group carries more than one question — Plan & travel splits
  // into "your trip" and "when to go", which are different enough that a flat list of eight
  // reads as a wall. Its third question, how you actually travel between two places, is now
  // its own section (id 'around'). Every other group asks one question, so none of them
  // carries a heading: one per item would be noise.
  const sections = [];
  items.forEach((it) => {
    const key = it.section || '';
    const last = sections[sections.length - 1];
    if (last && last.key === key) last.items.push(it);
    else sections.push({ key, items: [it] });
  });
  sections.forEach((sec) => {
    if (sec.key) wrap.append(h('h2', { class: 'home-section', style: 'margin: var(--sp-4) 0 var(--sp-0h)' }, sec.key));
    sec.items.forEach((it) => wrap.append(hubRow(it, cc, group.accent)));
  });

  // Sideways, not back: the other eight groups as chips at the foot, so moving from Money to
  // Plan is one tap instead of Back-then-tap. This is the whole reason a hub can afford to
  // hold the long tail — nothing is ever more than two taps from anywhere.
  const others = visibleGroups(phase).filter((g) => g.id !== group.id);
  if (others.length) {
    wrap.append(h('h2', { class: 'home-section', style: 'margin: var(--sp-4) 0 var(--sp-0h)' }, 'Other sections'));
    wrap.append(h('div', { class: 'chips' }, others.map((g) => h('button', {
      class: 'status-chip', onclick: () => go(groupHash(g.id)), 'aria-label': `${g.title}. ${g.intro || g.blurb}`,
    }, [h('span', { class: 'status-ic' }, g.ic), h('span', { class: 'status-lbl' }, g.title)]))));
  }
  mount(wrap, '#home');
}

// The doorway to every feature on the site — now the nine groups plus one flat A–Z list,
// rendered from js/nav-groups.js instead of the hand-written nine folds this used to be.
// The folds and the group hubs would have shown the same rows twice; what a full index adds
// over a hub is the OTHER way of looking, so that is what it does. A traveller who knows the
// shape of the site takes a door; one who remembers only a name takes the alphabet.
//
// Two deliberate omissions, both because they are already never more than one tap away: the
// five bottom tabs (Home, Talk, You, Places, Explore) and Emergency/SOS, pinned in the
// topbar on every screen. Also omitted: detail screens reached FROM a feature rather than
// browsed TO (a specific place, event, species, message thread, saved collection).
function everythingScreen() {
  const wrap = h('div', { class: 'screen' });
  wrap.append(topbar('All features', '#me'));
  wrap.append(h('p', { class: 'muted', style: 'margin: 0 0 var(--sp-3)' },
    'Everything on the site, in nine sections. The five tabs at the bottom — Home, Talk, You, Places, Explore — and Emergency are always one tap away, so they are not repeated here.'));
  wrap.append(groupDoors());

  const cc = getActiveCountry();
  const phase = store.profile.prefs.phase || inferPhase();
  const shown = new Set(visibleGroups(phase).flatMap((g) => g.items.map((it) => it.hash)));
  const az = navItems().filter((it) => shown.has(it.hash))
    .sort((a, b) => a.label.localeCompare(b.label, 'en'));
  const list = h('div', {});
  az.forEach((it) => list.append(hubRow({ ...it, blurb: `${it.groupTitle} · ${it.blurb}` }, cc, '')));
  wrap.append(foldable(h('span', { class: 'home-section', style: 'margin: 0' }, `🔤 Every feature, A–Z · ${az.length}`), list));

  wrap.append(h('button', { class: 'btn ghost block', style: 'margin-top: var(--sp-3)', onclick: () => go('#search') },
    '🔎 Search everything'));
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
export function anchorCountry() {
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
export function fitsYourTripSection(cc) {
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
      h('p', { class: 'muted tiny', style: 'margin: var(--sp-0h) 0 0' }, l.blurb),
    ]))));
  }
  if (plans.length) {
    const top = plans[0];
    body.append(h('div', { class: 'card', style: 'margin-top: var(--sp-2)' }, [
      h('div', { class: 'row-between' }, [h('strong', {}, top.title), h('span', { class: 'muted tiny' }, `~${top.days}d`)]),
      h('p', { class: 'muted tiny', style: 'margin: var(--sp-1) 0 var(--sp-2)' }, top.summary),
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
//
// Priority 10.2 (crowds/prices): a THIRD and FOURTH line, each independently sourced and never
// merged with the weather verdict above — the interview decision was three separate axes, not
// one score, because the inputs are too uneven to defend a single number and a score buries
// the reason. Deliberately narrower than the 62-city weather tier: real, attributable crowd and
// price sourcing (Wikivoyage, Bangkok Post, official Angkor Enterprise ticket-sales figures
// reported by Cambodian outlets, Laos's own tourism-promotion site) exists for 4 countries and
// 4 cities, not 62 — see MEKONGING_REFACTOR_TODO.md Priority 10.2 for the sourcing account. A
// city override wins over its country's general figure; a country with no distinct PRICE fact
// (Laos) shows crowds alone rather than a forced or invented one — the same "no source, no
// claim" rule the weather tiers already hold to. Each line carries its own sourcesNote() rather
// than folding into the plain `lines` array, because these are recent, verifiable stats a
// traveller may want to click through to, not evergreen prose.
function crowdsAndPriceBlocks(cc, hi) {
  const country = countryHistory(cc);
  const crowds = (hi && hi.crowds) || (country && country.crowds);
  const price = (hi && hi.prices) || (country && country.prices);
  const blocks = [];
  if (crowds) blocks.push(['👥', crowds]);
  if (price) blocks.push(['💰', price]);
  return blocks.flatMap(([emoji, f]) => [
    h('p', { style: 'margin: var(--sp-1) 0' }, `${emoji} ${f.text}`),
    sourcesNote(f.sources, null, null),
  ]);
}
export function seasonalFitSection(cc, cityName, slug) {
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
    h('div', { class: 'card' }, [...lines.map((t) => h('p', { style: 'margin: var(--sp-1) 0' }, t)), ...crowdsAndPriceBlocks(cc, hi)]),
    soon.length ? h('button', { class: 'btn ghost block btn-spaced', onclick: () => go(`#events-${cc}`) }, 'All festivals & holidays →') : null,
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
// Exported so any other caller needing the route graph (the journey map's transport-mode
// inference, js/screens/journal.js) shares this one gate instead of a fourth copy of it.
let _routeGraphLoaded = false;
// Read-only accessor for the gate above. explore.js needs to know whether the graph is ready
// before it renders, and `_routeGraphLoaded` is a module `let` — not readable from another
// module — so the answer is exposed as a function rather than the binding.
export function routeGraphReady() { return _routeGraphLoaded; }
export function ensureRouteGraph(onReady) {
  if (_routeGraphLoaded) { onReady(); return; }
  loadAllCountries().then(() => { _routeGraphLoaded = true; onReady(); })
    .catch(() => { /* offline with nothing cached yet — this session stays without it */ });
}
// The Where-next chain state and its four helpers (round1, computeWhereNext,
// countryForCityName, nextChainTail) moved to js/screens/explore.js with whereNextSection
// itself. They had to move rather than be imported: `let _nextChain` cannot be assigned from
// another module, so the section that builds the chain and the state it builds into have to
// live in the same file. js/screens/nextstop.js now imports nextChainTail from explore.js.

// Explore E7 ("You might not know"): highly-rated places in cities the traveller has no
// saved place in yet — real serendipity from the actual data, not a random pick. Only
// SAVED PLACES are used as the "already knows about" signal (a reliable, structured field);
// journal entries are free-text city names and too unreliable to match safely. Omits itself
// if nothing qualifies.
export function mightNotKnowSection(cc) {
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
      h('p', { class: 'muted tiny', style: 'margin: var(--sp-0h) 0 0' }, `${p.city} · ${p.rating}★`),
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
export function regionSetFor(cc) { return REGIONS_BY_CC[cc] || null; }
export function isRegionSetLoaded(cc) { return !!REGIONS_BY_CC[cc]; }
// Fetches and caches one country's province polygons. Safe to call repeatedly and from
// several call sites at once — concurrent calls for the same country share one in-flight
// load, same idiom as loadCountry(). Every reader below (regionsMap/zonesMap/zoneAssignment/
// findProvince, and whereAmI's cross-country scan) already treats regionSetFor() returning
// null as "not loaded yet" and degrades gracefully rather than assuming synchronous data; the
// router's region-data gate (see render() below) is what actually triggers this loader for
// the two routes that render a province/zone map.
export function loadRegionSet(cc) {
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
// "You are here" on the Explore maps. These are static SVG, not MapLibre, so they had no
// notion of the traveller at all — a map of the country you are standing in that does not
// say where you are standing. Drawn only from a fix the app ALREADY has (getLastFix), so
// this never prompts for permission and never starts the GPS; the live maps handle asking.
// Skipped silently when there is no fix, or when the fix falls outside this country's frame
// — a dot pinned to the edge of the wrong country is worse than no dot.
export function youAreHereMark(proj, viewBox) {
  const fix = getLastFix();
  if (!fix || typeof fix.lat !== 'number' || typeof fix.lng !== 'number') return '';
  const [x, y] = projRegionPt(proj, fix.lng, fix.lat);
  const [vx, vy, vw, vh] = String(viewBox).trim().split(/\s+/).map(Number);
  if (![x, y, vx, vy, vw, vh].every((n) => Number.isFinite(n))) return '';
  if (x < vx || y < vy || x > vx + vw || y > vy + vh) return '';
  const r = Math.max(vw, vh) / 90;
  return `<g class="you-are-here" role="img" aria-label="You are here" pointer-events="none">`
    + `<circle cx="${x}" cy="${y}" r="${r * 2.6}" fill="#2E86FF" fill-opacity="0.18"/>`
    + `<circle cx="${x}" cy="${y}" r="${r}" fill="#2E86FF" stroke="#fff" stroke-width="${r * 0.5}"/>`
    + `</g>`;
}

export function provincePathD(prov, proj) {
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
export function pointInProvince(prov, lng, lat) {
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
export const REGION_PALETTE = ['#E0663A', '#3E8E5A', '#3E7CB1', '#C9902B', '#9C5780', '#4C9A6A', '#B0567F', '#2E8FB0', '#C77D2E', '#6E7BC0', '#4E9A52', '#8A5FA8'];


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
export function provinceCentroids(set) {
  if (set._centroids) return set._centroids;
  set._centroids = set.provinces.map((pr) => {
    let sx = 0, sy = 0, n = 0;
    pr.polys.forEach((poly) => poly[0].forEach(([lng, lat]) => { sx += lng; sy += lat; n++; }));
    return { code: pr.code, lng: n ? sx / n : 0, lat: n ? sy / n : 0 };
  });
  return set._centroids;
}
export function zoneAssignment(cc) {
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
export function placesInZone(cc, zoneId) {
  const byPlace = zoneAssignment(cc);
  return allPlaces({ country: cc }).filter((pl) => byPlace.get(pl.id) === zoneId);
}

// Towns in a zone, ranked by how many places each holds. Returns [{ city, n }].
export function townsInZone(cc, zoneId) {
  const counts = {};
  placesInZone(cc, zoneId).forEach((pl) => { if (pl.city) counts[pl.city] = (counts[pl.city] || 0) + 1; });
  return Object.keys(counts).sort((a, b) => counts[b] - counts[a]).map((city) => ({ city, n: counts[city] }));
}


// The MONTHS a traveller is asking about on the region chooser — a set, not a single month
// (direct request: "users should be able to choose more than one month at a time"). A trip is
// rarely one calendar month, and "is October or November better for the north" is a question
// the single-month version could not be asked. Empty means nothing chosen, and that state now
// means something: no verdict is shown at all until the traveller names a month, because a
// verdict against today's date that they never asked for is a claim about a trip they may not
// be taking. Session-only — a browsing filter, not a preference worth persisting.
// zoneMonths (the month multi-select behind the region verdicts) moved to
// js/screens/explore.js — same reason: the code that mutates it went there.



// zoneWhenLine() — the single-month verdict label — lived here. It is superseded by
// zoneWhenAcross() below, which does the same job for a SET of months and, when they
// disagree, names which are good and which are not rather than collapsing to "mixed". Its
// editorial point still holds and still applies there: js/data/zones.js only puts a month in
// bestM/avoidM when its own prose recommends or warns, so "mixed" and "shoulder" BOTH mean
// "read the sentence" — a bare badge would be worse than none, because Vietnam's Central
// Coast in September is a typhoon shoreline and a pleasant highland in the same breath.






// The front door: a stylised, offline SVG map of mainland Southeast Asia. Each of the
// four countries is a distinct colour and is tappable to enter its hub. No tiles, no
// network — this always works. (The pannable street map with GPS lives on #map.)
// Retro-modern palette: terracotta, plum, marigold, sage — distinct from the teal sea
// and from each other; white labels read on all four.
export const REGION_COLORS = { th: '#C25E3A', vi: '#9C5780', kh: '#E0A526', la: '#6E9A52' };


// Per-country hub reached after picking a country.
// (The "chapter opener" hero photo band that used to sit here — countryHeroBand() — was
// removed: Explore now leads with the map, not a photo, so it had zero call sites left.)


// ---- "NEAR ME" / JUST-ARRIVED HUB -------------------------------------------
// The just-stepped-off-the-plane front door. Uses the device GPS (offline; last fix
// cached) to name where you are, order the closest places by distance, and lay out the
// first-hour essentials — shaped by your profile. Every distance is pure offline maths.
export function nearCat(p) {
  const c = p.categories || [];
  if (p.stayType || c.some((x) => ['hotel', 'stay', 'accommodation', 'guesthouse', 'homestay', 'resort', 'hostel', 'apartment'].includes(x))) return 'stay';
  if (p.isLocal || c.some((x) => ['food', 'restaurant', 'streetfood', 'market', 'cafe'].includes(x))) return 'eat';
  return 'do';
}
export function catEmoji(c) { return c === 'eat' ? '🍜' : c === 'stay' ? '🛏' : '🎫'; }

// First-hour essentials, lightly tailored to the traveller's party/budget. The first hour
// happens once, so this is FEATURED (open) only while the traveller is in the "arrived"
// phase; afterwards it stays one tap away as a collapsed dropdown rather than always sitting
// at the top of every "near me" visit.
export function arrivalEssentials(country, featured) {
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

// arrivalScreen (+ GW_NAME, arrivalPick) moved to js/screens/arrival-info.js.

// Arrival-hub "conditions & safety now" strip — surfaces the app's live health/safety
// readouts at the moment of arrival, where they matter most: air quality and sun (UV)
// for the nearest city, a dengue-season flag for the country, and a one-tap hop to the
// nearest beach (flagged when jellyfish are in season) and to the full Health screen.
export function nearbySafetyStrip(country, fix) {
  const spot = nearestSpot(fix, country);
  const card = h('div', { class: 'card' }, [h('h3', {}, '🩺 Conditions & safety now')]);
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
    card.append(h('button', { class: 'btn ghost block btn-spaced', onclick: () => go(`#place-${b.id}`) },
      `${inSeason ? '🪼' : '🏖️'} ${near ? 'Nearest beach' : 'Closest beach'}: ${b.name} (${dl})${inSeason ? ' — jellyfish season, check first' : ' — swim & sea info'}`));
  }
  card.append(h('button', { class: 'btn ghost block btn-spaced', onclick: () => go('#danger') }, '🩹 Health & hazards'));
  return card;
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
  // The rate itself, spelled the way both currencies are actually written — "🇺🇸 $1 = 🇹🇭 ฿36".
  // The converter answers "what is this worth"; this line answers "what is the rate", which is
  // the number a traveller carries in their head all day, and it used to be nowhere on screen.
  const rateLine = h('p', { class: 'fx-rate' });
  function recompute() {
    const v = parseFloat(amount.value) || 0;
    const r = convert(v, fromSel.value, toSel.value);
    out.value = r == null ? '—' : r.toLocaleString(dateLocale(), { maximumFractionDigits: r >= 100 ? 0 : 2 });
    const one = convert(1, fromSel.value, toSel.value);
    rateLine.textContent = one == null
      ? 'Rate unavailable for this pair offline.'
      : `${currencyFlag(fromSel.value)} ${money(1, fromSel.value)} = ${currencyFlag(toSel.value)} ${money(one, toSel.value)}`;
  }
  amount.addEventListener('input', recompute);
  fromSel.addEventListener('change', recompute);
  toSel.addEventListener('change', recompute);
  // Each figure now sits on ONE line with its own currency beside it (direct request). The
  // sides used to be columns — number stacked above currency — which read as four controls in
  // two columns and made the pairing between a number and its currency something you had to
  // infer from position. Stacked from/to rows instead of side-by-side columns because at
  // 375px two inputs and two selects in a single row leaves each control about 60px wide.
  const swap = h('button', {
    type: 'button', class: 'fx-eq', title: 'Swap currencies', 'aria-label': 'Swap currencies',
    onclick: () => { const t = fromSel.value; fromSel.value = toSel.value; toSel.value = t; recompute(); },
  }, '⇅');
  const wrap = h('div', { class: 'fx-widget' }, [
    h('div', { class: 'fx-line' }, [amount, fromSel]),
    h('div', { class: 'fx-swap-row' }, [swap]),
    h('div', { class: 'fx-line' }, [out, toSel]),
    rateLine,
    opts.compact ? null : h('p', { class: 'tiny muted', style: 'margin: var(--sp-1h) 0 0' }, rates.live ? `Live mid-market rates as of ${rates.date}.` : 'Approximate rates (offline baseline) — connect and refresh to update.'),
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

  const quick = h('div', { class: 'card' }, [
    h('h2', {}, `Quick guide: ${currencyFlag(home)} ${currencySymbol(home) || home} → ${currencyFlag(local)} ${currencySymbol(local) || local}`),
  ]);
  [1, 5, 10, 20, 50, 100].forEach((n) => {
    const r = convert(n, home, local);
    quick.append(h('div', { class: 'price-item row-between' }, [
      h('span', {}, money(n, home)),
      h('strong', { class: 'fair' }, r == null ? '—' : money(r, local)),
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
export function bbCat(id) { return BB_CATS.find((c) => c.id === id) || { id: 'other', emoji: '📦', label: 'Listing', color: '#6b7280', blurb: '' }; }
// Sub-kind options per category (value + labelled option), for the item picker.
function bbSubKinds(cat) {
  if (cat === 'kids') return [['carseat', '🚼 Car seat'], ['stroller', '🍼 Stroller / pram'], ['carrier', '👶 Baby carrier'], ['toys', '🧸 Toys'], ['clothing', '🧥 Kids clothing'], ['other', '📦 Other kids item']];
  if (cat === 'gear') return [['motorbike', '🏍 Motorbike / scooter'], ['bicycle', '🚲 Bicycle'], ['camping', '⛺ Camping / trekking'], ['sim', '📶 SIM / e-SIM'], ['clothing', '🧥 Clothing / boots'], ['other', '🎒 Other gear']];
  return [['free', '🎁 Free / giveaway'], ['sale', '🏷 For sale'], ['wanted', '🙋 Wanted'], ['other', '📦 Other']];
}
const HOUSE_KIND = { room: 'Room / bed', place: 'Whole place', looking: 'Looking for a place' };
// fmtMoney now comes from js/currency.js — see the note there on why the private copy went.

// A listing's one-line headline and a short subline, shared by the card + import views.
export function bbHeadline(cat, d) {
  if (cat === 'swap') return `${money((d.have && d.have.a) || 0, (d.have && d.have.c) || '?')} → ${(d.want && d.want.c) || '?'}`;
  if (cat === 'ride') return `${d.from || '?'} → ${d.to || '?'}`;
  if (cat === 'house') return d.title || HOUSE_KIND[d.g] || 'Stay share';
  return d.title || 'Item';
}
export function bbSubline(cat, d) {
  if (cat === 'ride') return [d.when, d.seats ? `${d.seats} seat${d.seats === 1 ? '' : 's'}` : '', (d.price && d.price.a) ? `${money(d.price.a, d.price.c)} share` : ''].filter(Boolean).join(' · ');
  if (cat === 'house') return [HOUSE_KIND[d.g] || '', d.when, (d.price && d.price.a) ? money(d.price.a, d.price.c) : ''].filter(Boolean).join(' · ');
  if (cat !== 'swap' && d.price && d.price.a) return money(d.price.a, d.price.c);
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
export function swapCalcNodes(a, have, want) {
  if (have === want) return [document.createTextNode('Pick two different currencies.')];
  if (!a) return [document.createTextNode('Enter an amount to see the fair mid-market value.')];
  const got = convert(a, have, want);
  if (got == null) return [document.createTextNode('No offline rate for this pair yet — open Currency with internet once to refresh.')];
  return [
    h('strong', { class: 'fair' }, `${money(a, have)} ≈ ${money(got, want)}`),
    document.createTextNode(` at mid-market. A money changer usually keeps ~3–7%, so roughly ${money(got * 0.03, want)}–${money(got * 0.07, want)} stays between you two.`),
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
    h('h2', {}, '📥 Got a link?'),
    inp,
    h('button', { class: 'btn ghost block btn-spaced', onclick: () => {
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
  card.append(h('h3', {}, `${meta.emoji} ${bbHeadline(cat, d)}`));
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
  card.append(h('h2', {}, `${meta.emoji} Post: ${meta.label}`));

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
      formWrap.append(h('p', { class: 'muted small', style: 'margin: var(--sp-0h) var(--sp-0h) var(--sp-2)' }, 'Pick a category above to post, or browse everything below.'));
    } else {
      formWrap.append(h('p', { class: 'muted small', style: 'margin: var(--sp-0h) var(--sp-0h) var(--sp-1h)' }, bbCat(cat).blurb));
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
  // The unit once, on the end it belongs to — the same rule range() follows for the local
  // price, and this half was not following it: Chatuchak read "(≈ $0–$24.30)", repeating the
  // symbol mid-range where no one writes it twice. range() already knows where a given
  // currency's symbol goes (leading for the dollar family and the baht, trailing for the dong
  // and the kip), so hand it the converted pair rather than formatting both ends separately.
  let approx;
  if (lo != null && hi != null && low !== high) approx = range(lo, hi, home);
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
export function cityPickGrid(cc, cities, counts) {
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
export function profileIsSet() {
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
  wrap.append(countryContextLine(getActiveCountry()));
  wrap.append(countryChips((id) => go(`#prices-${id}`)));

  const country = getCountry(getActiveCountry());
  // Live converter — merged in from the old standalone "Currency" Explore tile (now one
  // combined destination). The fuller currency screen (#currency: quick-reference table,
  // cash-swap link, manual refresh) stays reachable from here and from Home Tools.
  if (country) {
    wrap.append(h('div', { class: 'card' }, [
      h('h2', { style: 'margin: 0 0 var(--sp-2)' }, `💱 ${homeCurrency()} → ${country.currency}`),
      fxConverterControl(homeCurrency(), country.currency, { compact: true }),
      h('button', { class: 'btn ghost block btn-spaced', onclick: () => go('#currency') }, 'More currency tools →'),
    ]));
  }
  wrap.append(h('h2', { class: 'cat-title', style: 'margin-top: var(--sp-4)' }, '🏷 Fair prices'));

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
      h('h2', {}, pl.label),
      primary ? h('span', { class: 'pill-best' }, 'Suggested') : null,
    ]),
    h('div', { class: 'plan-chain' }, chain.join('  →  ')),
    h('p', { class: 'muted', style: 'margin: var(--sp-0h) 0 var(--sp-3)' }, [changes, timeStr, priceStr].filter(Boolean).join(' · ')),
  ]);
  pl.legs.forEach((l, i) => card.append(planLegRow(l, i)));
  if (pl.borders.length) card.append(h('p', { class: 'muted', style: 'margin-top: var(--sp-2)' }, `Carry your passport — ${pl.borders.length} border crossing${pl.borders.length > 1 ? 's' : ''} on this route.`));
  card.append(h('a', { class: 'btn ghost block', style: 'margin-top: var(--sp-3)', href: twelveGoUrl(chain[0], chain[chain.length - 1]), target: '_blank', rel: 'noopener' }, 'Check live times & book (12Go) ↗'));
  return card;
}

function planRouteScreen() {
  const wrap = h('div', { class: 'screen' });
  wrap.append(topbar('Journey planner', '#home'));
  wrap.append(screenHint('Chain buses, trains, boats and flights across Thailand, Laos, Cambodia and Vietnam — including overland border crossings. Times and fares are guidance and work offline.'));

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
        h('p', { style: 'margin-top: 0' }, `No bundled overland route between ${planFrom} and ${planTo} yet.`),
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

// infoScreen moved to js/screens/arrival-info.js.

// ---- SAVED / COLLECTIONS ----------------------------------------------------
function savedScreen() {
  const wrap = h('div', { class: 'screen' });
  wrap.append(topbar(ownTitle('saved places', 'Saved & collections')));

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
  create.append(h('p', { class: 'muted', style: 'margin: var(--sp-3) 0 var(--sp-1)' }, 'Or pick a quick theme'));
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
    h('button', { class: 'btn ghost block btn-spaced', style: 'justify-content:flex-start', onclick: () => go(`#place-${pin.id}`) }, `📌 ${pin.name}`)));
  wrap.append(pinsCard);

  // Places you have ticked off. This gives the near-me "done" control a home: the reset there
  // clears them all at once, whereas here you can open a place or un-mark just one.
  const doneIds = store.profile.prefs.doneSpots || [];
  if (doneIds.length) {
    const doneCard = h('div', { class: 'card' }, [h('h2', {}, `✓ Done · ${doneIds.length}`)]);
    doneCard.append(h('p', { class: 'muted', style: 'margin: var(--sp-0h) 0 var(--sp-2)' }, 'Places you have ticked off — they no longer show in your near-me suggestions. Tap ↩ to put one back.'));
    doneIds.slice().reverse().forEach((id) => {
      const p = resolveItem(id);
      const name = p ? p.name : id;
      doneCard.append(h('div', { class: 'rn-item', style: 'margin-top: var(--sp-2)' }, [
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
  return h('button', { class: 'btn ghost block', style: 'margin-bottom: var(--sp-2); justify-content:space-between', onclick: onClick }, [
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
    wrap.append(h('div', { class: 'card stack-2' }, [
      h('button', { class: 'btn ghost block',
        onclick: () => { promptAction({ title: 'Rename collection', label: 'Name', value: coll.name, placeholder: 'e.g. Beaches worth the ferry', confirmLabel: 'Rename', maxLength: 40 }).then((name) => {
          // null = cancelled; '' = cleared, which renameCollection treats as "keep the old
          // name" rather than leaving the traveller with an unnamed, unfindable collection.
          if (name == null || !name) return;
          renameCollection(coll.id, name); go(`#collection-${coll.id}`);
        }); } }, 'Rename collection'),
      h('button', { class: 'btn ghost block danger-outline',
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
    h('p', { class: 'tiny muted', style: 'margin: var(--sp-0h) 0' }, km != null
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
    (p.coords || p.mapQuery) ? h('a', { class: 'btn ghost block btn-spaced',
      href: p.coords ? `https://www.google.com/maps/search/?api=1&query=${p.coords.lat},${p.coords.lng}`
                      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(p.mapQuery)}`,
      target: '_blank', rel: 'noopener' }, 'Open in Maps') : null,
  ]);
  if (p.sources && p.sources.length) card.append(h('p', { class: 'muted', style: 'font-size:12px;margin-top: var(--sp-1h)' }, `Source: ${p.sources.map((s) => s.org).join(', ')} · verified ${p.verified}`));
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
    wrap.append(h('h2', { class: 'cat-title', style: 'margin: var(--sp-3) var(--sp-0h) var(--sp-1h)' }, refCity ? `🏊 Nearest to ${refCity}` : '🏊 Nearest to you'));
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
      wrap.append(h('h2', { style: 'margin: var(--sp-4) 0 var(--sp-1h)' }, city));
      groups[city].forEach((p) => wrap.append(poolCard(p, null)));
    });
  }
  mount(wrap, '#home');
}

function crossingsScreen() {
  const wrap = h('div', { class: 'screen' });
  wrap.append(topbar('Borders', '#places'));
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
  wrap.append(h('div', { class: 'chips', style: 'margin: var(--sp-0h) 0 var(--sp-1)' }, COUNTRIES.filter((c) => getVisa(c.id)).map((c) =>
    h('button', { class: 'chip', onclick: () => go(`#visa-${c.id}`) }, `🛂 ${c.flag} ${c.name} entry`))));
  const groups = {};
  CROSSINGS.forEach((x) => { (groups[x.pair] = groups[x.pair] || []).push(x); });
  Object.keys(groups).forEach((pair) => {
    wrap.append(h('h2', { style: 'margin: var(--sp-4) 0 var(--sp-1h)' }, pair));
    groups[pair].forEach((x) => {
      const card = h('div', { class: 'card' }, [
        h('div', { class: 'row-between' }, [h('strong', {}, x.name), h('span', { class: 'cat-tag' }, x.type)]),
        h('p', { class: 'muted', style: 'margin: var(--sp-1) 0' }, `${x.a.town} ↔ ${x.b.town}`),
        h('p', {}, [h('strong', {}, 'Hours: '), x.hours]),
        x.visa ? h('p', {}, [h('strong', {}, 'Visa: '), x.visa]) : null,
        x.notes ? h('p', { class: 'muted' }, x.notes) : null,
        x.scam ? h('div', { class: 'warn-note' }, `⚠ ${x.scam}`) : null,
        x.coords ? h('a', { class: 'btn ghost block btn-spaced', href: `https://www.google.com/maps/search/?api=1&query=${x.coords.lat},${x.coords.lng}`, target: '_blank', rel: 'noopener' }, 'Open in Maps') : null,
      ]);
      if (x.sources && x.sources.length) card.append(h('p', { class: 'muted', style: 'font-size:12px;margin-top: var(--sp-1h)' }, `Source: ${x.sources.map((s) => s.org).join(', ')} · verified ${x.verified}`));
      wrap.append(card);
    });
  });
  mount(wrap, true);
}


export function toggleSet(set, v) { if (set.has(v)) set.delete(v); else set.add(v); }
export function collToggleChip(name, emoji, onToggle) {
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
export function dietAvoidAllergens(diet) { return Diet.dietAvoidAllergens(diet || store.profile.prefs.diet || []); }
export function dietEvaluable(dietArr, av) { return Diet.dietEvaluable(dietArr || store.profile.prefs.diet || [], av); }
export function dishDietReasons(d, avoid, diet) { return Diet.dishDietReasons(d, avoid, diet || store.profile.prefs.diet || []); }
export function dishDietVerdict(d, avoid, diet) { return Diet.dishDietVerdict(d, avoid, diet || store.profile.prefs.diet || []); }

// A gentle, non-safety spice note for travellers who said they are with a baby/kids or dislike
// heat ("Not spicy at all"). This is guidance, NOT the red allergen verdict — Thai/Lao/Isan heat
// is a real surprise for little ones, and most dishes can be ordered milder.
export function dishSpiceCaution(d, prefs) {
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
    box.append(h('p', { class: 'tiny muted', style: 'margin: var(--sp-2) 0 var(--sp-1)' }, grp.group));
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
// foodScreen, dishScreen and dietEatCard now live in js/screens/food.js, and the four filter
// variables that used to sit here went with them. They had to: a module's `let` cannot be
// assigned from another module (it is a ReferenceError, not an implicit global), so leaving
// the state behind while moving the code that writes it would have broken every filter on the
// screen. The helpers below stay because main.js's own search and Home cards call them.
export function spiceLabel(s) {
  return s === 'hot' ? '🌶🌶🌶 Hot' : s === 'medium' ? '🌶🌶 Medium'
    : s === 'mild' ? '🌶 Mild' : s === 'varies' ? '🌶 Varies' : 'Not spicy';
}

// A small recognition thumbnail for list rows whose item keys into the PHOTOS registry
// (dishes, produce, wildlife). Shows the self-hosted photo when one exists (offline,
// lazy-loaded); otherwise the same calm emoji placeholder as before, so a row with no photo
// is visually unchanged. Helps a traveller match a dish / fruit / creature by sight.
export function recogThumb(item, emoji, extra) {
  const src = placePhotoSrc(item);
  const cls = extra ? ` ${extra}` : '';
  if (src) return h('img', { class: `species-photo${cls}`, src, alt: '', loading: 'lazy', decoding: 'async' });
  return h('span', { class: `species-emoji${cls}`, 'aria-hidden': 'true' }, emoji);
}

export function foodCard(d) {
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
export function idPinStar(type, id) {
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
export function idPinButton(type, id) {
  const pinned = isIdPinned(type, id);
  return h('button', {
    class: 'btn block id-pin-btn' + (pinned ? ' on' : ''),
    'aria-pressed': pinned ? 'true' : 'false',
    onclick: () => { toggleIdPin(type, id); render(); },
  }, pinned ? '★ Saved to your identifier — tap to remove' : '☆ Save to my identifier');
}



// ---- MARKET PRODUCE GUIDE (fruit / vegetable / herb) ------------------------

// weatherScreen is the #weather route handler and loads on demand; these three render a
// forecast away from that route. js/weather.js (the data service) is a different module.
import { wxVizCard, seedWeatherKey, wxDiffDays } from './weather-ui.js';


// ---- TRANSPORT SCHEDULES (curated reference, ships with the app) -------------

// ---- DAY SUGGESTIONS (weather + nearby highly-rated) ------------------------
// dayUserLoc / todoFamily / todoPlan moved to js/screens/today.js with daySuggestScreen.
export function moodLine(m) {
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
export function todoDoable(p) {
  const c = p.categories || [];
  if (p.stayType) return false;
  if (c.includes('rental') || c.includes('transport')) return false;
  return c.some((x) => TODO_DOABLE.includes(x));
}
function todoHasCat(p, list) { return (p.categories || []).some((c) => list.includes(c)); }
export function todoContext(rec, spot) {
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
export function todoScore(p, ctx, prefs, anchor) {
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
export function rnThumb(p) {
  const src = placePhotoSrc(p);
  if (src) return h('img', { class: 'rn-thumb', src, alt: '', loading: 'lazy', decoding: 'async' });
  const fam = placeFamily(p);
  return h('span', { class: 'rn-thumb ph' }, (FAMILY_META[fam] || FAMILY_META.other).emoji);
}
// A "thing to do" result card: a recognition thumbnail, coloured category tags, rating,
// distance and "why now" reason chips. Tapping opens the full detail page (with a photo).
export function todoCard(x, maxReasons) {
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
      h('div', { class: 'row-between', style: 'margin: var(--sp-0h) 0' }, [
        h('div', { class: 'cats' }, cats.slice(0, 3).map((c) => catTag(c))),
        (p.budgetTier && !p.isPin) ? tierBadge(p.budgetTier) : null,
      ]),
      rc.length ? h('div', { class: 'todo-reasons' }, rc) : null,
      h('p', { class: 'muted small', style: 'margin: var(--sp-0h) 0 0' }, [p.city, todoDistLabel(dist)].filter(Boolean).join(' · ')),
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
export function festivalsInWindow() {
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
    h('div', { class: 'muted', style: 'margin: var(--sp-0h) 0' }, `${evRange(e)}${e.lunar ? ' · date varies yearly' : ''} · ${(e.regions && e.regions[0]) || e.countryName}`),
    h('p', { style: 'margin: var(--sp-2) 0 var(--sp-1h)' }, e.blurb),
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
    // Not 'Earlier in 2026'. That literal was hard-coded, so from 1 January it labels this
    // year's past festivals with last year's number — and it would have needed re-translating
    // in 29 dictionaries every January. Each card carries its own date, so the year is
    // redundant here anyway.
    if (past.length) { listEl.append(h('h2', { class: 'cat-title' }, 'Earlier this year')); past.forEach((e) => listEl.append(eventCard(e))); }
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
    h('div', { class: 'muted', style: 'margin: var(--sp-1) 0' }, `${evRange(e)} · ${e.countryName}`),
    e.lunar ? h('div', { class: 'muted' }, '↻ Movable date — shifts each year.') : null,
    h('p', {}, e.blurb),
  ]);
  card.append(h('h3', {}, 'When'), h('p', {}, e.rule));
  card.append(h('h3', {}, 'Where'), h('p', {}, (e.regions || []).join(' · ')));
  card.append(h('h3', {}, 'What it means for you'), h('p', {}, e.impact));
  if (e.sources && e.sources.length) card.append(h('p', { class: 'muted', style: 'margin-top: var(--sp-3)' }, `Sources: ${e.sources.join('; ')}`));
  wrap.append(card);
  const addBtn = h('button', { class: 'btn block' }, 'Add to my calendar');
  addBtn.addEventListener('click', () => addEventToCalendar(e, addBtn));
  wrap.append(addBtn);
  mount(wrap, '#home');
}

// ---- NATURE FIELD GUIDE -----------------------------------------------------
let natureQuery = '';
let natureGroup = '';
// Which country the identify screens are scoped to (direct request: "identify should be by
// country"). Defaults to wherever the traveller is — see idCountry() — and '*' means all four.
// Module-level so the choice survives moving between #nature, #danger and #sounds within one
// session, which is the same reason wxMetric lives at module level in weather-ui.js.
let idCountryChoice = '';

// The country the identify screens open scoped to: the traveller's own, resolved the same way
// Places, Weather and Budget resolve theirs, so all of them agree about "where I am".
export function idCountry() {
  if (idCountryChoice) return idCountryChoice;
  const fs = focusSpot();
  return (fs && fs.spot && fs.spot.country) || getActiveCountry() || 'th';
}

// One control, used by every identify screen, so the scope reads and behaves identically on
// all of them. Deliberately a <select> and not four flag chips plus an "All": the same
// site-wide pass that collapsed the weather metrics and the expense categories — one compact
// control naming its current value, rather than a row of five buttons above every list.
// `onchange` re-renders the caller's list; the choice is remembered for the session.
export function idCountryPicker(onchange) {
  const cur = idCountry();
  const opts = [...COUNTRIES.map((c) => [c.id, `${c.flag} ${c.name}`]), ['*', '✶ All four countries']];
  const sel = selectEl(opts, idCountryChoice === '*' ? '*' : cur, (v) => { idCountryChoice = v; onchange(); },
    'Which country to identify things for');
  return h('label', { class: 'id-country-pick' }, [h('span', {}, 'Where you are'), sel]);
}
// The value to hand allSpecies()/produce filters: undefined when the traveller has asked for
// everything, so "all four" genuinely means unfiltered rather than a fifth country code.
export function idCountryFilter() { return idCountryChoice === '*' ? undefined : idCountry(); }
export function imageSearch(q) { return 'https://www.google.com/search?tbm=isch&q=' + encodeURIComponent(q); }

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
    const res = await fetchTimeout(inatSoundUrl(s), {}, 15000);
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
  const status = h('div', { class: 'muted', style: 'font-size:13px;margin-top: var(--sp-1)' });
  const btn = h('button', { class: 'btn ghost', onclick: () => playCall(s, btn, status) }, label || '🔊 Hear its call');
  return h('div', {}, [btn, status]);
}

function soundsScreen() {
  const wrap = h('div', { class: 'screen' });
  wrap.append(topbar('Sounds nearby', '#nature'));
  wrap.append(screenHint('Heard something? Tap ▶ to play the call — works offline once loaded — or tap a name for the full field guide. Only animals with a distinctive call are listed. Recordings are Creative Commons, from Xeno-canto and iNaturalist.'));

  let group = '';
  let query = '';

  const search = h('input', { class: 'search', type: 'search', 'aria-label': 'Search sounds', placeholder: 'Search by name…',
    oninput: debounce((e) => { query = e.target.value; renderList(); }, 120) });
  wrap.append(search);
  wrap.append(idCountryPicker(() => { renderChips(); renderList(); }));

  // Chips live in their own wrapper, rebuilt by renderChips() rather than computed once,
  // so the group counts pick up nature.js once it lands (see loadNature() near the top of
  // this file) instead of freezing at the empty pre-load default.
  const chipsWrap = h('div', {});
  wrap.append(chipsWrap);
  const listEl = h('div', {});
  wrap.append(listEl);

  function renderChips() {
    // Every callable species IN SCOPE, recomputed each call so the group chips show live
    // counts for the chosen country rather than for the whole region.
    const callable = allSpecies({ cc: idCountryFilter() }).filter(hasCall);
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
    const results = allSpecies({ group: group || undefined, q: query.trim() || undefined, cc: idCountryFilter() }).filter(hasCall);
    if (!results.length) { listEl.append(h('p', { class: 'empty' }, query.trim() ? 'No calls match your search.' : 'No calls in this group yet.')); return; }
    results.forEach((s) => {
      const status = h('div', { class: 'muted', style: 'font-size:13px' });
      const play = h('button', { class: 'btn ghost', 'aria-label': `Play ${s.commonName} call`, onclick: (e) => { e.stopPropagation(); playCall(s, play, status); } }, '▶');
      listEl.append(h('div', { class: 'card', style: 'display:flex;align-items:center;gap: var(--sp-3)' }, [
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
  // Scoped to one country, the traveller's own by default. Everything that lives across the
  // region still shows in every country; what drops out is what is not there — the reef and
  // open-water species for a traveller in landlocked Laos, and the dozen range-restricted
  // animals. "All four countries" is one tap away for anyone planning rather than looking.
  wrap.append(idCountryPicker(() => { renderCount(); renderList(); }));
  const countEl = h('p', { class: 'tiny muted id-country-count' }, '');
  wrap.append(countEl);

  // Group chips live in their own wrapper, rebuilt by renderChips() rather than computed
  // once, so they pick up NATURE_GROUPS once nature.js lands (see loadNature() near the
  // top of this file) instead of freezing at the empty pre-load default (just "All").
  const chipsWrap = h('div', {});
  wrap.append(chipsWrap);
  wrap.append(h('button', { class: 'btn ghost block', style: 'margin: var(--sp-1h) 0', onclick: () => go('#sounds') }, '🔊 Sounds around you — hear calls'));

  wrap.append(h('div', { class: 'card' }, [
    h('p', { class: 'muted', style: 'margin: 0 0 var(--sp-2)' }, 'Have a photo? Identify it online (needs internet):'),
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
  // Direct node reference (countEl), never a lookup through wrap — mount()'s automatic
  // section folding re-parents these children and a querySelector from here would come back
  // null on the second call.
  function renderCount() {
    const cc = idCountryFilter();
    const total = allSpecies().length;
    if (!total) { countEl.textContent = ''; return; }
    if (!cc) { countEl.textContent = `All ${total} records, across all four countries.`; return; }
    const here = allSpecies({ cc }).length;
    const c = getCountry(cc);
    countEl.textContent = here === total
      ? `All ${total} records occur in ${c ? c.name : 'this country'}.`
      : `${here} of ${total} records occur in ${c ? c.name : 'this country'} — the other ${total - here} are elsewhere in the region.`;
  }
  function renderList() {
    listEl.innerHTML = '';
    const results = allSpecies({ q: natureQuery.trim(), group: natureGroup, cc: idCountryFilter() });
    if (!results.length) {
      listEl.append(h('p', { class: 'empty' }, allSpecies().length === 0
        ? 'The nature guide is being prepared — reconnect once to download it.'
        : 'No species match here. Try a different search or group, or switch to all four countries above.'));
      return;
    }
    results.forEach((s) => listEl.append(speciesCard(s)));
  }
  renderChips();
  renderCount();
  renderList();
  if (!isNatureLoaded()) {
    const redraw = () => { renderChips(); renderCount(); renderList(); };
    loadNature().then(redraw, redraw);
  }
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
  // A dangerNote on a species that is NOT flagged dangerous is a "worth knowing" caution
  // rather than a warning — falling coconuts, a bodhi tree you must not cut, raw taro's
  // oxalate crystals, the straw-mushroom/death-cap confusion. These used to be written and
  // then silently dropped: the warn-note above renders only when `dangerous` is true, so 15
  // existing records carried advice the app never showed anyone. Shown here in the calmer
  // list-note style so a genuine hazard still reads differently from a useful heads-up.
  if (!s.dangerous && s.dangerNote) card.append(h('h3', {}, 'Worth knowing'), h('div', { class: 'list-note' }, s.dangerNote));
  const sLangs = [['th', '🇹🇭', 'th-TH'], ['vi', '🇻🇳', 'vi-VN'], ['km', '🇰🇭', 'km-KH'], ['lo', '🇱🇦', 'lo-LA']];
  if (s.names && sLangs.some(([k]) => s.names[k])) {
    card.append(h('h3', {}, 'Local names (tap 🔊 to hear)'));
    card.append(h('div', { style: 'display:flex;flex-wrap:wrap;gap: var(--sp-1h);margin: var(--sp-1) 0' },
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
    tagChips.length ? h('div', { class: 'id-edit-tags' }, tagChips) : h('div', { class: 'muted', style: 'font-size:13px;margin: var(--sp-0h) 0' }, 'No tags yet — add one to file this into a category.'),
    h('div', { class: 'id-tag-add' }, [tagInput, addBtn]),
    h('div', { class: 'id-edit-label' }, 'Note'),
    noteInput,
  ]);
  return h('div', { class: 'id-saved-block' }, [rowTop, panel]);
}

function myIdentifierScreen() {
  const wrap = h('div', { class: 'screen' });
  wrap.append(topbar(ownTitle('identifier', 'My identifier'), '#me'));
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
      h('p', { class: 'muted', style: 'margin: var(--sp-1h) 0 var(--sp-3)' },
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
      const card = h('div', { class: 'card', style: 'margin-bottom: var(--sp-3)' }, [
        h('h3', {}, `${spec.emoji} ${spec.label} · ${items.length}`),
      ]);
      items.forEach((o) => card.append(idSavedRow(type, spec, o, groupKeys)));
      wrap.append(card);
    });
  } else {
    const cats = idAllTags();
    if (!cats.length) {
      wrap.append(h('div', { class: 'card' }, [
        h('p', { class: 'muted', style: 'margin: 0' }, 'No categories yet. Switch to “By type”, tap ✎ on any item, and add a tag — your categories appear here.'),
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
      const card = h('div', { class: 'card', style: 'margin-bottom: var(--sp-3)' }, [h('h3', {}, header)]);
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
// A stop's date line: a single arrival day, or an arrive→leave range with an inclusive day count
// (so "10 days in Chiang Mai" reads as one entry). Tolerates old stops that carry only `date`.
export function stopDateLabel(s) {
  if (!s) return '';
  const from = s.date || '';
  const to = (s.endDate && s.endDate >= from) ? s.endDate : '';
  if (from && to && to !== from) return `${from} → ${to} · ${wxDiffDays(from, to) + 1} days`;
  return from || to || '';
}


// ---- BARGAIN HELPER ---------------------------------------------------------

// Budget & Expenses — extracted to js/screens/budget.js (module split; see
// js/screens/budget.js's own header comment for the extraction rationale).
// expensesScreen is not here: it is the #expenses route handler, 1.6 KB, and only the router
// calls it — it loads on demand via SCREEN_LOADERS. The helpers below render expense rows and
// the Home spend card away from #expenses, so they stay eager in their own small module.
import {
  expenseAddCard, budgetLogRow, budgetTarget, tripSpanDays, expCatLookup, expCatOf,
} from './budget-ui.js';

// ---- PRE-TRIP CHECKLIST -----------------------------------------------------


// ---- GLOBAL SEARCH (find anything offline) ----------------------------------
// searchQuery moved to js/screens/search.js with searchScreen.
// A handful of useful example searches for the empty state — each reliably hits a real
// index (place names/blurbs, phrases and price labels), so a first-time user learns what
// Search covers by tapping rather than guessing.
export const SEARCH_EXAMPLES = ['Market', 'Temple', 'Waterfall', 'Beach', 'Coffee', 'Massage', 'Hello', 'Thank you'];
// Remember a committed search term (the user acted on a result). Most-recent first,
// de-duplicated case-insensitively, capped at five. Self-defaulting pref, no store bump.
export function rememberSearch(q) {
  q = (q || '').trim();
  if (q.length < 2) return;
  const prefs = store.profile.prefs;
  const list = Array.isArray(prefs.recentSearches) ? prefs.recentSearches : [];
  const next = [q, ...list.filter((s) => s.toLowerCase() !== q.toLowerCase())].slice(0, 5);
  prefs.recentSearches = next;
  save();
}


// ---- SAFETY, MEDICAL, KOSHER & WORSHIP DATA --------------------------------
// Curated and self-hosted so every card renders fully offline. External links
// (maps, official sites) are enhancements that degrade gracefully with no signal.
// No phone numbers are hard-coded — an out-of-date emergency number is dangerous,
// so the national number (below) and the maps link (which resolves the exact
// venue live) are the source of truth. City-centre coordinates drive "nearest
// first"; they are for ordering and a map query, not a claim of a precise door.
export function mapsSearch(q) { return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`; }
export function nearestFirst(list, fix) {
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
export const KOSHER = [
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
export const VEG_SPOTS = [
  { cc: 'th', city: 'Bangkok', lat: 13.7597, lng: 100.4972, name: 'May Kaidee (Khao San)', offer: 'Thai vegan, since 1988', tags: ['vegan'] },
  { cc: 'th', city: 'Bangkok', lat: 13.7365, lng: 100.5805, name: 'Broccoli Revolution', offer: 'Plant-based, Sukhumvit / Thong Lo', tags: ['vegan'] },
  { cc: 'th', city: 'Bangkok', lat: 13.7585, lng: 100.4965, name: 'Ethos', offer: 'Vegetarian & raw, off Khao San', tags: ['vegetarian'] },
  { cc: 'th', city: 'Chiang Mai', lat: 18.7880, lng: 98.9930, name: 'May Kaidee Chiang Mai', offer: 'Thai vegan + cooking school', tags: ['vegan'] },
  { cc: 'vi', city: 'Ho Chi Minh City', lat: 10.7860, lng: 106.6990, name: 'Hum Vegetarian', offer: 'Vegetarian fine dining, District 1/3', tags: ['vegetarian'] },
  { cc: 'vi', city: 'Hanoi', lat: 21.0208, lng: 105.8490, name: 'Ưu Đàm Chay', offer: 'Vegetarian, Hoàn Kiếm (55 Nguyễn Du)', tags: ['vegetarian'] },
  { cc: 'kh', city: 'Siem Reap', lat: 13.3540, lng: 103.8560, name: 'Chamkar', offer: 'Khmer vegetarian, Old Market', tags: ['vegetarian'] },
];


// Verified pork-free phrase (kosher, halal and no-pork travellers). Only languages whose
// script is verified against a reliable source are included (Thai, Vietnamese, Lao — Lao
// from Wikivoyage); Khmer falls back to English because no reliable source confirmed the
// phrase, so nothing wrong is ever shown. Shellfish avoidance is covered by ALLERGENS.
export const DIET_PHRASES = {
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
export const KOSHER_SOURCES = [
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
        // The journey trail records EVERY fix, unlike the visit pin above which is once per
        // session: that is what lets the map fill itself in as somebody actually travels
        // through a day rather than only where they happened to launch the app. noteTrail()
        // is cheap and self-deduplicating — a fix within 2 km of a point it already holds
        // just touches that point's date — so calling it on every callback is correct.
        logTrail(next);
        const hash = location.hash || '';
        if (moved && (hash === '' || hash === '#' || hash === '#home' || hash === '#nearby' || hash === '#explore' || hash.startsWith('#places'))) render();
      },
      () => { /* denied / unavailable — the manual picker path remains */ },
      { enableHighAccuracy: true, maximumAge: 60000, timeout: 15000 },
    );
  } catch { /* noop */ }
}
// The journey trail (js/trail.js) — the traveller's own map of where they have been, built
// without them having to add a single pin. Deliberately unlike logOpenLocation below: on by
// default, at real precision, every fix rather than one a session, and never offered to any
// feed. City name comes from whereAmI() so a pin reads "Ninh Binh" rather than a coordinate.
function logTrail(fix) {
  if (!trailEnabled()) return;
  try {
    const wai = whereAmI(fix);
    noteTrail(fix, (wai && wai.country) || getActiveCountry(), (wai && wai.name) || '', todayISO());
  } catch { /* a pin is never worth breaking a location update over */ }
}

// One coarsened pin per place per day, and only when the traveller has switched it on.
// Hangs off the app-open path rather than the location watch: a pin is meant to record
// "I opened the app here", not to trace a route through the day.
let _visitLogged = false;
function logOpenLocation() {
  // The trail is recorded first and independently of the visits opt-in below, so a traveller
  // who never switched visits on still gets their journey map. A launch that reads one screen
  // and closes may never reach a watch callback, so the fix already in hand counts.
  { const f = getLastFix(); if (f) logTrail(f); }
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
  // NEVER foldable. Every other section on this screen collapses like the rest of the app,
  // but the emergency numbers must be on screen the instant this screen opens, with no
  // possibility that a traveller collapsed them weeks ago and has to remember that now.
  const nums = h('div', { class: 'card sos-card', 'data-nofold': '' }, [h('h2', {}, `${c.flag} ${c.name} — call for help`)]);
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
    h('h2', {}, 'Get to a hospital'),
    infoTip('Ordered by straight-line distance from your location. Open the full screen for the rest of the country, what to do where no hospital is listed, how people actually reach one here, and your medical card.'),
  ])]);
  hosp.append(h('button', { class: 'btn block', onclick: () => go(`#hospital-${getActiveCountry()}`) }, '🏥 Get to a hospital — full guide'));
  const hospPhrase = emCat && (emCat.phrases.find((p) => /hospital/i.test(p.en)) || emCat.phrases.find((p) => /doctor/i.test(p.en)));
  if (hospPhrase) hosp.append(h('button', { class: 'btn ghost block btn-spaced', onclick: () => showBigPhrase(hospPhrase, book.locale) }, '🪧 Show “I need a hospital” to a local (works offline)'));
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
    hospSlot.append(h('p', { class: 'muted', style: 'margin: var(--sp-3) 0 var(--sp-1)' }, fix && fix.lat != null ? 'Nearest to you:' : `In ${c.name}:`));
    list.forEach((x) => hospSlot.append(h('div', { class: 'card sos-hosp', style: 'margin: var(--sp-1h) 0' }, [
      h('div', { class: 'row-between' }, [h('strong', {}, x.name), x.km != null ? h('span', { class: 'fair' }, kmLabel(x.km)) : null]),
      h('div', { class: 'muted tiny', style: 'margin: var(--sp-0h) 0 var(--sp-1)' }, x.city || x.en || ''),
      x.curated ? h('div', { class: 'chips' }, (x.tags || []).map((t) => h('span', { class: 'cat-tag' }, HOSP_TAG[t] || t))) : null,
      h('a', { class: 'btn ghost block btn-spaced', href: mapsSearch(`${x.name} ${x.city || ''}`.trim()), target: '_blank', rel: 'noopener' }, 'Open in maps ↗'),
    ])));
    hospSlot.append(h('button', { class: 'btn ghost block', onclick: () => go(`#hospital-${cc}`) }, `Every hospital in ${c.name} →`));
    retranslate(hospSlot);
  };
  paintSosHosp();
  if (!isHospitalsLoaded(getActiveCountry())) {
    const at = location.hash;
    loadHospitals(getActiveCountry()).then(() => { if (location.hash === at) paintSosHosp(); }).catch(() => { /* curated view stands */ });
  }

  // (3) What to do while getting there — bites/stings first aid, then life-saving basics.
  const danger = h('div', { class: 'card allergy-card' }, [h('div', { class: 'row-between' }, [
    h('h2', {}, '🐍 Bites, stings & dangerous wildlife'),
    infoTip('What to do first — then get to a hospital. General first aid, not a substitute for a doctor.'),
  ])]);
  FIRST_AID.forEach((fa) => {
    const dd = h('details', { class: 'filters-collapse' }, [h('summary', {}, fa.t)]);
    const inner = h('div', {});
    inner.append(h('p', { class: 'tiny', style: 'margin: var(--sp-1h) 0 0' }, [h('strong', {}, 'Do')]));
    inner.append(h('ul', { class: 'sos-aid' }, fa.do.map((li) => h('li', {}, li))));
    if (fa.dont && fa.dont.length) {
      inner.append(h('p', { class: 'tiny', style: 'margin: var(--sp-1h) 0 0' }, [h('strong', {}, 'Do not')]));
      inner.append(h('ul', { class: 'sos-aid dont' }, fa.dont.map((li) => h('li', {}, li))));
    }
    // Read the steps aloud — hands are often busy in a bite/sting emergency.
    { const rd = readAloudBar(() => [`${fa.t}.`, 'Do:', fa.do.join('. ') + '.', (fa.dont && fa.dont.length) ? 'Do not: ' + fa.dont.join('. ') + '.' : ''].filter(Boolean).join(' ')); if (rd) inner.append(rd); }
    dd.append(inner);
    danger.append(dd);
  });
  danger.append(h('button', { class: 'btn block btn-spaced', onclick: () => go('#danger') }, '⚠️ Dangerous animals — photos & how to spot them'));

  // Life-saving essentials: honest guidance on EpiPens and defibrillators (neither is
  // reliably bought on the street here) plus hands-only CPR.
  const life = h('div', { class: 'card' }, [h('div', { class: 'row-between' }, [
    h('h2', {}, '💉 Life-saving essentials'),
    infoTip('Honest guidance on adrenaline auto-injectors and defibrillators — neither is reliably bought on the street in this region — plus hands-only CPR.'),
  ])]);
  LIFESAVING.forEach((ls) => {
    const dd = h('details', { class: 'filters-collapse' }, [h('summary', {}, ls.t)]);
    const inner = h('div', {});
    ls.body.forEach((p) => inner.append(h('p', { class: 'tiny', style: 'margin: var(--sp-1h) 0' }, p)));
    dd.append(inner);
    life.append(dd);
  });

  // (4) How to communicate once you are there — emergency phrases in the local language.
  let phraseCard = null;
  if (emCat) {
    phraseCard = h('div', { class: 'card' }, [h('div', { class: 'row-between' }, [
      h('h2', {}, `At the hospital: say it in ${book.label}`),
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
    h('p', { style: 'margin: var(--sp-1h) 0' }, [h('strong', {}, '💧 Water: '), safe.water]),
    h('p', { style: 'margin: var(--sp-1h) 0 0' }, [h('strong', {}, '🍢 Food: '), safe.food]),
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
    sInner.append(h('p', { class: 'tiny', style: 'margin: var(--sp-2) 0 0' }, [h('strong', {}, `In ${c.name}`)]));
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
    h('h2', {}, '🚨 If something happens'),
    infoTip('Tap the one that fits. Each opens what to do in the next minute, what to do in the next few hours, and the mistake people reliably make. Works offline.'),
  ])]);
  EMERGENCIES.forEach((e) => {
    const d = h('details', { class: 'filters-collapse' }, [h('summary', {}, `${e.ic} ${e.t}`)]);
    const inner = h('div', {});
    if (e.lead) inner.append(h('p', { class: 'tiny muted', style: 'margin: var(--sp-1h) 0 0' }, e.lead));
    inner.append(h('p', { class: 'tiny', style: 'margin: var(--sp-2) 0 0' }, [h('strong', {}, 'Right now')]));
    inner.append(h('ul', { class: 'sos-aid' }, e.now.map((li) => h('li', {}, li))));
    if (e.then && e.then.length) {
      inner.append(h('p', { class: 'tiny', style: 'margin: var(--sp-2) 0 0' }, [h('strong', {}, 'Then')]));
      inner.append(h('ul', { class: 'sos-aid' }, e.then.map((li) => h('li', {}, li))));
    }
    if (e.avoid && e.avoid.length) {
      inner.append(h('p', { class: 'tiny', style: 'margin: var(--sp-2) 0 0' }, [h('strong', {}, 'Do not')]));
      inner.append(h('ul', { class: 'sos-aid dont' }, e.avoid.map((li) => h('li', {}, li))));
    }
    { const rd = readAloudBar(() => [`${e.t}.`, 'Right now:', e.now.join(' '), (e.then || []).length ? 'Then: ' + e.then.join(' ') : '', (e.avoid || []).length ? 'Do not: ' + e.avoid.join(' ') : ''].filter(Boolean).join(' ')); if (rd) inner.append(rd); }
    d.append(inner);
    sit.append(d);
  });

  // Consular help, and the limits of it. Travellers routinely expect the wrong things from
  // an embassy, which wastes exactly the hours in which it could have helped.
  const emb = h('div', { class: 'card' }, [h('div', { class: 'row-between' }, [
    h('h2', {}, '🏛 Your embassy'),
    infoTip('Consular help is free and is the right first call for a lost passport, an arrest, a death or a large-scale emergency. Find yours and save the address now — searching for it during the emergency is the part that goes wrong.'),
  ])]);
  const embD = h('details', { class: 'filters-collapse' }, [h('summary', {}, 'What an embassy can and cannot do')]);
  const embInner = h('div', {});
  embInner.append(h('p', { class: 'tiny', style: 'margin: var(--sp-1h) 0 0' }, [h('strong', {}, 'It can')]));
  embInner.append(h('ul', { class: 'sos-aid' }, EMBASSY.can.map((li) => h('li', {}, li))));
  embInner.append(h('p', { class: 'tiny', style: 'margin: var(--sp-2) 0 0' }, [h('strong', {}, 'It cannot')]));
  embInner.append(h('ul', { class: 'sos-aid dont' }, EMBASSY.cannot.map((li) => h('li', {}, li))));
  embInner.append(h('p', { class: 'tiny muted', style: 'margin: var(--sp-2) 0 0' }, EMBASSY.note));
  embD.append(embInner);
  emb.append(embD);
  emb.append(h('a', { class: 'btn ghost block btn-spaced', href: mapsSearch(`embassy consulate ${c.name}`), target: '_blank', rel: 'noopener' }, `🔎 Find your embassy in ${c.name} ↗`));

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
  wrap.append(h('button', { class: 'btn ghost block btn-spaced', onclick: () => go(`#scams-${getActiveCountry()}`) }, '⚠️ Common scams here — and how to avoid them'));

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
  const card = h('div', { class: 'card mosquito-card' }, [h('h2', {}, '🦟 Mosquitoes & dengue')]);
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
  // Scoped by country like the rest of Identify. This is the screen where it matters most:
  // in Laos the whole "In the sea" section is gone, because Laos has no sea — a traveller in
  // Vientiane was reading box-jellyfish first aid. `render` re-runs the router, which rebuilds
  // this screen from the new choice; the screen holds no other state to preserve.
  wrap.append(idCountryPicker(render));
  const list = allSpecies({ cc: idCountryFilter() }).filter((s) => s.dangerous);
  const groups = [
    { label: '🐍 Snakes', match: (s) => /cobra|krait|viper|python|snake/i.test(s.commonName) },
    // `marine`, not a substring of the common name. The old regex tested for "ray", which
    // filed the GIANT FRESHWATER STINGRAY — a Mekong river fish — under "In the sea", and
    // caught "Giant Moray" only by luck. In Laos, which has no coast, that river ray was the
    // single entry under a heading reading "In the sea". The flag is on the records.
    { label: '🌊 In the sea', match: (s) => !!s.marine },
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
  if (!list.length) {
    wrap.append(h('p', { class: 'empty' }, allSpecies().length
      // Not a loading state: the data is here and this country simply has none of it. Only
      // reachable if a future country tag excludes every dangerous record, but an "is still
      // downloading" message would be a lie in that case and travellers act on this screen.
      ? 'Nothing flagged dangerous for this country. Switch to all four countries above to see the region’s full list.'
      : 'The wildlife library is still downloading — reconnect once to fetch it.'));
  }
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
    h('h2', {}, 'Find a place of worship near me'),
    h('p', { class: 'muted tiny', style: 'margin: var(--sp-0h) 0 var(--sp-1h)' }, 'Opens a live map search (needs internet).'),
    h('div', { class: 'chips' }, Object.keys(WORSHIP_FAITH).map((f) =>
      h('a', { class: 'chip', href: mapsSearch(`${WORSHIP_SEARCH[f]} near me`), target: '_blank', rel: 'noopener' }, `${WORSHIP_FAITH[f]} ↗`))),
  ]));

  const local = nearestFirst(WORSHIP.filter((w) => !c || w.cc === getActiveCountry()), fix);
  if (!local.length) { wrap.append(h('p', { class: 'empty' }, 'No landmarks listed for this country yet — use the search above to find one near you.')); mount(wrap, '#home'); return; }
  const byCity = {};
  local.forEach((w) => { (byCity[w.city] = byCity[w.city] || []).push(w); });
  Object.keys(byCity).forEach((city) => {
    const card = h('div', { class: 'card' }, [h('h2', {}, city)]);
    byCity[city].forEach((w) => card.append(h('div', { class: 'row-between', style: 'margin: var(--sp-1) 0' }, [
      h('div', { class: 'grow' }, [h('strong', {}, w.name), h('div', { class: 'muted tiny' }, WORSHIP_FAITH[w.faith] || '')]),
      h('a', { class: 'chip', href: mapsSearch(`${w.name} ${w.city}`), target: '_blank', rel: 'noopener' }, 'Map ↗'),
    ])));
    wrap.append(card);
  });
  wrap.append(sourcesNote(WORSHIP_SOURCES, 'July 2026'));
  wrap.append(h('p', { class: 'disclaimer' }, 'Dress modestly at religious sites: cover shoulders and knees, remove shoes where asked, and follow local custom. Service times change — confirm before you travel across town.'));
  mount(wrap, '#home');
}

// ---- YOUR CONTRIBUTIONS (on-device points + levels, Local Guides-style) ------

// ---- SETTINGS ---------------------------------------------------------------
// ---- HELP / FAQ (static, fully offline) -------------------------------------

// ---- FEEDBACK / SUGGEST (no backend: share sheet, email, or copy) -----------

// ---- TRAVEL CIRCLE (backendless share / connect / message) ------------------


// A share/copy button that flips its own label to confirm, then reverts. Uses the
// OS share sheet when available (which can send over AirDrop / Nearby Share with
// no internet), else copies the link to the clipboard.
// The gap is a CLASS, not an inline style. Inline beat `.stack-N > * { margin-block: 0 }`,
// so a share button dropped into a stacked card produced a 16px gap where every sibling had
// 8. That rule now carries !important and would win either way, but the inline style was the
// wrong shape regardless: a spacing value baked into a shared widget cannot be overridden by
// the layout that hosts it.
export function shareButton(label, title, buildUrl, cls = 'btn ghost block') {
  const btn = h('button', { class: cls + ' btn-spaced', onclick: async () => {
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


// ---- FOR YOU (traveller profile + personalised picks) -----------------------
export function prefChips(pairs, current, onPick) {
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
// traveller answers three focused, high-leverage questions — one per step: location, who,
// diet — then lands on Home with a "here is what I set up for you" recap that proves the
// payoff. The interface language is not one of these steps; it is a persistent chip in the
// header above them (js/i18n.js languageSheet()) so a wrong first-run guess can be fixed
// before a single question has to be read in it. The richer, lower-urgency fields
// (accessibility, budget, interests) live behind an optional "Fine-tune" foldable on the last
// step, so nothing is lost but nothing is front-loaded. Location got promoted OUT of that
// foldable into its own step — it used to be folded away and easy to never see, which is how
// a traveller ends up permanently "in Hanoi" while standing in Sapa: no fix, no correction.
//
// THE NETWORK QUESTION USED TO BE STEP ONE, and removing it is the point of this change. It
// asked a first-time user to choose between "use data when I have it" and "stay fully offline"
// before they had seen the app, and the honest answer to that question is "use it when it is
// there, do not when it is not" — which is a job for software, not a decision to hand someone
// standing in an airport. Worse, it was answerable by accident: tapping past it opted the
// traveller out of every live source in the app, silently, and that shipped two defects (Home
// with no weather at all, exchange rates frozen 8% out). The app now uses the connection when
// it has one and the offline copy when it does not. The state is still visible and still one
// tap to change — the topbar carries a live signal icon — but it is no longer a question, and
// no route through this flow can turn the network off by accident.
// welcomeStep is module state so Next/Back re-render the same focused flow without a route.
// WELCOME_STEPS / welcomeStep moved to js/screens/welcome.js with welcomeScreen.



// ---- TRIP PLANS (suggested routes matched to the profile) --------------------

// ---- LOCAL NOTICEBOARD (per-city local knowledge + your own posts) -----------

// ---- STREET FOOD (find, rate, review) ----------------------------------------

// Converts a blob to a base64 data URL. Shared by Settings' full-device backup builder
// (moved to js/screens/settings.js) and this section's own journal/review/photo-album
// HTML exporters below, so it stays here rather than moving into either one.
export function blobToDataURL(blob) {
  return new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = () => rej(r.error); r.readAsDataURL(blob); });
}


// A brief, honest, one-time-per-country loading state — shown only the first time a
// route needs data that has not been fetched yet this session (see the lazy country
// data gate in render() below). Never a blank screen, never a silent hang.
function countryLoadingScreen(ccs) {
  const names = ccs.map((id) => { const c = getCountry(id); return c ? `${c.flag} ${c.name}` : id; }).join(', ');
  return h('div', { class: 'screen' }, [
    h('div', { class: 'card', role: 'status', style: 'text-align:center;margin-top:15vh' }, [
      h('div', { 'aria-hidden': 'true', style: 'font-size:2.4rem;margin-bottom: var(--sp-2)' }, '🧭'),
      h('h2', { style: 'margin: 0 0 var(--sp-1)' }, `Loading ${names}…`),
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
      h('div', { 'aria-hidden': 'true', style: 'font-size:2.4rem;margin-bottom: var(--sp-2)' }, '🧭'),
      h('h2', { style: 'margin: 0 0 var(--sp-1)' }, 'Opening…'),
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
      h('h2', { style: 'margin: 0 0 var(--sp-1h)' }, 'This screen is not on your device yet'),
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
  rememberRoute(hash);   // feeds Home's "Back to" row; ignores anything not a manifest feature

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
  const needScreens = (ROUTE_SCREENS[head] || []).slice();
  // First run intercepts the home route BELOW this gate and renders welcomeScreen instead, so
  // the module holding it has to be requested HERE — the switch never sees that route and a
  // static ROUTE_SCREENS entry for 'home' would load onboarding on every launch forever, for
  // a screen each traveller sees exactly once. Keyed on the same flag the interception uses,
  // so it is requested on precisely the launches that will render it.
  if (!store.profile.seenWelcome && (head === '' || head === 'home') && !needScreens.includes('welcome')) {
    needScreens.push('welcome');
  }
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
    if (!store.profile.seenWelcome && (head === '' || head === 'home')) return screenMod('welcome').welcomeScreen();
    switch (head) {
      case '': case 'home': return homeScreen();
      case 'me': return screenMod('you').meHubScreen();
      case 'everything': return everythingScreen();
      case 'hub': return hubScreen(arg);   // arg is a group id from js/nav-groups.js
      case 'welcome': return screenMod('welcome').welcomeScreen();
      case 'explore': return screenMod('explore').exploreScreen(arg);   // arg is usually undefined; 'all' forces the four-country view
      case 'country': return screenMod('explore').exploreScreen(arg);   // arg is always a valid country id — 21 existing links
      case 'region': return screenMod('explore').regionScreen(arg);
      case 'nearby': return screenMod('nearby').nearbyScreen();
      case 'currency': return currencyScreen();
      case 'exchange': return bulletinScreen(arg);
      case 'swap': return bulletinScreen('swap');
      case 'market': return bulletinScreen('gear');
      case 'phrasebook': return screenMod('phrasebook').phrasebookScreen(arg);
      case 'dictionary': return screenMod('phrasebook').dictionaryScreen();
      case 'places': return screenMod('places').placesScreen(arg);
      case 'place': return screenMod('places').placeScreen(arg);
      case 'prices': return pricesScreen(arg);
      case 'transport': return screenMod('transport').transportScreen(arg);
      case 'route': return planRouteScreen();
      case 'nextstop': return screenMod('nextstop').nextStopScreen(arg);
      case 'info': return screenMod('arrivalinfo').infoScreen(arg);
      case 'saved': return savedScreen();
      case 'collection': return collectionScreen(arg);
      case 'crossings': return crossingsScreen();
      case 'pools': return poolsScreen(arg);
      case 'addpin': return screenMod('transport').addPinScreen(arg);
      case 'journal': return screenMod('journal').journalDispatch(arg);
      case 'scrapbook': return screenMod('journal').scrapbookScreen();
      case 'contributions': return screenMod('contributions').contributionsScreen();
      case 'journey': return screenMod('journal').journeyScreen();
      case 'sharejourney': return screenMod('sharejourney').shareJourneyScreen();
      // A journey someone shared as a link. The whole journey travels in the payload, so this
      // renders for a first-time visitor with no profile and nothing stored.
      case 'jr': return screenMod('sharejourney').sharedJourneyScreen(arg);
      case 'calendar': return screenMod('calendar').calendarDispatch(arg);
      case 'events': return eventsScreen(arg);
      case 'event': return eventScreen(arg);
      case 'weather': return screenMod('weather').weatherScreen(arg);
      case 'today': return screenMod('today').daySuggestScreen(arg);
      case 'access': return screenMod('countryinfo').accessScreen(arg);
      case 'baby': return screenMod('countryinfo').babyScreen(arg);
      case 'family': return screenMod('family').familyScreen(arg);
      case 'history': return screenMod('countryinfo').historyScreen(arg);
      case 'setcity': return screenMod('countryinfo').setCityScreen(arg);
      case 'arrival': return screenMod('arrivalinfo').arrivalScreen(arg);
      case 'visa': return screenMod('countryinfo').visaScreen(arg);
      case 'schedules': return screenMod('schedules').schedulesScreen(arg);
      case 'food': return screenMod('food').foodScreen(arg);
      case 'dish': return screenMod('food').dishScreen(arg);
      case 'produce': { const m = screenMod('produce'); return arg ? m.produceDetail(arg) : m.produceScreen(); }
      // "Market products" — the stall goods that are not fruit and veg: sauces, rices, pastes,
      // sugars and spices. Not a second dataset; it is the produce guide opened straight into
      // its "Stall & pantry" category, because a traveller looking at a wall of unlabelled
      // bottles is asking a different question from one holding a mango.
      case 'pantry': { const m = screenMod('produce'); return m.produceScreen('pantry'); }
      case 'nature': return natureScreen();
      case 'sounds': return soundsScreen();
      case 'species': return speciesScreen(arg);
      case 'identified': return myIdentifierScreen();
      case 'search': return screenMod('search').searchScreen();
      case 'sos': return sosScreen(arg);
      case 'hospital': return screenMod('medical').hospitalScreen(arg);
      case 'scams': return screenMod('countryinfo').scamsScreen(arg);
      case 'danger': return dangerScreen();
      case 'worship': return worshipScreen(arg);
      case 'trip': return screenMod('trip').tripScreen();
      case 'expenses': return screenMod('budget').expensesScreen();
      case 'bargain': return screenMod('bargain').bargainScreen();
      // Culture & etiquette. Its own screen rather than four lines inside the country guide
      // (direct request): the traveller needs this BEFORE they show someone the soles of
      // their feet, and nobody finds it where it was.
      case 'etiquette': return screenMod('etiquette').etiquetteScreen(arg);
      case 'checklist': return screenMod('trip').checklistScreen(arg);
      case 'bestof': return bestofScreen(arg);
      case 'bestlist': return bestListScreen(arg);
      case 'vault': return screenMod('vault').vaultScreen();
      case 'help': return screenMod('help').helpScreen();
      case 'feedback': return screenMod('help').feedbackScreen(arg);
      case 'circle': return screenMod('circle').circleScreen();
      case 'add': return screenMod('circle').addContactScreen(arg);
      case 'in': return screenMod('circle').importShareScreen(arg);
      case 'inbox': return screenMod('circle').inboxScreen();
      case 'thread': return screenMod('circle').threadScreen(arg);
      case 'msg': return screenMod('circle').importMessageScreen(arg);
      case 'foryou': return screenMod('you').foryouScreen();
      case 'plans': return screenMod('trip').plansScreen();
      case 'board': return screenMod('board').boardScreen(arg);
      case 'streetfood': return screenMod('streetfood').streetfoodScreen();
      case 'donate': return screenMod('giveback').donateScreen();
      case 'visitors': return screenMod('visitors').visitorsScreen();
      case 'settings': return screenMod('settings').settingsScreen();
      case 'export': return screenMod('export').exportScreen();
      default: return homeScreen();
    }
  } catch (err) {
    // This used to print the raw exception message as the entire explanation, which is how a
    // traveller came to be reading "Can't find variable: wxMetric" on a phone in Vietnam.
    // That string is for whoever fixes it, not for whoever hit it: it names no cause they can
    // act on and reads like the whole app is broken, when in fact one screen is.
    //
    // So: say what is true (this screen, not the app), offer the two things that actually
    // help — go somewhere that works, or clear a bad cached build — and keep the technical
    // detail one tap away for the person who reports it.
    recordError('screen', err);
    const app = document.getElementById('app');
    app.innerHTML = '';
    const detail = h('details', { class: 'err-detail' }, [
      h('summary', {}, 'Technical details'),
      h('p', { class: 'muted mono' }, `${String(err && err.message || err)}\n${location.hash || '#home'} · ${APP_VERSION}`),
    ]);
    app.append(h('div', { class: 'screen' }, [
      h('h1', {}, 'This screen could not open'),
      h('p', { class: 'muted' }, 'The rest of the app still works. Everything you have saved is safe on this device.'),
      h('button', { class: 'btn block', onclick: () => go('#home') }, 'Go to Home'),
      h('button', { class: 'btn ghost block btn-spaced', onclick: () => resetAndReload() }, 'Reload the app'),
      h('button', { class: 'btn ghost block btn-spaced', onclick: () => go('#feedback') }, 'Report this'),
      detail,
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
// Launch timing, measured on the device that actually matters.
//
// Every performance figure in this project so far has been INFERRED — from source bytes, from
// a module count, or from a warm desktop reload. That is how the launch budget came to be
// argued in kilobytes while nobody knew what a launch costs on a mid-range Android phone on a
// hotel connection, which is this app's real deployment. Those two numbers can disagree by an
// order of magnitude, and the whole priority order of the performance work depends on which is
// true.
//
// So the app measures its own launch and keeps the marks. Three points, from the navigation
// start the browser already records: when this module finished evaluating (everything eager,
// parsed and run), when the first screen was handed to the DOM, and the browser's own first
// contentful paint. Settings shows them; scripts/cold-start.js reads them over the same
// Performance API, so a phone and a laptop are measured identically.
//
// The cost of this is three performance.mark() calls, which is why it is done unconditionally
// rather than behind a debug flag nobody would turn on before wanting the number.
function bootMark(name) {
  try { performance.mark(name); } catch { /* no Performance API — the readout degrades to '—' */ }
}
bootMark('mk-eval-done');
// The mark goes AFTER the render in both branches, not after the if/else: the second path
// renders asynchronously (it is waiting on a dictionary fetch), so a mark placed below would
// record a screen that has not been built yet — and would do it only on the launches where the
// figure is most interesting, a non-English one on a slow connection.
const firstRender = () => { render(); bootMark('mk-first-render'); };
if (uiStringsReady()) firstRender();
else ensureUiStrings().then(firstRender, firstRender);

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

// ---- EXCHANGE RATES: KEEP THEM CURRENT --------------------------------------
// Rates used to be fetched exactly once, at cold boot, and only if the app happened to be
// online at that instant. For a travel app that is the wrong shape twice over: it is an
// installed PWA a traveller leaves open all day, and it very often boots with no connection
// (no SIM yet, plane mode, a hotel network that is not working) — and when that boot fetch
// was skipped, nothing tried again for the rest of the session. The converter then quietly
// ran on the hardcoded approximate table while showing prices across the whole app.
//
// Four triggers now feed one guarded entry point. maybeRefreshRates() is cheap to call
// repeatedly — it no-ops unless the cached rates are genuinely due (honouring the endpoint's
// own published next-update time), refuses to retry within 10 minutes, and de-duplicates
// concurrent calls — so the triggers can be generous without hammering anything.
//
// online() is checked every time, not once: it is the traveller's data-consent gate, and it
// must keep gating every automatic fetch (see ui-widgets.js). A traveller on "stay fully
// offline" is never contacted by any of this.
const RATE_POLL_MS = 30 * 60 * 1000;
// Screens where a stale rate is actually visible, and where a repaint costs nothing. Home and
// the place screens also show converted prices, but re-rendering those under someone's thumb
// to move a third decimal place is not worth the scroll jump — they pick the new rate up on
// their next natural render.
const RATE_SCREENS = ['#currency', '#expenses', '#budget', '#prices', '#bargain'];
function syncRates(force = false) {
  if (!online()) return;
  maybeRefreshRates(force).then((changed) => {
    if (!changed) return;
    const hash = location.hash || '';
    if (RATE_SCREENS.some((r) => hash.startsWith(r))) render();
  }).catch(() => {});
}
// The weather where the traveller actually is, on the same triggers as the rates. It used to
// refresh only when a screen showing it was opened, which meant an app left open on Home all
// day kept the forecast it fetched at breakfast, and a launch with no signal meant no weather
// for the rest of the session however long the traveller was online afterwards. Staleness and
// de-duplication live in js/weather.js, so this can be called freely; it no-ops when what is
// cached is current.
//
// Only the FOCUS city is refreshed in the background. Chasing every cached city would turn a
// heartbeat into dozens of requests on a foreign SIM for cities nobody is looking at; the
// rest refresh when their screen is opened, which is the moment they matter.
const WX_SCREENS = ['#weather', '#today', '#home'];
function syncWeather(force = false) {
  if (!online()) return;
  let spot = null;
  try { spot = focusSpot().spot; } catch { return; }
  if (!spot) return;
  maybeRefreshWeather(spot, force).then((rec) => {
    if (!rec) return;                        // already current — nothing repainted, nothing fetched
    const hash = location.hash || '';
    if (WX_SCREENS.some((r) => hash === r || hash.startsWith(r)) || hash === '' || hash === '#') render();
  }).catch(() => {});
}

// One call for every live source, so a trigger can never be wired to one and forgotten for
// the other — which is how the rates ended up with four triggers and the forecast with none.
//
// The planned stops are refreshed here too, not only on a Home render in the planning phase.
// The point of caching a forecast for a city you have not reached yet is that it is there when
// you get there with no signal, and the moment worth spending a request on is the one where a
// connection appears — which is exactly what calls this. Its own cap (four soonest stops) and
// staleness window make it cheap to call on every trigger.
function syncLive(force = false) { syncRates(force); syncWeather(force); ensurePlannedStopsWeather(); }

// Exported so the two places that turn data ON can fetch immediately rather than waiting for
// the next poll — enabling data and then seeing "approximate" rates for half an hour reads
// as broken.
export function ratesOnConsent() { syncLive(true); }
syncLive();
// Regaining a connection is the single most valuable moment to try: it is exactly the case
// the old once-per-boot fetch missed.
window.addEventListener('online', () => syncLive());
// Coming back to the app after it has been backgrounded for hours.
document.addEventListener('visibilitychange', () => { if (!document.hidden) syncLive(); });
// And a slow heartbeat for a session that simply stays open.
setInterval(() => syncLive(), RATE_POLL_MS);

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

// And LAST of everything: put the identify field guide on the device — every photo and animal
// call, automatically, so recognising a snake or a mushroom works with no signal. It is by far
// the largest thing the app downloads (95 MB against the app shell's 1.5 MB), so it goes at the
// very end of the launch sequence and schedules its own work on idle; js/offline-pack.js
// stages it by connection cost and reports itself on Home while it runs.
startPack();
