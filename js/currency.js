// Currency rates + converter. Offline-first: the last fetched rates are cached in
// localStorage and used offline; when online, refreshRates() updates them from a
// free, no-key endpoint (open.er-api.com, ~160 currencies incl. THB/VND/KHR/LAK).
// A built-in approximate fallback means the converter works on first run, offline,
// before any fetch — clearly labelled as approximate.

const KEY = 'mk.rates';
const ENDPOINT = 'https://open.er-api.com/v6/latest/USD';

// Approximate baseline (per 1 USD). Labelled "approximate" until a live refresh.
const FALLBACK = {
  base: 'USD', date: 'approximate', live: false,
  rates: {
    USD: 1, EUR: 0.92, GBP: 0.79, AUD: 1.52, CAD: 1.36, SGD: 1.35, CNY: 7.15, MYR: 4.7,
    THB: 36, VND: 25400, KHR: 4100, LAK: 21800,
  },
};

export function getRates() {
  try { const c = JSON.parse(localStorage.getItem(KEY)); if (c && c.rates) return c; } catch { /* ignore */ }
  return FALLBACK;
}

export async function refreshRates() {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return getRates();
  try {
    const res = await fetch(ENDPOINT);
    const d = await res.json();
    if (d && d.rates && d.rates.USD) {
      const rec = { base: 'USD', date: d.time_last_update_utc || new Date().toUTCString(), live: true, rates: d.rates };
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
