// Content validator. Importing the modules also parses them, so any syntax error
// fails the run. Then it checks required fields, verified stamps (YYYY-MM), and
// that every price is a low<=high range (a route option may give only a "from" low).
// Exits non-zero on any failure.
//
// Run: node scripts/validate.mjs   (or: npm run validate). CI runs it in guards.yml.

import { COUNTRIES, allPlaces, allFood, FOOD_ALLERGENS, FOOD_CATEGORIES, loadAllCountries } from '../js/data/regions.js';
import { LANGUAGES } from '../js/data/phrasebooks.js';
import { PRODUCE, PRODUCE_CATEGORIES } from '../js/data/produce.js';
import { NATURE, NATURE_GROUPS } from '../js/data/nature.js';
import { POOLS } from '../js/data/pools.js';
import { ITINERARIES } from '../js/data/itineraries.js';
import { PHOTOS } from '../js/data/photos.js';
import { MARKET_CITIES } from '../js/data/market-cities.js';
import { fixtureAllowed, signInPlace } from '../js/market-api.js';
import {
  fixtureListings, fixtureSearch, fixtureListing, fixtureMine, fold, regionToday,
} from '../js/market-fixture-listings.js';
import {
  searchBody, insertBody, listingErrorCode, listingErrorText, isListingId, newListingId, KINDS, ITEM_CATEGORIES, CURRENCIES,
  LISTING_COLUMNS, MAX_PAGE_SIZE,
} from '../js/market-listings.js';
import { ART_KEYS, artKey, artSVG, artBytes } from '../js/market-art.js';
import {
  DIET_OPTIONS, DIET_EVALUABLE_BELIEFS, VERDICT_INERT_DIET, PHRASE_PENDING_ALLERGENS,
  PHRASE_RX, PHRASE_KEYS, ALCOHOL_TERMS,
  dietAvoidAllergens, dishMeatHits, dishHasAlcohol, dishDietReasons, dishDietVerdict,
} from '../js/data/diet.js';

// Places, dishes and prices are lazy per country (js/data/regions.js). Without this the place
// and dish checks below run over empty lists and pass without checking anything.
await loadAllCountries();

let checks = 0;
const errors = [];
const warnings = [];
const ok = (cond, msg) => { checks++; if (!cond) errors.push(msg); };
// Non-fatal: flags likely-wrong data that should be eyeballed but should not block a build.
const warn = (cond, msg) => { checks++; if (!cond) warnings.push(msg); };
const isYM = (s) => typeof s === 'string' && /^\d{4}-\d{2}$/.test(s);

// --- phrasebooks -------------------------------------------------------------
for (const [code, book] of Object.entries(LANGUAGES)) {
  ok(book.lang === code, `phrasebook ${code}: lang mismatch`);
  ok(typeof book.label === 'string' && book.label, `phrasebook ${code}: missing label`);
  // Latin-orthography languages without a region locale (e.g. Hmong) carry an empty
  // locale + noVoice flag; everything else must be a BCP-47 lang or lang-REGION tag.
  ok(book.locale === '' || /^[a-z]{2}(-[A-Z]{2})?$/.test(book.locale || ''), `phrasebook ${code}: bad locale "${book.locale}"`);
  ok(Array.isArray(book.categories) && book.categories.length > 0, `phrasebook ${code}: no categories`);
  let phraseCount = 0;
  for (const cat of book.categories || []) {
    ok(cat.id && cat.name, `phrasebook ${code}: category missing id/name`);
    for (const p of cat.phrases || []) {
      phraseCount++;
      ok(p.en && p.script && p.roman, `phrasebook ${code}/${cat.id}: phrase missing en/script/roman (${p.en || '?'})`);
    }
  }
  ok(phraseCount >= 5, `phrasebook ${code}: too few phrases (${phraseCount})`);
}

