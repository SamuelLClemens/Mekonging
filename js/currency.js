// Currency rates + converter. Offline-first: the last fetched rates are cached in
// localStorage and used offline; when online, refreshRates() updates them from a
// free, no-key endpoint (open.er-api.com, ~160 currencies incl. THB/VND/KHR/LAK).
// A built-in approximate fallback means the converter works on first run, offline,
// before any fetch — clearly labelled as approximate.
//
// STAYING CURRENT. Rates used to be fetched exactly once per cold boot, plus a manual
// "Refresh rates" button. That is not enough for how this app is actually used: it is an
// installed PWA that a traveller leaves open for a whole day, and it very often BOOTS
// offline (no SIM yet, plane mode, a dead hotel connection) — in which case the one boot
// fetch was skipped and nothing ever tried again, so the converter silently ran on the
// hardcoded approximate table for the rest of the trip. maybeRefreshRates() below is the
// automatic path: it is cheap to call as often as you like, because it no-ops unless the
// cached rates are actually due. Triggers are wired in js/main.js (boot, regaining
// connectivity, returning to the foreground, and a periodic check while open).
//
// The endpoint publishes its own next-update time (time_next_update_unix); the free tier
// refreshes about daily, so honouring that beats guessing an interval. TTL_MS is only the
// fallback for a response that omits it, and MIN_GAP_MS stops a flapping connection from
// hammering the endpoint.

const KEY = 'mk.rates';
const ENDPOINT = 'https://open.er-api.com/v6/latest/USD';
const TTL_MS = 6 * 60 * 60 * 1000;    // fallback staleness window when the API gives no next-update time
const MIN_GAP_MS = 10 * 60 * 1000;    // never re-attempt more often than this, success or failure
let _lastAttempt = 0;
let _inFlight = null;

// The one canonical currency list for every picker in the app (per-expense currency,
// withdrawal currency, and the "show totals & percentages in" display currency in both
// Settings and the Budget screen). A single shared list means those pickers can never
// drift out of sync with each other — previously Settings' home-currency picker hardcoded
// its own, shorter list that omitted THB/VND/KHR/LAK/CNY/MYR entirely, so a traveller could
// log an expense in Thai Baht but could never choose Baht as the currency totals are shown
// in. Order matches the rates object above (major currencies first, Mekong-region last).
export const CURRENCY_CODES = ['USD', 'EUR', 'GBP', 'AUD', 'CAD', 'SGD', 'CNY', 'MYR', 'ILS', 'THB', 'VND', 'KHR', 'LAK'];

// Approximate baseline (per 1 USD). Labelled "approximate" until a live refresh.
const FALLBACK = {
  base: 'USD', date: 'approximate', live: false,
  rates: {
    USD: 1, EUR: 0.92, GBP: 0.79, AUD: 1.52, CAD: 1.36, SGD: 1.35, CNY: 7.15, MYR: 4.7,
    ILS: 3.7, THB: 36, VND: 25400, KHR: 4100, LAK: 21800,
  },
};

export function getRates() {
  try { const c = JSON.parse(localStorage.getItem(KEY)); if (c && c.rates) return c; } catch { /* ignore */ }
  return FALLBACK;
}

// True when the cached rates are due for a refresh. Honours the endpoint's own published
// next-update time when we have it, and falls back to TTL_MS otherwise. An approximate
// (never-fetched) table is always stale.
export function ratesAreStale(now = Date.now()) {
  const r = getRates();
  if (!r.live) return true;
  if (r.nextUpdate) return now >= r.nextUpdate;
  if (!r.fetchedAt) return true;
  return (now - r.fetchedAt) >= TTL_MS;
}

export function ratesAge(now = Date.now()) {
  const r = getRates();
  return r.fetchedAt ? now - r.fetchedAt : null;
}

// The automatic path. Safe and cheap to call from any trigger: it returns immediately unless
// the rates are actually due, refuses to retry inside MIN_GAP_MS, and shares one in-flight
// request between concurrent callers. Resolves to true only when the stored rates CHANGED,
// so a caller can re-render on a real update and do nothing otherwise.
export async function maybeRefreshRates(force = false) {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return false;
  if (!force && !ratesAreStale()) return false;
  const now = Date.now();
  if (!force && (now - _lastAttempt) < MIN_GAP_MS) return false;
  if (_inFlight) return _inFlight;
  const before = getRates();
  _lastAttempt = now;
  _inFlight = refreshRates()
    .then((rec) => !!(rec && rec.live && rec.fetchedAt !== before.fetchedAt))
    .catch(() => false)
    .finally(() => { _inFlight = null; });
  return _inFlight;
}

export async function refreshRates() {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return getRates();
  try {
    const res = await fetch(ENDPOINT);
    const d = await res.json();
    if (d && d.rates && d.rates.USD) {
      // time_next_update_unix is SECONDS since epoch; everything else here is ms.
      const nextUpdate = Number(d.time_next_update_unix) > 0
        ? Number(d.time_next_update_unix) * 1000 : null;
      const rec = {
        base: 'USD', date: d.time_last_update_utc || new Date().toUTCString(), live: true,
        fetchedAt: Date.now(), nextUpdate, rates: d.rates,
      };
      try { localStorage.setItem(KEY, JSON.stringify(rec)); } catch { /* storage full */ }
      return rec;
    }
  } catch { /* offline or blocked — keep cached/fallback */ }
  return getRates();
}

// Convert via USD base. Returns a number, or null if a currency is unknown.
export function convert(amount, from, to) {
  const { rates } = getRates();
  if (rates[from] == null || rates[to] == null) return null;
  return amount * (rates[to] / rates[from]);
}

export function hasRate(code) { return getRates().rates[code] != null; }
