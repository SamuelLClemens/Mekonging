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

// Currency formatting. Falls back gracefully for codes Intl does not know.
export function money(amount, currency) {
  if (amount == null) return '';
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency', currency, maximumFractionDigits: amount >= 1000 ? 0 : 2,
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

// Build a maps deep link from a query string or coordinates.
export function mapsUrl({ mapQuery, coords } = {}) {
  if (coords && coords.lat != null && coords.lng != null) {
    return `https://www.google.com/maps/search/?api=1&query=${coords.lat},${coords.lng}`;
  }
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapQuery || '')}`;
}

// Title-case a slug or short label.
export function titleCase(s) {
  return String(s || '').replace(/[-_]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}
