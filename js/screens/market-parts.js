// Shared parts of the shared Market's screens (docs/EXCHANGE.md §11 and §17, slice M4b-1): the
// words for kinds, categories and intents, price and date text, the listing card and its
// skeleton, the sheets (sign-in on an action, the interim Post sheet), a few line icons, and the
// Market's own stylesheet, css/market.css, which loads with the first Market screen.
//
// Used by js/screens/market-home.js (#market) and js/screens/market-listing.js (#market-l-<id>).
//
// TEXT. Titles and bodies are other travellers' text: they go in as text nodes only, inside an
// element marked data-no-i18n and data-no-mt (personal()), so the interface translation never
// rewrites them and machine translation never sends them anywhere. Nothing here stores them.

import { h, money, regionNow } from '../util.js';
import { openModal } from '../ui-widgets.js';
import { go } from '../main.js';
import { MARKET_CITIES } from '../data/market-cities.js';
import { artKey, artNode } from '../market-art.js';

// ---- the stylesheet -----------------------------------------------------------------------------
// css/market.css holds every Market rule, so css/style.css does not grow and a traveller who never
// opens the Market never parses them. The link is added when this module loads (before the router
// renders the screen) and a screen that finds it still loading waits for it once (with a ceiling,
// so a failed load never blocks the screen; the file is precached like every other shipped file).
let cssReady = null;
let cssDone = false;
export const marketStylesReady = () => cssDone;
export function ensureMarketStyles() {
  if (cssReady) return cssReady;
  if (typeof document === 'undefined') return Promise.resolve(false);
  let link = document.querySelector('link[data-mx-css]');
  if (!link) {
    link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'css/market.css';
    link.setAttribute('data-mx-css', '');
    document.head.append(link);
  }
  cssReady = new Promise((resolve) => {
    const done = (ok) => { cssDone = true; resolve(ok); };
    if (link.sheet) { done(true); return; }
    const t = setTimeout(() => done(false), 4000);
    link.addEventListener('load', () => { clearTimeout(t); done(true); }, { once: true });
    link.addEventListener('error', () => { clearTimeout(t); cssReady = null; done(false); }, { once: true });
  });
  return cssReady;
}

// ---- words --------------------------------------------------------------------------------------
// Route slug, label and safety line per kind. The route slugs are the ones §11 fixed.
export const KIND_META = {
  item: { slug: 'items', label: 'Items', one: 'Item', safety: 'Meet somewhere busy and public, check the item before you pay, and never leave your passport as a deposit.' },
  meetup: { slug: 'meetups', label: 'Meetups', one: 'Meetup', safety: 'Meet in a public place and tell someone where you are going. The app never shares your location.' },
  room: { slug: 'rooms', label: 'Rooms', one: 'Room', safety: 'See the place before you pay. Never send a deposit to someone you have not met.' },
  ride: { slug: 'rides', label: 'Rides', one: 'Ride', safety: 'Agree the cost before you set off and share your trip with a friend. You travel at your own risk.' },
};
export const KIND_ORDER = ['item', 'meetup', 'room', 'ride'];
export const KIND_FOR_SLUG = { items: 'item', meetups: 'meetup', rooms: 'room', rides: 'ride' };

export const CATEGORY_LABEL = {
  carseat: 'Car seats', stroller: 'Strollers', carrier: 'Baby carriers', toys: 'Toys', 'kids-clothing': 'Kids’ clothes',
  bicycle: 'Bicycles', camping: 'Camping', clothing: 'Clothes', books: 'Books', other: 'Other',
};
const ACTIVITY_LABEL = { food: 'Food', sights: 'Sights', outdoors: 'Outdoors', cowork: 'Co-working', sport: 'Sport', other: 'Other' };
const ROOM_LABEL = { private: 'Private room', shared: 'Shared room', whole: 'Whole place' };
const INTENT_LABEL = {
  'item:sell': 'For sale', 'item:give': 'Free', 'item:trade': 'Swap', 'item:request': 'Wanted',
  'meetup:join': 'Meetup', 'room:offer': 'Room offered', 'room:seek': 'Room wanted',
  'ride:offer': 'Seats offered', 'ride:seek': 'Ride wanted',
};
export const REPORT_LABEL = {
  scam: 'Scam or fraud', drugs: 'Drugs or banned goods', unsafe: 'Unsafe or dangerous', harassment: 'Harassment or hate',
  spam: 'Spam or advertising', minor: 'Involves someone under 18', other: 'Something else',
};
export const SORT_LABEL = { newest: 'Newest', soonest: 'Soonest', price_up: 'Price: low to high', price_down: 'Price: high to low' };