// --- places ------------------------------------------------------------------
const seenIds = new Set();
const seenNameCity = new Map();
for (const p of allPlaces()) {
  ok(p.id && !seenIds.has(p.id), `place: duplicate or missing id (${p.id})`);
  seenIds.add(p.id);
  ok(p.name && p.city && p.country, `place ${p.id}: missing name/city/country`);
  // Guard against the same place being entered twice under different ids (it would plot
  // as two map pins). Keyed on normalised name+city+country.
  const nk = `${(p.name || '').trim().toLowerCase()}|${(p.city || '').trim().toLowerCase()}|${p.country}`;
  ok(!seenNameCity.has(nk), `place ${p.id}: duplicate name+city of ${seenNameCity.get(nk)} (${p.name}, ${p.city})`);
  if (!seenNameCity.has(nk)) seenNameCity.set(nk, p.id);
  ok(Array.isArray(p.categories) && p.categories.length > 0, `place ${p.id}: missing categories`);
  ok(['low', 'mid', 'high', 'any'].includes(p.budgetTier), `place ${p.id}: bad budgetTier`);
  ok(p.blurb && p.whyItFits, `place ${p.id}: missing blurb/whyItFits`);
  ok(p.priceRange && typeof p.priceRange.currency === 'string', `place ${p.id}: missing priceRange.currency`);
  ok(p.priceRange && p.priceRange.low <= p.priceRange.high, `place ${p.id}: price low>high`);
  ok(isYM(p.verified), `place ${p.id}: bad/missing verified (${p.verified})`);
  ok(p.mapQuery || p.coords, `place ${p.id}: missing mapQuery/coords`);
  // Optional traveller-fit fields, validated only when present, so existing places pass.
  if (p.kidFriendly != null) ok(typeof p.kidFriendly === 'boolean', `place ${p.id}: kidFriendly must be boolean`);
  // false is honest data (an international hotel, not locally owned); owner ruling 2026-10-12.
  if (p.isLocal != null) ok(typeof p.isLocal === 'boolean', `place ${p.id}: isLocal, if present, must be true or false`);
  if (p.stayType != null) ok(['tent', 'hostel', 'guesthouse', 'homestay', 'hotel', 'resort', 'apartment'].includes(p.stayType), `place ${p.id}: bad stayType (${p.stayType})`);
  if (p.stayDuration != null) ok(['short', 'long', 'both'].includes(p.stayDuration), `place ${p.id}: bad stayDuration (${p.stayDuration})`);
  if (p.activities != null) ok(Array.isArray(p.activities), `place ${p.id}: activities must be an array`);
  if (p.amenities != null) ok(Array.isArray(p.amenities), `place ${p.id}: amenities must be an array`);
  if (p.recognition != null) ok(typeof p.recognition === 'string' && p.recognition.length > 0, `place ${p.id}: recognition must be a non-empty string`);
  if (p.localName != null) ok(typeof p.localName === 'string' && p.localName.length > 0, `place ${p.id}: localName must be a non-empty string`);
  // Market metadata, optional, validated only when present. marketDays is an array of
  // weekday indices (0=Sun … 6=Sat) for periodic markets; absent/empty means daily.
  if (p.marketDays != null) ok(Array.isArray(p.marketDays) && p.marketDays.every((d) => Number.isInteger(d) && d >= 0 && d <= 6), `place ${p.id}: marketDays must be an array of integers 0-6`);
  if (p.marketType != null) ok(typeof p.marketType === 'string' && p.marketType.length > 0, `place ${p.id}: marketType must be a non-empty string`);
  if (p.sells != null) ok(typeof p.sells === 'string' && p.sells.length > 0, `place ${p.id}: sells must be a non-empty string`);
  // Beach & swimming safety, optional, validated only when present. lifeguard is an
  // enum; jellyfishMonths is an array of 1-12 month indices for elevated seasonal risk.
  if (p.lifeguard != null) ok(['yes', 'seasonal', 'no', 'unknown'].includes(p.lifeguard), `place ${p.id}: bad lifeguard (${p.lifeguard})`);
  if (p.swim != null) ok(typeof p.swim === 'string' && p.swim.length > 0, `place ${p.id}: swim must be a non-empty string`);
  if (p.jellyfishMonths != null) ok(Array.isArray(p.jellyfishMonths) && p.jellyfishMonths.every((m) => Number.isInteger(m) && m >= 1 && m <= 12), `place ${p.id}: jellyfishMonths must be an array of integers 1-12`);
  if (p.jellyfish != null) ok(typeof p.jellyfish === 'string' && p.jellyfish.length > 0, `place ${p.id}: jellyfish must be a non-empty string`);
  if (p.externalRatings != null) {
    ok(Array.isArray(p.externalRatings), `place ${p.id}: externalRatings must be an array`);
    for (const e of p.externalRatings || []) {
      ok(e && e.site && typeof e.score === 'number' && e.score >= 0, `place ${p.id}: externalRating needs site + numeric score`);
      ok(typeof e.scale === 'number' && e.scale > 0, `place ${p.id}: externalRating needs a positive scale`);
      ok(isYM(e.asOf), `place ${p.id}: externalRating asOf must be YYYY-MM (${e.asOf})`);
      // A famous sight (non-stay) with a tiny review count is almost certainly the wrong
      // map entity (e.g. a nearby cafe, not the park). Stays can genuinely have few reviews.
      warn(!(typeof e.count === 'number' && e.count < 200 && !p.stayType),
        `place ${p.id}: externalRating '${e.site}' has only ${e.count} reviews for a non-stay place, verify it is the correct entity`);
    }
  }
  if (p.externalPrices != null) {
    ok(Array.isArray(p.externalPrices), `place ${p.id}: externalPrices must be an array`);
    for (const pr of p.externalPrices || []) {
      ok(pr && pr.site, `place ${p.id}: externalPrice needs a site`);
      ok(pr.from == null || typeof pr.from === 'number', `place ${p.id}: externalPrice.from must be a number`);
      ok(pr.asOf == null || isYM(pr.asOf), `place ${p.id}: externalPrice asOf must be YYYY-MM`);
    }
  }
}

// --- food / dishes -----------------------------------------------------------
// Every dish is a diet-safety surface: its allergens[] tags drive the "you flagged this"
// warnings on the food list and dish detail. A tag outside the FOOD_ALLERGENS vocabulary
// (e.g. "treenut" instead of "tree nut") never matches a traveller's avoided set, so the
// ⚠️ warning silently fails to fire, a false-negative in a safety feature. The vocabulary
// check below makes that class of defect un-mergeable.
const ALLERGEN_VOCAB = new Set(FOOD_ALLERGENS);
const FOOD_CAT_IDS = new Set(FOOD_CATEGORIES.map((c) => c.id));
const SPICE_LEVELS = ['none', 'mild', 'medium', 'hot'];
const KNOWN_CURRENCIES = ['THB', 'VND', 'KHR', 'LAK', 'USD'];
const seenDishIds = new Set();
let dishCount = 0;
for (const d of allFood()) {
  dishCount++;
  ok(d.id && !seenDishIds.has(d.id), `dish: duplicate or missing id (${d.id})`);
  seenDishIds.add(d.id);
  const tag = d.id || '<no-id>';
  ok(typeof d.name === 'string' && d.name.trim(), `dish ${tag}: missing name`);
  ok(typeof d.localName === 'string' && d.localName.trim(), `dish ${tag}: missing localName (native script)`);
  ok(typeof d.roman === 'string' && d.roman.trim(), `dish ${tag}: missing roman`);
  ok(typeof d.description === 'string' && d.description.trim(), `dish ${tag}: missing description`);
  ok(FOOD_CAT_IDS.has(d.category), `dish ${tag}: bad category "${d.category}" (not a FOOD_CATEGORIES id)`);
  ok(Array.isArray(d.ingredients) && d.ingredients.length > 0 && d.ingredients.every((x) => typeof x === 'string' && x.trim()),
    `dish ${tag}: ingredients must be a non-empty array of strings`);
  // Allergen vocabulary conformance, the safety-critical check. Empty allergens[] is valid
  // (a genuinely allergen-free dish); every listed token must be a FOOD_ALLERGENS member.
  ok(Array.isArray(d.allergens), `dish ${tag}: allergens must be an array`);
  for (const a of d.allergens || []) {
    ok(ALLERGEN_VOCAB.has(a), `dish ${tag}: allergen "${a}" is not in the FOOD_ALLERGENS vocabulary (${FOOD_ALLERGENS.join(', ')})`);
  }
  ok(!d.allergens || new Set(d.allergens).size === d.allergens.length, `dish ${tag}: duplicate allergen tokens`);
  ok(typeof d.veg === 'string' && d.veg.trim(), `dish ${tag}: missing veg note`);
  ok(SPICE_LEVELS.includes(d.spice), `dish ${tag}: bad spice "${d.spice}" (expected ${SPICE_LEVELS.join('/')})`);
  ok(d.price && typeof d.price.low === 'number' && typeof d.price.high === 'number', `dish ${tag}: price.low/high must be numbers`);
  ok(d.price && d.price.low <= d.price.high, `dish ${tag}: price low>high`);
  ok(d.price && typeof d.price.currency === 'string' && d.price.currency, `dish ${tag}: missing price.currency`);
  if (d.price && d.price.currency) warn(KNOWN_CURRENCIES.includes(d.price.currency), `dish ${tag}: unusual currency "${d.price.currency}"`);
  ok(typeof d.whereToFind === 'string' && d.whereToFind.trim(), `dish ${tag}: missing whereToFind`);
  warn(Array.isArray(d.sources) && d.sources.length > 0, `dish ${tag}: no sources listed`);
}

