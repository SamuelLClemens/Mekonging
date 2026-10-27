// The post-trip recap (#recap, js/screens/trip-recap.js) as one plain object, derived from what the app already holds. Pure
// derivation, no DOM: every figure on the screen comes from here, so a test can compare the screen with the store.
// A section the traveller never logged is null or empty here and is left out of the screen. Counts and sums are exact; what is
// derived by a rule (nights per country, the mode of an unchosen leg) is flagged so the screen can say so.
import { store, journalEntries, getAlbum, getPin } from './state.js';
import { expCatOf, expCatLookup, customExpCats } from './budget-ui.js';
import { getCountry, getPlace } from './data/regions.js';
import { journeyOverride } from './trail.js';
import { WEATHER_SPOTS } from './weather.js';
import { homeCurrency, entryPhotoKeys, countriesNearFix } from './main.js';
import { journeyStops, journeyLegs, jkm, NEAR_KM } from './journey-stops.js';
import { amountOf, inHome } from './recap-spend.js';

const DAY = 86400000;
const ISO = /^\d{4}-\d{2}-\d{2}$/;
const utc = (iso) => Date.UTC(+iso.slice(0, 4), +iso.slice(5, 7) - 1, +iso.slice(8, 10));
export const addDays = (iso, n) => new Date(utc(iso) + n * DAY).toISOString().slice(0, 10);
export const diffDays = (a, b) => Math.round((utc(b) - utc(a)) / DAY);

// Chart slot per expense category (--viz-1 to --viz-8, css/refined.css): food 1, stay 2, transit 3, gear 4, then the traveller's own
// categories 5 to 8 in the order they were made. "Other", and any own category past the eighth slot, is 0 (neutral grey): a ninth
// colour is never made up. The slot follows the category, never its rank, so a filter or a new category repaints nothing.
export function catSlot(id) {
  const order = ['food', 'stay', 'transit', 'gear', ...customExpCats().map((c) => c.id)];
  const i = order.indexOf(id);
  return i >= 0 && i < 8 ? i + 1 : 0;
}

// The stop a trip stop merged into (journeyStops matches by label, then by nearness), so its end date can lengthen that stop's stay:
// journeyStops stamps a trip stop's start date only.
function stopFor(located, title, hit) {
  const t = title.toLowerCase();
  const named = located.find((s) => (s.label || '').trim().toLowerCase() === t);
  if (named) return named;
  let best = null, bestKm = Infinity;
  for (const s of located) { const d = jkm(hit, s); if (d < bestKm) { bestKm = d; best = s; } }
  return best && bestKm < NEAR_KM ? best : null;
}

const countryOfStop = (s) => s.cc || countriesNearFix(s)[0] || '';

// One list in date order of every place the traveller stayed: the located stops, plus dated trip stops whose title is no known city
// (those reach no map, but they are dates and, if the traveller set a country, a country).
function timeline(located) {
  const list = located.map((s) => ({ label: s.label || '', cc: countryOfStop(s), first: s.first, last: s.last || s.first }));
  const byStop = new Map(located.map((s, i) => [s, list[i]]));
  (store.trip.stops || []).forEach((t) => {
    const title = (t.title || '').trim();
    if (!title || !ISO.test(t.date || '')) return;
    if (t.id && journeyOverride(`trip:${t.id}`).hidden) return;
    const end = ISO.test(t.endDate || '') ? t.endDate : t.date;
    const hit = WEATHER_SPOTS.find((w) => (w.city || '').toLowerCase() === title.toLowerCase());
    if (hit) {                                                  // journeyStops placed it already: only the end date is new
      const s = stopFor(located, title, hit), row = s && byStop.get(s);
      if (row && end > row.last) row.last = end;
      return;
    }
    list.push({ label: title, cc: t.country || '', first: t.date, last: end });
  });
  return list.filter((p) => ISO.test(p.first || '')).sort((a, b) => (a.first < b.first ? -1 : a.first > b.first ? 1 : 0));
}