export const intentLabel = (l) => INTENT_LABEL[l.kind + ':' + l.intent] || (KIND_META[l.kind] ? KIND_META[l.kind].one : 'Listing');

// The detail chips a listing page shows, in reading order.
export function detailChips(l) {
  const out = [intentLabel(l)];
  if (l.kind === 'item' && CATEGORY_LABEL[l.category]) out.push(CATEGORY_LABEL[l.category]);
  if (l.kind === 'meetup' && ACTIVITY_LABEL[l.activity]) out.push(ACTIVITY_LABEL[l.activity]);
  if (l.kind === 'room' && ROOM_LABEL[l.room_type]) out.push(ROOM_LABEL[l.room_type]);
  if (l.seats) out.push(l.kind === 'meetup' ? `Up to ${l.seats} people` : `${l.seats} seat${l.seats === 1 ? '' : 's'}`);
  return out;
}

// ---- cities -------------------------------------------------------------------------------------
const CITY = new Map(MARKET_CITIES.map((c) => [c.id, c]));
export const cityName = (id) => (CITY.get(id) || {}).name || '';
export const cityCountry = (id) => (CITY.get(id) || {}).country || String(id || '').slice(0, 2);
const COUNTRY_NAME = { th: 'Thailand', vi: 'Vietnam', kh: 'Cambodia', la: 'Laos' };
export const countryName = (cc) => COUNTRY_NAME[cc] || '';
// The currency a city's prices are usually quoted in, for the price filter's first guess.
export const CURRENCY_FOR = { th: 'THB', vi: 'VND', kh: 'USD', la: 'LAK' };

// A city <select>: "Any city", then one group per country.
export function citySelect(current, onchange, label = 'City') {
  const sel = h('select', { name: 'city', 'aria-label': label, onchange: () => onchange(sel.value) });
  sel.append(h('option', { value: '' }, 'Any city'));
  for (const cc of ['th', 'vi', 'kh', 'la']) {
    const grp = h('optgroup', { label: COUNTRY_NAME[cc] });
    MARKET_CITIES.filter((c) => c.country === cc).forEach((c) => grp.append(h('option', { value: c.id }, c.name)));
    sel.append(grp);
  }
  sel.value = current || '';
  return sel;
}

// "Chiang Mai" or, for a ride, "Chiang Mai → Pai".
export function placeText(l) {
  const from = cityName(l.city);
  return l.kind === 'ride' && l.to_city ? `${from} → ${cityName(l.to_city)}` : from;
}