// --- produce -----------------------------------------------------------------
const PRODUCE_CAT_IDS = new Set(PRODUCE_CATEGORIES.map((c) => c.id));
const seenProduceIds = new Set();
for (const p of PRODUCE) {
  ok(p.id && !seenProduceIds.has(p.id), `produce: duplicate or missing id (${p.id})`);
  seenProduceIds.add(p.id);
  const tag = p.id || '<no-id>';
  ok(typeof p.name === 'string' && p.name.trim(), `produce ${tag}: missing name`);
  ok(PRODUCE_CAT_IDS.has(p.category), `produce ${tag}: bad category "${p.category}" (not a PRODUCE_CATEGORIES id)`);
  ok(p.price && typeof p.price.low === 'number' && typeof p.price.high === 'number' && p.price.low <= p.price.high, `produce ${tag}: price.low/high must be numbers with low<=high`);
  ok(p.price && typeof p.price.currency === 'string' && p.price.currency, `produce ${tag}: missing price.currency`);
}

// --- nature / species --------------------------------------------------------
const NATURE_GROUP_IDS = new Set(NATURE_GROUPS.map((g) => g.id));
const seenSpeciesIds = new Set();
for (const s of NATURE) {
  ok(s.id && !seenSpeciesIds.has(s.id), `species: duplicate or missing id (${s.id})`);
  seenSpeciesIds.add(s.id);
  const tag = s.id || '<no-id>';
  ok(NATURE_GROUP_IDS.has(s.group), `species ${tag}: bad group "${s.group}" (not a NATURE_GROUPS id)`);
  ok(typeof s.commonName === 'string' && s.commonName.trim(), `species ${tag}: missing commonName`);
}

// --- pools & itineraries -----------------------------------------------------
const CC = new Set(COUNTRIES.map((c) => c.id));
const seenPoolIds = new Set();
for (const p of POOLS) {
  ok(p.id && !seenPoolIds.has(p.id), `pool: duplicate or missing id (${p.id})`);
  seenPoolIds.add(p.id);
  const tag = p.id || '<no-id>';
  ok(typeof p.name === 'string' && p.name.trim(), `pool ${tag}: missing name`);
  ok(CC.has(p.country), `pool ${tag}: bad country "${p.country}"`);
  if (p.price) ok(typeof p.price.low === 'number' && typeof p.price.high === 'number' && p.price.low <= p.price.high, `pool ${tag}: price.low/high must be numbers with low<=high`);
}
const seenItinIds = new Set();
for (const it of ITINERARIES) {
  ok(it.id && !seenItinIds.has(it.id), `itinerary: duplicate or missing id (${it.id})`);
  seenItinIds.add(it.id);
  const tag = it.id || '<no-id>';
  ok(CC.has(it.country), `itinerary ${tag}: bad country "${it.country}"`);
  ok(typeof it.days === 'number' && it.days > 0, `itinerary ${tag}: days must be a positive number`);
  ok(Array.isArray(it.stops) && it.stops.length > 0, `itinerary ${tag}: no stops`);
  for (const s of it.stops || []) ok(s.title && (s.nights == null || typeof s.nights === 'number'), `itinerary ${tag}: stop missing title or bad nights`);
}

// --- photos: every registered image must key to a real, surfaceable entity ---
// PHOTOS is a global id->image registry consumed generically as PHOTOS[item.id] for
// places, dishes, produce and species alike. A key that matches no entity id is a dead
// image (it can never render) or, worse, a near-miss typo that hides a real photo from
// a real place. This cross-reference check is the one that spans datasets.
const ENTITY_IDS = new Set([
  ...allPlaces().map((p) => p.id),
  ...allFood().map((d) => d.id),
  ...PRODUCE.map((p) => p.id),
  ...NATURE.map((s) => s.id),
  ...POOLS.map((p) => p.id),
]);
for (const key of Object.keys(PHOTOS)) {
  ok(ENTITY_IDS.has(key), `PHOTOS key "${key}" matches no known entity id (place/dish/produce/species/pool), the image can never render`);
}

// --- per-country prices / routes / info --------------------------------------
for (const c of COUNTRIES) {
  if (c.prices) {
    const d = c.prices;
    ok(isYM(d.verified), `prices ${c.id}: bad verified`);
    ok(Array.isArray(d.sources) && d.sources.length > 0, `prices ${c.id}: missing sources`);
    ok(Array.isArray(d.items) && d.items.length > 0, `prices ${c.id}: no items`);
    for (const it of d.items || []) {
      ok(it.id && it.label, `prices ${c.id}: item missing id/label`);
      ok(it.fair && it.fair.low <= it.fair.high, `prices ${c.id}/${it.id}: fair low>high`);
    }
  }
  if (c.routes) {
    for (const r of c.routes) {
      ok(r.id && r.from && r.to, `routes ${c.id}: missing id/from/to`);
      ok(isYM(r.verified), `routes ${c.id}/${r.id}: bad verified`);
      ok(Array.isArray(r.options) && r.options.length > 0, `routes ${c.id}/${r.id}: no options`);
      if (r.crossBorder) ok(r.border && r.visa, `routes ${c.id}/${r.id}: cross-border missing border/visa`);
      for (const o of r.options || []) {
        ok(o.mode, `routes ${c.id}/${r.id}: option missing mode`);
        // An explicit high: null is honest data, not an inversion: with a number low it is a
        // "from" fare (a flight's lowest listed price), with low: null too it is quoted on
        // request. range() prints one figure or nothing. Inventing a high to pass would be worse.
        ok(o.price && (o.price.high === null
          ? (o.price.low === null || typeof o.price.low === 'number')
          : o.price.low <= o.price.high), `routes ${c.id}/${r.id}: option price low>high`);
      }
    }
  }
  if (c.info) {
    const i = c.info;
    ok(isYM(i.verified), `info ${c.id}: bad verified`);
    ok(Array.isArray(i.emergency) && i.emergency.length > 0, `info ${c.id}: no emergency numbers`);
    ok(Array.isArray(i.sections) && i.sections.length > 0, `info ${c.id}: no sections`);
    ok(Array.isArray(i.sources) && i.sources.length > 0, `info ${c.id}: missing sources`);
  }
}