// Spend as columns: a day each up to 45 days, a week each up to 200, a month each beyond. `cats` is keyed by series (see seriesKey).
function bucketsOf(rows, seriesKey) {
  if (!rows.length) return null;
  const dates = rows.map((r) => r.date).sort();
  const first = dates[0], last = dates[dates.length - 1];
  const span = diffDays(first, last) + 1;
  const unit = span <= 45 ? 'day' : span <= 200 ? 'week' : 'month';
  const list = [], at = {};
  const put = (key, from, to) => { if (!at[key]) { at[key] = { from, to, total: 0, cats: {} }; list.push(at[key]); } return at[key]; };
  if (unit === 'month') {
    let y = +first.slice(0, 4), m = +first.slice(5, 7);
    const endKey = last.slice(0, 7);
    for (;;) {
      const key = `${y}-${String(m).padStart(2, '0')}`;
      put(key, key + '-01', addDays(addDays(key + '-01', 31).slice(0, 7) + '-01', -1));
      if (key >= endKey) break;
      if (++m > 12) { m = 1; y++; }
    }
  } else {
    const step = unit === 'day' ? 1 : 7;
    for (let i = 0; i * step < span; i++) put(String(i), addDays(first, i * step), addDays(first, Math.min(span - 1, i * step + step - 1)));
  }
  rows.forEach((r) => {
    const key = unit === 'month' ? r.date.slice(0, 7) : String(Math.floor(diffDays(first, r.date) / (unit === 'day' ? 1 : 7)));
    const b = at[key], k = seriesKey(r.cat);
    b.total += r.v; b.cats[k] = (b.cats[k] || 0) + r.v;
  });
  return { unit, list, peak: list.reduce((a, b) => (b.total > a.total ? b : a), list[0]) };
}

