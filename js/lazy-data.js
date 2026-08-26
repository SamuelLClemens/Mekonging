// Single-screen data, fetched on the route that needs it rather than on every launch.
//
// WHY. Sixteen data modules here are read by exactly one screen each — visa rules, packing
// checklists, swimming holes, scam warnings, transport hubs, border crossings. Statically
// imported they were ~259 KB parsed before the first screen could paint, on connections where
// that is seconds, for a traveller who may open none of them. They are now imported on demand.
//
// HOW CONSUMERS STAY UNCHANGED. Every export below is either
//   • a live `let` binding, reassigned when its module lands — ES module bindings are live, so
//     every importer sees the new value with no re-import and no call-site change; or
//   • a wrapper returning exactly what the real function returns for an unknown key (`null`,
//     `[]`), so a caller cannot tell the difference by shape.
// A consumer therefore reads precisely what it read when the import was static.
//
// WHY THE EMPTY DEFAULTS ARE NOT THE REAL MECHANISM. main.js's ROUTE_DATA gate awaits the
// modules a route needs BEFORE that route renders — the same single choke point that already
// gates country data and the route-scoped screen modules. By the time a screen function runs,
// its data is guaranteed present. The empty defaults exist only so that a read from some route
// nobody gated degrades to a missing section instead of throwing and blanking the app.
//
// THAT DEGRADATION IS SILENT, so it gets a guard: scripts/check-lazy-data.py walks the call
// graph from every router case and fails if a route can reach one of these reads without
// declaring it in ROUTE_DATA. Add a module here and you must add its `// LAZY-MODULE:` line,
// or the guard cannot see it.
//
// NOT HERE, deliberately, and every one of these was measured rather than assumed — see
// `scripts/check-lazy-data.py --why <route> <module>` for the call path in each case:
//   • photos.js (52 KB) — homeRightNowCard's recognition thumbnails put it on the landing
//     screen, where a gate would add a blocking round trip to the one route that must be
//     instant, and a non-blocking load would shift the layout under the traveller.
//   • history.js (50 KB) — homeScreen -> whereYouAreCard -> cityAboutCard -> cityHistory.
//   • checklist.js (29 KB) — homeScreen -> homeStageBlock -> homeNowCard -> checklistFor.
//   • allergens.js (24 KB) — sosScreen/hospitalScreen -> showBigPhrase -> togglePhrasePin ->
//     propagatePinAcrossLanguages. An emergency screen must never wait on a fetch, and a
//     silently un-propagated allergy pin is worse than 24 KB.
//   • diet.js (9 KB) — dish verdicts fan in across every food list.
//   • medical.js (62 KB) — the emergency screen itself.

// LAZY-MODULE: pools = POOLS poolsForCountry
export let POOLS = [];
// LAZY-MODULE: transit = TRANSPORT_HUBS TRANSIT_SOURCES GET_AROUND
export let TRANSPORT_HUBS = [];
export let TRANSIT_SOURCES = [];
export let GET_AROUND = {};
// LAZY-MODULE: itineraries = suggestPlans
// LAZY-MODULE: produce = PRODUCE PRODUCE_CATEGORIES produceByCategory getProduce
export let PRODUCE = [];
export let PRODUCE_CATEGORIES = [];
// LAZY-MODULE: visa = VISA getVisa
export let VISA = {};
// LAZY-MODULE: zones = zonesFor getZone zoneForProvince
// LAZY-MODULE: borders = CROSSINGS
export let CROSSINGS = [];
// LAZY-MODULE: bestof = bestForCountry getBestList
// LAZY-MODULE: accessibility = ACCESSIBILITY getAccessibility
export let ACCESSIBILITY = {};
// LAZY-MODULE: scams = scamsFor
// LAZY-MODULE: arrival = ARRIVAL getArrival
export let ARRIVAL = {};
// LAZY-MODULE: sounds = SOUNDS
export let SOUNDS = {};
// LAZY-MODULE: schedules = SCHEDULES SCHEDULES_VERIFIED schedulesForCountry
export let SCHEDULES = [];
export let SCHEDULES_VERIFIED = '';

