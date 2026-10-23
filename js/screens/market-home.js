// The shared Market's home and search: #market and #market-items, -meetups, -rooms, -rides
// (docs/EXCHANGE.md §11 and §17, slice M4b-1). A sticky search bar, kind tabs, category tiles, city
// and date chips, a picture-led card grid, the filters sheet, and the board on this phone folded
// under "On this phone". #market-cash still opens the board as a whole screen (js/screens/exchange.js).
//
// THREE AUDIENCES, all from one search call:
//   * a tester, or anyone once the market opens (M9): the search answers rows, and they browse;
//   * a visitor, or a signed-in non-tester, while the market is closed: the server answers
//     `market_closed`, and the home shows the closed-beta preview built from the artwork, with
//     sign-in for testers and the board on this phone open beneath it.
// Sign-in otherwise appears only on actions, as a sheet (market-parts.js, signInSheet).
//
// EVERY GATE RENDERS SOMETHING (check-net-gates): data switched off, no connection, closed, an
// error, no results. Each keeps the board on this phone one tap away.
//
// MEMORY ONLY (§2). Results live in this module for the life of the page, so Back from a listing
// returns to the same grid and scroll; nothing another traveller wrote is stored. The one thing
// kept on the phone is the traveller's own recent searches (localStorage, outside the store).
//
// The router renders a route twice at start-up, so every await re-checks `isConnected` and the
// search shares one flight per query.

import { h, debounce, regionNow } from '../util.js';
import { netMode, setNetMode, online } from '../ui-widgets.js';
import { getListings } from '../state.js';
import { go, mount, topbar, render } from '../main.js';
import { marketSession, marketMe } from '../market-api.js';
import { searchListings, listingErrorText, ITEM_CATEGORIES, CURRENCIES } from '../market-listings.js';
import { artNode } from '../market-art.js';
import { boardSection } from './exchange.js';
import {
  ensureMarketStyles, marketStylesReady, KIND_META, KIND_ORDER, KIND_FOR_SLUG, CATEGORY_LABEL, SORT_LABEL,
  CURRENCY_FOR, cityName, cityCountry, citySelect, today, addDays, dayText, icon, listingCard, skeletonCard,
  openSheet, setReturn, postSoonSheet,
} from './market-parts.js';

const PAGE = 24;
const FRESH_MS = 60 * 1000;   // how long a page of results is reused on Back before it is fetched again
const RECENT_KEY = 'mk-market-recent';
const SUGGEST = ['bicycle', 'car seat', 'tent', 'room', 'Pai'];

// ---- state (memory only) ------------------------------------------------------------------------
const FILTERS = { category: '', city: '', dateFrom: '', dateTo: '', priceMin: '', priceMax: '', currency: '', freeOnly: false };
const view = { q: '', kind: '', sort: 'newest', ...FILTERS };
let gate = '';           // '' unknown, 'open' (the search answered rows) or 'closed' (market_closed)
let cache = null;        // { key, rows, total, at }
let flight = null;       // { key, promise }: the search in the air
let meFlight = null;     // marketMe() for the closed preview's state line, once per page
let boardOpen = null;    // the "On this phone" fold as the traveller left it (null: the default)
let scrollBack = 0;      // the grid's scroll when a listing opened

const priceSortOk = (v) => !!(v.currency || v.city);
const sortOf = (v) => (/^price/.test(v.sort) && !priceSortOk(v) ? 'newest' : v.sort);
const hasPrice = (v) => !!(v.currency && (v.priceMin !== '' || v.priceMax !== ''));

function optsOf(v, page = 0, pageSize = PAGE) {
  return {
    q: v.q.trim(), kind: v.kind, category: !v.kind || v.kind === 'item' ? v.category : '', city: v.city,
    dateFrom: v.dateFrom, dateTo: v.dateTo,
    priceMin: hasPrice(v) ? v.priceMin : '', priceMax: hasPrice(v) ? v.priceMax : '', currency: hasPrice(v) ? v.currency : '',
    freeOnly: v.freeOnly, sort: sortOf(v), page, pageSize,
  };
}
const keyOf = (o) => JSON.stringify(o);

// One flight per query: the double render at start-up, and a count racing the grid, share it.
function search(opts) {
  const key = keyOf(opts);
  if (flight && flight.key === key) return flight.promise;
  const promise = searchListings(opts);
  flight = { key, promise };
  const clear = () => { if (flight && flight.key === key) flight = null; };
  promise.then(clear, clear);
  return promise;
}

