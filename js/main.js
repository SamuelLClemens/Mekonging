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
import { putBlob, getBlob, delBlob } from './idb.js';
import {
  available as vaultAvailable, isInitialised as vaultInitialised, isUnlocked as vaultUnlocked,
  lock as vaultLock, setup as vaultSetup, unlock as vaultUnlock, addDocument as vaultAdd,
  listDocuments as vaultList, getDocument as vaultGet, deleteDocument as vaultDelete, wipeVault as vaultWipe,
} from './vault.js';
import { h, esc, money, range, mapsUrl, debounce, geolocate } from './util.js';
import { speak, stop as stopSpeak, hasVoiceFor } from './tts.js';
import { translate, isConfigured as translateConfigured } from './translate.js';
import { getRates, refreshRates, convert } from './currency.js';
import {
  COUNTRIES, LANGUAGES, INTERESTS, COLLECTION_PRESETS,
  getCountry, getLanguage, allPlaces, getPlace,
} from './data/regions.js';
import { ALLERGENS } from './data/allergens.js';
import { NATURE_GROUPS, allSpecies, getSpecies } from './data/nature.js';
import { REGION_PATHS, REGION_LABELS, REGION_VIEWBOX } from './data/geo.js';

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
let activeCountry = 'th';   // current destination context (country id)
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
    h('button', { class: 'btn', style: 'background:var(--coral)', onclick: () => go('#sos') }, '🆘 Emergency'),
  ]));
  wrap.append(regionPicker());

  const tiles = [
    { ic: '🗺️', t: 'Offline map', d: 'See yourself, drop pins', hash: '#map' },
    { ic: '⭐', t: 'Saved & collections', d: 'Organise places by theme', hash: '#saved' },
    { ic: '🏆', t: 'Best of / top picks', d: 'Best for families & more', hash: '#bestof' },
    { ic: '🧳', t: 'My trip', d: 'Itinerary + budget log', hash: '#trip' },
    { ic: '✅', t: 'Pre-trip checklist', d: 'Visa, health, packing', hash: '#checklist' },
    { ic: '📖', t: 'Travel journal', d: 'Stamped entries + journey map', hash: '#journal' },
    { ic: '📅', t: 'Travel calendar', d: 'Stays, meals & ratings', hash: '#calendar' },
    { ic: '🦋', t: 'Identify nature', d: 'Birds, animals, fish, plants', hash: '#nature' },
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
const REGION_COLORS = { th: '#E8632A', vi: '#C0392B', kh: '#2D6CDF', la: '#159E8C' };
// Presentational nudges for labels that fall on a country's narrow part (Vietnam's
// central waist) so the name sits on a wide, readable area of the shape.
const REGION_LABEL_OVERRIDE = { vi: [398, 120] };

function regionPicker() {
  const paths = COUNTRIES.map((c) => {
    if (!REGION_PATHS[c.id]) return '';
    const [lx, ly] = REGION_LABEL_OVERRIDE[c.id] || REGION_LABELS[c.id];
    return `<g class="ctry-group" data-country="${c.id}" role="button" tabindex="0" aria-label="${esc(c.name)}">
         <path class="ctry" fill-rule="evenodd" d="${REGION_PATHS[c.id]}" fill="${REGION_COLORS[c.id]}"/>
         <g class="ctry-label">
           <text class="ctry-flag" x="${lx}" y="${ly}" text-anchor="middle">${c.flag}</text>
           <text class="ctry-name" x="${lx}" y="${ly + 30}" text-anchor="middle">${esc(c.name)}</text>
         </g>
       </g>`;
  }).join('');
  const svg = `<svg viewBox="${REGION_VIEWBOX}" class="region-svg" role="img" aria-label="Map of Thailand, Laos, Cambodia and Vietnam" xmlns="http://www.w3.org/2000/svg">
      <defs><radialGradient id="sea" cx="50%" cy="38%" r="80%"><stop offset="0" stop-color="#BFE6E1"/><stop offset="1" stop-color="#7FC3BD"/></radialGradient></defs>
      <rect x="0" y="0" width="100%" height="100%" fill="url(#sea)"/>
      ${paths}
    </svg>`;
  const box = h('div', { class: 'region-map', html: svg });
  box.querySelectorAll('.ctry-group').forEach((g) => {
    const id = g.getAttribute('data-country');
    const enter = () => { activeCountry = id; go(`#country-${id}`); };
    g.addEventListener('click', enter);
    g.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); enter(); } });
  });
  box.append(h('span', { class: 'region-cap' }, 'Tap a country to explore it'));
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
  return selectEl(['USD', 'EUR', 'GBP', 'AUD', 'CAD', 'SGD', 'CNY', 'MYR', 'THB', 'VND', 'KHR', 'LAK'], current, () => {});
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
  const code = lang || store.profile.defaultLang || 'th';
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
      `Tap-to-speak is unavailable for ${book.label} on this device — the script and pronunciation are still shown.`));
  }
  if (book.politenessNote) wrap.append(h('div', { class: 'banner' }, book.politenessNote));

  // search
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
            class: 'speak', 'aria-label': `Speak: ${p.en}`, disabled: !voiceOk ? '' : null,
            onclick: () => speak(p.script, book.locale),
          }, '🔊'),
        ]));
      }
    }
    if (!listEl.children.length) listEl.append(h('p', { class: 'empty' }, 'No phrases match your search.'));
  }
  renderPhrases();

  // live-translate fallback
  wrap.append(liveTranslateBox(code, book.label));
  mount(wrap, '#phrasebook');
}

