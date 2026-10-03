// "Before you lose signal" (audit F-23): one card, on Settings and the trip screen, listing what a
// traveller needs on the phone before the signal goes (the field guide, phrase audio for the
// trip's countries, a map around each stop, each stop's forecast) with the size of each, and one
// button that gets whatever is missing. It drives the same downloads as the separate cards
// (Settings, Talk, Places), so what it saves shows there too and nothing is fetched twice.
import { h } from './util.js';
import { getSavedAreas, addSavedArea, removeSavedArea, hasAudioPack } from './state.js';
import { packState, onPackChange, refreshPackStatus, resumePack } from './offline-pack.js';
import { packUrls, downloadPacks, CLIP_BYTES, quotaNote, estimateStorage } from './audio-packs.js';
import { tileUrlsForArea, TILE_BYTES } from './map-tiles.js';
import { getCachedWeather, maybeRefreshWeather, spotKey } from './weather.js';
import { loadData } from './lazy-data.js';
import { infoTip, online } from './ui-widgets.js';
import { upcomingStops, focusSpot, langForCountry, PREFETCH_TTL_MS } from './main.js';

const AREA_KM = 4;             // half-width: an 8 km square, a town and its edges
const AREA_Z = 13;             // saved with zooms 13-15, as "Save this map view" at zoom 13 is
const FORECAST_BYTES = 18000;  // one 16-day forecast as sent, gzipped (measured for S6)

const fmt = (b) => (b < 104858 ? '< 0.1 MB' : `${(b / 1048576).toFixed(b < 10485760 ? 1 : 0)} MB`);
const ago = (ms) => (ms < 3600000 ? `${Math.max(1, Math.round(ms / 60000))} min`
  : ms < 86400000 ? `${Math.round(ms / 3600000)} h` : `${Math.round(ms / 86400000)} d`);

// The stops the forecast cache keeps (js/main.js upcomingStops); with no trip, where they are now.
function places() {
  const ups = upcomingStops().filter((x) => x.spot);
  if (ups.length) return ups.map((x) => ({ name: x.stop.title, spot: x.spot, located: x.located }));
  const f = focusSpot();
  return [{ name: f.displayCity || f.spot.city, spot: f.spot, located: true }];
}

function areaFor(spot) {
  const dLat = AREA_KM / 111.32;
  const dLng = AREA_KM / (111.32 * Math.cos(spot.lat * Math.PI / 180));
  return { w: spot.lng - dLng, s: spot.lat - dLat, e: spot.lng + dLng, n: spot.lat + dLat };
}

// A saved area counts when it reaches street level over the stop and every tile it lists arrived.
function hasAreaAt(spot) {
  return getSavedAreas().some((a) => a.bounds && a.z >= AREA_Z
    && spot.lng >= a.bounds.w && spot.lng <= a.bounds.e && spot.lat >= a.bounds.s && spot.lat <= a.bounds.n
    && (a.count || 0) >= tileUrlsForArea(a.bounds, a.z).length);
}

async function checklist() {
  const pl = places();
  const s = packState();
  const items = [{ kind: 'guide', label: 'Field guide photos and calls', bytes: s.left, done: s.left === 0, busy: s.running }];
  const books = await loadData('phrasebooks').then((m) => m.LANGUAGES).catch(() => ({}));
  [...new Set(pl.map((p) => langForCountry(p.spot.country)))].forEach((code) => {
    const book = books[code];
    if (!book) return;
    const n = packUrls(code).length;
    if (!n) items.push({ kind: 'note', label: `${book.label} audio: no offline voice exists yet` });
    else items.push({ kind: 'audio', code, name: book.label, label: `${book.label} phrase audio`, clips: n, bytes: n * CLIP_BYTES, done: hasAudioPack(code) });
  });
  pl.forEach((p) => {
    if (!p.located) { items.push({ kind: 'note', label: `${p.name}: no map position — save it from Places` }); return; }
    const bounds = areaFor(p.spot);
    items.push({ kind: 'map', label: `Map: ${p.name}`, place: p, bounds,
      bytes: tileUrlsForArea(bounds, AREA_Z).length * TILE_BYTES, done: hasAreaAt(p.spot) });
  });
  const seen = new Set();
  pl.forEach((p) => {
    const key = spotKey(p.spot);
    if (seen.has(key)) return;
    seen.add(key);
    const rec = getCachedWeather(key);
    const age = rec && rec.fetchedAt ? Date.now() - rec.fetchedAt : null;
    items.push({ kind: 'wx', label: `Forecast: ${p.spot.city}`, spot: p.spot, age,
      bytes: FORECAST_BYTES, done: age != null && age < PREFETCH_TTL_MS });
  });
  return items;
}

