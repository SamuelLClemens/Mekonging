// Small shared helpers. No dependencies, no side effects.

// Escape text for safe insertion into innerHTML.
export function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

// Create an element with attributes + children. children may be nodes or strings.
export function h(tag, attrs = {}, children = []) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v == null || v === false) continue;
    if (k === 'class') el.className = v;
    else if (k === 'html') el.innerHTML = v;
    else if (k === 'dataset') Object.assign(el.dataset, v);
    else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2), v);
    else el.setAttribute(k, v === true ? '' : v);
  }
  const kids = Array.isArray(children) ? children : [children];
  for (const c of kids) {
    if (c == null || c === false) continue;
    el.append(c.nodeType ? c : document.createTextNode(String(c)));
  }
  return el;
}

// Currencies whose everyday prices are quoted without minor units (and large sums
// generally). Keeps "฿300" / "₫25,000" clean rather than "฿300.00".
const NO_MINOR_UNITS = ['VND', 'KHR', 'LAK', 'JPY', 'THB'];

// The locale for number and currency formatting, read from <html lang> rather than imported
// from js/i18n.js.
//
// WHY NOT IMPORT IT. This module's contract, stated at the top of the file, is "no
// dependencies, no side effects" — and it is the leaf that nearly every other module pulls in.
// Importing i18n.js here would drag state.js in behind it, and state.js reads localStorage at
// module-evaluation time, so the app's most-depended-on file would acquire a load-order
// side effect in exchange for thousands separators. Reading the attribute costs nothing and
// cannot go stale: applyDocLang() sets it on every render, and h() below already touches the
// DOM, so no invariant is given up.
//
// `-u-nu-latn` for the Arabic-script and Indic locales keeps the DIGITS Latin while grouping
// and currency placement still localise — a price is read in order to be compared against one
// printed on a tag or a menu, and Arabic-Indic or Devanagari numerals make that harder.
const LATIN_DIGIT_LOCALES = ['ar', 'fa', 'ur', 'bn', 'hi'];
function numLocale() {
  try {
    const lang = (document.documentElement.getAttribute('lang') || '').trim();
    if (!lang) return undefined;                      // fall back to the browser's own locale
    return LATIN_DIGIT_LOCALES.includes(lang) ? `${lang}-u-nu-latn` : lang;
  } catch { return undefined; }
}

// The symbol each currency is actually printed with, and — the part that is not cosmetic —
// which SIDE of the number it goes on. Vietnamese and Lao usage put it after (45.000₫,
// 90.000₭); the dollar family, sterling, euro, baht, riel, yuan and shekel lead with it.
//
// This table exists because Intl.NumberFormat's `style: 'currency'` cannot be trusted here on
// either count. In the `en` locale it has no symbol for THB, KHR or LAK and silently falls
// back to the ISO code, so every Thai street-food price in the app was rendering as
// "THB 40–THB 120" — in the app's most-covered country, on its most-read screen, against a
// comment on range() below that has said "e.g. ฿40–120" the whole time. And the placement it
// chooses follows the UI LANGUAGE, so the same dong price sat on either side of the number
// depending on which of the 29 interface languages the traveller had picked.
//
// Lives in util.js rather than currency.js only because currency.js imports this file; this
// one imports nothing, so the table can be shared without an import cycle. currency.js
// re-exports the two accessors.
const CURRENCY_SYMBOLS = {
  USD: { s: '$' }, EUR: { s: '€' }, GBP: { s: '£' }, AUD: { s: 'A$' }, CAD: { s: 'C$' },
  SGD: { s: 'S$' }, CNY: { s: '¥' }, JPY: { s: '¥' }, MYR: { s: 'RM' }, ILS: { s: '₪' },
  THB: { s: '฿' }, KHR: { s: '៛' },
  VND: { s: '₫', after: true }, LAK: { s: '₭', after: true },
};
export function currencySymbol(code) { const m = CURRENCY_SYMBOLS[code]; return m ? m.s : ''; }
export function currencySymbolAfter(code) { return !!(CURRENCY_SYMBOLS[code] && CURRENCY_SYMBOLS[code].after); }