function liveTranslateBox(code, label) {
  const box = h('div', { class: 'card' }, [h('h2', {}, 'Live translate (online)')]);
  if (!translateConfigured()) {
    box.append(h('p', { class: 'muted' },
      'Optional: translate anything not in the phrasebook. Add an endpoint in Settings to enable. Requires internet.'));
    box.append(h('button', { class: 'btn ghost', onclick: () => go('#settings') }, 'Open Settings'));
    return box;
  }
  const input = h('input', { class: 'search', type: 'text', placeholder: 'Type English…' });
  const out = h('div', { class: 'muted' });
  const btn = h('button', { class: 'btn', onclick: async () => {
    out.textContent = 'Translating…';
    try { out.textContent = await translate(input.value, code); }
    catch (err) { out.textContent = err.message; }
  } }, `Translate to ${label}`);
  box.append(input, btn, out);
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
  const priceStr = hasPrice ? (range(p.priceRange.low, p.priceRange.high, p.priceRange.currency) || 'Free') : '';
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
    p.blurb ? h('p', {}, p.blurb) : null,
  ]);
  if (p.rating) card.append(ratingBlock(p));
  if (p.history) { card.append(h('h3', {}, 'A little history'), h('p', {}, p.history)); }
  if (p.whyItFits) { card.append(h('h3', {}, 'Why it fits you'), h('p', {}, p.whyItFits)); }
  if (hasPrice) {
    card.append(h('h3', {}, 'Price'));
    card.append(h('p', {}, `${range(p.priceRange.low, p.priceRange.high, p.priceRange.currency) || 'Free'}${p.priceRange.note ? ' · ' + p.priceRange.note : ''}`));
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
        h('span', { class: 'fair' }, `${range(it.fair.low, it.fair.high, data.currency)}`),
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
        h('div', { class: 'muted' }, `${dur} · ${range(o.price.low, o.price.high, o.price.currency)} · ${o.freq}`),
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
  wrap.append(h('p', { class: 'map-hint' }, 'Tap the map to drop a pin. Use the ⊕ locate button to find yourself (GPS works offline).'));
  const tileBanner = h('div', { class: 'banner', style: 'display:none' });
  wrap.append(tileBanner);

  const dlBtn = h('button', { class: 'btn', disabled: '' }, 'Download this area');
  const storeBtn = h('button', { class: 'btn ghost', onclick: showStorage }, 'Storage');
  const clearBtn = h('button', { class: 'btn ghost', onclick: async () => {
    const m = await import('./map.js'); await m.clearTileCache(); showStorage();
  } }, 'Clear map cache');
  const addBtn = h('button', { class: 'btn ghost', onclick: () => go('#addpin') }, '＋ Add a place');
  const toolbar = h('div', { class: 'map-toolbar' }, [dlBtn, addBtn, storeBtn, clearBtn]);
  const storageOut = h('p', { class: 'map-hint' }, '');
  async function showStorage() {
    const m = await import('./map.js'); const e = await m.storageEstimate();
    storageOut.textContent = e ? `Stored on device: about ${e.usageMB.toFixed(1)} MB.` : '';
  }

  const canvas = h('div', { id: 'map-canvas' });
  wrap.append(toolbar, storageOut, canvas);

  // pins list (handy when offline / no GPS)
  const pinsCard = h('div', { class: 'card' }, [
    h('h2', {}, 'Your pins'),
    ...(store.pins.length
      ? store.pins.map((pin) => h('button', { class: 'btn ghost block', style: 'margin-top:8px; justify-content:flex-start', onclick: () => go(`#place-${pin.id}`) }, `📌 ${pin.name}`))
      : [h('p', { class: 'muted' }, 'No pins yet. Tap the map or use “＋ Add a place”.')]),
  ]);
  wrap.append(pinsCard);
  mount(wrap, '#map');

  // lazy-init the heavy map libs; fall back to a simple GPS panel if they fail.
  import('./map.js').then((m) => m.initMap(canvas, {
    onMapClick: (coords) => { pendingPinCoords = coords; go('#addpin'); },
    onOpen: (id) => go(`#place-${id}`),
  })).then((ctrl) => {
    dlBtn.removeAttribute('disabled');
    // The basemap tiles come from an external source and need the network the first
    // time. If they fail, explain it rather than leaving a blank canvas; pins + GPS
    // still work, and the home-screen country map is fully offline.
    let tileErrShown = false;
    ctrl.map.on('error', () => {
      if (tileErrShown) return; tileErrShown = true;
      tileBanner.innerHTML = '';
      tileBanner.append(
        h('span', {}, 'The street-map tiles could not load — they need an internet connection the first time you open the map. Your GPS and saved pins still work. '),
        h('button', { class: 'btn ghost', style: 'margin-top:6px', onclick: () => go('#home') }, 'Use the offline country map'),
      );
      tileBanner.style.display = '';
    });
    ctrl.map.on('idle', () => { if (!tileErrShown) tileBanner.style.display = 'none'; });
    dlBtn.onclick = async () => {
      dlBtn.textContent = 'Downloading…';
      try {
        const r = await ctrl.downloadVisibleArea((d, t) => { dlBtn.textContent = `Downloading ${d}/${t}…`; });
        dlBtn.textContent = `Saved ${r.tiles} tiles ✓`;
        showStorage();
        setTimeout(() => { dlBtn.textContent = 'Download this area'; }, 2500);
      } catch (err) { dlBtn.textContent = 'Download failed'; }
    };
    showStorage();
  }).catch(() => {
    canvas.replaceWith(mapFallback());
    dlBtn.remove(); storeBtn.remove(); clearBtn.remove();
  });
}