// --- diet self-test (behavioural, imports the pure diet.js logic) -----------
// Every selectable diet flag must have a DEFINED handling, and the safety-critical matchers
// must behave. Because js/data/diet.js is DOM-free, we can call it directly here.
const dietIds = DIET_OPTIONS.flatMap((g) => g.items).map((it) => it.id);
// (a) coverage: every diet option is an allergen, an evaluable belief, or explicitly inert.
for (const id of dietIds) {
  const handled = FOOD_ALLERGENS.includes(id) || DIET_EVALUABLE_BELIEFS.includes(id) || VERDICT_INERT_DIET.includes(id);
  ok(handled, `diet option "${id}" has no defined handling (allergen / evaluable belief / inert-whitelisted), it would be silently inert`);
}
// classification lists must reference only real, selectable options (no dead ids).
for (const id of [...DIET_EVALUABLE_BELIEFS, ...VERDICT_INERT_DIET])
  ok(dietIds.includes(id), `classified diet id "${id}" is not a selectable DIET_OPTIONS id`);
// (b) allergen parity: every FOOD_ALLERGEN is selectable, matched into the avoid set, and
// resolves to a phrasebook phrase (or is on the explicit PHRASE_PENDING allowlist).
for (const a of FOOD_ALLERGENS) {
  ok(dietIds.includes(a), `FOOD_ALLERGEN "${a}" is not selectable in DIET_OPTIONS`);
  ok(dietAvoidAllergens([a]).has(a), `FOOD_ALLERGEN "${a}" is not matched by dietAvoidAllergens`);
  const keys = PHRASE_KEYS[a] || [];
  const hasPhrase = keys.length > 0 && keys.every((k) => PHRASE_RX[k]);
  ok(hasPhrase || PHRASE_PENDING_ALLERGENS.includes(a),
    `FOOD_ALLERGEN "${a}" has no phrasebook mapping and is not on PHRASE_PENDING_ALLERGENS`);
}
ok(PHRASE_PENDING_ALLERGENS.length <= 1, `PHRASE_PENDING_ALLERGENS grew (${PHRASE_PENDING_ALLERGENS.join(', ')}), add sourced phrases`);
// (c) behavioural regression guards over real dishes + synthetic fixtures (no dish content added).
const _dishes = allFood();
// alcohol: fermented/distilled drinks named in name/roman must read as alcoholic and flag.
for (const id of ['la-beerlao', 'la-lao-lao']) {
  const drink = _dishes.find((x) => x.id === id);
  if (drink) {
    ok(dishHasAlcohol(drink), `${id}: dishHasAlcohol() must be true`);
    ok(dishDietVerdict(drink, undefined, ['no-alcohol']) === 'bad', `${id}: verdict must be 'bad' for a no-alcohol profile`);
  }
}
// any dish naming alcohol in name/roman is caught (mirrors the runtime matcher).
for (const d of _dishes) {
  const meta = [d.name, d.roman].filter(Boolean).join(' ').toLowerCase();
  if (ALCOHOL_TERMS.some((t) => meta.includes(t)) && !/vinegar/.test(meta))
    ok(dishHasAlcohol(d), `dish "${d.id}" names alcohol but dishHasAlcohol() is false`);
}
// 'nuoc cham' must not fabricate a 'ham' (pork) hit on a dish with no real ham.
for (const d of _dishes)
  if ((d.ingredients || []).some((i) => /nuoc cham/i.test(i)) && !(d.ingredients || []).some((i) => /\bham\b/i.test(i)))
    ok(!dishMeatHits(d).includes('ham'), `dish "${d.id}": 'nuoc cham' produced a spurious 'ham' meat hit`);
// synthetic fixtures, exercise the matcher edge cases without shipping any dish content.
ok(dishMeatHits({ ingredients: ['soy-braised pork'] }).includes('pork'), 'fixture: soy-braised pork must still count as pork (no false-negative)');
ok(dishMeatHits({ ingredients: ['eggplant', 'tofu'] }).length === 0, 'fixture: eggplant must not count as meat');
ok(dishMeatHits({ ingredients: ['mock duck'] }).length === 0, 'fixture: mock duck must not count as meat');
ok(dishMeatHits({ ingredients: ['buffalo milk'] }).length === 0, 'fixture: buffalo milk must not count as meat');
ok(dishMeatHits({ ingredients: ['lard'] }).includes('lard'), 'fixture: lard must count as (pork-derived) meat');
ok(dishDietReasons({ ingredients: ['lard'] }, undefined, ['halal']).includes('lard'), 'fixture: lard must flag for a halal profile');
// inert flags never colour a dish when set alone.
for (const id of VERDICT_INERT_DIET)
  ok(_dishes.every((d) => dishDietVerdict(d, undefined, [id]) === ''), `inert diet flag "${id}" coloured a dish`);

// --- Market accounts (docs/EXCHANGE.md §5, slice M3b) ---------------------------
// Fixture mode answers every call from canned data. It must be impossible anywhere but a local
// development host, whatever the address says.
for (const host of ['www.mekonging.com', 'mekonging.com', 'samuellclemens.github.io', 'localhost.mekonging.com',
  '127.0.0.1.nip.io', 'mylocalhost', '127.0.0.2', 'app', ''])
  ok(!fixtureAllowed(host, '?market=fixture'), `market: fixture mode must be refused on "${host}"`);