// The filters that show as removable chips (the query, kind tabs and sort are not filters).
function activeFilters(v) {
  const out = [];
  if (v.category && (!v.kind || v.kind === 'item')) out.push(['category', CATEGORY_LABEL[v.category] || v.category]);
  if (v.city) out.push(['city', cityName(v.city)]);
  if (v.dateFrom || v.dateTo) out.push(['dates', datesLabel(v)]);
  if (hasPrice(v)) out.push(['price', priceLabel(v)]);
  if (v.freeOnly) out.push(['freeOnly', 'Free only']);
  return out;
}
function clearFilter(v, name) {
  if (name === 'dates') { v.dateFrom = ''; v.dateTo = ''; return; }
  if (name === 'price') { v.priceMin = ''; v.priceMax = ''; return; }
  if (name === 'q') { v.q = ''; return; }
  v[name] = FILTERS[name];
}
function datesLabel(v) {
  if (v.dateFrom && v.dateTo) return v.dateFrom === v.dateTo ? dayText(v.dateFrom) : `${dayText(v.dateFrom)} – ${dayText(v.dateTo)}`;
  return v.dateFrom ? `From ${dayText(v.dateFrom)}` : `Until ${dayText(v.dateTo)}`;
}
function priceLabel(v) {
  const lo = v.priceMin !== '' ? Number(v.priceMin).toLocaleString('en-GB') : '0';
  return v.priceMax !== '' ? `${v.currency} ${lo}–${Number(v.priceMax).toLocaleString('en-GB')}` : `${v.currency} ${lo}+`;
}

// ---- recent searches (the traveller's own words, on this phone) ----------------------------------
function recent() {
  try {
    const a = JSON.parse(localStorage.getItem(RECENT_KEY) || '[]');
    return Array.isArray(a) ? a.filter((x) => typeof x === 'string' && x).slice(0, 6) : [];
  } catch { return []; }
}
function saveRecent(q) {
  const t = String(q || '').trim().slice(0, 60);
  if (t.length < 2) return;
  const list = [t, ...recent().filter((x) => x.toLowerCase() !== t.toLowerCase())].slice(0, 6);
  try { localStorage.setItem(RECENT_KEY, JSON.stringify(list)); } catch { /* storage refused: no recents */ }
}
function clearRecent() {
  try { localStorage.removeItem(RECENT_KEY); } catch { /* nothing to clear */ }
}

// ---- dates --------------------------------------------------------------------------------------
function quickRanges() {
  const t = today();
  const dow = regionNow().dow;   // 0 is Sunday
  const sat = dow === 6 ? t : dow === 0 ? addDays(t, -1) : addDays(t, 6 - dow);
  return [
    ['Today', t, t],
    ['Tomorrow', addDays(t, 1), addDays(t, 1)],
    ['This weekend', dow === 0 ? t : sat, addDays(sat, 1)],
    ['Next 7 days', t, addDays(t, 7)],
    ['Next 30 days', t, addDays(t, 30)],
  ];
}

function datesSheet(onApply) {
  const from = h('input', { type: 'date', name: 'from', min: today(), value: view.dateFrom, 'aria-label': 'From' });
  const to = h('input', { type: 'date', name: 'to', min: today(), value: view.dateTo, 'aria-label': 'Until' });
  const apply = (a, b) => { s.close(); onApply(a, b); };
  const s = openSheet('Dates', [
    h('h3', {}, 'When'),
    h('div', { class: 'chips mx-chips' }, [
      h('button', { class: 'chip', type: 'button', 'aria-pressed': !view.dateFrom && !view.dateTo ? 'true' : 'false', onclick: () => apply('', '') }, 'Any dates'),
      ...quickRanges().map(([label, a, b]) => h('button', {
        class: 'chip', type: 'button', 'aria-pressed': view.dateFrom === a && view.dateTo === b ? 'true' : 'false', onclick: () => apply(a, b),
      }, label)),
    ]),
    h('div', { class: 'mx-row2' }, [
      h('label', { class: 'mx-field' }, [h('span', {}, 'From'), from]),
      h('label', { class: 'mx-field' }, [h('span', {}, 'Until'), to]),
    ]),
    h('div', { class: 'mx-sheet-actions' }, [
      h('button', { class: 'btn ghost', type: 'button', onclick: () => s.close() }, 'Cancel'),
      h('button', { class: 'btn', type: 'button', onclick: () => {
        let a = from.value, b = to.value;
        if (a && b && b < a) [a, b] = [b, a];
        apply(a, b);
      } }, 'Use these dates'),
    ]),
  ], 'mxd');
}

