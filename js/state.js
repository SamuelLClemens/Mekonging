// Versioned localStorage store. Everything lives on the device — nothing ever
// leaves it. Schema migrations keep future updates from wiping saved data.
// Mirrors the Gardenoosh state module (defaults / migrate / save / resetAll).

const KEY = 'mk.store';
const CURRENT_VERSION = 1;

function defaults() {
  return {
    version: CURRENT_VERSION,
    profile: {
      name: '',
      homeCurrency: 'USD',     // used to show an approximate home-currency hint later
      prefs: {
        interests: [],          // subset of ['food','culture','nature','nightlife']
        budget: 'flexible',     // 'low' | 'mid' | 'high' | 'flexible'
      },
      defaultLang: 'th',        // phrasebook language to open first
      // Optional, user-supplied live-translate endpoint + key. Stored ONLY on this
      // device, never transmitted except to the endpoint the user configures, and
      // never committed to source. Enabling also requires the endpoint origin in
      // the page CSP connect-src (see Settings copy).
      translateEndpoint: '',
      translateKey: '',
      theme: 'light',           // 'light' | 'dark'
      reducedMotion: 'auto',    // 'auto' | 'on' | 'off'
      seenWelcome: false,
    },
    favorites: [],              // place ids the traveller has saved
    trip: {
      stops: [],                // { id, city, country, fromDate, toDate }
      budgetLog: [],            // { id, date:'YYYY-MM-DD', amount, currency, note }
      notes: '',
    },
  };
}

function migrate(data) {
  if (!data || typeof data !== 'object') return defaults();
  if (!data.version || data.version > CURRENT_VERSION) return defaults();
  const base = defaults();
  // Additive, lossless: new fields self-default via the spread; existing
  // favorites[] and trip carry forward verbatim. Future versions add
  // `if ((data.version||1) < N) { ... }` blocks here, like Gardenoosh.
  const out = {
    version: CURRENT_VERSION,
    profile: { ...base.profile, ...(data.profile || {}),
               prefs: { ...base.profile.prefs, ...((data.profile || {}).prefs || {}) } },
    favorites: Array.isArray(data.favorites) ? data.favorites : base.favorites,
    trip: { ...base.trip, ...(data.trip || {}) },
  };
  return out;
}

function load() {
  try {
    return migrate(JSON.parse(localStorage.getItem(KEY)));
  } catch {
    return defaults();
  }
}

export const store = load();

export function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(store));
  } catch {
    // storage full or private mode — the session still works, it just will not persist
  }
}

export function resetAll() {
  try { localStorage.removeItem(KEY); } catch { /* ignore */ }
  const fresh = defaults();
  store.version = fresh.version;
  store.profile = fresh.profile;
  store.favorites = fresh.favorites;
  store.trip = fresh.trip;
  save();
}

// --- favorites helpers --------------------------------------------------------
export function isFavorite(id) { return store.favorites.includes(id); }
export function toggleFavorite(id) {
  const i = store.favorites.indexOf(id);
  if (i >= 0) store.favorites.splice(i, 1);
  else store.favorites.push(id);
  save();
  return store.favorites.includes(id);
}

export function prefersReducedMotion() {
  const pref = store.profile && store.profile.reducedMotion;
  if (pref === 'on') return true;
  if (pref === 'off') return false;
  return !!(typeof window !== 'undefined' && window.matchMedia
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
}

export function todayKey(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