for (const host of ['127.0.0.1', 'localhost']) {
  ok(fixtureAllowed(host, '?market=fixture'), `market: fixture mode must work on ${host}`);
  ok(fixtureAllowed(host, '?x=1&market=fixture&tester=1'), `market: fixture flag among others on ${host}`);
  for (const q of ['', '?market=fixtures', '?xmarket=fixture', '?market=live'])
    ok(!fixtureAllowed(host, q), `market: "${q}" must not turn fixture mode on at ${host}`);
}
ok(signInPlace('mekong:', 'app') === 'wrapper', 'market: the iOS wrapper scheme must be the gated "wrapper" place');
ok(signInPlace('https:', 'www.mekonging.com') === 'web', 'market: www.mekonging.com must be the sign-in place');
ok(signInPlace('https:', 'mekonging.com') === 'other', 'market: only the www host can sign in');
ok(signInPlace('http:', '127.0.0.1') === 'local', 'market: 127.0.0.1 is a local place');
// The generated city list (scripts/build-market-cities.py) seeds public.cities too.
const _cityIds = new Set();
for (const c of MARKET_CITIES) {
  ok(/^(th|vi|kh|la)-[a-z0-9]+(-[a-z0-9]+)*$/.test(c.id) && c.id.slice(0, 2) === c.country && c.name,
    `market city "${c.id}": id, country or name malformed`);
  ok(!_cityIds.has(c.id), `market city "${c.id}": duplicate id`);
  _cityIds.add(c.id);
}

// --- Market listings (docs/EXCHANGE.md section 17, slice M4a) ---------------------
// The fixture is what M4b designs against, and fixtureSearch is a port of public.market_search, so
// both are checked here: the rows obey the server's own rules, search returns the expected rows,
// and nothing that must stay hidden (or any owner) ever comes back.
const NOW = Date.UTC(2026, 9, 19, 5, 0, 0);          // a fixed clock: 2026-10-19, 12:00 in UTC+7
const TODAY = regionToday(NOW);
ok(TODAY === '2026-10-19', `market listings: regionToday gave ${TODAY}`);
const FIX = fixtureListings(NOW);
const OPEN = { open: true, rows: FIX, now: NOW };
const seen = (fn) => FIX.filter((l) => l._status === 'open' && l.ends_on >= TODAY && l._owner !== 'review').filter(fn);
const VIS = seen(() => true);
const mcity = new Set(MARKET_CITIES.map((c) => c.id));
const CAP = { item: 30, meetup: 7, room: 30, ride: 3 };
const PAIRS = { item: ['give', 'sell', 'trade', 'request'], meetup: ['join'], room: ['offer', 'seek'], ride: ['offer', 'seek'] };
const days = (a, b) => Math.round((Date.parse(b) - Date.parse(a)) / 86400000) + 1;

ok(FIX.length === 51 && VIS.length === 47, `market fixture: expected 51 rows, 47 of them visible, got ${FIX.length} and ${VIS.length}`);
ok(new Set(FIX.map((l) => l.id)).size === FIX.length && FIX.every((l) => /^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/.test(l.id)), 'market fixture: ids must be unique uuids');
for (const k of KINDS) ok(VIS.some((l) => l.kind === k), `market fixture: no visible ${k}`);
ok(VIS.filter((l) => l.kind === 'item').length === 19 && VIS.filter((l) => l.kind === 'meetup').length === 8
  && VIS.filter((l) => l.kind === 'room').length === 12 && VIS.filter((l) => l.kind === 'ride').length === 8, 'market fixture: kind counts must be 19, 8, 12 and 8');
ok(new Set(VIS.map((l) => l.city)).size >= 12, `market fixture: ${new Set(VIS.map((l) => l.city)).size} cities, need 12`);
ok(VIS.some((l) => l.price_amount === 0) && VIS.some((l) => l.price_amount > 0) && VIS.some((l) => l.price_amount === null), 'market fixture: needs free, paid and no-price rows');
ok(new Set(VIS.map((l) => l.price_currency).filter(Boolean)).size >= 4, 'market fixture: needs at least four currencies');
ok(FIX.some((l) => l.title.length >= 70 && l.title.length <= 80), 'market fixture: needs a long title (70 to 80 characters)');
ok(/[฀-๿]/.test(FIX.map((l) => l.title).join('')) && /[ក-៿]/.test(FIX.map((l) => l.title).join(''))
  && /[຀-໿]/.test(FIX.map((l) => l.title).join('')) && /[Ạ-ỹ]/.test(FIX.map((l) => l.title).join('')), 'market fixture: needs Thai, Khmer, Lao and Vietnamese titles');
ok(FIX.some((l) => l._status === 'hidden') && FIX.some((l) => l.ends_on < TODAY) && FIX.some((l) => l._status === 'closed') && FIX.some((l) => l._owner === 'review'),
  'market fixture: needs a hidden, an ended, a closed and an under-review row');
for (const l of FIX) {
  const w = `market fixture "${l.title}"`;
  ok(!('owner' in l) && !('report_weight' in l), `${w}: carries a private column`);
  ok(l.title.length >= 3 && l.title.length <= 80 && l.body.length <= 400, `${w}: title or body length`);
  ok(PAIRS[l.kind].includes(l.intent), `${w}: intent ${l.intent} is not allowed for ${l.kind}`);
  ok(days(l.starts_on, l.ends_on) >= 1 && days(l.starts_on, l.ends_on) <= CAP[l.kind], `${w}: window of ${days(l.starts_on, l.ends_on)} days`);
  ok(mcity.has(l.city) && (l.kind === 'ride' ? mcity.has(l.to_city) && l.to_city !== l.city : l.to_city === null), `${w}: city or to_city`);
  ok(l.kind === 'item' ? ITEM_CATEGORIES.includes(l.category) : l.category === null, `${w}: category`);
  ok(l.kind === 'room' ? ['private', 'shared', 'whole'].includes(l.room_type) : l.room_type === null, `${w}: room_type`);
  ok(l.kind === 'meetup' ? l.activity && l.seats >= 2 && l.seats <= 8 : l.activity === null, `${w}: activity or seats`);
  ok(l.kind === 'ride' && l.intent === 'offer' ? l.seats >= 1 && l.seats <= 8 : l.kind === 'meetup' || l.seats === null, `${w}: seats`);
  ok(l.intent === 'give' ? l.price_amount === 0 : true, `${w}: a gift is free`);
  ok(l.intent === 'sell' ? l.price_amount > 0 : true, `${w}: a sale has a price`);
  ok(l.price_amount > 0 ? CURRENCIES.includes(l.price_currency) : l.price_currency === null, `${w}: currency`);
  ok(!/\d{8}|@|https?:|www\./i.test(l.title + ' ' + l.body), `${w}: holds contact details`);
}

