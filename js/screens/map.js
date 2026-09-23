// The standalone offline map: the whole region at once, with borders, hospitals and
// satellite/street imagery as independently toggleable layers, plus the measure tool,
// offline name search, "keep screen on" and offline-area downloads — every mode-independent
// capability map.js's controller exposes, in one place, reachable with no other screen open.
//
// This is `initMap`'s "full mode" (opts.places omitted): a code path kept alive specifically
// for this screen (see map.js's own comments on embed vs. full mode) but with no live caller
// until now. Curated places (stay/food/etc.) are deliberately NOT shown here — they are
// DOM-marker-based and country-scoped by every existing caller, and showing all four
// countries' places at once on a region-wide map would multiply redraw cost for a screen whose
// whole value is being fast and reliable with no signal. Places already owns that job, with
// filters and a shortlist; this screen links to it instead of duplicating it.
import { getLiveCleanup, setLiveCleanup } from '../app-state.js';
import { store, save, setLastFix } from '../state.js';
import { h } from '../util.js';
import { screenHint, foldedCard, pricesInPicker } from '../ui-widgets.js';
import { buildOfflineAreasCard } from '../offline-areas-ui.js';
import { buildWalkCard } from '../walk-ui.js';
import { mount, topbar } from '../main.js';

export function mapScreen() {
  const wrap = h('div', { class: 'screen' });
  wrap.append(topbar('Full offline map', '#home'));
  wrap.append(screenHint('Every country in one place — borders, hospitals and satellite or street imagery, working with no signal once opened or downloaded. Looking for places to stay, eat or visit? → Places has those, with filters and a shortlist.'));

  let mapCtrl = null;
  const mapLayersPrefs = store.profile.prefs.mapLayers || (store.profile.prefs.mapLayers = { borders: true });

  // ---- Map / Satellite style ------------------------------------------------------
  const satOn = mapLayersPrefs.satellite !== false;
  const mapBtn = h('button', { class: 'chip', 'aria-pressed': satOn ? 'false' : 'true', onclick: () => setSat(false) }, '🗺 Map');
  const satBtn = h('button', { class: 'chip', 'aria-pressed': satOn ? 'true' : 'false', onclick: () => setSat(true) }, '🛰 Satellite');
  function setSat(on) {
    mapLayersPrefs.satellite = on; save();
    mapBtn.setAttribute('aria-pressed', on ? 'false' : 'true');
    satBtn.setAttribute('aria-pressed', on ? 'true' : 'false');
    if (mapCtrl) mapCtrl.setSatellite(on);
  }

  // Same store.profile.prefs.mapLayers object Places' own "🛠 More map tools" fold reads/
  // writes, so borders/hospitals are one shared setting rather than two independent toggles.
  // Press-toggle chips, multi-select — the same treatment Places uses, so the two screens keep
  // reading as one feature rather than drifting into two different controls for one setting.
  const MAP_LAYERS = [
    { key: 'borders', label: '🗺️ Borders', isOn: () => mapLayersPrefs.borders !== false,
      apply: (v) => { if (mapCtrl) mapCtrl.setBorders(v); } },
    { key: 'hospitals', label: '🏥 Hospitals', isOn: () => mapLayersPrefs.hospitals === true,
      apply: (v) => { if (mapCtrl) mapCtrl.setHospitals(v); } },
    { key: 'atms', label: '🏧 Lowest-fee ATMs', isOn: () => mapLayersPrefs.atms === true,
      apply: (v) => { if (mapCtrl) mapCtrl.setAtms(v); } },
    { key: 'buses', label: '🚌 Bus stops', isOn: () => mapLayersPrefs.buses === true,
      apply: (v) => { if (mapCtrl) mapCtrl.setBus(v); } },
    { key: 'ferries', label: '⛴️ Ferries', isOn: () => mapLayersPrefs.ferries === true,
      apply: (v) => { if (mapCtrl) mapCtrl.setFerries(v); } },
    { key: 'trails', label: '🥾 Hiking trails', isOn: () => mapLayersPrefs.trails === true,
      apply: (v) => { if (mapCtrl) mapCtrl.setTrails(v); } },
    { key: 'bike', label: '🚲 Bike paths', isOn: () => mapLayersPrefs.bike === true,
      apply: (v) => { if (mapCtrl) mapCtrl.setBike(v); } },
    { key: 'scenic', label: '👁 Viewpoints & waterfalls', isOn: () => mapLayersPrefs.scenic === true,
      apply: (v) => { if (mapCtrl) mapCtrl.setScenic(v); } },
  ];
  const layerChips = MAP_LAYERS.map((layer) => {
    const chip = h('button', {
      type: 'button', class: 'chip mk-layer-toggle',
      'aria-pressed': layer.isOn() ? 'true' : 'false',
      onclick: () => {
        const next = chip.getAttribute('aria-pressed') !== 'true';
        chip.setAttribute('aria-pressed', next ? 'true' : 'false');
        mapLayersPrefs[layer.key] = next;
        save();
        layer.apply(next);
      },
    }, layer.label);
    return chip;
  });

  // ---- Measure tool -----------------------------------------------------------------
  let measuring = false;
  const measureOut = h('p', { class: 'map-hint', style: 'margin: var(--sp-2) 0 0;display:none' }, '');
  const fmtKm = (km) => (km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(km < 10 ? 2 : 1)} km`);
  function toggleMeasure() {
    if (!mapCtrl) return;
    measuring = !measuring;
    if (measuring) {
      measureBtn.textContent = '📏 Measuring — tap the map'; measureBtn.classList.add('toggle-on');
      measureOut.style.display = ''; measureOut.textContent = 'Tap two or more points on the map to measure the distance.';
      mapCtrl.toggleMeasure(true, (km, n) => {
        measureOut.textContent = n < 2 ? 'Tap another point to measure…'
          : `Distance: ${fmtKm(km)} over ${n} points. Tap to extend, or tap “Measure” again to finish.`;
      });
    } else {
      measureBtn.textContent = '📏 Measure'; measureBtn.classList.remove('toggle-on');
      measureOut.style.display = 'none';
      mapCtrl.toggleMeasure(false);
    }
  }
  const measureBtn = h('button', { class: 'btn ghost', onclick: toggleMeasure }, '📏 Measure');

  // ---- Keep screen on (Wake Lock), ported verbatim from Places' own copy ----------------
  let wakeLock = null, wantWake = false;
  const wakeBtn = h('button', { class: 'btn ghost', onclick: toggleWake }, '🔆 Keep screen on');
  if (!('wakeLock' in navigator)) wakeBtn.style.display = 'none';
  async function acquireWake() {
    wakeLock = await navigator.wakeLock.request('screen');
    wakeLock.addEventListener('release', () => { wakeLock = null; });
  }
  async function toggleWake() {
    if (wantWake) {
      wantWake = false;
      try { if (wakeLock) await wakeLock.release(); } catch { /* already gone */ }
      wakeLock = null; wakeBtn.textContent = '🔆 Keep screen on'; wakeBtn.classList.remove('toggle-on');
    } else {
      try { await acquireWake(); wantWake = true; wakeBtn.textContent = '🔆 Screen stays on'; wakeBtn.classList.add('toggle-on'); }
      catch { /* denied — leave the button in its off state */ }
    }
  }
  const onVis = () => { if (wantWake && wakeLock === null && document.visibilityState === 'visible') acquireWake().catch(() => { /* denied */ }); };
  document.addEventListener('visibilitychange', onVis);

  // ---- Offline name search: cities, curated places, pools and pins, across all countries ---
  const searchResults = h('div', { class: 'map-search-results' });
  const SEARCH_ICON = { City: '🏙️', Place: '📍', Pool: '🏊', Pin: '📌' };
  function runSearch() {
    searchResults.textContent = '';
    const q = searchInput.value.trim();
    if (!mapCtrl || q.length < 2) return;
    const matches = mapCtrl.search(q);
    if (!matches.length) { searchResults.append(h('p', { class: 'muted', style: 'padding: var(--sp-1h) var(--sp-1);font-size:13px' }, 'No matches in the offline data.')); return; }
    matches.forEach((m) => searchResults.append(
      h('button', { class: 'btn ghost block btn-spaced', style: 'justify-content:flex-start', onclick: () => {
        mapCtrl.flyTo(m.lng, m.lat, m.z);
        searchResults.textContent = ''; searchInput.value = '';
      } }, `${SEARCH_ICON[m.type] || '•'}  ${m.name}  ·  ${m.type}`)));
  }
  const searchInput = h('input', { type: 'search', class: 'map-search', placeholder: 'Search any city or place, in any country…', 'aria-label': 'Search the map', autocomplete: 'off', oninput: runSearch });

  const toolsCard = h('div', {}, [
    h('div', { style: 'display:flex;flex-wrap:wrap;align-items:center;gap: var(--sp-3)' }, [
      h('div', { class: 'chips', style: 'margin:0' }, [mapBtn, satBtn]),
      measureBtn,
      wakeBtn,
      h('button', { class: 'btn ghost', onclick: () => { if (mapCtrl) mapCtrl.triggerLocate(); } }, '📍 Locate me'),
    ]),
    measureOut,
    // Ferry popups read this setting each time one opens, so nothing needs redrawing.
    h('div', { style: 'margin-top: var(--sp-2)' }, pricesInPicker()),
  ]);
  // Layers first and always visible; the occasional tools stay behind the fold.
  wrap.append(h('div', { class: 'chips mk-layer-toggles', role: 'group', 'aria-label': 'Map layers' }, layerChips));
  wrap.append(foldedCard('🛠 Map & tools', toolsCard, 'mapToolsOpen', true));

  // ---- Offline walking directions ---------------------------------------------------
  // Routed on-device from a pedestrian graph (js/walk-route.js). The card itself now lives in
  // js/walk-ui.js because Places' map offers the identical control — see that module's note.
  const walk = buildWalkCard(() => mapCtrl);
  wrap.append(walk.card);
  wrap.append(h('div', { class: 'map-search-wrap', style: 'margin: var(--sp-2) 0 var(--sp-0h)' }, [searchInput, searchResults]));

  const mapSection = h('div', { class: 'places-map-section' });
  const canvas = h('div', { class: 'places-map' });
  mapSection.append(canvas);
  wrap.append(mapSection);

  const areasUI = buildOfflineAreasCard(() => mapCtrl, { title: '🗂️ Saved offline areas', key: 'mapAreasOpen' });
  wrap.append(areasUI.card);

  mount(wrap, '#map');

  import('../map.js').then((m) => m.initMap(canvas, {
    onLocate: (fix) => setLastFix(fix),
    // Only consumed while the walking card is actively waiting for a destination, so a normal
    // tap on the map keeps its existing meaning.
    onMapClick: (pt) => walk.handleMapClick(pt),
  })).then((c) => {
    mapCtrl = c;
    const prevCleanup = getLiveCleanup();
    setLiveCleanup(() => {
      try { if (prevCleanup) prevCleanup(); } catch { /* noop */ }
      try { c.dispose(); } catch { /* noop */ }
      wantWake = false;
      document.removeEventListener('visibilitychange', onVis);
      if (wakeLock) { try { wakeLock.release(); } catch { /* noop */ } wakeLock = null; }
    });
    // Full mode leaves the style's own default alone at construction (see map.js) — apply the
    // traveller's real persisted layer prefs now that the controller exists.
    c.setSatellite(satOn);
    c.setBorders(mapLayersPrefs.borders !== false);
    if (mapLayersPrefs.hospitals === true) c.setHospitals(true);
    if (mapLayersPrefs.atms === true) c.setAtms(true);
    if (mapLayersPrefs.buses === true) c.setBus(true);
    if (mapLayersPrefs.ferries === true) c.setFerries(true);
    if (mapLayersPrefs.trails === true) c.setTrails(true);
    if (mapLayersPrefs.bike === true) c.setBike(true);
    if (mapLayersPrefs.scenic === true) c.setScenic(true);
    areasUI.refresh();
  }).catch(() => {
    canvas.replaceWith(h('p', { class: 'muted', style: 'padding: var(--sp-3) var(--sp-3)' }, 'The map could not start here.'));
  });
}