// Shown if the map libraries cannot load (e.g. offline before first map use).
function mapFallback() {
  const card = h('div', { class: 'card' }, [
    h('h2', {}, 'Map unavailable offline yet'),
    h('p', { class: 'muted' }, 'The map could not load. Open it once while online so the map engine is cached, then it will work offline. You can still capture your location and manage pins.'),
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
const CAL_ICON = { stay: '🛏', meal: '🍽', activity: '🎟', plan: '🗓' };
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
  const cur = selectEl(['THB', 'VND', 'KHR', 'LAK', 'USD', 'EUR', 'GBP'], c ? c.currency : 'THB', () => {});
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
    s.blurb ? h('p', {}, s.blurb) : null,
  ]);
  if (s.idTips) card.append(h('h3', {}, 'How to identify'), h('p', {}, s.idTips));
  if (s.habitat) card.append(h('h3', {}, 'Habitat'), h('p', {}, s.habitat));
  if (s.where) card.append(h('h3', {}, 'Where you might see it'), h('p', {}, s.where));
  if (s.localNames && s.localNames.length) card.append(h('p', { class: 'muted' }, `Local names: ${s.localNames.join(', ')}`));
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

  card.append(field('Home currency', selectEl(['USD', 'EUR', 'GBP', 'AUD', 'CAD', 'SGD'], p.homeCurrency,
    (v) => { p.homeCurrency = v; save(); })));

  card.append(field('Default phrasebook language',
    selectEl(Object.values(LANGUAGES).map((b) => [b.lang, b.label]), p.defaultLang,
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
    h('h2', {}, 'Live translate (optional)'),
    h('p', { class: 'muted' }, 'The phrasebook works offline. To translate free text online, set a LibreTranslate-compatible endpoint. Your endpoint and key stay on this device. Enabling also requires adding the endpoint origin to the page Content-Security-Policy (connect-src) in index.html.'),
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
