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

// Currency formatting. Falls back gracefully for codes Intl does not know.
export function money(amount, currency) {
  if (amount == null) return '';
  const whole = NO_MINOR_UNITS.includes(currency) || amount >= 1000;
  try {
    return new Intl.NumberFormat(numLocale(), {
      style: 'currency', currency,
      minimumFractionDigits: whole ? 0 : undefined,
      maximumFractionDigits: whole ? 0 : 2,
    }).format(amount);
  } catch {
    return `${amount} ${currency}`;
  }
}

// Render a low–high range as a compact string, e.g. "฿40–120".
export function range(low, high, currency) {
  if (low == null && high == null) return '';
  if (low != null && high != null && low !== high) return `${money(low, currency)}–${money(high, currency)}`;
  return money(low != null ? low : high, currency);
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