// A figure written the way its own currency is written: "$12", "฿1,250", "45,000₫".
// THE one money formatter in the app — main.js and currency.js each grew a private version of
// this, which is how "20 USD", "1250 THB" and "฿1,250" all ended up on screen at once.
// Digit grouping still follows the interface language (numLocale); only the unit is fixed.
// Sub-units are dropped where nobody quotes them and above 100 in any currency; below that a
// real fraction is padded to two places, so "$3.50" but still "฿45" rather than "฿45.00".
// An unmapped currency falls back to "<number> CODE", which is what this did before.
export function money(amount, currency) {
  if (amount == null || amount === '') return '';
  const n = typeof amount === 'number' ? amount : parseFloat(amount);
  if (!Number.isFinite(n)) return typeof amount === 'string' ? amount : '';
  const whole = NO_MINOR_UNITS.includes(currency) || Math.abs(n) >= 100;
  const frac = !whole && n % 1 !== 0;
  let txt;
  try {
    txt = new Intl.NumberFormat(numLocale(), {
      minimumFractionDigits: frac ? 2 : 0,
      maximumFractionDigits: whole ? 0 : 2,
    }).format(n);
  } catch { txt = String(n); }
  const sym = currencySymbol(currency);
  if (!sym) return `${txt} ${currency || ''}`.trim();
  return currencySymbolAfter(currency) ? `${txt}${sym}` : `${sym}${txt}`;
}

// Render a low–high range as a compact string, e.g. "฿40–120" — the unit ONCE, on whichever
// end of the range it belongs to. This printed the unit on both numbers ("THB 40–THB 120"),
// against its own example, which is half the reason a price range read as noise.
export function range(low, high, currency) {
  if (low == null && high == null) return '';
  const one = low != null ? low : high;
  if (low == null || high == null || low === high) return money(one, currency);
  const lo = money(low, currency);
  const hi = money(high, currency);
  const sym = currencySymbol(currency);
  if (!sym) return `${lo}–${high.toLocaleString(numLocale())} ${currency || ''}`.trim();
  // Trailing-symbol currencies keep it on the high end (40.000–120.000₫); leading-symbol
  // ones keep it on the low end (฿40–120). Either way the reader sees it exactly once.
  return currencySymbolAfter(currency)
    ? `${lo.slice(0, -sym.length)}–${hi}`
    : `${lo}–${hi.slice(sym.length)}`;
}

// Coordinates are only trusted for a map link if they sit inside the mainland-SE-Asia
// region these guides cover (with a margin) and are not the (0,0) null island. This stops
// a stray/miskeyed coordinate from sending the traveller to the wrong place; such a link
// falls back to a name search instead.
export function coordsLookValid(coords) {
  if (!coords || coords.lat == null || coords.lng == null) return false;
  const { lat, lng } = coords;
  if (Math.abs(lat) < 0.01 && Math.abs(lng) < 0.01) return false;
  return lat >= 5 && lat <= 29 && lng >= 91 && lng <= 111;
}

// Build a maps deep link from coordinates (preferred, exact) or a query string.
export function mapsUrl({ mapQuery, coords } = {}) {
  if (coordsLookValid(coords)) {
    return `https://www.google.com/maps/search/?api=1&query=${coords.lat},${coords.lng}`;
  }
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapQuery || '')}`;
}

// A directions deep link (routes from the user's current location to the destination),
// using exact coordinates when they look valid, else the place name.
export function mapsDirUrl({ mapQuery, coords } = {}) {
  const dest = coordsLookValid(coords) ? `${coords.lat},${coords.lng}` : encodeURIComponent(mapQuery || '');
  return `https://www.google.com/maps/dir/?api=1&destination=${dest}`;
}

