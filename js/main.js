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
} from './state.js';
import { CHECKLIST } from './data/checklist.js';
import { bestForCountry, getBestList } from './data/bestof.js';
import { PHOTOS } from './data/photos.js';
import { putBlob, getBlob, delBlob } from './idb.js';
import {
  available as vaultAvailable, isInitialised as vaultInitialised, isUnlocked as vaultUnlocked,
  lock as vaultLock, setup as vaultSetup, unlock as vaultUnlock, addDocument as vaultAdd,
  listDocuments as vaultList, getDocument as vaultGet, deleteDocument as vaultDelete, wipeVault as vaultWipe,
} from './vault.js';
import { h, esc, money, range, mapsUrl, debounce, geolocate } from './util.js';
import { speak, stop as stopSpeak, hasVoiceFor, say, canSay } from './tts.js';
import { translate, isConfigured as translateConfigured } from './translate.js';
import { getRates, refreshRates, convert } from './currency.js';
import { WEATHER_SPOTS, wmo, isWet, spotKey, spotsForCountry, defaultSpot, getCachedWeather, refreshWeather, refreshMany, getCachedMany } from './weather.js';
import { RATING_BANDS, ROUTE_LEGEND, ratingColor, effectiveRating } from './map.js';
import {
  COUNTRIES, LANGUAGES, INTERESTS, COLLECTION_PRESETS,
  getCountry, getLanguage, allPlaces, getPlace,
  getEvents, allEvents, getEvent,
  getFood, allFood, getDish, FOOD_CATEGORIES, FOOD_ALLERGENS,
} from './data/regions.js';
import { ALLERGENS } from './data/allergens.js';
import { NATURE_GROUPS, allSpecies, getSpecies } from './data/nature.js';
import { SCHEDULES, SCHEDULES_VERIFIED, schedulesForCountry } from './data/schedules.js';
import { PRODUCE, PRODUCE_CATEGORIES, produceByCategory, getProduce } from './data/produce.js';
import { REGION_PATHS, REGION_LABELS, REGION_VIEWBOX, REGION_RIVER, REGION_PROJ } from './data/geo.js';

// ---- service worker + theme -------------------------------------------------
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
}

function applyTheme() {
  const root = document.documentElement;
  root.setAttribute('data-theme', store.profile.theme === 'dark' ? 'dark' : 'light');
  root.setAttribute('data-reduced-motion', prefersReducedMotion() ? 'on' : 'off');
  root.setAttribute('data-text', store.profile.textScale || 'm');
}

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

const TABS = [
  { hash: '#home', label: 'Home', ic: '🏠' },
  { hash: '#phrasebook', label: 'Talk', ic: '💬' },
  { hash: '#places', label: 'Places', ic: '📍' },
  { hash: '#map', label: 'Map', ic: '🗺️' },
  { hash: '#saved', label: 'Saved', ic: '⭐' },
];

function go(hash) {
  if (location.hash === hash) render();
  else location.hash = hash;
}

// ---- shell ------------------------------------------------------------------
function topbar(title, backHash) {
  return h('header', { class: 'topbar' }, [
    backHash ? h('button', { class: 'back', onclick: () => go(backHash) }, '‹ Back') : null,
    h('h1', {}, title),
  ]);
}

