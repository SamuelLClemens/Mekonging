// Content validator. Importing the modules also parses them, so any syntax error
// fails the run. Then it checks required fields, verified stamps (YYYY-MM), and
// that every price is a low<=high range. Exits non-zero on any failure.
//
// Run: node scripts/validate.mjs   (or: npm run validate)

import { COUNTRIES, LANGUAGES, allPlaces, allFood, FOOD_ALLERGENS, FOOD_CATEGORIES } from '../js/data/regions.js';

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
  // Optional traveller-fit fields — validated only when present, so existing places pass.
  if (p.kidFriendly != null) ok(typeof p.kidFriendly === 'boolean', `place ${p.id}: kidFriendly must be boolean`);
  if (p.isLocal != null) ok(p.isLocal === true, `place ${p.id}: isLocal, if present, must be true`);
  if (p.stayType != null) ok(['tent', 'hostel', 'guesthouse', 'homestay', 'hotel', 'resort', 'apartment'].includes(p.stayType), `place ${p.id}: bad stayType (${p.stayType})`);
  if (p.stayDuration != null) ok(['short', 'long', 'both'].includes(p.stayDuration), `place ${p.id}: bad stayDuration (${p.stayDuration})`);
  if (p.activities != null) ok(Array.isArray(p.activities), `place ${p.id}: activities must be an array`);
  if (p.amenities != null) ok(Array.isArray(p.amenities), `place ${p.id}: amenities must be an array`);
  if (p.recognition != null) ok(typeof p.recognition === 'string' && p.recognition.length > 0, `place ${p.id}: recognition must be a non-empty string`);
  if (p.localName != null) ok(typeof p.localName === 'string' && p.localName.length > 0, `place ${p.id}: localName must be a non-empty string`);
  // Market metadata — optional, validated only when present. marketDays is an array of
  // weekday indices (0=Sun … 6=Sat) for periodic markets; absent/empty means daily.
  if (p.marketDays != null) ok(Array.isArray(p.marketDays) && p.marketDays.every((d) => Number.isInteger(d) && d >= 0 && d <= 6), `place ${p.id}: marketDays must be an array of integers 0-6`);
  if (p.marketType != null) ok(typeof p.marketType === 'string' && p.marketType.length > 0, `place ${p.id}: marketType must be a non-empty string`);
  if (p.sells != null) ok(typeof p.sells === 'string' && p.sells.length > 0, `place ${p.id}: sells must be a non-empty string`);
  // Beach & swimming safety — optional, validated only when present. lifeguard is an
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
        `place ${p.id}: externalRating '${e.site}' has only ${e.count} reviews for a non-stay place — verify it is the correct entity`);
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
// ⚠️ warning silently fails to fire — a false-negative in a safety feature. The vocabulary
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
  // Allergen vocabulary conformance — the safety-critical check. Empty allergens[] is valid
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
        ok(o.price && o.price.low <= o.price.high, `routes ${c.id}/${r.id}: option price low>high`);
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

// --- report ------------------------------------------------------------------
if (warnings.length) {
  console.warn(`\n${warnings.length} warning(s) — non-fatal, worth a look:`);
  for (const w of warnings) console.warn('  ⚠ ' + w);
  console.warn('');
}
if (errors.length) {
  console.error(`VALIDATION FAILED: ${errors.length} error(s) across ${checks} checks\n`);
  for (const e of errors) console.error('  ✗ ' + e);
  process.exit(1);
}
console.log(`VALIDATION PASS: ${checks}/${checks} checks across ${COUNTRIES.length} countries, ${Object.keys(LANGUAGES).length} languages and ${dishCount} dishes.`);