// Title-case a slug or short label.
export function titleCase(s) {
  return String(s || '').replace(/[-_]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

// Debounce — coalesce rapid calls (e.g. search keystrokes) into one.
export function debounce(fn, ms = 130) {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
}

// Promise wrapper around the Geolocation API (works offline; device GPS).
export function geolocate(opts = { enableHighAccuracy: true, timeout: 10000 }) {
  return new Promise((resolve, reject) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) { reject(new Error('Geolocation unavailable')); return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy }),
      (err) => reject(new Error(err.message || 'No location')), opts);
  });
}

// Great-circle distance in km between two {lat,lng} points (works offline; pure maths).
export function haversineKm(a, b) {
  if (!a || !b) return null;
  const R = 6371, toRad = (d) => d * Math.PI / 180;
  const dLat = toRad(b.lat - a.lat), dLng = toRad(b.lng - a.lng);
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(s)));
}

// Initial compass bearing (degrees, 0=N) from point a to point b.
export function bearing(a, b) {
  if (!a || !b) return null;
  const toRad = (d) => d * Math.PI / 180;
  const y = Math.sin(toRad(b.lng - a.lng)) * Math.cos(toRad(b.lat));
  const x = Math.cos(toRad(a.lat)) * Math.sin(toRad(b.lat)) -
            Math.sin(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.cos(toRad(b.lng - a.lng));
  return (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
}

// Bearing degrees -> 8-point compass label (N, NE, E, ...).
export function compass(deg) {
  if (deg == null) return '';
  return ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'][Math.round(deg / 45) % 8];
}

// Human-friendly distance: "350 m" under 1 km, else "1.2 km".
export function fmtDistance(km) {
  if (km == null) return '';
  return km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(km < 10 ? 1 : 0)} km`;
}

// fetch() that can actually give up. Every network call in this app used the bare global,
// which fails in two very different ways and only ever recovers from one of them:
//
//   REFUSED — no SIM, aeroplane mode, DNS blocked, connection reset. fetch() rejects, and
//   every caller here already catches that and falls back to its cached value. This case
//   has always worked.
//
//   HUNG — the network accepts the connection and then goes quiet. A hotel captive portal
//   that swallows the request until you log in, a VPN that is half-connected or throttled,
//   a SIM showing full signal with no working data behind it. fetch() never rejects and
//   never resolves, so `await fetch(...)` waits forever, and no try/catch can rescue it
//   because nothing was ever thrown. The cached fallback sitting right there in the catch
//   block never runs, and any spinner the traveller is looking at spins until they give up.
//
// The second case is the ordinary one on the road, and it is the one this app had no answer
// for: there was not a single AbortController anywhere in js/. Wrapping fetch here turns a
// hang into a rejection after `ms`, which converts the failure the callers cannot handle
// into the one they all already do.
//
// navigator.onLine is NOT a substitute and is checked in several callers as a fast path
// only: it reports true on a captive portal, which is precisely the case this exists for.
//
// Callers may still pass their own `signal` (visits.js does) — theirs and the timeout are
// composed, so whichever fires first wins. Rejection is an AbortError either way, which
// visits.js already distinguishes by name.
export function fetchTimeout(url, opts = {}, ms = 10000) {
  if (typeof AbortController === 'undefined') return fetch(url, opts);
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms);
  const outer = opts.signal;
  if (outer) {
    if (outer.aborted) ctrl.abort();
    else outer.addEventListener('abort', () => ctrl.abort(), { once: true });
  }
  // The deadline deliberately stays armed after the fetch resolves. fetch() settles as soon
  // as the response HEADERS arrive — the body may still be streaming behind them, and
  // "headers, then silence" is exactly what a captive portal and a stalling VPN do. Clearing
  // the timer at the headers would leave every `await res.json()` in this app unprotected,
  // which is the same hang wearing a different hat.
  //
  // Aborting a response whose body has already been read is a no-op, so the armed timer costs
  // nothing on the normal path. It does mean callers must read the body PROMPTLY rather than
  // parking a Response and reading it minutes later; every caller here reads it on the next
  // line. Only a rejection clears the timer, because at that point there is nothing left to
  // protect.
  return fetch(url, { ...opts, signal: ctrl.signal })
    .catch((err) => { clearTimeout(timer); throw err; });
}