// ---- dates (a listing's window is two plain days in UTC+7) ----------------------------------------
export const today = () => regionNow().date;
export function addDays(day, n) {
  const d = new Date(day + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}
function fmtDay(day, weekday) {
  const d = new Date(day + 'T00:00:00Z');
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-GB', { timeZone: 'UTC', day: 'numeric', month: 'short', ...(weekday ? { weekday: 'short' } : {}) });
}
export const dayText = (day) => fmtDay(day, false);

// "Today", "Tomorrow", "Sat 25 Oct", "Now – 7 Nov" or "25 Oct – 3 Nov".
export function windowText(l) {
  const t = today();
  const s = l.starts_on, e = l.ends_on;
  if (!s || !e) return '';
  if (s === e) return s === t ? 'Today' : s === addDays(t, 1) ? 'Tomorrow' : fmtDay(s, true);
  return `${s <= t ? 'Now' : fmtDay(s)} – ${fmtDay(e)}`;
}

// The month someone joined, as "Jun 2026". M4a returns only "YYYY-MM" (a weak fingerprint across
// one person's listings, so the page never shows anything finer).
export function monthText(ym) {
  const m = /^(\d{4})-(\d{2})$/.exec(String(ym || ''));
  if (!m) return '';
  return new Date(Date.UTC(+m[1], +m[2] - 1, 1)).toLocaleDateString('en-GB', { timeZone: 'UTC', month: 'short', year: 'numeric' });
}

export function agoText(iso) {
  const ms = Date.parse(iso || '');
  if (!Number.isFinite(ms)) return '';
  const min = Math.max(1, Math.round((Date.now() - ms) / 60000));
  if (min < 60) return `${min} min ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr} h ago`;
  const d = Math.round(hr / 24);
  return d === 1 ? 'yesterday' : `${d} days ago`;
}

// ---- price --------------------------------------------------------------------------------------
// "Free" instead of "฿0"; the intent where a listing names no price ("Wanted", "Swap").
export function priceText(l) {
  if (l.price_amount === 0) return 'Free';
  if (l.price_amount == null) return intentLabel(l);
  return money(l.price_amount, l.price_currency);
}

// ---- small DOM parts ----------------------------------------------------------------------------
// Another traveller's text, as text, marked so neither translation pass touches it.
export const personal = (tag, cls, text) => h(tag, { class: cls, 'data-no-i18n': '', 'data-no-mt': '' }, text);

const ICONS = {
  search: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/>',
  sliders: '<path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0"/><circle cx="16" cy="6" r="2"/><circle cx="10" cy="12" r="2"/><circle cx="18" cy="18" r="2"/>',
  pin: '<path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/>',
  calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
  close: '<path d="M6 6l12 12M18 6L6 18"/>',
  more: '<circle cx="5" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="19" cy="12" r="1.6"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  shield: '<path d="M12 3l8 3v6c0 4.5-3.4 8.3-8 9-4.6-.7-8-4.5-8-9V6z"/><path d="M9 12l2 2 4-4"/>',
  chat: '<path d="M4 5h16v11H9l-5 4z"/>',
  person: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7"/>',
  arrow: '<path d="M9 6l6 6-6 6"/>',
  clock: '<circle cx="12" cy="12" r="8"/><path d="M12 8v4l3 2"/>',
};
export function icon(name, cls) {
  return h('span', {
    class: 'mx-ic' + (cls ? ' ' + cls : ''), 'aria-hidden': 'true',
    html: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${ICONS[name] || ''}</svg>`,
  });
}

// A listing card for the grid: the artwork, the price, a two-line title, the place and the window,
// all inside one link to the listing page. `onOpen` runs before the router follows the link.
export function listingCard(l, onOpen) {
  const kind = KIND_META[l.kind] ? l.kind : 'item';
  const a = h('a', {
    class: 'mxc', href: `#market-l-${l.id}`, 'data-kind': kind,
    onclick: () => { if (onOpen) onOpen(l); },
  });
  const art = artNode(artKey(l), kind, 'mxc-art');
  art.append(h('span', { class: 'mxc-kind' }, KIND_META[kind].one));
  a.append(
    art,
    h('span', { class: 'mxc-body' }, [
      h('span', { class: 'mxc-price' + (l.price_amount === 0 ? ' is-free' : '') }, priceText(l)),
      personal('span', 'mxc-title', l.title),
      h('span', { class: 'mxc-meta' }, [h('span', { class: 'mxc-place' }, placeText(l)), h('span', { class: 'mxc-when' }, windowText(l))]),
    ]),
  );
  return a;
}

export function skeletonCard() {
  return h('div', { class: 'mxc mxc-skel', 'aria-hidden': 'true' }, [
    h('span', { class: 'mxc-art mx-shimmer' }),
    h('span', { class: 'mxc-body' }, [h('span', { class: 'mx-bar mx-shimmer w40' }), h('span', { class: 'mx-bar mx-shimmer w90' }), h('span', { class: 'mx-bar mx-shimmer w60' })]),
  ]);
}

// ---- sheets -------------------------------------------------------------------------------------
// A bottom sheet on the app's own modal (focus trap, Escape, focus restore, closed on navigation).
// Returns { sheet, close }.
export function openSheet(label, kids, cls) {
  const backdrop = h('div', { class: 'sheet-backdrop mx-backdrop' });
  const sheet = h('div', { class: 'sheet mx-sheet' + (cls ? ' ' + cls : ''), role: 'dialog', 'aria-label': label }, [
    h('div', { class: 'mx-grip', 'aria-hidden': 'true' }), ...kids,
  ]);
  backdrop.append(sheet);
  let close = () => {};
  backdrop.addEventListener('click', (e) => { if (e.target === backdrop) close(); });
  close = openModal(backdrop);
  return { sheet, close };
}

// Where #market-signin returns once the traveller is signed in, and what they were doing there.
// sessionStorage, so it dies with the tab; it holds an app route and an action name, never
// anything another traveller wrote. js/screens/market-account.js reads RETURN_KEY.
const RETURN_KEY = 'mk-market-return';
const RESUME_KEY = 'mk-market-resume';
export function setReturn(hash, act) {
  try {
    sessionStorage.setItem(RETURN_KEY, hash);
    if (act) sessionStorage.setItem(RESUME_KEY, JSON.stringify({ hash, act }));
  } catch { /* storage refused: the account screen is the fallback */ }
}
// The action to resume on `hash`, once; '' when there is none.
export function takeResume(hash) {
  try {
    const r = JSON.parse(sessionStorage.getItem(RESUME_KEY) || 'null');
    if (!r || r.hash !== hash) return '';
    sessionStorage.removeItem(RESUME_KEY);
    return typeof r.act === 'string' ? r.act : '';
  } catch { return ''; }
}

const SIGNIN_WHY = {
  report: ['Sign in to report', 'Reports need a Market account, so one person cannot report a listing many times.'],
  post: ['Sign in to post', 'Posting to the shared market needs a Market account.'],
  message: ['Sign in to message', 'Messages need a Market account.'],
};
// Sign-in as a sheet on an action. "Sign in" remembers where the traveller was and what they were
// doing; the sign-in screen brings them back here afterwards.
export function signInSheet(act, hash) {
  const [title, why] = SIGNIN_WHY[act] || SIGNIN_WHY.post;
  const s = openSheet(title, [
    h('h3', {}, title),
    h('p', {}, why),
    h('p', { class: 'muted' }, 'We email you a code. There is no password.'),
    h('div', { class: 'mx-sheet-actions' }, [
      h('button', { class: 'btn ghost', type: 'button', onclick: () => s.close() }, 'Not now'),
      h('button', { class: 'btn', type: 'button', onclick: () => { setReturn(hash || location.hash, act); s.close(); go('#market-signin'); } }, 'Sign in'),
    ]),
  ], 'mxs');
  return s;
}

// The Post button's sheet until the post forms ship (slice M4b-2).
export function postSoonSheet(onBoard) {
  const s = openSheet('Post', [
    h('h3', {}, 'Post a listing'),
    h('p', {}, 'Posting to the shared market arrives in the next update.'),
    h('p', { class: 'muted' }, 'The board on this phone works now: post there, then share the link with a traveller.'),
    h('div', { class: 'mx-sheet-actions' }, [
      h('button', { class: 'btn ghost', type: 'button', onclick: () => s.close() }, 'Close'),
      h('button', { class: 'btn', type: 'button', onclick: () => { s.close(); if (onBoard) onBoard(); } }, 'Use the board on this phone'),
    ]),
  ], 'mxp');
  return s;
}

ensureMarketStyles();
