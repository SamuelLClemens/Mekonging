// Identify food — the dish list, one dish's page, and the diet/allergy card that both this
// screen and Nearby show.
//
// Extracted from js/main.js (screen split, mk-v0.539.0). These three were 275 lines of the
// eagerly-parsed launch graph for a screen most launches never open, and the split is worth
// more than the byte count suggests: a launch measured on the live site with a cleared cache
// spent 12.4 SECONDS evaluating that graph, against 250 ms on localhost, so every screen taken
// out of it is time a traveller is not staring at a splash.
//
// The four filter variables came with the code, and had to: a module's `let` cannot be
// assigned from another module. Leaving them in main.js would have made every filter on this
// screen throw at the first tap.
//
// Everything reverse-imported from main.js below is read INSIDE function bodies only, never at
// module top level — main.js imports this file's screens through SCREEN_LOADERS, so the two
// form a legal cycle that only stays legal on that condition.
import { h, debounce, haversineKm } from '../util.js';
import { screenHint } from '../ui-widgets.js';
import { store, getLastFix } from '../state.js';
import { getActiveCountry } from '../app-state.js';
import { DIET_LABEL, dishMeatHits, joinList } from '../data/diet.js';
import { sourcesNote, photoBlock, attrTag } from '../render-utils.js';
import { hasVoiceFor, speak, canSay, say } from '../tts.js';
import { scriptLang } from '../phrase-ui.js';
import {
  COUNTRIES, getCountry, getLanguage, getFood, allFood, getDish, FOOD_CATEGORIES, FOOD_ALLERGENS,
} from '../data/regions.js';
import {
  go, mount, topbar, priceLine, foodCard, kmLabel, mapsSearch, imageSearch, idPinButton,
  nearestFirst, spiceLabel, dishSpiceCaution, dishDietVerdict, dishDietReasons,
  dietAvoidAllergens, dietEvaluable, DIET_PHRASES, KOSHER, KOSHER_SOURCES, VEG_SPOTS,
} from '../main.js';

let foodCountry = '';
let foodQuery = '';
let foodCat = '';
let foodFitOnly = false;
const foodAvoid = new Set();

export function foodScreen(country) {
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
  profBox.append(h('button', { class: 'btn ghost block btn-spaced', onclick: () => go(`#phrasebook-${foodLang}`) }, '🗣 Show my allergy phrases to the cook'));
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
    const kc = h('div', { class: 'card allergy-card', style: 'margin:12px 0' }, [h('h2', {}, '✡️ Kosher food & Chabad houses')]);
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
    const hc = h('div', { class: 'card allergy-card', style: 'margin:12px 0' }, [h('h2', {}, '🕌 Halal & pork-free')]);
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
    hc.append(h('button', { class: 'btn ghost block btn-spaced', onclick: () => go('#worship') }, 'Mosques & Muslim quarters — Places of worship'));
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

export function dishScreen(id) {
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

// Diet-aware "where you can actually eat" card for the traveller's declared diet: verified
// kosher (Chabad) and/or vegetarian/vegan venues, nearest-first, plus an honest halal note.
// Returns null when the profile needs none. opts.only = 'veg' | 'kosher' to show one section.
export function dietEatCard(cc, fix, opts) {
  opts = opts || {};
  const diet = store.profile.prefs.diet || [];
  const wantKosher = diet.includes('kosher') && opts.only !== 'veg';
  const wantVeg = (diet.includes('vegan') || diet.includes('vegetarian')) && opts.only !== 'kosher';
  const wantHalal = diet.includes('halal') && !opts.only;
  if (!wantKosher && !wantVeg && !wantHalal) return null;
  const card = h('div', { class: 'card allergy-card', style: 'margin:12px 0' }, [h('h2', {}, '🍽 Where you can eat')]);
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