// `graphReady` is false until the route graph is built; a leg's mode is then a guess from distance and days (flagged `set: false`).
export function tripRecap({ graphReady = false } = {}) {
  const home = homeCurrency();
  const located = journeyStops().filter((s) => typeof s.lat === 'number' && typeof s.lng === 'number');
  const tl = timeline(located);

  let span = null;
  const countries = [], nightsAt = new Map();
  let placeOn = () => null;
  if (tl.length) {
    const from = tl[0].first;
    const to = tl.reduce((m, p) => (p.last > m ? p.last : m), from);
    const nights = diffDays(from, to);
    span = { from, to, days: nights + 1, nights };
    const current = (d) => { let cur = null; for (const p of tl) { if (p.first <= d) cur = p; else break; } return cur; };
    placeOn = (d) => (d < from || d > to ? null : current(d));
    for (let i = 0; i < nights; i++) { const p = current(addDays(from, i)); nightsAt.set(p, (nightsAt.get(p) || 0) + 1); }
  }
  const byCc = new Map();
  tl.forEach((p) => {
    const row = byCc.get(p.cc) || { cc: p.cc, name: p.cc ? (getCountry(p.cc) || {}).name || p.cc : 'Country not set', nights: 0, places: [] };
    row.nights += nightsAt.get(p) || 0;
    if (p.label && !row.places.includes(p.label)) row.places.push(p.label);
    byCc.set(p.cc, row);
  });
  byCc.forEach((r) => countries.push(r));
  countries.sort((a, b) => b.nights - a.nights);

  const legs = journeyLegs(located, graphReady).map((l) => ({ ...l, km: jkm(located[l.i], located[l.i + 1]), from: located[l.i], to: located[l.i + 1] }));
  const distanceKm = legs.reduce((a, l) => a + l.km, 0);
  const modes = [];
  legs.forEach((l) => {
    let m = modes.find((x) => x.mode === l.mode);
    if (!m) { m = { mode: l.mode, legs: 0, km: 0, set: 0 }; modes.push(m); }
    m.legs++; m.km += l.km; if (l.set) m.set++;
  });
  modes.sort((a, b) => b.legs - a.legs || b.km - a.km);

  // Spend. The total and every category cover all converted entries; the day columns and the country split cover the dated ones that
  // are not monthly; an entry in a currency with no rate is listed in `left` and in none of the sums.
  const cats = {}, byCountry = new Map(), dayRows = [], left = {};
  let total = 0, entriesN = 0, monthlyN = 0, monthlySum = 0, unplacedSum = 0;
  (store.trip.budgetLog || []).forEach((b) => {
    const v = amountOf(b);
    if (!v) return;
    const cur = b.currency || '';
    const c = inHome(v, cur, home);
    if (c == null) { const k = left[cur || '?'] || (left[cur || '?'] = { currency: cur || '?', amount: 0, n: 0 }); k.amount += v; k.n++; return; }
    entriesN++; total += c;
    const id = expCatOf(b);
    cats[id] = (cats[id] || 0) + c;
    if (b.monthly || !ISO.test(b.date || '')) { monthlyN++; monthlySum += c; return; }
    dayRows.push({ date: b.date, v: c, cat: id });
    const p = placeOn(b.date);
    if (!p) { unplacedSum += c; return; }
    byCountry.set(p.cc, (byCountry.get(p.cc) || 0) + c);
  });
  const byCat = Object.entries(cats).map(([id, value]) => ({ id, label: expCatLookup(id).label, value, slot: catSlot(id) })).sort((a, b) => b.value - a.value);
  // The stacked columns draw one series per slot plus a single "Other": own categories past the eighth slot fold into it.
  const seriesKey = (id) => (catSlot(id) ? id : 'other');
  const series = [];
  byCat.forEach((c) => {
    const key = seriesKey(c.id);
    if (!series.some((s) => s.key === key)) series.push({ key, label: key === 'other' ? 'Other' : c.label, slot: key === 'other' ? 0 : c.slot });
  });
  series.sort((a, b) => (a.slot || 99) - (b.slot || 99));
  const spend = {
    home, total, entries: entriesN, unplaced: unplacedSum, monthly: { n: monthlyN, sum: monthlySum },
    perDay: span && total ? total / span.days : 0,
    byDay: bucketsOf(dayRows, seriesKey), series, left: Object.values(left), byCat,
    byCountry: [...byCountry.entries()].map(([cc, value]) => ({ cc, name: cc ? (getCountry(cc) || {}).name || cc : 'Country not set', value })).sort((a, b) => b.value - a.value),
  };

  const entries = journalEntries();
  const album = getAlbum().length;
  let writtenMost = null;
  located.forEach((s) => { if (s.entries.length > (writtenMost ? writtenMost.entries.length : 0)) writtenMost = s; });
  const journal = {
    entries: entries.length, withPhotos: entries.filter((e) => entryPhotoKeys(e).length).length,
    photos: entries.reduce((a, e) => a + entryPhotoKeys(e).length, 0) + album, album,
    writtenMost: writtenMost && writtenMost.entries.length > 1 ? { label: writtenMost.label, n: writtenMost.entries.length } : null,
  };

  const rated = Object.entries(store.placeData || {}).filter(([, d]) => d && (d.rating || 0) > 0);
  const stars = [0, 0, 0, 0, 0];
  rated.forEach(([, d]) => { stars[Math.min(5, Math.max(1, Math.round(d.rating))) - 1]++; });
  const top = rated.map(([id, d]) => ({ id, d, p: getPlace(id) || getPin(id) })).filter((x) => x.p)
    .sort((a, b) => (b.d.rating || 0) - (a.d.rating || 0) || (b.d.updatedAt || 0) - (a.d.updatedAt || 0)).slice(0, 5)
    .map(({ id, d, p }) => ({ id, name: p.name, rating: Math.round(d.rating), country: p.country ? (getCountry(p.country) || {}).name || '' : '', review: d.review || '', isPin: !getPlace(id) }));
  const places = { rated: rated.length, loved: rated.filter(([, d]) => d.rating >= 4).length, saved: (store.favorites || []).length, stars, top };

  const model = { home, span, countries, countryCount: countries.filter((c) => c.cc).length, located, stops: located.length, legs, distanceKm, modes, spend, journal, places };
  model.empty = !span && !located.length && !entriesN && !spend.left.length && !journal.entries && !journal.photos && !places.rated && !places.saved;
  return model;
}