// The `bust` argument exists because a FAILED dynamic import is permanent: the spec records
// the failure in the page's module map against that exact specifier, so re-importing the same
// URL never refetches. A retry must ask for a different specifier. The service worker matches
// its cache with ignoreSearch, so the busted URL still resolves offline.
const LOADERS = {
  pools: (b) => import('./data/pools.js' + b),
  transit: (b) => import('./data/transit.js' + b),
  itineraries: (b) => import('./data/itineraries.js' + b),
  produce: (b) => import('./data/produce.js' + b),
  visa: (b) => import('./data/visa.js' + b),
  zones: (b) => import('./data/zones.js' + b),
  borders: (b) => import('./data/borders.js' + b),
  bestof: (b) => import('./data/bestof.js' + b),
  accessibility: (b) => import('./data/accessibility.js' + b),
  scams: (b) => import('./data/scams.js' + b),
  arrival: (b) => import('./data/arrival.js' + b),
  sounds: (b) => import('./data/sounds.js' + b),
  schedules: (b) => import('./data/schedules.js' + b),
};

// Publish a landed module into the live bindings above. Only the value exports need this;
// the wrapper functions read _mods directly.
const PUBLISH = {
  pools: (m) => { POOLS = m.POOLS; },
  transit: (m) => { TRANSPORT_HUBS = m.TRANSPORT_HUBS; TRANSIT_SOURCES = m.TRANSIT_SOURCES; GET_AROUND = m.GET_AROUND; },
  produce: (m) => { PRODUCE = m.PRODUCE; PRODUCE_CATEGORIES = m.PRODUCE_CATEGORIES; },
  visa: (m) => { VISA = m.VISA; },
  borders: (m) => { CROSSINGS = m.CROSSINGS; },
  accessibility: (m) => { ACCESSIBILITY = m.ACCESSIBILITY; },
  arrival: (m) => { ARRIVAL = m.ARRIVAL; },
  sounds: (m) => { SOUNDS = m.SOUNDS; },
  schedules: (m) => { SCHEDULES = m.SCHEDULES; SCHEDULES_VERIFIED = m.SCHEDULES_VERIFIED; },
};

const _mods = Object.create(null);
const _pending = Object.create(null);
const _tries = Object.create(null);

export const DATA_MODULES = Object.keys(LOADERS);
export function isDataLoaded(name) { return !!_mods[name]; }

export function loadData(name) {
  if (_mods[name]) return Promise.resolve(_mods[name]);
  if (_pending[name]) return _pending[name];
  if (!LOADERS[name]) return Promise.reject(new Error('unknown data module: ' + name));
  const n = _tries[name] = (_tries[name] || 0) + 1;
  _pending[name] = LOADERS[name](n > 1 ? `?retry=${n}` : '')
    .then((m) => {
      _mods[name] = m;
      if (PUBLISH[name]) PUBLISH[name](m);
      delete _pending[name];
      return m;
    })
    .catch((err) => { delete _pending[name]; throw err; });
  return _pending[name];
}

// ---- wrappers -----------------------------------------------------------------
// Each returns what the real function returns for a key it does not know, so a caller reading
// the result cannot distinguish "not loaded" from "nothing recorded" — and neither throws.
export function poolsForCountry(cc) { const m = _mods.pools; return m ? m.poolsForCountry(cc) : []; }
export function suggestPlans(opts) { const m = _mods.itineraries; return m ? m.suggestPlans(opts) : []; }
export function produceByCategory(cat) { const m = _mods.produce; return m ? m.produceByCategory(cat) : []; }
export function getProduce(id) { const m = _mods.produce; return m ? m.getProduce(id) : null; }
export function getVisa(cc) { const m = _mods.visa; return m ? m.getVisa(cc) : null; }
export function zonesFor(cc) { const m = _mods.zones; return m ? m.zonesFor(cc) : []; }
export function getZone(cc, id) { const m = _mods.zones; return m ? m.getZone(cc, id) : null; }
export function zoneForProvince(cc, code) { const m = _mods.zones; return m ? m.zoneForProvince(cc, code) : null; }
export function bestForCountry(cc) { const m = _mods.bestof; return m ? m.bestForCountry(cc) : []; }
export function getBestList(id) { const m = _mods.bestof; return m ? m.getBestList(id) : null; }
export function getAccessibility(cc) { const m = _mods.accessibility; return m ? m.getAccessibility(cc) : null; }
export function scamsFor(cc) { const m = _mods.scams; return m ? m.scamsFor(cc) : null; }
export function getArrival(slug) { const m = _mods.arrival; return m ? m.getArrival(slug) : null; }
export function schedulesForCountry(cc) { const m = _mods.schedules; return m ? m.schedulesForCountry(cc) : []; }