function tabbar(activeHashPrefix) {
  return h('nav', { class: 'tabbar' }, TABS.map((t) =>
    h('button', {
      'aria-current': activeHashPrefix === t.hash ? 'page' : null,
      onclick: () => go(t.hash),
    }, [h('span', { class: 'ic' }, t.ic), h('span', {}, t.label)])));
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
    <defs><linearGradient id="mkgh" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#F2A93B"/><stop offset="0.5" stop-color="#E8632A"/><stop offset="1" stop-color="#D6336C"/></linearGradient></defs>
    <g transform="translate(150 6)"><circle cx="30" cy="30" r="18" fill="url(#mkgh)"/>
      <g stroke="#F2A93B" stroke-width="3" stroke-linecap="round"><line x1="30" y1="2" x2="30" y2="9"/><line x1="30" y1="51" x2="30" y2="58"/><line x1="2" y1="30" x2="9" y2="30"/><line x1="51" y1="30" x2="58" y2="30"/><line x1="10" y1="10" x2="15" y2="15"/><line x1="45" y1="45" x2="50" y2="50"/><line x1="50" y1="10" x2="45" y2="15"/><line x1="15" y1="45" x2="10" y2="50"/></g></g>
    <text x="180" y="94" text-anchor="middle" font-family="'Avenir Next','Trebuchet MS',system-ui,sans-serif" font-weight="800" font-size="40" fill="url(#mkgh)" letter-spacing="0.5">Mekonging</text>
    <path d="M40 110 q40 -12 80 0 t80 0 t80 0 t40 0" fill="none" stroke="#16A39A" stroke-width="4" stroke-linecap="round"/></svg>`;
}
function homeScreen() {
  const wrap = h('div', { class: 'screen' });
  wrap.append(h('section', { class: 'hero' }, [
    h('div', { class: 'logo-wrap', html: logoSVG() }),
    h('p', {}, 'Travel Thailand, Vietnam, Cambodia & Laos like an expert.'),
  ]));
  wrap.append(h('div', { class: 'home-actions' }, [
    h('button', { class: 'btn ghost', onclick: () => go('#search') }, '🔎 Search everything'),
    h('button', { class: 'btn', style: 'background:var(--magenta)', onclick: () => go('#sos') }, '🆘 Emergency'),
  ]));
  wrap.append(h('h2', { class: 'home-section' }, 'Where are you headed?'));
  wrap.append(regionPicker());
  wrap.append(h('h2', { class: 'home-section' }, 'Everything you need'));

  const tiles = [
    { ic: '🌤️', t: 'Today’s plan', d: 'Weather-aware top picks', hash: '#today' },
    { ic: '🗺️', t: 'Offline map', d: 'See yourself, drop pins', hash: '#map' },
    { ic: '⭐', t: 'Saved & collections', d: 'Organise places by theme', hash: '#saved' },
    { ic: '🏆', t: 'Best of / top picks', d: 'Best for families & more', hash: '#bestof' },
    { ic: '🧳', t: 'My trip', d: 'Itinerary + budget log', hash: '#trip' },
    { ic: '✅', t: 'Pre-trip checklist', d: 'Visa, health, packing', hash: '#checklist' },
    { ic: '📖', t: 'Travel journal', d: 'Stamped entries + journey map', hash: '#journal' },
    { ic: '📅', t: 'Travel calendar', d: 'Stays, meals & ratings', hash: '#calendar' },
    { ic: '🎉', t: 'Festivals & events', d: 'Dates, on your calendar', hash: '#events' },
    { ic: '⛅', t: 'Weather & forecast', d: '7-day, updates on wifi', hash: '#weather' },
    { ic: '🍜', t: 'Identify food', d: 'Dishes, ingredients, allergens', hash: '#food' },
    { ic: '🥭', t: 'Market produce', d: 'Fruit, veg & herbs guide', hash: '#produce' },
    { ic: '🦋', t: 'Identify nature', d: 'Birds, animals, fish, plants', hash: '#nature' },
    { ic: '🕑', t: 'Transport schedules', d: 'Train/bus times, sync on wifi', hash: '#schedules' },
    { ic: '🤝', t: 'Bargain helper', d: 'Fair counter-offers', hash: '#bargain' },
    { ic: '💱', t: 'Currency converter', d: 'Live rates, works offline', hash: '#currency' },
    { ic: '🔒', t: 'Secure documents', d: 'Passports, encrypted on-device', hash: '#vault' },
    { ic: '⚙️', t: 'Settings', d: 'Languages, theme, translate', hash: '#settings' },
  ];
  wrap.append(h('div', { class: 'grid' }, tiles.map((x) =>
    h('button', { class: 'tile', onclick: () => go(x.hash) }, [
      h('span', { class: 'ic' }, x.ic), h('span', { class: 't' }, x.t), h('span', { class: 'd' }, x.d),
    ]))));

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
  const tiles = [
    { ic: '💬', t: 'Phrasebook', d: lang ? lang.label : 'Language', hash: `#phrasebook-${c.lang}` },
    { ic: '📍', t: 'Places', d: 'For your taste & budget', hash: `#places-${c.id}` },
    { ic: '💵', t: 'Fair prices', d: 'Avoid overcharging', hash: `#prices-${c.id}` },
    { ic: '🚌', t: 'Getting around', d: 'Best way to next place', hash: `#transport-${c.id}` },
    { ic: '🧭', t: 'Country guide', d: 'Money, SIM, visa, safety', hash: `#info-${c.id}` },
    { ic: '🏆', t: 'Best of', d: 'Top picks, families & more', hash: `#bestof-${c.id}` },
    { ic: '🎉', t: 'Festivals', d: 'Dates & holidays', hash: `#events-${c.id}` },
    { ic: '⛅', t: 'Weather', d: '7-day forecast', hash: `#weather-${c.id}` },
    { ic: '🌤️', t: 'Today’s plan', d: 'Weather-aware picks', hash: `#today-${c.id}` },
    { ic: '🕑', t: 'Schedules', d: 'Train/bus times', hash: `#schedules-${c.id}` },
    { ic: '🍜', t: 'Food', d: 'Dishes & ingredients', hash: `#food-${c.id}` },
    { ic: '💱', t: 'Currency', d: `Convert to ${c.currency}`, hash: '#currency' },
    { ic: '🦋', t: 'Identify nature', d: 'Birds, fish, plants', hash: '#nature' },
    { ic: '🗺️', t: 'Map', d: 'Offline + GPS', hash: '#map' },
    { ic: '🆘', t: 'Emergency', d: 'Numbers + key phrases', hash: '#sos' },
    { ic: '⭐', t: 'Saved', d: 'Your collections', hash: '#saved' },
  ];
  wrap.append(h('div', { class: 'grid' }, tiles.map((x) =>
    h('button', { class: 'tile', onclick: () => go(x.hash) }, [
      h('span', { class: 'ic' }, x.ic), h('span', { class: 't' }, x.t), h('span', { class: 'd' }, x.d),
    ]))));
  mount(wrap, '#home');
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

  // Say-it tool: type or speak English, get the local text + spoken pronunciation.
  wrap.append(liveTranslateBox(code, book.label, book.locale));

  // search
  wrap.append(h('h2', { class: 'cat-title' }, 'Phrasebook'));
  const search = h('input', {
    class: 'search', type: 'search', placeholder: `Search ${book.label} phrases…`, value: phraseQuery,
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
      for (const p of matches) {
        listEl.append(h('div', { class: 'phrase' }, [
          h('div', { class: 'grow' }, [
            h('div', { class: 'en' }, p.en),
            h('div', { class: 'native' }, p.script),
            h('div', { class: 'roman' }, [h('span', { class: 'lbl' }, 'say:'), p.roman]),
            p.note ? h('div', { class: 'note' }, p.note) : null,
          ]),
          h('button', {
            class: 'speak', 'aria-label': `Speak: ${p.en}`, disabled: canSay(book.locale) ? null : '',
            onclick: () => say(p.script, book.locale),
          }, '🔊'),
        ]));
      }
    }
    if (!listEl.children.length) listEl.append(h('p', { class: 'empty' }, 'No phrases match your search.'));
  }
  renderPhrases();
  mount(wrap, '#phrasebook');
}