// The gate, then the unfiltered search.
let gated = '';
try { fixtureSearch({}, { open: false, rows: FIX, now: NOW }); } catch (e) { gated = e.code; }
ok(gated === 'market_closed', `market search: a closed market must answer market_closed, got "${gated}"`);
const all = fixtureSearch({ page_size: 50 }, OPEN);
ok(all.length === 47 && all.every((r) => r.total === 47), `market search: expected 47 rows with total 47, got ${all.length}`);
const never = FIX.filter((l) => !VIS.includes(l)).map((l) => l.id);
ok(all.every((r) => !never.includes(r.id)), 'market search: an ended, hidden, closed or under-review row came back');
ok(all.every((r) => !('owner' in r) && !('_owner' in r) && !('_status' in r) && !('report_weight' in r)), 'market search: a private column came back');
ok(all.every((r) => Object.keys(r).length === 20), 'market search: a row must hold the 19 public columns plus total');
ok(LISTING_COLUMNS.split(',').every((c) => c !== 'owner' && c !== 'report_weight' && c !== 'search'), 'market listings: LISTING_COLUMNS names a private column');

// Paging.
ok(fixtureSearch({ page_size: 10 }, OPEN).length === 10 && fixtureSearch({ page: 4, page_size: 10 }, OPEN).length === 7, 'market search: paging of 10 over 47 rows');
ok(fixtureSearch({ page: 5, page_size: 10 }, OPEN).length === 0, 'market search: a page past the end must be empty');
ok(fixtureSearch({ page_size: 1000 }, OPEN).length === Math.min(MAX_PAGE_SIZE, 47) && fixtureSearch({ page_size: 0 }, OPEN).length === 1, 'market search: the page size is clamped to 1..50');
ok(new Set(fixtureSearch({ page_size: 10 }, OPEN).concat(fixtureSearch({ page: 1, page_size: 10 }, OPEN)).map((r) => r.id)).size === 20, 'market search: two pages must not overlap');
for (const bad of [{ page: -1 }, { page: 200 }]) {
  let c = ''; try { fixtureSearch(bad, OPEN); } catch (e) { c = e.code; }
  ok(c === 'page_invalid', `market search: ${JSON.stringify(bad)} must answer page_invalid`);
}
{ let c = ''; try { fixtureSearch({ sort: 'bogus' }, OPEN); } catch (e) { c = e.code; } ok(c === 'sort_invalid', 'market search: an unknown sort'); }
{ let c = ''; try { fixtureSearch({ price_max: 100 }, OPEN); } catch (e) { c = e.code; } ok(c === 'currency_required', 'market search: a price range needs a currency'); }

// Filters, each against a count worked out from the table above.
const idsOf = (rows) => rows.map((r) => r.id).sort().join();
const want = (fn) => seen(fn).map((l) => l.id).sort().join();
ok(fixtureSearch({ kind: 'item', page_size: 50 }, OPEN).length === 19, 'market search: kind item');
ok(fixtureSearch({ kind: 'room', page_size: 50 }, OPEN).length === 12, 'market search: kind room');
ok(fixtureSearch({ kind: 'ride', page_size: 50 }, OPEN).length === 8, 'market search: kind ride');
ok(fixtureSearch({ kind: 'meetup', page_size: 50 }, OPEN).length === 8, 'market search: kind meetup');
ok(fixtureSearch({ kind: 'cash' }, OPEN).length === 0, 'market search: cash is empty');
ok(idsOf(fixtureSearch({ category: 'camping', page_size: 50 }, OPEN)) === want((l) => l.category === 'camping') && fixtureSearch({ category: 'camping' }, OPEN).length === 3, 'market search: category camping');
ok(idsOf(fixtureSearch({ city: 'th-chiang-mai', page_size: 50 }, OPEN)) === want((l) => l.city === 'th-chiang-mai'), 'market search: city Chiang Mai (a ride by its departure city)');
ok(fixtureSearch({ city: 'th-pai', page_size: 50 }, OPEN).every((r) => r.kind !== 'ride'), 'market search: a ride is not found by its destination');
ok(fixtureSearch({ date_from: '2026-11-22', page_size: 50 }, OPEN).length === 3, 'market search: three windows reach 2026-11-22 or later');
ok(fixtureSearch({ date_from: '2026-11-23', page_size: 50 }, OPEN).length === 1, 'market search: a window that ended the day before does not overlap');
ok(fixtureSearch({ date_to: '2026-10-18', page_size: 50 }, OPEN).length === 0, 'market search: nothing starts before today');
ok(idsOf(fixtureSearch({ date_to: TODAY, page_size: 50 }, OPEN)) === want((l) => l.starts_on <= TODAY), 'market search: a window starting on the last day overlaps');
ok(fixtureSearch({ free_only: true, page_size: 50 }, OPEN).every((r) => r.price_amount === 0) && fixtureSearch({ free_only: true }, OPEN).length === 3, 'market search: free only');
const thb = fixtureSearch({ price_max: 1000, currency: 'THB', page_size: 50 }, OPEN);
ok(thb.every((r) => r.price_amount === 0 || (r.price_currency === 'THB' && r.price_amount <= 1000)), 'market search: up to 1000 baht holds free and baht rows only');
ok(thb.some((r) => r.price_amount === 0) && !thb.some((r) => r.price_amount === null), 'market search: a price range keeps free rows and drops no-price rows');
ok(fixtureSearch({ price_min: 1, price_max: 1000, currency: 'THB', page_size: 50 }, OPEN).every((r) => r.price_amount >= 1 && r.price_currency === 'THB'), 'market search: from 1 baht drops free rows');
ok(fixtureSearch({ kind: 'item', city: 'th-bangkok', price_max: 2000, currency: 'THB', page_size: 50 }, OPEN).length === 3, 'market search: filters combine');

