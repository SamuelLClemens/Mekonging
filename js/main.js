// Mekong app shell + hash router. Vanilla ES6, offline-first. Screens read all
// content from js/data/regions.js so no destination is hard-coded here.

import { store, save, resetAll, isFavorite, toggleFavorite, prefersReducedMotion } from './state.js';
import { h, esc, money, range, mapsUrl } from './util.js';
import { speak, stop as stopSpeak, hasVoiceFor } from './tts.js';
import { translate, isConfigured as translateConfigured } from './translate.js';
import {
  COUNTRIES, LANGUAGES, INTERESTS, getCountry, getLanguage, allPlaces, getPlace,
} from './data/regions.js';

// ---- service worker + theme -------------------------------------------------
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
}

function applyTheme() {
  const root = document.documentElement;
  root.setAttribute('data-theme', store.profile.theme === 'dark' ? 'dark' : 'light');
  root.setAttribute('data-reduced-motion', prefersReducedMotion() ? 'on' : 'off');
}

// ---- UI state ---------------------------------------------------------------
let activeCountry = 'th';   // current destination context (country id)

const TABS = [
  { hash: '#home', label: 'Home', ic: '🏠' },
  { hash: '#phrasebook', label: 'Talk', ic: '💬' },
  { hash: '#places', label: 'Places', ic: '📍' },
  { hash: '#prices', label: 'Prices', ic: '💵' },
  { hash: '#settings', label: 'Settings', ic: '⚙️' },
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

// ---- HOME -------------------------------------------------------------------
function homeScreen() {
  const wrap = h('div', { class: 'screen' });
  wrap.append(h('section', { class: 'hero' }, [
    h('h1', {}, 'Mekong'),
    h('p', {}, 'Your overland companion for Thailand, Vietnam, Cambodia & Laos.'),
  ]));

  wrap.append(countryChips((id) => { activeCountry = id; render(); }));

  const tiles = [
    { ic: '💬', t: 'Phrasebook', d: 'Speak the local language', hash: '#phrasebook' },
    { ic: '📍', t: 'Places for you', d: 'Filtered to your taste & budget', hash: '#places' },
    { ic: '💵', t: 'Fair prices', d: 'Avoid being overcharged', hash: '#prices' },
    { ic: '🚌', t: 'Getting around', d: 'Best way to the next place', hash: '#transport' },
    { ic: '🧭', t: 'Country guide', d: 'Money, SIM, visa, safety', hash: `#info-${activeCountry}` },
    { ic: '⭐', t: 'Saved', d: 'Your shortlist', hash: '#saved' },
  ];
  wrap.append(h('div', { class: 'grid' }, tiles.map((x) =>
    h('button', { class: 'tile', onclick: () => go(x.hash) }, [
      h('span', { class: 'ic' }, x.ic),
      h('span', { class: 't' }, x.t),
      h('span', { class: 'd' }, x.d),
    ]))));

  wrap.append(h('p', { class: 'disclaimer' },
    'Works offline. Everything stays on your device — no accounts, no tracking. Prices and rules are guidance; verify locally.'));
  mount(wrap, '#home');
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
    oninput: (e) => { phraseQuery = e.target.value; renderPhrases(); },
  });
  wrap.append(search);

  const listEl = h('div', {});
  wrap.append(listEl);

  function renderPhrases() {
    listEl.innerHTML = '';
    const q = phraseQuery.trim().toLowerCase();
    for (const cat of book.categories) {
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
            h('div', { class: 'roman' }, p.roman),
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

function placeCard(p) {
  return h('div', { class: 'card' }, [
    h('div', { class: 'place-head' }, [
      h('h2', {}, p.name),
      h('button', {
        class: 'save-star', 'aria-label': 'Save', title: 'Save',
        onclick: (e) => { const on = toggleFavorite(p.id); e.currentTarget.textContent = on ? '★' : '☆'; },
      }, isFavorite(p.id) ? '★' : '☆'),
    ]),
    h('div', { class: 'row-between' }, [
      h('div', { class: 'cats' }, p.categories.map((c) => h('span', { class: 'cat-tag' }, c))),
      tierBadge(p.budgetTier),
    ]),
    h('p', {}, p.blurb),
    h('p', { class: 'muted' }, `${p.city} · ${range(p.priceRange.low, p.priceRange.high, p.priceRange.currency) || 'Free'}`),
    h('button', { class: 'btn ghost', onclick: () => go(`#place-${p.id}`) }, 'Details'),
  ]);
}

function placeScreen(id) {
  const p = getPlace(id);
  const wrap = h('div', { class: 'screen' });
  wrap.append(topbar(p ? p.name : 'Place', '#places'));
  if (!p) { wrap.append(h('p', { class: 'empty' }, 'Place not found.')); mount(wrap, '#places'); return; }

  const card = h('div', { class: 'card' }, [
    h('div', { class: 'row-between' }, [
      h('div', { class: 'cats' }, p.categories.map((c) => h('span', { class: 'cat-tag' }, c))),
      tierBadge(p.budgetTier),
    ]),
    h('p', {}, p.blurb),
    h('h3', {}, 'Why it fits you'),
    h('p', {}, p.whyItFits),
    h('h3', {}, 'Price'),
    h('p', {}, `${range(p.priceRange.low, p.priceRange.high, p.priceRange.currency) || 'Free'}${p.priceRange.note ? ' · ' + p.priceRange.note : ''}`),
    p.hours ? h('p', { class: 'muted' }, `Hours: ${p.hours}`) : null,
    p.bookHint ? h('p', { class: 'muted' }, `Booking: ${p.bookHint}`) : null,
  ]);
  if (p.tips && p.tips.length) { card.append(h('h3', {}, 'Tips')); p.tips.forEach((t) => card.append(h('div', { class: 'list-note' }, t))); }
  if (p.scamWarnings && p.scamWarnings.length) { card.append(h('h3', {}, 'Watch out')); p.scamWarnings.forEach((t) => card.append(h('div', { class: 'warn-note' }, t))); }

  const actions = h('div', { class: 'card' }, [
    h('a', { class: 'btn block', href: mapsUrl(p), target: '_blank', rel: 'noopener' }, 'Open in Maps'),
    h('button', {
      class: 'btn ghost block', style: 'margin-top:8px',
      onclick: (e) => { const on = toggleFavorite(p.id); e.currentTarget.textContent = on ? '★ Saved' : '☆ Save'; },
    }, isFavorite(p.id) ? '★ Saved' : '☆ Save'),
  ]);

  wrap.append(card, actions);
  if (p.sources && p.sources.length) wrap.append(sourcesNote(p.sources, p.verified));
  mount(wrap, '#places');
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
    mount(wrap, '#prices'); return;
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
    wrap.append(card);
  }
  wrap.append(h('p', { class: 'disclaimer' }, 'Times and prices are guidance and change with season and operator. Confirm before travel.'));
  mount(wrap, '#prices');
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
  wrap.append(acc);
  wrap.append(sourcesNote(info.sources, info.verified));
  mount(wrap, '#home');
}

// ---- SAVED ------------------------------------------------------------------
function savedScreen() {
  const wrap = h('div', { class: 'screen' });
  wrap.append(topbar('Saved', '#home'));
  const saved = store.favorites.map(getPlace).filter(Boolean);
  if (!saved.length) wrap.append(h('p', { class: 'empty' }, 'No saved places yet. Tap ☆ on any place to add it here.'));
  else saved.forEach((p) => wrap.append(placeCard(p)));
  mount(wrap, '#home');
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
      case 'phrasebook': return phrasebookScreen(arg);
      case 'places': return placesScreen(arg);
      case 'place': return placeScreen(arg);
      case 'prices': return pricesScreen(arg);
      case 'transport': return transportScreen(arg);
      case 'info': return infoScreen(arg);
      case 'saved': return savedScreen();
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