// Speak/type-in-English → local-language text + spoken audio. Works with no setup
// (free online service); the offline phrasebook below covers the essentials.
function liveTranslateBox(code, label, locale) {
  const box = h('div', { class: 'card translate-card' }, [
    h('h2', { style: 'margin-top:0' }, `Say it in ${label}`),
    h('p', { class: 'muted', style: 'margin-top:0' }, `Type or speak in your language; get the ${label} text and hear it spoken. Needs internet.`),
  ]);
  const srcSel = selectEl([['en', 'From English'], ['he', 'From Hebrew (עברית)']], 'en', () => {});
  const input = h('input', { class: 'search', type: 'text', placeholder: 'e.g. Where is the bus station?' });
  const out = h('div', { class: 'tr-out', style: 'margin-top:10px' });

  const doTranslate = async () => {
    const text = input.value.trim();
    if (!text) return;
    out.innerHTML = ''; out.append(h('p', { class: 'muted' }, 'Translating…'));
    try {
      const res = await translate(text, code, srcSel.value);
      out.innerHTML = '';
      out.append(h('div', { class: 'native', style: 'font-size:23px;line-height:1.35' }, res));
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
function placesScreen(countryId) {
  if (countryId) activeCountry = countryId;
  const wrap = h('div', { class: 'screen' });
  wrap.append(topbar('Places for you'));
  wrap.append(countryChips((id) => go(`#places-${id}`)));

  // interest filters (seeded from saved prefs the first time)
  const prefs = store.profile.prefs;
  const selInterests = new Set(prefs.interests || []);
  let selBudget = prefs.budget || 'flexible';

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

  wrap.append(h('div', {}, [h('div', { class: 'muted' }, 'Interests'), interestChips,
                            h('div', { class: 'muted' }, 'Budget'), budgetChips]));

  const listEl = h('div', {});
  wrap.append(listEl);

  function renderList() {
    listEl.innerHTML = '';
    const country = getCountry(activeCountry);
    if (!country || !Array.isArray(country.places)) {
      listEl.append(h('p', { class: 'empty' }, `${country ? country.name : 'This country'} places are coming soon. Thailand is fully covered in this build.`));
      return;
    }
    const results = allPlaces({
      country: activeCountry,
      interests: [...selInterests],
      budget: selBudget,
    });
    if (!results.length) { listEl.append(h('p', { class: 'empty' }, 'No places match these filters. Try widening them.')); return; }
    for (const p of results) listEl.append(placeCard(p));
  }
  renderList();
  mount(wrap, '#places');
}

function tierBadge(tier) {
  const lbl = { low: 'Budget', mid: 'Mid', high: 'Higher-end', any: 'Any' }[tier] || tier;
  return h('span', { class: `tier ${tier}` }, lbl);
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

function placeCard(p) {
  const cats = Array.isArray(p.categories) ? p.categories : [];
  const hasPrice = p.priceRange && p.priceRange.currency;
  const priceStr = hasPrice ? (priceLine(p.priceRange.low, p.priceRange.high, p.priceRange.currency) || 'Free') : '';
  const colls = collectionsForItem(p.id);
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
    p.blurb ? h('p', {}, p.blurb) : null,
    h('p', { class: 'muted' }, [p.city, priceStr].filter(Boolean).join(' · ')),
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
  const close = () => backdrop.remove();
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
    const input = h('input', { class: 'search', type: 'text', placeholder: 'New collection name…', style: 'margin-top:8px' });
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
  document.body.append(backdrop);
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

  const colls = collectionsForItem(p.id);
  const collStrip = colls.length
    ? h('div', { class: 'cats', style: 'margin-top:8px' }, colls.map((c) => h('span', { class: 'cat-tag', style: 'background:var(--grape)' }, `${c.emoji} ${c.name}`)))
    : null;

  const actions = h('div', { class: 'card' }, [
    (p.coords || p.mapQuery) ? h('a', { class: 'btn block', href: mapsUrl(p), target: '_blank', rel: 'noopener' }, 'Open in Maps') : null,
    h('button', { class: 'btn ghost block', style: 'margin-top:8px', onclick: () => saveSheet(p.id) }, '＋ Save to collections'),
    collStrip,
    p.isPin ? h('button', {
      class: 'btn ghost block', style: 'margin-top:8px; color:var(--warn); border-color:var(--warn)',
      onclick: () => { if (confirm('Delete this pin?')) { deletePin(p.id); go('#saved'); } },
    }, 'Delete pin') : null,
  ]);

  wrap.append(card, actions, yourLayer(p));
  if (p.sources && p.sources.length) wrap.append(sourcesNote(p.sources, p.verified));
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

function sourcesNote(sources, verified) {
  return h('p', { class: 'disclaimer' },
    `Sources: ${sources.map((s) => s.org).join(', ')}${verified ? ` · verified ${verified}` : ''}. Guidance only — verify locally.`);
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
  const card = h('div', { class: 'card' });
  for (const it of data.items) {
    const row = h('div', { class: 'price-item' }, [
      h('div', { class: 'row-between' }, [
        h('strong', {}, it.label),
        h('span', { class: 'fair' }, `${priceLine(it.fair.low, it.fair.high, data.currency)}`),
      ]),
      h('div', { class: 'muted' }, `${it.unit}${it.notes ? ' · ' + it.notes : ''}`),
      it.scamNote ? h('div', { class: 'scam' }, `⚠ ${it.scamNote}`) : null,
      it.betterOption ? h('div', { class: 'better' }, `✓ Better: ${it.betterOption}`) : null,
    ]);
    card.append(row);
  }
  wrap.append(card);
  wrap.append(sourcesNote(data.sources, data.verified));
  mount(wrap, '#prices');
}

// ---- TRANSPORT --------------------------------------------------------------
function transportScreen(countryId) {
  if (countryId) activeCountry = countryId;
  const wrap = h('div', { class: 'screen' });
  wrap.append(topbar('Getting around', '#home'));
  wrap.append(countryChips((id) => go(`#transport-${id}`)));

  const country = getCountry(activeCountry);
  const routes = country && country.routes;
  if (!routes) {
    wrap.append(h('p', { class: 'empty' }, `${country ? country.name : 'This country'} routes are coming soon. Thailand is fully covered in this build.`));
    mount(wrap, '#home'); return;
  }
  for (const r of routes) {
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
    wrap.append(card);
  }
  wrap.append(h('p', { class: 'disclaimer' }, 'Times and prices are guidance and change with season and operator. Confirm before travel.'));
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
  const input = h('input', { class: 'search', type: 'text', placeholder: 'Name your theme…' });
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
  if (coll) {
    wrap.append(h('div', { class: 'card' }, [
      h('button', { class: 'btn ghost block', style: 'color:var(--warn); border-color:var(--warn)',
        onclick: () => { if (confirm(`Delete the “${coll.name}” collection? Your places stay; only the grouping is removed.`)) { deleteCollection(coll.id); go('#saved'); } } }, 'Delete collection'),
    ]));
  }
  mount(wrap, '#saved');
}

// ---- MAP (offline vector map + GPS + drop-a-pin) ----------------------------
function mapScreen() {
  const wrap = h('div', { class: 'screen' });
  wrap.append(topbar('Map'));
  wrap.append(h('p', { class: 'map-hint' }, 'Fully offline — the region map, your GPS location, saved pins, rated places and routes all work with no connection. Tap the map to drop a pin; use the ⊕ locate button to find yourself.'));

  const storeBtn = h('button', { class: 'btn ghost', onclick: showStorage }, 'Storage');
  const addBtn = h('button', { class: 'btn ghost', onclick: () => go('#addpin') }, '＋ Add a place');
  const toolbar = h('div', { class: 'map-toolbar' }, [addBtn, storeBtn]);
  const storageOut = h('p', { class: 'map-hint' }, '');
  async function showStorage() {
    const m = await import('./map.js'); const e = await m.storageEstimate();
    storageOut.textContent = e ? `Stored on device: about ${e.usageMB.toFixed(1)} MB.` : '';
  }

  const canvas = h('div', { id: 'map-canvas' });
  // Layer toggles: show/hide marker groups (all on by default). Wired to the map
  // controller once it initialises (mapCtrl). Markets are their own gold layer.
  let mapCtrl = null;
  const LAYER_DEFS = [['go', '📍 Things to do'], ['eat', '🍜 Places to eat'], ['market', '🛍️ Markets'], ['stay', '🛏️ Places to stay']];
  const layersCard = h('div', { class: 'card', style: 'padding:10px 12px' }, [
    h('div', { class: 'muted', style: 'font-weight:700;margin-bottom:6px' }, 'Map layers (tap to show or hide)'),
    h('div', { style: 'display:flex;flex-wrap:wrap;gap:8px 16px' }, [
      h('label', { style: 'display:flex;align-items:center;gap:6px;font-size:14px;cursor:pointer' }, [
        h('input', { type: 'checkbox', checked: '', onchange: (e) => { if (mapCtrl) mapCtrl.setSatellite(e.target.checked); } }),
        h('span', {}, '🛰️ Satellite imagery'),
      ]),
      ...LAYER_DEFS.map(([key, label]) => h('label', { style: 'display:flex;align-items:center;gap:6px;font-size:14px;cursor:pointer' }, [
        h('input', { type: 'checkbox', checked: '', onchange: (e) => { if (mapCtrl) mapCtrl.setLayer(key, e.target.checked); } }),
        h('span', {}, label),
      ])),
    ]),
    h('p', { class: 'muted', style: 'font-size:12px;margin:8px 0 0' }, 'Satellite imagery streams when online and is saved for the areas you view; the plain offline map always works with no connection.'),
  ]);
  wrap.append(toolbar, storageOut, canvas, layersCard);

  // legend: what the pin colours and route lines mean
  const dot = (c) => h('span', { style: `display:inline-block;width:12px;height:12px;border-radius:50%;background:${c};margin-right:6px;vertical-align:middle` });
  wrap.append(h('div', { class: 'card', style: 'padding:10px 12px' }, [
    h('div', { class: 'muted', style: 'font-weight:700;margin-bottom:5px' }, 'Pin colour = rating (your own rating wins)'),
    h('div', { style: 'display:flex;flex-wrap:wrap;gap:8px 14px;margin-bottom:8px' },
      RATING_BANDS.map((b) => h('span', { style: 'font-size:13px' }, [dot(b.color), b.label]))),
    h('div', { style: 'font-size:13px;margin-bottom:8px' }, [dot('#E0A100'), 'Markets (gold pin)']),
    h('div', { class: 'muted', style: 'font-weight:700;margin:6px 0 5px' }, 'Route lines = transport mode'),
    h('div', { style: 'display:flex;flex-wrap:wrap;gap:8px 14px' },
      ROUTE_LEGEND.map((b) => h('span', { style: 'font-size:13px' }, [dot(b.color), b.label]))),
  ]));

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
  })).then((ctrl) => { mapCtrl = ctrl; showStorage(); }).catch(() => {
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
  wrap.append(card);

  wrap.append(h('button', { class: 'btn block', onclick: () => {
    if (!name.value.trim()) { alert('Give the place a name.'); return; }
    const pin = addPin({ name: name.value.trim(), note: note.value.trim(), coords: state.coords });
    state.colls.forEach((cid) => togglePlaceInCollection(cid, pin.id));
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
  for (let i = 1; i <= 5; i++) stars.append(h('button', { class: 'star', onclick: () => { st.rating = st.rating === i ? 0 : i; paint(st.rating); } }, '☆'));
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

  const search = h('input', { class: 'search', type: 'search', placeholder: 'Search dishes or ingredients…', value: foodQuery,
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
    d.localName ? h('div', { class: 'native' }, d.localName) : null,
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
  const search = h('input', { class: 'search', type: 'search', placeholder: 'Search produce…', value: produceQuery,
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
    return {
      label: seg.label,
      code: Math.max(...inSeg.map((h) => h.code || 0)),
      pp: Math.max(...inSeg.map((h) => (h.pp == null ? 0 : h.pp))),
      tmin: Math.min(...inSeg.map((h) => h.temp)),
      tmax: Math.max(...inSeg.map((h) => h.temp)),
    };
  }).filter(Boolean);
}

function weatherScreen(country) {
  const wrap = h('div', { class: 'screen' });
  wrap.append(topbar('Weather & forecast', '#home'));
  if (country) weatherKey = spotKey(defaultSpot(country));
  if (!weatherKey) weatherKey = spotKey(defaultSpot(activeCountry || 'th'));
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
  if (navigator.onLine) refreshMany(spotsForCountry(curCountry)).then((r) => { if (r && (location.hash || '').startsWith('#weather')) renderMap(r.data); });

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
        detail.append(h('div', { class: 'muted', style: 'margin:4px 0 6px' },
          `Feels ${fmtTemp(d.appMin)}–${fmtTemp(d.appMax)} · Rain ${d.precip != null ? fmtPrecip(d.precip) : '–'} · UV ${d.uv != null ? Math.round(d.uv) : '–'} · Wind to ${fmtWind(d.windMax)} · ☀ ${wxTime(d.sunrise)}–${wxTime(d.sunset)}`));
        const segs = daySegments(rec.hourly, d.date);
        if (segs.length) {
          segs.forEach((s) => {
            const [sl, se] = wmo(s.code);
            detail.append(h('div', { class: 'row-between', style: 'padding:5px 0;border-top:1px solid rgba(0,0,0,0.06)' }, [
              h('span', { style: 'min-width:78px;font-weight:600' }, s.label),
              h('span', { style: 'font-size:18px' }, se),
              h('span', { class: 'muted grow', style: 'margin:0 8px;text-align:left' }, `${sl} · 💧${s.pp}%`),
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
  paint(cached, !cached && navigator.onLine);
  // Background refresh when online; repaint only if still on this city's screen.
  if (navigator.onLine) {
    refreshWeather(spot).then((r) => {
      if ((location.hash || '').startsWith('#weather') && spotKey(spot) === weatherKey && r) paint(r, false);
    });
  }
  mount(wrap, '#home');
}

// ---- TRANSPORT SCHEDULES (curated reference, re-synced on wifi) -------------
const SCHED_KEY = 'mk.sched.checkedAt';
let schedCountry = '';
function schedCheckedAt() { return Number(localStorage.getItem(SCHED_KEY)) || 0; }
async function schedRefresh() {
  if (!navigator.onLine) return false;
  try { await fetch('js/data/schedules.js', { cache: 'no-store' }); try { localStorage.setItem(SCHED_KEY, String(Date.now())); } catch { /* full */ } return true; }
  catch { return false; }
}
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
  wrap.append(h('p', { class: 'map-hint' }, 'Reference departure times for popular routes — guidance only; always reconfirm with the operator. They re-sync whenever you are online.'));

  const filters = [{ id: '', name: 'All', flag: '🌏' }].concat(COUNTRIES.map((c) => ({ id: c.id, name: c.name, flag: c.flag })));
  const chips = h('div', { class: 'chips' }, filters.map((f) =>
    h('button', { class: 'chip', 'aria-pressed': schedCountry === f.id ? 'true' : 'false', dataset: { c: f.id },
      onclick: () => { schedCountry = f.id; chips.querySelectorAll('.chip').forEach((x) => x.setAttribute('aria-pressed', x.dataset.c === f.id ? 'true' : 'false')); renderList(); } },
      `${f.flag} ${f.name}`)));
  wrap.append(chips);

  const syncLine = h('p', { class: 'muted', style: 'text-align:center;margin:6px 0' });
  function setSync() {
    const t = schedCheckedAt();
    syncLine.textContent = `Reference timetable (verified ${SCHEDULES_VERIFIED}) · ${t ? 'last synced ' + wxAgo(t) : 'not yet synced'}${navigator.onLine ? '' : ' · offline'}`;
  }
  setSync();
  wrap.append(syncLine);
  const refreshBtn = h('button', { class: 'btn ghost block' }, 'Refresh (needs internet)');
  refreshBtn.addEventListener('click', async () => { refreshBtn.textContent = 'Syncing…'; refreshBtn.disabled = true; await schedRefresh(); refreshBtn.textContent = 'Refresh (needs internet)'; refreshBtn.disabled = false; setSync(); });
  wrap.append(refreshBtn);

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

  // re-sync in the background when online, then refresh the stamp
  if (navigator.onLine) schedRefresh().then(() => { if ((location.hash || '').startsWith('#schedules')) setSync(); });
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
  if (country && getCountry(country)) activeCountry = country;
  const id = getCountry(activeCountry) ? activeCountry : 'th';
  const c = getCountry(id);
  const spot = defaultSpot(id);
  const wrap = h('div', { class: 'screen' });
  wrap.append(topbar('Today’s plan', '#home'));
  wrap.append(h('p', { class: 'map-hint' }, `Suggestions for ${c.name} today, weighing the weather and the highest-rated places (your own ratings count first).`));
  const locBtn = h('button', { class: 'btn ghost block', onclick: async () => {
    locBtn.textContent = 'Locating…'; locBtn.disabled = true;
    try { const pos = await geolocate(); dayUserLoc = { lat: pos.lat, lng: pos.lng }; } catch { /* denied/offline */ }
    locBtn.textContent = dayUserLoc ? '📍 Using your location' : '📍 Use my location for “near me”';
    locBtn.disabled = false; paint(lastRec);
  } }, dayUserLoc ? '📍 Using your location' : '📍 Use my location for “near me”');
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
      body.append(h('div', { class: 'card' }, [
        h('div', { class: 'row-between' }, [
          h('strong', {}, `${emo} ${c.flag} ${spot.city} today`),
          h('span', { style: 'font-weight:700' }, `${fmtTemp(today.tmin)} / ${fmtTemp(today.tmax)}`),
        ]),
        h('p', { class: 'muted', style: 'margin:6px 0 0' }, `${lbl} · rain ${today.rainProb != null ? today.rainProb + '%' : '–'} — ${moodLine(mood)}`),
      ]));
    } else {
      body.append(h('div', { class: 'card' }, [h('p', { class: 'muted' }, 'Connect once to load today’s weather for weather-aware picks; meanwhile, here are the top-rated places.')]));
    }
    const OUTDOOR = ['nature', 'waterfall', 'hike', 'park', 'beach', 'viewpoint', 'outdoors', 'island', 'dive', 'snorkel', 'garden'];
    const isOutdoor = (p) => (p.categories || []).some((cat) => OUTDOOR.includes(cat));
    const prefer = mood === 'wet' ? ['culture', 'food', 'market', 'museum', 'temple', 'cafe', 'nightlife', 'shopping', 'wellness']
      : mood === 'hot' ? ['culture', 'food', 'nature', 'nightlife'] : ['nature', 'culture', 'food', 'nightlife'];
    let scored = allPlaces({ country: id }).map((p) => {
      const er = effectiveRating(p.id, p.rating || 0);
      const catBonus = (p.categories || []).some((cat) => prefer.includes(cat)) ? 0.3 : 0;
      const outdoorPenalty = (mood === 'wet' && isOutdoor(p)) ? 1.6 : 0;
      const dist = (dayUserLoc && p.coords) ? haversineKm(dayUserLoc, p.coords) : null;
      const score = er + catBonus - outdoorPenalty - (dist != null ? Math.min(dist, 200) / 500 : 0);
      return { p, er, dist, score, outdoor: isOutdoor(p) };
    }).filter((x) => x.er > 0 || x.p.coords);
    if (mood === 'wet') {
      const indoor = scored.filter((x) => !x.outdoor);
      if (indoor.length >= 4) scored = indoor;   // hide outdoor picks entirely when enough indoor options exist
    }
    scored.sort((a, b) => b.score - a.score);
    const top = scored.slice(0, 8);
    const secLabel = mood === 'wet' ? (dayUserLoc ? 'Indoor-friendly, near you' : 'Indoor-friendly picks for the rain')
      : (dayUserLoc ? 'Highly rated near you' : 'Highly rated picks');
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
  if (navigator.onLine) {
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
    e.localName ? h('div', { class: 'native' }, e.localName) : null,
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
    e.localName ? h('div', { class: 'native' }, e.localName) : null,
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

function natureScreen() {
  const wrap = h('div', { class: 'screen' });
  wrap.append(topbar('Identify nature', '#home'));
  wrap.append(h('p', { class: 'map-hint' }, 'Browse or search the region’s wildlife and plants. Tap a species for field marks and a photo search.'));

  const search = h('input', { class: 'search', type: 'search', placeholder: 'Search by name…', value: natureQuery,
    oninput: debounce((e) => { natureQuery = e.target.value; renderList(); }, 120) });
  wrap.append(search);

  const groups = [{ id: '', label: 'All', emoji: '✶' }].concat(NATURE_GROUPS);
  const groupChips = h('div', { class: 'chips' }, groups.map((g) =>
    h('button', { class: 'chip', 'aria-pressed': natureGroup === g.id ? 'true' : 'false', dataset: { g: g.id },
      onclick: () => { natureGroup = g.id; groupChips.querySelectorAll('.chip').forEach((c) => c.setAttribute('aria-pressed', c.dataset.g === g.id ? 'true' : 'false')); renderList(); } },
      `${g.emoji} ${g.label}`)));
  wrap.append(groupChips);

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

  // budget log
  const bud = h('div', { class: 'card' }, [h('h2', {}, 'Budget log')]);
  const totals = {};
  store.trip.budgetLog.forEach((b) => { const c = b.currency || '?'; totals[c] = (totals[c] || 0) + (parseFloat(b.amount) || 0); });
  if (Object.keys(totals).length) bud.append(h('p', { class: 'fair' }, 'Total: ' + Object.entries(totals).map(([c, v]) => `${v.toLocaleString()} ${c}`).join(' · ')));
  store.trip.budgetLog.forEach((b) => bud.append(h('div', { class: 'row-between price-item' }, [
    h('span', {}, `${b.date} · ${b.note || 'spend'}`), h('span', {}, [h('strong', {}, `${b.amount} ${b.currency}`), ' ',
      h('button', { class: 'chip', onclick: () => { deleteBudgetItem(b.id); go('#trip'); } }, '✕')]),
  ])));
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
  wrap.append(h('input', { class: 'search', type: 'search', autofocus: '', value: searchQuery,
    placeholder: 'Find places, phrases, wildlife, prices…',
    oninput: debounce((e) => { searchQuery = e.target.value; renderResults(); }, 150) }));
  const out = h('div', {});
  wrap.append(out);

  function section(title, nodes) {
    if (!nodes.length) return;
    out.append(h('h2', { class: 'cat-title' }, `${title} (${nodes.length})`));
    nodes.slice(0, 8).forEach((n) => out.append(n));
    if (nodes.length > 8) out.append(h('p', { class: 'muted' }, `…and ${nodes.length - 8} more — refine your search`));
  }
  const link = (label, hash, extra) => h('button', { class: 'btn ghost block srch', onclick: () => { if (extra) extra(); go(hash); } }, label);

  function renderResults() {
    out.innerHTML = '';
    const q = searchQuery.trim().toLowerCase();
    if (q.length < 2) { out.append(h('p', { class: 'muted' }, 'Type at least two letters to search across the whole app — places, phrasebook, wildlife, prices and countries.')); return; }
    section('Places', allPlaces().filter((p) => `${p.name} ${p.blurb || ''} ${p.city || ''}`.toLowerCase().includes(q))
      .map((p) => link(`📍 ${p.name} — ${p.city}`, `#place-${p.id}`)));
    section('Wildlife & plants', allSpecies({ q }).map((s) => link(`${s.emoji || '🔎'} ${s.commonName}`, `#species-${s.id}`)));
    const phr = [];
    for (const b of Object.values(LANGUAGES)) for (const cat of b.categories) for (const p of cat.phrases) {
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
    if (!out.children.length) out.append(h('p', { class: 'empty' }, 'Nothing found. Try another word.'));
  }
  renderResults();
  mount(wrap, '#home');
}

// ---- EMERGENCY / SOS --------------------------------------------------------
function sosScreen() {
  const c = getCountry(activeCountry);
  const wrap = h('div', { class: 'screen' });
  wrap.append(topbar('Emergency', '#home'));
  if (!c) { wrap.append(h('p', { class: 'empty' }, 'Pick a country first.')); mount(wrap, '#home'); return; }

  const nums = h('div', { class: 'card sos-card' }, [h('h2', {}, `${c.flag} ${c.name} — call for help`)]);
  const em = (c.info && c.info.emergency) || [];
  if (em.length) em.forEach((e) => nums.append(h('a', { class: 'btn block sos-num', href: `tel:${String(e.number).replace(/\s/g, '')}` }, `${e.label}: ${e.number}`)));
  else nums.append(h('p', { class: 'muted' }, 'Emergency numbers are being added for this country.'));
  wrap.append(nums);

  const book = getLanguage(c.lang);
  const emCat = book && book.categories.find((cat) => cat.id === 'emergency');
  if (emCat) {
    const pcard = h('div', { class: 'card' }, [h('h2', {}, `Say it in ${book.label}`)]);
    const voiceOk = hasVoiceFor(book.locale);
    emCat.phrases.forEach((p) => pcard.append(h('div', { class: 'phrase' }, [
      h('div', { class: 'grow' }, [h('div', { class: 'en' }, p.en), h('div', { class: 'native' }, p.script), h('div', { class: 'roman' }, [h('span', { class: 'lbl' }, 'say:'), p.roman])]),
      h('button', { class: 'speak', disabled: voiceOk ? null : '', 'aria-label': `Speak ${p.en}`, onclick: () => speak(p.script, book.locale) }, '🔊'),
    ])));
    wrap.append(pcard);
  }
  wrap.append(h('a', { class: 'btn block', href: 'https://www.google.com/maps/search/?api=1&query=hospital%20near%20me', target: '_blank', rel: 'noopener' }, 'Find nearest hospital ↗'));
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

  card.append(field('Theme', selectEl([['light', 'Light'], ['dark', 'Dark']], p.theme,
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

  // reset
  wrap.append(h('div', { class: 'card' }, [
    h('button', { class: 'btn ghost block', onclick: () => {
      if (confirm('Reset all settings and saved places on this device?')) { resetAll(); applyTheme(); go('#home'); }
    } }, 'Reset everything'),
    h('p', { class: 'disclaimer' }, 'Mekong stores everything locally. Clearing your browser data also resets it.'),
  ]));
  mount(wrap, '#settings');
}

function field(labelText, control) {
  return h('div', { class: 'field' }, [h('label', {}, labelText), control]);
}
function selectEl(options, current, onchange) {
  const opts = options.map((o) => Array.isArray(o) ? o : [o, o]);
  return h('select', { onchange: (e) => onchange(e.target.value) },
    opts.map(([val, lbl]) => h('option', { value: val, selected: val === current ? '' : null }, lbl)));
}

// ---- router -----------------------------------------------------------------
function render() {
  applyTheme();
  const hash = location.hash || '#home';
  const [head, ...rest] = hash.slice(1).split('-');
  const arg = rest.join('-');
  try {
    switch (head) {
      case '': case 'home': return homeScreen();
      case 'country': return countryHubScreen(arg);
      case 'currency': return currencyScreen();
      case 'phrasebook': return phrasebookScreen(arg);
      case 'places': return placesScreen(arg);
      case 'place': return placeScreen(arg);
      case 'prices': return pricesScreen(arg);
      case 'transport': return transportScreen(arg);
      case 'info': return infoScreen(arg);
      case 'saved': return savedScreen();
      case 'collection': return collectionScreen(arg);
      case 'map': return mapScreen();
      case 'addpin': return addPinScreen();
      case 'journal': return journalDispatch(arg);
      case 'journey': return journeyScreen();
      case 'calendar': return calendarDispatch(arg);
      case 'events': return eventsScreen(arg);
      case 'event': return eventScreen(arg);
      case 'weather': return weatherScreen(arg);
      case 'today': return daySuggestScreen(arg);
      case 'schedules': return schedulesScreen(arg);
      case 'food': return foodScreen(arg);
      case 'dish': return dishScreen(arg);
      case 'produce': return arg ? produceDetail(arg) : produceScreen();
      case 'nature': return natureScreen();
      case 'species': return speciesScreen(arg);
      case 'search': return searchScreen();
      case 'sos': return sosScreen();
      case 'trip': return tripScreen();
      case 'bargain': return bargainScreen();
      case 'checklist': return checklistScreen(arg);
      case 'bestof': return bestofScreen(arg);
      case 'bestlist': return bestListScreen(arg);
      case 'vault': return vaultScreen();
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
// Re-render when device voices finish loading so speak buttons enable on the phrasebook.
if (typeof window !== 'undefined' && window.speechSynthesis) {
  try { window.speechSynthesis.addEventListener('voiceschanged', () => {
    if ((location.hash || '').startsWith('#phrasebook')) render();
  }); } catch { /* older API */ }
}
render();

// Refresh exchange rates in the background when online; update the converter if open.
refreshRates().then(() => { if ((location.hash || '').startsWith('#currency')) render(); }).catch(() => {});