// Sorts.
const np = fixtureSearch({ sort: 'price_up', page_size: 50 }, OPEN);
const priced = np.filter((r) => r.price_amount !== null);
ok(np[0].price_amount === 0 && np[np.length - 1].price_amount === null && priced.every((r, i) => i === 0 || priced[i - 1].price_amount <= r.price_amount), 'market search: price up, free first, no price last');
const pd = fixtureSearch({ sort: 'price_down', page_size: 50 }, OPEN).filter((r) => r.price_amount !== null);
ok(pd.every((r, i) => i === 0 || pd[i - 1].price_amount >= r.price_amount), 'market search: price down');
ok(all.every((r, i) => i === 0 || all[i - 1].created_at >= r.created_at), 'market search: newest first');
const so = fixtureSearch({ sort: 'soonest', page_size: 50 }, OPEN);
const start = (r) => (r.starts_on > TODAY ? r.starts_on : TODAY);
ok(so.every((r, i) => i === 0 || start(so[i - 1]) <= start(r)) && idsOf(so) === idsOf(all) && so.map((r) => r.id).join() !== all.map((r) => r.id).join(), 'market search: soonest first, and it differs from newest');

// Text: prefixes, every word, typos, accents and scripts without spaces.
const titleOf = (id) => FIX.find((l) => l.id === id).title;
const q = (s) => fixtureSearch({ q: s, page_size: 50 }, OPEN);
ok(q('baby strol').length === 1 && /baby stroller/.test(titleOf(q('baby strol')[0].id)), 'market search: words match by prefix, all of them');
ok(q('stroler').some((r) => /baby stroller/.test(r.title)), 'market search: a typo still finds the stroller');
ok(q('BRITAX  group').length === 1 && q('britax zzzzqqqq').length === 0, 'market search: case and spacing do not matter, and every word must match');
ok(q('phong rieng').length === 1 && /Ho/.test(q('phong rieng')[0].title.normalize('NFD').replace(/[̀-ͯ]/g, '')), 'market search: Vietnamese accents fold');
ok(q('Phòng riêng').length === 1, 'market search: an accented query finds it too');
ok(q('ห้องพัก').length === 1 && q('បន្ទប់').length === 1 && q('ຫ້ອງພັກ').length === 1, 'market search: Thai, Khmer and Lao queries match as substrings');
ok(q('').length === 47 && q('   ').length === 47 && q('!!!').length === 47, 'market search: an empty query matches everything');
ok(fold('Phòng đẹp') === 'phong dep', 'market search: fold maps accents and d-stroke');

// One listing, and my listings.
const byTitle = (re) => FIX.find((l) => re.test(l.title));
const one = (re) => fixtureListing(byTitle(re).id, OPEN);
ok(one(/Britax/) && one(/Britax/).mine === false && one(/Britax/).status === 'open' && !('owner' in one(/Britax/)) && !('_owner' in one(/Britax/)), 'market listing: a visible listing opens, not mine, without an owner');
ok(one(/lightweight stroller/).mine === true, 'market listing: my own listing says mine');
ok(one(/Ended:/) === null && one(/Owner under review/) === null, 'market listing: an ended listing and an under-review owner open as null');
ok(one(/My closed/).status === 'closed' && one(/My hidden/).status === 'hidden', 'market listing: my own closed and hidden listings open for me');
ok(fixtureListing('00000000-0000-4000-8000-999999999999', OPEN) === null, 'market listing: an unknown id is null');
const mine = fixtureMine({ rows: FIX });
ok(mine.length === 4 && mine.map((r) => r.status).sort().join() === 'closed,hidden,open,open' && mine.every((r) => !('owner' in r) && !('_owner' in r)), 'market mine: four rows, their statuses, no owner');
ok(all.every((r) => !['My closed listing: rain jacket', 'My hidden listing: room with a reported photo'].includes(r.title)), 'market search: my closed and hidden listings never appear');

// The pure helpers in js/market-listings.js.
{
  const a = newListingId(), b = newListingId();
  ok(isListingId(a) && a !== b && a[14] === '4' && /[89ab]/.test(a[19]), 'market listings: newListingId makes distinct v4 uuids');
}
ok(listingErrorCode(400, { code: '22003', message: 'numeric field overflow' }) === 'price_invalid', 'market listings: a price too large to store is a price problem');
ok(isListingId('00000000-0000-4000-8000-000000000001') && !isListingId('x') && !isListingId('1; drop table') && !isListingId(null), 'market listings: isListingId');
{
  const b = searchBody({ q: '  stroller  ', kind: 'item', category: 'toys', city: 'th-bangkok', dateFrom: '2026-10-20', dateTo: '2026-10-25',
    priceMin: 100, priceMax: 900, currency: 'THB', freeOnly: true, sort: 'price_up', page: 2, pageSize: 20, owner: 'x', evil: 1 });
  ok(b.q === 'stroller' && b.kind === 'item' && b.category === 'toys' && b.city === 'th-bangkok' && b.date_from === '2026-10-20' && b.date_to === '2026-10-25'
    && b.price_min === 100 && b.price_max === 900 && b.currency === 'THB' && b.free_only === true && b.sort === 'price_up' && b.page === 2 && b.page_size === 20, 'market listings: searchBody maps every option');
  ok(!('owner' in b) && !('evil' in b), 'market listings: searchBody drops unknown keys');
  const d = searchBody({});
  ok(d.sort === 'newest' && d.page === 0 && d.page_size === 24 && Object.keys(d).length === 3, 'market listings: searchBody defaults');
  const c = searchBody({ page: 9999, pageSize: 9999, sort: 'bogus', kind: 'cash', category: 'weapons', city: 'xx-nowhere', dateFrom: 'tomorrow', priceMax: 500, freeOnly: 'yes' });
  ok(c.page === 199 && c.page_size === 50 && c.sort === 'newest' && !('kind' in c) && !('category' in c) && !('city' in c) && !('date_from' in c)
    && !('price_max' in c) && !('currency' in c) && !('free_only' in c), 'market listings: searchBody clamps and drops what the server would refuse');
  ok(searchBody({ pageSize: -3, page: -4 }).page_size === 1 && searchBody({ page: -4 }).page === 0, 'market listings: searchBody clamps low values');
  ok(searchBody({ q: 'x'.repeat(300) }).q.length === 100, 'market listings: searchBody caps the query');
  ok(searchBody({ priceMin: 0, priceMax: 0, currency: 'THB' }).price_min === 0, 'market listings: a price of 0 is kept');
}
{
  const f = insertBody({ kind: 'item', intent: 'give', category: 'toys', city: 'th-bangkok', starts_on: '2026-10-20', ends_on: '2026-10-25', title: 'Toy box',
    body: '', price_amount: 0, owner: 'x', status: 'hidden', report_weight: 0, to_city: null, seats: undefined });
  ok(f.price_amount === 0 && f.title === 'Toy box' && !('owner' in f) && !('status' in f) && !('report_weight' in f) && !('body' in f) && !('to_city' in f) && !('seats' in f), 'market listings: insertBody keeps allowed fields, drops private ones and empties');
}
ok(listingErrorCode(400, { code: 'P0001', message: 'text_rejected' }) === 'text_rejected' && listingErrorCode(400, { message: 'rate_limited:post' }) === 'rate_limited:post'
  && listingErrorCode(400, { message: 'not_signed_in' }) === 'signed_out' && listingErrorCode(401, { message: 'JWT expired' }, true) === 'expired'
  && listingErrorCode(401, null, false) === 'signed_out' && listingErrorCode(503, null, true) === 'server' && listingErrorCode(400, { message: 'something odd' }) === 'failed'
  && listingErrorCode(400, { code: '23514', message: 'new row for relation "listings" violates check constraint "listings_category"' }) === 'category_invalid'
  && listingErrorCode(409, { code: '23505', message: 'duplicate key value violates unique constraint "reports_once_per_listing"' }) === 'already_reported', 'market listings: listingErrorCode maps server messages');
