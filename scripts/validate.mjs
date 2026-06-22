// Content validator. Importing the modules also parses them, so any syntax error
// fails the run. Then it checks required fields, verified stamps (YYYY-MM), and
// that every price is a low<=high range. Exits non-zero on any failure.
//
// Run: node scripts/validate.mjs   (or: npm run validate)

import { COUNTRIES, LANGUAGES, allPlaces } from '../js/data/regions.js';

let checks = 0;
const errors = [];
const ok = (cond, msg) => { checks++; if (!cond) errors.push(msg); };
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
for (const p of allPlaces()) {
  ok(p.id && !seenIds.has(p.id), `place: duplicate or missing id (${p.id})`);
  seenIds.add(p.id);
  ok(p.name && p.city && p.country, `place ${p.id}: missing name/city/country`);
  ok(Array.isArray(p.categories) && p.categories.length > 0, `place ${p.id}: missing categories`);
  ok(['low', 'mid', 'high', 'any'].includes(p.budgetTier), `place ${p.id}: bad budgetTier`);
  ok(p.blurb && p.whyItFits, `place ${p.id}: missing blurb/whyItFits`);
  ok(p.priceRange && typeof p.priceRange.currency === 'string', `place ${p.id}: missing priceRange.currency`);
  ok(p.priceRange && p.priceRange.low <= p.priceRange.high, `place ${p.id}: price low>high`);
  ok(isYM(p.verified), `place ${p.id}: bad/missing verified (${p.verified})`);
  ok(p.mapQuery || p.coords, `place ${p.id}: missing mapQuery/coords`);
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
if (errors.length) {
  console.error(`VALIDATION FAILED: ${errors.length} error(s) across ${checks} checks\n`);
  for (const e of errors) console.error('  ✗ ' + e);
  process.exit(1);
}
console.log(`VALIDATION PASS: ${checks}/${checks} checks across ${COUNTRIES.length} countries and ${Object.keys(LANGUAGES).length} languages.`);