// ---- the filters sheet ----------------------------------------------------------------------------
function filtersSheet(onApply) {
  const d = { ...view };   // a draft; nothing changes until "Show results"
  const kinds = h('div', { class: 'chips mx-chips', role: 'group', 'aria-label': 'Kind' });
  const cats = h('div', { class: 'chips mx-chips', role: 'group', 'aria-label': 'Category' });
  const catBox = h('div', { class: 'mxf-group' }, [h('p', { class: 'mxf-label' }, 'Category'), cats]);
  const city = citySelect(d.city, (v) => { d.city = v; if (!d.currency && v) { d.currency = CURRENCY_FOR[cityCountry(v)] || ''; cur.value = d.currency; } sync(); });
  const from = h('input', { type: 'date', name: 'from', min: today(), value: d.dateFrom, 'aria-label': 'From', onchange: () => { d.dateFrom = from.value; sync(); } });
  const to = h('input', { type: 'date', name: 'to', min: today(), value: d.dateTo, 'aria-label': 'Until', onchange: () => { d.dateTo = to.value; sync(); } });
  const cur = h('select', { name: 'currency', 'aria-label': 'Currency', onchange: () => { d.currency = cur.value; sync(); } }, [
    h('option', { value: '' }, 'Currency'), ...CURRENCIES.map((c) => h('option', { value: c }, c)),
  ]);
  cur.value = d.currency;
  const num = (name, label, key) => h('input', {
    type: 'number', name, inputmode: 'decimal', min: '0', placeholder: label, 'aria-label': label, value: d[key],
    oninput: (e) => { d[key] = e.target.value; sync(); },
  });
  const lo = num('min', 'Min', 'priceMin');
  const hi = num('max', 'Max', 'priceMax');
  const priceNote = h('p', { class: 'mxf-note' });
  const free = h('input', { type: 'checkbox', name: 'free', onchange: () => { d.freeOnly = free.checked; sync(); } });
  free.checked = d.freeOnly;
  const sort = h('select', { name: 'sort', 'aria-label': 'Sort by', onchange: () => { d.sort = sort.value; sync(); } });
  const sortNote = h('p', { class: 'mxf-note' });
  const apply = h('button', { class: 'btn mxf-apply', type: 'button', onclick: () => { s.close(); onApply(d); } }, 'Show results');

  const countNow = debounce(() => {
    const opts = optsOf(d, 0, 1);
    const key = keyOf(opts);
    apply.dataset.key = key;
    search(opts).then((r) => {
      if (!apply.isConnected || apply.dataset.key !== key) return;
      apply.textContent = r.total === 1 ? 'Show 1 result' : `Show ${r.total} results`;
    }, () => { if (apply.isConnected) apply.textContent = 'Show results'; });
  }, 350);

  function sync() {
    kinds.replaceChildren(...[''].concat(KIND_ORDER).map((k) => h('button', {
      class: 'chip', type: 'button', 'data-kind': k, 'aria-pressed': d.kind === k ? 'true' : 'false',
      onclick: () => { d.kind = k; if (k && k !== 'item') d.category = ''; sync(); },
    }, k ? KIND_META[k].label : 'Everything')));
    catBox.hidden = !!d.kind && d.kind !== 'item';
    cats.replaceChildren(...[''].concat(ITEM_CATEGORIES).map((c) => h('button', {
      class: 'chip', type: 'button', 'data-cat': c, 'aria-pressed': d.category === c ? 'true' : 'false',
      onclick: () => { d.category = c; sync(); },
    }, c ? CATEGORY_LABEL[c] : 'Any')));
    lo.disabled = hi.disabled = !d.currency;
    priceNote.textContent = d.currency ? 'Free listings count as 0.' : 'Pick a currency to set a price range.';
    const ok = priceSortOk(d);
    const keep = sortOf(d);
    sort.replaceChildren(...Object.keys(SORT_LABEL).filter((k) => ok || !/^price/.test(k)).map((k) => h('option', { value: k }, SORT_LABEL[k])));
    sort.value = keep;
    d.sort = keep;
    sortNote.textContent = ok ? '' : 'Price sorts need a city or a currency, because prices are in different currencies.';
    apply.textContent = 'Show results';
    countNow();
  }

  const s = openSheet('Filters', [
    h('h3', {}, 'Filters'),
    h('div', { class: 'mxf-group' }, [h('p', { class: 'mxf-label' }, 'Kind'), kinds]),
    catBox,
    h('div', { class: 'mxf-group' }, [h('label', { class: 'mx-field' }, [h('span', {}, 'City'), city])]),
    h('div', { class: 'mxf-group' }, [h('p', { class: 'mxf-label' }, 'Dates'), h('div', { class: 'mx-row2' }, [
      h('label', { class: 'mx-field' }, [h('span', {}, 'From'), from]),
      h('label', { class: 'mx-field' }, [h('span', {}, 'Until'), to]),
    ])]),
    h('div', { class: 'mxf-group' }, [h('p', { class: 'mxf-label' }, 'Price'), h('div', { class: 'mx-row3' }, [cur, lo, hi]), priceNote,
      h('label', { class: 'mx-tick' }, [free, h('span', {}, 'Free only')])]),
    h('div', { class: 'mxf-group' }, [h('label', { class: 'mx-field' }, [h('span', {}, 'Sort by'), sort]), sortNote]),
    h('div', { class: 'mx-sheet-actions mxf-actions' }, [
      h('button', { class: 'btn ghost mxf-clear', type: 'button', onclick: () => {
        Object.assign(d, FILTERS, { kind: '', sort: 'newest' });
        city.value = ''; from.value = ''; to.value = ''; cur.value = ''; lo.value = ''; hi.value = ''; free.checked = false;
        sync();
      } }, 'Clear all'),
      apply,
    ]),
  ], 'mxf');
  sync();
}