// Same message flow as js/offline-areas-ui.js, and recorded as a saved area, so the map lists
// it, keeps its tiles out of the cache trim and can delete it.
function saveArea(it, onProgress) {
  const sw = navigator.serviceWorker;
  if (!sw || !sw.controller) return Promise.resolve();
  const urls = tileUrlsForArea(it.bounds, AREA_Z);
  const protect = getSavedAreas().flatMap((a) => (a.bounds ? tileUrlsForArea(a.bounds, a.z || 12) : []));
  return new Promise((resolve) => {
    const onMsg = (e) => {
      const d = e.data || {};
      if (d.type === 'PREFETCH_PROGRESS') { onProgress(d.done, d.total); return; }
      if (d.type !== 'PREFETCH_DONE') return;
      sw.removeEventListener('message', onMsg);
      if (d.ok > 0) {
        const prev = getSavedAreas().find((a) => a.z === AREA_Z && a.bounds && a.bounds.w === it.bounds.w && a.bounds.n === it.bounds.n);
        if (prev) removeSavedArea(prev.id);
        addSavedArea({ name: it.place.name, center: { lng: it.place.spot.lng, lat: it.place.spot.lat }, bounds: it.bounds, z: AREA_Z, count: d.ok });
      }
      resolve();
    };
    sw.addEventListener('message', onMsg);
    sw.controller.postMessage({ type: 'PREFETCH_TILES', urls, protect });
  });
}

// Module state, so a card rebuilt mid-run (a re-render, another screen) shows the same run.
let runLabel = '';
const runSubs = new Set();
function setRun(label) { runLabel = label; runSubs.forEach((fn) => fn()); }

// Smallest and most perishable first. The field guide is last because it continues in the
// background (js/offline-pack.js), and its row shows its progress.
async function getEverything(todo) {
  if (runLabel) return;
  setRun('Saving forecasts…');
  try {
    await Promise.all(todo.filter((it) => it.kind === 'wx').map((it) => maybeRefreshWeather(it.spot, true).catch(() => null)));
    for (const it of todo.filter((x) => x.kind === 'map')) {
      setRun(`Saving the map of ${it.place.name}…`);
      await saveArea(it, (done, total) => setRun(`Saving the map of ${it.place.name} — ${done} of ${total} tiles`));
    }
    const audio = todo.filter((x) => x.kind === 'audio');
    if (audio.length) {
      await downloadPacks(audio.map((x) => x.code), (code, i, n, done, total) =>
        setRun(`Saving ${audio.find((x) => x.code === code).name} audio — ${done} of ${total} clips`));
    }
    if (todo.some((x) => x.kind === 'guide')) resumePack();
  } finally {
    setRun('');
  }
}

export function offlineReadyCard() {
  const status = h('p', { class: 'muted pack-state' }, 'Checking what is on this phone…');
  const list = h('ul', { class: 'pack-tiers' });
  const btns = h('div', { class: 'pack-btns' });
  const card = h('div', { class: 'card' }, [
    h('div', { class: 'row-between' }, [
      h('h2', {}, '📶 Before you lose signal'),
      infoTip('Everything here works with no signal once it is saved. Sizes are estimates, except the field guide’s. Each map covers about 8 km around a stop at street level and is listed under Places → Saved offline areas. Forecasts are kept for up to four stops.'),
    ]),
    status, list, btns,
  ]);
  let items = [];
  let quota = null;
  const paint = () => {
    const s = packState();
    list.innerHTML = '';
    items.forEach((it) => {
      let right = '';
      if (it.kind === 'guide' && it.busy) right = `${s.total ? Math.round((s.done / s.total) * 100) : 0}%`;
      else if (it.kind === 'guide' && it.done) right = fmt(s.storedBytes);
      else if (it.kind === 'wx' && it.age != null) right = `saved ${ago(it.age)} ago`;
      else if (it.done) right = 'saved';
      else if (it.kind !== 'note') right = it.kind === 'guide' ? fmt(it.bytes) : `≈ ${fmt(it.bytes)}`;
      list.append(h('li', { class: 'pack-tier' + (it.done && !it.busy ? ' is-done' : '') }, [
        h('span', { class: 'pt-ic', 'aria-hidden': 'true' }, it.busy ? '↓' : it.done ? '✓' : it.kind === 'note' ? '–' : '·'),
        h('span', {}, it.label),
        right ? h('span', { class: 'pt-size' }, right) : null,
      ]));
    });
    btns.innerHTML = '';
    const todo = items.filter((it) => it.kind !== 'note' && !it.done && !it.busy);
    if (runLabel) status.textContent = runLabel;
    else if (!todo.length) status.textContent = items.some((it) => it.busy) ? 'The field guide is still downloading.' : 'Everything on this list is on this phone.';
    else if (!online()) status.textContent = 'Offline. This is what is on this phone; connect to get the rest.';
    else {
      // The sizes above are download sizes. On Chromium the audio also costs far more of the
      // storage allowance than it weighs (js/audio-packs.js QUOTA_CLIP_BYTES), so say so here,
      // before the one button that would spend it.
      const audio = todo.filter((it) => it.kind === 'audio');
      status.textContent = audio.length ? quotaNote(Math.round(audio.reduce((n, it) => n + it.clips, 0) / audio.length), quota) : '';
      const total = todo.reduce((n, it) => n + it.bytes, 0);
      btns.append(h('button', { class: 'btn block', onclick: () => getEverything(todo) }, `⤓ Get everything (≈ ${fmt(total)})`));
    }
  };
  const refresh = () => { checklist().then((x) => { items = x; paint(); }).catch(() => {}); };
  // status, not card: mount() folds the card by moving its children into a <details> and
  // detaching the card element itself.
  const onChange = () => { if (status.isConnected) refresh(); else { runSubs.delete(onChange); offPack(); } };
  const offPack = onPackChange(onChange);
  runSubs.add(onChange);
  refresh();
  refreshPackStatus().catch(() => {});
  estimateStorage().then((est) => { if (est && est.quota) { quota = est.quota; paint(); } });
  return card;
}
