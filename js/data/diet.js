// Diet & allergy logic — the pure, DOM-free core behind the food identifier's red/green
// verdict, the dish-detail banner, and the pinned phrasebook allergy card.
//
// SAFETY: the verdict is guidance drawn ONLY from each dish's LISTED allergens and
// ingredients, never a guarantee. A green ('ok') verdict means "nothing you avoid is listed",
// not "confirmed safe" — recipes and shared woks vary; the real safety tool is showing the
// cook the translated allergy phrase. Belief flags vegetarian/vegan/pescatarian/halal/kosher/
// no-pork/no-beef/no-alcohol DO drive the verdict via structured ingredient inspection (land
// meat and alcohol matching). Two flags intentionally NEVER colour a dish: no-chili is spice
// guidance only (see dishSpiceCaution in main.js); no-msg is undetectable from listed
// ingredients — both are phrasebook/spice-note only.
//
// This module is deliberately free of DOM and app state so scripts/validate.mjs can import and
// behaviourally test it. Every function takes `diet` explicitly (default []); main.js wraps
// them to inject the saved profile (store.profile.prefs.diet).
import { FOOD_ALLERGENS } from './regions.js';

export const DIET_OPTIONS = [
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
export const DIET_LABEL = Object.fromEntries(DIET_OPTIONS.flatMap((g) => g.items).map((it) => [it.id, it]));

// Belief flags that DO drive the red/green verdict via ingredient inspection.
export const DIET_EVALUABLE_BELIEFS = ['vegetarian', 'vegan', 'pescatarian', 'no-pork', 'no-beef', 'halal', 'kosher', 'no-alcohol'];
// Flags that INTENTIONALLY never colour a dish (guidance/phrasebook only):
//  - no-chili: spice guidance only (dishSpiceCaution).
//  - no-msg:   MSG is not detectable from listed ingredients; pinned to the MSG phrase only.
// Every DIET_OPTIONS id must be either an allergen, an evaluable belief, or listed here —
// scripts/validate.mjs asserts this so a future flag cannot be silently inert.
export const VERDICT_INERT_DIET = ['no-chili', 'no-msg'];
// FOOD_ALLERGENS that colour dishes but still lack a sourced phrasebook translation (never
// fabricate a safety-critical translation). Shrink this as real phrases land; the self-test
// fails if any OTHER allergen loses its phrase, and fails if this list grows.
export const PHRASE_PENDING_ALLERGENS = ['sesame'];

// Pork-derived terms for no-pork / halal / kosher (beyond the bare word "pork").
export const PORK_DERIVED = ['pork', 'bacon', 'ham', 'lard', 'gelatin', 'gelatine'];
export const MEAT_TERMS = ['pork', 'beef', 'chicken', 'duck', 'buffalo', 'goat', 'lamb', 'bacon', 'ham', 'sausage', 'offal', 'liver', 'lard', 'gelatin', 'gelatine'];
export const ALCOHOL_TERMS = ['beer', 'wine', 'sake', 'rum', 'whisky', 'whiskey', 'vodka', 'brandy', 'liquor', 'lager', 'spirit', 'lao-lao', 'lao khao', 'rượu', 'shaoxing'];
// Dairy products that legitimately contain a meat-animal word (buffalo milk, goat cheese);
// these must NOT register as a meat hit.
const DAIRY_CTX = /milk|curd|cheese|yogh?urt|mozzarella|butter|cream|ghee/;

// Phrase mapping for allergyPhrasesForProfile (exported so the self-test can check coverage).
export const PHRASE_RX = {
  general: /food allergy/i, egg: /\begg/i, peanut: /peanut/i, treenut: /tree nut/i,
  shellfish: /shellfish|seafood/i, fish: /^no fish/i, dairy: /dairy|milk/i, soy: /\bsoy/i,
  gluten: /gluten|wheat/i, msg: /msg/i, chili: /chili|spicy/i,
};
export const PHRASE_KEYS = {
  egg: ['egg'], peanut: ['peanut'], 'tree nut': ['treenut'], shellfish: ['shellfish'],
  fish: ['fish'], dairy: ['dairy'], soy: ['soy'], gluten: ['gluten'], sesame: [],
  vegetarian: ['fish', 'shellfish'], vegan: ['fish', 'shellfish', 'egg', 'dairy'],
  'no-msg': ['msg'], 'no-chili': ['chili'],
};

// The allergen keys (matching FOOD_ALLERGENS) a profile means to avoid — including the ones
// implied by a vegetarian/vegan choice. Only these can colour a dish red.
export function dietAvoidAllergens(diet) {
  const set = new Set();
  for (const key of (diet || [])) {
    if (FOOD_ALLERGENS.includes(key)) set.add(key);
    if (key === 'vegetarian') { set.add('fish'); set.add('shellfish'); }
    if (key === 'vegan') { set.add('fish'); set.add('shellfish'); set.add('egg'); set.add('dairy'); }
  }
  return set;
}

export function dietIsVeg(diet) {
  const d = diet || [];
  return d.includes('vegan') ? 'vegan' : d.includes('vegetarian') ? 'vegetarian' : '';
}

// Does this profile carry any flag we can actually evaluate against a dish?
export function dietEvaluable(dietArr, av) {
  if (av && av.size) return true;
  return (dietArr || []).some((f) => DIET_EVALUABLE_BELIEFS.includes(f));
}

// Guard against mock/plant meats ("mock duck", "vegetarian chicken", "chicken-free"). A marker
// must sit immediately before the meat term (no bridging word), so a real marinade cannot mask
// a real meat ("soy-braised pork" stays pork). 'soy' is NOT a marker (ordinary cooking token),
// and 'plant-based' (not bare 'plant') avoids the "eggplant" collision.
export function isMockMeat(s, t) {
  return new RegExp(`(mock|vegan|vegetarian|plant-based|imitation|faux)[ -]?${t}`).test(s)
    || new RegExp(`${t}[ -](substitute|alternative|free)`).test(s);
}

// The land meats / poultry (and pork-derived fats) named in this dish's ingredients. Uses word
// boundaries so "ham" does not match inside "nuoc cham" (and "liver" != "liverwort"); buffalo
// and goat are skipped when the ingredient is a dairy product (buffalo milk, goat cheese).
export function dishMeatHits(d) {
  const ings = ((d && d.ingredients) || []).map((i) => i.toLowerCase());
  const hits = [];
  for (const t of MEAT_TERMS) {
    const rx = new RegExp(`\\b${t}\\b`);
    const dairyProne = (t === 'buffalo' || t === 'goat');
    if (ings.some((s) => rx.test(s) && !isMockMeat(s, t) && !(dairyProne && DAIRY_CTX.test(s))) && !hits.includes(t)) hits.push(t);
  }
  if (!hits.length && ings.some((s) => /\bmeat\b/.test(s) && !isMockMeat(s, 'meat'))) hits.push('meat');
  return hits;
}

// True alcohol. Reads ingredients AND the dish name/roman, because fermented/distilled drinks
// list their base grain (not the alcohol) in ingredients — e.g. Beerlao, Lao-Lao (Rice Whisky).
// Excludes "rice wine vinegar" / "wine vinegar". Description prose is NOT scanned, to avoid a
// false positive from a casual mention ("pairs well with beer").
export function dishHasAlcohol(d) {
  const ings = ((d && d.ingredients) || []).map((i) => i.toLowerCase());
  if (ings.some((s) => ALCOHOL_TERMS.some((t) => s.includes(t)) && !/vinegar/.test(s))) return true;
  const meta = [d && d.name, d && d.roman].filter(Boolean).join(' ').toLowerCase();
  return !!meta && ALCOHOL_TERMS.some((t) => meta.includes(t)) && !/vinegar/.test(meta);
}

// The full, human-readable list of why a dish conflicts with the traveller's diet profile:
// flagged allergens + meats + alcohol, according to which beliefs/preferences are set.
export function dishDietReasons(d, avoid, diet) {
  const dietArr = diet || [];
  const set = new Set(dietArr);
  const av = avoid || dietAvoidAllergens(dietArr);
  const reasons = [];
  const add = (r) => { if (r && !reasons.includes(r)) reasons.push(r); };
  ((d && d.allergens) || []).forEach((a) => { if (av.has(a)) add(a); });
  const meat = dishMeatHits(d);
  const pork = meat.filter((m) => PORK_DERIVED.includes(m));
  if (set.has('vegetarian') || set.has('vegan') || set.has('pescatarian')) meat.forEach(add);
  if (set.has('no-pork') || set.has('halal') || set.has('kosher')) pork.forEach(add);
  if (set.has('no-beef') && meat.includes('beef')) add('beef');
  if (set.has('kosher') && ((d && d.allergens) || []).includes('shellfish')) add('shellfish');
  if ((set.has('halal') || set.has('no-alcohol')) && dishHasAlcohol(d)) add('alcohol');
  return reasons;
}

// Verdict for one dish vs. the profile: 'bad' (lists something to avoid), 'ok' (nothing
// flagged — still confirm), or '' (no evaluable flag set → no border).
export function dishDietVerdict(d, avoid, diet) {
  const dietArr = diet || [];
  const av = avoid || dietAvoidAllergens(dietArr);
  if (!dietEvaluable(dietArr, av)) return '';
  return dishDietReasons(d, av, dietArr).length ? 'bad' : 'ok';
}

// "peanut", "peanut and shellfish", "peanut, shellfish and egg" — a natural inline list.
export function joinList(arr) {
  if (arr.length <= 1) return arr[0] || '';
  if (arr.length === 2) return `${arr[0]} and ${arr[1]}`;
  return `${arr.slice(0, -1).join(', ')} and ${arr[arr.length - 1]}`;
}