// ---- gates ---------------------------------------------------------------------------------------
function gateCard(cls, title, text, btnLabel, onBtn) {
  return h('div', { class: 'card mx-gate ' + cls }, [
    h('div', { class: 'stripe-crown', 'aria-hidden': 'true' }),
    h('h2', {}, title),
    h('p', {}, text),
    h('button', { class: 'btn block', type: 'button', onclick: onBtn }, btnLabel),
  ]);
}
const dataOffCard = () => gateCard('mxh-dataoff', 'Shared market',
  'You have data switched off, so the shared market cannot load. The board on this phone still works.',
  'Turn data back on', () => { setNetMode('online'); render(); });
const offlineCard = () => gateCard('mxh-offline', 'The shared market needs internet.',
  'No connection right now. The board on this phone still works.', 'Try again', () => render());
const errorCard = (err, retry) => gateCard('mxh-error', 'Shared market', listingErrorText(err), 'Try again', retry);

// The board on this phone, folded. Open by default whenever the shared market cannot be browsed.
function boardFold(openByDefault, kind) {
  const n = getListings().length;
  const det = h('details', { class: 'mxh-board', 'data-nofold': '' });
  if (boardOpen === null ? openByDefault : boardOpen) det.setAttribute('open', '');
  det.addEventListener('toggle', () => { boardOpen = det.open; });
  const slug = kind && kind !== 'meetup' ? KIND_META[kind].slug : 'all';
  det.append(
    h('summary', { class: 'mxh-board-sum' }, [h('span', {}, 'On this phone'), h('span', { class: 'mxh-board-n' }, n ? `${n} saved` : 'Post by link')]),
    h('p', { class: 'muted mxh-board-lead' }, 'Post here and share the link. No account; nothing leaves your phone on its own.'),
    boardSection(slug),
  );
  return det;
}
function openBoard(body) {
  const det = body.querySelector('.mxh-board');
  if (!det) return;
  det.open = true;
  boardOpen = true;
  det.scrollIntoView({ block: 'start', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
}

// ---- the closed-beta preview ----------------------------------------------------------------------
const KIND_BLURB = {
  item: 'Car seats, bikes, camping kit and more, often free.',
  meetup: 'Food walks, hikes and a co-working morning.',
  room: 'Spare rooms and shared stays, by the week or the month.',
  ride: 'Share a car or a van and split the cost.',
};

function closedState(box) {
  const signIn = () => { setReturn('#market'); go('#market-signin'); };
  if (!marketSession()) {
    box.replaceChildren(
      h('p', { class: 'mxh-closed-state' }, 'Invited testers can browse now. It opens to everyone later.'),
      h('button', { class: 'btn', type: 'button', onclick: signIn }, 'Tester? Sign in'),
    );
    return;
  }
  box.replaceChildren(h('p', { class: 'mxh-closed-state' }, 'You are signed in.'));
  if (!meFlight) meFlight = marketMe().catch((e) => { meFlight = null; throw e; });
  meFlight.then((me) => {
    if (!box.isConnected) return;
    const p = me && me.profile;
    const held = p && (p.status === 'review' || (p.status === 'suspended' && !(p.suspended_until && new Date(p.suspended_until) <= new Date())));
    if (!p) {
      box.replaceChildren(h('p', { class: 'mxh-closed-state' }, 'You are signed in. Finish joining to be ready.'),
        h('button', { class: 'btn', type: 'button', onclick: () => go('#market-signin') }, 'Finish joining'));
    } else if (held) {
      box.replaceChildren(h('p', { class: 'mxh-closed-state' }, 'Your account is under review.'),
        h('button', { class: 'btn ghost', type: 'button', onclick: () => go('#market-me') }, 'Account'));
    } else {
      box.replaceChildren(h('p', { class: 'mxh-closed-state' }, 'You are signed in. The beta is for invited testers for now; it opens to everyone later.'),
        h('button', { class: 'btn ghost', type: 'button', onclick: () => go('#market-me') }, 'Account'));
    }
  }, () => {
    if (box.isConnected) box.replaceChildren(h('p', { class: 'mxh-closed-state' }, 'You are signed in. The beta is for invited testers for now.'),
      h('button', { class: 'btn ghost', type: 'button', onclick: () => go('#market-me') }, 'Account'));
  });
}

function closedPreview(body) {
  const state = h('div', { class: 'mxh-closed-act' });
  closedState(state);
  const hero = h('section', { class: 'mxh-closed', 'data-nofold': '' }, [
    h('div', { class: 'mxh-closed-art' }, KIND_ORDER.map((k) => artNode(k, k, 'mxa-crop'))),
    h('div', { class: 'mxh-closed-text' }, [
      h('span', { class: 'mx-pill' }, 'Closed beta'),
      h('h2', {}, 'The traveller market'),
      h('p', {}, 'Gear, meetups, rooms and rides from travellers across Thailand, Vietnam, Cambodia and Laos.'),
      state,
    ]),
  ]);
  const coming = h('section', { class: 'mxh-coming', 'data-nofold': '' }, [
    h('h2', { class: 'mxh-h' }, 'What is inside'),
    h('div', { class: 'mxh-coming-grid' }, KIND_ORDER.map((k) => h('div', { class: 'mxh-coming-row', 'data-kind': k }, [
      artNode(k, k, 'mxa-crop mxh-coming-art'),
      h('div', {}, [h('p', { class: 'mxh-coming-name' }, KIND_META[k].label), h('p', { class: 'muted' }, KIND_BLURB[k])]),
    ]))),
    h('div', { class: 'mxh-cat-strip', 'aria-label': 'Item categories' }, ITEM_CATEGORIES.map((c) => h('figure', { class: 'mxh-cat-fig' }, [
      artNode(c, 'item', 'mxa-crop'), h('figcaption', {}, CATEGORY_LABEL[c]),
    ]))),
  ]);
  body.replaceChildren(hero, coming, boardFold(true, view.kind));
}

// ---- browsing ------------------------------------------------------------------------------------
function audienceLine() {
  const signedIn = !!marketSession();
  const text = h('p', {}, signedIn ? 'Signed in to the shared market.' : 'Browsing as a visitor.');
  if (signedIn) {
    // A tester browses while the market is still closed to everyone else: say so.
    if (!meFlight) meFlight = marketMe().catch((e) => { meFlight = null; throw e; });
    meFlight.then((me) => {
      if (text.isConnected && me && me.member && !me.open) text.replaceChildren(h('span', { class: 'mx-pill' }, 'Closed beta'), ' You are testing the shared market.');
    }, () => { /* the plain line stays */ });
  }
  return h('div', { class: 'mxh-who' }, [
    text,
    signedIn
      ? h('button', { class: 'btn ghost mxh-who-btn', type: 'button', onclick: () => go('#market-me') }, 'Account')
      : h('button', { class: 'btn ghost mxh-who-btn', type: 'button', onclick: () => { setReturn(location.hash || '#market'); go('#market-signin'); } }, 'Sign in'),
  ]);
}

function emptyState(onClear, onTry) {
  const kids = [
    h('div', { class: 'stripe-crown', 'aria-hidden': 'true' }),
    h('h2', {}, 'Nothing matches yet'),
    h('p', { class: 'muted' }, 'Try fewer words, another city or other dates. Or post it on the board on this phone.'),
  ];
  const tries = h('div', { class: 'chips mx-chips mxh-suggest' });
  if (view.q || activeFilters(view).length || view.kind) tries.append(h('button', { class: 'chip', type: 'button', onclick: onClear }, 'Clear the search'));
  SUGGEST.filter((s) => s.toLowerCase() !== view.q.trim().toLowerCase()).slice(0, 4)
    .forEach((s) => tries.append(h('button', { class: 'chip', type: 'button', onclick: () => onTry(s) }, s)));
  kids.push(tries);
  return h('div', { class: 'mxh-empty' }, kids);
}

function browse(body) {
  // Search bar.
  const input = h('input', {
    type: 'search', name: 'q', class: 'mxh-q', placeholder: 'Search bikes, rooms, rides…', 'aria-label': 'Search the market',
    autocomplete: 'off', enterkeyhint: 'search', maxlength: '100',
  });
  input.value = view.q;
  const qClear = h('button', { class: 'mxh-qclear', type: 'button', 'aria-label': 'Clear the search', onclick: () => { input.value = ''; view.q = ''; qClear.hidden = true; update(); input.focus(); } }, icon('close'));
  qClear.hidden = !view.q;
  const badge = h('span', { class: 'mxh-badge' });
  const filterBtn = h('button', { class: 'mxh-filter-btn', type: 'button', 'aria-label': 'Filters', onclick: () => filtersSheet(applyDraft) },
    [icon('sliders'), h('span', { class: 'mxh-filter-lbl' }, 'Filters'), badge]);
  const live = debounce(() => update(), 300);
  input.addEventListener('input', () => { view.q = input.value; qClear.hidden = !input.value; live(); });
  const form = h('form', { class: 'mxh-search', role: 'search', onsubmit: (e) => { e.preventDefault(); saveRecent(input.value); input.blur(); update(); } },
    [h('span', { class: 'mxh-search-field' }, [icon('search', 'mxh-search-ic'), input, qClear]), filterBtn]);

  // Kind tabs.
  const tabs = h('div', { class: 'mxh-kinds', role: 'group', 'aria-label': 'Kind' }, [''].concat(KIND_ORDER).map((k) => h('button', {
    class: 'mxh-kind', type: 'button', 'data-kind': k || 'all', 'aria-pressed': view.kind === k ? 'true' : 'false',
    onclick: () => go(k ? `#market-${KIND_META[k].slug}` : '#market'),
  }, k ? KIND_META[k].label : 'All')));

  // City and date chips.
  const city = citySelect(view.city, (v) => { view.city = v; update(); }, 'City');
  const cityChip = h('label', { class: 'mxh-chip mxh-city' }, [icon('pin'), city]);
  const dateBtn = h('button', { class: 'mxh-chip mxh-dates', type: 'button', onclick: () => datesSheet((a, b) => { view.dateFrom = a; view.dateTo = b; update(); }) },
    [icon('calendar'), h('span', { class: 'mxh-dates-lbl' })]);
  const chipsRow = h('div', { class: 'mxh-chips' }, [cityChip, dateBtn]);

  const top = h('div', { class: 'mxh-top' }, [form, tabs, chipsRow]);
  const recentBox = h('div', { class: 'mxh-recent' });
  const rail = h('div', { class: 'mxh-cats' });
  const head = h('div', { class: 'mxh-head' });
  const activeBox = h('div', { class: 'chips mx-chips mxh-active' });
  const grid = h('div', { class: 'mxh-grid', 'aria-live': 'polite', 'aria-busy': 'false' });
  const more = h('div', { class: 'mxh-more-box' });
  const fab = h('button', { class: 'btn mxh-post', type: 'button', onclick: () => postSoonSheet(() => openBoard(body)) }, [icon('plus'), h('span', {}, 'Post')]);

  function applyDraft(d) {
    const kindChanged = d.kind !== view.kind;
    Object.assign(view, d);
    if (kindChanged) { go(d.kind ? `#market-${KIND_META[d.kind].slug}` : '#market'); return; }
    city.value = view.city;
    update();
  }
  function trySearch(q) {
    Object.assign(view, FILTERS, { q, sort: 'newest' });
    input.value = q; qClear.hidden = false; city.value = '';
    if (view.kind) { go('#market'); return; }
    update();
  }
  function clearAll() {
    Object.assign(view, FILTERS, { q: '', sort: 'newest' });
    input.value = ''; qClear.hidden = true; city.value = '';
    if (view.kind) { go('#market'); return; }
    update();
  }

  function paintChrome() {
    const n = activeFilters(view).length;
    badge.textContent = n ? String(n) : '';
    badge.hidden = !n;
    filterBtn.setAttribute('aria-label', n ? `Filters, ${n} on` : 'Filters');
    dateBtn.lastChild.textContent = view.dateFrom || view.dateTo ? datesLabel(view) : 'Any dates';
    dateBtn.classList.toggle('is-on', !!(view.dateFrom || view.dateTo));
    cityChip.classList.toggle('is-on', !!view.city);
    // Recent searches, while nothing is typed.
    const rec = view.q ? [] : recent();
    recentBox.hidden = !rec.length;
    recentBox.replaceChildren(...(rec.length ? [
      h('span', { class: 'mxh-recent-lbl' }, [icon('clock'), 'Recent']),
      ...rec.map((r) => h('button', { class: 'chip', type: 'button', 'data-no-i18n': '', 'data-no-mt': '', onclick: () => { input.value = r; view.q = r; qClear.hidden = false; update(); } }, r)),
      h('button', { class: 'chip mxh-recent-clear', type: 'button', onclick: () => { clearRecent(); paintChrome(); } }, 'Clear'),
    ] : []));
    // Category tiles, on the home and the Items tab, until a search or a category narrows it.
    const showRail = (!view.kind || view.kind === 'item') && !view.q && !view.category;
    rail.hidden = !showRail;
    if (showRail && !rail.firstChild) {
      rail.append(h('h2', { class: 'mxh-h' }, 'Shop by category'), h('div', { class: 'mxh-rail' }, ITEM_CATEGORIES.map((c) => h('button', {
        class: 'mxh-tile', type: 'button', 'data-cat': c,
        onclick: () => { view.category = c; if (view.kind === 'item') update(); else go('#market-items'); },
      }, [artNode(c, 'item', 'mxa-crop mxh-tile-art'), h('span', { class: 'mxh-tile-lbl' }, CATEGORY_LABEL[c])]))));
    }
    // Active filters, each cleared in one tap.
    const act = activeFilters(view);
    if (view.q.trim()) act.unshift(['q', `“${view.q.trim()}”`]);
    activeBox.hidden = !act.length;
    activeBox.replaceChildren(...(act.length ? act.map(([name, label]) => h('button', {
      class: 'chip mxh-on', type: 'button', 'aria-label': `Remove ${label}`, 'data-no-i18n': name === 'q' ? '' : null, 'data-no-mt': name === 'q' ? '' : null,
      onclick: () => { clearFilter(view, name); if (name === 'q') { input.value = ''; qClear.hidden = true; } if (name === 'city') city.value = ''; update(); },
    }, [h('span', {}, label), icon('close')])).concat(h('button', { class: 'chip mxh-clear-all', type: 'button', onclick: clearAll }, 'Clear all')) : []));
  }

  function paintHead(total) {
    const narrowed = !!(view.q.trim() || activeFilters(view).length);
    const label = total == null ? 'Loading…'
      : narrowed ? (total === 1 ? '1 result' : `${total} results`)
        : `${total} listing${total === 1 ? '' : 's'}`;
    const ok = priceSortOk(view);
    const sort = h('select', { class: 'mxh-sort', name: 'sort', 'aria-label': 'Sort by', onchange: () => { view.sort = sort.value; update(); } },
      Object.keys(SORT_LABEL).filter((k) => ok || !/^price/.test(k)).map((k) => h('option', { value: k }, SORT_LABEL[k])));
    sort.value = sortOf(view);
    head.replaceChildren(h('p', { class: 'mxh-count', role: 'status' }, label), h('label', { class: 'mxh-sort-wrap' }, [h('span', {}, 'Sort'), sort]));
  }

  function cards(rows) {
    return rows.map((l) => listingCard(l, () => { scrollBack = window.scrollY; if (view.q.trim()) saveRecent(view.q); }));
  }

  function paintRows(c) {
    paintHead(c.total);
    grid.setAttribute('aria-busy', 'false');
    if (!c.rows.length) { grid.replaceChildren(); more.replaceChildren(emptyState(clearAll, trySearch)); return; }
    grid.replaceChildren(...cards(c.rows));
    more.replaceChildren();
    if (c.rows.length < c.total) {
      const btn = h('button', { class: 'btn ghost block mxh-more', type: 'button', onclick: () => {
        btn.disabled = true; btn.textContent = 'Loading…';
        const page = Math.floor(c.rows.length / PAGE);
        search(optsOf(view, page)).then((r) => {
          if (!btn.isConnected || cache !== c) return;
          c.rows = c.rows.concat(r.rows); c.total = r.total || c.total; c.at = Date.now();
          paintRows(c);
        }, (e) => { if (btn.isConnected) { btn.disabled = false; btn.textContent = listingErrorText(e); } });
      } }, 'Show more');
      more.append(btn);
    }
  }

  function update() {
    paintChrome();
    const opts = optsOf(view);
    const key = keyOf(opts);
    if (cache && cache.key === key && Date.now() - cache.at < FRESH_MS) { paintRows(cache); return; }
    paintHead(null);
    grid.setAttribute('aria-busy', 'true');
    grid.replaceChildren(...Array.from({ length: 6 }, skeletonCard));
    more.replaceChildren();
    search(opts).then((r) => {
      gate = 'open';
      cache = { key, rows: r.rows, total: r.total, at: Date.now() };
      if (!grid.isConnected || keyOf(optsOf(view)) !== key) return;   // a newer render or query owns the grid
      paintRows(cache);
    }, (e) => {
      if (!grid.isConnected || keyOf(optsOf(view)) !== key) return;
      if (e && e.code === 'market_closed') { gate = 'closed'; cache = null; closedPreview(body); return; }
      if (e && (e.code === 'offline' || e.code === 'network')) { body.replaceChildren(offlineCard(), boardFold(true, view.kind)); return; }
      grid.replaceChildren();
      head.replaceChildren();
      more.replaceChildren(errorCard(e, () => update()));
    });
  }

  body.replaceChildren(
    audienceLine(), top, recentBox, rail, head, activeBox, grid, more, boardFold(false, view.kind), fab,
  );
  // The sticky bar sits under the sticky topbar, whatever height the topbar has on this skin.
  const bar = body.closest('.screen') && body.closest('.screen').querySelector('.topbar');
  if (bar) body.style.setProperty('--mxh-stick', bar.offsetHeight + 'px');
  update();
}

// ---- the screen ----------------------------------------------------------------------------------
function paint(body) {
  if (netMode() === 'offline') { body.replaceChildren(dataOffCard(), boardFold(true, view.kind)); return; }
  if (!online()) { body.replaceChildren(offlineCard(), boardFold(true, view.kind)); return; }
  if (gate === 'closed') {
    // Show the preview at once, and ask again in case this traveller has just signed in as a tester.
    closedPreview(body);
    search(optsOf(view)).then((r) => {
      gate = 'open';
      cache = { key: keyOf(optsOf(view)), rows: r.rows, total: r.total, at: Date.now() };
      if (body.isConnected) browse(body);
    }, () => { /* still closed, or offline: the preview stays */ });
    return;
  }
  browse(body);
}

export function marketHomeScreen(arg) {
  if (!marketStylesReady()) {
    const at = location.hash;
    ensureMarketStyles().then(() => { if (location.hash === at) marketHomeScreen(arg); });
    return;
  }
  const kind = KIND_FOR_SLUG[arg] || '';
  if (kind !== view.kind) {
    view.kind = kind;
    if (kind && kind !== 'item') view.category = '';
  }
  const wrap = h('div', { class: 'screen mxh', 'data-nofold': '' });
  wrap.append(topbar('Market'));
  const body = h('div', { class: 'mxh-body', 'data-nofold': '' });
  wrap.append(body);
  mount(wrap, '#market');
  paint(body);
  if (scrollBack && cache) { const y = scrollBack; scrollBack = 0; window.scrollTo(0, y); }
}