for (const code of ['market_closed', 'not_member', 'cash_closed', 'account_too_new', 'city_invalid', 'to_city_invalid', 'kind_intent', 'kind_fields',
  'category_invalid', 'activity_invalid', 'room_type_invalid', 'seats_invalid', 'price_invalid', 'currency_invalid', 'dates_required', 'window_order',
  'window_past', 'window_too_long', 'starts_too_late', 'title_length', 'title_invalid', 'body_length', 'body_invalid', 'text_rejected', 'contact_details',
  'status_invalid', 'not_owner', 'gone', 'rate_limited:post', 'rate_limited:open', 'rate_limited:same_title', 'rate_limited:report', 'rate_limited:name',
  'report_reason_invalid', 'report_target_invalid', 'own_listing', 'already_reported', 'note_length', 'sort_invalid', 'page_invalid', 'currency_required']) {
  const text = listingErrorText({ code });
  ok(typeof text === 'string' && text.length > 8 && text !== listingErrorText({ code: 'nothing-like-it' }), `market listings: the code "${code}" has its own plain copy`);
}
ok(listingErrorText({ code: 'text_rejected' }) === 'This breaks the market rules.' && listingErrorText({ code: 'contact_details' }) === 'Keep contact details for messages.', 'market listings: the two section 8 sentences are exact');
ok(!/[a-z]_[a-z]/.test(listingErrorText({ code: 'rate_limited:post' })) && !/server|exception|postgres/i.test(Object.values({ a: listingErrorText({ code: 'failed' }) }).join()), 'market listings: copy never shows a code or a server word');

// The Market's artwork (js/market-art.js, slice M4b-1): one drawing per kind and per item
// category, every colour a class that css/market.css maps to a theme token, nothing fetched.
ok(ART_KEYS.length === KINDS.length + ITEM_CATEGORIES.length && KINDS.concat(ITEM_CATEGORIES).every((k) => ART_KEYS.includes(k)), 'market art: one drawing per kind and per item category');
ok(artKey({ kind: 'item', category: 'bicycle' }) === 'bicycle' && artKey({ kind: 'item', category: 'weapons' }) === 'item' && artKey({ kind: 'ride', category: 'books' }) === 'ride'
  && artKey({ kind: 'cash' }) === 'item' && artKey(null) === 'item', 'market art: artKey picks the category for items, the kind otherwise');
for (const k of ART_KEYS) {
  const svg = artSVG(k);
  ok(!/#[0-9a-f]{3,8}\b|rgba?\(|hsla?\(|\b(fill|stroke|style|color)=/i.test(svg), `market art: "${k}" carries no literal colour (classes only)`);
  ok(!/<script|href|url\(|<image|<foreignObject|\bon[a-z]+=/i.test(svg), `market art: "${k}" has no script, link or external reference`);
  ok(/aria-hidden="true"/.test(svg) && [...svg.matchAll(/class="([^"]*)"/g)].every((m) => m[1].split(' ').every((c) => /^(mxa|b|s|p|a|w|i|o|k|g[1-4])$/.test(c))), `market art: "${k}" is decorative and uses only the mapped classes`);
}
ok(artBytes() > 0 && artBytes() < 16384, `market art: the 14 drawings stay small (${artBytes()} bytes)`);
console.log(`market art: ${ART_KEYS.length} drawings, ${artBytes()} bytes of SVG`);

// --- report ------------------------------------------------------------------
if (warnings.length) {
  console.warn(`\n${warnings.length} warning(s), non-fatal, worth a look:`);
  for (const w of warnings) console.warn('  ⚠ ' + w);
  console.warn('');
}
if (errors.length) {
  console.error(`VALIDATION FAILED: ${errors.length} error(s) across ${checks} checks\n`);
  for (const e of errors) console.error('  ✗ ' + e);
  process.exit(1);
}
console.log(`VALIDATION PASS: ${checks}/${checks} checks across ${COUNTRIES.length} countries, ${Object.keys(LANGUAGES).length} languages, ${dishCount} dishes, ${PRODUCE.length} produce, ${NATURE.length} species, ${POOLS.length} pools, ${ITINERARIES.length} itineraries and ${Object.keys(PHOTOS).length} photos.`);
